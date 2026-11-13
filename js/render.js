'use strict';
// Draws the world at native pixel resolution; CSS scales the canvas up with crisp pixels.
(function () {
  const TS = LJ.TS, T = LJ.T, S = LJ.sprites, hash = LJ.hash;

  function bar(ctx, x, y, w, frac, col) {
    ctx.fillStyle = '#1b1422'; ctx.fillRect(x, y, w + 2, 3);
    ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, Math.round(w * LJ.clamp(frac, 0, 1)), 1);
  }

  function drawUnit(ctx, u, cx, cy, G, ghost) {
    const set = S.jack[G.up.chainsaw ? 'saw' : 'axe'];
    const cargo = u.carry > 0 || u.load;
    let f;
    if (u.fighting) f = set.chop[u.atkCd > 0.45 ? 1 : 0];
    else if (((u.state === 'chop' || (u.state === 'saw' && G.wood >= 2)) && !u.path.length)) f = set.chop[u.swing < 0.25 ? 0 : 1];
    else if (u.path.length) {
      const k = Math.floor(u.walkT * 8) % 2;
      f = cargo ? set.carry[1 + k] : set.walk[k];
    } else f = cargo ? set.carry[0] : set.idle;
    const img = u.dir > 0 ? f.r : f.l;
    const x = Math.round(u.x) - 11 - cx, y = Math.round(u.y) - 16 - cy;
    if (!ghost && G.sel.has(u)) ctx.drawImage(S.ringS, x + 3, y + 12);
    ctx.drawImage(img, x, y);
    if (ghost) return;
    if (u.hp < 100) bar(ctx, x + 4, y - 4, 12, u.hp / 100, u.hp > 40 ? '#5fdc3c' : '#ff4a3a');
    else if (u.state === 'chop' && u.target >= 0 && !u.path.length) bar(ctx, x + 4, y - 4, 12, 1 - G.world.hp[u.target], '#ffd84a');
  }

  function drawVehicle(ctx, u, cx, cy, G, ghost) {
    const set = u.kind === 'truck' ? (LJ.cargoOf(u) > 0 ? S.truck.full : S.truck.empty) : u.kind === 'dozer' ? S.dozer : S.harv;
    const img = u.dir > 0 ? set.r : set.l;
    const busy = u.state === 'doze' || (u.state === 'chop' && !u.path.length);
    const bob = (u.path.length && Math.floor(u.walkT * 10) % 2) || (busy && Math.floor(G.time * 16) % 2) ? 1 : 0;
    const x = Math.round(u.x) - (img.width >> 1) - cx, y = Math.round(u.y) + 4 - img.height - cy - bob;
    if (!ghost && G.sel.has(u)) ctx.drawImage(S.ringL, Math.round(u.x) - 16 - cx, Math.round(u.y) - 4 - cy);
    ctx.drawImage(img, x, y);
    if (!ghost && u.state === 'chop' && u.target >= 0 && !u.path.length) bar(ctx, x + (img.width >> 1) - 7, y - 4, 12, 1 - G.world.hp[u.target], '#ffd84a');
  }
  const drawAny = (ctx, u, cx, cy, G, ghost) => (u.kind === 'jack' ? drawUnit : drawVehicle)(ctx, u, cx, cy, G, ghost);

  function drawAnimal(ctx, a, cx, cy) {
    const fr = S[a.kind][Math.floor(a.walkT * 9) % 2], img = a.dir > 0 ? fr.r : fr.l;
    const x = Math.round(a.x) - (img.width >> 1) - cx, y = Math.round(a.y) - img.height + 1 - cy;
    ctx.drawImage(img, x, y);
    if (a.hp < a.max) bar(ctx, x + (img.width >> 1) - 7, y - 4, 12, a.hp / a.max, '#ff4a3a');
  }

  LJ.render = function () {
    const G = LJ.G, w = G.world, cv = LJ.cv, ctx = LJ.ctx;
    if (!w) return;
    const vw = cv.width, vh = cv.height, W = w.W, H = w.H, s = w.seed;
    const cx = Math.round(G.cam.x), cy = Math.round(G.cam.y);
    ctx.fillStyle = '#0c1a0d'; ctx.fillRect(0, 0, vw, vh);
    ctx.drawImage(G.ground.cv, -cx, -cy);

    const tx0 = Math.max(0, Math.floor(cx / TS) - 1), tx1 = Math.min(W - 1, Math.floor((cx + vw) / TS) + 1);
    const ty0 = Math.max(0, Math.floor(cy / TS) - 1), ty1 = Math.min(H - 1, Math.floor((cy + vh) / TS) + 3);

    // Water sparkles
    const tb = Math.floor(G.time * 3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (w.type[ty * W + tx] === T.WATER && hash(tx, ty, tb) < 0.1) {
        ctx.fillRect(tx * TS + Math.floor(hash(tx, ty, tb + 9) * 14) - cx, ty * TS + Math.floor(hash(ty, tx, tb + 5) * 14) - cy, 2, 1);
      }
    }

    // Building placement preview
    if (G.place && G.hover) {
      const p = G.place, tx = Math.floor(G.hover[0] / TS) - (p.w >> 1), ty = Math.floor(G.hover[1] / TS) - (p.h >> 1), ok = LJ.canPlace(tx, ty);
      ctx.fillStyle = ok ? 'rgba(120,255,110,0.35)' : 'rgba(255,70,60,0.4)';
      ctx.fillRect(tx * TS - cx, ty * TS - cy, p.w * TS, p.h * TS);
    }

    // Collect everything that stands upright and sort by its base line, so things overlap correctly.
    const list = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const i = ty * W + tx, o = w.obj[i];
      if (o >= 1 && o <= 3) list.push({ k: 0, i, tx, ty, y: ty * TS + 13 + ((hash(i, 2, s) * 5) | 0) - 2 });
      else if (w.type[i] === T.ROCK) list.push({ k: 1, i, tx, ty, y: ty * TS + 15 });
    }
    for (const b of G.buildings) list.push({ k: 2, b, y: (b.ty + b.h) * TS });
    list.push({ k: 5, y: w.roadY * TS + 1 });
    for (const u of G.units) list.push({ k: 3, u, y: u.y });
    for (const f of G.falls) list.push({ k: 4, f, y: f.y });
    for (const a of G.animals) list.push({ k: 6, a, y: a.y });
    for (const g of G.graves) list.push({ k: 7, g, y: g.y });
    for (const p of G.props) list.push({ k: 9, p, y: p.y });
    if (G.suit) list.push({ k: 10, y: G.suit.y });
    if (G.place && G.hover) list.push({ k: 8, y: (Math.floor(G.hover[1] / TS) - (G.place.h >> 1) + G.place.h) * TS });
    list.sort((a, b) => a.y - b.y);

    for (const d of list) {
      switch (d.k) {
        case 0: {
          const spr = S.trees[w.obj[d.i] - 1][w.variant[d.i]];
          let ox = ((hash(d.i, 1, s) * 7) | 0) - 3;
          if (w.hp[d.i] < 1 && w.claim[d.i]) ox += Math.floor(G.time * 12) % 2 ? 1 : 0; // shiver while being chopped
          ctx.drawImage(spr, d.tx * TS + 8 + ox - 15 - cx, d.y - 35 - cy);
          break;
        }
        case 1: ctx.drawImage(S.rocks[(hash(d.i, 3, s) * 4) | 0], d.tx * TS - 2 - cx, d.ty * TS - 3 - cy); break;
        case 2: {
          const b = d.b, spr = S[b.kind];
          const bx = b.tx * TS + ((b.w * TS - spr.width) >> 1) - cx, by = (b.ty + b.h) * TS + 1 - spr.height - cy;
          ctx.drawImage(spr, bx, by);
          if (b.queue.length) bar(ctx, bx + 14, by - 5, 28, 1 - b.queue[0].t / b.queue[0].total, '#58c8ff');
          break;
        }
        case 3: drawAny(ctx, d.u, cx, cy, G, false); break;
        case 4: {
          const f = d.f, spr = S.trees[f.sp - 1][f.v], p = Math.min(1, f.t / 0.6);
          ctx.save();
          ctx.translate(f.x - cx, f.y - cy);
          ctx.rotate(f.dir * p * p * 1.5);
          ctx.globalAlpha = f.t > 0.6 ? Math.max(0, 1 - (f.t - 0.6) / 0.3) : 1;
          ctx.drawImage(spr, -15, -35);
          ctx.restore();
          break;
        }
        case 5: ctx.drawImage(S.sign, 2 - cx, (w.roadY - 1) * TS - 4 - cy); break;
        case 6: drawAnimal(ctx, d.a, cx, cy); break;
        case 7: ctx.drawImage(S.grave, Math.round(d.g.x) - 5 - cx, Math.round(d.g.y) - 12 - cy); break;
        case 9: ctx.drawImage(d.p.spr, Math.round(d.p.x - d.p.spr.width / 2) - cx, Math.round(d.p.y - d.p.spr.height) - cy); break;
        case 10: {
          const s = G.suit, f = s.path.length ? S.suit.walk[Math.floor(s.walkT * 8) % 2] : S.suit.idle;
          ctx.drawImage(s.dir > 0 ? f.r : f.l, Math.round(s.x) - 11 - cx, Math.round(s.y) - 16 - cy);
          break;
        }
        case 8: {
          const tx = Math.floor(G.hover[0] / TS) - (G.place.w >> 1), ty = Math.floor(G.hover[1] / TS) - (G.place.h >> 1), spr = S[G.place.kind];
          ctx.globalAlpha = 0.75;
          ctx.drawImage(spr, tx * TS + ((G.place.w * TS - spr.width) >> 1) - cx, (ty + G.place.h) * TS + 1 - spr.height - cy);
          ctx.globalAlpha = 1;
          break;
        }
      }
    }

    // Faint second pass so jacks and animals stay visible behind tree canopies.
    ctx.globalAlpha = 0.3;
    for (const u of G.units) drawAny(ctx, u, cx, cy, G, true);
    ctx.globalAlpha = 0.45;
    for (const a of G.animals) drawAnimal(ctx, a, cx, cy);
    ctx.globalAlpha = 1;

    // Rifle tracers
    ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 1;
    for (const sh of G.shots) {
      ctx.beginPath(); ctx.moveTo(sh.x0 - cx + 0.5, sh.y0 - cy + 0.5); ctx.lineTo(sh.x1 - cx + 0.5, sh.y1 - cy + 0.5); ctx.stroke();
    }

    // Target brackets on trees the selected jacks are heading for
    ctx.fillStyle = '#fff';
    for (const u of G.sel) {
      if (u.target < 0) continue;
      const x = (u.target % W) * TS - cx, y = ((u.target / W) | 0) * TS - cy;
      ctx.fillRect(x, y, 4, 1); ctx.fillRect(x, y, 1, 4);
      ctx.fillRect(x + 12, y, 4, 1); ctx.fillRect(x + 15, y, 1, 4);
      ctx.fillRect(x, y + 15, 4, 1); ctx.fillRect(x, y + 12, 1, 4);
      ctx.fillRect(x + 12, y + 15, 4, 1); ctx.fillRect(x + 15, y + 12, 1, 4);
    }

    // Tiles queued for the bulldozer
    ctx.fillStyle = '#ff9a2a';
    for (const j of G.jobs) {
      if (!j.tiles) continue;
      for (const t of j.tiles) {
        const x = (t % W) * TS - cx, y = ((t / W) | 0) * TS - cy;
        if (x < -16 || y < -16 || x > vw || y > vh) continue;
        ctx.fillRect(x + 5, y + 5, 6, 1); ctx.fillRect(x + 5, y + 10, 6, 1); ctx.fillRect(x + 5, y + 5, 1, 6); ctx.fillRect(x + 10, y + 5, 1, 6);
      }
    }

    // Area job outlines
    for (const j of G.jobs) {
      if (!j.rect) continue;
      dashRect(ctx, j.rect[0] * TS - cx, j.rect[1] * TS - cy, (j.rect[2] - j.rect[0] + 1) * TS, (j.rect[3] - j.rect[1] + 1) * TS, 'rgba(255,216,74,0.8)', G.time);
    }
    if (G.drag) {
      const d = G.drag, x = Math.min(d.x0, d.x1) - cx, y = Math.min(d.y0, d.y1) - cy;
      const dw = Math.abs(d.x1 - d.x0), dh = Math.abs(d.y1 - d.y0);
      ctx.fillStyle = d.kind === 'area' ? 'rgba(255,216,74,0.15)' : 'rgba(140,255,110,0.12)';
      ctx.fillRect(x, y, dw, dh);
      dashRect(ctx, Math.round(x), Math.round(y), Math.round(dw), Math.round(dh), d.kind === 'area' ? '#ffd84a' : '#8dff6a', G.time);
    }

    // Warning markers at the screen edge for animals that are out of view
    if (Math.floor(G.time * 4) % 2) {
      for (const a of G.animals) {
        const ax = a.x - cx, ay = a.y - cy;
        if (ax >= 0 && ay >= 0 && ax < vw && ay < vh) continue;
        const mx = Math.round(LJ.clamp(ax, 5, vw - 6)), my = Math.round(LJ.clamp(ay, 22, vh - 30));
        ctx.fillStyle = '#1b1422'; ctx.fillRect(mx - 4, my - 4, 9, 9);
        ctx.fillStyle = '#ff3a2a'; ctx.fillRect(mx - 3, my - 3, 7, 7);
        ctx.fillStyle = '#fff'; ctx.fillRect(mx, my - 2, 1, 3); ctx.fillRect(mx, my + 2, 1, 1);
      }
    }

    for (const p of G.parts) {
      if (p.smoke) { ctx.globalAlpha = 0.6 * (1 - p.t / p.life); ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 2, 2); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, 1, 1); }
    }
    for (const b of G.bflies) {
      const x = Math.round(b.x) - cx, y = Math.round(b.y + Math.sin(b.ph * 0.3) * 2) - cy;
      if (x < -4 || y < -4 || x > vw + 4 || y > vh + 4) continue;
      ctx.fillStyle = b.col;
      if (Math.sin(b.ph) > 0) { ctx.fillRect(x - 1, y, 1, 2); ctx.fillRect(x + 1, y, 1, 2); }
      else { ctx.fillRect(x - 1, y, 3, 1); }
      ctx.fillStyle = '#222'; ctx.fillRect(x, y, 1, 1);
    }
  };

  function dashRect(ctx, x, y, w, h, col, time) {
    ctx.fillStyle = col;
    const o = Math.floor(time * 8) % 6;
    for (let i = -o; i < w; i += 6) {
      const a = Math.max(0, i), l = Math.min(w, i + 3) - a;
      if (l > 0) { ctx.fillRect(x + a, y, l, 1); ctx.fillRect(x + a, y + h - 1, l, 1); }
    }
    for (let i = -o; i < h; i += 6) {
      const a = Math.max(0, i), l = Math.min(h, i + 3) - a;
      if (l > 0) { ctx.fillRect(x, y + a, 1, l); ctx.fillRect(x + 1 * (w - 1), y + a, 1, l); }
    }
  }
})();
