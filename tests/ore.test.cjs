// Ore: seeded veins in the rock, mining with pickaxes, and ore in the shop, the market and saves.
const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction, storage, put } = require('./harness.cjs');

// A quiet game with an open, explored meadow south-east of the camp and one ore-bearing rock in it.
function quarry(ore = 3) {
  const lj = game(), g = lj.G, w = g.world;
  lj.cmd.stop(g.units);
  g.animalCd = 1e9;
  const x = w.start.x + 5, y = w.start.y + 5;
  for (let ty = y - 10; ty <= y + 10; ty++) for (let tx = x - 10; tx <= x + 10; tx++) {
    const n = ty * w.W + tx;
    if (tx < 1 || ty < 1 || tx >= w.W - 1 || ty >= w.H - 1 || w.bld[n] || lj.isRoad(w.type[n])) continue;
    w.obj[n] = 0; w.deco[n] = 0; w.type[n] = lj.T.GRASS; g.fog[n] = 1; g.veins[n] = 0;
  }
  const rock = (y + 2) * w.W + x + 2;
  w.type[rock] = lj.T.ROCK; g.veins[rock] = ore;
  const jack = lj.jacks()[0], truck = g.units.find(u => u.kind === 'truck');
  put(jack, rock - 2, w);
  return { lj, g, w, rock, jack, truck };
}

test('veins are seeded from the map seed, only in rock, and the same every time', () => {
  for (const seed of [1, 42, 12345]) {
    const a = game(seed, false).G, b = game(seed, false).G;
    assert.deepEqual([...a.veins], [...b.veins]);
    const tiles = [...a.veins].map((v, i) => [v, i]).filter(([v]) => v > 0);
    assert.ok(tiles.length >= 9, 'seed ' + seed + ' has ' + tiles.length + ' ore tiles');
    for (const [v, i] of tiles) {
      assert.equal(a.world.type[i], 3, 'ore sits in rock');
      assert.ok(v >= 5 && v <= 10);
    }
    assert.equal(a.ore, 0);
  }
});

test('mining needs pickaxes; a jack then digs the ore out, carries it to camp and the spent rock becomes gravel', () => {
  const { lj, g, w, rock, jack } = quarry(3);
  assert.equal(lj.cmd.mine([jack], rock), false, 'no pickaxes yet');
  g.up.pick = true;
  const stone = g.stone;
  assert.equal(lj.cmd.mine([jack], rock), true);
  until(lj, () => g.veins[rock] === 0, 30);
  assert.equal(g.ore, 0, 'still on his back');
  assert.equal(jack.ore, 3);
  assert.equal(w.type[rock], lj.T.GRAVEL);
  assert.ok(lj.pass(rock));
  assert.equal(g.stone, stone + 1);
  until(lj, () => g.ore === 3, 60);
  assert.equal(jack.ore, 0);
  assert.equal(jack.task, null, 'nothing left to mine in sight');
});

test('a jack takes a full load of ore home and comes back for the rest', () => {
  const { lj, g, rock, jack } = quarry(8);
  g.up.pick = true;
  lj.cmd.mine([jack], rock);
  until(lj, () => g.ore === 6, 120);
  assert.equal(g.veins[rock], 2);
  until(lj, () => g.ore === 8, 120);
});

test('upgrades that cost ore cannot be bought without it and take it from stock', () => {
  const { lj, g } = quarry();
  g.level = 6; g.money = 5000; g.up.rifles = true;
  const scope = lj.SHOP.find(it => it.id === 'scope');
  assert.equal(lj.shopState(scope).st, 'cant');
  assert.match(lj.shopState(scope).label, /10 ore/);
  g.ore = 12;
  assert.equal(lj.shopState(scope).st, 'ok');
  assert.ok(lj.buy('scope'));
  assert.equal(g.ore, 2);
});

test('the truck sells ore above the building reserve at the ore price', () => {
  const { lj, g, truck } = quarry();
  g.wood = 0; g.lumber = 0; g.stone = 0; g.ore = 40;
  const earned = g.earned;
  lj.cmd.sell([truck]);
  until(lj, () => g.earned > earned, 240);
  assert.equal(g.earned - earned, 15 * lj.PRICE.ore);
  assert.equal(g.ore, 25, 'the reserve stays');
});

test('a market order for ore is filled by ore, reserve included', () => {
  const { lj, g, truck } = quarry();
  g.wood = 0; g.lumber = 0; g.stone = 0; g.ore = 6;
  g.order = { kind: 'ore', qty: 6, got: 0, state: 'active', ttl: 0, time: 600, bonus: 60 };
  const earned = g.earned;
  lj.cmd.sell([truck]);
  until(lj, () => !g.order, 240);
  assert.equal(g.earned - earned, 6 * lj.PRICE.ore + 60);
  assert.equal(g.ore, 0);
});

test('a bulldozer clearing an ore rock brings the ore in with the stone', () => {
  const { lj, g, w, rock } = quarry(7);
  g.money = 10000; g.wood = 1000; g.level = 4; g.stockpile = true;
  lj.buy('base'); finishConstruction(lj);
  assert.ok(lj.buy('dozer'));
  lj.cmd.stop(g.units);
  const dozer = g.units.find(u => u.kind === 'dozer');
  put(dozer, rock - 1, w);
  assert.ok(lj.cmd.dozeTo([dozer], rock));
  until(lj, () => w.type[rock] !== lj.T.ROCK, 30);
  assert.equal(g.ore, 7);
  assert.equal(g.veins[rock], 0);
});

test('ore in stock, on a jack and left in the rock survives saving; older saves gain veins in the rock still standing', () => {
  const { lj, g, w, rock, jack } = quarry(9);
  g.up.pick = true; g.ore = 4;
  lj.cmd.mine([jack], rock);
  until(lj, () => jack.ore === 2, 30);
  const other = g.veins.findIndex((v, i) => v > 0 && i !== rock), amount = g.veins[other];
  lj.saveGame();
  const store = storage(lj), saved = JSON.parse(store.getItem('lumberjack-save'));
  assert.ok(lj.loadGame());
  assert.equal(lj.G.ore, 4);
  assert.equal(lj.G.veins[rock], 7);
  assert.equal(lj.G.veins[other], amount);
  const back = lj.jacks()[0];
  assert.equal(back.ore, 2);
  assert.equal(back.task.type, 'mine');
  until(lj, () => lj.G.ore >= 6, 120); // he carries on where he left off

  const old = JSON.parse(JSON.stringify(saved));
  old.v = 8; delete old.veins; delete old.g.ore; old.units.forEach(u => delete u.ore);
  store.setItem('lumberjack-save', JSON.stringify(old));
  assert.ok(lj.loadGame());
  assert.equal(lj.G.ore, 0);
  assert.equal(lj.jacks()[0].ore, 0);
  assert.equal(lj.G.veins[other], amount, 'seeded veins appear in standing rock');
  for (let i = 0; i < w.N; i++) if (lj.G.veins[i]) assert.equal(lj.G.world.type[i], lj.T.ROCK);
});
