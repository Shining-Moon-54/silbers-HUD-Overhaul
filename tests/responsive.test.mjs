import {test} from "node:test";
import assert from "node:assert/strict";
import {emptyPanels, onlyPanel, togglePanels} from "../scripts/responsive.mjs";
test("compact starts with a free map", () => assert.equal(Object.values(emptyPanels()).some(Boolean), false));
test("compact switching closes other panels", () => {
  let p = onlyPanel("chat");
  for (const name of ["party", "actors", "character", "chat"]) {
    p = togglePanels(p,name,true);
    assert.deepEqual(p,onlyPanel(name));
  }
  assert.deepEqual(togglePanels(p,"chat",true),emptyPanels());
});
test("desktop retains independent docks", () => {
  const original = {chat:true,party:true,actors:false,character:true};
  assert.deepEqual(togglePanels(original,"actors",false), {chat:true,party:false,actors:true,character:true});
  assert.deepEqual(togglePanels(original,"chat",false), {...original,chat:false});
  assert.equal(original.chat,true);
});
test("unknown panel does not change state", () => assert.deepEqual(togglePanels(onlyPanel("chat"),"other",true),onlyPanel("chat")));
