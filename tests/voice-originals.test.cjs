const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('every downloaded wildlife voice has a preserved playable original and a recordable booth cue', () => {
  const context = vm.createContext({ LJ: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/lines.js'), 'utf8'), context);
  const { VOICE_ORIGINALS: originals, CUES: cues, voiceGroups } = context.LJ;
  assert.equal(originals.keys.length, 8);
  assert.equal(new Set(originals.keys).size, 8);
  assert.ok(originals.url.startsWith('https://opengameart.org/'));
  assert.equal(originals.artist, 'rubberduck');
  const booth = voiceGroups().find(group => group.id === 'wildcues');
  for (const key of originals.keys) {
    assert.ok(cues.some(cue => cue.id === key), key + ' must use the existing game cue');
    assert.ok(booth.items.some(item => item.key === key), key + ' must be recordable');
    const wav = fs.readFileSync(path.join(__dirname, '../audio/voice-defaults/' + key + '.wav'));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt16LE(22), 1);
    assert.ok(wav.length > 44);
    const seconds = (wav.length - 44) / 2 / wav.readUInt32LE(24);
    assert.ok(seconds > 0.1 && seconds < 1.5, key + ' is a short preserved game cue');
  }
});
