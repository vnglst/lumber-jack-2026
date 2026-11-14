'use strict';
// Recording booth: record every line the characters say, pick the best take, and it plays in the game.
// Takes live in this browser (IndexedDB) so nothing is lost; "Keep" saves one to audio/voice/ through tools/serve.py.
(function () {
  const $ = id => document.getElementById(id);
  const RATE = 22050, MAX_SECONDS = 20, MAX_TAKES = 12, DEVICE_KEY = 'lj.voice.device';
  const groups = LJ.voiceGroups();
  const items = [];
  groups.forEach(g => g.items.forEach(it => items.push(Object.assign({ group: g }, it))));
  let cur = 0, takes = [];

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function btn(txt, fn, cls, tip) { const b = el('button', cls, txt); b.onclick = fn; if (tip) b.title = tip; return b; }
  let toastT = 0;
  function toast(msg, ms) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2600); }
  const has = key => LJ.voice.has(key);
  const shown = it => (it.cue ? it.cue.label : it.text.replace('{n}', '12,345')); // the game fills in the real tree count
  const getDevice = () => { try { return localStorage.getItem(DEVICE_KEY) || ''; } catch (e) { return ''; } };
  const setDevice = id => { try { localStorage.setItem(DEVICE_KEY, id); } catch (e) { /* ignore */ } };

  // ---------- takes: IndexedDB, with an in-memory fallback if the browser blocks it ----------
  const store = (() => {
    let dbp = null, memId = 1;
    const mem = [];
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('lj-voice', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('takes', { keyPath: 'id', autoIncrement: true }).createIndex('key', 'key');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    }).catch(() => null));
    const run = (db, mode, fn) => new Promise((res, rej) => {
      const t = db.transaction('takes', mode), r = fn(t.objectStore('takes'));
      t.oncomplete = () => res(r.result); t.onerror = () => rej(t.error);
    });
    return {
      async list(key) {
        const db = await open();
        const all = db ? await run(db, 'readonly', s => s.index('key').getAll(key)) : mem.filter(t => t.key === key);
        return all.sort((a, b) => b.t - a.t);
      },
      async put(take) {
        const db = await open();
        if (!db) { if (!take.id) { take.id = memId++; mem.push(take); } return; }
        const id = await run(db, 'readwrite', s => s.put(take));
        if (id != null) take.id = id;
      },
      async del(take) {
        const db = await open();
        if (!db) { const i = mem.indexOf(take); if (i >= 0) mem.splice(i, 1); return; }
        await run(db, 'readwrite', s => s.delete(take.id));
      }
    };
  })();

  // ---------- microphone ----------
  const mic = { stream: null, source: null, analyser: null, raf: 0 };
  let actx = null;
  const audioCtx = () => { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; };

  function closeMic() {
    cancelAnimationFrame(mic.raf);
    if (mic.source) mic.source.disconnect();
    if (mic.stream) for (const t of mic.stream.getTracks()) { t.onended = null; t.stop(); }
    mic.stream = mic.source = mic.analyser = null;
    $('level').style.width = '0';
    $('micBtn').textContent = 'Enable microphone'; $('micBtn').className = 'on';
  }

  async function openMic(deviceId) {
    if (rec) stopRec();
    closeMic();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('This browser cannot record. Try Chrome, Edge, Brave or Safari, on localhost.', 5000); return; }
    const ask = id => navigator.mediaDevices.getUserMedia({ audio: Object.assign({ echoCancellation: false, noiseSuppression: false, autoGainControl: false }, id ? { deviceId: { exact: id } } : {}) });
    let stream;
    try { stream = await ask(deviceId); }
    catch (e) {
      if (deviceId && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) { // the remembered microphone is gone: use the default
        try { stream = await ask(''); toast('That microphone is not available. Using the default one.'); } catch (e2) { e = e2; }
      }
      if (!stream) {
        toast(e.name === 'NotAllowedError' ? 'The browser blocked the microphone. Allow it in the address bar or the site settings, then try again.' : 'Could not open the microphone: ' + (e.message || e.name), 6000);
        return;
      }
    }
    mic.stream = stream;
    const track = stream.getAudioTracks()[0];
    track.onended = () => { closeMic(); refreshDevices(); renderCard(); toast('The microphone was disconnected'); };
    const ctx = audioCtx();
    mic.analyser = ctx.createAnalyser(); mic.analyser.fftSize = 1024;
    mic.source = ctx.createMediaStreamSource(stream);
    mic.source.connect(mic.analyser); // not connected to the speakers, so no feedback
    const buf = new Uint8Array(mic.analyser.fftSize);
    const loop = () => {
      if (!mic.analyser) return;
      mic.analyser.getByteTimeDomainData(buf);
      let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
      $('level').style.width = Math.min(100, Math.sqrt(s / buf.length) * 320) + '%';
      mic.raf = requestAnimationFrame(loop);
    };
    loop();
    const id = track.getSettings().deviceId;
    if (id) setDevice(id);
    $('micBtn').textContent = 'Turn off'; $('micBtn').className = '';
    await refreshDevices(id);
    renderCard();
  }

  // Fill the dropdown. Names only appear after the browser has granted access once.
  async function refreshDevices(active) {
    const sel = $('device');
    let devs = [];
    try { devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput' && d.deviceId); } catch (e) { /* ignore */ }
    const want = active || (mic.stream && mic.stream.getAudioTracks()[0].getSettings().deviceId) || getDevice();
    sel.innerHTML = '';
    if (!devs.length) sel.appendChild(Object.assign(el('option', '', 'Choose a microphone…'), { value: '' }));
    devs.forEach((d, i) => sel.appendChild(Object.assign(el('option', '', d.label || 'Microphone ' + (i + 1)), { value: d.deviceId })));
    if (devs.some(d => d.deviceId === want)) sel.value = want;
  }
  $('device').onchange = e => { if (e.target.value) { setDevice(e.target.value); openMic(e.target.value); } };
  $('micBtn').onclick = () => (mic.stream ? (closeMic(), renderCard()) : openMic(getDevice()));
  if (navigator.mediaDevices) navigator.mediaDevices.addEventListener('devicechange', () => refreshDevices());

  // ---------- recording ----------
  let rec = null, timerT = 0;

  async function startRec() {
    if (rec) return;
    if (!mic.stream) { await openMic(getDevice()); if (!mic.stream) return; }
    if (!window.MediaRecorder) return toast('This browser cannot record audio');
    stopPlayer();
    const chunks = [], mr = new MediaRecorder(mic.stream), r = (rec = { mr, key: items[cur].key, t0: performance.now(), chunks });
    mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = () => finishRec(r);
    mr.start();
    r.limit = setTimeout(stopRec, MAX_SECONDS * 1000);
    timerT = setInterval(() => { const t = $('timer'); if (t) t.textContent = ((performance.now() - r.t0) / 1000).toFixed(1) + ' s'; }, 100);
    renderDeck();
  }

  function stopRec() {
    const r = rec; if (!r) return;
    rec = null; clearTimeout(r.limit); clearInterval(timerT);
    if (r.mr.state !== 'inactive') r.mr.stop();
    renderDeck();
  }

  // Decode, mix to mono at 22 kHz, cut the silence (and the click of the key you pressed), and bring the level up.
  async function process(blob) {
    const dec = await audioCtx().decodeAudioData(await blob.arrayBuffer());
    const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(dec.duration * RATE)), RATE);
    const src = off.createBufferSource(); src.buffer = dec; src.connect(off.destination); src.start();
    const pcm = (await off.startRendering()).getChannelData(0);

    const hop = Math.round(RATE * 0.01), nw = Math.floor(pcm.length / hop), w = new Float32Array(nw);
    let mx = 0;
    for (let i = 0; i < nw; i++) { let s = 0; for (let j = i * hop; j < (i + 1) * hop; j++) s += pcm[j] * pcm[j]; w[i] = Math.sqrt(s / hop); if (w[i] > mx) mx = w[i]; }
    if (mx < 0.004) return null; // silence
    const thr = mx * 0.1, loud = i => w[i] > thr;
    let a = 0, b = nw - 1;
    while (a < nw - 2 && !(loud(a) && loud(a + 1) && loud(a + 2))) a++; // speech is 30 ms of sustained sound; a key click is shorter
    while (b > a + 2 && !(loud(b) && loud(b - 1) && loud(b - 2))) b--;
    if (a >= nw - 2) { a = 0; b = nw - 1; }
    const from = Math.max(0, (a - 8) * hop), to = Math.min(pcm.length, (b + 1 + 18) * hop), n = to - from;

    let peak = 0;
    for (let i = from; i < to; i++) peak = Math.max(peak, Math.abs(pcm[i]));
    const gain = 0.89 / peak, fade = Math.round(RATE * 0.006), data = new Float32Array(n);
    for (let i = 0; i < n; i++) data[i] = pcm[from + i] * gain * Math.min(1, (i + 1) / fade, (n - i) / fade);
    const peaks = [], bucket = Math.ceil(n / 60);
    for (let i = 0; i < n; i += bucket) { let m = 0; for (let j = i; j < Math.min(n, i + bucket); j++) m = Math.max(m, Math.abs(data[j])); peaks.push(Math.round(m * 100) / 100); }
    return { data, peaks };
  }

  async function finishRec(r) {
    let out = null;
    try { out = await process(new Blob(r.chunks, { type: r.mr.mimeType })); } catch (e) { toast('Could not read that recording: ' + e.message, 5000); return; }
    if (!out) return toast("Didn't hear anything. Is the right microphone selected? Watch the level bar while you talk.", 5000);
    const take = { key: r.key, t: Date.now(), ms: Math.round(out.data.length / RATE * 1000), peaks: out.peaks, kept: false,
      wav: LJ.synth.toWav({ getChannelData: () => out.data, sampleRate: RATE }) };
    await store.put(take);
    const all = await store.list(r.key);
    for (const old of all.filter(t => !t.kept).slice(MAX_TAKES)) await store.del(old);
    if (items[cur].key !== r.key) return;
    takes = await store.list(r.key);
    renderCard();
    play(takes[0]);
  }

  // ---------- playback ----------
  let player = null, playerUrl = null;
  function stopPlayer() {
    if (player) { player.pause(); player = null; }
    if (playerUrl) { URL.revokeObjectURL(playerUrl); playerUrl = null; }
  }
  function play(take) { stopPlayer(); playerUrl = URL.createObjectURL(take.wav); player = new Audio(playerUrl); player.play().catch(() => {}); }
  function playSaved(key) { stopPlayer(); player = new Audio('audio/voice/' + key + '.wav?v=' + LJ.voice.manifest()[key] + '&r=' + Date.now()); player.play().catch(() => {}); }

  // ---------- saving into the game ----------
  async function save(url, init, what) {
    let r = null;
    try { r = await fetch(url, init); } catch (e) { /* offline */ }
    if (r && r.ok) return true;
    toast(r && r.status === 501 ? 'The server that is running cannot save. Stop it and run "make" from this project folder.'
      : r && r.status === 403 ? 'Saving only works from the same computer as the server.'
      : 'Could not ' + what + '. Is "make" running from this project folder?', 6000);
    return false;
  }
  async function synced() {
    try { localStorage.setItem(LJ.voice.SAVED_KEY, String(Date.now())); } catch (e) { /* ignore */ } // open game tabs refresh
    await LJ.voice.reload();
    renderSide(); renderProgress();
  }

  async function keep(take, advance) {
    if (!(await save('api/voice/' + take.key, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: take.wav }, 'save the recording'))) return;
    for (const t of takes) if (t.kept && t !== take) { t.kept = false; await store.put(t); }
    take.kept = true; await store.put(take);
    await synced();
    toast('Saved. The game uses this recording now.');
    if (advance) go(nextTodo(cur)); else renderCard();
  }

  async function removeSaved(key) {
    if (!confirm('Remove this recording from the game? Your takes stay here, and you can keep one again.')) return;
    if (!(await save('api/voice/' + key, { method: 'DELETE' }, 'remove the recording'))) return;
    for (const t of takes) if (t.kept) { t.kept = false; await store.put(t); }
    await synced(); renderCard();
  }

  async function dropTake(take) {
    await store.del(take);
    takes = takes.filter(t => t !== take);
    renderCard();
  }

  // ---------- navigation ----------
  const nextTodo = from => {
    for (let k = 1; k <= items.length; k++) { const i = (from + k) % items.length; if (!has(items[i].key)) return i; }
    return Math.min(items.length - 1, from + 1);
  };
  async function go(i) {
    if (i < 0 || i >= items.length) return;
    if (rec) stopRec();
    stopPlayer();
    cur = i;
    takes = await store.list(items[cur].key);
    renderSide(); renderCard();
    const sel = document.querySelector('#side .item.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  // ---------- rendering ----------
  function renderProgress() {
    const done = items.filter(it => has(it.key)).length;
    $('progressTxt').textContent = done + ' of ' + items.length + ' recorded';
    $('progressBar').style.width = (done / items.length * 100) + '%';
  }

  function renderSide() {
    const side = $('side');
    side.innerHTML = '';
    for (const g of groups) {
      const done = g.items.filter(it => has(it.key)).length;
      const h = el('h3', '', g.title + ' ');
      h.appendChild(el('span', 'count', done + '/' + g.items.length));
      side.appendChild(h);
      for (const it of g.items) {
        const i = items.findIndex(x => x.key === it.key), row = el('div', 'item' + (i === cur ? ' sel' : '') + (has(it.key) ? ' done' : ''));
        row.append(el('span', 'mark'), el('span', 'txt', shown(it)));
        row.title = it.cue ? it.cue.hint : shown(it);
        if (has(it.key)) row.appendChild(btn('▶', e => { e.stopPropagation(); playSaved(it.key); }, 'play', 'Hear the recording in the game'));
        row.onclick = () => go(i);
        side.appendChild(row);
      }
    }
  }

  function renderCard() {
    const main = $('main'), it = items[cur], g = it.group;
    main.innerHTML = '';
    const card = el('div', 'card');

    const crumb = el('div', 'crumb');
    crumb.append(el('span', 'chip', g.title), el('span', 'grow'), el('span', '', 'Line ' + (cur + 1) + ' of ' + items.length),
      btn('‹', () => go(cur - 1), 'ghost', 'Previous line (←)'), btn('›', () => go(cur + 1), 'ghost', 'Next line (→)'));
    card.appendChild(crumb);
    card.appendChild(el('div', 'hint', it.cue ? it.cue.hint : g.hint));

    if (!mic.stream) {
      const setup = el('div', 'setup');
      setup.innerHTML = '<b>First, choose your microphone.</b><br>Press “Enable microphone” at the top and allow it in the browser. Then pick the right one from the list and watch the level bar move as you talk.';
      card.appendChild(setup);
    }

    card.appendChild(el('div', 'quote' + (it.cue ? ' cue' : ''), shown(it)));
    if (it.cue) card.appendChild(el('div', 'try', 'Make a sound like: ' + it.cue.try));
    else if (it.text.includes('{n}')) card.appendChild(el('div', 'try', 'The game says a different number each time. Record it with any number, like “twelve thousand”.'));
    else if (it.text.startsWith('*')) card.appendChild(el('div', 'try', 'A sound effect written as text. Make the noise instead of saying the words.'));
    else card.appendChild(el('div', 'try', ''));

    const deck = el('div', 'deck'); deck.id = 'deck';
    card.appendChild(deck);

    const box = el('div', 'takes'); box.id = 'takes';
    card.appendChild(box);
    card.appendChild(el('div', 'keys', 'Keys: R record / stop · Space play latest · Enter keep latest and go on · ← → move between lines'));
    main.appendChild(card);
    renderDeck(); renderTakes();
  }

  function renderDeck() {
    const deck = $('deck'); if (!deck) return;
    deck.innerHTML = '';
    const rb = btn(rec ? '■ Stop' : takes.length ? '● Record again' : '● Record', () => (rec ? stopRec() : startRec()), 'rec ' + (rec ? 'live' : 'gold'), 'Record this line (R)');
    deck.append(rb, Object.assign(el('span', 'timer', rec ? '0.0 s' : ''), { id: 'timer' }), el('span', 'grow'));
    const newest = takes[0];
    if (!rec && newest && !newest.kept) deck.appendChild(btn('✓ Keep & next ↵', () => keep(newest, true), 'gold', 'Save the newest take into the game and go to the next unrecorded line'));
    else if (!rec && has(items[cur].key)) deck.appendChild(btn('Next unrecorded ›', () => go(nextTodo(cur)), '', 'Jump to the next line without a recording'));
  }

  function renderTakes() {
    const box = $('takes'); if (!box) return;
    box.innerHTML = '';
    const key = items[cur].key, savedOnly = has(key) && !takes.some(t => t.kept);
    box.appendChild(el('h4', '', 'Takes'));
    if (savedOnly) {
      const row = el('div', 'take kept');
      row.append(btn('▶', () => playSaved(key), 'ghost', 'Play'), el('span', 'info'), btn('Remove from game', () => removeSaved(key), 'ghost danger'));
      row.querySelector('.info').innerHTML = '<span class="tag">In the game</span> · recorded earlier';
      box.appendChild(row);
    }
    if (!takes.length && !savedOnly) box.appendChild(el('div', 'empty', 'No takes yet. Press Record and say the line.'));
    for (const t of takes) {
      const row = el('div', 'take' + (t.kept ? ' kept' : ''));
      const cv = el('canvas'); cv.width = 300; cv.height = 56; drawPeaks(cv, t.peaks, t.kept);
      const info = el('span', 'info');
      info.innerHTML = (t.kept ? '<span class="tag">In the game</span> · ' : '') + (t.ms / 1000).toFixed(1) + ' s · ' + ago(t.t);
      row.append(btn('▶', () => play(t), 'ghost', 'Play'), cv, info);
      if (t.kept) row.appendChild(btn('Remove from game', () => removeSaved(key), 'ghost danger'));
      else row.append(btn('Use this', () => keep(t, false), '', 'Save this take into the game'), btn('🗑', () => dropTake(t), 'ghost danger', 'Delete this take'));
      box.appendChild(row);
    }
  }

  function drawPeaks(cv, peaks, kept) {
    const g = cv.getContext('2d'), n = peaks.length, bw = cv.width / n;
    g.fillStyle = kept ? '#6fb84a' : '#f6c453';
    peaks.forEach((p, i) => { const h = Math.max(2, p * cv.height); g.fillRect(i * bw + 1, (cv.height - h) / 2, Math.max(1, bw - 2), h); });
  }
  function ago(t) {
    const s = (Date.now() - t) / 1000;
    return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : new Date(t).toLocaleDateString();
  }

  // ---------- keys ----------
  document.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'r') { e.preventDefault(); rec ? stopRec() : startRec(); }
    else if (e.code === 'Space' && tag !== 'BUTTON') { e.preventDefault(); if (takes[0]) play(takes[0]); else if (has(items[cur].key)) playSaved(items[cur].key); }
    else if (e.key === 'Enter' && tag !== 'BUTTON') { if (!rec && takes[0] && !takes[0].kept) keep(takes[0], true); }
    else if (e.key === 'ArrowRight' || k === 'j') go(cur + 1);
    else if (e.key === 'ArrowLeft' || k === 'k') go(cur - 1);
  });

  // ---------- start ----------
  window.addEventListener('storage', e => { if (e.key === LJ.voice.SAVED_KEY) LJ.voice.reload().then(() => { renderSide(); renderProgress(); renderDeck(); renderTakes(); }); });
  (async function init() {
    renderSide(); renderProgress(); renderCard();
    await LJ.voice.reload();
    cur = Math.max(0, items.findIndex(it => !has(it.key))); // start at the first line still to record
    takes = await store.list(items[cur].key);
    renderSide(); renderProgress(); renderCard();
    refreshDevices();
    try { // if the browser already trusts this page with the microphone, open it without a click
      const p = await navigator.permissions.query({ name: 'microphone' });
      if (p.state === 'granted') openMic(getDevice());
    } catch (e) { /* not supported: use the button */ }
  })();
})();
