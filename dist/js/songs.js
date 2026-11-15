'use strict';
// The game's music, as scores played by js/music.js. Tweak the notes and reload the game to hear the change.
//
// A song is { bpm, beats (per bar), vol, tracks }. A track is { inst, vol, notes } and loops on its own, so a melody
// can be longer than its accompaniment, or rest for a while and come back.
// Notes are words separated by spaces: a pitch (c4, f#3, bb2), an optional length in beats after a slash (a4/2, g4/.5;
// one beat when left out), "-" for a rest, and "+" between pitches played together (d3+a3+d4/4). "|" is only for the eye.
// Instruments are in music.js: kantele (plucked), flute, pad, bass, strings, bell, drum and shaker.
(function () {
  // A chord is four pitches, low to high. An accompaniment plays them in a pattern, one step per half beat.
  const CH = {
    D: 'd3 a3 d4 f#4', G: 'g2 d3 g3 b3', A: 'a2 e3 a3 c#4', Bm: 'b2 f#3 b3 d4', C: 'c3 g3 c4 e4', 'F#m': 'f#2 c#3 f#3 a3',
    Dm: 'd3 a3 d4 f4', Am: 'a2 e3 a3 c4', F: 'f2 c3 f3 a3', Em: 'e2 b2 e3 g3'
  };
  const bars = s => s.split(' ');
  // One bar of plucked accompaniment per chord name. "G/A" splits a bar between two chords.
  const pluck = (chords, pattern) => bars(chords).map(bar => {
    const parts = bar.split('/'), per = pattern.length / parts.length;
    return parts.map((c, k) => pattern.slice(k * per, (k + 1) * per).map(i => CH[c].split(' ')[i] + '/.5').join(' ')).join(' ');
  }).join(' | ');
  // The root of each chord, an octave down, on the given beats.
  const roots = (chords, lens) => bars(chords).map(bar => {
    const parts = bar.split('/');
    return lens.map((len, k) => { const r = CH[parts[Math.floor(k * parts.length / lens.length)]].split(' ')[0]; return r.slice(0, -1) + (r.slice(-1) - 1) + '/' + len; }).join(' ');
  }).join(' | ');
  // Whole-bar held chords, without the top note doubling the melody.
  const held = (chords, beats) => bars(chords).map(c => CH[c].split(' ').slice(0, 3).join('+') + '/' + beats).join(' | ');
  const rest = beats => '-/' + beats;

  // ---- Title: "Revontulet" (northern lights). 5/4, the metre of the old runo songs: six quick notes, then two long.
  const titleChords = 'Dm Dm C Dm G Dm Am Dm';
  // ---- Playing: "Savotta" (the logging camp). A working tune: A, A, B, then the accompaniment alone.
  const workA = 'D D G D D Bm G/A D', workB = 'G D C D G Bm A A';
  const workAll = [workA, workA, workB, workA].join(' ');
  const tuneA = 'f#5 a5/.5 f#5/.5 d5 e5 | f#5/.5 e5/.5 d5 a4/2 | b4 d5/.5 b4/.5 g4 b4 | a4/3 - | ' +
    'f#5 a5/.5 f#5/.5 d5 e5 | f#5/.5 g5/.5 f#5 d5/2 | b4/.5 d5/.5 g5 e5/.5 c#5/.5 e5 | d5/3 -';
  const tuneB = 'g5 b5/.5 g5/.5 d5 g5 | f#5/.5 e5/.5 d5/.5 e5/.5 f#5/2 | e5 g5/.5 e5/.5 c5 e5 | d5/2 a4/2 | ' +
    'g5 b5/.5 g5/.5 d5 b4 | d5/.5 e5/.5 f#5 b4/2 | c#5 e5/.5 c#5/.5 a4 c#5 | e5/3 -';
  // ---- Later levels: "Korpi" (the deep forest). The same camp, further in: slower, in the relative minor.
  const deepChords = 'Bm Bm G D Bm A G F#m';
  // ---- The opening drive: "Maantie" (the road). Sparse, so the story can be heard over it.
  const roadChords = 'Am F C Em';

  LJ.SONGS = {
    title: {
      bpm: 66, beats: 5, vol: 1,
      tracks: [
        { inst: 'kantele', vol: 0.5, notes: pluck(titleChords, [0, 1, 2, 3, 2, 3, 2, 1, 3, 2]) },
        { inst: 'pad', vol: 0.22, notes: held(titleChords, 5) },
        { inst: 'flute', vol: 0.34, notes: rest(40) + ' | ' +
          'd5/.5 e5/.5 f5/.5 g5/.5 a5/.5 g5/.5 f5 e5 | f5/.5 e5/.5 d5/.5 e5/.5 f5/.5 g5/.5 e5 d5 | ' +
          'e5/.5 g5/.5 g5/.5 e5/.5 c5/.5 e5/.5 g5 e5 | f5/.5 e5/.5 d5/.5 c5/.5 d5/.5 e5/.5 d5/2 | ' +
          'g5/.5 a5/.5 b5/.5 a5/.5 g5/.5 b5/.5 d6 b5 | a5/.5 g5/.5 f5/.5 g5/.5 a5/.5 f5/.5 e5 d5 | ' +
          'c5/.5 e5/.5 a5/.5 g5/.5 e5/.5 c5/.5 e5 c5 | d5/.5 e5/.5 f5/.5 e5/.5 d5/.5 a4/.5 d5/2' }
      ]
    },
    road: {
      bpm: 76, beats: 4, vol: 0.55,
      tracks: [
        { inst: 'kantele', vol: 0.45, notes: pluck(roadChords, [0, 1, 2, 3, 2, 3, 2, 1]) },
        { inst: 'bass', vol: 0.4, notes: roots(roadChords, [4]) },
        { inst: 'bell', vol: 0.16, notes: rest(16) + ' | e5/2 -/2 | c5/2 a4/2 | g4/3 e4 | b4/4 | a4/2 c5/2 | a4/2 f4/2 | g4/2 e5/2 | d5/2 b4/2' }
      ]
    },
    work: {
      bpm: 108, beats: 4, vol: 0.8,
      tracks: [
        { inst: 'kantele', vol: 0.42, notes: pluck(workAll, [0, 1, 2, 3, 1, 2, 3, 1]) },
        { inst: 'bass', vol: 0.42, notes: roots(workAll, [2, 2]) },
        { inst: 'shaker', vol: 0.1, notes: '-/.5 c6/.5 -/.5 c6/.5 -/.5 c6/.5 -/.5 c6/.25 c6/.25' },
        { inst: 'flute', vol: 0.3, notes: [tuneA, tuneA, tuneB, rest(32)].join(' | ') }
      ]
    },
    deep: {
      bpm: 94, beats: 4, vol: 0.8,
      tracks: [
        { inst: 'kantele', vol: 0.42, notes: pluck(deepChords, [0, 1, 2, 3, 1, 2, 3, 1]) },
        { inst: 'bass', vol: 0.42, notes: roots(deepChords, [3, 1]) },
        { inst: 'pad', vol: 0.16, notes: held(deepChords, 4) },
        { inst: 'flute', vol: 0.28, notes: 'b4/2 d5 f#5 | e5/.5 d5/.5 c#5 b4/2 | d5/2 b4 g4 | a4/3 - | ' +
          'b4/2 d5 f#5 | e5/1.5 c#5/.5 a4/2 | b4 a4 g4 b4 | a4/2 f#4/2 | ' + rest(32) }
      ]
    },
    // A war party is at the gates: drums, a drone and a bowed line.
    raid: {
      bpm: 132, beats: 4, vol: 0.85,
      tracks: [
        { inst: 'drum', vol: 0.5, notes: 'c2/.5 -/.5 c2/.5 c2/.5 -/.5 c2/.5 c2/.5 -/.5 | c2/.5 -/.5 c2/.5 c2/.5 -/.5 c2/.5 c2/.25 c2/.25 c2/.5' },
        { inst: 'shaker', vol: 0.12, notes: 'c6/.5 c6/.5 c6/.5 c6/.5 c6/.5 c6/.5 c6/.5 c6/.5' },
        { inst: 'bass', vol: 0.5, notes: 'e2/1.5 e2/.5 e2 g2 | e2/1.5 e2/.5 e2 d2 | e2/1.5 e2/.5 e2 g2 | f2/2 d2/2' },
        { inst: 'strings', vol: 0.26, notes: rest(16) + ' | e4/2 f4 e4 | d4/2 e4/2 | e4/2 g4 f4 | e4/4 | b4/2 c5 b4 | a4/2 g4/2 | f4 e4 d4 f4 | e4/4' }
      ]
    },
    // The ending. The camp tune's opening, slowed down and turned minor, on cold bells.
    ending: {
      bpm: 54, beats: 4, vol: 0.9,
      tracks: [
        { inst: 'pad', vol: 0.3, notes: held('Am Am F F Dm Dm Em Em', 4) },
        { inst: 'bass', vol: 0.4, notes: 'a1/4 | a1/4 | f1/4 | f1/4 | d2/4 | d2/4 | e2/4 | e2/4' },
        { inst: 'bell', vol: 0.3, notes: 'e5/2 g5 e5 | c5/2 d5/2 | e5 d5 c5/2 | a4/4 | f5/2 a5 f5 | d5/2 e5/2 | e5/2 b4/2 | -/4 | ' + rest(32) }
      ]
    }
  };
})();
