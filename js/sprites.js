'use strict';
// Procedural pixel art, part 1: drawing helpers, vehicles, buildings and icons.
// Every sprite is drawn in code onto a small canvas. Light always comes from the top-left.
(function () {
  const S = (LJ.sprites = {});
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cx2 = c => c.getContext('2d');
  const OUT = '#1b1422';

  function art(rows, pal, ox, w, h) {
    const c = mk(w || rows[0].length + (ox || 0), h || rows.length), x = cx2(c);
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
    if (src.ax !== undefined) { c.ax = src.width - src.ax; c.ay = src.ay; }
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
  // Translucent ground shadow; translucent pixels are never outlined.
  function shadow(x, cx, cy, rx, ry) {
    x.fillStyle = 'rgba(8,24,16,0.32)';
    for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
      const k = 1 - (dy / ry) * (dy / ry);
      if (k <= 0) continue;
      const half = Math.round(rx * Math.sqrt(k));
      x.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
    }
  }
  const pts = (x, list, col) => { x.fillStyle = col; for (const p of list) x.fillRect(p[0], p[1], 1, 1); };
  // A rectangle with a lit top-left edge and a shaded bottom-right edge.
  function box(x, a, b, w, h, base, hi, lo) {
    R(x, a, b, w, h, base); R(x, a, b, w, 1, hi); R(x, a, b, 1, h, hi); R(x, a, b + h - 1, w, 1, lo); R(x, a + w - 1, b + 1, 1, h - 1, lo);
  }
  const icon = fn => { const c = mk(12, 12); fn(cx2(c)); return c; };

  // ---------- Pixel buffer helpers for the shaded, noise-based art (used by art.js) ----------
  const rgb = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);
  const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  // Quantize a 0..1 shade to one of `n` steps, with ordered dithering at the boundaries.
  const step = (v, n, x, y, amt) => Math.max(0, Math.min(n - 1, Math.floor(v * n + (dith(x, y) - 0.5) * (amt === undefined ? 0.9 : amt))));
  const LIGHT = (() => { const v = [-0.5, -0.7, 0.55], n = Math.hypot(...v); return v.map(c => c / n); })();
  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
    set(x, y, c, a) {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const o = (y * this.w + x) * 4, d = this.d;
      if (a === undefined || a >= 1) { d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; return; }
      const k = d[o + 3] / 255, na = a + k * (1 - a);
      for (let i = 0; i < 3; i++) d[o + i] = (c[i] * a + d[o + i] * k * (1 - a)) / na;
      d[o + 3] = na * 255;
    }
    canvas() { const c = mk(this.w, this.h); c.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return c; }
  }
  LJ.spr = { mk, cx2, art, outline, flip, both, R, disc, shadow, pts, box, icon, rgb, dith, step, LIGHT, Buf };

  // ---------- Selection rings ----------
  function ring(w, h) {
    const c = mk(w, h), x = cx2(c);
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * 6.283;
      x.fillStyle = i % 2 ? '#8dff6a' : '#3fd43a';
      x.fillRect(Math.round((w - 1) / 2 + Math.cos(a) * (w - 1) / 2), Math.round((h - 1) / 2 + Math.sin(a) * (h - 1) / 2), 1, 1);
    }
    return c;
  }
  S.ringS = ring(19, 8); S.ringL = ring(34, 12);

  // ---------- Vehicles ----------
  function wheel(x, cx, cy, r) {
    disc(x, cx, cy, r, '#18181e'); disc(x, cx, cy, r - 1, '#33333c'); disc(x, cx, cy, r - 1.8, '#a4a8b2'); disc(x, cx, cy, 0.9, '#4a4a55');
    R(x, Math.round(cx - r * 0.5), Math.round(cy - r * 0.5), 1, 1, '#d8dce2');
  }
  function logSide(x, x0, y, len) {
    R(x, x0, y, len, 3, '#9a6332'); R(x, x0, y, len, 1, '#c48a4e'); R(x, x0, y + 2, len, 1, '#6e4220');
    R(x, x0, y, 1, 3, '#e8c88c'); R(x, x0, y + 1, 1, 1, '#b98d52');
    for (let i = x0 + 3; i < x0 + len - 1; i += 5) R(x, i, y + 1, 2, 1, '#7d4c26');
  }
  function glass(x, a, b, w, h) {
    R(x, a, b, w, h, '#8fcbe6'); R(x, a + w - 1, b, 1, h, '#5a9cc0'); R(x, a, b + h - 1, w, 1, '#5a9cc0');
    R(x, a + 1, b, 1, 1, '#eaf7fd'); R(x, a + 2, b + 1, 1, 1, '#eaf7fd'); R(x, a + 1, b + 1, 1, 1, '#c8e8f6');
  }
  function truck(full) {
    const c = mk(36, 22), x = cx2(c);
    shadow(x, 19, 19, 17, 2.5);
    R(x, 2, 14, 31, 2, '#26262c');
    box(x, 2, 11, 20, 3, '#7a5433', '#9a7044', '#4f3520');
    for (let i = 5; i < 21; i += 4) R(x, i, 12, 1, 2, '#5f4128');
    R(x, 2, 6, 1, 5, '#4f3520'); R(x, 21, 6, 1, 5, '#4f3520');
    if (full) { logSide(x, 3, 8, 18); logSide(x, 3, 5, 18); logSide(x, 5, 2, 14); }
    box(x, 22, 4, 10, 10, '#d5392f', '#f06a58', '#9e2620');
    box(x, 31, 8, 4, 6, '#c3322a', '#f06a58', '#9e2620');
    glass(x, 24, 5, 6, 4);
    R(x, 23, 10, 1, 3, '#9e2620'); R(x, 25, 10, 2, 1, '#2a1a1a');
    R(x, 34, 10, 1, 1, '#ffe27a'); R(x, 31, 14, 4, 1, '#9a9ea8');
    R(x, 22, 0, 1, 4, '#6a6a74'); R(x, 22, 0, 1, 1, '#a4a8b2');
    wheel(x, 7, 17, 3.5); wheel(x, 14, 17, 3.5); wheel(x, 28, 17, 3.5);
    return both(outline(c));
  }
  S.truck = { empty: truck(false), full: truck(true) };

  S.dozer = (function () {
    const c = mk(34, 24), x = cx2(c);
    shadow(x, 17, 21, 16, 2.5);
    R(x, 3, 14, 19, 1, '#2a2a31'); R(x, 2, 15, 21, 6, '#2a2a31'); R(x, 3, 21, 19, 1, '#2a2a31');
    for (let i = 0; i < 7; i++) { R(x, 3 + i * 3, 14, 2, 1, '#5a5a64'); R(x, 3 + i * 3, 21, 2, 1, '#5a5a64'); }
    for (const rx of [5, 10, 15, 20]) { disc(x, rx, 18, 1.9, '#6a6a74'); R(x, rx - 1, 17, 1, 1, '#a4a8b2'); }
    box(x, 3, 9, 17, 6, '#f2b81e', '#ffe066', '#b8860f'); R(x, 4, 11, 15, 1, '#d99f14');
    box(x, 5, 1, 10, 9, '#f2b81e', '#ffe066', '#b8860f');
    glass(x, 6, 2, 8, 5); R(x, 10, 2, 1, 5, '#2a2a31');
    R(x, 17, 4, 1, 5, '#55555f'); R(x, 17, 3, 1, 1, '#2a2a31');
    R(x, 19, 12, 6, 2, '#b8860f'); R(x, 19, 12, 6, 1, '#d99f14');
    box(x, 25, 6, 4, 15, '#a8adb6', '#e2e6ea', '#6f747c');
    R(x, 28, 7, 1, 13, '#d8dde2'); R(x, 25, 20, 5, 1, '#55555f');
    R(x, 9, 0, 2, 1, '#ff9a2a');
    return both(outline(c));
  })();

  S.harv = (function () {
    const c = mk(38, 26), x = cx2(c);
    shadow(x, 18, 23, 17, 2.5);
    box(x, 2, 11, 20, 7, '#3e8f3a', '#6cbf5a', '#25602a'); R(x, 3, 14, 18, 1, '#2f7530');
    box(x, 9, 3, 10, 9, '#3e8f3a', '#6cbf5a', '#25602a'); glass(x, 10, 4, 8, 5);
    R(x, 3, 7, 5, 4, '#2f7530'); R(x, 3, 7, 5, 1, '#6cbf5a'); R(x, 5, 3, 1, 4, '#55555f');
    pts(x, [[19, 9], [20, 8], [21, 7], [22, 6], [23, 5], [24, 4], [25, 4], [26, 4], [27, 4], [28, 5], [29, 6], [30, 7], [30, 8], [30, 9]], '#ffb21a');
    pts(x, [[19, 10], [20, 9], [21, 8], [22, 7], [23, 6], [24, 5], [25, 5], [26, 5], [27, 5], [28, 6], [29, 7], [29, 8], [29, 9]], '#c7820f');
    box(x, 27, 10, 6, 7, '#e2731e', '#ff9e4a', '#a84f12');
    R(x, 33, 11, 2, 5, '#d5dbe2'); R(x, 34, 11, 1, 5, '#8c949e'); R(x, 28, 12, 3, 2, '#3a2a20');
    wheel(x, 6, 20, 4); wheel(x, 13, 20, 4); wheel(x, 20, 20, 4);
    return both(outline(c));
  })();

  // ---------- Buildings ----------
  // Outlines a building sprite and records where its chimney (or fire) smokes, in sprite pixels.
  const outlined = (c, smoke) => { const o = outline(c); o.smoke = smoke; return o; };
  function stoneRow(x, a, b, w, h) {
    R(x, a, b, w, h, '#6a6760');
    for (let y = b; y < b + h; y += 2) {
      for (let i = a + ((y >> 1) & 1) * 3; i < a + w; i += 6) {
        R(x, i, y, Math.min(5, a + w - i), 1, ((i + y) % 3) ? '#9a978f' : '#86837b');
      }
    }
  }
  function roof(x, x0, x1, y0, y1, ridgeInset) {
    for (let y = y0; y < y1; y++) {
      const inset = Math.max(0, Math.round((ridgeInset - (y - y0)) * 0.55));
      const a = x0 + inset, b = x1 - inset, row = (y - y0) >> 2, ry = (y - y0) & 3;
      for (let X = a; X < b; X++) {
        const t = (X - a) / (b - a), k = (X + (row & 1) * 3) % 6;
        let col = t < 0.45 ? (row % 2 ? '#d9553a' : '#e0613f') : '#bf432d';
        if (ry === 3) col = t < 0.45 ? '#8f2a1c' : '#7a2218';
        else if (k === 0) col = '#9c2d1f';
        else if (ry === 0 && t < 0.5) col = '#ee8560';
        R(x, X, y, 1, 1, col);
      }
    }
  }
  function windowLit(x, a, b) {
    R(x, a - 2, b, 2, 8, '#3f6f3a'); R(x, a + 7, b, 2, 8, '#3f6f3a'); R(x, a - 2, b, 2, 1, '#5e9a52'); R(x, a + 7, b, 2, 1, '#5e9a52');
    R(x, a, b, 7, 8, '#4a2f1a'); R(x, a + 1, b + 1, 5, 6, '#ffd76a'); R(x, a + 1, b + 1, 2, 2, '#fff1a8');
    R(x, a + 3, b + 1, 1, 6, '#4a2f1a'); R(x, a + 1, b + 4, 5, 1, '#4a2f1a'); R(x, a - 1, b + 8, 9, 1, '#7a5230');
  }
  S.village = (function () {
    const W = 62, H = 68, c = mk(W, H), x = cx2(c);
    shadow(x, 34, 63, 31, 4);
    stoneRow(x, 6, 55, 50, 7);
    R(x, 7, 34, 48, 21, '#e8d6aa'); R(x, 41, 34, 14, 21, '#cdb98c');
    for (let y = 36; y < 54; y += 3) for (let X = 8; X < 54; X += 7) R(x, X + ((y / 3) & 1) * 3, y, 1, 1, '#d6c294');
    R(x, 7, 34, 48, 2, '#5a3a20'); R(x, 7, 53, 48, 2, '#5a3a20');
    for (const bx of [7, 21, 40, 53]) R(x, bx, 34, 2, 21, '#5a3a20');
    for (let i = 0; i < 9; i++) { R(x, 42 + i, 36 + i * 2, 2, 2, '#5a3a20'); }
    windowLit(x, 11, 39); windowLit(x, 44, 39);
    R(x, 25, 42, 12, 13, '#4a2f1a'); R(x, 26, 43, 10, 12, '#7a4a26'); R(x, 27, 41, 8, 2, '#4a2f1a'); R(x, 28, 42, 6, 1, '#7a4a26');
    for (let X = 28; X < 36; X += 3) R(x, X, 43, 1, 12, '#5e3820');
    R(x, 26, 43, 1, 12, '#94603a'); R(x, 33, 49, 1, 1, '#e8c25a');
    R(x, 24, 55, 14, 2, '#9a978f'); R(x, 24, 55, 14, 1, '#b4b1aa');
    roof(x, 2, 60, 8, 36, 20);
    R(x, 2, 35, 58, 2, '#5a1711'); R(x, 13, 8, 36, 1, '#f39a74');
    box(x, 44, 0, 8, 14, '#8d8a86', '#b4b1aa', '#5f5c59');
    R(x, 45, 4, 3, 1, '#6f6c69'); R(x, 48, 8, 3, 1, '#6f6c69'); R(x, 43, 0, 10, 2, '#5f5c59'); R(x, 43, 0, 10, 1, '#8d8a86');
    // Banner with crossed axes on a pole
    R(x, 57, 26, 1, 30, '#5a3a20'); R(x, 57, 25, 1, 1, '#e8c25a');
    R(x, 50, 27, 7, 11, '#2f6fd8'); R(x, 50, 27, 7, 1, '#5e97ee'); R(x, 50, 27, 1, 11, '#5e97ee');
    pts(x, [[50, 38], [56, 38], [51, 37], [55, 37]], '#2f6fd8'); pts(x, [[53, 37], [53, 36]], '#1f4ea8');
    pts(x, [[51, 29], [52, 30], [53, 31], [54, 32], [55, 33], [55, 29], [54, 30], [52, 32], [51, 33]], '#ffffff');
    // Barrel and crate
    R(x, 1, 47, 6, 9, '#8a5a30'); R(x, 2, 47, 1, 9, '#b07a44'); R(x, 1, 49, 6, 1, '#4a4a52'); R(x, 1, 53, 6, 1, '#4a4a52'); R(x, 1, 47, 6, 1, '#5e3820');
    box(x, 0, 56, 7, 6, '#b9854a', '#d8a868', '#7a5230'); pts(x, [[1, 57], [2, 58], [3, 59], [4, 60], [5, 57], [4, 58], [2, 60]], '#7a5230');
    return outlined(c, { x: 49, y: 1 });
  })();

  function logEnd(x, cx, cy) {
    disc(x, cx, cy, 2.7, '#6e4220'); disc(x, cx, cy, 2, '#e3c286'); disc(x, cx, cy, 1, '#c79a5c'); R(x, Math.floor(cx) - 1, Math.floor(cy) - 1, 1, 1, '#f4dca6');
  }
  S.depot = (function () {
    const c = mk(38, 34), x = cx2(c);
    shadow(x, 20, 30, 18, 3);
    R(x, 2, 18, 34, 12, '#8a6a42'); R(x, 2, 18, 34, 1, '#a5814f');
    for (let X = 4; X < 36; X += 5) R(x, X, 19, 1, 11, '#7a5c38');
    const rows = [[6, 0], [5, 2.5], [4, 5], [3, 7.5]];
    rows.forEach((rw, ri) => { for (let i = 0; i < rw[0]; i++) logEnd(x, 6 + rw[1] + i * 5, 26 - ri * 4.4); });
    for (const px of [1, 35]) { box(x, px, 12, 2, 18, '#6b4526', '#8a5c34', '#4a2f1a'); }
    R(x, 1, 17, 36, 1, '#7a5230'); R(x, 1, 23, 2, 1, '#7a5230'); R(x, 35, 23, 2, 1, '#7a5230');
    R(x, 31, 1, 1, 11, '#5c3a1f'); R(x, 32, 1, 5, 4, '#f0b820'); R(x, 32, 1, 5, 1, '#ffd95a'); R(x, 36, 2, 1, 3, '#c48f12');
    return outline(c);
  })();

  S.camp = (function () {
    const c = mk(40, 34), x = cx2(c);
    shadow(x, 18, 30, 17, 3);
    for (let y = 4; y < 29; y++) {
      const half = Math.round((y - 4) * 0.58) + 1;
      R(x, 15 - half, y, half, 1, y % 5 === 0 ? '#dccb98' : '#eadbb0');
      R(x, 15, y, half, 1, y % 5 === 0 ? '#b49d68' : '#c9b27c');
    }
    for (let y = 15; y < 29; y++) { const half = Math.round((y - 15) * 0.32) + 1; R(x, 15 - half, y, half * 2, 1, '#2e2018'); }
    R(x, 14, 15, 1, 14, '#c9b27c'); R(x, 14, 2, 2, 3, '#5c3a1f');
    pts(x, [[2, 28], [3, 27], [28, 28], [27, 27]], '#5c3a1f');
    // Campfire with a ring of stones and a log seat
    for (const [a, b] of [[29, 29], [31, 30], [34, 30], [36, 29], [33, 28]]) R(x, a, b, 2, 1, '#8d8a86');
    R(x, 31, 28, 4, 1, '#5c3a1f'); R(x, 32, 24, 2, 4, '#ff8a2a'); R(x, 31, 26, 1, 2, '#ff8a2a'); R(x, 34, 25, 1, 3, '#ff8a2a');
    R(x, 32, 22, 1, 3, '#ffd84a'); R(x, 33, 25, 1, 2, '#ffd84a'); R(x, 32, 26, 1, 1, '#fff3b0');
    box(x, 26, 31, 12, 3, '#8a5a30', '#a8743a', '#5e3820'); R(x, 26, 31, 1, 3, '#e3c286');
    return outlined(c, { x: 34, y: 21 }); // smoke from the campfire
  })();

  S.sign = (function () {
    const c = mk(16, 20), x = cx2(c);
    shadow(x, 9, 18, 5, 1.5);
    box(x, 7, 8, 2, 11, '#6b4526', '#8a5c34', '#4a2f1a');
    box(x, 1, 1, 14, 8, '#c99a5b', '#e3bb7c', '#8f6a3a');
    pts(x, [[3, 4], [4, 3], [4, 5], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [5, 2], [5, 6]], '#4a2f1a');
    R(x, 12, 3, 2, 3, '#f0c040'); R(x, 12, 3, 1, 1, '#fff0a0');
    return outline(c);
  })();

  function door(x, a, b, w, h) {
    R(x, a, b, w, h, '#4a2f1a'); R(x, a + 1, b + 1, w - 2, h - 1, '#7a4a26');
    for (let X = a + 2; X < a + w - 1; X += 3) R(x, X, b + 1, 1, h - 1, '#5e3820');
    R(x, a + 1, b + 1, 1, h - 1, '#94603a'); R(x, a + w - 3, b + (h >> 1), 1, 1, '#e8c25a');
  }
  function banner(x, px, top) {
    R(x, px, top, 1, 30, '#5a3a20'); R(x, px, top - 1, 1, 1, '#e8c25a');
    R(x, px - 7, top + 1, 7, 11, '#2f6fd8'); R(x, px - 7, top + 1, 7, 1, '#5e97ee'); R(x, px - 7, top + 1, 1, 11, '#5e97ee');
    pts(x, [[px - 7, top + 12], [px - 1, top + 12], [px - 6, top + 11], [px - 2, top + 11]], '#2f6fd8');
    pts(x, [[px - 6, top + 3], [px - 5, top + 4], [px - 4, top + 5], [px - 3, top + 6], [px - 2, top + 7], [px - 2, top + 3], [px - 3, top + 4], [px - 5, top + 6], [px - 6, top + 7]], '#ffffff');
  }

  // Tier 2: a two-storey lodge with a stone ground floor.
  S.lodge = (function () {
    const W = 66, H = 84, c = mk(W, H), x = cx2(c);
    shadow(x, 36, 79, 32, 4);
    stoneRow(x, 5, 72, 56, 7);
    stoneRow(x, 7, 52, 52, 20); R(x, 46, 52, 13, 20, 'rgba(0,0,0,0.12)');
    windowLit(x, 12, 57); windowLit(x, 47, 57); door(x, 27, 57, 12, 15);
    R(x, 7, 32, 52, 20, '#e8d6aa'); R(x, 45, 32, 14, 20, '#cdb98c');
    R(x, 7, 32, 52, 2, '#5a3a20'); R(x, 7, 50, 52, 2, '#5a3a20');
    for (const bx of [7, 20, 32, 45, 57]) R(x, bx, 32, 2, 20, '#5a3a20');
    windowLit(x, 11, 37); windowLit(x, 23, 37); windowLit(x, 48, 37);
    roof(x, 1, 65, 6, 34, 22);
    R(x, 1, 33, 64, 2, '#5a1711'); R(x, 14, 6, 38, 1, '#f39a74');
    box(x, 47, 0, 8, 14, '#8d8a86', '#b4b1aa', '#5f5c59'); R(x, 46, 0, 10, 2, '#5f5c59'); R(x, 46, 0, 10, 1, '#8d8a86');
    banner(x, 63, 40);
    R(x, 0, 64, 6, 9, '#8a5a30'); R(x, 1, 64, 1, 9, '#b07a44'); R(x, 0, 66, 6, 1, '#4a4a52'); R(x, 0, 70, 6, 1, '#4a4a52');
    return outlined(c, { x: 52, y: 1 });
  })();

  // Tier 3: a stone town hall with a clock tower.
  S.hall = (function () {
    const W = 72, H = 94, c = mk(W, H), x = cx2(c);
    shadow(x, 38, 89, 34, 4);
    stoneRow(x, 3, 82, 66, 7);
    R(x, 4, 48, 64, 34, '#a9a49a'); R(x, 52, 48, 16, 34, '#8f8a80');
    for (let y = 50; y < 82; y += 4) for (let X = 4 + ((y >> 2) & 1) * 4; X < 68; X += 8) R(x, X, y, 7, 1, '#bdb8ad');
    for (let y = 52; y < 82; y += 4) R(x, 4, y, 64, 1, '#8a857b');
    for (const wx of [9, 20, 47, 58]) windowLit(x, wx, 56);
    for (const cx of [27, 43]) box(x, cx, 52, 3, 30, '#d8d3c6', '#f0ece2', '#a9a49a');
    door(x, 31, 62, 10, 20); R(x, 31, 60, 10, 2, '#6a655c');
    R(x, 28, 82, 16, 2, '#bdb8ad'); R(x, 26, 84, 20, 2, '#a9a49a');
    roof(x, 0, 72, 30, 50, 12);
    R(x, 0, 49, 72, 2, '#5a1711');
    // Clock tower
    box(x, 28, 14, 16, 36, '#b8b3a8', '#d8d3c6', '#8a857b');
    disc(x, 36, 26, 5.5, '#4a3a2a'); disc(x, 36, 26, 4.5, '#f4efe0'); R(x, 36, 23, 1, 4, '#222'); R(x, 36, 26, 3, 1, '#222');
    R(x, 31, 36, 2, 6, '#3a2a20'); R(x, 39, 36, 2, 6, '#3a2a20');
    for (let y = 2; y < 14; y++) { const h = Math.round((y - 2) * 0.75); R(x, 36 - h - 1, y, h + 1, 1, '#d9553a'); R(x, 36, y, h + 1, 1, '#bf432d'); }
    R(x, 35, 0, 2, 2, '#e8c25a');
    // Flags and a chimney
    banner(x, 70, 52); box(x, 8, 22, 7, 14, '#8d8a86', '#b4b1aa', '#5f5c59'); R(x, 7, 22, 9, 2, '#5f5c59');
    return outlined(c, { x: 12, y: 23 });
  })();

  S.bunk = (function () {
    const W = 38, H = 42, c = mk(W, H), x = cx2(c);
    shadow(x, 20, 38, 18, 3);
    stoneRow(x, 3, 34, 32, 4);
    R(x, 4, 20, 30, 14, '#e8d6aa'); R(x, 25, 20, 9, 14, '#cdb98c');
    R(x, 4, 20, 30, 2, '#5a3a20'); for (const bx of [4, 18, 32]) R(x, bx, 20, 2, 14, '#5a3a20');
    windowLit(x, 8, 23); door(x, 22, 24, 8, 10);
    roof(x, 1, 37, 4, 22, 10); R(x, 1, 21, 36, 2, '#5a1711');
    box(x, 28, 0, 5, 9, '#8d8a86', '#b4b1aa', '#5f5c59');
    return outlined(c, { x: 31, y: 1 });
  })();

  S.sawmill = (function () {
    const W = 54, H = 46, c = mk(W, H), x = cx2(c);
    shadow(x, 28, 42, 26, 3);
    R(x, 2, 34, 50, 6, '#8a6a42'); R(x, 2, 34, 50, 1, '#a5814f');
    // Sawdust heap and a stack of fresh planks
    for (let i = 0; i < 6; i++) R(x, 3 + i, 33 - Math.min(i, 5 - i), 8 - i * 2 > 0 ? 2 : 1, Math.min(i, 5 - i) + 1, '#e3c286');
    for (let i = 0; i < 4; i++) { R(x, 38, 31 - i * 2, 13, 2, i % 2 ? '#e2c080' : '#f0d59a'); R(x, 38, 32 - i * 2, 13, 1, '#a87c44'); }
    // Saw bench with a log and the big circular blade
    box(x, 10, 27, 26, 4, '#7a5433', '#9a7044', '#4f3520'); R(x, 12, 31, 2, 5, '#4f3520'); R(x, 32, 31, 2, 5, '#4f3520');
    R(x, 11, 23, 13, 4, '#9a6332'); R(x, 11, 23, 13, 1, '#c48a4e'); R(x, 11, 23, 1, 4, '#e8c88c');
    disc(x, 28, 23, 7, '#6f747c'); disc(x, 28, 23, 6, '#c8ced6'); disc(x, 28, 23, 2, '#55555f');
    pts(x, [[28, 15], [35, 23], [28, 31], [21, 23], [23, 18], [33, 18], [23, 28], [33, 28]], '#3a3a44');
    R(x, 26, 19, 2, 1, '#eef2f6');
    // Posts and roof
    for (const px of [3, 25, 48]) box(x, px, 12, 3, 23, '#6b4526', '#8a5c34', '#4a2f1a');
    roof(x, 0, 54, 2, 14, 0); R(x, 0, 13, 54, 2, '#5a1711');
    return outlined(c);
  })();

  S.tower = (function () {
    const W = 30, H = 60, c = mk(W, H), x = cx2(c);
    shadow(x, 16, 56, 13, 2.5);
    for (const lx of [5, 23]) box(x, lx, 22, 3, 34, '#6b4526', '#8a5c34', '#4a2f1a');
    for (let i = 0; i < 16; i++) { R(x, 7 + i, 25 + i * 2, 2, 1, '#5a3a20'); R(x, 22 - i, 25 + i * 2, 2, 1, '#5a3a20'); }
    for (let y = 26; y < 55; y += 4) R(x, 13, y, 5, 1, '#8a5c34');
    R(x, 13, 24, 1, 32, '#4a2f1a'); R(x, 17, 24, 1, 32, '#4a2f1a');
    box(x, 2, 18, 26, 5, '#8a5a30', '#a8743a', '#5e3820');
    R(x, 3, 13, 1, 5, '#5a3a20'); R(x, 26, 13, 1, 5, '#5a3a20'); R(x, 3, 14, 24, 1, '#7a5230');
    for (let y = 2; y < 13; y++) { const h = Math.round((y - 2) * 1.25) + 1; R(x, 15 - h, y, h, 1, '#d9553a'); R(x, 15, y, h, 1, '#bf432d'); }
    R(x, 1, 12, 28, 2, '#7f2318');
    R(x, 15, 0, 1, 3, '#5a3a20'); R(x, 16, 0, 4, 2, '#2f6fd8');
    // Laser turret on the platform
    box(x, 10, 14, 10, 5, '#5f636c', '#9a9ea8', '#3a3d46'); R(x, 20, 15, 6, 2, '#3a3d46'); R(x, 25, 15, 2, 2, '#7ff0ff'); R(x, 12, 15, 3, 1, '#7ff0ff');
    const o = outlined(c);
    o.muzzle = { x: 26, y: 17 }; // where the laser turret's bolts come out (sprite pixels, after the outline)
    return o;
  })();

  // Palisade: sharpened stakes lashed together. One per tile; neighbours line up into a wall.
  function palisade(broken) {
    const c = mk(16, 24), x = cx2(c);
    shadow(x, 9, 22, 8, 1.5);
    for (let i = 0; i < 4; i++) {
      const sx = i * 4, top = broken && (i === 1 || i === 2) ? 12 + i * 2 : 3 + (i % 2);
      R(x, sx, top + 2, 4, 22 - top - 2, i % 2 ? '#7a4d26' : '#8a5a30'); R(x, sx, top + 2, 1, 22 - top - 2, '#b07a44');
      R(x, sx + 1, top, 2, 2, '#9a6838'); R(x, sx + 1, top - 1, 1, 1, '#c48a4e');
    }
    if (broken) { R(x, 5, 18, 3, 2, '#c48a4e'); R(x, 9, 20, 2, 1, '#c48a4e'); }
    R(x, 0, 10, 16, 1, '#4a2f1a'); R(x, 0, 17, 16, 1, '#4a2f1a');
    return outline(c);
  }
  S.wall = palisade(false); S.wallBroken = palisade(true);

  // The settlement's main building, by tier: tent, cabin, lodge, town hall.
  S.base = [S.camp, S.village, S.lodge, S.hall];

  // ---------- Icons (12x12) ----------
  const I = (S.icons = {});
  I.coin = icon(x => { disc(x, 6, 6, 5.5, '#b9820f'); disc(x, 6, 6, 4.5, '#ffd84a'); R(x, 5, 3, 2, 6, '#d39a17'); R(x, 4, 4, 1, 1, '#fff3b0'); });
  I.log = icon(x => { R(x, 1, 3, 9, 6, '#a8703a'); R(x, 1, 3, 9, 1, '#c98f52'); R(x, 1, 8, 9, 1, '#7a4d26'); disc(x, 9.5, 6, 3, '#7a4d26'); disc(x, 9.5, 6, 2.2, '#ecd29a'); R(x, 9, 6, 1, 1, '#b98d52'); });
  I.plank = icon(x => { R(x, 0, 2, 10, 3, '#f0d59a'); R(x, 0, 5, 10, 1, '#b98d52'); R(x, 2, 6, 10, 3, '#e2c080'); R(x, 2, 9, 10, 1, '#a87c44'); R(x, 10, 2, 1, 4, '#c9a468'); });
  I.axe = icon(x => { for (let i = 0; i < 8; i++) R(x, 2 + i, 10 - i, 2, 1, '#a8743a'); R(x, 6, 1, 5, 3, '#d5dbe2'); R(x, 8, 4, 3, 2, '#d5dbe2'); R(x, 10, 1, 1, 5, '#fff'); });
  I.chainsaw = icon(x => { R(x, 1, 5, 5, 4, '#e2731e'); R(x, 1, 3, 4, 2, '#3a2a20'); R(x, 6, 6, 6, 1, '#d5dbe2'); R(x, 6, 7, 6, 1, '#8c949e'); R(x, 2, 6, 2, 1, '#ffb066'); });
  I.boot = icon(x => { R(x, 3, 1, 4, 7, '#7a4520'); R(x, 3, 7, 7, 3, '#7a4520'); R(x, 3, 10, 8, 1, '#2b2019'); R(x, 3, 1, 4, 1, '#a8743a'); R(x, 4, 3, 2, 1, '#e6c88a'); R(x, 4, 5, 2, 1, '#e6c88a'); });
  I.bag = icon(x => { R(x, 2, 4, 8, 7, '#8a6a42'); R(x, 3, 3, 6, 1, '#8a6a42'); R(x, 4, 1, 4, 2, '#5c3a1f'); R(x, 2, 6, 8, 1, '#5c3a1f'); R(x, 5, 6, 2, 2, '#e6c88a'); });
  I.barrow = icon(x => { R(x, 2, 4, 7, 4, '#c8372d'); R(x, 3, 3, 5, 1, '#a8703a'); R(x, 8, 5, 4, 1, '#5c3a1f'); disc(x, 3.5, 9.5, 2, '#1d1d24'); R(x, 6, 8, 1, 3, '#5c3a1f'); });
  I.blade = icon(x => { disc(x, 6, 6, 5.5, '#8c949e'); disc(x, 6, 6, 4.3, '#d5dbe2'); disc(x, 6, 6, 1.2, '#55555f'); pts(x, [[6, 0], [11, 6], [6, 11], [0, 6], [2, 2], [9, 2], [2, 9], [9, 9]], '#55555f'); });
  I.clip = icon(x => { R(x, 2, 1, 8, 10, '#a8703a'); R(x, 3, 2, 6, 8, '#f4f4f4'); R(x, 4, 0, 4, 2, '#8c949e'); R(x, 4, 4, 4, 1, '#666'); R(x, 4, 6, 4, 1, '#666'); R(x, 4, 8, 3, 1, '#666'); });
  I.hat = icon(x => { R(x, 3, 3, 6, 4, '#f0b820'); R(x, 4, 2, 4, 1, '#ffd95a'); R(x, 1, 7, 10, 2, '#d39a17'); R(x, 5, 2, 2, 5, '#ffd95a'); });
  I.clock = icon(x => { disc(x, 6, 6, 5.5, '#4a2f1a'); disc(x, 6, 6, 4.5, '#f4f4f4'); R(x, 6, 3, 1, 4, '#222'); R(x, 6, 6, 3, 1, '#222'); });
  I.bunk = icon(x => { R(x, 1, 5, 10, 6, '#b9854a'); for (let i = 0; i < 5; i++) R(x, 1 + i, 4 - i + 1, 10 - i * 2, 1, '#c9442e'); R(x, 5, 7, 2, 4, '#4a2f1a'); R(x, 2, 7, 2, 2, '#ffd76a'); R(x, 8, 7, 2, 2, '#ffd76a'); });
  I.rifle = icon(x => { // laser pistol
    R(x, 1, 3, 8, 4, '#55596a'); R(x, 1, 3, 8, 1, '#9aa0b0'); R(x, 9, 4, 2, 2, '#3a3d46'); R(x, 11, 4, 1, 2, '#ff5a4a');
    R(x, 2, 7, 3, 4, '#3a3d46'); R(x, 2, 7, 1, 4, '#6a6e7c'); R(x, 4, 4, 3, 1, '#ff5a4a');
  });
  I.wall = icon(x => { for (let i = 0; i < 3; i++) { R(x, 1 + i * 4, 3, 3, 8, '#8a5a30'); R(x, 2 + i * 4, 1, 1, 2, '#8a5a30'); R(x, 1 + i * 4, 3, 1, 8, '#b07a44'); } R(x, 0, 5, 12, 1, '#4a2f1a'); R(x, 0, 9, 12, 1, '#4a2f1a'); });
  I.tower = S.tower;
  I.truck = S.truck.full.r; I.dozer = S.dozer.r; I.harv = S.harv.r; I.village = S.village; I.depot = S.depot;
})();
