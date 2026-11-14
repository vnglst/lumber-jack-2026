'use strict';
// Sound studio: browse, tweak, generate and export the game's synthesized sound effects.
(function () {
  const S = LJ.synth;
  let D = LJ.SFX_DEFAULTS; // saved sounds, as in js/sfx-defs.js
  const $ = id => document.getElementById(id);
  const clone = o => JSON.parse(JSON.stringify(o));
  const r = (a, b) => a + Math.random() * (b - a);
  const pick = LJ.pick;
  const COLORS = ['#f6c453', '#6fb84a', '#5ab4e0', '#e0583a', '#c77dd8', '#e89a4a', '#7fd6c2', '#f08fb0'];

  let drafts = clone(S.drafts()); // name -> def: unsaved tweaks to saved sounds, and new sounds
  const HIST_KEY = 'lj.sfx.history';
  let cur = Object.keys(D)[0];
  const undo = {};
  let lastPush = 0;
  let autoplay = false;
  try { autoplay = localStorage.getItem('lj.studio.autoplay') === '1'; } catch (e) { /* ignore */ }

  const def = n => drafts[n] || D[n];
  const isSaved = n => !!D[n]; // exists in js/sfx-defs.js
  const isDraft = n => !!drafts[n]; // has unsaved changes (or was never saved)
  const draftNames = () => Object.keys(drafts);
  const allNames = () => Object.keys(D).concat(Object.keys(drafts).filter(n => !D[n]).sort());
  function editable() { if (!drafts[cur]) drafts[cur] = clone(D[cur]); return drafts[cur]; }

  // ---------- parameter descriptions ----------
  const GLOBAL = [
    { k: 'vol', label: 'Volume', min: 0, max: 2, step: 0.01, def: 1 },
    { k: 'jitter', label: 'Pitch wobble', min: 0, max: 0.5, step: 0.01, tip: 'Random pitch change on every play, so repeats feel alive' },
    { k: 'repeat', label: 'Repeat', min: 1, max: 8, step: 1, def: 1, tip: 'Play the whole stack of layers this many times' },
    { k: 'gap', label: 'Repeat gap', min: 0.01, max: 0.6, step: 0.005, unit: 's' },
    { k: 'step', label: 'Pitch step', min: -12, max: 12, step: 1, unit: 'st', tip: 'Semitones to shift each repeat (4 = major third, 7 = fifth)' },
  ];
  const TIME = [
    { k: 'dur', label: 'Length', min: 0.01, max: 2, step: 0.005, unit: 's' },
    { k: 'at', label: 'Start at', min: 0, max: 2, step: 0.005, unit: 's' },
    { k: 'vol', label: 'Volume', min: 0, max: 1, step: 0.01 },
    { k: 'attack', label: 'Fade in', min: 0.001, max: 0.5, step: 0.001, unit: 's' },
  ];
  const TONE = [
    { k: 'freq', label: 'Pitch', min: 20, max: 8000, log: true, unit: 'Hz' },
    { k: 'to', label: 'Slide to', min: 20, max: 8000, log: true, off: true, unit: 'Hz', tip: 'Far left = no slide' },
    ...TIME,
    { k: 'vibRate', label: 'Wobble speed', min: 0, max: 60, step: 0.5, unit: 'Hz', tip: 'Vibrato speed. Slow = singing, fast = buzzing' },
    { k: 'vibDepth', label: 'Wobble depth', min: 0, max: 0.5, step: 0.005 },
  ];
  const NOISE = [
    { k: 'freq', label: 'Filter', min: 40, max: 16000, log: true, unit: 'Hz' },
    { k: 'to', label: 'Sweep to', min: 40, max: 16000, log: true, off: true, unit: 'Hz', tip: 'Far left = no sweep' },
    { k: 'q', label: 'Resonance', min: 0.1, max: 20, step: 0.1, tip: 'Higher = more whistly and pitched' },
    ...TIME,
  ];
  const WAVES = [['sine', '∿ Sine'], ['triangle', '△ Tri'], ['square', '⊓ Square'], ['sawtooth', '⩘ Saw']];
  const FILTERS = [['lowpass', 'Low'], ['bandpass', 'Band'], ['highpass', 'High']];

  const tone = (wave, freq, to, dur, vol, at, extra) => Object.assign({ type: 'tone', wave, freq, to: to || 0, dur, vol, at: at || 0, attack: 0.003, vibRate: 0, vibDepth: 0 }, extra);
  const noise = (filter, freq, to, dur, vol, at, extra) => Object.assign({ type: 'noise', filter, freq, to: to || 0, q: 1, dur, vol, at: at || 0, attack: 0.002 }, extra);
  const base = (layers, extra) => Object.assign({ vol: 1, jitter: r(0, 0.08), repeat: 1, gap: 0.1, step: 0, layers }, extra);

  // ---------- "surprise me" generators ----------
  const GEN = {
    Coin() { const f = r(700, 1300); return base([tone('square', f, 0, 0.07, 0.1), tone('square', f * r(1.3, 1.6), 0, r(0.15, 0.3), 0.1, 0.07)], { jitter: 0 }); },
    Jump() { const f = r(180, 420); return base([tone(pick(['square', 'triangle']), f, f * r(1.8, 3), r(0.15, 0.3), 0.12)]); },
    Pew() { return base([tone(pick(['square', 'sawtooth']), r(1200, 2800), r(150, 400), r(0.08, 0.22), 0.08), tone('sine', r(2500, 4000), r(400, 900), 0.07, 0.04)]); },
    Boom() { return base([noise('lowpass', r(900, 2200), r(60, 150), r(0.4, 0.9), 0.65), tone('sine', r(80, 120), r(30, 45), r(0.3, 0.6), 0.5)], { jitter: 0.05 }); },
    Boing() { const f = r(140, 300); return base([tone('triangle', f, f * r(1.3, 2), r(0.3, 0.6), 0.3, 0, { vibRate: r(9, 18), vibDepth: r(0.15, 0.35) })]); },
    'Power-up'() { const f = r(260, 600); return base([tone('square', f, f * 1.5, 0.08, 0.08)], { repeat: (r(3, 7) | 0), gap: r(0.05, 0.09), step: pick([2, 3, 4, 5, 7]), jitter: 0 }); },
    Blip() { return base([tone('square', r(500, 1500), 0, r(0.03, 0.08), 0.1)]); },
    Hit() { return base([noise('lowpass', r(1500, 4000), r(200, 500), 0.12, 0.5), tone('square', r(200, 400), r(60, 100), 0.1, 0.08)], { jitter: 0.1 }); },
    Squelch() { return base([noise('bandpass', r(600, 1200), r(150, 300), r(0.15, 0.3), 0.6, 0, { q: r(4, 9) }), tone('sine', r(250, 400), r(70, 110), 0.18, 0.2, 0, { vibRate: r(20, 35), vibDepth: 0.2 })]); },
    Quack() { const f = r(500, 800); return base([tone('sawtooth', f, f * 0.7, r(0.12, 0.2), 0.12, 0, { vibRate: r(30, 50), vibDepth: 0.1 }), noise('bandpass', f * 1.5, 0, 0.12, 0.2, 0, { q: 6 })]); },
  };

  function mutate(d) {
    const m = a => Math.pow(2, r(-a, a));
    for (const L of d.layers) {
      L.freq = round(clamp(L.freq * m(0.3), 20, 16000));
      if (L.to) L.to = round(clamp(L.to * m(0.3), 20, 16000));
      L.dur = round(clamp(L.dur * m(0.3), 0.01, 2));
      L.vol = round(clamp(L.vol * m(0.15), 0, 1));
      if (L.type === 'tone') {
        if (Math.random() < 0.15) L.wave = pick(WAVES)[0];
        if (Math.random() < 0.2) { L.vibRate = round(r(0, 30)); L.vibDepth = round(r(0, 0.2)); }
      } else if (Math.random() < 0.3) L.q = round(clamp(L.q * m(0.6), 0.1, 20));
    }
    if (Math.random() < 0.2) d.jitter = round(r(0, 0.15));
  }

  const clamp = LJ.clamp;
  const round = v => Math.round(v * 10000) / 10000;

  // ---------- persistence & history ----------
  let saveT = 0, waveT = 0, playT = 0;
  // Store drafts (debounced). A draft that ends up identical to the saved version is no longer a draft.
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      for (const n of Object.keys(drafts)) if (D[n] && same(drafts[n], D[n])) delete drafts[n];
      S.setDrafts(drafts); renderSide(); updateBadge();
    }, 150);
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // ---------- save / revert / history ----------
  let hist = {};
  try { hist = JSON.parse(localStorage.getItem(HIST_KEY)) || {}; } catch (e) { /* ignore */ }
  function addHistory(n, d) {
    const list = hist[n] = hist[n] || [];
    if (list[0] && same(list[0].def, d)) return;
    list.unshift({ t: Date.now(), def: clone(d) });
    if (list.length > 20) list.length = 20;
  }

  // Write drafts for `names` into js/sfx-defs.js via serve.py.
  async function save(names) {
    names = names.filter(isDraft);
    if (!names.length) return;
    const next = clone(D);
    for (const n of names) next[n] = clone(drafts[n]);
    const text = asCode(next);
    let ok = false;
    try { ok = (await fetch('api/sfx-defs', { method: 'POST', headers: { 'Content-Type': 'text/javascript' }, body: text })).ok; } catch (e) { /* offline */ }
    if (!ok) {
      try { await navigator.clipboard.writeText(text); } catch (e) { download(new Blob([text], { type: 'text/javascript' }), 'sfx-defs.js'); }
      return toast('Could not write the file (is serve.py up to date?). Copied the code instead: paste it over js/sfx-defs.js', 5000);
    }
    for (const n of names) if (D[n]) addHistory(n, D[n]); // keep the version we are replacing
    try { localStorage.setItem(HIST_KEY, JSON.stringify(hist)); } catch (e) { /* ignore */ }
    LJ.SFX_DEFAULTS = D = next;
    for (const n of names) delete drafts[n];
    S.setDrafts(drafts);
    try { localStorage.setItem(S.SAVED_KEY, String(Date.now())); } catch (e) { /* ignore */ } // open game tabs reload the file
    renderSide(); renderMain();
    toast(names.length === 1 ? `Saved "${names[0]}" to js/sfx-defs.js` : `Saved ${names.length} sounds to js/sfx-defs.js`);
  }

  function revert(names) {
    names = names.filter(n => isDraft(n) && isSaved(n));
    if (!names.length) return;
    for (const n of names) { pushUndo(true, n); delete drafts[n]; }
    persist(); renderSide(); renderMain();
    toast(names.length === 1 ? 'Reverted to the saved version' : `Reverted ${names.length} sounds`);
  }

  function updateTop() {
    const n = draftNames().length;
    $('saveAll').textContent = n ? `💾 Save all (${n})` : '💾 All saved';
    $('saveAll').disabled = !n;
    $('revertAll').disabled = !draftNames().some(isSaved);
  }
  function pushUndo(force, name) {
    name = name || cur;
    const now = performance.now();
    if (!force && now - lastPush < 700) return;
    lastPush = now;
    const st = undo[name] = undo[name] || [];
    st.push(clone(def(name)));
    if (st.length > 60) st.shift();
  }
  // One undoable edit of the current sound.
  function edit(fn, andPlay) { pushUndo(true); fn(editable()); changed(true); if (andPlay) play(); }
  const mutateCur = () => edit(mutate, true);
  function doUndo() {
    const st = undo[cur];
    if (!st || !st.length) return toast('Nothing to undo');
    drafts[cur] = st.pop(); lastPush = 0;
    persist(); renderSide(); renderMain();
  }
  // Something about the current sound changed.
  function changed(rebuild) {
    persist();
    if (rebuild) { renderSide(); renderMain(); } else { clearTimeout(waveT); waveT = setTimeout(drawWave, 60); }
    if (autoplay) { clearTimeout(playT); playT = setTimeout(play, 220); }
  }

  // ---------- playback ----------
  let playhead = null;
  function play(d) {
    d = d || def(cur);
    S.play(d);
    playhead = { t0: performance.now(), len: S.duration(d) };
    requestAnimationFrame(tick);
  }
  function tick() {
    if (!playhead) return;
    const t = (performance.now() - playhead.t0) / 1000;
    paintWave(t);
    if (t < playhead.len + 0.05) requestAnimationFrame(tick); else { playhead = null; paintWave(); }
  }

  // ---------- sidebar ----------
  function renderSide() {
    const side = $('side');
    const mine = allNames().filter(n => !isSaved(n));
    updateTop();
    side.innerHTML = '';
    const h = (txt, btn) => { const e = document.createElement('h3'); e.textContent = txt; if (btn) e.appendChild(btn); side.appendChild(e); };
    h('Saved sounds');
    Object.keys(D).forEach(item);
    const add = document.createElement('button'); add.className = 'ghost'; add.textContent = '+ New'; add.title = 'Start a new sound';
    add.onclick = () => newSound(GEN.Blip());
    h('New sounds', add);
    if (!mine.length) { const p = document.createElement('div'); p.className = 'item'; p.innerHTML = '<span class="nm"><span>Ideas start here. Hit "+ New".</span></span>'; side.appendChild(p); }
    mine.forEach(item);

    function item(n) {
      const d = def(n), e = document.createElement('div');
      e.className = 'item' + (n === cur ? ' sel' : '');
      const b = document.createElement('button'); b.className = 'play'; b.textContent = '▶'; b.title = 'Play';
      b.onclick = ev => { ev.stopPropagation(); play(d); };
      const nm = document.createElement('span'); nm.className = 'nm';
      nm.innerHTML = '<b></b><span></span>';
      nm.firstChild.textContent = n; nm.lastChild.textContent = d.desc || '';
      e.append(b, nm);
      if (isDraft(n)) { const dot = document.createElement('span'); dot.className = 'dot'; dot.title = 'Unsaved draft'; e.appendChild(dot); }
      e.onclick = () => { select(n); };
      side.appendChild(e);
    }
  }

  function select(n) { cur = n; renderSide(); renderMain(); }

  function newSound(d, baseName) {
    let i = 1, n;
    const stem = (baseName || 'sound').replace(/-\d+$/, '');
    do n = stem + '-' + i++; while (def(n));
    drafts[n] = d; cur = n;
    persist(); renderSide(); renderMain(); play();
  }

  // ---------- main editor ----------
  function renderMain() {
    const d = def(cur), main = $('main');
    main.innerHTML = '';

    // header
    const head = el('div', 'head');
    const title = el('div', 'title');
    const name = el('input', 'name'); name.value = cur; name.readOnly = isSaved(cur); name.spellcheck = false;
    name.title = isSaved(cur) ? 'Saved names are fixed: the code calls LJ.sfx(\'' + cur + '\')' : 'Rename';
    name.onchange = () => rename(name.value);
    const desc = el('input', 'desc'); desc.value = d.desc || ''; desc.placeholder = 'What is this sound for?';
    desc.oninput = () => { editable().desc = desc.value; persist(); };
    const badge = el('div', 'badge'); badge.id = 'badge';
    title.append(name, desc, badge);
    const playB = btn('▶ Play', () => play(), 'gold bigplay'); playB.innerHTML = '▶ Play<kbd>Space</kbd>';
    head.append(title, playB,
      btn('🎲 Mutate', mutateCur, '', 'Randomly nudge every layer a little (M)'),
      btn('↶ Undo', doUndo, '', 'Undo (Ctrl/Cmd+Z)'),
      btn('⧉ Duplicate', () => newSound(clone(d), cur), '', 'Copy into New sounds'),
      btn('⬇ WAV', downloadWav, '', 'Download as a .wav file'));
    const saveB = btn('💾 Save', () => save([cur]), 'on', 'Write this sound to js/sfx-defs.js (Cmd/Ctrl+S)'); saveB.id = 'saveOne';
    head.appendChild(saveB);
    if (isSaved(cur)) {
      const rv = btn('↺ Revert', () => revert([cur]), 'danger', 'Throw away the draft and go back to the saved version'); rv.id = 'revertOne';
      head.appendChild(rv);
    } else {
      const sel = document.createElement('select'); sel.title = 'Copy this sound over a game sound';
      sel.innerHTML = '<option value="">Use in game as…</option>' + Object.keys(D).map(k => `<option>${k}</option>`).join('');
      sel.onchange = () => {
        const k = sel.value; if (!k) return;
        if (!confirm(`Replace the "${k}" game sound with "${cur}"?`)) { sel.value = ''; return; }
        const keepDesc = def(k).desc;
        pushUndo(true, k);
        drafts[k] = Object.assign(clone(d), { desc: keepDesc });
        persist(); select(k); toast(`"${k}" now uses this sound. Undo is available there.`);
      };
      head.append(sel, btn('🗑 Delete', () => {
        if (!confirm(`Delete "${cur}"?`)) return;
        delete drafts[cur]; cur = Object.keys(D)[0]; persist(); renderSide(); renderMain();
      }, 'danger'));
    }
    main.appendChild(head);

    // waveform
    const wave = el('div', 'wave'); wave.title = 'Click to play';
    const cv = document.createElement('canvas'); cv.id = 'wave';
    const meta = el('div', 'meta'); meta.id = 'waveMeta';
    wave.append(cv, meta); wave.onclick = () => play();
    main.appendChild(wave);

    // generators
    const gens = el('div', 'gens');
    gens.appendChild(Object.assign(el('span', 'lbl'), { textContent: 'Surprise me:' }));
    for (const g of Object.keys(GEN)) gens.appendChild(btn(g, () => applyGen(GEN[g]()), '', 'Generate a random "' + g + '" sound here'));
    gens.appendChild(btn('🎰 Anything', () => { const g = GEN[pick(Object.keys(GEN))](); mutate(g); mutate(g); applyGen(g); }, 'gold'));
    main.appendChild(gens);

    // global
    const gp = el('div', 'panel');
    gp.appendChild(Object.assign(document.createElement('h4'), { textContent: 'Whole sound' }));
    const gg = el('div', 'grid');
    for (const p of GLOBAL) gg.appendChild(slider(p, () => def(cur)[p.k] ?? (p.def || 0), v => { editable()[p.k] = v; }));
    gp.appendChild(gg);
    main.appendChild(gp);

    // layers
    d.layers.forEach((L, i) => main.appendChild(layerPanel(L, i)));
    const add = el('div', 'addrow');
    add.append(
      btn('+ Tone layer', () => addLayer(tone('sine', 440, 0, 0.2, 0.2)), '', 'A pitched oscillator'),
      btn('+ Noise layer', () => addLayer(noise('lowpass', 1200, 0, 0.15, 0.3)), '', 'Filtered noise: hits, whooshes, crunches'));
    main.appendChild(add);

    main.appendChild(historyPanel());
    updateBadge();
    requestAnimationFrame(drawWave);
  }

  // Draft / saved indicator plus Save & Revert availability; cheap enough to call on every tweak.
  function updateBadge() {
    const b = $('badge'); if (!b) return;
    const dr = isDraft(cur), saved = isSaved(cur);
    b.className = 'badge ' + (dr ? 'draft' : 'saved');
    b.textContent = !saved ? '● New sound, not saved yet' :
      dr ? '● Draft: the game plays this for testing. Save to keep it, Revert to drop it' : '✓ Saved in js/sfx-defs.js';
    const s1 = $('saveOne'), r1 = $('revertOne');
    if (s1) s1.disabled = !dr;
    if (r1) r1.disabled = !dr;
    updateTop();
  }

  function historyPanel() {
    const list = hist[cur] || [], p = el('div', 'panel hist');
    const h = document.createElement('h4'); h.textContent = 'Earlier saved versions';
    p.appendChild(h);
    if (!list.length) {
      p.appendChild(Object.assign(el('div', 'empty'), { textContent: 'Each time you save, the version it replaces lands here so you can always go back.' }));
      return p;
    }
    list.forEach((v, i) => {
      const row = el('div', 'hrow');
      const when = el('span', 'when'); when.textContent = ago(v.t); when.title = new Date(v.t).toLocaleString();
      row.append(btn('▶', () => play(v.def), 'ghost', 'Play this version'), when,
        Object.assign(el('span', 'grow'), { textContent: Math.round(S.duration(v.def) * 1000) + ' ms · ' + v.def.layers.length + ' layer' + (v.def.layers.length === 1 ? '' : 's') }),
        btn('Restore as draft', () => { edit(d => { drafts[cur] = Object.assign(clone(v.def), { desc: d.desc }); }, true); toast('Restored as a draft. Save to make it stick'); }, '', 'Load this version as a draft; nothing is saved until you press Save'));
      p.appendChild(row);
    });
    return p;
  }
  function ago(t) {
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return new Date(t).toLocaleDateString();
  }


  function layerPanel(L, i) {
    const p = el('div', 'panel' + (L.mute ? ' muted' : ''));
    const h = document.createElement('h4');
    const sw = el('span', 'sw'); sw.style.background = COLORS[i % COLORS.length];
    h.append(sw, 'Layer ' + (i + 1));
    h.appendChild(seg([['tone', 'Tone'], ['noise', 'Noise']], L.type, v => {
      const at = editable().layers[i];
      if (at.type === v) return;
      pushUndo(true);
      editable().layers[i] = v === 'tone' ? tone('sine', clamp(at.freq, 20, 8000), 0, at.dur, at.vol, at.at) : noise('lowpass', at.freq, 0, at.dur, at.vol, at.at);
      changed(true);
    }));
    if (L.type === 'tone') h.appendChild(seg(WAVES, L.wave, v => edit(d => { d.layers[i].wave = v; })));
    else h.appendChild(seg(FILTERS, L.filter, v => edit(d => { d.layers[i].filter = v; })));
    h.appendChild(el('span', 'grow'));
    const solo = { vol: 1, jitter: 0, repeat: 1, gap: 0, step: 0, layers: [Object.assign({}, L, { at: 0, mute: false })] };
    h.append(
      btn('▶', () => play(solo), 'ghost', 'Play this layer alone'),
      btn(L.mute ? '🔇' : '🔊', () => edit(d => { d.layers[i].mute = !L.mute; }), 'ghost', L.mute ? 'Unmute layer' : 'Mute layer'),
      btn('⧉', () => edit(d => { d.layers.splice(i + 1, 0, clone(L)); }), 'ghost', 'Duplicate layer'),
      btn('✕', () => {
        if (def(cur).layers.length < 2) return toast('A sound needs at least one layer');
        edit(d => { d.layers.splice(i, 1); });
      }, 'ghost danger', 'Remove layer'));
    p.appendChild(h);
    const g = el('div', 'grid');
    for (const sp of (L.type === 'tone' ? TONE : NOISE)) g.appendChild(slider(sp, () => def(cur).layers[i][sp.k] || 0, v => { editable().layers[i][sp.k] = v; }));
    p.appendChild(g);
    return p;
  }

  const addLayer = L => edit(d => { d.layers.push(L); });
  const applyGen = g => edit(d => { g.desc = d.desc; drafts[cur] = g; }, true);

  function rename(n) {
    n = n.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    if (!n || n === cur) return renderMain();
    if (def(n)) { toast('"' + n + '" already exists'); return renderMain(); }
    drafts[n] = drafts[cur]; delete drafts[cur];
    undo[n] = undo[cur]; delete undo[cur];
    cur = n; persist(); renderSide(); renderMain();
  }

  // ---------- widgets ----------
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function btn(txt, fn, cls, tip) { const b = el('button', cls); b.textContent = txt; b.onclick = fn; if (tip) b.title = tip; return b; }
  function seg(opts, val, fn) {
    const s = el('span', 'seg');
    for (const [v, t] of opts) s.appendChild(btn(t, () => fn(v), v === val ? 'on' : ''));
    return s;
  }

  // Slider + number box. Log sliders map 0..1000 onto min..max exponentially; `off` reserves the far left for 0.
  function slider(p, get, set) {
    const row = el('div', 'sl');
    const lab = el('label'); lab.textContent = p.label; if (p.tip) lab.title = p.tip;
    const rg = el('input'); rg.type = 'range';
    const num = el('input'); num.type = 'number'; num.step = 'any';
    if (p.log) { rg.min = 0; rg.max = 1000; rg.step = 1; } else { rg.min = p.min; rg.max = p.max; rg.step = p.step; }
    const toPos = v => p.log ? (p.off && v <= 0 ? 0 : clamp(Math.round(1000 * Math.log(v / p.min) / Math.log(p.max / p.min)), p.off ? 1 : 0, 1000)) : v;
    const fromPos = x => p.log ? (p.off && +x === 0 ? 0 : Math.round(p.min * Math.pow(p.max / p.min, x / 1000))) : +x;
    const show = v => { rg.value = toPos(v); num.value = v === 0 && p.off ? '' : fmt(v); num.placeholder = p.off ? 'off' : ''; };
    show(get());
    rg.oninput = () => { pushUndo(); const v = fromPos(rg.value); set(v); num.value = v === 0 && p.off ? '' : fmt(v); changed(); };
    num.onchange = () => { pushUndo(true); const v = num.value === '' && p.off ? 0 : clamp(+num.value || 0, p.off ? 0 : p.min, p.max * (p.log ? 2 : 1)); set(v); show(v); changed(); };
    row.append(lab, rg, num);
    return row;
  }
  const fmt = v => Math.abs(v) >= 100 ? String(Math.round(v)) : String(round(v));

  // ---------- waveform ----------
  let waveImg = null, waveLen = 1;
  async function drawWave() {
    const cv = $('wave'); if (!cv) return;
    const d = def(cur), name = cur;
    const buf = await S.render(d, 22050);
    if (name !== cur) return;
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth * dpr, H = 170 * dpr;
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const g = off.getContext('2d'), data = buf.getChannelData(0);
    waveLen = Math.max(0.3, buf.duration);
    const lanes = Math.min(d.layers.length, 8);
    const laneH = 7 * dpr, laneTop = H - lanes * (laneH + 2 * dpr) - 6 * dpr, mid = laneTop / 2, amp = laneTop / 2 - 8 * dpr;
    const x = t => (t / waveLen) * W;

    // time grid
    g.font = `${10 * dpr}px ui-rounded, sans-serif`; g.fillStyle = 'rgba(255,233,184,.35)';
    const stepT = waveLen > 1.5 ? 0.25 : 0.1;
    for (let t = stepT; t < waveLen; t += stepT) {
      g.fillRect(x(t), 0, dpr, laneTop); g.fillText(Math.round(t * 1000) + 'ms', x(t) + 3 * dpr, 12 * dpr);
    }
    g.fillStyle = 'rgba(255,233,184,.15)'; g.fillRect(0, mid, W, dpr);

    // waveform (min/max per column)
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    const grad = g.createLinearGradient(0, 0, 0, laneTop);
    grad.addColorStop(0, '#ffe08a'); grad.addColorStop(0.5, '#f6c453'); grad.addColorStop(1, '#c98a22');
    g.fillStyle = grad;
    const per = data.length / (buf.duration / waveLen * W);
    for (let px = 0; px < W; px++) {
      const a = Math.floor(px * per), b = Math.min(data.length, Math.floor((px + 1) * per));
      if (a >= data.length) break;
      let lo = 0, hi = 0;
      for (let i = a; i < b; i++) { const v = data[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      g.fillRect(px, mid - hi * amp, 1, Math.max(dpr, (hi - lo) * amp));
    }

    // layer timeline lanes
    const reps = S.reps(d);
    d.layers.slice(0, lanes).forEach((L, i) => {
      g.fillStyle = COLORS[i % COLORS.length]; g.globalAlpha = L.mute ? 0.2 : 0.85;
      const y = laneTop + 4 * dpr + i * (laneH + 2 * dpr);
      for (let k = 0; k < reps; k++) g.fillRect(x(k * (d.gap || 0) + (L.at || 0)), y, Math.max(2 * dpr, x(L.dur)), laneH);
    });
    g.globalAlpha = 1;
    waveImg = off;

    const meta = $('waveMeta');
    meta.textContent = `${Math.round(S.duration(d) * 1000)} ms · peak ${peak.toFixed(2)}${peak > 1 ? ' · loud! the game compressor will squash it' : ''}`;
    meta.className = 'meta' + (peak > 1 ? ' clip' : '');
    paintWave();
  }
  function paintWave(t) {
    const cv = $('wave'); if (!cv || !waveImg) return;
    if (cv.width !== waveImg.width || cv.height !== waveImg.height) { cv.width = waveImg.width; cv.height = waveImg.height; }
    const g = cv.getContext('2d');
    g.drawImage(waveImg, 0, 0);
    if (t != null) {
      const px = (t / waveLen) * cv.width;
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, px, cv.height);
      g.fillStyle = '#fff'; g.fillRect(px, 0, 2 * (window.devicePixelRatio || 1), cv.height);
    }
  }
  window.addEventListener('resize', () => { clearTimeout(waveT); waveT = setTimeout(drawWave, 100); });

  // ---------- import / export ----------
  async function downloadWav() {
    const buf = await S.render(def(cur), 44100);
    download(S.toWav(buf), cur + '.wav');
  }
  function download(blob, fname) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Produce the full contents of js/sfx-defs.js: one line per layer so diffs stay readable.
  function asCode(all) {
    const kv = o => Object.entries(o).filter(([k, v]) => k !== 'layers' && !(k === 'mute' && !v))
      .map(([k, v]) => JSON.stringify(k) + ': ' + JSON.stringify(typeof v === 'number' ? round(v) : v)).join(', ');
    const body = Object.entries(all).map(([n, d]) =>
      `  ${JSON.stringify(n)}: {\n    ${kv(d)},\n    "layers": [\n${d.layers.map(L => '      { ' + kv(L) + ' }').join(',\n')}\n    ]\n  }`).join(',\n');
    return HEADER + 'LJ.SFX_DEFAULTS = {\n' + body + '\n};\n';
  }
  const HEADER = `'use strict';
// Sound effect definitions, written by the sound studio (sounds.html → Save). Hand edits are fine too.
//
// A sound is a stack of layers played together:
//   tone : { type:'tone',  wave, freq, to, dur, vol, at, attack, vibRate, vibDepth }
//   noise: { type:'noise', filter, freq, to, q, dur, vol, at, attack }
// freq/to are Hz (to = 0 means no slide); at/dur/attack are seconds; vibDepth is a fraction of the pitch.
// Sound-level: vol (master), jitter (random pitch per play), repeat/gap/step (echo the stack, shifting by \`step\` semitones).
`;

  $('saveAll').onclick = () => save(draftNames());
  $('revertAll').onclick = () => {
    const n = draftNames().filter(isSaved);
    if (n.length && confirm(`Throw away drafts for ${n.join(', ')}?`)) revert(n);
  };
  $('exportJson').onclick = () => download(new Blob([JSON.stringify(drafts, null, 2)], { type: 'application/json' }), 'lumberjack-sound-drafts.json');
  $('importJson').onclick = () => $('importFile').click();
  $('importFile').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const src = JSON.parse(await f.text());
      let n = 0;
      for (const [k, v] of Object.entries(src)) if (v && Array.isArray(v.layers)) { drafts[k] = v; n++; }
      persist(); renderSide(); renderMain(); toast(`Imported ${n} sound${n === 1 ? '' : 's'} as drafts`);
    } catch (err) { toast('That file is not valid sound JSON'); }
    e.target.value = '';
  };
  const ap = $('autoplay'); ap.checked = autoplay;
  ap.onchange = () => { autoplay = ap.checked; try { localStorage.setItem('lj.studio.autoplay', autoplay ? '1' : '0'); } catch (e) { /* ignore */ } };

  // ---------- misc ----------
  let toastT = 0;
  function toast(msg, ms) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2400); }

  // Another studio tab changed the drafts.
  window.addEventListener('storage', e => {
    if (e.key !== S.STORE_KEY) return;
    drafts = clone(S.drafts()); if (!def(cur)) cur = Object.keys(D)[0];
    renderSide(); renderMain();
  });

  document.addEventListener('keydown', e => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const typing = (tag === 'INPUT' && !['range', 'checkbox'].includes(document.activeElement.type)) || tag === 'SELECT' || tag === 'TEXTAREA';
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save([cur]); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); doUndo(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); play(); }
    else if (e.key === 'm') mutateCur();
    else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'j' || e.key === 'k') && tag !== 'INPUT') {
      e.preventDefault();
      const ns = allNames(), i = ns.indexOf(cur) + (e.key === 'ArrowDown' || e.key === 'j' ? 1 : -1);
      if (ns[i]) { select(ns[i]); play(); }
    }
  });

  renderSide();
  renderMain();
})();
