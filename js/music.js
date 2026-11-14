'use strict';
// Music: a small sequencer for the scores in js/songs.js, on synthesized instruments (no audio files).
// The main loop calls LJ.music.tick(scene) every frame. It queues the notes of the next quarter second on the audio
// clock, and fades from one song to the next when the scene changes. A hidden tab stops the loop, and so the music.
(function () {
  const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const AHEAD = 0.25, FADE = 1.6, VOLUME = 0.42, KEY = 'lumberjack-music';

  function hz(name) {
    const m = /^([a-g])(#|b)?(\d)$/.exec(name);
    if (!m) throw new Error('Bad note "' + name + '"');
    const midi = 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // 'd4 f#4/.5 - a3+d4/2' -> { events: [{ t, dur, f: [hz] }], len }, with times in beats.
  function parse(notes) {
    const events = [];
    let t = 0;
    for (const word of notes.split(/\s+/)) {
      if (!word || word === '|') continue;
      const [pitch, len] = word.split('/'), dur = len === undefined ? 1 : +len;
      if (!(dur > 0)) throw new Error('Bad length in "' + word + '"');
      if (pitch !== '-') events.push({ t, dur, f: pitch.split('+').map(hz) });
      t += dur;
    }
    return { events, len: t };
  }

  // ---------- Instruments: (ctx, out, freq, start, seconds, loudness) ----------
  function osc(ctx, type, freq, t, stop, detune) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    o.start(t); o.stop(stop);
    return o;
  }
  // A gain that rises to v, holds, and dies away: the shape of every voice here.
  function env(ctx, out, t, v, attack, hold, release) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + attack);
    if (hold > 0) g.gain.setValueAtTime(v, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    g.connect(out);
    return g;
  }
  function lowpass(ctx, out, freq) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq; f.connect(out);
    return f;
  }
  let noise = null;
  function noiseBuffer(ctx) {
    if (!noise || noise.sampleRate !== ctx.sampleRate) {
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const ch = noise.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    return noise;
  }

  const INST = {
    // A plucked string that rings on after the note, like a kantele.
    kantele(ctx, out, f, t, dur, v) {
      const ring = 1.6, end = t + ring + 0.05;
      osc(ctx, 'triangle', f, t, end).connect(env(ctx, out, t, v, 0.004, 0, ring));
      osc(ctx, 'sine', f * 2, t, end, 4).connect(env(ctx, out, t, v * 0.3, 0.004, 0, ring * 0.5));
      osc(ctx, 'sine', f * 3, t, end).connect(env(ctx, out, t, v * 0.12, 0.002, 0, 0.18));
    },
    flute(ctx, out, f, t, dur, v) {
      const end = t + dur + 0.2, g = env(ctx, out, t, v, 0.05, Math.max(0, dur - 0.1), 0.18);
      const o = osc(ctx, 'sine', f, t, end), lfo = osc(ctx, 'sine', 5.2, t, end), depth = ctx.createGain();
      depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.4, dur)); // vibrato grows into the note
      lfo.connect(depth); depth.connect(o.frequency);
      o.connect(g);
      osc(ctx, 'triangle', f * 2, t, end).connect(env(ctx, out, t, v * 0.12, 0.05, Math.max(0, dur - 0.1), 0.12));
    },
    pad(ctx, out, f, t, dur, v) {
      const a = Math.min(0.9, dur * 0.3), end = t + dur + 1.3, lp = lowpass(ctx, env(ctx, out, t, v, a, dur - a, 1.2), 900);
      osc(ctx, 'sawtooth', f, t, end, -7).connect(lp);
      osc(ctx, 'sawtooth', f, t, end, 7).connect(lp);
    },
    bass(ctx, out, f, t, dur, v) {
      osc(ctx, 'triangle', f, t, t + dur + 0.1).connect(lowpass(ctx, env(ctx, out, t, v, 0.012, dur * 0.4, dur * 0.6), 500));
    },
    // A bowed string with a narrow, nasal tone, like a jouhikko.
    strings(ctx, out, f, t, dur, v) {
      const end = t + dur + 0.3, bp = ctx.createBiquadFilter(), o = osc(ctx, 'sawtooth', f, t, end);
      bp.type = 'bandpass'; bp.frequency.value = f * 2.5; bp.Q.value = 0.8;
      const lfo = osc(ctx, 'sine', 5.6, t, end), depth = ctx.createGain();
      depth.gain.value = f * 0.005; lfo.connect(depth); depth.connect(o.frequency);
      o.connect(bp); bp.connect(env(ctx, out, t, v, 0.09, Math.max(0, dur - 0.15), 0.22));
    },
    bell(ctx, out, f, t, dur, v) {
      const ring = 2.6, end = t + ring + 0.05;
      osc(ctx, 'sine', f, t, end).connect(env(ctx, out, t, v, 0.003, 0, ring));
      osc(ctx, 'sine', f * 2.76, t, end).connect(env(ctx, out, t, v * 0.3, 0.003, 0, ring * 0.45));
      osc(ctx, 'sine', f * 5.4, t, end).connect(env(ctx, out, t, v * 0.12, 0.002, 0, 0.3));
    },
    // A frame drum: a low thud that drops in pitch.
    drum(ctx, out, f, t, dur, v) {
      const o = osc(ctx, 'sine', 120, t, t + 0.32);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.14);
      o.connect(env(ctx, out, t, v, 0.003, 0, 0.28));
    },
    shaker(ctx, out, f, t, dur, v) {
      const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter();
      src.buffer = noiseBuffer(ctx);
      hp.type = 'highpass'; hp.frequency.value = 5200;
      src.connect(hp); hp.connect(env(ctx, out, t, v, 0.002, 0, 0.05));
      src.start(t, Math.random() * 0.8, 0.08);
    }
  };

  // ---------- Player ----------
  let on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* storage blocked: music stays on */ }
  let bus = null;  // { ctx, out }: the music's own volume and echo, feeding the game's master gain
  let cur = null;  // { name, gain, spb, tracks: [{ play, vol, events, len, i, start }], seen }
  const scores = {}; // parsed songs, by name

  function busFor(live) {
    if (bus && bus.ctx === live.ctx) return bus;
    const ctx = live.ctx, out = ctx.createGain(), delay = ctx.createDelay(1), back = ctx.createGain(), wet = ctx.createGain();
    out.gain.value = VOLUME; out.connect(live.dest);
    // A soft echo gives the dry synth voices some room.
    delay.delayTime.value = 0.31; back.gain.value = 0.32; wet.gain.value = 0.28;
    const damp = lowpass(ctx, back, 1800);
    delay.connect(damp); back.connect(delay); delay.connect(wet); wet.connect(live.dest);
    out.connect(delay);
    return (bus = { ctx, out });
  }

  function score(name) {
    if (!scores[name]) {
      const song = LJ.SONGS[name];
      scores[name] = { spb: 60 / song.bpm, vol: song.vol, tracks: song.tracks.map(tr => Object.assign({ play: INST[tr.inst], vol: tr.vol }, parse(tr.notes))) };
    }
    return scores[name];
  }

  function stop() {
    if (!cur) return;
    const g = cur.gain, now = bus.ctx.currentTime;
    g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + FADE);
    setTimeout(() => g.disconnect(), (FADE + 3) * 1000); // after the last notes have rung out
    cur = null;
  }

  function start(name) {
    const ctx = bus.ctx, sc = score(name), gain = ctx.createGain(), t0 = ctx.currentTime + 0.1;
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(sc.vol, ctx.currentTime + FADE);
    gain.connect(bus.out);
    cur = { name, gain, spb: sc.spb, seen: ctx.currentTime, tracks: sc.tracks.map(tr => Object.assign({ i: 0, start: t0 }, tr)) };
  }

  LJ.music = {
    parse,
    // scene: the name of a song in LJ.SONGS, or null for silence.
    tick(scene) {
      const live = LJ.synth.bus();
      if (!live || live.ctx.state !== 'running') return;
      busFor(live);
      if (!on) scene = null;
      if ((cur ? cur.name : null) !== scene) { stop(); if (scene) start(scene); }
      if (!cur) return;
      const now = bus.ctx.currentTime;
      // After a pause (a hidden tab), carry on from where the song was instead of rushing to catch up.
      if (now - cur.seen > AHEAD) for (const tr of cur.tracks) tr.start += now - cur.seen;
      cur.seen = now;
      for (const tr of cur.tracks) {
        if (!tr.events.length) continue;
        for (;;) {
          const ev = tr.events[tr.i], t = tr.start + ev.t * cur.spb;
          if (t > now + AHEAD) break;
          const v = tr.vol * (0.88 + Math.random() * 0.24), late = Math.random() * 0.008; // never quite the same twice
          for (const f of ev.f) tr.play(bus.ctx, cur.gain, f, Math.max(t, now) + late, ev.dur * cur.spb, v);
          if (++tr.i === tr.events.length) { tr.i = 0; tr.start += tr.len * cur.spb; }
        }
      }
    },
    isOn: () => on,
    toggle() {
      on = !on;
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
      return on;
    }
  };
})();
