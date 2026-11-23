import test from 'node:test';
import assert from 'node:assert/strict';
import { playerRoster, nativeGroupMembers, partyGroups, actorDirectoryGroups } from '../scripts/groups.mjs';

function actor(id, name, options = {}) { return {id, name, type:options.type ?? 'character', ...options}; }
const alice = actor('a', 'Aria', {folder:{id:'pc',name:'Spieler-Ordner'}});
const ben = actor('b', 'Borin');
const hidden = actor('n', 'Geheimer Gegner', {type:'npc',folder:{id:'enemy',name:'Monster'}});
const ally = actor('x', 'Begleiter', {type:'npc',folder:{id:'ally',name:'Verbündete'}});
const party = actor('g1', 'Abenteuergruppe', {type:'group',system:{members:['Actor.a',{actor:'Actor.x'},'Actor.n']}});
const party2 = actor('g2', 'Wächter', {type:'group',system:{members: ['Actor.b']}});
const users = [
 {id:'gm',isGM:true,character: null,active:true},
 {id:'u1',isGM:false,character: alice,active:true},
 {id:'u2',isGM:false,character: ben,active:false},
 {id:'u3',isGM:false,character: alice,active:false},
 {id:'u4',isGM:false,character: null,active:true},
];
const actors = [alice,ben,ally,hidden,party,party2];
const gmView=()=>true;
const playerView=a=>a.id!=='n' && a.id!=='g2';

test('Player section is always first and contains each assigned character only once', () => {
 const g=partyGroups({users,actors,canView:gmView,currentUserId:'u2'});
 assert.equal(g[0].name,'Player');
 assert.deepEqual(g[0].members.map(x=>x.actor.id), ['b','a']);
 assert.equal(g[0].members[0].online,false);
 assert.equal(g[0].members[1].online,true);
 assert.equal(g[1].name,'Abenteuergruppe');
 assert.deepEqual(g[1].members.map(x=>x.actor.id), ['x','n']);
 assert.equal(g[2].name,'Wächter');
 assert.equal(g[2].members.length,0);
});

test('Hidden NPCs and group documents cannot leak to a player',()=>{
 const groups=partyGroups({users,actors,canView:playerView,currentUserId:'u1'});
 assert.deepEqual(groups.map(x=>x.name), ['Player','Abenteuergruppe']);
 assert.deepEqual(groups[1].members.map(x=>x.actor.name), ['Begleiter']);
 assert.ok(!JSON.stringify(groups).includes('Geheimer Gegner'));
});

test('Zero players still produces Player section and no Actor mutations',()=>{
 const input=[{id:'gm',isGM:true,character:alice}];
 const result=partyGroups({users:input,actors:[alice],canView:gmView,currentUserId:'gm'});
 assert.equal(result[0].id,'player');
 assert.equal(result[0].members.length,0);
 assert.equal(alice.folder.name,'Spieler-Ordner');
});

test('Selected unassigned GM actor goes into a separate section',()=>{
 const groups=partyGroups({users,actors,canView:gmView,currentUserId:'gm',selectedActor:actor('unassigned','Einzelgänger',{type:'npc'})});
 assert.equal(groups.at(-1).name,'Ausgewählt');
 assert.equal(groups.at(-1).members[0].actor.id,'unassigned');
 assert.equal(groups[0].members.some(x=>x.actor.id==='unassigned'),false);
});

test('Foundry folder groups are separated from Player in actor directory',()=>{
 const g=actorDirectoryGroups({users,actors,canView:playerView,currentUserId:'u1'});
 assert.equal(g[0].name,'Player');
 assert.deepEqual(g[0].actors.map(x=>x.id),['a','b']);
 assert.ok(g.some(x=>x.name==='Verbündete' && x.actors.some(a=>a.id==='x')));
 assert.ok(!g.flatMap(x=>x.actors).some(a=>a.id==='n'));
});

test('Both Actor.id and plain actor ID in D&D5e Group.members resolve',()=>{
 const g=actor('group','Proben',{type:'group',system:{members:['Actor.a','x',{actor:{uuid:'Actor.b'}},'Compendium.bad.Actor.unknown']}});
 const members=nativeGroupMembers(g,new Map(actors.map(a=>[a.id,a])),gmView);
 assert.deepEqual(members.map(x=>x.actor.id),['a','x','b']);
});

test('Inactive users remain grouped under Player and permissions are preserved',()=>{
 const r=playerRoster(users, a=>a.id!=='b', 'u2');
 assert.deepEqual(r.map(x=>x.actor.id),['a']);
 assert.equal(r[0].online,true);
});