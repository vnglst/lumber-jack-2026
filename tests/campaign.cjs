// A scripted player for the whole campaign, from the tent to the last tree. It buys, builds, explores, bulldozes,
// tears down angry huts and answers market orders with legal commands only, and records how the game went: pacing
// per level, losses and who caused them, raids, debt, idle time and stalls. It is a measuring tool for finding
// dead ends and balance problems, not a claim about how a person plays or whether the game is fun.
//   node tests/campaign.cjs [seed ...]        (--hours N caps the game time, default 5; --log adds the event log)
// Options for weaker play styles: { every: 6 } acts every six seconds, { huts: false } never attacks huts,
// { skip: ['tower'] } never buys those items, { orders: false } declines market orders, { mine: false } never mines,
// { walls: true } rings the camp with palisade.
const { game } = require('./harness.cjs');

const BUY = ['jack', 'sharpaxe', 'sling', 'base', 'boots', 'rifles', 'bunk', 'sawmill', 'truck', 'barrow', 'chainsaw', 'pick', 'tower',
  'steel', 'dispatch', 'dozer', 'feller', 'foreman', 'harv', 'scope', 'steam', 'turbo', 'mega', 'shuttle'];
const LIMIT = { tower: 3, sawmill: 2, shuttle: 0 };
const ALIVE = { dozer: 1 }; // replace it when it is lost, but never run two

