// The opening screen: the northern lights must be mirrored inside the lake, not below it.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('every row of the northern lights is mirrored between the far shore and the near one', () => {
  const LJ = { sprites: {}, hash: () => 0, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/title.js'), 'utf8'), { LJ, document: { getElementById: () => null } });
  const { HORIZON, SHORE, mirrorY } = LJ.title.geometry;
  // The curtains hang between the top of the sky and about 20 rows above the horizon.
  for (let y = 0; y <= HORIZON - 20; y++) {
    const m = mirrorY(y);
    assert.ok(m > HORIZON + 1 && m < SHORE, 'sky row ' + y + ' lands at ' + m + ', outside the lake (' + HORIZON + ' to ' + SHORE + ')');
  }
  assert.ok(mirrorY(10) > mirrorY(70), 'higher in the sky shows nearer the viewer');
});
