const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction, put, storage } = require('./harness.cjs');

const UPGRADES = ['hydraulics', 'dozerEngine', 'dozerOverdrive'];

function yard(tier = 0) {
  const lj = game(), g = lj.G, w = g.world;
  lj.cmd.stop(g.units);
  Object.assign(g, { money: 100000, wood: 1000, lumber: 1000, ore: 1000, level: 9, stockpile: true, animalCd: 1e9 });
  lj.buy('base'); finishConstruction(lj);
  assert.ok(lj.buy('dozer'));
  lj.cmd.stop(g.units);
  for (const id of UPGRADES.slice(0, tier)) assert.ok(lj.buy(id), id);
  const u = g.units.find(u => u.kind === 'dozer');
  const x = w.start.x + 5, y = w.start.y + 5, at = (dx, dy = 0) => (y + dy) * w.W + x + dx;
  for (let dy = -3; dy <= 8; dy++) for (let dx = -3; dx <= 12; dx++) {
    const n = at(dx, dy);
    if (w.bld[n] || lj.isRoad(w.type[n])) continue;
    w.type[n] = lj.T.GRASS; w.obj[n] = w.wall[n] = g.veins[n] = 0; g.fog[n] = 1;
  }
  put(u, at(0), w);
  return { lj, g, w, u, at };
}

test('bulldozer tiers require their level and predecessor, charge once, and upgrade future machines', () => {
  const { lj, g, u } = yard();
  const levels = [5, 7, 9], caps = [24, 32, 48];
  assert.equal(lj.buy('dozerOverdrive'), false);
  for (let i = 0; i < UPGRADES.length; i++) {
    const id = UPGRADES[i], item = lj.SHOP.find(it => it.id === id);
    g.level = levels[i] - 1;
    assert.equal(lj.buy(id), false);
    g.level++;
    const money = g.money, ore = g.ore, lumber = g.lumber, cost = item.cost();
    assert.ok(lj.buy(id));
    assert.equal(g.money, money - cost.m);
    assert.equal(g.ore, ore - cost.o);
    assert.equal(g.lumber, lumber - (cost.l || 0));
    assert.equal(lj.capOf(u), caps[i]);
    assert.equal(lj.buy(id), false);
    assert.equal(g.money, money - cost.m);
  }
  assert.ok(lj.buy('dozer'));
  assert.ok(g.units.filter(u => u.kind === 'dozer').every(u => lj.capOf(u) === 48));
});

for (let tier = 0; tier <= 3; tier++) {
  test('bulldozer tier ' + tier + ' drives at its advertised speed', () => {
    const { lj, u, at } = yard(tier), x = u.x;
    lj.cmd.move([u], at(8));
    assert.equal(u.state, 'move');
    step(lj, 0.2);
    assert.ok(Math.abs(u.x - x - 36 * [1, 1.5, 2, 3][tier] * 0.2) < 0.01);
  });
  for (const material of ['roots', 'rock', 'water']) {
    test('bulldozer tier ' + tier + ' clears ' + material + ' at its advertised rate with one reward', () => {
      const { lj, g, w, u, at } = yard(tier), n = at(0);
      w.obj[n] = material === 'roots' ? lj.STUMP : 0;
      w.type[n] = material === 'rock' ? lj.T.ROCK : material === 'water' ? lj.T.WATER : lj.T.GRASS;
      if (material === 'rock') g.veins[n] = 3;
      const stone = g.stone, ore = g.ore, wood = g.wood;
      assert.ok(lj.cmd.dozeTo([u], n));
      until(lj, () => u.state === 'doze', 2);
      const duration = { roots: 3, rock: 2.5, water: 4 }[material] / 2 ** tier;
      step(lj, duration - 0.1);
      assert.ok(lj.canDoze(n), 'work must take time');
      step(lj, 0.15);
      assert.equal(lj.canDoze(n), false);
      lj.cmd.stop([u]); step(lj, 1);
      assert.equal(g.stone, stone + (material === 'rock' ? 2 : 0));
      assert.equal(g.ore, ore + (material === 'rock' ? 3 : 0));
      assert.equal(g.wood + u.carry, wood + (material === 'roots' ? 2 : 0));
      assert.equal(w.type[n], material === 'roots' ? lj.T.MUD : lj.T.GRAVEL);
    });
  }
}

test('overdrive batches 48 root wood, delivers it and respects Stop', () => {
  const { lj, g, w, u, at } = yard(3), wood = g.wood;
  const roots = [];
  for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 7; dx++) {
    const n = at(dx, dy); w.obj[n] = lj.STUMP; roots.push(n);
  }
  assert.ok(lj.cmd.dozeTo([u], at(0)));
  let full = false;
  for (let i = 0; i < 120 / 0.05 && g.wood < wood + 56; i++) {
    lj.update(0.05);
    assert.ok(u.carry <= 48);
    if (u.carry === 48) full = true;
  }
  assert.ok(full);
  assert.equal(g.wood, wood + 56);
  assert.ok(roots.every(n => w.obj[n] === 0));
  w.obj[at(0)] = lj.STUMP;
  lj.cmd.dozeTo([u], at(0)); lj.cmd.stop([u]); step(lj, 3);
  assert.equal(w.obj[at(0)], lj.STUMP);
});

test('upgraded cargo persists and saves without upgrades keep stock bulldozers and cleared terrain', () => {
  for (const tier of [0, 3]) {
    const { lj, g, w, u, at } = yard(tier), n = at(0), cleared = g.cleared;
    w.obj.fill(0); w.type[n] = lj.T.MUD;
    u.carry = tier ? 46 : 14;
    lj.saveGame();
    const saved = JSON.parse(storage(lj).getItem('lumberjack-save'));
    assert.equal(saved.v, 10);
    assert.ok(lj.loadGame());
    const restored = g.units.find(u => u.kind === 'dozer');
    assert.equal(lj.capOf(restored), tier ? 48 : 16);
    assert.equal(restored.carry, tier ? 46 : 14);
    assert.ok(restored.hold);
    assert.equal(g.cleared, cleared);
    assert.equal(g.world.type[n], lj.T.MUD);
    assert.ok(g.world.obj.every(o => o === 0));
  }
});
