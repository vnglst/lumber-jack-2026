// Raids on the village and what stops them (guard towers, the jacks at home), and the automation a player earns:
// the foreman, rock broken up with pickaxes, and bulldozers that plan their own way.
const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction, storage, put } = require('./harness.cjs');

// A quiet game on an open, explored field around the camp: no trees, rock, water, huts, wildlife or war parties.
// at(dx, dy) is the tile that many columns and rows from the middle of the camp.
function field() {
  const lj = game(), g = lj.G, w = g.world;
  lj.cmd.stop(g.units);
  g.animalCd = 1e9; g.wave.next = 1e9;
  for (const h of g.huts) h.alive = false;
  const cx = w.base.tx + 1, cy = w.base.ty + 1;
  for (let ty = cy - 16; ty <= cy + 16; ty++) for (let tx = cx - 16; tx <= cx + 34; tx++) {
    const n = ty * w.W + tx;
    if (tx < 1 || ty < 1 || tx >= w.W - 1 || ty >= w.H - 1 || w.bld[n] || lj.isRoad(w.type[n])) continue;
    w.obj[n] = 0; w.deco[n] = 0; w.type[n] = lj.T.GRASS; g.fog[n] = 1; g.veins[n] = 0;
  }
  const jack = lj.jacks()[0];
  jack.hold = false;
  return { lj, g, w, jack, at: (dx, dy) => (cy + dy) * w.W + cx + dx };
}
function another(f, kind = 'jack') {
  const u = { ...f.jack, id: f.g.nextId++, kind, name: kind + ' ' + f.g.nextId, path: [], task: null, hp: f.lj.maxHpOf({ kind }) };
  f.g.units.push(u);
  return u;
}
// One fighter of a war party that is under way.
function warrior(f, tile) {
  const { g, w } = f;
  const a = {
    kind: 'native', wave: 1, alive: true, x: (tile % w.W) * 16 + 8, y: ((tile / w.W) | 0) * 16 + 10, tile, home: tile,
    hp: 100, max: 100, dmg: 10, cd: 1, speed: 40, dir: 1, walkT: 0, shootCd: 0, retarget: 0, repath: 0, aim: 0, hitCd: 0, path: []
  };
  g.animals.push(a);
  g.wave = { hostile: true, next: 1e9, n: 1, active: { size: 1, start: g.time, retreating: false } };
  return a;
}
// The same field with a village and one finished guard tower south-east of it; muzzle is where its bolts start.
function towerField() {
  const f = field(), { lj, g, w } = f;
  g.money = 10000; g.wood = 1000; g.lumber = 500; g.ore = 100; g.level = 7; g.stockpile = true;
  assert.ok(lj.buy('base'));
  finishConstruction(lj);
  assert.equal(lj.buy('tower'), 'place');
  assert.ok(lj.tryPlace(w.base.tx + 6, w.base.ty + 6));
  finishConstruction(lj);
  const tower = g.buildings.at(-1);
  return { ...f, tower, muzzle: { x: tower.tx * 16 + 16, y: (tower.ty + 2) * 16 + 1 - 64 + 12 } };
}

test('a war party stops for a crew in the forest and the jack defends himself', () => {
  const f = field(), { lj, g, w, jack } = f;
  g.up.rifles = true;
  put(jack, f.at(22, 0), w); jack.hold = true; // well outside the village, within bowshot of the party's route
  const a = warrior(f, f.at(19, 0)), x = a.x;
  step(lj, 3);
  assert.equal(a.tg.u, jack);
  assert.equal(a.x, x, 'the warrior stops in bow range');
  assert.ok(jack.hp < 100);
  assert.ok(a.hp < 100, 'the jack shoots back outside defended ground');
});

