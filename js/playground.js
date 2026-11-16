'use strict';
// The review page borrows the authoritative game shell and script order without its save or site lifecycle.
(async function () {
  const $ = id => document.getElementById(id), frame = $('review-game');
  const status = text => { $('review-status').textContent = text; };
  let ready = false;
  $('review-scene').addEventListener('change', () => {
    const preset = $('review-scene').value.startsWith('town');
    $('review-level').disabled = $('review-gear').disabled = preset;
    if (preset) $('review-level').value = $('review-scene').value.slice(4);
  });
  function load() {
    if (!ready || !$('review-form').reportValidity()) return;
    try {
      const result = frame.contentWindow.LJ.playground.load({
        scene: $('review-scene').value, level: Number($('review-level').value),
        gear: $('review-gear').value, seed: Number($('review-seed').value)
      });
      status(result);
    } catch (e) { status('Could not prepare this scene: ' + e.message); }
  }
  $('review-form').addEventListener('submit', e => { e.preventDefault(); if (ready) frame.contentWindow.LJ.audioInit(); load(); });
  $('review-toggle').addEventListener('click', () => {
    const settings = $('review-settings'); settings.hidden = !settings.hidden;
    $('review-toggle').textContent = settings.hidden ? 'Show controls' : 'Hide controls';
    $('review-toggle').setAttribute('aria-expanded', String(!settings.hidden));
  });
  $('review-pause').addEventListener('click', () => {
    if (!ready) return;
    const g = frame.contentWindow.LJ.G;
    // A level announcement or menu owns its pause until its own button closes it.
    if (frame.contentDocument.querySelector('#modal.open')) return;
    g.paused = !g.paused;
  });
  try {
    // Use a development-only URL space for the shell AND its dependencies. An old
    // active worker can otherwise mix its cached game API with new scene fixtures;
    // a query string or cache: 'no-store' does not bypass that cache-first worker.
    const sourceRoot = new URL('__playground__/', location.href);
    const response = await fetch(new URL('index.html', sourceRoot));
    if (!response.ok) throw new Error('Game shell returned HTTP ' + response.status);
    const shell = new DOMParser().parseFromString(await response.text(), 'text/html');
    // These scripts never execute here, including the autosave event listeners in save.js.
    for (const script of shell.querySelectorAll('script')) {
      if (!script.getAttribute('src')?.startsWith('js/') || ['js/save.js', 'js/main.js', 'js/site.js'].includes(script.getAttribute('src'))) script.remove();
    }
    shell.querySelector('head').insertAdjacentHTML('afterbegin', '<base href="' + sourceRoot.href + '">');
    for (const name of ['playground-scenes', 'playground-frame']) {
      const script = shell.createElement('script'); script.src = 'js/' + name + '.js'; shell.body.appendChild(script);
    }
    frame.addEventListener('load', () => {
      ready = !!frame.contentWindow.LJ?.playground;
      if (!ready) { status('Game scripts could not load. Reload while connected, with the local server running.'); return; }
      $('review-load').disabled = $('review-pause').disabled = false;
      load();
    }, { once: true });
    frame.srcdoc = '<!doctype html>\n' + shell.documentElement.outerHTML;
    setInterval(() => {
      if (!ready) return;
      const g = frame.contentWindow.LJ.G;
      $('review-pause').textContent = g.paused ? 'Resume' : 'Pause';
      $('review-pause').disabled = !!frame.contentDocument.querySelector('#modal.open');
    }, 200);
  } catch (e) { status('Could not load the playground: ' + e.message + '. Serve this folder with make.'); }
})();
