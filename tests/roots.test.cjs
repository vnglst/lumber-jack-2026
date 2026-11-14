const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction, storage } = require('./harness.cjs');

function dozerGame() {
  const lj = game(), g = lj.G;
  lj.cmd.stop(g.units);
  g.money = 10000; g.wood = 1000; g.level = 4; g.stockpile = true; g.animalCd = 1e9;
  lj.buy('base'); finishConstruction(lj);
  assert.ok(lj.buy('dozer'));
  lj.cmd.stop(g.units);
  return { lj, g, w: g.world, dozer: g.units.find(u => u.kind === 'dozer') };
}

function position(u, tile, w) {
  u.tile = tile; u.x = tile % w.W * 16 + 8; u.y = ((tile / w.W) | 0) * 16 + 10;
}

function clearing() {
  const f = dozerGame(), { g, w, lj, dozer } = f;
  const x = w.start.x + 4, y = w.start.y + 4;
  // Controlled clearing for batching, material and transport checks.
  for (let ty = y - 10; ty <= y + 10; ty++) for (let tx = x - 10; tx <= x + 10; tx++) {
    const n = ty * w.W + tx;
    if (tx < 1 || ty < 1 || tx >= w.W - 1 || ty >= w.H - 1 || w.bld[n] || lj.isRoad(w.type[n])) continue;
    w.obj[n] = 0; w.type[n] = lj.T.GRASS; w.lush[n] = 1; w.wear[n] = 0;
    w.deco[n] = w.flower[n] = 1; g.fog[n] = 1;
  }
  const root = y * w.W + x;
  w.obj[root] = lj.STUMP;
  position(dozer, root - 1, w);
  return { ...f, root };
}

test('a genuinely felled tree can be uprooted once for wood, then becomes barren mud', () => {
  const { lj, g, w, dozer } = dozerGame(), jack = lj.jacks()[0];
  const root = w.obj.findIndex((o, n) => lj.isTree(n) && g.fog[n] && lj.bfs(jack.tile, c => Math.abs(c % w.W - n % w.W) + Math.abs(((c / w.W) | 0) - ((n / w.W) | 0)) === 1));
  assert.ok(root >= 0);
  lj.cmd.chop([jack], root);
  until(lj, () => w.obj[root] === lj.STUMP, 30);
  lj.cmd.stop([jack]);
  const cleared = g.cleared, wood = g.wood;
  assert.ok(lj.cmd.dozeTo([dozer], root));
  until(lj, () => w.obj[root] === 0, 60);
  assert.equal(w.type[root], lj.T.MUD);
  assert.equal(w.lush[root], 0);
  assert.equal(w.flower[root], 0);
  assert.equal(w.deco[root], 0);
  assert.ok(w.wear[root] >= 80);
  assert.equal(dozer.carry, 2);
  assert.equal(g.wood, wood);
  assert.equal(g.cleared, cleared);
  assert.equal(dozer.xp, 0);
  until(lj, () => g.wood === wood + 2, 60);
  step(lj, 5);
  assert.equal(g.wood, wood + 2);
  assert.equal(lj.canDoze(root), false);
  assert.ok(lj.pass(root));
  assert.ok(lj.canWall(root));
});

test('roots take time and Stop prevents completion and automatic restart', () => {
  const { lj, g, w, dozer, root } = clearing();
  const wood = g.wood;
  lj.cmd.dozeTo([dozer], root);
  until(lj, () => dozer.state === 'doze', 5);
  step(lj, 1);
  assert.equal(w.obj[root], lj.STUMP);
  assert.equal(lj.statusOf(dozer), 'Uprooting roots');
  lj.cmd.stop([dozer]); step(lj, 5);
  assert.equal(w.obj[root], lj.STUMP);
  assert.equal(g.wood, wood);
  assert.equal(dozer.carry, 0);
  assert.ok(dozer.hold);
});

test('idle bulldozers batch nearby roots, deliver full and partial loads, and never exceed capacity', () => {
  const { lj, g, w, dozer, root } = clearing(), roots = [];
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 5; dx++) {
    const n = root + dy * w.W + dx;
    w.obj[n] = lj.STUMP; roots.push(n);
  }
  const wood = g.wood;
  dozer.hold = false;
  let full = false;
  for (let i = 0; i < 180 / 0.05 && g.wood < wood + 20; i++) {
    lj.update(0.05);
    assert.ok(dozer.carry <= 16);
    if (dozer.carry === 16) full = true;
  }
  assert.ok(full);
  assert.equal(g.wood, wood + 20);
  assert.equal(dozer.carry, 0);
  assert.ok(roots.every(n => w.obj[n] === 0 && w.type[n] === lj.T.MUD));
  step(lj, 5);
  assert.equal(g.wood, wood + 20);
});

