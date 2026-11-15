'use strict';
// Ore veins in the rock. Seeded apart from world generation (like the forest finds), so older maps keep their layout
// and simply have ore in whatever rock is still standing. G.veins holds the ore left in each tile; the mining itself
// is a unit task in game.js.
(function () {
  const G = LJ.G, T = LJ.T, TS = LJ.TS;
  const VEINS = 9, APART = 9, SPREAD = 1.6; // how many veins, tiles between their centres, and how far one reaches

  function init() {
    const w = G.world, W = w.W, r = LJ.rng(w.seed + 613);
    G.veins = new Uint8Array(w.N);
    // A vein starts in rock that can be walked up to: rock with open ground (or forest, once felled) beside it.
    const open = i => i >= 0 && i < w.N && w.type[i] !== T.ROCK && w.type[i] !== T.WATER;
    const edge = [];
    for (let i = 0; i < w.N; i++) {
      const x = i % W;
      if (w.type[i] === T.ROCK && !w.bld[i] && ((x > 0 && open(i - 1)) || (x < W - 1 && open(i + 1)) || open(i - W) || open(i + W))) edge.push(i);
    }
    for (let i = edge.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [edge[i], edge[j]] = [edge[j], edge[i]]; }
    const centres = [];
    for (const c of edge) {
      const cx = c % W, cy = (c / W) | 0;
      if (centres.some(o => Math.hypot(cx - o % W, cy - ((o / W) | 0)) < APART)) continue;
      centres.push(c);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const x = cx + dx, y = cy + dy, n = y * W + x;
        if (x < 0 || y < 0 || x >= W || y >= w.H || w.type[n] !== T.ROCK || Math.hypot(dx, dy) > SPREAD) continue;
        G.veins[n] = 5 + Math.floor(r() * 6); // 5 to 10 ore in a tile
      }
      if (centres.length === VEINS) break;
    }
  }

  // After a saved game has been laid over the map: the saved veins, or for saves from before ore existed,
  // the seeded ones minus any rock that has been cleared away since.
  function restore(saved) {
    const w = G.world;
    if (saved) G.veins = saved;
    else for (let i = 0; i < w.N; i++) if (w.type[i] !== T.ROCK) G.veins[i] = 0;
  }

  const left = () => G.veins.reduce((a, v) => a + v, 0);
  // Is there ore the player has seen?
  const inSight = () => G.veins.some((v, i) => v > 0 && G.fog[i]);

  // Orange-brown ore showing in the boulders, with a glint now and then.
  function draw(ctx, cx, cy, vw, vh) {
    const w = G.world, W = w.W;
    const x0 = Math.max(0, Math.floor(cx / TS) - 1), x1 = Math.min(W - 1, Math.ceil((cx + vw) / TS) + 1);
    const y0 = Math.max(0, Math.floor(cy / TS) - 1), y1 = Math.min(w.H - 1, Math.ceil((cy + vh) / TS) + 1);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const i = ty * W + tx, v = G.veins[i];
      if (!v || !G.fog[i]) continue;
      const x = tx * TS - cx, y = ty * TS - cy, rich = v > 4;
      ctx.fillStyle = '#3b2416'; ctx.fillRect(x + 3, y + 5, 4, 3); ctx.fillRect(x + 9, y + 9, 4, 3); if (rich) ctx.fillRect(x + 6, y + 1, 3, 3);
      ctx.fillStyle = '#c8732e'; ctx.fillRect(x + 4, y + 5, 2, 2); ctx.fillRect(x + 10, y + 9, 2, 2); if (rich) ctx.fillRect(x + 7, y + 1, 1, 2);
      ctx.fillStyle = '#f2b866'; ctx.fillRect(x + 4, y + 5, 1, 1); ctx.fillRect(x + 10, y + 9, 1, 1);
      if (Math.floor(G.time * 2 + i * 7) % 5 === 0) { ctx.fillStyle = '#fff3cf'; ctx.fillRect(x + 11, y + 6, 1, 3); ctx.fillRect(x + 10, y + 7, 3, 1); }
    }
  }

  LJ.ore = { init, restore, left, inSight, draw };
})();
