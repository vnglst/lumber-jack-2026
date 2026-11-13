'use strict';
// Procedural pixel art, part 2: nature (trees, rocks, stumps, plants), people and wildlife you can't fight.
// Shaded with per-pixel lighting, ordered dithering and ambient occlusion, then quantized to small palettes.
(function () {
  const S = LJ.sprites, I = S.icons;
  const { hash, vnoise, rng } = LJ;
  const { art, outline, both, pts, R, rgb, step, LIGHT, Buf, icon } = LJ.spr;

  // Soft two-step ground shadow, cast down-right.
  function shadow(b, cx, cy, rx, ry, a) {
    const col = [12, 34, 18];
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) b.set(x, y, col, d > 0.55 ? a * 0.55 : a);
    }
  }
  function maskOutline(b, own, col) {
    const W = b.w, H = b.h;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (own[y * W + x] >= 0) continue;
      if ((x > 0 && own[y * W + x - 1] >= 0) || (x < W - 1 && own[y * W + x + 1] >= 0) ||
          (y > 0 && own[(y - 1) * W + x] >= 0) || (y < H - 1 && own[(y + 1) * W + x] >= 0)) b.set(x, y, col);
    }
  }
  const anchor = (c, ax, ay) => { c.ax = ax; c.ay = ay; return c; };

  const PAL = {
    oak: ['#10301a', '#1d4d24', '#2b6a2b', '#3e8733', '#58a33c', '#7dbd4a', '#b5dc6a'],
    yellow: ['#2c360c', '#4f6b14', '#76921e', '#9fb52a', '#c6d33c', '#e3e66a', '#fbf6a8'],
    pine: ['#0b261c', '#123f2d', '#1a5a3b', '#267447', '#3a9056', '#5fae67', '#93cf84'],
    bush: ['#0f2a16', '#1a4420', '#265e28', '#367a30', '#4c9438', '#6aae45', '#9fd060'],
    bark: ['#24140b', '#4a2c17', '#6b4224', '#8c5a32'],
    birch: ['#2a2622', '#9a958a', '#cfcabd', '#f2efe6'],
    rock: ['#26252b', '#47464f', '#6a6970', '#8f8d8b', '#b4b1a6', '#d8d4c4']
  };

  // ---------- Leafy canopy: many overlapping, individually lit leaf clumps ----------
  function canopy(b, o) {
    const r = rng(o.seed), W = b.w, H = b.h, cl = [];
    for (let i = 0; i < o.n; i++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * 0.78;
      cl.push({ x: o.cx + Math.cos(a) * d * o.rx, y: o.cy + Math.sin(a) * d * o.ry, r: o.rmin + r() * (o.rmax - o.rmin), ph: r() * 50 });
    }
    cl.push({ x: o.cx, y: o.cy + o.ry * 0.1, r: Math.min(o.rx, o.ry) * 0.75, ph: r() * 50 });
    cl.sort((p, q) => p.y - q.y); // back clumps first, front clumps (lower on screen) on top
    const own = new Int16Array(W * H).fill(-1);
    cl.forEach((c, i) => {
      const RR = c.r * 1.15;
      for (let y = Math.max(0, Math.floor(c.y - RR)); y < Math.min(H, c.y + RR); y++) {
        for (let x = Math.max(0, Math.floor(c.x - RR)); x < Math.min(W, c.x + RR); x++) {
          const dx = x + 0.5 - c.x, dy = y + 0.5 - c.y, d = Math.hypot(dx, dy) || 1;
          // Scalloped edge: the radius wobbles with periodic noise around the circle.
          const rr = c.r * (0.8 + 0.34 * vnoise((dx / d) * 1.7 + c.ph, (dy / d) * 1.7 + c.ph, o.seed));
          if (d < rr) own[y * W + x] = i;
        }
      }
    });
    const P = o.pal.map(rgb), lv = P.length - 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = own[y * W + x];
      if (i < 0) continue;
      const c = cl[i];
      const nx = (x + 0.5 - c.x) / c.r, ny = (y + 0.5 - c.y) / c.r, nz = Math.sqrt(Math.max(0.04, 1 - nx * nx - ny * ny));
      const lam = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const g = ((o.cx - x) * 0.35 + (o.cy - y) * 0.75) / (o.rx + o.ry);
      const tex = vnoise(x * 0.62, y * 0.62, o.seed + 7) - 0.5;
      let ao = 0; // a clump sitting in front darkens the clump behind it
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        if (own[Y * W + X] > i) ao = Math.max(ao, Math.abs(dx) + Math.abs(dy) <= 1 ? 0.38 : 0.2);
      }
      const k = step(lam * 0.62 + g * 0.45 + tex * 0.42 + 0.08 - ao, lv, x, y);
      let col = P[1 + k];
      if (k >= lv - 2 && hash(x, y, o.seed) < 0.07) col = P[P.length - 1];
      else if (k <= 1 && hash(x, y, o.seed + 1) < 0.05) col = P[0];
      b.set(x, y, col);
    }
    maskOutline(b, own, P[0]);
  }

  function trunk(b, cx, y0, y1, hw, pal, seed, birch) {
    const P = pal.map(rgb);
    for (let y = y0; y <= y1; y++) {
      const flare = Math.max(0, y - (y1 - 3)), w = hw + flare * 0.8;
      const xa = Math.round(cx - w), xb = Math.round(cx + w) - 1;
      for (let x = xa; x <= xb; x++) {
        const t = (x - xa) / Math.max(1, xb - xa);
        let k = t < 0.3 ? 3 : t < 0.65 ? 2 : 1;
        if (y < y0 + 5) k = Math.max(1, k - 1); // in the canopy's shade
        if (!birch && hash(x, y >> 1, seed) < 0.2) k = Math.max(1, k - 1); // bark grooves
        let col = P[k];
        if (birch && x > xa && x < xb && hash(x >> 1, y >> 1, seed + 3) < 0.17) col = P[0];
        b.set(x, y, x === xa || x === xb || y === y1 ? P[0] : col);
      }
    }
  }

  function broadleaf(seed, pal, bark, birch, sc) {
    const W = 48, H = 56, b = new Buf(W, H);
    shadow(b, 27, 51, 17 * sc, 4.5, 0.38);
    trunk(b, 24, 30, 52, birch ? 2.5 : 3, bark, seed, birch);
    canopy(b, { cx: 24, cy: 23 + (1 - sc) * 8, rx: 16 * sc, ry: 14.5 * sc, n: 11, rmin: 5.5 * sc, rmax: 8.5 * sc, pal, seed });
    return anchor(b.canvas(), 24, 52);
  }

  // ---------- Pine: stacked, drooping tiers with needle strokes ----------
  function pine(seed, sc) {
    const W = 38, H = 60, cx = 19, b = new Buf(W, H), P = PAL.pine.map(rgb), lv = P.length - 2;
    shadow(b, 21, 54, 12 * sc, 4, 0.38);
    trunk(b, 19, 44, 55, 2, PAL.bark, seed, false);
    const tiers = 5, top = Math.round(4 + (1 - sc) * 22), bot = 49;
    const tierH = (bot - top) * 0.36, stepY = (bot - top - tierH) / (tiers - 1);
    const own = new Int8Array(W * H).fill(-1), info = [];
    for (let k = tiers - 1; k >= 0; k--) { // bottom tier first; each tier above hangs over the one below
      const y0 = top + k * stepY, y1 = y0 + tierH + k * 0.6, idx = tiers - 1 - k;
      const hwB = (3.5 + ((k + 1) / tiers) * 13) * sc, hwT = k === 0 ? 0.5 : hwB * 0.28;
      info[idx] = { y0, y1, hwB, hwT, k };
      for (let y = Math.floor(y0); y <= Math.ceil(y1) + 2; y++) {
        const t = LJ.clamp((y - y0) / (y1 - y0), 0, 1);
        const hw = hwT + (hwB - hwT) * Math.pow(t, 0.85);
        for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
          const d = Math.abs(x + 0.5 - cx), tooth = (Math.floor(d) + (k & 1) * 2) % 4;
          const hem = y1 - (tooth < 2 ? 0 : 2) - (hash(x, k, seed) < 0.25 ? 1 : 0) + d * 0.14;
          if (y < y0 || y > hem || x < 0 || x >= W || y >= H) continue;
          own[y * W + x] = idx;
        }
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = own[y * W + x];
      if (i < 0) continue;
      const ti = info[i], t = LJ.clamp((y - ti.y0) / (ti.y1 - ti.y0), 0, 1);
      const hw = Math.max(1, ti.hwT + (ti.hwB - ti.hwT) * Math.pow(t, 0.85)), side = (x + 0.5 - cx) / hw;
      let v = 0.6 - side * 0.32 - t * 0.12 + (0.5 - ti.k / tiers) * 0.12;
      const d = Math.abs(x - cx);
      if ((((2 * y - 3 * d) % 7) + 7) % 7 === 0) v += 0.22; // needle strokes, angled down and out
      v += (hash(x, y, seed) - 0.5) * 0.18;
      let ao = 0;
      for (let dy = -3; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W && own[Y * W + X] > i) ao = Math.max(ao, dy >= -1 ? 0.4 : 0.22);
      }
      const k = step(v - ao, lv, x, y);
      b.set(x, y, k >= lv - 1 && hash(x, y, seed + 5) < 0.08 ? P[P.length - 1] : P[1 + k]);
    }
    maskOutline(b, own, P[0]);
    return anchor(b.canvas(), 19, 55);
  }

  // Index matches the world's tree species: 1 = pine, 2 = oak, 3 = birch.
  S.trees = [
    [[101, 1], [117, 0.86], [131, 0.93], [149, 0.8]].map(([sd, sc]) => pine(sd, sc)),
    [[201, 1], [233, 0.88], [257, 0.94], [271, 0.82]].map(([sd, sc]) => broadleaf(sd, PAL.oak, PAL.bark, false, sc)),
    [[301, 0.92], [323, 0.8], [347, 0.86], [359, 0.76]].map(([sd, sc]) => broadleaf(sd, PAL.yellow, PAL.birch, true, sc))
  ];

  // ---------- Rocks: faceted, with moss on the sunny tops ----------
  function boulder(seed, W, H) {
    const b = new Buf(W, H), r = rng(seed), P = PAL.rock.map(rgb), lv = P.length - 1, bl = [];
    const n = 3 + ((r() * 2) | 0);
    for (let i = 0; i < n; i++) bl.push({ x: W * (0.3 + r() * 0.4), y: H * (0.42 + r() * 0.25), rx: W * (0.2 + r() * 0.16), ry: H * (0.22 + r() * 0.16) });
    shadow(b, W / 2 + 2, H - 3, W * 0.46, 2.5, 0.35);
    const own = new Int8Array(W * H).fill(-1);
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) {
      let best = -1, bv = 1;
      bl.forEach((c, i) => { const dx = (x + 0.5 - c.x) / c.rx, dy = (y + 0.5 - c.y) / c.ry, v = dx * dx + dy * dy; if (v < bv) { bv = v; best = i; } });
      if (best >= 0) own[y * W + x] = best;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = own[y * W + x];
      if (i < 0) continue;
      const c = bl[i];
      // Coarsely quantized normals give flat, chiselled facets.
      const nx = Math.round(((x + 0.5 - c.x) / c.rx) * 2) / 2, ny = Math.round(((y + 0.5 - c.y) / c.ry) * 2) / 2;
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx * 0.6 - ny * ny * 0.6));
      const lam = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      let col = P[1 + Math.min(lv - 1, step(lam * 0.85 + (hash(x, y, seed) - 0.5) * 0.12 - 0.05, lv, x, y, 0.5))];
      if (ny <= -0.5 && vnoise(x * 0.5, y * 0.5, seed + 9) > 0.52) col = rgb(hash(x, y, seed + 2) < 0.5 ? '#4f7a2a' : '#6d9a38');
      if (hash(x, y >> 1, seed + 4) < 0.03) col = P[1];
      b.set(x, y, col);
    }
    maskOutline(b, own, P[0]);
    return b.canvas();
  }
  S.rocks = [boulder(11, 22, 18), boulder(29, 20, 16), boulder(47, 22, 17), boulder(61, 19, 15)];
  S.pebbles = [boulder(73, 12, 10), boulder(89, 10, 9)];

  function stump(seed, big) {
    const W = 18, H = 14, b = new Buf(W, H), r = big ? 0 : 1;
    shadow(b, 10, 11, 8 - r, 2.5, 0.35);
    const BARK = PAL.bark.map(rgb), RING = ['#e9cb92', '#d1a96b', '#b98a50'].map(rgb), own = new Int8Array(W * H).fill(-1);
    for (let y = 5; y <= 11; y++) {
      const flare = y >= 10 ? (y - 9) * 1.2 : 0;
      for (let x = Math.round(3 + r - flare); x <= Math.round(13 - r + flare); x++) {
        own[y * W + x] = 0;
        const t = (x - 3) / 10;
        b.set(x, y, hash(x, y >> 1, seed) < 0.2 ? BARK[1] : BARK[t < 0.3 ? 3 : t < 0.7 ? 2 : 1]);
      }
    }
    for (let y = 2; y <= 7; y++) for (let x = 3; x <= 13; x++) {
      const dx = (x + 0.5 - 8.5) / (5.5 - r), dy = (y + 0.5 - 5) / 2.8, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      own[y * W + x] = 0;
      b.set(x, y, d > 0.82 ? BARK[3] : RING[Math.floor(d * 6) % 2 === 0 ? 0 : 1]);
    }
    b.set(8, 5, RING[2]); b.set(9, 5, RING[2]); b.set(10 + (seed & 1), 3, RING[2]); b.set(6, 6, RING[2]);
    maskOutline(b, own, BARK[0]);
    if (seed & 1) { b.set(4, 10, rgb('#5f8f34')); b.set(5, 11, rgb('#4f7a2a')); b.set(4, 11, rgb('#6d9a38')); }
    return b.canvas();
  }
  S.stumps = [stump(5, true), stump(8, false), stump(11, true)];

  // ---------- Small plants and details ----------
  const map = (rows, pal) => outline(art(rows, pal));
  const BUSH = seed => {
    const b = new Buf(24, 16);
    shadow(b, 13, 13, 10, 2.5, 0.35);
    canopy(b, { cx: 12, cy: 8.5, rx: 8, ry: 4.5, n: 6, rmin: 3.5, rmax: 4.8, pal: PAL.bush, seed });
    const c = b.canvas(), x = c.getContext('2d');
    if (seed & 1) { x.fillStyle = '#e0303a'; [[7, 6], [14, 5], [17, 9], [10, 10]].forEach(p => x.fillRect(p[0], p[1], 1, 1)); }
    return c;
  };
  const flowerPal = (a, b) => ({ P: a, p: '#ffd84a', Y: b, y: '#e88a1c', W: '#ffffff', B: '#a98bff', b: '#ffe25a', g: '#2f6a2a', G: '#4f9a3a' });
  const FLOWERS = [
    '..P.....Y....', '.PpP...YyY...', '..P..W..Y..B.', '..g.WyW.g.BbB', '.gG..W.gG..B.', 'gGgG.g.GgG.g.', '.GgGgGgGgGgG.'];
  S.decor = {
    flowers: [map(FLOWERS, flowerPal('#ff8fbf', '#ffe25a')), map(FLOWERS, flowerPal('#ff5a5a', '#ffffff')), map(FLOWERS, flowerPal('#c98bff', '#ff9ccc'))],
    mushrooms: [map([
      '..RRR.......', '.RWRRR......', 'RRRRWRR.RR..', '.rrrrr.RWRR.', '..SSs.rrrrr.', '..SSs..SSs..', '..SSs..SSs..', '.gGgGgGgGg..'
    ], { R: '#d8382c', r: '#9a2420', W: '#f6efe2', S: '#efe2c4', s: '#c9b88e', g: '#3e7a2c', G: '#5a9a3a' }), map([
      '...BBB...', '..BbBBB..', '.BBBBBbB.', '..ssSSs..', '...SSs...', '.gGSSsGg.'
    ], { B: '#a8703a', b: '#d8b07a', S: '#efe2c4', s: '#c9b88e', g: '#3e7a2c', G: '#5a9a3a' })],
    bush: [BUSH(77), BUSH(90), BUSH(103)],
    fern: [map([
      '.....G......', '.G...G...G..', '..G.GgG.G...', 'G..GgGgG..G.', '.GgGg.gGgG..', '..gGg.gGg...', 'GgG.ggg.GgG.', '...gGgGg....'
    ], { G: '#5aa040', g: '#2f6a2a' })],
    lily: [map([
      '..GGGG.GG..', '.GgGGG.GGG.', 'GgGGGGPGGGG', 'GGGGGPpPGGG', '.GGGGGPGGG.', '..GGGGGGG..'
    ], { G: '#4c9a3c', g: '#7cc25a', P: '#ff9ccc', p: '#ffe25a' }), map([
      '..GGG.GG.', '.GgGG.GGG', 'GGGGGGGGG', '.GGGGGGG.', '..GGGGG..'
    ], { G: '#4c9a3c', g: '#7cc25a' })],
    reeds: [map([
      '..B...B..', '..B..BB..', '.BB..B...', '.B...G.B.', '.G..G..B.', '.G..G.BB.', '..G.G.G..', '..G.G.G..', 'G.G.GG..G', '.GG.G..G.', '..GGG.GG.', '...GGGG..'
    ], { B: '#6b4226', G: '#4f8f34' })]
  };

  // ---------- People ----------
  const JP = {
    c: '#6aa2f0', B: '#2f6fd8', b: '#1f4ea8', S: '#f1bd8f', s: '#d0956a', K: '#1a1218', H: '#7a4522', h: '#5a3018',
    R: '#d63a2e', r: '#a02822', X: '#3c1616', Y: '#e8c25a', o: '#4a2c18', J: '#3b5f9e', j: '#2b4677', O: '#5c3a20'
  };
  const JBODY = [
    '.....cBBBb...', '....cBBBBBb..', '....BBBBBBbb.', '...bbbbbbbbbb', '....sSSSSSS..', '....sSSKSSK..',
    '....HSSSsSS..', '....HHHHHHH..', '....HHHhHHH..', '.....hHHHh...', '...rRRRRRRRr.', '..RRXRRXRRXRr',
    '..rXXXXXXXXXr', '..RRXRRXRRXRr', '..SRXRRXRRXRS', '...ooooYoooo.'];
  const LEGS = [
    ['..JJJJjJJJJ..', '..JJJJ.jJJJ..', '..JJJ...JJJ..', '..OOO...OOO..'],
    ['..JJJJjJJJJ..', '.JJJJ...JJJ..', '.JJJ.....JJ..', '.OOO.....OO..'],
    ['..JJJJjJJJJ..', '...JJJ.JJJJ..', '....JJ.JJJ...', '....OO.OOO...']];
  const WOOD = '#a8743a', METAL = '#d5dbe2', EDGE = '#ffffff';
  const axeIdle = x => { pts(x, [[16, 13], [16, 12], [17, 11], [17, 10], [18, 9]], WOOD); pts(x, [[17, 6], [18, 6], [17, 7], [18, 7], [17, 8]], METAL); pts(x, [[19, 6], [19, 7], [19, 8]], EDGE); };
  const axeUp = x => { pts(x, [[15, 13], [15, 12], [16, 11], [16, 10], [17, 9], [17, 8], [18, 7], [18, 6]], WOOD); pts(x, [[17, 3], [18, 3], [17, 4], [18, 4], [17, 5]], METAL); pts(x, [[19, 3], [19, 4], [19, 5]], EDGE); };
  const axeDown = x => { pts(x, [[15, 14], [16, 14], [17, 14], [18, 14]], WOOD); pts(x, [[18, 12], [19, 12], [18, 13], [19, 13], [19, 15]], METAL); pts(x, [[19, 14], [18, 15]], EDGE); };
  const sawA = x => { R(x, 14, 12, 4, 4, '#e2731e'); R(x, 14, 12, 4, 1, '#ff9e4a'); R(x, 14, 11, 2, 1, '#3a2a20'); R(x, 18, 13, 2, 1, METAL); R(x, 18, 14, 2, 1, '#8c949e'); };
  const sawB = x => { R(x, 14, 13, 4, 4, '#e2731e'); R(x, 14, 13, 4, 1, '#ff9e4a'); R(x, 14, 12, 2, 1, '#3a2a20'); R(x, 18, 14, 2, 1, METAL); R(x, 18, 15, 2, 1, '#8c949e'); };
  const logOn = x => { R(x, 0, 9, 20, 3, '#a8703a'); R(x, 0, 9, 20, 1, '#c98f52'); R(x, 0, 11, 20, 1, '#7a4d26'); R(x, 0, 9, 1, 3, '#ecd29a'); R(x, 19, 9, 1, 3, '#ecd29a'); R(x, 6, 10, 2, 1, '#8a5a2c'); };

  function person(body, pal, leg, overlay) {
    const c = art(body.concat(LEGS[leg]), pal, 3, 20, 21);
    if (overlay) overlay(c.getContext('2d'));
    return both(anchor(outline(c), 11, 19)); // anchor at the feet
  }
  function jackSet(idleO, upO, downO) {
    const j = (leg, o) => person(JBODY, JP, leg, o);
    return { idle: j(0, idleO), walk: [j(1, idleO), j(2, idleO)], chop: [j(0, upO), j(0, downO)], carry: [j(0, logOn), j(1, logOn), j(2, logOn)] };
  }
  S.jack = { axe: jackSet(axeIdle, axeUp, axeDown), saw: jackSet(sawA, sawA, sawB) };
  // Arm out, laser pistol raised: one frame aiming, one with the muzzle glowing.
  const pistol = glow => x => {
    R(x, 15, 12, 5, 2, '#55596a'); R(x, 15, 12, 5, 1, '#9aa0b0'); R(x, 15, 14, 2, 2, '#3a3d46');
    R(x, 19, 12, 1, 2, glow ? '#ffffff' : '#ff5a4a'); if (glow) { R(x, 19, 11, 1, 1, '#ffb0a0'); R(x, 19, 14, 1, 1, '#ffb0a0'); }
  };
  S.jack.pistol = [person(JBODY, JP, 0, pistol(false)), person(JBODY, JP, 0, pistol(true))];

  const SUIT = [
    '.....hhhh....', '....hhhhhh...', '....hhhhhhh..', '....hSSSSSh..', '....SSSSSSS..', '....SSKSSKS..',
    '....SSSSsSS..', '....SSSSSSS..', '.....SSsSS...', '......SSS....', '...GGwTTwGG..', '..GGGwTTwGGG.',
    '..GGGGTTGGGG.', '..GGGGTTGGGG.', '..SGGGGGGGGS.', '...GGGGGGGG..'];
  const SP = { h: '#2a2019', S: '#f2c39a', s: '#d39b72', K: '#1a1218', G: '#343846', w: '#f4f4f4', T: '#c22d2d', J: '#23262f', j: '#1a1c24', O: '#111111' };
  const brief = x => { R(x, 15, 13, 5, 4, '#6b4526'); R(x, 15, 13, 5, 1, '#8a5c34'); R(x, 16, 12, 3, 1, '#3a2a20'); R(x, 17, 15, 1, 1, '#e8c25a'); };
  S.suit = { idle: person(SUIT, SP, 0, brief), walk: [person(SUIT, SP, 1, brief), person(SUIT, SP, 2, brief)] };

  // ---------- Peaceful wildlife ----------
  const DEER_TOP = [
    '.............A..A...', '.............AA.AA..', '..............AAA...', '.............dDDd...', '.............DDDDD..', '.............DDKDDD.',
    '..............DDDDDK', '..............DLLL..', '.............dDLL...', '..W.dDDDDDDDDDDL....', '..WdDDDLDDDDLDDL....', '...dDDDDDDDDDDDL....',
    '...dDDLLLLLLLDDd....'];
  const DEER_LEGS = [
    ['....dDd....dDDd.....', '....dD.....dD.d.....', '....dD.....dD.d.....', '....dd.....d..d.....', '....KK.....K..K.....'],
    ['....dDd....dDDd.....', '...dD.......dD.d....', '..dD.........dD.d...', '..d..........d...d..', '..K..........K...K..']];
  const DP = { D: '#b0703c', d: '#7a4826', L: '#ecd0a6', K: '#2a1a14', A: '#dcc7a0', W: '#f6eee0' };
  S.deer = DEER_LEGS.map(l => both(map(DEER_TOP.concat(l), DP)));
  const SQ = { O: '#cc672c', o: '#8f4218', L: '#f2cc92', K: '#1a1218' };
  const SQ_TOP = ['.OO......', 'OOOO.....', 'OOoO..O..', '.OOo.OOO.', '..OoOOKOO', '..oOOLOO.', '...OOLL..'];
  S.squirrel = [both(map(SQ_TOP.concat(['...o.o...']), SQ)), both(map(SQ_TOP.concat(['..o...o..']), SQ))];

  // ---------- The forest folk: small, round, bear-like, leaf-hooded, armed with bows ----------
  const FP = { h: '#2f6a2a', H: '#4f8a3a', L: '#6aa84a', F: '#8a5a34', f: '#6b4526', M: '#e0b88a', K: '#1a1218', W: '#ffffff', B: '#d0a070', D: '#4a2f1a' };
  const FOLK = [
    '..h......h..', '.hHh....hHh.', '.hHHHHHHHHh.', 'hHLHHHHHHLHh', 'hHFFFFFFFFHh', 'hFMKKMMKKMFh', 'hFMKWMMKWMFh',
    '.FMMMffMMMF.', '.fFMMMMMMFf.', '.fFFFFFFFFf.', 'fFFBBBBBBFFf', 'fFFBBBBBBFFf', '.fFFFFFFFFf.'];
  const FOLK_FEET = [['..DD....DD..'], ['.DD......DD.'], ['...DD..DD...']];
  // The bow, held out front; drawn back (with an arrow) when aiming.
  const bow = drawn => x => {
    pts(x, [[12, 3], [13, 4], [14, 5], [14, 6], [14, 7], [14, 8], [14, 9], [13, 10], [12, 11]], '#a8743a');
    pts(x, drawn ? [[12, 4], [11, 5], [10, 6], [10, 7], [11, 8], [12, 9], [12, 10]] : [[12, 4], [12, 5], [12, 6], [12, 7], [12, 8], [12, 9], [12, 10]], '#e8e0d0');
    if (drawn) { R(x, 10, 7, 6, 1, '#8a5a34'); R(x, 15, 7, 1, 1, '#c8ccd4'); R(x, 9, 6, 1, 1, '#ffffff'); R(x, 9, 8, 1, 1, '#ffffff'); }
    R(x, 11, 7, 1, 1, '#8a5a34'); // paw on the bow
  };
  const folk = (feet, drawn) => {
    const c = art(FOLK.concat(FOLK_FEET[feet]), FP, 0, 16, 14);
    bow(drawn)(c.getContext('2d'));
    return both(outline(c));
  };
  S.native = [folk(1, false), folk(2, false)];
  S.nativeAim = folk(0, true);

  // Their huts: domes of woven branches and leaves, deep in the forest.
  S.hut = (function () {
    const b = new Buf(26, 22), P = ['#3a2614', '#5a3a20', '#7a5230', '#94683e', '#b08452'].map(rgb), G2 = ['#2f6a2a', '#4f8a3a', '#6aa84a'].map(rgb);
    shadow(b, 14, 19, 12, 2.5, 0.35);
    const own = new Int8Array(26 * 22).fill(-1);
    for (let y = 3; y < 20; y++) for (let x = 2; x < 24; x++) {
      const dx = (x + 0.5 - 13) / 11, dy = (y + 0.5 - 19) / 16;
      if (dx * dx + dy * dy > 1) continue;
      own[y * 26 + x] = 0;
      const lam = Math.max(0, -dx * 0.6 - dy * 0.5 + 0.3), weave = ((x + y * 2) % 5 === 0 || (x * 2 - y + 40) % 6 === 0) ? -0.2 : 0;
      let col = P[1 + Math.max(0, Math.min(3, Math.floor((lam + weave) * 3.2 + hash(x, y, 4) * 0.6)))];
      if (dy < -0.55 && hash(x >> 1, y >> 1, 9) < 0.7) col = G2[Math.min(2, Math.floor(lam * 3))]; // leafy thatch on top
      b.set(x, y, col);
    }
    for (let y = 12; y < 20; y++) for (let x = 10; x < 17; x++) { const dx = (x + 0.5 - 13.5) / 3.5, dy = (y + 0.5 - 19) / 7; if (dx * dx + dy * dy <= 1) b.set(x, y, P[0]); } // round door
    maskOutline(b, own, P[0]);
    b.set(13, 2, G2[2]); b.set(12, 1, G2[1]); b.set(14, 2, G2[1]);
    return b.canvas();
  })();
  S.decor.hut = [S.hut];

  // ---------- Icons that depend on the art above ----------
  I.jack = icon(x => x.drawImage(S.jack.axe.idle.r, 4, 0, 14, 14, -1, 0, 14, 14));
  I.stone = icon(x => x.drawImage(S.rocks[0], 0, 0, 22, 18, 0, 1, 12, 10));
})();