test('two bulldozers sharing a stump cannot duplicate its reward', () => {
  const { lj, g, w, dozer, root } = clearing();
  assert.ok(lj.buy('dozer'));
  const other = g.units.filter(u => u.kind === 'dozer')[1];
  lj.cmd.stop([other]); position(other, root - w.W, w);
  const wood = g.wood;
  lj.cmd.dozeTo([dozer, other], root);
  until(lj, () => g.wood === wood + 2, 30);
  step(lj, 8);
  assert.equal(g.wood, wood + 2);
  assert.equal(dozer.carry + other.carry, 0);
});

test('a root load can go through a waiting Logging Truck before entering village stock', () => {
  const { lj, g, w, dozer, root } = clearing();
  assert.ok(lj.buy('shuttle'));
  const truck = g.units.find(u => u.kind === 'shuttle');
  lj.cmd.stop([truck]); position(truck, root + 1, w);
  lj.cmd.move([truck], root + 1);
  assert.equal(truck.state, 'shuttleLoad');
  const wood = g.wood;
  lj.cmd.dozeTo([dozer], root);
  until(lj, () => truck.carry === 2, 10);
  assert.equal(dozer.carry, 0);
  assert.equal(g.wood, wood);
  until(lj, () => g.wood === wood + 2, 30);
  assert.equal(truck.carry, 0);
});

test('root cargo and muddy terrain survive save/load without a second payout', () => {
  const { lj, g, w, dozer, root } = clearing();
  const wood = g.wood;
  lj.cmd.dozeTo([dozer], root);
  until(lj, () => dozer.carry === 2, 10);
  lj.cmd.stop([dozer]);
  lj.saveGame();
  assert.equal(JSON.parse(storage(lj).getItem('lumberjack-save')).v, 6);
  assert.ok(lj.loadGame());
  const restored = g.units.find(u => u.kind === 'dozer');
  assert.equal(restored.carry, 2);
  assert.ok(restored.hold);
  assert.equal(g.world.obj[root], 0);
  assert.equal(g.world.type[root], lj.T.MUD);
  assert.equal(g.world.lush[root], 0);
  step(lj, 3);
  assert.equal(g.wood, wood);
  // Resume with one fresh stump; the consumed stump must not pay out again.
  g.world.obj[root + 1] = lj.STUMP;
  assert.ok(lj.cmd.dozeTo([restored], root + 1));
  until(lj, () => g.wood === wood + 4, 30);
  step(lj, 5);
  assert.equal(g.wood, wood + 4);
});

test('a pending root-clearing order survives save/load', () => {
  const { lj, g, w, dozer, root } = clearing();
  lj.cmd.dozeTo([dozer], root);
  until(lj, () => dozer.state === 'doze', 5);
  step(lj, 1); lj.saveGame();
  assert.ok(lj.loadGame());
  assert.equal(g.world.obj[root], lj.STUMP);
  const restored = g.units.find(u => u.kind === 'dozer');
  assert.equal(restored.task.type, 'doze');
  assert.ok(restored.task.job.tiles.has(root));
  until(lj, () => g.world.type[root] === lj.T.MUD, 10);
});

test('a bulldozer loaded with roots resumes its delivery after saving', () => {
  const { lj, g, dozer, root } = clearing(), wood = g.wood;
  lj.cmd.dozeTo([dozer], root);
  until(lj, () => dozer.carry === 2, 10);
  lj.saveGame();
  assert.ok(lj.loadGame());
  const restored = g.units.find(u => u.kind === 'dozer');
  assert.equal(restored.carry, 2);
  assert.equal(restored.task.type, 'doze');
  until(lj, () => g.wood === wood + 2, 30);
  assert.equal(restored.carry, 0);
});

test('a bulldozer can explicitly uproot the stump under its own tracks', () => {
  const { lj, g, w, dozer, root } = clearing(), wood = g.wood;
  position(dozer, root, w);
  assert.ok(lj.cmd.dozeTo([dozer], root));
  until(lj, () => w.type[root] === lj.T.MUD, 10);
  until(lj, () => g.wood === wood + 2, 30);
});

test('rock and water clearing still work, while standing trees are not bulldozed', () => {
  const { lj, g, w, dozer, root } = clearing();
  w.obj[root] = 0;
  const rock = root + 1, water = root + 2, tree = root - w.W;
  w.type[rock] = lj.T.ROCK; w.type[water] = lj.T.WATER;
  w.obj[tree] = 1; w.hp[tree] = 1;
  const wood = g.wood, stone = g.stone;
  assert.equal(lj.cmd.dozeTo([dozer], tree), false);
  assert.equal(w.obj[tree], 1);
  assert.ok(lj.cmd.dozeTo([dozer], water));
  until(lj, () => w.type[rock] === lj.T.GRAVEL && w.type[water] === lj.T.GRAVEL, 30);
  assert.equal(g.stone, stone + 2);
  assert.equal(g.wood, wood);
  assert.equal(w.obj[tree], 1);
});
