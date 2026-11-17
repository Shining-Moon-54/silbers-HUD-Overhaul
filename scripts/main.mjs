import { registerUndoTracker, getUndoHistory, subscribeUndo, undoLastStep, discardLatestUndo } from "./undo.mjs";
/** Silber HUD Overhaul 0.4.4 - Foundry VTT 14 / dnd5e 6.x, performance update. */
const MOD = "silber-hud-overhaul";
const ROOT_ID = "shud-root";
const tabs = ["actions", "spells", "features", "inventory", "details"];
const state = { root: null, actorId: null, actorTokenId: null, tab: "spells", menu: null, filter: "", chatPopout: null,
  panels: { chat: true, party: true, actors: false, character: true }, refreshTimer: null,
  actorFilter: "", chatScrollTimer: null, chatScrollObserver: null,
  composing: false, rollModifier: 0, railOpen: null, railMore: false, submitting: false,
  chatMountPromise: null, chatFallbackRendering: false, chatDebugVisible: false,
  enterSeen: {keydown: 0, keyup: 0, keybind: 0}, suppressEnterKeyup: false, lastEnterInfo: "Noch kein Enter erkannt",
  trackerCollapsed: false, trackerObserver: null, expandedEntry: null };

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));
const img = value => escapeHtml(value || "icons/svg/mystery-man.svg");
const iconPaths = {
  "dice-d20": "<path d='M12 2 3 7v10l9 5 9-5V7L12 2Z'/><path d='m3 7 9 5 9-5M12 12v10M12 2v10' />",
  "shield-halved": "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'/><path d='M12 2v20' />",
  "shield": "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' />",
  "chevron-down": "<path d='m6 9 6 6 6-6' />",
  "chevron-right": "<path d='m9 6 6 6-6 6' />",
  "angles-left": "<path d='m11 17-5-5 5-5M18 17l-5-5 5-5' />",
  "angles-right": "<path d='m6 7 5 5-5 5m-5-10 5 5-5 5' />",
  "book-open": "<path d='M12 7a8 8 0 0 0-9-2v14a8 8 0 0 1 9 2 8 8 0 0 1 9-2V5a8 8 0 0 0-9 2Z'/><path d='M12 7v14' />",
  "sliders": "<path d='M4 7h16M4 17h16M9 4v6m6 4v6' />",
  "users": "<circle cx='9' cy='8' r='3'/><path d='M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1' />",
  "user": "<circle cx='12' cy='7.5' r='3.5'/><path d='M5 21v-2a7 7 0 0 1 14 0v2' />",
  "user-shield": "<circle cx='10' cy='7' r='3'/><path d='M3 19v-2a7 7 0 0 1 9-6M18 13l4 1.5v3c0 2.5-4 4.5-4 4.5s-4-2-4-4.5v-3l4-1.5Z' />",
  "comments": "<path d='M4 4h16v12H8l-4 4V4ZM7 8h10M7 12h7' />",
  "bars": "<path d='M4 6h16M4 12h16M4 18h16' />",
  "list-ol": "<path d='M9 6h12M9 12h12M9 18h12M4 6h1v4M3 16h3l-3 3h3' />",
  "caret-left": "<path d='m15 6-6 6 6 6' />",
  "forward-step": "<path d='m4 5 9 7-9 7V5ZM17 5v14' />",
  "map": "<path d='M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15m6-12v15' />",
  "box-open": "<path d='m3 8 9 4 9-4-9-4-9 4ZM3 8v9l9 4 9-4V8M12 12v9' />",
  "books": "<path d='M5 3h4v18H5zM10 4h4v17h-4zM15 6h4v15h-4z' />",
  "gear": "<circle cx='12' cy='12' r='3'/><path d='M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2' />",
  "sun": "<circle cx='12' cy='12' r='4'/><path d='M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4' />",
  "lightbulb": "<path d='M9 18h6m-6 3h6M9 15c0-2-4-3.6-4-8a7 7 0 0 1 14 0c0 4.4-4 6-4 8v1H9v-1Z' />",
  "more-horizontal": "<circle cx='5' cy='12' r='1'/><circle cx='12' cy='12' r='1'/><circle cx='19' cy='12' r='1' />",
  "clapperboard": "<path d='M3 8h18v13H3zM3 8l-1-4 18-3 1 5M7 8l4-5M14 8l4-5' />",
  "folder-open": "<path d='M3 6h7l2 2h9v11H3V6Zm0 6h18l-2 7H3' />",
  "circle-info": "<circle cx='12' cy='12' r='9'/><path d='M12 11v6m0-10v1' />",
  "shoe-prints": "<path d='M7 3h5v8l4 4h3v5H4v-4l3-5V3Zm9 2 4 3v4' />",
  "heart": "<path d='M20.8 8.6c0-5.5-6.5-6.7-8.8-2.5-2.3-4.2-8.8-3-8.8 2.5 0 4 3.8 7 8.8 11 5-4 8.8-7 8.8-11Z' />",
  "bolt": "<path d='m13 2-9 12h7l-1 8 10-12h-7l1-8Z' />",
  "wand-magic-sparkles": "<path d='m4 20 11-11 3 3L7 23M14 3v4M12 5h4M20 14v6m-3-3h6' />",
  "wand-sparkles": "<path d='M4 20 18 6l-3-3L1 17l3 3ZM18 13h4m-2-2v4M10 2v4M8 4h4' />",
  "hand-fist": "<path d='M4 13v-2a2 2 0 0 1 4 0V7a2 2 0 0 1 4 0V5a2 2 0 0 1 4 0v3a2 2 0 0 1 4 0v7l-4 6H8l-4-5v-3Z' />",
  "briefcase": "<rect x='3' y='7' width='18' height='14' rx='2'/><path d='M9 7V4h6v3M3 13h18M11 12v3h2v-3' />",
  "file-lines": "<path d='M6 2h9l4 4v16H6V2Zm9 0v5h4M9 12h7M9 16h7' />",
  "magnifying-glass": "<circle cx='10' cy='10' r='6'/><path d='m14.5 14.5 6 6' />",
  "burst": "<path d='m12 2 2.6 6.4L21 6l-2.4 6 3.4 6-7.1-1.2L12 23l-2.9-6.2L2 18l3.4-6L3 6l6.4 2.4L12 2Z' />",
  "up-right-from-square": "<path d='M13 4h7v7M20 4l-11 11M19 14v6H4V5h7' />",
  "play": "<path d='m8 5 11 7-11 7V5Z' />",
  "trash": "<path d='M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7m4-7v7' />",
  "keyboard": "<rect x='2' y='5' width='20' height='14' rx='2'/><path d='M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M6 16h12' />",
  "paper-plane": "<path d='m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2' />",
  "xmark": "<path d='M5 5l14 14M19 5 5 19' />",
  "screwdriver-wrench": "<path d='M4 20 15 9M13 5l6-3 3 3-3 6-3-3M3 16l5 5M5 13l5 5' />",
  "ruler": "<path d='M3 18 18 3l3 3L6 21l-3-3Zm7-7 2 2m1-5 2 2m-8 4 2 2' />",
  "paintbrush": "<path d='M14 3 21 10 11 20a5 5 0 0 1-7 1 5 5 0 0 0 1-7L14 3Z' />",
  "layers": "<path d='m12 2 10 6-10 6L2 8l10-6Zm10 11-10 6L2 13m20 5-10 5L2 18' />",
  "music": "<path d='M9 18V4l11-2v13M9 18c0 3-6 4-6 1s6-4 6-1Zm11-3c0 3-6 4-6 1s6-4 6-1Z' />",
  "target": "<circle cx='12' cy='12' r='9'/><circle cx='12' cy='12' r='4'/><path d='M12 1v5m0 12v5M1 12h5m12 0h5' />",
  "crosshairs": "<circle cx='12' cy='12' r='8'/><path d='M12 2v7m0 6v7M2 12h7m6 0h7' />",
  "mouse-pointer": "<path d='m5 3 13 9-7 1-3 7-3-17Z' />",
  "brick-wall": "<path d='M2 4h20v16H2V4Zm0 5h20M2 15h20M7 4v5m10 0v6m-10 0v5m10-5v5' />",
  "cloud": "<path d='M7 18h12a4 4 0 0 0 0-8 7 7 0 0 0-13.5 1A4 4 0 0 0 7 18Z' />",
  "undo-2": "<path d='M3 7v6h6M3 13a9 9 0 1 1 3.2 6.9' />",
  "sparkles": "<path d='m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2ZM20 18v5m-2.5-2.5h5' />"
};
const icon = name => `<svg class="shud-svg-icon shud-ico-${escapeHtml(name)}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths["sparkles"]}</svg>`;
const hasAccess = (actor, level = "OBSERVER") => Boolean(actor && (game.user.isGM || actor.testUserPermission(game.user, level)));
const owned = actor => hasAccess(actor, "OWNER");

Hooks.once("init", () => {
  game.settings.register(MOD, "enabled", {
    name: "SHUD.Enabled", hint: "SHUD.EnabledHint", scope: "client", config: true,
    type: Boolean, default: true, onChange: () => window.location.reload()
  });
  game.settings.register(MOD, "initiativeEnabled", {
    name: "Integrierten Initiative-Tracker anzeigen",
    hint: "Ausblenden, falls du den separaten Carousel Combat Tracker weiterverwenden möchtest.",
    scope: "client", config: true, type: Boolean, default: true,
    onChange: () => refreshInitiativeTrack()
  });
  // Foundry v14 keyboard management can intercept Enter before it reaches document.
  // Register with the official keybinding API as well as the capture fallback below.
  game.keybindings?.register?.(MOD, "openHUDChat", {
    name: "HUD-Chat öffnen (Enter)",
    hint: "Öffnet das Chat-Eingabefeld während der Spielsitzung, wenn kein anderes Eingabefeld aktiv ist.",
    editable: [{key: "Enter", modifiers: []}, {key: "NumpadEnter", modifiers: []}],
    precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
    onDown: context => onGlobalKeydown(context?.event || context, "keybind"),
    restricted: false
  });
});
Hooks.once("ready", async () => {
  registerUndoTracker();
  if (!game.settings.get(MOD, "enabled")) return;
  if (game.system.id !== "dnd5e") ui.notifications.warn("Silber HUD: Zauberaktionen erfordern das System D&D 5e. Die Oberfläche bleibt nutzbar.");
  try {
    loadState();
    createHUD();
    if (game.user.isGM) subscribeUndo(() => { refreshUndoButton(); if (state.menu === "undo") { const popup = state.root?.querySelector("#shud-menu-popup"); if (popup) popup.innerHTML = menuHTML("undo"); } });
    refreshUndoButton();
    document.body.classList.add("shud-active");
    document.body.classList.toggle("shud-gm", Boolean(game.user.isGM));
    markNativeSceneControls();
    // Use Foundry's own chat application: this keeps actual chat-cards, chat commands and D&D5e roll handlers.
    await mountNativeChat();
    registerRefreshHooks();
    refreshEverything();
    // Track the available map width between the independent chat and character docks.
    if (typeof ResizeObserver === "function") {
      state.trackerObserver = new ResizeObserver(() => updateInitiativePosition());
      for (const id of ["shud-left-dock", "shud-right-dock"]) {
        const dock = state.root?.querySelector(`#${id}`);
        if (dock) state.trackerObserver.observe(dock);
      }
    }
    window.addEventListener("resize", updateInitiativePosition);
    updateInitiativePosition();
  } catch (error) {
    console.error(`[${MOD}] initialization error`, error);
    document.body.classList.remove("shud-active");
    ui.notifications.error("Silber HUD konnte nicht vollständig gestartet werden. Details in der Browserkonsole.");
  }
});

/** Foundry v14 renders SceneControls as an ApplicationV2, not just #controls.
 *  Hide only its visible element; do not disable the layer or tool APIs.
 *  Called on initial setup and after each re-render. */
