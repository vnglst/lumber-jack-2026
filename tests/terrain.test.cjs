const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until } = require('./harness.cjs');

function track(kind, type) {
  const lj = game(), g = lj.G, w = g.world;
  lj.cmd.stop(g.units);
  const u = kind === 'jack' ? lj.jacks()[0] : g.units.find(u => u.kind === 'truck');
  u.kind = kind; u.hp = lj.maxHpOf(u);
  const a = (w.start.y + 3) * w.W + w.start.x, b = a + 1;
  for (const n of [a, b]) {
    w.type[n] = type === undefined ? lj.T.GRASS : type;
    w.obj[n] = w.bld[n] = w.wear[n] = 0; w.lush[n] = 1;
    w.flower[n] = w.deco[n] = 1;
  }
  u.tile = a; u.x = a % w.W * 16 + 8; u.y = ((a / w.W) | 0) * 16 + 10;
  const pass = () => {
    lj.cmd.move([u], b);
    until(lj, () => u.tile === b && !u.path.length, 3);
    lj.cmd.stop([u]);
    lj.cmd.move([u], a);
    until(lj, () => u.tile === a && !u.path.length, 3);
    lj.cmd.stop([u]);
  };
  return { lj, g, w, u, a, b, pass };
}

for (const kind of ['truck', 'shuttle', 'dozer', 'harv']) {
  test(kind + ' progressively damages traversed ground without byte overflow', () => {
    const { lj, w, a, b, pass } = track(kind);
    pass();
    const first = w.wear[b];
    assert.equal(first, lj.VEH[kind].wear);
    assert.equal(w.flower[b], 0);
    assert.equal(w.deco[b], 0);
    for (let i = 0; i < 5; i++) pass();
    assert.ok(w.wear[b] > first);
    assert.equal(w.type[b], lj.T.DIRT);
    assert.ok(w.lush[b] < 1);
    for (let i = 0; i < 50; i++) pass();
    assert.equal(w.wear[b], 255);
    assert.equal(w.wear[a], 255);
    step(lj, 2);
    assert.equal(w.wear[b], 255);
  });
}

test('foot traffic makes brown trails, not black vehicle ruts', () => {
  const { lj, w, b, pass } = track('jack');
  for (let i = 0; i < 20; i++) pass();
  assert.equal(w.type[b], lj.T.DIRT);
  assert.equal(w.wear[b], 10);
});

test('roads keep their function and bridges do not become dirt', () => {
  for (const type of ['ROAD', 'BRIDGE']) {
    const lj0 = game(), { lj, w, b, pass } = track('truck', lj0.T[type]);
    pass(); pass(); pass();
    assert.equal(w.type[b], lj.T[type]);
    assert.equal(lj.isRoad(w.type[b]), true);
    assert.equal(w.wear[b], type === 'ROAD' ? 18 : 0);
  }
});

test('terrain damage survives save/load', () => {
  const { lj, g, w, b, pass } = track('truck');
  for (let i = 0; i < 20; i++) pass();
  const wear = w.wear[b], lush = w.lush[b];
  lj.saveGame();
  assert.ok(lj.loadGame());
  assert.equal(g.world.wear[b], wear);
  assert.equal(g.world.type[b], lj.T.DIRT);
  assert.ok(Math.abs(g.world.lush[b] - lush) <= 1 / 255);
});
