'use strict';
// HUD, shop, minimap, dialogs and all pointer/keyboard input.
(function () {
  const TS = LJ.TS, T = LJ.T, G = LJ.G, S = LJ.sprites;
  const $ = id => document.getElementById(id);
  const ui = (LJ.ui = {});
  const ZOOMS = [1, 1.5, 2, 3, 4];
  const ICON_OF = { jack: 'jack', truck: 'truck', shuttle: 'shuttle', dozer: 'dozer', harv: 'harv', feller: 'feller' };
  let cv, zi = 3, zoom = 3, keys = {}, lastClickU = null, lastClickT = 0, toastT = 0, panelSig = '', shopSig = '', orderSig = '';
  let hudBottom = -1, panelsTop = -1;
  let mini, mctx, mimg, miniT = 0, mouse = null; // mouse: last pointer position in window pixels, null when outside
  let muted = false, idleI = 0, groups = {}, lastGroup = '', lastGroupT = 0, cursor = '';
  const PING = 0.45; // seconds an order marker stays on the ground
  ui.PING = PING;
  ui.pings = [];     // { x, y, c, t }: where the last orders landed, drawn by render.js

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
    // Text and newly unlocked resource chips can wrap the HUD without a window resize.
    if (typeof ResizeObserver !== 'undefined') {
      const layout = new ResizeObserver(layoutPanels);
      layout.observe($('hud')); layout.observe($('hint'));
    }
    bindPointer(); bindKeys(); bindButtons(); bindMini();
    // A clicked button must not keep the keyboard: Space and Enter belong to the game, not to the last button pressed.
    document.addEventListener('click', e => { const b = e.detail && e.target.closest('#hud button, #bottom button, #shop button'); if (b) b.blur(); });
    addEventListener('pointermove', e => { if (e.pointerType === 'mouse') mouse = [e.clientX, e.clientY]; });
    document.addEventListener('mouseleave', () => { mouse = null; });
    addEventListener('blur', () => { mouse = null; });
  };

  function layoutPanels() {
    const hud = $('hud'), hint = $('hint');
    if (!hud.getBoundingClientRect) return;
    // Read both sizes before writing styles, and only write when geometry changes.
    const bottom = Math.ceil(hud.getBoundingClientRect().bottom);
    const hintHeight = hint.offsetHeight;
    const below = bottom + 8 + (hintHeight ? hintHeight + 8 : 0);
    if (bottom !== hudBottom) { $('game').style.setProperty('--hud-bottom', bottom + 'px'); hudBottom = bottom; }
    if (below !== panelsTop) { $('game').style.setProperty('--panels-top', below + 'px'); panelsTop = below; }
  }

  function resetZoom() { zi = innerWidth < 700 ? 2 : 3; zoom = ZOOMS[zi]; resize(); }
  function resize() {
    const cw = Math.ceil(innerWidth / zoom), ch = Math.ceil(innerHeight / zoom);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; } // reallocating clears the canvas: only when the size changes
    cv.style.width = cv.width * zoom + 'px'; cv.style.height = cv.height * zoom + 'px';
    LJ.ctx.imageSmoothingEnabled = false;
    // Until the game has started, keep the jack in view however the window changes.
    if (G.world && G.time === 0 && G.units[0]) ui.centerOnStart();
    clampCam();
    layoutPanels();
  }

  function clampCam() {
    const w = G.world; if (!w) return;
    const mw = w.W * TS, mh = w.H * TS, vw = vwW(), vh = vwH();
    // Half a viewport of black margin lets every edge tile reach the clear centre,
    // away from the HUD, minimap and selection panel, even when zoomed out.
    G.cam.x = LJ.clamp(G.cam.x, -vw / 2, mw - vw / 2);
    G.cam.y = LJ.clamp(G.cam.y, -vh / 2, mh - vh / 2);
  }

  // Moves the camera by a distance in screen pixels.
  function panBy(dx, dy) { G.cam.x += dx / zoom; G.cam.y += dy / zoom; clampCam(); }

  function setZoom(i, ax, ay) {
    i = LJ.clamp(i, 0, ZOOMS.length - 1);
    if (i === zi) return;
    ax = ax === undefined ? innerWidth / 2 : ax; ay = ay === undefined ? innerHeight / 2 : ay;
    const wx = G.cam.x + ax / zoom, wy = G.cam.y + ay / zoom;
    zi = i; zoom = ZOOMS[i];
    G.cam.x = wx - ax / zoom; G.cam.y = wy - ay / zoom;
    resize();
  }

  const LEAD = 60;
  ui.centerOnStart = () => ui.centerOn(G.units[0].x + LEAD, G.units[0].y); // the opening view: the truck at the edge of the map
  ui.centerOn = function (x, y) { G.cam.x = x - vwW() / 2; G.cam.y = y - vwH() / 2; clampCam(); };
  // Holds a moving thing at a fixed spot on screen. The camera moves in the same whole pixels at the same moments as
  // the thing itself, so it stays rock steady while the world scrolls past (an easing camera makes it shake).
  // It sits LEAD pixels behind the centre, so more of the road ahead is in view.
  ui.lockOn = function (x, y) {
    G.cam.x = Math.round(x) + LEAD - Math.round(vwW() / 2); G.cam.y = Math.round(y) - Math.round(vwH() / 2);
    clampCam();
  };
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

  ui.centerOnCamp = function () { const b = G.base; if (b && !G.cine) ui.centerOn((b.tx + b.w / 2) * TS, (b.ty + b.h / 2) * TS); };

  const ping = (x, y, c) => ui.pings.push({ x, y, c, t: 0 });
  const tilePing = (i, c) => ping((i % G.world.W) * TS + 8, ((i / G.world.W) | 0) * TS + 8, c);

  // Jacks with nothing to do and no order to stay put.
  const idleJacks = () => LJ.jacks().filter(u => !u.task && !u.path.length && !u.hold && !u.fighting);
  function nextIdle() {
    const idle = idleJacks();
    if (!idle.length) { ui.toast('Every jack is busy.'); return; }
    const u = idle[idleI++ % idle.length];
    G.sel = new Set([u]); ui.centerOn(u.x, u.y);
  }

  function setShop(open) {
    $('shop').classList.toggle('open', open);
    $('game').classList.toggle('shopping', open); // small screens tuck the selection panel away under the shop
  }
  const shopOpen = () => $('shop').classList.contains('open');

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
  const hutAt = (wx, wy, slack) => G.huts.find(h => h.alive && G.fog[h.tile] && Math.abs(wx - h.x) <= 17 + slack && wy >= h.y - 24 - slack && wy <= h.y + 4 + slack);
  // What a click here would do, as a mouse cursor: pointer on things to select or work on, crosshair on things to attack or place.
  function cursorAt(wx, wy) {
    if (G.cine || G.arrival || G.paused) return 'default';
    if (G.place || G.wallMode) return 'crosshair';
    if (pickUnit(wx, wy, 0)) return 'pointer';
    const beast = hutAt(wx, wy, 0) || pickAnimal(wx, wy, 0);
    if (beast && LJ.seenPx(beast.x, beast.y)) return 'crosshair';
    return treeAt(wx, wy) >= 0 ? 'pointer' : 'default';
  }
  function setCursor(c) { if (c !== cursor) cv.style.cursor = cursor = c; }
  const isExit = i => { const w = G.world, x = i % w.W, y = (i / w.W) | 0; return x <= 1 && Math.abs(y - w.roadY) <= 1; };

  function click(wx, wy, right, touch, shift) {
    if (G.cine) { if (G.cine.phase === 'talk') LJ.ending.next(); return; }
    if (G.paused || G.arrival) return;
    if (shopOpen() && innerWidth <= 700) { setShop(false); return; } // on a phone the shop is a sheet: a tap beside it closes it
    if (G.place) {
      if (right) { G.place = null; return; }
      G.hover = [wx, wy];
      const kind = G.place.kind;
      if (LJ.tryPlace(Math.floor(wx / TS) - (G.place.w >> 1), Math.floor(wy / TS) - (G.place.h >> 1))) ui.toast(LJ.BLD[kind].name + ' construction started — ' + LJ.BLD[kind].build + ' seconds.');
      else if (G.place) ui.toast("Can't build there — it needs a clear, explored spot the road can reach.");
      return;
    }
    const slack = touch ? 5 : 0;
    const u = !right && pickUnit(wx, wy, slack);
    if (u) {
      const now = performance.now();
      if (lastClickU === u && now - lastClickT < 350) G.sel = new Set(G.units.filter(o => o.kind === u.kind));
      else if (shift && G.sel.has(u)) G.sel.delete(u); // shift-click adds to the selection, or takes a unit out again
      else { if (!shift) G.sel.clear(); G.sel.add(u); LJ.poke(u); }
      lastClickU = u; lastClickT = now;
      LJ.sfx('click');
      return;
    }
    const tr = treeAt(wx, wy), idx = tileAt(wx, wy);
    let sel = [...G.sel];
    const doze = LJ.canDoze(idx) && G.fog[idx] && sel.some(s => s.kind === 'dozer');
    if (tr >= 0 && !doze && LJ.whack(tr)) return;
    const beast = hutAt(wx, wy, slack) || pickAnimal(wx, wy, slack);
    if (beast && LJ.seenPx(beast.x, beast.y)) {
      if (!sel.some(s => s.kind === 'jack')) sel = LJ.jacks();
      G.sel = new Set(sel);
      LJ.cmd.hunt(sel, beast); LJ.sfx('click'); ping(beast.x, beast.y - 6, '#ff5a3a');
      return;
    }
    if (doze) { LJ.cmd.dozeTo(sel, idx); LJ.sfx('click'); tilePing(idx, '#ff9a2a'); return; }
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
      if (to >= 0) { LJ.cmd.move(sel, to); LJ.sfx('click'); tilePing(to, '#fff'); }
    }
  }

  function boxSelect(d, add) {
    const x0 = Math.min(d.x0, d.x1), x1 = Math.max(d.x0, d.x1), y0 = Math.min(d.y0, d.y1), y1 = Math.max(d.y0, d.y1);
    G.sel = new Set([...(add ? G.sel : []), ...G.units.filter(u => u.x >= x0 && u.x <= x1 && u.y - 6 >= y0 && u.y - 6 <= y1)]);
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
      if (G.arrival) { if (!G.paused) LJ.skipIntroLine(); return; } // a tap moves the story on
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
      if (e.pointerType === 'mouse') setCursor(p && p.moved && p.mode === 'pan' ? 'grabbing' : p ? cursor : cursorAt(G.hover[0], G.hover[1]));
      if (!p) return;
      if (p.mode === 'wall') { const [wx, wy] = world(e); G.wallDrag = tileLine(tileAt(p.wx, p.wy), tileAt(wx, wy)); return; }
      const dx = e.clientX - p.lx, dy = e.clientY - p.ly;
      p.lx = e.clientX; p.ly = e.clientY;
      if (!p.moved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > (p.touch ? 10 : 5)) p.moved = true;
      if (!p.moved) return;
      if (p.mode === 'cmd') p.mode = 'pan'; // dragging with the right button pans the map
      if (p.mode === 'pan' || p.mode === 'pinch') {
        const k = p.mode === 'pinch' ? 2 : 1;
        panBy(-dx / k, -dy / k);
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
        if (!G.paused && !G.cine) boxSelect(G.drag, p.shift);
        G.drag = null;
      }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); G.drag = null; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    // Two-finger scrolling (trackpad) or the mouse wheel moves the map. A trackpad pinch arrives as a wheel event
    // with ctrlKey set and zooms; so do the zoom buttons and the + / - keys.
    let pinch = 0;
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      if (G.arrival) return;
      if (e.ctrlKey) {
        pinch += e.deltaY;
        if (Math.abs(pinch) > 30) { setZoom(zi + (pinch < 0 ? 1 : -1), e.clientX, e.clientY); pinch = 0; }
        return;
      }
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1; // lines or pages, from some mice
      panBy(e.deltaX * k, e.deltaY * k);
    }, { passive: false });
    // Safari reports trackpad pinches as gesture events instead.
    let gScale = 1;
    cv.addEventListener('gesturestart', e => { e.preventDefault(); gScale = 1; });
    cv.addEventListener('gesturechange', e => {
      e.preventDefault();
      if (e.scale / gScale > 1.25) { setZoom(zi + 1, e.clientX, e.clientY); gScale = e.scale; }
      else if (e.scale / gScale < 0.8) { setZoom(zi - 1, e.clientX, e.clientY); gScale = e.scale; }
    });
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
      if (LJ.title.isOpen()) return;
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (!mod) keys[k] = true;
      if ($('modal').classList.contains('open')) { // Escape takes a dialog's way out; Enter presses the focused button by itself
        const out = $('modal').querySelector('[data-esc]');
        if (e.key === 'Escape' && out) out.click();
        return;
      }
      if (G.cine) { if ((e.key === ' ' || e.key === 'Enter') && G.cine.phase === 'talk') LJ.ending.next(); return; }
      if (G.arrival) {
        if ((e.key === ' ' || e.key === 'Enter') && !G.paused) { e.preventDefault(); LJ.skipIntroLine(); }
        else if (e.key === 'Escape') ui.showMenu();
        return;
      }
      if (mod) { if (k === 'a') { e.preventDefault(); G.sel = new Set(LJ.jacks()); } return; } // leave the browser's own shortcuts alone
      const digit = /^Digit([1-9])$/.exec(e.code);
      if (digit) { group(digit[1], e.shiftKey); return; }
      if (k === 'f' || k === ' ') { e.preventDefault(); ui.centerOnSelection(); }
      else if (k === 'h' || k === 'home') ui.centerOnCamp();
      else if (k === 'tab') { e.preventDefault(); nextIdle(); }
      else if (k === 'b') setShop(!shopOpen());
      else if (k === 'm') $('game').classList.toggle('mini-on');
      else if (k === 'x') LJ.cmd.stop([...G.sel]);
      else if (k === 'p') ui.showMenu();
      else if (k === '+' || k === '=') setZoom(zi + 1);
      else if (k === '-' || k === '_') setZoom(zi - 1);
      else if (k === 'escape') {
        // Back out one step at a time; with nothing left to back out of, Escape opens the menu.
        if (G.place || G.wallMode) { G.place = null; G.wallMode = false; G.wallDrag = null; }
        else if (shopOpen()) setShop(false);
        else if (G.sel.size) G.sel.clear();
        else ui.showMenu();
      }
    });
    addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    addEventListener('blur', () => { keys = {}; });
  }

  // Numbered groups: Shift+digit remembers the selection, the digit recalls it, the digit twice also jumps there.
  // (Ctrl/Cmd+digit belongs to the browser's tabs.)
  function group(n, assign) {
    if (assign) {
      if (!G.sel.size) return;
      groups[n] = [...G.sel];
      ui.toast('Group ' + n + ': ' + G.sel.size + (G.sel.size > 1 ? ' units' : ' unit') + '. Press ' + n + ' to select it.');
      return;
    }
    const alive = (groups[n] || []).filter(u => G.units.includes(u));
    if (!alive.length) return;
    G.sel = new Set(alive);
    const now = performance.now();
    if (lastGroup === n && now - lastGroupT < 400) ui.centerOnSelection();
    lastGroup = n; lastGroupT = now;
  }

  function bindButtons() {
    $('toolbar').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || G.arrival) return;
      LJ.audioInit(); LJ.sfx('click');
      if (b.dataset.act === 'stop') LJ.cmd.stop([...G.sel]);
      else if (b.dataset.act === 'zoomin') setZoom(zi + 1);
      else if (b.dataset.act === 'zoomout') setZoom(zi - 1);
      else if (b.dataset.act === 'shop') setShop(!shopOpen());
      else if (b.dataset.act === 'idle') nextIdle();
      else if (b.dataset.act === 'map') $('game').classList.toggle('mini-on');
    });
    $('shopClose').onclick = () => setShop(false);
    $('shopList').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || G.arrival) return;
      LJ.audioInit();
      const r = LJ.buy(b.dataset.id);
      if (r === 'wall') { setShop(false); ui.toast('Drag to build a palisade. Right-click or Done when finished.'); }
      else if (r === 'place') {
        setShop(false);
        if (!G.hover) G.hover = [G.cam.x + vwW() / 2, G.cam.y + vwH() / 2];
        ui.toast('Pick a clear spot for the ' + b.dataset.name.toLowerCase());
      } else if (r) ui.toast(b.dataset.id === 'base' ? 'Village upgrade started — watch the yellow construction bar.' : b.dataset.id === 'jack' ? 'A new jack is on the way…' : LJ.VEH[b.dataset.id] ? 'A ' + b.dataset.name.toLowerCase() + ' is coming up the road!' : b.dataset.name + ' purchased!');
    });
    $('panel').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || G.arrival) return;
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
    $('soundBtn').onclick = toggleSound;
    $('menuBtn').onclick = () => ui.showMenu();
    $('findsBtn').onclick = () => { if (!G.cine && !G.arrival) ui.showFinds(); };
    $('helpBtn').onclick = () => { if (!G.cine) ui.showHelp(); };
  }

  function toggleSound() {
    LJ.audioInit();
    muted = LJ.toggleMute();
    $('soundBtn').style.opacity = muted ? 0.4 : 1;
    $('soundBtn').title = muted ? 'Sound is off' : 'Sound is on';
  }

  // ---------- Dialogs ----------
  // A dialog pauses the game. Each button names its action in data-a (a plain button is "ok"); pressing one closes the
  // dialog, resumes the game and then runs the action, which may open the next dialog. The button marked data-esc is
  // also the Escape key, as is a dialog's only button.
  function dialog(html, acts) {
    const m = $('modal');
    m.innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' + html + '</div>';
    m.classList.add('open');
    G.paused = true;
    const buttons = [...m.querySelectorAll('button')];
    for (const b of buttons) {
      b.onclick = () => {
        LJ.audioInit(); LJ.sfx('click');
        m.classList.remove('open'); G.paused = false;
        const run = acts[b.dataset.a || 'ok'];
        if (run) run();
      };
    }
    if (buttons.length === 1) buttons[0].dataset.esc = '';
    (m.querySelector('[data-esc]') || buttons[0]).focus({ preventScroll: true });
  }
  // The common case: one message, one button.
  const modal = (html, onOk) => dialog(html, { ok: onOk });

  ui.showMenu = function () {
    if (G.cine || LJ.title.isOpen() || $('modal').classList.contains('open')) return;
    dialog('<h1>Paused</h1><div class="menu">' +
      '<button data-a="resume" data-esc>Back to work</button>' +
      '<button data-a="help" class="ghost">How to play</button>' +
      '<button data-a="sound" class="ghost">Sound: ' + (muted ? 'off' : 'on') + '</button>' +
      '<button data-a="music" class="ghost">Music: ' + (LJ.music.isOn() ? 'on' : 'off') + '</button>' +
      '<button data-a="fresh" class="ghost">New game</button></div>' +
      '<p class="fine">The game saves itself as you play.</p>', {
      help: ui.showHelp,
      sound: () => { toggleSound(); ui.showMenu(); },
      music: () => { LJ.music.toggle(); ui.showMenu(); },
      fresh: () => dialog('<h1>Start a new game?</h1><p>This forest and everything you built in it will be replaced by a fresh one.</p>' +
        '<div class="row"><button data-a="yes">Start a new game</button><button data-a="no" class="ghost" data-esc>Keep playing</button></div>', { yes: ui.restart, no: ui.showMenu })
    });
  };

  ui.showFinds = function () {
    const found = G.finds.filter(f => f.found);
    modal('<h1>Forest finds</h1><p>' + found.length + ' / ' + G.finds.length + ' recovered. Explore for golden glints, clear the tree above them, then bring a Jack or machine nearby.</p>' +
      '<ul>' + Object.values(LJ.discoveries.recipes).map(r => '<li><b>' + r.name + '</b>: ' + r.desc + (G.recipes.includes(r.id) ? ' <b>Recovered ✓</b>' : ' — still hidden') + '</li>').join('') + '</ul>' +
      '<p>Gold and lost cash boxes fund the operation. Recipe bonuses apply to your whole crew as soon as they are recovered.</p><button>Back to the forest</button>');
  };

  // The how-to-play dialog behind the ? button.
  ui.showHelp = function () {
    const row = (what, mouse, touch, key) => '<tr><th>' + what + '</th><td>' + mouse + '</td><td>' + touch + '</td><td>' + key + '</td></tr>';
    modal(
    '<h1>How to play</h1>' +
    '<ul><li><b>Clear the forest.</b> Send a jack to a tree and he keeps cutting whatever he can see. Wood goes back to camp; your truck sells the surplus at the market down the road west.</li>' +
    '<li><b>Grow the camp.</b> The Shop has tools, more jacks, buildings and machines. Upgrade the tent into a village; sawmills turn wood into lumber, Logging Trucks fetch wood from deep in the forest.</li>' +
    '<li><b>Mind the forest.</b> The map is unexplored and it bites back. Jacks heal near home and learn through work. Forest villages defend themselves; destroying a hut stops its reinforcements for good.</li></ul>' +
    '<table class="keys"><tr><td></td><th>Mouse</th><th>Touch</th><th>Keys</th></tr>' +
    row('Select', 'Click a unit, drag a box. Shift adds. Double-click takes every unit of that kind.', 'Tap a unit. Double-tap takes every unit of that kind.', 'Ctrl/⌘+A all jacks. Shift+1–9 saves a group, 1–9 recalls it.') +
    row('Order', 'Click or right-click a tree, animal, hut, the sawmill, the market sign or open ground. Keep clicking a tree being chopped to land extra whacks.', 'Tap the same things.', 'X stops. Esc deselects.') +
    row('Move the map', 'Two-finger scroll or wheel, screen edges, right-drag, or the minimap.', 'Drag. The map button shows the minimap.', 'WASD or arrows. F selection, H camp, Tab next idle jack.') +
    row('Zoom', 'Trackpad pinch or the − + buttons.', 'Pinch.', '− and +') +
    row('Menus', 'Shop is in the toolbar, ≡ pauses.', 'Shop is in the toolbar, ≡ pauses.', 'B shop. Esc backs out one step, then pauses.') +
    '</table><p class="fine">You can pan past the forest edge to bring the outermost tiles clear of the panels.</p><button>Back to work</button>');
  };

  // The opening screen. It is shown once, at boot, over a fresh game that is paused and waiting.
  ui.showTitle = function () {
    G.paused = true;
    const saved = LJ.hasSave();
    const fresh = { label: 'New game', ghost: saved, run: () => { LJ.clearSave(); G.paused = false; } };
    const resume = {
      label: 'Continue', run: () => {
        if (LJ.loadGame()) { ui.reset(); resize(); } else { ui.restart(); ui.toast('The saved game could not be loaded, so here is a fresh forest.'); }
        G.paused = false;
      }
    };
    LJ.title.open(saved ? [resume, fresh] : [fresh]);
  };

  ui.levelUp = function (items) {
    modal('<h1>Level ' + G.level + '</h1><p>' + G.cleared + ' trees cleared and €' + G.earned.toLocaleString('en-US') + ' earned. Business is booming.</p>' +
      (items.length ? '<p><b>New in the Shop</b></p><ul>' + items.map(i => '<li><b>' + i.name + '</b> — ' + i.desc + '</li>').join('') + '</ul>' : '') +
      '<p>' + LJ.danger(G.level) + '</p><button>Back to work</button>');
  };

  ui.gameOver = function () {
    modal('<h1>The forest wins</h1><p>Your last jack is gone. ' + G.cleared + ' trees cleared, ' + G.kills + ' animals killed.</p>' +
      '<p>The trees will not remember you.</p><button>Try again</button>', ui.restart);
  };

  ui.cineStart = function () {
    $('game').classList.add('cine');
    setShop(false);
    $('modal').classList.remove('open');
    G.paused = false;
  };

  ui.introLine = function (text, beat, total, place) {
    const el = $('intro');
    $('game').classList.toggle('arriving', !!text);
    if (!text) { el.classList.remove('open'); el.innerHTML = ''; return; }
    el.innerHTML = '<div class="portrait"></div><div><div class="nm">Jack · ' + place + ' <span>' + (beat + 1) + ' / ' + total + '</span></div><p></p><div class="more">tap to continue ▸</div></div>';
    el.querySelector('.portrait').appendChild(iconCanvas(S.jack.axe.idle.r, 24));
    el.querySelector('p').textContent = text;
    el.classList.add('open');
    LJ.voice.say(text, 'jack');
  };

  // Hides the story box while the opening drive carries on in silence.
  ui.introQuiet = () => $('intro').classList.remove('open');

  // One line of the closing conversation: { who: 'suit' | 'jack', text }.
  const SPEAKER = { suit: () => ['Mr. Grant, Development', S.suit.idle.r], jack: () => ['Jack', S.jack.axe.idle.r] };
  ui.cineLine = function (line) {
    const el = $('cine');
    if (!line) { el.className = ''; el.innerHTML = ''; return; }
    const [name, face] = SPEAKER[line.who]();
    el.className = 'open by-' + line.who;
    el.innerHTML = '<div class="who"></div><div><div class="nm"></div><div class="tx"></div><div class="more">tap to continue ▸</div></div>';
    el.querySelector('.who').appendChild(iconCanvas(face, 22));
    el.querySelector('.nm').textContent = name;
    el.querySelector('.tx').textContent = line.text;
    LJ.voice.say(line.text, line.who);
  };

  ui.endScreen = function () {
    const m = $('modal');
    m.innerHTML = '<div class="dialog"><h1>Game over.</h1>' +
      '<p>' + G.cleared.toLocaleString('en-US') + ' trees cleared · ' + G.kills + ' animals killed · ' + G.folkKilled + ' forest folk killed · €' + G.earned.toLocaleString('en-US') + ' earned</p>' +
      '<p>You received a €1,000,000 bonus and shares in the new AI data center. Your family is provided for.</p>' +
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
    LJ.clearSave();
    resetZoom();
    $('game').classList.remove('cine');
    $('again').classList.remove('open');
    ui.cineLine(null);
    LJ.newGame(); ui.reset();
    ui.centerOnStart();
    G.paused = false;
  };

  // ---------- Per-frame UI ----------
  function hint() {
    if (G.arrival) return '';
    if (G.levelDone || G.cine) return '';
    if (G.wallMode) return 'Drag to build a line of palisade. Enemies walk around open ends, so close the ring around what you want to protect.';
    if (G.place) return 'Pick a clear, explored spot the road can reach.';
    const nw = LJ.combat.nextWaveIn();
    if (G.wave.active && !G.wave.active.retreating) return 'The forest folk are attacking! Guard towers and jacks with laser pistols can hold them off.';
    if (nw !== null && nw < 30) return 'War drums in the forest… the next war party arrives in ' + mmss(nw) + '.';
    if (G.wave.hostile && !G.count.tower && G.level >= 3) return 'The forest folk will be back. Build Guard Towers and a palisade around the village.';
    if (G.money < 0) return "You're in debt: hired jacks and machines slack off until you're back in the black.";
    if (G.stockpile) return 'Stockpiling: automatic market loading is paused. Jacks and Logging Trucks still deliver to camp. Tap “Stockpiling” to resume selling.';
    const tasks = t => G.units.some(u => u.task && u.task.type === t), sel = [...G.sel];
    if (G.cleared >= G.thr[G.level - 1]) return 'Trees done! Now earn the rest of the quota: sell wood and lumber at the market.';
    if (sel.length && sel.every(u => u.kind === 'dozer')) return 'Tap a stump, rock or river tile. Nearby roots and rocks are cleared automatically; recovered root wood is delivered to camp.';
    if (sel.length && sel.every(u => u.kind === 'shuttle')) return 'Tap a clearing near your jacks to set a logging route. This truck collects wood there, delivers it to the village, and returns.';
    if (sel.length && sel.every(u => u.kind === 'truck') && !G.up.dispatch) return 'Tap the market sign (or “Haul run”) to send the truck on a trip.';
    if (!G.village && LJ.jackCount() < LJ.popCap() && G.money >= LJ.SHOP.find(it => it.id === 'jack').cost().m) return 'Hire an extra Jack in the Shop — he starts walking to your tent right away.';
    if (G.cleared === 0 && !tasks('work')) return 'Tap a tree to send your jack to work.';
    const idle = idleJacks().length;
    if (idle && G.cleared < G.total) return idle + (idle > 1 ? ' jacks see' : ' jack sees') + ' no trees. Find them with the idle button (Tab) and tap near the forest to send them there.';
    if (!G.village) {
      if (G.sold === 0) return 'Jacks bring wood to the tent. Your truck sells wood above the 20-wood building reserve; switch to Stockpiling to keep it all.';
      if (!Object.keys(G.up).length && G.money >= 40) return 'You can afford an upgrade — open the Shop.';
      if (G.cleared >= 8) return 'Next: upgrade the tent to a Cabin (€' + Math.max(0, G.money) + '/120, wood ' + G.wood + '/20). ' +
        (G.stockpile ? 'Wood is being stockpiled at the tent.' : 'Tap “Selling” to stockpile wood instead.');
      return '';
    }
    if (G.level >= 2 && LJ.jackCount() < 2) return 'Hire more jacks in the Shop. Each one wants €' + LJ.WAGE + ' every payday.';
    if (G.level >= 2 && !LJ.countKind('truck') && tasks('haul')) return 'The market is a long walk away. A Truck (€250) makes the trip in seconds, with 60 goods at a time.';
    if (G.level >= 2 && !G.count.sawmill && G.wood >= 20) return 'Build a Sawmill: jacks there turn wood into lumber worth €' + LJ.PRICE.lumber + ' each.';
    if (G.count.sawmill && G.wood >= 6 && G.lumber === 0 && !G.up.steam && !tasks('saw')) return 'Select a jack and tap the sawmill to saw lumber: €' + LJ.PRICE.lumber + ' each, instead of €' + LJ.PRICE.wood + ' per wood.';
    if (G.wood + G.lumber >= 10 && !tasks('haul') && !G.units.some(u => u.kind === 'truck' && u.state !== 'idle')) return 'Nothing sells itself: select a jack or truck and tap the market sign.';
    if (G.level >= 4 && !LJ.countKind('dozer')) return 'Rivers and rocks wall off most of the forest. A bulldozer can open a way through.';
    if (G.level === 10) { const left = G.total - G.cleared; return left + ' trees left standing. Every last one has to go — the minimap shows where.'; }
    return '';
  }

  function refreshPanel() {
    const sel = [...G.sel];
    const sig = G.wallMode ? 'wall' : G.place ? 'place' : sel.map(u => u.id + ':' + LJ.statusOf(u) + ':' + LJ.cargoOf(u) + ':' + (u.hp | 0) + ':' + (u.xp | 0)).join('|') + (G.village ? 'v' : '') + (G.up.dispatch ? 'd' : '');
    if (sig === panelSig) return;
    panelSig = sig;
    const p = $('panel');
    if (G.wallMode) { p.innerHTML = '<div>Palisade<div class="st">Drag to build · €' + LJ.WALL_COST.m + ' + ' + LJ.WALL_COST.w + ' wood per section</div></div><button data-act="walldone">Done</button>'; return; }
    if (G.place) { p.innerHTML = '<div>Place the ' + LJ.BLD[G.place.kind].name.toLowerCase() + '</div><button data-act="cancel">Cancel</button>'; return; }
    if (!sel.length) { p.innerHTML = ''; return; }
    const u = sel[0], cargo = sel.reduce((a, b) => a + LJ.cargoOf(b), 0), has = k => sel.some(s => s.kind === k);
    const allJacks = sel.every(s => s.kind === 'jack');
    const title = sel.length > 1 ? sel.length + (allJacks ? ' Jacks' : ' units') : u.name + (u.hp < LJ.maxHpOf(u) ? ' · ♥ ' + Math.ceil(u.hp) : '');
    const st = sel.length > 1 ? 'Carrying ' + cargo : LJ.statusOf(u) + ' · ' + cargo + '/' + LJ.capOf(u);
    let experience = '';
    if (sel.length === 1 && u.kind === 'jack') {
      const rank = LJ.rankOf(u), next = LJ.JACK_RANKS[LJ.JACK_RANKS.indexOf(rank) + 1];
      const bonus = Math.round((rank.work - 1) * 100);
      experience = '<div class="experience" title="Earn XP by felling trees, processing lumber and delivering goods. Higher ranks improve work, carrying and walking.">' +
        rank.name + ' · ' + Math.floor(u.xp || 0) + (next ? '/' + next.xp + ' XP' : ' XP · max') + (bonus ? ' · +' + bonus + '% work' : '') + '</div>';
    }
    let btn = '';
    if (has('jack') && G.count.sawmill) btn += '<button data-act="saw">Saw lumber</button>';
    if (has('jack') || has('truck')) btn += '<button data-act="sell">' + (has('truck') && !has('jack') && !G.up.dispatch ? 'Haul run' : 'Haul to market') + '</button>';
    p.innerHTML = '<div><div>' + title + '</div><div class="st">' + st + '</div>' + experience + '</div>' + btn + '<button data-act="stop">Stop</button><button data-act="desel">✕</button>';
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
      ? '<div class="ot">Market order</div><div>' + o.qty + ' ' + o.kind + ' within ' + mmss(o.time) + '</div><div class="ob">Bonus €' + o.bonus + ' · late fee €' + Math.round(o.bonus * 0.2 / 5) * 5 + '</div>' +
        '<div class="obtn"><button data-act="yes">Accept</button><button data-act="no">Decline (' + Math.ceil(o.ttl) + ')</button></div>'
      : '<div class="ot">Order: ' + o.got + ' / ' + o.qty + ' ' + o.kind + '</div><div class="otime">' + mmss(o.time) + '</div><div class="ob">Bonus €' + o.bonus + '</div>';
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
      else if (t === T.MUD) { r = 92; g = 70; b = 47; }
      else if (t === T.DIRT || t === T.GRAVEL) { r = 150; g = 118; b = 80; }
      else { const L = w.lush[i]; r = 150 - 70 * L; g = 130 + 32 * L; b = 80 - 20 * L; }
      if (t !== T.WATER && t !== T.ROCK && t !== T.BRIDGE && !w.bld[i] && !(o >= 1 && o <= 3)) {
        const damage = Math.min(1, Math.max(0, (w.wear[i] - 10) / 180)) * 0.8;
        r += (35 - r) * damage; g += (29 - g) * damage; b += (25 - b) * damage;
      }
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

  ui.reset = function () { panelSig = shopSig = orderSig = 'x'; groups = {}; ui.pings.length = 0; $('overlay').innerHTML = ''; ui.introLine(null); };

  ui.tick = function (dt) {
    const sp = 260 * dt / (zoom / 3);
    let mx = 0, my = 0;
    if (keys.a || keys.arrowleft) mx--; if (keys.d || keys.arrowright) mx++;
    if (keys.w || keys.arrowup) my--; if (keys.s || keys.arrowdown) my++;
    // Edge scrolling: the mouse near a window edge moves the camera (not while dragging, in a menu or during the ending).
    if (mouse && !G.cine && !G.arrival && !G.drag && !$('modal').classList.contains('open')) {
      const E = 14;
      if (mouse[0] < E) mx--; else if (mouse[0] > innerWidth - E) mx++;
      if (mouse[1] < E) my--; else if (mouse[1] > innerHeight - E) my++;
    }
    if ((mx || my) && !G.cine && !G.arrival) panBy(mx * sp * zoom, my * sp * zoom);
    if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('show');
    if ((miniT -= dt) <= 0) { miniT = 0.25; drawMini(); }
    for (const p of ui.pings) p.t += dt;
    while (ui.pings.length && ui.pings[0].t >= PING) ui.pings.shift();
    const idle = G.arrival ? 0 : idleJacks().length;
    $('idleBtn').style.display = idle ? '' : 'none';
    if ($('idleN').textContent !== String(idle)) $('idleN').textContent = idle;
    $('stopBtn').disabled = !G.sel.size;

    const set = (el, v) => { if (el.textContent !== String(v)) el.textContent = v; };
    set($('c-money').querySelector('b'), G.money.toLocaleString('en-US'));
    $('c-money').classList.toggle('debt', G.money < 0);
    set($('c-wood').querySelector('b'), G.wood);
    $('stockBtn').style.display = '';
    set($('stockBtn'), G.stockpile ? 'Stockpiling' : 'Selling');
    $('c-lumber').style.display = G.village ? '' : 'none';
    set($('c-lumber').querySelector('b'), G.lumber);
    $('c-stone').style.display = G.stone > 0 || LJ.countKind('dozer') ? '' : 'none';
    set($('c-stone').querySelector('b'), G.stone);
    $('c-pop').style.display = G.village ? '' : 'none';
    const bill = G.units.reduce((a, u) => a + u.wage, 0);
    set($('c-pop').querySelector('b'), LJ.jackCount() + '/' + LJ.popCap());
    set($('payTxt'), bill ? 'pay €' + bill + ' in ' + mmss(G.payT) : '');
    const goal = G.thr[G.level - 1];
    set($('lvl'), G.level);
    set($('lvlTxt'), G.levelDone ? G.cleared + ' trees' : Math.min(G.cleared, goal) + ' / ' + goal + ' trees');
    const quota = G.quota[G.level - 1] || 0;
    set($('quota'), quota && !G.levelDone ? '€' + Math.min(G.earned, quota).toLocaleString('en-US') + ' / ' + quota.toLocaleString('en-US') + ' earned' : '');
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
