'use strict';
// Boot + main loop.
(function () {
  const G = LJ.G;
  LJ.ui.init();
  LJ.newGame();
  LJ.ui.reset();
  LJ.ui.centerOnStart();
  LJ.ui.showTitle();

  // Browsers only allow sound after a first tap or key press, so the first one anywhere starts the audio (and the title music).
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => LJ.audioInit(), true);

  // Which song fits the moment. Mr. Grant arrives to silence; the ending theme starts when the building does.
  function scene() {
    if (LJ.title.isOpen()) return 'title';
    if (G.cine) return G.cine.phase === 'walk' || G.cine.phase === 'talk' ? null : 'ending';
    if (G.arrival) return 'road';
    if (G.wave.active && !G.wave.active.retreating) return 'raid';
    return G.level >= 5 ? 'deep' : 'work';
  }

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    LJ.ui.tick(dt);
    LJ.music.tick(scene());
    if (!G.paused) LJ.update(dt);
    else LJ.jackSong.pause();
    if (!LJ.title.isOpen()) { LJ.render(); LJ.ui.sync(); } // the opening screen covers the whole game
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
