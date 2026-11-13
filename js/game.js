'use strict';
// Game state and simulation: jacks, vehicles, the village economy, wildlife and the ten levels.
(function () {
  const TS = LJ.TS, T = LJ.T, STUMP = LJ.STUMP;
  const G = (LJ.G = {});
  const PRICE = (LJ.PRICE = { wood: 3, lumber: 10, stone: 6 });
  const MAX_LEVEL = 10, WAGE = 20, PAY_EVERY = 60, SAW_TIME = 3.5;
  // Share of the forest that must be cleared to complete each of the 10 levels.
  const FR = [0.005, 0.03, 0.07, 0.12, 0.19, 0.28, 0.4, 0.55, 0.74, 0.965];
  // Per species: seconds to chop with a plain axe, and wood yield. Oaks are slow but rich.
  const SPECIES = [null, { t: 3.6, y: 3 }, { t: 6, y: 6 }, { t: 4.5, y: 4 }];
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  const NAMES = ['Jacques', 'Jackie', 'Big Jack', 'Jack Jr.', 'Jaq', 'Old Jack', 'Jax', 'Jacko', 'Lil Jack', 'Jackson', 'Jacqueline', 'Jock'];
  const VEH = (LJ.VEH = {
    truck: { name: 'Truck', wage: 10, cap: () => (G.up.mega ? 120 : 60), max: 3 },
    dozer: { name: 'Bulldozer', wage: 15, cap: () => 0, max: 2 },
    harv: { name: 'Harvester', wage: 30, cap: () => (G.up.mega ? 60 : 40), max: 3 }
  });
  let w, W, H, vis, par, q, stamp = 0;

  const jacks = () => G.units.filter(u => u.kind === 'jack');
  const countKind = k => G.units.filter(u => u.kind === k).length;
  const jackCount = () => jacks().length + (G.village ? G.village.queue.length : 0);
  const popCap = () => 4 + 3 * (G.up.bunk || 0);
  const canChop = u => u.kind === 'jack' || u.kind === 'harv';
  LJ.jackCount = jackCount; LJ.popCap = popCap; LJ.WAGE = WAGE; LJ.jacks = jacks; LJ.countKind = countKind;

  const vehItem = (id, level, m, desc, icon) => ({
    id, name: VEH[id].name, desc: desc + ' Upkeep $' + VEH[id].wage + ' per payday.', icon, level, need: 'village', repeat: true,
    cost: () => ({ m: m + Math.round(m * 0.5) * countKind(id) }), can: () => countKind(id) < VEH[id].max, full: 'Max ' + VEH[id].max
  });
  const SHOP = (LJ.SHOP = [
    { id: 'sharpaxe', name: 'Sharper Axes', desc: 'Chop 35% faster.', icon: 'axe', level: 1, cost: () => ({ m: 40 }) },
    { id: 'sling', name: 'Log Sling', desc: 'Carry 14 instead of 8.', icon: 'bag', level: 1, cost: () => ({ m: 50 }) },
    { id: 'boots', name: 'Sturdy Boots', desc: 'Walk 25% faster.', icon: 'boot', level: 1, cost: () => ({ m: 70 }) },
    { id: 'village', name: 'Village', desc: 'Stores wood, saws lumber, houses jacks. Build it close to the trees.', icon: 'village', level: 1, cost: () => ({ m: 120, w: 20 }), place: [3, 3] },
    { id: 'jack', name: 'Hire a Jack', desc: 'Another pair of hands. Wants $' + WAGE + ' every payday.', icon: 'jack', level: 2, need: 'village', repeat: true,
      cost: () => ({ m: 80 + 40 * (jackCount() - 1) }), can: () => jackCount() < popCap(), full: 'Village full' },
    { id: 'rifles', name: 'Hunting Rifles', desc: 'Jacks shoot wild animals from a distance.', icon: 'rifle', level: 2, cost: () => ({ m: 150 }) },
    { id: 'barrow', name: 'Wheelbarrows', desc: 'Jacks carry 24.', icon: 'barrow', level: 2, need: 'sling', cost: () => ({ m: 160, w: 20 }) },
    { id: 'chainsaw', name: 'Chainsaws', desc: 'Chop twice as fast. Loud.', icon: 'chainsaw', level: 3, need: 'sharpaxe', cost: () => ({ m: 300 }) },
    vehItem('truck', 3, 350, 'Hauls 60 goods per trip from village to market.', 'truck'),
    { id: 'bunk', name: 'Bunkhouse', desc: 'Room for 3 more jacks.', icon: 'bunk', level: 3, need: 'village', repeat: true,
      cost: () => ({ m: 250 + 250 * (G.up.bunk || 0), l: 15 }), can: () => (G.up.bunk || 0) < 2, full: 'Max 2' },
    vehItem('dozer', 4, 600, 'Clears rocks (for stone) and fills in rivers so you can reach new forest.', 'dozer'),
    { id: 'depot', name: 'Log Depot', desc: 'Extra drop-off point for wood. Place it far out in the forest.', icon: 'depot', level: 4, need: 'village', repeat: true,
      cost: () => ({ m: 150, l: 10 }), can: () => G.depots < 4, full: 'Max 4', place: [2, 2] },
    { id: 'foreman', name: 'Foreman', desc: 'Idle jacks and harvesters find the nearest trees on their own.', icon: 'hat', level: 5, cost: () => ({ m: 500 }) },
    { id: 'dispatch', name: 'Dispatcher', desc: 'Trucks keep hauling on their own whenever there are goods.', icon: 'clip', level: 5, need: 'truck', cost: () => ({ m: 450 }) },
    vehItem('harv', 6, 900, 'A machine that fells and carries trees by itself. Wolves ignore it.', 'harv'),
    { id: 'scope', name: 'Scoped Rifles', desc: 'Longer range, harder hits.', icon: 'rifle', level: 6, need: 'rifles', cost: () => ({ m: 400 }) },
    { id: 'steam', name: 'Steam Sawmill', desc: 'The village saws lumber by itself.', icon: 'blade', level: 7, need: 'village', cost: () => ({ m: 1200, l: 40 }) },
    { id: 'turbo', name: 'Turbo Harvesters', desc: 'Harvesters fell trees 40% faster and drive faster.', icon: 'harv', level: 8, need: 'harv', cost: () => ({ m: 1500 }) },
    { id: 'mega', name: 'Mega Haulers', desc: 'Trucks carry 120, harvesters 60.', icon: 'truck', level: 9, need: 'truck', cost: () => ({ m: 1500 }) }
  ]);

  const Q_NORMAL = ['Yes, boss?', 'Ready to chop!', 'Timber?', 'Axe me anything.', "What'll it be?", 'Wood you like something?'];
  const Q_ANNOYED = ["I'm working here!", 'Stop poking me.', 'Do I poke YOU?', 'That flannel was clean.', "Trees don't cut themselves, you know."];
  const Q_FUNNY = ["I'm a lumberjack and I'm NOT okay.", 'Poke me again and I unionize.', "Fun fact: I'm allergic to pollen.",
    'I wanted to be a florist, you know.', "My therapist says I have a lot of 'bark'.", "One more click and I'm becoming a barista.",
    'HR will hear about this. HR is a squirrel.'];
  const Q_ACK = ['On it!', 'Timber!', 'Chop chop.', 'Right away.', 'Consider it mulch.'];
  const Q_BROKE = ['No pay, no hurry.', 'My axe feels heavy today.', 'I work for money, not exposure.', "I'll chop when the cheque clears."];
  const Q_VEH = {
    truck: ['Honk honk!', 'Beep beep.', '*diesel noises*', 'Loading zone, buddy.'],
    dozer: ['Rrrrumble.', 'I move mountains. Small ones.', 'Rocks fear me.', '*grinding*'],
    harv: ['*mechanical whirring*', 'TREE DETECTED.', 'I replace eleven jacks.', 'Efficiency is beautiful.']
  };

  const isTree = i => w.obj[i] >= 1 && w.obj[i] <= 3;
  const pass = i => { const t = w.type[i]; return t !== T.WATER && t !== T.ROCK && !isTree(i) && w.bld[i] === 0; };
  const blocked = i => w.type[i] === T.WATER || w.type[i] === T.ROCK;
  // Animals slip between the trees; only water, rock and buildings stop them.
  const wildPass = i => !blocked(i) && w.bld[i] === 0;
  // A bulldozer plans its route straight through rock and water.
  const dozePass = i => w.bld[i] === 0 && !isTree(i);
  LJ.isTree = isTree; LJ.pass = pass; LJ.blocked = blocked;

  // How dangerous the forest is at each level: animals get tougher, faster and hunt in bigger packs.
  function wild(level) {
    return {
      every: [Math.max(30, 104 - level * 10), Math.max(45, 134 - level * 11)],
      pack: Math.min(5, 1 + (level >> 1)), hp: 30 + level * 9, dmg: 6 + level * 1.6, speed: 56 + level * 2.5,
      bearChance: level >= 4 ? Math.min(0.5, (level - 3) * 0.1) : 0
    };
  }
  LJ.danger = level => [
    '', '', 'Wolves now hunt in packs.', 'The packs are getting bolder.', 'Bears have woken up. They are not happy.',
    'The animals are getting desperate.', 'Something in the forest is angry.', 'The packs are bigger than ever.',
    'Whatever is left of the forest is fighting back.', 'The last animals have nowhere left to run.'][level - 1] || '';

  LJ.newGame = function (seed) {
    seed = seed || ((Math.random() * 1e9) | 0);
    w = LJ.genWorld(seed); W = w.W; H = w.H;
    vis = new Uint32Array(w.N); par = new Int32Array(w.N); q = new Int32Array(w.N); stamp = 0;
    Object.assign(G, {
      world: w, ground: new LJ.Ground(w), units: [], buildings: [], jobs: [],
      money: 0, wood: 0, lumber: 0, stone: 0, cleared: 0, total: w.totalTrees, level: 1, levelDone: false, up: {},
      time: 0, paused: true, sel: new Set(), floats: [], parts: [], falls: [], bubbles: [], bflies: [],
      nextId: 1, drag: null, tool: 'pointer', exitIdx: w.roadY * W, sold: 0, cam: { x: 0, y: 0 },
      stockpile: false, village: null, depots: 0, place: null, hover: null, order: null, orderCd: 25, payT: PAY_EVERY,
      villMask: new Uint8Array(w.N), storeMask: new Uint8Array(w.N), campMask: new Uint8Array(w.N), smokeT: 0,
      animals: [], graves: [], shots: [], animalCd: 70, kills: 0, earned: 0, jackN: 0, autoT: 0, steamT: 0,
      cine: null, suit: null, props: []
    });
    G.thr = FR.map(f => Math.max(1, Math.round(f * G.total)));
    // Money that must have been earned (in total) before a level counts as complete.
    G.quota = G.thr.map((t, i) => (i ? Math.round((t * 14) / 100) * 100 : 0));
    ring(addBuilding('camp', 2, w.roadY - 3, 2, 2), G.campMask);
    addUnit(w.start.x, w.start.y, 'Jack', 'jack', 0);
    const r = LJ.rng(seed + 5);
    for (let i = 0; i < 400 && G.bflies.length < 60; i++) {
      const x = (r() * W) | 0, y = (r() * H) | 0;
      if (w.type[y * W + x] === T.GRASS) {
        G.bflies.push({ x: x * TS + 8, y: y * TS + 8, tx: x * TS + 8, ty: y * TS + 8, t: 0, col: ['#fff', '#ffd84a', '#ff9ad0', '#9ad0ff'][(r() * 4) | 0], ph: r() * 6 });
      }
    }
    G.ground.renderAll();
  };

  function addBuilding(kind, tx, ty, bw, bh) {
    const b = { kind, tx, ty, w: bw, h: bh, queue: [] };
    G.buildings.push(b);
    for (let y = ty; y < ty + bh; y++) for (let x = tx; x < tx + bw; x++) {
      const i = y * W + x;
      w.bld[i] = G.buildings.length; w.obj[i] = 0; w.flower[i] = 0;
    }
    return b;
  }
  // Marks the ring of tiles around a building: where units stand to use it.
  function ring(b, mask) {
    for (let y = b.ty - 1; y <= b.ty + b.h; y++) for (let x = b.tx - 1; x <= b.tx + b.w; x++) {
      if (x >= 0 && y >= 0 && x < W && y < H && !w.bld[y * W + x]) mask[y * W + x] = 1;
    }
  }

  function addUnit(tx, ty, name, kind, wage) {
    const u = {
      id: G.nextId++, kind, x: tx * TS + 8, y: ty * TS + 10, tile: ty * W + tx, path: [], state: 'idle', task: null,
      carry: 0, load: null, dir: 1, wait: 0, walkT: 0, swing: 0, sawT: 0, target: -1, clicks: 0, lastClick: -99,
      lastWhack: -9, name, hired: wage > 0, wage, hp: 100, atkCd: 0, fighting: false
    };
    G.units.push(u);
    return u;
  }

  // Breadth-first search over passable tiles. Returns the path reversed (so units can pop()), or null.
  function bfs(start, goal, canPass, four) {
    const ok = canPass || pass, K = four ? 4 : 8;
    stamp++;
    let qh = 0, qt = 0;
    q[qt++] = start; vis[start] = stamp; par[start] = -1;
    while (qh < qt) {
      const c = q[qh++];
      if (goal(c)) {
        const path = [];
        for (let n = c; n !== start; n = par[n]) path.push(n);
        return path;
      }
      const cx = c % W, cy = (c / W) | 0;
      for (let k = 0; k < K; k++) {
        const nx = cx + DX[k], ny = cy + DY[k];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (vis[n] === stamp || !ok(n)) continue;
        if (k >= 4 && (!ok(cy * W + nx) || !ok(ny * W + cx))) continue; // no corner cutting
        vis[n] = stamp; par[n] = c; q[qt++] = n;
      }
    }
    return null;
  }
  LJ.bfs = bfs;

  const capOf = u => (u && u.kind !== 'jack' ? VEH[u.kind].cap() : G.up.barrow ? 24 : G.up.sling ? 14 : 8);
  // Unpaid hired jacks slack off, and unpaid machines run out of fuel, until the debt is cleared.
  const effort = u => (G.money < 0 && u.hired ? 0.7 : 1);
  function chopTime(t, u) {
    if (u.kind === 'harv') return 1.6 * (G.up.turbo ? 0.6 : 1);
    return SPECIES[w.obj[t]].t * (G.up.sharpaxe ? 0.65 : 1) * (G.up.chainsaw ? 0.5 : 1);
  }
  function speedOf(u) {
    const t = w.type[u.tile], road = t === T.DIRT || t === T.GRAVEL;
    if (u.kind === 'truck') return (road ? 100 : 55) * effort(u);
    if (u.kind === 'dozer') return 36 * effort(u);
    if (u.kind === 'harv') return (G.up.turbo ? 54 : 38) * (road ? 1.2 : 1) * effort(u);
    let s = 50 * effort(u);
    if (G.up.boots) s *= 1.25;
    if (u.carry > 0 || u.load) s *= 0.85;
    if (road) s *= 1.15;
    return s;
  }

  function stepPath(u, dt) {
    let dist = speedOf(u) * dt;
    while (dist > 0 && u.path.length) {
      const n = u.path[u.path.length - 1];
      if (!pass(n)) { u.path = []; u.state = 'think'; return; }
      const tx = (n % W) * TS + 8, ty = ((n / W) | 0) * TS + 10;
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01) u.dir = dx > 0 ? 1 : -1;
      if (d <= dist) {
        u.x = tx; u.y = ty; dist -= d; u.path.pop(); u.tile = n;
        // Feet (and tyres, much faster) wear the grass down into trails.
        if (w.type[n] === T.GRASS && (w.wear[n] += u.kind === 'jack' ? 1 : 4) >= 10) { w.type[n] = T.DIRT; markAround(n, 1); }
      } else { u.x += (dx / d) * dist; u.y += (dy / d) * dist; dist = 0; }
    }
    u.walkT += dt;
  }

  function markAround(i, r) {
    const cx = i % W, cy = (i / W) | 0;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (x >= 0 && y >= 0 && x < W && y < H) G.ground.mark(y * W + x);
    }
  }
  LJ.markAround = markAround;

  function release(u) {
    if (u.target >= 0 && w.claim[u.target] === u.id) w.claim[u.target] = 0;
    u.target = -1;
  }
  function endTask(u) { release(u); u.task = null; u.state = 'idle'; }
  function face(u, px) { if (Math.abs(px - u.x) > 2) u.dir = px > u.x ? 1 : -1; }

  function say(u, text) {
    G.bubbles = G.bubbles.filter(b => { if (b.u === u) { if (b.el) b.el.remove(); return false; } return true; });
    G.bubbles.push({ u, text, t: 2.6 });
  }
  LJ.say = say;
  LJ.float = (x, y, text, cls) => G.floats.push({ x, y, text, cls: cls || '', t: 0 });

  function walkTo(u, goal, state, failMsg) {
    const path = bfs(u.tile, goal);
    if (path) { u.path = path; u.state = state; return true; }
    if (failMsg) say(u, failMsg);
    return false;
  }
  const storeGoal = c => G.storeMask[c] === 1;
  const exitGoal = c => c === G.exitIdx;

  // Finds the nearest standing spot next to one of `tiles` that nobody else has claimed.
  function nearestJobTile(u, tiles, test, four) {
    let found = -1, sawClaimed = false;
    const K = four ? 4 : 8;
    const path = bfs(u.tile, c => {
      const cx = c % W, cy = (c / W) | 0;
      for (let k = 0; k < K; k++) {
        const nx = cx + DX[k], ny = cy + DY[k];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (tiles.has(n) && test(n)) {
          if (w.claim[n] && w.claim[n] !== u.id) sawClaimed = true;
          else { found = n; return true; }
        }
      }
      return false;
    });
    return { path, found, sawClaimed };
  }

  function think(u) {
    const t = u.task;
    if (!t) { u.state = 'idle'; return; }
    if (t.type === 'move') { u.task = null; u.state = 'idle'; return; }
    if (t.type === 'hunt') {
      const a = t.a;
      if (!a.alive) { if (t.resume) { setTask(u, t.resume); think(u); } else endTask(u); return; }
      const ax = a.tile % W, ay = (a.tile / W) | 0;
      if (!walkTo(u, c => Math.abs((c % W) - ax) <= 1 && Math.abs(((c / W) | 0) - ay) <= 1, 'hunt')) { u.wait = 0.4; u.state = 'think'; }
      return;
    }
    if (t.type === 'saw') { if (!walkTo(u, c => G.villMask[c] === 1, 'toSaw', "Can't reach the village.")) endTask(u); return; }
    if (t.type === 'haul') {
      const ok = u.load ? walkTo(u, exitGoal, 'haulExit', "Can't reach the road.") : walkTo(u, storeGoal, 'haulStore', "Can't reach the village.");
      if (!ok) endTask(u);
      return;
    }
    if (t.type === 'doze') {
      const job = t.job;
      for (const c of job.tiles) if (!blocked(c)) job.tiles.delete(c);
      if (!job.tiles.size) { say(u, 'All clear!'); endTask(u); return; }
      const r = nearestJobTile(u, job.tiles, blocked, true);
      if (r.path) { w.claim[r.found] = u.id; u.target = r.found; u.path = r.path; u.state = 'toDoze'; }
      else if (r.sawClaimed) { u.wait = 0.6; u.state = 'think'; }
      else { say(u, "Can't get at it from here."); endTask(u); }
      return;
    }
    const job = t.job;
    if (u.carry >= capOf(u)) return goDrop(u);
    if (job.trees.size === 0) { if (u.carry > 0) return goDrop(u); endTask(u); return; }
    const r = nearestJobTile(u, job.trees, isTree, false);
    if (r.path) { w.claim[r.found] = u.id; u.target = r.found; u.path = r.path; u.state = 'toTree'; }
    else if (u.carry > 0) goDrop(u);
    else if (r.sawClaimed) { u.wait = 0.6; u.state = 'think'; }
    else { say(u, "Can't reach those trees, boss."); endTask(u); }
  }

  // Where does chopped wood go? Nearest village or depot if there is one, else the camp pile (stockpiling) or the market road.
  function goDrop(u) {
    const goal = G.village ? storeGoal : G.stockpile ? c => G.campMask[c] === 1 : exitGoal;
    if (!walkTo(u, goal, 'toDrop', "I'm lost!")) { u.wait = 2; u.state = 'think'; }
  }

  function sell(u, wd, lum, st) {
    st = st || 0;
    if (wd + lum + st <= 0) return;
    const gain = wd * PRICE.wood + lum * PRICE.lumber + st * PRICE.stone;
    G.money += gain; G.earned += gain; G.sold += wd + lum + st;
    LJ.float(u.x + 6, u.y - 18, '+$' + gain, 'money');
    LJ.sfx('coin');
    const o = G.order;
    if (o && o.state === 'active') {
      o.got = Math.min(o.qty, o.got + (o.kind === 'wood' ? wd : lum));
      if (o.got >= o.qty) {
        G.money += o.bonus; G.earned += o.bonus; G.order = null; G.orderCd = 45;
        LJ.sfx('level'); LJ.ui.toast('Order delivered! Bonus +$' + o.bonus);
      }
    }
  }

  function deposit(u) {
    if (u.carry <= 0) return;
    if (G.village || G.stockpile) {
      G.wood += u.carry;
      LJ.float(u.x, u.y - 18, '+' + u.carry + ' wood', '');
    } else sell(u, u.carry, 0);
    u.carry = 0;
  }

  function fell(t, u) {
    const tx = t % W, ty = (t / W) | 0, s = w.seed;
    G.falls.push({
      sp: w.obj[t], v: w.variant[t], t: 0, dir: u.x <= tx * TS + 8 ? 1 : -1,
      x: tx * TS + 8 + ((LJ.hash(t, 1, s) * 7) | 0) - 3, y: ty * TS + 13 + ((LJ.hash(t, 2, s) * 5) | 0) - 2
    });
    u.carry += SPECIES[w.obj[t]].y + (w.variant[t] === 2 ? 1 : 0);
    w.obj[t] = STUMP; w.claim[t] = 0; G.cleared++;
    // The land around a felled tree loses some of its lushness - cut enough and it turns to wasteland.
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = tx + dx, y = ty + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.hypot(dx, dy), n = y * W + x;
      if (d <= 3.3) w.lush[n] = Math.max(0, w.lush[n] - 0.2 * (1 - d / 4.2));
      G.ground.mark(n);
    }
    for (const j of G.jobs) if (j.trees) j.trees.delete(t);
    for (let i = 0; i < 8; i++) chip(tx * TS + 8, ty * TS + 6, '#3f8f3a');
    LJ.sfx('fall');
  }

  function checkLevel() {
    if (G.levelDone || G.cleared < G.thr[G.level - 1] || G.earned < G.quota[G.level - 1]) return;
    LJ.sfx('level');
    if (G.level < MAX_LEVEL) {
      G.paused = true; G.level++; G.animalCd = Math.max(G.animalCd, 80);
      LJ.ui.levelUp(SHOP.filter(it => it.level === G.level));
    } else { G.levelDone = true; LJ.ending.start(); }
  }

  function chip(x, y, col) {
    G.parts.push({ x, y, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 40, t: 0, life: 0.5 + Math.random() * 0.3, col });
  }
  LJ.chip = chip;

  // Take goods from storage for a market run. Lumber and stone first; raw wood only if nobody is sawing it.
  function loadUp(u) {
    const cap = capOf(u), o = G.order;
    const lum = Math.min(cap, G.lumber), st = Math.min(cap - lum, G.stone);
    const sawing = G.up.steam || G.units.some(j => j.task && j.task.type === 'saw');
    const wantWood = !sawing || G.wood > 40 || (o && o.state === 'active' && o.kind === 'wood');
    const wd = wantWood ? Math.min(cap - lum - st, G.wood) : 0;
    if (lum + st + wd <= 0) return false;
    G.lumber -= lum; G.stone -= st; G.wood -= wd;
    u.load = { w: wd, l: lum, s: st };
    return true;
  }

  // ---------- Wildlife & combat ----------
  function blood(x, y) { for (let i = 0; i < 5; i++) chip(x, y - 6, '#d5392f'); }

  function hurtAnimal(a, dmg) {
    a.hp -= dmg; blood(a.x, a.y);
    if (a.hp <= 0 && a.alive) {
      a.alive = false; G.kills++;
      const pelt = a.kind === 'bear' ? 40 : 15;
      G.money += pelt; G.earned += pelt;
      LJ.float(a.x, a.y - 12, '+$' + pelt + ' pelt', 'money');
      LJ.sfx('coin');
    }
  }

  function hurtJack(u, dmg, a) {
    if (u.dead) return;
    if (u.hp >= 100 || Math.random() < 0.25) say(u, LJ.pick(a.kind === 'bear' ? ['BEAR!', 'Nice bear. NICE BEAR.'] : ['WOLF!', 'Ow!', 'Bad dog!', 'Get off me!']));
    u.hp -= dmg; blood(u.x, u.y); LJ.sfx('hurt');
    // Jacks nearby drop what they're doing and come to help, then go back to work.
    for (const v of G.units) {
      if (v === u || v.kind !== 'jack' || v.dead || v.fighting || Math.hypot(v.x - u.x, v.y - u.y) > 140) continue;
      const vt = v.task && v.task.type;
      if (vt === 'hunt' || vt === 'move') continue;
      setTask(v, { type: 'hunt', a, resume: v.task });
    }
    if (u.hp > 0) return;
    u.dead = true; release(u);
    G.sel.delete(u);
    G.graves.push({ x: u.x, y: u.y });
    LJ.ui.toast(u.name + ' was eaten by a ' + a.kind + '.');
  }

  // Jacks defend themselves against anything in reach. Returns true while they are busy fighting.
  function defend(u, dt) {
    u.atkCd -= dt;
    if (u.task && u.task.type === 'move') { u.fighting = false; return false; } // an explicit move order means: run!
    const range = G.up.scope ? 120 : G.up.rifles ? 84 : 26;
    let best = null, bd = range;
    for (const a of G.animals) {
      if (!a.alive) continue;
      const d = Math.hypot(a.x - u.x, a.y - u.y);
      if (d < bd) { bd = d; best = a; }
    }
    u.fighting = !!best;
    if (!best) return false;
    face(u, best.x);
    if (u.atkCd <= 0) {
      if (G.up.rifles) {
        u.atkCd = G.up.scope ? 1 : 1.2;
        G.shots.push({ x0: u.x + u.dir * 6, y0: u.y - 8, x1: best.x, y1: best.y - 5, t: 0 });
        LJ.sfx('shot'); hurtAnimal(best, G.up.scope ? 40 : 26);
      } else {
        u.atkCd = 0.9; u.swing = 0.3;
        LJ.sfx('chop'); hurtAnimal(best, G.up.chainsaw ? 18 : G.up.sharpaxe ? 14 : 10);
      }
    }
    return true;
  }

  function spawnPack() {
    const cfg = wild(G.level), js = jacks();
    if (!js.length) return;
    const tgt = LJ.pick(js), tx = tgt.tile % W, ty = (tgt.tile / W) | 0;
    for (let tries = 0; tries < 120; tries++) {
      const ang = Math.random() * 6.283, d = 16 + Math.random() * 8;
      const x = Math.round(tx + Math.cos(ang) * d), y = Math.round(ty + Math.sin(ang) * d);
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
      const i = y * W + x;
      if (!isTree(i) || !bfs(i, c => c === tgt.tile, wildPass)) continue; // they come out of the living forest
      const n = Math.min(cfg.pack, Math.max(1, js.length - 1));
      const bear = Math.random() < cfg.bearChance;
      for (let k = 0; k < (bear ? 1 : n); k++) {
        G.animals.push({
          kind: bear ? 'bear' : 'wolf', x: x * TS + 8 + k * 7, y: y * TS + 10, tile: i, home: i, path: [], target: null,
          hp: cfg.hp * (bear ? 2.5 : 1), max: cfg.hp * (bear ? 2.5 : 1), dmg: cfg.dmg * (bear ? 1.8 : 1),
          speed: cfg.speed * (bear ? 0.85 : 1) * (1 - k * 0.06), repath: k * 0.3, atkCd: 0, dir: 1, walkT: 0, alive: true, flee: false
        });
      }
      LJ.sfx('howl');
      LJ.ui.toast(bear ? 'A bear is coming for ' + tgt.name + '!' : n > 1 ? 'A wolf pack is on the prowl!' : 'A wolf is on the prowl!');
      return;
    }
  }

  function updAnimal(a, dt) {
    a.atkCd -= dt; a.repath -= dt;
    if (!a.flee) {
      if (!a.target || a.target.dead) {
        let bd = 1e9; a.target = null;
        for (const u of G.units) {
          if (u.kind !== 'jack' || u.dead) continue;
          const d = Math.hypot(u.x - a.x, u.y - a.y);
          if (d < bd) { bd = d; a.target = u; }
        }
        if (!a.target) a.flee = true;
      }
    }
    let goal;
    if (a.flee) {
      if (a.tile === a.home && !a.path.length) { a.alive = false; return; } // melts back into the forest
      goal = a.home;
    } else {
      const t = a.target, d = Math.hypot(t.x - a.x, t.y - a.y);
      if (d < 16) {
        a.dir = t.x > a.x ? 1 : -1;
        if (a.atkCd <= 0) { a.atkCd = 0.8; hurtJack(t, a.dmg, a); }
        return;
      }
      goal = t.tile;
      a.stalk = d > 100; // creeps closer first, then charges
    }
    if (a.repath <= 0 || !a.path.length) { a.repath = 0.6; a.path = bfs(a.tile, c => c === goal, wildPass) || []; }
    let dist = a.speed * (a.flee ? 1.2 : a.stalk ? 0.55 : 1) * dt;
    while (dist > 0 && a.path.length) {
      const n = a.path[a.path.length - 1];
      const px = (n % W) * TS + 8, py = ((n / W) | 0) * TS + 10, dx = px - a.x, dy = py - a.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01) a.dir = dx > 0 ? 1 : -1;
      if (d <= dist) { a.x = px; a.y = py; dist -= d; a.path.pop(); a.tile = n; }
      else { a.x += (dx / d) * dist; a.y += (dy / d) * dist; dist = 0; }
    }
    a.walkT += dt;
  }

  function updWild(dt) {
    for (const a of G.animals) if (a.alive) updAnimal(a, dt);
    if (G.animals.some(a => !a.alive)) G.animals = G.animals.filter(a => a.alive);
    for (const s of G.shots) s.t += dt;
    if (G.shots.length) G.shots = G.shots.filter(s => s.t < 0.12);
    if (!G.animals.length && (G.animalCd -= dt) <= 0) {
      const e = wild(G.level).every;
      G.animalCd = e[0] + Math.random() * (e[1] - e[0]);
      spawnPack();
    }
    if (G.units.some(u => u.dead)) {
      G.units = G.units.filter(u => !u.dead);
      if (!jacks().length && !(G.village && G.village.queue.length) && !countKind('harv')) { G.paused = true; LJ.ui.gameOver(); }
    }
  }

  function nearHome(u) {
    const x = u.tile % W, y = (u.tile / W) | 0, v = G.village;
    if (v && Math.abs(x - v.tx - 1) <= 4 && Math.abs(y - v.ty - 1) <= 4) return true;
    return Math.abs(x - 3) <= 3 && Math.abs(y - (w.roadY - 2)) <= 3;
  }

  function dust(u) {
    G.parts.push({ x: u.x + u.dir * 12 + (Math.random() - 0.5) * 8, y: u.y - 2, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 10, t: 0, life: 0.9, col: '#c9b48a', smoke: true });
  }

  function updUnit(u, dt) {
    if (u.kind === 'jack') {
      if (defend(u, dt)) return;
      if (u.hp < 100) u.hp = Math.min(100, u.hp + dt * (nearHome(u) ? 5 : 0.4)); // rest heals fastest at home
    }
    if (u.wait > 0) { u.wait -= dt; return; }
    if (u.path.length) { stepPath(u, dt); return; }
    switch (u.state) {
      case 'idle': break;
      case 'toTree':
        if (isTree(u.target)) { u.state = 'chop'; u.swing = 0; face(u, (u.target % W) * TS + 8); }
        else { release(u); think(u); }
        break;
      case 'chop': {
        const t = u.target;
        if (!isTree(t)) { release(u); think(u); break; }
        u.swing += dt;
        if (u.swing > (u.kind === 'jack' && !G.up.chainsaw ? 0.5 : 0.2)) {
          u.swing = 0; LJ.sfx(u.kind === 'jack' && !G.up.chainsaw ? 'chop' : 'saw');
          chip((t % W) * TS + 8, ((t / W) | 0) * TS + 8, '#e6c88a');
        }
        w.hp[t] -= (dt * effort(u)) / chopTime(t, u);
        if (w.hp[t] <= 0) { fell(t, u); u.target = -1; think(u); }
        break;
      }
      case 'toDrop': deposit(u); think(u); break;
      case 'toSaw':
        if (u.carry) { G.wood += u.carry; u.carry = 0; }
        u.state = 'saw'; u.sawT = 0; face(u, (G.village.tx + 1.5) * TS);
        break;
      case 'saw':
        if (G.wood < 2) { u.swing = 0; break; }
        u.swing += dt; u.sawT += dt * effort(u);
        if (u.swing > 0.5) { u.swing = 0; LJ.sfx('saw'); chip(u.x + u.dir * 6, u.y - 6, '#e6c88a'); }
        if (u.sawT >= SAW_TIME) {
          u.sawT = 0; G.wood -= 2; G.lumber++;
          LJ.float(u.x, u.y - 18, '+1 lumber', '');
        }
        break;
      case 'haulStore':
        if (u.carry) { G.wood += u.carry; u.carry = 0; }
        if (loadUp(u)) think(u);
        else if (u.task && u.task.once) { say(u, 'Nothing to haul yet.'); endTask(u); }
        else u.wait = 1;
        break;
      case 'haulExit':
        sell(u, u.load.w, u.load.l, u.load.s); u.load = null;
        if (u.task && u.task.once) { u.task = null; if (!walkTo(u, storeGoal, 'return')) u.state = 'idle'; }
        else think(u);
        break;
      case 'return': u.state = 'idle'; break;
      case 'toDoze':
        if (blocked(u.target)) { u.state = 'doze'; u.sawT = 0; face(u, (u.target % W) * TS + 8); }
        else { release(u); think(u); }
        break;
      case 'doze': {
        const t = u.target;
        if (!blocked(t)) { release(u); think(u); break; }
        const rock = w.type[t] === T.ROCK;
        u.sawT += dt * effort(u); u.swing += dt;
        if (u.swing > 0.15) { u.swing = 0; dust(u); }
        if (u.sawT >= (rock ? 2.5 : 4)) {
          w.type[t] = T.GRAVEL; w.obj[t] = 0; markAround(t, 2);
          if (rock) { G.stone += 2; LJ.float(u.x, u.y - 18, '+2 stone', ''); }
          LJ.sfx('rock');
          if (u.task && u.task.job) u.task.job.tiles.delete(t);
          release(u); think(u);
        }
        break;
      }
      default: think(u);
    }
  }

  // ---------- Commands ----------
  function setTask(u, task) {
    release(u);
    if (u.load) { G.wood += u.load.w; G.lumber += u.load.l; G.stone += u.load.s || 0; u.load = null; }
    u.task = task; u.path = []; u.wait = 0; u.state = 'think';
  }

  LJ.cmd = {
    chop(units, trees) {
      units = units.filter(canChop);
      if (!units.length || !trees.length) return null;
      const job = { trees: new Set(trees), rect: null };
      G.jobs.push(job);
      for (const u of units) setTask(u, { type: 'clear', job });
      if (Math.random() < 0.5) say(units[0], LJ.pick(units[0].kind === 'jack' ? Q_ACK : Q_VEH[units[0].kind]));
      return job;
    },
    // Trees in the box go to jacks and harvesters; rocks and water go to bulldozers.
    area(units, x0, y0, x1, y1) {
      const trees = [], rocks = [];
      const ax = LJ.clamp(Math.floor(Math.min(x0, x1) / TS), 0, W - 1), bx = LJ.clamp(Math.floor(Math.max(x0, x1) / TS), 0, W - 1);
      const ay = LJ.clamp(Math.floor(Math.min(y0, y1) / TS), 0, H - 1), by = LJ.clamp(Math.floor(Math.max(y0, y1) / TS), 0, H - 1);
      for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) {
        const i = y * W + x;
        if (isTree(i)) trees.push(i); else if (blocked(i)) rocks.push(i);
      }
      let n = 0;
      const job = trees.length && LJ.cmd.chop(units, trees);
      if (job) { job.rect = [ax, ay, bx, by]; n += trees.length; }
      const dz = units.filter(u => u.kind === 'dozer');
      if (dz.length && rocks.length) { LJ.cmd.doze(dz, rocks, [ax, ay, bx, by]); n += rocks.length; }
      return n;
    },
    // Bulldoze a straight-ish line of rock/water to reach a target tile.
    dozeTo(units, idx) {
      const dz = units.filter(u => u.kind === 'dozer');
      if (!dz.length) return false;
      const path = bfs(dz[0].tile, c => c === idx, dozePass, true);
      if (!path) { say(dz[0], "Can't get there."); return false; }
      const tiles = path.filter(blocked);
      if (!tiles.length) { LJ.cmd.move(dz, idx); return true; }
      LJ.cmd.doze(dz, tiles, null);
      return true;
    },
    doze(units, tiles, rect) {
      const job = { tiles: new Set(tiles), rect };
      G.jobs.push(job);
      for (const u of units) setTask(u, { type: 'doze', job });
      say(units[0], LJ.pick(Q_VEH.dozer));
    },
    move(units, idx) {
      for (const u of units) {
        const path = bfs(u.tile, c => c === idx);
        if (path) { setTask(u, { type: 'move' }); u.path = path; u.state = 'move'; }
        else say(u, "Can't get there.");
      }
    },
    // Without a village: walk whatever you carry to the market. With one: become a hauler.
    sell(units) {
      units = units.filter(u => u.kind === 'jack' || u.kind === 'truck');
      for (const u of units) {
        if (G.village) setTask(u, { type: 'haul', once: u.kind === 'truck' && !G.up.dispatch });
        else if (u.carry > 0) { setTask(u, null); if (!walkTo(u, exitGoal, 'sellRun', "I'm lost!")) u.state = 'idle'; }
      }
      if (G.village && units.length) say(units[0], units[0].kind === 'truck' ? 'Honk honk!' : 'To market!');
    },
    hunt(units, a) {
      units = units.filter(u => u.kind === 'jack');
      for (const u of units) setTask(u, { type: 'hunt', a });
      if (units.length) say(units[0], LJ.pick(['Here, doggy...', "It's flannel time.", 'For the forest! Wait.']));
    },
    saw(units) {
      if (!G.village) return;
      units = units.filter(u => u.kind === 'jack');
      for (const u of units) setTask(u, { type: 'saw' });
      if (units.length) say(units[0], 'Sawdust time.');
    },
    stop(units) { for (const u of units) { setTask(u, null); u.state = 'idle'; } }
  };

  // Tapping a tree that is being chopped lands an extra whack.
  LJ.whack = function (t) {
    const u = G.units.find(j => j.kind === 'jack' && j.state === 'chop' && j.target === t && !j.path.length);
    if (!u) return false;
    if (G.time - u.lastWhack < 0.25) return true;
    u.lastWhack = G.time; u.swing = 0.3;
    w.hp[t] -= 0.09;
    for (let i = 0; i < 5; i++) chip((t % W) * TS + 8, ((t / W) | 0) * TS + 8, '#ffe9a8');
    LJ.sfx('chop');
    if (w.hp[t] <= 0) { fell(t, u); u.target = -1; think(u); }
    return true;
  };

  LJ.poke = function (u) {
    u.clicks = G.time - u.lastClick < 4 ? u.clicks + 1 : 0;
    u.lastClick = G.time;
    if (u.kind !== 'jack') { say(u, LJ.pick(Q_VEH[u.kind])); return; }
    say(u, LJ.pick(G.money < 0 && u.hired ? Q_BROKE : u.clicks < 3 ? Q_NORMAL : u.clicks < 6 ? Q_ANNOYED : Q_FUNNY));
  };

  // ---------- Shop & building ----------
  function owned(id) {
    if (id === 'village') return !!G.village;
    if (VEH[id]) return countKind(id) > 0;
    if (id === 'depot') return G.depots > 0;
    return !!G.up[id];
  }
  const costText = c => '$' + c.m + (c.w ? ' + ' + c.w + ' wood' : '') + (c.l ? ' + ' + c.l + ' lumber' : '');
  const afford = c => G.money >= c.m && G.wood >= (c.w || 0) && G.lumber >= (c.l || 0);
  LJ.shopState = function (it) {
    const c = it.cost(), ct = costText(c);
    if (!it.repeat && owned(it.id)) return { st: 'owned', label: '✓', costText: ct };
    if (it.level > G.level) return { st: 'locked', label: 'Level ' + it.level, costText: ct };
    if (it.need && !owned(it.need)) return { st: 'locked', label: 'Needs ' + SHOP.find(s => s.id === it.need).name, costText: ct };
    if (it.can && !it.can()) return { st: 'locked', label: it.full, costText: ct };
    if (!afford(c)) return { st: 'cant', label: ct, costText: ct };
    return { st: 'ok', label: ct, costText: ct };
  };
  function pay(c) { G.money -= c.m; G.wood -= c.w || 0; G.lumber -= c.l || 0; }

  function spawnVehicle(kind) {
    const n = countKind(kind) + 1;
    const u = addUnit(G.exitIdx % W, (G.exitIdx / W) | 0, VEH[kind].name + (VEH[kind].max > 1 ? ' ' + n : ''), kind, VEH[kind].wage);
    // Delivered by road; drives up to the village to park.
    walkTo(u, storeGoal, 'return');
    say(u, LJ.pick(Q_VEH[kind]));
    return u;
  }

  LJ.buy = function (id) {
    const it = SHOP.find(s => s.id === id);
    if (!it || LJ.shopState(it).st !== 'ok') { LJ.sfx('no'); return false; }
    if (it.place) { G.place = { kind: id, w: it.place[0], h: it.place[1] }; return 'place'; }
    pay(it.cost());
    if (id === 'jack') G.village.queue.push({ t: 10, total: 10 });
    else if (VEH[id]) spawnVehicle(id);
    else if (it.repeat) G.up[id] = (G.up[id] || 0) + 1;
    else G.up[id] = true;
    if (id === 'dispatch') for (const u of G.units) if (u.task && u.task.type === 'haul') u.task.once = false;
    LJ.sfx('build');
    return true;
  };

  LJ.canPlace = function (tx, ty) {
    const p = G.place;
    for (let y = ty; y < ty + p.h; y++) for (let x = tx; x < tx + p.w; x++) {
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
      if (!pass(y * W + x)) return false;
      if (x < 4 && Math.abs(y - w.roadY) < 2) return false;
    }
    return true;
  };

  LJ.tryPlace = function (tx, ty) {
    if (!G.place || !LJ.canPlace(tx, ty)) { LJ.sfx('no'); return false; }
    const p = G.place, it = SHOP.find(s => s.id === p.kind), c = it.cost();
    if (!afford(c)) { G.place = null; LJ.sfx('no'); return false; }
    const b = addBuilding(p.kind, tx, ty, p.w, p.h), mask = new Uint8Array(w.N);
    ring(b, mask);
    if (!bfs(G.exitIdx, n => mask[n] === 1)) { // must be reachable from the road
      G.buildings.pop();
      for (let y = ty; y < ty + p.h; y++) for (let x = tx; x < tx + p.w; x++) w.bld[y * W + x] = 0;
      LJ.sfx('no'); return false;
    }
    pay(c);
    for (let i = 0; i < w.N; i++) if (mask[i]) G.storeMask[i] = 1;
    if (p.kind === 'village') { G.village = b; G.villMask = mask; G.orderCd = 25; G.payT = PAY_EVERY; }
    else G.depots++;
    G.place = null;
    for (let y = ty; y < ty + p.h; y++) for (let x = tx; x < tx + p.w; x++) w.type[y * W + x] = T.DIRT;
    markAround((ty + 1) * W + tx + 1, 3);
    // Anyone standing on the building site steps aside.
    for (const u of G.units) {
      if (w.bld[u.tile]) {
        const pth = bfs(u.tile, n => pass(n));
        if (pth && pth.length) { u.tile = pth[0]; u.x = (u.tile % W) * TS + 8; u.y = ((u.tile / W) | 0) * TS + 10; }
        u.path = []; if (u.state !== 'idle') u.state = 'think';
      }
    }
    LJ.sfx('build');
    return true;
  };

  LJ.acceptOrder = function (yes) {
    const o = G.order;
    if (!o || o.state !== 'offer') return;
    if (yes) { o.state = 'active'; LJ.sfx('click'); } else { G.order = null; G.orderCd = 40; }
  };

  LJ.statusOf = function (u) {
    const moving = u.path.length > 0;
    if (u.kind === 'truck') {
      return { haulStore: moving ? 'Driving to the village' : 'Loading', haulExit: 'Driving to market', return: 'Returning to the village', move: 'Driving' }[u.state] ||
        (G.up.dispatch ? 'Waiting for goods' : 'Parked');
    }
    if (u.kind === 'dozer') return { toDoze: 'Driving to the rocks', doze: 'Bulldozing', move: 'Driving', return: 'Driving' }[u.state] || 'Parked';
    if (u.kind === 'harv') return { chop: 'Harvesting', toTree: 'Driving to the trees', toDrop: 'Unloading', move: 'Driving', return: 'Driving' }[u.state] || 'Idle';
    switch (u.state) {
      case 'chop': return 'Chopping';
      case 'toTree': return 'Walking to a tree';
      case 'toDrop': return G.village ? 'Carrying wood to storage' : G.stockpile ? 'Carrying wood to camp' : 'Hauling wood to market';
      case 'sellRun': case 'haulExit': return 'Hauling to market';
      case 'haulStore': return moving ? 'Fetching goods' : 'Waiting for goods';
      case 'toSaw': return 'Walking to the sawmill';
      case 'saw': return G.wood < 2 ? 'Sawing (out of wood!)' : 'Sawing lumber';
      case 'move': return 'Walking';
      case 'hunt': return 'Hunting';
      default: return u.fighting ? 'Fighting!' : 'Idle';
    }
  };
  LJ.capOf = capOf;
  LJ.cargoOf = u => u.carry + (u.load ? u.load.w + u.load.l + (u.load.s || 0) : 0);

  // ---------- Simulation step ----------
  function updEconomy(dt) {
    const v = G.village;
    if (!v) return;
    // Training
    if (v.queue.length) {
      const tr = v.queue[0];
      tr.t -= dt;
      if (tr.t <= 0) {
        v.queue.shift();
        let spot = -1;
        for (let i = 0; i < w.N && spot < 0; i++) if (G.villMask[i] && pass(i) && i > (v.ty + v.h) * W) spot = i;
        if (spot < 0) spot = G.villMask.findIndex((m, i) => m && pass(i));
        const u = addUnit(spot % W, (spot / W) | 0, NAMES[G.jackN++ % NAMES.length], 'jack', WAGE);
        say(u, 'Reporting for duty!');
        LJ.sfx('build');
      }
    }
    // Steam sawmill
    if (G.up.steam && G.wood >= 2 && (G.steamT += dt) >= 1.4) {
      G.steamT = 0; G.wood -= 2; G.lumber++;
      if (Math.random() < 0.3) LJ.float((v.tx + 1.5) * TS, v.ty * TS, '+1 lumber', '');
    }
    // Chimney smoke
    if ((G.smokeT -= dt) <= 0) {
      G.smokeT = G.up.steam ? 0.2 : 0.5;
      G.parts.push({ x: (v.tx + 1.5) * TS + 12, y: v.ty * TS - 14, vx: 3 + Math.random() * 4, vy: -14, t: 0, life: 1.6, col: G.up.steam ? '#eeeeee' : '#d8d4cc', smoke: true });
    }
    // Payday
    const bill = G.units.reduce((a, u) => a + u.wage, 0);
    if (bill > 0 && (G.payT -= dt) <= 0) {
      G.payT = PAY_EVERY;
      G.money -= bill;
      LJ.ui.toast(G.money < 0 ? 'Payday: -$' + bill + ". You're in debt — everyone is slacking!" : 'Payday: -$' + bill);
      if (G.money < 0) { LJ.sfx('no'); for (const u of G.units) if (u.hired && u.kind === 'jack') say(u, LJ.pick(Q_BROKE)); }
    }
    // Market orders
    const o = G.order;
    if (!o) {
      if ((G.orderCd -= dt) <= 0) {
        const crew = jacks().length + 2 * countKind('harv') + countKind('truck'), lum = Math.random() < 0.6;
        const qty = lum ? 5 + crew * 3 + ((Math.random() * 4) | 0) : 16 + crew * 8 + ((Math.random() * 8) | 0);
        G.order = { kind: lum ? 'lumber' : 'wood', qty, got: 0, state: 'offer', ttl: 40, time: lum ? 150 : 120, bonus: Math.round(qty * (lum ? 9 : 2.5) / 5) * 5 };
        LJ.sfx('click');
      }
    } else if (o.state === 'offer') {
      if ((o.ttl -= dt) <= 0) { G.order = null; G.orderCd = 40; }
    } else if ((o.time -= dt) <= 0) {
      const fee = Math.round(o.bonus * 0.2 / 5) * 5;
      G.money -= fee; G.order = null; G.orderCd = 45;
      LJ.sfx('no'); LJ.ui.toast('Order missed! Late fee -$' + fee);
    }
  }

  // Automation upgrades: idle machines and jacks find their own work.
  function updAuto(dt) {
    if ((G.autoT -= dt) > 0) return;
    G.autoT = 1.5;
    const stock = G.wood + G.lumber + G.stone;
    for (const u of G.units) {
      if (u.task || u.path.length || u.wait > 0 || u.fighting) continue;
      if (G.up.dispatch && u.kind === 'truck' && stock >= 15) { setTask(u, { type: 'haul', once: false }); continue; }
      if (G.up.foreman && canChop(u)) {
        let found = -1;
        bfs(u.tile, c => {
          const cx = c % W, cy = (c / W) | 0;
          for (let k = 0; k < 8; k++) {
            const nx = cx + DX[k], ny = cy + DY[k];
            if (nx >= 0 && ny >= 0 && nx < W && ny < H && isTree(ny * W + nx)) { found = ny * W + nx; return true; }
          }
          return false;
        });
        if (found >= 0) {
          const fx = (found % W) * TS, fy = ((found / W) | 0) * TS;
          LJ.cmd.area([u], fx - 5 * TS, fy - 5 * TS, fx + 5 * TS, fy + 5 * TS);
        }
      }
    }
  }

  LJ.update = function (dt) {
    G.time += dt;
    for (const u of G.units) {
      if (u.dead) continue;
      if (u.state === 'sellRun' && !u.path.length && u.wait <= 0) { sell(u, u.carry, 0); u.carry = 0; u.state = 'idle'; }
      else updUnit(u, dt);
    }
    if (G.jobs.length) G.jobs = G.jobs.filter(j => (j.trees || j.tiles).size && G.units.some(u => u.task && u.task.job === j));
    if (G.cine) LJ.ending.update(dt);
    else {
      updEconomy(dt);
      updAuto(dt);
      updWild(dt);
      checkLevel();
    }

    for (const f of G.falls) f.t += dt;
    G.falls = G.falls.filter(f => f.t < 0.9);
    for (const p of G.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.smoke) p.vy += 160 * dt; }
    G.parts = G.parts.filter(p => p.t < p.life);
    for (const f of G.floats) f.t += dt;
    G.floats = G.floats.filter(f => { if (f.t >= 1.4) { if (f.el) f.el.remove(); return false; } return true; });
    for (const b of G.bubbles) b.t -= dt;
    G.bubbles = G.bubbles.filter(b => { if (b.t <= 0) { if (b.el) b.el.remove(); return false; } return true; });

    // Butterflies only live where the land is still lush.
    for (const b of G.bflies) {
      b.t -= dt; b.ph += dt * 14;
      if (b.t <= 0) {
        b.t = 1 + Math.random() * 2;
        b.tx = LJ.clamp(b.x + (Math.random() - 0.5) * 60, 4, W * TS - 4);
        b.ty = LJ.clamp(b.y + (Math.random() - 0.5) * 60, 4, H * TS - 4);
        const i = ((b.y / TS) | 0) * W + ((b.x / TS) | 0);
        if (w.lush[i] < 0.5) b.dead = true;
      }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      if (d > 1) { b.x += (dx / d) * 16 * dt; b.y += (dy / d) * 16 * dt; }
    }
    if (G.bflies.some(b => b.dead)) G.bflies = G.bflies.filter(b => !b.dead);

    G.ground.flush(200);
  };
})();
