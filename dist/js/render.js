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
    if (u.fighting) f = G.up.rifles ? S.jack.pistol[u.flash > 0 ? 1 : 0] : set.chop[u.atkCd > 0.45 ? 1 : 0];
    else if (((u.state === 'chop' || (u.state === 'saw' && G.wood >= 2)) && !u.path.length)) f = set.chop[u.swing < 0.25 ? 0 : 1];
    else if (u.path.length) {
      const k = Math.floor(u.walkT * 8) % 2;
      f = cargo ? set.carry[1 + k] : set.walk[k];
    } else f = cargo ? set.carry[0] : set.idle;
    const img = u.dir > 0 ? f.r : f.l;
    const x = Math.round(u.x) - img.ax - cx, y = Math.round(u.y) - img.ay - cy;
    if (!ghost && G.sel.has(u)) ctx.drawImage(S.ringS, x + 2, y + 17);
    ctx.drawImage(img, x, y);
    if (ghost) return;
    if (u.hp < 100) bar(ctx, x + 4, y - 3, 12, u.hp / 100, u.hp > 40 ? '#5fdc3c' : '#ff4a3a');
    else if (u.state === 'chop' && u.target >= 0 && !u.path.length) bar(ctx, x + 4, y - 3, 12, 1 - G.world.hp[u.target], '#ffd84a');
  }

  // How far a moving vehicle is lifted off its wheels right now, in pixels. Bumps come from the ground it drives over
  // and from the engine, at irregular moments: mostly level, often up one pixel, now and then a pothole's worth.
  function jolt(u, lag) {
    const p = (u.x + u.y) * 0.09 + (u.walkT - lag) * 4.5, n = LJ.vnoise(p, u.id * 3.7, 11) * 0.7 + LJ.vnoise(p * 2.7, u.id * 1.3, 12) * 0.3;
    return n > 0.8 ? 2 : n > 0.6 ? 1 : 0;
  }
  function drawVehicle(ctx, u, cx, cy, G, ghost) {
    const kind = LJ.VEH[u.kind].sprite || u.kind;
    const set = S[kind].empty ? (LJ.cargoOf(u) > 0 ? S[kind].full : S[kind].empty) : S[kind];
    const img = u.dir > 0 ? set.r : set.l;
    const busy = u.state === 'doze' || (u.state === 'chop' && !u.path.length);
    const bob = u.path.length ? jolt(u, 0) : busy && Math.floor(G.time * 16) % 2 ? 1 : 0;
    const x = Math.round(u.x) - (img.width >> 1) - cx, y = Math.round(u.y) + 4 - img.height - cy - bob;
    if (!ghost && G.sel.has(u)) ctx.drawImage(S.ringL, Math.round(u.x) - 16 - cx, Math.round(u.y) - 4 - cy);
    if (G.arrival === u && u.path.length) { // Jack rides in the truck until it parks
      const rider = S.jack.axe.idle[u.dir > 0 ? 'r' : 'l'];
      ctx.drawImage(rider, Math.round(u.x) - 7 - rider.ax - cx, Math.round(u.y) - 7 - rider.ay - cy - jolt(u, 0.09)); // he bounces a beat after the truck
    }
    ctx.drawImage(img, x, y);
    if (!ghost && u.hp < LJ.maxHpOf(u)) bar(ctx, x + (img.width >> 1) - 7, y - 4, 12, u.hp / LJ.maxHpOf(u), u.hp > LJ.maxHpOf(u) * 0.4 ? '#5fdc3c' : '#ff4a3a');
    else if (!ghost && u.state === 'chop' && u.target >= 0 && !u.path.length) bar(ctx, x + (img.width >> 1) - 7, y - 4, 12, 1 - G.world.hp[u.target], '#ffd84a');
  }
  const drawAny = (ctx, u, cx, cy, G, ghost) => (u.kind === 'jack' ? drawUnit : drawVehicle)(ctx, u, cx, cy, G, ghost);

  // Draws a two-frame, left/right creature centred on (x, y = its feet); returns the top-left corner.
  function drawCreature(ctx, frames, frame, dir, x, y, foot, cx, cy) {
    const fr = frames[frame], img = dir > 0 ? fr.r : fr.l;
    const X = Math.round(x) - (img.width >> 1) - cx, Y = Math.round(y) + foot - img.height - cy;
    ctx.drawImage(img, X, Y);
    return [X + (img.width >> 1), Y];
  }
  function drawAnimal(ctx, a, cx, cy) {
    const aiming = a.kind === 'native' && a.aim > 0;
    const [mx, top] = drawCreature(ctx, aiming ? [S.nativeAim] : S[a.kind], aiming ? 0 : Math.floor(a.walkT * 9) % 2, a.dir, a.x, a.y, 1, cx, cy);
    if (a.hp < a.max) bar(ctx, mx - 7, top - 4, 12, a.hp / a.max, '#ff4a3a');
  }
  const decoShown = (w, i, dc) => !w.bld[i] && !w.obj[i] && LJ.DECO[dc].show(w, i);

  LJ.render = function () {
    const G = LJ.G, w = G.world, cv = LJ.cv, ctx = LJ.ctx;
    if (!w) return;
    const vw = cv.width, vh = cv.height, W = w.W, H = w.H, s = w.seed;
    const cx = Math.round(G.cam.x), cy = Math.round(G.cam.y);
    ctx.fillStyle = '#080b09'; ctx.fillRect(0, 0, vw, vh);
    ctx.drawImage(G.ground.cv, -cx, -cy);

    // Trees are up to 3 tiles tall, so look a little beyond the screen edges for things that poke into view.
    const tx0 = Math.max(0, Math.floor(cx / TS) - 2), tx1 = Math.min(W - 1, Math.floor((cx + vw) / TS) + 2);
    const ty0 = Math.max(0, Math.floor(cy / TS) - 1), ty1 = Math.min(H - 1, Math.floor((cy + vh) / TS) + LJ.TREE_ROWS);

    // Water sparkles
    const tb = Math.floor(G.time * 3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (w.type[ty * W + tx] === T.WATER && hash(tx, ty, tb) < 0.1) {
        ctx.fillRect(tx * TS + Math.floor(hash(tx, ty, tb + 9) * 14) - cx, ty * TS + Math.floor(hash(ty, tx, tb + 5) * 14) - cy, 2, 1);
      }
    }

    // Palisade preview while dragging
    if (G.wallDrag) {
      for (const i of G.wallDrag) {
        ctx.fillStyle = LJ.canWall(i) ? 'rgba(120,255,110,0.4)' : 'rgba(255,70,60,0.35)';
        ctx.fillRect((i % W) * TS - cx, ((i / W) | 0) * TS - cy, TS, TS);
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
      if (o >= 1 && o <= 3 && G.fog[i]) list.push({ k: 0, i, bx: LJ.treeX(w, i), y: LJ.treeY(w, i) });
      else if (o === LJ.STUMP) list.push({ k: 11, i, bx: LJ.treeX(w, i), y: LJ.treeY(w, i) - 1 });
      else if (w.type[i] === T.ROCK) { const oy = ((hash(i, 7, s) * 9) | 0) - 4; list.push({ k: 1, i, tx, ty, oy, y: ty * TS + 14 + oy }); }
      if (w.wall[i]) list.push({ k: 14, i, tx, ty, y: ty * TS + 14 });
      const dc = w.deco[i];
      if (dc && decoShown(w, i, dc)) list.push({ k: 12, i, tx, ty, dc, y: ty * TS + LJ.DECO[dc].y + ((hash(i, 5, s) * 5) | 0) - 2 });
    }
    for (const c of G.critters) list.push({ k: 13, c, y: c.y });
    for (const b of G.buildings) if (!b.dead && !b.pending) list.push({ k: 2, b, y: (b.ty + b.h) * TS });
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
          const shiver = w.hp[d.i] < 1 && w.claim[d.i] && Math.floor(G.time * 12) % 2 ? 1 : 0; // shivers while being chopped
          ctx.drawImage(spr, d.bx - spr.ax + shiver - cx, d.y - spr.ay - cy);
          break;
        }
        case 1: {
          // Rock fields: boulders of mixed sizes, nudged off the grid, with pebbles in some of the gaps.
          const h = hash(d.i, 3, s), spr = h < 0.2 ? S.pebbles[(h * 10) & 1] : S.rocks[(h * 4) | 0];
          ctx.drawImage(spr, d.tx * TS + 8 - (spr.width >> 1) + ((hash(d.i, 4, s) * 11) | 0) - 5 - cx, d.ty * TS + 18 + d.oy - spr.height - cy);
          break;
        }
        case 11: { const spr = S.stumps[w.variant[d.i] % 3]; ctx.drawImage(spr, d.bx - 9 - cx, d.y - 11 - cy); break; }
        case 12: {
          const name = LJ.DECO[d.dc].name, list = name === 'pebbles' ? S.pebbles : S.decor[name], spr = list[w.decoV[d.i] % list.length];
          const ox = ((hash(d.i, 6, s) * 7) | 0) - 3;
          ctx.drawImage(spr, d.tx * TS + 8 + ox - (spr.width >> 1) - cx, d.y + 2 - spr.height - cy);
          if (d.dc === 8) {
            const h = LJ.combat.hutAt(d.i);
            if (h && h.hp < h.max) bar(ctx, d.tx * TS - 5 - cx, d.y - spr.height - 3 - cy, 24, h.hp / h.max, '#ff4a3a');
          }
          break;
        }
        case 13: {
          const c = d.c;
          ctx.globalAlpha = Math.max(0, c.alpha);
          drawCreature(ctx, S[c.kind], c.moving ? Math.floor(c.walkT * 8) % 2 : 0, c.dir, c.x, c.y, 2, cx, cy);
          ctx.globalAlpha = 1;
          break;
        }
        case 2: {
          const b = d.b, spr = LJ.bldSprite(b);
          const o = LJ.bldOrigin(b), bx = o[0] - cx, by = o[1] - cy;
          if (b.construction && !b.construction.upgrade) {
            const progress = 1 - b.construction.t / b.construction.total;
            const fx = b.tx * TS - cx, fy = b.ty * TS - cy;
            ctx.fillStyle = '#463624'; ctx.fillRect(fx, fy, b.w * TS, b.h * TS);
            ctx.fillStyle = '#986b42'; ctx.fillRect(fx + 2, fy + 2, b.w * TS - 4, b.h * TS - 4);
            const revealed = Math.floor(spr.height * progress);
            ctx.save();
            ctx.beginPath(); ctx.rect(bx, by + spr.height - revealed, spr.width, revealed); ctx.clip();
            ctx.drawImage(spr, bx, by); ctx.restore();
          } else ctx.drawImage(spr, bx, by);
          if (b.construction) {
            const foot = by + spr.height - 2;
            ctx.fillStyle = '#463624'; ctx.fillRect(bx + 2, foot - 24, 4, 26); ctx.fillRect(bx + spr.width - 6, foot - 24, 4, 26);
            ctx.fillStyle = '#c39461'; ctx.fillRect(bx + 3, foot - 24, 2, 26); ctx.fillRect(bx + spr.width - 5, foot - 24, 2, 26);
            ctx.fillRect(bx + 2, foot - 18, spr.width - 4, 3);
            bar(ctx, bx + (spr.width >> 1) - 14, by - 5, 28, 1 - b.construction.t / b.construction.total, '#ffd84a');
            ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff3d6';
            ctx.fillText(Math.ceil(b.construction.t) + 's', bx + (spr.width >> 1), by - 8);
          }
          if (b.queue.length) bar(ctx, bx + 14, by - (b.construction ? 15 : 5), 28, 1 - b.queue[0].t / b.queue[0].total, '#58c8ff');
          if (b.hp < b.max) bar(ctx, bx + (spr.width >> 1) - 14, by + 4, 28, b.hp / b.max, b.hp > b.max * 0.4 ? '#5fdc3c' : '#ff4a3a');
          if (b.flash > 0) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, bx + spr.muzzle.x, by + spr.muzzle.y, '#4ae8ff', 3); ctx.globalCompositeOperation = 'source-over'; }
          break;
        }
        case 14: {
          const spr = w.wall[d.i] < 30 ? S.wallBroken : S.wall;
          ctx.drawImage(spr, d.tx * TS - 1 - cx, d.ty * TS + 18 - spr.height - cy);
          const site = G.wallSites[d.i];
          if (site) bar(ctx, d.tx * TS - cx, d.ty * TS - 3 - cy, 14, 1 - site.t / site.total, '#ffd84a');
          break;
        }
        case 3: drawAny(ctx, d.u, cx, cy, G, false); break;
        case 4: {
          const f = d.f, spr = S.trees[f.sp - 1][f.v], p = Math.min(1, f.t / 0.6);
          ctx.save();
          ctx.translate(f.x - cx, f.y - cy);
          ctx.rotate(f.dir * p * p * 1.5);
          ctx.globalAlpha = f.t > 0.6 ? Math.max(0, 1 - (f.t - 0.6) / 0.3) : 1;
          ctx.drawImage(spr, -spr.ax, -spr.ay);
          ctx.restore();
          break;
        }
        case 5: ctx.drawImage(S.sign, 2 - cx, w.roadY * TS + 2 - S.sign.height - cy); break;
        case 6: drawAnimal(ctx, d.a, cx, cy); break;
        case 7: ctx.drawImage(S.grave, Math.round(d.g.x) - 5 - cx, Math.round(d.g.y) - 12 - cy); break;
        case 9: ctx.drawImage(d.p.spr, Math.round(d.p.x - d.p.spr.width / 2) - cx, Math.round(d.p.y - d.p.spr.height) - cy); break;
        case 10: {
          const s = G.suit, f = s.path.length ? S.suit.walk[Math.floor(s.walkT * 8) % 2] : S.suit.idle;
          const img = s.dir > 0 ? f.r : f.l;
          ctx.drawImage(img, Math.round(s.x) - img.ax - cx, Math.round(s.y) - img.ay - cy);
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

    drawProjectiles(ctx, G, cx, cy);

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

    // Order markers: four corners closing in on the spot an order was given for
    for (const p of LJ.ui.pings) {
      const d = Math.round(9 - 6 * p.t / LJ.ui.PING), x = Math.round(p.x - cx), y = Math.round(p.y - cy);
      ctx.fillStyle = p.c;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        ctx.fillRect(x + sx * d - (sx > 0 ? 2 : 0), y + sy * d, 3, 1);
        ctx.fillRect(x + sx * d, y + sy * d - (sy > 0 ? 2 : 0), 1, 3);
      }
    }

    // Tiles queued for the bulldozer
    ctx.fillStyle = '#ff9a2a';
    for (const u of G.units) {
      if (!u.task || u.task.type !== 'doze') continue;
      for (const t of u.task.job.tiles) {
        const x = (t % W) * TS - cx, y = ((t / W) | 0) * TS - cy;
        if (x < -16 || y < -16 || x > vw || y > vh) continue;
        ctx.fillRect(x + 5, y + 5, 6, 1); ctx.fillRect(x + 5, y + 10, 6, 1); ctx.fillRect(x + 5, y + 5, 1, 6); ctx.fillRect(x + 10, y + 5, 1, 6);
      }
    }

    // Box selection
    if (G.drag) {
      const d = G.drag, x = Math.min(d.x0, d.x1) - cx, y = Math.min(d.y0, d.y1) - cy;
      const dw = Math.abs(d.x1 - d.x0), dh = Math.abs(d.y1 - d.y0);
      ctx.fillStyle = 'rgba(140,255,110,0.12)';
      ctx.fillRect(x, y, dw, dh);
      dashRect(ctx, Math.round(x), Math.round(y), Math.round(dw), Math.round(dh), '#8dff6a', G.time);
    }

    // Warning markers at the screen edge for animals that are out of view
    if (Math.floor(G.time * 4) % 2) {
      for (const a of G.animals) {
        const ax = a.x - cx, ay = a.y - cy;
        if ((ax >= 0 && ay >= 0 && ax < vw && ay < vh) || !LJ.seenPx(a.x, a.y)) continue;
        const mx = Math.round(LJ.clamp(ax, 5, vw - 6)), my = Math.round(LJ.clamp(ay, 22, vh - 30));
        ctx.fillStyle = '#1b1422'; ctx.fillRect(mx - 4, my - 4, 9, 9);
        ctx.fillStyle = '#ff3a2a'; ctx.fillRect(mx - 3, my - 3, 7, 7);
        ctx.fillStyle = '#fff'; ctx.fillRect(mx, my - 2, 1, 3); ctx.fillRect(mx, my + 2, 1, 1);
      }
    }

    for (const p of G.parts) {
      if (p.glow) continue; // drawn below, in one additive batch
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

    if (G.dc) drawDataCenter(ctx, G, cx, cy, vw, vh);
    if (LJ.ore) LJ.ore.draw(ctx, cx, cy, vw, vh);
    if (LJ.discoveries) LJ.discoveries.draw(ctx, cx, cy);
    drawFog(ctx, G, w, cx, cy);
  };

  // A small glow: a bright core with a soft coloured halo. The caller sets the additive ('lighter') blend mode,
  // so a whole batch of glows shares one switch.
  function glow(ctx, x, y, col, r) {
    ctx.globalAlpha = 0.35; ctx.fillStyle = col; ctx.fillRect(x - r, y - r, r * 2 + 1, r * 2 + 1);
    ctx.globalAlpha = 0.9; ctx.fillRect(x - (r >> 1), y - (r >> 1), (r >> 1) * 2 + 1, (r >> 1) * 2 + 1);
    ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
  }

  // Laser bolts (glowing streaks with a white core and a muzzle flash) and arrows (a gentle arc, feathered).
  function drawProjectiles(ctx, G, cx, cy) {
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter'; // everything glowing in one additive batch
    for (const b of G.bolts) {
      const k = Math.min(1, b.t / b.dur), dx = b.x1 - b.x0, dy = b.y1 - b.y0, len = Math.hypot(dx, dy) || 1;
      const hx = b.x0 + dx * k - cx, hy = b.y0 + dy * k - cy, tl = Math.min(9, len * k);
      const tx = hx - (dx / len) * tl, ty = hy - (dy / len) * tl;
      if (b.t < 0.05) glow(ctx, Math.round(b.x0 - cx), Math.round(b.y0 - cy), b.col, 3);
      if (b.done) continue;
      ctx.strokeStyle = b.col; ctx.globalAlpha = 0.45; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx + (dx / len) * 3, ty + (dy / len) * 3); ctx.lineTo(hx, hy); ctx.stroke();
    }
    for (const p of G.parts) if (p.glow) glow(ctx, Math.round(p.x) - cx, Math.round(p.y) - cy, p.col, 1);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (const a of G.arrows) {
      const k = Math.min(1, a.t / a.dur), dx = a.x1 - a.x0, dy = a.y1 - a.y0, len = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(k * Math.PI) * Math.min(14, len * 0.12);
      const x = a.x0 + dx * k - cx, y = a.y0 + dy * k - arc - cy;
      // Direction includes the arc's slope, so the arrow tips up then down.
      const vx = dx / len, vy = (dy - Math.cos(k * Math.PI) * Math.PI * Math.min(14, len * 0.12)) / len, vl = Math.hypot(vx, vy) || 1;
      const ux = vx / vl, uy = vy / vl;
      ctx.globalAlpha = a.done ? Math.max(0, 1 - (a.t - a.dur) / 0.4) : 1;
      ctx.strokeStyle = '#7a4d26'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - ux * 6, y - uy * 6); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#d5dbe2'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(Math.round(x - ux * 6), Math.round(y - uy * 6), 1, 1);
      ctx.globalAlpha = 1;
    }
  }

  // The data center at the end: 3x3-tile modules that go up one after another until they cover the map.
  function drawDataCenter(ctx, G, cx, cy, vw, vh) {
    const dc = G.dc, B = S.dcFrame.width, t = G.time;
    const bx0 = Math.max(0, Math.floor(cx / B)), bx1 = Math.min(dc.BW - 1, Math.floor((cx + vw) / B));
    const by0 = Math.max(0, Math.floor(cy / B)), by1 = Math.min(dc.BH - 1, Math.floor((cy + vh) / B));
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
      const k = by * dc.BW + bx, age = t - dc.start[k];
      if (!(age >= 0)) continue;
      const x = bx * B - cx, y = by * B - cy;
      ctx.drawImage(age < 0.45 ? S.dcFrame : S.dcBlocks[(hash(bx, by, 3) * 3) | 0], x, y);
      if (age >= 0.45) { // status lights along the cable tray
        for (let i = 0; i < 6; i++) {
          const on = hash(bx * 7 + i, by, Math.floor(t * 4 + i)) < 0.6;
          ctx.fillStyle = on ? (i % 3 ? '#3fb8ff' : '#7dffb0') : '#1d4a6a';
          ctx.fillRect(x + 5 + i * 7, y + 44, 2, 1);
        }
      }
    }
  }

  // Extend edge fog into the margin: unexplored canopies can overhang the map.
  // A tile-sized mask is scaled up with smoothing so its edges fade softly.
  let fogCv = null, fogCtx = null, fogImg = null;
  function drawFog(ctx, G, w, cx, cy) {
    if (!G.fogLeft) return; // everything explored
    const pad = LJ.TREE_ROWS, fw = w.W + pad * 2, fh = w.H + pad * 2;
    if (!fogCv || fogCv.width !== fw || fogCv.height !== fh) {
      fogCv = document.createElement('canvas'); fogCv.width = fw; fogCv.height = fh;
      fogCtx = fogCv.getContext('2d'); fogImg = fogCtx.createImageData(fw, fh); G.fogDirty = true;
    }
    if (G.fogDirty) {
      const d = fogImg.data;
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
        const i = (y * fw + x) * 4;
        const tile = LJ.clamp(y - pad, 0, w.H - 1) * w.W + LJ.clamp(x - pad, 0, w.W - 1);
        d[i] = 10; d[i + 1] = 16; d[i + 2] = 11; d[i + 3] = G.fog[tile] ? 0 : 255;
      }
      fogCtx.putImageData(fogImg, 0, 0);
      G.fogDirty = false;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(fogCv, -cx - pad * TS, -cy - pad * TS, fw * TS, fh * TS);
    ctx.imageSmoothingEnabled = false;
  }

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
