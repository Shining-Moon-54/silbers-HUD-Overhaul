// Responsive HUD state; no timers or graphics changes.
export const MOBILE_QUERY = "(max-width: 900px), (max-width: 1100px) and (pointer: coarse)";
export const PANEL_KEYS = Object.freeze(["chat", "party", "actors", "character"]);
export function emptyPanels() {
  return Object.fromEntries(PANEL_KEYS.map(key => [key, false]));
}
export function onlyPanel(key) {
  return Object.fromEntries(PANEL_KEYS.map(name => [name, name === key]));
}
export function togglePanels(panels, key, compact) {
  if (!PANEL_KEYS.includes(key)) return {...panels};
  const open = !panels[key];
  if (compact) return onlyPanel(open ? key : null);
  const next = {...panels, [key]: open};
  if (open && key === "actors") next.party = false;
  if (open && key === "party") next.actors = false;
  return next;
}
