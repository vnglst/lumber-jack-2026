const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until } = require('./harness.cjs');

test('the intro route follows road and bridge tiles without diagonal shortcuts, then parks at camp', () => {
  for (const seed of [1, 42, 12345, 7, 99, 2026]) {
    const lj = game(seed, false), g = lj.G, w = g.world, truck = g.arrival;
    const parking = w.start.y * w.W + w.start.x, route = truck.path.slice().reverse();
    assert.ok(route.length);
    assert.equal(route.at(-1), parking);
    assert.ok(lj.isRoad(w.type[truck.tile]));
    let prev = truck.tile;
    for (const tile of route) {
      assert.ok(tile === parking || lj.isRoad(w.type[tile]), 'intro left the road on map ' + seed);
      assert.equal(Math.abs(tile % w.W - prev % w.W) + Math.abs(((tile / w.W) | 0) - ((prev / w.W) | 0)), 1);
      prev = tile;
    }
    until(lj, () => !g.base.pending, 90);
    assert.equal(truck.tile, parking);
    assert.equal(truck.path.length, 0);
  }
});

test('truck arrives before Jack pitches camp, across several maps', () => {
  for (const seed of [1, 42, 12345]) {
    const lj = game(seed, false), g = lj.G;
    assert.equal(lj.jackCount(), 0);
    assert.equal(g.base.pending, true);
    const truck = g.arrival, x = truck.x;
    step(lj, 1);
    assert.ok(truck.x > x);
    until(lj, () => !g.arrival, 180);
    assert.equal(g.base.pending, false);
    assert.equal(lj.jackCount(), 1);
    assert.equal(lj.countKind('truck'), 1);
    assert.equal(lj.shopState(lj.SHOP.find(i => i.id === 'jack')).st, 'ok');
    assert.ok(lj.buy('jack'));
    assert.equal(lj.jackCount(), 2);
    assert.ok(g.units.find(u => u.hired).path.length);
  }
});

test('the story plays on the road, followed by the tutorial at camp, before gameplay timers start', () => {
  for (const seed of [1, 42, 12345]) {
    const lj = game(seed, false), g = lj.G, lines = [];
    lj.ui.introLine = text => lines.push(text);
    const truck = g.arrival;
    step(lj, 10);
    assert.equal(g.arrival, truck);
    assert.equal(g.base.pending, true);
    assert.equal(g.time, 0); // No wages, enemies or work while the tutorial is playing.
    until(lj, () => !g.arrival, 180);
    assert.deepEqual(lines, [...lj.LINES.intro, ...lj.LINES.camp, null]);
    assert.equal(g.time, 0);
    assert.equal(lj.jackCount(), 1);
  }
});

test('intro trucks uncover the same radius and remembered terrain as normal trucks', () => {
  for (const seed of [1, 42, 12345]) {
    const intro = game(seed, false), g = intro.G, initial = g.fogLeft;
    step(intro, 5);
    assert.ok(g.fogLeft < initial);
    const truck = g.arrival, normal = game(seed), other = normal.G.units.find(u => u.kind === 'truck');
    Object.assign(other, { x: truck.x, y: truck.y, tile: truck.tile, path: [], task: null, state: 'idle', hold: true });
    normal.G.units = [other];
    for (const state of [g, normal.G]) { state.fog.fill(0); state.fogLeft = state.world.N; state.fogT = 0; }
    intro.update(0); normal.update(0);
    assert.deepEqual(Array.from(g.fog), Array.from(normal.G.fog));
    const revealed = Array.from(g.fog, (v, n) => v ? n : -1).filter(n => n >= 0);
    step(intro, 2);
    assert.ok(revealed.every(n => g.fog[n]));
    assert.equal(g.time, 0);
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
