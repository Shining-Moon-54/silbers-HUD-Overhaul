/**
 * Lightweight, read-only HUD grouping for D&D5e / Foundry VTT.
 *
 * "Player" is a virtual HUD group determined by Foundry User.character.
 * No Actor, Folder or Group document is created or modified by the HUD.
 * Explicit native D&D5e Group actors are shown in their own sections.
 * Every visible Actor is rechecked through the caller's permission predicate.
 */

const asList = value => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.contents)) return value.contents;
  if (typeof value.values === "function") return Array.from(value.values());
  return Object.values(value).filter(Boolean);
};

const byName = (a, b) => String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "de", { numeric: true });

export function playerRoster(users, canView, currentUserId) {
  const assigned = new Map();
  for (const user of asList(users)) {
    if (!user || user.isGM) continue;
    const actor = user.character;
    if (!actor?.id || !canView(actor)) continue;
    const former = assigned.get(actor.id);
    if (former) {
      former.online ||= Boolean(user.active);
      former.isOwn ||= user.id === currentUserId;
    } else {
      assigned.set(actor.id, {
        actor,
        online: Boolean(user.active),
        isOwn: user.id === currentUserId
      });
    }
  }
  return [...assigned.values()].sort((a, b) => Number(b.isOwn) - Number(a.isOwn) || byName(a.actor, b.actor));
}

/** Only world Actor sources are resolved; no hidden UUID or Compendium lookups. */
export function nativeGroupMembers(group, actorsById, canView) {
  const members = group?.system?._source?.members ?? group?._source?.system?.members ?? group?.system?.members;
  const result = [];
  const seen = new Set();
  for (const record of asList(members)) {
    const ref = record?.actor ?? record;
    let id = "";
    if (typeof ref === "string") {
      if (/^Actor\.[^.]+$/.test(ref)) id = ref.slice(6);
      else if (!ref.includes(".")) id = ref;
    } else if (ref && typeof ref === "object") {
      if (ref.documentName === "Actor" || ref.type === "Actor") id = ref.id || "";
      else if (typeof ref.uuid === "string" && /^Actor\.[^.]+$/.test(ref.uuid)) id = ref.uuid.slice(6);
      else if (typeof ref.id === "string" && !ref.uuid) id = ref.id;
    }
    if (!id || seen.has(id)) continue;
    const actor = actorsById.get(id);
    if (!actor || !canView(actor)) continue;
    seen.add(id);
    result.push({ actor, online: false });
  }
  return result.sort((a, b) => byName(a.actor, b.actor));
}

/** Build compact group sections without rendering every Actor in the world. */
export function partyGroups({ users, actors, canView, currentUserId, selectedActor = null }) {
  const roster = playerRoster(users, canView, currentUserId);
  const players = new Set(roster.map(entry => entry.actor.id));
  const allActors = asList(actors);
  const byId = new Map(allActors.map(actor => [actor.id, actor]));
  const groups = [{ id: "player", name: "Player", members: roster, kind: "player" }];
  const native = allActors.filter(actor => actor?.type === "group" && canView(actor) && actor.name?.trim().toLowerCase() !== "player").sort(byName);
  const assignedElsewhere = new Set(players);
  for (const group of native) {
    const members = nativeGroupMembers(group, byId, canView).filter(entry => !players.has(entry.actor.id));
    groups.push({ id: `group:${group.id}`, name: group.name, members, kind: "native" });
    for (const entry of members) assignedElsewhere.add(entry.actor.id);
  }
  // GM's currently selected standalone NPC remains reachable, but never appears in Player.
  if (selectedActor && canView(selectedActor) && !assignedElsewhere.has(selectedActor.id)) {
    groups.push({ id: "selection", name: "Ausgewählt", members: [{ actor: selectedActor, online: false }], kind: "selection" });
  }
  return groups;
}

/** Actor directory: same Player group followed by world Actor folders. */
export function actorDirectoryGroups({ users, actors, canView, currentUserId }) {
  const roster = playerRoster(users, canView, currentUserId);
  const playerIds = new Set(roster.map(entry => entry.actor.id));
  const groups = [{ id: "player", name: "Player", actors: roster.map(entry => entry.actor) }];
  const folders = new Map();
  for (const actor of asList(actors)) {
    if (!actor?.id || playerIds.has(actor.id) || !canView(actor)) continue;
    const folder = actor.folder;
    const path = folder ? folder.name || "Ordner" : "Ohne Ordner";
    const id = folder?.id ? `folder:${folder.id}` : "unfiled";
    const label = path.toLowerCase() === "player" ? "Player (Akteursordner)" : path;
    if (!folders.has(id)) folders.set(id, { id, name: label, actors: [] });
    folders.get(id).actors.push(actor);
  }
  const ordered = [...folders.values()].sort((a, b) => a.id === "unfiled" ? 1 : b.id === "unfiled" ? -1 : byName(a,b));
  for (const group of ordered) {
    group.actors.sort(byName);
    groups.push(group);
  }
  return groups;
}