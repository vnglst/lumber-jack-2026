'use strict';
// Saving: the game goes to localStorage every 15 seconds and whenever the tab is hidden or closed.
// The map itself is regenerated from its seed on load, so only what changed is stored.
(function () {
  const G = LJ.G, KEY = 'lumberjack-save', VERSION = 3;
  // World layers that change during play. Grass dryness (lush) is stored as a byte; tree health only for trees
  // being chopped; flowers and decor are rebuilt from the buildings on load.
  const LAYERS = { type: Uint8Array, obj: Uint8Array, wear: Uint8Array, bld: Int16Array, wall: Uint8Array };
  // Plain game-state fields copied as they are (thresholds, quotas and building counts are recomputed on load).
  const FIELDS = ['money', 'wood', 'lumber', 'stone', 'cleared', 'level', 'up', 'time', 'nextId', 'sold', 'cam', 'stockpile', 'tier',
    'order', 'orderCd', 'payT', 'kills', 'earned', 'jackN', 'steamT', 'folkKilled', 'graves', 'animalCd'];
  const UNIT_FIELDS = ['id', 'kind', 'x', 'y', 'tile', 'carry', 'load', 'dir', 'name', 'hired', 'wage', 'hp', 'hold'];

  // Typed arrays travel as base64 of their raw bytes.
  function enc(ta) {
    const b = new Uint8Array(ta.buffer, ta.byteOffset, ta.byteLength);
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function dec(str, Type) {
    const bin = atob(str), b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return new Type(b.buffer);
  }

  // Tasks keep only what's needed to pick the work back up; fights and walks are dropped (the unit just carries on).
  // Bulldozers sent together share one job, so jobs are stored once and referred to by number.
  function taskOut(t, jobs) {
    if (!t) return null;
    switch (t.type) {
      case 'work': return { type: 'work', ax: t.ax, ay: t.ay };
      case 'saw': return { type: 'saw' };
      case 'shuttle': return { type: 'shuttle', ax: t.ax, ay: t.ay };
      case 'haul': return { type: 'haul', once: t.once, resume: taskOut(t.resume, jobs) };
      case 'doze': {
        if (!jobs.has(t.job)) jobs.set(t.job, jobs.size);
        return { type: 'doze', job: jobs.get(t.job), ax: t.ax, ay: t.ay };
      }
      case 'hunt': return taskOut(t.resume, jobs);
      default: return null;
    }
  }
  function taskIn(t, jobs) {
    if (!t) return null;
    if (t.type === 'work') return Object.assign(t, { first: -1 });
    if (t.type === 'shuttle') return t;
    if (t.type === 'haul') return Object.assign(t, { resume: taskIn(t.resume, jobs) });
    if (t.type === 'doze') return Object.assign(t, { job: jobs[t.job] });
    return t;
  }

  let lastSave = 0;
  LJ.saveGame = function () {
    const w = G.world, now = performance.now();
    if (!w || G.arrival || G.cine || G.levelDone || now - lastSave < 1000) return; // arrival is a short, replayable introduction
    lastSave = now;
    const s = { v: VERSION, seed: w.seed, world: {}, g: {}, jobs: [] };
    for (const k in LAYERS) s.world[k] = enc(w[k]);
    s.lush = enc(Uint8Array.from(w.lush, v => Math.round(v * 255)));
    s.chopping = [];
    for (let i = 0; i < w.N; i++) if (w.hp[i] > 0 && w.hp[i] < 1) s.chopping.push([i, +w.hp[i].toFixed(3)]);
    for (const k of FIELDS) s.g[k] = G[k];
    s.fog = enc(G.fog);
    s.wave = { hostile: G.wave.hostile, next: G.wave.next, n: G.wave.n };
    s.buildings = G.buildings.map(b => ({ kind: b.kind, tx: b.tx, ty: b.ty, w: b.w, h: b.h, hp: b.hp, max: b.max, dead: !!b.dead, queue: b.queue }));
    const jobs = new Map();
    s.units = G.units.filter(u => !u.dead).map(u => {
      const o = { task: taskOut(u.task, jobs) };
      for (const k of UNIT_FIELDS) o[k] = u[k];
      return o;
    });
    for (const [job, n] of jobs) s.jobs[n] = [...job.tiles];
    s.critters = G.critters.filter(c => !c.gone).map(c => ({ kind: c.kind, x: c.x, y: c.y, dir: c.dir }));
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage full or blocked: keep playing */ }
  };

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const compatible = s => s && (s.v === VERSION || s.v === 2);
  LJ.hasSave = () => !!compatible(read());
  LJ.clearSave = () => { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } };

  LJ.loadGame = function () {
    try {
      const s = read();
      if (!compatible(s)) return false;
      const world = {};
      for (const k in LAYERS) world[k] = dec(s.world[k], LAYERS[k]);
      world.lush = Float32Array.from(dec(s.lush, Uint8Array), v => v / 255);
      const jobs = s.jobs.map(tiles => ({ tiles: new Set(tiles) }));
      for (const u of s.units) u.task = taskIn(u.task, jobs);
      return LJ.restoreGame({ seed: s.seed, world, chopping: s.chopping, g: s.g, fog: dec(s.fog, Uint8Array), wave: s.wave, buildings: s.buildings, units: s.units, critters: s.critters });
    } catch (e) {
      console.warn('Lumberjack: the saved game could not be loaded.', e);
      return false;
    }
  };

  try { localStorage.removeItem('lumberjack-save-v1'); } catch (e) { /* the old format, from before saves were trimmed */ }
  setInterval(() => { if (!G.paused) LJ.saveGame(); }, 15000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) LJ.saveGame(); });
  addEventListener('pagehide', () => LJ.saveGame());
})();
