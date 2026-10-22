// 理不尽ゲーム エンジン
// イベント定義: { t:タイトル, s:本文, time:秒, c:[[選択肢, HP, メンタル, 評価, 結果文, フラグ], ...], to:時間切れ文, ifgf:{彼女がいる場合の差し替え} }
// マイルストーン: { ms:true } → 現在ステージ+1 を目指して評価判定
// フラグ: "gf"=彼女ができる / "nogf"=別れる / "dirty"=不正に手を染める / "whistle"=告発・反抗
(function () {
  const MODES = window.RIFUZIN_MODES;
  const $ = (s) => document.querySelector(s);
  const RATIO = { 4: [0, 0.45, 0.56, 0.66, 0.76], 5: [0, 0.42, 0.50, 0.59, 0.67, 0.75] };
  const CHAOS_RATE = 0.14;

  let st = null;
  let timerId = null;

  function load(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- タイトル ----------
  function renderTitle() {
    stopTimer();
    show('title');
    const seen = load('rifuzin_endings', {});
    const grid = $('#modeGrid');
    grid.innerHTML = '';
    MODES.forEach((m) => {
      const got = Object.keys(seen).filter((k) => k.startsWith(m.id + ':')).length;
      const total = m.goals.length + 2 + (m.extraEndings || 0);
      const b = document.createElement('button');
      b.className = 'mode';
      b.type = 'button';
      b.innerHTML = `<span class="mode-kind">${m.kind}</span>
        <span class="mode-name">${m.name}</span>
        <span class="mode-hint">${m.hint}</span>
        <span class="mode-goal">目標：${m.goals.slice(1).join(' → ')}</span>
        <span class="mode-seen">エンディング ${got}/${total}</span>`;
      b.addEventListener('click', () => startMode(m));
      grid.appendChild(b);
    });
  }

  // ---------- 進行 ----------
  function startMode(m) {
    st = { m, i: -1, hp: 100, mn: 100, ev: 0, max: 0, stage: 0, gf: false, everGf: false, dirty: 0, whistle: 0, log: [] };
    show('game');
    $('#gMode').textContent = m.name;
    renderGoals();
    renderStats();
    showIntro();
  }

  function showIntro() {
    const m = st.m;
    setScene('入学/入社', m.intro, null);
    $('#choices').innerHTML = '';
    $('#timer').hidden = true;
    nextButton('はじまる');
  }

  function nextEvent() {
    st.i++;
    if (st.i >= st.m.events.length) return finish();
    const e = st.m.events[st.i];
    if (e.ms) return milestone(e);
    let ev = e;
    if (e.ifgf && st.gf) ev = Object.assign({}, e, e.ifgf);
    // 彼女がいるとメンタルが少し回復する
    if (st.gf && st.i > 0) { st.mn = clamp(st.mn + 2); renderStats(); }
    showEvent(ev);
  }

  function showEvent(e) {
    setScene(e.t, e.s, e.love ? 'love' : null);
    st.max += Math.max(...e.c.map((c) => c[3]));
    const box = $('#choices');
    box.innerHTML = '';
    const opts = shuffle(e.c);
    opts.forEach((c, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.innerHTML = `<kbd>${idx + 1}</kbd><span>${c[0]}</span>`;
      b.addEventListener('click', () => choose(c));
      box.appendChild(b);
    });
    startTimer(e.time || 8, () => timeout(e));
  }

  function choose(c) {
    stopTimer();
    const b = st.m.bal;
    const [, rawHp, rawMn, ev, res, flag] = c;
    // マイナスは増幅、評価を稼ぐほど期待とノルマがのしかかる
    const hp = hurt(rawHp);
    const mn = hurt(rawMn) - (ev > 0 ? b.press * ev : 0);
    applyFlag(flag);
    apply(hp, mn, ev);
    let extra = null;
    if (Math.random() < CHAOS_RATE) {
      const x = pick(st.m.chaos);
      extra = [x[0], hurt(x[1]), hurt(x[2])];
      apply(extra[1], extra[2], 0);
    }
    showResult(res, { hp, mn, ev }, extra);
  }

  const hurt = (v) => (v < 0 ? Math.round(v * st.m.bal.dmg) : v);

  function timeout(e) {
    const base = pick(st.m.timeouts);
    const hp = -15, mn = -15, ev = -1;
    apply(hp, mn, ev);
    flash();
    showResult(`<b class="late">時間切れ。</b>${e.to || ''}${e.to ? '<br>' : ''}${base}`, { hp, mn, ev }, null, true);
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

  function apply(hp, mn, ev) {
    st.hp = clamp(st.hp + hp);
    st.mn = clamp(st.mn + mn);
    st.ev += ev;
    renderStats();
  }

  function showResult(text, d, extra, late) {
    $('#timer').hidden = true;
    $('#choices').innerHTML = '';
    const r = document.createElement('div');
    r.className = 'result' + (late ? ' is-late' : '');
    r.innerHTML = `<p>${text}</p><div class="deltas">${delta('HP', d.hp)}${delta('メンタル', d.mn)}${delta('評価', d.ev)}</div>`;
    if (extra) {
      r.innerHTML += `<div class="chaos"><span class="stamp">理不尽</span><p>${extra[0]}</p><div class="deltas">${delta('HP', extra[1])}${delta('メンタル', extra[2])}</div></div>`;
    }
    $('#choices').appendChild(r);
    if (st.hp <= 0 || st.mn <= 0) return nextButton('……', gameOver);
    nextButton('次へ');
  }

  function delta(label, v) {
    if (!v) return '';
    const cls = v > 0 ? 'up' : 'down';
    return `<span class="d ${cls}">${label} ${v > 0 ? '+' : ''}${v}</span>`;
  }

  function milestone() {
    const m = st.m;
    const target = st.stage + 1;
    if (target >= m.goals.length) return nextEvent();
    const need = Math.ceil(st.max * (RATIO[m.goals.length - 1][target] + m.bal.shift));
    const info = m.ms[target];
    const ok = st.ev >= need;
    $('#timer').hidden = true;
    if (ok) {
      st.stage = target;
      apply(10, 12, 0);
      renderGoals();
      setScene(info.t, `<span class="stamp big ok">${m.goals[target]}</span><p>${info.ok}</p>`, 'ms');
    } else {
      apply(0, -10, 0);
      setScene(info.t, `<span class="stamp big ng">不合格</span><p>${info.ng}</p><p class="note">評価 ${st.ev} / 必要 ${need}</p>`, 'ms');
    }
    $('#choices').innerHTML = '';
    if (st.mn <= 0) return nextButton('……', gameOver);
    nextButton('次へ');
  }

  function gameOver() {
    stopTimer();
    const m = st.m;
    const byHp = st.hp <= 0;
    const end = byHp ? m.goHP : m.goMN;
    endScreen(byHp ? 'hp' : 'mn', end.t, end.s, true);
  }

  function finish() {
    const m = st.m;
    let key = 's' + st.stage;
    let end = m.endings[st.stage];
    const top = st.stage === m.goals.length - 1;
    if (m.dirtyEnd && st.dirty >= 2 && st.stage >= 2) { key = 'dirty'; end = m.dirtyEnd; }
    else if (m.whistleEnd && st.whistle >= 2) { key = 'whistle'; end = m.whistleEnd; }
    let tail = '';
    if (st.gf) tail = `<p class="gf">${m.gfEnd}</p>`;
    else if (st.everGf) tail = `<p class="gf lost">${m.lostEnd}</p>`;
    endScreen(key, end.t, end.s + tail, false, top && key.startsWith('s'));
  }

  function endScreen(key, t, s, over, best) {
    stopTimer();
    const seen = load('rifuzin_endings', {});
    seen[st.m.id + ':' + key] = 1;
    save('rifuzin_endings', seen);
    show('end');
    $('#endKind').textContent = over ? 'GAME OVER' : best ? 'COMPLETE' : 'ENDING';
    $('#endKind').className = 'end-kind ' + (over ? 'over' : best ? 'best' : '');
    $('#endTitle').textContent = t;
    $('#endText').innerHTML = s;
    $('#endStats').innerHTML = `
      <div><dt>到達</dt><dd>${st.m.goals[st.stage]}</dd></div>
      <div><dt>HP</dt><dd>${st.hp}</dd></div>
      <div><dt>メンタル</dt><dd>${st.mn}</dd></div>
      <div><dt>評価</dt><dd>${st.ev}</dd></div>
      <div><dt>彼女</dt><dd>${st.gf ? 'いる' : st.everGf ? '別れた' : 'いない'}</dd></div>`;
    $('#retry').onclick = () => startMode(st.m);
  }

  // ---------- 描画 ----------
  function show(id) {
    ['title', 'game', 'end'].forEach((k) => ($('#' + k).hidden = k !== id));
    window.scrollTo(0, 0);
  }

  function setScene(t, s, kind) {
    const sc = $('#scene');
    sc.className = 'scene' + (kind ? ' ' + kind : '');
    $('#sTitle').textContent = t;
    $('#sText').innerHTML = s;
    $('#sStep').textContent = st.i < 0 ? '' : `${Math.min(st.i + 1, st.m.events.length)} / ${st.m.events.length}`;
    sc.classList.remove('in');
    void sc.offsetWidth;
    sc.classList.add('in');
  }

  function nextButton(label, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'next';
    b.textContent = label;
    b.addEventListener('click', fn || nextEvent);
    $('#choices').appendChild(b);
    b.focus({ preventScroll: true });
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
    const tm = $('#timer');
    if (tm) tm.classList.remove('hurry');
  }

  function flash() {
    const g = $('#game');
    g.classList.remove('shake');
    void g.offsetWidth;
    g.classList.add('shake');
  }

  document.addEventListener('keydown', (ev) => {
    if ($('#game').hidden) return;
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= 4) {
      const btn = document.querySelectorAll('#choices .choice')[n - 1];
      if (btn) btn.click();
    }
  });

  $('#quit').addEventListener('click', renderTitle);
  $('#back').addEventListener('click', renderTitle);
  renderTitle();
})();
