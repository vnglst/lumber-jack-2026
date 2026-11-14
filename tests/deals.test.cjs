const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { game, step, finishConstruction } = require('./harness.cjs');

function market() {
  const lj = game(), g = lj.G, sounds = [];
  lj.cmd.stop(g.units);
  g.money = 10000; g.wood = 100; g.level = 2; g.stockpile = true; g.animalCd = 1e9;
  lj.buy('base'); finishConstruction(lj);
  lj.sfx = name => sounds.push(name);
  g.order = null; g.orderCd = 0.05;
  return { lj, g, sounds };
}

test('a new wood offer chimes once, without repeating on ticks, acceptance or reload', () => {
  const { lj, g, sounds } = market();
  lj.update(0.05);
  assert.equal(g.order.kind, 'wood');
  assert.equal(g.order.state, 'offer');
  assert.deepEqual(sounds, ['deal']);
  step(lj, 2);
  lj.saveGame(); assert.ok(lj.loadGame()); lj.update(0.05);
  assert.deepEqual(sounds, ['deal']);
  lj.acceptOrder(true); step(lj, 1);
  assert.equal(g.order.state, 'active');
  assert.equal(sounds.filter(s => s === 'deal').length, 1);
});

test('lumber offers use the same alert; expiry and dismissal do not chime', () => {
  const { lj, g, sounds } = market();
  lj.buy('sawmill');
  let placed = false;
  for (let y = 1; y < g.world.H - 2 && !placed; y++) for (let x = 1; x < g.world.W - 3 && !placed; x++) {
    if (lj.canPlace(x, y)) placed = lj.tryPlace(x, y);
  }
  assert.ok(placed); finishConstruction(lj);
  sounds.length = 0;
  const kinds = new Set();
  for (let i = 0; i < 20; i++) {
    g.order = null; g.orderCd = 0.05;
    lj.update(0.05);
    kinds.add(g.order.kind);
    assert.equal(sounds.filter(s => s === 'deal').length, i + 1);
    lj.acceptOrder(false);
    assert.equal(sounds.filter(s => s === 'deal').length, i + 1);
  }
  assert.ok(kinds.has('lumber'));
  g.orderCd = 0.05; lj.update(0.05);
  const count = sounds.filter(s => s === 'deal').length;
  g.order.ttl = 0.01; lj.update(0.05);
  assert.equal(g.order, null);
  assert.equal(sounds.filter(s => s === 'deal').length, count);
});

test('the deal definition schedules audible rising tones through the normal muted sound engine', () => {
  const tones = [], ramps = [];
  const param = () => ({ value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { ramps.push(v); }, exponentialRampToValueAtTime() {} });
  class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createDynamicsCompressor() { return { connect() {} }; }
    createGain() { return { gain: param(), connect() {} }; }
    createOscillator() {
      const node = { frequency: param(), connect() {}, start(at) { tones.push({ freq: this.frequency.value, at }); }, stop() {} };
      return node;
    }
  }
  const ctx = vm.createContext({ window: { AudioContext }, performance: { now: () => 1000 } });
  vm.runInContext('var LJ = { clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };', ctx);
  for (const name of ['sfx-defs', 'sound']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + name + '.js'), 'utf8'), ctx);
  ctx.LJ.sfx('deal');
  assert.equal(tones.length, 0); // Not unlocked yet.
  ctx.LJ.audioInit(); ctx.LJ.toggleMute(); ctx.LJ.sfx('deal');
  assert.equal(tones.length, 0);
  ctx.LJ.toggleMute(); ctx.LJ.sfx('deal');
  assert.equal(tones.length, 4);
  assert.deepEqual(tones.slice(0, 3).map(t => t.freq), [659, 880, 1319]);
  assert.ok(tones[0].at < tones[1].at && tones[1].at < tones[2].at);
  assert.ok(ramps.every(v => v > 0));
});
