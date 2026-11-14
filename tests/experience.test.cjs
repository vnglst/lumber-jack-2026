const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction, storage } = require('./harness.cjs');

function nextTree(lj, jack) {
  const w = lj.G.world;
  const trees = Array.from({ length: w.N }, (_, n) => n).filter(n => lj.isTree(n) && lj.G.fog[n]);
  trees.sort((a, b) => Math.hypot(a % w.W - jack.tile % w.W, ((a / w.W) | 0) - ((jack.tile / w.W) | 0)) - Math.hypot(b % w.W - jack.tile % w.W, ((b / w.W) | 0) - ((jack.tile / w.W) | 0)));
  return trees[0];
}

test('a real felled tree earns individual XP and can promote its Jack', () => {
  const lj = game(), g = lj.G, jack = lj.jacks()[0];
  lj.cmd.stop(g.units);
  jack.xp = 39;
  const tree = nextTree(lj, jack);
  lj.cmd.chop([jack], tree);
  until(lj, () => g.cleared === 1, 30);
  assert.equal(jack.xp, 43);
  assert.equal(lj.rankOf(jack).name, 'Woodsman');
  assert.equal(lj.capOf(jack), 10);
  assert.ok(g.floats.some(f => f.cls === 'xp' && f.text === 'Woodsman!'));
  assert.equal(g.units.find(u => u.kind === 'truck').xp, 0);
  lj.buy('jack');
  assert.equal(lj.jacks()[1].xp, 0);
});

test('partial whacks, idle time and empty deliveries cannot farm XP', () => {
  const lj = game(), g = lj.G, jack = lj.jacks()[0];
  lj.cmd.stop(g.units); g.animalCd = 1e9;
  step(lj, 10);
  assert.equal(jack.xp, 0);
  const tree = nextTree(lj, jack);
  lj.cmd.chop([jack], tree);
  until(lj, () => jack.state === 'chop', 30);
  assert.ok(lj.whack(tree));
  assert.equal(jack.xp, 0);
  lj.cmd.stop([jack]);
  jack.state = 'toDrop'; jack.carry = 0;
  lj.update(0.05);
  assert.equal(jack.xp, 0);
});

test('masters chop faster; their bonuses stack with tools and stay capped', () => {
  const times = [];
  for (const xp of [0, 1200]) {
    const lj = game(), g = lj.G, jack = lj.jacks()[0];
    lj.cmd.stop(g.units); jack.xp = xp;
    lj.cmd.chop([jack], nextTree(lj, jack));
    until(lj, () => jack.state === 'chop', 30);
    const start = g.time;
    until(lj, () => g.cleared === 1, 10);
    times.push(g.time - start);
    if (xp) {
      assert.equal(jack.xp, 1200);
      assert.equal(lj.capOf(jack), 14);
      g.up.barrow = true;
      assert.equal(lj.capOf(jack), 30);
      const truck = g.units.find(u => u.kind === 'truck');
      truck.xp = 1200;
      assert.equal(lj.capOf(truck), 60);
    }
  }
  assert.ok(times[1] < times[0] * 0.75);
});

test('experienced Jacks walk faster, but walking itself earns no XP', () => {
  const times = [];
  for (const xp of [0, 1200]) {
    const lj = game(), g = lj.G, w = g.world, jack = lj.jacks()[0];
    lj.cmd.stop(g.units); jack.xp = xp;
    const destination = w.type.findIndex((t, n) => lj.isRoad(t) && n % w.W === w.start.x - 8);
    assert.ok(destination >= 0);
    const start = g.time;
    lj.cmd.move([jack], destination);
    until(lj, () => jack.tile === destination && !jack.path.length, 30);
    times.push(g.time - start);
    assert.equal(jack.xp, xp);
  }
  assert.ok(times[1] < times[0]);
});

test('harvesters do not gain experience from felling trees', () => {
  const lj = game(), g = lj.G, machine = lj.jacks()[0];
  lj.cmd.stop(g.units);
  machine.kind = 'harv';
  lj.cmd.chop([machine], nextTree(lj, machine));
  until(lj, () => g.cleared === 1, 30);
  assert.equal(machine.xp, 0);
  assert.equal(lj.capOf(machine), 40);
});

test('camp deliveries and a Jack market run award XP only for transferred goods', () => {
  const lj = game(), g = lj.G, jack = lj.jacks()[0];
  lj.cmd.stop(g.units);
  jack.carry = 8; jack.state = 'toDrop';
  lj.update(0.05);
  assert.equal(jack.xp, 2);
  assert.equal(g.wood, 8);
  jack.state = 'toDrop'; lj.update(0.05);
  assert.equal(jack.xp, 2);
  g.wood = 28;
  lj.cmd.sell([jack]);
  until(lj, () => g.sold === 8, 60);
  assert.equal(jack.xp, 6);
});

test('processing real lumber earns XP and improves with rank', () => {
  const times = [];
  for (const xp of [0, 1200]) {
    const lj = game(), g = lj.G, jack = lj.jacks()[0];
    lj.cmd.stop(g.units);
    g.money = 1000; g.wood = 100; g.level = 2; g.stockpile = true;
    lj.buy('base'); finishConstruction(lj); lj.buy('sawmill');
    let built = false;
    for (let y = g.base.ty - 6; y < g.base.ty + 7 && !built; y++) for (let x = g.base.tx - 6; x < g.base.tx + 7 && !built; x++) {
      if (lj.canPlace(x, y)) built = lj.tryPlace(x, y);
    }
    assert.ok(built);
    finishConstruction(lj);
    jack.xp = xp;
    lj.cmd.saw([jack]); until(lj, () => jack.state === 'saw', 30);
    const start = g.time;
    until(lj, () => g.lumber === 1, 10);
    times.push(g.time - start);
    assert.equal(jack.xp, xp ? 1200 : 2);
    lj.cmd.stop([jack]);
    step(lj, 1);
    assert.equal(jack.xp, xp ? 1200 : 2);
  }
  assert.ok(times[1] < times[0] * 0.75);
});

test('XP survives current saves; older saves without XP remain compatible', () => {
  const lj = game(), jack = lj.jacks()[0];
  jack.xp = 175;
  lj.saveGame();
  const store = storage(lj), saved = JSON.parse(store.getItem('lumberjack-save'));
  assert.equal(saved.v, 8);
  assert.ok(lj.loadGame());
  assert.equal(lj.jacks()[0].xp, 175);
  assert.equal(lj.rankOf(lj.jacks()[0]).name, 'Veteran');
  for (const version of [2, 3, 4, 5]) {
    const old = JSON.parse(JSON.stringify(saved));
    old.v = version; old.units.forEach(u => delete u.xp);
    store.setItem('lumberjack-save', JSON.stringify(old));
    assert.ok(lj.hasSave());
    assert.ok(lj.loadGame());
    assert.equal(lj.jacks()[0].xp, 0);
    assert.equal(lj.rankOf(lj.jacks()[0]).name, 'Greenhorn');
  }
});
