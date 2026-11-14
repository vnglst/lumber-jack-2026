const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [2400, 1600]]) {
  test('all map corners reach viewport centre at every zoom at ' + width + '×' + height, () => {
    const G = { world: { W: 104, H: 72 }, cam: {}, time: 1, units: [] };
    const LJ = { TS: 16, G, sprites: {}, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) };
    const elements = new Map();
    const document = {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { style: {}, getContext: () => ({}), addEventListener() {} });
        return elements.get(id);
      },
      querySelectorAll: () => [], addEventListener() {}
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8'), {
      LJ, innerWidth: width, innerHeight: height, document, addEventListener() {}
    });
    LJ.ui.init();
    for (const [W, H] of [[104, 72], [8, 8]]) {
      G.world = { W, H };
      for (const zoom of [1, 1.5, 2, 3, 4, 0.3]) { // The ending also uses free zoom below 1.
        LJ.ui.zoomTo(zoom);
        for (const [x, y] of [[8, 10], [W * 16 - 8, 10], [8, H * 16 - 6], [W * 16 - 8, H * 16 - 6]]) {
          LJ.ui.centerOn(x, y);
          assert.ok(Math.abs((x - G.cam.x) * zoom - width / 2) < 1e-9);
          assert.ok(Math.abs((y - G.cam.y) * zoom - height / 2) < 1e-9);
        }
        LJ.ui.centerOn(-1e6, -1e6);
        assert.equal(G.cam.x, -width / zoom / 2);
        assert.equal(G.cam.y, -height / zoom / 2);
        LJ.ui.centerOn(1e6, 1e6);
        assert.equal(G.cam.x, W * 16 - width / zoom / 2);
        assert.equal(G.cam.y, H * 16 - height / zoom / 2);
      }
    }
  });
}