function markNativeSceneControls() {
  try {
    const element = ui.controls?.element;
    if (element instanceof HTMLElement && !state.root?.contains(element)) {
      element.classList.add("shud-native-scene-controls");
    }
  } catch (error) { console.debug(`[${MOD}] Native controls element unavailable`, error); }
}

function storageKey() { return `shud-v1-${game.world?.id || "world"}-${game.user?.id || "user"}`; }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) || "{}");
    for (const p of Object.keys(state.panels)) if (typeof saved[p] === "boolean") state.panels[p] = saved[p];
    if (tabs.includes(saved.tab)) state.tab = saved.tab;
    if (typeof saved.trackerCollapsed === "boolean") state.trackerCollapsed = saved.trackerCollapsed;
    // Gruppe und Akteure teilen dieselbe Fläche links der Steuerleiste.
    if (state.panels.actors && state.panels.party) state.panels.party = false;
  } catch (err) { console.debug(`[${MOD}] Panel state reset`, err); }
}
function saveState() {
  try { localStorage.setItem(storageKey(), JSON.stringify({ ...state.panels, tab: state.tab, trackerCollapsed: state.trackerCollapsed })); }
  catch (err) { console.debug(`[${MOD}] State not saved`, err); }
}
function createHUD() {
  document.getElementById(ROOT_ID)?.remove();
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.innerHTML = `
    <header class="shud-topbar" aria-label="HUD Hauptmenü">
      <div class="shud-sigil" title="Silber HUD">${icon("dice-d20")}</div>
      <nav class="shud-menus" aria-label="Verzeichnisse">
        <button type="button" data-menu="combat" title="Kampfübersicht">${icon("shield-halved")}<span>Kampf</span>${icon("chevron-down")}</button>
        <button type="button" data-menu="dice" title="Schnellwürfe">${icon("dice-d20")}<span>Würfel</span>${icon("chevron-down")}</button>
        <button type="button" data-menu="journal" title="Spielnotizen und Handouts">${icon("book-open")}<span>Journal</span>${icon("chevron-down")}</button>
        ${game.user.isGM ? `<button type="button" data-menu="gm" title="Spielleiter-Verwaltung">${icon("sliders")}<span>SL-Werkzeuge</span>${icon("chevron-down")}</button>` : ""}
      </nav>
      <div class="shud-top-right">
        <div id="shud-combat-pill" class="shud-combat-pill" aria-live="polite"></div>
        ${game.user.isGM ? `<div class="shud-undo-controls"><button type="button" data-action="undo-last" class="shud-undo-btn" title="Letzte aufgezeichnete Änderung rückgängig machen" aria-label="Letzte Änderung rückgängig machen">${icon("undo-2")}</button><button type="button" class="shud-undo-history" data-menu="undo" title="Rückgängig-Verlauf anzeigen" aria-label="Rückgängig-Verlauf anzeigen">${icon("chevron-down")}</button></div>` : ""}
        <button type="button" title="Chat umschalten" aria-label="Chat umschalten" data-toggle="chat">${icon("comments")}</button>
        <button type="button" class="shud-core-settings" title="Foundry-Einstellungen öffnen (inklusive Module verwalten)" aria-label="Foundry-Einstellungen und Modulverwaltung öffnen" data-action="foundry-settings">${icon("gear")}</button>
        <button type="button" title="Foundry Standard-Seitenleiste ein-/ausblenden" aria-label="Standard-Seitenleiste umschalten" data-action="native-sidebar">${icon("bars")}</button>
      </div>
    </header>
    <section id="shud-initiative" class="shud-initiative" aria-label="Initiativereihenfolge" hidden>
      <div class="shud-initiative-frame" id="shud-initiative-frame"></div>
    </section>
    <div class="shud-menu-popup" id="shud-menu-popup" hidden></div>
    <aside class="shud-left-dock" id="shud-left-dock" aria-label="Chat und Kartenwerkzeuge">
      <section class="shud-panel shud-chat" data-panel="chat" aria-label="Chat">
      <div class="shud-panel-header"><strong>${icon("comments")} Chat</strong><div class="shud-chat-header-actions">${game.user.isGM ? `<button type="button" data-action="chat-clear" class="shud-trash" title="Gesamten Chat leeren (mit Bestätigung)" aria-label="Gesamten Chat leeren">${icon("trash")}</button>` : ""}<button type="button" data-toggle="chat" title="Chat einklappen" aria-label="Chat einklappen">${icon("angles-left")}</button></div></div>
      <div class="shud-panel-body"><div id="shud-chat-mount"></div><div id="shud-chat-fallback" hidden><div class="shud-chat-fallback-heading">Chatverlauf <button type="button" data-action="native-chat">Original-Chat öffnen</button></div><div id="shud-chat-fallback-log" aria-live="polite"></div></div></div>
      <div class="shud-chat-bottom">
        <div class="shud-chat-tray" aria-label="Dice Tray">
          ${[4, 6, 8, 10, 12, 20, 100].map(n => `<button type="button" data-die="${n}" title="W${n} würfeln">${n === 100 ? 'W%' : `W${n}`}</button>`).join('')}
          <span class="shud-tray-gap"></span>
          <button type="button" data-mod="-1" aria-label="Würfelmodifikator senken">−</button>
          <output id="shud-modifier" title="Wurfmodifikator">+0</output>
          <button type="button" data-mod="1" aria-label="Würfelmodifikator erhöhen">+</button>
        </div>
        <div class="shud-compose-hint"><button type="button" data-action="chat-compose" title="Chat-Eingabe öffnen (Enter)">${icon("keyboard")} <span><kbd>Enter</kbd> oder Klick zum Schreiben</span></button><button type="button" data-action="chat-debug" class="shud-chat-debug-toggle" title="Enter-Tastenprüfung anzeigen" aria-label="Enter-Tastenprüfung anzeigen">?</button></div>
        <div class="shud-chat-debug" hidden aria-live="polite"><b>Tastaturprüfung</b><div id="shud-chat-debug-status"></div><small>Drücke Enter bei geöffneter Karte. Wenn beide Zähler 0 bleiben, erreicht die Taste unser HUD nicht.</small></div>
        <div class="shud-chat-compose" hidden>
          <textarea id="shud-message-input" rows="2" placeholder="Nachricht oder /roll …" aria-label="Chatnachricht"></textarea>
          <div class="shud-compose-actions"><small>Enter senden · Shift+Enter Zeilenumbruch · Esc schließen</small>
            <button type="button" data-action="send-chat" title="Nachricht senden">${icon("paper-plane")}</button>
            <button type="button" data-action="cancel-chat" title="Schließen">${icon("xmark")}</button>
          </div>
        </div>
      </div>
      </section>
      <aside class="shud-toolrail" id="shud-toolrail" aria-label="Kartenwerkzeuge"></aside>
      <div class="shud-toolpalette" id="shud-toolpalette" hidden></div>
      <div class="shud-toolmore" id="shud-toolmore" hidden aria-label="Weitere Kartenwerkzeuge"></div>
    </aside>
    <aside class="shud-right-dock" id="shud-right-dock" aria-label="Rechtes HUD-Dock">
      <section class="shud-panel shud-actors is-collapsed" data-panel="actors" aria-label="Akteursverzeichnis">
        <div class="shud-panel-header"><strong>${icon("users")} <span>Akteure</span></strong></div>
        <div class="shud-panel-body" id="shud-actors-body"></div>
      </section>
      <section class="shud-panel shud-party" data-panel="party" aria-label="Gruppe">
        <div class="shud-panel-header"><strong>${icon("users")} <span>Gruppe</span></strong></div>
        <div class="shud-panel-body" id="shud-party-body"></div>
      </section>
      <div class="shud-dock-rail" aria-label="Dock-Steuerung">
        <button type="button" class="shud-dock-toggle" data-toggle="character" data-dock-toggle="character" aria-controls="shud-character-body" aria-label="Charakter öffnen" aria-expanded="false" title="Charakter öffnen">
          ${icon("user-shield")}<span class="shud-dock-arrow">${icon("angles-right")}</span>
        </button>
        <button type="button" class="shud-dock-toggle" data-toggle="party" data-dock-toggle="party" aria-controls="shud-party-body" aria-label="Gruppe öffnen" aria-expanded="false" title="Gruppe öffnen">
          ${icon("users")}<span class="shud-dock-arrow">${icon("angles-left")}</span>
        </button>
        <button type="button" class="shud-dock-toggle" data-toggle="actors" data-dock-toggle="actors" aria-controls="shud-actors-body" aria-label="Akteure öffnen" aria-expanded="false" title="Alle zugänglichen Akteure anzeigen">
          ${icon("books")}<span class="shud-dock-arrow">${icon("angles-left")}</span>
        </button>
        <span class="shud-dock-rail-rule" aria-hidden="true"></span>
        <span class="shud-dock-rail-text" aria-hidden="true">SILBER HUD</span>
      </div>
      <section class="shud-panel shud-character" data-panel="character" aria-label="Charakterbogen">
        <div class="shud-panel-body" id="shud-character-body"></div>
      </section>
    </aside>`;
  document.body.append(root);
  state.root = root;
  root.addEventListener("click", onHUDClick);
  root.addEventListener("input", onHUDInput);
  root.addEventListener("keydown", onComposeKeydown, true);
  // Capture on WINDOW, not document: Foundry/other modules may stop events at
  // window before they can bubble/capture down to document.  The keybinding
  // registration above is a separate fallback in Foundry's keyboard dispatcher.
  window.addEventListener("keydown", onGlobalKeydown, true);
  // In some Foundry/mod combinations the keydown is consumed earlier.  Keyup
  // runs through a separate path and safely opens the composer when possible.
  window.addEventListener("keyup", onGlobalKeyup, true);
  document.addEventListener("pointerdown", ev => {
    if (state.menu && !ev.target.closest("#shud-root .shud-topbar, #shud-menu-popup")) setMenu(null);
  });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && state.menu) setMenu(null); });
  applyPanelStates();
  refreshToolRail();
}
function applyPanelStates() {
  const leftDock = state.root?.querySelector("#shud-left-dock");
  leftDock?.classList.toggle("has-chat", state.panels.chat);
  state.root?.classList.toggle("shud-chat-open", state.panels.chat);
  for (const [name, open] of Object.entries(state.panels)) {
    const panel = state.root?.querySelector(`[data-panel="${name}"]`);
    if (!panel) continue;
    panel.classList.toggle("is-collapsed", !open);
    if (name === "party" || name === "actors" || name === "character") {
      panel.inert = !open;
      panel.setAttribute("aria-hidden", String(!open));
    }
    panel.querySelector(".shud-panel-header > button")?.setAttribute("aria-expanded", String(open));
    const control = panel.querySelector(".shud-panel-header > button");
    if (control) control.innerHTML = icon(open ? (name === "chat" ? "angles-left" : "angles-right") : (name === "chat" ? "angles-right" : "angles-left"));
  }
  const dock = state.root?.querySelector("#shud-right-dock");
  if (dock) {
    dock.classList.toggle("has-character", state.panels.character);
    dock.classList.toggle("has-party", state.panels.party);
    dock.classList.toggle("has-actors", state.panels.actors);
    dock.querySelectorAll("[data-dock-toggle]").forEach(button => {
      const kind = button.dataset.dockToggle;
      const expanded = state.panels[kind];
      const title = `${({party:"Gruppe",actors:"Akteure",character:"Charakter"})[kind]} ${expanded ? "schließen" : "öffnen"}`;
      button.setAttribute("aria-label", title);
      button.setAttribute("title", title);
      button.setAttribute("aria-expanded", String(expanded));
      button.classList.toggle("is-open", expanded);
      const arrow = button.querySelector(".shud-dock-arrow");
      // Die Gruppe öffnet links vom Dock, der Charakter rechts davon.
      // Pfeilrichtung ist entsprechend pro Panel spiegelverkehrt.
      if (arrow) arrow.innerHTML = icon(kind === "character"
        ? (expanded ? "angles-left" : "angles-right")
        : (expanded ? "angles-right" : "angles-left"));
    });
  }
  state.root?.querySelectorAll("[data-toggle]").forEach(btn => btn.setAttribute("aria-pressed", String(state.panels[btn.dataset.toggle])));
  updateInitiativePosition();
}
function setMenu(name) {
  state.menu = state.menu === name ? null : name;
  const popup = state.root?.querySelector("#shud-menu-popup");
  if (!popup) return;
  state.root.querySelectorAll("[data-menu]").forEach(btn => {
    btn.classList.toggle("is-active", state.menu === btn.dataset.menu);
    btn.setAttribute("aria-expanded", String(state.menu === btn.dataset.menu));
  });
  popup.hidden = !state.menu;
  if (state.menu) { popup.innerHTML = menuHTML(state.menu); popup.dataset.menu = state.menu; }
}
function combatRecord() { return game.combat || game.combats?.active || null; }
function menuHTML(name) {
  let title = { combat: "Kampfübersicht", dice: "Schnellwürfe", journal: "Spielnotizen", gm: "SL-Werkzeuge", characters: "Charakter wählen", undo: "Rückgängig-Verlauf" }[name] || "Spielmenü";
  let body = "";
  if (name === "undo") {
    if (!game.user.isGM) return "";
    const history = getUndoHistory().slice(0,10);
    body = `<p class="shud-menu-note">Nur SL · Zuletzt aufgezeichnete Änderungen von Spielern und SL. Rückgängig erfolgt Schritt für Schritt in umgekehrter Reihenfolge. Würfelwürfe sind nicht neu berechenbar.</p>`;
    body += history.map((e,i) => `<div class="shud-undo-history-row"><strong>${i+1}. ${escapeHtml(e.label)}</strong><small>${escapeHtml(e.who)} · ${escapeHtml(({update:"Geändert",create:"Erstellt",delete:"Gelöscht"})[e.kind] || e.kind)}</small></div>`).join("") || `<p class="shud-empty">Noch keine Änderungen aufgezeichnet.</p>`;
    body += `<button type="button" class="shud-dropdown-row shud-dropdown-footer" data-action="undo-last" ${history.length ? "" : "disabled"}>${icon("undo-2")} Letzten Schritt rückgängig machen</button>`;
    if (history.length) body += `<button type="button" class="shud-dropdown-row shud-undo-discard" data-action="undo-discard" title="Nur aus der Historie entfernen; ändert keine Spielfigur">Blockierten Eintrag überspringen (ohne Änderung)</button>`;
  } else if (name === "combat") {
    const combat = combatRecord();
    if (!combat) {
      body = `<div class="shud-empty">Kein aktiver Kampf. Starte einen Kampf über den regulären Kampftracker.</div>`;
    } else {
      const turns = visibleCombatants(combat);
      const current = combat.combatant?.id;
      body = `<p class="shud-combat-round">${icon("shield-halved")} Runde ${escapeHtml(combat.round || "–")} · ${turns.length} sichtbare Beteiligte</p>`;
      body += turns.map(c => `<button class="shud-dropdown-row shud-combat-row ${c.id === current ? "shud-current-turn" : ""}" data-focus-token="${escapeHtml(c.tokenId || "")}" title="Token auf Karte finden">
        <img src="${img((game.user.isGM || owned(c.actor)) ? (c.img || c.token?.texture?.src || c.actor?.img) : c.token?.texture?.src)}" alt=""><span class="shud-combat-name">${escapeHtml(combatDisplayName(c))} ${c.id === current ? icon("caret-left") : ""}</span><span class="shud-initiative">${c.initiative ?? "–"}</span></button>`).join("");
    }
    body += `<button class="shud-dropdown-row shud-dropdown-footer" data-native-tab="combat">${icon("list-ol")} Original-Kampftracker öffnen</button>`;
    if (combat && game.user.isGM) body += `<button class="shud-dropdown-row shud-dropdown-footer" data-action="next-turn">${icon("forward-step")} Nächster Zug (SL)</button>`;
  } else if (name === "dice") {
    body = `<p class="shud-menu-note">Ein Klick erzeugt einen öffentlichen Würfelwurf im Foundry-Chat.</p><div class="shud-dice-grid">
      ${[4,6,8,10,12,20,100].map(n => `<button type="button" data-die="${n}" title="1W${n} würfeln">${icon("dice-d20")} W${n}</button>`).join("")}
      </div><button class="shud-dropdown-row shud-dropdown-footer" data-native-tab="chat">${icon("comments")} Würfelergebnisse im Chat</button>`;
  } else if (name === "gm") {
    if (!game.user.isGM) return "";
    body = `<p class="shud-menu-note">Nur für die Vorbereitung und Spielleitung. Im Spiel bleiben diese Verzeichnisse normalerweise eingeklappt.</p>`;
    const entries = [
      ["scenes", "Szenen verwalten", "map"], ["actors", "Akteure", "users"],
      ["items", "Gegenstände", "box-open"], ["journal", "Journale", "book-open"],
      ["compendium", "Kompendien", "books"], ["settings", "Foundry-Einstellungen und Module verwalten", "gear"]
    ];
    body += `<button class="shud-dropdown-row" data-action="native-controls">${icon("screwdriver-wrench")} Native Foundry-Werkzeugleiste umschalten</button>`;
    body += entries.map(([tab, label, glyph]) => tab === "settings" ?
      `<button class="shud-dropdown-row" data-action="foundry-settings">${icon(glyph)} ${label}</button>` :
      `<button class="shud-dropdown-row" data-native-tab="${tab}">${icon(glyph)} ${label}</button>`).join("");
  } else if (name === "characters") {
    if (!game.user.isGM) return "";
    const currentId = getActor()?.id;
    body = `<p class="shud-menu-note">SL: Figur auswählen; erneuter Linksklick hebt die Auswahl auf.</p>` +
      characterChoices().map(a => `<button type="button" class="shud-dropdown-row ${a.id === currentId ? "is-selected" : ""}" data-actor="${escapeHtml(a.id)}" aria-pressed="${a.id === currentId}" title="${a.id === currentId ? "Auswahl aufheben" : "Figur auswählen"}"><img class="shud-menu-portrait" src="${img(a.img)}" alt=""><span>${escapeHtml(a.name)}</span></button>`).join("");
    if (!characterChoices().length) body += `<div class="shud-empty">Keine Figuren vorhanden.</div>`;
  } else if (name === "journal") {
    const docs = game.journal.filter(j => j.visible).sort((a,b) => a.name.localeCompare(b.name));
    body = docs.slice(0, 30).map(doc => `<button class="shud-dropdown-row" data-open-doc="${escapeHtml(doc.uuid)}">${icon("book-open")}<span>${escapeHtml(doc.name)}</span></button>`).join("") || `<div class="shud-menu-empty">Keine freigegebenen Handouts oder Journale.</div>`;
    body += `<button class="shud-dropdown-row shud-dropdown-footer" data-native-tab="journal">${icon("folder-open")} Alle zugänglichen Journale</button>`;
  }
  return `<h3>${escapeHtml(title)}</h3><div class="shud-menu-list">${body}</div>`;
}
function refreshCombatSummary() {
  const el = state.root?.querySelector("#shud-combat-pill");
  if (!el) return;
  const combat = combatRecord();
  if (!combat || !combat.round) { el.textContent = ""; el.hidden = true; }
  else {
    el.hidden = false;
    const active = combat.combatant;
    const canSee = game.user.isGM || (active && !active.hidden && !active.token?.hidden && active.visible !== false);
    el.textContent = `R${combat.round} · ${canSee ? combatDisplayName(active) : "Kampf"}`;
    el.title = `Kampf – Runde ${combat.round}`;
  }
  if (state.menu === "combat") {
    const popup = state.root.querySelector("#shud-menu-popup");
    if (popup && !popup.hidden) popup.innerHTML = menuHTML("combat");
  }
}
/** Built-in initiative carousel, inspired by the *interaction pattern* of the
 * attached Carousel Combat Tracker. It is independent: no code or assets from
 * that module are copied, and no second module is needed. */
