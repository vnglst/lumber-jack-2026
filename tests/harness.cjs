// Dependency-free simulation harness. Rendering and sound are stubbed, gameplay is not.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function game(seed = 42, arrive = true) {
  const ctx = vm.createContext({ console, Math });
  ctx.window = ctx;
  for (const name of ['util', 'lines', 'world', 'game', 'combat']) {
    if (name === 'world') {
      ctx.LJ.sprites = { trees: [[{ ay: 64 }]], base: Array.from({ length: 4 }, () => ({ width: 48, height: 48 })) };
      ctx.LJ.spr = { rgb: hex => hex.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16)) };
    }
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + name + '.js'), 'utf8'), ctx);
  }
  const lj = ctx.LJ;
  lj.Ground = function () {};
  lj.Ground.prototype = { mark() {}, flush() {}, renderAll() {} };
  lj.sfx = () => {};
  lj.voice = { say() {}, cue() {} };
  lj.ui = { toast() {}, follow() {}, levelUp() {}, gameOver() {} };
  lj.newGame(seed);
  if (arrive) until(lj, () => !lj.G.arrival, 30);
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

module.exports = { game, step, until };
