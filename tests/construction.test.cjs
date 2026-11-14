const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction, storage } = require('./harness.cjs');

function village() {
  const lj = game(), g = lj.G;
  lj.cmd.stop(g.units);
  g.money = 10000; g.wood = 1000; g.lumber = 500; g.level = 6; g.stockpile = true;
  g.animalCd = 1e9; g.wave.hostile = true; g.wave.next = 1e9;
  assert.ok(lj.buy('base'));
  finishConstruction(lj);
  return lj;
}

function place(lj, kind) {
  const w = lj.G.world;
  assert.equal(lj.buy(kind), 'place');
  for (let y = 1; y < w.H - 2; y++) for (let x = 1; x < w.W - 3; x++) {
    if (lj.canPlace(x, y) && lj.tryPlace(x, y)) return lj.G.buildings.at(-1);
  }
  throw Error('No reachable test building site');
}

test('base upgrades cost once, take time, and only grant the new tier on completion', () => {
  const lj = game(), g = lj.G;
  lj.cmd.stop(g.units);
  g.money = 1000; g.wood = 20;
  const cap = lj.popCap();
  assert.ok(lj.buy('base'));
  assert.equal(g.money, 880);
  assert.equal(g.wood, 0);
  assert.equal(g.tier, 0);
  assert.equal(g.village, null);
  assert.equal(lj.popCap(), cap);
  assert.equal(lj.buy('base'), false);
  assert.equal(g.money, 880);
  step(lj, 14);
  assert.equal(g.tier, 0);
  until(lj, () => g.tier === 1, 2);
  assert.equal(g.village, g.base);
  assert.equal(lj.popCap(), 4);
  assert.equal(g.base.construction, null);
  assert.equal(g.money, 880);
});

test('an existing Cabin keeps storage and training while its Lodge is built', () => {
  const lj = village(), g = lj.G;
  const oldCap = lj.popCap(), oldCount = lj.jackCount();
  assert.ok(lj.buy('jack'));
  assert.ok(lj.buy('base'));
  assert.equal(g.tier, 1);
  assert.equal(lj.popCap(), oldCap);
  assert.ok(lj.buildingReady(g.base));
  assert.ok(g.storeMask.some(Boolean));
  step(lj, 11);
  assert.equal(g.tier, 1);
  assert.equal(g.village.queue.length, 0);
  assert.equal(lj.jackCount(), oldCount + 1);
  finishConstruction(lj);
  assert.equal(g.tier, 2);
  assert.equal(lj.popCap(), 7);
  assert.ok(g.stockpile); // An upgrade must not silently resume market loading.
});

test('sawmills reserve their site but cannot process or reveal extra land early', () => {
  const lj = village(), g = lj.G;
  const fog = g.fogLeft, money = g.money, wood = g.wood;
  const mill = place(lj, 'sawmill');
  assert.equal(g.money, money - 150);
  assert.equal(g.wood, wood - 20);
  assert.equal(g.count.sawmill, 0);
  assert.equal(lj.buildingReady(mill), false);
  assert.equal(g.fogLeft, fog);
  assert.equal(g.sawMask.some(Boolean), false);
  assert.equal(lj.pass(mill.ty * g.world.W + mill.tx), false);
  lj.cmd.saw(lj.jacks());
  assert.equal(lj.jacks()[0].task, null);
  step(lj, 17);
  assert.equal(g.count.sawmill, 0);
  finishConstruction(lj);
  assert.equal(g.count.sawmill, 1);
  assert.ok(g.sawMask.some(Boolean));
  lj.cmd.saw(lj.jacks());
  until(lj, () => g.lumber > 500, 30);
});

test('unfinished housing counts for prices and limits, not population; destroyed sites never complete', () => {
  const lj = village(), g = lj.G, sites = [];
  for (let i = 0; i < 4; i++) sites.push(place(lj, 'bunk'));
  assert.equal(g.count.bunk, 0);
  assert.equal(lj.popCap(), 4);
  const item = lj.SHOP.find(it => it.id === 'bunk');
  assert.equal(item.cost().m, 550);
  assert.equal(lj.shopState(item).st, 'locked');
  lj.damageBuilding(sites[0], 9999);
  assert.equal(g.count.bunk, 0);
  assert.equal(lj.shopState(item).st, 'ok');
  finishConstruction(lj);
  assert.equal(g.count.bunk, 3);
  assert.equal(lj.popCap(), 13);
  step(lj, 20);
  assert.equal(g.count.bunk, 3);
});

