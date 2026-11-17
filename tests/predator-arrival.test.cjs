const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, put } = require('./harness.cjs');

function field() {
  const lj = game(), g = lj.G, w = g.world, jack = lj.jacks()[0];
  lj.cmd.stop(g.units);
  g.units = [jack]; g.buildings = []; g.animals = []; g.critters = []; g.huts = [];
  g.animalCd = g.wave.next = 1e9;
  for (let row = 25; row < 36; row++) for (let col = 25; col < 46; col++) {
    const n = row * w.W + col;
    w.type[n] = lj.T.GRASS; w.obj[n] = w.bld[n] = w.wall[n] = 0;
  }
  const home = 30 * w.W + 30;
  put(jack, home, w);
  return { lj, g, w, jack, home };
}

test('a predator finishes its approach to an off-centre unit before biting', () => {
  const { lj, g, jack, home } = field();
  jack.x += 4;
  lj.spawnWildAt('bear', home - 1, 1);
  const a = g.animals[0];
  a.x = jack.x - 18; a.hp = a.max = 5000;
  const hp = jack.hp;
  step(lj, 3);
  assert.ok(jack.hp < hp, 'the final waypoint must not leave the bear outside bite range');
});

test('a fleeing predator reaches home instead of discarding its final waypoint outside it', () => {
  const { lj, g, w, jack, home } = field();
  put(jack, home + 10, w);
  lj.spawnWildAt('wolf', home, 1);
  const a = g.animals[0];
  a.x -= 11; a.tile = lj.tileOfPx(a.x, a.y); a.flee = true;
  assert.notEqual(a.tile, home);
  step(lj, 3);
  assert.equal(a.alive, false, 'a returned predator must leave the encounter');
  assert.ok(!g.animals.includes(a));
});
