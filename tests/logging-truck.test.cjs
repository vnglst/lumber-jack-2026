const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction, storage } = require('./harness.cjs');

function loggingRoute() {
  const lj = game(), g = lj.G, w = g.world;
  lj.cmd.stop(lj.jacks());
  g.money = 1000; g.wood = 20; g.level = 3;
  lj.buy('base');
  finishConstruction(lj);
  assert.ok(lj.buy('shuttle'));
  const truck = g.units.find(u => u.kind === 'shuttle');
  until(lj, () => !truck.path.length && truck.state === 'idle', 30);
  const at = w.type.findIndex((t, i) => lj.isRoad(t) && i % w.W === w.start.x - 15);
  assert.ok(at >= 0);
  lj.cmd.move([truck], at);
  until(lj, () => truck.state === 'shuttleLoad' && !truck.path.length, 30);
  g.stockpile = true;
  return { lj, g, truck, at };
}

test('logging trucks replace depots in the shop', () => {
  const lj = game();
  assert.ok(!lj.SHOP.some(i => i.id === 'depot'));
  assert.ok(lj.SHOP.some(i => i.id === 'shuttle' && i.level === 3));
});

test('jacks load a nearby logging truck; it physically delivers and returns', () => {
  const { lj, g, truck, at } = loggingRoute();
  const jack = lj.jacks()[0];
  jack.tile = at; jack.x = truck.x; jack.y = truck.y; jack.carry = 8;
  jack.task = { type: 'work', ax: at % g.world.W, ay: (at / g.world.W) | 0, first: -1 };
  jack.state = 'think';
  const wood = g.wood;
  until(lj, () => truck.carry === 8, 2);
  lj.cmd.stop([jack]);
  assert.equal(jack.carry, 0);
  assert.equal(jack.xp, 2);
  assert.equal(g.wood, wood);
  step(lj, 2);
  assert.equal(truck.carry, 8); // Partial loads wait briefly for more jacks.
  until(lj, () => g.wood === wood + 8, 40);
  assert.equal(truck.carry, 0);
  assert.equal(truck.xp, 0);
  assert.notEqual(truck.tile, at);
  until(lj, () => truck.tile === at && !truck.path.length, 30);
});

test('full trucks return immediately and Stop preserves their load', () => {
  const { lj, g, truck } = loggingRoute();
  truck.carry = lj.capOf(truck);
  lj.update(0.05);
  assert.equal(truck.state, 'shuttleDrop');
  assert.ok(truck.path.length);
  const wood = g.wood;
  lj.cmd.stop([truck]);
  step(lj, 2);
  assert.equal(truck.carry, 40);
  assert.equal(g.wood, wood);
  assert.equal(truck.path.length, 0);
});

test('a jack reroutes to village if its collection truck is destroyed', () => {
  const { lj, g, truck, at } = loggingRoute();
  const jack = lj.jacks()[0];
  jack.tile = at; jack.x = truck.x; jack.y = truck.y; jack.carry = 8;
  jack.state = 'think';
  jack.task = { type: 'work', ax: at % g.world.W, ay: (at / g.world.W) | 0, first: -1 };
  lj.update(0.05);
  assert.equal(jack.dropId, truck.id);
  truck.dead = true;
  lj.update(0.05);
  assert.equal(jack.carry, 8);
  assert.equal(jack.dropId, null);
  assert.ok(jack.path.length);
});

test('logging route and in-transit wood survive save/load', () => {
  const { lj, g, truck, at } = loggingRoute();
  truck.carry = 17;
  const wood = g.wood;
  lj.saveGame();
  assert.ok(lj.hasSave());
  assert.ok(lj.loadGame());
  const restored = g.units.find(u => u.kind === 'shuttle');
  assert.equal(restored.carry, 17);
  assert.equal(restored.task.type, 'shuttle');
  assert.equal(restored.task.ay * g.world.W + restored.task.ax, at);
  until(lj, () => g.wood === wood + 17, 30);
});

