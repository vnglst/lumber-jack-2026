'use strict';
// Global namespace + deterministic random/noise helpers.
const LJ = {};
window.LJ = LJ;

LJ.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Integer lattice hash -> [0,1)
LJ.hash = function (x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Smooth value noise
LJ.vnoise = function (x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const h = LJ.hash;
  const a = h(xi, yi, s), b = h(xi + 1, yi, s), c = h(xi, yi + 1, s), d = h(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

LJ.fbm = function (x, y, s, oct) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    v += a * LJ.vnoise(x * f, y * f, s + i * 17);
    n += a; a *= 0.5; f *= 2;
  }
  return v / n;
};

LJ.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
LJ.pick = arr => arr[(Math.random() * arr.length) | 0];
