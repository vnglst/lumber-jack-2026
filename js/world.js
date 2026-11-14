'use strict';
// Tile world generation + the per-pixel ground renderer.
(function () {
  const TS = (LJ.TS = 16);
  const T = (LJ.T = { GRASS: 0, DIRT: 1, WATER: 2, ROCK: 3, GRAVEL: 4, ROAD: 5, BRIDGE: 6, MUD: 7 });
  const isRoad = (LJ.isRoad = t => t === T.ROAD || t === T.BRIDGE); // the pre-built road to market, bridges included
  LJ.STUMP = 9;
  // How many tile rows a tree's canopy reaches above its base: used for tap targets and view culling.
  LJ.TREE_ROWS = Math.ceil(Math.max(...LJ.sprites.trees.flat().map(c => c.ay)) / TS);
  const { hash, vnoise, fbm } = LJ;

  LJ.genWorld = function (seed, hutLimit = 7) {
    for (let a = 0; a < 40; a++) {
      const w = build(seed + a * 101, false, hutLimit);
      if (w) return w;
    }
    return build(seed, true, hutLimit);
  };

  function build(seed, force, hutLimit) {
    const W = 104, H = 72, N = W * H;
    const type = new Uint8Array(N), obj = new Uint8Array(N), variant = new Uint8Array(N);
    const lush = new Float32Array(N).fill(1), wear = new Uint8Array(N), bld = new Int16Array(N);
    const flower = new Uint8Array(N), hp = new Float32Array(N), claim = new Int32Array(N);

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

    // The settlement starts in the middle of the map, on dry land between the two rivers.
    const cy = (H >> 1) + Math.floor((hash(1, 2, seed) - 0.5) * 10);
    const wetAt = x => x < W && type[cy * W + x] === T.WATER;
    let x = Math.floor(W * 0.25);
    while (x < W && !wetAt(x)) x++; // the first river...
    while (wetAt(x + 1)) x++; // ...across to its east bank
    const r1 = x;
    x++;
    while (x < W && !wetAt(x)) x++; // the second river's west bank
    const r2 = x;
    if (!force && (r2 >= W || r2 - r1 < 16)) return null;
    const sx = r2 < W ? (r1 + r2) >> 1 : W >> 1;
    const nearStart = (x, y) => Math.hypot(x - sx, y - cy) < 7;

    // A road already runs west from the settlement to the market at the map's edge, bridging any water on the way.
    const roadAt = x => (x < sx - 3 ? LJ.clamp(cy + Math.round((fbm(x * 0.05, 7.3, seed + 90, 2) - 0.5) * 16), 3, H - 4) : cy);
    const road = new Uint8Array(N);
    let prevY = cy;
    for (let x = sx + 1; x >= 0; x--) {
      // Over water the road runs straight, so bridges come out as clean spans rather than staircases.
      const wet = type[prevY * W + x] === T.WATER || (x > 0 && type[prevY * W + x - 1] === T.WATER) || type[prevY * W + x + 1] === T.WATER;
      const y = wet ? prevY : roadAt(x);
      for (let k = Math.min(y, prevY); k <= Math.max(y, prevY); k++) road[k * W + x + 1] = 1; // climb in the previous column, so every step is 4-connected
      road[y * W + x] = 1;
      prevY = y;
    }
    const roadY = roadAt(0);

    // A pond near the start, for looks.
    const px = sx + 6 + Math.floor(hash(3, 4, seed) * 6), py = Math.min(H - 6, cy + 9);
    for (let y = py - 4; y <= py + 4; y++) for (let x = px - 5; x <= px + 5; x++) {
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
      const d = Math.hypot((x - px) * 0.8, y - py);
      if (d < 2.2 + vnoise(x * 0.5, y * 0.5, seed + 60) * 1.8) type[y * W + x] = T.WATER;
    }

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (type[i] === T.WATER || nearStart(x, y) || road[i]) continue;
      const nearW = (x > 0 && type[i - 1] === T.WATER) || (x < W - 1 && type[i + 1] === T.WATER) ||
        (y > 0 && type[i - W] === T.WATER) || (y < H - 1 && type[i + W] === T.WATER);
      if (fbm(x * 0.09, y * 0.09, seed + 5, 3) > 0.655 || (nearW && hash(x, y, seed + 21) < 0.18)) type[i] = T.ROCK;
    }

    let total = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (type[i] !== T.GRASS || road[i]) continue;
      const clearing = Math.hypot(x - sx, y - (cy - 1)) < 5.6 + vnoise(x * 0.6, y * 0.6, seed + 70) * 1.5;
      const d = fbm(x * 0.08, y * 0.08, seed + 9, 3), h = hash(x, y, seed + 31);
      if (!clearing && ((d > 0.44 && h < 0.93) || h < 0.05)) {
        const sp = fbm(x * 0.045, y * 0.045, seed + 77, 2), h2 = hash(x, y, seed + 41);
        obj[i] = sp < 0.44 ? (h2 < 0.8 ? 1 : 2) : sp > 0.58 ? (h2 < 0.55 ? 3 : 2) : (h2 < 0.7 ? 2 : h2 < 0.85 ? 1 : 3);
        variant[i] = Math.floor(hash(x, y, seed + 43) * 4);
        hp[i] = 1; total++;
      } else if (hash(x, y, seed + 51) < 0.18) flower[i] = 1;
    }
    for (let i = 0; i < N; i++) if (road[i]) type[i] = type[i] === T.WATER ? T.BRIDGE : T.ROAD;

    // Decoration: purely visual plants and pebbles; codes index LJ.DECO.
    const deco = new Uint8Array(N), decoV = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = type[i], h = hash(x, y, seed + 61);
      decoV[i] = (hash(x, y, seed + 62) * 3) | 0;
      if (t === T.WATER) { if (h < 0.05) deco[i] = 6; continue; }
      if (t !== T.GRASS || obj[i] || nearStart(x, y)) continue;
      let nearW = false, nearTree = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (type[n] === T.WATER && (dx === 0 || dy === 0)) nearW = true;
        if (obj[n] >= 1 && obj[n] <= 3) nearTree = true;
      }
      if (nearW) deco[i] = h < 0.3 ? 5 : h < 0.45 ? 7 : 0;
      else if (nearTree) deco[i] = h < 0.06 ? 2 : h < 0.12 ? 3 : h < 0.18 ? 4 : h < 0.22 ? 1 : 0;
      else deco[i] = h < 0.08 ? 1 : h < 0.1 ? 3 : 0;
    }

    // The forest folk's huts: small clearings deep in the forest, well away from the start and from each other.
    const huts = [], hr = LJ.rng(seed + 333);
    for (let tries = 0; tries < 4000 && huts.length < hutLimit; tries++) {
      const x = 3 + ((hr() * (W - 6)) | 0), y = 3 + ((hr() * (H - 6)) | 0), i = y * W + x;
      if (Math.hypot(x - sx, y - cy) < 22 || (x < sx && Math.abs(y - roadAt(x)) < 5) || !(obj[i] >= 1 && obj[i] <= 3) || huts.some(h => Math.hypot((h % W) - x, ((h / W) | 0) - y) < 14)) continue;
      let dense = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const o = obj[(y + dy) * W + x + dx]; if (o >= 1 && o <= 3) dense++; }
      if (dense < 18) continue;
      obj[i] = 0; total--; deco[i] = 8; flower[i] = 0; huts.push(i);
    }

    // Trees and stumps are nudged off the tile grid so the forest doesn't look planted.
    const tbx = new Int8Array(N), tby = new Int8Array(N);
    for (let i = 0; i < N; i++) { tbx[i] = ((hash(i, 1, seed) * 11) | 0) - 5; tby[i] = ((hash(i, 2, seed) * 7) | 0) - 3; }

    // Sanity check: the land the settlement can reach without a bulldozer must hold a fair share of the forest.
    const seen = new Uint8Array(N), stack = [(cy + 1) * W + sx];
    let reach = 0;
    seen[stack[0]] = 1;
    while (stack.length) {
      const c = stack.pop(), qx = c % W, qy = (c / W) | 0;
      if (obj[c]) reach++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (seen[n] || type[n] === T.WATER || type[n] === T.ROCK) continue;
        seen[n] = 1; stack.push(n);
      }
    }
    const frac = reach / total;
    if (!force && (frac < 0.3 || frac > 0.75)) return null;

    return { W, H, N, seed, type, obj, variant, lush, wear, bld, flower, hp, claim, deco, decoV, tbx, tby, huts, hutLimit, wall: new Uint8Array(N), roadY, totalTrees: total,
      start: { x: sx + 2, y: cy + 1 }, base: { tx: sx - 1, ty: cy - 3 } };
  }

  // ---------- Ground renderer ----------
  // Palettes: lush, dry and dead grass (the forest turns to wasteland as it is cleared), dirt, gravel, water, mud.
  const { rgb, step, dith } = LJ.spr, P = a => a.map(rgb);
  const GL = P(['#2f6a2a', '#3b7d30', '#4a9137', '#5ba43f', '#74b84a']), GL_BLADE = rgb('#285c25'), GL_TIP = rgb('#93cc5c');
  const GD = P(['#5d6a28', '#707d30', '#85903c', '#9aa24a', '#b0b35c']), GD_BLADE = rgb('#4c5722'), GD_TIP = rgb('#c4c272');
  const GX = P(['#5a4630', '#6b553a', '#7d6646', '#8f7754', '#a28a64']), GX_BLADE = rgb('#463624'), GX_TIP = rgb('#b49c74');
  const DT = P(['#6e4a2c', '#835a36', '#986b42', '#ad7e50', '#c39461']), PEB = rgb('#dcb47e'), PEB_D = rgb('#55361f');
  const GV = P(['#5e5a54', '#76726a', '#8e8a80', '#a6a196', '#bdb8ab']);
  const RD = P(['#8a6a44', '#9c7a50', '#ae8a5c', '#bf9a68', '#cfab78']), RUT = rgb('#76583a');
  const TRACK = P(['#302721', '#251f1c', '#19191a', '#393029', '#44372b']);
  const PLANK = P(['#7a4d26', '#8a5a30', '#9a6838', '#b07a44']), RAIL = rgb('#4a2f1a');
  const WA = P(['#1d5ca6', '#2470bd', '#3388cf', '#57a6e0', '#9fd2f2', '#e4f4fb']), MUD = P(['#5f4c32', '#77613f', '#8f7a52']);
  const BARE_MUD = P(['#382d24', '#49392a', '#5c4631', '#705438', '#816343']), PUDDLE = rgb('#302f2b'), MUD_GLINT = rgb('#77756a');
  const FLOWERS = [[255, 255, 255], [255, 150, 190], [240, 70, 70], [190, 130, 255], [255, 220, 80]];

  LJ.Ground = function (w) {
    this.w = w;
    const PW = w.W * TS, PH = w.H * TS;
    this.cv = document.createElement('canvas');
    this.cv.width = PW; this.cv.height = PH;
    this.ctx = this.cv.getContext('2d');
    this.img = this.ctx.createImageData(TS, TS);
    this.dirty = new Set();
    // Every pixel looks up its tile through a fixed, noise-based offset, so tile borders wobble naturally.
    this.jx = new Int8Array(PW * PH); this.jy = new Int8Array(PW * PH); this.PW = PW; this.PH = PH;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const p = y * PW + x;
      this.jx[p] = Math.round((vnoise(x * 0.11, y * 0.11, w.seed + 201) - 0.5) * 11);
      this.jy[p] = Math.round((vnoise(x * 0.11 + 31.7, y * 0.11 + 11.3, w.seed + 202) - 0.5) * 11);
    }
  };
  const GP = LJ.Ground.prototype;

  // Tile index that pixel (x, y) belongs to, after jitter.
  GP.tj = function (x, y) {
    const w = this.w, PW = this.PW;
    x = x < 0 ? 0 : x >= PW ? PW - 1 : x; y = y < 0 ? 0 : y >= this.PH ? this.PH - 1 : y;
    const p = y * PW + x;
    let tx = ((x + this.jx[p]) / TS) | 0, ty = ((y + this.jy[p]) / TS) | 0;
    if (x + this.jx[p] < 0) tx = 0; else if (tx >= w.W) tx = w.W - 1;
    if (y + this.jy[p] < 0) ty = 0; else if (ty >= w.H) ty = w.H - 1;
    return ty * w.W + tx;
  };
  GP.near = function (x, y, r, test) {
    const t = this.w.type;
    return test(t[this.tj(x - r, y)]) || test(t[this.tj(x + r, y)]) || test(t[this.tj(x, y - r)]) || test(t[this.tj(x, y + r)]);
  };
  const isW = t => t === T.WATER, isLand = t => t !== T.WATER, isGrass = t => t === T.GRASS;

  // wet/dry: whether the 3x3 tiles around this tile hold any water / any land, so far-away pixels skip the edge checks.
  // exact: the tile the pixel really sits on (i, below, is the jittered one that softens borders).
  GP.shade = function (px, py, d, o, wet, dry, exact) {
    const w = this.w, s = w.seed, i = this.tj(px, py), t = w.type[i], h = hash(px, py, s + 13);
    let c;
    if (w.type[exact] === T.BRIDGE) {
      // Bridges keep straight edges: planks across, a dark rail where the bridge meets open water.
      const lx = px & 15, ly = py & 15, up = w.type[exact - w.W] === T.WATER, down = w.type[exact + w.W] === T.WATER;
      c = (up && ly < 2) || (down && ly > 13) ? (ly === 0 || ly === 15 ? RAIL : PLANK[3]) : lx % 4 === 3 ? PLANK[0] : PLANK[1 + (((px >> 2) + (hash(px >> 2, py >> 3, s) < 0.3 ? 1 : 0)) % 2)];
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      return;
    }
    if (t === T.WATER) {
      if (dry && this.near(px, py, 2, isLand)) c = h < 0.55 ? WA[5] : WA[4];
      else if (dry && this.near(px, py, 5, isLand)) c = WA[3];
      else {
        // Short, broken highlight streaks running with the current.
        const rp = vnoise(px * 0.11, py * 0.75, s + 4);
        c = rp > 0.8 ? WA[4] : rp > 0.72 ? WA[3] : WA[step(vnoise(px * 0.06, py * 0.06, s + 5), 3, px, py)];
      }
    } else if (t === T.MUD) {
      const pool = vnoise(px * 0.14, py * 0.14, s + 221);
      c = pool > 0.7 ? (h < 0.06 ? MUD_GLINT : PUDDLE) : BARE_MUD[step(vnoise(px * 0.22, py * 0.22, s + 222), 5, px, py)];
    } else if (wet && t !== T.ROCK && this.near(px, py, 3, isW)) {
      c = h < 0.06 ? PEB : MUD[step(vnoise(px * 0.3, py * 0.3, s + 6), 3, px, py)];
    } else if (isRoad(t)) {
      // The packed road to market: lighter than trails, pebbly, with faint wheel ruts.
      const horiz = isRoad(w.type[exact - 1]) || isRoad(w.type[exact + 1]);
      const rut = horiz ? ((py & 15) === 5 || (py & 15) === 10) : ((px & 15) === 5 || (px & 15) === 10);
      c = h < 0.03 ? PEB : rut && h < 0.7 ? RUT : RD[step(vnoise(px * 0.2, py * 0.2, s + 7) * 0.7 + hash(px, py, s + 8) * 0.3, 5, px, py)];
    } else if (t === T.DIRT) {
      if (h < 0.022) c = PEB;
      else if (hash(px, py - 1, s + 13) < 0.022) c = PEB_D;
      else if (h < 0.3 && this.near(px, py, 2, isGrass)) c = w.lush[i] > 0.5 ? GL[1] : GD[1]; // grass creeping onto the path
      else c = DT[step(vnoise(px * 0.18, py * 0.18, s + 7) * 0.7 + hash(px, py, s + 8) * 0.3, 5, px, py)];
    } else if (t === T.GRAVEL || t === T.ROCK) {
      c = h < 0.04 ? GV[4] : hash(px, py - 1, s + 13) < 0.04 ? GV[0] : GV[step(vnoise(px * 0.25, py * 0.25, s + 9) * 0.6 + h * 0.4, 5, px, py)];
    } else {
      // Grass: lush, dry or dead depending on how much forest has been cut around it.
      const L = w.lush[i] + (dith(px, py) - 0.5) * 0.16;
      const pal = L > 0.62 ? GL : L > 0.3 ? GD : GX, blade = L > 0.62 ? GL_BLADE : L > 0.3 ? GD_BLADE : GX_BLADE, tip = L > 0.62 ? GL_TIP : L > 0.3 ? GD_TIP : GX_TIP;
      const v = fbm(px * 0.02, py * 0.02, s + 11, 2) * 0.5 + vnoise(px * 0.13, py * 0.13, s + 12) * 0.35 + h * 0.15;
      let k = step((v - 0.22) * 1.7, 5, px, py, 0.8);
      if (wet && this.near(px, py, 5, isW)) k = Math.max(0, k - 1); // damp grass by the water
      const hb = hash(px, py, s + 14) < 0.05, ht = hash(px, py + 1, s + 14) < 0.05;
      c = hb ? blade : ht ? (k >= 3 ? tip : pal[Math.min(4, k + 1)]) : pal[k];
    }
    const damage = Math.min(1, Math.max(0, (w.wear[i] - 10) / 180));
    if (damage && t !== T.WATER && t !== T.ROCK && t !== T.BRIDGE) {
      const horizontal = (w.wear[i - 1] || 0) + (w.wear[i + 1] || 0) >= (w.wear[i - w.W] || 0) + (w.wear[i + w.W] || 0);
      const lane = (horizontal ? py : px) & 15, rut = lane === 5 || lane === 6 || lane === 10 || lane === 11;
      const mud = TRACK[Math.floor(h * TRACK.length)], mix = damage * (rut ? 0.95 : 0.8);
      d[o] = c[0] + (mud[0] - c[0]) * mix;
      d[o + 1] = c[1] + (mud[1] - c[1]) * mix;
      d[o + 2] = c[2] + (mud[2] - c[2]) * mix;
      d[o + 3] = 255;
      return;
    }
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  };

  GP.renderTile = function (i) {
    const w = this.w, tx = i % w.W, ty = (i / w.W) | 0, d = this.img.data, s = w.seed;
    let wet = false, dry = false;
    for (let y = Math.max(0, ty - 1); y <= Math.min(w.H - 1, ty + 1); y++) for (let x = Math.max(0, tx - 1); x <= Math.min(w.W - 1, tx + 1); x++) {
      if (w.type[y * w.W + x] === T.WATER) wet = true; else dry = true;
    }
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) this.shade(tx * TS + x, ty * TS + y, d, (y * TS + x) * 4, wet, dry, i);
    const set = (x, y, c) => {
      if (x < 0 || y < 0 || x >= TS || y >= TS) return;
      const o = (y * TS + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
    };
    if (w.flower[i] && w.type[i] === T.GRASS && w.obj[i] === 0 && w.lush[i] > 0.55) {
      const n = 1 + Math.floor(hash(tx, ty, s + 90) * 2);
      for (let k = 0; k < n; k++) {
        const fx = 2 + Math.floor(hash(tx, ty, s + 91 + k) * 12), fy = 2 + Math.floor(hash(tx, ty, s + 95 + k) * 12);
        const col = FLOWERS[Math.floor(hash(tx, ty, s + 99 + k) * FLOWERS.length)];
        set(fx, fy, col); set(fx, fy + 1, [40, 100, 40]);
      }
    }
    this.ctx.putImageData(this.img, tx * TS, ty * TS);
  };

  // Where a tree's (or stump's) trunk meets the ground, in world pixels.
  LJ.treeX = (w, i) => (i % w.W) * TS + 8 + w.tbx[i];
  LJ.treeY = (w, i) => ((i / w.W) | 0) * TS + 13 + w.tby[i];

  // Decoration types (codes stored in world.deco). show() says whether the spot still suits it; y is its ground offset in the tile.
  LJ.DECO = [null,
    { name: 'flowers', show: (w, i) => w.type[i] === T.GRASS && w.lush[i] > 0.45, y: 12 },
    { name: 'mushrooms', show: (w, i) => w.type[i] === T.GRASS && w.lush[i] > 0.45, y: 12 },
    { name: 'bush', show: (w, i) => w.type[i] === T.GRASS && w.lush[i] > 0.45, y: 12 },
    { name: 'fern', show: (w, i) => w.type[i] === T.GRASS && w.lush[i] > 0.45, y: 12 },
    { name: 'reeds', show: (w, i) => w.type[i] === T.GRASS && w.lush[i] > 0.3, y: 12 },
    { name: 'lily', show: (w, i) => w.type[i] === T.WATER, y: 6 },
    { name: 'pebbles', show: (w, i) => w.type[i] !== T.WATER, y: 12 },
    { name: 'hut', show: () => true, y: 13 }];

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
