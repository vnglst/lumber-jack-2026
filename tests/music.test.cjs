const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const ctx = vm.createContext({ LJ: {}, Math, localStorage: { getItem: () => null, setItem() {} }, setTimeout });
  for (const name of ['songs', 'music']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + name + '.js'), 'utf8'), ctx);
  return ctx.LJ;
}

test('every scene has a song', () => {
  const LJ = load();
  for (const scene of ['title', 'road', 'work', 'deep', 'raid', 'ending']) assert.ok(LJ.SONGS[scene], scene);
});

test('every track parses, fills whole bars and lines up with the longest track', () => {
  const LJ = load();
  for (const [name, song] of Object.entries(LJ.SONGS)) {
    const lens = song.tracks.map(tr => {
      const { events, len } = LJ.music.parse(tr.notes);
      assert.ok(events.length, name + ' ' + tr.inst + ' has notes');
      assert.equal(len % song.beats, 0, name + ' ' + tr.inst + ' is ' + len + ' beats, not whole bars of ' + song.beats);
      for (const ev of events) for (const f of ev.f) assert.ok(f > 30 && f < 2500, name + ' ' + tr.inst + ' pitch ' + f);
      return len;
    });
    const longest = Math.max(...lens);
    for (const len of lens) assert.equal(longest % len, 0, name + ': a ' + len + '-beat track drifts against ' + longest + ' beats');
  }
});

test('notation: lengths, rests, chords and accidentals', () => {
  const { parse } = load().music;
  const { events, len } = parse('a4 - | c#4+e4/2 bb3/.5');
  assert.equal(len, 4.5);
  assert.equal(JSON.stringify(events.map(e => [e.t, e.dur, e.f.length])), '[[0,1,1],[2,2,2],[4,0.5,1]]');
  assert.equal(events[0].f[0], 440);
  assert.ok(Math.abs(events[2].f[0] - 233.08) < 0.01);
  assert.throws(() => parse('h4'));
  assert.throws(() => parse('a4/0'));
});
