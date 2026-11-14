const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, until, finishConstruction } = require('./harness.cjs');

function sawmillGame() {
  const lj = game(), g = lj.G;
  lj.cmd.stop(lj.jacks());
  g.money = 10000; g.wood = 1000; g.level = 6; g.stockpile = true;
  g.animalCd = 1e9; g.wave.hostile = true; g.wave.next = 1e9;
  lj.buy('base'); finishConstruction(lj); lj.buy('sawmill');
  placeMill(lj);
  return lj;
}

function placeMill(lj) {
  const g = lj.G;
  for (let y = g.base.ty - 6; y < g.base.ty + 7; y++) for (let x = g.base.tx - 6; x < g.base.tx + 7; x++) {
    if (lj.canPlace(x, y) && lj.tryPlace(x, y)) { finishConstruction(lj); return; }
  }
  throw Error('No sawmill site in test fixture');
}

test('destroying a sawmill stops phantom lumber production', () => {
  const lj = sawmillGame(), g = lj.G, jack = lj.jacks()[0];
  g.stockpile = true;
  lj.cmd.saw([jack]); until(lj, () => jack.state === 'saw', 30);
  lj.damageBuilding(g.buildings.find(b => b.kind === 'sawmill'), 9999);
  const lumber = g.lumber, wood = g.wood;
  step(lj, 4);
  assert.equal(g.count.sawmill, 0);
  assert.equal(g.lumber, lumber);
  assert.equal(g.wood, wood);
  assert.notEqual(jack.task && jack.task.type, 'saw');
});

test('a displaced sawyer resumes work at a surviving mill', () => {
  const lj = sawmillGame(), g = lj.G, jack = lj.jacks()[0];
  g.stockpile = true;
  lj.cmd.saw([jack]); until(lj, () => jack.state === 'saw', 30);
  const first = g.buildings.find(b => b.kind === 'sawmill');
  lj.buy('sawmill'); placeMill(lj);
  lj.damageBuilding(first, 9999);
  const lumber = g.lumber;
  until(lj, () => g.lumber > lumber, 30);
  assert.equal(g.count.sawmill, 1);
  assert.equal(jack.task.type, 'saw');
});

test('stockpiling at an upgraded village allows saving lumber for the Town Hall', () => {
  const lj = sawmillGame(), g = lj.G;
  g.lumber = 80; g.stockpile = true;
  step(lj, 20);
  assert.equal(g.lumber, 80);
  g.tier = 2;
  assert.equal(lj.shopState(lj.SHOP.find(it => it.id === 'base')).st, 'ok');
  assert.ok(lj.buy('base'));
  finishConstruction(lj);
  assert.equal(g.tier, 3);
  assert.equal(g.lumber, 0);
});

test('repeat waves vary between maps but keep a recovery window', () => {
  const patterns = [];
  for (const seed of [1, 42, 12345]) {
    const lj = game(seed), g = lj.G, sizes = [], gaps = [];
    g.level = 6; lj.combat.update(0);
    assert.equal(lj.combat.nextWaveIn(), 50);
    for (let k = 0; k < 4; k++) {
      g.time = g.wave.next; lj.combat.update(0);
      assert.ok(g.wave.active);
      sizes.push(g.wave.active.size);
      assert.ok(g.wave.active.size >= 3 && g.wave.active.size <= 28);
      g.animals = []; lj.combat.update(0);
      gaps.push(g.wave.next - g.time);
    }
    assert.ok(gaps.every(gap => gap >= 60 && gap <= 140));
    assert.ok(new Set(gaps).size > 1);
    patterns.push(sizes.join(','));
  }
  assert.ok(new Set(patterns).size > 1);
});

test('late forest retains small threats; no phantom countdown at the last three trees', () => {
  const lj = game(), g = lj.G;
  // Keep a real, reachable pocket of 40 trees; clear the rest for this late-stage fixture.
  const w = g.world, home = w.huts.find(h => lj.enemyPath(h, n => g.villMask[n]));
  assert.ok(home !== undefined);
  const trees = Array.from({ length: w.N }, (_, n) => n).filter(lj.isTree);
  trees.sort((a, b) => Math.hypot(a % w.W - home % w.W, ((a / w.W) | 0) - ((home / w.W) | 0)) - Math.hypot(b % w.W - home % w.W, ((b / w.W) | 0) - ((home / w.W) | 0)));
  const keep = new Set(trees.slice(0, 40));
  for (const n of trees) if (!keep.has(n)) w.obj[n] = lj.STUMP;
  g.level = 10; g.wave.hostile = true; g.wave.next = g.time;
  g.cleared = g.total - 40;
  lj.combat.update(0);
  assert.ok(g.wave.active);
  assert.ok(g.wave.active.size <= 6);
  lj.combat.update(0.05);
  assert.equal(g.wave.active.retreating, false);
  g.animals = []; g.wave.active = null; g.cleared = g.total - 3;
  assert.equal(lj.combat.nextWaveIn(), null);
});
