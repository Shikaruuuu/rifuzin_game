// 理不尽ゲーム エンジン（ノベル形式）
// セリフ: [話者, 本文]  話者 = 'id:表情' / 'id' / ''(そのまま) / '-'(キャラを消す) / 'me'(主人公の心の声)
// 選択イベント: { t, bg, story:[セリフ...], q, time, c:[[選択肢, HP, メンタル, 評価, 結果文, フラグ, 'id:表情'?]], to, ifgf }
// 幕間: { t, bg, story, gain:[HP, メンタル] }（選択肢なし）
// マイルストーン: { ms:true, bg } → 現在ステージ+1 を目指して評価判定
// フラグ: gf=彼女ができる / nogf=別れる / dirty=不正に手を染める / whistle=告発・反抗
(function () {
  const MODES = window.RIFUZIN_MODES;
  const CHAR = window.RIFUZIN_CHAR;
  const BG = window.RIFUZIN_BG;
  const $ = (s) => document.querySelector(s);
  const RATIO = { 4: [0, 0.45, 0.56, 0.66, 0.76], 5: [0, 0.42, 0.50, 0.59, 0.67, 0.75] };
  const CHAOS_RATE = 0.14;
  const TYPE_MS = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 22;

  let st = null;
  let timerId = null;
  // ノベル表示の状態
  const nv = { lines: [], i: 0, done: null, typing: null, full: '', active: false };

  function load(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const hurt = (v) => (v < 0 ? Math.round(v * st.m.bal.dmg) : v);

  // ---------- タイトル ----------
  function renderTitle() {
    stopTimer();
    nv.active = false;
    show('title');
    const seen = load('rifuzin_endings', {});
    const grid = $('#modeGrid');
    grid.innerHTML = '';
    MODES.forEach((m) => {
      const got = Object.keys(seen).filter((k) => k.startsWith(m.id + ':')).length;
      const total = m.goals.length + 2 + (m.dirtyEnd ? 1 : 0) + (m.whistleEnd ? 1 : 0);
      const face = m.chars[m.cover];
      const b = document.createElement('button');
      b.className = 'mode';
      b.type = 'button';
      b.innerHTML = `<span class="mode-face">${CHAR(face.look, face.coverExpr || 'angry')}</span>
        <span class="mode-body">
          <span class="mode-kind">${m.kind}</span>
          <span class="mode-name">${m.name}</span>
          <span class="mode-hint">${m.hint}</span>
          <span class="mode-goal">目標：${m.goals.slice(1).join(' → ')}</span>
          <span class="mode-seen">エンディング ${got}/${total}</span>
        </span>`;
      b.addEventListener('click', () => startMode(m));
      grid.appendChild(b);
    });
  }

  // ---------- 進行 ----------
  function startMode(m) {
    st = { m, i: -1, hp: 100, mn: 100, ev: 0, max: 0, stage: 0, gf: false, everGf: false, dirty: 0, whistle: 0, cast: null, bg: null };
    show('game');
    $('#gMode').textContent = m.name;
    renderGoals();
    renderStats();
    setSprite(null);
    setBg(m.intro.bg);
    setHeading('プロローグ');
    playLines(m.intro.story, nextEvent);
  }

  function nextEvent() {
    stopTimer();
    clearPanel();
    $('#deltas').innerHTML = '';
    st.i++;
    if (st.i >= st.m.events.length) return finish();
    let e = st.m.events[st.i];
    if (e.ms) return milestone(e);
    if (e.ifgf && st.gf) e = Object.assign({}, e, e.ifgf);
    // 彼女がいるとメンタルが少し回復する
    if (st.gf && st.i > 0) { st.mn = clamp(st.mn + 2); renderStats(); }
    setBg(e.bg);
    setHeading(e.t, e.love);
    st.cast = null;
    if (!e.c) {
      return playLines(e.story, () => {
        if (e.gain) apply(e.gain[0], e.gain[1], 0, true);
        nextEvent();
      });
    }
    playLines(e.story, () => showChoices(e));
  }

  function showChoices(e) {
    st.max += Math.max(...e.c.map((c) => c[3]));
    $('#stage').classList.add('dim');
    setLine('', e.q || 'どうする？', true);
    $('#tapHint').hidden = true;
    const panel = $('#panel');
    panel.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'choices';
    shuffle(e.c).forEach((c, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.innerHTML = `<kbd>${idx + 1}</kbd><span>${c[0]}</span>`;
      b.addEventListener('click', () => choose(e, c));
      box.appendChild(b);
    });
    panel.appendChild(box);
    startTimer(e.time || 8, () => timeout(e));
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function choose(e, c) {
    stopTimer();
    clearPanel();
    const b = st.m.bal;
    const [, rawHp, rawMn, ev, res, flag, react] = c;
    // マイナスは増幅、評価を稼ぐほど期待とノルマがのしかかる
    const hp = hurt(rawHp);
    const mn = hurt(rawMn) - (ev > 0 ? b.press * ev : 0);
    applyFlag(flag);
    apply(hp, mn, ev);
    if (flag && /(^| )gf( |$)/.test(flag)) {
      const rid = react && react.split(':')[0];
      st.gfId = rid && st.m.chars[rid] && st.m.chars[rid].look.female ? rid : st.lastFemale;
    }
    // 反応するキャラ
    let who = react || null;
    if (!who && st.cast) {
      let ex;
      if (e.love) ex = flag && flag.includes('nogf') ? 'sad' : flag && flag.includes('gf') ? 'blush' : rawMn > 0 ? 'smile' : 'sad';
      else ex = ev >= 2 ? 'smile' : ev < 0 ? 'angry' : 'normal';
      who = st.cast + ':' + ex;
    }
    const lines = [[who || '', res]];
    showDeltas({ hp, mn, ev });
    let extra = null;
    if (Math.random() < CHAOS_RATE) {
      const x = pick(st.m.chaos);
      extra = [x[0], hurt(x[1]), hurt(x[2])];
    }
    playLines(lines, () => {
      if (extra) return chaos(extra);
      afterResult();
    });
  }

  function chaos(x) {
    apply(x[1], x[2], 0);
    stamp('理不尽', 'ng');
    showDeltas({ hp: x[1], mn: x[2], ev: 0 });
    flash();
    playLines([['', x[0]]], afterResult);
  }

  function afterResult() {
    hideStamp();
    if (st.hp <= 0 || st.mn <= 0) return gameOver();
    nextEvent();
  }

  function timeout(e) {
    clearPanel();
    const hp = -15, mn = -15, ev = -1;
    apply(hp, mn, ev);
    flash();
    stamp('時間切れ', 'ng');
    showDeltas({ hp, mn, ev });
    const who = st.cast ? st.cast + ':shout' : '';
    const lines = [];
    if (e.to) lines.push([who, e.to]);
    lines.push(['', pick(st.m.timeouts)]);
    playLines(lines, afterResult);
  }

  function applyFlag(flag) {
    if (!flag) return;
    flag.split(' ').forEach((f) => {
      if (f === 'gf') { st.gf = true; st.everGf = true; }
      if (f === 'nogf') st.gf = false;
      if (f === 'dirty') st.dirty++;
      if (f === 'whistle') st.whistle++;
    });
  }

  function apply(hp, mn, ev, show) {
    st.hp = clamp(st.hp + hp);
    st.mn = clamp(st.mn + mn);
    st.ev += ev;
    renderStats();
    if (show) showDeltas({ hp, mn, ev });
  }

  function milestone(e) {
    const m = st.m;
    const target = st.stage + 1;
    if (target >= m.goals.length) return nextEvent();
    const need = Math.ceil(st.max * (RATIO[m.goals.length - 1][target] + m.bal.shift));
    const info = m.ms[target];
    const ok = st.ev >= need;
    setBg(info.bg || e.bg || st.bg);
    setHeading(info.t);
    const who = (info.who || m.boss) + (ok ? ':smile' : ':normal');
    if (ok) {
      st.stage = target;
      apply(10, 12, 0, true);
      renderGoals();
      stamp(m.goals[target], 'ok');
    } else {
      apply(0, -10, 0, true);
      stamp('不合格', 'ng');
    }
    const lines = (ok ? info.ok : info.ng).map((l) => (typeof l === 'string' ? ['', l] : l));
    if (!ok) lines.push(['-', `（評価 ${st.ev} ／ 必要 ${need}）`]);
    if (lines[0][0] === '') lines[0] = [who, lines[0][1]];
    playLines(lines, () => {
      hideStamp();
      if (st.mn <= 0) return gameOver();
      nextEvent();
    });
  }

  function gameOver() {
    stopTimer();
    const m = st.m;
    const byHp = st.hp <= 0;
    const end = byHp ? m.goHP : m.goMN;
    endScreen(byHp ? 'hp' : 'mn', end, true);
  }

  function finish() {
    const m = st.m;
    let key = 's' + st.stage;
    let end = m.endings[st.stage];
    const top = st.stage === m.goals.length - 1;
    if (m.dirtyEnd && st.dirty >= 2 && st.stage >= 2) { key = 'dirty'; end = m.dirtyEnd; }
    else if (m.whistleEnd && st.whistle >= 2) { key = 'whistle'; end = m.whistleEnd; }
    endScreen(key, end, false, top && key.startsWith('s'));
  }

  function endScreen(key, end, over, best) {
    stopTimer();
    nv.active = false;
    const m = st.m;
    const seen = load('rifuzin_endings', {});
    seen[m.id + ':' + key] = 1;
    save('rifuzin_endings', seen);
    show('end');
    $('#endArt').innerHTML = BG(end.bg || (over ? 'hospital' : 'ground_dusk'));
    const gfc = m.chars[st.gfId || m.gfChar];
    $('#endSprite').innerHTML = !over && st.gf && gfc ? CHAR(gfc.look, 'blush') : end.who ? CHAR(m.chars[end.who].look, end.whoExpr || 'normal') : '';
    $('#endKind').textContent = over ? 'GAME OVER' : best ? 'COMPLETE' : 'ENDING';
    $('#endKind').className = 'end-kind ' + (over ? 'over' : best ? 'best' : '');
    $('#endTitle').textContent = end.t;
    let tail = '';
    if (!over && st.gf) tail = `<p class="gf">${m.gfEnd}</p>`;
    else if (!over && st.everGf) tail = `<p class="gf lost">${m.lostEnd}</p>`;
    $('#endText').innerHTML = end.s + tail;
    $('#endStats').innerHTML = `
      <div><dt>到達</dt><dd>${m.goals[st.stage]}</dd></div>
      <div><dt>HP</dt><dd>${st.hp}</dd></div>
      <div><dt>メンタル</dt><dd>${st.mn}</dd></div>
      <div><dt>評価</dt><dd>${st.ev}</dd></div>
      <div><dt>彼女</dt><dd>${st.gf ? 'いる' : st.everGf ? '別れた' : 'いない'}</dd></div>`;
    $('#retry').onclick = () => startMode(m);
  }

  // ---------- ノベル表示 ----------
  function playLines(lines, done) {
    nv.lines = lines;
    nv.i = 0;
    nv.done = done;
    nv.active = true;
    $('#stage').classList.remove('dim');
    showLine();
  }

  function showLine() {
    const [who, text] = nv.lines[nv.i];
    let name = '';
    if (who === 'me') name = '俺';
    else if (who === '-') setSprite(null);
    else if (who) {
      const [id, ex] = who.split(':');
      const ch = st.m.chars[id];
      if (ch) {
        if (ch.look.female) st.lastFemale = id;
        setSprite(ch.look, ex || 'normal');
        name = ch.name;
        st.cast = id;
      }
    }
    setLine(name, text, false, who === 'me');
    $('#tapHint').hidden = false;
  }

  function advance() {
    if (!nv.active) return;
    if (nv.typing) { finishTyping(); return; }
    nv.i++;
    if (nv.i < nv.lines.length) return showLine();
    nv.active = false;
    const d = nv.done;
    nv.done = null;
    if (d) d();
  }

  function setLine(name, text, instant, mono) {
    const nm = $('#who');
    nm.textContent = name;
    nm.hidden = !name;
    const el = $('#line');
    el.classList.toggle('mono', !!mono);
    if (nv.typing) clearInterval(nv.typing);
    nv.typing = null;
    nv.full = text;
    if (instant || !TYPE_MS) { el.textContent = text; return; }
    let n = 0;
    el.textContent = '';
    nv.typing = setInterval(() => {
      n += 1;
      el.textContent = text.slice(0, n);
      if (n >= text.length) finishTyping();
    }, TYPE_MS);
  }

  function finishTyping() {
    if (nv.typing) clearInterval(nv.typing);
    nv.typing = null;
    $('#line').textContent = nv.full;
  }

  function setSprite(look, ex) {
    const sp = $('#sprite');
    if (!look) { sp.innerHTML = ''; sp.dataset.key = ''; return; }
    const key = JSON.stringify(look) + ex;
    if (sp.dataset.key === key) return;
    const changed = !sp.dataset.key || sp.dataset.key.split('}')[0] !== key.split('}')[0];
    sp.dataset.key = key;
    sp.innerHTML = CHAR(look, ex);
    if (changed) { sp.classList.remove('enter'); void sp.offsetWidth; sp.classList.add('enter'); }
    if (ex === 'shout' || ex === 'angry') { sp.classList.remove('jolt'); void sp.offsetWidth; sp.classList.add('jolt'); }
  }

  function setBg(key) {
    if (!key || st.bg === key) return;
    st.bg = key;
    $('#bg').innerHTML = BG(key);
  }

  function setHeading(t, love) {
    const h = $('#sTitle');
    h.textContent = t;
    h.classList.toggle('love', !!love);
    const n = st.m.events.length;
    $('#sStep').textContent = st.i < 0 ? '' : `${Math.min(st.i + 1, n)} / ${n}`;
  }

  function clearPanel() { $('#panel').innerHTML = ''; $('#timer').hidden = true; }

  function stamp(text, kind) {
    const s = $('#stamp');
    s.textContent = text;
    s.className = 'stage-stamp ' + kind;
    s.hidden = false;
    s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop');
  }
  function hideStamp() { $('#stamp').hidden = true; }

  function showDeltas(d) {
    const box = $('#deltas');
    box.innerHTML = delta('HP', d.hp) + delta('メンタル', d.mn) + delta('評価', d.ev);
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  }
  function delta(label, v) {
    if (!v) return '';
    return `<span class="d ${v > 0 ? 'up' : 'down'}">${label} ${v > 0 ? '+' : ''}${v}</span>`;
  }

  // ---------- HUD ----------
  function show(id) {
    ['title', 'game', 'end'].forEach((k) => ($('#' + k).hidden = k !== id));
    window.scrollTo(0, 0);
  }

  function renderStats() {
    bar('#hpBar', '#hpVal', st.hp);
    bar('#mnBar', '#mnVal', st.mn);
    $('#evVal').textContent = st.ev;
    $('#gfVal').textContent = st.gf ? 'あり' : 'なし';
    $('#gfVal').className = st.gf ? 'on' : '';
  }

  function bar(b, v, val) {
    const el = $(b);
    el.style.width = val + '%';
    el.classList.toggle('low', val <= 30);
    $(v).textContent = val;
  }

  function renderGoals() {
    const ol = $('#goals');
    ol.innerHTML = '';
    st.m.goals.forEach((g, i) => {
      const li = document.createElement('li');
      li.textContent = g;
      if (i < st.stage) li.className = 'done';
      if (i === st.stage) li.className = 'now';
      ol.appendChild(li);
    });
  }

  function startTimer(sec, onEnd) {
    stopTimer();
    const tm = $('#timer');
    tm.hidden = false;
    const fill = $('#timerFill');
    const num = $('#timerNum');
    const t0 = performance.now();
    const total = sec * 1000;
    const tick = () => {
      const left = Math.max(0, total - (performance.now() - t0));
      fill.style.width = (left / total) * 100 + '%';
      num.textContent = (left / 1000).toFixed(1);
      tm.classList.toggle('hurry', left < 3000);
      if (left <= 0) { stopTimer(); onEnd(); return; }
      timerId = requestAnimationFrame(tick);
    };
    timerId = requestAnimationFrame(tick);
  }

  function stopTimer() {
    if (timerId) cancelAnimationFrame(timerId);
    timerId = null;
    $('#timer').classList.remove('hurry');
  }

  function flash() {
    const g = $('#stage');
    g.classList.remove('shake');
    void g.offsetWidth;
    g.classList.add('shake');
  }

  // ---------- 入力 ----------
  $('#stage').addEventListener('click', advance);
  document.addEventListener('keydown', (ev) => {
    if ($('#game').hidden) return;
    if (ev.key === ' ' || ev.key === 'Enter') {
      if (nv.active) { ev.preventDefault(); advance(); }
      return;
    }
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= 4) {
      const btn = document.querySelectorAll('#panel .choice')[n - 1];
      if (btn) btn.click();
    }
  });
  $('#quit').addEventListener('click', renderTitle);
  $('#back').addEventListener('click', renderTitle);
  renderTitle();
})();
