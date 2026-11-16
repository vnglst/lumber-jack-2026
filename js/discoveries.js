'use strict';
// Seeded, buried forest finds. Separate from world generation so older maps keep their layout.
(function () {
  const G = LJ.G;
  const recipes = {
    resin: { id: 'resin', name: 'Pine-resin blade oil', desc: 'Jacks fell trees 15% faster.' },
    sling: { id: 'sling', name: 'Double log sling', desc: 'Every Jack carries four extra wood.' },
    saw: { id: 'saw', name: 'Balanced saw teeth', desc: 'Manual and steam sawmills work 20% faster.' }
  };
  function init() {
    G.recipes = [];
    G.finds = [];
    const w = G.world, r = LJ.rng(w.seed + 281);
    const candidates = [];
    for (let i = 0; i < w.N; i++) if (w.obj[i] >= 1 && w.obj[i] <= 3 && !w.bld[i]) candidates.push(i);
    // Shuffle with a separate RNG; this must never change the generated map or its tree total.
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const kinds = ['resin', 'sling', 'saw', 'gold', 'treasure', 'gold', 'treasure', 'gold', 'treasure', 'gold', 'treasure', 'gold'];
    for (const tile of candidates) {
      if (G.finds.some(f => Math.hypot(tile % w.W - f.tile % w.W, Math.floor(tile / w.W) - Math.floor(f.tile / w.W)) < 9)) continue;
      G.finds.push({ tile, kind: kinds[G.finds.length], found: false });
      if (G.finds.length === kinds.length) break;
    }
  }
  function update() {
    const w = G.world;
    for (const f of G.finds) {
      if (f.found || !G.fog[f.tile] || LJ.isTree(f.tile)) continue;
      const x = f.tile % w.W * LJ.TS + 8, y = Math.floor(f.tile / w.W) * LJ.TS + 8;
      if (!G.units.some(u => !u.dead && Math.hypot(u.x - x, u.y - y) <= 24)) continue;
      f.found = true;
      const recipe = recipes[f.kind];
      if (recipe) {
        if (!G.recipes.includes(f.kind)) G.recipes.push(f.kind);
        LJ.ui.toast('Recipe found: ' + recipe.name + '! ' + recipe.desc + ' Open ✦ to see your finds.');
        LJ.float(x, y - 16, 'Recipe!', 'xp');
        LJ.sfx('level');
      } else {
        const amount = f.kind === 'gold' ? 90 : 180;
        G.money += amount; G.earned += amount;
        LJ.ui.toast((f.kind === 'gold' ? 'A nugget of Lapland gold' : 'A lost cash box') + '! +€' + amount + '. Open ✦ to see your finds.');
        LJ.float(x, y - 16, '+€' + amount, 'money');
        LJ.sfx('coin');
      }
    }
  }
  function draw(ctx, cx, cy) {
    const w = G.world;
    for (const f of G.finds) {
      if (f.found || !G.fog[f.tile] || (G.dc && LJ.ending.covers(f.tile))) continue;
      const x = f.tile % w.W * LJ.TS + 8 - cx, y = Math.floor(f.tile / w.W) * LJ.TS + 10 - cy;
      ctx.fillStyle = '#211b22'; ctx.fillRect(x - 4, y - 4, 8, 6);
      ctx.fillStyle = recipes[f.kind] ? '#fff0b0' : '#dfac32'; ctx.fillRect(x - 3, y - 3, 6, 4);
      ctx.fillStyle = '#fff7d0'; ctx.fillRect(x - 3, y - 3, 6, 1);
      if (Math.floor(G.time * 2 + f.tile) % 3 === 0) {
        ctx.fillRect(x + 5, y - 7, 1, 5); ctx.fillRect(x + 3, y - 5, 5, 1);
      }
    }
  }
  LJ.discoveries = { init, update, draw, recipes };
})();
