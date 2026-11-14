'use strict';
// Everything the characters say, in one place. The game shows these as speech bubbles, and plays a recording
// of the same line when one exists (see voice.js). Record them in voices.html.
//
// A recording belongs to the line's text, so reword a line and it needs recording again.
// "{n}" stands for a number the game fills in; it counts as the same line whatever the number is.
// Cues are sounds with no words (war cries, howls); the game plays them by id.
LJ.LINES = {
  normal: ['Yes, boss?', 'Ready to chop!', 'Timber?', 'Axe me anything.', "What'll it be?", 'Wood you like something?'],
  annoyed: ["I'm working here!", 'Stop poking me.', 'Do I poke YOU?', 'That flannel was clean.', "Trees don't cut themselves, you know."],
  funny: ["I'm a lumberjack and I'm NOT okay.", 'Poke me again and I unionize.', "Fun fact: I'm allergic to pollen.",
    'I wanted to be a florist, you know.', "My therapist says I have a lot of 'bark'.", "One more click and I'm becoming a barista.",
    'HR will hear about this. HR is a squirrel.'],
  ack: ['On it!', 'Timber!', 'Chop chop.', 'Right away.', 'Consider it mulch.'],
  broke: ['No pay, no hurry.', 'My axe feels heavy today.', 'I work for money, not exposure.', "I'll chop when the cheque clears."],
  none: ['No trees in sight, boss.', 'Nothing left around here.', 'Where to next?', 'All done here.'],
  hunt: ['Here, doggy...', "It's flannel time.", 'For the forest! Wait.'],
  misc: {
    allClear: 'All clear!', cantReach: "Can't get at it from here.", cantGet: "Can't get there.", noHaul: 'Nothing to haul yet.',
    lost: "I'm lost!", noRoad: "Can't reach the road.", noStore: "Can't reach storage.", noSawmill: "Can't reach a sawmill.",
    market: 'To market!', sawdust: 'Sawdust time.', duty: 'Reporting for duty!', who: '…Who are you?'
  },
  veh: {
    truck: ['Honk honk!', 'Beep beep.', '*diesel noises*', 'Loading zone, buddy.'],
    dozer: ['Rrrrumble.', 'I move mountains. Small ones.', 'Rocks fear me.', '*grinding*'],
    harv: ['*mechanical whirring*', 'TREE DETECTED.', 'I replace eleven jacks.', 'Efficiency is beautiful.']
  },
  // What a jack yells when the attacker hits him.
  hit: {
    wolf: ['WOLF!', 'Ow!', 'Bad dog!', 'Get off me!'],
    bear: ['BEAR!', 'Nice bear. NICE BEAR.'],
    native: ['Arrows!', 'Ouch!', 'We come in peace! Mostly.', 'Tiny archers!']
  },
  // Mr. Grant's speech at the end.
  ending: [
    'Ah, there you are! You must be the boss of this little operation.',
    '{n} trees. Not one left standing. Magnificent work, truly.',
    'Allow me to introduce myself. I represent the people who bought this land.',
    'You see, we needed it empty. Completely empty. And you delivered.',
    'Because all of this is going to be the largest AI data center in the country.',
    "Don't worry about the river. It'll make excellent cooling water.",
    'Your bonus: one million dollars. Plus shares in the company. Welcome aboard!'
  ]
};

// Sounds without words. `who` is the voice channel: a new sound from the same one cuts off the last.
LJ.CUES = [
  { id: 'folk_warcry', who: 'folk', label: 'War cry', hint: 'A war party appears at the edge of the forest', try: 'A long rolling battle cry, a bit theatrical' },
  { id: 'folk_shout', who: 'folk', label: 'Shout while shooting', hint: 'Now and then when a forest folk archer hits a jack', try: 'A short fierce "HA!" or "HYAH!"' },
  { id: 'folk_hurt', who: 'folk', label: 'Yelp', hint: 'A forest folk fighter falls', try: 'A short pained "Oof!" or "Ow-ow-ow"' },
  { id: 'folk_retreat', who: 'folk', label: 'Calling retreat', hint: 'The war party falls back into the trees', try: 'A call like "Back! Fall back!" or a horn-like "WOO-OO"' },
  { id: 'folk_raid', who: 'folk', label: 'Raid whoop', hint: 'They carry off wood from the village', try: 'A triumphant whoop' },
  { id: 'wolf_howl', who: 'wolf', label: 'Howl', hint: 'A wolf pack appears', try: 'AWOOOOO. Go on, really commit' },
  { id: 'wolf_snarl', who: 'wolf', label: 'Snarl', hint: 'A wolf bites a jack', try: 'Grrrr, short and nasty' },
  { id: 'wolf_yelp', who: 'wolf', label: 'Yelp', hint: 'A wolf is killed', try: 'A short "Yip!"' },
  { id: 'bear_roar', who: 'bear', label: 'Roar', hint: 'A bear appears, or attacks a jack', try: 'A big deep ROAAAR' },
  { id: 'bear_groan', who: 'bear', label: 'Groan', hint: 'A bear is killed', try: 'A long sad low groan' }
];

