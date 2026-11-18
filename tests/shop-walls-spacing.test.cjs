// §106: palisades come down again, bulldozers are cheap and unlimited, guard towers are unlimited, and units do not
// draw on top of each other.
const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step, finishConstruction, put } = require('./harness.cjs');

function rich() {
  const lj = game(), g = lj.G;
  lj.cmd.stop(g.units);
  Object.assign(g, { money: 100000, wood: 1000, lumber: 1000, ore: 1000, level: 9, animalCd: 1e9 });
  lj.buy('base'); finishConstruction(lj);
  return { lj, g, w: g.world };
}
const item = (lj, id) => lj.SHOP.find(s => s.id === id);

test('bulldozers stay cheap and can be bought without limit', () => {
  const { lj, g } = rich();
  const first = item(lj, 'dozer').cost().m;
  assert.ok(first <= 250, 'a bulldozer is cheap: €' + first);
  for (let n = 0; n < 8; n++) {
    const money = g.money;
    assert.equal(lj.buy('dozer'), true, 'bulldozer ' + (n + 1));
    assert.equal(money - g.money, first, 'every bulldozer costs the same');
  }
  assert.equal(lj.countKind('dozer'), 8);
  assert.equal(lj.shopState(item(lj, 'dozer')).st, 'ok');
});

test('guard towers have no limit', () => {
  const { lj, g } = rich();
  for (let n = 0; n < 9; n++) g.buildings.push({ kind: 'tower', tx: 0, ty: 0, w: 2, h: 2, hp: 1, max: 1, queue: [] });
  assert.equal(lj.shopState(item(lj, 'tower')).st, 'ok');
});

function walled() {
  const { lj, g, w } = rich();
  const ox = w.start.x + 8, oy = w.start.y + 8, at = (x, y) => (oy + y) * w.W + ox + x;
  for (let y = 0; y <= 4; y++) for (let x = 0; x <= 6; x++) {
    const i = at(x, y);
    w.obj[i] = w.bld[i] = w.wall[i] = 0; w.type[i] = lj.T.GRASS; g.fog[i] = 1;
  }
  g.units = []; g.animals = []; g.critters = [];
  const line = [1, 2, 3, 4, 5].map(x => at(x, 2));
  assert.equal(lj.buildWalls(line), 5);
  return { lj, g, w, line };
}

test('palisade sections being built are taken down with a full refund', () => {
  const { lj, g, w, line } = walled();
  const money = g.money, wood = g.wood;
  assert.equal(lj.removeWalls(line.slice(0, 2)), 2);
  assert.equal(w.wall[line[0]], 0); assert.equal(w.wall[line[1]], 0); assert.ok(w.wall[line[2]]);
  assert.equal(g.wallSites[line[0]], undefined, 'the building site goes too');
  assert.equal(g.money, money + 2 * lj.WALL_COST.m);
  assert.equal(g.wood, wood + 2 * lj.WALL_COST.w);
  step(lj, 20);
  assert.equal(w.wall[line[0]], 0, 'a removed site is not finished later');
});

test('finished palisades come down and give their wood back; tiles without one are skipped', () => {
  const { lj, g, w, line } = walled();
  step(lj, 20);
  assert.ok(line.every(i => w.wall[i] > 1), 'finished');
  const money = g.money, wood = g.wood, gap = line[0] - 1;
  assert.equal(lj.removeWalls([gap, ...line]), 5);
  assert.ok(line.every(i => !w.wall[i]));
  assert.equal(g.money, money);
  assert.equal(g.wood, wood + 5 * lj.WALL_COST.w);
  assert.ok(line.every(i => lj.pass(i)), 'the ground is open again');
});

test('palisades cannot be taken down during the ending', () => {
  const { lj, g, w, line } = walled();
  g.cine = {};
  assert.equal(lj.removeWalls(line), 0);
  assert.ok(w.wall[line[0]]);
});

test('units on the same spot are drawn apart without moving their real position', () => {
  const { lj, g, w } = rich();
  const jacks = lj.jacks().slice(0, 1);
  const tile = jacks[0].tile;
  g.units = jacks;
  for (const kind of ['jack', 'jack', 'truck']) {
    const u = Object.assign({}, jacks[0], { id: 900 + g.units.length, kind, task: null, path: [] });
    g.units.push(u);
  }
  for (const u of g.units) put(u, tile, w);
  step(lj, 3);
  const at = u => [u.x + (u.ox || 0), u.y + (u.oy || 0)];
  for (let i = 0; i < g.units.length; i++) for (let j = i + 1; j < g.units.length; j++) {
    const [ax, ay] = at(g.units[i]), [bx, by] = at(g.units[j]);
    assert.ok(Math.hypot(ax - bx, ay - by) >= 5, 'units ' + i + ' and ' + j + ' are apart: ' + Math.hypot(ax - bx, ay - by).toFixed(1));
  }
  for (const u of g.units) {
    assert.equal(u.tile, tile, 'the tile the rules use is unchanged');
    assert.ok(Math.hypot(u.ox, u.oy) <= 9, 'the offset stays small');
  }
  // On their own again, they settle back onto their real spot.
  g.units = [g.units[0]];
  step(lj, 10);
  assert.ok(Math.hypot(g.units[0].ox, g.units[0].oy) < 0.5);
});
