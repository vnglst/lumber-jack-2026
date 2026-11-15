// Interface icons: every icon a button asks for must be drawn, and every pixel icon must be a full 12 by 12 grid.
// A missing icon would stop the interface from starting, and the simulation tests never load the page.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const drawn = new Set();
for (const f of ['js/sprites.js', 'js/art.js']) for (const m of read(f).matchAll(/\bI\.(\w+) = /g)) drawn.add(m[1]);

test('every icon used in the page, the panel and the menus is drawn', () => {
  const used = new Set();
  for (const f of ['index.html', 'js/ui.js', 'js/menus.js']) for (const m of read(f).matchAll(/data-ic="([a-z]+)"/g)) used.add(m[1]);
  for (const m of read('js/ui.js').matchAll(/action\('\w+', '(\w+)'/g)) used.add(m[1]);       // selected-unit buttons
  for (const m of read('js/menus.js').matchAll(/item\('\w+', '(\w+)'/g)) used.add(m[1]);     // menu rows
  for (const m of read('js/menus.js').matchAll(/nav\('(\w+)'/g)) used.add(m[1]);             // Back and Close
  assert.ok(used.size >= 15, 'found ' + used.size + ' icon names');
  for (const name of used) assert.ok(drawn.has(name), 'icon "' + name + '" is used but not drawn');
});

test('pixel icons are twelve rows of twelve known colours', () => {
  const art = read('js/art.js'), ink = new Set('.' + [...art.match(/const UI_INK = \{([\s\S]*?)\};/)[1].matchAll(/(\w): '#/g)].map(m => m[1]).join(''));
  const icons = [...art.matchAll(/I\.(\w+) = pix\(\[([\s\S]*?)\]\);/g)];
  assert.ok(icons.length >= 12);
  for (const [, name, body] of icons) {
    const rows = [...body.matchAll(/'([^']*)'/g)].map(m => m[1]);
    assert.equal(rows.length, 12, name + ' has ' + rows.length + ' rows');
    for (const row of rows) {
      assert.equal(row.length, 12, name + ': "' + row + '"');
      for (const ch of row) assert.ok(ink.has(ch), name + ' uses unknown colour "' + ch + '"');
    }
  }
});
