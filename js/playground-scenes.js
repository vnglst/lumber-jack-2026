'use strict';
// Disposable fixtures for manual review. All action after setup runs through the ordinary simulation.
(function () {
  const G = LJ.G, P = (LJ.playground = {});
  const TOWNS = {
    town5: { level: 5, crew: 8, mills: 1, towers: 2, trucks: 2, harvesters: 0, cleared: 0.16 },
    town8: { level: 8, crew: 12, mills: 2, towers: 3, trucks: 2, harvesters: 2, cleared: 0.48 },
    town10: { level: 10, crew: 16, mills: 3, towers: 4, trucks: 3, harvesters: 3, cleared: 0.85 }
  };
  const SCENES = ['arrival', 'level', 'song-poke', 'song-crew', ...Object.keys(TOWNS), 'wolf', 'pack', 'lynx', 'wolverine', 'bear', 'hut', 'raid', 'ending'];
  function town(config) {
    const w = G.world;
    Object.assign(G, { money: 100000, wood: 5000, lumber: 2000, ore: 500 });
    G.wave.next = 1e9;
    const buy = id => { if (!LJ.buy(id)) throw new Error('Could not prepare town purchase: ' + id); };
    const finish = () => {
      for (const b of G.buildings) if (b.construction) b.construction.t = 0;
      LJ.update(0.05);
      LJ.cmd.stop(G.units);
    };
    // Use normal placement and completion so footprints, services and road access agree.
    G.tier = 0; G.village = null;
    for (let n = 0; n < (config.level >= 6 ? 3 : 2); n++) { buy('base'); finish(); }
    const sites = Array.from({ length: w.N }, (_, i) => i).sort((a, b) =>
      Math.hypot(LJ.colOf(a) - w.start.x, LJ.rowOf(a) - w.start.y) - Math.hypot(LJ.colOf(b) - w.start.x, LJ.rowOf(b) - w.start.y));
    for (const [kind, count] of [['bunk', Math.ceil((config.crew - LJ.popCap()) / 3)], ['sawmill', config.mills], ['tower', config.towers]]) {
      for (let n = 0; n < count; n++) {
        buy(kind);
        const placed = sites.some(i => {
          const x = LJ.colOf(i), y = LJ.rowOf(i), p = G.place;
          if (G.buildings.some(b => x < b.tx + b.w + 2 && x + p.w + 2 > b.tx && y < b.ty + b.h + 2 && y + p.h + 2 > b.ty)) return false;
          return LJ.canPlace(x, y) && LJ.tryPlace(x, y);
        });
        if (!placed) throw new Error('No town building site; try another seed');
        finish();
      }
    }
    while (LJ.jacks().length < config.crew) { buy('jack'); G.village.queue[0].t = 0; finish(); }
    for (const [kind, count] of [['truck', config.trucks], ['shuttle', 1], ['dozer', 1], ['feller', 1], ['harv', config.harvesters]]) {
      while (LJ.countKind(kind) < count) buy(kind);
    }
    for (const it of LJ.SHOP) if (!it.repeat && it.level <= G.level && LJ.shopState(it).st === 'ok') buy(it.id);
    LJ.cmd.stop(G.units);
    const parking = [];
    for (const i of sites) {
      if (LJ.pass(i) && LJ.bfs(G.exitIdx, n => n === i)) parking.push(i);
      if (parking.length >= G.units.length * 2) break;
    }
    G.units.forEach((u, n) => put(u, parking[n * 2]));
    Object.assign(G, { money: config.level * 1500, wood: 600, lumber: 250, stone: 100, ore: 80, animalCd: 45, orderCd: 8 });
    G.wave.next = 90;
    LJ.cmd.sell(G.units.filter(u => u.kind === 'truck'));
    // Start a logging crew at the nearest reachable forest edge; leave spare hands and machines at camp.
    const adjacentTrees = i => [i - 1, i + 1, i - w.W, i + w.W].filter(t =>
      t >= 0 && t < w.N && Math.abs(LJ.colOf(t) - LJ.colOf(i)) <= 1 && LJ.isTree(t));
    const edge = LJ.bfs(G.exitIdx, i => adjacentTrees(i).length > 0);
    if (edge?.length) {
      const tile = edge[0], tree = adjacentTrees(tile)[0];
      const crew = [...LJ.jacks().slice(0, 4), ...G.units.filter(u => LJ.VEH[u.kind]?.chop)];
      crew.forEach(u => put(u, tile));
      LJ.cmd.chop(crew, tree);
      LJ.cmd.move(G.units.filter(u => u.kind === 'shuttle'), tile);
    }
    if (!G.up.steam) LJ.cmd.saw(LJ.jacks().slice(4, 6));
    G.sel = new Set([LJ.jacks()[config.crew - 1]]);
    return 'Level ' + G.level + ' town: ' + config.crew + ' jacks, completed buildings and an equipped fleet; ' + Math.round(config.cleared * 100) + '% of the forest cut. Level and equipment are preset. Logging and market trucks are working; spare crew and bulldozer await orders. Wildlife and raids remain active. Load / replay resets the town.';
  }
  function put(u, tile) {
    u.tile = tile; u.x = LJ.colOf(tile) * LJ.TS + 8; u.y = LJ.rowOf(tile) * LJ.TS + 10;
    u.path = []; u.state = 'think';
  }
  function clearTrees(count) {
    const w = G.world, cx = w.start.x, cy = w.start.y;
    const trees = Array.from({ length: w.N }, (_, i) => i).filter(LJ.isTree);
    trees.sort((a, b) => Math.hypot(LJ.colOf(a) - cx, LJ.rowOf(a) - cy) - Math.hypot(LJ.colOf(b) - cx, LJ.rowOf(b) - cy));
    for (const i of trees.slice(0, count)) { w.obj[i] = LJ.STUMP; w.hp[i] = 0; w.lush[i] = 0; }
    G.cleared = count; G.worldVer++;
  }
  function arrived() {
    // Do not voice dozens of skipped captions while preparing another fixture.
    const intro = LJ.ui.introLine, quiet = LJ.ui.introQuiet, lock = LJ.ui.lockOn;
    LJ.ui.introLine = LJ.ui.introQuiet = LJ.ui.lockOn = () => {};
    try {
      for (let i = 0; G.arrival && i < 4000; i++) LJ.update(0.05);
    } finally { LJ.ui.introLine = intro; LJ.ui.introQuiet = quiet; LJ.ui.lockOn = lock; }
    if (G.arrival) throw new Error('Opening drive could not reach camp');
    LJ.cmd.stop(G.units);
  }
  P.load = function ({ scene = 'arrival', level = 5, seed = 42, gear = 'laser' } = {}) {
    if (!SCENES.includes(scene)) throw new Error('Unknown scene');
    if (!Number.isInteger(seed) || seed < 1 || seed > 999999999) throw new Error('Choose a seed from 1 to 999999999');
    level = Math.max(1, Math.min(10, Math.round(level) || 1));
    LJ.newGame(seed);
    if (LJ.ui.reset) LJ.ui.reset();
    if (P.resetView) P.resetView();
    if (scene === 'arrival') {
      G.paused = false;
      if (LJ.ui.centerOnStart) LJ.ui.centerOnStart();
      return 'Opening: the full drive and tutorial. Tap captions to advance; the truck keeps its own pace.';
    }
    arrived();
    const config = TOWNS[scene];
    G.level = config ? config.level : scene === 'ending' ? 10 : scene === 'raid' ? Math.max(5, level) : level;
    clearTrees(config ? Math.round(G.total * config.cleared) : scene === 'ending' ? G.total : G.level > 1 ? G.thr[G.level - 2] : 0);
    G.earned = G.level > 1 ? G.quota[G.level - 2] : 0;
    Object.assign(G, { money: 10000, wood: 500, lumber: 200, stone: 100, animalCd: 1e9, orderCd: 25 });
    G.tier = G.level >= 6 ? 3 : G.level >= 3 ? 2 : G.level >= 2 ? 1 : 0;
    G.village = G.tier ? G.base : null;
    // Review equipment can be tried at any level; normal Shop unlock rules stay intact.
    G.up.sharpaxe = gear === 'chainsaw'; G.up.chainsaw = gear === 'chainsaw';
    G.up.rifles = gear === 'laser' || gear === 'scope'; G.up.scope = gear === 'scope';
    LJ.revealAll();
    if (config) {
      G.up = {};
      const description = town(config);
      G.ground.renderAll();
      LJ.ui.centerOn((G.base.tx + G.base.w / 2) * LJ.TS, (G.base.ty + G.base.h / 2) * LJ.TS);
      G.paused = false;
      return description;
    }
    const jack = LJ.jacks()[0], w = G.world;
    G.sel = new Set([jack]);
    let focus = jack;
    if (scene.startsWith('song-')) {
      G.wave.hostile = G.level >= LJ.combat.HOSTILE_LEVEL; G.wave.next = 1e9;
      if (scene === 'song-crew') {
        G.tier = Math.max(1, G.tier); G.village = G.base;
        while (LJ.jacks().length < 3) {
          if (!LJ.buy('jack')) throw new Error('Could not prepare singers');
          G.village.queue[0].t = 0; LJ.update(0.05); LJ.cmd.stop(G.units);
        }
        G.time = 180 + w.seed % 120;
        const spots = Array.from({ length: w.N }, (_, i) => i).filter(i => LJ.pass(i) &&
          Math.hypot(LJ.colOf(i) - G.base.tx - G.base.w / 2, LJ.rowOf(i) - G.base.ty - G.base.h / 2) < 5 &&
          LJ.bfs(G.exitIdx, n => n === i));
        spots.sort((a, b) => Math.abs(LJ.rowOf(a) - G.base.ty - G.base.h) - Math.abs(LJ.rowOf(b) - G.base.ty - G.base.h));
        LJ.jacks().forEach((u, n) => put(u, spots[n]));
        G.jackSong.quiet = 9;
      }
      LJ.cmd.stop(G.units);
      jack.clicks = 0; jack.lastClick = -100;
      G.ground.renderAll();
      LJ.ui.centerOn(jack.x, jack.y); G.paused = false;
      return scene === 'song-poke' ? 'Song Easter egg: tap the selected Jack ten times at a steady pace (about half a second apart). Once per campaign. Replay resets it.' :
        'Crew singalong: three resting jacks near camp. The solo starts in three seconds, followed by the chorus. Once per campaign. Replay resets it; click Load / replay to enable audio.';
    } else if (scene === 'hut') {
      let chosen = null, path = null;
      for (const h of G.huts) {
        const route = LJ.bfs(G.exitIdx, i => Math.hypot(LJ.colOf(i) - LJ.colOf(h.tile), LJ.rowOf(i) - LJ.rowOf(h.tile)) <= 4);
        if (route && route.length && (!path || route.length < path.length)) { chosen = h; path = route; }
      }
      if (!chosen) throw new Error('No reachable hut approach on this seed; try another seed');
      put(jack, path[0]);
      LJ.combat.angerHut(chosen); LJ.combat.update(0.05); focus = chosen;
    } else if (['wolf', 'pack', 'lynx', 'wolverine', 'bear'].includes(scene)) {
      const path = LJ.bfs(jack.tile, i => Math.hypot(LJ.colOf(i) - w.start.x, LJ.rowOf(i) - w.start.y) >= 10);
      if (path?.length) put(jack, path[0]);
      const spawn = LJ.enemyPath(jack.tile, i => Math.hypot(LJ.colOf(i) - LJ.colOf(jack.tile), LJ.rowOf(i) - LJ.rowOf(jack.tile)) >= 5);
      if (!spawn?.length) throw new Error('No encounter spot on this seed; try another seed');
      const kind = scene === 'pack' ? 'wolf' : scene;
      LJ.spawnWildAt(kind, spawn[0], scene === 'pack' ? 3 : scene === 'wolverine' ? 2 : 1);
      LJ.voice.cue(LJ.FOE[kind].appear);
    } else if (scene === 'raid') {
      G.wave.hostile = true; G.wave.next = 0; LJ.combat.update(0.05);
      if (!G.wave.active) throw new Error('No raiding route on this seed; try another seed');
      const raider = G.animals.find(a => a.wave);
      if (raider) focus = raider;
    }
    G.ground.renderAll();
    if (LJ.ui.centerOn) LJ.ui.centerOn(focus.x, focus.y);
    G.paused = false;
    if (scene === 'ending') { G.levelDone = true; LJ.ending.start(); }
    else if (scene === 'level' && G.level > 1) LJ.ui.levelUp(LJ.SHOP.filter(it => it.level === G.level));
    if (scene === 'level') return 'Level ' + G.level + ': staged clearing and review resources (€10,000, 500 wood, 200 lumber, 100 stone). Use the normal Shop and controls.';
    if (scene === 'ending') return 'Ending: the last tree is gone. Follow the visitor; tap each conversation line to continue.';
    if (scene === 'raid') return 'Level ' + G.level + ' raid: a real war party starts at a forest hut. Camera starts on the raiders; H returns to camp.';
    return 'Level ' + G.level + ' encounter: select Jack and tap an enemy or hut to attack; tap open ground to retreat. Load / replay resets everything.';
  };
})();
