const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, put } = require('./harness.cjs');

function yard(kind = 'jack', hp = 60) {
  const lj = game(), g = lj.G, w = g.world;
  lj.cmd.stop(g.units);
  const ox = w.start.x + 8, oy = w.start.y + 8;
  const at = (x, y) => (oy + y) * w.W + ox + x;
  for (let y = 0; y <= 6; y++) for (let x = 0; x <= 8; x++) {
    const i = at(x, y);
    w.obj[i] = w.bld[i] = w.wall[i] = 0;
    w.type[i] = x === 0 || x === 8 || y === 0 || y === 6 ? lj.T.ROCK : lj.T.GRASS;
    w.lush[i] = 1; g.fog[i] = 1;
  }
  for (let y = 1; y < 6; y++) w.wall[at(4, y)] = hp;
  const u = lj.jacks()[0]; u.kind = kind; u.carry = 0;
  g.units = [u]; g.animals = []; g.critters = []; g.huts = []; g.animalCd = 9999;
  put(u, at(2, 3), w);
  return { lj, g, w, at, u };
}

for (const kind of ['jack', 'truck', 'shuttle', 'dozer', 'feller', 'harv']) {
  for (const hp of [1, 60]) {
    test(kind + ' cannot cross ' + (hp === 1 ? 'unfinished' : 'finished') + ' palisades', () => {
      const { lj, u, at } = yard(kind, hp), start = u.tile;
      lj.cmd.move([u], at(6, 3));
      assert.equal(u.path.length, 0, 'no route through a solid wall');
      step(lj, 2);
      assert.equal(u.tile, start);
    });
  }
  test(kind + ' can use a deliberate opening', () => {
    const { lj, w, u, at } = yard(kind);
    w.wall[at(4, 5)] = 0;
    lj.cmd.move([u], at(6, 3));
    assert.ok(u.path.length);
    assert.ok(u.path.includes(at(4, 5)), 'route goes through the gap');
    until(lj, () => u.tile === at(6, 3), 15);
  });
}

test('bulldozer breach orders cannot plan through a palisade', () => {
  const { lj, w, u, at } = yard('dozer');
  // Rocks are not an enclosure for a bulldozer: extend the wall to both map edges.
  for (let y = 0; y < w.H; y++) w.wall[y * w.W + at(4, 3) % w.W] = 60;
  w.type[at(6, 3)] = lj.T.ROCK;
  assert.equal(lj.cmd.dozeTo([u], at(6, 3)), false);
  assert.equal(u.path.length, 0);
});

test('a new wall on a diagonal corner stops an already moving Jack', () => {
  const { lj, g, w, u, at } = yard();
  put(u, at(2, 2), w);
  lj.cmd.move([u], at(3, 3));
  assert.equal(u.path.length, 1);
  g.money = g.wood = 1000;
  assert.equal(lj.buildWalls([at(3, 2)]), 1);
  const x = u.x, y = u.y;
  lj.update(0.05);
  assert.equal(u.x, x); assert.equal(u.y, y);
});

test('enemies stop at diagonal wall corners and can proceed after breaking them', () => {
  const { lj, w, at } = yard();
  const a = { path: [at(3, 3)], dir: 1, walkT: 0 };
  put(a, at(2, 2), w); w.wall[at(3, 2)] = 60;
  assert.equal(lj.march(a, 0.05, 50), at(3, 2));
  assert.equal(a.tile, at(2, 2));
  lj.damageWall(at(3, 2), 60);
  assert.equal(lj.march(a, 1, 50), -1);
  assert.equal(a.tile, at(3, 3));
});

for (const kind of ['deer', 'squirrel', 'native', 'swan']) {
  test(kind + ' cannot drift through a palisade', () => {
    const { lj, g, w, at } = yard();
    g.units = [];
    const c = lj.critters.make(kind, (at(4, 3) % w.W) * 16 - 0.1, Math.floor(at(4, 3) / w.W) * 16 + 10, 1, 999);
    c.tx = c.x + 30; c.ty = c.y; c.moving = true;
    if (kind === 'native') {
      c.home = at(2, 2);
      g.huts = [{ tile: c.home, alive: true, angry: false }];
    }
    if (kind === 'swan') w.type[at(3, 3)] = w.type[at(4, 3)] = w.type[at(5, 3)] = lj.T.WATER;
    g.critters = [c];
    const x = c.x;
    lj.critters.update(0.05);
    assert.equal(c.x, x);
  });
}

test('wall placement refuses occupied ground without charging the player', () => {
  const { lj, g, u } = yard();
  g.money = g.wood = 1000;
  assert.equal(lj.canWall(u.tile), false);
  assert.equal(lj.buildWalls([u.tile]), 0);
  assert.equal(g.money, 1000); assert.equal(g.wood, 1000);
});

test('a destroyed wall opens a route and saved walls remain solid', () => {
  const { lj, w, u, at } = yard();
  lj.saveGame(); assert.ok(lj.loadGame());
  assert.equal(lj.bfs(u.tile, c => c === at(6, 3)), null);
  lj.damageWall(at(4, 3), 60);
  assert.ok(lj.bfs(u.tile, c => c === at(6, 3)));
});

test('the ending closes wall placement and prevents construction across the visitor route', () => {
  const lj = game(), g = lj.G;
  g.money = g.wood = 1000;
  g.wallMode = true; g.wallDrag = [g.units[0].tile];
  lj.ending.start();
  const tile = g.suit.path.find(i => lj.canWall(i));
  assert.notEqual(tile, undefined, 'the visitor has an otherwise buildable route');
  assert.equal(g.wallMode, false);
  assert.equal(g.wallDrag, null);
  assert.equal(lj.buildWalls([tile]), 0);
  assert.equal(g.world.wall[tile], 0);
  assert.equal(g.money, 1000); assert.equal(g.wood, 1000);
});