function updateInitiativePosition() {
  const track = state.root?.querySelector("#shud-initiative");
  if (!track || track.hidden) return;
  const viewWidth = window.innerWidth;
  const leftRect = state.root.querySelector("#shud-left-dock")?.getBoundingClientRect();
  const rightRect = state.root.querySelector("#shud-right-dock")?.getBoundingClientRect();
  const left = Math.max(8, Math.ceil((leftRect?.right || 0) + 12));
  const right = Math.max(8, Math.ceil(viewWidth - (rightRect?.left ?? viewWidth) + 12));
  let available = viewWidth - left - right;
  // On small screens two fully expanded side docks leave almost no map visible:
  // keep the carousel in a compact, unobtrusive state instead of covering HUD panels.
  track.style.left = `${left}px`;
  track.style.right = `${right}px`;
  // Don't draw controls on top of an expanded chat or character dock.
  // The persistent Kampf menu in the top bar is the small-screen fallback.
  track.classList.toggle("shud-initiative-no-room", available < 235);
  track.classList.toggle("shud-initiative-tight", available < 390);
}
function combatDisplayName(c) {
  if (!c) return "Kampf";
  const privileged = game.user.isGM || owned(c.actor) || Boolean(c.isOwner);
  const publicName = Number(c.token?.displayName ?? 0) === 50;
  return privileged || publicName ? (c.name || c.token?.name || "Unbekannt") : "Unbekannt";
}
function visibleCombatants(combat) {
  const turns = combat?.turns?.length ? combat.turns : Array.from(combat?.combatants?.contents || []);
  return turns.filter(c => {
    if (game.user.isGM) return true;
    if (c.hidden || c.token?.hidden || c.visible === false) return false;
    return true;
  });
}
function combatPortrait(c, currentId, idx, combat) {
  const isGM = game.user.isGM;
  const canManage = isGM || owned(c.actor) || Boolean(c.isOwner);
  const token = c.token;
  // Do not reveal the actor artwork/name if token nameplate is private.
  const displayName = combatDisplayName(c);
  const portraitSrc = img(isGM || canManage
    ? (c.img || token?.texture?.src || c.actor?.img)
    : (token?.texture?.src || null));
  const ini = Number.isFinite(Number(c.initiative)) && c.initiative !== null ? `${Math.round(Number(c.initiative) * 10) / 10}` : "–";
  const canRoll = c.initiative == null && canManage;
  const hp = c.actor?.system?.attributes?.hp;
  const hpAllowed = (isGM || canManage) && Number.isFinite(Number(hp?.max)) && Number(hp.max) > 0;
  const max = Math.max(1, Number(hp?.max || 1));
  const value = Math.max(0, Number(hp?.value || 0));
  const hpPct = Math.max(0, Math.min(100, value / max * 100));
  const effects = (isGM || canManage) ? Array.from(c.actor?.effects || []).filter(e => e.active !== false && !e.disabled).length : 0;
  const onTurn = c.id === currentId && combat.round > 0;
  const selectedActor = isGM ? getActor() : null;
  const selected = isGM && selectedActor && (state.actorTokenId
    ? state.actorTokenId === c.tokenId
    : selectedActor.id === c.actor?.id);
  const classes = ["shud-initiative-combatant", onTurn ? "is-current" : "", selected ? "is-selected" : "", c.defeated ? "is-defeated" : "", c.hidden ? "is-secret" : ""].filter(Boolean).join(" ");
  const hint = `${displayName} · Initiative ${ini}${hpAllowed ? ` · ${value}/${max} TP` : ""}${c.defeated ? " · Besiegt" : ""}`;
  return `<div class="${classes}" data-turn-index="${idx}">
    <button type="button" class="shud-initiative-portrait" data-initiative-focus="${escapeHtml(c.id)}" ${isGM ? `aria-pressed="${Boolean(selected)}"` : ""} title="${escapeHtml(hint)} – ${isGM ? "Figur auswählen/abwählen und Karte zentrieren" : "Karte zentrieren"} (Umschalt: Charakterbogen)" aria-label="${escapeHtml(hint)}">
      <img src="${portraitSrc}" alt="" loading="lazy" />
      ${onTurn ? `<span class="shud-initiative-now">AM ZUG</span>` : ""}
      ${c.defeated ? `<span class="shud-initiative-skull" aria-label="Besiegt">✕</span>` : ""}
      <span class="shud-initiative-ini" aria-label="Initiative ${ini}">${ini}</span>
      ${hpAllowed ? `<span class="shud-initiative-hp" aria-label="${value} von ${max} Trefferpunkten"><span style="width:${hpPct.toFixed(1)}%"></span></span>` : ""}
      ${effects ? `<span class="shud-initiative-effects" title="${effects} aktive Effekte">${effects}</span>` : ""}
    </button>
    <span class="shud-initiative-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</span>
    ${canRoll ? `<button type="button" class="shud-initiative-roll" data-initiative-action="roll-one" data-combatant-id="${escapeHtml(c.id)}" title="Initiative würfeln">${icon("dice-d20")} Würfeln</button>` : ""}
  </div>`;
}
function refreshInitiativeTrack() {
  const section = state.root?.querySelector("#shud-initiative");
  const mount = state.root?.querySelector("#shud-initiative-frame");
  if (!section || !mount) return;
  if (game.settings.get(MOD, "initiativeEnabled") === false) {
    section.hidden = true;
    mount.replaceChildren();
    return;
  }
  const combat = combatRecord();
  const participants = combat ? visibleCombatants(combat) : [];
  if (!combat || !participants.length) {
    section.hidden = true;
    if (mount.childElementCount) mount.replaceChildren();
    return;
  }
  section.hidden = false;
  section.classList.toggle("is-collapsed", state.trackerCollapsed);
  const current = combat.combatant;
  const round = Math.max(0, Number(combat.round || 0));
  const gm = game.user.isGM;
  const canEndTurn = !gm && round > 0 && current && (owned(current.actor) || Boolean(current.isOwner));
  const title = round ? `Runde ${round}` : "Initiative";
  const actions = gm ? `<div class="shud-initiative-gm">
      ${round ? "" : `<button type="button" data-initiative-action="roll-all" title="Initiative für alle würfeln">${icon("dice-d20")}</button><button type="button" data-initiative-action="roll-npc" title="Initiative für NSC würfeln">${icon("users")}</button>`}
      ${round ? `<button type="button" data-initiative-action="previous" title="Vorheriger Zug">${icon("caret-left")}</button>` : `<button type="button" data-initiative-action="start" title="Kampf beginnen">${icon("play")}</button>`}
    </div>` : "";
  const nextButton = gm && round ? `<button type="button" class="shud-initiative-next" data-initiative-action="next" title="Nächster Zug">${icon("forward-step")}</button>` : "";
  const myEnd = canEndTurn ? `<button type="button" class="shud-initiative-next" data-initiative-action="end-turn" title="Eigenen Zug beenden">Zug fertig ${icon("forward-step")}</button>` : "";
  const items = participants.map((c,i) => combatPortrait(c, current?.id, i, combat)).join("");
  mount.innerHTML = `<div class="shud-initiative-heading">
      <span class="shud-initiative-title">${icon("shield-halved")} <strong>${title}</strong><span class="shud-initiative-total">${participants.length} Figuren</span></span>
      <button type="button" class="shud-initiative-toggle" data-initiative-toggle="1" aria-expanded="${!state.trackerCollapsed}" title="Initiativeleiste ${state.trackerCollapsed ? "öffnen" : "einklappen"}">${icon(state.trackerCollapsed ? "chevron-down" : "angles-left")}</button>
    </div>
    <div class="shud-initiative-body">${actions}<div class="shud-initiative-scroller" aria-label="Zugreihenfolge" tabindex="0">${items}</div>${nextButton}${myEnd}</div>`;
  // Keep active character visible after every turn even with a long initiative list.
  const active = mount.querySelector(".shud-initiative-combatant.is-current");
  if (active && !state.trackerCollapsed) active.scrollIntoView?.({block:"nearest",inline:"nearest",behavior:"instant"});
  updateInitiativePosition();
}
async function onInitiativeAction(button) {
  const combat = combatRecord();
  if (!combat) return;
  const action = button.dataset.initiativeAction;
  const gm = Boolean(game.user.isGM);
  const mine = combat.combatant && (owned(combat.combatant.actor) || Boolean(combat.combatant.isOwner));
  try {
    if (action === "roll-one") {
      const combatant = combat.combatants?.get(button.dataset.combatantId);
      if (!combatant || (!gm && !owned(combatant.actor) && !combatant.isOwner)) return;
      await combat.rollInitiative([combatant.id]);
    } else if (action === "end-turn" && !gm && mine && combat.round > 0) {
      await combat.nextTurn();
    } else if (gm) {
      if (action === "roll-all") await combat.rollAll();
      else if (action === "roll-npc") await combat.rollNPC();
      else if (action === "start") await combat.startCombat();
      else if (action === "previous") await combat.previousTurn();
      else if (action === "next") await combat.nextTurn();
      else return;
    } else return;
    refreshCombatSummary(); refreshInitiativeTrack();
  } catch (error) {
    reportError(error);
    // Allow normal native combat flow as a fallback on systems with differing rights.
    if (action === "end-turn") openNativeTab("combat");
  }
}
function focusCombatPortrait(id, sheet = false) {
  const combat = combatRecord();
  const c = combat?.combatants?.get(id);
  if (!c || (!game.user.isGM && (c.hidden || c.token?.hidden))) return;
  if (sheet) {
    if (hasAccess(c.actor)) c.actor.sheet?.render(true);
    return;
  }
  if (game.user.isGM && c.actor) {
    // Combat portrait left-click doubles as the same toggle used in the party list.
    // Token-based lookup retains the state of unlinked NPC actors.
    const wasSelected = getActor()?.id === c.actor.id &&
      (!state.actorTokenId || state.actorTokenId === c.tokenId);
    state.actorId = wasSelected ? null : c.actor.id;
    state.actorTokenId = wasSelected ? null : (canvas?.tokens?.get(c.tokenId)?.actor ? c.tokenId : null);
    refreshEverything();
  }
  if (!canvas?.ready || (combat.scene?.id && combat.scene.id !== canvas.scene?.id)) return;
  const token = canvas?.tokens?.get(c.tokenId);
  if (token?.center) canvas.animatePan?.({x: token.center.x, y: token.center.y, duration:350});
}

