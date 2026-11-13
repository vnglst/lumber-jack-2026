'use strict';
// Tiny synthesized sound effects (no audio files).
(function () {
  let ac = null, muted = false;
  const last = {};

  LJ.audioInit = function () {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  };

  function tone(f, d, type, vol, slide) {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + d);
  }

  function noise(d, vol, freq) {
    const n = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    src.connect(f); f.connect(g); g.connect(ac.destination);
    src.start(t);
  }

  LJ.sfx = function (n) {
    if (!ac || muted) return;
    const now = performance.now();
    if (now - (last[n] || 0) < 80) return;
    last[n] = now;
    switch (n) {
      case 'chop': noise(0.07, 0.22, 1700); break;
      case 'saw': noise(0.12, 0.08, 3800); break;
      case 'fall': tone(120, 0.35, 'triangle', 0.22, 40); noise(0.25, 0.18, 500); break;
      case 'coin': tone(880, 0.08, 'square', 0.06); setTimeout(() => tone(1320, 0.12, 'square', 0.06), 70); break;
      case 'click': tone(520, 0.05, 'square', 0.04); break;
      case 'no': tone(160, 0.15, 'sawtooth', 0.06); break;
      case 'build': noise(0.2, 0.25, 900); tone(200, 0.2, 'square', 0.06, 120); break;
      case 'rock': noise(0.18, 0.25, 700); break;
      case 'hurt': tone(260, 0.12, 'sawtooth', 0.07, 120); break;
      case 'howl': tone(330, 0.9, 'sine', 0.09, 520); setTimeout(() => tone(520, 0.8, 'sine', 0.08, 300), 500); break;
      case 'laser': tone(1600, 0.09, 'square', 0.03, 320); tone(2400, 0.05, 'sine', 0.02, 900); break;
      case 'arrow': noise(0.06, 0.07, 6000); break;
      case 'thud': noise(0.07, 0.16, 450); break;
      case 'drum': [0, 260, 520, 700].forEach((d, i) => setTimeout(() => { tone(i % 2 ? 72 : 96, 0.22, 'sine', 0.22, 50); noise(0.08, 0.12, 300); }, d)); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.07), i * 110)); break;
    }
  };

  LJ.toggleMute = function () { muted = !muted; return muted; };
})();
