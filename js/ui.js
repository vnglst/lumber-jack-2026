'use strict';
// HUD, shop, minimap, dialogs and all pointer/keyboard input.
(function () {
  const TS = LJ.TS, T = LJ.T, G = LJ.G, S = LJ.sprites;
  const $ = id => document.getElementById(id);
  const ui = (LJ.ui = {});
  const ZOOMS = [1, 1.5, 2, 3, 4];
  const ICON_OF = { jack: 'jack', truck: 'truck', dozer: 'dozer', harv: 'harv' };
  let cv, zi = 3, zoom = 3, keys = {}, lastClickU = null, lastClickT = 0, toastT = 0, panelSig = '', shopSig = '', orderSig = '';
  let mini, mctx, mimg, miniT = 0, mouse = null; // mouse: last pointer position in window pixels, null when outside

  function iconCanvas(src, size) {
    const c = document.createElement('canvas');
    c.width = c.height = size || (src.width > 16 ? 24 : 12);
    const x = c.getContext('2d'), k = Math.min(c.width / src.width, c.height / src.height, 1);
    const w = Math.round(src.width * k), h = Math.round(src.height * k);
    x.imageSmoothingEnabled = false;
    x.drawImage(src, (c.width - w) >> 1, (c.height - h) >> 1, w, h);
    return c;
  }
  const mmss = t => { t = Math.max(0, Math.ceil(t)); return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
  const vwW = () => innerWidth / zoom, vwH = () => innerHeight / zoom;

  ui.init = function () {
    cv = LJ.cv = $('view'); LJ.ctx = cv.getContext('2d');
    mini = $('mini'); mctx = mini.getContext('2d');
    document.querySelectorAll('[data-ic]').forEach(el => el.replaceWith(iconCanvas(S.icons[el.dataset.ic])));
    resetZoom();
    addEventListener('resize', resize);
    bindPointer(); bindKeys(); bindButtons(); bindMini();
    addEventListener('pointermove', e => { if (e.pointerType === 'mouse') mouse = [e.clientX, e.clientY]; });
    document.addEventListener('mouseleave', () => { mouse = null; });
    addEventListener('blur', () => { mouse = null; });
  };

  function resetZoom() { zi = innerWidth < 700 ? 2 : 3; zoom = ZOOMS[zi]; resize(); }
  function resize() {
    const cw = Math.ceil(innerWidth / zoom), ch = Math.ceil(innerHeight / zoom);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; } // reallocating clears the canvas: only when the size changes
    cv.style.width = cv.width * zoom + 'px'; cv.style.height = cv.height * zoom + 'px';
    LJ.ctx.imageSmoothingEnabled = false;
    // Until the game has started, keep the jack in view however the window changes.
    if (G.world && G.time === 0 && G.units[0]) ui.centerOn(G.units[0].x + 60, G.units[0].y);
    clampCam();
  }

  function clampCam() {
    const w = G.world; if (!w) return;
    const mw = w.W * TS, mh = w.H * TS, vw = vwW(), vh = vwH();
    G.cam.x = mw <= vw ? (mw - vw) / 2 : LJ.clamp(G.cam.x, 0, mw - vw);
    G.cam.y = mh <= vh ? (mh - vh) / 2 : LJ.clamp(G.cam.y, 0, mh - vh);
  }

  function setZoom(i, ax, ay) {
    i = LJ.clamp(i, 0, ZOOMS.length - 1);
    if (i === zi) return;
    ax = ax === undefined ? innerWidth / 2 : ax; ay = ay === undefined ? innerHeight / 2 : ay;
    const wx = G.cam.x + ax / zoom, wy = G.cam.y + ay / zoom;
    zi = i; zoom = ZOOMS[i];
    G.cam.x = wx - ax / zoom; G.cam.y = wy - ay / zoom;
    resize();
  }

  ui.centerOn = function (x, y) { G.cam.x = x - vwW() / 2; G.cam.y = y - vwH() / 2; clampCam(); };
  ui.follow = function (x, y, dt) {
    const k = Math.min(1, dt * 2.5);
    G.cam.x += (x - vwW() / 2 - G.cam.x) * k; G.cam.y += (y - vwH() / 2 - G.cam.y) * k;
    clampCam();
  };

  ui.centerOnSelection = function () {
    const sel = [...G.sel];
    if (!sel.length || G.cine) return;
    ui.centerOn(sel.reduce((a, u) => a + u.x, 0) / sel.length, sel.reduce((a, u) => a + u.y, 0) / sel.length);
  };

  ui.toast = function (text) { const t = $('toast'); t.textContent = text; t.classList.add('show'); toastT = 2.6; };

  // ---------- Picking ----------
  function pickUnit(wx, wy, slack) {
    let best = null, bd = 1e9;
    for (const u of G.units) {
      const v = u.kind !== 'jack', rx = (v ? 16 : 8) + slack, ry = (v ? 10 : 12) + slack, lift = v ? 7 : 9;
      const dx = wx - u.x, dy = wy - (u.y - lift);
      if (Math.abs(dx) <= rx && Math.abs(dy) <= ry) {
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = u; }
      }
    }
    return best;
  }
  function pickAnimal(wx, wy, slack) {
    let best = null, bd = 1e9;
    for (const a of G.animals) {
      const dx = wx - a.x, dy = wy - (a.y - 5);
      if (Math.abs(dx) <= 12 + slack && Math.abs(dy) <= 10 + slack && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = a; }
    }
    return best;
  }
  function tileAt(wx, wy) {
    const w = G.world;
    return LJ.clamp(Math.floor(wy / TS), 0, w.H - 1) * w.W + LJ.clamp(Math.floor(wx / TS), 0, w.W - 1);
  }
  // Tree canopies reach up over the tiles above, so also try the tiles below the pointer. Trees in the fog don't count.
  function treeAt(wx, wy) {
    const w = G.world, i = tileAt(wx, wy);
    for (let k = 0; k < LJ.TREE_ROWS; k++) { const n = i + k * w.W; if (n < w.N && LJ.isTree(n) && G.fog[n]) return n; }
    return -1;
  }
  // The nearest walkable tile to where the player tapped (they may tap on a rock, a building or into the fog).
  function walkableNear(idx) {
    const w = G.world, x0 = idx % w.W, y0 = (idx / w.W) | 0;
    let best = -1, bd = 1e9;
    for (let y = Math.max(0, y0 - 3); y <= Math.min(w.H - 1, y0 + 3); y++) for (let x = Math.max(0, x0 - 3); x <= Math.min(w.W - 1, x0 + 3); x++) {
      const d = (x - x0) * (x - x0) + (y - y0) * (y - y0);
      if (d < bd && LJ.pass(y * w.W + x)) { bd = d; best = y * w.W + x; }
    }
    return best;
  }
  const isExit = i => { const w = G.world, x = i % w.W, y = (i / w.W) | 0; return x <= 1 && Math.abs(y - w.roadY) <= 1; };

  function click(wx, wy, right, touch, shift) {
    if (G.cine) { if (G.cine.phase === 'talk') LJ.ending.next(); return; }
    if (G.paused) return;
    if (G.place) {
      if (right) { G.place = null; return; }
      G.hover = [wx, wy];
      const kind = G.place.kind;
      if (LJ.tryPlace(Math.floor(wx / TS) - (G.place.w >> 1), Math.floor(wy / TS) - (G.place.h >> 1))) ui.toast(LJ.BLD[kind].name + ' built!');
      else if (G.place) ui.toast("Can't build there — it needs a clear, explored spot the road can reach.");
      return;
    }
    const slack = touch ? 5 : 0;
    const u = !right && pickUnit(wx, wy, slack);
    if (u) {
      const now = performance.now();
      if (lastClickU === u && now - lastClickT < 350) G.sel = new Set(G.units.filter(o => o.kind === u.kind));
      else { if (!shift) G.sel.clear(); G.sel.add(u); LJ.poke(u); }
      lastClickU = u; lastClickT = now;
      LJ.sfx('click');
      return;
    }
    const tr = treeAt(wx, wy), idx = tileAt(wx, wy);
    if (tr >= 0 && LJ.whack(tr)) return;
    let sel = [...G.sel];
    const beast = pickAnimal(wx, wy, slack);
    if (beast && LJ.seenPx(beast.x, beast.y)) {
      if (!sel.some(s => s.kind === 'jack')) sel = LJ.jacks();
      G.sel = new Set(sel);
      LJ.cmd.hunt(sel, beast); LJ.sfx('click');
      return;
    }
    if (LJ.blocked(idx) && G.fog[idx] && sel.some(s => s.kind === 'dozer')) { LJ.cmd.dozeTo(sel, idx); LJ.sfx('click'); return; }
    if (!sel.length) {
      if (tr < 0) return;
      // Nothing selected: grab the nearest jack so a single tap is enough to get going.
      let best = null, bd = 1e9;
      for (const j of LJ.jacks()) { const d = Math.hypot(j.x - wx, j.y - wy); if (d < bd) { bd = d; best = j; } }
      if (!best) return;
      G.sel.add(best); sel = [best];
    }
    const b = G.world.bld[idx] ? G.buildings[G.world.bld[idx] - 1] : null;
    if (tr >= 0) { LJ.cmd.chop(sel, tr); LJ.sfx('click'); }
    else if (b && b.kind === 'sawmill' && sel.some(s => s.kind === 'jack')) { LJ.cmd.saw(sel); LJ.sfx('click'); }
    else if (isExit(idx)) { LJ.cmd.sell(sel); LJ.sfx('click'); }
    else {
      // Anywhere else: walk there. Jacks and harvesters start on whatever trees they can see once they arrive.
      const to = walkableNear(idx);
      if (to >= 0) { LJ.cmd.move(sel, to); LJ.sfx('click'); }
    }
  }

  function boxSelect(d) {
    const x0 = Math.min(d.x0, d.x1), x1 = Math.max(d.x0, d.x1), y0 = Math.min(d.y0, d.y1), y1 = Math.max(d.y0, d.y1);
    G.sel = new Set(G.units.filter(u => u.x >= x0 && u.x <= x1 && u.y - 6 >= y0 && u.y - 6 <= y1));
  }

  // Tiles on a straight line between two tiles (for dragging out a palisade). Diagonal steps get an
  // extra tile so the wall has no corner gaps to slip through.
  function tileLine(a, b) {
    const W = G.world.W, x0 = a % W, y0 = (a / W) | 0, x1 = b % W, y1 = (b / W) | 0, out = [];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    let px = x0, py = y0;
    out.push(y0 * W + x0);
    for (let k = 1; k <= n; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / n), y = Math.round(y0 + ((y1 - y0) * k) / n);
      if (x !== px && y !== py) out.push(py * W + x);
      out.push(y * W + x);
      px = x; py = y;
    }
    return out;
  }

  // ---------- Pointer input ----------
  function bindPointer() {
    const ptrs = new Map();
    let pinchD = 0;
    const world = e => [G.cam.x + e.clientX / zoom, G.cam.y + e.clientY / zoom];
    const pdist = () => { const p = [...ptrs.values()]; return Math.hypot(p[0].lx - p[1].lx, p[0].ly - p[1].ly); };

    cv.addEventListener('pointerdown', e => {
      LJ.audioInit(); e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      const [wx, wy] = world(e), touch = e.pointerType !== 'mouse';
      let mode;
      if (!touch) mode = e.button === 1 ? 'pan' : e.button === 2 ? 'cmd' : G.wallMode ? 'wall' : G.place || G.cine ? 'pan' : 'box';
      else mode = G.wallMode ? 'wall' : 'pan';
      if (mode === 'wall') G.wallDrag = tileLine(tileAt(wx, wy), tileAt(wx, wy));
      ptrs.set(e.pointerId, { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, wx, wy, mode, moved: false, touch, shift: e.shiftKey });
      if (ptrs.size === 2) {
        for (const p of ptrs.values()) { p.mode = 'pinch'; p.moved = true; }
        G.drag = null; pinchD = pdist();
      }
    });

    cv.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') G.hover = world(e);
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      if (p.mode === 'wall') { const [wx, wy] = world(e); G.wallDrag = tileLine(tileAt(p.wx, p.wy), tileAt(wx, wy)); return; }
      const dx = e.clientX - p.lx, dy = e.clientY - p.ly;
      p.lx = e.clientX; p.ly = e.clientY;
      if (!p.moved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > (p.touch ? 10 : 5)) p.moved = true;
      if (!p.moved) return;
      if (p.mode === 'cmd') p.mode = 'pan'; // dragging with the right button pans the map
      if (p.mode === 'pan' || p.mode === 'pinch') {
        const k = p.mode === 'pinch' ? 2 : 1;
        G.cam.x -= dx / zoom / k; G.cam.y -= dy / zoom / k; clampCam();
        if (p.mode === 'pinch' && ptrs.size === 2) {
          const d = pdist();
          if (d / pinchD > 1.3) { setZoom(zi + 1); pinchD = d; }
          else if (d / pinchD < 0.77) { setZoom(zi - 1); pinchD = d; }
        }
      } else {
        const [wx, wy] = world(e);
        G.drag = { x0: p.wx, y0: p.wy, x1: wx, y1: wy };
      }
    });

    const up = e => {
      const p = ptrs.get(e.pointerId);
      ptrs.delete(e.pointerId);
      if (!p || p.mode === 'pinch') return;
      if (p.mode === 'wall') { if (G.wallDrag && !G.paused) LJ.buildWalls(G.wallDrag); G.wallDrag = null; return; }
      if (p.mode === 'cmd' && G.wallMode && !p.moved) { G.wallMode = false; return; }
      if (!p.moved) click(p.wx, p.wy, p.mode === 'cmd', p.touch, p.shift);
      else if (G.drag) {
        if (!G.paused && !G.cine) boxSelect(G.drag);
        G.drag = null;
      }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); G.drag = null; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => { e.preventDefault(); setZoom(zi + (e.deltaY < 0 ? 1 : -1), e.clientX, e.clientY); }, { passive: false });
  }

  function bindMini() {
    let down = false;
    const go = e => {
      const r = mini.getBoundingClientRect(), w = G.world;
      ui.centerOn(((e.clientX - r.left) / r.width) * w.W * TS, ((e.clientY - r.top) / r.height) * w.H * TS);
    };
    mini.addEventListener('pointerdown', e => { if (G.cine) return; down = true; try { mini.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } go(e); });
    mini.addEventListener('pointermove', e => { if (down) go(e); });
    mini.addEventListener('pointerup', () => { down = false; });
  }

  function bindKeys() {
    addEventListener('keydown', e => {
      keys[e.key.toLowerCase()] = true;
      if (G.cine) { if ((e.key === ' ' || e.key === 'Enter') && G.cine.phase === 'talk') LJ.ending.next(); return; }
      if (e.key === 'f' || e.key === 'F' || e.key === ' ') { e.preventDefault(); ui.centerOnSelection(); }
      if (e.key === 'Escape') { G.sel.clear(); G.place = null; G.wallMode = false; G.wallDrag = null; $('shop').classList.remove('open'); }
    });
    addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    addEventListener('blur', () => { keys = {}; });
  }

  function bindButtons() {
    $('toolbar').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      LJ.audioInit(); LJ.sfx('click');
      if (b.dataset.act === 'stop') LJ.cmd.stop([...G.sel]);
      else if (b.dataset.act === 'zoomin') setZoom(zi + 1);
      else if (b.dataset.act === 'zoomout') setZoom(zi - 1);
      else if (b.dataset.act === 'shop') $('shop').classList.toggle('open');
    });
    $('shopClose').onclick = () => $('shop').classList.remove('open');
    $('shopList').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      LJ.audioInit();
      const r = LJ.buy(b.dataset.id);
      if (r === 'wall') { $('shop').classList.remove('open'); ui.toast('Drag to build a palisade. Right-click or Done when finished.'); }
      else if (r === 'place') {
        $('shop').classList.remove('open');
        if (!G.hover) G.hover = [G.cam.x + vwW() / 2, G.cam.y + vwH() / 2];
        ui.toast('Pick a clear spot for the ' + b.dataset.name.toLowerCase());
      } else if (r) ui.toast(b.dataset.id === 'jack' ? 'A new jack is on the way…' : LJ.VEH[b.dataset.id] ? 'A ' + b.dataset.name.toLowerCase() + ' is coming up the road!' : b.dataset.name + ' purchased!');
    });
    $('panel').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      LJ.sfx('click');
      const sel = [...G.sel], a = b.dataset.act;
      if (a === 'sell') LJ.cmd.sell(sel);
      else if (a === 'saw') LJ.cmd.saw(sel);
      else if (a === 'stop') LJ.cmd.stop(sel);
      else if (a === 'desel') G.sel.clear();
      else if (a === 'cancel') G.place = null;
      else if (a === 'walldone') { G.wallMode = false; G.wallDrag = null; }
    });
    $('order').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      LJ.acceptOrder(b.dataset.act === 'yes');
    });
    $('cine').addEventListener('click', () => LJ.ending.next());
    $('again').onclick = () => ui.restart();
    $('stockBtn').onclick = () => { G.stockpile = !G.stockpile; LJ.sfx('click'); ui.toast(G.stockpile ? 'Wood is now stockpiled at the camp' : 'Wood is now sold at the market'); };
    $('soundBtn').onclick = () => { LJ.audioInit(); $('soundBtn').style.opacity = LJ.toggleMute() ? 0.4 : 1; };
    $('helpBtn').onclick = () => { if (!G.cine) ui.showTitle(true); };
  }

  // ---------- Dialogs ----------
  function modal(html, onOk) {
    const m = $('modal');
    m.innerHTML = '<div class="dialog">' + html + '</div>';
    m.classList.add('open');
    G.paused = true;
    m.querySelector('button').onclick = () => { LJ.audioInit(); LJ.sfx('click'); m.classList.remove('open'); if (onOk) onOk(); G.paused = false; };
  }

  ui.showTitle = function (help) {
    modal(
      '<div class="logo"><span class="lumber">Lumber</span><span class="jack">Jack</span></div>' +
      '<p>One jack. One axe. An awful lot of trees.</p>' +
      '<ul><li><b>Tap a tree</b> to send your jack. Jacks keep cutting the nearest trees they can see; when none are left in sight, they wait.</li>' +
      '<li>Select jacks and <b>tap anywhere</b> to send them there. Keep tapping a tree being chopped to land extra whacks.</li>' +
      '<li>Wood sells at the <b>market</b>, at the end of the long road west. It is a long walk: stockpile at the tent, and buy trucks as soon as you can.</li>' +
      '<li>Upgrade your tent into a village and build houses, sawmills and depots around it.</li>' +
      '<li>The map is unexplored. The forest bites back: jacks heal near home; tap an animal to hunt it.</li>' +
      '<li>Scroll by moving the mouse to a screen edge, dragging with the right mouse button, WASD/arrow keys or the minimap. F jumps to your selection. Wheel zooms. Touch: drag scrolls, pinch zooms.</li></ul>' +
      '<button>' + (help ? 'Back to work' : 'Start chopping') + '</button>');
  };

  ui.levelUp = function (items) {
    modal('<h1>Level ' + G.level + '</h1><p>' + G.cleared + ' trees cleared and $' + G.earned.toLocaleString('en-US') + ' earned. Business is booming.</p>' +
      (items.length ? '<p><b>New in the Shop</b></p><ul>' + items.map(i => '<li><b>' + i.name + '</b> — ' + i.desc + '</li>').join('') + '</ul>' : '') +
      '<p>' + LJ.danger(G.level) + '</p><button>Back to work</button>');
  };

  ui.gameOver = function () {
    modal('<h1>The forest wins</h1><p>Your last jack is gone. ' + G.cleared + ' trees cleared, ' + G.kills + ' animals killed.</p>' +
      '<p>The trees will not remember you.</p><button>Try again</button>', ui.restart);
  };

  ui.cineStart = function () {
    $('game').classList.add('cine');
    $('shop').classList.remove('open');
    $('modal').classList.remove('open');
    G.paused = false;
  };

  ui.cineLine = function (text) {
    const el = $('cine');
    if (!text) { el.className = ''; el.innerHTML = ''; return; }
    el.className = 'open';
    el.innerHTML = '<div class="who"></div><div><div class="nm">Mr. Grant, Development</div><div class="tx"></div><div class="more">tap to continue ▸</div></div>';
    el.querySelector('.who').appendChild(iconCanvas(S.suit.idle.r, 22));
    el.querySelector('.tx').textContent = text;
  };

  ui.endScreen = function () {
    const m = $('modal');
    m.innerHTML = '<div class="dialog"><h1>Game over.</h1>' +
      '<p>' + G.cleared.toLocaleString('en-US') + ' trees cleared · ' + G.kills + ' animals killed · ' + G.folkKilled + ' forest folk killed · $' + G.earned.toLocaleString('en-US') + ' earned</p>' +
      '<p>You received a $1,000,000 bonus and shares in the new AI data center.</p>' +
      '<p class="ask">Do you want to clear another piece of land?</p>' +
      '<div class="row"><button data-a="yes">Yes</button><button data-a="no" class="ghost">No</button></div></div>';
    m.classList.add('open');
    m.querySelector('[data-a="yes"]').onclick = () => { LJ.sfx('click'); m.classList.remove('open'); ui.restart(); };
    m.querySelector('[data-a="no"]').onclick = () => { LJ.sfx('click'); m.classList.remove('open'); $('again').classList.add('open'); };
  };

  // Free zoom for the ending's zoom-out over the whole map.
  ui.zoom = () => zoom;
  ui.fitZoom = () => Math.min(innerWidth / (G.world.W * TS), innerHeight / (G.world.H * TS));
  ui.zoomTo = z => { if (Math.abs(z - zoom) > 0.001) { zoom = z; resize(); } };

  ui.restart = function () {
    resetZoom();
    $('game').classList.remove('cine');
    $('again').classList.remove('open');
    ui.cineLine(null);
    LJ.newGame(); ui.reset();
    ui.centerOn(G.units[0].x + 60, G.units[0].y);
    G.paused = false;
  };

  // ---------- Per-frame UI ----------
  function hint() {
    if (G.levelDone || G.cine) return '';
    if (G.wallMode) return 'Drag to build a line of palisade. Enemies walk around open ends, so close the ring around what you want to protect.';
    if (G.place) return 'Pick a clear, explored spot the road can reach.';
    const nw = LJ.combat.nextWaveIn();
    if (G.wave.active && !G.wave.active.retreating) return 'The forest folk are attacking! Guard towers and jacks with laser pistols can hold them off.';
    if (nw !== null && nw < 30) return 'War drums in the forest… the next war party arrives in ' + mmss(nw) + '.';
    if (G.wave.hostile && !G.count.tower && G.level >= 3) return 'The forest folk will be back. Build Guard Towers and a palisade around the village.';
    if (G.money < 0) return "You're in debt: hired jacks and machines slack off until you're back in the black.";
    const tasks = t => G.units.some(u => u.task && u.task.type === t), sel = [...G.sel];
    if (G.cleared >= G.thr[G.level - 1]) return 'Trees done! Now earn the rest of the quota: sell wood and lumber at the market.';
    if (sel.length && sel.every(u => u.kind === 'dozer')) return 'Tap a rock or river tile to bulldoze a way to it.';
    if (sel.length && sel.every(u => u.kind === 'truck') && !G.up.dispatch) return 'Tap the market sign (or “Haul run”) to send the truck on a trip.';
    if (G.cleared === 0 && !tasks('work')) return 'Tap a tree to send your jack to work.';
    const idle = LJ.jacks().filter(u => !u.task && !u.path.length && !u.hold && !u.fighting).length;
    if (idle && G.cleared < G.total) return idle + (idle > 1 ? ' jacks see' : ' jack sees') + ' no trees. Select them and tap near the forest to send them there.';
    if (!G.village) {
      if (G.sold === 0 && G.wood === 0) return 'A jack carries ' + LJ.capOf() + ' wood, then walks the long road west to the market to sell it. Tap his tree to help him chop.';
      if (!Object.keys(G.up).length && G.money >= 40) return 'You can afford an upgrade — open the Shop.';
      if (G.cleared >= 8) return 'Next: upgrade the tent to a Cabin ($' + Math.max(0, G.money) + '/120, wood ' + G.wood + '/20). ' +
        (G.stockpile ? 'Wood is being stockpiled at the tent.' : 'Tap “Selling” to stockpile wood instead.');
      return '';
    }
    if (G.level >= 2 && LJ.jackCount() < 2) return 'Hire more jacks in the Shop. Each one wants $' + LJ.WAGE + ' every payday.';
    if (G.level >= 2 && !LJ.countKind('truck') && tasks('haul')) return 'The market is a long walk away. A Truck ($250) makes the trip in seconds, with 60 goods at a time.';
    if (G.level >= 2 && !G.count.sawmill && G.wood >= 20) return 'Build a Sawmill: jacks there turn wood into lumber worth $' + LJ.PRICE.lumber + ' each.';
    if (G.count.sawmill && G.wood >= 6 && G.lumber === 0 && !G.up.steam && !tasks('saw')) return 'Select a jack and tap the sawmill to saw lumber: $' + LJ.PRICE.lumber + ' each, instead of $' + LJ.PRICE.wood + ' per wood.';
    if (G.wood + G.lumber >= 10 && !tasks('haul') && !G.units.some(u => u.kind === 'truck' && u.state !== 'idle')) return 'Nothing sells itself: select a jack or truck and tap the market sign.';
    if (G.level >= 4 && !LJ.countKind('dozer')) return 'Rivers and rocks wall off most of the forest. A bulldozer can open a way through.';
    if (G.level === 10) { const left = G.total - G.cleared; return left + ' trees left standing. Every last one has to go — the minimap shows where.'; }
    return '';
  }

  function refreshPanel() {
    const sel = [...G.sel];
    const sig = G.wallMode ? 'wall' : G.place ? 'place' : sel.map(u => u.id + ':' + LJ.statusOf(u) + ':' + LJ.cargoOf(u) + ':' + (u.hp | 0)).join('|') + (G.village ? 'v' : '') + (G.up.dispatch ? 'd' : '');
    if (sig === panelSig) return;
    panelSig = sig;
    const p = $('panel');
    if (G.wallMode) { p.innerHTML = '<div>Palisade<div class="st">Drag to build · $' + LJ.WALL_COST.m + ' + ' + LJ.WALL_COST.w + ' wood per section</div></div><button data-act="walldone">Done</button>'; return; }
    if (G.place) { p.innerHTML = '<div>Place the ' + LJ.BLD[G.place.kind].name.toLowerCase() + '</div><button data-act="cancel">Cancel</button>'; return; }
    if (!sel.length) { p.innerHTML = ''; return; }
    const u = sel[0], cargo = sel.reduce((a, b) => a + LJ.cargoOf(b), 0), has = k => sel.some(s => s.kind === k);
    const allJacks = sel.every(s => s.kind === 'jack');
    const title = sel.length > 1 ? sel.length + (allJacks ? ' Jacks' : ' units') : u.name + (u.kind === 'jack' && u.hp < 100 ? ' · ♥ ' + Math.ceil(u.hp) : '');
    const st = sel.length > 1 ? 'Carrying ' + cargo : LJ.statusOf(u) + (u.kind === 'dozer' ? '' : ' · ' + cargo + '/' + LJ.capOf(u));
    let btn = '';
    if (has('jack') && G.count.sawmill) btn += '<button data-act="saw">Saw lumber</button>';
    if ((has('jack') || has('truck')) && G.village) btn += '<button data-act="sell">' + (has('truck') && !has('jack') && !G.up.dispatch ? 'Haul run' : 'Haul to market') + '</button>';
    else if (has('jack') && cargo > 0) btn += '<button data-act="sell">Sell wood</button>';
    p.innerHTML = '<div><div>' + title + '</div><div class="st">' + st + '</div></div>' + btn + '<button data-act="stop">Stop</button><button data-act="desel">✕</button>';
    const pic = iconCanvas(S.icons[ICON_OF[u.kind]], 12);
    pic.title = 'Show on the map (F)'; pic.style.cursor = 'pointer'; pic.onclick = () => ui.centerOnSelection();
    p.prepend(pic);
  }

  function refreshShop() {
    // Only show what you can buy now or next level; owned one-off upgrades drop off the list.
    const items = LJ.SHOP.filter(s => s.level <= G.level + 1);
    const states = items.map(s => LJ.shopState(s));
    const sig = states.map(s => s.st + s.label).join('|') + G.level;
    $('shopDot').classList.toggle('on', states.some(s => s.st === 'ok'));
    if (sig === shopSig) return;
    shopSig = sig;
    const list = $('shopList');
    list.innerHTML = '';
    items.forEach((s, i) => {
      const st = states[i];
      if (st.st === 'owned') return;
      const d = document.createElement('div');
      d.className = 'item ' + st.st;
      d.innerHTML = '<div><div class="nm">' + s.name + '</div><div class="ds">' + s.desc + (st.st === 'locked' ? ' <i>(' + st.costText + ')</i>' : '') + '</div></div>' +
        '<button data-id="' + s.id + '" data-name="' + s.name + '">' + st.label + '</button>';
      d.prepend(iconCanvas(S.icons[s.icon]));
      list.appendChild(d);
    });
    const soon = document.createElement('div');
    soon.className = 'soon'; soon.textContent = G.level < 9 ? 'More arrives in later levels…' : 'That is everything. Finish the job.';
    list.appendChild(soon);
  }

  function refreshOrder() {
    const o = G.order, el = $('order');
    const sig = !o ? '' : o.state + o.got + ':' + Math.ceil(o.state === 'offer' ? o.ttl : o.time);
    if (sig === orderSig) return;
    orderSig = sig;
    if (!o) { el.className = ''; el.innerHTML = ''; return; }
    el.className = 'open ' + o.state + (o.state === 'active' && o.time < 30 ? ' urgent' : '');
    el.innerHTML = o.state === 'offer'
      ? '<div class="ot">Market order</div><div>' + o.qty + ' ' + o.kind + ' within ' + mmss(o.time) + '</div><div class="ob">Bonus $' + o.bonus + ' · late fee $' + Math.round(o.bonus * 0.2 / 5) * 5 + '</div>' +
        '<div class="obtn"><button data-act="yes">Accept</button><button data-act="no">Decline (' + Math.ceil(o.ttl) + ')</button></div>'
      : '<div class="ot">Order: ' + o.got + ' / ' + o.qty + ' ' + o.kind + '</div><div class="otime">' + mmss(o.time) + '</div><div class="ob">Bonus $' + o.bonus + '</div>';
  }

  // ---------- Minimap ----------
  function drawMini() {
    const w = G.world; if (!w) return;
    if (!mimg || mini.width !== w.W) { mini.width = w.W; mini.height = w.H; mimg = mctx.createImageData(w.W, w.H); }
    const d = mimg.data;
    for (let i = 0; i < w.N; i++) {
      const t = w.type[i], o = w.obj[i];
      let r, g, b;
      if (w.bld[i]) { r = 214; g = 84; b = 52; }
      else if (o >= 1 && o <= 3) { if (o === 3) { r = 120; g = 150; b = 40; } else { r = 26; g = o === 1 ? 84 : 104; b = 40; } }
      else if (t === T.WATER) { r = 52; g = 122; b = 200; }
      else if (t === T.ROCK) { r = 128; g = 126; b = 122; }
      else if (t === T.ROAD) { r = 196; g = 160; b = 108; }
      else if (t === T.BRIDGE) { r = 120; g = 80; b = 44; }
      else if (t === T.DIRT || t === T.GRAVEL) { r = 150; g = 118; b = 80; }
      else { const L = w.lush[i]; r = 150 - 70 * L; g = 130 + 32 * L; b = 80 - 20 * L; }
      if (!G.fog[i]) { r = 12; g = 18; b = 13; }
      d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    mctx.putImageData(mimg, 0, 0);
    // The last stragglers blink so they can be found.
    if (G.total - G.cleared <= 40 && Math.floor(G.time * 3) % 2) {
      mctx.fillStyle = '#ffe84a';
      for (let i = 0; i < w.N; i++) if (LJ.isTree(i)) mctx.fillRect((i % w.W) - 1, ((i / w.W) | 0) - 1, 3, 3);
    }
    for (const u of G.units) { mctx.fillStyle = u.kind === 'jack' ? '#fff' : '#ffd84a'; mctx.fillRect((u.x / TS) | 0, (u.y / TS) | 0, u.kind === 'jack' ? 1 : 2, u.kind === 'jack' ? 1 : 2); }
    mctx.fillStyle = '#ff2a1a';
    for (const a of G.animals) if (LJ.seenPx(a.x, a.y)) mctx.fillRect(((a.x / TS) | 0) - 1, ((a.y / TS) | 0) - 1, 2, 2);
    mctx.strokeStyle = 'rgba(255,255,255,0.9)'; mctx.lineWidth = 1;
    mctx.strokeRect(Math.round(G.cam.x / TS) + 0.5, Math.round(G.cam.y / TS) + 0.5, Math.round(vwW() / TS), Math.round(vwH() / TS));
  }

  ui.reset = function () { panelSig = shopSig = orderSig = 'x'; $('overlay').innerHTML = ''; };

  ui.tick = function (dt) {
    const sp = 260 * dt / (zoom / 3);
    let mx = 0, my = 0;
    if (keys.a || keys.arrowleft) mx--; if (keys.d || keys.arrowright) mx++;
    if (keys.w || keys.arrowup) my--; if (keys.s || keys.arrowdown) my++;
    // Edge scrolling: the mouse near a window edge moves the camera (not while dragging, in a menu or during the ending).
    if (mouse && !G.cine && !G.drag && !$('modal').classList.contains('open')) {
      const E = 14;
      if (mouse[0] < E) mx--; else if (mouse[0] > innerWidth - E) mx++;
      if (mouse[1] < E) my--; else if (mouse[1] > innerHeight - E) my++;
    }
    if ((mx || my) && !G.cine) { G.cam.x += mx * sp; G.cam.y += my * sp; clampCam(); }
    if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('show');
    if ((miniT -= dt) <= 0) { miniT = 0.25; drawMini(); }

    const set = (el, v) => { if (el.textContent !== String(v)) el.textContent = v; };
    set($('c-money').querySelector('b'), G.money.toLocaleString('en-US'));
    $('c-money').classList.toggle('debt', G.money < 0);
    set($('c-wood').querySelector('b'), G.wood);
    $('stockBtn').style.display = G.village ? 'none' : '';
    set($('stockBtn'), G.stockpile ? 'Stockpiling' : 'Selling');
    $('c-lumber').style.display = G.village ? '' : 'none';
    set($('c-lumber').querySelector('b'), G.lumber);
    $('c-stone').style.display = G.stone > 0 || LJ.countKind('dozer') ? '' : 'none';
    set($('c-stone').querySelector('b'), G.stone);
    $('c-pop').style.display = G.village ? '' : 'none';
    const bill = G.units.reduce((a, u) => a + u.wage, 0);
    set($('c-pop').querySelector('b'), LJ.jackCount() + '/' + LJ.popCap());
    set($('payTxt'), bill ? 'pay $' + bill + ' in ' + mmss(G.payT) : '');
    const goal = G.thr[G.level - 1];
    set($('lvl'), G.level);
    set($('lvlTxt'), G.levelDone ? G.cleared + ' trees' : Math.min(G.cleared, goal) + ' / ' + goal + ' trees');
    const quota = G.quota[G.level - 1] || 0;
    set($('quota'), quota && !G.levelDone ? '$' + Math.min(G.earned, quota).toLocaleString('en-US') + ' / ' + quota.toLocaleString('en-US') + ' earned' : '');
    $('lvlFill').style.width = 'calc(' + Math.min(1, G.cleared / goal) * 100 + '% - 4px)';
    set($('hint'), hint());
    refreshPanel(); refreshShop(); refreshOrder();
  };

  // Speech bubbles and floating numbers are DOM elements positioned over the canvas.
  ui.sync = function () {
    const ov = $('overlay'), cx = Math.round(G.cam.x), cy = Math.round(G.cam.y);
    for (const f of G.floats) {
      if (!f.el) { f.el = document.createElement('div'); f.el.className = 'float ' + f.cls; f.el.textContent = f.text; ov.appendChild(f.el); }
      f.el.style.transform = 'translate(' + ((f.x - cx) * zoom) + 'px,' + ((f.y - cy - f.t * 14) * zoom) + 'px) translate(-50%,-100%)';
      f.el.style.opacity = Math.min(1, (1.4 - f.t) * 2.5);
    }
    for (const b of G.bubbles) {
      if (!b.el) { b.el = document.createElement('div'); b.el.className = 'bubble'; b.el.textContent = b.text; ov.appendChild(b.el); }
      const lift = b.u.kind === 'jack' ? 25 : 24;
      b.el.style.transform = 'translate(' + ((b.u.x - cx) * zoom) + 'px,' + ((b.u.y - cy - lift) * zoom) + 'px) translate(-50%,-100%)';
    }
  };
})();
