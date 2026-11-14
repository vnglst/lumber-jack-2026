const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until } = require('./harness.cjs');

function folkNear(lj, u) {
  const a = {
    kind: 'native', alive: true, x: u.x - 40, y: u.y, tile: u.tile,
    hp: 100, max: 100, dmg: 10, cd: 1, speed: 40, dir: 1, walkT: 0,
    shootCd: 0, retarget: 0, repath: 0, aim: 0, hitCd: 0, path: []
  };
  lj.G.animals.push(a);
  return a;
}

for (const kind of ['jack', 'truck', 'dozer', 'harv', 'shuttle']) {
  test('locals target and damage ' + kind, () => {
    const lj = game(), g = lj.G;
    const u = { ...g.units[0], kind, id: 99, path: [], task: null, dead: false };
    u.hp = lj.maxHpOf(u);
    g.units = [u];
    const a = folkNear(lj, u), hp = u.hp;
    for (let i = 0; i < 20; i++) lj.combat.update(0.05);
    assert.equal(a.tg.u, u);
    assert.ok(u.hp < hp);
    assert.ok(!u.dead);
    g.sel.add(u);
    lj.hurtUnit(u, 1000, a);
    assert.ok(u.dead);
    assert.ok(!g.sel.has(u));
    assert.equal(g.graves.length, kind === 'jack' ? 1 : 0);
  });
}

test('locals retarget after a vehicle is destroyed', () => {
  const lj = game(), g = lj.G, truck = g.units[0], jack = lj.jacks()[0];
  const a = folkNear(lj, truck);
  lj.combat.update(0.05);
  assert.equal(a.tg.u, truck);
  lj.hurtUnit(truck, 1000, a);
  lj.combat.update(0.05);
  assert.equal(a.tg.u, jack);
});

function wolfFight(rifles = false) {
  const lj = game(), g = lj.G, jack = lj.jacks()[0], w = g.world;
  lj.cmd.stop(g.units);
  for (let i = 0; i <= 10; i++) {
    const n = jack.tile + i;
    w.obj[n] = w.bld[n] = 0; w.type[n] = lj.T.GRASS;
  }
  g.up.rifles = rifles;
  const wolf = {
    kind: 'wolf', alive: true, x: jack.x - 8, y: jack.y, tile: jack.tile,
    hp: 1000, max: 1000, dmg: 8, speed: 58.5, repath: 0, atkCd: 0,
    dir: 1, walkT: 0, path: [], target: jack, home: jack.tile, flee: false
  };
  g.animals.push(wolf);
  lj.cmd.hunt([jack], wolf);
  lj.update(0.05);
  return { lj, g, jack, wolf, destination: jack.tile + 10 };
}

test('moving out of a wolf fight stays a retreat order even after another bite', () => {
  const { lj, jack, wolf, destination } = wolfFight();
  assert.ok(jack.fighting);
  const health = jack.hp, wolfHealth = wolf.hp, x = jack.x;
  wolf.atkCd = 0; // The next bite lands before Jack has escaped melee range.
  lj.cmd.move([jack], destination);
  until(lj, () => jack.hp < health, 1);
  assert.equal(jack.task.type, 'move');
  assert.equal(jack.fighting, false);
  assert.ok(jack.path.length);
  assert.ok(jack.x > x);
  assert.equal(wolf.hp, wolfHealth);
  until(lj, () => jack.tile === destination && !jack.path.length, 10);
  assert.ok(!jack.dead);
  // Reaching the destination ends retreat: ordinary self-defense may resume.
  until(lj, () => jack.fighting && wolf.hp < wolfHealth, 3);
});

test('a move order cancels unfired laser bursts without erasing shots already in flight', () => {
  const { lj, g, jack, wolf, destination } = wolfFight(true);
  assert.ok(g.bursts.some(b => b.src === jack && b.left > 0));
  wolf.x -= 80; // Keep the next fired bolt in flight long enough to inspect it.
  step(lj, 0.1);
  const fired = g.bolts.slice();
  assert.ok(fired.length);
  const tower = { x: jack.x, y: jack.y };
  lj.combat.burst(tower, wolf, { n: 3, dmg: 13, col: '#4ae8ff' });
  lj.cmd.move([jack], destination);
  assert.equal(jack.fighting, false);
  assert.ok(!g.bursts.some(b => b.src === jack));
  assert.ok(g.bursts.some(b => b.src === tower));
  assert.deepEqual(g.bolts, fired);
  step(lj, 1);
  assert.equal(jack.task.type, 'move');
  assert.ok(!g.bursts.some(b => b.src === jack));
  assert.ok(wolf.alive);
});

test('an unreachable move does not cancel a fight or its pending burst', () => {
  const { lj, g, jack, destination } = wolfFight(true);
  g.world.type[destination] = lj.T.WATER;
  const task = jack.task, bursts = g.bursts.slice();
  lj.cmd.move([jack], destination);
  assert.equal(jack.task, task);
  assert.equal(jack.fighting, true);
  assert.deepEqual(g.bursts, bursts);
});

test('a new attack order can end a retreat before arrival', () => {
  const { lj, jack, wolf, destination } = wolfFight();
  lj.cmd.move([jack], destination);
  lj.cmd.hunt([jack], wolf);
  lj.update(0.05);
  assert.equal(jack.task.type, 'hunt');
  assert.equal(jack.fighting, true);
});
