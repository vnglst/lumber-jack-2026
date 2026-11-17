const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step } = require('./harness.cjs');

function ready(crew = 20, wave = 50) {
  const lj = game(42), g = lj.G, jack = lj.jacks()[0];
  g.level = 10; g.animalCd = 1e9;
  lj.cmd.stop(g.units);
  for (let i = 1; i < crew; i++) g.units.push({ ...jack, id: g.nextId++, path: [], task: null });
  g.wave = { hostile: true, next: g.time, n: wave, active: null };
  return { lj, g };
}

test('late raids are bounded and do not grow just because the player takes longer', () => {
  const early = ready(20, 1), late = ready(20, 50);
  early.lj.combat.update(0); late.lj.combat.update(0);
  assert.ok(late.g.wave.active);
  assert.ok(late.g.wave.active.size <= 12);
  assert.equal(late.g.wave.active.size, early.g.wave.active.size);
});

test('a recovering small crew faces a smaller raid', () => {
  const { lj, g } = ready(3);
  lj.combat.update(0);
  assert.ok(g.wave.active);
  assert.ok(g.wave.active.size <= 4);
});

test('a wounded crew gets time to heal before a new raid', () => {
  const { lj, g } = ready(3);
  for (const u of lj.jacks()) u.hp = 20;
  lj.combat.update(0);
  assert.equal(g.wave.active, null);
  assert.ok(g.wave.next > g.time);
  for (const u of lj.jacks()) u.hp = lj.maxHpOf(u);
  g.time = g.wave.next; lj.combat.update(0);
  assert.ok(g.wave.active, 'attacks resume after the crew recovers');
});

test('a raid waits until an existing predator encounter has ended', () => {
  const { lj, g } = ready();
  lj.spawnWildAt('wolf', g.huts[0].tile, 3);
  lj.combat.update(0);
  assert.equal(g.wave.active, null);
  g.animals = []; g.time = g.wave.next;
  lj.combat.update(0);
  assert.ok(g.wave.active, 'the postponed raid still happens');
});

test('predators do not spawn during a raid or its retreat', () => {
  for (const retreating of [false, true]) {
    const { lj, g } = ready();
    lj.combat.update(0);
    g.wave.active.retreating = retreating;
    g.animalCd = 0;
    step(lj, 0.05);
    assert.ok(!g.animals.some(a => lj.FOE[a.kind].wild));
    assert.ok(g.animalCd >= 30, 'leave recovery time after the raid');
  }
});

test('the end of a raid leaves at least ninety seconds before the next', () => {
  const { lj, g } = ready();
  g.wave.active = { size: 12, start: g.time, retreating: true };
  g.animals = [];
  lj.combat.update(0);
  assert.equal(g.wave.active, null);
  assert.ok(g.wave.next - g.time >= 90);
});

test('a raid waits while the crew is already fighting several hut defenders', () => {
  const { lj, g } = ready();
  g.wave.next = 1e9;
  g.huts.slice(0, 2).forEach((h, i) => {
    const u = lj.jacks()[i];
    u.x = h.x; u.y = h.y; u.tile = h.tile;
  });
  lj.combat.update(0);
  assert.equal(g.animals.filter(a => a.defender && a.tg).length, 4);
  g.wave.next = g.time;
  lj.combat.update(0);
  assert.equal(g.wave.active, null);
});