function openNativeTab(name) {
  // Never replace Foundry's own Settings tab. The full original tab contains
  // Manage Modules, Configure Settings, Users and all other core actions.
  document.body.classList.add("shud-vanilla-sidebar");
  try {
    ui.sidebar?.expand?.();
    ui.sidebar?.changeTab?.(name, "primary", { force: true });
  } catch (error) {
    console.warn(`[${MOD}] Cannot show native sidebar tab ${name}`, error);
    ui.notifications?.warn?.("Foundry-Seitenleiste konnte nicht geöffnet werden. Nutze das Seitenleisten-Symbol im HUD.");
  }
}
async function onHUDClick(event) {
  const button = event.target.closest("button");
  if (!button || !state.root.contains(button)) return;
  // The embedded native chat needs all of its own clicks and event delegation.
  // Don't prevent its roll-card, context-menu, speaker or chat message actions.
  if (button.closest(".shud-embedded-chat")) return;
  if (!button.matches("[data-menu],[data-toggle],[data-die],[data-mod],[data-control-id],[data-control-tool],[data-rail-more],[data-native-tab],[data-open-doc],[data-focus-token],[data-tab],[data-actor],[data-item-sheet],[data-entry-toggle],[data-spell-action],[data-action],[data-initiative-toggle],[data-initiative-action],[data-initiative-focus],[data-view-actor]")) return;
  event.preventDefault();
  event.stopPropagation();
  // Release retained button focus so Enter reopens the composer after UI actions.
  button.blur();
  if (button.hasAttribute("data-initiative-toggle")) {
    state.trackerCollapsed = !state.trackerCollapsed;
    saveState(); refreshInitiativeTrack(); return;
  }
  if (button.dataset.initiativeAction) { await onInitiativeAction(button); return; }
  if (button.dataset.initiativeFocus) { focusCombatPortrait(button.dataset.initiativeFocus, event.shiftKey); return; }
  if (button.dataset.menu) { setMenu(button.dataset.menu); return; }
  if (button.dataset.action === "undo-discard") {
    if (game.user.isGM) discardLatestUndo();
    return;
  }
  if (button.dataset.action === "undo-last") {
    if (game.user.isGM) await undoLastStep();
    refreshUndoButton();
    if (state.menu === "undo") { const popup = state.root?.querySelector("#shud-menu-popup"); if (popup) popup.innerHTML = menuHTML("undo"); }
    return;
  }
  if (button.dataset.toggle) {
    const p = button.dataset.toggle;
    state.panels[p] = !state.panels[p];
    if (p === "actors" && state.panels.actors) state.panels.party = false;
    if (p === "party" && state.panels.party) state.panels.actors = false;
    // Geschlossene Panels werden aus Performancegründen nicht gerendert.
    // Bei erneutem Öffnen immer den aktuellen Zustand aus Foundry laden.
    if (p === "actors" && state.panels.actors) refreshActors();
    if (p === "party" && state.panels.party) refreshParty();
    if (p === "character" && state.panels.character) refreshCharacter();
    if (p === "chat" && !state.panels.chat) closeChatComposer();
    saveState(); applyPanelStates();
    if (p === "chat") {
      state.railOpen = null;
      state.railMore = false;
      refreshToolRail();
      if (state.panels.chat) { void mountNativeChat(); scheduleChatScroll(); }
    }
    return;
  }
  if (button.dataset.mod) {
    state.rollModifier = Math.max(-20, Math.min(20, state.rollModifier + Number(button.dataset.mod)));
    const output = state.root.querySelector("#shud-modifier");
    if (output) output.textContent = state.rollModifier >= 0 ? `+${state.rollModifier}` : String(state.rollModifier);
    return;
  }
  if (button.dataset.die) {
    setMenu(null);
    const sides = Number(button.dataset.die);
    if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) return;
    const mod = state.rollModifier;
    const formula = `1d${sides}${mod > 0 ? `+${mod}` : mod < 0 ? mod : ""}`;
    try {
      await (new Roll(formula)).toMessage({speaker: ChatMessage.getSpeaker({actor: getActor() || undefined}), flavor: `Dice Tray · W${sides}${mod ? ` (${mod > 0 ? "+" : ""}${mod})` : ""}`});
    } catch (err) { reportError(err); }
    return;
  }
  if (button.hasAttribute('data-rail-more')) {
    state.railMore = !state.railMore;
    if (state.railMore) state.railOpen = null;
    refreshToolRail();
    return;
  }
  if (button.dataset.controlId) {
    const selected = button.dataset.controlId;
    // Never bypass SceneControls visibility or privilege rules with the HUD.
    if (!availableControls().some(c => c.name === selected)) return;
    try {
      await ui.controls?.activate?.({control:selected});
      state.railOpen = state.railOpen === selected ? null : selected;
      state.railMore = false;
      refreshToolRail();
    } catch (err) { reportError(err); }
    return;
  }
  if (button.dataset.controlTool) {
    const tool = button.dataset.controlTool;
    try {
      const ctl = availableControls().find(c => c.name === state.railOpen);
      if (!ctl || !availableTools(ctl).some(t => t.name === tool)) return;
      await ui.controls?.activate?.({control:ctl.name, tool});
      refreshToolRail();
    } catch (err) { reportError(err); }
    return;
  }
  if (button.dataset.focusToken) {
    const token = canvas?.tokens?.get(button.dataset.focusToken);
    if (token && token.visible) {
      await canvas.animatePan({x: token.center.x, y: token.center.y, duration: 350});
      if (token.isOwner) token.control({releaseOthers: true});
    } else ui.notifications.info("Dieser Token ist auf deiner aktuellen Karte nicht sichtbar.");
    setMenu(null); return;
  }
  if (button.dataset.action === "next-turn") {
    if (!game.user.isGM) return;
    try { await combatRecord()?.nextTurn(); scheduleRefresh(); }
    catch (err) { reportError(err); }
    return;
  }
  const nativeTab = button.dataset.nativeTab;
  if (nativeTab) { setMenu(null); openNativeTab(nativeTab); return; }
  if (button.dataset.openDoc) {
    const uuid = button.dataset.openDoc;
    setMenu(null);
    try {
      const doc = await fromUuid(uuid);
      if (!doc) return;
      if (doc.documentName === "Scene") {
        if (doc.active || doc.isView) await doc.view();
        else if (game.user.isGM) await doc.view();
        else ui.notifications.info("Diese Szene muss vom Spielleiter aktiviert werden.");
      } else doc.sheet?.render(true);
    } catch (err) { reportError(err); }
    return;
  }
  if (button.dataset.tab) { state.tab = button.dataset.tab; saveState(); refreshCharacter(); return; }
  if (button.dataset.viewActor) {
    const actor = game.actors.get(button.dataset.viewActor);
    if (hasAccess(actor)) actor.sheet?.render(true);
    else ui.notifications?.warn?.("Kein Zugriff auf diesen Akteur.");
    return;
  }
  if (button.dataset.actor) {
    // A player's HUD is pinned to their assigned primary character.  Only the
    // GM may switch figures; clicking the selected one again clears it.
    if (!game.user.isGM) return;
    const actor = game.actors.get(button.dataset.actor);
    if (hasAccess(actor)) {
      const wasSelected = getActor()?.id === actor.id;
      state.actorTokenId = null;
      state.actorId = wasSelected ? null : actor.id;
      refreshEverything();
      setMenu(null);
    } else ui.notifications.warn("Kein Zugriff auf diese Figur.");
    return;
  }
  if (button.dataset.entryToggle) {
    toggleEntry(button);
    return;
  }
  if (button.dataset.itemSheet) {
    const actor = getActor(); const item = actor?.items.get(button.dataset.itemSheet);
    if (hasAccess(actor) && item) item.sheet?.render(true);
    return;
  }
  if (button.dataset.spellAction) {
    await runItemAction(button.dataset.spellAction, button.dataset.itemId, button.dataset.activityId);
    return;
  }
  if (button.dataset.action === "actor-sheet") { getActor()?.sheet?.render(true); return; }
  if (button.dataset.action === "send-chat") { await sendChatMessage(); return; }
  if (button.dataset.action === "cancel-chat") { closeChatComposer(); return; }
  if (button.dataset.action === "chat-compose") { openChatComposer(); return; }
  if (button.dataset.action === "chat-debug") {
    state.chatDebugVisible = !state.chatDebugVisible;
    const panel = state.root.querySelector(".shud-chat-debug");
    if (panel) panel.hidden = !state.chatDebugVisible;
    refreshChatDebug();
    return;
  }
  if (button.dataset.action === "native-chat") { openNativeTab("chat"); return; }
  if (button.dataset.action === "chat-clear") {
    // Foundry's ChatMessages.flush() includes the official confirmation dialog.
    // Clearing the entire world's chat is a GM-only destructive operation.
    if (!game.user.isGM) return;
    try {
      if (typeof game.messages?.flush !== "function") throw new Error("Foundry bietet die Chat-Löschfunktion nicht an.");
      await game.messages.flush();
      scheduleChatScroll();
      if (state.root?.querySelector("#shud-chat-fallback")?.hidden === false) void renderChatFallback();
    } catch (error) { reportError(error); }
    return;
  }
  if (button.dataset.action === "foundry-settings") {
    setMenu(null);
    openNativeTab("settings");
    return;
  }
  if (button.dataset.action === "native-controls") {
    document.body.classList.toggle("shud-show-native-controls"); setMenu(null); return;
  }
  if (button.dataset.action === "native-sidebar") {
    const expanded = document.body.classList.toggle("shud-vanilla-sidebar");
    if (expanded) ui.sidebar?.expand?.(); else ui.sidebar?.collapse?.();
    setMenu(null); return;
  }
  if (button.dataset.action === "configure-settings") { setMenu(null); openNativeTab("settings"); return; }
}
function onHUDInput(event) {
  if (event.target.matches("#shud-actor-search")) {
    state.actorFilter = event.target.value;
    filterActors();
  }
  if (event.target.matches("#shud-spell-search")) {
    state.filter = event.target.value;
    filterSpells();
  }
}
function characterChoices() {
  // GMs can explicitly pick any world actor (including NPCs). For regular
  // players the right-side sheet never switches away from game.user.character.
  if (game.user.isGM) return game.actors.contents?.slice().sort((a,b) => a.name.localeCompare(b.name))
    || Array.from(game.actors).sort((a,b) => a.name.localeCompare(b.name));
  return hasAccess(game.user.character) ? [game.user.character] : [];
}
function getActor() {
  if (!game.user.isGM) {
    // Foundry's User Configuration / Select Character is the primary actor.
    // Token selection, party clicks and initiative focus cannot override it.
    const main = game.user.character;
    return hasAccess(main) ? main : null;
  }
  if (state.actorTokenId && canvas?.ready) {
    const selectedTokenActor = canvas.tokens?.get(state.actorTokenId)?.actor;
    if (hasAccess(selectedTokenActor)) return selectedTokenActor;
  }
  const selected = state.actorId ? game.actors.get(state.actorId) : null;
  // Deliberately no auto-fallback: GM can deselect every figure.
  return hasAccess(selected) ? selected : null;
}
function actorLabel(actor) {
  const classes = actor.classes ? Object.values(actor.classes).map(c => c.name).join(" / ") : "";
  return `${classes || actor.type || "Charakter"}${actor.system?.details?.level != null ? ` · Stufe ${actor.system.details.level}` : ""}`;
}
function hpStats(actor) {
  const a = actor.system?.attributes || {}, hp = a.hp || {};
  const current = Number(hp.value ?? 0), max = Math.max(Number(hp.max ?? 0), 1);
  return { current, max, pct: Math.max(0, Math.min(100, 100 * current / max)), ac: a.ac?.value ?? "–", movement: typeof a.movement?.walk === "number" ? a.movement.walk : "–" };
}
function refreshUndoButton() {
  const button = state.root?.querySelector('.shud-undo-btn');
  if (!button) return;
  const latest = getUndoHistory()[0];
  button.disabled = !latest;
  button.title = latest ? `Rückgängig: ${latest.label} (${latest.who})` : "Keine aufgezeichneten Aktionen";
  button.setAttribute("aria-label",button.title);
}
function refreshEverything() { refreshParty(); refreshActors(); refreshCharacter(); refreshCombatSummary(); refreshInitiativeTrack(); }
function refreshParty() {
  if (!state.panels.party) return;
  const host = state.root?.querySelector("#shud-party-body"); if (!host) return;
  const selected = getActor();
  const seen = new Set(), rows = [];
  const appendMember = (actor, online = false) => {
    if (!actor || !hasAccess(actor) || seen.has(actor.id)) return;
    seen.add(actor.id);
    const hp = hpStats(actor), active = actor.id === selected?.id;
    const tooltip = game.user.isGM
      ? `${actor.name} – ${active ? "Auswahl mit Linksklick aufheben" : "Mit Linksklick auswählen"}`
      : `${actor.name} – Hauptcharakter wird in Foundry zugewiesen`;
    const inner = `<img src="${img(actor.img)}" alt=""><span class="shud-party-copy"><b>${escapeHtml(actor.name)}</b><small>${hp.current} / ${hp.max} TP ${online ? "· online" : ""}</small><span class="shud-hp-track"><span style="width:${hp.pct}%"></span></span></span>`;
    rows.push(game.user.isGM
      ? `<button type="button" class="shud-party-member ${active ? "is-current" : ""}" data-actor="${escapeHtml(actor.id)}" aria-pressed="${active}" title="${escapeHtml(tooltip)}">${inner}</button>`
      : `<div class="shud-party-member ${active ? "is-current" : ""} shud-party-readonly" title="${escapeHtml(tooltip)}">${inner}</div>`);
  };
  // The player's own main character is always the first entry on the left.
  const users = Array.from(game.users);
  if (!game.user.isGM) users.sort((a,b) =>
    Number(b.character?.id === game.user.character?.id && Boolean(b.character)) -
    Number(a.character?.id === game.user.character?.id && Boolean(a.character)));
  for (const user of users) appendMember(user.character, user.active);
  // In worlds without user assignment provide a meaningful GM selection list.
  if (!rows.length && game.user.isGM) {
    for (const actor of characterChoices().slice(0, 8)) appendMember(actor);
  }
  // A GM may select an NPC from the actor selector that is not part of the party.
  if (game.user.isGM && selected && !seen.has(selected.id)) appendMember(selected);
  host.innerHTML = rows.length ? rows.join("") : `<div class="shud-empty">Keine zugänglichen Spielercharaktere.</div>`;
  const count = state.root.querySelector('.shud-party .shud-panel-header strong span');
  if (count) count.textContent = `Gruppe (${rows.length})`;
}

