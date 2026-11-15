const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { game, step } = require('./harness.cjs');

const recordings = ['wolf_howl', 'wolf_snarl', 'wolf_yelp', 'bear_roar', 'bear_groan', 'reindeer_call', 'squirrel_call', 'swan_call'];
test('all animal cues are recordable and retain short, non-clipping cartoon originals', () => {
  const lj = game(), manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../audio/voice/manifest.json')));
  const booth = lj.voiceGroups().flatMap(g => g.items.map(i => i.key));
  for (const key of recordings) {
    assert.ok(manifest[key]); assert.ok(booth.includes(key));
    const current = fs.readFileSync(path.join(__dirname, '../audio/voice/' + key + '.wav'));
    assert.equal(current.toString('ascii', 0, 4), 'RIFF');
    assert.equal(current.toString('ascii', 8, 12), 'WAVE');
    // Personal takes may have a different mix; the downloaded originals retain their mastering limits.
    const wav = fs.readFileSync(path.join(__dirname, '../audio/voice-defaults/' + key + '.wav'));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.readUInt16LE(22), 1);
    const rate = wav.readUInt32LE(24);
    assert.ok(rate >= 8000 && rate <= 96000);
    const samples = (wav.length - 44) / 2;
    assert.ok(samples / rate > 0.1 && samples / rate < 1.5, key + ' must stay a short game cue');
    let peak = 0;
    for (let i = 44; i < wav.length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
    assert.ok(peak > 1000 && peak <= 15000, key + ' has audible headroom');
  }
});

function wildlife(kind) {
  const lj = game(), g = lj.G, w = g.world, calls = [];
  lj.cmd.stop(g.units);
  const tile = w.lush.findIndex((lush, i) => lush > 0.8 && w.type[i] === lj.T.GRASS && !w.bld[i]);
  const c = { kind, x: tile % w.W * 16 + 8, y: Math.floor(tile / w.W) * 16 + 10, alpha: 1, t: 999, moving: false, flee: false, dir: 1, walkT: 0 };
  g.critters = [c]; g.units = []; g.animalCd = 9999;
  g.cam.x = c.x - 50; g.cam.y = c.y - 50;
  lj.cv = { width: 100, height: 100 };
  g.fog[tile] = 1; g.wildlifeT = 0;
  lj.voice.cue = (...args) => calls.push(args);
  return { lj, g, c, calls, tile };
}

for (const [kind, cue] of [['deer', 'reindeer_call'], ['squirrel', 'squirrel_call'], ['swan', 'swan_call']]) {
  test(kind + ' has a quiet on-screen call with a shared cooldown', () => {
    const { lj, g, c, calls, tile } = wildlife(kind);
    if (kind === 'swan') g.world.type[tile] = lj.T.WATER;
    step(lj, 0.05);
    assert.equal(calls.length, 1); assert.equal(calls[0][0], cue);
    assert.ok(calls[0][1] > 0 && calls[0][1] <= 0.5);
    step(lj, 9);
    assert.equal(calls.length, 1, 'a crowd must not chatter continuously');
    assert.ok(!c.gone);
  });
}

for (const unavailable of ['unexplored', 'offscreen', 'gone', 'faded']) {
  test(unavailable + ' wildlife stays silent', () => {
    const { lj, g, c, calls, tile } = wildlife('squirrel');
    if (unavailable === 'unexplored') { g.fog.fill(0); g.fogLeft = g.world.N; }
    if (unavailable === 'offscreen') g.cam.x += 500;
    if (unavailable === 'gone') c.gone = true;
    if (unavailable === 'faded') c.alpha = 0.2;
    step(lj, 0.05);
    assert.equal(calls.length, 0);
  });
}

test('loading a save resets the transient wildlife call cooldown', () => {
  const lj = game();
  lj.G.wildlifeT = 123;
  lj.saveGame();
  assert.ok(lj.loadGame());
  assert.equal(lj.G.wildlifeT, 8);
});
