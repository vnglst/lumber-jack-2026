const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { game, step } = require('./harness.cjs');

function setup() {
  const lj = game(), musicOutput = { inputs: [] }, effectsOutput = { inputs: [] }, sources = [];
  const param = () => ({ value: 1, cancelScheduledValues() {},
    setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; },
    exponentialRampToValueAtTime(v) { this.value = v; } });
  const node = () => ({ inputs: [], gain: param(), frequency: param(), detune: param(), Q: param(), delayTime: param(),
    connect(to) { if (to.inputs) to.inputs.push(this); }, disconnect() {}, start() {}, stop() {} });
  const ctx = { currentTime: 0, state: 'running', createGain: node, createDelay: node,
    createBiquadFilter: node, createOscillator: node, decodeAudioData: async () => ({ duration: 5 }),
    createBufferSource() { const n = node(); sources.push(n); return n; } };
  lj.synth = { bus: () => ({ ctx, dest: musicOutput }), live: () => ({ ctx, dest: effectsOutput }) };
  lj.SONGS = { work: { bpm: 60, vol: 1, tracks: [{ inst: 'kantele', vol: 1, notes: 'a4' }] } };
  const scope = { LJ: lj, localStorage: { getItem() { return null; }, setItem() {} }, setTimeout() {},
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }) };
  for (const file of ['music', 'jack-song', 'playground-scenes']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/' + file + '.js'), 'utf8'), scope);
  }
  lj.playground.load({ scene: 'song-crew' });
  lj.music.tick('work');
  const musicIsSilent = () => musicOutput.inputs.every(n => n.gain.value === 0);
  return { lj, sources, musicIsSilent, effectsOutput };
}

test('solo and crew chorus silence all background music until singing ends', async () => {
  for (const kind of ['poke', 'crew']) {
    const { lj, sources, musicIsSilent, effectsOutput } = setup();
    assert.equal(musicIsSilent(), false);
    if (kind === 'poke') for (let n = 0; n <= lj.LINES.poke.length; n++) lj.poke(lj.jacks()[0]);
    else step(lj, 3.2);
    await new Promise(setImmediate);
    lj.music.tick('work');
    assert.equal(musicIsSilent(), true, kind + ': music and its echo stop during solo');
    assert.ok(effectsOutput.inputs.some(n => n.gain.value > 0), 'singing remains audible');
    assert.equal(lj.music.isOn(), true, 'music preference stays enabled');
    sources[0].onended(); lj.jackSong.update(0.05);
    if (kind === 'crew') {
      await new Promise(setImmediate); lj.music.tick('work');
      assert.equal(musicIsSilent(), true, 'music stays stopped through chorus');
      sources[1].onended(); lj.jackSong.update(0.05);
    }
    lj.music.tick('work');
    assert.equal(musicIsSilent(), false, 'background music resumes');
  }
});

test('pause, danger and replay release the temporary music interruption', async () => {
  for (const end of ['pause', 'danger', 'replay']) {
    const { lj, musicIsSilent } = setup();
    step(lj, 3.2); await new Promise(setImmediate);
    assert.equal(musicIsSilent(), true);
    if (end === 'pause') lj.jackSong.pause();
    if (end === 'danger') { lj.G.wave.active = {}; lj.jackSong.update(0.05); }
    if (end === 'replay') lj.playground.load({ scene: 'song-crew' });
    lj.music.tick('work'); assert.equal(musicIsSilent(), false, end);
  }
});
