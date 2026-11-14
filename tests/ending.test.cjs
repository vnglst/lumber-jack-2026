const test = require('node:test');
const assert = require('node:assert/strict');
const { game, until } = require('./harness.cjs');

test('all nine advancement gates require both trees and earned revenue', () => {
  const lj = game(), g = lj.G;
  lj.cmd.stop(g.units); g.animalCd = 1e9;
  for (let level = 1; level < 10; level++) {
    g.level = level; g.cleared = g.thr[level - 1] - 1; g.earned = g.quota[level - 1];
    lj.update(0.05);
    assert.equal(g.level, level);
    if (g.quota[level - 1]) {
      g.cleared++; g.earned--;
      lj.update(0.05);
      assert.equal(g.level, level);
      g.earned++;
    } else g.cleared++;
    lj.update(0.05);
    assert.equal(g.level, level + 1);
    assert.equal(g.cine, null);
  }
});

test('the real last-tree work order reaches the complete ending, once', () => {
  const lj = game(), g = lj.G, w = g.world, jack = lj.jacks()[0], spoken = [];
  lj.ui.cineLine = text => spoken.push(text);
  lj.cmd.stop(g.units);
  // Controlled endgame fixture, not a claim of organically playing through ten levels.
  const trees = Array.from({ length: w.N }, (_, n) => n).filter(lj.isTree);
  trees.sort((a, b) => Math.abs(a % w.W - jack.tile % w.W) + Math.abs(((a / w.W) | 0) - ((jack.tile / w.W) | 0)) - Math.abs(b % w.W - jack.tile % w.W) - Math.abs(((b / w.W) | 0) - ((jack.tile / w.W) | 0)));
  const last = trees[0];
  for (const n of trees) if (n !== last) w.obj[n] = lj.STUMP;
  g.level = 10; g.cleared = g.total - 1; g.earned = 0; g.animalCd = 1e9;
  lj.revealAll();
  lj.update(0.05);
  assert.equal(g.cine, null);
  assert.deepEqual(spoken, []);
  w.hp[last] = 0.01;
  lj.cmd.chop([jack], last);
  until(lj, () => g.cine, 30);
  assert.equal(g.cleared, g.total);
  assert.ok(g.levelDone);
  until(lj, () => g.cine.phase === 'talk', 30);
  const money = g.money;
  for (let i = 0; i < lj.LINES.ending.length; i++) lj.ending.next();
  assert.equal(g.money, money + 1000000);
  until(lj, () => g.cine.phase === 'end', 35);
  assert.equal(g.dc.next, g.dc.order.length);
  lj.ending.next();
  assert.equal(g.money, money + 1000000);
});
