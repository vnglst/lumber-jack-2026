// Regressions for the problems the full-campaign playtest (tests/campaign.cjs) turned up.
const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction } = require('./harness.cjs');

// A quiet game with an open, explored meadow south-east of the camp; (x, y) is its centre.
function meadow(seed) {
  const lj = game(seed), g = lj.G, w = g.world;
  lj.cmd.stop(g.units);
  g.animalCd = 1e9;
  const x = w.start.x + 5, y = w.start.y + 5;
  for (let ty = y - 10; ty <= y + 10; ty++) for (let tx = x - 10; tx <= x + 10; tx++) {
    const n = ty * w.W + tx;
    if (tx < 1 || ty < 1 || tx >= w.W - 1 || ty >= w.H - 1 || w.bld[n] || lj.isRoad(w.type[n])) continue;
    w.obj[n] = 0; w.deco[n] = 0; w.type[n] = lj.T.GRASS; g.fog[n] = 1;
  }
  const at = (dx, dy) => (y + dy) * w.W + x + dx;
  const put = (u, tile) => { u.tile = tile; u.x = (tile % w.W) * 16 + 8; u.y = ((tile / w.W) | 0) * 16 + 10; u.path = []; };
  return { lj, g, w, at, put, jack: lj.jacks()[0] };
}
const wolf = { kind: 'wolf', alive: false, x: 0, y: 0 };

test('a bulldozer sent to an obstacle clears rock and water on its route, not every stump on the way', () => {
  const { lj, g, w, at, put } = meadow();
  g.money = 10000; g.wood = 1000; g.level = 4; g.stockpile = true;
  lj.buy('base'); finishConstruction(lj);
  assert.ok(lj.buy('dozer'));
  lj.cmd.stop(g.units);
  const dozer = g.units.find(u => u.kind === 'dozer');
  put(dozer, at(-6, 4));
  for (let dx = -5; dx <= 1; dx++) w.obj[at(dx, 4)] = lj.STUMP;          // a felled strip to drive over
  for (let dy = -10; dy <= 10; dy++) { w.type[at(-2, dy)] = lj.T.WATER; w.obj[at(-2, dy)] = 0; } // a stream across it
  w.type[at(2, 4)] = lj.T.ROCK;
  assert.ok(lj.cmd.dozeTo([dozer], at(2, 4)));
  const tiles = [...dozer.task.job.tiles];
  assert.ok(tiles.includes(at(2, 4)), 'the rock that was pointed at');
  assert.ok(tiles.some(t => w.type[t] === lj.T.WATER), 'the stream in the way');
  assert.ok(tiles.every(t => w.obj[t] !== lj.STUMP), 'no stumps: ' + tiles.length + ' tiles queued');
});

test('a building may not wall ground off from the road', () => {
  const { lj, g, w, at } = meadow();
  g.money = 5000; g.wood = 500;
  // A rock pen, 3x3 inside, whose only way in is a gap two tiles high on its east side.
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) === 2 && !(dx === 2 && (dy === 0 || dy === 1))) w.type[at(dx, dy)] = lj.T.ROCK;
  }
  const money = g.money, built = g.buildings.length;
  g.place = { kind: 'bunk', w: 2, h: 2 };
  assert.equal(lj.tryPlace((at(2, 0) % w.W), (at(2, 0) / w.W) | 0), false, 'plugging the gap is refused');
  assert.equal(g.buildings.length, built);
  assert.equal(g.money, money);
  assert.equal(w.bld[at(2, 0)], 0);
  w.type[at(-2, 0)] = lj.T.GRASS; // a second way in: now the same spot is fine
  g.place = { kind: 'bunk', w: 2, h: 2 };
  assert.equal(lj.tryPlace((at(2, 0) % w.W), (at(2, 0) / w.W) | 0), true);
});

test('a jack standing on a hemmed-in building site still steps out of the new building', () => {
  const { lj, g, w, at, put, jack } = meadow();
  g.money = 5000; g.wood = 500;
  put(jack, at(0, 0));
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [-1, 1]]) w.type[at(dx, dy)] = lj.T.ROCK; // rock on his side of the site
  g.place = { kind: 'bunk', w: 2, h: 2 };
  assert.equal(lj.tryPlace(at(0, 0) % w.W, (at(0, 0) / w.W) | 0), true);
  assert.equal(w.bld[jack.tile], 0, 'not inside the building');
  assert.ok(lj.pass(jack.tile));
});

