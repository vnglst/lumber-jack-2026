'use strict';
// Combat: laser bursts, arrows, guard towers, and the forest folk who resist the logging in waves.
(function () {
  const TS = LJ.TS, G = LJ.G;
  const C = (LJ.combat = {});
  const BOLT_SPEED = 520, ARROW_SPEED = 210, TOWER_RANGE = 8 * TS, FOLK_RANGE = 80;
  const HOSTILE_LEVEL = (C.HOSTILE_LEVEL = 5);
  const ARROW_VS_WOOD = 0.4; // arrows barely dent timber

  C.clearShots = function () { G.bolts = []; G.arrows = []; G.bursts = []; };
  C.reset = function () {
    C.clearShots();
    G.wave = { hostile: false, next: 0, n: 0, active: null };
  };

  const sparks = (x, y, col, n) => {
    for (let i = 0; i < n; i++) {
      G.parts.push({ x, y, vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90 - 20, t: 0, life: 0.2 + Math.random() * 0.2, col, glow: true });
    }
  };

  // ---------- Lasers: bursts of fast bolts that travel, spread a little, and can miss ----------
  // src: anything with x, y (and optionally dir, muzzleY, and an owner whose muzzle flashes); target: an animal or forest folk.
  C.burst = function (src, target, o) {
    G.bursts.push({ src, target, left: o.n, t: 0, dmg: o.dmg, col: o.col, spread: o.spread || 5 });
  };
  function fireBolt(b) {
    const s = b.src, tg = b.target;
    const sx = s.x + (s.dir || 0) * 8, sy = s.y - (s.muzzleY === undefined ? 9 : s.muzzleY);
    const tx = tg.x + (Math.random() - 0.5) * b.spread * 2, ty = tg.y - 6 + (Math.random() - 0.5) * b.spread * 2;
    const d = Math.hypot(tx - sx, ty - sy) || 1;
    G.bolts.push({ x0: sx, y0: sy, x1: tx, y1: ty, t: 0, dur: d / BOLT_SPEED, col: b.col, dmg: b.dmg, target: tg });
    (s.owner || s).flash = 0.07;
    LJ.sfx('laser');
  }
  function updLasers(dt) {
    for (const b of G.bursts) {
      if ((b.t -= dt) > 0) continue;
      if (!b.target.alive || b.src.dead) { b.left = 0; continue; }
      fireBolt(b); b.left--; b.t = 0.085;
    }
    if (G.bursts.length) G.bursts = G.bursts.filter(b => b.left > 0);
    for (const bo of G.bolts) {
      bo.t += dt;
      if (bo.t < bo.dur || bo.done) continue;
      bo.done = true;
      const tg = bo.target;
      if (tg.alive && Math.hypot(tg.x - bo.x1, tg.y - 6 - bo.y1) < 10) { LJ.hurtAnimal(tg, bo.dmg); sparks(bo.x1, bo.y1, bo.col, 6); }
      else sparks(bo.x1, bo.y1, '#ffd8a0', 2);
    }
    if (G.bolts.length) G.bolts = G.bolts.filter(b => b.t < b.dur + 0.03);
  }

  // ---------- Guard towers ----------
  function updTowers(dt) {
    for (const b of G.buildings) {
      if (b.kind !== 'tower' || !LJ.buildingReady(b)) continue;
      b.flash = Math.max(0, (b.flash || 0) - dt);
      if ((b.cd = (b.cd || 0) - dt) > 0) continue;
      if (!b.muzzle) { const [ox, oy] = LJ.bldOrigin(b), m = LJ.sprites.tower.muzzle; b.muzzle = { x: ox + m.x, y: oy + m.y, muzzleY: 0, owner: b }; }
      const best = LJ.nearest(G.animals, b.muzzle.x, b.muzzle.y, TOWER_RANGE, a => a.alive);
      if (!best) continue;
      b.cd = 1.3;
      C.burst(b.muzzle, best, { n: 3, dmg: 13, col: '#4ae8ff', spread: 4 });
    }
  }

  // ---------- Arrows ----------
  // tg is { u: unit } or { b: building }.
  function aimPoint(tg) {
    if (tg.u) return [tg.u.x, tg.u.y - 6];
    const b = tg.b;
    return [(b.tx + b.w / 2) * TS, (b.ty + b.h / 2) * TS];
  }
  function shootArrow(a, tg) {
    const [px, py] = aimPoint(tg), tx = px + (Math.random() - 0.5) * 10, ty = py + (Math.random() - 0.5) * 8;
    const sx = a.x + a.dir * 6, sy = a.y - 7, d = Math.hypot(tx - sx, ty - sy) || 1;
    G.arrows.push({ x0: sx, y0: sy, x1: tx, y1: ty, t: 0, dur: d / ARROW_SPEED, dmg: a.dmg, tg, from: a });
    LJ.sfx('arrow');
  }
  function updArrows(dt) {
    for (const ar of G.arrows) {
      ar.t += dt;
      if (ar.t < ar.dur || ar.done) continue;
      ar.done = true;
      const tg = ar.tg;
      if (tg.u) { if (!tg.u.dead && Math.hypot(tg.u.x - ar.x1, tg.u.y - 6 - ar.y1) < (tg.u.kind === 'jack' ? 10 : 18)) LJ.hurtUnit(tg.u, ar.dmg, ar.from); }
      else if (!tg.b.dead) LJ.damageBuilding(tg.b, ar.dmg * ARROW_VS_WOOD);
    }
    if (G.arrows.length) G.arrows = G.arrows.filter(a => a.t < a.dur + 0.4); // spent arrows lie on the ground briefly
  }

  // ---------- The forest folk ----------
  function distTo(a, tg) {
    if (tg.u) return Math.hypot(tg.u.x - a.x, tg.u.y - a.y);
    const b = tg.b, x0 = b.tx * TS, y0 = b.ty * TS, x1 = (b.tx + b.w) * TS, y1 = (b.ty + b.h) * TS;
    return Math.hypot(a.x - LJ.clamp(a.x, x0, x1), a.y - LJ.clamp(a.y, y0, y1));
  }
  // Any nearby unit, including machines; otherwise the nearest settlement building.
  function pickTarget(a) {
    const u = LJ.nearest(G.units, a.x, a.y, 150, u => !u.dead);
    if (u) return { u };
    let best = null, bd = 1e9;
    for (const b of G.buildings) {
      if (b.dead) continue;
      const d = distTo(a, { b });
      if (d < bd) { bd = d; best = { b }; }
    }
    return best;
  }
  function goalFor(tg) {
    const w = G.world;
    if (tg.u) { const tx = tg.u.tile % w.W, ty = (tg.u.tile / w.W) | 0; return c => Math.abs((c % w.W) - tx) <= 1 && Math.abs(((c / w.W) | 0) - ty) <= 1; }
    const b = tg.b;
    return c => { const x = c % w.W, y = (c / w.W) | 0; return x >= b.tx - 1 && x <= b.tx + b.w && y >= b.ty - 1 && y <= b.ty + b.h; };
  }

  // Walks an enemy along its path; returns the palisade tile in the way, or -1. Used by wolves and bears too.
  const march = (LJ.march = function (a, dt, speed) {
    const w = G.world;
    let dist = speed * dt;
    while (dist > 0 && a.path.length) {
      const n = a.path[a.path.length - 1];
      if (w.wall[n]) return n;
      const px = (n % w.W) * TS + 8, py = ((n / w.W) | 0) * TS + 10, dx = px - a.x, dy = py - a.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01) a.dir = dx > 0 ? 1 : -1;
      if (d <= dist) { a.x = px; a.y = py; dist -= d; a.path.pop(); a.tile = n; }
      else { a.x += (dx / d) * dist; a.y += (dy / d) * dist; dist = 0; }
    }
    a.walkT += dt;
    return -1;
  });

  function updFolk(a, dt) {
    a.shootCd -= dt; a.retarget -= dt; a.repath -= dt; a.aim = Math.max(0, a.aim - dt); a.hitCd -= dt;
    if (a.retreat) {
      if (a.tile === a.home && !a.path.length) { a.alive = false; return; } // gone back into the forest
      if (a.repath <= 0) { a.repath = 1.5; a.path = LJ.enemyPath(a.tile, c => c === a.home) || []; }
      if (march(a, dt, a.speed * 1.2) >= 0 || !a.path.length) a.alive = false;
      return;
    }
    if (!a.tg || a.retarget <= 0 || (a.tg.u && a.tg.u.dead) || (a.tg.b && a.tg.b.dead)) {
      const tg = pickTarget(a), same = a.tg && tg && a.tg.u === tg.u && a.tg.b === tg.b;
      if (!same) { a.tg = tg; a.repath = 0; } // only re-plan the route when the target actually changed
      a.retarget = 1;
    }
    if (!a.tg) { a.retreat = true; return; }
    if (distTo(a, a.tg) <= FOLK_RANGE) {
      const [px] = aimPoint(a.tg);
      a.dir = px > a.x ? 1 : -1;
      if (a.shootCd <= 0) { a.shootCd = a.cd * (0.8 + Math.random() * 0.4); a.aim = 0.35; shootArrow(a, a.tg); }
      return;
    }
    if (a.repath <= 0) { a.repath = 1.2; a.path = LJ.enemyPath(a.tile, goalFor(a.tg)) || []; } // on the timer only, even after a failed search
    const wall = march(a, dt, a.speed);
    if (wall >= 0 && a.hitCd <= 0) { a.hitCd = 0.8; a.aim = 0.25; LJ.damageWall(wall, LJ.FOE.native.wallDmg); } // hack through the palisade
  }

  // ---------- Waves ----------
  const folkStats = lv => ({ hp: 22 + lv * 4, dmg: 5 + lv * 0.8, speed: 38 + lv, cd: Math.max(1.2, 1.9 - lv * 0.05) });
  const gap = () => Math.max(60, Math.round((170 - G.level * 9) * (0.8 + Math.random() * 0.4)));
  const treesLeft = () => G.total - G.cleared;

  function compass(x, y) {
    const b = G.base, dx = x - (b.tx + 1), dy = y - (b.ty + 1);
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : dy > 0 ? 'south' : 'north';
  }
  // A spot in the living forest, far enough from the village and the jacks, with a way in.
  function findSpawn() {
    const w = G.world, b = G.base, Wd = w.W;
    // One flood fill from around the village answers "is there a way in?" for every candidate.
    const reach = new Uint8Array(w.N), st = [];
    for (let y = b.ty - 1; y <= b.ty + b.h; y++) for (let x = b.tx - 1; x <= b.tx + b.w; x++) { const i = y * Wd + x; if (LJ.wildPass(i)) { reach[i] = 1; st.push(i); } }
    while (st.length) {
      const c = st.pop(), cx = c % Wd, cy = (c / Wd) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, n = ny * Wd + nx;
        if (nx >= 0 && ny >= 0 && nx < Wd && ny < w.H && !reach[n] && LJ.wildPass(n)) { reach[n] = 1; st.push(n); }
      }
    }
    const ok = i => {
      const x = i % Wd, y = (i / Wd) | 0;
      if (Math.hypot(x - b.tx, y - b.ty) < 18) return false;
      if (G.units.some(u => Math.hypot(u.x / TS - x, u.y / TS - y) < 8)) return false;
      let trees = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const n = (y + dy) * Wd + x + dx; if (n >= 0 && n < w.N && LJ.isTree(n)) trees++; }
      return trees >= 4 && reach[i] === 1;
    };
    const huts = w.huts.slice().sort(() => Math.random() - 0.5);
    for (const h of huts) if (ok(h)) return h;
    for (let k = 0; k < 300; k++) { const i = (Math.random() * w.N) | 0; if (LJ.isTree(i) && ok(i)) return i; }
    return -1;
  }

  function spawnWave() {
    const wv = G.wave, w = G.world, Wd = w.W, at = findSpawn();
    if (at < 0) { wv.next = G.time + 30; return; }
    wv.n++;
    const late = treesLeft() < G.total * 0.02;
    const size = Math.max(3, Math.min(late ? 6 : 28, Math.round((2 + G.level * 1.2 + wv.n * 0.6) * (0.75 + Math.random() * 0.5))));
    const st = folkStats(G.level), x0 = at % Wd, y0 = (at / Wd) | 0;
    for (let k = 0; k < size; k++) {
      let i = at;
      for (let t = 0; t < 12; t++) {
        const x = x0 + ((Math.random() * 5) | 0) - 2, y = y0 + ((Math.random() * 5) | 0) - 2, n = y * Wd + x;
        if (x > 0 && y > 0 && x < Wd && y < w.H && LJ.wildPass(n)) { i = n; break; }
      }
      G.animals.push({
        kind: 'native', wave: wv.n, x: (i % Wd) * TS + 4 + Math.random() * 8, y: ((i / Wd) | 0) * TS + 8 + Math.random() * 4, tile: i, home: at,
        path: [], hp: st.hp, max: st.hp, dmg: st.dmg, speed: st.speed * (0.9 + Math.random() * 0.2), cd: st.cd,
        shootCd: Math.random() * 2, retarget: Math.random(), repath: Math.random(), aim: 0, hitCd: 0, dir: 1, walkT: Math.random(), alive: true
      });
    }
    wv.active = { size, start: G.time, retreating: false };
    LJ.sfx('drum'); LJ.voice.cue('folk_warcry');
    LJ.ui.toast('War drums! ' + size + ' forest folk are coming from the ' + compass(x0, y0) + '!');
  }

  function updWaves() {
    const wv = G.wave;
    if (!wv.hostile) {
      if (G.level < HOSTILE_LEVEL) return;
      wv.hostile = true; wv.next = G.time + 50;
      for (const c of G.critters) if (c.kind === 'native') c.gone = true;
      LJ.sfx('drum'); LJ.voice.cue('folk_warcry');
      LJ.ui.toast('The forest folk have had enough of your logging. They are taking up their bows.');
      return;
    }
    if (wv.active) {
      let alive = 0;
      for (const a of G.animals) if (a.kind === 'native' && a.wave === wv.n) alive++;
      if (!alive) { wv.active = null; wv.next = G.time + gap(); return; }
      if (!wv.active.retreating && (alive < wv.active.size * 0.4 || G.time - wv.active.start > 120)) {
        wv.active.retreating = true;
        for (const a of G.animals) if (a.kind === 'native' && a.wave === wv.n) { a.retreat = true; a.repath = 0; }
        LJ.voice.cue('folk_retreat');
        LJ.ui.toast('The forest folk fall back into the trees.');
      }
      return;
    }
    if (treesLeft() >= 4 && G.time >= wv.next) spawnWave();
  }
  // Seconds until the next war party, or null.
  C.nextWaveIn = () => (G.wave.hostile && !G.wave.active && treesLeft() >= 4 ? Math.max(0, G.wave.next - G.time) : null);

  // When they break into the village they carry off part of the stock, then leave.
  C.raid = function () {
    const take = k => { const n = Math.floor(G[k] * 0.3); G[k] -= n; return n; };
    const wd = take('wood'), lm = take('lumber');
    LJ.ui.toast('The forest folk raided the village and carried off ' + wd + ' wood' + (lm ? ' and ' + lm + ' lumber' : '') + '!');
    LJ.sfx('no'); LJ.voice.cue('folk_raid');
    for (const a of G.animals) if (a.kind === 'native') { a.retreat = true; a.repath = 0; }
    if (G.wave.active) G.wave.active.retreating = true;
  };

  C.update = function (dt) {
    for (const u of G.units) if (u.flash > 0) u.flash -= dt;
    for (const a of G.animals) if (a.alive && a.kind === 'native') updFolk(a, dt);
    updTowers(dt);
    updLasers(dt);
    updArrows(dt);
    updWaves();
  };
})();
