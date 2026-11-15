const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { game, step, until, storage } = require('./harness.cjs');
const source = fs.readFileSync(path.join(__dirname, '../js/playground-scenes.js'), 'utf8');

function playground(seed = 42) {
  const lj = game(seed);
  // The browser boot does not load save.js at all. These are the same no-op lifecycle hooks.
  lj.saveGame = lj.clearSave = () => {};
  lj.hasSave = lj.loadGame = () => false;
  vm.runInNewContext(source, { LJ: lj });
  return lj;
}

test('playground stages every level with matching physical tree progress and ordinary shop unlocks', () => {
  const lj = playground();
  for (let level = 1; level <= 10; level++) {
    lj.playground.load({ scene: 'level', level, seed: 42 });
    const g = lj.G;
    assert.equal(g.level, level);
    assert.equal(g.cleared, level > 1 ? g.thr[level - 2] : 0);
    assert.equal(Array.from(g.world.obj).filter(o => o >= 1 && o <= 3).length, g.total - g.cleared);
    assert.ok(!g.arrival);
    assert.ok(lj.jacks().length);
    assert.equal(g.money, 10000);
    assert.equal(lj.shopState(lj.SHOP.find(it => it.id === 'harv')).st, level < 6 ? 'locked' : 'ok');
  }
});

test('playground uses live wolves, bears, hut defenders and raiding parties', () => {
  const lj = playground();
  for (const [scene, kind, count] of [['wolf', 'wolf', 1], ['pack', 'wolf', 3], ['bear', 'bear', 1]]) {
    lj.playground.load({ scene, level: 5, seed: 42 });
    assert.equal(lj.G.animals.length, count);
    assert.ok(lj.G.animals.every(a => a.kind === kind && a.alive && a.hp > 0));
    const jack = lj.jacks()[0], hp = jack.hp;
    step(lj, 8);
    assert.ok(jack.hp < hp || lj.G.animals.some(a => a.hp < a.max), scene + ' must fight in real simulation');
  }
  lj.playground.load({ scene: 'hut', level: 3, seed: 42 });
  assert.equal(lj.G.animals.filter(a => a.defender).length, 2);
  const hut = lj.G.huts.find(h => h.angry);
  assert.ok(hut.alive);
  assert.ok(lj.G.animals.every(a => a.home === hut.tile));
  lj.playground.load({ scene: 'raid', level: 1, seed: 42 });
  assert.equal(lj.G.level, 5);
  assert.ok(lj.G.wave.active);
  assert.ok(lj.G.animals.some(a => a.wave));
});

test('opening and ending replay never alter campaign storage, including restart hooks', () => {
  const lj = playground(), store = storage(lj);
  store.setItem('lumberjack-save', 'campaign sentinel');
  lj.playground.load({ scene: 'arrival', seed: 42 });
  assert.ok(lj.G.arrival);
  lj.playground.load({ scene: 'ending', seed: 42 });
  assert.equal(lj.G.cleared, lj.G.total);
  assert.equal(lj.G.cine.phase, 'walk');
  until(lj, () => lj.G.cine.phase === 'talk', 180);
  for (let n = 0; n < lj.LINES.ending.length; n++) lj.ending.next();
  until(lj, () => lj.G.cine.phase === 'end', 60);
  lj.clearSave(); lj.newGame(43); lj.saveGame();
  assert.equal(store.getItem('lumberjack-save'), 'campaign sentinel');
});

test('invalid review options cannot reset an existing scene', () => {
  const lj = playground(), seed = lj.G.world.seed;
  assert.throws(() => lj.playground.load({ scene: 'unknown' }), /Unknown scene/);
  assert.throws(() => lj.playground.load({ seed: 0 }), /seed/);
  assert.equal(lj.G.world.seed, seed);
});
