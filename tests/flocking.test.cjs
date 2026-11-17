const test = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./harness.cjs');

function clearing(kind) {
  const lj = game(), g = lj.G, w = g.world;
  g.units = []; g.animals = []; g.critters = []; g.huts = [];
  const x = 30 * 16 + 8, y = 30 * 16 + 10;
  for (let row = 25; row < 36; row++) for (let col = 25; col < 46; col++) {
    const i = row * w.W + col;
    w.type[i] = kind === 'swan' ? lj.T.WATER : lj.T.GRASS;
    w.obj[i] = w.bld[i] = w.wall[i] = 0; w.lush[i] = 1;
  }
  return { lj, g, w, x, y };
}

for (const kind of ['native', 'deer', 'squirrel', 'swan']) {
  test(kind + ' gently separates even from an exactly overlapping resting neighbour', () => {
    const { lj, g, x, y } = clearing(kind);
    g.huts = [{ tile: 0, x, y, alive: true, angry: false }];
    g.critters = [0, 1, 2].map(() => Object.assign(lj.critters.make(kind, x, y, 1, 999), { home: 0 }));
    for (let i = 0; i < 100; i++) {
      const before = g.critters.map(c => [c.x, c.y]);
      lj.critters.update(0.05);
      g.critters.forEach((c, j) => assert.ok(Math.hypot(c.x - before[j][0], c.y - before[j][1]) <= 2.1, 'no teleport'));
    }
    for (const a of g.critters) for (const b of g.critters) if (a !== b)
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > (kind === 'squirrel' ? 7 : 14), 'personal space');
  });
}

for (const kind of ['deer', 'squirrel', 'swan']) {
  test(kind + ' settles near a shared destination without flickering against its neighbour', () => {
    const { lj, g, x, y } = clearing(kind), offset = kind === 'squirrel' ? 4 : 8;
    g.critters = [-offset, offset].map(dx => Object.assign(lj.critters.make(kind, x + dx, y, 1, 0),
      { moving: true, tx: x, ty: y }));
    let flips = 0;
    for (let i = 0; i < 20; i++) {
      const dirs = g.critters.map(c => c.dir);
      lj.critters.update(0.05);
      flips += g.critters.filter((c, k) => c.dir !== dirs[k]).length;
    }
    assert.ok(g.critters.every(c => !c.moving), 'both neighbours finish their walk');
    assert.ok(flips < 4, 'no repeated direction flicker');
  });
}

for (const kind of ['wolf', 'lynx', 'wolverine', 'bear']) {
  test('a marching ' + kind + ' pack spreads out and still reaches its destination', () => {
    const { lj, g, w, x, y } = clearing(kind);
    g.animals = [0, 1, 2, 3].map(() => ({ kind, alive: true, x, y, tile: 30 * w.W + 30,
      path: Array.from({ length: 10 }, (_, i) => 30 * w.W + 40 - i), walkT: 0 }));
    for (let i = 0; i < 160; i++) {
      for (const a of g.animals) lj.march(a, 0.05, 30);
      // The ordinary combat update also separates resting bowmen and packs at their target.
      lj.combat.update(0.05);
    }
    assert.ok(g.animals.every(a => a.x > x + 140), 'route progress');
    for (const a of g.animals) for (const b of g.animals) if (a !== b)
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 12, 'pack stays readable');
  });
}

for (const obstacle of ['wall', 'rock', 'building', 'bank']) {
  test('neighbours cannot push each other through a ' + obstacle, () => {
    const kind = obstacle === 'bank' ? 'swan' : 'deer';
    const { lj, g, w, x, y } = clearing(kind);
    for (let row = 25; row < 36; row++) {
      const i = row * w.W + 31;
      if (obstacle === 'wall') w.wall[i] = 60;
      if (obstacle === 'rock') w.type[i] = lj.T.ROCK;
      if (obstacle === 'building') w.bld[i] = 1;
      if (obstacle === 'bank') w.type[i] = lj.T.GRASS;
    }
    g.critters = [0, 1, 2].map(i => lj.critters.make(kind, x - 3 - i * 2, y, 1, 999));
    for (let i = 0; i < 100; i++) lj.critters.update(0.05);
    assert.ok(g.critters.every(c => c.x < 31 * 16));
    if (kind === 'swan') assert.ok(g.critters.every(c => c.x + 9 < 31 * 16));
  });
}

test('a pack member displaced beside its route cannot cut through rock on its next step', () => {
  const { lj, g, w } = clearing('wolf');
  const rock = 29 * w.W + 31, goal = 30 * w.W + 31;
  w.type[rock] = lj.T.ROCK;
  const a = { kind: 'wolf', alive: true, x: 495.8, y: 480.1, tile: 30 * w.W + 30,
    path: [goal], walkT: 0, repath: 1 };
  const b = { ...a, y: 482, path: [] };
  g.animals = [a, b];
  lj.combat.update(0.05);
  assert.equal(a.tile, 29 * w.W + 30, 'neighbour nudges it north of its route');
  lj.march(a, 0.02, 30);
  assert.ok(lj.wildPass(lj.tileOfPx(a.x, a.y)), 'the next step stays on clear ground');
  assert.equal(a.repath, 0, 'request a route from the displaced position');
  a.path = lj.enemyPath(a.tile, i => i === goal);
  for (let i = 0; i < 100 && a.path.length; i++) lj.march(a, 0.05, 30);
  assert.equal(a.tile, goal, 'the replacement route reaches its destination');
});
