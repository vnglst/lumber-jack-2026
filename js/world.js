'use strict';
// Tile world generation + the per-pixel ground renderer.
(function () {
  const TS = (LJ.TS = 16);
  const T = (LJ.T = { GRASS: 0, DIRT: 1, WATER: 2, ROCK: 3, GRAVEL: 4 });
  const STUMP = (LJ.STUMP = 9);
  const { hash, vnoise, fbm } = LJ;

  LJ.genWorld = function (seed) {
    for (let a = 0; a < 40; a++) {
      const w = build(seed + a * 101, false);
      if (w) return w;
    }
    return build(seed, true);
  };

  function build(seed, force) {
    const W = 104, H = 72, N = W * H;
    const type = new Uint8Array(N), obj = new Uint8Array(N), variant = new Uint8Array(N);
    const lush = new Float32Array(N).fill(1), wear = new Uint8Array(N), bld = new Int16Array(N);
    const flower = new Uint8Array(N), hp = new Float32Array(N), claim = new Int32Array(N);
    const roadY = (H >> 1) + Math.floor((hash(1, 2, seed) - 0.5) * 16);
    const nearStart = (x, y) => x <= 9 && y >= roadY - 5 && y <= roadY + 3;

    // Rivers meander north-south; consecutive rows are bridged so they never leak.
    function river(x0, so) {
      let prev = null;
      for (let y = 0; y < H; y++) {
        const cx = Math.round(x0 + (fbm(y * 0.05, so, seed, 3) - 0.5) * 26);
        const hw = 1 + (vnoise(y * 0.2, so + 3, seed) > 0.6 ? 1 : 0);
        const a = Math.min(cx, prev === null ? cx : prev) - hw, b = Math.max(cx, prev === null ? cx : prev) + hw;
        for (let x = a; x <= b; x++) if (x >= 0 && x < W) type[y * W + x] = T.WATER;
        prev = cx;
      }
    }
    river(W * 0.4, 11); river(W * 0.72, 23);

    // A pond in the starting region, for looks.
    const px = 14 + Math.floor(hash(3, 4, seed) * 10), py = (roadY + 18) % H;
    for (let y = py - 4; y <= py + 4; y++) for (let x = px - 5; x <= px + 5; x++) {
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
      const d = Math.hypot((x - px) * 0.8, y - py);
      if (d < 2.2 + vnoise(x * 0.5, y * 0.5, seed + 60) * 1.8) type[y * W + x] = T.WATER;
    }

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (type[i] === T.WATER || nearStart(x, y)) continue;
      const nearW = (x > 0 && type[i - 1] === T.WATER) || (x < W - 1 && type[i + 1] === T.WATER) ||
        (y > 0 && type[i - W] === T.WATER) || (y < H - 1 && type[i + W] === T.WATER);
      if (fbm(x * 0.09, y * 0.09, seed + 5, 3) > 0.655 || (nearW && hash(x, y, seed + 21) < 0.18)) type[i] = T.ROCK;
    }

    let total = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (type[i] !== T.GRASS) continue;
      const clearing = Math.hypot(x - 5, y - (roadY - 1)) < 4.6 + vnoise(x * 0.6, y * 0.6, seed + 70) * 1.5 || (y === roadY && x < 9);
      const d = fbm(x * 0.08, y * 0.08, seed + 9, 3), h = hash(x, y, seed + 31);
      if (!clearing && ((d > 0.44 && h < 0.93) || h < 0.05)) {
        const sp = fbm(x * 0.045, y * 0.045, seed + 77, 2), h2 = hash(x, y, seed + 41);
        obj[i] = sp < 0.44 ? (h2 < 0.8 ? 1 : 2) : sp > 0.58 ? (h2 < 0.55 ? 3 : 2) : (h2 < 0.7 ? 2 : h2 < 0.85 ? 1 : 3);
        variant[i] = Math.floor(hash(x, y, seed + 43) * 4);
        hp[i] = 1; total++;
      } else if (hash(x, y, seed + 51) < 0.3) flower[i] = 1;
    }
    for (let x = 0; x < 9; x++) type[roadY * W + x] = T.DIRT;

    // Sanity check: the start region (west of the first river) must hold a fair share of the forest.
    const seen = new Uint8Array(N), stack = [roadY * W + 5];
    let reach = 0;
    seen[stack[0]] = 1;
    while (stack.length) {
      const c = stack.pop(), cx = c % W, cy = (c / W) | 0;
      if (obj[c]) reach++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (seen[n] || type[n] === T.WATER || type[n] === T.ROCK) continue;
        seen[n] = 1; stack.push(n);
      }
    }
    const frac = reach / total;
    if (!force && (frac < 0.28 || frac > 0.6)) return null;

    return { W, H, N, seed, type, obj, variant, lush, wear, bld, flower, hp, claim, roadY, totalTrees: total, start: { x: 6, y: roadY } };
  }

  // ---------- Ground renderer ----------
  const GL = [[38, 110, 44], [50, 132, 50], [64, 152, 58], [88, 174, 68]];
  const GD = [[112, 118, 52], [130, 134, 60], [148, 148, 70], [166, 160, 84]];
  const GX = [[92, 74, 52], [106, 86, 60], [120, 98, 68], [134, 110, 78]];
  const DT = [[124, 92, 58], [140, 106, 68], [156, 120, 80], [172, 136, 94]];
  const GV = [[98, 96, 92], [118, 116, 110], [138, 136, 128], [158, 155, 146]];
  const WA = [[31, 92, 168], [43, 118, 194], [66, 146, 218], [104, 184, 232], [200, 232, 248]];
  const BANK = [[150, 128, 86], [176, 154, 106]];
  const FLOWERS = [[255, 255, 255], [255, 150, 190], [240, 70, 70], [190, 130, 255], [255, 220, 80]];

  LJ.Ground = function (w) {
    this.w = w;
    this.cv = document.createElement('canvas');
    this.cv.width = w.W * TS; this.cv.height = w.H * TS;
    this.ctx = this.cv.getContext('2d');
    this.img = this.ctx.createImageData(TS, TS);
    this.dirty = new Set();
  };
  const GP = LJ.Ground.prototype;

  GP.tAt = function (x, y) {
    const w = this.w;
    let tx = (x / TS) | 0, ty = (y / TS) | 0;
    if (x < 0) tx = 0; else if (tx >= w.W) tx = w.W - 1;
    if (y < 0) ty = 0; else if (ty >= w.H) ty = w.H - 1;
    return ty * w.W + tx;
  };

  // Each pixel looks up its tile through a noise-jittered coordinate, which makes tile borders wobble naturally.
  GP.shade = function (px, py, d, o) {
    const w = this.w, s = w.seed, type = w.type;
    const jx = px + (vnoise(px * 0.13, py * 0.13, s + 201) - 0.5) * 10;
    const jy = py + (vnoise(px * 0.13 + 31.7, py * 0.13 + 11.3, s + 202) - 0.5) * 10;
    const i = this.tAt(jx, jy), t = type[i], h = hash(px, py, s + 7);
    let c;
    if (t === T.WATER) {
      const land = type[this.tAt(jx - 3, jy)] !== T.WATER || type[this.tAt(jx + 3, jy)] !== T.WATER ||
        type[this.tAt(jx, jy - 3)] !== T.WATER || type[this.tAt(jx, jy + 3)] !== T.WATER;
      const wv = vnoise(px * 0.07, py * 0.22, s + 300);
      c = land ? (h < 0.1 ? WA[4] : WA[3]) : wv < 0.35 ? WA[0] : wv < 0.7 ? WA[1] : WA[2];
    } else {
      const nearW = type[this.tAt(jx - 2, jy)] === T.WATER || type[this.tAt(jx + 2, jy)] === T.WATER ||
        type[this.tAt(jx, jy - 2)] === T.WATER || type[this.tAt(jx, jy + 2)] === T.WATER;
      const n = vnoise(px * 0.21, py * 0.21, s + 400) * 0.65 + hash(px, py, s + 8) * 0.35;
      const k = n < 0.3 ? 0 : n < 0.6 ? 1 : n < 0.86 ? 2 : 3;
      if (nearW) c = BANK[h < 0.5 ? 0 : 1];
      else if (t === T.GRASS) {
        const L = w.lush[i] + (h - 0.5) * 0.35;
        c = (L > 0.62 ? GL : L > 0.3 ? GD : GX)[k];
      } else if (t === T.DIRT) c = DT[k];
      else c = GV[k];
    }
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  };

  GP.renderTile = function (i) {
    const w = this.w, tx = i % w.W, ty = (i / w.W) | 0, d = this.img.data, s = w.seed;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) this.shade(tx * TS + x, ty * TS + y, d, (y * TS + x) * 4);
    const set = (x, y, c) => {
      if (x < 0 || y < 0 || x >= TS || y >= TS) return;
      const o = (y * TS + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
    };
    if (w.flower[i] && w.type[i] === T.GRASS && w.obj[i] === 0 && w.lush[i] > 0.55) {
      const n = 1 + Math.floor(hash(tx, ty, s + 90) * 3);
      for (let k = 0; k < n; k++) {
        const fx = 2 + Math.floor(hash(tx, ty, s + 91 + k) * 12), fy = 2 + Math.floor(hash(tx, ty, s + 95 + k) * 12);
        const col = FLOWERS[Math.floor(hash(tx, ty, s + 99 + k) * FLOWERS.length)];
        set(fx - 1, fy, col); set(fx + 1, fy, col); set(fx, fy - 1, col); set(fx, fy + 1, col);
        set(fx, fy, [255, 200, 40]); set(fx, fy + 2, [30, 90, 36]);
      }
    }
    if (w.obj[i] === STUMP) {
      const OUT = [58, 36, 20], TOP = [222, 188, 128], RING = [186, 142, 84], SIDE = [112, 72, 40];
      for (let x = 5; x <= 10; x++) { set(x, 6, OUT); set(x, 13, OUT); }
      for (let y = 7; y <= 12; y++) { set(4, y, OUT); set(11, y, OUT); }
      for (let y = 7; y <= 12; y++) for (let x = 5; x <= 10; x++) set(x, y, y <= 9 ? TOP : SIDE);
      set(7, 8, RING); set(8, 8, RING); set(6, 9, RING); set(9, 7, RING);
      set(5, 12, OUT); set(10, 12, OUT);
    }
    this.ctx.putImageData(this.img, tx * TS, ty * TS);
  };

  GP.renderAll = function () { for (let i = 0; i < this.w.N; i++) this.renderTile(i); this.dirty.clear(); };
  GP.mark = function (i) { this.dirty.add(i); };
  GP.flush = function (max) {
    let n = 0;
    for (const i of this.dirty) {
      this.renderTile(i); this.dirty.delete(i);
      if (++n >= max) break;
    }
  };
})();
