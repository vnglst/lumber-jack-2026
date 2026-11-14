const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [2400, 1600]]) {
  test('all four map corners can reach viewport centre at ' + width + '×' + height, () => {
    const G = { world: { W: 104, H: 72 }, cam: {} };
    const LJ = { TS: 16, G, sprites: {}, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8'), {
      LJ, innerWidth: width, innerHeight: height
    });
    for (const [x, y] of [[8, 10], [1656, 10], [8, 1146], [1656, 1146]]) {
      LJ.ui.centerOn(x, y);
      assert.ok(Math.abs((x - G.cam.x) * LJ.ui.zoom() - width / 2) < 1e-9);
      assert.ok(Math.abs((y - G.cam.y) * LJ.ui.zoom() - height / 2) < 1e-9);
    }
    LJ.ui.centerOn(-1e6, -1e6);
    assert.equal(G.cam.x, -width / LJ.ui.zoom() / 2);
    assert.equal(G.cam.y, -height / LJ.ui.zoom() / 2);
    LJ.ui.centerOn(1e6, 1e6);
    assert.equal(G.cam.x, 104 * 16 - width / LJ.ui.zoom() / 2);
    assert.equal(G.cam.y, 72 * 16 - height / LJ.ui.zoom() / 2);
  });
}
