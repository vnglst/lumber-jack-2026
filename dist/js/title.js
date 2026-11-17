'use strict';
// The opening screen: a Finnish lake at night under the northern lights, with the logo and the start buttons.
// The scene is painted at a low resolution and scaled up, like the game itself.
(function () {
  const S = LJ.sprites, hash = LJ.hash;
  const H = 180, HORIZON = 98, SHORE = 150;
  const el = () => document.getElementById('title');
  let cv, ctx, W = 320, raf = 0, t0 = 0, last = 0, props = [], smoke = [];

  // A night-time copy of a game sprite: the same pixels under a deep blue wash.
  const nightCache = new Map();
  function night(src, k) {
    let c = nightCache.get(src);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = 'rgba(6,14,40,' + k + ')';
    x.fillRect(0, 0, c.width, c.height);
    nightCache.set(src, c);
    return c;
  }

  // What stands on the near shore, laid out for the current width: trees to both sides, the cottage between them.
  function layout() {
    const [spruce, pine, birch] = S.trees, wide = W > 230;
    const houseX = Math.round(wide ? W * 0.66 : W * 0.5);
    props = [];
    const tree = (sp, x, y) => props.push({ spr: night(sp, 0.62), x: Math.round(x) - sp.ax, y: y - sp.ay });
    const left = wide ? [[spruce[0], 0.03, 176], [pine[0], 0.12, 172], [spruce[2], 0.2, 178], [birch[1], 0.29, 173]]
      : [[spruce[0], 0.04, 176], [spruce[2], 0.2, 179]];
    const right = wide ? [[spruce[3], 0.86, 174], [pine[1], 0.93, 178], [spruce[0], 1.0, 173]] : [[pine[1], 0.86, 178], [spruce[0], 1.0, 174]];
    for (const [sp, fx, y] of left.concat(right)) tree(sp, fx * W, y);
    headland = houseX;
    gy = wide ? 175 : 163; // on a narrow screen the cottage stands further up the bank, with grass in front of it
    const house = S.village, hx = houseX - 31, hy = gy - house.height;
    props.push({ spr: night(house.bare, 0.5), x: hx, y: hy, house: true });
    // Things around the cottage that tie it to the ground: bushes against the walls, a boulder, a woodpile's worth of plants.
    const D = S.decor, put = (sp, x, y, k) => props.push({ spr: night(sp, k || 0.55), x, y: y - sp.height });
    put(D.bush[0], hx - 15, gy + 1); put(D.bush[2], hx + 52, gy + 2); put(D.fern[0], hx + 19, gy + 4, 0.45);
    put(S.rocks[1], hx - 34, gy + 4); put(D.flowers[0], hx + 40, gy + 5, 0.4);
    if (!wide) { put(D.flowers[2], hx + 4, gy + 13, 0.4); put(D.fern[0], hx + 50, gy + 14, 0.45); }
    props.sort((a, b) => a.y + a.spr.height - (b.y + b.spr.height));
    paintScenery(houseX);
  }

  // Top of the near shore. The land rises into a low headland where the cottage stands, so the cottage has ground behind it.
  let headland = 0, gy = 175, sky = null, lake = null;
  const shoreY = x => { const d = (x - headland) / 50; return Math.round(SHORE + 6 - 5 * Math.sin((x / W) * Math.PI) + LJ.fbm(x * 0.05, 3, 3, 2) * 4 - (190 - gy) * Math.exp(-d * d)); };

  // Everything that does not move, painted once per layout: the far shore's tree line, and the near shore with its moonlit grass, a jetty, a path from the door, and lamplight on the ground.
  let shore = null;
  function paintScenery(houseX) {
    shore = document.createElement('canvas');
    shore.width = W; shore.height = H;
    const x = shore.getContext('2d'), px = (X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
    ridge(x, HORIZON - 2, 5, 8, 11, '#12284a');
    ridge(x, HORIZON + 1, 6, 22, 23, '#0a1830');
    const GRASS = ['#0b1c1c', '#102a24', '#16382c', '#1f4a36', '#2c6044'];
    for (let X = 0; X < W; X++) {
      const top = shoreY(X);
      for (let Y = top; Y < H; Y++) {
        const d = Y - top, n = LJ.fbm(X * 0.11, Y * 0.2, 31, 2) + (hash(X, Y, 17) - 0.5) * 0.35;
        // Brightest along the bank, where the sky's light catches it; darker towards the viewer.
        let k = d < 1 ? 4 : d < 3 ? 3 : 2.4 - d * 0.06 + n * 1.4;
        k = LJ.clamp(Math.round(k), 0, 4);
        px(X, Y, GRASS[k]);
      }
      if (hash(X, 5, 41) < 0.35) px(X, top - 1, GRASS[hash(X, 6, 41) < 0.5 ? 3 : 2]); // grass tufts on the bank
      if (hash(X, 7, 41) < 0.08) px(X, top - 2, GRASS[2]);
    }
    // Jetty: planks running out into the lake, with posts and a little rowing boat tied up.
    const jx = houseX - 66, jy = shoreY(jx) + 1;
    for (let i = 0; i < 16; i++) {
      const Y = jy - i, wdt = 9 - (i >> 2), X0 = jx - (i >> 1);
      x.fillStyle = i % 3 === 2 ? '#2a2620' : i < 2 ? '#6b5a44' : '#57493a'; x.fillRect(X0, Y, wdt, 1);
      px(X0, Y, '#8a775a'); // moonlit edge
    }
    for (const [dx, dy] of [[-1, -3], [8, -3], [-6, -14], [1, -14]]) { x.fillStyle = '#1c1a18'; x.fillRect(jx + dx, jy + dy, 1, 5); }
    const bx = jx - 20, by = jy - 9;
    x.fillStyle = '#3a3026'; x.fillRect(bx, by, 12, 2); x.fillRect(bx + 1, by + 2, 10, 1);
    x.fillStyle = '#7a6a52'; x.fillRect(bx, by - 1, 12, 1); px(bx - 1, by - 1, '#7a6a52'); px(bx + 12, by - 1, '#7a6a52');
    x.fillStyle = 'rgba(8,16,36,0.5)'; x.fillRect(bx + 1, by + 3, 10, 1);
    // Trodden path from the door down to the jetty.
    for (let i = 0; i < 40; i++) {
      const t = i / 39, X = Math.round(houseX + 1 + (jx + 4 - houseX) * t * t), Y = Math.round(gy + 2 - (gy + 1 - jy) * t);
      for (let dx = -1; dx <= 2; dx++) if (Y >= shoreY(X + dx)) px(X + dx, Y, hash(X + dx, Y, 9) < 0.5 ? '#3a3528' : '#2e2b22');
    }
    // Lamplight from the windows and the door, pooling on the grass in front.
    for (let Y = gy - 9; Y < H; Y++) for (let X = houseX - 44; X < houseX + 46; X++) {
      if (Y < shoreY(X)) continue;
      const dx = (X - houseX) / 44, dy = (Y - gy) / 9, f = 1 - dx * dx - dy * dy;
      if (f > 0 && hash(X, Y, 23) < f * 1.4) px(X, Y, 'rgba(255,190,90,' + (0.1 + f * 0.22).toFixed(2) + ')');
    }
  }

  function resize() {
    const w = Math.round(H * innerWidth / Math.max(1, innerHeight));
    if (LJ.clamp(w, 96, 460) === cv.width && sky) return; // same scene: nothing to repaint
    W = LJ.clamp(w, 96, 460);
    cv.width = W; cv.height = H;
    sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
    sky.addColorStop(0, '#050920'); sky.addColorStop(0.6, '#0e1f4a'); sky.addColorStop(1, '#25477a');
    lake = ctx.createLinearGradient(0, HORIZON, 0, SHORE + 6);
    lake.addColorStop(0, '#1b3a66'); lake.addColorStop(1, '#081226');
    layout();
  }

  // Tree-line silhouette: a ridge of spruce tips. `rise` lifts the ridge towards the edges of the screen, like hills around a lake.
  function ridge(ctx, base, amp, rise, seed, col) {
    ctx.fillStyle = col;
    for (let x = 0; x < W; x++) {
      const edge = Math.abs(x / W - 0.5) * 2;
      const hill = base - rise * edge * edge - amp * LJ.fbm(x * 0.03, seed, seed, 2);
      const tip = (x + ((hash(x >> 3, seed, 5) * 5) | 0)) % 7, spike = 4 - Math.abs(tip - 3) * 1.4;
      const y = Math.round(hill - spike * (0.6 + hash(x >> 3, seed, 9)));
      ctx.fillRect(x, y, 1, HORIZON + 2 - y);
    }
  }

  // The curtains of northern lights: time scale, phase, height, and the colours at the bottom and the top.
  const CURTAINS = [[1, 0, 58, '90,255,170', '120,150,255'], [0.8, 2.4, 44, '70,230,200', '170,110,255']];
  // Where a row of the sky shows in the lake: mirrored about the horizon and squeezed, as water seen at a low angle
  // is. The lights' bright lower edge lands just below the far shore and their tops reach down towards the near one.
  const mirrorY = y => HORIZON + 3 + (HORIZON - y) * 0.45;
  // One curtain of northern lights. Drawn again upside down, fainter and rippled, as the reflection in the lake.
  function aurora(t, ph, baseY, rgbBot, rgbTop, mirror) {
    for (let x = 0; x < W; x++) {
      const wave = Math.sin(x * 0.021 + t * 0.21 + ph) * 13 + Math.sin(x * 0.057 - t * 0.16 + ph * 2) * 6;
      const ray = 0.5 + 0.5 * Math.sin(x * 0.33 + Math.sin(x * 0.05 + t * 0.5 + ph) * 4);
      const glow = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(x * 0.012 - t * 0.12 + ph * 3))) * (0.55 + 0.45 * ray);
      const y0 = baseY + wave, len = 26 + 20 * ray;
      for (let s = 0; s < 7; s++) {
        const k = s / 7, a = glow * (1 - k) * (1 - k) * (mirror ? 0.4 : 0.62);
        if (a < 0.02) continue;
        const c = k < 0.45 ? rgbBot : rgbTop, h = Math.ceil(len / 7);
        ctx.fillStyle = 'rgba(' + c + ',' + a.toFixed(3) + ')';
        if (!mirror) ctx.fillRect(x, Math.round(y0 - k * len - h), 1, h);
        else {
          // The mirror image of this slice, with each row nudged sideways by ripples that grow towards the viewer.
          const top = Math.round(mirrorY(y0 - k * len)), rows = Math.max(1, Math.ceil(h * 0.45));
          for (let yy = top; yy < top + rows && yy < SHORE; yy++) {
            if (yy <= HORIZON + 1) continue;
            const ripple = Math.sin(yy * 0.9 + t * 1.6) * (0.6 + (yy - HORIZON) * 0.035);
            ctx.fillRect(x + Math.round(ripple), yy, 1, 1);
          }
        }
      }
    }
  }

  function draw(t) {
    // Sky
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HORIZON + 2);
    for (let i = 0; i < W * 0.45; i++) {
      const x = (hash(i, 1, 3) * W) | 0, y = (hash(i, 2, 3) * (HORIZON - 14)) | 0;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.4 + hash(i, 3, 3)) + i));
      ctx.fillStyle = 'rgba(255,255,255,' + (tw * (hash(i, 4, 3) < 0.15 ? 1 : 0.55)).toFixed(2) + ')';
      ctx.fillRect(x, y, 1, 1);
    }
    for (const c of CURTAINS) aurora(t * c[0], c[1], c[2], c[3], c[4], false);
    // Lake, with the lights mirrored in it
    ctx.fillStyle = lake; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    for (const c of CURTAINS) aurora(t * c[0], c[1], c[2], c[3], c[4], true);
    for (let i = 0; i < 26; i++) { // glints on the water
      const y = HORIZON + 4 + ((hash(i, 7, 1) * (SHORE - HORIZON - 6)) | 0), x = ((hash(i, 8, 1) * W + t * (2 + hash(i, 9, 1) * 3)) % W) | 0;
      ctx.fillStyle = 'rgba(190,230,255,' + (0.1 + 0.2 * Math.abs(Math.sin(t + i))).toFixed(2) + ')';
      ctx.fillRect(x, y, 3 + ((hash(i, 6, 1) * 5) | 0), 1);
    }
    ctx.drawImage(shore, 0, 0); // far tree line and near shore
    for (const p of props) {
      ctx.drawImage(p.spr, p.x, p.y);
      if (!p.house) continue;
      LJ.spr.drawFlag(ctx, S.village, p.x, p.y, t, true);
      // Lit windows, their glow on the ground, and chimney smoke
      for (const [ax, ay] of S.village.windows) {
        const wx = ax + 1, wy = ay + 1; // the glass sits one pixel inside the frame
        ctx.fillStyle = '#ffd76a'; ctx.fillRect(p.x + wx, p.y + wy, 5, 6);
        ctx.fillStyle = '#fff1a8'; ctx.fillRect(p.x + wx, p.y + wy, 2, 2);
        ctx.fillStyle = 'rgba(40,20,10,0.55)'; ctx.fillRect(p.x + wx + 2, p.y + wy, 1, 6); ctx.fillRect(p.x + wx, p.y + wy + 3, 5, 1);
        ctx.fillStyle = 'rgba(255,190,90,0.10)'; ctx.fillRect(p.x + wx - 4, p.y + wy - 4, 13, 14); ctx.fillRect(p.x + wx - 2, p.y + wy + 22, 9, 4);
      }
      if (Math.random() < 0.12) smoke.push({ x: p.x + S.village.smoke.x, y: p.y + S.village.smoke.y, t: 0 });
    }
    for (const s of smoke) {
      s.t += 0.066; s.y -= 0.35; s.x += 0.12 + Math.sin(s.t * 2 + s.y) * 0.15;
      ctx.fillStyle = 'rgba(190,200,225,' + Math.max(0, 0.34 - s.t * 0.07).toFixed(2) + ')';
      const r = 1 + (s.t * 0.7 | 0); ctx.fillRect(Math.round(s.x) - r, Math.round(s.y) - r, r * 2, r * 2);
    }
    smoke = smoke.filter(s => s.t < 4.8);
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (ts - last < 66) return; // about 15 frames a second is plenty for a slow sky
    last = ts;
    draw((ts - t0) / 1000 + 40);
  }

  LJ.title = {
    // buttons: [{ label, ghost, run }]. A button closes the title and then runs.
    open(buttons) {
      const root = el();
      cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
      const row = root.querySelector('.row');
      row.innerHTML = '';
      for (const b of buttons) {
        const btn = document.createElement('button');
        btn.textContent = b.label;
        if (b.ghost) btn.className = 'ghost';
        btn.onclick = () => { LJ.audioInit(); LJ.sfx('click'); LJ.title.close(); b.run(); };
        row.appendChild(btn);
      }
      root.classList.add('open');
      resize();
      draw(40); // one frame straight away, so the scene is there before the first animation tick
      // Let the dark backdrop paint before revealing the complete opening screen.
      if (!root.classList.contains('ready')) requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
      addEventListener('resize', resize);
      cancelAnimationFrame(raf);
      t0 = performance.now(); last = 0;
      raf = requestAnimationFrame(frame);
    },
    close() {
      el().classList.remove('open');
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
    },
    isOpen: () => el().classList.contains('open'),
    // For tests: the scene's geometry and where the sky is mirrored.
    geometry: { H, HORIZON, SHORE, mirrorY }
  };
})();
