const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real renderer; record canvas bounds and mask pixels without a browser dependency.
function scene(tx, ty) {
  const W = 8, H = 8, N = W * H, draws = [], masks = [];
  const tree = { width: 48, height: 64, ax: 24, ay: 56 };
  const w = { W, H, N, seed: 42, roadY: 4 };
  for (const key of ['type', 'obj', 'variant', 'wall', 'deco', 'decoV', 'hp', 'claim']) w[key] = new Uint8Array(N);
  w.obj[ty * W + tx] = 1;
  const ctx = {
    fillRect() {},
    drawImage(image, ...args) { draws.push({ image, args }); }
  };
  const G = {
    world: w, ground: { cv: { width: W * 16, height: H * 16 } }, cam: { x: -64, y: -64 }, time: 0,
    fog: new Uint8Array(N), fogLeft: N, fogDirty: true, up: {}, sel: new Set()
  };
  for (const key of ['units', 'buildings', 'critters', 'falls', 'animals', 'graves', 'props', 'bolts', 'arrows', 'parts', 'bflies']) G[key] = [];
  const LJ = {
    TS: 16, T: { WATER: 2, ROCK: 3 }, TREE_ROWS: 4, STUMP: 9, G, ctx,
    cv: { width: (W + 8) * 16, height: (H + 8) * 16 },
    sprites: { trees: [[tree]], sign: { width: 12, height: 24 } },
    hash: () => 0, treeX: (w, i) => i % w.W * 16 + 8, treeY: (w, i) => ((i / w.W) | 0) * 16 + 10,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v))
  };
  const document = {
    createElement() {
      const canvas = { width: 0, height: 0 };
      canvas.getContext = () => ({
        createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
        putImageData(image) { canvas.pixels = image.data; }
      });
      masks.push(canvas);
      return canvas;
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/render.js'), 'utf8'), { LJ, document });
  return { lj: LJ, g: G, w, tree, draws, masks };
}

for (const [edge, x, y] of [['left', 0, 4], ['top', 4, 0], ['right', 7, 4], ['bottom', 4, 7]]) {
  test('fog covers hidden tree overhang at the ' + edge + ' map edge', () => {
    const { lj, tree, draws } = scene(x, y);
    lj.render();
    const fog = draws.at(-1);
    const sx = x * 16 + 8 - tree.ax - lj.G.cam.x, sy = y * 16 + 10 - tree.ay - lj.G.cam.y;
    const [fx, fy, fw, fh] = fog.args;
    assert.ok(fx <= sx && fy <= sy && fx + fw >= sx + tree.width && fy + fh >= sy + tree.height, 'fog ends before the hidden sprite does');
  });
}


for (const [edge, x, y, nx, ny] of [
  ['top', 4, 1, 4, 0], ['left', 0, 4, 0, 3], ['right', 7, 4, 7, 3], ['bottom', 4, 7, 3, 7]
]) {
  test('an unexplored canopy stays hidden beside an explored ' + edge + ' edge', () => {
    const { lj, g, w, tree, draws } = scene(x, y), tile = y * w.W + x;
    g.fog[ny * w.W + nx] = 1;
    lj.render();
    assert.equal(g.fog[tile], 0);
    assert.ok(!draws.some(d => d.image === tree), 'hidden tree leaks through the explored margin');
    draws.length = 0;
    g.fog[tile] = 1; g.fogDirty = true;
    lj.render();
    assert.ok(draws.some(d => d.image === tree), 'explored trees must still render');
  });
}
