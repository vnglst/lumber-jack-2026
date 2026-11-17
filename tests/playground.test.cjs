const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { game, step, until, storage } = require('./harness.cjs');
const source = fs.readFileSync(path.join(__dirname, '../js/playground-scenes.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../playground.html'), 'utf8');
// Read the menu itself so a newly offered scene cannot silently miss suite coverage.
const scenes = [...html.match(/<select id="review-scene">([\s\S]*?)<\/select>/)[1].matchAll(/value="([^"]+)"/g)].map(m => m[1]);
const encounters = { wolf: ['wolf', 1], pack: ['wolf', 3], lynx: ['lynx', 1], wolverine: ['wolverine', 2], bear: ['bear', 1] };
const battles = { battle7: [12, 2], battle8: [14, 3], battle9: [16, 3], battle10: [20, 4] };

function playground(seed = 42) {
  const lj = game(seed);
  // The browser boot does not load save.js at all. These are the same no-op lifecycle hooks.
  lj.saveGame = lj.clearSave = () => {};
  lj.hasSave = lj.loadGame = () => false;
  vm.runInNewContext(source, { LJ: lj });
  return lj;
}

test('playground boot loads its shell and every dependency outside the production cache URL space', async () => {
  const elements = new Map(), scripts = [...fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8').matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m => ({
    src: m[1], getAttribute() { return this.src; }, remove() { this.removed = true; }
  }));
  let base, fetched;
  const shell = {
    querySelectorAll: () => scripts,
    querySelector: () => ({ insertAdjacentHTML: (_, markup) => { base = markup.match(/href="([^"]+)"/)[1]; } }),
    createElement: () => ({}),
    body: { appendChild: script => scripts.push(script) },
    documentElement: { outerHTML: '<html></html>' }
  };
  await vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/playground.js'), 'utf8'), {
    document: { getElementById: id => {
      if (!elements.has(id)) elements.set(id, { addEventListener() {} });
      return elements.get(id);
    } },
    URL, location: { href: 'https://game.test/playground.html' },
    fetch: async url => { fetched = String(url); return { ok: true, text: async () => '' }; },
    DOMParser: class { parseFromString() { return shell; } }, setInterval() {}
  });
  assert.equal(fetched, 'https://game.test/__playground__/index.html');
  assert.equal(base, 'https://game.test/__playground__/');
  for (const script of scripts.filter(s => !s.removed)) {
    assert.ok(new URL(script.src, base).pathname.startsWith('/__playground__/'), script.src);
  }
  for (const name of ['save', 'main', 'site']) assert.ok(scripts.find(s => s.src === 'js/' + name + '.js').removed);
  for (const name of ['playground-scenes', 'playground-frame']) assert.ok(scripts.some(s => s.src === 'js/' + name + '.js'));
  assert.ok(elements.get('review-game').srcdoc.startsWith('<!doctype html>'));
});

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
  for (const [scene, [kind, count]] of Object.entries(encounters)) {
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

for (const scene of scenes) {
  test('playground menu scene: ' + scene + ' loads and replays across seeds and equipment', () => {
    const lj = playground(), store = storage(lj);
    store.setItem('lumberjack-save', 'campaign sentinel');
    for (const seed of [1, 42, 999]) for (const gear of ['axe', 'chainsaw', 'laser', 'scope']) {
      const levels = scene === 'level' ? [1,2,3,4,5,6,7,8,9,10] : [1, 5, 10];
      for (const level of levels) {
        const label = JSON.stringify({ scene, seed, gear, level });
        assert.equal(typeof lj.playground.load({ scene, seed, gear, level }), 'string', label);
        const g = lj.G;
        assert.equal(g.world.seed, seed, label);
        assert.equal(store.getItem('lumberjack-save'), 'campaign sentinel', label);
        if (scene === 'arrival') { assert.ok(g.arrival, label); continue; }
        assert.ok(!g.arrival && !g.paused, label);
        if (scene.startsWith('town') || battles[scene]) {
          assert.equal(g.level, Number(scene.match(/\d+$/)[0]), label);
          assert.equal(lj.jacks().length, battles[scene]?.[0] || { town5: 8, town8: 12, town10: 16 }[scene], label);
          assert.ok(g.up.chainsaw && g.up.rifles && g.up.dispatch, label);
          assert.equal(!!g.up.steam, g.level >= 7, label);
          assert.equal(!!g.up.mega, g.level >= 9, label);
          assert.ok(g.count.bunk && g.count.sawmill && g.count.tower, label);
          assert.ok(g.buildings.every(b => !b.construction), label);
          assert.ok(g.cleared >= g.thr[g.level - 2] && g.cleared < g.thr[g.level - 1], label);
          assert.equal(Array.from(g.world.obj).filter(o => o >= 1 && o <= 3).length, g.total - g.cleared, label);
          assert.ok(g.units.every(u => lj.pass(u.tile) && lj.bfs(g.exitIdx, i => i === u.tile)), label);
          assert.ok(!g.cine && !g.levelDone && g.ore > 0, label);
          assert.ok(g.animalCd < 100 && g.wave.next <= 90, label);
          if (battles[scene]) {
            assert.equal(g.count.tower, battles[scene][1], label);
            assert.equal(!!g.up.twin, g.level >= 8, label);
            assert.ok(lj.jacks().every(u => u.xp >= 40 && u.hp === lj.maxHpOf(u)), label);
            assert.equal(g.sel.size, battles[scene][0] - 4, label);
            assert.equal(new Set([...g.sel].map(u => u.tile)).size, g.sel.size, 'distinct reserve posts');
            assert.ok([...g.sel].every(u => u.hold && !u.task), label);
            assert.ok(g.money >= 1800 && g.money <= 5000, label);
            assert.ok(g.wave.next - g.time <= 12.01 && g.wave.hostile, label);
          }
          step(lj, 0.1);
          continue;
        }
        assert.equal(g.up.chainsaw, gear === 'chainsaw', label);
        assert.equal(g.up.rifles, gear === 'laser' || gear === 'scope', label);
        assert.equal(g.up.scope, gear === 'scope', label);
        if (encounters[scene]) {
          const [kind, count] = encounters[scene];
          assert.equal(g.animals.length, count, label);
          assert.ok(g.animals.every(a => a.kind === kind && a.alive && a.hp > 0), label);
        } else if (scene.startsWith('song-')) {
          assert.equal(g.jackSong.poke, false, label);
          assert.equal(g.jackSong.crew, false, label);
          assert.equal(lj.jacks().length, scene === 'song-crew' ? 3 : 1, label);
          assert.ok(lj.jacks().every(u => u.hold && !u.task), label);
        } else if (scene === 'hut') {
          assert.equal(g.animals.filter(a => a.defender).length, 2, label);
        } else if (scene === 'raid') {
          assert.ok(g.wave.active && g.animals.some(a => a.wave), label);
        } else if (scene === 'ending') {
          assert.equal(g.cine.phase, 'walk', label);
        } else assert.equal(scene, 'level', 'Add outcome assertions for the new menu scene');
        step(lj, 0.1);
      }
    }
  });
}

test('battle towns face real raids, tower fire and recovery without replacing campaign saves', () => {
  const lj = playground(), store = storage(lj);
  store.setItem('lumberjack-save', 'battle sentinel');
  let towerBursts = 0;
  const burst = lj.combat.burst;
  lj.combat.burst = (src, target, options) => {
    if (src.owner?.kind === 'tower') towerBursts++;
    return burst(src, target, options);
  };
  for (const scene of Object.keys(battles)) for (const seed of [1, 42, 999]) {
    const label = scene + '/' + seed;
    lj.playground.load({ scene, seed });
    const g = lj.G;
    until(lj, () => !!g.wave.active, 45);
    assert.ok(g.wave.active.size >= 6 && g.wave.active.size <= 12, label + ' substantial legal raid');
    assert.ok(g.animals.filter(a => a.wave).every(a => lj.combat.hutAt(a.home)), label + ' raids originate at huts');
    until(lj, () => !g.wave.active, 180);
    assert.ok(g.wave.next - g.time >= 89.9, label + ' normal recovery interval');
    assert.ok(lj.jacks().length > 0 && !g.cine, label + ' still playable');
    assert.equal(store.getItem('lumberjack-save'), 'battle sentinel');
  }
  // Encounter targeting can stop an individual raid at the work front before it reaches a tower.
  assert.ok(towerBursts > 0, 'towers engage attackers across the battle scenarios');
});

test('town presets keep logging, processing and selling in the live simulation', () => {
  const lj = playground();
  for (const scene of ['town5', 'town8', 'town10']) {
    lj.ui.centerOn = (x, y) => assert.ok(Number.isFinite(x) && Number.isFinite(y), 'camera has a real town position');
    lj.playground.load({ scene, seed: 42 });
    const cleared = lj.G.cleared, earned = lj.G.earned;
    step(lj, 30);
    assert.ok(lj.G.cleared > cleared, scene + ' logs trees');
    assert.ok(lj.G.earned > earned, scene + ' delivers to market');
    assert.ok(!lj.G.cine && !lj.G.paused, scene + ' remains playable');
  }
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
