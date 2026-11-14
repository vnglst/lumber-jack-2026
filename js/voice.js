'use strict';
// Plays recorded voice lines (audio/voice/<key>.wav, made in voices.html). A line with no recording is just a text bubble.
// Recordings load the first time they are needed. The manifest says which exist.
(function () {
  const BASE = 'audio/voice/';
  const SAVED_KEY = 'lj.voice.savedAt'; // the recording booth bumps this when it saves, so open game tabs refresh
  const MAX_VOICES = 4, VOICE_VOLUME = 0.75;
  let manifest = {}, ready = false;
  const buffers = new Map(); // key -> Promise<AudioBuffer|null>
  const channels = new Map(); // who -> the source node currently talking

  function loadManifest() {
    return fetch(BASE + 'manifest.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then(m => { manifest = m; ready = true; buffers.clear(); return m; });
  }
  loadManifest();
  window.addEventListener('storage', e => { if (e.key === SAVED_KEY) loadManifest(); });

  function load(key, ctx) {
    let p = buffers.get(key);
    if (!p) {
      p = fetch(BASE + key + '.wav?v=' + manifest[key])
        .then(r => (r.ok ? r.arrayBuffer() : null))
        .then(ab => (ab ? ctx.decodeAudioData(ab) : null))
        .catch(() => null);
      buffers.set(key, p);
    }
    return p;
  }

  // Say a recorded line. `who` is the channel (jack, truck, folk...): a new line cuts off the previous one from the same voice.
  function play(key, who) {
    if (!ready || manifest[key] === undefined) return;
    const out = LJ.synth.live();
    if (!out) return;
    load(key, out.ctx).then(buf => {
      if (!buf || !LJ.synth.live()) return;
      if (channels.size >= MAX_VOICES && !channels.has(who)) return; // a crowd shouting at once is just noise
      const prev = channels.get(who);
      if (prev) { try { prev.stop(); } catch (e) { /* already ended */ } }
      const src = out.ctx.createBufferSource();
      const gain = out.ctx.createGain();
      gain.gain.value = VOICE_VOLUME;
      src.buffer = buf;
      src.playbackRate.value = 0.97 + Math.random() * 0.07; // never exactly the same twice
      src.connect(gain); gain.connect(out.dest);
      src.onended = () => { src.disconnect(); gain.disconnect(); if (channels.get(who) === src) channels.delete(who); };
      channels.set(who, src);
      src.start();
    });
  }

  LJ.voice = {
    SAVED_KEY,
    say: (text, who) => play(LJ.voiceKey(text), who || 'jack'),
    cue: id => { const c = LJ.CUES.find(x => x.id === id); if (c) play(id, c.who); },
    has: key => manifest[key] !== undefined,
    manifest: () => manifest,
    reload: loadManifest
  };
})();
