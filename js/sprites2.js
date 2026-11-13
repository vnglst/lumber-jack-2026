'use strict';
// More procedural pixel art: wildlife, and the set for the ending (kept out of sight until then).
(function () {
  const S = LJ.sprites, { mk, cx2, art, outline, both, R, disc, shadow, pts } = LJ.spr;

  // ---------- Wolf ----------
  const WP = { G: '#7d838c', g: '#565b64', w: '#cfd2d8', K: '#1d2026', N: '#0c0c10', d: '#3a3e45', E: '#ffd23a' };
  const WOLF_BODY = [
    '...........K..K...',
    '..........GGGGGg..',
    'g........GGGGEGGg.',
    'gg..GGGGGGGGGGGGGN',
    '.gGGGGGGGGGGGGGww.',
    '.GGGGGGGGGGGGw....',
    '.GGGGGGGGGGGG.....',
    '.GGgGGGGGgGGG.....'];
  const WOLF_LEGS = [
    ['.Gg.gG...Gg.gG....', '.G...G...G...G....', '.d...d...d...d....'],
    ['..gG.Gg...gG.Gg...', '...G..G....G..G...', '...d..d....d..d...']];
  S.wolf = WOLF_LEGS.map(l => both(outline(art(WOLF_BODY.concat(l), WP))));

  // ---------- Bear ----------
  function bear(step) {
    const c = mk(26, 17), x = cx2(c);
    disc(x, 8, 8, 6.5, '#6b4526'); disc(x, 14, 8, 6.2, '#6b4526'); disc(x, 11, 6, 5, '#84582f');
    disc(x, 20, 7, 4.2, '#6b4526'); R(x, 17, 2, 2, 2, '#4a2f1a'); R(x, 21, 2, 2, 2, '#4a2f1a');
    R(x, 22, 8, 3, 2, '#c9a074'); pts(x, [[24, 8]], '#0c0c10'); pts(x, [[21, 6]], '#0c0c10');
    const o = step ? 1 : 0;
    R(x, 3 + o, 12, 3, 5, '#4a2f1a'); R(x, 8 - o, 12, 3, 5, '#5c3a1f'); R(x, 13 + o, 12, 3, 5, '#4a2f1a'); R(x, 17 - o, 12, 3, 5, '#5c3a1f');
    R(x, 5, 12, 12, 1, '#4a2f1a');
    return both(outline(c));
  }
  S.bear = [bear(0), bear(1)];

  // ---------- Gravestone ----------
  S.grave = (function () {
    const c = mk(9, 11), x = cx2(c);
    R(x, 1, 3, 7, 8, '#9a9aa2'); R(x, 2, 1, 5, 2, '#9a9aa2'); R(x, 1, 3, 1, 8, '#c4c4cc'); R(x, 2, 1, 5, 1, '#c4c4cc');
    R(x, 4, 3, 1, 5, '#55555f'); R(x, 3, 4, 3, 1, '#55555f'); R(x, 0, 10, 9, 1, '#5c7a3a');
    return outline(c);
  })();

  // ---------- The ending set ----------
  const DCW = 112, DCH = 76;
  function dcBase(x) {
    shadow(x, 56, 72, 54, 4);
    R(x, 4, 62, 104, 10, '#8f8f96'); R(x, 4, 62, 104, 1, '#b4b4bc'); R(x, 4, 71, 104, 1, '#5d5d66');
  }
  // Stage 1: foundation slab with rebar and pallets.
  S.dcStage1 = (function () {
    const c = mk(DCW, DCH), x = cx2(c);
    dcBase(x);
    for (let i = 0; i < 13; i++) R(x, 8 + i * 8, 54, 1, 8, '#a8532a');
    for (let i = 0; i < 3; i++) R(x, 8, 55 + i * 3, 97, 1, '#c96a36');
    R(x, 14, 46, 14, 8, '#b98148'); R(x, 14, 46, 14, 1, '#e6c88a'); R(x, 84, 48, 12, 6, '#7d7a74'); R(x, 84, 48, 12, 1, '#b4b4bc');
    for (let i = 0; i < 5; i++) { R(x, 40 + i * 6, 50, 2, 4, '#f08a1c'); R(x, 40 + i * 6, 51, 2, 1, '#fff'); }
    return outline(c);
  })();
  // Stage 2: steel skeleton going up.
  S.dcStage2 = (function () {
    const c = mk(DCW, DCH), x = cx2(c);
    dcBase(x);
    for (let i = 0; i < 8; i++) { R(x, 8 + i * 13, 16, 2, 46, '#c96a36'); R(x, 8 + i * 13, 16, 1, 46, '#e88a52'); }
    for (let j = 0; j < 4; j++) R(x, 8, 16 + j * 14, 93, 2, '#a8532a');
    for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) if ((i + j) % 3 === 0) {
      for (let k = 0; k < 11; k++) R(x, 10 + i * 13 + k, 18 + j * 14 + k, 1, 1, '#8a4322');
    }
    R(x, 10, 44, 37, 18, '#c9ccd2'); R(x, 10, 44, 37, 1, '#e8eaee'); for (let i = 1; i < 4; i++) R(x, 10 + i * 9, 44, 1, 18, '#9a9da6');
    R(x, 60, 8, 20, 2, '#f0b820'); R(x, 69, 2, 2, 6, '#44444c');
    return outline(c);
  })();
  // Finished: the data center.
  S.datacenter = (function () {
    const c = mk(DCW, DCH), x = cx2(c);
    dcBase(x);
    R(x, 6, 16, 100, 46, '#c9ccd2'); R(x, 6, 16, 100, 2, '#eef0f4'); R(x, 6, 60, 100, 2, '#8c8f98');
    for (let i = 1; i < 10; i++) R(x, 6 + i * 10, 18, 1, 42, '#a6a9b2');
    R(x, 6, 30, 100, 3, '#1a2a4a');
    for (let i = 0; i < 33; i++) R(x, 8 + i * 3, 31, 1, 1, i % 4 === 1 ? '#7dffb0' : '#3fb8ff');
    R(x, 6, 44, 100, 2, '#1a2a4a'); for (let i = 0; i < 33; i++) R(x, 9 + i * 3, 44, 1, 1, i % 5 === 2 ? '#ff6a5a' : '#3fb8ff');
    // Roof cooling units
    for (let i = 0; i < 5; i++) {
      const bx = 12 + i * 19;
      R(x, bx, 8, 13, 8, '#8c8f98'); R(x, bx, 8, 13, 1, '#b4b7c0'); disc(x, bx + 6.5, 12, 3, '#3a3d46'); disc(x, bx + 6.5, 12, 1, '#b4b7c0');
    }
    R(x, 98, 2, 1, 14, '#55555f'); pts(x, [[98, 1]], '#ff3a3a');
    // Entrance and sign
    R(x, 48, 48, 16, 14, '#22344f'); R(x, 49, 49, 6, 13, '#7fc4f0'); R(x, 57, 49, 6, 13, '#7fc4f0'); R(x, 49, 49, 14, 1, '#bfe6f5');
    R(x, 44, 20, 24, 9, '#101826');
    // "AI" in pixels
    const AI = ['.##..###', '#..#..#.', '####..#.', '#..#..#.', '#..#.###'];
    AI.forEach((row, y) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') R(x, 48 + i * 2, 21 + y * 1.5 | 0, 2, 2, '#58e0ff'); });
    // Fence
    for (let i = 0; i < 27; i++) R(x, 4 + i * 4, 66, 1, 6, '#44444c');
    R(x, 4, 67, 105, 1, '#6a6a74');
    return outline(c);
  })();

  S.crane = (function () {
    const c = mk(64, 84), x = cx2(c);
    shadow(x, 14, 80, 12, 3);
    R(x, 6, 76, 16, 5, '#55555f'); R(x, 6, 76, 16, 1, '#8c8f98');
    for (let y = 12; y < 76; y++) { R(x, 11, y, 1, 1, '#d39a17'); R(x, 16, y, 1, 1, '#f0b820'); }
    for (let y = 12; y < 76; y += 5) { R(x, 11, y, 6, 1, '#f0b820'); for (let k = 0; k < 5; k++) R(x, 12 + k, y + k, 1, 1, '#b8891a'); }
    R(x, 2, 8, 60, 2, '#f0b820'); R(x, 2, 8, 60, 1, '#ffd95a');
    for (let i = 0; i < 12; i++) R(x, 18 + i * 4, 6, 1, 2, '#b8891a');
    for (let k = 0; k < 7; k++) R(x, 14 + k * 6, 2 + k, 6, 1, '#55555f');
    R(x, 12, 0, 4, 9, '#f0b820'); R(x, 10, 11, 8, 6, '#f0b820'); R(x, 11, 12, 4, 3, '#bfe6f5');
    R(x, 2, 10, 6, 5, '#7d7a74');
    R(x, 50, 10, 1, 22, '#22252b'); R(x, 48, 32, 5, 2, '#55555f'); R(x, 45, 34, 11, 7, '#c9ccd2'); R(x, 45, 34, 11, 1, '#eef0f4');
    return outline(c);
  })();

  S.mixer = (function () {
    const c = mk(30, 18), x = cx2(c);
    R(x, 1, 12, 27, 2, '#33333b');
    for (let i = 0; i < 6; i++) R(x, 3 + i * 2, 3 + (i < 3 ? 2 - i : 0), 2, 9 - (i < 3 ? 2 - i : 0), i % 2 ? '#e8eaee' : '#d5392f');
    R(x, 15, 5, 3, 7, '#e8eaee'); R(x, 2, 9, 2, 3, '#8c8f98');
    R(x, 20, 4, 7, 8, '#f0b820'); R(x, 21, 5, 5, 4, '#bfe6f5'); R(x, 20, 4, 7, 1, '#ffd95a');
    disc(x, 6, 15, 3, '#1d1d24'); disc(x, 6, 15, 1.2, '#8c8c96'); disc(x, 13, 15, 3, '#1d1d24'); disc(x, 13, 15, 1.2, '#8c8c96');
    disc(x, 23, 15, 3, '#1d1d24'); disc(x, 23, 15, 1.2, '#8c8c96');
    return both(outline(c));
  })();
})();
