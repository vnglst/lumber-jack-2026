// Dependency-free simulation harness. Rendering and sound are stubbed, gameplay is not.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const contexts = new WeakMap();

function game(seed = 42, arrive = true) {
  const store = new Map();
  const math = Object.create(Math);
  let now = 2000;
  const ctx = vm.createContext({
    console, Math: math,
    performance: { now: () => now += 2000 },
    localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    setInterval() {}, addEventListener() {}, document: { addEventListener() {} }
  });
  ctx.window = ctx;
  for (const name of ['util', 'lines', 'world', 'game', 'critters', 'discoveries', 'combat', 'ending', 'save']) {
    if (name === 'world') {
      ctx.LJ.sprites = {
        trees: [[{ ay: 64 }]], base: Array.from({ length: 4 }, () => ({ width: 48, height: 48 })),
        tower: { width: 32, height: 64, muzzle: { x: 16, y: 12 } },
        dcFrame: { width: 48 }, dcStage1: {}, dcStage2: {}, datacenter: {}, mixer: { l: {} }
      };
      ctx.LJ.spr = { rgb: hex => hex.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16)) };
    }
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + name + '.js'), 'utf8'), ctx);
  }
  const lj = ctx.LJ;
  math.random = lj.rng(seed + 123);
  contexts.set(lj, ctx);
  lj.Ground = function () {};
  lj.Ground.prototype = { mark() {}, flush() {}, renderAll() {} };
  lj.sfx = () => {};
  lj.voice = { say() {}, cue() {} };
  lj.ui = {
    toast() {}, follow() {}, lockOn() {}, levelUp() {}, gameOver() {}, introLine() {}, introQuiet() {},
    cineStart() {}, cineLine() {}, endScreen() {}, centerOn() {}, zoomTo() {}, zoom: () => 3, fitZoom: () => 0.5
  };
  lj.newGame(seed);
  if (arrive) until(lj, () => !lj.G.arrival, 180);
  return lj;
}

function step(lj, seconds) {
  for (let i = 0; i < Math.ceil(seconds / 0.05); i++) lj.update(0.05);
}

function until(lj, predicate, seconds = 60) {
  for (let i = 0; i < seconds / 0.05; i++) {
    if (predicate()) return;
    lj.update(0.05);
  }
  if (!predicate()) throw new Error('Simulation condition timed out after ' + seconds + ' seconds');
}

function finishConstruction(lj) {
  until(lj, () => !lj.G.buildings.some(b => !b.dead && b.construction), 60);
}

// Sets a unit down on a tile, the way the game stands units: mid-tile across, feet a little below the middle.
function put(u, tile, w) {
  u.tile = tile; u.x = (tile % w.W) * 16 + 8; u.y = ((tile / w.W) | 0) * 16 + 10;
}

module.exports = { game, step, until, finishConstruction, put, storage: lj => contexts.get(lj).localStorage };