/** Optional world actor directory. GMs see all; players see only actors they
 * can observe, never private NPCs. It shares space with the group list. */
function refreshActors() {
  if (!state.panels.actors) return;
  const host = state.root?.querySelector("#shud-actors-body");
  if (!host) return;
  const actors = Array.from(game.actors?.contents || game.actors || [])
    .filter(a => hasAccess(a, "OBSERVER"))
    .sort((a, b) => a.name.localeCompare(b.name, "de", {numeric:true}));
  const selectedId = getActor()?.id;
  const previousList = host.querySelector(".shud-actor-directory-list");
  const previousScroll = previousList?.scrollTop || 0;
  const wasSearching = document.activeElement === host.querySelector("#shud-actor-search");
  const rows = actors.map(a => {
    const isCurrent = game.user.isGM && selectedId === a.id;
    const title = escapeHtml(a.name);
    const pic = `<img src="${img(a.img)}" alt="">`;
    const summary = `<span class="shud-actor-row-copy"><b>${title}</b><small>${escapeHtml(actorLabel(a))}</small></span>`;
    const select = game.user.isGM
      ? `<button type="button" class="shud-actor-select ${isCurrent ? "is-current" : ""}" data-actor="${escapeHtml(a.id)}" aria-pressed="${isCurrent}" title="${isCurrent ? "Auswahl aufheben" : "Im Charakterfenster anzeigen"}">${pic}${summary}</button>`
      : `<span class="shud-actor-readonly">${pic}${summary}</span>`;
    return `<div class="shud-actor-directory-row" data-actor-row>${select}<button type="button" class="shud-actor-sheet" data-view-actor="${escapeHtml(a.id)}" aria-label="Bogen von ${title} öffnen" title="Original-Charakterbogen öffnen">${icon("up-right-from-square")}</button></div>`;
  }).join("");
  host.innerHTML = `<div class="shud-actor-directory-head"><label for="shud-actor-search">${actors.length} zugängliche Akteure</label><input id="shud-actor-search" type="search" placeholder="Akteure suchen …" autocomplete="off" aria-label="Akteure suchen" value="${escapeHtml(state.actorFilter)}"><button type="button" data-native-tab="actors">${icon("folder-open")} Original-Akteursverzeichnis</button></div><div class="shud-actor-directory-list">${rows || `<p class="shud-empty">Keine zugänglichen Akteure.</p>`}</div>`;
  filterActors();
  const list = host.querySelector(".shud-actor-directory-list");
  if (list) list.scrollTop = previousScroll;
  if (wasSearching) host.querySelector("#shud-actor-search")?.focus({preventScroll:true});
}
function filterActors() {
  const query = state.actorFilter.toLocaleLowerCase("de").trim();
  const host = state.root?.querySelector("#shud-actors-body");
  host?.querySelectorAll("[data-actor-row]").forEach(row => {
    row.hidden = Boolean(query) && !row.textContent.toLocaleLowerCase("de").includes(query);
  });
}

