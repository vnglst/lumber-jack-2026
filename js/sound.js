'use strict';
// Synthesized sound effects (no audio files). Each sound is data (js/sfx-defs.js) played by one layer engine,
// shared with the sound studio (sounds.html). Unsaved studio drafts (localStorage) override js/sfx-defs.js for testing.
(function () {
  const STORE_KEY = 'lj.sfx.v1';
  const noiseBufs = new WeakMap();

  // ---------- engine ----------
  function noiseBuffer(ctx) {
    let b = noiseBufs.get(ctx);
    if (!b) {
      const n = ctx.sampleRate * 2;
      b = ctx.createBuffer(1, n, ctx.sampleRate);
      const ch = b.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      noiseBufs.set(ctx, b);
    }
    return b;
  }

  function envelope(ctx, s, L, dur) {
    const g = ctx.createGain(), atk = Math.min(Math.max(0.001, L.attack || 0.002), dur * 0.9);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.linearRampToValueAtTime(Math.max(0.0001, L.vol), s + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    return g;
  }

  function layer(ctx, out, L, s, mul) {
    const dur = Math.max(0.01, L.dur), g = envelope(ctx, s, L, dur);
    let src;
    if (L.type === 'noise') {
      src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      const f = ctx.createBiquadFilter();
      f.type = L.filter || 'lowpass';
      f.Q.value = L.q || 1;
      f.frequency.setValueAtTime(clampF(L.freq * mul), s);
      if (L.to) f.frequency.exponentialRampToValueAtTime(clampF(L.to * mul), s + dur);
      src.connect(f); f.connect(g);
      src.start(s, Math.random() * 1.5, dur + 0.02); // random offset so repeats never sound identical
    } else {
      src = ctx.createOscillator();
      src.type = L.wave || 'sine';
      src.frequency.setValueAtTime(clampF(L.freq * mul), s);
      if (L.to) src.frequency.exponentialRampToValueAtTime(clampF(L.to * mul), s + dur);
      if (L.vibRate && L.vibDepth) {
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = L.vibRate; lg.gain.value = L.freq * mul * L.vibDepth;
        lfo.connect(lg); lg.connect(src.frequency);
        lfo.start(s); lfo.stop(s + dur + 0.02);
      }
      src.connect(g);
      src.start(s); src.stop(s + dur + 0.02);
    }
    g.connect(out);
  }

  const clampF = f => LJ.clamp(f || 20, 20, 20000);
  const reps = def => Math.max(1, def.repeat | 0 || 1);

  // Schedule a whole sound on ctx starting at t0. Works with AudioContext and OfflineAudioContext.
  function schedule(ctx, dest, def, t0, opts) {
    const jitter = opts && opts.noJitter ? 0 : def.jitter || 0;
    const out = ctx.createGain();
    out.gain.value = def.vol == null ? 1 : def.vol;
    out.connect(dest);
    for (let k = 0, n = reps(def); k < n; k++) {
      const mul = Math.pow(2, (k * (def.step || 0)) / 12) * (1 + (Math.random() * 2 - 1) * jitter);
      for (const L of def.layers) {
        if (L.mute) continue;
        layer(ctx, out, L, t0 + k * (def.gap || 0) + (L.at || 0), mul);
      }
    }
    return t0 + duration(def);
  }

  function duration(def) {
    let end = 0;
    for (const L of def.layers) end = Math.max(end, (L.at || 0) + L.dur);
    return (reps(def) - 1) * (def.gap || 0) + end;
  }

  // Render to an AudioBuffer (for waveform drawing and WAV export).
  function render(def, rate) {
    rate = rate || 44100;
    const len = Math.max(0.05, duration(def) + 0.05);
    const ctx = new OfflineAudioContext(1, Math.ceil(rate * len), rate);
    schedule(ctx, ctx.destination, def, 0, { noJitter: true });
    return ctx.startRendering();
  }

  function toWav(buf) {
    const d = buf.getChannelData(0), n = d.length, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 0x7fff, true);
    return new Blob([ab], { type: 'audio/wav' });
  }

  // ---------- store: saved sounds (js/sfx-defs.js) + drafts from the studio ----------
  // Drafts live in localStorage so the game can play them for testing; Save in the studio writes them to the file.
  const SAVED_KEY = 'lj.sfx.savedAt';
  function loadDrafts() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  let drafts = loadDrafts();
  window.addEventListener('storage', e => {
    if (e.key === STORE_KEY) drafts = loadDrafts(); // live edits from the studio
    else if (e.key === SAVED_KEY) reloadSaved(); // the studio rewrote js/sfx-defs.js
  });

  function reloadSaved() {
    return fetch('js/sfx-defs.js', { cache: 'no-store' })
      .then(r => r.text())
      .then(t => { new Function('LJ', t)(LJ); })
      .catch(() => { /* keep what we have */ });
  }

  function get(name) { return drafts[name] || LJ.SFX_DEFAULTS[name]; }

  LJ.synth = {
    STORE_KEY, SAVED_KEY, schedule, duration, reps, render, toWav,
    drafts: () => drafts,
    setDrafts(all) { drafts = all; try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch (e) { /* storage full or blocked */ } },
  };

  // ---------- game API ----------
  let ac = null, master = null, muted = false;
  const last = {};

  LJ.audioInit = function () {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ac.createDynamicsCompressor(); // keeps stacked sounds from clipping
        master = ac.createGain(); master.gain.value = 0.8;
        master.connect(comp); comp.connect(ac.destination);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  };

  LJ.sfx = function (n) {
    if (!ac || muted) return;
    const now = performance.now();
    if (now - (last[n] || 0) < 80) return;
    last[n] = now;
    const def = get(n);
    if (def) schedule(ac, master, def, ac.currentTime + 0.005);
  };

  LJ.toggleMute = function () { muted = !muted; return muted; };

  // Play a definition directly (used by the studio); ignores mute and throttling.
  LJ.synth.play = function (def) {
    LJ.audioInit();
    if (ac) schedule(ac, master, def, ac.currentTime + 0.01);
  };
})();
