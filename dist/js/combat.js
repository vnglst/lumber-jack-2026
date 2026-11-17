'use strict';
// Combat: laser bursts, arrows, guard towers, and the forest folk who resist the logging in waves.
(function () {
  const TS = LJ.TS, G = LJ.G, colOf = LJ.colOf, rowOf = LJ.rowOf;
  const C = (LJ.combat = {});
  const BOLT_SPEED = 520, ARROW_SPEED = 210, TOWER_RANGE = 10 * TS, FOLK_RANGE = 80;
  // A war party's fighters are hardier than the villagers who defend a hut, and they march fast.
  const WARRIOR = { hp: 2.5, march: 1.25 };
  // Pressure follows the crew's current strength, not how long the campaign lasts.
  const RAIDS = { max: 12, recovery: 90, retry: 15, busyGuards: 4 };
  // A guard tower's burst: more bolts than a pistol's, each hitting harder, aimed ahead of a moving target.
  const TOWER = { cd: 1, bolts: 4, twin: 6, dmg: 18 };
  const HOSTILE_LEVEL = (C.HOSTILE_LEVEL = 5);
  const ARROW_VS_WOOD = 0.4; // arrows barely dent timber

  C.clearShots = function () { G.bolts = []; G.arrows = []; G.bursts = []; };
  C.reset = function () {
    C.clearShots();
    G.wave = { hostile: false, next: 0, n: 0, active: null };
    G.huts = G.world.huts.map(tile => ({
      kind: 'hut', tile, x: colOf(tile) * TS + 8, y: rowOf(tile) * TS + 10,
      hp: 200, max: 200, alive: G.world.deco[tile] === 8, angry: false, spawnCd: 0
    }));
  };
  C.hutAt = tile => G.huts.find(h => h.tile === tile && h.alive) || null;
  C.angerHut = function (h) {
    if (!h.alive || h.angry) return;
    h.angry = true;
    for (const c of G.critters) if (c.kind === 'native' && c.home === h.tile) c.gone = true;
    LJ.voice.cue('folk_warcry');
    LJ.ui.toast('You are too close to a forest village. Its defenders are taking up their bows!');
  };
  C.hurtHut = function (h, dmg) {
    if (!h.alive) return;
    C.angerHut(h);
    h.hp = Math.max(0, h.hp - dmg);
    sparks(h.x, h.y - 6, '#b99464', 5);
    if (h.hp > 0) return;
    h.alive = false;
    G.world.deco[h.tile] = 0; G.worldVer++;
    for (const a of G.animals) if (a.kind === 'native' && a.home === h.tile) { a.retreat = true; a.repath = 0; }
    LJ.sfx('rock');
    LJ.ui.toast('A forest hut is destroyed. No more locals will come from it.');
  };

  const sparks = (x, y, col, n) => {
    for (let i = 0; i < n; i++) {
      G.parts.push({ x, y, vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90 - 20, t: 0, life: 0.2 + Math.random() * 0.2, col, glow: true });
    }
  };

  // ---------- Lasers: bursts of fast bolts that travel, spread a little, and can miss ----------
  // src: anything with x, y (and optionally dir, muzzleY, and an owner whose muzzle flashes); target: an animal or forest folk.
  C.burst = function (src, target, o) {
    G.bursts.push({ src, target, left: o.n, t: 0, dmg: o.dmg, col: o.col, spread: o.spread || 5, lead: !!o.lead });
  };
  C.cancelBurst = function (src) { G.bursts = G.bursts.filter(b => b.src !== src); };
  function fireBolt(b) {
    const s = b.src, tg = b.target;
    const sx = s.x + (s.dir || 0) * 8, sy = s.y - (s.muzzleY === undefined ? 9 : s.muzzleY);
    // A tower's gunner leads a moving target: he aims where it will be when the bolt gets there. Pistols do not.
    const fly = b.lead && G.time - tg.movedT < 0.2 ? Math.hypot(tg.x - sx, tg.y - 6 - sy) / BOLT_SPEED : 0;
    const tx = tg.x + (tg.vx || 0) * fly + (Math.random() - 0.5) * b.spread * 2, ty = tg.y - 6 + (tg.vy || 0) * fly + (Math.random() - 0.5) * b.spread * 2;
    const d = Math.hypot(tx - sx, ty - sy) || 1;
    G.bolts.push({ x0: sx, y0: sy, x1: tx, y1: ty, t: 0, dur: d / BOLT_SPEED, col: b.col, dmg: b.dmg, target: tg, from: s.owner || s });
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
      if (tg.alive && Math.hypot(tg.x - bo.x1, tg.y - 6 - bo.y1) < 10) { LJ.hurtAnimal(tg, bo.dmg, bo.from); sparks(bo.x1, bo.y1, bo.col, 6); }
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
      b.cd = TOWER.cd;
      C.burst(b.muzzle, best, { n: G.up.twin ? TOWER.twin : TOWER.bolts, dmg: TOWER.dmg, col: '#4ae8ff', spread: 4, lead: true });
    }
  }

  // ---------- Arrows ----------
  // tg is { u: unit } or { b: building }.
  function aimPoint(tg) {
    if (tg.u) return [tg.u.x, tg.u.y - 6];
    return LJ.bldCenter(tg.b);
  }
  function shootArrow(a, tg) {
    const [px, py] = aimPoint(tg), tx = px + (Math.random() - 0.5) * 10, ty = py + (Math.random() - 0.5) * 8;
    const sx = a.x + a.dir * 6, sy = a.y - 7, d = Math.hypot(tx - sx, ty - sy) || 1;
    G.arrows.push({ x0: sx, y0: sy, x1: tx, y1: ty, t: 0, dur: d / ARROW_SPEED, dmg: a.dmg, tg, from: a });
    LJ.sfx('arrow');
  }
  // Shoots and starts the bow's cooldown.
  function loose(a, tg) { a.shootCd = a.cd * (0.8 + Math.random() * 0.4); a.aim = 0.35; shootArrow(a, tg); }
  function updArrows(dt) {
    for (const ar of G.arrows) {
      ar.t += dt;
      if (ar.t < ar.dur || ar.done) continue;
      ar.done = true;
      const tg = ar.tg;
      if (tg.u) { if (!tg.u.dead && Math.hypot(tg.u.x - ar.x1, tg.u.y - 6 - ar.y1) < (tg.u.kind === 'jack' ? 10 : 18)) LJ.hurtUnit(tg.u, ar.dmg, ar.from); }
      else if (!tg.b.dead) LJ.damageBuilding(tg.b, ar.dmg * ARROW_VS_WOOD, ar.from);
    }
    if (G.arrows.length) G.arrows = G.arrows.filter(a => a.t < a.dur + 0.4); // spent arrows lie on the ground briefly
  }

  // ---------- The forest folk ----------
  const distTo = (C.distTo = function (a, tg) {
    if (tg.u) return Math.hypot(tg.u.x - a.x, tg.u.y - a.y);
    const b = tg.b, x0 = b.tx * TS, y0 = b.ty * TS, x1 = (b.tx + b.w) * TS, y1 = (b.ty + b.h) * TS;
    return Math.hypot(a.x - LJ.clamp(a.x, x0, x1), a.y - LJ.clamp(a.y, y0, y1));
  });
  // Hostiles stop for the nearest part of the operation, without preferring a kind.
  // Hut defenders still protect only the area around their home.
  const pickTarget = (C.pickTarget = function (a, hut) {
    const nearby = tg => !hut || distTo(hut, tg) <= 8 * TS;
    const u = LJ.nearest(G.units, a.x, a.y, Infinity, u => !u.dead && nearby({ u }));
    let best = u ? { u } : null, bd = best ? distTo(a, best) : Infinity;
    for (const b of G.buildings) {
      if (b.dead || !nearby({ b })) continue;
      const d = distTo(a, { b });
      if (d < bd) { bd = d; best = { b }; }
    }
    return best;
  });
  function goalFor(tg) {
    if (tg.u) { const tx = colOf(tg.u.tile), ty = rowOf(tg.u.tile); return c => Math.abs(colOf(c) - tx) <= 1 && Math.abs(rowOf(c) - ty) <= 1; }
    const b = tg.b;
    return c => { const x = colOf(c), y = rowOf(c); return x >= b.tx - 1 && x <= b.tx + b.w && y >= b.ty - 1 && y <= b.ty + b.h; };
  }

  // Walks an enemy along its path; returns the palisade tile in the way, or -1. Used by wolves and bears too.
  const march = (LJ.march = function (a, dt, speed, exactLast = false) {
    let dist = speed * dt, wall = -1;
    const x0 = a.x, y0 = a.y;
    while (dist > 0 && a.path.length) {
      const n = a.path[a.path.length - 1];
      wall = LJ.wallInWay(a.tile, n);
      if (wall >= 0) break;
      const px = colOf(n) * TS + 8, py = rowOf(n) * TS + 10, dx = px - a.x, dy = py - a.y, d = Math.hypot(dx, dy);
      // A flock follows a corridor, not a single-file chain of exact pixel centres.
      // Passing through the waypoint's tile is enough; forcing its centre fights
      // separation and can leave a whole pack circling the same point.
      if (LJ.tileOfPx(a.x, a.y) === n && d < 12 && (!exactLast || a.path.length > 1)) { a.path.pop(); a.tile = n; continue; }
      // Separation may have moved us off the planned corridor. Validate the real
      // step, including corner clearance, before following an old waypoint.
      const step = Math.min(d, dist), nx = a.x + dx / d * step, ny = a.y + dy / d * step;
      const from = LJ.tileOfPx(a.x, a.y), to = LJ.tileOfPx(nx, ny);
      const fx = colOf(from), fy = rowOf(from), tx = colOf(to), ty = rowOf(to);
      if (!LJ.wildPass(to) || (fx !== tx && fy !== ty &&
          (!LJ.wildPass(fy * G.world.W + tx) || !LJ.wildPass(ty * G.world.W + fx)))) {
        a.tile = from; a.repath = 0; break;
      }
      if (Math.abs(dx) > 0.01) a.dir = dx > 0 ? 1 : -1;
      if (d <= dist) { a.x = px; a.y = py; dist -= d; a.path.pop(); a.tile = n; }
      else { a.x = nx; a.y = ny; dist = 0; }
    }
    a.vx = (a.x - x0) / dt; a.vy = (a.y - y0) / dt; a.movedT = G.time; // for whoever is aiming at it
    if (wall < 0) a.walkT += dt;
    return wall;
  });

  function updFolk(a, dt) {
    a.shootCd -= dt; a.retarget -= dt; a.repath -= dt; a.aim = Math.max(0, a.aim - dt); a.hitCd -= dt;
    const hut = a.defender && C.hutAt(a.home);
    if (a.defender && !hut) a.retreat = true;
    if (a.retreat) {
      if (a.tile === a.home && !a.path.length) { a.alive = false; return; } // gone back into the forest
      if (a.repath <= 0) { a.repath = 1.5; a.path = LJ.enemyPath(a.tile, c => c === a.home) || []; }
      if (march(a, dt, a.speed * 1.2) >= 0 || !a.path.length) a.alive = false;
      return;
    }
    if (!a.tg || a.retarget <= 0 || (a.tg.u && a.tg.u.dead) || (a.tg.b && a.tg.b.dead)) {
      const tg = pickTarget(a, hut), same = a.tg && tg && a.tg.u === tg.u && a.tg.b === tg.b;
      if (!same) { a.tg = tg; a.repath = 0; } // only re-plan the route when the target actually changed
      a.retarget = 1;
    }
    if (!a.tg) {
      if (!hut) { a.retreat = true; return; }
      if (a.repath <= 0) { a.repath = 1.2; a.path = LJ.enemyPath(a.tile, c => c === a.home) || []; }
      march(a, dt, a.speed);
      return;
    }
    if (distTo(a, a.tg) <= FOLK_RANGE) {
      const [px] = aimPoint(a.tg);
      if (a.aim <= 0) a.dir = px > a.x ? 1 : -1;
      if (a.shootCd <= 0) loose(a, a.tg);
      return;
    }
    if (a.repath <= 0) { a.repath = 1.2; a.path = LJ.enemyPath(a.tile, goalFor(a.tg)) || []; } // on the timer only, even after a failed search
    const wall = march(a, dt, a.speed * (a.wave ? WARRIOR.march : 1));
    if (wall >= 0 && a.hitCd <= 0) { a.hitCd = 0.8; a.aim = 0.25; LJ.damageWall(wall, LJ.FOE.native.wallDmg); } // hack through the palisade
  }

  // ---------- Waves ----------
  const folkStats = lv => ({ hp: 22 + lv * 4, dmg: 5 + lv * 0.8, speed: 38 + lv, cd: Math.max(1.2, 1.9 - lv * 0.05) });
  function addFolk(tile, home, extra) {
    const st = folkStats(G.level);
    G.animals.push(Object.assign({
      kind: 'native', x: colOf(tile) * TS + 4 + Math.random() * 8, y: rowOf(tile) * TS + 8 + Math.random() * 4, tile, home,
      path: [], hp: st.hp, max: st.hp, dmg: st.dmg, speed: st.speed * (0.9 + Math.random() * 0.2), cd: st.cd,
      shootCd: Math.random() * 2, retarget: Math.random(), repath: Math.random(), aim: 0, hitCd: 0, dir: 1, walkT: Math.random(), alive: true
    }, extra));
  }
  function updHuts(dt) {
    for (const h of G.huts) {
      if (!h.alive) continue;
      if (!h.angry && G.units.some(u => !u.dead && Math.hypot(u.x - h.x, u.y - h.y) <= 6 * TS)) C.angerHut(h);
      if (!h.angry) continue;
      h.spawnCd = Math.max(0, h.spawnCd - dt);
      if (h.spawnCd > 0) continue;
      const guards = G.animals.filter(a => a.alive && a.defender && a.home === h.tile).length;
      for (let k = guards; k < 2; k++) {
        const tile = h.tile + (k ? 1 : -1);
        addFolk(LJ.wildPass(tile) && !G.world.wall[tile] ? tile : h.tile, h.tile, { defender: true });
      }
      h.spawnCd = 20;
    }
  }
  const gap = () => Math.max(RAIDS.recovery, Math.round((190 - G.level * 8) * (0.8 + Math.random() * 0.4)));
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
      const c = st.pop(), cx = colOf(c), cy = rowOf(c);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, n = ny * Wd + nx;
        if (nx >= 0 && ny >= 0 && nx < Wd && ny < w.H && !reach[n] && LJ.wildPass(n)) { reach[n] = 1; st.push(n); }
      }
    }
    const ok = i => {
      const x = colOf(i), y = rowOf(i);
      if (Math.hypot(x - b.tx, y - b.ty) < 18) return false;
      if (G.units.some(u => Math.hypot(u.x / TS - x, u.y / TS - y) < 8)) return false;
      let trees = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const n = (y + dy) * Wd + x + dx; if (n >= 0 && n < w.N && LJ.isTree(n)) trees++; }
      return trees >= 4 && reach[i] === 1;
    };
    const huts = G.huts.filter(h => h.alive).slice().sort(() => Math.random() - 0.5);
    for (const h of huts) if (ok(h.tile)) return h.tile;
    return -1;
  }

  function spawnWave() {
    const wv = G.wave, w = G.world, Wd = w.W;
    const crew = LJ.jacks(), fit = crew.filter(u => u.hp >= LJ.maxHpOf(u) * 0.5).length;
    const guards = G.animals.filter(a => a.alive && a.defender && !a.retreat && a.tg).length;
    // Finish one encounter before starting another; losses and wounds leave room to recover.
    if (!fit || fit < Math.ceil(crew.length / 2) || guards >= RAIDS.busyGuards ||
        G.animals.some(a => a.alive && LJ.FOE[a.kind].wild)) {
      wv.next = G.time + RAIDS.retry; return;
    }
    const at = findSpawn();
    if (at < 0) { wv.next = G.time + 30; return; }
    wv.n++;
    const late = treesLeft() < G.total * 0.02;
    const capacity = Math.min(late ? 6 : RAIDS.max, 2 + Math.floor(fit * 0.75), RAIDS.max - guards);
    const size = Math.max(3, Math.min(capacity, Math.round((2 + G.level) * (0.85 + Math.random() * 0.3))));
    const x0 = colOf(at), y0 = rowOf(at), st = folkStats(G.level);
    for (let k = 0; k < size; k++) {
      let i = at;
      for (let t = 0; t < 12; t++) {
        const x = x0 + ((Math.random() * 5) | 0) - 2, y = y0 + ((Math.random() * 5) | 0) - 2, n = y * Wd + x;
        if (x > 0 && y > 0 && x < Wd && y < w.H && LJ.wildPass(n)) { i = n; break; }
      }
      addFolk(i, at, { wave: wv.n, hp: st.hp * WARRIOR.hp, max: st.hp * WARRIOR.hp });
    }
    wv.active = { size, start: G.time, retreating: false };
    LJ.sfx('drum'); LJ.voice.cue('folk_warcry');
    LJ.ui.toast('War drums! ' + size + ' forest folk are marching on the village from the ' + compass(x0, y0) + '!');
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
  C.nextWaveIn = () => (G.wave.hostile && !G.wave.active && treesLeft() >= 4 && G.huts.some(h => h.alive) ? Math.max(0, G.wave.next - G.time) : null);

  // When they break into the village they carry off part of the stock, then leave.
  C.raid = function () {
    const take = k => { const n = Math.floor(G[k] * 0.3); G[k] -= n; return n; };
    const wd = take('wood'), lm = take('lumber');
    LJ.ui.toast('The forest folk raided the village and carried off ' + wd + ' wood' + (lm ? ' and ' + lm + ' lumber' : '') + '!');
    LJ.sfx('no'); LJ.voice.cue('folk_raid');
    for (const a of G.animals) if (a.kind === 'native' && !a.defender) { a.retreat = true; a.repath = 0; }
    if (G.wave.active) G.wave.active.retreating = true;
  };

  C.update = function (dt) {
    updHuts(dt);
    for (const u of G.units) if (u.flash > 0) u.flash -= dt;
    for (const a of G.animals) if (a.alive && a.kind === 'native') updFolk(a, dt);
    LJ.separateFlock(G.animals, dt, true);
    updTowers(dt);
    updLasers(dt);
    updArrows(dt);
    updWaves();
  };
})();
