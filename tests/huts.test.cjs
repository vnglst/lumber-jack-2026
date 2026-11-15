const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, storage } = require('./harness.cjs');

function village() {
  const lj = game(), g = lj.G, w = g.world, hut = g.huts[0], jack = lj.jacks()[0];
  lj.cmd.stop(g.units);
  g.animalCd = 1e9;
  // Open a small combat lane without removing the hut.
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 3; dx++) {
    const n = hut.tile + dy * w.W + dx;
    w.obj[n] = w.bld[n] = w.wall[n] = 0; w.type[n] = lj.T.GRASS; g.fog[n] = 1;
  }
  jack.tile = hut.tile + 2; jack.x = hut.x + 32; jack.y = hut.y; jack.hp = 10000;
  return { lj, g, w, hut, jack };
}

test('new maps contain more huts, away from the opening camp and market road', () => {
  for (const seed of [1, 42, 12345]) {
    const lj = game(seed), g = lj.G, w = g.world;
    assert.ok(g.huts.length > 7);
    for (const h of g.huts) {
      assert.ok(h.alive);
      assert.equal(w.deco[h.tile], 8);
      assert.ok(Math.hypot(h.x / 16 - w.start.x, h.y / 16 - w.start.y) > 20);
    }
    assert.ok(!g.huts.some(h => h.angry));
  }
});

test('approaching a hut angers only that village, even at level 1; defenders keep returning', () => {
  const { lj, g, hut } = village();
  lj.combat.update(0.05);
  assert.equal(g.level, 1);
  assert.ok(hut.angry);
  assert.ok(g.huts.slice(1).every(h => !h.angry));
  assert.equal(g.wave.hostile, false);
  const guards = () => g.animals.filter(a => a.alive && a.defender && a.home === hut.tile);
  assert.equal(guards().length, 2);
  for (const a of guards()) lj.hurtAnimal(a, 9999);
  step(lj, 21);
  assert.equal(guards().length, 2);
  // Neither wave morale/time limits nor a successful raid dismiss the defenders.
  g.time += 200;
  lj.combat.raid(); lj.combat.update(0.05);
  assert.ok(guards().every(a => !a.retreat));
});

test('defenders damage nearby machines but do not chase retreating units across the map', () => {
  const { lj, g, hut, jack } = village();
  jack.kind = 'truck';
  const hp = jack.hp;
  until(lj, () => jack.hp < hp, 5);
  const guards = g.animals.filter(a => a.defender && a.home === hut.tile);
  assert.ok(guards.length);
  jack.x = g.base.tx * 16; jack.y = g.base.ty * 16; jack.tile = g.base.ty * g.world.W + g.base.tx;
  step(lj, 5);
  assert.ok(guards.every(a => !a.tg));
  assert.ok(guards.every(a => Math.hypot(a.x - hut.x, a.y - hut.y) < 9 * 16));
  assert.ok(guards.every(a => a.alive && !a.retreat));
});

test('Jacks can destroy a hut; its source stays gone while other villages still defend', () => {
  const { lj, g, w, hut, jack } = village();
  // Isolate the actual hut attack from guards for a deterministic destruction check.
  hut.spawnCd = 1e6;
  lj.cmd.hunt([jack], hut);
  until(lj, () => !hut.alive, 40);
  assert.equal(w.deco[hut.tile], 0);
  assert.equal(lj.combat.hutAt(hut.tile), null);
  assert.equal(g.folkKilled, 0);
  assert.equal(g.kills, 0);
  assert.equal(g.huts.filter(h => h.alive).length, g.huts.length - 1);
  lj.cmd.stop([jack]);
  step(lj, 25);
  assert.ok(!g.animals.some(a => a.alive && a.home === hut.tile));
  const other = g.huts[1];
  jack.x = other.x + 32; jack.y = other.y; jack.tile = other.tile;
  lj.combat.update(0.05);
  assert.ok(other.angry);
  assert.ok(g.animals.some(a => a.alive && a.home === other.tile));
});

test('destroyed huts stop all future war parties; there is no forest fallback spawn', () => {
  const { lj, g } = village();
  for (const h of g.huts) lj.combat.hurtHut(h, 9999);
  g.level = 6; g.wave.hostile = true; g.wave.next = g.time;
  lj.combat.update(0);
  assert.equal(lj.combat.nextWaveIn(), null);
  assert.equal(g.wave.active, null);
  assert.ok(!g.animals.some(a => a.alive && a.kind === 'native'));
});

test('a surviving village still defends even when almost all trees are gone', () => {
  const { lj, g, hut } = village();
  g.cleared = g.total - 3;
  lj.combat.update(0.05);
  assert.ok(g.animals.some(a => a.alive && a.defender && a.home === hut.tile));
  assert.equal(g.wave.hostile, false);
});

test('destroying a hut sends its surviving locals away, without dismissing another village', () => {
  const { lj, g, hut } = village();
  const other = g.huts[1];
  lj.combat.angerHut(other);
  lj.combat.update(0.05);
  const guards = g.animals.filter(a => a.home === hut.tile);
  assert.ok(guards.length);
  lj.combat.hurtHut(hut, 9999);
  assert.ok(guards.every(a => a.retreat));
  step(lj, 3);
  assert.ok(!g.animals.some(a => a.alive && a.home === hut.tile));
  assert.ok(g.animals.some(a => a.alive && a.home === other.tile && !a.retreat));
});

