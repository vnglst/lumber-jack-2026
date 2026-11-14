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

for (const kind of ['truck', 'shuttle']) {
  for (const [terrain, speed] of [['ROAD', 96], ['BRIDGE', 96], ['DIRT', 60], ['GRAVEL', 60], ['GRASS', 36]]) {
    test(kind + ' has the same ' + terrain.toLowerCase() + ' speed horizontally, vertically and diagonally', () => {
      const lj = game(), g = lj.G, w = g.world;
      lj.cmd.stop(g.units);
      const truck = g.units.find(u => u.kind === 'truck');
      truck.kind = kind;
      const sx = w.start.x, sy = w.start.y + 3, start = sy * w.W + sx;
      for (let y = sy - 12; y <= sy + 12; y++) for (let x = sx - 12; x <= sx + 12; x++) {
        const n = y * w.W + x;
        w.obj[n] = w.bld[n] = w.wall[n] = 0;
        w.type[n] = lj.T[terrain];
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        lj.cmd.stop([truck]);
        truck.tile = start; truck.x = sx * 16 + 8; truck.y = sy * 16 + 10;
        const x = truck.x, y = truck.y;
        lj.cmd.move([truck], (sy + dy * 12) * w.W + sx + dx * 12);
        step(lj, 1);
        assert.ok(Math.abs(Math.hypot(truck.x - x, truck.y - y) - speed) < 0.001, 'direction ' + dx + ',' + dy);
        const component = speed / Math.hypot(dx, dy);
        assert.ok(Math.abs(truck.x - x - dx * component) < 0.001);
        assert.ok(Math.abs(truck.y - y - dy * component) < 0.001);
      }
    });
  }
}
