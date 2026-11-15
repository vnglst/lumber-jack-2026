'use strict';
// Game state and simulation: jacks, vehicles, the settlement, fog of war, wildlife and the ten levels.
(function () {
  const TS = LJ.TS, T = LJ.T, STUMP = LJ.STUMP;
  const G = (LJ.G = {});
  const PRICE = (LJ.PRICE = { wood: 3, lumber: 10, stone: 6 });
  const MAX_LEVEL = 10, WAGE = 20, PAY_EVERY = 60, SAW_TIME = 3.5, INTRO_BEAT_TIME = 4.5, WALL_BUILD_TIME = 3;
  // Share of the forest that must be cleared to complete each of the 10 levels. The last level needs every single tree.
  const FR = [0.005, 0.03, 0.07, 0.12, 0.19, 0.28, 0.4, 0.55, 0.74, 1];
  // Per species: seconds to chop with a plain axe, and wood yield. Old pines are slow but rich.
  const SPECIES = [null, { t: 3.6, y: 3 }, { t: 6, y: 6 }, { t: 4.5, y: 4 }];
  const DOZE = {
    rock: { time: 2.5, ground: T.GRAVEL, resource: 'stone', amount: 2 },
    water: { time: 4, ground: T.GRAVEL },
    roots: { time: 3, ground: T.MUD, resource: 'wood', amount: 2, muddy: true }
  };
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  // The hired hands are locals. Jaakko is the Finnish Jack, and Finland has no shortage of J-names.
  const NAMES = ['Jaakko', 'Jukka', 'Jussi', 'Johanna', 'Jari', 'Juha', 'Janne', 'Jouni', 'Jaana', 'Jorma', 'Joonas', 'Jyrki'];
  const JACK_RANKS = (LJ.JACK_RANKS = [
    { name: 'Greenhorn', xp: 0, work: 1, carry: 0, speed: 1 },
    { name: 'Woodsman', xp: 40, work: 1.15, carry: 2, speed: 1.03 },
    { name: 'Veteran', xp: 160, work: 1.3, carry: 4, speed: 1.06 },
    { name: 'Expert', xp: 480, work: 1.4, carry: 5, speed: 1.08 },
    { name: 'Master', xp: 1200, work: 1.5, carry: 6, speed: 1.1 }
  ]);
  const rankOf = (LJ.rankOf = u => {
    let rank = JACK_RANKS[0];
    for (const r of JACK_RANKS) if ((u.xp || 0) >= r.xp) rank = r;
    return rank;
  });
  function gainXP(u, amount) {
    if (u.kind !== 'jack' || u.dead || amount <= 0) return;
    const before = rankOf(u);
    u.xp = Math.min(JACK_RANKS[JACK_RANKS.length - 1].xp, (u.xp || 0) + amount);
    const after = rankOf(u);
    if (after !== before) LJ.float(u.x, u.y - 22, after.name + '!', 'xp');
  }
  const TRUCK_SPEED = { road: 96, trail: 60, ground: 36 };
  const VEH = (LJ.VEH = {
    truck: { name: 'Truck', wage: 10, hp: 180, wear: 6, speed: TRUCK_SPEED, cap: () => (G.up.mega ? 120 : 60), max: 3 },
    shuttle: { name: 'Logging Truck', wage: 8, hp: 180, wear: 6, speed: TRUCK_SPEED, cap: () => 40, max: 4, sprite: 'shuttle', voice: 'truck' },
    dozer: { name: 'Bulldozer', wage: 15, hp: 260, wear: 10, cap: () => 16, max: 2 },
    feller: { name: 'Felling Tractor', wage: 18, hp: 220, wear: 8, cap: () => 24, max: 3, chop: 2.4, sight: 7, voice: 'harv', speed: { road: 54, trail: 40, ground: 30 } },
    harv: { chop: 1.6, sight: 8, name: 'Harvester', wage: 30, hp: 240, wear: 8, cap: () => (G.up.mega ? 60 : 40), max: 3 }
  });
  // The starting tent grows into the village, one upgrade at a time.
  const TIERS = (LJ.TIERS = [
    { name: 'Tent', pop: 2, train: 10, sellMul: 1 },
    { name: 'Cabin', level: 1, cost: { m: 120, w: 20 }, build: 15, pop: 4, train: 10, sellMul: 1, desc: 'Room for more jacks, village training and market orders.' },
    { name: 'Lodge', level: 3, cost: { m: 600, l: 30 }, build: 25, pop: 7, train: 5, sellMul: 1, desc: 'Room for 3 more jacks, and new jacks train twice as fast.' },
    { name: 'Town Hall', level: 6, cost: { m: 1800, l: 80 }, build: 35, pop: 10, train: 5, sellMul: 1.2, desc: 'Room for 3 more jacks, and the market pays 20% more.' }
  ]);
  // Buildings: the base (the tent and its upgrades) and the ones the player places around it.
  // sight: how far it lifts the fog; heals: jacks nearby heal quickly; mask: which list of standing spots its ring joins.
  const BLD = (LJ.BLD = {
    base: { name: 'Village', sight: 5, heals: true, hp: 500, raid: true }, // raid: raided at 0 HP instead of destroyed
    bunk: { name: 'Bunkhouse', size: [2, 2], build: 12, max: 4, sight: 5 },
    sawmill: { name: 'Sawmill', size: [3, 2], build: 18, max: 3, sight: 5, mask: 'sawMask' },
    tower: { name: 'Guard Tower', size: [2, 2], build: 20, max: 6, sight: 13, heals: true, hp: 320 }
  });
  let w, W, H, vis, par, q, stamp = 0;
  // A tile is an index into the map's layers. Its column and row, and where a unit standing on it is drawn:
  // the middle of the tile across, its feet a little below the middle.
  const colOf = i => i % W, rowOf = i => (i / W) | 0;
  const midX = i => colOf(i) * TS + 8, feetY = i => rowOf(i) * TS + 10;
  LJ.colOf = colOf; LJ.rowOf = rowOf;

  const jacks = () => G.units.filter(u => u.kind === 'jack');
  const countKind = k => G.units.filter(u => u.kind === k).length;
  // G.count grants completed services; pricing and purchase limits also count unfinished sites.
  const buildingCount = k => G.buildings.filter(b => b.kind === k && !b.dead).length;
  const buildingReady = (LJ.buildingReady = b => !b.dead && (!b.construction || !!b.construction.upgrade));
  const jackCount = () => jacks().length + (G.village ? G.village.queue.length : 0);
  const popCap = () => TIERS[G.tier].pop + 3 * G.count.bunk;
  const canChop = u => u.kind === 'jack' || !!VEH[u.kind].chop;
  const maxHpOf = (LJ.maxHpOf = u => u.kind === 'jack' ? 100 : VEH[u.kind].hp);
  const atSawmill = u => {
    const x = colOf(u.tile), y = rowOf(u.tile);
    return G.buildings.find(b => b.kind === 'sawmill' && buildingReady(b) && x >= b.tx - 1 && x <= b.tx + b.w && y >= b.ty - 1 && y <= b.ty + b.h);
  };
  // How far a unit looks for trees (and how much fog it lifts around itself), in tiles.
  const sightOf = u => (VEH[u.kind] && VEH[u.kind].sight ? VEH[u.kind].sight : u.kind === 'jack' ? 6 + (G.up.foreman ? 3 : 0) : 5);
  LJ.jackCount = jackCount; LJ.popCap = popCap; LJ.WAGE = WAGE; LJ.jacks = jacks; LJ.countKind = countKind;

  const vehItem = (id, level, m, desc, icon) => ({
    id, name: VEH[id].name, desc: desc + ' Upkeep €' + VEH[id].wage + ' per payday.', icon, level, need: 'cabin', repeat: true,
    cost: () => ({ m: m + Math.round(m * 0.5) * countKind(id) }), can: () => countKind(id) < VEH[id].max, full: 'Max ' + VEH[id].max
  });
  const bldItem = (id, level, cost, desc, icon) => ({
    id, name: BLD[id].name, desc: desc + ' Builds in ' + BLD[id].build + ' seconds.', icon, level, need: 'cabin', repeat: true, place: BLD[id].size,
    cost, can: () => buildingCount(id) < BLD[id].max, full: 'Max ' + BLD[id].max
  });
  const hireCost = (LJ.hireCost = () => SHOP.find(it => it.id === 'jack').cost().m); // what the next jack costs
  const nextTier = () => TIERS[Math.min(G.tier + 1, TIERS.length - 1)];
  const SHOP = (LJ.SHOP = [
    { id: 'base', icon: 'village', repeat: true, done: () => G.tier >= TIERS.length - 1,
      get name() { return 'Upgrade to ' + nextTier().name; },
      get desc() { return nextTier().desc + ' Builds in ' + nextTier().build + ' seconds.'; },
      get level() { return nextTier().level; },
      cost: () => nextTier().cost },
    { id: 'sharpaxe', name: 'Sharper Axes', desc: 'Chop 35% faster.', icon: 'axe', level: 1, cost: () => ({ m: 40 }) },
    { id: 'sling', name: 'Log Sling', desc: 'Carry 14 instead of 8.', icon: 'bag', level: 1, cost: () => ({ m: 50 }) },
    { id: 'boots', name: 'Sturdy Boots', desc: 'Walk 25% faster.', icon: 'boot', level: 1, cost: () => ({ m: 70 }) },
    { id: 'jack', name: 'Hire a Jack', desc: 'Another pair of hands. Walks in by road at the tent; trains at the Cabin. Wants €' + WAGE + ' every payday.', icon: 'jack', level: 1, repeat: true,
      cost: () => ({ m: 80 + 40 * (jackCount() - 1) }), can: () => jackCount() < popCap(), full: 'No room: build a bunkhouse' },
    bldItem('bunk', 2, () => ({ m: 150 + 100 * buildingCount('bunk'), w: 20 }), 'A house with room for 3 more jacks.', 'bunk'),
    bldItem('sawmill', 2, () => ({ m: 150 + 150 * buildingCount('sawmill'), w: 20 }), 'Jacks turn 2 wood into 1 lumber here. Lumber sells for €' + PRICE.lumber + '.', 'blade'),
    { id: 'rifles', name: 'Laser Pistols', desc: 'Jacks fire bursts of laser bolts at anything that attacks them.', icon: 'rifle', level: 2, cost: () => ({ m: 150 }) },
    { id: 'barrow', name: 'Wheelbarrows', desc: 'Jacks carry 24.', icon: 'barrow', level: 2, need: 'sling', cost: () => ({ m: 160, w: 20 }) },
    { id: 'chainsaw', name: 'Chainsaws', desc: 'Chop twice as fast. Loud.', icon: 'chainsaw', level: 3, need: 'sharpaxe', cost: () => ({ m: 300 }) },
    vehItem('truck', 2, 250, 'Hauls 60 goods per trip down the road to market, much faster than walking.', 'truck'),
    vehItem('shuttle', 3, 150, 'Tap a forest clearing to set a route. Jacks load it there; it shuttles up to 40 wood back to the village automatically.', 'shuttle'),
    bldItem('tower', 3, () => ({ m: 250, w: 30 }), 'Fires laser bursts at forest folk and wild animals. Sees far, and jacks nearby heal quickly.', 'tower'),
    { id: 'wall', name: 'Palisade', desc: 'Drag to build wooden walls. Takes ' + WALL_BUILD_TIME + ' seconds per section. Your people use the gates; enemies break through. Per section:', icon: 'wall', level: 3, need: 'cabin', repeat: true, wall: true, cost: () => WALL_COST },
    vehItem('dozer', 4, 600, 'Uproots stumps for extra wood, clears rocks for stone and fills rivers. Leaves uprooted land barren and muddy.', 'dozer'),
    { id: 'foreman', name: 'Keen-eyed Foreman', desc: 'Jacks spot trees from 50% further away.', icon: 'hat', level: 5, cost: () => ({ m: 500 }) },
    { id: 'dispatch', name: 'Dispatcher', desc: 'Trucks keep hauling on their own whenever there are goods.', icon: 'clip', level: 5, need: 'truck', cost: () => ({ m: 450 }) },
    vehItem('feller', 4, 480, 'A compact tree-cutting tractor. Fells a tree in 2.4 seconds and delivers 24 wood at a time. Wolves ignore it.', 'feller'),
    vehItem('harv', 6, 900, 'A machine that fells and carries trees by itself. Wolves ignore it.', 'harv'),
    { id: 'scope', name: 'Overcharged Lasers', desc: 'Longer range and 4-bolt bursts that hit harder.', icon: 'rifle', level: 6, need: 'rifles', cost: () => ({ m: 400 }) },
    { id: 'steam', name: 'Steam Sawmills', desc: 'Every sawmill saws lumber by itself.', icon: 'blade', level: 7, need: 'sawmill', cost: () => ({ m: 1200, l: 40 }) },
    { id: 'turbo', name: 'Turbo Harvesters', desc: 'Harvesters and felling tractors fell trees 40% faster. Harvesters also drive faster.', icon: 'harv', level: 8, need: 'harv', cost: () => ({ m: 1500 }) },
    { id: 'mega', name: 'Mega Haulers', desc: 'Trucks carry 120, harvesters 60.', icon: 'truck', level: 9, need: 'truck', cost: () => ({ m: 1500 }) }
  ]);

  // What everyone says lives in lines.js, so the recording booth can list it.
  const LN = LJ.LINES, M = LN.misc;
  const Q_NORMAL = LN.normal, Q_ANNOYED = LN.annoyed, Q_FUNNY = LN.funny, Q_ACK = LN.ack, Q_BROKE = LN.broke, Q_NONE = LN.none, Q_VEH = LN.veh;

  const isTree = i => w.obj[i] >= 1 && w.obj[i] <= 3;
  const pass = i => { const t = w.type[i]; return t !== T.WATER && t !== T.ROCK && !isTree(i) && w.bld[i] === 0; };
  const blocked = i => w.type[i] === T.WATER || w.type[i] === T.ROCK;
  const isRoot = i => w.obj[i] === STUMP && !w.bld[i];
  const canDoze = (LJ.canDoze = i => !w.bld[i] && (blocked(i) || isRoot(i)));
  // Animals slip between the trees; only water, rock and buildings stop them.
  const wildPass = i => !blocked(i) && w.bld[i] === 0;
  // A bulldozer plans its route straight through rock and water.
  const dozePass = i => w.bld[i] === 0 && !isTree(i);
  // The market sits where the road meets the west edge; nothing gets built right in front of it.
  const nearMarket = (x, y) => x < 4 && Math.abs(y - w.roadY) < 2;
  LJ.isTree = isTree; LJ.pass = pass; LJ.blocked = blocked; LJ.wildPass = wildPass;
  // Everything that attacks the operation. wild: roams as wildlife (the forest folk come in waves instead).
  const FOE = (LJ.FOE = {
    wolf: { pelt: 15, wild: true, wallDmg: 6, hit: LN.hit.wolf, cry: 'wolf_snarl', die: 'wolf_yelp', death: n => n + ' was eaten by a wolf.' },
    bear: { pelt: 40, wild: true, wallDmg: 6, hit: LN.hit.bear, cry: 'bear_roar', die: 'bear_groan', death: n => n + ' was eaten by a bear.' },
    native: { pelt: 0, wild: false, wallDmg: 9, hit: LN.hit.native, cry: 'folk_shout', die: 'folk_hurt', death: n => n + ' was shot by the forest folk.' }
  });
  // Enemies go round palisades when they can, and through them (hacking) when they must.
  LJ.enemyPath = (from, goal) => bfs(from, goal, i => wildPass(i) && !w.wall[i]) || bfs(from, goal, wildPass);

  // How dangerous the forest is at each level: animals get tougher, faster and hunt in bigger packs.
  function wild(level) {
    return {
      every: [Math.max(30, 104 - level * 10), Math.max(45, 134 - level * 11)],
      pack: Math.min(5, 1 + (level >> 1)), hp: 30 + level * 9, dmg: 6 + level * 1.6, speed: 56 + level * 2.5,
      bearChance: level >= 4 ? Math.min(0.5, (level - 3) * 0.1) : 0
    };
  }
  LJ.danger = level => [
    '', '', 'Wolves now hunt in packs.', 'Bears have woken up. They are not happy.', 'The forest folk are taking up their bows.',
    'The animals are getting desperate.', 'Something in the forest is angry.', 'The packs are bigger than ever.',
    'Whatever is left of the forest is fighting back.', 'Every last tree has to go.'][level - 1] || '';

  // Takes a world into use: search buffers, and the whole game state reset to a fresh start on it.
  function begin(nw) {
    w = nw; W = w.W; H = w.H;
    vis = new Uint32Array(w.N); par = new Int32Array(w.N); q = new Int32Array(w.N); stamp = 0;
    Object.assign(G, {
      world: w, ground: new LJ.Ground(w), units: [], buildings: [], hutLimit: w.hutLimit,
      money: 0, wood: 0, lumber: 0, stone: 0, cleared: 0, total: w.totalTrees, level: 1, levelDone: false, up: {},
      time: 0, paused: true, sel: new Set(), floats: [], parts: [], falls: [], bubbles: [], bflies: [],
      nextId: 1, drag: null, exitIdx: w.roadY * W, sold: 0, cam: { x: 0, y: 0 },
      stockpile: false, village: null, base: null, tier: 0, count: { bunk: 0, sawmill: 0, tower: 0 },
      place: null, hover: null, order: null, orderCd: 25, payT: PAY_EVERY,
      villMask: new Uint8Array(w.N), storeMask: new Uint8Array(w.N), sawMask: new Uint8Array(w.N), smokeT: 0,
      fog: new Uint8Array(w.N), fogDirty: true, fogT: 0, fogLeft: w.N, worldVer: 0,
      animals: [], graves: [], animalCd: 70, kills: 0, earned: 0, jackN: 0, autoT: 0, steamT: 0,
      cine: null, suit: null, props: [], critters: [], wildlifeT: 8, dc: null, folkKilled: 0, wallMode: false, wallDrag: null, wallSites: {}, arrival: null
    });
    LJ.discoveries.init();
    LJ.combat.reset();
    G.thr = FR.map(f => Math.max(1, Math.round(f * G.total)));
    // Money that must have been earned (in total) before a level counts as complete. The last level only needs the trees gone.
    G.quota = G.thr.map((t, i) => (i && i < MAX_LEVEL - 1 ? Math.round((t * 14) / 100) * 100 : 0));
  }
  LJ.newGame = function (seed) {
    seed = seed || ((Math.random() * 1e9) | 0);
    begin(LJ.genWorld(seed, 12));
    G.money = 80; // Enough to hire a second jack before the first trip to market.
    G.base = addBuilding('base', w.base.tx, w.base.ty, 3, 3, true); // Reserve the hidden campsite until the truck arrives.
    ring(G.base, G.villMask);
    ring(G.base, G.storeMask);
    G.arrival = addUnit(colOf(G.exitIdx), rowOf(G.exitIdx), 'Truck 1', 'truck', 0);
    const parking = w.start.y * W + w.start.x;
    G.arrival.path = bfs(G.arrival.tile, c => c === parking, i => pass(i) && (LJ.isRoad(w.type[i]) || i === parking), true);
    G.arrival.state = 'return';
    let distance = 0, px = G.arrival.x, py = G.arrival.y;
    for (const n of G.arrival.path.slice().reverse()) {
      const x = midX(n), y = feetY(n);
      distance += Math.hypot(x - px, y - py); px = x; py = y;
    }
    // Each line gets reading time for its length. The story is told on the road, so the truck's speed is set to make
    // the ride last as long as the story; the how-to-play lines follow at camp, with the truck parked.
    const story = LN.intro.reduce((sum, line) => sum + beatTime(line), 0);
    Object.assign(G.arrival, { introSpeed: distance / story, introV: 0, introBeat: -1, introLeft: 0 });
    LJ.critters.spawn();
    LJ.critters.spawnButterflies(seed);
    G.ground.renderAll();
  };

  // Rebuilds a saved game (see save.js). The map is regenerated from its seed, then everything that changed is laid over it.
  LJ.restoreGame = function (d) {
    const nw = LJ.genWorld(d.seed, d.g.hutLimit || 7);
    if (nw.seed !== d.seed) return false;
    // Seed discoveries from the intact forest before saved tree removals are applied.
    begin(nw);
    for (const k in d.world) nw[k].set(d.world[k]);
    for (const [i, v] of d.chopping) nw.hp[i] = v; // trees half chopped when the game was saved
    for (let i = 0; i < nw.N; i++) if (nw.bld[i]) { nw.deco[i] = 0; nw.flower[i] = 0; } // buildings cleared what grew there
    for (let i = 0; i < nw.N; i++) if (nw.wear[i] >= 6) {
      nw.flower[i] = 0; if (nw.deco[i] !== 8) nw.deco[i] = 0;
    }
    // Legacy saves have no hut state: derive living huts from the restored terrain/decor.
    // Newer saves replace this default with their explicit damage and destruction state.
    LJ.combat.reset();
    Object.assign(G, d.g);
    for (const h of G.huts) if (!h.alive) w.deco[h.tile] = 0;
    G.fog = d.fog; G.fogLeft = G.fog.reduce((n, f) => n + (f ? 0 : 1), 0);
    if (G.level >= LJ.combat.HOSTILE_LEVEL) Object.assign(G.wave, d.wave, { active: null });
    const oldDepots = d.buildings.filter(b => b.kind === 'depot' && !b.dead);
    G.buildings = d.buildings.filter(b => b.kind !== 'depot').map(b => Object.assign({ queue: [] }, b));
    // Old saves turn their fixed depots into logging trucks, keeping the same collection spots.
    w.bld.fill(0);
    G.buildings.forEach((b, n) => {
      if (!b.dead) for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) w.bld[y * W + x] = n + 1;
    });
    G.base = G.buildings.find(b => b.kind === 'base');
    G.village = G.tier >= 1 ? G.base : null;
    for (const b of G.buildings) if (buildingReady(b) && b.kind in G.count) G.count[b.kind]++;
    rebuildMasks();
    G.units = d.units.map(u => Object.assign(makeUnit(0, 0, u.name, u.kind, u.wage), u, { state: 'think' }));
    for (const b of oldDepots) {
      const tile = b.ty * W + b.tx;
      const u = addUnit(b.tx, b.ty, 'Logging Truck ' + (countKind('shuttle') + 1), 'shuttle', VEH.shuttle.wage);
      u.task = { type: 'shuttle', ax: colOf(tile), ay: rowOf(tile) }; u.state = 'think';
    }
    G.critters = d.critters.map(c => Object.assign(LJ.critters.make(c.kind, c.x, c.y, c.dir, Math.random() * 4), { home: c.home }));
    for (const c of G.critters) if (c.kind === 'native') {
      if (c.home === undefined) { const h = LJ.nearest(G.huts, c.x, c.y, Infinity); if (h) c.home = h.tile; }
      const h = LJ.combat.hutAt(c.home);
      if (!h || h.angry) c.gone = true;
    }
    if (G.level < LJ.combat.HOSTILE_LEVEL && !G.critters.some(c => c.kind === 'native')) LJ.critters.spawnFolk(LJ.rng(w.seed + 9));
    LJ.critters.spawnButterflies(d.seed);
    G.ground.renderAll();
    return true;
  };

  // The sprite a building is drawn with, and the top-left corner (world pixels) where it goes:
  // centred on its footprint, standing on its bottom edge.
  LJ.bldSprite = b => (b.kind === 'base' ? LJ.sprites.base[G.tier] : LJ.sprites[b.kind]);
  LJ.bldOrigin = b => {
    const spr = LJ.bldSprite(b);
    return [b.tx * TS + ((b.w * TS - spr.width) >> 1), (b.ty + b.h) * TS + 1 - spr.height];
  };

  function addBuilding(kind, tx, ty, bw, bh, pending = false) {
    const hp = BLD[kind].hp || 160;
    const duration = BLD[kind].build;
    const b = { kind, tx, ty, w: bw, h: bh, queue: [], hp, max: hp, pending, construction: duration ? { t: duration, total: duration } : null };
    G.buildings.push(b);
    for (let y = ty; y < ty + bh; y++) for (let x = tx; x < tx + bw; x++) {
      const i = y * W + x;
      w.bld[i] = G.buildings.length; w.obj[i] = 0; w.flower[i] = 0; w.deco[i] = 0;
    }
    if (!b.pending && !b.construction) reveal(tx + bw / 2, ty + bh / 2, BLD[kind].sight);
    G.worldVer++;
    return b;
  }
  // A building's footprint becomes bare earth.
  function levelFootprint(b) {
    for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) w.type[y * W + x] = T.DIRT;
    markAround((b.ty + 1) * W + b.tx + 1, 3);
  }
  // Marks the ring of tiles around a building: where units stand to use it.
  function ring(b, mask) {
    for (let y = b.ty - 1; y <= b.ty + b.h; y++) for (let x = b.tx - 1; x <= b.tx + b.w; x++) {
      if (x >= 0 && y >= 0 && x < W && y < H && !w.bld[y * W + x]) mask[y * W + x] = 1;
    }
  }

  function makeUnit(tx, ty, name, kind, wage) {
    return {
      id: G.nextId++, kind, x: tx * TS + 8, y: ty * TS + 10, tile: ty * W + tx, path: [], state: 'idle', task: null,
      carry: 0, load: null, xp: 0, dir: 1, wait: 0, walkT: 0, swing: 0, sawT: 0, target: -1, clicks: 0, lastClick: -99,
      lastWhack: -9, name, hired: wage > 0, wage, hp: kind === 'jack' ? 100 : VEH[kind].hp, atkCd: 0, fighting: false, hold: false
    };
  }
  function addUnit(tx, ty, name, kind, wage) {
    const u = makeUnit(tx, ty, name, kind, wage);
    G.units.push(u);
    return u;
  }

  // ---------- Fog of war: tiles stay hidden until someone has seen them ----------
  function reveal(cx, cy, r) {
    const fog = G.fog;
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
        const i = y * W + x;
        if (!fog[i] && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) { fog[i] = 1; G.fogDirty = true; G.fogLeft--; G.worldVer++; }
      }
    }
  }
  LJ.revealAll = () => { G.fog.fill(1); G.fogDirty = true; G.fogLeft = 0; };
  function updFog(dt) {
    if ((G.fogT -= dt) > 0) return;
    G.fogT = 0.25;
    for (const u of G.units) reveal(u.x / TS, u.y / TS, sightOf(u) + 1);
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

  const capOf = u => (u && u.kind !== 'jack' ? VEH[u.kind].cap() : (G.up.barrow ? 24 : G.up.sling ? 14 : 8) + (u ? rankOf(u).carry : 0) + (G.recipes.includes('sling') ? 4 : 0));
  // Unpaid hired jacks slack off, and unpaid machines run out of fuel, until the debt is cleared.
  const effort = u => (G.money < 0 && u.hired ? 0.7 : 1);
  function chopTime(t, u) {
    if (VEH[u.kind] && VEH[u.kind].chop) return VEH[u.kind].chop * (G.up.turbo ? 0.6 : 1);
    const recipe = G.recipes.includes('resin') ? 0.85 : 1;
    return recipe * SPECIES[w.obj[t]].t * (G.up.sharpaxe ? 0.65 : 1) * (G.up.chainsaw ? 0.5 : 1) / rankOf(u).work;
  }
  function speedOf(u) {
    // Trails (worn dirt, gravel) help a little; the road to market helps a lot, most of all for trucks.
    const t = w.type[u.tile], road = LJ.isRoad(t), trail = t === T.DIRT || t === T.GRAVEL;
    const speeds = VEH[u.kind] && VEH[u.kind].speed;
    if (speeds) return (road ? speeds.road : trail ? speeds.trail : speeds.ground) * effort(u);
    if (u.kind === 'dozer') return 36 * effort(u);
    if (u.kind === 'harv') return (G.up.turbo ? 54 : 38) * (road ? 1.5 : trail ? 1.2 : 1) * effort(u);
    let s = 50 * effort(u);
    if (G.up.boots) s *= 1.25;
    if (u.carry > 0 || u.load) s *= 0.85;
    if (road) s *= 1.3; else if (trail) s *= 1.15;
    return s * rankOf(u).speed;
  }

  function stepPath(u, dt, speed) {
    let dist = (speed === undefined ? speedOf(u) : speed) * dt;
    while (dist > 0 && u.path.length) {
      const n = u.path[u.path.length - 1];
      if (!pass(n)) { u.path = []; u.state = 'think'; return; }
      const tx = midX(n), ty = feetY(n);
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.01) u.dir = dx > 0 ? 1 : -1;
      if (d <= dist) {
        u.x = tx; u.y = ty; dist -= d; u.path.pop(); u.tile = n;
        wearGround(u, n);
      } else { u.x += (dx / d) * dist; u.y += (dy / d) * dist; dist = 0; }
    }
    u.walkT += dt;
  }

  function wearGround(u, n) {
    const t = w.type[n];
    if (t === T.BRIDGE || t === T.WATER || t === T.ROCK) return;
    if (u.kind === 'jack') {
      if (t === T.GRASS && ++w.wear[n] >= 10) { w.type[n] = T.DIRT; markAround(n, 1); }
      return;
    }
    // Repeated heavy traffic compacts soil, kills plants and leaves increasingly dark ruts.
    // Saturate instead of wrapping the saved byte back to fresh ground.
    w.wear[n] = Math.min(255, w.wear[n] + VEH[u.kind].wear);
    w.lush[n] = Math.max(0, w.lush[n] - VEH[u.kind].wear / 180);
    w.flower[n] = 0; if (w.deco[n] !== 8) w.deco[n] = 0;
    if (t === T.GRASS && w.wear[n] >= 10) w.type[n] = T.DIRT;
    markAround(n, 1);
  }

  function markAround(i, r) {
    const cx = colOf(i), cy = rowOf(i);
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
    LJ.voice.say(text, u.kind);
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

  // Finds the nearest standing spot next to a tile that passes `test` and that nobody else has claimed.
  function nearestAdj(u, test, four) {
    let found = -1, sawClaimed = false;
    const K = four ? 4 : 8;
    const path = bfs(u.tile, c => {
      const cx = colOf(c), cy = rowOf(c);
      for (let k = 0; k < K; k++) {
        const nx = cx + DX[k], ny = cy + DY[k];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (test(n)) {
          if (w.claim[n] && w.claim[n] !== u.id) sawClaimed = true;
          else { found = n; return true; }
        }
      }
      return false;
    });
    return { path, found, sawClaimed };
  }
  const seenTreeNear = (ax, ay, R) => n => {
    if (!isTree(n) || !G.fog[n]) return false;
    const dx = colOf(n) - ax, dy = rowOf(n) - ay;
    return dx * dx + dy * dy <= R * R;
  };
  // Visits the explored tiles within R tiles of (ax, ay); stops early (returning true) as soon as fn returns true.
  function someNear(ax, ay, R, fn) {
    for (let y = Math.max(0, ay - R); y <= Math.min(H - 1, ay + R); y++) for (let x = Math.max(0, ax - R); x <= Math.min(W - 1, ax + R); x++) {
      const i = y * W + x;
      if (G.fog[i] && (x - ax) * (x - ax) + (y - ay) * (y - ay) <= R * R && fn(i)) return true;
    }
    return false;
  }
  // Cheap check before a full search: is there any visible tree within R tiles of (ax, ay)?
  const anyTreeNear = (ax, ay, R) => someNear(ax, ay, R, isTree);
  // Idle bulldozers clear explored rocks and stumps nearby. Water still needs an explicit order.
  function dozeTargetsNear(ax, ay, R) {
    const out = [];
    someNear(ax, ay, R, i => { if (canDoze(i) && w.type[i] !== T.WATER) out.push(i); });
    return out;
  }

  function think(u) {
    const t = u.task;
    if (!t) { u.state = 'idle'; return; }
    if (t.type === 'move') { u.task = null; u.state = 'idle'; return; }
    if (t.type === 'retreat') { if (!walkTo(u, healsAt, 'retreat')) endTask(u); return; }
    if (t.type === 'hunt') {
      const a = t.a;
      if (!a.alive) { if (t.resume) { setTask(u, t.resume); think(u); } else endTask(u); return; }
      const ax = colOf(a.tile), ay = rowOf(a.tile);
      // A hut stands still among the trees: anywhere within reach of the weapon will do. If there is no such spot,
      // say so and go back to work instead of waiting for ever. Animals move, so for them it is worth waiting.
      const reach = a.kind === 'hut' ? Math.max(1, Math.floor((weaponRange() - 12) / TS)) : 1;
      if (walkTo(u, c => Math.hypot(colOf(c) - ax, rowOf(c) - ay) <= reach + 0.5, 'hunt')) return;
      if (a.kind !== 'hut') { u.wait = 0.4; u.state = 'think'; return; }
      say(u, M.cantReach);
      if (t.resume) { setTask(u, t.resume); think(u); } else endTask(u);
      return;
    }
    if (t.type === 'saw') { if (!walkTo(u, c => G.sawMask[c] === 1, 'toSaw', M.noSawmill)) endTask(u); return; }
    if (t.type === 'haul') {
      const ok = u.load ? walkTo(u, exitGoal, 'haulExit', M.noRoad) : walkTo(u, storeGoal, 'haulStore', M.noStore);
      if (!ok) {
        // No way to the market: the load goes back into stock instead of staying on the hauler for ever.
        if (u.load) { G.wood += u.load.w; G.lumber += u.load.l; G.stone += u.load.s; u.load = null; }
        endTask(u);
      }
      return;
    }
    if (t.type === 'shuttle') {
      u.loadT = 0;
      const goal = u.carry ? storeGoal : c => c === t.ay * W + t.ax;
      if (!walkTo(u, goal, u.carry ? 'shuttleDrop' : 'shuttleLoad', M.cantReach)) { u.wait = 2; u.state = 'think'; }
      return;
    }
    if (t.type === 'doze') {
      const job = t.job;
      for (const c of job.tiles) if (!canDoze(c)) job.tiles.delete(c);
      // Batch nearby roots, but don't carry a small load through a whole rock-clearing expedition.
      if (u.carry + DOZE.roots.amount > capOf(u) || (u.carry > 0 && !someNear(t.ax, t.ay, sightOf(u), isRoot))) { goDrop(u); return; }
      if (!job.tiles.size) {
        for (const c of dozeTargetsNear(t.ax, t.ay, sightOf(u))) job.tiles.add(c);
        if (!job.tiles.size) { endTask(u); u.idleVer = G.worldVer; if (Math.random() < 0.5) say(u, M.allClear); return; }
      }
      const r = nearestAdj(u, n => job.tiles.has(n) && canDoze(n), true);
      if (r.path) { w.claim[r.found] = u.id; u.target = r.found; u.path = r.path; u.state = 'toDoze'; }
      else if (r.sawClaimed) { u.wait = 0.6; u.state = 'think'; }
      else if (u.carry > 0) { job.tiles.clear(); goDrop(u); }
      else { say(u, M.cantReach); endTask(u); u.idleVer = G.worldVer; }
      return;
    }
    // Work: keep cutting the nearest visible tree within sight of the work spot, carrying wood off when full.
    if (u.carry >= capOf(u)) return goDrop(u);
    let r = null;
    if (t.first >= 0) { const f = t.first; t.first = -1; if (isTree(f)) r = nearestAdj(u, n => n === f); }
    if (!r || !r.path) r = nearestAdj(u, seenTreeNear(t.ax, t.ay, sightOf(u)));
    if (r.path) { w.claim[r.found] = u.id; u.target = r.found; u.path = r.path; u.state = 'toTree'; }
    else if (u.carry > 0) goDrop(u);
    else if (r.sawClaimed) { u.wait = 0.6; u.state = 'think'; }
    else { endTask(u); u.idleVer = G.worldVer; if (Math.random() < 0.5) say(u, LJ.pick(Q_NONE)); } // nothing to do: don't look again until the world changes
  }

  // All harvested wood goes through the settlement before it can be sold.
  function goDrop(u) {
    u.dropId = null;
    const trucks = G.units.filter(t => !t.dead && !t.hold && t.kind === 'shuttle' && t.state === 'shuttleLoad' && !t.path.length && t.carry < capOf(t));
    const goal = c => {
      if (storeGoal(c)) return true;
      const t = trucks.find(t => Math.abs(colOf(c) - colOf(t.tile)) <= 1 && Math.abs(rowOf(c) - rowOf(t.tile)) <= 1);
      if (!t) return false;
      u.dropId = t.id; return true;
    };
    if (!walkTo(u, goal, 'toDrop', M.lost)) { u.wait = 2; u.state = 'think'; }
  }
  function dropWood(u) {
    if (u.dropId !== null && u.dropId !== undefined) {
      const t = G.units.find(t => t.id === u.dropId && !t.dead && !t.hold && t.state === 'shuttleLoad' && !t.path.length);
      if (t && Math.hypot(t.x - u.x, t.y - u.y) < 2 * TS) {
        const qty = Math.min(u.carry, capOf(t) - t.carry);
        t.carry += qty; u.carry -= qty;
        if (qty) t.loadT = 0;
        gainXP(u, qty / 4);
        if (qty) LJ.float(u.x, u.y - 18, '+' + qty + ' wood loaded', '');
      }
      u.dropId = null;
      if (u.carry) { goDrop(u); return; }
    } else deposit(u);
    think(u);
  }

  function sell(u, wd, lum, st) {
    st = st || 0;
    if (wd + lum + st <= 0) return;
    const gain = Math.round((wd * PRICE.wood + lum * PRICE.lumber + st * PRICE.stone) * TIERS[G.tier].sellMul);
    G.money += gain; G.earned += gain; G.sold += wd + lum + st;
    gainXP(u, (wd + lum + st) / 2);
    LJ.float(u.x + 6, u.y - 18, '+€' + gain, 'money');
    LJ.sfx('coin');
    const o = G.order;
    if (o && o.state === 'active') {
      o.got = Math.min(o.qty, o.got + (o.kind === 'wood' ? wd : lum));
      if (o.got >= o.qty) {
        G.money += o.bonus; G.earned += o.bonus; G.order = null; G.orderCd = 45;
        LJ.sfx('level'); LJ.ui.toast('Order delivered! Bonus +€' + o.bonus);
      }
    }
  }

  function deposit(u) {
    if (u.carry <= 0) return;
    G.wood += u.carry;
    gainXP(u, u.carry / 4);
    LJ.float(u.x, u.y - 18, '+' + u.carry + ' wood', '');
    u.carry = 0;
  }

  function fell(t, u) {
    const tx = colOf(t), ty = rowOf(t), bx = LJ.treeX(w, t), by = LJ.treeY(w, t);
    G.falls.push({ sp: w.obj[t], v: w.variant[t], t: 0, dir: u.x <= bx ? 1 : -1, x: bx, y: by });
    u.carry += SPECIES[w.obj[t]].y + (w.variant[t] === 2 ? 1 : 0);
    w.obj[t] = STUMP; w.claim[t] = 0; G.cleared++; G.worldVer++;
    gainXP(u, 4);
    if (u.task && u.task.type === 'work') { u.task.ax = tx; u.task.ay = ty; } // the work spot follows the forest edge
    // The land around a felled tree loses some of its lushness - cut enough and it turns to wasteland.
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = tx + dx, y = ty + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.hypot(dx, dy), n = y * W + x;
      if (d <= 3.3) w.lush[n] = Math.max(0, w.lush[n] - 0.2 * (1 - d / 4.2));
      G.ground.mark(n);
    }
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

  // Storage holds back a little for building (bunkhouses, upgrades); everything above that goes to market.
  const RESERVE = { wood: 20, lumber: 30 };
  // Take goods from storage for a market run. Lumber and stone first; raw wood only if nobody is sawing it.
  function loadUp(u) {
    const cap = capOf(u), o = G.order, orderOf = k => o && o.state === 'active' && o.kind === k;
    const lum = Math.min(cap, Math.max(0, G.lumber - (orderOf('lumber') ? 0 : RESERVE.lumber))), st = Math.min(cap - lum, G.stone);
    const sawing = (G.up.steam && G.count.sawmill) || G.units.some(j => j.task && j.task.type === 'saw');
    const wantWood = !sawing || G.wood > 40 || (o && o.state === 'active' && o.kind === 'wood');
    const wd = wantWood ? Math.min(cap - lum - st, Math.max(0, G.wood - (orderOf('wood') ? 0 : RESERVE.wood))) : 0;
    if (lum + st + wd <= 0) return false;
    G.lumber -= lum; G.stone -= st; G.wood -= wd;
    u.load = { w: wd, l: lum, s: st };
    return true;
  }

  // ---------- Wildlife & combat ----------
  function blood(x, y) { for (let i = 0; i < 5; i++) chip(x, y - 6, '#d5392f'); }

  function hurtAnimal(a, dmg) {
    if (a.kind === 'hut') { LJ.combat.hurtHut(a, dmg); return; }
    a.hp -= dmg; blood(a.x, a.y);
    if (a.hp <= 0 && a.alive) {
      a.alive = false;
      LJ.voice.cue(FOE[a.kind].die);
      const pelt = FOE[a.kind].pelt;
      if (!pelt) { G.folkKilled++; return; }
      G.kills++;
      G.money += pelt; G.earned += pelt;
      LJ.float(a.x, a.y - 12, '+€' + pelt + ' pelt', 'money');
      LJ.sfx('coin');
    }
  }

  function hurtUnit(u, dmg, a) {
    if (u.dead) return;
    const jack = u.kind === 'jack';
    if (jack && (u.hp >= 100 || Math.random() < 0.25)) say(u, LJ.pick(FOE[a.kind].hit));
    if (Math.random() < 0.3) LJ.voice.cue(FOE[a.kind].cry);
    u.hp -= dmg;
    if (jack) blood(u.x, u.y);
    else for (let i = 0; i < 5; i++) chip(u.x, u.y - 6, '#c9ad70');
    LJ.sfx('hurt');
    // Jacks nearby drop what they're doing and come to help, then go back to work.
    for (const v of G.units) {
      if (!a.alive || v === u || v.kind !== 'jack' || v.dead || v.fighting || Math.hypot(v.x - u.x, v.y - u.y) > 140) continue;
      const vt = v.task && v.task.type;
      if (vt === 'hunt' || vt === 'move' || vt === 'retreat') continue;
      setTask(v, { type: 'hunt', a, resume: v.task });
    }
    const task = u.task && u.task.type;
    if (jack && u.hp > 0 && u.hp < FLEE_HP && !u.fled && !u.hold && task !== 'move' && !nearHome(u)) fallBack(u);
    // Shot from out of reach: go after the attacker, unless retreating.
    else if (u.hp > 0 && a.alive && jack && !u.fighting && task !== 'hunt' && task !== 'move' && task !== 'retreat') setTask(u, { type: 'hunt', a, resume: u.task });
    if (u.hp > 0) return;
    u.dead = true; release(u);
    G.sel.delete(u);
    if (jack) G.graves.push({ x: u.x, y: u.y });
    else { for (let i = 0; i < 16; i++) dust(u.x, u.y); LJ.sfx('rock'); }
    LJ.ui.toast(jack ? FOE[a.kind].death(u.name) : 'The forest folk destroyed ' + u.name + '!');
  }
  LJ.hurtUnit = hurtUnit; LJ.hurtAnimal = hurtAnimal;

  // ---------- Buildings and walls under attack ----------
  LJ.damageBuilding = function (b, dmg) {
    if (b.dead) return;
    b.hp -= dmg;
    chip((b.tx + b.w / 2) * TS, (b.ty + b.h / 2) * TS, '#8a5a30');
    if (b.hp > 0) return;
    if (BLD[b.kind].raid) { b.hp = b.max * 0.4; LJ.combat.raid(); return; }
    if (buildingReady(b)) G.count[b.kind]--;
    b.dead = true;
    for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) w.bld[y * W + x] = 0;
    rebuildMasks(); markAround((b.ty + 1) * W + b.tx + 1, 3); G.worldVer++;
    for (let i = 0; i < 30; i++) dust((b.tx + Math.random() * b.w) * TS, (b.ty + b.h) * TS - Math.random() * 30);
    LJ.sfx('rock'); LJ.ui.toast('The forest folk wrecked your ' + BLD[b.kind].name.toLowerCase() + '!');
  };
  // Standing spots for storage and sawmills, recomputed after a building is lost.
  function rebuildMasks() {
    G.villMask.fill(0); G.storeMask.fill(0); G.sawMask.fill(0);
    ring(G.base, G.villMask);
    ring(G.base, G.storeMask);
    for (const b of G.buildings) if (buildingReady(b) && BLD[b.kind].mask) ring(b, G[BLD[b.kind].mask]);
  }

  const WALL_HP = 60, WALL_COST = (LJ.WALL_COST = { m: 4, w: 2 });
  LJ.canWall = i => {
    if (i < 0 || i >= w.N || w.wall[i] || w.bld[i] || isTree(i) || !G.fog[i] || LJ.combat.hutAt(i)) return false;
    const t = w.type[i], x = colOf(i), y = rowOf(i);
    return (t === T.GRASS || t === T.DIRT || t === T.MUD || t === T.GRAVEL || t === T.ROAD) && !nearMarket(x, y);
  };
  LJ.buildWalls = function (tiles) {
    let n = 0;
    for (const i of tiles) {
      if (!LJ.canWall(i)) continue;
      if (G.money < WALL_COST.m || G.wood < WALL_COST.w) { LJ.ui.toast('Not enough money or wood for more palisade.'); break; }
      G.money -= WALL_COST.m; G.wood -= WALL_COST.w; w.wall[i] = 1;
      G.wallSites[i] = { t: WALL_BUILD_TIME, total: WALL_BUILD_TIME }; n++;
    }
    if (n) { LJ.sfx('build'); G.worldVer++; }
    return n;
  };
  LJ.damageWall = function (i, dmg) {
    if (!w.wall[i]) return;
    w.wall[i] = Math.max(0, w.wall[i] - dmg);
    chip(midX(i), rowOf(i) * TS + 6, '#b07a44'); LJ.sfx('thud');
    if (!w.wall[i]) { delete G.wallSites[i]; G.worldVer++; for (let k = 0; k < 6; k++) dust(midX(i), rowOf(i) * TS + 14); }
  }

  // Jacks defend themselves against anything in reach. Returns true while they are busy fighting.
  const weaponRange = () => (G.up.scope ? 130 : G.up.rifles ? 100 : 26); // pixels: overcharged lasers, lasers, axes
  function defend(u, dt) {
    u.atkCd -= dt;
    const tt = u.task && u.task.type;
    if (tt === 'move' || (tt === 'retreat' && u.path.length)) { u.fighting = false; return false; } // a move order, or falling back hurt, means: run!
    const range = weaponRange();
    let best = LJ.nearest(G.animals, u.x, u.y, range, a => a.alive);
    const target = u.task && u.task.type === 'hunt' && u.task.a;
    if (!best && target && target.kind === 'hut' && target.alive && Math.hypot(target.x - u.x, target.y - u.y) <= range) best = target;
    u.fighting = !!best;
    if (!best) return false;
    face(u, best.x);
    if (u.atkCd <= 0) {
      if (G.up.rifles) {
        u.atkCd = G.up.scope ? 1 : 1.3;
        LJ.combat.burst(u, best, { n: G.up.scope ? 4 : 3, dmg: G.up.scope ? 13 : 9, col: '#ff4a3a' });
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
    const tgt = LJ.pick(js), tx = colOf(tgt.tile), ty = rowOf(tgt.tile);
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
      LJ.voice.cue(bear ? 'bear_roar' : 'wolf_howl');
      LJ.ui.toast(bear ? 'A bear is coming for ' + tgt.name + '!' : n > 1 ? 'A wolf pack is on the prowl!' : 'A wolf is on the prowl!');
      return;
    }
  }

  function updAnimal(a, dt) {
    a.atkCd -= dt; a.repath -= dt;
    if (!a.flee) {
      if (!a.target || a.target.dead) {
        a.target = LJ.nearest(G.units, a.x, a.y, Infinity, u => u.kind === 'jack' && !u.dead);
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
        if (a.atkCd <= 0) { a.atkCd = 0.8; hurtUnit(t, a.dmg, a); }
        return;
      }
      goal = t.tile;
      a.stalk = d > 100; // creeps closer first, then charges
    }
    if (a.repath <= 0) { a.repath = 0.6; a.path = LJ.enemyPath(a.tile, c => c === goal) || []; } // on the timer only, even after a failed search
    const wall = LJ.march(a, dt, a.speed * (a.flee ? 1.2 : a.stalk ? 0.55 : 1));
    if (wall >= 0 && a.atkCd <= 0) { a.atkCd = 0.8; LJ.damageWall(wall, FOE[a.kind].wallDmg); } // gnawing at the palisade
  }

  function updWild(dt) {
    for (const a of G.animals) if (a.alive && FOE[a.kind].wild) updAnimal(a, dt); // the forest folk are run by LJ.combat
    if (G.animals.some(a => !a.alive)) G.animals = G.animals.filter(a => a.alive);
    if (!G.animals.some(a => FOE[a.kind].wild) && (G.animalCd -= dt) <= 0) {
      const e = wild(G.level).every;
      G.animalCd = e[0] + Math.random() * (e[1] - e[0]);
      spawnPack();
    }
    if (G.units.some(u => u.dead)) {
      G.units = G.units.filter(u => !u.dead);
      if (noCrew() && !crewLost()) LJ.ui.toast('Your whole crew is gone. Hire a new jack in the Shop to carry on.');
    }
    if (crewLost()) { G.paused = true; LJ.ui.gameOver(); }
  }

  // Nobody left who can fell a tree, and nobody in training.
  const noCrew = (LJ.noCrew = () => !jacks().length && !(G.village && G.village.queue.length) && !G.units.some(canChop));
  // Losing the whole crew only ends the game when there is no way back: too little money to hire a jack, and no
  // truck with goods that would sell for enough.
  function crewLost() {
    if (G.arrival || G.cine || !noCrew()) return false;
    const hire = hireCost();
    if (G.money >= hire) return false;
    const worth = (wd, lum, st) => wd * PRICE.wood + lum * PRICE.lumber + st * PRICE.stone;
    let goods = worth(Math.max(0, G.wood - RESERVE.wood), Math.max(0, G.lumber - RESERVE.lumber), G.stone);
    for (const u of G.units) if (u.load) goods += worth(u.load.w, u.load.l, u.load.s);
    return !(countKind('truck') && G.money + goods >= hire);
  }

  // Jacks heal quickly near buildings that heal (the village, guard towers).
  function healsAt(tile) {
    const x = colOf(tile), y = rowOf(tile);
    return G.buildings.some(b => buildingReady(b) && BLD[b.kind].heals && Math.abs(x - b.tx - b.w / 2) <= 4 && Math.abs(y - b.ty - b.h / 2) <= 4);
  }
  const nearHome = u => healsAt(u.tile);

  // A badly hurt jack falls back to the nearest place that heals, rests there, and then picks his job back up.
  // He does this once per wound: a new order from the player overrides it until he has healed.
  const FLEE_HP = 35, FIT_HP = 80;
  function fallBack(u) {
    const t = u.task, back = t && (t.type === 'hunt' || t.type === 'retreat') ? t.resume : t;
    u.fled = true; u.fighting = false;
    LJ.combat.cancelBurst(u);
    setTask(u, { type: 'retreat', resume: back || null });
    if (walkTo(u, healsAt, 'retreat')) say(u, M.patchUp);
    else if (back) { setTask(u, back); think(u); } else endTask(u); // nowhere to go: carry on
  }

  function dust(x, y) {
    G.parts.push({ x: x + (Math.random() - 0.5) * 8, y, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 10, t: 0, life: 0.9, col: '#c9b48a', smoke: true });
  }
  LJ.dust = dust;

  function updUnit(u, dt) {
    if (u.kind === 'jack') {
      if (defend(u, dt)) return;
      if (u.hp < 100) u.hp = Math.min(100, u.hp + dt * (nearHome(u) ? 5 : 0.4)); // rest heals fastest at home
      if (u.fled && u.hp >= FIT_HP) u.fled = false;
    }
    if (u.wait > 0) { u.wait -= dt; return; }
    if (u.path.length) { stepPath(u, dt); return; }
    switch (u.state) {
      case 'idle': break;
      case 'toTree':
        if (isTree(u.target)) { u.state = 'chop'; u.swing = 0; face(u, midX(u.target)); }
        else { release(u); think(u); }
        break;
      case 'chop': {
        const t = u.target;
        if (!isTree(t)) { release(u); think(u); break; }
        u.swing += dt;
        if (u.swing > (u.kind === 'jack' && !G.up.chainsaw ? 0.5 : 0.2)) {
          u.swing = 0; LJ.sfx(u.kind === 'jack' && !G.up.chainsaw ? 'chop' : 'saw');
          chip(midX(t), rowOf(t) * TS + 8, '#e6c88a');
        }
        w.hp[t] -= (dt * effort(u)) / chopTime(t, u);
        if (w.hp[t] <= 0) { fell(t, u); u.target = -1; think(u); }
        break;
      }
      case 'toDrop': dropWood(u); break;
      case 'shuttleLoad':
        // Let workers already walking here finish loading before a partial trip leaves.
        if (G.units.some(j => !j.dead && !j.hold && j.carry > 0 && j.state === 'toDrop' && j.dropId === u.id)) u.loadT = 0;
        if (u.carry >= capOf(u) || (u.carry > 0 && (u.loadT += dt) >= 8)) {
          if (!walkTo(u, storeGoal, 'shuttleDrop', M.noStore)) { u.wait = 2; u.state = 'think'; }
        }
        break;
      case 'shuttleDrop': deposit(u); think(u); break;
      case 'toSaw': {
        deposit(u);
        u.state = 'saw'; u.sawT = 0;
        const mill = atSawmill(u);
        if (mill) face(u, (mill.tx + 1.5) * TS);
        break;
      }
      case 'saw':
        if (!atSawmill(u)) {
          if (G.count.sawmill) { u.state = 'think'; think(u); }
          else { endTask(u); say(u, M.noSawmill); }
          break;
        }
        if (G.wood < 2) { u.swing = 0; break; }
        u.swing += dt; u.sawT += dt * (G.recipes.includes('saw') ? 1.2 : 1) * effort(u) * rankOf(u).work;
        if (u.swing > 0.5) { u.swing = 0; LJ.sfx('saw'); chip(u.x + u.dir * 6, u.y - 6, '#e6c88a'); }
        if (u.sawT >= SAW_TIME) {
          u.sawT = 0; G.wood -= 2; G.lumber++;
          gainXP(u, 2);
          LJ.float(u.x, u.y - 18, '+1 lumber', '');
        }
        break;
      case 'haulStore':
        deposit(u);
        if (G.stockpile && u.task && !u.task.once && u.kind === 'truck') { u.wait = 1; break; }
        if (loadUp(u)) think(u);
        else if (u.task && u.task.once) { say(u, M.noHaul); endTask(u); }
        else if (u.kind === 'jack') { // a jack goes back to chopping once storage is empty
          const back = u.task && u.task.resume;
          if (back) { setTask(u, back); think(u); } else endTask(u);
        } else u.wait = 1;
        break;
      case 'haulExit':
        sell(u, u.load.w, u.load.l, u.load.s); u.load = null;
        if (u.task && u.task.once) { u.task = null; if (!walkTo(u, storeGoal, 'return')) u.state = 'idle'; }
        else think(u);
        break;
      case 'return': u.state = 'idle'; break;
      case 'retreat': // resting at home until fit again (or until the place that heals is gone)
        if (u.hp >= FIT_HP || !nearHome(u)) {
          const back = u.task && u.task.resume;
          if (back) { setTask(u, back); think(u); } else endTask(u);
        }
        break;
      case 'toDoze':
        if (canDoze(u.target)) { u.state = 'doze'; u.sawT = 0; face(u, midX(u.target)); }
        else { release(u); think(u); }
        break;
      case 'doze': {
        const t = u.target;
        if (!canDoze(t)) { release(u); think(u); break; }
        const rule = isRoot(t) ? DOZE.roots : w.type[t] === T.ROCK ? DOZE.rock : DOZE.water;
        u.sawT += dt * effort(u); u.swing += dt;
        if (u.swing > 0.15) { u.swing = 0; dust(u.x + u.dir * 12, u.y - 2); }
        if (u.sawT >= rule.time) {
          w.type[t] = rule.ground; w.obj[t] = 0;
          if (rule.muddy) { w.lush[t] = 0; w.wear[t] = Math.max(80, w.wear[t]); w.flower[t] = w.deco[t] = 0; }
          markAround(t, 2); G.worldVer++;
          if (rule.resource) {
            if (rule.resource === 'wood') u.carry += rule.amount;
            else G[rule.resource] += rule.amount;
            LJ.float(u.x, u.y - 18, '+' + rule.amount + ' ' + rule.resource + (rule.muddy ? ' from roots' : ''), '');
          }
          LJ.sfx('rock');
          if (u.task && u.task.job) { u.task.job.tiles.delete(t); u.task.ax = colOf(t); u.task.ay = rowOf(t); } // the work spot follows the clearing
          release(u); think(u);
        }
        break;
      }
      default: think(u);
    }
  }

  // ---------- Commands ----------
  // Any new order clears a stop order ("hold"), which otherwise keeps automation from taking the unit over again.
  function setTask(u, task) {
    release(u);
    u.task = task; u.path = []; u.wait = 0; u.state = 'think'; u.hold = false;
  }
  const workTask = (ax, ay, first) => ({ type: 'work', ax, ay, first: first === undefined ? -1 : first });
  const workAt = (u, tx, ty, first) => setTask(u, workTask(tx, ty, first));

  LJ.cmd = {
    // Start working at a tree: that tree first, then whatever is nearest around it.
    chop(units, tree) {
      units = units.filter(canChop);
      if (!units.length) return;
      units.forEach((u, k) => workAt(u, colOf(tree), rowOf(tree), k === 0 ? tree : -1));
      if (Math.random() < 0.5) say(units[0], LJ.pick(units[0].kind === 'jack' ? Q_ACK : Q_VEH[VEH[units[0].kind].voice || units[0].kind]));
    },
    // Clear roots and bulldoze rock/water along the route to a target.
    dozeTo(units, idx) {
      const dz = units.filter(u => u.kind === 'dozer');
      if (!dz.length) return false;
      const path = bfs(dz[0].tile, c => c === idx, dozePass, true);
      if (!path) { say(dz[0], M.cantGet); return false; }
      // Only what is in the way: rock and water on the route, plus the tile that was pointed at.
      // Stumps along the route can be driven over; uprooting each one first made the breach wait for minutes.
      const tiles = [...path.filter(blocked), idx].filter(canDoze);
      if (!tiles.length) { LJ.cmd.move(dz, idx); return true; }
      const job = { tiles: new Set(tiles) };
      for (const u of dz) setTask(u, { type: 'doze', job, ax: colOf(idx), ay: rowOf(idx) });
      say(dz[0], LJ.pick(Q_VEH.dozer));
      return true;
    },
    // Walk somewhere. Once there, jacks and harvesters start on any tree they can see.
    move(units, idx) {
      for (const u of units) {
        const path = bfs(u.tile, c => c === idx);
        if (path && u.kind === 'shuttle') { setTask(u, { type: 'shuttle', ax: colOf(idx), ay: rowOf(idx) }); think(u); }
        else if (path) {
          setTask(u, { type: 'move' }); u.path = path; u.state = 'move';
          if (u.kind === 'jack') { u.fighting = false; LJ.combat.cancelBurst(u); }
        }
        else say(u, M.cantGet);
      }
    },
    // Market haulers collect from the settlement, never directly from the forest.
    sell(units) {
      units = units.filter(u => u.kind === 'jack' || u.kind === 'truck');
      for (const u of units) {
        const back = u.task && u.task.type === 'work' ? workTask(u.task.ax, u.task.ay) : null;
        setTask(u, { type: 'haul', once: u.kind === 'truck' && !G.up.dispatch, resume: back });
      }
      if (units.length) say(units[0], units[0].kind === 'truck' ? Q_VEH.truck[0] : M.market);
    },
    hunt(units, a) {
      units = units.filter(u => u.kind === 'jack');
      if (units.length && a.kind === 'hut') LJ.combat.angerHut(a);
      for (const u of units) setTask(u, { type: 'hunt', a });
      if (units.length) say(units[0], LJ.pick(a.kind === 'hut' ? LN.ack : LN.hunt));
    },
    saw(units) {
      if (!G.count.sawmill) return;
      units = units.filter(u => u.kind === 'jack');
      for (const u of units) setTask(u, { type: 'saw' });
      if (units.length) say(units[0], M.sawdust);
    },
    // Stop means stop: the unit stays put, even with automation upgrades, until it gets a new order.
    stop(units) { for (const u of units) { setTask(u, null); u.state = 'idle'; u.hold = true; } }
  };

  // Tapping a tree that is being chopped lands an extra whack.
  LJ.whack = function (t) {
    const u = G.units.find(j => j.kind === 'jack' && j.state === 'chop' && j.target === t && !j.path.length);
    if (!u) return false;
    if (G.time - u.lastWhack < 0.25) return true;
    u.lastWhack = G.time; u.swing = 0.3;
    w.hp[t] -= 0.09;
    for (let i = 0; i < 5; i++) chip(midX(t), rowOf(t) * TS + 8, '#ffe9a8');
    LJ.sfx('chop');
    if (w.hp[t] <= 0) { fell(t, u); u.target = -1; think(u); }
    return true;
  };

  LJ.poke = function (u) {
    u.clicks = G.time - u.lastClick < 4 ? u.clicks + 1 : 0;
    u.lastClick = G.time;
    if (u.kind !== 'jack') { say(u, LJ.pick(Q_VEH[VEH[u.kind].voice || u.kind])); return; }
    say(u, LJ.pick(G.money < 0 && u.hired ? Q_BROKE : u.clicks < 3 ? Q_NORMAL : u.clicks < 6 ? Q_ANNOYED : Q_FUNNY));
  };

  // ---------- Shop & building ----------
  function owned(id) {
    if (id === 'cabin') return G.tier >= 1;
    if (VEH[id]) return countKind(id) > 0;
    if (BLD[id]) return G.count[id] > 0;
    return !!G.up[id];
  }
  const costText = c => '€' + c.m + (c.w ? ' + ' + c.w + ' wood' : '') + (c.l ? ' + ' + c.l + ' lumber' : '');
  const afford = c => G.money >= c.m && G.wood >= (c.w || 0) && G.lumber >= (c.l || 0);
  LJ.shopState = function (it) {
    const c = it.cost(), ct = costText(c);
    if (G.arrival) return { st: 'locked', label: 'Arriving…', costText: ct };
    if (it.id === 'base' && G.base.construction) return { st: 'locked', label: 'Building · ' + Math.ceil(G.base.construction.t) + 's', costText: ct };
    if ((!it.repeat && owned(it.id)) || (it.done && it.done())) return { st: 'owned', label: '✓', costText: ct };
    if (it.level > G.level) return { st: 'locked', label: 'Level ' + it.level, costText: ct };
    if (it.need && !owned(it.need)) return { st: 'locked', label: 'Needs ' + (it.need === 'cabin' ? 'Cabin' : SHOP.find(s => s.id === it.need).name), costText: ct };
    if (it.can && !it.can()) return { st: 'locked', label: it.full, costText: ct };
    if (!afford(c)) return { st: 'cant', label: ct, costText: ct };
    return { st: 'ok', label: ct, costText: ct };
  };
  function pay(c) { G.money -= c.m; G.wood -= c.w || 0; G.lumber -= c.l || 0; }

  function spawnVehicle(kind) {
    const n = countKind(kind) + 1;
    const u = addUnit(colOf(G.exitIdx), rowOf(G.exitIdx), VEH[kind].name + (VEH[kind].max > 1 ? ' ' + n : ''), kind, VEH[kind].wage);
    // Delivered by road; drives up to storage to park.
    walkTo(u, storeGoal, 'return');
    say(u, LJ.pick(Q_VEH[VEH[kind].voice || kind]));
    return u;
  }

  // The tent grows: Cabin (storage, hiring, orders), Lodge, Town Hall.
  function upgradeBase() {
    G.tier++;
    const b = G.base;
    if (G.tier === 1) {
      G.village = b;
      ring(b, G.storeMask);
      G.orderCd = 25; G.payT = PAY_EVERY;
    }
    levelFootprint(b);
    for (let i = 0; i < 24; i++) dust((b.tx + Math.random() * b.w) * TS, (b.ty + b.h) * TS - Math.random() * 30);
    LJ.ui.toast('Your ' + TIERS[G.tier - 1].name.toLowerCase() + ' is now a ' + TIERS[G.tier].name + '!');
  }

  LJ.buy = function (id) {
    const it = SHOP.find(s => s.id === id);
    if (G.arrival || !it || LJ.shopState(it).st !== 'ok') { LJ.sfx('no'); return false; }
    if (it.wall) { G.wallMode = true; return 'wall'; }
    if (it.place) { G.place = { kind: id, w: it.place[0], h: it.place[1] }; return 'place'; }
    pay(it.cost());
    if (id === 'base') G.base.construction = { t: nextTier().build, total: nextTier().build, upgrade: true };
    else if (id === 'jack') {
      if (G.village) G.village.queue.push({ t: TIERS[G.tier].train, total: TIERS[G.tier].train });
      else {
        const u = addUnit(colOf(G.exitIdx), rowOf(G.exitIdx), NAMES[G.jackN++ % NAMES.length], 'jack', WAGE);
        walkTo(u, c => G.villMask[c] === 1, 'return');
        say(u, M.duty);
      }
    }
    else if (VEH[id]) spawnVehicle(id);
    else G.up[id] = true;
    if (id === 'dispatch') for (const u of G.units) if (u.task && u.task.type === 'haul') u.task.once = false;
    LJ.sfx('build');
    return true;
  };

  LJ.canPlace = function (tx, ty) {
    const p = G.place;
    for (let y = ty; y < ty + p.h; y++) for (let x = tx; x < tx + p.w; x++) {
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
      const i = y * W + x;
      if (!pass(i) || !G.fog[i] || LJ.isRoad(w.type[i]) || nearMarket(x, y) || LJ.combat.hutAt(i)) return false; // keep roads, the market and living huts clear
    }
    return true;
  };

  // Marks every tile that can be walked to from the market road (vis[i] === stamp, until the next path search)
  // and returns how many there are.
  function floodFromRoad() {
    bfs(G.exitIdx, () => false);
    let n = 0;
    for (let i = 0; i < w.N; i++) if (vis[i] === stamp) n++;
    return n;
  }

  LJ.tryPlace = function (tx, ty) {
    if (!G.place || !LJ.canPlace(tx, ty)) { LJ.sfx('no'); return false; }
    const p = G.place, it = SHOP.find(s => s.id === p.kind), c = it.cost();
    if (!afford(c)) { G.place = null; LJ.sfx('no'); return false; }
    // The road must reach the new building, and a building may not cut any ground off from the road. Houses packed
    // around the camp could otherwise seal it off from the market for good, or leave a pocket for the crew to be trapped in.
    let open = floodFromRoad();
    for (let y = ty; y < ty + p.h; y++) for (let x = tx; x < tx + p.w; x++) if (vis[y * W + x] === stamp) open--; // the footprint itself
    const b = addBuilding(p.kind, tx, ty, p.w, p.h), mask = new Uint8Array(w.N);
    ring(b, mask);
    if (floodFromRoad() < open || !mask.some((m, i) => m && vis[i] === stamp)) {
      G.buildings.pop();
      for (let y = ty; y < ty + p.h; y++) for (let x = tx; x < tx + p.w; x++) w.bld[y * W + x] = 0;
      LJ.sfx('no'); return false;
    }
    pay(c);
    G.place = null;
    levelFootprint(b);
    // Anyone standing on the building site steps aside, to the nearest free tile however hemmed in the site is
    // (searching only walkable ground left a jack walled into the new building for good). Anyone whose route
    // crossed the site plans a new one.
    for (const u of G.units) {
      if (w.bld[u.tile]) {
        const pth = bfs(u.tile, n => pass(n), () => true);
        if (pth && pth.length) { u.tile = pth[0]; u.x = midX(u.tile); u.y = feetY(u.tile); }
      } else if (!u.path.some(n => w.bld[n])) continue;
      u.path = []; if (u.state !== 'idle') u.state = 'think';
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
    if (u.kind === 'shuttle') return { shuttleLoad: moving ? 'Driving to forest' : 'Collecting wood', shuttleDrop: 'Delivering to village', return: 'Driving to village' }[u.state] || (u.hold ? 'Stopped' : 'Tap a clearing to set a route');
    if (u.kind === 'truck') {
      return { haulStore: moving ? 'Driving to storage' : 'Loading', haulExit: 'Driving to market', return: 'Returning to storage', move: 'Driving' }[u.state] ||
        (u.hold ? 'Stopped' : G.up.dispatch ? 'Waiting for goods' : 'Parked');
    }
    if (u.kind === 'dozer') return { toDoze: isRoot(u.target) ? 'Driving to roots' : 'Driving to obstacles', doze: isRoot(u.target) ? 'Uprooting roots' : 'Bulldozing', toDrop: 'Delivering root wood', move: 'Driving', return: 'Driving' }[u.state] || (u.hold ? 'Stopped' : 'Parked');
    if (VEH[u.kind] && VEH[u.kind].chop) return { chop: 'Harvesting', toTree: 'Driving to the trees', toDrop: 'Unloading', move: 'Driving', return: 'Driving' }[u.state] || (u.hold ? 'Stopped' : 'No trees in sight');
    switch (u.state) {
      case 'chop': return 'Chopping';
      case 'toTree': return 'Walking to a tree';
      case 'toDrop': return u.dropId != null ? 'Carrying wood to logging truck' : 'Carrying wood to camp';
      case 'haulExit': return 'Hauling to market';
      case 'haulStore': return moving ? 'Fetching goods' : 'Waiting for goods';
      case 'toSaw': return 'Walking to the sawmill';
      case 'saw': return G.wood < 2 ? 'Sawing (out of wood!)' : 'Sawing lumber';
      case 'move': return 'Walking';
      case 'retreat': return moving ? 'Falling back to heal' : 'Resting';
      case 'hunt': return u.task && u.task.a.kind === 'hut' ? 'Attacking hut' : 'Hunting';
      default: return u.fighting ? 'Fighting!' : u.hold ? 'Waiting for orders' : 'Idle — no trees in sight';
    }
  };
  LJ.capOf = capOf;
  LJ.cargoOf = u => u.carry + (u.load ? u.load.w + u.load.l + (u.load.s || 0) : 0);

  // ---------- Simulation step ----------
  function updConstruction(dt) {
    for (const b of G.buildings) {
      const c = b.construction;
      if (b.dead || !c || (c.t -= dt) > 0) continue;
      b.construction = null;
      if (c.upgrade) upgradeBase();
      else {
        G.count[b.kind]++;
        if (BLD[b.kind].mask) ring(b, G[BLD[b.kind].mask]);
        reveal(b.tx + b.w / 2, b.ty + b.h / 2, BLD[b.kind].sight);
        G.worldVer++;
        LJ.ui.toast(BLD[b.kind].name + ' is ready!');
      }
      LJ.sfx('build');
    }
    for (const i in G.wallSites) {
      const c = G.wallSites[i];
      if ((c.t -= dt) > 0) continue;
      if (w.wall[i]) w.wall[i] = WALL_HP;
      delete G.wallSites[i]; G.worldVer++;
    }
  }

  function updEconomy(dt) {
    const b = G.base;
    // Smoke from the campfire, later the chimney (busier with steam sawmills)
    if ((G.smokeT -= dt) <= 0) {
      G.smokeT = G.up.steam ? 0.2 : 0.5;
      const [ox, oy] = LJ.bldOrigin(b), sm = LJ.bldSprite(b).smoke;
      if (sm) G.parts.push({ x: ox + sm.x, y: oy + sm.y, vx: 3 + Math.random() * 4, vy: -14, t: 0, life: 1.6, col: G.up.steam ? '#eeeeee' : '#d8d4cc', smoke: true });
    }
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
        const u = addUnit(colOf(spot), rowOf(spot), NAMES[G.jackN++ % NAMES.length], 'jack', WAGE);
        say(u, M.duty);
        LJ.sfx('build');
      }
    }
    // Steam sawmills
    if (G.up.steam && G.count.sawmill && G.wood >= 2 && (G.steamT += dt * G.count.sawmill * (G.recipes.includes('saw') ? 1.2 : 1)) >= 1.4) {
      G.steamT = 0; G.wood -= 2; G.lumber++;
    }
    // Payday
    const bill = G.units.reduce((a, u) => a + u.wage, 0);
    if (bill > 0 && (G.payT -= dt) <= 0) {
      G.payT = PAY_EVERY;
      G.money -= bill;
      LJ.ui.toast(G.money < 0 ? 'Payday: -€' + bill + ". You're in debt — everyone is slacking!" : 'Payday: -€' + bill);
      if (G.money < 0) { LJ.sfx('no'); for (const u of G.units) if (u.hired && u.kind === 'jack') say(u, LJ.pick(Q_BROKE)); }
    }
    // Market orders
    const o = G.order;
    if (!o) {
      if ((G.orderCd -= dt) <= 0) {
        const crew = jacks().length + 2 * countKind('harv') + countKind('truck'), lum = G.count.sawmill > 0 && Math.random() < 0.6;
        const qty = lum ? 5 + crew * 3 + ((Math.random() * 4) | 0) : 16 + crew * 8 + ((Math.random() * 8) | 0);
        G.order = { kind: lum ? 'lumber' : 'wood', qty, got: 0, state: 'offer', ttl: 40, time: lum ? 150 : 120, bonus: Math.round(qty * (lum ? 9 : 2.5) / 5) * 5 };
        LJ.sfx('deal');
      }
    } else if (o.state === 'offer') {
      if ((o.ttl -= dt) <= 0) { G.order = null; G.orderCd = 40; }
    } else if ((o.time -= dt) <= 0) {
      const fee = Math.round(o.bonus * 0.2 / 5) * 5;
      G.money -= fee; G.order = null; G.orderCd = 45;
      LJ.sfx('no'); LJ.ui.toast('Order missed! Late fee -€' + fee);
    }
  }

  // Idle jacks and harvesters start on any tree they can see; with a dispatcher, idle trucks haul. Stopped units are left alone.
  function updAuto(dt) {
    if ((G.autoT -= dt) > 0) return;
    G.autoT = 1;
    const stock = G.wood + G.lumber + G.stone;
    for (const u of G.units) {
      if (u.task || u.hold || u.path.length || u.wait > 0 || u.fighting) continue;
      if (u.idleVer === G.worldVer) continue; // found nothing to do last time, and nothing has changed since
      if (G.up.dispatch && u.kind === 'truck' && stock >= 15) setTask(u, { type: 'haul', once: false });
      else if (canChop(u)) {
        const tx = colOf(u.tile), ty = rowOf(u.tile);
        if (anyTreeNear(tx, ty, sightOf(u))) { workAt(u, tx, ty); think(u); }
      } else if (u.kind === 'dozer') {
        const tx = colOf(u.tile), ty = rowOf(u.tile), targets = dozeTargetsNear(tx, ty, sightOf(u));
        if (targets.length) { setTask(u, { type: 'doze', job: { tiles: new Set(targets) }, ax: tx, ay: ty }); think(u); }
        else u.idleVer = G.worldVer;
      }
    }
  }

  const tileOfPx = (x, y) => ((y / TS) | 0) * W + ((x / TS) | 0);
  LJ.tileOfPx = tileOfPx;
  LJ.seenPx = (x, y) => G.fog[tileOfPx(x, y)] === 1;

  const introLines = () => LN.intro.concat(LN.camp);
  const beatTime = line => Math.max(INTRO_BEAT_TIME, line.length / 15); // reading time for one line
  // A tap during the opening moves on to the next line. It never moves the truck: that keeps driving at its own pace.
  LJ.skipIntroLine = function () {
    if (G.arrival) G.arrival.introLeft = Math.min(G.arrival.introLeft, 0);
  };

  LJ.update = function (dt) {
    if (G.arrival) {
      const truck = G.arrival, lines = introLines(), driving = truck.path.length > 0;
      truck.introLeft -= dt;
      if (truck.introLeft <= 0) {
        const next = truck.introBeat + 1;
        if (next === LN.intro.length && driving) LJ.ui.introQuiet(); // the story was tapped through early: drive on in silence
        else if (next >= lines.length) { // everything has been said: the game begins
          G.arrival = null;
          LJ.ui.introLine(null);
          G.sel = new Set(LJ.jacks());
          setTask(truck, { type: 'haul', once: false });
          LJ.ui.toast('Camp is ready! Jacks bring wood here; your truck takes the surplus to market.');
          return;
        } else {
          truck.introBeat = next; truck.introLeft = beatTime(lines[next]);
          LJ.ui.introLine(lines[next], next, lines.length, next < LN.intro.length ? 'On the road' : 'At camp');
        }
      }
      if (driving) {
        // Story speed while Jack is talking; once he has nothing left to say, the truck picks up speed for the rest of the road.
        const want = truck.introLeft <= 0 ? 120 : truck.introSpeed; // no time left on a line means there is no line
        truck.introV = truck.introV ? truck.introV + (want - truck.introV) * Math.min(1, dt * 1.2) : want;
        stepPath(truck, dt, truck.introV);
        LJ.ui.lockOn(truck.x, truck.y);
      }
      if (!truck.path.length && G.base.pending) { // arrived: pitch the tent, and Jack climbs out
        G.base.pending = false;
        levelFootprint(G.base);
        addUnit(w.start.x + 1, w.start.y, 'Jack', 'jack', 0);
        LJ.sfx('build');
      }
      updFog(dt);
      return;
    }
    G.time += dt;
    if (!G.cine) updConstruction(dt);
    for (const u of G.units) {
      if (u.dead) continue;
      updUnit(u, dt);
    }
    LJ.critters.update(dt);
    if (G.cine) LJ.ending.update(dt);
    else {
      updFog(dt);
      LJ.critters.updateCalls(dt);
      LJ.discoveries.update();
      updEconomy(dt);
      updAuto(dt);
      updWild(dt);
      LJ.combat.update(dt);
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

    LJ.critters.updateButterflies(dt);

    G.ground.flush(200);
  };
})();