function refreshCharacter() {
  if (!state.panels.character) return;
  const host = state.root?.querySelector("#shud-character-body"); if (!host) return;
  const actor = getActor();
  if (!actor) {
    host.innerHTML = game.user.isGM
      ? `<div class="shud-no-character"><div class="shud-nochar-symbol">${icon("user-shield")}</div><h2>Keine Figur ausgewählt</h2><p>Wähle eine Figur aus der Gruppenliste, dem Charaktermenü oder auf der Karte.</p><button type="button" data-menu="characters">${icon("users")} Figur auswählen</button></div>`
      : `<div class="shud-no-character"><div class="shud-nochar-symbol">${icon("user-shield")}</div><h2>Kein Hauptcharakter zugewiesen</h2><p>Weise deinem Benutzer in Foundry unter „Benutzerkonfiguration → Charakter wählen“ deinen Hauptcharakter zu.</p></div>`;
    return;
  }
  if (!hasAccess(actor)) { host.innerHTML = `<div class="shud-empty">Kein Zugriff.</div>`; return; }
  const stats = hpStats(actor);
  const tp = escapeHtml(stats.current) + " / " + escapeHtml(stats.max);
  host.innerHTML = `
    <div class="shud-hero"><img src="${img(actor.img)}" alt="" class="shud-hero-image"><div class="shud-hero-overlay"><div class="shud-hero-title"><img src="${img(actor.img)}" alt=""><div><h2>${escapeHtml(actor.name)}</h2><small>${escapeHtml(actorLabel(actor))}</small></div></div>${game.user.isGM ? `<button class="shud-choose-character" data-menu="characters" title="Figur auswählen oder abwählen">${icon("users")}</button>` : ""}</div></div>
    <div class="shud-stats"><div><strong>${icon("heart")} ${tp}</strong><small>Trefferpunkte</small></div><div><strong>${icon("shield")} ${escapeHtml(stats.ac)}</strong><small>Rüstungsklasse</small></div><div><strong>${icon("shoe-prints")} ${escapeHtml(stats.movement)}</strong><small>Bewegung</small></div></div>
    <div class="shud-tabbar" role="tablist">
      <button role="tab" data-tab="actions" class="${state.tab === "actions" ? "active" : ""}">${icon("bolt")}<span>Aktionen</span></button>
      <button role="tab" data-tab="spells" class="${state.tab === "spells" ? "active" : ""}">${icon("wand-magic-sparkles")}<span>Zauber</span></button>
      <button role="tab" data-tab="features" class="${state.tab === "features" ? "active" : ""}">${icon("hand-fist")}<span>Fähigkeiten</span></button>
      <button role="tab" data-tab="inventory" class="${state.tab === "inventory" ? "active" : ""}">${icon("briefcase")}<span>Inventar</span></button>
      <button role="tab" data-tab="details" class="${state.tab === "details" ? "active" : ""}">${icon("circle-info")}<span>Details</span></button>
    </div>
    <div class="shud-content">${contentForTab(actor)}</div>`;
  filterSpells();
}
/** One expanded item at a time, shared by attacks, abilities and spells.
 * The reveal is in-place so Foundry's native windows, chat scroll and search
 * field are not lost by a full HUD re-render. */
function entryKey(actor, item) { return `${actor.uuid || actor.id}:${item.id}`; }
function toggleEntry(button) {
  const key = button.dataset.entryToggle;
  state.expandedEntry = state.expandedEntry === key ? null : key;
  state.root?.querySelectorAll(".shud-action-entry").forEach(entry => {
    const open = entry.dataset.entryKey === state.expandedEntry;
    entry.classList.toggle("is-expanded", open);
    const details = entry.querySelector(".shud-entry-details");
    const head = entry.querySelector(".shud-entry-head");
    if (details) details.hidden = !open;
    if (head) head.setAttribute("aria-expanded", String(open));
  });
}

function activityArea(item, activity) {
  const target = activity?.target || item.system?.target || {};
  const shapes = new Set(["cone", "cube", "cylinder", "line", "radius", "sphere", "circle", "rect", "ray", "square"]);
  const candidates = [target?.template?.type, target?.area?.type, target?.type, item.system?.target?.type];
  const type = candidates.map(x => String(x || "").toLowerCase()).find(x => shapes.has(x));
  return type || null;
}
function canTarget(item, activity) {
  const target = activity?.target || item.system?.target || {};
  const affect = String(target?.affects?.type || target?.type || "").toLowerCase();
  if (["self", "none", "personal"].includes(affect)) return false;
  const hasTarget = Boolean(target?.affects?.count || target?.affects?.type || target?.value || target?.type);
  return hasTarget || typeof activity?.rollAttack === "function" ||
    ["attack", "save", "heal"].includes(String(activity?.type || "").toLowerCase());
}
function actionButton(kind, label, glyph, item, activity) {
  return `<button type="button" class="shud-roll-button" data-spell-action="${kind}" data-item-id="${escapeHtml(item.id)}" data-activity-id="${escapeHtml(activity.id || activity._id)}" title="${escapeHtml(label)}: ${escapeHtml(item.name)}">${icon(glyph)} <span>${label}</span></button>`;
}
function expandedActions(actor, item) {
  const canUse = owned(actor);
  const activities = getActivities(item);
  if (!canUse) return `<div class="shud-hint">Nur mit Besitzerrechten ausführbar.</div>`;
  if (!activities.length) return `<div class="shud-hint">Keine ausführbare D&D-5e-Aktivität hinterlegt.</div>`;
  return activities.map((activity, index) => {
    const area = activityArea(item, activity);
    const target = canTarget(item, activity);
    const buttons = [];
    if (area) buttons.push(actionButton("template", "Schablone platzieren", "ruler", item, activity));
    else if (target) buttons.push(actionButton("target", "Ziel auswählen", "crosshairs", item, activity));
    if (typeof activity.rollAttack === "function") buttons.push(actionButton("attack", "Angriff würfeln", "dice-d20", item, activity));
    if (typeof activity.rollDamage === "function") buttons.push(actionButton("damage", "Schaden würfeln", "burst", item, activity));
    if (typeof activity.use === "function" || typeof item.use === "function") {
      buttons.push(actionButton("cast", item.type === "spell" ? "Zauber wirken" : "Ausführen", "play", item, activity));
    }
    const title = escapeHtml(activity.name || activity.label || (activities.length > 1 ? `Aktivität ${index + 1}` : "Aktionen"));
    return `<section class="shud-activity-group" aria-label="${title}">
      ${activities.length > 1 ? `<div class="shud-activity-caption">${title}</div>` : ""}
      <div class="shud-entry-actions">${buttons.join("") || `<span class="shud-hint">Keine ausführbaren Würfe.</span>`}</div>
    </section>`;
  }).join("");
}
function interactiveItemRow(actor, item, subtitle, rowClass = "") {
  const key = entryKey(actor, item);
  const open = key === state.expandedEntry;
  return `<div class="shud-action-entry ${rowClass} ${open ? "is-expanded" : ""}" data-entry-key="${escapeHtml(key)}" data-spell-name="${escapeHtml(item.name.toLocaleLowerCase())}">
    <button type="button" class="shud-entry-head" data-entry-toggle="${escapeHtml(key)}" aria-expanded="${open}" title="${escapeHtml(item.name)}: Aktionen ${open ? "einklappen" : "aufklappen"}">
      <img src="${img(item.img)}" alt=""><span class="shud-entry-copy"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(subtitle)}</small></span><span class="shud-entry-chevron">${icon("chevron-down")}</span>
    </button>
    <div class="shud-entry-details" ${open ? "" : "hidden"}>
      ${expandedActions(actor, item)}
      <button type="button" class="shud-entry-sheet" data-item-sheet="${escapeHtml(item.id)}">${icon("up-right-from-square")} Details / Originalbogen</button>
    </div>
  </div>`;
}

function contentForTab(actor) {
  if (state.tab === "spells") return spellContent(actor);
  if (state.tab === "details") return `<div class="shud-section-title">Charakterdetails</div><p class="shud-description">${escapeHtml(actorLabel(actor))}</p><button class="shud-wide-button" data-action="actor-sheet">${icon("file-lines")} Original-Charakterbogen öffnen</button>`;
  const types = state.tab === "actions" ? ["weapon"] : state.tab === "features" ? ["feat"] : ["equipment", "consumable", "loot", "tool", "backpack", "container"];
  const items = actor.items.filter(it => types.includes(it.type)).sort((a,b) => a.name.localeCompare(b.name));
  const heading = { actions: "Angriffe & Aktionen", features: "Fähigkeiten", inventory: "Inventar" }[state.tab];
  if (!items.length) return `<div class="shud-section-title">${heading}</div><div class="shud-empty">Keine Einträge vorhanden</div>`;
  const playItems = ["actions", "features"].includes(state.tab);
  const rows = items.map(it => playItems ? interactiveItemRow(actor, it, it.type === "weapon" ? "Waffe" : "Fähigkeit") :
    `<div class="shud-item"><img src="${img(it.img)}" alt=""><div><b>${escapeHtml(it.name)}</b><small>${escapeHtml(it.type)}</small></div><button class="shud-mini" data-item-sheet="${escapeHtml(it.id)}" title="Item öffnen">${icon("up-right-from-square")}</button></div>`);
  return `<div class="shud-section-title">${heading}</div>${rows.join("")}`;
}
function getActivities(item) {
  const ac = item.system?.activities;
  if (!ac) return [];
  if (Array.isArray(ac)) return ac;
  if (ac.contents) return Array.from(ac.contents);
  if (typeof ac.values === "function") return Array.from(ac.values());
  return Object.values(ac).filter(v => v && typeof v === "object" && (v.id || v._id));
}
function spellContent(actor) {
  if (game.system.id !== "dnd5e") return `<div class="shud-empty">Zauber-Aktionen werden nur für D&D 5e unterstützt.</div>`;
  const spells = actor.items.filter(i => i.type === "spell").sort((a,b) => Number(a.system.level || 0) - Number(b.system.level || 0) || a.name.localeCompare(b.name));
  const groups = new Map();
  for (const s of spells) { const lvl = Number(s.system.level || 0); if (!groups.has(lvl)) groups.set(lvl, []); groups.get(lvl).push(s); }
  const spellSlots = actor.system?.spells || {};
  const groupsHtml = [...groups.entries()].map(([level, items]) => {
    const slot = spellSlots[`spell${level}`];
    const slots = level ? `<span class="shud-slot-count">${Number(slot?.value ?? 0)} / ${Number(slot?.max ?? 0)} Plätze</span>` : "";
    return `<details class="shud-spell-group" open><summary>${level ? `Grad ${level}` : "Zaubertricks"} <span>(${items.length})</span>${slots}</summary>
    <div>${items.map(s => spellRow(actor, s)).join("")}</div></details>`;
  }).join("");
  return `<div class="shud-section-title">Zauberbuch <small>${spells.length} Zauber</small></div>
    <div class="shud-search">${icon("magnifying-glass")} <input id="shud-spell-search" type="search" placeholder="Zauber suchen ..." value="${escapeHtml(state.filter)}" aria-label="Zauber suchen"></div>
    ${groupsHtml || `<div class="shud-empty">Keine Zauber eingetragen.</div>`}
    <p class="shud-hint">Einmal auf einen Zauber klicken, um passende Aktionen zu öffnen. „Zauber wirken“ verwendet den originalen D&D-5e-Ablauf. Angriffs- und Schadenswürfe werden separat ausgelöst, ohne erneut Zauberplätze zu verbrauchen. Die freie Schablonenplatzierung ist unabhängig vom Wirken.</p>`;
}
function spellRow(actor, spell) {
  const prep = spell.system?.preparation;
  const prepared = prep?.mode === "prepared" && !prep?.prepared ? " · nicht vorbereitet" : "";
  const subtitle = [spell.system?.school || "Zauber", prep?.mode === "ritual" ? "Ritual" : "", prepared].filter(Boolean).join(" · ");
  return interactiveItemRow(actor, spell, subtitle, "shud-spell-row");
}
function filterSpells() {
  const needle = state.filter.trim().toLocaleLowerCase();
  state.root?.querySelectorAll(".shud-spell-group").forEach(group => {
    let count = 0;
    group.querySelectorAll(".shud-action-entry").forEach(row => {
      const matched = !needle || (row.dataset.spellName || "").includes(needle);
      row.hidden = !matched;
      if (matched) count++;
    });
    group.hidden = count === 0;
  });
}
/** Activate Foundry's native targeting/template tool. This operation never
 * consumes a spell slot, rolls dice or directly creates unvalidated templates. */