// Voice line identity: the text with numbers folded away, as a file-name-safe key.
LJ.voiceKey = function (text) {
  const slug = text.replace(/\{n\}|\d[\d,]*/g, '#').toLowerCase().replace(/[^a-z0-9#]+/g, '-').replace(/^-+|-+$/g, '').replace(/#/g, 'n');
  // "Timber?" and "Timber!" are different takes of the same word, so the ending punctuation is part of the key.
  const mood = /\?\s*$/.test(text) ? '-q' : /!\s*$/.test(text) ? '-x' : '';
  return (slug.slice(0, 70).replace(/-+$/, '') || 'line') + mood;
};

// The recording booth's list: groups of { key, text } lines (or cues), with a note on when each is said.
LJ.voiceGroups = function () {
  const L = LJ.LINES, m = L.misc, seen = new Set(), groups = [];
  const add = (id, who, title, hint, texts) => {
    const items = [];
    for (const text of texts) {
      const key = LJ.voiceKey(text);
      if (seen.has(key)) continue; // e.g. "Honk honk!" appears in two lists
      seen.add(key); items.push({ key, text });
    }
    if (items.length) groups.push({ id, who, title, hint, items });
  };
  add('poke1', 'jack', 'Jack: tapped', 'Said when you tap a jack. The first three taps in a row.', L.normal);
  add('poke2', 'jack', 'Jack: tapped again', 'Taps four to six in a row. He is getting annoyed.', L.annoyed);
  add('poke3', 'jack', 'Jack: tapped too much', 'Seven or more taps in a row. He has had it.', L.funny);
  add('ack', 'jack', 'Jack: given an order', 'Said when you send a jack to work.', L.ack);
  add('broke', 'jack', 'Jack: not paid', 'You are in debt and the jacks grumble.', L.broke);
  add('none', 'jack', 'Jack: nothing to do', 'No trees left in reach.', L.none.concat(m.allClear));
  add('hunt', 'jack', 'Jack: going hunting', 'Sent after an animal.', L.hunt);
  add('jobs', 'jack', 'Jack: on the job', 'Orders that go wrong, and a few announcements.',
    [m.cantReach, m.cantGet, m.noHaul, m.lost, m.noRoad, m.noStore, m.noSawmill, m.market, m.sawdust, m.duty, m.who]);
  add('wolf', 'jack', 'Jack: bitten by a wolf', 'A wolf attacks.', L.hit.wolf);
  add('bear', 'jack', 'Jack: mauled by a bear', 'A bear attacks.', L.hit.bear);
  add('native', 'jack', 'Jack: shot by the forest folk', 'Arrows incoming.', L.hit.native);
  add('truck', 'truck', 'Truck', 'Said when you tap a truck.', L.veh.truck);
  add('dozer', 'dozer', 'Bulldozer', 'Said when you tap or order a bulldozer.', L.veh.dozer);
  add('harv', 'harv', 'Harvester', 'Said when you tap a harvester.', L.veh.harv);
  add('suit', 'suit', 'Mr. Grant, the visitor in the suit', 'His speech at the very end. Smooth, corporate, a little too friendly.', L.ending);
  for (const [id, title, who] of [['folkcues', 'The forest folk', 'folk'], ['wildcues', 'Wolves and bears', null]]) {
    const items = LJ.CUES.filter(c => (who ? c.who === who : c.who !== 'folk')).map(c => ({ key: c.id, text: c.label, cue: c }));
    if (items.length) groups.push({ id, who: who || 'wild', title, hint: 'Sounds without words. The game plays them at the moment shown.', items });
  }
  return groups;
};
