// The four predators: when each appears, how each differs, and that everything they need is defined.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { game, step, put } = require('./harness.cjs');

const WILD = ['wolf', 'lynx', 'wolverine', 'bear'];

test('each predator appears from its own level, and wolves are never squeezed out', () => {
  const lj = game(1, false);
  const kinds = level => { const seen = new Set(); for (let r = 0; r < 1; r += 0.001) seen.add(lj.wildKind(level, r)); return [...seen].sort(); };
  assert.deepEqual(kinds(1), ['wolf']);
  assert.deepEqual(kinds(2), ['wolf']);
  assert.deepEqual(kinds(3), ['lynx', 'wolf']);
  assert.deepEqual(kinds(4), ['bear', 'lynx', 'wolf']);
  assert.deepEqual(kinds(5), ['bear', 'lynx', 'wolf']);
  for (let level = 6; level <= 10; level++) {
    assert.deepEqual(kinds(level), ['bear', 'lynx', 'wolf', 'wolverine']);
    const others = ['bear', 'wolverine', 'lynx'].reduce((a, k) => a + lj.FOE[k].chance(level), 0);
    assert.ok(others <= 0.8, 'level ' + level + ': wolves keep at least a fifth of encounters');
  }
});

test('every predator has its rules, lines, cues and a sprite', () => {
  const lj = game(1, false);
  const sprites = fs.readFileSync(path.join(__dirname, '../js/sprites2.js'), 'utf8');
  const cues = new Set(lj.CUES.map(c => c.id));
  for (const kind of WILD) {
    const f = lj.FOE[kind];
    assert.ok(f.wild && f.pelt > 0 && f.wallDmg > 0, kind);
    for (const k of ['hp', 'dmg', 'speed']) assert.ok(f[k] > 0, kind + '.' + k);
    assert.ok(Array.isArray(f.hit) && f.hit.length, kind + ' has lines for a jack being bitten');
    for (const id of [f.cry, f.die, f.appear]) assert.ok(cues.has(id), kind + ' cue ' + id);
    assert.match(f.death('Jukka'), /^Jukka was /);
    assert.equal(typeof f.warn(2, 'Jukka'), 'string');
    assert.ok(f.group(5, 10) >= 1);
    assert.ok(sprites.includes('S.' + kind + ' = '), kind + ' sprite');
  }
  assert.equal(lj.FOE.lynx.group(5, 10), 1, 'a lynx hunts alone');
  assert.equal(lj.FOE.wolverine.group(5, 10), 2, 'wolverines come in pairs');
});

// A jack in open ground with one animal beside him.
function encounter(kind, level) {
  const lj = game(), g = lj.G, w = g.world, jack = lj.jacks()[0];
  lj.cmd.stop(g.units);
  g.animalCd = 1e9; g.level = level;
  for (const u of lj.jacks()) if (u !== jack) u.hp = 1e9;
  const x = w.start.x + 5, y = w.start.y + 5, at = y * w.W + x;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const n = at + dy * w.W + dx; if (!w.bld[n]) { w.obj[n] = 0; w.type[n] = lj.T.GRASS; g.fog[n] = 1; } }
  put(jack, at, w);
  jack.hp = 1e6;
  lj.spawnWildAt(kind, at + 1, 1);
  return { lj, g, jack, animal: g.animals[g.animals.length - 1] };
}

test('a lynx is quicker and frailer than a wolf, and its first pounce lands twice as hard', () => {
  const wolf = encounter('wolf', 5).animal, { lj, jack, animal } = encounter('lynx', 5);
  assert.ok(animal.speed > wolf.speed * 1.2 && animal.hp < wolf.hp);
  const before = jack.hp;
  step(lj, 0.3);
  const first = before - jack.hp;
  assert.ok(Math.abs(first - animal.dmg * 2) < 1e-6, 'first bite ' + first + ' against a normal ' + animal.dmg);
  const mid = jack.hp;
  animal.atkCd = 0;
  step(lj, 0.3);
  assert.ok(Math.abs(mid - jack.hp - animal.dmg) < 1e-6, 'later bites are ordinary');
});

test('a wolverine is tougher than a wolf and bites through a palisade three times as fast', () => {
  const wolf = encounter('wolf', 6).animal, { lj, animal } = encounter('wolverine', 6);
  assert.ok(animal.hp > wolf.hp * 1.5);
  assert.equal(lj.FOE.wolverine.wallDmg, lj.FOE.wolf.wallDmg * 3);
});

test('killing a lynx or a wolverine pays for its pelt', () => {
  for (const kind of ['lynx', 'wolverine']) {
    const { lj, g, animal } = encounter(kind, 6), money = g.money, kills = g.kills;
    lj.hurtAnimal(animal, 1e6);
    assert.equal(animal.alive, false);
    assert.equal(g.money - money, lj.FOE[kind].pelt);
    assert.equal(g.kills, kills + 1);
  }
});