test('an unfinished tower cannot fire and only reveals its extra range when ready', () => {
  const lj = village(), g = lj.G;
  const fog = g.fogLeft, tower = place(lj, 'tower');
  const target = { kind: 'wolf', alive: true, x: (tower.tx + 1) * 16, y: (tower.ty + 3) * 16, hp: 1000, max: 1000 };
  g.animals = [target];
  lj.combat.update(0.05);
  assert.equal(g.bolts.length, 0);
  assert.equal(g.fogLeft, fog);
  g.animals = [];
  finishConstruction(lj);
  assert.ok(g.fogLeft < fog);
  g.animals = [target];
  lj.combat.update(0.05);
  assert.ok(g.bolts.length > 0);
});

test('an unfinished tower does not grant its healing aura', () => {
  const lj = village(), g = lj.G, w = g.world, tower = place(lj, 'tower'), jack = lj.jacks()[0];
  const tile = w.type.findIndex((t, n) => {
    const x = n % w.W, y = (n / w.W) | 0;
    const nearTower = Math.abs(x - tower.tx - tower.w / 2) <= 4 && Math.abs(y - tower.ty - tower.h / 2) <= 4;
    const nearBase = Math.abs(x - g.base.tx - g.base.w / 2) <= 4 && Math.abs(y - g.base.ty - g.base.h / 2) <= 4;
    return lj.pass(n) && nearTower && !nearBase;
  });
  assert.ok(tile >= 0);
  jack.tile = tile; jack.x = tile % w.W * 16 + 8; jack.y = ((tile / w.W) | 0) * 16 + 10;
  jack.hp = 50;
  step(lj, 1);
  assert.ok(Math.abs(jack.hp - 50.4) < 0.001);
  finishConstruction(lj);
  jack.hp = 50;
  step(lj, 1);
  assert.ok(Math.abs(jack.hp - 55) < 0.001);
});

test('walls take time to reach full strength, and destroyed stakes stay destroyed', () => {
  const lj = village(), g = lj.G, w = g.world;
  const tiles = [];
  for (let i = 0; i < w.N && tiles.length < 2; i++) if (lj.canWall(i)) tiles.push(i);
  assert.equal(lj.buildWalls(tiles), 2);
  assert.equal(w.wall[tiles[0]], 1);
  step(lj, 1);
  assert.equal(w.wall[tiles[0]], 1);
  lj.damageWall(tiles[1], 2);
  step(lj, 2.1);
  assert.equal(w.wall[tiles[0]], 60);
  assert.equal(w.wall[tiles[1]], 0);
  assert.equal(Object.keys(g.wallSites).length, 0);
});

test('save/load preserves unfinished buildings, upgrades and walls without granting benefits early', () => {
  const lj = village(), g = lj.G;
  const mill = place(lj, 'sawmill');
  lj.buy('base');
  const tile = g.world.wall.findIndex((v, i) => lj.canWall(i));
  lj.buildWalls([tile]);
  step(lj, 1);
  const left = mill.construction.t, upgradeLeft = g.base.construction.t;
  lj.saveGame();
  assert.ok(lj.loadGame());
  const restored = g.buildings.find(b => b.kind === 'sawmill');
  assert.equal(restored.construction.t, left);
  assert.equal(g.base.construction.t, upgradeLeft);
  assert.equal(g.count.sawmill, 0);
  assert.equal(g.tier, 1);
  assert.equal(g.sawMask.some(Boolean), false);
  assert.equal(g.world.wall[tile], 1);
  step(lj, 2.1);
  assert.equal(g.world.wall[tile], 60);
  finishConstruction(lj);
  assert.equal(g.tier, 2);
  assert.equal(g.count.sawmill, 1);
});

test('old saves without construction fields load their buildings as completed', () => {
  const lj = village(), g = lj.G;
  place(lj, 'sawmill'); finishConstruction(lj);
  lj.saveGame();
  const store = storage(lj), saved = JSON.parse(store.getItem('lumberjack-save'));
  for (const version of [2, 3, 4]) {
    const old = JSON.parse(JSON.stringify(saved));
    old.v = version; old.buildings.forEach(b => delete b.construction); delete old.g.wallSites;
    store.setItem('lumberjack-save', JSON.stringify(old));
    assert.ok(lj.loadGame());
    assert.equal(g.count.sawmill, 1);
    assert.ok(g.sawMask.some(Boolean));
    assert.equal(Object.keys(g.wallSites).length, 0);
  }
});

test('saving midway through the first Cabin upgrade preserves the tent and remaining time', () => {
  const lj = game(), g = lj.G;
  lj.cmd.stop(g.units); g.money = 1000; g.wood = 20;
  lj.buy('base'); step(lj, 5);
  const left = g.base.construction.t;
  lj.saveGame();
  assert.ok(lj.loadGame());
  assert.equal(g.tier, 0);
  assert.equal(g.village, null);
  assert.equal(lj.popCap(), 2);
  assert.equal(g.base.construction.t, left);
  assert.equal(lj.buy('base'), false);
  finishConstruction(lj);
  assert.equal(g.tier, 1);
  assert.equal(g.money, 880);
});
