'use strict';
// A separate boot path: save.js, main.js and site.js are deliberately absent.
(function () {
  const G = LJ.G;
  LJ.saveGame = LJ.clearSave = () => {};
  LJ.hasSave = LJ.loadGame = () => false;
  LJ.playground.resetView = function () {
    document.getElementById('game').classList.remove('cine', 'arriving');
    for (const id of ['title', 'modal', 'again', 'shop']) document.getElementById(id).classList.remove('open');
    LJ.ui.cineLine(null);
    LJ.ui.zoomTo(innerWidth < 600 ? 2 : 3);
  };
  LJ.ui.init();
  LJ.newGame(42);
  LJ.ui.reset();
  document.getElementById('title').classList.remove('open');
  LJ.ui.centerOnStart();
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => LJ.audioInit(), true);
  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    LJ.ui.tick(dt);
    const scene = G.cine ? (['walk', 'talk'].includes(G.cine.phase) ? null : 'ending') : G.arrival ? 'road' : G.wave.active && !G.wave.active.retreating ? 'raid' : G.level >= 5 ? 'deep' : 'work';
    LJ.music.tick(scene);
    if (!G.paused) LJ.update(dt);
    LJ.render(); LJ.ui.sync();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
