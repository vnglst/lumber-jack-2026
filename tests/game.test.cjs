const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until } = require('./harness.cjs');

test('truck arrives before Jack pitches camp, across several maps', () => {
  for (const seed of [1, 42, 12345]) {
    const lj = game(seed, false), g = lj.G;
    assert.equal(lj.jackCount(), 0);
    assert.equal(g.base.pending, true);
    const truck = g.arrival, x = truck.x;
    step(lj, 1);
    assert.ok(truck.x > x);
    until(lj, () => !g.arrival, 30);
    assert.equal(g.base.pending, false);
    assert.equal(lj.jackCount(), 1);
    assert.equal(lj.countKind('truck'), 1);
    assert.equal(lj.shopState(lj.SHOP.find(i => i.id === 'jack')).st, 'ok');
    assert.ok(lj.buy('jack'));
    assert.equal(lj.jackCount(), 2);
    assert.ok(g.units.find(u => u.hired).path.length);
  }
});

test('wood is deposited at camp before the truck loads and sells it', () => {
  const lj = game(), g = lj.G, jack = lj.jacks()[0];
  lj.cmd.stop([jack]);
  jack.carry = 28;
  jack.state = 'toDrop'; // At the starting campsite.
  lj.update(0.05);
  assert.equal(jack.carry, 0);
  assert.equal(g.sold, 0);
  until(lj, () => g.units.find(u => u.kind === 'truck').load, 10);
  assert.equal(g.wood, 20);
  assert.equal(g.sold, 0);
  until(lj, () => g.sold === 8, 30);
  assert.equal(g.money, 104);
});

test('stopping a loaded truck keeps its cargo aboard, not teleported to camp', () => {
  const lj = game(), g = lj.G;
  const truck = g.units.find(u => u.kind === 'truck');
  g.wood = 40;
  until(lj, () => truck.load, 10);
  const wood = g.wood;
  lj.cmd.stop([truck]);
  assert.equal(g.wood, wood);
  assert.equal(truck.load.w, 20);
  assert.equal(truck.path.length, 0);
  lj.cmd.sell([truck]);
  until(lj, () => g.sold === 20, 30);
});

test('stockpiling pauses automatic truck loading', () => {
  const lj = game(), g = lj.G;
  g.stockpile = true; g.wood = 40;
  step(lj, 3);
  assert.equal(g.wood, 40);
  assert.equal(g.sold, 0);
  g.stockpile = false;
  until(lj, () => g.sold === 20, 30);
});