test('version 2 saves convert old depots into trucks without losing progress', () => {
  const lj = game(), g = lj.G, w = g.world;
  const b = { kind: 'depot', tx: g.base.tx, ty: g.base.ty + 5, w: 2, h: 2, hp: 160, max: 160, queue: [] };
  g.buildings.push(b); g.money = 321; g.wood = 57;
  for (let y = b.ty; y < b.ty + 2; y++) for (let x = b.tx; x < b.tx + 2; x++) {
    w.bld[y * w.W + x] = g.buildings.length; w.obj[y * w.W + x] = 0;
  }
  lj.saveGame();
  const store = storage(lj), s = JSON.parse(store.getItem('lumberjack-save'));
  s.v = 2; store.setItem('lumberjack-save', JSON.stringify(s));
  assert.ok(lj.hasSave());
  assert.ok(lj.loadGame());
  assert.equal(g.money, 321);
  assert.equal(g.wood, 57);
  assert.ok(!g.buildings.some(b => b.kind === 'depot'));
  assert.equal(g.world.bld[b.ty * w.W + b.tx], 0);
  const truck = g.units.find(u => u.kind === 'shuttle');
  assert.ok(truck);
  assert.equal(truck.task.type, 'shuttle');
  assert.equal(truck.task.ax, b.tx);
  step(lj, 0.1);
  assert.equal(truck.state, 'shuttleLoad');
});

test('jacks beyond eight tiles still use a closer reachable collection truck', () => {
  const { lj, g, truck, at } = loggingRoute(), w = g.world;
  const jack = lj.jacks()[0], spot = at - 10;
  for (let i = spot; i <= at; i++) { w.obj[i] = w.bld[i] = 0; w.type[i] = lj.T.ROAD; }
  jack.tile = spot; jack.x = spot % w.W * 16 + 8; jack.y = ((spot / w.W) | 0) * 16 + 10;
  jack.carry = 8; jack.hold = false; jack.state = 'think';
  jack.task = { type: 'work', ax: spot % w.W, ay: (spot / w.W) | 0, first: -1 };
  lj.update(0.05);
  assert.equal(jack.dropId, truck.id);
  until(lj, () => truck.carry === 8, 8);
  assert.equal(jack.carry, 0);
});

test('partial trucks wait for approaching jacks, then deliver all collected wood', () => {
  const { lj, g, truck, at } = loggingRoute(), w = g.world;
  const jack = lj.jacks()[0], spot = at - 6;
  for (let i = spot; i <= at; i++) { w.obj[i] = w.bld[i] = 0; w.type[i] = lj.T.GRASS; }
  truck.carry = 8; truck.loadT = 7.9;
  jack.tile = spot; jack.x = spot % w.W * 16 + 8; jack.y = ((spot / w.W) | 0) * 16 + 10;
  jack.carry = 8; jack.hold = false; jack.state = 'think';
  jack.task = { type: 'work', ax: spot % w.W, ay: (spot / w.W) | 0, first: -1 };
  lj.update(0.05);
  assert.equal(jack.dropId, truck.id);
  const wood = g.wood;
  until(lj, () => truck.carry === 16, 8);
  lj.cmd.stop([jack]);
  assert.equal(jack.carry, 0);
  until(lj, () => g.wood === wood + 16, 40);
});

for (const unavailable of ['stopped', 'full', 'departed']) {
  test('jacks fall back to camp when the collection truck is ' + unavailable, () => {
    const { lj, g, truck, at } = loggingRoute();
    const jack = lj.jacks()[0];
    if (unavailable === 'stopped') lj.cmd.stop([truck]);
    if (unavailable === 'full') truck.carry = lj.capOf(truck);
    if (unavailable === 'departed') truck.state = 'shuttleDrop';
    jack.tile = at; jack.x = truck.x; jack.y = truck.y; jack.carry = 8;
    jack.hold = false; jack.state = 'think';
    jack.task = { type: 'work', ax: at % g.world.W, ay: (at / g.world.W) | 0, first: -1 };
    lj.update(0.05);
    assert.equal(jack.dropId, null);
    assert.equal(jack.state, 'toDrop');
    assert.ok(jack.path.length);
  });
}
