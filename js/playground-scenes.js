'use strict';
// Disposable fixtures for manual review. All action after setup runs through the ordinary simulation.
(function () {
  const G = LJ.G, P = (LJ.playground = {});
  const SCENES = ['arrival', 'level', 'wolf', 'pack', 'bear', 'hut', 'raid', 'ending'];
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
    G.level = scene === 'ending' ? 10 : scene === 'raid' ? Math.max(5, level) : level;
    clearTrees(scene === 'ending' ? G.total : G.level > 1 ? G.thr[G.level - 2] : 0);
    G.earned = G.level > 1 ? G.quota[G.level - 2] : 0;
    Object.assign(G, { money: 10000, wood: 500, lumber: 200, stone: 100, animalCd: 1e9, orderCd: 25 });
    G.tier = G.level >= 6 ? 3 : G.level >= 3 ? 2 : G.level >= 2 ? 1 : 0;
    G.village = G.tier ? G.base : null;
    // Review equipment can be tried at any level; normal Shop unlock rules stay intact.
    G.up.sharpaxe = gear === 'chainsaw'; G.up.chainsaw = gear === 'chainsaw';
    G.up.rifles = gear === 'laser' || gear === 'scope'; G.up.scope = gear === 'scope';
    LJ.revealAll();
    const jack = LJ.jacks()[0], w = G.world;
    G.sel = new Set([jack]);
    let focus = jack;
    if (scene === 'hut') {
      let chosen = null, path = null;
      for (const h of G.huts) {
        const route = LJ.bfs(G.exitIdx, i => Math.hypot(LJ.colOf(i) - LJ.colOf(h.tile), LJ.rowOf(i) - LJ.rowOf(h.tile)) <= 4);
        if (route && route.length && (!path || route.length < path.length)) { chosen = h; path = route; }
      }
      if (!chosen) throw new Error('No reachable hut approach on this seed; try another seed');
      put(jack, path[0]);
      LJ.combat.angerHut(chosen); LJ.combat.update(0.05); focus = chosen;
    } else if (['wolf', 'pack', 'bear'].includes(scene)) {
      const path = LJ.bfs(jack.tile, i => Math.hypot(LJ.colOf(i) - w.start.x, LJ.rowOf(i) - w.start.y) >= 10);
      if (path?.length) put(jack, path[0]);
      const spawn = LJ.enemyPath(jack.tile, i => Math.hypot(LJ.colOf(i) - LJ.colOf(jack.tile), LJ.rowOf(i) - LJ.rowOf(jack.tile)) >= 5);
      if (!spawn?.length) throw new Error('No encounter spot on this seed; try another seed');
      LJ.spawnWildAt(scene === 'bear' ? 'bear' : 'wolf', spawn[0], scene === 'pack' ? 3 : 1);
      LJ.voice.cue(scene === 'bear' ? 'bear_roar' : 'wolf_howl');
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
