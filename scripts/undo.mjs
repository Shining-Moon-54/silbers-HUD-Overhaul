/** Silber HUD – begrenzte gemeinsame Rückgängig-Historie, Foundry v14.
 * Der auslösende Client kennt per preUpdate den Vorzustand. Nach erfolgreichem
 * update wird nur ein begrenzter Satz spielrelevanter geänderter Felder an das
 * aktive GM-HUD gemeldet. Spielleiter können diese Schritte rückwärts ausführen.
 */
const MODULE_ID = 'silber-hud-overhaul';
const SOCKET = `module.${MODULE_ID}`;
const KEEP = 60;
const pending = new Map();
let entries = [];
let busy = false;
let ready = false;
let subscribers = new Set();
let saveTimer = null;
// Verzögerte Speicherung: Mehrere Änderungen einer Aktion lösen nur einen
// localStorage-Schreibvorgang aus. Vor Seitenwechsel wird synchron gesichert.

const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const eq = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function at(root, path) { return path.split('.').reduce((v,k) => v?.[k], root); }
function leaves(object, prefix = '', result = []) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) { if (prefix) result.push(prefix); return result; }
  for (const [k,v] of Object.entries(object)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, next, result);
    else result.push(next);
  }
  return result;
}
const allow = {
  Actor: p => /^system\.(?:attributes\.|spells\.|resources\.)/.test(p),
  Token: p => /^(?:x|y|rotation|elevation|hidden|sort)$/.test(p) || /^delta\.system\.(?:attributes\.|spells\.|resources\.)/.test(p),
  Item: p => /^system\.(?:uses\.|quantity$|equipped$|attunement$|preparation\.|consume\.)/.test(p),
  ActiveEffect: p => /^(?:disabled|statuses|duration\.)/.test(p),
  Combat: p => /^(?:round|turn|active)$/.test(p),
  Combatant: p => /^(?:initiative|defeated|hidden)$/.test(p)
};
const names = {Actor:'Figur', Token:'Token', Item:'Gegenstand', ActiveEffect:'Effekt', Combat:'Kampf', Combatant:'Kampfteilnehmer', MeasuredTemplate:'Schablone', ChatMessage:'Wurf'};
const storageKey = () => `shud-undo-v1-${game.world?.id || 'world'}-${game.user?.id || 'gm'}`;
function announce() { for (const fn of subscribers) { try { fn(entries); } catch (e) { console.warn('[SHUD undo] Anzeige',e); } } }
function saveNow() {
  if (!game.user?.isGM) return;
  if (saveTimer !== null) { clearTimeout(saveTimer); saveTimer = null; }
  try { localStorage.setItem(storageKey(),JSON.stringify(entries)); }
  catch (e) { console.warn('[SHUD undo] History konnte nicht gespeichert werden',e); }
}
function save() {
  if (!game.user?.isGM) return;
  if (saveTimer === null) saveTimer = setTimeout(saveNow, 250);
}
// Foundry speichert normalisierte Dokument-Quelldaten in _source. Dadurch
// müssen wir für ein einzelnes HP- oder Positionsfeld nicht den gesamten
// Charakter mit hunderten Gegenständen zuObject() klonen.
function sourceValue(doc,path) {
  const value = at(doc?._source,path);
  return value === undefined ? at(doc.toObject(),path) : value;
}
function read() {
  if (!game.user?.isGM) return;
  try { const raw = JSON.parse(localStorage.getItem(storageKey()) || '[]'); entries = Array.isArray(raw) ? raw.slice(0,KEEP) : []; }
  catch { entries = []; }
}
const stamp = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
function push(entry) {
  if (!game.user?.isGM || !entry || !['update','create','delete'].includes(entry.kind)) return;
  if (entries.some(e => e.id === entry.id)) return;
  // Behalte nur Einträge aus dieser Spielsitzung/Welt.
  entries.unshift(entry); entries = entries.slice(0,KEEP);
  save(); announce();
}
function post(entry) {
  if (game.user?.isGM) push(entry);
  else game.socket?.emit(SOCKET,{type:'undo-record',entry});
}
function key(kind,doc) {return `${kind}:${doc.uuid}`;}
function remember(kind,doc,changed,options,userId) {
  if (options?.silberHudUndo || userId !== game.user?.id) return;
  const tracked = [...new Set(leaves(changed).filter(allow[kind]))];
  if (!tracked.length) return;
  const store = pending.get(key(kind,doc)) || [];
  const before = tracked.map(path => ({path,value:clone(sourceValue(doc,path))}))
    .filter(field => field.value !== undefined);
  if (!before.length) return;
  store.push({before,userId});
  if (store.length > 16) store.shift();
  pending.set(key(kind,doc),store);
}
function finish(kind,doc,changed,options,userId) {
  if (options?.silberHudUndo || userId !== game.user?.id) return;
  const stack = pending.get(key(kind,doc));
  const saved = stack?.shift();
  if (!stack?.length) pending.delete(key(kind,doc));
  if (!saved) return;
  const diffs = saved.before.map(({path,value:before}) => {
    const current = sourceValue(doc,path);
    if (current === undefined || eq(before,current)) return null;
    return {path,before,after:clone(current)};
  }).filter(Boolean);
  if (!diffs.length) return;
  post({id:stamp(),kind:'update',docType:kind,uuid:doc.uuid,
    label:doc.parent?.name ? `${doc.parent.name} · ${doc.name || names[kind]}` : doc.name || names[kind],
    who:game.user?.name || 'Unbekannt', userId, at:Date.now(), diffs});
}
const createdKinds = ['ActiveEffect','MeasuredTemplate','Token'];
// Beim Löschen den kompletten Datensatz nur für rekonstruierbare Dokumenttypen sichern.
const deletePending = new Map();
function beforeDelete(kind,doc,options,userId) {
  if (options?.silberHudUndo || userId !== game.user?.id) return;
  const snapshot = doc.toObject();
  deletePending.set(key(kind,doc), {snapshot,parentUuid:doc.parent?.uuid, docId:doc.id});
}
function afterDelete(kind,doc,options,userId) {
  if (options?.silberHudUndo || userId !== game.user?.id) return;
  const data = deletePending.get(key(kind,doc)); deletePending.delete(key(kind,doc));
  if (!data?.parentUuid) return;
  post({id:stamp(),kind:'delete',docType:kind,uuid:doc.uuid,
    label:doc.name || names[kind],who:game.user.name,userId,at:Date.now(),
    parentUuid:data.parentUuid,source:data.snapshot,docId:data.docId});
}
function afterCreate(kind,doc,options,userId) {
  if (options?.silberHudUndo || userId !== game.user?.id) return;
  post({id:stamp(),kind:'create',docType:kind,uuid:doc.uuid,
    label:doc.name || names[kind],who:game.user.name,userId,at:Date.now()});
}
function afterRoll(message,options,userId) {
  if (options?.silberHudUndo || userId !== game.user?.id) return;
  if (!(message.rolls?.length || message.isRoll)) return;
  post({id:stamp(),kind:'create',docType:'ChatMessage',uuid:message.uuid,
    label:'Würfelwurf',who:game.user.name,userId,at:Date.now()});
}
function onSocket(data) {
  if (!game.user?.isGM || data?.type !== 'undo-record') return;
  const entry = data.entry;
  if (!entry || !entry.userId || entry.userId === game.user.id) return;
  const sourceUser = game.users?.get(entry.userId);
  if (!sourceUser || sourceUser.isGM) return; // Ein GM erzeugt seine eigenen Einträge lokal.
  if (!['Actor','Token','Item','ActiveEffect','Combat','Combatant','MeasuredTemplate','ChatMessage'].includes(entry.docType)) return;
  // Die empfangenen Undo-Daten stammen von einem anderen Client und dürfen
  // keine beliebigen Dokumentfelder auf einem GM-Schreibzugriff ändern.
  if (entry.kind === 'update' && (!Array.isArray(entry.diffs) || entry.diffs.length > 48 ||
      !entry.diffs.every(d => typeof d.path === 'string' && d.before !== undefined && d.after !== undefined && allow[entry.docType]?.(d.path)))) return;
  if ((entry.kind === 'create' && ![...createdKinds,'ChatMessage'].includes(entry.docType)) ||
      (entry.kind === 'delete' && !createdKinds.includes(entry.docType))) return;
  if (JSON.stringify(entry).length > 40000) return;
  entry.who = sourceUser.name || 'Spieler';
  push(entry);
}
export function registerUndoTracker() {
  if (ready) return;
  ready = true;
  read();
  game.socket?.on(SOCKET,onSocket);
  if (game.user?.isGM && typeof window !== 'undefined') window.addEventListener('pagehide',saveNow);
  for (const kind of Object.keys(allow)) {
    Hooks.on(`preUpdate${kind}`,(doc,changed,options,uid) => remember(kind,doc,changed,options,uid));
    Hooks.on(`update${kind}`,(doc,changed,options,uid) => finish(kind,doc,changed,options,uid));
  }
  for (const kind of createdKinds) {
    Hooks.on(`create${kind}`,(doc,options,uid) => afterCreate(kind,doc,options,uid));
    Hooks.on(`preDelete${kind}`,(doc,options,uid) => beforeDelete(kind,doc,options,uid));
    Hooks.on(`delete${kind}`,(doc,options,uid) => afterDelete(kind,doc,options,uid));
  }
  Hooks.on('createChatMessage',afterRoll);
  announce();
}
export function getUndoHistory() { return entries.slice(); }
export function discardLatestUndo() {
  if (!game.user?.isGM || !entries.length) return false;
  entries.shift(); save(); announce(); return true;
}
export function subscribeUndo(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }
export function undoBusy() {return busy;}
export async function undoLastStep() {
  if (!game.user?.isGM) throw Error('Nur Spielleiter können Aktionen rückgängig machen.');
  if (busy) return false;
  const entry = entries[0];
  if (!entry) { ui.notifications?.info('Keine aufgezeichnete Aktion vorhanden.'); return false; }
  busy = true;
  try {
    if (entry.kind === 'update') {
      const doc = await fromUuid(entry.uuid);
      if (!doc) throw Error('Das ursprüngliche Dokument existiert nicht mehr.');
      if (!entry.diffs.every(d => eq(sourceValue(doc,d.path),d.after))) {
        throw Error('Der Zustand hat sich seither verändert. Diese Aktion lässt sich nicht gefahrlos zurücksetzen.');
      }
      const revert = Object.fromEntries(entry.diffs.map(d => [d.path,clone(d.before)]));
      await doc.update(revert,{silberHudUndo:true});
    } else if (entry.kind === 'create') {
      const doc = await fromUuid(entry.uuid);
      if (!doc) throw Error('Das erzeugte Dokument existiert nicht mehr.');
      await doc.delete({silberHudUndo:true});
    } else if (entry.kind === 'delete') {
      const parent = await fromUuid(entry.parentUuid);
      if (!parent || !parent.createEmbeddedDocuments) throw Error('Das übergeordnete Dokument existiert nicht mehr.');
      if (parent.getEmbeddedCollection?.(entry.docType)?.get(entry.docId)) throw Error('Die ursprüngliche Dokument-ID ist bereits wieder vorhanden.');
      await parent.createEmbeddedDocuments(entry.docType,[entry.source],{keepId:true,silberHudUndo:true});
    }
    entries.shift(); save(); announce();
    ui.notifications?.info(`Rückgängig: ${entry.label} (${entry.who})`);
    return true;
  } catch (error) {
    ui.notifications?.warn(`Rückgängig nicht möglich: ${error.message}`);
    console.warn('[SHUD undo] Revert fehlgeschlagen',error,entry);
    return false;
  } finally { busy = false; }
}
