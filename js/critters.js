'use strict';
// Peaceful wildlife: reindeer and squirrels that flee from people and vanish with the forest, swans on the water,
// forest folk pottering about their huts until they are threatened, and butterflies where the land is still lush.
// None of it touches the rules of the game; it shows what the logging does to the place.
(function () {
  const TS = LJ.TS, T = LJ.T, G = LJ.G;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];

  function spawnCritters() {
    const w = G.world, W = w.W, H = w.H;
    const r = LJ.rng(w.seed + 9);
    spawnFolk(r);
    const critterLimit = G.critters.length + 12;
    for (let tries = 0; tries < 3000 && G.critters.length < critterLimit; tries++) {
      const x = (r() * W) | 0, y = (r() * H) | 0, i = y * W + x;
      if (w.type[i] !== T.GRASS || LJ.isTree(i) || Math.hypot(x - w.start.x, y - w.start.y) < 12) continue;
      let trees = 0;
      for (let k = 0; k < 8; k++) { const n = (y + DY[k]) * W + x + DX[k]; if (n >= 0 && n < w.N && LJ.isTree(n)) trees++; }
      if (trees < 2) continue;
      G.critters.push(makeCritter(G.critters.length % 3 === 0 ? 'deer' : 'squirrel', x * TS + 8, y * TS + 10, r() < 0.5 ? 1 : -1, r() * 4));
    }
    // Swans, on open water away from the banks.
    const openWater = i => w.type[i] === T.WATER && DX.every((dx, k) => { const n = i + DY[k] * W + dx; return n >= 0 && n < w.N && w.type[n] === T.WATER; });
    for (let tries = 0, swans = 0; tries < 3000 && swans < 8; tries++) {
      const x = 1 + ((r() * (W - 2)) | 0), y = 1 + ((r() * (H - 2)) | 0);
      if (!openWater(y * W + x)) continue;
      G.critters.push(makeCritter('swan', x * TS + 8, y * TS + 10, r() < 0.5 ? 1 : -1, r() * 4));
      swans++;
    }
  }
  // Peaceful inhabitants stay by their own hut until it is threatened or war begins.
  function spawnFolk(r) {
    for (const h of G.huts) if (h.alive && !h.angry) for (let k = 0; k < 2; k++) {
      G.critters.push(Object.assign(makeCritter('native', h.x + (r() - 0.5) * 30, h.y + 4 + r() * 10, r() < 0.5 ? 1 : -1, r() * 4), { home: h.tile }));
    }
  }
  function makeCritter(kind, x, y, dir, t) {
    return { kind, x, y, tx: 0, ty: 0, t, dir, walkT: 0, moving: false, flee: false, alpha: 1 };
  }
  function critterStop(c, t) { c.moving = false; c.flee = false; c.t = t; }
  function critterGo(c, x, y) {
    const w = G.world, W = w.W, H = w.H;
    c.tx = LJ.clamp(x, 8, W * TS - 8); c.ty = LJ.clamp(y, 8, H * TS - 8); c.moving = true;
  }
  function updCritters(dt) {
    const w = G.world, W = w.W, H = w.H;
    for (const c of G.critters) {
      if (c.gone) { c.alpha -= dt * 0.8; continue; }
      if (c.kind === 'native') {
        const h = LJ.combat.hutAt(c.home);
        if (!h || h.angry) { c.gone = true; continue; }
        if (!c.moving && (c.t -= dt) <= 0) critterGo(c, h.x + (Math.random() - 0.5) * 32, h.y + (Math.random() - 0.5) * 32);
        if (c.moving) {
          const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy), dist = Math.min(d, 16 * dt);
          if (d < 1) critterStop(c, 2 + Math.random() * 4);
          else { c.x += dx / d * dist; c.y += dy / d * dist; c.dir = dx > 0 ? 1 : -1; c.walkT += dt; }
        }
        continue;
      }
      const tile = LJ.tileOfPx(c.x, c.y);
      if (c.kind === 'swan') { // drifts about its water and leaves when the water is filled in
        if (w.type[tile] !== T.WATER) { c.gone = true; continue; }
        if (!c.moving && (c.t -= dt) <= 0) critterGo(c, c.x + (Math.random() - 0.5) * 70, c.y + (Math.random() - 0.5) * 40);
        if (!c.moving) continue;
        const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy), nx = c.x + (dx / d) * 7 * dt, ny = c.y + (dy / d) * 7 * dt;
        if (d < 1.5 || w.type[LJ.tileOfPx(nx + Math.sign(dx) * 9, ny)] !== T.WATER || w.type[LJ.tileOfPx(nx, ny + Math.sign(dy) * 7)] !== T.WATER) { critterStop(c, 2 + Math.random() * 6); continue; }
        c.x = nx; c.y = ny; c.dir = dx > 0 ? 1 : -1;
        continue;
      }
      if (w.lush[tile] < 0.4) { c.gone = true; continue; } // nothing left to live on
      const deer = c.kind !== 'squirrel';
      if (!c.flee) {
        for (const u of G.units) {
          if (Math.hypot(u.x - c.x, u.y - c.y) < (deer ? 70 : 44)) {
            const a = Math.atan2(c.y - u.y, c.x - u.x);
            critterGo(c, c.x + Math.cos(a) * 90, c.y + Math.sin(a) * 90); c.flee = true;
            break;
          }
        }
      }
      if (!c.moving && (c.t -= dt) <= 0) critterGo(c, c.x + (Math.random() - 0.5) * 90, c.y + (Math.random() - 0.5) * 90);
      if (!c.moving) continue;
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      const sp = c.flee ? (deer ? 85 : 70) : deer ? 16 : 24;
      if (d < 1.5) { critterStop(c, 1.5 + Math.random() * 5); continue; }
      const nx = c.x + (dx / d) * sp * dt, ny = c.y + (dy / d) * sp * dt;
      if (!LJ.wildPass(LJ.tileOfPx(nx, ny))) { critterStop(c, 0.4); continue; }
      c.x = nx; c.y = ny; c.dir = dx > 0 ? 1 : -1; c.walkT += dt;
    }
    if (G.critters.some(c => c.alpha <= 0)) G.critters = G.critters.filter(c => c.alpha > 0);
  }

  function spawnButterflies(seed) {
    const w = G.world, W = w.W, H = w.H;
    const r = LJ.rng(seed + 5);
    for (let i = 0; i < 400 && G.bflies.length < 60; i++) {
      const x = (r() * W) | 0, y = (r() * H) | 0;
      if (w.type[y * W + x] === T.GRASS && w.lush[y * W + x] > 0.5) {
        G.bflies.push({ x: x * TS + 8, y: y * TS + 8, tx: x * TS + 8, ty: y * TS + 8, t: 0, col: ['#fff', '#ffd84a', '#ff9ad0', '#9ad0ff'][(r() * 4) | 0], ph: r() * 6 });
      }
    }
  }
  // Butterflies only live where the land is still lush.
  function updateButterflies(dt) {
    const w = G.world, W = w.W, H = w.H;
    for (const b of G.bflies) {
      b.t -= dt; b.ph += dt * 14;
      if (b.t <= 0) {
        b.t = 1 + Math.random() * 2;
        b.tx = LJ.clamp(b.x + (Math.random() - 0.5) * 60, 4, W * TS - 4);
        b.ty = LJ.clamp(b.y + (Math.random() - 0.5) * 60, 4, H * TS - 4);
        if (w.lush[LJ.tileOfPx(b.x, b.y)] < 0.5) b.dead = true;
      }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      if (d > 1) { b.x += (dx / d) * 16 * dt; b.y += (dy / d) * 16 * dt; }
    }
    if (G.bflies.some(b => b.dead)) G.bflies = G.bflies.filter(b => !b.dead);
  }

  LJ.critters = { spawn: spawnCritters, spawnFolk, make: makeCritter, update: updCritters, spawnButterflies, updateButterflies };
})();
