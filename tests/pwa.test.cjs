const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function worker() {
  const handlers = {}, stores = new Map();
  const caches = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        addAll: async requests => { for (const r of requests) entries.set(new URL(r.url, 'https://game.test/').href, { cached: r.url }); },
        match: async url => entries.get(typeof url === 'string' ? url : url.url)
      };
    },
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name)
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), {
    self: { registration: { scope: 'https://game.test/' }, clients: { claim: async () => {} }, addEventListener: (name, run) => { handlers[name] = run; } },
    URL, Set, Promise, Request: class { constructor(url) { this.url = url; } }, caches,
    fetch: async request => ({ network: request.url })
  });
  const run = name => { let done; handlers[name]({ waitUntil: p => { done = p; } }); return done; };
  const fetch = (url, method = 'GET') => { let response; handlers.fetch({ request: { url, method }, respondWith: p => { response = p; } }); return response; };
  return { handlers, stores, run, fetch };
}

test('offline shell includes every shipped game script and stylesheet, and only existing files', async () => {
  const w = worker(); await w.run('install');
  const entries = [...w.stores.values()][0];
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sources = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)"/g)].map(match => match[1]);
  for (const source of sources) assert.ok(entries.has('https://game.test/' + source), source + ' missing from offline cache');
  for (const url of entries.keys()) assert.ok(fs.existsSync(path.join(root, new URL(url).pathname)), url + ' missing from release');
});

test('offline shell handles campaign queries but leaves booth, voices, writes and analytics alone', async () => {
  const w = worker(); await w.run('install');
  assert.ok((await w.fetch('https://game.test/?utm_source=friend')).cached);
  assert.ok((await w.fetch('https://game.test/js/game.js')).cached);
  for (const url of ['https://game.test/voices.html', 'https://game.test/js/voices-studio.js', 'https://game.test/audio/voice/manifest.json', 'https://game.test/audio/voice/yes.wav?v=1', 'https://plausible.koenvangilst.nl/js/script.js']) assert.equal(w.fetch(url), undefined);
  assert.equal(w.fetch('https://game.test/api/voice/yes', 'POST'), undefined);
});

test('activation removes only obsolete Lumberjack shell caches', async () => {
  const w = worker(); await w.run('install');
  w.stores.set('lumberjack-shell-obsolete', new Map());
  w.stores.set('unrelated-site', new Map());
  await w.run('activate');
  assert.equal(w.stores.has('lumberjack-shell-obsolete'), false);
  assert.equal(w.stores.has('unrelated-site'), true);
  assert.equal(w.stores.size, 2);
});

test('manifest provides installable and maskable icon files at their declared PNG dimensions', () => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.scope, '/'); assert.equal(m.start_url, '/');
  for (const icon of m.icons) {
    const data = fs.readFileSync(path.join(root, icon.src));
    const [width, height] = icon.sizes.split('x').map(Number);
    assert.equal(data.readUInt32BE(16), width); assert.equal(data.readUInt32BE(20), height);
  }
  assert.ok(m.icons.some(icon => icon.purpose === 'maskable'));
});
