const test = require('node:test');
const assert = require('node:assert/strict');
const { game, step } = require('./harness.cjs');

for (const kind of ['truck', 'shuttle']) {
  for (const [terrain, speed] of [['ROAD', 96], ['DIRT', 60], ['GRASS', 36]]) {
    test(kind + ' travels at the reduced ' + terrain.toLowerCase() + ' speed in both directions', () => {
      const lj = game(), g = lj.G, w = g.world;
      lj.cmd.stop(g.units);
      const truck = g.units.find(u => u.kind === 'truck'), start = (w.start.y + 3) * w.W + w.start.x;
      truck.kind = kind;
      for (let i = 0; i <= 12; i++) {
        w.obj[start + i] = w.bld[start + i] = 0;
        w.type[start + i] = lj.T[terrain];
      }
      truck.tile = start; truck.x = start % w.W * 16 + 8; truck.y = ((start / w.W) | 0) * 16 + 10;
      const x = truck.x;
      // Both truck jobs use normal movement. A shuttle establishes a route instead of a one-off move.
      lj.cmd.move([truck], start + 12);
      step(lj, 1);
      assert.ok(Math.abs(truck.x - x - speed) < 0.001);
      const turnaround = truck.x;
      lj.cmd.move([truck], start);
      step(lj, 0.5);
      assert.ok(Math.abs(turnaround - truck.x - speed / 2) < 0.001);
    });
  }
}
