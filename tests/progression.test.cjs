const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until } = require('./harness.cjs');

test('locals live in the woods but do not start waves before level 5', () => {
  const lj = game(), g = lj.G;
  assert.ok(g.critters.some(c => c.kind === 'native'));
  for (let level = 1; level < 5; level++) {
    g.level = level; g.time += 10000;
    lj.combat.update(0.05);
    assert.equal(g.wave.hostile, false);
    assert.ok(!g.animals.some(a => a.kind === 'native'));
    assert.ok(g.critters.some(c => c.kind === 'native' && !c.gone));
  }
  assert.ok(!lj.danger(3).includes('bows'));
});

test('level 5 gives a warning before the first local wave', () => {
  const lj = game(), g = lj.G;
  g.level = 5;
  lj.combat.update(0.05);
  assert.ok(g.wave.hostile);
  assert.equal(lj.combat.nextWaveIn(), 50);
  assert.ok(!g.animals.some(a => a.kind === 'native'));
  assert.ok(g.critters.filter(c => c.kind === 'native').every(c => c.gone));
  until(lj, () => g.animals.some(a => a.kind === 'native'), 85);
});

test('the first wildlife threat is wolves only', () => {
  const lj = game(), g = lj.G, seen = new Set();
  for (const u of lj.jacks()) u.hp = 1e6;
  for (let i = 0; i < 180 / 0.05; i++) {
    lj.update(0.05);
    for (const a of g.animals) seen.add(a.kind);
  }
  assert.deepEqual([...seen], ['wolf']);
  assert.equal(g.wave.hostile, false);
});

test('an older early-hostile save returns locals to peaceful life', () => {
  const lj = game(), g = lj.G;
  g.level = 3; g.wave.hostile = true; g.wave.n = 2;
  g.critters = g.critters.filter(c => c.kind !== 'native');
  lj.saveGame();
  assert.ok(lj.loadGame());
  assert.equal(g.wave.hostile, false);
  assert.equal(g.wave.n, 0);
  assert.ok(g.critters.some(c => c.kind === 'native' && !c.gone));
  step(lj, 1);
  assert.ok(!g.animals.some(a => a.kind === 'native'));
});
