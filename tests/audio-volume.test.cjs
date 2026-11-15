const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function mixer(stored) {
  const values = new Map(stored ? [['lumberjack-audio-volume', stored]] : []);
  const gains = [];
  const parameter = () => ({ value: 1, cancelScheduledValues() {}, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; } });
  class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createDynamicsCompressor() { return { connect() {} }; }
    createGain() {
      const node = { gain: parameter(), connect(to) { this.to = to; } };
      gains.push(node); return node;
    }
    createOscillator() { return { frequency: parameter(), connect(to) { this.to = to; }, start() {}, stop() {} }; }
  }
  const LJ = { clamp: (v, a, b) => Math.max(a, Math.min(b, v)), SFX_DEFAULTS: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/sound.js'), 'utf8'), {
    LJ, window: { AudioContext }, performance: { now: () => 1000 },
    localStorage: { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
  });
  return { LJ, values, gains };
}

test('music and effects have independent persisted volume buses', () => {
  const { LJ, values } = mixer();
  LJ.setVolume('music', 0.25); LJ.setVolume('effects', 0.6);
  LJ.audioInit();
  const music = LJ.synth.bus().dest, effects = LJ.synth.live().dest;
  assert.notEqual(music, effects);
  assert.equal(music.to, effects.to, 'both feed the global mute');
  assert.equal(music.gain.value, 0.25); assert.equal(effects.gain.value, 0.6);
  LJ.setVolume('music', 0);
  assert.equal(music.gain.value, 0); assert.equal(effects.gain.value, 0.6);
  const restored = mixer(values.get('lumberjack-audio-volume')).LJ;
  restored.audioInit();
  assert.equal(restored.volumeOf('music'), 0); assert.equal(restored.volumeOf('effects'), 0.6);
});

test('effects and voice volume stays independent of global mute and music', () => {
  const { LJ } = mixer();
  LJ.audioInit();
  const effects = LJ.synth.live().dest, music = LJ.synth.bus().dest, master = music.to;
  LJ.setVolume('effects', 0);
  assert.equal(effects.gain.value, 0); assert.equal(music.gain.value, 1);
  LJ.toggleMute();
  assert.equal(master.gain.value, 0); assert.equal(LJ.synth.live(), null);
  LJ.setVolume('effects', 0.4);
  assert.equal(master.gain.value, 0, 'moving a slider must not unmute the game');
  LJ.toggleMute();
  assert.equal(master.gain.value, 0.8); assert.equal(effects.gain.value, 0.4);
});

test('volume settings clamp numeric input and safely ignore malformed saved data', () => {
  for (const stored of ['broken JSON', 'null', '{"music":"bad","effects":null}']) {
    const { LJ } = mixer(stored);
    assert.equal(LJ.volumeOf('music'), 1); assert.equal(LJ.volumeOf('effects'), 1);
  }
  const { LJ } = mixer('{"music":-3,"effects":5}');
  assert.equal(LJ.volumeOf('music'), 0); assert.equal(LJ.volumeOf('effects'), 1);
  LJ.setVolume('music', NaN); LJ.setVolume('effects', Infinity);
  assert.equal(LJ.volumeOf('music'), 0); assert.equal(LJ.volumeOf('effects'), 1);
});