test('on defended ground a war party and the crew fight', () => {
  const f = field(), { lj, g, w, jack } = f;
  g.up.rifles = true;
  put(jack, f.at(4, 0), w); jack.hold = true;
  const a = warrior(f, f.at(8, 0));
  step(lj, 2);
  assert.ok(jack.hp < 100, 'the warrior shoots a jack in the village');
  assert.ok(a.hp < 100, 'and the jack shoots back');
});

test('a jack ordered to attack a war party fights it anywhere', () => {
  const f = field(), { lj, g, w, jack } = f;
  g.up.rifles = true;
  put(jack, f.at(22, 0), w);
  const a = warrior(f, f.at(19, 0));
  lj.cmd.hunt([jack], a);
  step(lj, 2);
  assert.ok(a.hp < 100);
});

test('a war party attacks a nearer bunkhouse before the towers or village', () => {
  const f = towerField(), { lj, g, tower } = f;
  assert.equal(lj.buy('bunk'), 'place');
  assert.ok(lj.tryPlace(g.base.tx + 12, g.base.ty - 6));
  const bunk = g.buildings.at(-1), a = warrior(f, f.at(14, -5)); // right beside the bunkhouse
  a.hp = a.max = 1e6;
  lj.combat.update(0.05);
  assert.equal(a.tg.b, bunk);
  const hp = bunk.hp;
  for (let i = 0; i < 20; i++) lj.combat.update(0.05);
  assert.ok(bunk.hp < hp);
});

for (const kind of ['jack', 'truck', 'dozer', 'harv', 'shuttle']) {
  test('a marching party switches from the village to an encountered ' + kind, () => {
    const f = field(), { lj, g, w } = f;
    g.units = [];
    const a = warrior(f, f.at(20, 0));
    lj.combat.update(0.05);
    assert.equal(a.tg.b, g.base);
    const u = another(f, kind);
    put(u, f.at(18, 0), w);
    for (let i = 0; i < 24; i++) lj.combat.update(0.05);
    assert.equal(a.tg.u, u);
    assert.ok(u.hp < lj.maxHpOf(u));
  });
}

for (const kind of ['wolf', 'lynx', 'wolverine', 'bear']) {
  test(kind + ' attacks an encountered vehicle and then a building before a distant jack', () => {
    const f = field(), { lj, g, w, jack } = f;
    g.units = [jack];
    put(jack, f.at(25, 0), w);
    const truck = another(f, 'truck');
    put(truck, f.at(3, 0), w);
    lj.spawnWildAt(kind, truck.tile, 1);
    const a = g.animals.at(-1), hp = truck.hp;
    // Even an already selected distant jack must not make the animal run past the truck.
    a.target = jack;
    step(lj, 0.1);
    assert.equal(a.target, truck);
    assert.ok(truck.hp < hp);
    truck.dead = true;
    put(a, f.at(1, 0), w);
    const bhp = g.base.hp;
    step(lj, 1);
    assert.equal(a.target, g.base);
    assert.ok(g.base.hp < bhp);
  });
  test(kind + ' reaches biting distance of a building from a diagonal approach', () => {
    const f = field(), { lj, g, w, jack } = f;
    g.units = [jack]; put(jack, f.at(30, 0), w);
    lj.spawnWildAt(kind, f.at(7, 7), 1);
    const hp = g.base.hp;
    until(lj, () => g.base.hp < hp, 20);
    assert.equal(g.animals[0].target, g.base);
  });
}

test('a guard tower aims ahead of a target on the move', () => {
  const f = towerField(), { lj, g, w, muzzle } = f;
  // Something running past, six tiles below the muzzle: without leading it, every bolt lands behind it.
  const row = Math.floor(muzzle.y / 16) + 6, col = Math.floor(muzzle.x / 16) - 4, tile = row * w.W + col;
  const runner = {
    kind: 'wolf', alive: true, x: col * 16 + 8, y: row * 16 + 10, tile, home: tile + 24, path: [], target: null,
    hp: 5000, max: 5000, dmg: 0, speed: 70, repath: 0, atkCd: 0, dir: 1, walkT: 0, flee: true
  };
  g.animals.push(runner);
  step(lj, 1.6);
  assert.ok(runner.x > col * 16 + 100, 'the target kept running');
  assert.ok(5000 - runner.hp >= 4 * 18, 'only ' + (5000 - runner.hp) + ' damage on a moving target');
});

