'use strict';
// The ending: once every last tree is gone, a visitor in a suit arrives, makes a speech,
// and a data center spreads out until it covers the entire map.
(function () {
  const TS = LJ.TS, T = LJ.T, G = LJ.G, S = LJ.sprites;
  const E = (LJ.ending = {});
  const SITE_W = 7, SITE_H = 5, BONUS = 1000000, SPREAD = 16;
  const BLOCK = S.dcFrame.width / TS; // tiles per data-center module

  const ease = k => { k = Math.min(1, k); return k * k * (3 - 2 * k); }; // smoothstep for the camera moves
  const lines = () => LJ.LINES.ending.map(l => ({ who: l.who, text: l.text.replace('{n}', G.cleared.toLocaleString('en-US')) }));

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

  // Would a building drawn in front of them hide someone standing on tile i? The grown village is six tiles tall
  // on a three-tile footprint, so the ground just behind it is out of sight.
  function screened(i) {
    const W = G.world.W, x = (i % W) * TS + 8, y = ((i / W) | 0) * TS + 10;
    return G.buildings.some(b => {
      if (b.dead || b.pending || (b.ty + b.h) * TS <= y) return false;
      const spr = LJ.bldSprite(b), [ox, oy] = LJ.bldOrigin(b);
      return ox < x + 6 && ox + spr.width > x - 6 && oy < y && oy + spr.height > y - 20;
    });
  }

  // Where the first building goes: a clear patch, reachable, close to the settlement, preferably with its front
  // in plain view (a crowded town may have no such patch; then any clear one will do).
  function findSite() {
    const w = G.world, W = w.W, reach = reachable(), v = G.base;
    const vx = v.tx + v.w / 2, vy = v.ty + v.h / 2;
    const scan = inView => {
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
        if (ok && inView && (screened(front) || screened(front + W))) ok = false;
        if (ok) { bd = d; best = { tx, ty }; }
      }
      return best;
    };
    return scan(true) || scan(false) || { tx: Math.min(w.W - SITE_W - 1, v.tx + v.w + 2), ty: Math.max(1, v.ty - 1) }; // next to the village
  }

  E.start = function () {
    const w = G.world, W = w.W;
    G.animals = []; LJ.combat.clearShots(); G.animalCd = 1e9; G.order = null; G.orderCd = 1e9;
    G.sel.clear(); G.place = null; G.drag = null; G.wallMode = false; G.wallDrag = null;
    LJ.cmd.stop(G.units);
    LJ.revealAll();
    const site = findSite();
    for (let y = site.ty; y < site.ty + SITE_H; y++) for (let x = site.tx; x < site.tx + SITE_W; x++) {
      const i = y * W + x;
      w.obj[i] = 0; w.flower[i] = 0; w.deco[i] = 0; w.type[i] = T.DIRT; w.lush[i] = 0;
    }
    LJ.markAround((site.ty + 2) * W + site.tx + 3, 5);
    const fx = site.tx + 3, fy = site.ty + SITE_H;
    const near = c => Math.abs((c % W) - fx) <= 1 && Math.abs(((c / W) | 0) - fy) <= 1;
    const path = LJ.bfs(G.exitIdx, c => near(c) && !screened(c)) || LJ.bfs(G.exitIdx, near) || [];
    G.suit = { x: (G.exitIdx % W) * TS + 8, y: ((G.exitIdx / W) | 0) * TS + 10, path, dir: 1, walkT: 0 };
    G.cine = { phase: 'walk', t: 0, line: 0, site, lines: lines() };
    // The crew gathers to see who is coming.
    for (const u of G.units) {
      for (let k = 0; k < 30; k++) {
        const x = fx - 4 + ((Math.random() * 9) | 0), y = fy + 1 + ((Math.random() * 3) | 0);
        if (x > 0 && y > 0 && x < W && y < w.H && LJ.pass(y * W + x) && !screened(y * W + x)) { LJ.cmd.move([u], y * W + x); break; }
      }
    }
    LJ.ui.cineStart();
    LJ.clearSave(); // the game is over; a reload starts a fresh forest
    LJ.ui.toast('The last tree is down! Someone is coming up the road…');
  };

  E.next = function () {
    const c = G.cine;
    if (!c || c.phase !== 'talk') return;
    LJ.sfx('click');
    c.line++;
    if (c.line < c.lines.length) {
      const l = c.lines[c.line];
      // The suit and the jack turn to face whoever is speaking.
      if (c.jack) { G.suit.dir = c.jack.x > G.suit.x ? 1 : -1; c.jack.dir = G.suit.x > c.jack.x ? 1 : -1; }
      LJ.ui.cineLine(l);
      return;
    }
    G.money += BONUS;
    LJ.float(G.suit.x, G.suit.y - 22, '+€1,000,000', 'money');
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

  // Is tile i under a data-center module that has started going up? Excluded blocks never start.
  E.covers = function (i) {
    const dc = G.dc;
    if (!dc) return false;
    const W = G.world.W, k = ((((i / W) | 0) / BLOCK) | 0) * dc.BW + (((i % W) / BLOCK) | 0);
    return G.time >= dc.start[k];
  };

  // Every 3x3-tile block of the map gets a start time, rippling outward from the first building with a ragged edge.
  // The data center swallows the land but leaves an island: the first building, the village, everyone standing
  // watching, and the river and lakes (Mr. Grant's "excellent cooling water").
  function planSpread() {
    const w = G.world, W = w.W, s = G.cine.site, BW = Math.ceil(W / BLOCK), BH = Math.ceil(w.H / BLOCK);
    const start = new Float32Array(BW * BH).fill(Infinity), order = [], keep = new Uint8Array(BW * BH);
    const keepTiles = (x0, y0, x1, y1) => {
      for (let by = Math.max(0, Math.floor(y0 / BLOCK)); by <= Math.min(BH - 1, Math.floor(y1 / BLOCK)); by++)
        for (let bx = Math.max(0, Math.floor(x0 / BLOCK)); bx <= Math.min(BW - 1, Math.floor(x1 / BLOCK)); bx++) keep[by * BW + bx] = 1;
    };
    keepTiles(s.tx, s.ty - 1, s.tx + SITE_W - 1, s.ty + SITE_H - 1);
    const v = G.base;
    if (v) keepTiles(v.tx - 1, v.ty - 1, v.tx + v.w, v.ty + v.h);
    for (const p of [...G.units, G.suit]) {
      const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS);
      keepTiles(tx - 1, ty - 1, tx + 1, ty);
    }
    for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
      const x0 = bx * BLOCK, y0 = by * BLOCK;
      let wet = 0, n = 0;
      for (let y = y0; y < Math.min(w.H, y0 + BLOCK); y++) for (let x = x0; x < Math.min(W, x0 + BLOCK); x++) { n++; if (w.type[y * W + x] === T.WATER) wet++; }
      if (wet * 2 > n) keep[by * BW + bx] = 1;
    }
    // A building partly on open ground stays whole, or a module would cut it in two; the rest are swallowed.
    for (const b of G.buildings) {
      if (b.dead || b.pending) continue;
      let open = false;
      for (let y = b.ty; y < b.ty + b.h && !open; y++) for (let x = b.tx; x < b.tx + b.w; x++) if (keep[((y / BLOCK) | 0) * BW + ((x / BLOCK) | 0)]) { open = true; break; }
      if (open) keepTiles(b.tx, b.ty, b.tx + b.w - 1, b.ty + b.h - 1);
    }
    const cx = (s.tx + SITE_W / 2) / BLOCK, cy = (s.ty + SITE_H / 2) / BLOCK;
    for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
      if (keep[by * BW + bx]) continue;
      order.push({ k: by * BW + bx, d: Math.hypot(bx + 0.5 - cx, by + 0.5 - cy) + LJ.hash(bx, by, 77) * 3 });
    }
    order.sort((a, b) => a.d - b.d);
    // Slow at first, then faster and faster, like an operation that has found its stride.
    order.forEach((o, r) => { start[o.k] = G.time + 0.6 + SPREAD * Math.pow(r / order.length, 0.6); });
    G.dc = { BW, BH, start, order, next: 0, end: G.time + 0.6 + SPREAD };
  }

  function walkSuit(dt) {
    const s = G.suit, W = G.world.W;
    let dist = 70 * dt; // a brisk walk up the long road
    while (dist > 0 && s.path.length) {
      const n = s.path[s.path.length - 1];
      const px = (n % W) * TS + 8, py = ((n / W) | 0) * TS + 10, dx = px - s.x, dy = py - s.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01) s.dir = dx > 0 ? 1 : -1;
      if (d <= dist) { s.x = px; s.y = py; dist -= d; s.path.pop(); s.tile = n; } else { s.x += (dx / d) * dist; s.y += (dy / d) * dist; dist = 0; }
    }
    s.walkT += dt;
  }

  E.update = function (dt) {
    const c = G.cine, w = G.world;
    c.t += dt;
    if (c.phase === 'walk') {
      walkSuit(dt);
      LJ.ui.follow(G.suit.x, G.suit.y, dt);
      if (!G.suit.path.length) {
        c.phase = 'talk';
        const near = LJ.jacks().sort((a, b) => Math.hypot(a.x - G.suit.x, a.y - G.suit.y) - Math.hypot(b.x - G.suit.x, b.y - G.suit.y))[0];
        if (near) { c.jack = near; G.suit.dir = near.x > G.suit.x ? 1 : -1; LJ.say(near, LJ.LINES.misc.who); }
        LJ.ui.cineLine(c.lines[0]);
      }
    } else if (c.phase === 'build') {
      const s = c.site, cx = (s.tx + SITE_W / 2) * TS, by = (s.ty + SITE_H) * TS;
      LJ.ui.follow(cx, by - 30, dt);
      const dc = G.props[0];
      if (c.t > 2.5 && dc.spr === S.dcStage1) { dc.spr = S.dcStage2; LJ.sfx('build'); }
      if (c.t > 5.5 && dc.spr === S.dcStage2) { dc.spr = S.datacenter; G.props = [dc]; LJ.sfx('build'); }
      if (c.t < 5.5 && Math.random() < dt * 30) LJ.dust(cx + (Math.random() - 0.5) * SITE_W * TS, by - Math.random() * 20);
      if (c.t > 7) { c.phase = 'spread'; c.t = 0; c.zoom0 = LJ.ui.zoom(); LJ.cmd.stop(G.units); planSpread(); }
    } else if (c.phase === 'spread') {
      // Zoom out to the whole map while the data center grows over it.
      const e = ease(c.t / (SPREAD * 0.8)), fit = LJ.ui.fitZoom();
      LJ.ui.zoomTo(c.zoom0 + (fit - c.zoom0) * e);
      const s = c.site;
      LJ.ui.centerOn((s.tx + SITE_W / 2) * TS * (1 - e) + (w.W * TS / 2) * e, (s.ty + SITE_H / 2) * TS * (1 - e) + (w.H * TS / 2) * e);
      const dcs = G.dc;
      while (dcs.next < dcs.order.length && dcs.start[dcs.order[dcs.next].k] <= G.time) {
        const k = dcs.order[dcs.next++].k, bx = (k % dcs.BW) * BLOCK * TS, byy = ((k / dcs.BW) | 0) * BLOCK * TS;
        if (Math.random() < 0.5) LJ.dust(bx + 24, byy + 40);
        if (dcs.next % 12 === 0) LJ.sfx('build');
      }
      if (G.time > dcs.end + 1.5) { c.phase = 'home'; c.t = 0; c.zoomFit = LJ.ui.zoom(); }
    } else if (c.phase === 'home') {
      // Last shot: drift back down to the little red village and its crew, alone in a sea of servers.
      const e = ease(c.t / 4.5), who = c.jack || G.suit;
      const z1 = Math.max(c.zoomFit, c.zoom0 * 0.7);
      LJ.ui.zoomTo(c.zoomFit + (z1 - c.zoomFit) * e);
      LJ.ui.centerOn((w.W * TS / 2) * (1 - e) + who.x * e, (w.H * TS / 2) * (1 - e) + (who.y - 16) * e);
      if (c.t > 5.5) { c.phase = 'end'; LJ.ui.endScreen(); }
    }
  };
})();