async function activatePlacement(kind, item, activity) {
  if (!canvas?.ready) return ui.notifications.warn("Bitte zuerst eine Szene mit Karte öffnen.");
  const controls = availableControls();
  if (kind === "target") {
    const control = controls.find(c => /^(tokens?|tokenControls)$/i.test(c.name)) ||
      controls.find(c => availableTools(c).some(t => t.name === "target"));
    const targetTool = control && availableTools(control).find(t => /^(target|targets)$/i.test(t.name));
    if (!control || !targetTool) return ui.notifications.warn("Foundrys Zielwerkzeug ist nicht verfügbar. Alternativ: Rechtsklick auf Token → Ziel.");
    await ui.controls.activate({control:control.name, tool:targetTool.name});
    ui.notifications.info("Zielmodus aktiv: Klicke auf einen Token, um ihn als Ziel zu markieren. Mit Shift mehrere auswählen.");
    return;
  }
  const area = activityArea(item, activity);
  if (!area) return ui.notifications.warn("Für diese Aktivität ist keine Flächenschablone definiert.");
  const control = controls.find(c => /templates?|measuredtemplates?|measurements?/i.test(c.name));
  if (!control) return ui.notifications.warn("Das native Schablonenwerkzeug ist nicht verfügbar. Wirke den Zauber über den D&D-5e-Dialog.");
  const tools = availableTools(control);
  const aliases = {
    cone:["cone"], line:["ray", "line"], ray:["ray", "line"],
    cube:["rect", "rectangle", "square"], square:["rect", "rectangle", "square"], rect:["rect", "rectangle", "square"],
    cylinder:["circle"], sphere:["circle"], radius:["circle"], circle:["circle"]
  };
  const wanted = aliases[area] || [area];
  const tool = tools.find(t => wanted.includes(t.name.toLowerCase()));
  if (!tool) return ui.notifications.warn("Foundry bietet kein passendes Schablonenwerkzeug für diese Fläche.");
  await ui.controls.activate({control:control.name,tool:tool.name});
  ui.notifications.info("Schablonenwerkzeug aktiv: Platziere die Fläche auf der Karte. Größe/Entfernung im Foundry-Werkzeug einstellen; beim späteren Wirken kann D&D 5e eine eigene Vorlage verlangen.");
}

async function runItemAction(kind, itemId, activityId) {
  const actor = getActor();
  if (!owned(actor)) return ui.notifications.warn("Du benötigst Besitzerrechte, um Zauber oder Aktionen auszuführen.");
  const item = actor.items.get(itemId);
  if (!item) return ui.notifications.warn("Der ausgewählte Zauber wurde nicht gefunden.");
  const activity = getActivities(item).find(a => a.id === activityId || a._id === activityId);
  if (!activity) return ui.notifications.warn("Für diesen Eintrag ist keine passende D&D5e-Aktivität vorhanden.");
  try {
    if (kind === "target" || kind === "template") {
      await activatePlacement(kind, item, activity);
    } else if (kind === "cast") {
      if (typeof activity.use === "function") await activity.use();
      else if (typeof item.use === "function") await item.use();
      else throw new Error("Keine native Aktivitätsfunktion zum Wirken vorhanden.");
    } else if (kind === "attack") {
      if (typeof activity.rollAttack !== "function") throw new Error("Diese Aktivität besitzt keinen Angriffswurf.");
      await activity.rollAttack();
    } else if (kind === "damage") {
      if (typeof activity.rollDamage !== "function") throw new Error("Diese Aktivität besitzt keinen Schadenswurf.");
      await activity.rollDamage();
    }
    scheduleRefresh();
  } catch (error) { reportError(error); }
}
function reportError(error) {
  console.error(`[${MOD}]`, error);
  ui.notifications.error(`Silber HUD: ${error?.message || "Aktion fehlgeschlagen"}`);
}
/** Mount the real ChatLog popout so Foundry/D&D5e keeps its interactive roll cards.
 * Reattach after rerender; v14 AppV2 can replace its element between renders. */
/** Scroll the embedded *native* Foundry chat, not the whole browser page.
 * ChatLog v14 exposes scrollBottom(), but the popout may have been moved into
 * our dock; we also scroll the actual visible log element for robustness. */
function scrollChatLatest() {
  if (!state.root?.isConnected) return;
  const mount = state.root.querySelector("#shud-chat-mount");
  const selectors = ".chat-scroll, .chat-log-messages, #chat-log, .chat-log, [data-part='log']";
  mount?.querySelectorAll(selectors).forEach(el => {
    if (el instanceof HTMLElement) el.scrollTop = el.scrollHeight;
  });
  const fallback = state.root.querySelector("#shud-chat-fallback-log");
  if (fallback) fallback.scrollTop = fallback.scrollHeight;
  try {
    const chat = ui.chat;
    void chat?.scrollBottom?.({popout:true,scrollOptions:{behavior:"instant",block:"end"},waitImages:true})
      ?.catch?.(error => console.debug(`[${MOD}] Chat scroll deferred`, error));
  } catch (error) { console.debug(`[${MOD}] Chat scroll unavailable`, error); }
}
function scheduleChatScroll() {
  clearTimeout(state.chatScrollTimer);
  state.chatScrollTimer = setTimeout(() => {
    scrollChatLatest();
    // Some card content (images/dice tooltips) arrives in a later render frame.
    setTimeout(scrollChatLatest, 180);
  }, 50);
}
function observeChatMount(mount) {
  state.chatScrollObserver?.disconnect();
  if (typeof MutationObserver !== "function") return;
  state.chatScrollObserver = new MutationObserver(mutations => {
    const newMessage = mutations.some(m => Array.from(m.addedNodes).some(node =>
      node.nodeType === 1 && (node.matches?.(".chat-message,[data-message-id]") ||
        node.querySelector?.(".chat-message,[data-message-id]"))));
    if (newMessage) scheduleChatScroll();
  });
  state.chatScrollObserver.observe(mount, {childList:true,subtree:true});
}

async function mountNativeChat() {
  if (!state.root) return;
  const mount = state.root.querySelector("#shud-chat-mount");
  if (!mount) return;
  if (state.chatMountPromise) return state.chatMountPromise;
  state.chatMountPromise = (async () => {
    try {
      const chat = ui.chat;
      if (!chat) throw new Error("Foundry ChatLog fehlt.");
      // Prefer the currently live popout, not a cached element replaced by AppV2.
      let popout = chat.popout;
      if (!popout?.element?.isConnected) popout = await chat.renderPopout?.();
      const element = popout?.element;
      if (!(element instanceof HTMLElement)) throw new Error("Chat-Popout konnte nicht erstellt werden.");
      state.chatPopout = popout;
      element.classList.add("shud-embedded-chat");
      if (element.parentElement !== mount) mount.replaceChildren(element);
      const fallback = state.root?.querySelector("#shud-chat-fallback");
      if (fallback) fallback.hidden = true;
      // Watch late chat-card renders, including dice rolls with async content.
      observeChatMount(mount);
      scheduleChatScroll();
    } catch (error) {
      console.warn(`[${MOD}] Chat-Popout nicht verfügbar; zeige Nachrichten-Fallback`, error);
      await renderChatFallback();
    }
  })();
  try { await state.chatMountPromise; } finally { state.chatMountPromise = null; }
}

/** Show recent public/authorized chat cards if a Foundry popout is unavailable.
 * Use Foundry's renderer; never parse, reinterpret or mutate chat data. */
async function renderChatFallback() {
  if (!state.root || state.chatFallbackRendering) return;
  const fallback = state.root.querySelector("#shud-chat-fallback");
  const log = state.root.querySelector("#shud-chat-fallback-log");
  if (!fallback || !log) return;
  const mount = state.root.querySelector("#shud-chat-mount");
  if (mount && mount.querySelector(".shud-embedded-chat")) return;
  state.chatFallbackRendering = true;
  try {
    fallback.hidden = false;
    const all = Array.from(game.messages?.contents || []).filter(m => m.visible !== false).slice(-80);
    const rendered = [];
    for (const message of all) {
      try {
        const element = await foundry.applications.sidebar.tabs.ChatLog.renderMessage(message);
        if (element instanceof HTMLElement) rendered.push(element);
      } catch (error) {
        console.debug(`[${MOD}] Chat card could not render`, error);
      }
    }
    if (!state.root?.contains(log)) return;
    log.replaceChildren(...rendered);
    log.scrollTop = log.scrollHeight;
    scheduleChatScroll();
  } finally { state.chatFallbackRendering = false; }
}
function scheduleRefresh() {
  // Maximal eine komplette Aktualisierung je 130 ms: auch bei kontinuierlichen
  // Schadens-/Ressourcenänderungen bleibt die Anzeige aktuell statt zu warten.
  if (state.refreshTimer !== null) return;
  state.refreshTimer = setTimeout(() => {
    state.refreshTimer = null;
    refreshEverything();
  }, 130);
}
function registerRefreshHooks() {
  Hooks.on("controlToken", (token, controlled) => {
    if (game.user.isGM) {
      if (controlled && hasAccess(token?.actor)) {
        state.actorId = token.actor.id;
        state.actorTokenId = token.id;
      } else if (!controlled && state.actorTokenId === token?.id) {
        state.actorId = null;
        state.actorTokenId = null;
      }
    }
    // Players always retain their assigned main character independently of
    // scene token controls. All panels refresh for HP/status changes.
    scheduleRefresh();
  });
  Hooks.on("renderChatLog", () => { setTimeout(() => { if (state.root) void mountNativeChat(); }, 0); });
  for (const hook of ["createChatMessage", "updateChatMessage", "deleteChatMessage"]) Hooks.on(hook, () => {
    if (state.root?.querySelector("#shud-chat-fallback")?.hidden === false) void renderChatFallback();
    scheduleChatScroll();
  });
  Hooks.on("renderSceneControls", () => { markNativeSceneControls(); if (state.root) refreshToolRail(); });
  // The v14 ApplicationV2 emits its own render event even if a module changes the hook name.
  ui.controls?.addEventListener?.("render", markNativeSceneControls);
  markNativeSceneControls();
  for (const hook of ["canvasReady", "updateActor", "createActor", "deleteActor", "updateItem", "createItem", "deleteItem", "updateUser", "createUser", "deleteUser", "updateCombat", "createCombat", "deleteCombat", "createCombatant", "updateCombatant", "deleteCombatant"])
    Hooks.on(hook, scheduleRefresh);
  Hooks.on("changeSidebarTab", () => { if (document.body.classList.contains("shud-vanilla-sidebar")) setMenu(null); });
}


