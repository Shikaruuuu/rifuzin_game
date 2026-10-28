// 学校にテロリスト — ゲーム本体
(function () {
  const M = TG.map, MD = TG.models, AU = TG.audio;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) document.body.classList.add('touch');

  // ===================== 定数 =====================
  const R_PLAYER = 0.28;
  const SPEED = { crouch: 1.35, walk: 2.3, run: 4.3, box: 1.2 };
  const E_SPEED = { walk: 1.7, inv: 2.1, run: 3.7, search: 2.4 };
  const ALERT_TIME = 14, EVASION_TIME = 16;
  const SIGHT_RANGE = 9, SIGHT_FOV = 50 * Math.PI / 180, ALERT_FOV = 68 * Math.PI / 180;
  const NAME = 'ユウト';

  // how の［使］［アクション］は、PCではキー名に置き換えて表示する
  const ITEM_INFO = {
    chalk: { name: 'チョーク', short: '投げて物音で気をそらす', how: '［使］で向いている方へ投げる。落ちた場所で音が鳴り、近くの敵が様子を見に行く。そのすきに通り抜けよう' },
    ext: { name: '消火器', short: '正面の敵を噴射で気絶', how: '［使］で前に噴射。正面4m以内の敵をまとめて気絶させる（3回分）。大きな音が出るので注意' },
    gun: { name: 'ゴム弾ピストル', short: '撃って気絶させる', how: '［使］で撃つ。画面中央の近くにいる敵に自動で狙いが合い、当たると気絶する。銃声で周りの敵が集まってくる' },
    stun: { name: 'スタンガン', short: '［アクション］で正面から気絶', how: '持ちかえて構えている間は、敵の目の前で［アクション］を押すと正面からでも一撃で気絶させられる（5回分）' },
    box: { name: 'ダンボール', short: 'かぶると見つかりにくい', how: '［使］でかぶる／脱ぐ。止まっている間は敵に見つからない。動くと近くの敵に怪しまれる' },
    med: { name: '救急箱', short: 'LIFEを回復', how: '［使］でLIFEを50回復する' },
    tape: { name: 'ガムテープ', how: '気絶して倒れている敵に近づいて［アクション］で縛る。縛った敵は二度と起き上がらない' },
    key: { name: '裏門の鍵', how: '校庭の東にある裏門の前で［アクション］を押すと開く' },
  };
  const keyText = (t) => isTouch ? t : t.replace(/［使］/g, 'Fキー').replace(/［アクション］/g, 'Eキー');
  const EQUIP_ORDER = ['chalk', 'ext', 'gun', 'stun', 'box', 'med'];
  const DROPS = {
    g2a: 'stun', corr: 'gun', g1a: 'tape', g2b: 'ammo', gmus: 'med', gmus2: 'ammo', g3a: 'tape',
    entr: 'ammo', staff: 'ammo', yard: 'tape', gate: 'ammo', back: 'med', east: 'ammo', janitor: 'tape', boss: 'none',
  };

  // ===================== ストーリー =====================
  const OPENING = [
    { t: '――5時間目。数学の授業。' },
    { w: '先生', t: 'じゃあ、この二次方程式を……そうだな、' + NAME + '。' },
    { t: 'ぼんやり窓の外を眺めながら、僕はいつもの妄想をしていた。' },
    { t: '「もし今、この教室にテロリストが入ってきたら――」' },
    { t: 'ガラッ！！！', fx: 'shake' },
    { w: '覆面の男', t: '全員動くな！！ この学校は我々が占拠した！' },
    { t: '悲鳴。倒れる椅子。誰かの筆箱が床に散らばる。' },
    { t: '……嘘だろ。妄想が、現実になった。' },
    { t: '混乱のすきに、僕は教室の一番後ろ、掃除用具ロッカーへ滑り込んだ。' },
  ];
  const STORY = {
    escape: {
      intro: [
        { t: 'ロッカーの隙間から、廊下を行き来する覆面の男たちが見える。……何人いるんだ。' },
        { t: '正門の外では、もうパトカーのサイレンが鳴っている。でも正門は鎖で封鎖されていた。' },
        { t: '……裏門だ。用務員室に、裏門の鍵があったはず。' },
        { t: '誰にも見つからずに学校を抜け出して、警察に中の様子を伝えるんだ。' },
      ],
      ending: [
        { t: '裏門を抜けた瞬間、膝が笑った。それでも走った。' },
        { w: '警察官', t: '君、中の生徒か！？ ケガは！？' },
        { w: NAME, t: '敵は十数人。正門、昇降口、廊下にそれぞれ見張り。リーダーは放送室にいます！' },
        { t: '僕の情報をもとに機動隊が突入し、事件はわずか20分で解決した。' },
        { t: '翌日から、僕は「伝説の帰宅部」と呼ばれるようになった。' },
      ],
    },
    rescue: {
      intro: [
        { w: '覆面の男', t: 'おい、そこの女。こっちに来い。' },
        { w: '白石さん', t: 'や……やだ……っ！' },
        { t: '白石美月さん。クラスで、いや、学校でいちばん……僕がずっと好きだった人。' },
        { w: '覆面の男', t: '音楽室に連れて行け。人質の「目玉」はまとめておけとリーダーの命令だ。' },
        { t: '……今、動けるのは僕だけだ。' },
        { t: '白石さんを助け出して、2人でここから抜け出す。絶対に。' },
      ],
      ending: [
        { t: '裏門の外。パトカーの赤い光の中で、僕たちはやっと足を止めた。' },
        { w: '白石さん', t: '……ありがとう。ずっと、怖かった。' },
        { w: '白石さん', t: '来てくれるって、なんとなく思ってた。……なんでだろうね。' },
        { w: NAME, t: 'あ、あのさ、白石さん。俺、ずっと――' },
        { w: '警察官', t: '君たち！ 無事か！！' },
        { t: '……続きは、また今度。' },
      ],
    },
    suppress: {
      intro: [
        { t: '……逃げるか？ いや。' },
        { t: '何百回も妄想してきた。この日のために。' },
        { t: '奴らを1人ずつ倒して、武器を奪って、捕まったみんなを助ける。' },
        { t: 'そして――この学校を取り戻す。' },
      ],
      ending: [
        { t: '最後のテロリストを縛り上げた。' },
        { t: '放送室のマイクのスイッチを入れる。' },
        { w: NAME, t: '……こちら2年A組。学校は、取り戻しました。' },
        { t: '校舎のあちこちから、歓声が上がった。' },
        { t: '妄想は、ほんの少しだけ現実を超えた。' },
      ],
    },
  };

  // ===================== レンダラ =====================
  const canvas = $('view');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb4c4);
  scene.fog = new THREE.Fog(0x9fb4c4, 22, 60);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 200);
  scene.add(camera);
  scene.add(new THREE.HemisphereLight(0xeef2ff, 0x4a4030, 0.95));
  const sun = new THREE.DirectionalLight(0xfff0d8, 0.75);
  sun.position.set(18, 40, 26);
  scene.add(sun);
  const worldRefs = TG.world.build(scene);
  let dyn = new THREE.Group();
  scene.add(dyn);

  function resize() {
    // 実際に表示されているキャンバスの大きさに合わせる
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 一人称視点。縦長の画面では少し広めに
    camera.fov = w / h < 1 ? 80 : 70;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => { setTimeout(resize, 120); setTimeout(resize, 500); });
  resize();

  // ===================== 当たり判定・視線・経路 =====================
  function collides(x, z, r) {
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), z0 = Math.floor(z - r), z1 = Math.floor(z + r);
    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (!M.solid(cx, cz)) continue;
        const nx = clamp(x, cx, cx + 1), nz = clamp(z, cz, cz + 1);
        if ((x - nx) * (x - nx) + (z - nz) * (z - nz) < r * r) return true;
      }
    }
    return false;
  }
  function moveBy(e, dx, dz, r) {
    if (!collides(e.x + dx, e.z, r)) e.x += dx;
    if (!collides(e.x, e.z + dz, r)) e.z += dz;
  }
  function los(x0, z0, x1, z1, lowBlocks) {
    const dx = x1 - x0, dz = z1 - z0, d = Math.hypot(dx, dz);
    const n = Math.ceil(d / 0.2);
    let lx = -1, lz = -1;
    const sx = Math.floor(x0), sz = Math.floor(z0), tx = Math.floor(x1), tz = Math.floor(z1);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const cx = Math.floor(x0 + dx * t), cz = Math.floor(z0 + dz * t);
      if (cx === lx && cz === lz) continue;
      lx = cx; lz = cz;
      if ((cx === sx && cz === sz) || (cx === tx && cz === tz)) continue;
      if (M.sight(cx, cz)) return false;
      if (lowBlocks && M.low(cx, cz)) return false;
    }
    return true;
  }

  // A*（8方向、角のすり抜けなし）
  const NW = M.W, NH = M.H, NN = NW * NH;
  const gS = new Float32Array(NN), came = new Int32Array(NN), stamp = new Uint32Array(NN), closed = new Uint32Array(NN);
  let curStamp = 0;
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  function nearestFree(x, z) {
    if (!M.solid(x, z)) return [x, z];
    for (let r = 1; r <= 3; r++) {
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (!M.solid(x + dx, z + dz)) return [x + dx, z + dz];
      }
    }
    return null;
  }
  function findPath(fx, fz, tx, tz) {
    const s = nearestFree(Math.floor(fx), Math.floor(fz));
    const t = nearestFree(Math.floor(tx), Math.floor(tz));
    if (!s || !t) return null;
    curStamp++;
    const si = s[1] * NW + s[0], ti = t[1] * NW + t[0];
    const heap = [];
    const h = (i) => { const x = i % NW, z = (i / NW) | 0; const dx = Math.abs(x - t[0]), dz = Math.abs(z - t[1]); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    const push = (i, f) => {
      heap.push([f, i]);
      let k = heap.length - 1;
      while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = k * 2 + 1, r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]]; k = m;
        }
      }
      return top;
    };
    stamp[si] = curStamp; gS[si] = 0; came[si] = -1;
    push(si, h(si));
    let found = false, iter = 0;
    while (heap.length && iter++ < 4000) {
      const [, i] = pop();
      if (closed[i] === curStamp) continue;
      closed[i] = curStamp;
      if (i === ti) { found = true; break; }
      const x = i % NW, z = (i / NW) | 0;
      for (const [dx, dz, c] of DIRS) {
        const nx = x + dx, nz = z + dz;
        if (M.solid(nx, nz)) continue;
        if (dx && dz && (M.solid(x + dx, z) || M.solid(x, z + dz))) continue;
        const ni = nz * NW + nx;
        if (closed[ni] === curStamp) continue;
        const g = gS[i] + c;
        if (stamp[ni] !== curStamp || g < gS[ni]) {
          stamp[ni] = curStamp; gS[ni] = g; came[ni] = i;
          push(ni, g + h(ni));
        }
      }
    }
    if (!found) return null;
    const out = [];
    for (let i = ti; i !== si && i !== -1; i = came[i]) out.push({ x: (i % NW) + 0.5, z: ((i / NW) | 0) + 0.5 });
    out.reverse();
    return out;
  }

  // ===================== 状態 =====================
  let G = null; // 1プレイ分の状態
  let P = null; // プレイヤー
  let screen = 'title';

  function newGame(modeId) {
    scene.remove(dyn);
    dyn = new THREE.Group();
    scene.add(dyn);
    const cfg = TG.MODES[modeId];
    G = {
      mode: modeId, cfg, time: 0, phase: 'sneak', alertT: 0, evaT: 0, lastKnown: null,
      stats: { alerts: 0, downs: 0, ties: 0, freed: 0, damage: 0 },
      enemies: [], items: [], hostages: [], followers: [], fx: [], noises: [],
      girl: null, girlFreed: false, freedRooms: new Set(), anySee: false, objKey: '', gateMsgT: 0,
      hint: { left: false, cqc: false, seen: false }, cleared: false, flags: {}, seenItems: new Set(Object.keys(cfg.start.inv)),
    };
    // プレイヤー（肩越し視点のときだけ体を描く）
    const pm = MD.player();
    const boxM = MD.cardboard();
    boxM.visible = false;
    pm.group.add(boxM);
    dyn.add(pm.group);
    P = {
      model: pm, boxM, camDist: 2.4, camOver: 0,
      x: TG.PLAYER_START.x, z: TG.PLAYER_START.z, a: Math.PI / 2, pitch: 0, eye: 1.45, bobT: 0, hp: 100, crouch: false, hidden: null, inBox: false,
      inv: Object.assign({ chalk: 0, ext: 0, gun: 0, stun: 0, box: 0, med: 0, tape: 0, key: 0 }, cfg.start.inv),
      equip: 'chalk', moving: false, running: false, actT: 0, noiseT: 0, regenT: 0, trail: [], stepT: 0, hurtT: 0,
    };
    // 開始時はロッカーの中
    const L0 = M.lockers.find((l) => l.x === TG.PLAYER_START.locker.x && l.z === TG.PLAYER_START.locker.z);
    enterLocker(L0, true);

    // 敵
    cfg.enemies.forEach((id) => {
      const def = TG.ENEMIES[id];
      const route = def.route.map((r) => ({ x: r[0] + 0.5, z: r[1] + 0.5, wait: r[2] || 0, looks: r.slice(3) }));
      const model = MD.terrorist(!!def.boss);
      dyn.add(model.group);
      const mark = MD.label('!', '#ff3b30');
      mark.visible = false;
      dyn.add(mark);
      const cone = makeCone();
      dyn.add(cone);
      const e = {
        id, def, route, boss: !!def.boss, room: def.room, x: route[0].x, z: route[0].z, a: route[0].looks[0] !== undefined ? route[0].looks[0] : 0,
        wp: 0, atWp: true, waitT: route[0].wait, state: 'patrol', path: null, pathI: 0, goal: null, susp: 0, hp: def.boss ? 3 : 3,
        model, mark, markT: 0, markText: '', cone, downT: 0, shootT: 1, reactT: 0, stun: 0, repathT: 0, stuckT: 0, lookT: 0,
        seenBodies: new Set(), bodyT: Math.random() * 0.3, seeP: 0, moving: false, moveSpeed: 0, tieT: 0, grabT: 0, drop: DROPS[id] || 'none',
      };
      G.enemies.push(e);
    });

    // アイテム
    cfg.items.forEach((it) => spawnItem(it.type, it.x, it.z, it.n));

    // 人質
    Object.entries(cfg.hostages).forEach(([roomId, n]) => {
      const r = M.rooms.find((q) => q.id === roomId);
      if (!r || !n) return;
      TG.hostageSpots(r.x0, n).forEach((p, i) => {
        const m = MD.student(i + r.x0);
        m.group.position.set(p.x, 0, p.z);
        m.group.rotation.y = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        MD.pose(m, 'sit', false, 0);
        dyn.add(m.group);
        G.hostages.push({ x: p.x, z: p.z, room: roomId, model: m, freed: false });
      });
    });

    // 白石さん
    if (cfg.girl) {
      const m = MD.girl();
      m.group.position.set(cfg.girl.x, 0, cfg.girl.z);
      m.group.rotation.y = Math.PI;
      MD.pose(m, 'sit', false, 0);
      dyn.add(m.group);
      const heart = MD.label('♥', '#ff7aa8', 72, 0.7);
      heart.position.set(cfg.girl.x, 1.6, cfg.girl.z);
      dyn.add(heart);
      G.girl = { x: cfg.girl.x, z: cfg.girl.z, a: Math.PI, model: m, heart, freed: false, crouch: false, grabT: 0, moving: false, kind: 'girl' };
    }

    worldRefs.backGate.visible = true;
    // 目的地のビーコン
    beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
    beacon.position.y = 1.3;
    beacon.visible = false;
    dyn.add(beacon);
    G.guide = null; G.guideT = 0;
    look.yaw = look.pitch = 0;
    setViewItem();
    AU.bgm('sneak');
    updateHUD(true);
  }

  function spawnItem(type, x, z, n) {
    const m = MD.item(type);
    m.position.set(x, 0.05, z);
    dyn.add(m);
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.36, 24), new THREE.MeshBasicMaterial({ color: type === 'key' ? 0xffd34d : 0x9ff0ff, transparent: true, opacity: 0.7, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, 0.04, z);
    dyn.add(glow);
    G.items.push({ type, x, z, n: n || 1, model: m, glow, taken: false });
  }

  // ===================== 視界の扇形 =====================
  const CONE_RAYS = 18;
  function makeCone() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((CONE_RAYS + 2) * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const idx = [];
    for (let i = 1; i <= CONE_RAYS; i++) idx.push(0, i, i + 1);
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.17, depthWrite: false, side: THREE.DoubleSide }));
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    return mesh;
  }
  function enemyRange(e) {
    return (e.boss ? SIGHT_RANGE + 1 : SIGHT_RANGE) * (G.phase === 'alert' ? 1.3 : 1);
  }
  function enemyFov(e) { return G.phase === 'alert' || e.state === 'alert' ? ALERT_FOV : SIGHT_FOV; }
  function updateCone(e) {
    const active = e.state !== 'down' && e.state !== 'tied';
    e.cone.visible = active;
    if (!active) return;
    const pos = e.cone.geometry.attributes.position.array;
    const range = enemyRange(e), fov = enemyFov(e);
    pos[0] = e.x; pos[1] = 0.05; pos[2] = e.z;
    for (let i = 0; i <= CONE_RAYS; i++) {
      const ang = e.a - fov + (2 * fov * i) / CONE_RAYS;
      const dx = Math.sin(ang), dz = Math.cos(ang);
      let d = 0.3;
      while (d < range) {
        const cx = Math.floor(e.x + dx * d), cz = Math.floor(e.z + dz * d);
        if (M.sight(cx, cz)) break;
        d += 0.25;
      }
      d = Math.min(d, range);
      const k = (i + 1) * 3;
      pos[k] = e.x + dx * d; pos[k + 1] = 0.05; pos[k + 2] = e.z + dz * d;
    }
    e.cone.geometry.attributes.position.needsUpdate = true;
    const c = e.state === 'alert' ? 0xff3b30 : (e.state === 'investigate' || e.susp > 0.25 ? 0xffa53a : 0xfff27a);
    e.cone.material.color.setHex(c);
    e.cone.material.opacity = e.state === 'alert' ? 0.22 : 0.16;
  }

  // ===================== 演出 =====================
  function showMark(e, text, color, t) {
    if (e.markText !== text) { MD.setLabel(e.mark, text, color); e.markText = text; }
    e.mark.visible = true;
    e.markT = t || 1.6;
  }
  function noiseRing(x, z, r) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.08, z);
    dyn.add(m);
    G.fx.push({ m, t: 0, life: 0.6, kind: 'ring', r });
  }
  function tracer(x0, z0, x1, z1, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, 1.2, z0), new THREE.Vector3(x1, 1.1, z1)]);
    const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color || 0xfff3a0, transparent: true }));
    dyn.add(m);
    G.fx.push({ m, t: 0, life: 0.12, kind: 'line' });
  }
  function puff(x, z, a) {
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }));
      const sp = (Math.random() - 0.5) * 0.9;
      const v = 3 + Math.random() * 3;
      m.position.set(x + Math.sin(a) * 0.5, 1.0, z + Math.cos(a) * 0.5);
      dyn.add(m);
      G.fx.push({ m, t: 0, life: 0.8, kind: 'puff', vx: Math.sin(a + sp) * v, vz: Math.cos(a + sp) * v });
    }
  }
  function updateFx(dt) {
    for (let i = G.fx.length - 1; i >= 0; i--) {
      const f = G.fx[i];
      f.t += dt;
      const k = f.t / f.life;
      if (f.kind === 'ring') { const s = f.r * k; f.m.scale.set(s, s, s); f.m.material.opacity = 0.5 * (1 - k); }
      else if (f.kind === 'line') f.m.material.opacity = 1 - k;
      else if (f.kind === 'puff') { f.m.position.x += f.vx * dt; f.m.position.z += f.vz * dt; f.vx *= 0.92; f.vz *= 0.92; f.m.scale.setScalar(1 + k * 2); f.m.material.opacity = 0.7 * (1 - k); }
      else if (f.kind === 'proj') updateProjectile(f, dt);
      if ((f.kind !== 'proj' && k >= 1) || f.done) {
        dyn.remove(f.m);
        G.fx.splice(i, 1);
      }
    }
  }

  // 投げたチョーク
  function throwChalk() {
    const a = P.a;
    const dx = Math.sin(a), dz = Math.cos(a);
    let d = 0.6;
    while (d < 8) {
      const nx = P.x + dx * (d + 0.25), nz = P.z + dz * (d + 0.25);
      if (M.solid(Math.floor(nx), Math.floor(nz)) && !M.low(Math.floor(nx), Math.floor(nz))) break;
      d += 0.25;
    }
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dyn.add(m);
    G.fx.push({ m, kind: 'proj', t: 0, life: 0.2 + d * 0.06, x0: P.x, z0: P.z, x1: P.x + dx * d, z1: P.z + dz * d, done: false, life0: 0 });
    AU.sfx.throw_();
  }
  function updateProjectile(f, dt) {
    const k = Math.min(1, f.t / f.life);
    const x = f.x0 + (f.x1 - f.x0) * k, z = f.z0 + (f.z1 - f.z0) * k;
    f.m.position.set(x, 1.2 + Math.sin(k * Math.PI) * 1.2 - k * 1.1, z);
    f.m.rotation.x += dt * 20;
    // 敵の頭に当たった？
    for (const e of G.enemies) {
      if (e.state === 'down' || e.state === 'tied') continue;
      if (Math.hypot(e.x - x, e.z - z) < 0.45 && k > 0.15) {
        AU.sfx.clack();
        e.susp = Math.max(e.susp, 0.6);
        investigate(e, P.x, P.z, true);
        f.done = true;
        return;
      }
    }
    if (k >= 1) {
      AU.sfx.clack();
      makeNoise(x, z, 6.5, 'chalk');
      f.done = true;
    }
  }

  // ===================== 音 =====================
  function makeNoise(x, z, r, kind) {
    noiseRing(x, z, r);
    for (const e of G.enemies) {
      if (e.state === 'down' || e.state === 'tied' || e.state === 'alert') continue;
      if (Math.hypot(e.x - x, e.z - z) <= r) investigate(e, x, z, kind === 'chalk');
    }
  }

  // ===================== 敵AI =====================
  function setPath(e, x, z) {
    e.path = findPath(e.x, e.z, x, z);
    e.pathI = 0;
    e.goal = { x, z };
    e.stuckT = 0;
  }
  function turnTo(e, target, maxStep) {
    const d = angDiff(e.a, target);
    e.a += clamp(d, -maxStep, maxStep);
  }
  function follow(e, speed, dt) {
    if (!e.path) return true;
    while (e.pathI < e.path.length) {
      const last = e.pathI === e.path.length - 1;
      const p = last ? e.goal : e.path[e.pathI];
      const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz);
      if (d < (last ? 0.15 : 0.35)) { e.pathI++; continue; }
      const st = Math.min(d, speed * dt);
      const bx = e.x, bz = e.z;
      moveBy(e, (dx / d) * st, (dz / d) * st, 0.28);
      turnTo(e, Math.atan2(dx, dz), dt * 9);
      e.moving = true; e.moveSpeed = speed;
      if (Math.hypot(e.x - bx, e.z - bz) < st * 0.3) {
        e.stuckT += dt;
        if (e.stuckT > 0.7) { e.stuckT = 0; e.pathI++; }
      } else e.stuckT = 0;
      return false;
    }
    e.path = null;
    return true;
  }
  const isActive = (e) => e.state !== 'down' && e.state !== 'tied';

  function investigate(e, x, z, loud) {
    if (!isActive(e) || e.state === 'alert') return;
    const fresh = e.state !== 'investigate';
    e.state = 'investigate';
    e.invPos = { x, z };
    e.lookT = 0;
    e.reactT = fresh ? 0.6 : 0;
    setPath(e, x, z);
    showMark(e, '?', '#ffd23f', 2.2);
    if (fresh && dist(e, P) < 16) AU.sfx.huh();
    if (loud) e.susp = Math.max(e.susp, 0.4);
  }

  function spotted(e, target) {
    G.lastKnown = { x: target.x, z: target.z };
    G.alertT = ALERT_TIME;
    if (G.phase !== 'alert') {
      G.phase = 'alert';
      G.stats.alerts++;
      AU.sfx.alert();
      AU.bgm('alert');
      flash('alert');
      if (!G.hint.seen) { G.hint.seen = true; say('', '見つかった！ 敵の視界から外れて身を隠せ！'); }
    }
    showMark(e, '!', '#ff3b30', 1.8);
    e.reactT = 0.7;
    for (const o of G.enemies) {
      if (!isActive(o)) continue;
      if (o.state !== 'alert') { o.state = 'alert'; o.path = null; o.repathT = 0; if (o !== e) o.reactT = 0.3 + Math.random() * 0.5; }
    }
  }

  // 見えているか。戻り値 0〜1（近いほど大きい）
  function sees(e, tx, tz, mul, low) {
    if (mul <= 0) return 0;
    const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz);
    const range = enemyRange(e) * mul;
    if (d > Math.max(range, mul > 0 ? 1.1 : 0)) return 0;
    if (d > 1.1) {
      const fx = Math.sin(e.a), fz = Math.cos(e.a);
      if ((dx * fx + dz * fz) / d < Math.cos(enemyFov(e))) return 0;
    }
    if (!los(e.x, e.z, tx, tz, low && d > 1.8)) return 0;
    return 1 - (d / Math.max(range, 1)) * 0.75;
  }
  function playerVisMul() {
    if (P.hidden) return 0;
    if (P.inBox) return P.moving ? 0.38 : 0;
    let m = P.crouch ? 0.55 : 1;
    if (P.running) m *= 1.1;
    return m;
  }

  function wakeUp(e) {
    e.state = 'patrol';
    e.hp = e.boss ? Math.max(1, e.hp) : 3;
    e.stun = 0;
    e.atWp = false; e.path = null;
    investigate(e, e.x + Math.sin(e.a), e.z + Math.cos(e.a));
    e.susp = 0.5;
    if (dist(e, P) < 20) say('', '気絶させていた敵が目を覚ました！');
  }

  function knockDown(e, t, how) {
    if (!isActive(e)) return;
    if (e.boss) {
      e.hp -= 1;
      if (e.hp > 0) {
        AU.sfx.hit();
        showMark(e, '!!', '#ff3b30', 1);
        e.reactT = 1.0;
        if (e.state !== 'alert') spotted(e, P);
        say('リーダー', ['小僧……やるじゃないか。', 'その程度か？ 中学生！'][e.hp % 2]);
        return;
      }
    }
    e.state = 'down';
    e.downT = t;
    e.path = null;
    e.susp = 0;
    e.mark.visible = false;
    G.stats.downs++;
    AU.sfx.takedown();
    if (e.boss) say('リーダー', 'ば……馬鹿な……中学生ごときに……');
    makeNoise(e.x, e.z, 2.2, 'thud');
    if (G.mode === 'suppress' && !G.hint.tie) { G.hint.tie = true; say('', '倒れた敵はガムテープで縛れ。縛らないと目を覚ます！'); }
  }

  function tieUp(e, byAlly) {
    e.state = 'tied';
    e.downT = 0;
    e.mark.visible = false;
    G.stats.ties++;
    AU.sfx.pickup();
    if (e.drop && e.drop !== 'none') {
      const t = e.drop === 'ammo' ? 'gun' : e.drop;
      spawnItem(t, e.x + 0.6, e.z + 0.3, t === 'gun' ? (e.drop === 'ammo' ? 4 : 6) : (t === 'tape' ? 2 : 1));
      e.drop = 'none';
    }
    toast(byAlly ? '仲間がテロリストを縛り上げた！' : 'テロリストを縛り上げた！');
  }

  function enemyShoot(e, target) {
    e.shootT = (e.boss ? 0.6 : 1.05) + Math.random() * 0.5;
    const d = dist(e, target);
    let p = clamp(0.8 - d * 0.045, 0.22, 0.78);
    if (P.crouch) p *= 0.75;
    const hit = Math.random() < p;
    const mx = e.x + Math.sin(e.a) * 0.5, mz = e.z + Math.cos(e.a) * 0.5;
    if (hit) tracer(mx, mz, target.x, target.z);
    else tracer(mx, mz, target.x + (Math.random() - 0.5) * 2.2, target.z + (Math.random() - 0.5) * 2.2);
    AU.sfx.shot();
    if (hit) damage(e.boss ? 11 : 8);
  }

  function damage(n) {
    if (G.cleared || screen !== 'play') return;
    P.hp -= n;
    G.stats.damage += n;
    P.regenT = 6;
    P.hurtT = 0.25;
    AU.sfx.hit();
    flash('hurt');
    if (P.hp <= 0) { P.hp = 0; gameOver('dead'); }
  }

  function updateEnemy(e, dt) {
    e.moving = false;
    if (e.markT > 0) { e.markT -= dt; if (e.markT <= 0 && e.state !== 'down') e.mark.visible = false; }

    if (e.state === 'tied') return;
    if (e.state === 'down') {
      e.downT -= dt;
      if (e.downT < 6 && e.downT > 0) showMark(e, 'Zz', '#bfe3ff', 0.2);
      else showMark(e, '★', '#ffe14d', 0.2);
      if (e.downT <= 0) wakeUp(e);
      return;
    }

    // ---- 知覚 ----
    let target = null, best = 0;
    const vp = sees(e, P.x, P.z, playerVisMul(), P.crouch || P.inBox);
    if (vp > 0) { target = P; best = vp; }
    for (const f of G.followers) {
      const v = sees(e, f.x, f.z, f.crouch ? 0.5 : 0.85, f.crouch);
      if (v > best) { best = v; target = f; }
    }
    e.seeP = target === P ? vp : 0;
    // 箱の中で動かなければ、すぐ隣でも無視される（ただし警戒中に目の前なら見破られる）
    if (P.inBox && !P.moving && G.phase === 'alert' && dist(e, P) < 1.0 && !P.hidden) { target = P; best = 1; }

    if (target) {
      G.anySee = true;
      if (G.phase === 'alert' || e.state === 'alert') {
        if (e.state !== 'alert') spotted(e, target);
        G.lastKnown = { x: target.x, z: target.z };
        G.alertT = ALERT_TIME;
      } else {
        e.susp += dt * (0.8 + 3.4 * best) * (G.phase === 'evasion' ? 2.5 : 1);
        if (e.susp >= 1) spotted(e, target);
        else if (e.susp > 0.3 && e.state !== 'investigate') investigate(e, target.x, target.z);
        else if (e.state === 'investigate' && e.susp > 0.3) { e.invPos = { x: target.x, z: target.z }; if ((e.repathT -= dt) <= 0) { e.repathT = 0.6; setPath(e, target.x, target.z); } }
      }
    } else {
      e.susp = Math.max(0, e.susp - dt * 0.22);
    }

    // 倒れた仲間に気づく
    e.bodyT -= dt;
    if (e.bodyT <= 0 && e.state !== 'alert') {
      e.bodyT = 0.35;
      for (const o of G.enemies) {
        if (o === e || isActive(o) || e.seenBodies.has(o.id)) continue;
        if (sees(e, o.x, o.z, 0.85, false) > 0) {
          e.seenBodies.add(o.id);
          investigate(e, o.x, o.z);
          e.bodyTarget = o;
          showMark(e, '!?', '#ffa53a', 2);
          break;
        }
      }
    }

    if (e.reactT > 0) {
      e.reactT -= dt;
      if (target) turnTo(e, Math.atan2(target.x - e.x, target.z - e.z), dt * 6);
      return;
    }

    // ---- 行動 ----
    if (e.state === 'alert') {
      if (G.phase !== 'alert') { e.state = 'search'; e.path = null; return; }
      const tgt = target || null;
      if (tgt) {
        const d = dist(e, tgt);
        turnTo(e, Math.atan2(tgt.x - e.x, tgt.z - e.z), dt * 8);
        if (d > 5.5) {
          e.repathT -= dt;
          if (e.repathT <= 0 || !e.path) { e.repathT = 0.5; setPath(e, tgt.x, tgt.z); }
          follow(e, E_SPEED.run, dt);
          turnTo(e, Math.atan2(tgt.x - e.x, tgt.z - e.z), dt * 8);
        }
        e.shootT -= dt;
        if (d < 1.1 && tgt === P) {
          if (e.shootT <= 0) { e.shootT = 1.1; AU.sfx.punch(); damage(9); }
        } else if (e.shootT <= 0 && tgt === P && d < 13) enemyShoot(e, P);
      } else {
        // 最後に見た位置へ
        const lk = G.lastKnown;
        e.repathT -= dt;
        if (!e.path && lk && (e.repathT <= 0)) { e.repathT = 0.6; setPath(e, lk.x, lk.z); }
        const arrived = follow(e, E_SPEED.run, dt);
        if (arrived) e.a += dt * 2.4;
        // ロッカーに入るところを見られていたら、引きずり出される
        if (P.hidden && P.hidden.compromised && dist(e, P) < 1.6) {
          exitLocker(true);
          say('覆面の男', 'ここに隠れてたのか、ガキが！');
          damage(12);
          spotted(e, P);
        }
      }
      // 白石さんを捕まえる
      if (G.girl && G.girlFreed && dist(e, G.girl) < 1.0) G.girl.grabT += dt;
      return;
    }

    if (e.state === 'search') {
      if (G.phase === 'sneak') { e.state = 'return'; e.path = null; return; }
      if (!e.path) {
        if (e.lookT > 0) { e.lookT -= dt; e.a += dt * 1.8; return; }
        const lk = G.lastKnown || e;
        for (let k = 0; k < 8; k++) {
          const x = Math.floor(lk.x + (Math.random() - 0.5) * 12), z = Math.floor(lk.z + (Math.random() - 0.5) * 12);
          if (!M.solid(x, z)) { setPath(e, x + 0.5, z + 0.5); break; }
        }
      }
      if (follow(e, E_SPEED.search, dt)) e.lookT = 1.5 + Math.random() * 1.5;
      return;
    }

    if (e.state === 'investigate') {
      if (!e.path && e.lookT <= 0 && e.invPos && dist(e, e.invPos) > 0.6) setPath(e, e.invPos.x, e.invPos.z);
      const arrived = follow(e, E_SPEED.inv, dt);
      if (arrived) {
        if (e.bodyTarget) {
          const b = e.bodyTarget;
          e.bodyTarget = null;
          if (b.state === 'down') { b.downT = 0; wakeUp(b); say('覆面の男', 'おい、しっかりしろ！ 誰にやられた！'); }
          else if (b.state === 'tied') say('覆面の男', '縛られてる……！？ 侵入者がいるぞ……');
        }
        e.lookT += dt;
        e.a += dt * 1.6 * (e.id.length % 2 ? 1 : -1);
        if (e.lookT > 3.5) { e.state = 'return'; e.path = null; e.lookT = 0; e.mark.visible = false; }
      }
      return;
    }

    if (e.state === 'return') {
      const wp = e.route[e.wp];
      if (!e.path) setPath(e, wp.x, wp.z);
      if (follow(e, E_SPEED.walk, dt)) { e.state = 'patrol'; e.atWp = true; e.waitT = wp.wait; }
      return;
    }

    // patrol
    const wp = e.route[e.wp];
    if (e.atWp) {
      e.waitT -= dt;
      if (wp.looks.length) {
        const prog = wp.wait > 0 ? 1 - Math.max(0, e.waitT) / wp.wait : 1;
        const k = Math.min(wp.looks.length - 1, Math.floor(prog * wp.looks.length));
        turnTo(e, wp.looks[k], dt * 2.2);
      }
      if (e.waitT <= 0) {
        if (e.route.length > 1) { e.atWp = false; e.wp = (e.wp + 1) % e.route.length; e.path = null; }
        else e.waitT = wp.wait;
      }
    } else {
      if (!e.path) setPath(e, wp.x, wp.z);
      if (follow(e, E_SPEED.walk, dt)) { e.atWp = true; e.waitT = wp.wait; }
    }
  }

  // ===================== プレイヤー =====================
  function enterLocker(l, silent) {
    P.hidden = l;
    P.inBox = false;
    P.crouch = false;
    l.compromised = false;
    if (!silent && G.phase === 'alert') {
      for (const e of G.enemies) if (isActive(e) && sees(e, P.x, P.z, 1, false) > 0) l.compromised = true;
    }
    if (!silent) AU.sfx.door();
    P.a = l.face;
    P.pitch = 0;
  }
  function exitLocker(forced) {
    const l = P.hidden;
    P.hidden = null;
    // ロッカーの正面に出る
    const fx = l.x + 0.5 + Math.sin(l.face) * 1.0, fz = l.z + 0.5 + Math.cos(l.face) * 1.0;
    if (!collides(fx, fz, R_PLAYER)) { P.x = fx; P.z = fz; }
    P.a = l.face;
    if (!forced) AU.sfx.door();
  }

  // いま「アクション」で何ができるか
  function contextAction() {
    if (!G || screen !== 'play') return null;
    if (P.hidden) return { label: 'ロッカーから出る', fn: () => exitLocker(false) };
    // 白石さん
    const g = G.girl;
    if (g && !g.freed && dist(P, g) < 1.4) return { label: '白石さんを助ける', fn: freeGirl };
    // 敵
    let near = null, nd = 1.35;
    for (const e of G.enemies) {
      if (!isActive(e)) continue;
      const d = dist(P, e);
      if (d < nd) {
        const ang = Math.atan2(e.x - P.x, e.z - P.z);
        if (Math.abs(angDiff(P.a, ang)) < 1.2) { near = e; nd = d; }
      }
    }
    if (near && !P.inBox) {
      const back = isBehind(near);
      if (back || (P.equip === 'stun' && P.inv.stun > 0)) return { label: back ? '背後から絞め落とす' : 'スタンガン！', fn: () => takedown(near, back) };
      return { label: '殴る', fn: () => punch(near) };
    }
    // 倒れた敵
    for (const e of G.enemies) {
      if (e.state === 'down' && dist(P, e) < 1.5) {
        if (P.inv.tape > 0) return { label: '縛る（ガムテ残' + P.inv.tape + '）', fn: () => { P.inv.tape--; tieUp(e); P.actT = 0.6; } };
        return { label: '縛る（ガムテが無い）', fn: () => toast('ガムテープが無いと縛れない！'), dim: true };
      }
    }
    // 人質（鎮圧モード）
    if (G.mode === 'suppress') {
      for (const h of G.hostages) {
        if (h.freed || dist(P, h) > 1.5) continue;
        return { label: '仲間を解放する', fn: () => freeRoom(h.room) };
      }
    } else {
      for (const h of G.hostages) {
        if (dist(P, h) < 1.3) return { label: '話しかける', fn: () => say('クラスメイト', ['……っ！ ' + NAME + '！？ 逃げろ、早く！', 'し、静かに！ 見つかるよ！', '外に……警察を……！'][Math.floor(Math.random() * 3)]) };
      }
    }
    // ロッカー
    if (!P.inBox) {
      for (const l of M.lockers) {
        const lx = l.x + 0.5 + Math.sin(l.face) * 0.9, lz = l.z + 0.5 + Math.cos(l.face) * 0.9;
        if (Math.hypot(P.x - lx, P.z - lz) < 0.8) return { label: 'ロッカーに隠れる', fn: () => enterLocker(l) };
      }
    }
    // 裏門
    if (Math.hypot(P.x - TG.BACKGATE.x, P.z - TG.BACKGATE.z) < 2.2 && G.mode !== 'suppress') {
      return { label: P.inv.key ? '裏門を開ける' : '裏門（鍵がかかっている）', fn: tryGate };
    }
    if (P.inBox) return { label: 'ダンボールを脱ぐ', fn: () => { P.inBox = false; } };
    return null;
  }

  function isBehind(e) {
    if (e.state === 'alert' && e.seeP > 0) return false;
    const fx = Math.sin(e.a), fz = Math.cos(e.a);
    const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 1;
    const cos = (dx * fx + dz * fz) / d;
    return cos < -0.15 || (e.seeP === 0 && e.state !== 'alert');
  }
  function takedown(e, back) {
    P.actT = 0.5;
    P.a = Math.atan2(e.x - P.x, e.z - P.z);
    if (!back) { P.inv.stun--; AU.sfx.zap(); if (P.inv.stun <= 0) toast('スタンガンの電池が切れた'); }
    knockDown(e, e.boss ? 25 : 55, 'cqc');
    if (!G.hint.cqc) { G.hint.cqc = true; }
  }
  function punch(e) {
    P.actT = 0.35;
    AU.sfx.punch();
    e.hp -= 1;
    showMark(e, '!', '#ff3b30', 0.8);
    if (e.hp <= 0 && !e.boss) { knockDown(e, 40, 'punch'); return; }
    if (e.boss && e.hp <= 0) { e.hp = 1; knockDown(e, 30); return; }
    e.reactT = 0.4;
    spotted(e, P);
  }
  function freeGirl() {
    const g = G.girl;
    g.freed = true;
    G.girlFreed = true;
    g.heart.visible = false;
    G.followers.unshift(g);
    AU.sfx.free();
    G.stats.freed++;
    sayQueue([
      ['白石さん', '……' + NAME + 'くん！？ どうしてここに……'],
      [NAME, '助けに来た。俺についてきて。しゃがんだら一緒にしゃがんで'],
      ['白石さん', '……うん。信じてる'],
    ]);
  }
  function freeRoom(roomId) {
    const guards = G.enemies.filter((e) => e.room === roomId && isActive(e));
    if (guards.length) { toast('見張りがいる！ 先に見張りを倒せ'); return; }
    const list = G.hostages.filter((h) => h.room === roomId && !h.freed);
    list.forEach((h) => {
      h.freed = true;
      G.stats.freed++;
      if (G.followers.length < 8) {
        G.followers.push({ x: h.x, z: h.z, a: 0, model: h.model, crouch: false, moving: false, kind: 'ally', atkT: Math.random(), tieT: 0 });
      } else {
        h.model.group.visible = false;
      }
    });
    G.freedRooms.add(roomId);
    AU.sfx.free();
    const r = M.rooms.find((q) => q.id === roomId);
    toast(r.name + 'のみんなが仲間になった！（+' + list.length + '人）');
    const lines = { '2a': [['クラスメイト', NAME + '！？ お前、すげえな……！ 俺たちも戦う！']], '1a': [['1年生', '先輩……！ ついていきます！']], '3a': [['3年生', '2年に助けられるとはな。借りは返す']], '2b': [['2年B組', '隣のクラスの……！ よし、反撃だ！']], music: [['音楽の先生', 'あなた……！ 先生たちも手伝います！']] };
    if (lines[roomId]) sayQueue(lines[roomId]);
  }
  function tryGate() {
    if (!P.inv.key) {
      say(NAME, '鍵がかかってる……用務員室に鍵があったはずだ');
      return;
    }
    if (G.mode === 'rescue' && (!G.girlFreed || dist(P, G.girl) > 4)) {
      say(NAME, G.girlFreed ? '白石さんがまだ来てない……！' : '白石さんを置いていけるか！');
      return;
    }
    worldRefs.backGate.visible = false;
    clear();
  }

  function useItem() {
    const it = P.equip;
    if (!it || !P.inv[it]) { toast('アイテムを持っていない'); return; }
    if (P.hidden) return;
    if (it === 'chalk') {
      P.inv.chalk--; P.actT = 0.3; throwChalk();
    } else if (it === 'ext') {
      P.inv.ext--; P.actT = 0.5;
      AU.sfx.spray();
      puff(P.x, P.z, P.a);
      for (const e of G.enemies) {
        if (!isActive(e)) continue;
        const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
        if (d > 4.2) continue;
        if ((dx * Math.sin(P.a) + dz * Math.cos(P.a)) / d < 0.72) continue;
        if (!los(P.x, P.z, e.x, e.z, false)) continue;
        knockDown(e, 22, 'ext');
      }
      makeNoise(P.x, P.z, 6, 'spray');
    } else if (it === 'gun') {
      P.inv.gun--; P.actT = 0.25;
      // ゆるい自動照準
      let tgt = null, bd = 15;
      for (const e of G.enemies) {
        if (!isActive(e)) continue;
        const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
        if (d > bd) continue;
        if ((dx * Math.sin(P.a) + dz * Math.cos(P.a)) / d < 0.86) continue;
        if (!los(P.x, P.z, e.x, e.z, false)) continue;
        tgt = e; bd = d;
      }
      AU.sfx.shot();
      if (tgt) { P.a = Math.atan2(tgt.x - P.x, tgt.z - P.z); tracer(P.x, P.z, tgt.x, tgt.z, 0x9ff0ff); knockDown(tgt, 35, 'gun'); }
      else tracer(P.x, P.z, P.x + Math.sin(P.a) * 10, P.z + Math.cos(P.a) * 10, 0x9ff0ff);
      makeNoise(P.x, P.z, 9, 'gun');
    } else if (it === 'stun') {
      const c = contextAction();
      if (c && (c.label === 'スタンガン！' || c.label === '背後から絞め落とす')) { c.fn(); return; }
      AU.sfx.zap(); toast('スタンガンは敵の目の前で使え');
    } else if (it === 'box') {
      P.inBox = !P.inBox;
      P.crouch = false;
      AU.sfx.door();
      if (P.inBox && !G.flags.boxHint) { G.flags.boxHint = true; say(NAME, '……ダンボール。なぜだか、すごく落ち着く'); }
    } else if (it === 'med') {
      if (P.hp >= 100) { toast('LIFEは満タンだ'); return; }
      P.inv.med--; P.hp = Math.min(100, P.hp + 50); AU.sfx.free(); toast('LIFEが回復した');
    }
    if (!P.inv[it] && it !== 'box') cycleEquip(1, true);
  }
  function cycleEquip(dir, silent) {
    const owned = EQUIP_ORDER.filter((k) => P.inv[k] > 0);
    if (!owned.length) { P.equip = null; updateHUD(true); return; }
    let i = owned.indexOf(P.equip);
    i = i < 0 ? 0 : (i + dir + owned.length) % owned.length;
    if (P.equip === 'box' && owned[i] !== 'box') P.inBox = false;
    P.equip = owned[i];
    if (!silent) AU.sfx.text();
    updateHUD(true);
  }

  function pickupItems() {
    for (const it of G.items) {
      if (it.taken || Math.hypot(it.x - P.x, it.z - P.z) > 0.85 || P.hidden) continue;
      it.taken = true;
      dyn.remove(it.model); dyn.remove(it.glow);
      AU.sfx.pickup();
      let msg = '';
      if (it.type === 'chalk') { P.inv.chalk += it.n; msg = 'チョーク ×' + it.n; }
      else if (it.type === 'ext') { P.inv.ext += 3; msg = '消火器（3回分）'; }
      else if (it.type === 'med') { P.inv.med += 1; msg = '救急箱'; }
      else if (it.type === 'key') { P.inv.key = 1; msg = '裏門の鍵'; say(NAME, 'あった、裏門の鍵だ！'); }
      else if (it.type === 'box') { P.inv.box = 1; msg = 'ダンボール'; }
      else if (it.type === 'tape') { P.inv.tape += it.n; msg = 'ガムテープ ×' + it.n; }
      else if (it.type === 'stun') { P.inv.stun += 5; msg = 'スタンガン（5回分）'; }
      else if (it.type === 'gun') { const first = !P.inv.gun; P.inv.gun += it.n; msg = first ? 'ゴム弾ピストル（' + it.n + '発）' : 'ゴム弾 ×' + it.n; }
      // 初めて手に入れた道具は、すぐ使えるように持ちかえて使い方を出す
      const first = !G.seenItems.has(it.type);
      G.seenItems.add(it.type);
      if (EQUIP_ORDER.includes(it.type) && (first || !P.equip || !P.inv[P.equip])) {
        if (P.equip === 'box' && it.type !== 'box') P.inBox = false;
        P.equip = it.type;
      }
      if (first && ITEM_INFO[it.type]) showItemCard(it.type, msg);
      else toast('入手：' + msg);
      updateHUD(true);
    }
  }

  function updatePlayer(dt) {
    const inp = readInput();
    P.moving = false; P.running = false;
    if (P.actT > 0) P.actT -= dt;
    if (P.hurtT > 0) P.hurtT -= dt;

    if (inp.crouch) {
      if (P.inBox) P.inBox = false;
      else if (!P.hidden) P.crouch = !P.crouch;
    }
    if (inp.switchEq) cycleEquip(1);
    if (inp.action) { const c = contextAction(); if (c) c.fn(); }
    if (inp.use) useItem();

    // 視点
    P.a += look.yaw - inp.turn * 2.4 * dt;
    P.pitch = clamp(P.pitch + look.pitch, -0.75, 0.6);
    look.yaw = look.pitch = 0;
    if (P.hidden) {
      // ロッカーの隙間から見える範囲だけ
      P.a = P.hidden.face + clamp(angDiff(P.hidden.face, P.a), -0.7, 0.7);
      P.pitch = clamp(P.pitch, -0.3, 0.2);
      regen(dt);
      return;
    }

    const mag = Math.min(1, Math.hypot(inp.x, inp.z));
    if (mag > 0.12 && P.actT <= 0) {
      let speed;
      if (P.inBox) speed = SPEED.box;
      else if (P.crouch) speed = SPEED.crouch;
      else if (inp.walk || mag < 0.8) speed = SPEED.walk * Math.max(0.55, mag / 0.8);
      else { speed = SPEED.run; P.running = true; }
      // 視線の向きを基準に、前後左右へ
      const ix = inp.x / mag, iz = inp.z / mag;
      const ca = Math.cos(P.a), sa = Math.sin(P.a);
      const dx = (-ca * ix - sa * iz) * speed * dt, dz = (sa * ix - ca * iz) * speed * dt;
      const bx = P.x, bz = P.z;
      moveBy(P, dx, dz, R_PLAYER);
      P.moving = Math.hypot(P.x - bx, P.z - bz) > speed * dt * 0.2;
      if (P.moving) P.bobT += dt * (P.running ? 13 : P.crouch || P.inBox ? 6 : 9);
    }
    // 敵とぶつからない
    for (const e of G.enemies) {
      const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz);
      if (d < 0.55 && d > 0.001) {
        const push = (0.55 - d);
        moveBy(P, (dx / d) * push, (dz / d) * push, R_PLAYER);
      }
    }
    // 走ると足音
    if (P.running && P.moving) {
      P.noiseT -= dt;
      if (P.noiseT <= 0) { P.noiseT = 0.45; makeNoise(P.x, P.z, 3.6, 'step'); AU.sfx.step(); }
    }
    // 足跡（ついてくる仲間用）
    const last = P.trail[P.trail.length - 1];
    if (!last || Math.hypot(last.x - P.x, last.z - P.z) > 0.25) {
      P.trail.push({ x: P.x, z: P.z });
      if (P.trail.length > 240) P.trail.shift();
    }
    pickupItems();
    regen(dt);
    if (!G.hint.left && M.roomAt(P.x, P.z).id !== '2a') {
      G.hint.left = true;
      say('', '床の黄色い扇形が敵の視界。画面の黄色いマーカーが目的地。背後から近づけばアクションで気絶させられる');
    }
  }
  function regen(dt) {
    if (P.regenT > 0) { P.regenT -= dt; return; }
    if (G.phase === 'sneak' && P.hp < 100) P.hp = Math.min(100, P.hp + dt * 1.2);
  }

  // ついてくる仲間（白石さん／解放した生徒）
  function updateFollowers(dt) {
    const tr = P.trail;
    G.followers.forEach((f, i) => {
      f.moving = false;
      const idx = tr.length - 1 - (i + 1) * 4;
      const tp = tr[Math.max(0, idx)] || P;
      const dx = tp.x - f.x, dz = tp.z - f.z, d = Math.hypot(dx, dz);
      const pd = dist(f, P);
      if (d > 0.3 && pd > 0.9) {
        const sp = Math.min(SPEED.run * 1.05, Math.max(SPEED.walk, d * 2.2));
        const bx = f.x, bz = f.z;
        moveBy(f, (dx / d) * Math.min(d, sp * dt), (dz / d) * Math.min(d, sp * dt), 0.24);
        f.moving = Math.hypot(f.x - bx, f.z - bz) > 0.001;
        f.a += angDiff(f.a, Math.atan2(dx, dz)) * Math.min(1, dt * 10);
        if (pd > 14) { f.x = tp.x; f.z = tp.z; }
      }
      f.crouch = P.crouch || P.inBox || !!P.hidden;
      // 仲間の攻撃（警戒中のみ）と、縛り上げ
      if (f.kind === 'ally') {
        f.atkT -= dt;
        if (f.atkT <= 0) {
          f.atkT = 1.3 + Math.random() * 0.6;
          let tgt = null, bd = 8;
          for (const e of G.enemies) {
            if (e.state !== 'alert') continue;
            const ed = dist(f, e);
            if (ed < bd && los(f.x, f.z, e.x, e.z, false)) { tgt = e; bd = ed; }
          }
          if (tgt) {
            tracer(f.x, f.z, tgt.x, tgt.z, 0xffffff);
            AU.sfx.clack();
            tgt.stun += tgt.boss ? 0.09 : 0.2;
            if (tgt.stun >= 1) { tgt.stun = 0; knockDown(tgt, 35, 'ally'); }
          }
        }
        for (const e of G.enemies) {
          if (e.state !== 'down' || dist(f, e) > 3.5) continue;
          e.tieT += dt;
          if (e.tieT > 1.6) { e.tieT = 0; tieUp(e, true); }
          break;
        }
      }
    });
    // 白石さんが捕まった
    if (G.girl && G.girlFreed && G.girl.grabT > 1.4) gameOver('girl');
    if (G.girl && G.girlFreed && G.phase !== 'alert') G.girl.grabT = Math.max(0, G.girl.grabT - dt);
  }

  // ===================== フェーズ =====================
  function updatePhase(dt) {
    if (G.phase === 'alert') {
      if (!G.anySee) G.alertT -= dt;
      if (G.alertT <= 0) {
        G.phase = 'evasion';
        G.evaT = EVASION_TIME;
        AU.bgm('evasion');
        for (const e of G.enemies) if (e.state === 'alert') { e.state = 'search'; e.path = null; e.lookT = 0; showMark(e, '?', '#ffd23f', 1.5); }
      }
    } else if (G.phase === 'evasion') {
      G.evaT -= dt;
      if (G.evaT <= 0) {
        G.phase = 'sneak';
        AU.bgm('sneak');
        for (const e of G.enemies) if (e.state === 'search') { e.state = 'return'; e.path = null; }
        toast('警戒が解けた');
      }
    }
    G.anySee = false;
  }

  function checkWin() {
    if (G.mode === 'suppress') {
      if (G.enemies.every((e) => e.state === 'tied')) clear();
      return;
    }
    // 裏門に近づくと案内
    if (Math.hypot(P.x - TG.BACKGATE.x, P.z - TG.BACKGATE.z) < 2.2 && !P.inv.key) {
      G.gateMsgT -= 1 / 60;
      if (G.gateMsgT <= 0) { G.gateMsgT = 6; say(NAME, '裏門……鍵がかかってる。用務員室に鍵があったはずだ'); }
    }
  }

  const DOOR_2A = { x: 24, z: 14.2 };
  const KEY_POS = { x: 48.5, z: 22.5 };
  function objective() {
    const m = G.mode;
    const out2a = G.hint.left;
    if (m === 'escape') {
      if (P.hidden && !out2a) return { text: 'ロッカーの隙間から見張りを観察し、背を向けたら外に出ろ', pos: DOOR_2A, label: '出口' };
      if (!out2a) return { text: '教室の後ろのドアから廊下へ出ろ', pos: DOOR_2A, label: '後ろのドア' };
      if (!P.inv.key) return { text: '用務員室（廊下の南側・東寄り）で裏門の鍵を手に入れろ', pos: KEY_POS, label: '裏門の鍵' };
      return { text: '東の非常口から外へ出て、校庭の東にある裏門から脱出しろ', pos: TG.BACKGATE, label: '裏門' };
    }
    if (m === 'rescue') {
      if (!G.girlFreed) {
        if (!out2a) return { text: '教室の後ろのドアから廊下へ出て、音楽室へ向かえ', pos: DOOR_2A, label: '後ろのドア' };
        return { text: '音楽室（廊下の北側・東寄り）に捕まった白石さんを助け出せ', pos: G.girl, label: '白石さん' };
      }
      if (!P.inv.key) return { text: '白石さんを連れて、用務員室（廊下の南側）で裏門の鍵を探せ', pos: KEY_POS, label: '裏門の鍵' };
      return { text: '白石さんと一緒に、校庭の東にある裏門から脱出しろ', pos: TG.BACKGATE, label: '裏門' };
    }
    const left = G.enemies.filter((e) => e.state !== 'tied').length;
    const text = 'テロリストを全員縛り上げろ（残り' + left + '人）';
    // 倒れている敵 → 解放できる仲間 → 一番近い敵 の順に案内
    let best = null, bd = 1e9;
    for (const e of G.enemies) if (e.state === 'down' && dist(P, e) < bd) { best = { pos: e, label: '縛る' }; bd = dist(P, e); }
    if (!best) {
      for (const h of G.hostages) {
        if (h.freed || G.enemies.some((e) => e.room === h.room && isActive(e))) continue;
        if (dist(P, h) < bd) { best = { pos: h, label: '仲間を解放' }; bd = dist(P, h); }
      }
    }
    if (!best) for (const e of G.enemies) if (isActive(e) && dist(P, e) < bd) { best = { pos: e, label: e.boss ? 'リーダー' : 'テロリスト' }; bd = dist(P, e); }
    return { text: text + '　仲間を解放すると一緒に戦ってくれる', pos: best ? best.pos : null, label: best ? best.label : '' };
  }

  // ===================== 入力 =====================
  const keys = {};
  const pressed = { action: false, use: false, crouch: false, switchEq: false };
  const stick = { id: null, x: 0, z: 0, ox: 0, oy: 0 };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) { if (screen === 'play' && e.code.startsWith('Arrow')) e.preventDefault(); return; }
    keys[e.code] = true;
    if (screen === 'cine' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) { e.preventDefault(); cineNext(); return; }
    if (screen === 'play') {
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') pressed.action = true;
      if (e.code === 'KeyF' || e.code === 'KeyJ') pressed.use = true;
      if (e.code === 'KeyC' || e.code === 'ControlLeft') pressed.crouch = true;
      if (e.code === 'KeyQ' || e.code === 'Tab') pressed.switchEq = true;
      if (e.code === 'Escape' || e.code === 'KeyP') pause(true);
      if (e.code === 'KeyV') setView(viewMode === 'tps' ? 'fps' : 'tps');
      if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
    } else if (screen === 'pause' && (e.code === 'Escape' || e.code === 'KeyP')) pause(false);
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (screen === 'play') pause(true); });

  function readInput() {
    let x = 0, z = 0, turn = 0;
    if (keys.KeyA) x -= 1;
    if (keys.KeyD) x += 1;
    if (keys.KeyW || keys.ArrowUp) z -= 1;
    if (keys.KeyS || keys.ArrowDown) z += 1;
    if (keys.ArrowLeft) turn -= 1;
    if (keys.ArrowRight) turn += 1;
    let walk = !!(keys.ShiftLeft || keys.ShiftRight);
    if (stick.id !== null) { x = stick.x; z = stick.z; walk = false; }
    else if (x || z) { const m = Math.hypot(x, z); x /= m; z /= m; }
    const out = { x, z, turn, walk, action: pressed.action, use: pressed.use, crouch: pressed.crouch, switchEq: pressed.switchEq };
    pressed.action = pressed.use = pressed.crouch = pressed.switchEq = false;
    return out;
  }

  // タッチ操作：十字キー（押した位置で8方向）と「走る」切りかえ
  const dpad = $('dpad');
  const dirEls = { up: dpad.querySelector('.up'), down: dpad.querySelector('.down'), left: dpad.querySelector('.left'), right: dpad.querySelector('.right') };
  let runOn = false;
  function dpadAt(e) {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    let x = 0, z = 0;
    if (d > 14) {
      // 斜めも取れるように、軸から約22度以内なら真っすぐ、それ以外は斜め
      const ax = Math.abs(dx) / d, az = Math.abs(dy) / d;
      if (ax > 0.38) x = Math.sign(dx);
      if (az > 0.38) z = Math.sign(dy);
    }
    const m = Math.hypot(x, z) || 1;
    const k = runOn ? 1 : 0.75;
    stick.x = (x / m) * k; stick.z = (z / m) * k;
    dirEls.up.classList.toggle('on', z < 0); dirEls.down.classList.toggle('on', z > 0);
    dirEls.left.classList.toggle('on', x < 0); dirEls.right.classList.toggle('on', x > 0);
  }
  dpad.addEventListener('pointerdown', (e) => {
    if (stick.id !== null) return;
    e.preventDefault();
    stick.id = e.pointerId;
    try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* 取れなくても動く */ }
    dpadAt(e);
  });
  dpad.addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) dpadAt(e); });
  const endPad = (e) => {
    if (e.pointerId !== stick.id) return;
    stick.id = null; stick.x = stick.z = 0;
    Object.values(dirEls).forEach((el) => el.classList.remove('on'));
  };
  dpad.addEventListener('pointerup', endPad);
  dpad.addEventListener('pointercancel', endPad);
  const runBtn = $('btnRun');
  runBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    runOn = !runOn;
    runBtn.classList.toggle('on', runOn);
    runBtn.setAttribute('aria-pressed', String(runOn));
    runBtn.innerHTML = '走る<br>' + (runOn ? 'ON' : 'OFF');
    if (stick.id !== null) { const m = Math.hypot(stick.x, stick.z) || 1; stick.x = (stick.x / m) * (runOn ? 1 : 0.75); stick.z = (stick.z / m) * (runOn ? 1 : 0.75); }
    if (runOn) toast('走ると足音で気づかれやすくなる');
  });

  // 視点操作：マウス（クリックでポインタロック）／画面右側のドラッグ
  const look = { yaw: 0, pitch: 0 };
  const MOUSE_SENS = 0.0024, TOUCH_SENS = 0.0058;
  let mouseDrag = false, wasLocked = false;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || screen !== 'play') return;
    mouseDrag = true;
    if (canvas.requestPointerLock && document.pointerLockElement !== canvas) {
      try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) { /* 使えなければドラッグで操作 */ }
    }
  });
  window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') mouseDrag = false; });
  window.addEventListener('mousemove', (e) => {
    if (screen !== 'play') return;
    if (document.pointerLockElement === canvas || mouseDrag) {
      look.yaw -= e.movementX * MOUSE_SENS;
      look.pitch -= e.movementY * MOUSE_SENS;
    }
  });
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    if (!locked && wasLocked && screen === 'play') pause(true);
    wasLocked = locked;
  });
  const lookZone = $('lookZone');
  const lookT = { id: null, x: 0, y: 0 };
  lookZone.addEventListener('pointerdown', (e) => {
    if (lookT.id !== null) return;
    e.preventDefault();
    lookT.id = e.pointerId; lookT.x = e.clientX; lookT.y = e.clientY;
    try { lookZone.setPointerCapture(e.pointerId); } catch (err) { /* 取れなくても動く */ }
  });
  lookZone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookT.id) return;
    if (Math.abs(e.clientX - lookT.x) > 2) document.querySelector('.look-hint').hidden = true;
    look.yaw -= (e.clientX - lookT.x) * TOUCH_SENS;
    look.pitch -= (e.clientY - lookT.y) * TOUCH_SENS;
    lookT.x = e.clientX; lookT.y = e.clientY;
  });
  const endLook = (e) => { if (e.pointerId === lookT.id) lookT.id = null; };
  lookZone.addEventListener('pointerup', endLook);
  lookZone.addEventListener('pointercancel', endLook);

  function bindBtn(id, fn) {
    const b = $(id);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); fn(); });
    const up = () => b.classList.remove('down');
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  bindBtn('btnA', () => { pressed.action = true; });
  bindBtn('btnB', () => { pressed.use = true; });
  bindBtn('btnC', () => { pressed.crouch = true; });
  bindBtn('btnX', () => { pressed.switchEq = true; });
  bindBtn('equip', () => { pressed.switchEq = true; });
  $('btnPause').addEventListener('click', () => pause(true));

  // ===================== HUD =====================
  const hud = {
    life: $('lifeFill'), lifeNum: $('lifeNum'), loc: $('loc'), obj: $('obj'), phase: $('phase'), phaseT: $('phaseT'),
    equipName: $('equipName'), equipCount: $('equipCount'), keyItems: $('keyItems'), actLabel: $('btnALabel'), actHint: $('actHint'),
    useLabel: $('btnBLabel'), crouchLabel: $('btnCLabel'), stance: $('stance'), equipHow: $('equipHow'),
  };
  let lastHud = {};
  function setText(el, k, v) { if (lastHud[k] !== v) { lastHud[k] = v; el.textContent = v; } }
  function updateHUD(force) {
    if (!G) return;
    if (force) lastHud = {};
    const hp = Math.ceil(P.hp);
    hud.life.style.width = hp + '%';
    hud.life.classList.toggle('low', hp <= 30);
    setText(hud.lifeNum, 'hp', String(hp));
    setText(hud.loc, 'loc', M.roomAt(P.x, P.z).name);
    setText(hud.obj, 'obj', objective().text);
    // フェーズ
    const ph = G.phase;
    if (lastHud.ph !== ph) {
      lastHud.ph = ph;
      hud.phase.className = 'phase ' + ph;
      hud.phase.querySelector('b').textContent = ph === 'alert' ? 'ALERT' : ph === 'evasion' ? 'EVASION' : '';
    }
    if (ph === 'alert') hud.phaseT.textContent = G.alertT.toFixed(2);
    else if (ph === 'evasion') hud.phaseT.textContent = G.evaT.toFixed(2);
    // 装備
    const eq = P.equip && P.inv[P.equip] ? P.equip : null;
    setText(hud.equipName, 'eq', eq ? ITEM_INFO[eq].name : '素手');
    setText(hud.equipHow, 'eqh', eq ? (isTouch ? '' : 'F: ') + ITEM_INFO[eq].short : 'アイテムを拾うとここに出る');
    setText(hud.equipCount, 'eqc', eq ? (eq === 'box' ? (P.inBox ? 'かぶっている' : '') : eq === 'ext' ? '残' + P.inv.ext + '回' : eq === 'stun' ? '残' + P.inv.stun + '回' : '×' + P.inv[eq]) : '');
    const ki = [];
    if (P.inv.key) ki.push('裏門の鍵');
    if (G.girlFreed) ki.push('白石さん ' + Math.round(dist(P, G.girl)) + 'm');
    if (P.inv.tape) ki.push('ガムテ×' + P.inv.tape);
    if (G.mode === 'suppress') ki.push('仲間 ' + G.stats.freed + '人');
    setText(hud.keyItems, 'ki', ki.join('　'));
    const c = contextAction();
    const lbl = c ? c.label : 'アクション';
    setText(hud.actLabel, 'act', lbl);
    setText(hud.actHint, 'acth', c ? '［E］' + c.label : '');
    hud.actLabel.parentElement.classList.toggle('ready', !!c && !c.dim);
    hud.actLabel.parentElement.classList.toggle('pulse', !!P.hidden && !G.hint.left);
    setText(hud.useLabel, 'use', eq ? (eq === 'chalk' ? '投げる' : eq === 'gun' ? '撃つ' : eq === 'ext' ? '噴射' : eq === 'box' ? (P.inBox ? '脱ぐ' : 'かぶる') : eq === 'med' ? '使う' : '使う') : '使う');
    setText(hud.crouchLabel, 'cr', P.crouch ? '立つ' : 'しゃがむ');
    setText(hud.stance, 'st', P.hidden ? 'ロッカーの中（隙間から外が見える）' : P.inBox ? 'ダンボールをかぶっている' : P.crouch ? 'しゃがみ中' : '');
    updateSusp();
  }

  // 気づかれかけている方向の表示
  const suspEls = [];
  for (let i = 0; i < 6; i++) { const d = document.createElement('i'); $('susp').appendChild(d); suspEls.push(d); }
  function updateSusp() {
    const list = [];
    for (const e of G.enemies) {
      if (!isActive(e) || dist(P, e) > 26) continue;
      const lvl = e.state === 'alert' ? (e.seeP > 0 ? 1.2 : 0) : e.state === 'investigate' ? Math.max(0.35, e.susp) : e.susp;
      if (lvl > 0.04) list.push([lvl, e]);
    }
    list.sort((a, b) => b[0] - a[0]);
    suspEls.forEach((el, i) => {
      const it = list[i];
      if (!it) { el.hidden = true; return; }
      const [lvl, e] = it;
      const rel = angDiff(P.a, Math.atan2(e.x - P.x, e.z - P.z));
      const R = Math.min(window.innerWidth, window.innerHeight) * 0.22;
      el.hidden = false;
      el.style.transform = 'translate(' + (-Math.sin(rel) * R) + 'px,' + (-Math.cos(rel) * R) + 'px) rotate(' + (-rel) + 'rad) scale(' + (0.8 + Math.min(1, lvl) * 0.6) + ')';
      el.className = lvl >= 1 ? 'red' : '';
      el.style.opacity = String(0.35 + Math.min(1, lvl) * 0.65);
    });
  }

  // 目的地マーカー（画面上）
  const wpEl = $('wp'), wpArrow = $('wpArrow'), wpLabel = $('wpLabel');
  const wpV = new THREE.Vector3();
  function updateWaypoint() {
    const o = objective();
    if (!o.pos || screen !== 'play') { wpEl.hidden = true; beacon.visible = false; return; }
    beacon.visible = true;
    beacon.position.set(o.pos.x, 1.3, o.pos.z);
    const dx = o.pos.x - P.x, dz = o.pos.z - P.z, d = Math.hypot(dx, dz);
    const W = window.innerWidth, H = window.innerHeight;
    const rel = angDiff(P.a, Math.atan2(dx, dz));
    const hfov = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
    let sx, sy, edge = 0;
    if (Math.abs(rel) < hfov * 0.92) {
      wpV.set(o.pos.x, 1.2, o.pos.z).project(camera);
      sx = ((wpV.x + 1) / 2) * W;
      sy = ((1 - wpV.y) / 2) * H;
    } else {
      edge = rel > 0 ? -1 : 1;
      sx = edge < 0 ? 0 : W;
      sy = H * 0.5;
    }
    sx = clamp(sx, 70, W - 70);
    sy = clamp(sy, 120, H - 150);
    wpEl.hidden = false;
    wpEl.style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
    wpArrow.textContent = edge < 0 ? '◀' : edge > 0 ? '▶' : '▼';
    wpLabel.textContent = (o.label || '目的地') + ' ' + Math.round(d) + 'm';
  }

  // レーダー
  const radar = $('radar');
  const rctx = radar.getContext('2d');
  const RS = 5; // 1mあたりのピクセル
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = M.W * RS; mapCanvas.height = M.H * RS;
  (function drawMap() {
    const c = mapCanvas.getContext('2d');
    c.fillStyle = '#0b1f17'; c.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    for (let z = 0; z < M.H; z++) for (let x = 0; x < M.W; x++) {
      const t = M.get(x, z);
      if (t === M.T.WALL || t === M.T.LOCKER || t === M.T.SHELF) c.fillStyle = '#8fe0b0';
      else if (t === M.T.TREE) c.fillStyle = '#3f8a5c';
      else if (t === M.T.FENCE || t === M.T.GATE || t === M.T.BACKGATE) c.fillStyle = '#5aa07a';
      else if (M.solid(x, z)) c.fillStyle = '#2f6a4b';
      else continue;
      c.fillRect(x * RS, z * RS, RS, RS);
    }
  })();
  function drawRadar(t) {
    const w = radar.width, h = radar.height;
    rctx.save();
    rctx.clearRect(0, 0, w, h);
    rctx.fillStyle = '#06130d';
    rctx.fillRect(0, 0, w, h);
    if (G.phase === 'alert') {
      // ジャミング
      for (let i = 0; i < 260; i++) {
        rctx.fillStyle = 'rgba(120,255,170,' + Math.random() * 0.35 + ')';
        rctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 2);
      }
      rctx.fillStyle = '#ff5a4a';
      rctx.font = '900 ' + Math.round(w * 0.12) + 'px "Dela Gothic One", sans-serif';
      rctx.textAlign = 'center'; rctx.textBaseline = 'middle';
      rctx.fillText('JAMMING', w / 2, h / 2);
      rctx.restore();
      return;
    }
    const scale = w / (28 * RS);
    rctx.translate(w / 2, h / 2);
    rctx.scale(scale, scale);
    rctx.rotate(P.a - Math.PI); // 向いている方向が上
    rctx.translate(-P.x * RS, -P.z * RS);
    rctx.drawImage(mapCanvas, 0, 0);
    // 目標までのルート
    const o = objective();
    if (G.guide && G.guide.length) {
      rctx.strokeStyle = 'rgba(255,211,77,.85)';
      rctx.lineWidth = RS * 0.4;
      rctx.setLineDash([RS * 0.8, RS * 0.6]);
      rctx.beginPath();
      rctx.moveTo(P.x * RS, P.z * RS);
      for (const q of G.guide) rctx.lineTo(q.x * RS, q.z * RS);
      rctx.stroke();
      rctx.setLineDash([]);
    }
    if (o.pos && Math.floor(t * 2) % 2 === 0) {
      rctx.fillStyle = '#ffd34d';
      rctx.beginPath(); rctx.arc(o.pos.x * RS, o.pos.z * RS, RS * 0.9, 0, Math.PI * 2); rctx.fill();
    }
    // 人質
    rctx.fillStyle = '#9ad1ff';
    if (G.mode === 'suppress') for (const hst of G.hostages) if (!hst.freed) rctx.fillRect(hst.x * RS - 2, hst.z * RS - 2, 4, 4);
    // 敵
    for (const e of G.enemies) {
      if (e.state === 'tied') { rctx.fillStyle = '#556'; rctx.fillRect(e.x * RS - 3, e.z * RS - 3, 6, 6); continue; }
      if (isActive(e)) {
        const range = enemyRange(e) * RS, fov = enemyFov(e);
        rctx.fillStyle = e.state === 'investigate' ? 'rgba(255,170,60,.35)' : 'rgba(255,240,120,.25)';
        rctx.beginPath();
        rctx.moveTo(e.x * RS, e.z * RS);
        // canvasの角度：0=+x。ゲームの a は +z 基準なので変換
        const ca = Math.PI / 2 - e.a;
        rctx.arc(e.x * RS, e.z * RS, range, ca - fov, ca + fov);
        rctx.closePath(); rctx.fill();
      }
      rctx.fillStyle = isActive(e) ? '#ff4a3a' : '#aa7a70';
      rctx.beginPath(); rctx.arc(e.x * RS, e.z * RS, RS * 0.7, 0, Math.PI * 2); rctx.fill();
    }
    // 仲間
    rctx.fillStyle = '#ff9ac0';
    for (const f of G.followers) { rctx.beginPath(); rctx.arc(f.x * RS, f.z * RS, RS * 0.5, 0, Math.PI * 2); rctx.fill(); }
    // 自分
    rctx.translate(P.x * RS, P.z * RS);
    rctx.rotate(-P.a + Math.PI);
    rctx.fillStyle = '#ffffff';
    rctx.beginPath(); rctx.moveTo(0, -RS * 1.3); rctx.lineTo(RS * 0.9, RS * 0.9); rctx.lineTo(-RS * 0.9, RS * 0.9); rctx.closePath(); rctx.fill();
    rctx.restore();
    if (G.phase === 'evasion') {
      rctx.fillStyle = 'rgba(255,170,60,.12)';
      rctx.fillRect(0, 0, w, h);
    }
  }

  // メッセージ
  let toastT = 0;
  function toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('on');
    toastT = 2.6;
  }
  // 初めて拾った道具の使い方カード
  let cardT = 0;
  function showItemCard(type, got) {
    const info = ITEM_INFO[type];
    $('icName').textContent = got || info.name;
    $('icHow').textContent = keyText(info.how);
    $('icSwitch').hidden = !EQUIP_ORDER.includes(type);
    $('icSwitch').textContent = isTouch ? '持ち物は［持ちかえ］ボタンか、下の装備欄をタップで切り替え' : '持ち物は Qキー か、下の装備欄をクリックで切り替え';
    $('itemCard').hidden = false;
    cardT = 8;
  }
  $('itemCard').addEventListener('pointerdown', (e) => { e.stopPropagation(); $('itemCard').hidden = true; cardT = 0; });
  let subQueue = [], subT = 0;
  function say(who, text) {
    subQueue = [[who, text]];
    subT = 0;
    showSub();
  }
  function sayQueue(lines) { subQueue = lines.slice(); subT = 0; showSub(); }
  function showSub() {
    const el = $('sub');
    if (!subQueue.length) { el.classList.remove('on'); return; }
    const [who, text] = subQueue[0];
    el.querySelector('.who').textContent = who;
    el.querySelector('.who').hidden = !who;
    el.querySelector('.txt').textContent = text;
    el.classList.add('on');
    subT = 2.2 + text.length * 0.07;
  }
  function updateMessages(dt) {
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('on'); }
    if (cardT > 0) { cardT -= dt; if (cardT <= 0) $('itemCard').hidden = true; }
    if (subT > 0) { subT -= dt; if (subT <= 0) { subQueue.shift(); showSub(); } }
  }
  function flash(kind) {
    const el = $('flash');
    el.className = '';
    void el.offsetWidth;
    el.className = kind;
    if (kind === 'hurt') shake = 0.25;
  }

  // ===================== 描画の同期 =====================
  let shake = 0;
  let beacon = null;

  // 手元（一人称の腕と持っているアイテム）
  const viewModel = new THREE.Group();
  camera.add(viewModel);
  const vmItem = new THREE.Group();
  function onTop(obj) {
    obj.traverse((m) => {
      if (!m.isMesh) return;
      m.material = m.material.clone();
      m.material.depthTest = false;
      m.renderOrder = 20;
    });
    return obj;
  }
  const fpArm = onTop(MD.fpArm());
  fpArm.position.set(0.3, -0.31, -0.45);
  viewModel.add(fpArm);
  vmItem.position.set(0.3, -0.27, -0.85);
  viewModel.add(vmItem);
  let vmType = null;
  function setViewItem() {
    const eq = P && P.equip && P.inv[P.equip] ? P.equip : null;
    const type = eq === 'gun' ? 'gun' : eq;
    if (type === vmType) return;
    vmType = type;
    while (vmItem.children.length) vmItem.remove(vmItem.children[0]);
    if (type && type !== 'box') {
      const m = onTop(MD.item(type));
      m.scale.setScalar(type === 'ext' ? 0.4 : 0.45);
      m.position.y = type === 'ext' ? -0.14 : -0.04;
      vmItem.add(m);
    }
  }

  function syncVisuals(dt, t) {
    setViewItem();
    const tps = viewMode === 'tps';
    viewModel.visible = !tps && !P.hidden && !P.inBox && screen !== 'cine';
    // 肩越し視点の主人公
    const pg = P.model.group;
    pg.visible = tps && !P.hidden && P.camDist > 0.3;
    pg.position.set(P.x, 0, P.z);
    pg.rotation.y = P.a;
    P.boxM.visible = P.inBox;
    P.model.body.visible = !P.inBox;
    MD.pose(P.model, P.crouch ? 'crouch' : 'stand', P.moving, dt, P.running ? 12 : P.crouch ? 6 : 8);
    if (P.actT > 0 && !P.inBox) { P.model.aR.sh.rotation.x = -1.5; P.model.aR.el.rotation.x = -0.2; }
    const swing = P.actT > 0 ? Math.sin((P.actT / 0.5) * Math.PI) : 0;
    viewModel.position.set(Math.cos(P.bobT * 0.5) * 0.012, Math.abs(Math.sin(P.bobT * 0.5)) * 0.015 - (P.crouch ? 0.02 : 0), -swing * 0.25);
    // 敵
    for (const e of G.enemies) {
      const g = e.model.group;
      g.position.set(e.x, 0, e.z);
      g.rotation.y = e.a;
      const st = e.state === 'down' ? 'down' : e.state === 'tied' ? 'tied' : 'stand';
      MD.pose(e.model, st, e.moving, dt, e.moveSpeed > 3 ? 11 : 7);
      e.mark.position.set(e.x, st === 'stand' ? 2.45 : 0.9, e.z);
      updateCone(e);
    }
    // 仲間
    for (const f of G.followers) {
      f.model.group.position.set(f.x, 0, f.z);
      f.model.group.rotation.y = f.a;
      MD.pose(f.model, f.crouch ? 'crouch' : 'stand', f.moving, dt, 9);
    }
    if (G.girl && !G.girl.freed) G.girl.heart.position.y = 1.5 + Math.sin(t * 3) * 0.1;
    // アイテム
    for (const it of G.items) {
      if (it.taken) continue;
      it.model.rotation.y = t * 1.6;
      it.model.position.y = 0.08 + Math.sin(t * 3 + it.x) * 0.05;
      it.glow.material.opacity = 0.4 + Math.sin(t * 4) * 0.3;
    }
    // パトランプ
    worldRefs.policeLights.forEach((m, i) => { m.visible = (Math.floor(t * 4) + i) % 2 === 0; });
  }
  const tpsLook = new THREE.Vector3();
  function updateCamera(dt) {
    const eye = P.hidden ? 1.45 : P.inBox ? 0.55 : P.crouch ? 0.95 : 1.5;
    P.eye += (eye - P.eye) * Math.min(1, dt * 10);
    let x = P.x, z = P.z;
    if (P.hidden) {
      // ロッカーの中、扉の隙間のすぐ後ろ
      x = P.hidden.x + 0.5 + Math.sin(P.hidden.face) * 0.36;
      z = P.hidden.z + 0.5 + Math.cos(P.hidden.face) * 0.36;
    }
    const bob = P.moving ? Math.sin(P.bobT) * (P.running ? 0.05 : 0.025) : 0;
    if (viewMode === 'tps' && !P.hidden) {
      // 肩越し：右肩の後ろ上から。壁にめり込むときはカメラを手前に寄せる
      const fx = Math.sin(P.a), fz = Math.cos(P.a), rx = -Math.cos(P.a), rz = Math.sin(P.a);
      const want = 2.5 * Math.cos(P.pitch * 0.7);
      const tx = P.x + rx * 0.55 - fx * want, tz = P.z + rz * 0.55 - fz * want;
      let free = camClip(P.x, P.z, tx, tz, false);
      // ロッカーや棚が背後にあるときは、その上を越えてカメラを置く
      let over = false;
      if (free < 0.5) { const f2 = camClip(P.x, P.z, tx, tz, true); if (f2 > free) { free = f2; over = true; } }
      P.camOver += ((over ? 1 : 0) - P.camOver) * Math.min(1, dt * 6);
      const op = 1 - P.camOver * 0.7;
      worldRefs.occluders.forEach((m) => { const tr = op < 0.99; if (m.transparent !== tr) { m.transparent = tr; m.depthWrite = !tr; m.needsUpdate = true; } m.opacity = op; });
      const d = free * Math.hypot(tx - P.x, tz - P.z);
      P.camDist += (d - P.camDist) * Math.min(1, dt * (d < P.camDist ? 20 : 6));
      const k = P.camDist / Math.max(0.01, Math.hypot(tx - P.x, tz - P.z));
      // 背後が壁で寄りすぎるときは、上から見下ろすように持ち上げる
      const lift = Math.max(0, 1.2 - P.camDist) * 0.9 + P.camOver * 0.7;
      const cy = clamp(P.eye + 0.3 + lift - Math.sin(P.pitch) * 1.6, 0.35, 2.6);
      camera.position.set(P.x + (tx - P.x) * k, cy + bob * 0.4, P.z + (tz - P.z) * k);
      // 主人公の少し先（肩の延長線上）を見る。持ち上げたカメラでも主人公が画面に入る
      const L = 4;
      tpsLook.set(P.x + rx * 0.55 + fx * L, P.eye - 0.1 - lift * 1.2 + Math.sin(P.pitch) * L, P.z + rz * 0.55 + fz * L);
    } else {
      P.camDist = 0;
      camera.position.set(x, P.eye + bob, z);
    }
    if (shake > 0) {
      shake -= dt;
      camera.position.x += (Math.random() - 0.5) * shake * 0.3;
      camera.position.y += (Math.random() - 0.5) * shake * 0.3;
    }
    if (viewMode === 'tps' && !P.hidden) {
      camera.lookAt(tpsLook);
      return;
    }
    const cp = Math.cos(P.pitch);
    camera.lookAt(camera.position.x + Math.sin(P.a) * cp, camera.position.y + Math.sin(P.pitch), camera.position.z + Math.cos(P.a) * cp);
  }

  // 主人公の頭からカメラ位置までの間に壁があれば、手前の割合（0〜1）を返す
  const blocksCam = (x, z, wallsOnly) => (wallsOnly ? M.get(x, z) === M.T.WALL || M.get(x, z) === M.T.TREE : M.sight(x, z));
  function camClip(x0, z0, x1, z1, wallsOnly) {
    const d = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.ceil(d / 0.08));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      // 壁ぎりぎりにならないよう、少し太めに判定する
      if (blocksCam(Math.floor(x + 0.18), Math.floor(z), wallsOnly) || blocksCam(Math.floor(x - 0.18), Math.floor(z), wallsOnly) ||
          blocksCam(Math.floor(x), Math.floor(z + 0.18), wallsOnly) || blocksCam(Math.floor(x), Math.floor(z - 0.18), wallsOnly)) {
        return Math.max(0, (i - 1) / n);
      }
    }
    return 1;
  }

  // 視点の切りかえ（肩越し／一人称）
  let viewMode = 'tps';
  try { if (localStorage.getItem('tg-view') === 'fps') viewMode = 'fps'; } catch (e) { /* 保存できなくても動く */ }
  function setView(m) {
    viewMode = m;
    try { localStorage.setItem('tg-view', m); } catch (e) { /* 無視 */ }
    $('btnView').textContent = m === 'tps' ? '一人称へ' : '肩越しへ';
    document.body.classList.toggle('fps', m === 'fps');
  }
  $('btnView').addEventListener('click', () => { setView(viewMode === 'tps' ? 'fps' : 'tps'); AU.sfx.text(); });
  setView(viewMode);

  // ===================== 画面遷移 =====================
  function show(id) {
    ['title', 'hud', 'cine', 'pauseMenu', 'over', 'result'].forEach((k) => { $(k).hidden = k !== id && !(id === 'pauseMenu' && k === 'hud'); });
    document.body.classList.toggle('in-game', id !== 'title');
  }

  let cine = null;
  function startCine(lines, done) {
    cine = { lines, i: -1, done };
    screen = 'cine';
    show('cine');
    cineNext();
  }
  function cineNext() {
    if (!cine) return;
    cine.i++;
    if (cine.i >= cine.lines.length) { const d = cine.done; cine = null; d(); return; }
    const l = cine.lines[cine.i];
    $('cineWho').textContent = l.w || '';
    $('cineWho').hidden = !l.w;
    $('cineText').textContent = l.t;
    $('cineCount').textContent = cine.i + 1 + ' / ' + cine.lines.length;
    if (l.fx === 'shake') { shake = 0.6; AU.sfx.door(); AU.sfx.hit(); flash('white'); }
    else AU.sfx.text();
  }
  $('cine').addEventListener('pointerdown', (e) => { if (e.target.id === 'cineSkip') return; cineNext(); });
  $('cineSkip').addEventListener('click', () => { if (cine) { const d = cine.done; cine = null; d(); } });

  function startMode(modeId, quick) {
    AU.init();
    tryLandscape();
    newGame(modeId);
    const begin = () => {
      screen = 'play';
      show('hud');
      sayQueue([
        ['', isTouch ? '掃除用具ロッカーの中。画面をドラッグすると隙間から周りを見回せる' : 'ロッカーの中。マウスで隙間から周りを見回せる（画面をクリックすると視点が固定される）'],
        ['', '見張りが人質の方を向いたら、' + (isTouch ? '右下の光っている「ロッカーから出る」ボタン' : 'E キー') + 'で外へ。黄色いマーカーが目的地だ'],
        ['', isTouch ? '左下の十字キーで移動。「走る」をONにすると速いが、足音で気づかれやすい' : 'WASDで移動　Shiftで忍び足　Cでしゃがむ'],
      ]);
    };
    // コンティニュー時はオープニングを飛ばす
    if (quick) begin();
    else startCine(OPENING.concat(STORY[modeId].intro), begin);
  }

  function pause(on) {
    if (on && screen === 'play') { screen = 'pause'; show('pauseMenu'); $('muteBtn').textContent = AU.isMuted() ? '音：OFF' : '音：ON'; }
    else if (!on && screen === 'pause') { screen = 'play'; show('hud'); }
  }

  function gameOver(kind) {
    if (screen !== 'play') return;
    screen = 'over';
    AU.bgm('none');
    AU.sfx.over();
    $('overLine').textContent = kind === 'girl' ? '白石さんが、また連れて行かれてしまった……' : NAME + '？ ' + NAME + '！？ ' + NAME + 'ーーーーッ！！';
    setTimeout(() => show('over'), 600);
    flash('hurt');
  }

  function clear() {
    if (G.cleared) return;
    G.cleared = true;
    AU.bgm('none');
    AU.sfx.clear();
    screen = 'cine-wait';
    setTimeout(() => startCine(STORY[G.mode].ending, showResult), 900);
  }

  function rankOf() {
    const s = G.stats;
    const fast = G.time < (G.mode === 'suppress' ? 900 : 480);
    if (s.alerts === 0 && (G.mode === 'suppress' || s.downs === 0)) return fast ? ['ゴースト', '伝説の帰宅部'] : ['フォックス', '気配を消せる男'];
    if (s.alerts === 0) return ['フォックス', '気配を消せる男'];
    if (s.alerts <= 2) return ['ハウンド', '校内の猟犬'];
    if (s.alerts <= 5) return ['ドッグ', 'あばれる中学2年生'];
    return ['チキン', 'ただの迷惑な生徒'];
  }
  function fmtTime(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + '分' + String(s).padStart(2, '0') + '秒'; }

  function showResult() {
    screen = 'result';
    show('result');
    const [code, sub] = rankOf();
    $('resMode').textContent = G.cfg.name + '　MISSION COMPLETE';
    $('resRank').textContent = code;
    $('resRankSub').textContent = sub;
    const s = G.stats;
    const rows = [['クリアタイム', fmtTime(G.time)], ['見つかった回数', s.alerts + '回'], ['気絶させた数', s.downs + '人'], ['縛り上げた数', s.ties + '人'], ['受けたダメージ', s.damage]];
    if (G.mode === 'suppress') rows.push(['解放した仲間', s.freed + '人']);
    $('resStats').innerHTML = rows.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('');
    saveBest(G.mode, code, G.time, s.alerts);
  }

  // ===================== 記録 =====================
  const RANK_ORDER = ['チキン', 'ドッグ', 'ハウンド', 'フォックス', 'ゴースト'];
  function loadBest() { try { return JSON.parse(localStorage.getItem('tg-best') || '{}'); } catch (e) { return {}; } }
  function saveBest(mode, rank, time, alerts) {
    const b = loadBest();
    const cur = b[mode];
    if (!cur || RANK_ORDER.indexOf(rank) > RANK_ORDER.indexOf(cur.rank) || (rank === cur.rank && time < cur.time)) b[mode] = { rank, time, alerts };
    try { localStorage.setItem('tg-best', JSON.stringify(b)); } catch (e) { /* 保存できなくても続行 */ }
  }

  // ===================== タイトル =====================
  function buildTitle() {
    const best = loadBest();
    const grid = $('modes');
    grid.innerHTML = '';
    Object.values(TG.MODES).forEach((m) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mode';
      const rec = best[m.id] ? '<span class="mode-best">CLEAR：' + best[m.id].rank + '／' + fmtTime(best[m.id].time) + '</span>' : '';
      b.innerHTML = '<span class="mode-kind">' + m.kind + '</span><span class="mode-name">' + m.name + '</span><span class="mode-hint">' + m.hint + '</span><span class="mode-goal">' + m.goal + '</span>' + rec;
      b.addEventListener('click', () => startMode(m.id));
      grid.appendChild(b);
    });
  }
  function toTitle() {
    screen = 'title';
    AU.bgm('none');
    buildTitle();
    show('title');
    G = null;
    scene.remove(dyn);
    dyn = new THREE.Group();
    scene.add(dyn);
  }
  function tryLandscape() {
    if (!isTouch) return;
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    try {
      const p = req && !document.fullscreenElement ? req.call(el) : null;
      const so = window.screen.orientation;
      const lock = () => { if (so && so.lock) so.lock('landscape').catch(() => {}); };
      if (p && p.then) p.then(lock).catch(() => {}); else lock();
    } catch (e) { /* 非対応なら何もしない */ }
  }

  $('resume').addEventListener('click', () => pause(false));
  $('restart').addEventListener('click', () => { const m = G.mode; startMode(m, true); });
  $('quitBtn').addEventListener('click', toTitle);
  $('muteBtn').addEventListener('click', () => { AU.setMuted(!AU.isMuted()); $('muteBtn').textContent = AU.isMuted() ? '音：OFF' : '音：ON'; });
  $('continueBtn').addEventListener('click', () => { const m = G.mode; startMode(m, true); });
  $('overTitle').addEventListener('click', toTitle);
  $('resRetry').addEventListener('click', () => { const m = G.mode; startMode(m); });
  $('resTitle').addEventListener('click', toTitle);

  // ===================== メインループ =====================
  let lastT = performance.now();
  let hudT = 0;
  // タイトル背景用のカメラ
  const titleCam = { a: 0 };
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const t = now / 1000;
    if (screen === 'play' && G) {
      G.time += dt;
      updatePlayer(dt);
      for (const e of G.enemies) updateEnemy(e, dt);
      updateFollowers(dt);
      updatePhase(dt);
      checkWin();
      updateFx(dt);
      updateMessages(dt);
      G.guideT -= dt;
      if (G.guideT <= 0) {
        G.guideT = 0.5;
        const o = objective();
        G.guide = o.pos ? findPath(P.x, P.z, o.pos.x, o.pos.z) : null;
      }
      updateWaypoint();
      hudT -= dt;
      if (hudT <= 0) { hudT = 0.08; updateHUD(false); drawRadar(t); }
    } else if (G && (screen === 'cine' || screen === 'cine-wait' || screen === 'over')) {
      updateFx(dt);
    }
    document.body.classList.toggle('in-locker', !!(G && P.hidden && screen !== 'title'));
    document.body.classList.toggle('in-box', !!(G && P.inBox && screen === 'play' && viewMode === 'fps'));
    if (G) {
      syncVisuals(screen === 'play' || screen === 'cine' ? dt : 0, t);
      updateCamera(dt);
    } else {
      // タイトル：校舎の上空をゆっくり回る
      titleCam.a += dt * 0.06;
      viewModel.visible = false;
      camera.position.set(32 + Math.sin(titleCam.a) * 34, 26, 22 + Math.cos(titleCam.a) * 34);
      camera.lookAt(32, 0, 22);
      worldRefs.policeLights.forEach((m, i) => { m.visible = (Math.floor(t * 4) + i) % 2 === 0; });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // レーダーの解像度
  function sizeRadar() {
    const r = radar.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    radar.width = Math.round(r.width * dpr) || 150;
    radar.height = Math.round(r.height * dpr) || 150;
  }
  window.addEventListener('resize', sizeRadar);

  buildTitle();
  show('title');
  requestAnimationFrame((n) => { lastT = n; sizeRadar(); frame(n); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play') pause(true); });
  // HUD表示後にレーダーのサイズを合わせる
  new ResizeObserver(sizeRadar).observe(radar);

  TG.debug = { get G() { return G; }, get P() { return P; }, get screen() { return screen; }, startMode, cineNext, clear: () => clear() };
})();