test('a guard tower fires four bolts of 18, and six with Twin Tower Lasers, which also braces every tower', () => {
  const f = towerField(), { lj, g, tower, muzzle } = f;
  const target = { kind: 'wolf', alive: true, x: muzzle.x, y: muzzle.y + 9 * 16, hp: 1000, max: 1000 }; // nine tiles off
  g.animals.push(target);
  for (let i = 0; i < 18; i++) lj.combat.update(0.05);
  assert.equal(target.hp, 1000 - 4 * 18);
  assert.equal(tower.max, 320);
  assert.ok(lj.buy('twin'));
  assert.equal(tower.max, 480);
  assert.equal(tower.hp, 480);
  target.hp = 1000; tower.cd = 0; lj.combat.clearShots();
  for (let i = 0; i < 18; i++) lj.combat.update(0.05);
  assert.equal(target.hp, 1000 - 6 * 18);
  assert.equal(lj.buy('tower'), 'place');
  assert.ok(lj.tryPlace(g.base.tx - 6, g.base.ty + 6));
  assert.equal(g.buildings.at(-1).max, 480, 'a tower built afterwards is braced too');
});

test('jacks in the village come to its defence when a building is hit; crews far off do not', () => {
  const f = field(), { lj, g, w, jack } = f, far = another(f);
  put(jack, f.at(3, 3), w);
  put(far, f.at(25, 0), w);
  const held = another(f);
  put(held, f.at(3, 4), w); held.hold = true; // told to stop: stays put
  const a = warrior(f, f.at(6, 3)), hp = g.base.hp;
  lj.damageBuilding(g.base, 5, a);
  assert.equal(g.base.hp, hp - 5);
  assert.equal(jack.task.type, 'hunt');
  assert.equal(jack.task.a, a);
  assert.equal(far.task, null);
  assert.equal(held.task, null);
  // A war party that has turned back is let go, not chased into the forest.
  a.retreat = true;
  step(lj, 0.2);
  assert.equal(jack.task, null);
});

test('a damaged building is patched up once it has been left alone for a while', () => {
  const { lj, tower } = towerField();
  lj.damageBuilding(tower, 100);
  assert.equal(tower.hp, 220);
  step(lj, 5);
  assert.equal(tower.hp, 220, 'not while the fight may still be on');
  step(lj, 60);
  assert.equal(tower.hp, 320);
});

// A row of twenty trees starting fourteen tiles east of the camp.
function treeRow() {
  const f = field(), { w } = f;
  for (let dx = 14; dx < 34; dx++) { const n = f.at(dx, 0); w.obj[n] = 1; w.hp[n] = 1; w.variant[n] = 0; }
  return f;
}

test('without a foreman a jack clears what he sees from the spot he was sent to, then waits for orders', () => {
  const f = treeRow(), { lj, g, jack } = f;
  lj.cmd.chop([jack], f.at(14, 0));
  step(lj, 240);
  assert.equal(g.cleared, 7, 'the trees within six tiles of the first one');
  assert.equal(jack.task, null);
  assert.equal(lj.statusOf(jack), 'Idle — no trees in sight');
});

test('with a foreman a jack follows the forest edge until the trees are gone', () => {
  const f = treeRow(), { lj, g, jack } = f;
  g.up.foreman = true;
  lj.cmd.chop([jack], f.at(14, 0));
  until(lj, () => g.cleared === 20, 600);
});

