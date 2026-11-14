const test = require('node:test');
const assert = require('node:assert/strict');
const { game } = require('./harness.cjs');

function folkNear(lj, u) {
  const a = {
    kind: 'native', alive: true, x: u.x - 40, y: u.y, tile: u.tile,
    hp: 100, max: 100, dmg: 10, cd: 1, speed: 40, dir: 1, walkT: 0,
    shootCd: 0, retarget: 0, repath: 0, aim: 0, hitCd: 0, path: []
  };
  lj.G.animals.push(a);
  return a;
}

for (const kind of ['jack', 'truck', 'dozer', 'harv', 'shuttle']) {
  test('locals target and damage ' + kind, () => {
    const lj = game(), g = lj.G;
    const u = { ...g.units[0], kind, id: 99, path: [], task: null, dead: false };
    u.hp = lj.maxHpOf(u);
    g.units = [u];
    const a = folkNear(lj, u), hp = u.hp;
    for (let i = 0; i < 20; i++) lj.combat.update(0.05);
    assert.equal(a.tg.u, u);
    assert.ok(u.hp < hp);
    assert.ok(!u.dead);
    g.sel.add(u);
    lj.hurtUnit(u, 1000, a);
    assert.ok(u.dead);
    assert.ok(!g.sel.has(u));
    assert.equal(g.graves.length, kind === 'jack' ? 1 : 0);
  });
}

test('locals retarget after a vehicle is destroyed', () => {
  const lj = game(), g = lj.G, truck = g.units[0], jack = lj.jacks()[0];
  const a = folkNear(lj, truck);
  lj.combat.update(0.05);
  assert.equal(a.tg.u, truck);
  lj.hurtUnit(truck, 1000, a);
  lj.combat.update(0.05);
  assert.equal(a.tg.u, jack);
});