test('laser bolts damage huts through the same attack order as axes', () => {
  const { lj, g, hut, jack } = village();
  g.up.rifles = true; hut.spawnCd = 1e6;
  lj.cmd.hunt([jack], hut);
  until(lj, () => hut.hp < hut.max, 2);
  assert.ok(hut.alive);
  until(lj, () => !hut.alive, 20);
  assert.equal(g.folkKilled, 0);
});

test('building or wall placement cannot erase a living hut', () => {
  const { lj, g, w, hut } = village();
  g.place = { w: 1, h: 1 };
  assert.equal(lj.canPlace(hut.tile % w.W, (hut.tile / w.W) | 0), false);
  assert.equal(lj.canWall(hut.tile), false);
  lj.combat.hurtHut(hut, 9999);
  assert.equal(lj.canPlace(hut.tile % w.W, (hut.tile / w.W) | 0), true);
  assert.equal(lj.canWall(hut.tile), true);
});

test('raiding parties originate only from surviving huts', () => {
  const lj = game(), g = lj.G;
  for (const h of g.huts.slice(0, 3)) lj.combat.hurtHut(h, 9999);
  g.level = 6; g.wave.hostile = true; g.wave.next = g.time;
  lj.combat.update(0);
  assert.ok(g.wave.active);
  const raiders = g.animals.filter(a => a.wave === g.wave.n);
  assert.ok(raiders.length);
  assert.ok(raiders.every(a => lj.combat.hutAt(a.home)));
});

test('hut damage, anger and permanent destruction survive save/load', () => {
  const { lj, g, hut } = village();
  lj.combat.hurtHut(hut, 9999);
  const other = g.huts[1];
  lj.combat.hurtHut(other, 20);
  lj.saveGame();
  assert.equal(JSON.parse(storage(lj).getItem('lumberjack-save')).v, 9);
  assert.ok(lj.loadGame());
  assert.equal(g.huts[0].alive, false);
  assert.equal(g.world.deco[hut.tile], 0);
  assert.equal(g.huts[1].hp, other.hp);
  assert.ok(g.huts[1].angry);
  assert.ok(!g.critters.some(c => c.kind === 'native' && !c.gone && c.home === hut.tile));
  step(lj, 21);
  assert.ok(!g.animals.some(a => a.alive && a.home === hut.tile));
  assert.ok(g.animals.some(a => a.alive && a.home === other.tile));
});

test('format 6 saves retain the original seven-hut map, trees and progression', () => {
  const lj = game(), g = lj.G;
  // A legacy map and save have neither a hut-generation setting nor hut state.
  lj.newGame(42);
  const old = lj.genWorld(42);
  until(lj, () => !g.arrival, 180);
  lj.saveGame();
  const save = JSON.parse(storage(lj).getItem('lumberjack-save'));
  save.v = 6; delete save.g.huts; delete save.g.hutLimit;
  save.seed = old.seed;
  for (const key of Object.keys(save.world)) save.world[key] = Buffer.from(old[key].buffer).toString('base64');
  save.lush = Buffer.from(Uint8Array.from(old.lush, v => Math.round(v * 255))).toString('base64');
  save.chopping = []; save.critters = [];
  storage(lj).setItem('lumberjack-save', JSON.stringify(save));
  assert.ok(lj.loadGame());
  assert.equal(g.huts.length, 7);
  assert.equal(g.total, old.totalTrees);
  assert.deepEqual(Array.from(g.world.obj), Array.from(old.obj));
});

test('a legacy building-covered hut never becomes an invisible defender source', () => {
  const lj = game(), g = lj.G, old = lj.genWorld(42), tile = old.huts[0];
  lj.saveGame();
  const save = JSON.parse(storage(lj).getItem('lumberjack-save'));
  save.v = 6;
  for (const key of ['huts', 'hutLimit', 'finds', 'recipes']) delete save.g[key];
  save.seed = old.seed;
  old.bld[tile] = 2;
  for (const key of Object.keys(save.world)) save.world[key] = Buffer.from(old[key].buffer).toString('base64');
  save.lush = Buffer.from(Uint8Array.from(old.lush, v => Math.round(v * 255))).toString('base64');
  save.chopping = []; save.critters = [];
  const tx = tile % old.W, ty = Math.floor(tile / old.W);
  save.buildings.push({ kind: 'bunk', tx, ty, w: 1, h: 1, hp: 160, max: 160, queue: [] });
  const jack = save.units.find(u => u.kind === 'jack');
  jack.tile = tile - 1; jack.x = tx * 16 - 8; jack.y = ty * 16 + 10; jack.task = null; jack.hold = true;
  storage(lj).setItem('lumberjack-save', JSON.stringify(save));
  assert.ok(lj.loadGame());
  assert.equal(g.world.deco[tile], 0);
  assert.equal(g.huts.find(h => h.tile === tile).alive, false);
  assert.equal(lj.combat.hutAt(tile), null);
  step(lj, 21);
  assert.ok(!g.animals.some(a => a.alive && a.home === tile));
  assert.ok(!g.critters.some(c => !c.gone && c.kind === 'native' && c.home === tile));
});
