'use strict';
// Procedural pixel art. Every sprite is drawn in code onto a small canvas.
(function () {
  const S = (LJ.sprites = {});
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cx2 = c => c.getContext('2d');
  const OUT = '#1b1422';

  function art(rows, pal, ox, w, h) {
    const c = mk(w || rows[0].length, h || rows.length), x = cx2(c);
    rows.forEach((r, y) => {
      for (let i = 0; i < r.length; i++) {
        const p = pal[r[i]];
        if (p) { x.fillStyle = p; x.fillRect(i + (ox || 0), y, 1, 1); }
      }
    });
    return c;
  }

  // Adds a 1px dark outline around opaque pixels (returns a canvas 2px larger).
  function outline(src, col) {
    const w = src.width + 2, h = src.height + 2, c = mk(w, h), x = cx2(c);
    x.drawImage(src, 1, 1);
    const id = x.getImageData(0, 0, w, h), a = id.data, m = [];
    for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) {
      const i = (y * w + X) * 4;
      if (a[i + 3] > 200) continue;
      if ((X > 0 && a[i - 1] > 200) || (X < w - 1 && a[i + 7] > 200) ||
          (y > 0 && a[i - w * 4 + 3] > 200) || (y < h - 1 && a[i + w * 4 + 3] > 200)) m.push(i);
    }
    const n = parseInt((col || OUT).slice(1), 16);
    for (const i of m) { a[i] = n >> 16; a[i + 1] = (n >> 8) & 255; a[i + 2] = n & 255; a[i + 3] = 255; }
    x.putImageData(id, 0, 0);
    return c;
  }

  function flip(src) {
    const c = mk(src.width, src.height), x = cx2(c);
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  }
  const both = c => ({ r: c, l: flip(c) });

  function R(x, a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); }
  function disc(x, cx, cy, r, col) {
    x.fillStyle = col;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let X = Math.floor(cx - r); X <= Math.ceil(cx + r); X++) {
        const dx = X + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) x.fillRect(X, y, 1, 1);
      }
    }
  }
  function shadow(x, cx, cy, rx, ry) {
    x.fillStyle = 'rgba(8,24,16,0.3)';
    for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
      const k = 1 - (dy / ry) * (dy / ry);
      if (k <= 0) continue;
      const half = Math.round(rx * Math.sqrt(k));
      x.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
    }
  }

  // ---------- Trees ----------
  const PAL_OAK = { o: '#123a1c', s: ['#1f5a28', '#2f7a31', '#449a3a', '#6fbf4c'] };
  const PAL_YEL = { o: '#3b4712', s: ['#5d7d1f', '#86a22a', '#adc238', '#d6de57'] };
  const PAL_PINE = { o: '#0d2b21', s: ['#155038', '#1e6a45', '#2d8650', '#4ea65e'] };

  function paintMask(x, m, W, H, pal, seed, cx, cy, rad) {
    for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
      if (!m[y * W + X]) continue;
      const edge = !m[y * W + X - 1] || !m[y * W + X + 1] || !m[(y - 1) * W + X] || !m[(y + 1) * W + X];
      let col;
      if (edge) col = pal.o;
      else {
        const light = ((cx - X) * 0.45 + (cy - y) * 0.9) / rad;
        const v = light * 0.5 + 0.5 + (LJ.hash(X >> 1, y >> 1, seed) - 0.5) * 0.6;
        col = pal.s[v < 0.3 ? 0 : v < 0.55 ? 1 : v < 0.82 ? 2 : 3];
      }
      x.fillStyle = col; x.fillRect(X, y, 1, 1);
    }
  }

  function blobTree(seed, pal, trunk, sc) {
    const W = 30, H = 38, c = mk(W, H), x = cx2(c), r = LJ.rng(seed), m = new Uint8Array(W * H);
    const cx = 15, cy = 16 - (sc - 1) * 6;
    const bl = [[cx, cy, 7.5 * sc]];
    for (let i = 0; i < 6; i++) {
      const a = r() * 6.283, d = (3 + r() * 3.5) * sc;
      bl.push([cx + Math.cos(a) * d * 1.15, cy + Math.sin(a) * d * 0.85, (4 + r() * 2.6) * sc]);
    }
    for (let y = 1; y < H - 1; y++) for (let X = 1; X < W - 1; X++) for (const b of bl) {
      const dx = X - b[0], dy = y - b[1];
      if (dx * dx + dy * dy < b[2] * b[2]) { m[y * W + X] = 1; break; }
    }
    shadow(x, 15, 34, 9 * sc, 3);
    R(x, 13, Math.round(cy + 3), 4, 35 - Math.round(cy + 3), trunk[0]);
    R(x, 14, Math.round(cy + 3), 1, 35 - Math.round(cy + 3), trunk[1]);
    R(x, 12, 34, 6, 1, trunk[0]);
    paintMask(x, m, W, H, pal, seed, cx, cy, 10 * sc);
    return c;
  }

  function pine(seed, sc) {
    const W = 30, H = 38, c = mk(W, H), x = cx2(c), r = LJ.rng(seed), m = new Uint8Array(W * H);
    const h = Math.round(27 * sc), top = 31 - h, tiers = 3 + (r() < 0.5 ? 1 : 0);
    shadow(x, 15, 34, 7 * sc, 2.5);
    R(x, 14, 29, 3, 6, '#4a2f1a'); R(x, 14, 29, 1, 6, '#6b4526');
    for (let y = top; y <= 31; y++) {
      const t = (y - top) / h, tp = (t * tiers) % 1;
      const hw = 1 + t * 5.5 * sc + tp * 3.4 * sc;
      for (let X = Math.round(15 - hw); X <= Math.round(15 + hw); X++) m[y * W + X] = 1;
    }
    paintMask(x, m, W, H, PAL_PINE, seed, 17, top + h * 0.45, 12 * sc);
    return c;
  }

  S.trees = [[], [], []];
  for (let v = 0; v < 4; v++) {
    const sc = [1, 0.86, 1.08, 0.94][v];
    S.trees[0].push(pine(100 + v * 7, sc));
    S.trees[1].push(blobTree(200 + v * 13, PAL_OAK, ['#4a2f1a', '#6b4526'], sc));
    S.trees[2].push(blobTree(300 + v * 11, PAL_YEL, ['#8c8676', '#d8d4c4'], sc * 0.92));
  }

  // ---------- Rocks ----------
  function rock(seed) {
    const W = 20, H = 18, c = mk(W, H), x = cx2(c), r = LJ.rng(seed), m = new Uint8Array(W * H);
    const bl = [[10, 10, 6.5, 5], [5 + r() * 3, 11.5, 4, 3.5], [13 + r() * 2, 9 + r() * 2, 4.5, 4.2], [9 + r() * 3, 7 + r(), 4, 3.5]];
    for (let y = 1; y < 16; y++) for (let X = 1; X < W - 1; X++) for (const b of bl) {
      const dx = (X - b[0]) / b[2], dy = (y - b[1]) / b[3];
      if (dx * dx + dy * dy < 1) { m[y * W + X] = 1; break; }
    }
    shadow(x, 10, 15, 9, 2);
    const pal = ['#56555d', '#7b7a80', '#a09f9c', '#c6c4ba'];
    for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
      if (!m[y * W + X]) continue;
      const edge = !m[y * W + X - 1] || !m[y * W + X + 1] || !m[(y - 1) * W + X] || !m[(y + 1) * W + X];
      const v = ((10 - X) * 0.5 + (9 - y)) / 9 * 0.6 + 0.5 + (LJ.hash(X >> 1, y >> 1, seed) - 0.5) * 0.35;
      x.fillStyle = edge ? '#2c2a33' : pal[v < 0.3 ? 0 : v < 0.55 ? 1 : v < 0.8 ? 2 : 3];
      x.fillRect(X, y, 1, 1);
    }
    if (r() < 0.6) { R(x, 6 + (r() * 6 | 0), 5 + (r() * 2 | 0), 3, 1, '#5d8a3a'); }
    return c;
  }
  S.rocks = [rock(11), rock(23), rock(37), rock(51)];

  // ---------- People ----------
  const JP = { B: '#2f6fd8', b: '#1f4c9e', S: '#f2bd8e', K: '#2a1c1c', H: '#7a4520', R: '#d5392f', r: '#8f211e', P: '#3d4f7a', p: '#2b2019' };
  const BODY = [
    '....BBBB....', '...BBBBBB...', '...bBBBBBBB.', '...SSSSSS...', '...SSKSSK...', '...HHHHHH...',
    '....HHHH....', '..RRrRRrRR..', '.SRRrRRrRRS.', '.SRRRRRRRRS.', '...RrRRrR...'];
  const SP = { h: '#2a2019', S: '#f2bd8e', K: '#2a1c1c', G: '#343846', w: '#f4f4f4', T: '#c22d2d', D: '#23262f', P: '#23262f', p: '#111' };
  const SUIT = [
    '....hhhh....', '...hhhhhh...', '...hhhhhh...', '...SSSSSS...', '...SSKSSK...', '...SSSSSS...',
    '....SSSS....', '..GGwTTwGG..', '.SGGGTTGGGS.', '.SGGGTTGGGS.', '...GGGGGG...'];
  const LEGS = [
    ['...PPPPPP...', '...PP..PP...', '...PP..PP...', '...pp..pp...'],
    ['...PPPPPP...', '..PP....PP..', '..PP....PP..', '..pp....pp..'],
    ['...PPPPPP...', '....PPPP....', '....PPPP....', '....pppp....']];

  function person(body, pal, leg, overlay) {
    const rows = body.concat(LEGS[leg]);
    const c = art(rows, pal, 4, 20, 15);
    if (overlay) overlay(cx2(c));
    return both(outline(c));
  }
  const pts = (x, list, col) => { x.fillStyle = col; for (const p of list) x.fillRect(p[0], p[1], 1, 1); };
  const WOODC = '#a8743a', METAL = '#d5dbe2';
  const axeIdle = x => { pts(x, [[14, 9], [15, 8], [15, 7], [16, 6], [16, 5]], WOODC); pts(x, [[15, 3], [16, 3], [17, 3], [17, 4], [16, 4]], METAL); };
  const axeUp = x => { pts(x, [[14, 8], [15, 7], [15, 6], [16, 5], [16, 4], [17, 3], [17, 2]], WOODC); pts(x, [[16, 1], [17, 1], [18, 1], [18, 2], [18, 3]], METAL); };
  const axeDown = x => { pts(x, [[14, 9], [15, 9], [16, 9], [17, 9]], WOODC); pts(x, [[18, 8], [18, 9], [18, 10], [19, 9], [17, 8]], METAL); };
  const sawA = x => { R(x, 13, 8, 3, 3, '#e2731e'); R(x, 13, 7, 2, 1, '#3a2a20'); R(x, 16, 9, 3, 1, '#d5dbe2'); R(x, 16, 10, 3, 1, '#8c949e'); };
  const sawB = x => { R(x, 14, 8, 3, 3, '#e2731e'); R(x, 14, 7, 2, 1, '#3a2a20'); R(x, 17, 9, 3, 1, '#d5dbe2'); R(x, 17, 10, 3, 1, '#8c949e'); };
  const logOn = x => { R(x, 2, 6, 17, 3, '#a8703a'); R(x, 2, 6, 17, 1, '#c98f52'); R(x, 2, 6, 1, 3, '#ecd29a'); R(x, 18, 6, 1, 3, '#ecd29a'); };

  function jackSet(idleO, upO, downO) {
    const j = (leg, o) => person(BODY, JP, leg, o);
    return {
      idle: j(0, idleO), walk: [j(1, idleO), j(2, idleO)],
      chop: [j(0, upO), j(0, downO)],
      carry: [j(0, logOn), j(1, logOn), j(2, logOn)]
    };
  }
  S.jack = { axe: jackSet(axeIdle, axeUp, axeDown), saw: jackSet(sawA, sawA, sawB) };
  const brief = x => { R(x, 15, 10, 4, 3, '#6b4526'); R(x, 16, 9, 2, 1, '#3a2a20'); };
  S.suit = { idle: person(SUIT, SP, 0, brief), walk: [person(SUIT, SP, 1, brief), person(SUIT, SP, 2, brief)] };

  // Selection rings
  function ring(w, h) {
    const c = mk(w, h), x = cx2(c);
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * 6.283;
      x.fillStyle = i % 2 ? '#8dff6a' : '#3fd43a';
      x.fillRect(Math.round((w - 1) / 2 + Math.cos(a) * (w - 1) / 2), Math.round((h - 1) / 2 + Math.sin(a) * (h - 1) / 2), 1, 1);
    }
    return c;
  }
  S.ringS = ring(17, 8); S.ringL = ring(32, 12);

  // ---------- Vehicles ----------
  function wheel(x, cx, cy) { disc(x, cx, cy, 3, '#1d1d24'); disc(x, cx, cy, 1.2, '#8c8c96'); }
  function truck(full) {
    const c = mk(28, 17), x = cx2(c);
    R(x, 1, 9, 17, 3, '#7a5433'); R(x, 1, 5, 1, 5, '#4a321f'); R(x, 17, 5, 1, 5, '#4a321f');
    if (full) {
      R(x, 2, 4, 15, 2, '#b98148'); R(x, 2, 6, 15, 2, '#9a6732'); R(x, 2, 8, 15, 1, '#b98148');
      for (let i = 0; i < 3; i++) R(x, 2, 4 + i * 2, 1, 1, '#ecd29a');
    }
    R(x, 18, 3, 7, 9, '#d5392f'); R(x, 19, 4, 5, 4, '#bfe6f5'); R(x, 25, 8, 2, 4, '#b02a24');
    R(x, 18, 3, 7, 1, '#ef6a5a');
    R(x, 1, 12, 26, 2, '#33333b');
    wheel(x, 6, 14); wheel(x, 22, 14);
    return both(outline(c));
  }
  S.truck = { empty: truck(false), full: truck(true) };

  S.dozer = (function () {
    const c = mk(27, 18), x = cx2(c);
    R(x, 2, 13, 17, 4, '#26262e'); for (let i = 0; i < 6; i++) R(x, 3 + i * 3, 14, 1, 2, '#6a6a74');
    R(x, 3, 7, 14, 6, '#f0b820'); R(x, 3, 7, 14, 1, '#ffd95a');
    R(x, 5, 1, 8, 6, '#f0b820'); R(x, 6, 2, 6, 4, '#bfe6f5'); R(x, 5, 1, 8, 1, '#ffd95a');
    R(x, 15, 3, 1, 4, '#44444c');
    R(x, 17, 11, 5, 2, '#b8891a'); R(x, 22, 5, 3, 12, '#aab0b8'); R(x, 24, 5, 1, 12, '#d8dde2');
    return both(outline(c));
  })();

  S.harv = (function () {
    const c = mk(30, 20), x = cx2(c);
    R(x, 2, 8, 16, 7, '#3e8f3a'); R(x, 2, 8, 16, 1, '#63b85a');
    R(x, 8, 2, 8, 6, '#3e8f3a'); R(x, 9, 3, 6, 4, '#bfe6f5'); R(x, 8, 2, 8, 1, '#63b85a');
    pts(x, [[16, 6], [17, 5], [18, 5], [19, 4], [20, 4], [21, 3], [22, 3], [23, 3], [24, 4], [25, 5], [25, 6], [25, 7], [25, 8]], '#2a2a32');
    R(x, 23, 9, 5, 6, '#e2731e'); R(x, 23, 15, 5, 1, '#d5dbe2'); R(x, 24, 11, 3, 2, '#3a2a20');
    wheel(x, 5, 16); wheel(x, 11, 16); wheel(x, 17, 16);
    return both(outline(c));
  })();

  // ---------- Buildings ----------
  S.village = (function () {
    const c = mk(56, 62), x = cx2(c);
    R(x, 4, 57, 50, 4, 'rgba(8,24,16,0.3)');
    R(x, 6, 30, 44, 27, '#b9854a');
    for (let y = 33; y < 54; y += 4) R(x, 6, y, 44, 1, '#8f6235');
    R(x, 6, 30, 2, 27, '#7a5230'); R(x, 48, 30, 2, 27, '#7a5230');
    R(x, 6, 54, 44, 3, '#7d7a74'); for (let i = 0; i < 7; i++) R(x, 8 + i * 6, 55, 2, 1, '#5d5a55');
    R(x, 23, 41, 10, 13, '#4a2f1a'); R(x, 24, 42, 8, 12, '#74492a'); R(x, 30, 48, 1, 1, '#f2d16b');
    for (const wx of [10, 38]) {
      R(x, wx, 38, 8, 8, '#4a2f1a'); R(x, wx + 1, 39, 6, 6, '#ffd76a');
      R(x, wx + 4, 39, 1, 6, '#4a2f1a'); R(x, wx + 1, 42, 6, 1, '#4a2f1a');
    }
    for (let y = 6; y < 32; y++) {
      const inset = Math.max(0, Math.round((14 - (y - 6)) * 0.5));
      for (let X = 2 + inset; X < 54 - inset; X++) {
        const row = (y - 6) >> 2, k = (X + row * 3) % 6;
        x.fillStyle = ((y - 6) & 3) === 3 ? '#7f2318' : k === 0 ? '#9c2d1f' : row % 2 ? '#c9442e' : '#d9553a';
        x.fillRect(X, y, 1, 1);
      }
    }
    R(x, 9, 5, 38, 2, '#ee8560'); R(x, 2, 32, 52, 2, '#5a1711');
    R(x, 39, 0, 7, 11, '#8d8a86'); R(x, 39, 0, 7, 2, '#5f5c59'); R(x, 40, 5, 2, 1, '#6f6c69'); R(x, 43, 8, 2, 1, '#6f6c69');
    R(x, 25, 34, 6, 6, '#2f6fd8'); pts(x, [[26, 35], [29, 35], [27, 36], [28, 36], [27, 37], [28, 37], [26, 38], [29, 38]], '#fff');
    disc(x, 46, 51, 3.5, '#c8ced6'); disc(x, 46, 51, 1, '#55555f');
    return outline(c);
  })();

  function logPile(x, ox, oy) {
    const rows = [[5, 0], [4, 2.5], [3, 5]];
    rows.forEach((rw, ri) => {
      for (let i = 0; i < rw[0]; i++) {
        const cx = ox + rw[1] + i * 5 + 2.5, cy = oy - ri * 4.3;
        disc(x, cx, cy, 2.6, '#7a4d26'); disc(x, cx, cy, 1.8, '#e6c88a'); x.fillStyle = '#b98d52'; x.fillRect(Math.floor(cx), Math.floor(cy), 1, 1);
      }
    });
  }
  S.depot = (function () {
    const c = mk(34, 30), x = cx2(c);
    R(x, 2, 26, 30, 3, 'rgba(8,24,16,0.3)');
    R(x, 2, 8, 30, 19, '#8a6a42'); R(x, 3, 9, 28, 17, '#a5814f');
    logPile(x, 4, 22);
    for (const px of [1, 31]) { R(x, px, 12, 2, 15, '#5c3a1f'); }
    R(x, 1, 18, 3, 1, '#7a5230'); R(x, 30, 18, 3, 1, '#7a5230');
    R(x, 14, 2, 1, 8, '#5c3a1f'); R(x, 15, 2, 6, 4, '#f0b820'); R(x, 15, 2, 6, 1, '#ffd95a');
    return outline(c);
  })();

  S.camp = (function () {
    const c = mk(34, 30), x = cx2(c);
    R(x, 3, 26, 24, 3, 'rgba(8,24,16,0.3)');
    for (let y = 4; y < 26; y++) {
      const half = Math.round((y - 4) * 0.6) + 1;
      R(x, 14 - half, y, half, 1, '#eadbb0'); R(x, 14, y, half, 1, '#c9b27c');
    }
    for (let y = 14; y < 26; y++) { const half = Math.round((y - 14) * 0.3) + 1; R(x, 14 - half, y, half * 2, 1, '#3a2a20'); }
    R(x, 13, 2, 2, 3, '#5c3a1f');
    R(x, 26, 24, 6, 2, '#5c3a1f'); R(x, 28, 21, 2, 3, '#ff8a2a'); R(x, 28, 20, 1, 2, '#ffd84a'); R(x, 29, 22, 1, 1, '#ffd84a');
    return outline(c);
  })();

  S.sign = (function () {
    const c = mk(14, 16), x = cx2(c);
    R(x, 6, 7, 2, 9, '#5c3a1f'); R(x, 1, 1, 12, 7, '#c99a5b'); R(x, 1, 1, 12, 1, '#e3bb7c');
    pts(x, [[3, 4], [4, 3], [4, 5], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [5, 2], [5, 6]], '#4a2f1a');
    return outline(c);
  })();

  // ---------- Icons (12x12) ----------
  const icon = fn => { const c = mk(12, 12); fn(cx2(c)); return c; };
  const I = (S.icons = {});
  I.coin = icon(x => { disc(x, 6, 6, 5.5, '#b9820f'); disc(x, 6, 6, 4.5, '#ffd84a'); R(x, 5, 3, 2, 6, '#d39a17'); R(x, 4, 4, 1, 1, '#fff3b0'); });
  I.log = icon(x => { R(x, 1, 3, 9, 6, '#a8703a'); R(x, 1, 3, 9, 1, '#c98f52'); R(x, 1, 8, 9, 1, '#7a4d26'); disc(x, 9.5, 6, 3, '#7a4d26'); disc(x, 9.5, 6, 2.2, '#ecd29a'); R(x, 9, 6, 1, 1, '#b98d52'); });
  I.plank = icon(x => { R(x, 0, 2, 10, 3, '#f0d59a'); R(x, 0, 5, 10, 1, '#b98d52'); R(x, 2, 6, 10, 3, '#e2c080'); R(x, 2, 9, 10, 1, '#a87c44'); R(x, 10, 2, 1, 4, '#c9a468'); });
  I.stone = icon(x => { x.drawImage(S.rocks[0], 1, 0, 18, 16, 0, 0, 12, 11); });
  I.jack = icon(x => { x.drawImage(S.jack.axe.idle.r, 4, 0, 14, 12, -1, 0, 14, 12); });
  I.axe = icon(x => { for (let i = 0; i < 8; i++) R(x, 2 + i, 10 - i, 2, 1, WOODC); R(x, 6, 1, 5, 3, METAL); R(x, 8, 4, 3, 2, METAL); R(x, 10, 1, 1, 5, '#fff'); });
  I.chainsaw = icon(x => { R(x, 1, 5, 5, 4, '#e2731e'); R(x, 1, 3, 4, 2, '#3a2a20'); R(x, 6, 6, 6, 1, '#d5dbe2'); R(x, 6, 7, 6, 1, '#8c949e'); R(x, 2, 6, 2, 1, '#ffb066'); });
  I.boot = icon(x => { R(x, 3, 1, 4, 7, '#7a4520'); R(x, 3, 7, 7, 3, '#7a4520'); R(x, 3, 10, 8, 1, '#2b2019'); R(x, 3, 1, 4, 1, '#a8743a'); R(x, 4, 3, 2, 1, '#e6c88a'); R(x, 4, 5, 2, 1, '#e6c88a'); });
  I.bag = icon(x => { R(x, 2, 4, 8, 7, '#8a6a42'); R(x, 3, 3, 6, 1, '#8a6a42'); R(x, 4, 1, 4, 2, '#5c3a1f'); R(x, 5, 2, 2, 1, '#0000'); R(x, 2, 6, 8, 1, '#5c3a1f'); R(x, 5, 6, 2, 2, '#e6c88a'); });
  I.barrow = icon(x => { R(x, 2, 4, 7, 4, '#c8372d'); R(x, 3, 3, 5, 1, '#a8703a'); R(x, 8, 5, 4, 1, '#5c3a1f'); disc(x, 3.5, 9.5, 2, '#1d1d24'); R(x, 6, 8, 1, 3, '#5c3a1f'); });
  I.blade = icon(x => { disc(x, 6, 6, 5.5, '#8c949e'); disc(x, 6, 6, 4.3, '#d5dbe2'); disc(x, 6, 6, 1.2, '#55555f'); pts(x, [[6, 0], [11, 6], [6, 11], [0, 6], [2, 2], [9, 2], [2, 9], [9, 9]], '#55555f'); });
  I.clip = icon(x => { R(x, 2, 1, 8, 10, '#a8703a'); R(x, 3, 2, 6, 8, '#f4f4f4'); R(x, 4, 0, 4, 2, '#8c949e'); R(x, 4, 4, 4, 1, '#666'); R(x, 4, 6, 4, 1, '#666'); R(x, 4, 8, 3, 1, '#666'); });
  I.hat = icon(x => { R(x, 3, 3, 6, 4, '#f0b820'); R(x, 4, 2, 4, 1, '#ffd95a'); R(x, 1, 7, 10, 2, '#d39a17'); R(x, 5, 2, 2, 5, '#ffd95a'); });
  I.road = icon(x => { R(x, 0, 3, 12, 6, '#8d8a86'); R(x, 0, 3, 12, 1, '#5f5c59'); R(x, 0, 8, 12, 1, '#5f5c59'); R(x, 1, 6, 2, 1, '#f4f4f4'); R(x, 5, 6, 2, 1, '#f4f4f4'); R(x, 9, 6, 2, 1, '#f4f4f4'); });
  I.clock = icon(x => { disc(x, 6, 6, 5.5, '#4a2f1a'); disc(x, 6, 6, 4.5, '#f4f4f4'); R(x, 6, 3, 1, 4, '#222'); R(x, 6, 6, 3, 1, '#222'); });
  I.bunk = icon(x => { R(x, 1, 5, 10, 6, '#b9854a'); for (let i = 0; i < 5; i++) R(x, 1 + i, 4 - i + 1, 10 - i * 2, 1, '#c9442e'); R(x, 5, 7, 2, 4, '#4a2f1a'); R(x, 2, 7, 2, 2, '#ffd76a'); R(x, 8, 7, 2, 2, '#ffd76a'); });
  I.rifle = icon(x => { R(x, 0, 6, 5, 3, '#7a4520'); R(x, 4, 5, 8, 2, '#3a3a44'); R(x, 4, 5, 8, 1, '#8c949e'); R(x, 5, 7, 1, 2, '#3a3a44'); R(x, 0, 8, 2, 2, '#5c3a1f'); });
  LJ.spr = { mk, cx2, art, outline, flip, both, R, disc, shadow, pts, icon };
  I.truck = S.truck.full.r; I.dozer = S.dozer.r; I.harv = S.harv.r; I.village = S.village; I.depot = S.depot;
})();
