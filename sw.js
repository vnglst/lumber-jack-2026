'use strict';
// Bump this with each release that changes the game shell. New versions wait until
// all old game tabs close, keeping a single coherent version throughout a session.
const CACHE = 'lumberjack-shell-v20';
const CORE = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './assets/icon.svg', './assets/favicon-32.png', './assets/apple-touch-icon.png',
  './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable-512.png',
  './js/util.js', './js/sfx-defs.js', './js/sound.js', './js/lines.js', './js/voice.js', './js/songs.js', './js/music.js',
  './js/sprites.js', './js/art.js', './js/sprites2.js', './js/world.js', './js/game.js', './js/critters.js', './js/discoveries.js', './js/ore.js',
  './js/combat.js', './js/render.js', './js/ending.js', './js/ui.js', './js/menus.js', './js/title.js',
  './js/save.js', './js/main.js', './js/site.js'
];
const CORE_URLS = new Set(CORE.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('lumberjack-shell-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  // Only the explicit game shell is cached. The recording booth, its API, voice
  // recordings and analytics always go to the network. Offline voices degrade to text.
  const url = new URL(event.request.url);
  url.search = ''; url.hash = '';
  if (event.request.method !== 'GET' || !CORE_URLS.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(url.href);
    return cached || fetch(event.request);
  }));
});
