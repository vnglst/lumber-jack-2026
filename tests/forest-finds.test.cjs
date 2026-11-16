const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, storage } = require('./harness.cjs');

function recover(lj, kind) {
  const g = lj.G, w = g.world, f = g.finds.find(f => f.kind === kind), u = lj.jacks()[0];
  g.fog[f.tile] = 1;
  u.tile = f.tile; u.x = f.tile % w.W * 16 + 8; u.y = Math.floor(f.tile / w.W) * 16 + 10;
  lj.discoveries.update();
  assert.equal(f.found, false, 'buried find cannot be recovered through a standing tree');
  w.obj[f.tile] = lj.STUMP;
  lj.discoveries.update();
  assert.equal(f.found, true);
  return f;
}

test('seeded forest discoveries are stable and reward collection only once', () => {
  const lj = game(), same = game();
  assert.equal(JSON.stringify(lj.G.finds), JSON.stringify(same.G.finds));
  assert.equal(lj.G.finds.length, 12);
  const before = lj.G.money;
  recover(lj, 'gold');
  assert.equal(lj.G.money - before, 90);
  lj.discoveries.update();
  assert.equal(lj.G.money - before, 90);
});

test('recipes change capacity and saved finds survive reloading; old saves gain finds', () => {
  const lj = game(), jack = lj.jacks()[0], before = lj.capOf(jack);
  recover(lj, 'sling');
  assert.equal(lj.capOf(jack), before + 4);
  lj.saveGame();
  assert.equal(JSON.parse(storage(lj).getItem('lumberjack-save')).v, 10);
  assert.ok(lj.loadGame());
  assert.equal(lj.G.recipes.join(','), 'sling');
  assert.ok(lj.G.finds.find(f => f.kind === 'sling').found);
  const saved = JSON.parse(storage(lj).getItem('lumberjack-save'));
  saved.v = 7; delete saved.g.finds; delete saved.g.recipes;
  storage(lj).setItem('lumberjack-save', JSON.stringify(saved));
  assert.ok(lj.loadGame());
  assert.equal(lj.G.finds.length, 12);
  assert.equal(lj.G.recipes.length, 0);
});

test('felling tractor cuts, carries, deposits and stops without a Jack', () => {
  const lj = game(), g = lj.G, w = g.world;
  lj.cmd.stop(g.units);
  const tractor = g.units.find(u => u.kind === 'truck');
  tractor.kind = 'feller'; tractor.wage = 18; tractor.hp = lj.maxHpOf(tractor);
  const t = (w.start.y + 3) * w.W + w.start.x;
  for (let y = w.start.y - 5; y <= w.start.y + 11; y++) for (let x = w.start.x - 9; x <= w.start.x + 9; x++) {
    const i = y * w.W + x; if (!w.bld[i]) { w.obj[i] = 0; w.type[i] = lj.T.GRASS; }
  }
  tractor.tile = t; tractor.x = t % w.W * 16 + 8; tractor.y = Math.floor(t / w.W) * 16 + 10;
  w.obj[t + 1] = 1; w.hp[t + 1] = 1; g.fog[t + 1] = 1;
  const cleared = g.cleared;
  lj.cmd.chop([tractor], t + 1);
  step(lj, 3);
  assert.equal(g.cleared, cleared + 1);
  assert.equal(w.obj[t + 1], lj.STUMP);
  step(lj, 15);
  assert.ok(g.wood >= 3);
  lj.cmd.stop([tractor]);
  const x = tractor.x, y = tractor.y;
  step(lj, 2);
  assert.equal(tractor.x, x); assert.equal(tractor.y, y);
  assert.ok(tractor.hold);
});

test('resin recipe accelerates real chopping and saw recipe accelerates real processing', () => {
  function chop(recipes) {
    const lj = game(), g = lj.G, w = g.world, jack = lj.jacks()[0];
    lj.cmd.stop(g.units); g.recipes = recipes;
    const tile = jack.tile + 1;
    w.obj[tile] = 2; w.hp[tile] = 1; w.bld[tile] = 0; g.fog[tile] = 1;
    jack.state = 'chop'; jack.target = tile; jack.hold = false;
    step(lj, 1);
    return 1 - w.hp[tile];
  }
  assert.ok(chop(['resin']) > chop([]) * 1.15);
  function saw(recipes) {
    const lj = game(), g = lj.G, jack = lj.jacks()[0];
    lj.cmd.stop(g.units); g.recipes = recipes;
    const x = jack.tile % g.world.W, y = Math.floor(jack.tile / g.world.W);
    g.buildings.push({ kind: 'sawmill', tx: x + 1, ty: y, w: 3, h: 2, hp: 160, max: 160, queue: [] });
    g.count.sawmill = 1; g.wood = 100;
    jack.state = 'saw'; jack.task = { type: 'saw' }; jack.hold = false;
    step(lj, 3);
    return g.lumber;
  }
  assert.equal(saw([]), 0);
  assert.equal(saw(['saw']), 1);
});

test('a nearly cleared version 7 save gains the original twelve finds without restoring trees', () => {
  const lj = game(), g = lj.G, w = g.world;
  const original = JSON.stringify(g.finds);
  let remaining = -1;
  for (let i = 0; i < w.N; i++) if (lj.isTree(i)) {
    if (remaining < 0) remaining = i;
    else w.obj[i] = lj.STUMP;
  }
  g.cleared = g.total - 1;
  g.level = 10;
  const objects = Array.from(w.obj);
  lj.saveGame();
  const saved = JSON.parse(storage(lj).getItem('lumberjack-save'));
  saved.v = 7; delete saved.g.finds; delete saved.g.recipes;
  storage(lj).setItem('lumberjack-save', JSON.stringify(saved));
  assert.ok(lj.loadGame());
  assert.equal(JSON.stringify(g.finds), original, 'migration uses original forest locations and includes every reward');
  assert.equal(g.recipes.length, 0);
  assert.deepEqual(Array.from(g.world.obj), objects, 'migration does not restore any felled trees');
  assert.equal(g.cleared, g.total - 1);
  assert.equal(g.level, 10);
  assert.ok(lj.isTree(remaining));
});