function campaign(seed, hours = 5, opts = {}) {
  const lj = game(seed), g = lj.G, w = g.world, W = w.W;
  const log = [], toasts = {}, levels = [{ level: 1, at: 0 }];
  const m = { deaths: 0, vehiclesLost: 0, waves: 0, raids: 0, orders: { taken: 0, done: 0, missed: 0 }, debtS: 0, idleS: 0, jackS: 0, stalls: [], packs: 0, fightS: 0, killers: {}, wipes: 0, mineOrders: 0, wallSections: 0 };
  const perLevel = k => { const l = levels[levels.length - 1]; l[k] = (l[k] || 0) + 1; };
  const note = (event, extra) => log.push(Object.assign({ t: Math.round(g.time), event }, extra));
  lj.ui.toast = text => {
    const key = text.replace(/[0-9€,.]+/g, '#').replace(/^(\S+) was /, 'X was ');
    toasts[key] = (toasts[key] || 0) + 1;
    if (/was (eaten|shot)/.test(text)) {
      m.deaths++; perLevel('deaths');
      // Who did it: wildlife, a hut's own defenders, or a war party.
      const name = text.split(' ')[0], dead = g.units.find(u => u.name === name && u.dead);
      const near = dead && g.animals.filter(a => a.alive && a.kind === 'native' && Math.hypot(a.x - dead.x, a.y - dead.y) < 140);
      const by = /eaten/.test(text) ? 'wildlife' : near && near.some(a => a.defender) && !near.some(a => !a.defender) ? 'hut defenders' : 'war party';
      const home = dead && Math.hypot(dead.x - (g.base.tx + 1.5) * 16, dead.y - (g.base.ty + 1.5) * 16) < 12 * 16;
      m.killers[by] = (m.killers[by] || 0) + 1;
      m.killers['L' + g.level] = (m.killers['L' + g.level] || 0) + 1;
      if (home) m.killers['at home'] = (m.killers['at home'] || 0) + 1;
      if (!g.up.rifles) m.killers['unarmed'] = (m.killers['unarmed'] || 0) + 1;
      note('death', { text, by });
    }
    else if (/destroyed (?!.*hut)/.test(text) && /forest folk destroyed/.test(text)) { m.vehiclesLost++; note('vehicle lost', { text }); }
    else if (/whole crew is gone/.test(text)) { m.wipes++; note('wipe'); }
    else if (/^War drums/.test(text)) { m.waves++; m.lastWaveAt = g.time; perLevel('waves'); }
    else if (/raided the village/.test(text)) { m.raids++; note('raid', { text }); }
    else if (/Order delivered/.test(text)) m.orders.done++;
    else if (/Order missed/.test(text)) m.orders.missed++;
    else if (/prowl|bear is coming/.test(text)) { m.packs++; perLevel('packs'); }
    else if (/hut is destroyed/.test(text)) { m.lastHutAt = g.time; perLevel('huts'); }
  };
  const dist = (a, b) => Math.hypot(a % W - b % W, ((a / W) | 0) - ((b / W) | 0));
  const bought = {};
  let over = false;
  lj.ui.gameOver = () => { over = true; };

  function flood(from) {
    const seen = new Uint8Array(w.N), st = [from];
    seen[from] = 1;
    while (st.length) {
      const c = st.pop(), x = c % W;
      for (const n of [c + 1, c - 1, c + W, c - W]) {
        if (n < 0 || n >= w.N || seen[n] || (n === c + 1 && x === W - 1) || (n === c - 1 && x === 0) || !lj.pass(n)) continue;
        seen[n] = 1; st.push(n);
      }
    }
    return seen;
  }

  function place(kind) {
    const b = g.base;
    for (let r = 3; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (lj.canPlace(b.tx + dx, b.ty + dy) && lj.tryPlace(b.tx + dx, b.ty + dy)) return true;
    }
    g.place = null;
    return false;
  }

  function shop() {
    const bill = g.units.reduce((a, u) => a + u.wage, 0);
    // No truck left to sell the stock: that comes before everything else.
    const list = g.tier >= 1 && g.level >= 2 && !lj.countKind('truck') ? ['truck'].concat(BUY) : BUY;
    for (const id of list) {
      const it = lj.SHOP.find(s => s.id === id);
      if (lj.shopState(it).st !== 'ok') continue;
      if (LIMIT[id] !== undefined && (bought[id] || 0) >= LIMIT[id]) continue;
      if (opts.skip && opts.skip.includes(id)) continue;
      if (ALIVE[id] !== undefined && lj.countKind(id) >= ALIVE[id]) continue;
      if (g.money - it.cost().m < bill && id !== 'jack') continue; // keep the next payday covered
      if (id === 'jack' && lj.jackCount() && g.money - it.cost().m < bill + 20) continue;
      const r = lj.buy(id);
      if (r === 'place' && !place(id)) continue;
      if (r) { bought[id] = (bought[id] || 0) + 1; note('buy ' + id); return; }
    }
  }

  // Ore still needed for the upgrades that cost it, beyond what is in stock and on the miners' backs.
  function oreWanted() {
    let need = 0;
    for (const it of lj.SHOP) if (lj.shopState(it).st !== 'owned' && !(opts.skip && opts.skip.includes(it.id))) need += it.cost().o || 0;
    return need - g.ore - g.units.reduce((a, u) => a + (u.ore || 0), 0);
  }
  // Like a player tapping the nearest glinting rock he can walk up to.
  function sendToMine(u) {
    const reach = flood(u.tile);
    let best = -1, bd = Infinity;
    for (let n = 0; n < w.N; n++) {
      if (!g.veins[n] || !g.fog[n]) continue;
      const x = n % W;
      if (![n + 1, n - 1, n + W, n - W].some(c => c >= 0 && c < w.N && reach[c] && Math.abs(c % W - x) <= 1)) continue;
      const d = dist(n, u.tile);
      if (d < bd) { bd = d; best = n; }
    }
    return best >= 0 && lj.cmd.mine([u], best);
  }

  function sendToWork(u) {
    const reach = flood(u.tile);
    let seen = -1, sd = Infinity, any = -1, ad = Infinity, spot = -1;
    for (let n = 0; n < w.N; n++) {
      if (!lj.isTree(n)) continue;
      const x = n % W;
      const adj = [n + 1, n - 1, n + W, n - W].find(c => c >= 0 && c < w.N && reach[c] && Math.abs(c % W - x) <= 1);
      if (adj === undefined) continue;
      const d = dist(n, u.tile);
      if (g.fog[n] && d < sd) { sd = d; seen = n; }
      if (d < ad) { ad = d; any = n; spot = adj; }
    }
    if (seen >= 0 && sd <= ad + 12) { lj.cmd.chop([u], seen); return true; }
    if (any >= 0) { lj.cmd.move([u], spot); return true; }
    return false;
  }

  // Nothing left that anyone can walk to: point a bulldozer at the nearest tree behind rock or water.
  function breach(u) {
    // The dozer is usually busy uprooting stumps by itself; opening a way through comes first.
    if (g.time - (breach.at || -99) < 45) return; // give the last order time to work
    const dozers = g.units.filter(d => d.kind === 'dozer');
    if (!dozers.length) return;
    // Like a player tapping the rock or river beside the nearest trees: try the closest few until one can be reached.
    const trees = [];
    for (let n = 0; n < w.N; n++) if (lj.isTree(n)) trees.push(n);
    trees.sort((a, b) => dist(a, u.tile) - dist(b, u.tile));
    for (const t of trees.slice(0, 40)) {
      const sides = [t + 1, t - 1, t + W, t - W].filter(c => c >= 0 && c < w.N && !lj.isTree(c) && !w.bld[c]).sort((a, b) => lj.canDoze(b) - lj.canDoze(a));
      for (const side of sides) if (lj.cmd.dozeTo(dozers, side)) { breach.at = g.time; return; }
    }
  }

  // Once the camp can afford it, ring it with palisade a few tiles out, as a player fortifying against raids would.
  // Palisades block the crew too, so this is where a sealed camp or a stuck truck would show up.
  let walled = false;
  function fortify() {
    if (walled || !opts.walls || g.tier < 1 || g.level < 3 || g.money < 900 || g.wood < 250) return;
    const b = g.base, x0 = b.tx - 5, x1 = b.tx + b.w + 4, y0 = b.ty - 5, y1 = b.ty + b.h + 4, ring = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if ((x === x0 || x === x1 || y === y0 || y === y1) && x > 0 && y > 0 && x < W - 1 && y < w.H - 1) ring.push(y * W + x);
    }
    m.wallSections = lj.buildWalls(ring);
    walled = true;
    note('walls', { text: m.wallSections + ' of ' + ring.length + ' sections' });
  }

  function orders() {
    const o = g.order;
    if (o && o.state === 'offer') {
      const take = opts.orders !== false;
      lj.acceptOrder(take);
      if (take) m.orders.taken++;
    }
  }

  function manage() {
    shop(); orders(); fortify();
    let sawyers = g.units.filter(u => u.task && u.task.type === 'saw').length;
    const wantSaw = g.count.sawmill && !g.up.steam && g.wood >= 12 ? Math.min(2 * g.count.sawmill, lj.jacks().length >> 2) : 0;
    let blocked = null, miners = g.units.filter(u => u.task && u.task.type === 'mine').length;
    const wantMiners = opts.mine !== false && g.up.pick && oreWanted() > 0 ? 2 : 0;
    const stock = g.wood + g.lumber + g.stone, js = lj.jacks();
    // With no truck, someone has to walk the goods to market.
    if (!lj.countKind('truck') && stock >= 60 && !js.some(u => u.task && u.task.type === 'haul')) {
      const hauler = js.find(u => !u.fighting && (!u.task || u.task.type !== 'hunt'));
      if (hauler) lj.cmd.sell([hauler]);
    }
    // An angry hut keeps sending defenders until it is gone: gather whoever is near and tear it down.
    if (opts.huts !== false) for (const h of g.huts) {
      if (!h.alive || !h.angry) continue;
      const squad = js.filter(u => Math.hypot(u.x - h.x, u.y - h.y) < 20 * 16 && (!u.task || (u.task.type !== 'hunt' && u.task.type !== 'haul')));
      if (squad.length >= 3 || (squad.length && js.length <= 3)) lj.cmd.hunt(squad, h);
    }
    for (const u of g.units) {
      if (u.kind === 'truck' && !g.up.dispatch && !u.task && u.state === 'idle' && g.wood + g.lumber + g.stone >= 40) lj.cmd.sell([u]);
      if (u.kind !== 'jack' && !lj.VEH[u.kind].chop) continue;
      if (u.task || u.path.length || u.fighting || u.wait > 0) continue;
      if (u.kind === 'jack' && sawyers < wantSaw) { lj.cmd.saw([u]); sawyers++; continue; }
      if (u.kind === 'jack' && wantMiners > miners && sendToMine(u)) { miners++; m.mineOrders++; continue; }
      if (!sendToWork(u)) blocked = u;
    }
    if (blocked && g.cleared < g.total) breach(blocked);
  }

  let lastCleared = 0, lastProgressT = 0, level = 1;
  const steps = hours * 3600 / 0.05;
  for (let i = 0; i < steps; i++) {
    if (g.paused && !g.cine && !over) g.paused = false; // "Back to work" on the level-up dialog
    if (i % 20 === 0) {
      if (i % (20 * (opts.every || 1)) === 0) manage();
      const js = lj.jacks();
      m.jackS += js.length;
      m.idleS += js.filter(u => !u.task && !u.path.length && !u.fighting).length;
      m.fightS += js.filter(u => u.fighting).length;
      if (g.money < 0) m.debtS++;
      if (g.cleared !== lastCleared) { lastCleared = g.cleared; lastProgressT = g.time; }
      else if (g.time - lastProgressT > 300 && !g.cine) {
        m.stalls.push({ t: Math.round(g.time), level: g.level, cleared: g.cleared, money: g.money, jacks: js.length, earned: g.earned, quota: g.quota[g.level - 1], thr: g.thr[g.level - 1] });
        if (opts.onStall) opts.onStall(lj);
        lastProgressT = g.time;
      }
    }
    lj.update(0.05);
    if (g.level !== level) { level = g.level; levels.push({ level, at: Math.round(g.time), jacks: lj.jacks().length, money: g.money, units: g.units.length }); }
    if (g.cine) { note('ending'); break; }
    if (over) { note('game over'); break; }
  }
  return {
    seed, minutes: Math.round(g.time / 60), finished: !!g.cine, level: g.level, cleared: g.cleared, total: g.total, money: g.money, earned: g.earned,
    ore: g.ore, oreLeft: lj.ore.left(), mineOrders: m.mineOrders, wallSections: m.wallSections, jacks: lj.jacks().length, kills: g.kills, folkKilled: g.folkKilled, hutsLeft: g.huts.filter(h => h.alive).length, finds: g.finds.filter(f => f.found).length + '/' + g.finds.length,
    idleShare: +(m.idleS / Math.max(1, m.jackS)).toFixed(3), fightShare: +(m.fightS / Math.max(1, m.jackS)).toFixed(3), debtMinutes: Math.round(m.debtS / 60),
    deaths: m.deaths, wipes: m.wipes, gameOver: over, killers: m.killers, lastWaveMin: m.lastWaveAt && Math.round(m.lastWaveAt / 60), lastHutMin: m.lastHutAt && Math.round(m.lastHutAt / 60), vehiclesLost: m.vehiclesLost, packs: m.packs, waves: m.waves, raids: m.raids, orders: m.orders, stalls: m.stalls,
    levels: levels.map((l, k) => Object.assign({ minutes: +(((levels[k + 1] ? levels[k + 1].at : g.time) - l.at) / 60).toFixed(1) }, l)),
    bought, toasts, log
  };
}

if (require.main === module) {
  const args = process.argv.slice(2), hi = args.indexOf('--hours');
  const hours = hi >= 0 ? +args.splice(hi, 2)[1] : 5, full = args.includes('--log');
  for (const seed of args.filter(a => /^\d+$/.test(a)).map(Number)) {
    const r = campaign(seed, hours);
    if (!full) delete r.log;
    console.log(JSON.stringify(r, null, 1));
  }
}
module.exports = { campaign };
