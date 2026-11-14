'use strict';
// Synthesized sound effects (no audio files). Each sound is data in js/sfx-defs.js: a stack of tone and noise layers.
(function () {
  const noiseBufs = new WeakMap();

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

  // Schedule a whole sound on ctx starting at t0.
  function schedule(ctx, dest, def, t0) {
    const jitter = def.jitter || 0;
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
  }

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
    const def = LJ.SFX_DEFAULTS[n];
    if (def) schedule(ac, master, def, ac.currentTime + 0.005);
  };

  LJ.toggleMute = function () { muted = !muted; return muted; };

  // Where other sound code (voice.js) plays: the game's context and master gain, or null while muted or not yet unlocked.
  LJ.synth = { live: () => (ac && !muted ? { ctx: ac, dest: master } : null) };
})();
