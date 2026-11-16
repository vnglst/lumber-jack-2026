'use strict';
// More procedural pixel art: wildlife, and the set for the ending (kept out of sight until then).
(function () {
  const S = LJ.sprites, { mk, cx2, art, outline, both, R, disc, shadow, pts, box } = LJ.spr;

  // Fur: body pixels catch light along the top edge and get scattered darker tufts.
  function creature(rows, pal, fur, seed) {
    const w = rows[0].length, h = rows.length, c = mk(w, h + 2), x = cx2(c);
    shadow(x, w / 2 + 1, h, w * 0.42, 1.8);
    rows.forEach((r, y) => {
      for (let i = 0; i < r.length; i++) {
        const ch = r[i];
        let col = pal[ch];
        if (!col) continue;
        if (fur[ch]) {
          const above = y > 0 ? rows[y - 1][i] : '.';
          if (above === '.' || !pal[above]) col = fur[ch][1];
          else if (LJ.hash(i, y, seed) < 0.2) col = fur[ch][0];
        }
        x.fillStyle = col; x.fillRect(i, y, 1, 1);
      }
    });
    return both(outline(c));
  }

  // ---------- Wolf ----------
  const WP = { G: '#7d838c', g: '#565b64', l: '#a8adb6', w: '#d4d7dc', K: '#16181d', E: '#ffd23a', N: '#0c0c10' };
  const WOLF_BODY = [
    '.............gG.gG....', '............lGGGGGg...', '............lGGEGGGGgN', 'g...........GGGGGwwwK.',
    'gg..lllGGGGGGGGGGww...', '.gGlGGGGGGGGGGGGGw....', '..GGGGGGGGGGGGGGw.....', '..gGGGGGGGGGGGGgw.....', '..ggGwwwwwwwGGgw......'];
  const WOLF_LEGS = [
    ['..gG.gG.....gG.gG.....', '..g..gG.....g..gG.....', '..g..g......g...g.....', '..K..K......K...K.....'],
    ['...gGgG.....gGgG......', '....gG......gG........', '...g..g....g..g.......', '...K..K....K..K.......']];
  S.wolf = WOLF_LEGS.map((l, i) => creature(WOLF_BODY.concat(l), WP, { G: ['#656a74', '#a8adb6'] }, 31 + i));

  // ---------- Eurasian lynx: tawny and spotted, long-legged, black ear tufts and a short black-tipped tail ----------
  const LP = { T: '#c39a5c', t: '#9a7340', l: '#dcbb82', w: '#efe6d2', s: '#6e4f28', K: '#16181d', E: '#ffd23a', N: '#3a2018' };
  const LYNX_BODY = [
    '..............K..K..', '..............tT.tT.', '.............lTTTTTt', '.............TTETTTN', 'K...........lTTTwww.',
    'tt.lllTTTTTTTTTTww..', '.tTlTTsTTTsTTTTTw...', '..TTTsTTTTTTsTTw....', '..tTTTTTsTTTTTtw....', '..ttTwwwwwwwTTt.....'];
  const LYNX_LEGS = [
    ['..tT.tT....tT.tT....', '..t..tT....t..tT....', '..t..t.....t...t....', '..l..l.....l...l....'],
    ['...tTtT....tTtT.....', '....tT.....tT.......', '...t..t...t..t......', '...l..l...l..l......']];
  S.lynx = LYNX_LEGS.map((l, i) => creature(LYNX_BODY.concat(l), LP, { T: ['#a8824a', '#dcbb82'] }, 71 + i));

  // ---------- Wolverine: low and dark, a pale band along the flank, a bushy tail, pale claws ----------
  const VP = { D: '#4a3424', d: '#2a1d15', s: '#c2a273', m: '#7a5636', K: '#0c0c10', c: '#e8e0d0' };
  const WOLVERINE_BODY = [
    '.dd............dd...', 'dDDd.ssss....dDDDDd.', 'dDDDsDDDDsss.dDKDmmK', '.dDDDDDDDDDDsDDDDmm.', '..DDDDDDDDDDDDDDDd..',
    '..dDDDDDDDDDDDDDd...', '..dDDDsssssssDDd....'];
  const WOLVERINE_LEGS = [
    ['..dDDd.....dDDd.....', '..dDd......dDd......', '..ccc......ccc......'],
    ['...dDDd...dDDd......', '...dDd.....dDd......', '..ccc......ccc......']];
  S.wolverine = WOLVERINE_LEGS.map((l, i) => creature(WOLVERINE_BODY.concat(l), VP, { D: ['#3a281b', '#6b4c33'] }, 83 + i));

  // ---------- Bear ----------
  const BP = { B: '#6b4526', b: '#4a2f1a', l: '#8f6038', m: '#c9a074', K: '#0c0c10', c: '#e8e0d0' };
  const BEAR_BODY = [
    '.....................bb.bb..', '.......llll.........bBBbBBb.', '.....llBBBBll......bBBBBBBB.', '....lBBBBBBBBll...bBBKBBBmm.',
    '...lBBBBBBBBBBBllbBBBBBBmmK.', '..lBBBBBBBBBBBBBBBBBBBBBmb..', '..BBBBBBBBBBBBBBBBBBBBBBb...', '..BBBBBBBBBBBBBBBBBBBBBb....',
    '..bBBBBBBBBBBBBBBBBBBBBb....', '..bBBBBBBBBBBBBBBBBBBBb.....'];
  const BEAR_LEGS = [
    ['...bBBBb.bBBBb.bBBBb.bBBb...', '...bBBBb.bBBBb.bBBBb.bBBb...', '...bBBb..bBBb...bBBb.bBBb...', '...cccc..cccc...cccc.cccc...'],
    ['....bBBBbbBBBb...bBBBbbBBb..', '....bBBb.bBBb....bBBb.bBBb..', '...bBBb...bBBb..bBBb...bBBb.', '...cccc...cccc..cccc...cccc.']];
  S.bear = BEAR_LEGS.map((l, i) => creature(BEAR_BODY.concat(l), BP, { B: ['#563620', '#8f6038'] }, 57 + i));

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

  // ---------- Data-center modules: one per 3x3 tiles, tiled until they cover the whole map ----------
  const DCB = 48; // 3x3 tiles; the ending and renderer read the size from these sprites
  function dcModule(seed) {
    const c = mk(DCB, DCB), x = cx2(c), r = LJ.rng(seed);
    R(x, 0, 0, DCB, DCB, '#b9bdc6');
    for (let i = 0; i < DCB; i += 12) { R(x, i, 0, 1, DCB, '#a4a8b2'); R(x, 0, i, DCB, 1, '#a4a8b2'); }
    for (let i = 0; i < 40; i++) R(x, (r() * DCB) | 0, (r() * DCB) | 0, 1, 1, '#c8ccd4');
    // Parapet: lit top-left edge, shaded bottom-right
    R(x, 0, 0, DCB, 2, '#dfe2e8'); R(x, 0, 0, 2, DCB, '#dfe2e8'); R(x, 0, DCB - 2, DCB, 2, '#80848e'); R(x, DCB - 2, 0, 2, DCB, '#80848e');
    // Rooftop cooling units with fans
    const n = 1 + ((r() * 2) | 0);
    for (let k = 0; k < n; k++) {
      const ax = 5 + ((r() * 22) | 0), ay = 5 + k * 20 + ((r() * 4) | 0);
      R(x, ax + 1, ay + 13, 16, 2, 'rgba(40,44,56,0.35)');
      box(x, ax, ay, 16, 13, '#8c8f98', '#b4b7c0', '#5f636c');
      disc(x, ax + 5, ay + 6.5, 3.5, '#2e313a'); disc(x, ax + 5, ay + 6.5, 1, '#9a9ea8');
      disc(x, ax + 12, ay + 6.5, 2.5, '#2e313a'); R(x, ax + 12, ay + 6, 1, 1, '#9a9ea8');
    }
    // Vents and a cable tray
    for (let k = 0; k < 3; k++) box(x, 34 + (k % 2) * 5, 6 + k * 12, 4, 4, '#9a9ea8', '#c8ccd4', '#6f737c');
    R(x, 2, 44, 44, 1, '#3a3d46');
    return c;
  }
  S.dcBlocks = [dcModule(3), dcModule(17), dcModule(29)];
  // The south wall of a module, shown where it faces open ground. The renderer blinks lights along the dark band.
  S.dcFacade = (function () {
    const c = mk(DCB, 14), x = cx2(c);
    R(x, 0, 0, DCB, 12, '#9a9ea8'); R(x, 0, 0, DCB, 1, '#6f737c');
    for (let i = 0; i < DCB; i += 8) R(x, i, 1, 1, 11, '#878b95');
    R(x, 1, 4, DCB - 2, 4, '#1a2a4a'); R(x, 1, 4, DCB - 2, 1, '#2a3e62');
    R(x, 0, 10, DCB, 2, '#5f636c');
    R(x, 0, 12, DCB, 2, 'rgba(20,24,30,0.35)'); // shadow on the ground in front
    return c;
  })();
  // Under construction: a concrete slab with a steel frame going up.
  S.dcFrame = (function () {
    const c = mk(DCB, DCB), x = cx2(c);
    R(x, 0, 0, DCB, DCB, '#8f8f96'); R(x, 0, 0, DCB, 1, '#a8a8b0');
    for (let i = 2; i < DCB; i += 11) { R(x, i, 0, 2, DCB, '#c96a36'); R(x, 0, i, DCB, 2, '#a8532a'); }
    for (let k = 0; k < 4; k++) for (let j = 0; j < 9; j++) R(x, 4 + k * 11 + j, 4 + k * 11 + j, 1, 1, '#8a4322');
    return c;
  })();
})();
