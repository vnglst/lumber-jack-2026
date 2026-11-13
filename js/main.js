'use strict';
// Boot + main loop.
(function () {
  const G = LJ.G;
  LJ.ui.init();
  LJ.newGame();
  LJ.ui.reset();
  LJ.ui.centerOn(G.units[0].x + 60, G.units[0].y);
  LJ.ui.showTitle(false);

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    LJ.ui.tick(dt);
    if (!G.paused) LJ.update(dt);
    LJ.render();
    LJ.ui.sync();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
