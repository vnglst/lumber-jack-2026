'use strict';
// Two rare callbacks to the original Lumber Jack. No orders or random draws change.
(function () {
  const G = LJ.G;
  let active = null, serial = 0, source = null;
  const buffers = new Map();
  function stop() {
    serial++;
    if (source) { source.stop(); source = null; }
    active = null;
    LJ.music?.interrupt(false);
  }
  function audio(id) {
    const out = LJ.synth?.live();
    if (!out) return;
    const ticket = ++serial;
    active.waiting = true;
    if (!buffers.has(id)) buffers.set(id, fetch('audio/song/' + id + '.mp3')
      .then(r => { if (!r.ok) throw new Error('Missing song'); return r.arrayBuffer(); })
      .then(b => out.ctx.decodeAudioData(b)).catch(() => { buffers.delete(id); return null; }));
    buffers.get(id).then(buffer => {
      if (ticket !== serial || !active) return;
      active.waiting = false;
      if (!buffer || G.paused || !LJ.synth.live()) return;
      if (source) source.stop();
      const node = out.ctx.createBufferSource(), gain = out.ctx.createGain();
      node.buffer = buffer; gain.gain.value = 0.6;
      node.connect(gain); gain.connect(out.dest); source = node;
      active.playing = true;
      const singers = active.answered ? active.crew.slice(1) : active.crew.slice(0, 1);
      for (const u of singers) bubble(u, LJ.LINES.song[active.answered ? 1 : 0], buffer.duration);
      node.onended = () => {
        node.disconnect(); gain.disconnect();
        if (source === node) source = null;
        if (ticket === serial && active) { active.playing = false; active.t = active.duration; }
      };
      LJ.music?.interrupt(true);
      node.start(out.ctx.currentTime + 0.02); // let the music gate close before the first syllable
    });
  }
  const peaceful = () => !G.arrival && !G.cine && !G.levelDone && !G.wave.active &&
    !G.units.some(u => u.fighting) && !G.animals.some(a => a.alive && G.units.some(u => Math.hypot(u.x - a.x, u.y - a.y) < 12 * LJ.TS));
  function bubble(u, text, duration = 5.3) {
    // The sample supplies the voice; do not also play a booth recording.
    G.bubbles = G.bubbles.filter(b => { if (b.u !== u) return true; if (b.el) b.el.remove(); return false; });
    G.bubbles.push({ u, text, t: duration });
  }
  function start(kind, crew) {
    G.jackSong[kind] = true;
    active = { crew, kind, t: 0, duration: 5.3, answered: false, waiting: false, playing: false };
    bubble(crew[0], LJ.LINES.song[0]); audio('im-a-lumberjack');
  }
  LJ.jackSong = {
    pause() { if (active) stop(); },
    reset() { stop(); G.jackSong = { poke: false, crew: false, quiet: 0 }; },
    poke(u) {
      if (active) return active.crew.includes(u);
      if (u.clicks < 9 || G.jackSong.poke || !peaceful()) return false;
      start('poke', [u]); return true;
    },
    update(dt) {
      if (active) {
        if (G.paused || !peaceful() || active.crew.some(u => u.dead || !G.units.includes(u)) ||
          (active.kind === 'crew' && active.crew.some(u => u.task || u.path.length))) { stop(); return; }
        // Real audio advances on onended; simulation-only/muted performances use captions and a fallback timer.
        if (active.waiting || active.playing) return;
        active.t += dt;
        if (active.t < active.duration) return;
        if (active.kind === 'crew' && !active.answered) {
          active.answered = true;
          active.t = 0; active.duration = 4.9;
          for (const u of active.crew.slice(1)) bubble(u, LJ.LINES.song[1]);
          audio('hes-a-lumberjack');
        } else stop();
        return;
      }
      if (G.jackSong.crew) return;
      const b = G.base;
      const crew = LJ.jacks().filter(u => !u.task && !u.path.length && !u.fighting &&
        Math.hypot(u.x - (b.tx + b.w / 2) * LJ.TS, u.y - (b.ty + b.h / 2) * LJ.TS) < 6 * LJ.TS);
      if (!peaceful() || crew.length < 3) { G.jackSong.quiet = 0; return; }
      G.jackSong.quiet += dt;
      if (G.time >= 180 + G.world.seed % 120 && G.jackSong.quiet >= 12) start('crew', crew);
    }
  };
})();
