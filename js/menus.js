'use strict';
// The menus: pause, how to play, forest finds, sound, credits and the new-game question.
// They are screens on a stack inside one dialog. Opening a screen from another pushes it; Back (or Escape) pops it;
// the cross closes everything and puts the game back as it was. On a phone the dialog is a sheet rising from the
// bottom edge, so the buttons sit under the thumb. One-message dialogs (level up, game over) stay in ui.js.
(function () {
  const G = LJ.G, ui = LJ.ui;
  const $ = id => document.getElementById(id);
  const stack = [];  // names of the open screens, the visible one last
  let before = null; // how things were when the first screen opened: { paused, opener, welcome }

  // A row in a menu: a pixel icon, a name and a line saying where things stand. `go` opens another screen.
  const item = (go, icon, name, note, cls) => '<button class="menu-item' + (cls ? ' ' + cls : '') + '" data-go="' + go + '"><i data-ic="' + icon + '"></i>' +
    '<span><b>' + name + '</b>' + (note ? '<small>' + note + '</small>' : '') + '</span></button>';
  const percent = kind => Math.round(LJ.volumeOf(kind) * 100) + '%';
  const soundNote = () => (ui.muted() ? 'All sound is off' : 'Music ' + (LJ.music.isOn() ? percent('music') : 'off') + ', effects ' + percent('effects'));

  // Each screen: a title, the body, an optional footer of buttons (data-a names an action) and, where the body has
  // live controls, a setup function that wires them once the screen is on the page.
  const SCREENS = {
    menu: () => ({
      title: 'Paused',
      body: '<div class="menu">' +
        item('help', 'help', 'How to play', 'The game in three steps, and the controls') +
        (G.arrival ? '' : item('finds', 'finds', 'Forest finds', G.finds.filter(f => f.found).length + ' of ' + G.finds.length + ' recovered')) +
        item('sound', 'sound', 'Sound', soundNote()) +
        item('credits', 'heart', 'Credits', 'Who made this, and the sounds') +
        item('fresh', 'sapling', 'New game', 'Start over in a fresh forest') + '</div>',
      footer: '<button data-a="close" data-main>Back to work</button><p class="fine">The game saves itself as you play.</p>'
    }),

    fresh: () => ({
      title: 'Start a new game?',
      body: '<p>This forest and everything you built in it will be replaced by a fresh one.</p>',
      footer: '<button data-a="back" data-main>Keep playing</button><button data-a="restart" class="ghost">Start a new game</button>',
      actions: { restart: () => { close(); ui.restart(); } }
    }),

    sound: () => {
      const toggle = (id, name, on) => '<label class="switch" for="audio-' + id + '"><span>' + name + '</span>' +
        '<output id="audio-' + id + '-state" for="audio-' + id + '">' + (on ? 'On' : 'Off') + '</output>' +
        '<input id="audio-' + id + '" type="checkbox"' + (on ? ' checked' : '') + '><i class="knob" aria-hidden="true"></i></label>';
      const volume = (kind, name) => '<div class="volume"><label for="volume-' + kind + '">' + name + '</label><output for="volume-' + kind + '">' + percent(kind) + '</output>' +
        '<input id="volume-' + kind + '" data-volume="' + kind + '" type="range" min="0" max="100" step="1" value="' + Math.round(LJ.volumeOf(kind) * 100) + '"></div>';
      return {
        title: 'Sound',
        body: '<div class="sound">' + toggle('master', 'All sound', !ui.muted()) + toggle('music', 'Music', LJ.music.isOn()) +
          volume('music', 'Music volume') + volume('effects', 'Effects volume') + '<p class="fine">Effects include voices and wildlife.</p></div>',
        setup(el) {
          $('audio-master').onchange = e => {
            if (e.target.checked === ui.muted()) ui.toggleSound();
            $('audio-master-state').value = ui.muted() ? 'Off' : 'On';
          };
          $('audio-music').onchange = e => {
            LJ.audioInit();
            if (e.target.checked !== LJ.music.isOn()) LJ.music.toggle();
            $('audio-music-state').value = LJ.music.isOn() ? 'On' : 'Off';
          };
          el.querySelectorAll('[data-volume]').forEach(input => {
            input.oninput = () => {
              LJ.audioInit(); LJ.setVolume(input.dataset.volume, Number(input.value) / 100);
              input.parentElement.querySelector('output').value = input.value + '%';
            };
          });
        }
      };
    },

    credits: () => ({
      title: 'Credits',
      body: '<p>Made by <a href="https://koenvangilst.nl/" target="_blank" rel="noopener">Koen van Gilst</a>.</p>' +
        '<p>Koen &amp; Tibo for play testing the game and the voice recordings.</p>' +
        '<p><a href="https://github.com/vnglst/lumber-jack-2026" target="_blank" rel="noopener">Source code</a></p>' +
        '<p>Playful animal voices adapted from <a href="https://opengameart.org/content/80-cc0-creature-sfx" target="_blank" rel="noopener">80 CC0 creature SFX</a> by rubberduck, under <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener">CC0 1.0</a>.</p>' +
        '<p>Song excerpts: Monty Python, The Lumberjack Song. From the original Lumber Jack game.</p>' +
        '<p class="fine">Shortened, pitched and softened for this forest. Human dialogue and forest-folk voices were recorded for Lumberjack.</p>'
    }),

    finds: () => ({
      title: 'Forest finds',
      body: '<p>' + G.finds.filter(f => f.found).length + ' of ' + G.finds.length + ' recovered. Explore for golden glints, clear the tree above them, then bring a jack or machine nearby.</p>' +
        '<ul>' + Object.values(LJ.discoveries.recipes).map(r => '<li><b>' + r.name + '</b>: ' + r.desc + (G.recipes.includes(r.id) ? ' <b>Recovered ✓</b>' : ' Still hidden.') + '</li>').join('') + '</ul>' +
        '<p>Gold and lost cash boxes fund the operation. Recipe bonuses apply to your whole crew as soon as they are recovered.</p>'
    }),

    help: () => {
      const row = (what, mouse, touch, key) => '<tr><th>' + what + '</th><td>' + mouse + '</td><td>' + touch + '</td><td>' + key + '</td></tr>';
      return {
        title: 'How to play',
        wide: true,
        body: '<ul><li><b>Clear the forest.</b> Send a jack to a tree and he cuts whatever he can see from there, then waits for you; later a Foreman keeps the crew moving by itself. Wood goes back to camp; your truck sells the surplus at the market down the road west.</li>' +
          '<li><b>Grow the camp.</b> The Shop has tools, more jacks, buildings and machines. With Pickaxes, jacks mine ore from glinting rocks (it sells well and the late machines need it) and break up plain rock that is in the way. Upgrade the tent into a village; sawmills turn wood into lumber, Logging Trucks fetch wood from deep in the forest.</li>' +
          '<li><b>Mind the forest.</b> The map is unexplored and it bites back. Jacks heal near home, fall back there by themselves when badly hurt, and learn through work. Forest villages defend themselves; destroying a hut stops its reinforcements for good. Later, war parties march on your village: Guard Towers stop them, and jacks near the village or a tower join in.</li></ul>' +
          '<table class="keys"><tr><td></td><th>Mouse</th><th>Touch</th><th>Keys</th></tr>' +
          row('Select', 'Click a unit, drag a box. Shift adds. Double-click takes every unit of that kind.', 'Tap a unit. Double-tap takes every unit of that kind.', 'Ctrl/⌘+A all jacks. Shift+1–9 saves a group, 1–9 recalls it.') +
          row('Order', 'Click or right-click a tree, animal, hut, a glinting ore rock (or any rock, to break it up), the sawmill, the market sign or open ground. Keep clicking a tree being chopped to land extra whacks.', 'Tap the same things. The buttons beside a selected unit: saw lumber, haul to market, stop, deselect.', 'X stops. Esc deselects.') +
          row('Palisades', 'In palisade mode, drag to build. A drag that starts on a palisade takes it down, as does any drag after Remove.', 'The same, with a finger.', 'R switches between building and removing.') +
          row('Move the map', 'Two-finger scroll or wheel, screen edges, right-drag, or the minimap.', 'Drag. The map button shows the minimap and zoom.', 'WASD or arrows. F selection, H camp, Tab next idle jack.') +
          row('Zoom', 'Trackpad pinch or the − + buttons.', 'Pinch, or the map button.', '− and +') +
          row('Menus', 'Shop is in the toolbar. The log stack pauses and holds help, finds, sound and credits; the note opens sound directly.', 'Camp shows resources and progress. Tap a selected unit’s name for its status and experience. The log stack pauses and holds help, finds, sound and credits.', 'B shop. Esc backs out one step, then pauses.') +
          '</table><p class="fine">You can pan past the forest edge to bring the outermost tiles clear of the panels.</p>'
      };
    }
  };

  // how: 'arrive' for the first screen, 'forward' when a screen opens from another, 'backward' on Back. Only the
  // motion differs (see the motion section of style.css).
  function show(how) {
    const name = stack[stack.length - 1], sc = SCREENS[name](), m = $('modal'), deep = stack.length > 1;
    const nav = (kind, label) => '<button class="nav" data-a="' + kind + '" title="' + label + '" aria-label="' + label + '"><i data-ic="' + kind + '"></i></button>';
    m.innerHTML = '<div class="dialog sheet ' + how + (sc.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="dialog-title">' +
      '<header>' + (deep ? nav('back', 'Back (Esc)') : '<span class="nav"></span>') + '<h1 id="dialog-title">' + sc.title + '</h1>' + nav('close', deep ? 'Close' : 'Close (Esc)') + '</header>' +
      '<div class="body">' + sc.body + '</div>' + (sc.footer ? '<footer>' + sc.footer + '</footer>' : '') + '</div>';
    ui.icons(m);
    m.querySelector('.nav[data-a="' + (deep ? 'back' : 'close') + '"]').dataset.esc = ''; // what Escape presses (see ui.js)
    const actions = Object.assign({ back, close }, sc.actions);
    m.firstElementChild.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      LJ.audioInit(); LJ.sfx('click');
      if (b.dataset.go) open(b.dataset.go);
      else if (actions[b.dataset.a]) actions[b.dataset.a]();
    };
    if (sc.setup) sc.setup(m);
    (m.querySelector('[data-main]') || m.querySelector('.menu-item') || m.querySelector('.nav[data-esc]')).focus({ preventScroll: true });
  }

  // Opens a screen, on top of the one showing if there is one. `opener` gets the keyboard focus back at the end.
  function open(name, opener) {
    if (!stack.length) {
      if (ui.modalOpen() || G.cine) return; // a message is up, or the ending is playing
      before = { paused: G.paused, opener, welcome: LJ.title.isOpen() };
      G.paused = true;
      $('modal').classList.add('open');
      $('modal').classList.toggle('welcome', before.welcome);
      if (before.welcome) $('title').inert = true;
    }
    const first = !stack.length;
    stack.push(name);
    show(first ? 'arrive' : 'forward');
  }
  function back() {
    stack.pop();
    if (stack.length) show('backward'); else close();
  }
  function close() {
    stack.length = 0;
    $('modal').classList.remove('open', 'welcome');
    G.paused = before.paused;
    if (before.welcome) $('title').inert = false;
    if (before.opener) before.opener.focus({ preventScroll: true });
  }

  LJ.menus = { open, back, close, isOpen: () => stack.length > 0 };
  // The names the rest of the interface calls.
  ui.showMenu = () => { if (!LJ.title.isOpen()) open('menu', $('menuBtn')); };
  ui.showHelp = () => open('help', $('helpBtn'));
  ui.showFinds = () => { if (!G.arrival) open('finds', $('findsBtn')); };
  ui.showAudioSettings = () => { if (!LJ.title.isOpen()) open('sound', $('soundBtn')); };
  ui.showCredits = () => { if (LJ.title.isOpen()) open('credits', $('creditsBtn')); };
})();