test('a hauler who cannot reach the market puts his load back into stock', () => {
  const { lj, g, w, at, put, jack } = meadow();
  put(jack, at(0, 0));
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) w.type[at(dx, dy)] = lj.T.ROCK;
  jack.load = { w: 5, l: 2, s: 1 };
  const wood = g.wood, lumber = g.lumber, stone = g.stone;
  lj.cmd.sell([jack]);
  step(lj, 0.5);
  assert.equal(jack.load, null);
  assert.deepEqual([g.wood - wood, g.lumber - lumber, g.stone - stone], [5, 2, 1]);
});

function hutInTheTrees(rifles) {
  const lj = game(), g = lj.G, w = g.world, hut = g.huts[0], jack = lj.jacks()[0];
  lj.cmd.stop(g.units);
  g.animalCd = 1e9; g.up.rifles = rifles;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 10; dx++) {
    const n = hut.tile + dy * w.W + dx;
    w.bld[n] = w.wall[n] = 0; w.type[n] = lj.T.GRASS; g.fog[n] = 1;
    w.obj[n] = Math.max(Math.abs(dx), Math.abs(dy)) === 1 ? 1 : 0; // trees on every side of the hut
  }
  jack.tile = hut.tile + 9; jack.x = hut.x + 144; jack.y = hut.y; jack.hp = 1e6; // out of range: he has to walk closer
  return { lj, g, hut, jack };
}

test('jacks with lasers attack a hut from range when the trees around it leave no room beside it', () => {
  const { lj, hut, jack } = hutInTheTrees(true);
  lj.cmd.hunt([jack], hut);
  until(lj, () => hut.hp < hut.max, 20);
});

test('jacks who cannot get within reach of a hut say so and stop, instead of waiting for ever', () => {
  const { lj, hut, jack } = hutInTheTrees(false);
  lj.cmd.hunt([jack], hut);
  until(lj, () => !(jack.task && jack.task.a === hut), 5); // he may well turn on the hut's defenders instead
  assert.equal(hut.hp, hut.max);
});

test('losing the whole crew only ends the game when no new jack can be hired', () => {
  const lj = game(), g = lj.G, toasts = [];
  let over = false;
  lj.ui.gameOver = () => { over = true; };
  lj.ui.toast = t => toasts.push(t);
  g.animalCd = 1e9; g.money = 500;
  for (const j of lj.jacks()) lj.hurtUnit(j, 1e6, wolf);
  step(lj, 0.2);
  assert.equal(lj.jacks().length, 0);
  assert.equal(over, false, 'money for a new jack: carry on');
  assert.ok(toasts.some(t => /crew is gone/.test(t)));
  g.money = 0; g.wood = 400;
  step(lj, 0.2);
  assert.equal(over, lj.countKind('truck') === 0, 'a truck with goods to sell: carry on');
  g.wood = 0; g.lumber = 0; g.stone = 0;
  for (const u of g.units) u.load = null;
  step(lj, 0.2);
  assert.equal(over, true, 'broke with nothing to sell: the forest wins');
});

test('a badly hurt jack falls back to camp, heals and is not sent back again by the same wound', () => {
  const { lj, g, w, at, put, jack } = meadow();
  put(jack, at(5, 5));
  jack.hold = false; // (a jack told to stop stays where he is, hurt or not)
  lj.hurtUnit(jack, 70, wolf);
  assert.equal(jack.task && jack.task.type, 'retreat');
  until(lj, () => !jack.task, 60);
  assert.ok(jack.hp >= 80);
  assert.ok(Math.hypot(jack.tile % w.W - (g.base.tx + 1), ((jack.tile / w.W) | 0) - (g.base.ty + 1)) <= 6, 'resting at the camp');

  // The player's word comes first: ordered back out while still hurt, he stays on that order when hit again.
  put(jack, at(5, 5));
  lj.hurtUnit(jack, 60, wolf);
  assert.equal(jack.task.type, 'retreat');
  w.obj[at(8, 8)] = 1;
  lj.cmd.chop([jack], at(8, 8)); // any new order
  lj.hurtUnit(jack, 5, wolf);
  assert.notEqual(jack.task && jack.task.type, 'retreat');
});