/** Foundry v14 scene controls are activated through the public SceneControls API. */
// The player rail is deliberately short.  Foundry remains the source of truth for
// actual visibility and ownership of controls and their tools (including modules).
const PLAY_CONTROLS = new Set(["tokens", "token", "measure", "measurements", "ruler", "templates", "template"]);
const GM_CONTROLS = new Set([...PLAY_CONTROLS, "lighting", "lights", "light"]);
// Keep scene-editing controls out of the *player* HUD even if a module
// mistakenly advertises one as visible. This does not modify Foundry permissions.
const GM_ONLY_CONTROLS = new Set(["light", "lights", "lighting", "wall", "walls", "tile", "tiles", "region", "regions", "sound", "sounds", "cinematic", "cinematics", "weather", "drawing", "drawings"]);
function isLightControl(name) { return /^(lighting|lights|light)$/i.test(String(name)); }
function controlGlyph(name) {
  const n = String(name || "").toLowerCase();
  if (/token|actor|char/.test(n)) return "mouse-pointer";
  if (/meas|ruler|distance/.test(n)) return "ruler";
  if (/template|target/.test(n)) return "target";
  if (/light|illumination/.test(n)) return "lightbulb";
  if (/draw|brush|paint/.test(n)) return "paintbrush";
  if (/wall|door/.test(n)) return "brick-wall";
  if (/sound|audio|music/.test(n)) return "music";
  if (/tile|layer/.test(n)) return "layers";
  if (/region|scene|map/.test(n)) return "map";
  if (/select|cursor|drag/.test(n)) return "mouse-pointer";
  if (/note|journal/.test(n)) return "book-open";
  if (/film|cinema/.test(n)) return "clapperboard";
  return "";
}
function controlIcon(entry) {
  const mapped = controlGlyph(entry?.name);
  // For unfamiliar controls from modules, show their real Font Awesome icon.
  // Accept class names only, not arbitrary HTML from module metadata.
  const classes = String(entry?.icon || "").split(/\s+/).filter(v => /^fa[a-z0-9-]*$/.test(v));
  const hasRealIcon = classes.some(v => /^fa-(?!solid$|regular$|brands$)[a-z0-9-]+$/.test(v));
  return mapped ? icon(mapped) : hasRealIcon ? `<i class="${classes.map(escapeHtml).join(' ')}" aria-hidden="true"></i>` : icon("sparkles");
}
function localizedTitle(entry) { return game.i18n?.localize?.(entry?.title || entry?.name) || entry?.title || entry?.name || "Werkzeug"; }
function availableControls() {
  return Object.entries(ui.controls?.controls || {})
    .map(([id, c]) => ({...c, name:c.name || id}))
    .filter(c => c.visible !== false && (game.user.isGM || !GM_ONLY_CONTROLS.has(c.name.toLowerCase())))
    .sort((a,b) => (a.order ?? 99) - (b.order ?? 99));
}
function availableTools(control) {
  return Object.entries(control.tools || {})
    .map(([id, t]) => ({...t, name:t.name || id}))
    .filter(t => t.visible !== false)
    .sort((a,b) => (a.order ?? 99) - (b.order ?? 99));
}
function refreshToolRail() {
  if (!state.root) return;
  const host = state.root.querySelector("#shud-toolrail");
  const palette = state.root.querySelector("#shud-toolpalette");
  const morePanel = state.root.querySelector("#shud-toolmore");
  const controls = availableControls();
  const primaryNames = game.user.isGM ? GM_CONTROLS : PLAY_CONTROLS;
  const primary = controls.filter(c => primaryNames.has(c.name.toLowerCase()));
  const extra = controls.filter(c => !primaryNames.has(c.name.toLowerCase()));
  const active = ui.controls?.control?.name || "";
  const drawButton = c => {
    const title = escapeHtml(localizedTitle(c));
    return `<button type="button" data-control-id="${escapeHtml(c.name)}" title="${title}" aria-label="${title}" class="${c.name === active ? "is-active" : ""}">${controlIcon(c)}</button>`;
  };
  // If a module contributes a player-only control, keep it available via More.
  host.innerHTML = `<button type="button" class="shud-chat-rail-toggle ${state.panels.chat ? 'is-active' : ''}" data-toggle="chat" title="Chat ${state.panels.chat ? 'schließen' : 'öffnen'}" aria-label="Chat ${state.panels.chat ? 'schließen' : 'öffnen'}" aria-controls="shud-chat-mount" aria-pressed="${state.panels.chat}">${icon('comments')}</button>` + primary.map(drawButton).join("") + (extra.length ?
    `<button type="button" class="shud-more-toggle ${state.railMore ? 'is-active' : ''}" data-rail-more="true" title="Weitere Werkzeuge${game.user.isGM ? ' (SL)' : ''}" aria-label="Weitere Werkzeuge" aria-expanded="${state.railMore}">${icon('more-horizontal')}</button>` : "");
  // Any category used by Foundry can be opened, but hidden categories cannot.
  const current = controls.find(c => c.name === state.railOpen);
  if (!current || state.railMore) {
    palette.hidden = true; palette.innerHTML = "";
  } else {
    const tools = availableTools(current);
    palette.innerHTML = `<div class="shud-toolpalette-title">${escapeHtml(localizedTitle(current))}</div>` +
      tools.map(t => `<button type="button" data-control-tool="${escapeHtml(t.name)}" title="${escapeHtml(localizedTitle(t))}" aria-label="${escapeHtml(localizedTitle(t))}" class="${t.name === ui.controls?.tool?.name ? "is-active" : ""}">${controlIcon(t)}</button>`).join("");
    palette.hidden = tools.length === 0;
  }
  morePanel.innerHTML = extra.length ? `<div class="shud-toolmore-title">${game.user.isGM ? "Weitere SL-Werkzeuge" : "Weitere Spielwerkzeuge"}</div>` +
    extra.map(c => `<button type="button" data-control-id="${escapeHtml(c.name)}" class="shud-more-entry ${c.name === active ? "is-active" : ""}">${controlIcon(c)}<span>${escapeHtml(localizedTitle(c))}</span></button>`).join("") : "";
  morePanel.hidden = !state.railMore || extra.length === 0;
}
/** Standalone quick composer: the embedded *native* chat remains available for roll cards.
 *  This textbox only exists visually while the user composes. */
function openChatComposer() {
  if (!state.root) return;
  state.panels.chat = true;
  state.composing = true;
  applyPanelStates();
  refreshToolRail();
  const compose = state.root.querySelector(".shud-chat-compose");
  compose.hidden = false;
  state.root.querySelector(".shud-chat")?.classList.add("shud-is-composing");
  state.root.querySelector("#shud-message-input")?.focus();
}
function closeChatComposer() {
  if (!state.root) return;
  state.composing = false;
  const compose = state.root.querySelector(".shud-chat-compose");
  if (compose) compose.hidden = true;
  state.root.querySelector(".shud-chat")?.classList.remove("shud-is-composing");
  state.root.querySelector("#shud-message-input")?.blur();
}
async function sendChatMessage() {
  if (state.submitting) return;
  const input = state.root?.querySelector("#shud-message-input");
  const text = input?.value?.trim();
  if (!text) { closeChatComposer(); return; }
  state.submitting = true;
  try {
    const chat = ui.chat || state.chatPopout;
    if (typeof chat?.processMessage !== "function") throw new Error("Chat-Nachrichtenfunktion nicht gefunden.");
    await chat.processMessage(text, {speaker: ChatMessage.getSpeaker({actor: getActor() || undefined})});
    input.value = "";
    closeChatComposer();
    if (state.root?.querySelector("#shud-chat-fallback")?.hidden === false) void renderChatFallback();
  } catch (err) { reportError(err); input?.focus(); }
  finally { state.submitting = false; }
}
function onComposeKeydown(event) {
  if (!event.target.matches("#shud-message-input")) return;
  if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeChatComposer(); }
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault(); event.stopPropagation(); void sendChatMessage();
  }
}
/** Monitor shortcuts without changing the rest of Foundry's keyboard control.
 * IMPORTANT: don't reject defaultPrevented; Foundry and other modules often
 * prevent browser defaults before the HUD sees the event.
 * Never take keyboard focus away from a *visible* text field or a dialog. */
function isVisibleEditor(element) {
  if (!(element instanceof Element)) return false;
  const editor = element.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],.prosemirror,.cm-editor');
  if (!editor || editor.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
  return editor.getClientRects().length > 0 && getComputedStyle(editor).visibility !== "hidden";
}
function isVisibleDialog() {
  return Array.from(document.querySelectorAll('dialog[open],.dialog.window-app,.dialog.application,[role="dialog"][aria-modal="true"]'))
    .some(el => !el.closest('#shud-root') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
}
function debugEnter(event, source) {
  if (!state.root) return;
  if (source === "keybind") state.enterSeen.keybind++;
  else state.enterSeen[source] = (state.enterSeen[source] || 0) + 1;
  const focus = document.activeElement;
  state.lastEnterInfo = `${source}, Fokus: ${focus?.tagName?.toLowerCase() || 'unbekannt'}${focus?.id ? '#'+focus.id : ''}, verhindert: ${Boolean(event?.defaultPrevented)}`;
  refreshChatDebug();
}
function refreshChatDebug() {
  const output = state.root?.querySelector('#shud-chat-debug-status');
  if (output) output.textContent = `keydown: ${state.enterSeen.keydown} · keyup: ${state.enterSeen.keyup} · Keybinding: ${state.enterSeen.keybind}\n${state.lastEnterInfo}`;
}
function onGlobalKeyup(event) { return routeGlobalEnter(event, "keyup"); }
function onGlobalKeydown(event, source = "keydown") { return routeGlobalEnter(event, source); }
function routeGlobalEnter(event, source) {
  if (!state.root?.isConnected || !event) return false;
  const isEnter = event.key === "Enter" || event.code === "Enter" || event.code === "NumpadEnter";
  if (!isEnter) return false;
  // Show that a physical Enter event was delivered even when we deliberately
  // ignore it to allow text editing, modal confirmation or another shortcut.
  debugEnter(event, source);
  if (source === 'keyup' && state.suppressEnterKeyup) {
    state.suppressEnterKeyup = false;
    return false;
  }
  if (source !== 'keyup') state.suppressEnterKeyup = false;
  if (event.isComposing || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return false;
  const target = event.target instanceof Element ? event.target : null;
  const active = document.activeElement instanceof Element ? document.activeElement : null;
  const composer = state.root.querySelector('#shud-message-input');
  if (state.composing && (target === composer || active === composer)) {
    // On keydown submit immediately and consume.  Keyup is only a fallback
    // when another handler blocked keydown. submit guard prevents duplicates.
    if (source === 'keyup' && state.submitting) return false;
    if (source !== 'keyup') state.suppressEnterKeyup = true;
    event.preventDefault?.(); event.stopImmediatePropagation?.();
    void sendChatMessage();
    return true;
  }
  if (state.composing) return false;
  if (isVisibleEditor(target) || isVisibleEditor(active) || isVisibleDialog()) return false;
  // Do not hijack Enter from buttons/links in another Foundry application.
  const controls = 'button,a,[role="button"],[role="menuitem"]';
  if (target?.closest(controls) && !state.root.contains(target)) return false;
  if (active?.closest(controls) && !state.root.contains(active)) return false;
  if (!state.panels.chat) state.panels.chat = true;
  openChatComposer();
  if (source !== 'keyup') state.suppressEnterKeyup = true;
  event.preventDefault?.(); event.stopImmediatePropagation?.();
  return true;
}