test('a foreman sends idle hands on to the nearest explored trees, and leaves stopped ones alone', () => {
  const f = field(), { lj, g, w, jack } = f, held = another(f);
  for (let dx = 20; dx < 23; dx++) { const n = f.at(dx, 0); w.obj[n] = 1; w.hp[n] = 1; }
  put(jack, f.at(3, 0), w);
  put(held, f.at(3, 1), w); held.hold = true;
  step(lj, 3);
  assert.equal(jack.task, null, 'nothing in sight, and no foreman');
  g.up.foreman = true;
  step(lj, 2);
  assert.equal(jack.task.type, 'work');
  assert.equal(held.task, null);
  until(lj, () => g.cleared === 3, 240);
  // Trees nobody has seen yet are still the player's to find.
  const hidden = f.at(30, 0);
  w.obj[hidden] = 1; w.hp[hidden] = 1;
  g.fog.fill(0);
  for (let dx = -6; dx <= 12; dx++) for (let dy = -6; dy <= 6; dy++) g.fog[f.at(dx, dy)] = 1;
  lj.cmd.stop([jack]); jack.hold = false; put(jack, f.at(3, 0), w);
  step(lj, 3);
  assert.equal(jack.task, null);
});

test('with pickaxes a jack breaks up a plain rock that is in the way', () => {
  const f = field(), { lj, g, w, jack } = f, rock = f.at(6, 4);
  w.type[rock] = lj.T.ROCK;
  put(jack, f.at(3, 4), w);
  assert.equal(lj.cmd.mine([jack], rock), false, 'not without pickaxes');
  g.up.pick = true;
  const stone = g.stone;
  assert.equal(lj.cmd.mine([jack], rock), true);
  step(lj, 4);
  assert.equal(lj.statusOf(jack), 'Breaking up rock');
  assert.equal(w.type[rock], lj.T.ROCK, 'it takes a while');
  until(lj, () => w.type[rock] === lj.T.GRAVEL, 20);
  assert.equal(g.stone, stone + 1);
  assert.equal(jack.task, null, 'one rock is one errand');
  assert.equal(jack.ore, 0);
});

test('jacks sent to a rock together take one rock each, and the errand is not saved', () => {
  const f = field(), { lj, g, w, jack } = f, mate = another(f), a = f.at(6, 4), b = f.at(7, 4);
  w.type[a] = w.type[b] = lj.T.ROCK;
  g.up.pick = true;
  put(jack, f.at(3, 4), w); put(mate, f.at(3, 5), w);
  assert.ok(lj.cmd.mine([jack, mate], a));
  assert.deepEqual([jack.task.rock, mate.task.rock].sort(), [a, b].sort());
  step(lj, 2);
  lj.saveGame();
  const saved = JSON.parse(storage(lj).getItem('lumberjack-save'));
  assert.equal(saved.units.find(u => u.id === jack.id).task, null);
  until(lj, () => w.type[a] === lj.T.GRAVEL && w.type[b] === lj.T.GRAVEL, 40);
});

test('a bulldozer drives round rock when that is quicker, and breaks through when there is no way round', () => {
  const f = field(), { lj, w } = f, dozer = another(f, 'dozer');
  put(dozer, f.at(4, 8), w);
  // A block of rock six wide between the bulldozer and a stump, with open ground above and below it.
  for (let dx = 6; dx <= 11; dx++) for (let dy = 7; dy <= 9; dy++) w.type[f.at(dx, dy)] = lj.T.ROCK;
  const stump = f.at(13, 8);
  w.obj[stump] = lj.STUMP;
  assert.ok(lj.cmd.dozeTo([dozer], stump));
  assert.deepEqual([...dozer.task.job.tiles], [stump], 'no rock on the route');
  // A second stump walled in on every side: one rock has to go.
  const walled = f.at(20, 8);
  w.obj[walled] = lj.STUMP;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (dx || dy) w.type[f.at(20 + dx, 8 + dy)] = lj.T.ROCK;
  assert.ok(lj.cmd.dozeTo([dozer], walled));
  assert.equal(dozer.task.job.tiles.size, 2);
});
