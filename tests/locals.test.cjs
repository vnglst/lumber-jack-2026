const test = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./harness.cjs');

test('peaceful neighbours finish a shared destination instead of flickering in place', () => {
  const lj = game(), g = lj.G, h = g.huts[0];
  g.critters = [-8, 8].map(dx => Object.assign(lj.critters.make('native', h.x + dx, h.y + 32, 1, 0),
    { home: h.tile, moving: true, tx: h.x, ty: h.y + 32 }));
  let flips = 0;
  for (let i = 0; i < 40; i++) {
    const dirs = g.critters.map(c => c.dir);
    lj.critters.update(0.05);
    flips += g.critters.filter((c, k) => c.dir !== dirs[k]).length;
  }
  assert.ok(g.critters.every(c => !c.moving), 'both locals settle at their destination');
  assert.ok(flips < 4, 'no repeated left/right flicker');
});

test('returned defenders rest inside instead of endlessly walking against separation', () => {
  const lj = game(), g = lj.G, h = g.huts[0];
  g.units = []; g.buildings = []; g.critters = [];
  lj.combat.angerHut(h); lj.combat.update(0.05);
  const guards = g.animals.filter(a => a.home === h.tile);
  for (const a of guards) Object.assign(a, { x: h.x, y: h.y, tile: h.tile + 1, path: [], tg: null });
  const before = guards.map(a => a.walkT);
  for (let i = 0; i < 60; i++) lj.combat.update(0.05);
  assert.ok(guards.every((a, k) => a.walkT === before[k]), 'resting locals do not animate a stuck walk');
  assert.ok(guards.every(a => a.x === h.x && a.y === h.y), 'indoor locals are not pushed out');
  assert.ok(guards.every(a => a.tile === h.tile), 'route origin stays in sync on arrival');
  const jack = { kind: 'truck', x: h.x + 32, y: h.y, tile: h.tile + 2, hp: 1000 };
  g.units.push(jack);
  for (const a of guards) a.retarget = 0;
  lj.combat.update(0.05);
  assert.ok(guards.every(a => a.tg && !lj.combat.insideHut(a)), 'resting defenders respond to intruders');
});

test('peaceful locals can leave home again after resting indoors', () => {
  const lj = game(), g = lj.G, h = g.huts[0];
  const c = Object.assign(lj.critters.make('native', h.x, h.y, 1, 0), { home: h.tile });
  g.critters = [c];
  assert.ok(lj.combat.insideHut(c));
  let outside = false;
  for (let i = 0; i < 1200; i++) {
    lj.critters.update(0.05);
    if (!lj.combat.insideHut(c)) outside = true;
  }
  assert.ok(outside, 'indoor residents still go outside');
});
