'use strict';
// Sharing and installation are independent of the running simulation.
(function () {
  const share = { title: 'Lumberjack', text: 'One jack. One axe. An awful lot of trees.', url: 'https://lumber-jack.koenvangilst.nl/' };
  const status = document.getElementById('shareStatus');
  document.getElementById('shareGame').onclick = async () => {
    status.textContent = '';
    try {
      if (navigator.share) { await navigator.share(share); return; }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(share.url);
        status.textContent = 'Game link copied!';
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
    // Selection works when clipboard permissions or the native share sheet are unavailable.
    status.textContent = 'Copy this link: ';
    const input = document.createElement('input');
    input.value = share.url; input.readOnly = true; input.setAttribute('aria-label', 'Game link');
    status.appendChild(input); input.focus(); input.select();
  };

  let installPrompt = null;
  const install = document.getElementById('installGame');
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); installPrompt = e; install.hidden = false;
  });
  install.onclick = async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null; install.hidden = true;
    try { await prompt.prompt(); await prompt.userChoice; } catch (e) { /* browser dismissed the prompt */ }
  };
  window.addEventListener('appinstalled', () => { installPrompt = null; install.hidden = true; });

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* online play still works if storage is unavailable */ });
    });
  }
})();
