const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function voice() {
  const sources = [], gains = [], dest = {};
  const audio = {
    decodeAudioData: async () => ({}),
    createGain() {
      const node = { gain: { value: 1 }, connect(to) { this.to = to; }, disconnect() { this.disconnected = true; } };
      gains.push(node); return node;
    },
    createBufferSource() {
      const src = { playbackRate: {}, connect(to) { this.to = to; }, disconnect() { this.disconnected = true; }, start() {}, stop() { this.onended(); } };
      sources.push(src); return src;
    }
  };
  const lj = { synth: { live: () => ({ ctx: audio, dest }) }, voiceKey: text => text, CUES: [{ id: 'howl', who: 'wolf' }] };
  const ctx = vm.createContext({
    LJ: lj, window: { addEventListener() {} },
    fetch: async url => ({ ok: true, json: async () => ({ hello: 1, howl: 1 }), arrayBuffer: async () => new ArrayBuffer(0) })
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/voice.js'), 'utf8'), ctx);
  await lj.voice.reload();
  return { lj, sources, gains, dest };
}

test('recorded lines and cues use 75% gain without changing the sound-effect destination', async () => {
  const { lj, sources, gains, dest } = await voice();
  lj.voice.say('hello', 'jack');
  lj.voice.cue('howl');
  await new Promise(setImmediate);
  assert.equal(sources.length, 2);
  for (let i = 0; i < sources.length; i++) {
    assert.equal(sources[i].to, gains[i]);
    assert.equal(gains[i].gain.value, 0.75);
    assert.equal(gains[i].to, dest);
    sources[i].onended();
    assert.ok(sources[i].disconnected);
    assert.ok(gains[i].disconnected);
  }
});

test('muting and missing recordings do not create playback nodes', async () => {
  const { lj, sources } = await voice();
  lj.voice.say('missing');
  lj.synth.live = () => null;
  lj.voice.say('hello');
  await new Promise(setImmediate);
  assert.equal(sources.length, 0);
});

test('quiet wildlife cues share the voice mixer and honor their requested gain', async () => {
  const { lj, sources, gains, dest } = await voice();
  lj.voice.cue('howl', 0.4);
  await new Promise(setImmediate);
  assert.equal(sources.length, 1);
  assert.equal(gains[0].gain.value, 0.75 * 0.4);
  assert.equal(gains[0].to, dest);
});
