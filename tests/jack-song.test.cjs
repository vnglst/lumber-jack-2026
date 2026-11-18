const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { game, step, storage } = require('./harness.cjs');
function scene(kind) {
  const lj = game();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/playground-scenes.js'), 'utf8'), { LJ: lj });
  lj.playground.load({ scene: kind, seed: 42 });
  return lj;
}
const pokeLines = lj => [...lj.LINES.normal, ...lj.LINES.annoyed, ...lj.LINES.funny];
test('every poke response plays in order before singing, without changing work orders', () => {
  const lj = scene('song-poke'), u = lj.jacks()[0], task = u.task;
  for (const line of pokeLines(lj)) {
    lj.poke(u);
    assert.equal(lj.G.bubbles.find(b => b.u === u).text, line);
  }
  assert.equal(lj.G.jackSong.poke, false);
  lj.poke(u);
  assert.equal(lj.G.jackSong.poke, true);
  assert.equal(lj.G.bubbles.find(b => b.u === u).text, lj.LINES.song[0]);
  assert.equal(u.task, task); assert.equal(u.hold, true);
  lj.poke(u);
  assert.equal(lj.G.bubbles.find(b => b.u === u).text, lj.LINES.song[0]);
  step(lj, 6);
  lj.poke(u);
  assert.equal(lj.G.bubbles.find(b => b.u === u).text, pokeLines(lj)[0]);
  lj.saveGame(); assert.equal(lj.loadGame(), true);
  assert.equal(lj.G.jackSong.poke, true);
  lj.newGame(43); assert.equal(lj.G.jackSong.poke, false);
});
test('four quiet seconds reset each jack independently, even after singing or saving', () => {
  const lj = scene('song-crew'), [u, other] = lj.jacks();
  lj.G.jackSong.crew = true;
  lj.G.money = -1; u.hired = true;
  lj.poke(u); lj.poke(u);
  lj.G.time += 3.99; lj.poke(u);
  assert.equal(lj.G.bubbles.find(b => b.u === u).text, pokeLines(lj)[2]);
  lj.poke(other);
  assert.equal(lj.G.bubbles.find(b => b.u === other).text, pokeLines(lj)[0]);
  lj.G.time += 4;
  for (const line of pokeLines(lj)) {
    lj.poke(u);
    assert.equal(lj.G.bubbles.find(b => b.u === u).text, line);
  }
  lj.poke(u); assert.equal(lj.G.jackSong.poke, true);
  step(lj, 6);
  lj.saveGame(); assert.equal(lj.loadGame(), true);
  const restored = lj.jacks()[0];
  for (const line of pokeLines(lj)) {
    lj.poke(restored);
    assert.equal(lj.G.bubbles.find(b => b.u === restored).text, line);
  }
  lj.poke(restored);
  assert.equal(lj.G.bubbles.find(b => b.u === restored).text, lj.LINES.song[0]);
});
test('spaced taps and danger cannot trigger singing', () => {
  const lj = scene('song-poke'), u = lj.jacks()[0];
  for (let i = 0; i < 12; i++) { lj.G.time += 5; lj.poke(u); }
  assert.equal(lj.G.jackSong.poke, false);
  lj.G.wave.active = {};
  for (let i = 0; i <= pokeLines(lj).length; i++) lj.poke(u);
  assert.equal(lj.G.jackSong.poke, false);
});
test('pokes during singing preserve a pending reset and cannot start a second solo in one streak', () => {
  const lj = scene('song-poke'), u = lj.jacks()[0];
  const finishLines = () => { for (const line of pokeLines(lj)) lj.poke(u); lj.poke(u); };
  const response = () => lj.G.bubbles.find(b => b.u === u)?.text;
  finishLines();
  step(lj, 3); lj.poke(u);
  step(lj, 3); lj.poke(u);
  assert.equal(response(), pokeLines(lj).at(-1));
  step(lj, 4.1); finishLines();
  step(lj, 4.1); lj.poke(u);
  step(lj, 2); lj.poke(u);
  assert.equal(response(), pokeLines(lj)[0]);
});
test('resting crew sings solo then chorus once; movement interrupts', () => {
  const lj = scene('song-crew');
  step(lj, 3.2);
  assert.equal(lj.G.jackSong.crew, true);
  assert.ok(lj.G.bubbles.some(b => b.text === lj.LINES.song[0]));
  step(lj, 5.4);
  assert.equal(lj.G.bubbles.filter(b => b.text === lj.LINES.song[1]).length, 2);
  step(lj, 12);
  assert.ok(!lj.G.bubbles.some(b => lj.LINES.song.includes(b.text)));
  lj.saveGame(); assert.equal(lj.loadGame(), true);
  assert.equal(lj.G.jackSong.crew, true);
  lj.playground.load({ scene: 'song-crew' });
  step(lj, 3.2);
  lj.jacks()[0].task = { type: 'move' };
  lj.jackSong.update(0.05);
  lj.jacks()[0].task = null;
  step(lj, 6);
  assert.ok(!lj.G.bubbles.some(b => b.text === lj.LINES.song[1]));
});
test('crew needs time, three resting jacks and peace near camp', () => {
  const lj = scene('song-crew');
  lj.G.time = 0; step(lj, 20); assert.equal(lj.G.jackSong.crew, false);
  lj.G.time = 400; lj.G.units.pop(); step(lj, 20); assert.equal(lj.G.jackSong.crew, false);
  lj.playground.load({ scene: 'song-crew' });
  lj.G.wave.active = {}; lj.jackSong.update(20);
  assert.equal(lj.G.jackSong.crew, false); assert.equal(lj.G.jackSong.quiet, 0);
  lj.G.wave.active = null; lj.jacks()[0].x += 500; lj.jackSong.update(20);
  assert.equal(lj.G.jackSong.crew, false);
});
test('an older mostly cleared save gains fresh song flags without changing its map', () => {
  const lj = scene('song-poke'), store = storage(lj);
  lj.saveGame();
  const saved = JSON.parse(store.getItem('lumberjack-save'));
  saved.v = 9; delete saved.g.jackSong;
  store.setItem('lumberjack-save', JSON.stringify(saved));
  assert.equal(lj.loadGame(), true);
  assert.equal(lj.G.jackSong.poke, false); assert.equal(lj.G.jackSong.crew, false);
  assert.equal(lj.G.cleared, saved.g.cleared);
  lj.saveGame();
  const restored = JSON.parse(store.getItem('lumberjack-save'));
  assert.deepEqual(restored.world, saved.world);
});
test('slow loading cannot skip or truncate the solo and chorus', async () => {
  const lj = scene('song-crew'), pending = [], sources = [];
  const ctx = {
    decodeAudioData: async () => ({ duration: 5 }),
    createGain: () => ({ gain: {}, connect() {}, disconnect() {} }),
    createBufferSource: () => {
      const node = { connect() {}, disconnect() {}, start() {}, stop() { this.stopped = true; } };
      sources.push(node); return node;
    }
  };
  lj.synth = { live: () => ({ ctx, dest: {} }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/jack-song.js'), 'utf8'), {
    LJ: lj, fetch: () => new Promise(resolve => pending.push(() => resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })))
  });
  lj.jackSong.reset(); lj.G.jackSong.quiet = 12;
  lj.jackSong.update(0.05);
  lj.jackSong.update(20);
  assert.equal(pending.length, 1, 'wait for the solo to load before requesting the chorus');
  lj.G.bubbles = [];
  pending[0](); await new Promise(setImmediate);
  assert.ok(lj.G.bubbles.some(b => b.text === lj.LINES.song[0] && b.t === 5), 'caption follows actual playback');
  lj.jackSong.update(20);
  assert.equal(sources[0].stopped, undefined, 'let the solo finish at its own pace');
  assert.equal(pending.length, 1);
  sources[0].onended(); lj.jackSong.update(0.05);
  assert.equal(pending.length, 2);
  lj.jackSong.update(20);
  pending[1](); await new Promise(setImmediate);
  lj.jackSong.update(20);
  assert.equal(sources[1].stopped, undefined, 'let the chorus finish at its own pace');
  sources[1].onended(); lj.jackSong.update(0.05);
});
