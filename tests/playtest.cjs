// A repeatable ten-minute opening with normal resources and legal purchases/orders.
// This is a scripted player, not a claim that a human completed the campaign.
const { game } = require('./harness.cjs');

function opening(seed, seconds = 600) {
  const lj = game(seed), g = lj.G, purchases = new Set(), events = [];
  let firstSale = false;
  for (let i = 0; i < seconds / 0.05; i++) {
    if (i % 20 === 0) {
      for (const id of ['jack', 'rifles', 'sharpaxe', 'sling', 'base', 'boots', 'barrow']) {
        if (purchases.has(id)) continue;
        const item = lj.SHOP.find(it => it.id === id);
        if (lj.shopState(item).st === 'ok') {
          lj.buy(id); purchases.add(id);
          events.push({ time: Math.round(g.time), event: id });
        }
      }
      for (const u of lj.jacks()) {
        if (u.task || u.path.length || u.fighting || u.hold) continue;
        const w = g.world;
        let best = -1, distance = Infinity;
        for (let n = 0; n < w.N; n++) {
          if (!g.fog[n] || !lj.isTree(n)) continue;
          const d = Math.hypot(n % w.W - u.tile % w.W, ((n / w.W) | 0) - ((u.tile / w.W) | 0));
          if (d < distance) { distance = d; best = n; }
        }
        if (best >= 0) lj.cmd.chop([u], best);
      }
    }
    const level = g.level;
    lj.update(0.05);
    if (g.level !== level) events.push({ time: Math.round(g.time), event: 'level ' + g.level });
    if (!firstSale && g.sold) { firstSale = true; events.push({ time: Math.round(g.time), event: 'first sale' }); }
    if (!lj.jackCount()) { events.push({ time: Math.round(g.time), event: 'crew lost' }); break; }
  }
  return { seed, seconds, level: g.level, cleared: g.cleared, money: g.money, earned: g.earned, jacks: lj.jackCount(), events };
}

if (require.main === module) {
  for (const seed of [1, 42, 12345]) console.log(JSON.stringify(opening(seed)));
}
module.exports = { opening };
