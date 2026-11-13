'use strict';
// The ending: a visitor in a suit, a speech, and what the land was cleared for.
(function () {
  const TS = LJ.TS, T = LJ.T, G = LJ.G, S = LJ.sprites;
  const E = (LJ.ending = {});
  const SITE_W = 7, SITE_H = 5, BONUS = 1000000;

  function lines() {
    return [
      'Ah, there you are! You must be the boss of this little operation.',
      G.cleared.toLocaleString('en-US') + ' trees. Not one left standing. Magnificent work, truly.',
      'Allow me to introduce myself. I represent the people who bought this land.',
      'You see, we needed it empty. Completely empty. And you delivered.',
      "Because right here, we're building the largest AI data center in the country.",
      "Don't worry about the river. It'll make excellent cooling water.",
      'Your bonus: one million dollars. Plus shares in the company. Welcome aboard!'
    ];
  }

  // Flood fill from the market road: which tiles can someone walking in actually reach?
  function reachable() {
    const w = G.world, W = w.W, seen = new Uint8Array(w.N), st = [G.exitIdx];
    seen[G.exitIdx] = 1;
    while (st.length) {
      const c = st.pop(), cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= w.H) continue;
        const n = ny * W + nx;
        if (!seen[n] && LJ.pass(n)) { seen[n] = 1; st.push(n); }
      }
    }
    return seen;
  }

  // The best building site: a clear patch, reachable, close to the village.
  function findSite() {
    const w = G.world, W = w.W, reach = reachable();
    const v = G.village || { tx: 2, ty: w.roadY - 3, w: 2, h: 2 };
    const vx = v.tx + v.w / 2, vy = v.ty + v.h / 2;
    let best = null, bd = 1e9;
    for (let ty = 1; ty < w.H - SITE_H - 2; ty++) for (let tx = 4; tx < W - SITE_W - 1; tx++) {
      const front = (ty + SITE_H) * W + tx + 3;
      if (!reach[front]) continue;
      const d = Math.hypot(tx + SITE_W / 2 - vx, ty + SITE_H / 2 - vy);
      if (d >= bd || d < 6) continue;
      let ok = true;
      for (let y = ty; y < ty + SITE_H && ok; y++) for (let x = tx; x < tx + SITE_W; x++) {
        const i = y * W + x;
        if (LJ.blocked(i) || w.bld[i]) { ok = false; break; }
      }
      if (ok) { bd = d; best = { tx, ty }; }
    }
    return best || { tx: 6, ty: Math.max(1, w.roadY - SITE_H - 1) };
  }

  E.start = function () {
    const w = G.world, W = w.W;
    G.animals = []; G.animalCd = 1e9; G.order = null; G.orderCd = 1e9;
    G.sel.clear(); G.place = null; G.drag = null;
    LJ.cmd.stop(G.units);
    const site = findSite();
    // Level the site.
    for (let y = site.ty; y < site.ty + SITE_H; y++) for (let x = site.tx; x < site.tx + SITE_W; x++) {
      const i = y * W + x;
      w.obj[i] = 0; w.flower[i] = 0; w.type[i] = T.DIRT; w.lush[i] = 0;
    }
    LJ.markAround((site.ty + 2) * W + site.tx + 3, 5);
    const fx = site.tx + 3, fy = site.ty + SITE_H;
    const path = LJ.bfs(G.exitIdx, c => Math.abs((c % W) - fx) <= 1 && Math.abs(((c / W) | 0) - fy) <= 1) || [];
    G.suit = { x: (G.exitIdx % W) * TS + 8, y: ((G.exitIdx / W) | 0) * TS + 10, path, dir: 1, walkT: 0 };
    G.cine = { phase: 'walk', t: 0, line: 0, site, lines: lines() };
    // The crew gathers to see who is coming.
    for (const u of G.units) {
      for (let k = 0; k < 30; k++) {
        const x = fx - 4 + ((Math.random() * 9) | 0), y = fy + 1 + ((Math.random() * 3) | 0);
        if (x > 0 && y > 0 && x < W && y < w.H && LJ.pass(y * W + x)) { LJ.cmd.move([u], y * W + x); break; }
      }
    }
    LJ.ui.cineStart();
    LJ.ui.toast('Level 10 complete! Someone is coming up the road…');
  };

  E.next = function () {
    const c = G.cine;
    if (!c || c.phase !== 'talk') return;
    LJ.sfx('click');
    c.line++;
    if (c.line < c.lines.length) { LJ.ui.cineLine(c.lines[c.line]); return; }
    // Payday like no other.
    G.money += BONUS;
    LJ.float(G.suit.x, G.suit.y - 22, '+$1,000,000', 'money');
    LJ.sfx('level');
    LJ.ui.cineLine(null);
    c.phase = 'build'; c.t = 0;
    const s = c.site, cx = (s.tx + SITE_W / 2) * TS, by = (s.ty + SITE_H) * TS;
    G.props = [
      { spr: S.dcStage1, x: cx, y: by, dc: true },
      { spr: S.crane, x: (s.tx + SITE_W) * TS + 22, y: by - 6 },
      { spr: S.mixer.l, x: s.tx * TS - 14, y: by + 6 }
    ];
  };

  function walkSuit(dt) {
    const s = G.suit, W = G.world.W;
    let dist = 34 * dt;
    while (dist > 0 && s.path.length) {
      const n = s.path[s.path.length - 1];
      const px = (n % W) * TS + 8, py = ((n / W) | 0) * TS + 10, dx = px - s.x, dy = py - s.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01) s.dir = dx > 0 ? 1 : -1;
      if (d <= dist) { s.x = px; s.y = py; dist -= d; s.path.pop(); s.tile = n; } else { s.x += (dx / d) * dist; s.y += (dy / d) * dist; dist = 0; }
    }
    s.walkT += dt;
  }

  E.update = function (dt) {
    const c = G.cine;
    c.t += dt;
    if (c.phase === 'walk') {
      walkSuit(dt);
      LJ.ui.follow(G.suit.x, G.suit.y, dt);
      if (!G.suit.path.length) {
        c.phase = 'talk';
        const near = G.units.filter(u => u.kind === 'jack').sort((a, b) => Math.hypot(a.x - G.suit.x, a.y - G.suit.y) - Math.hypot(b.x - G.suit.x, b.y - G.suit.y))[0];
        if (near) { G.suit.dir = near.x > G.suit.x ? 1 : -1; LJ.say(near, '…Who are you?'); }
        LJ.ui.cineLine(c.lines[0]);
      }
    } else if (c.phase === 'build') {
      const s = c.site, cx = (s.tx + SITE_W / 2) * TS, by = (s.ty + SITE_H) * TS;
      LJ.ui.follow(cx, by - 30, dt);
      const dc = G.props[0];
      if (c.t > 3 && dc.spr === S.dcStage1) { dc.spr = S.dcStage2; LJ.sfx('build'); }
      if (c.t > 7 && dc.spr === S.dcStage2) {
        dc.spr = S.datacenter; G.props = [dc]; LJ.sfx('build'); LJ.sfx('level');
      }
      if (c.t < 7 && Math.random() < dt * 30) {
        G.parts.push({ x: cx + (Math.random() - 0.5) * SITE_W * TS, y: by - Math.random() * 20, vx: (Math.random() - 0.5) * 20, vy: -12 - Math.random() * 10, t: 0, life: 1.2, col: '#c9b48a', smoke: true });
      }
      if (c.t > 10 && c.phase === 'build') { c.phase = 'end'; LJ.ui.endScreen(); }
    }
  };
})();
