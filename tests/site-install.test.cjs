const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function site() {
  const handlers = {}, elements = {};
  for (const id of ['shareStatus', 'shareGame', 'installGame']) elements[id] = { hidden: true };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/site.js'), 'utf8'), {
    document: { getElementById: id => elements[id] }, navigator: {},
    window: { addEventListener: (name, handler) => { handlers[name] = handler; } }
  });
  return { handlers, elements };
}

test('installation keeps the native banner available and prompts from the install button', async () => {
  const { handlers, elements } = site();
  let prevented = false, calls = 0;
  const event = {
    preventDefault() { prevented = true; },
    async prompt() { calls++; },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  };
  handlers.beforeinstallprompt(event);
  assert.equal(prevented, false, 'do not suppress the native install banner');
  assert.equal(elements.installGame.hidden, false);
  await elements.installGame.onclick();
  await elements.installGame.onclick();
  assert.equal(calls, 1, 'an install event may only be prompted once');
  assert.equal(elements.installGame.hidden, true);
  handlers.beforeinstallprompt(event);
  handlers.appinstalled();
  assert.equal(elements.installGame.hidden, true);
  await elements.installGame.onclick();
  assert.equal(calls, 1);
});

test('a native install choice retires its event without hiding a newer install offer', async () => {
  const { handlers, elements } = site();
  let chooseFirst, chooseSecond;
  const first = { preventDefault() {}, userChoice: new Promise(resolve => { chooseFirst = resolve; }) };
  const second = { preventDefault() {}, userChoice: new Promise(resolve => { chooseSecond = resolve; }) };
  handlers.beforeinstallprompt(first);
  handlers.beforeinstallprompt(second);
  chooseFirst({ outcome: 'dismissed' });
  await Promise.resolve();
  assert.equal(elements.installGame.hidden, false, 'a newer event remains available');
  chooseSecond({ outcome: 'dismissed' });
  await Promise.resolve();
  assert.equal(elements.installGame.hidden, true, 'the native prompt already consumed this event');
  await elements.installGame.onclick();
});
