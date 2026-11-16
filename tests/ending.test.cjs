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
  until(lj, () => g.cine.phase === 'end', 45);
  assert.equal(g.dc.next, g.dc.order.length);
  lj.ending.next();
  assert.equal(g.money, money + 1000000);
});

test('the data center leaves an island for the village, the crew and the visitor, and the river', () => {
  const lj = game(), g = lj.G, w = g.world, W = w.W;
  lj.cmd.stop(g.units);
  g.level = 10; g.cleared = g.total; g.levelDone = true; g.animalCd = 1e9;
  // Two towers straddling the edge between two 3x3 blocks: one half in the village's margin, one out in the field.
  const v = g.base, edge = Math.floor((v.tx + v.w) / 3) * 3 + 2;
  for (const [tx, ty] of [[edge, v.ty], [5, 5]]) g.buildings.push({ kind: 'tower', tx, ty, w: 2, h: 2, hp: 320, max: 320, queue: [] });
  lj.ending.start();
  until(lj, () => g.cine.phase === 'talk', 60);
  for (let i = 0; i < lj.LINES.ending.length; i++) lj.ending.next();
  until(lj, () => g.cine.phase === 'end', 40);
  const tileAt = (x, y) => Math.floor(y / lj.TS) * W + Math.floor(x / lj.TS);
  const b = g.base;
  for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) assert.ok(!lj.ending.covers(y * W + x), 'village');
  for (const u of g.units) assert.ok(!lj.ending.covers(tileAt(u.x, u.y)), u.kind + ' stays in sight');
  assert.ok(!lj.ending.covers(tileAt(g.suit.x, g.suit.y)), 'the visitor');
  for (const bl of g.buildings) {
    const tiles = [];
    for (let y = bl.ty; y < bl.ty + bl.h; y++) for (let x = bl.tx; x < bl.tx + bl.w; x++) tiles.push(lj.ending.covers(y * W + x));
    assert.ok(tiles.every(Boolean) || !tiles.some(Boolean), bl.kind + ' is either swallowed whole or left whole');
  }
  let land = 0, covered = 0, wet = 0, wetCovered = 0;
  for (let i = 0; i < w.N; i++) {
    if (w.type[i] === lj.T.WATER) { wet++; if (lj.ending.covers(i)) wetCovered++; }
    else { land++; if (lj.ending.covers(i)) covered++; }
  }
  assert.ok(covered / land > 0.85, 'it still covers the land: ' + covered + '/' + land);
  if (wet) assert.ok(wetCovered / wet < 0.5, 'the river stays open as cooling water');
});

test('no building hides Mr. Grant or Jack while they talk', () => {
  // A building drawn after a figure (its base line is lower) and overlapping it hides that figure.
  // Written out here on purpose rather than calling the game's own check, so the two can disagree.
  const hiddenBy = (lj, x, y) => lj.G.buildings.find(b => {
    if (b.dead || b.pending) return false;
    const spr = lj.bldSprite(b), [ox, oy] = lj.bldOrigin(b);
    return (b.ty + b.h) * lj.TS > y && ox < x + 6 && ox + spr.width > x - 6 && oy < y && oy + spr.height > y - 20;
  });
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 42]) {
    const lj = game(seed), g = lj.G;
    lj.cmd.stop(g.units);
    g.tier = lj.sprites.base.length - 1; // the full-grown village is the tallest sprite on the map
    Object.assign(lj.sprites.base[g.tier], { width: 74, height: 96 }); // its real size; the harness stubs canvases
    for (let n = 0; n < g.world.N; n++) if (lj.isTree(n)) g.world.obj[n] = lj.STUMP; // as at the real ending
    g.level = 10; g.cleared = g.total; g.levelDone = true; g.animalCd = 1e9;
    lj.ending.start();
    until(lj, () => g.cine.phase === 'talk', 60);
    for (let i = 0; i < 40; i++) lj.update(0.05); // the crew finishes gathering
    assert.equal(hiddenBy(lj, g.suit.x, g.suit.y), undefined, 'Mr. Grant, seed ' + seed);
    assert.equal(hiddenBy(lj, g.cine.jack.x, g.cine.jack.y), undefined, 'Jack, seed ' + seed);
    for (const u of lj.jacks()) assert.equal(hiddenBy(lj, u.x, u.y), undefined, 'a jack in the crowd, seed ' + seed);
  }
});
