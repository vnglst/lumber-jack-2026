'use strict';
// Boot + main loop.
(function () {
  const G = LJ.G;
  LJ.ui.init();
  LJ.newGame();
  LJ.ui.reset();
  LJ.ui.centerOnStart();
  LJ.ui.showTitle();

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    LJ.ui.tick(dt);
    if (!G.paused) LJ.update(dt);
    if (!LJ.title.isOpen()) { LJ.render(); LJ.ui.sync(); } // the opening screen covers the whole game
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
