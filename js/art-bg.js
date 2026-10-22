// 背景をSVGで描く（400x300、はみ出しはトリミング）
(function () {
  const wrap = (inner, defs) => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs || ''}</defs>${inner}</svg>`;
  const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
  // 疑似乱数（毎回同じ絵になるように）
  const rnd = (i) => { const x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x); };

  const sky = (a, b) => `<rect width="400" height="300" fill="url(#sky)"/>`;
  const skyDef = (a, b) => grad('sky', a, b);

  const crowd = (y, h, cols) => rep(160, (i) => `<circle cx="${(i % 40) * 10 + 5 + (Math.floor(i / 40) % 2) * 5}" cy="${y + Math.floor(i / 40) * (h / 4)}" r="3.6" fill="${cols[i % cols.length]}"/>`);
  const buildings = (y, col, win) => rep(9, (i) => {
    const w = 36 + rnd(i) * 30, h = 60 + rnd(i + 3) * 110, x = i * 46 - 10;
    return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${col}"/>` +
      rep(Math.floor(h / 18), (j) => rep(3, (k) => rnd(i * 31 + j * 7 + k) > 0.45 ? `<rect x="${x + 5 + k * (w / 3.3)}" y="${y - h + 8 + j * 18}" width="${w / 6}" height="8" fill="${win}"/>` : ''));
  });
  const desk = (x, y, c) => `<rect x="${x}" y="${y}" width="110" height="14" fill="${c}"/><rect x="${x + 6}" y="${y + 14}" width="8" height="40" fill="${c}"/><rect x="${x + 96}" y="${y + 14}" width="8" height="40" fill="${c}"/>`;
  const pc = (x, y) => `<rect x="${x}" y="${y - 34}" width="44" height="30" rx="2" fill="#2b3036"/><rect x="${x + 3}" y="${y - 31}" width="38" height="22" fill="#7fb3d9" opacity=".6"/><rect x="${x + 18}" y="${y - 4}" width="8" height="4" fill="#2b3036"/>`;

  const BG = {
    gate: () => wrap(sky() + `
      <path d="M0,170 Q100,130 200,150 T400,140 L400,300 L0,300Z" fill="#7aa36b"/>
      <rect x="250" y="40" width="34" height="140" fill="#f4f2ea"/><path d="M244,40 L267,10 L290,40Z" fill="#e8e4d6"/>
      <rect x="60" y="110" width="200" height="70" fill="#efece2"/>${rep(8, (i) => `<rect x="${72 + i * 23}" y="124" width="14" height="18" fill="#9cb7c9"/><rect x="${72 + i * 23}" y="150" width="14" height="18" fill="#9cb7c9"/>`)}
      <path d="M0,240 L400,226 L400,300 L0,300Z" fill="#b8ad98"/>
      ${rep(7, (i) => `<circle cx="${20 + i * 62}" cy="${210 + (i % 2) * 8}" r="${18 + (i % 3) * 4}" fill="#f2b8c6"/>`)}`, skyDef('#9fd0f0', '#e8f3fa')),

    dorm: () => wrap(`
      <rect width="400" height="300" fill="#d9ccb0"/>
      <rect x="0" y="0" width="400" height="18" fill="#8a6d4a"/>
      <rect x="250" y="30" width="110" height="90" fill="#1d2a45" stroke="#8a6d4a" stroke-width="8"/>
      <circle cx="330" cy="58" r="10" fill="#f5efc8"/><path d="M305,30 L305,120" stroke="#8a6d4a" stroke-width="5"/>
      <rect x="20" y="40" width="150" height="190" fill="#9c7b55"/><rect x="28" y="100" width="134" height="10" fill="#6d5236"/>
      <rect x="28" y="60" width="134" height="40" fill="#e9e3d6"/><rect x="28" y="172" width="134" height="40" fill="#e9e3d6"/>
      <path d="M190,40 L230,40 L236,150 L184,150Z" fill="#f4f3ee" stroke="#c8c3b6"/><text x="210" y="100" text-anchor="middle" font-size="16" font-weight="700" fill="#7a1020">PM</text>
      <path d="M0,230 L400,230 L400,300 L0,300Z" fill="#b8b07a"/>${rep(6, (i) => `<path d="M${i * 70},230 L${i * 70 - 30},300" stroke="#958d5a" stroke-width="2"/>`)}`),

    dorm_night: () => wrap(`
      <rect width="400" height="300" fill="#2a2d3a"/>
      <rect x="250" y="30" width="110" height="90" fill="#0f1628" stroke="#3b3a3a" stroke-width="8"/><circle cx="330" cy="58" r="10" fill="#f5efc8"/>
      <rect x="20" y="40" width="150" height="190" fill="#3b3226"/><rect x="28" y="60" width="134" height="40" fill="#5a5762"/><rect x="28" y="172" width="134" height="40" fill="#5a5762"/>
      <path d="M0,230 L400,230 L400,300 L0,300Z" fill="#3d3b2c"/>
      <path d="M250,120 L360,120 L400,300 L200,300Z" fill="#8fa3d6" opacity=".12"/>`),

    hall_night: () => wrap(`
      <rect width="400" height="300" fill="#22252b"/>
      <path d="M0,0 L160,110 L240,110 L400,0Z" fill="#2c3037"/><path d="M0,300 L160,190 L240,190 L400,300Z" fill="#3a3a36"/>
      <path d="M0,0 L160,110 L160,190 L0,300Z" fill="#30343b"/><path d="M400,0 L240,110 L240,190 L400,300Z" fill="#30343b"/>
      <rect x="160" y="110" width="80" height="80" fill="#15171b"/>
      ${rep(3, (i) => `<rect x="${170 - i * 40}" y="${96 - i * 30}" width="${60 + i * 80}" height="5" fill="#e8f0ff" opacity="${0.9 - i * 0.2}"/>`)}
      <rect x="40" y="120" width="40" height="120" fill="#4a3b2c"/><rect x="320" y="120" width="40" height="120" fill="#4a3b2c"/>`),

    dining: () => wrap(`
      <rect width="400" height="300" fill="#e6dcc6"/><rect y="0" width="400" height="14" fill="#a08a66"/>
      <rect x="20" y="40" width="80" height="60" fill="#fff" stroke="#a08a66" stroke-width="4"/><text x="60" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="#7a1020">食事五訓</text>
      <rect x="290" y="70" width="70" height="70" rx="10" fill="#c9c9c9"/><rect x="300" y="60" width="50" height="14" rx="4" fill="#9a9a9a"/>
      <path d="M0,170 L400,170 L400,300 L0,300Z" fill="#cbbd9c"/>
      <rect x="30" y="190" width="340" height="22" fill="#8a6d4a"/><rect x="10" y="250" width="380" height="22" fill="#8a6d4a"/>
      ${rep(8, (i) => `<ellipse cx="${55 + i * 42}" cy="190" rx="12" ry="5" fill="#fff"/>`)}`),

    kitchen_night: () => wrap(`
      <rect width="400" height="300" fill="#1c1f26"/>
      <rect x="40" y="60" width="90" height="190" fill="#c9ccd1"/><path d="M40,60 L130,60 L130,140 L40,140Z" fill="#eaf6ff"/><rect x="48" y="80" width="74" height="4" fill="#9aa"/>
      <ellipse cx="80" cy="110" rx="7" ry="9" fill="#fffbe8"/>
      <path d="M130,60 L400,0 L400,300 L130,300Z" fill="#eaf6ff" opacity=".08"/>
      <rect x="170" y="170" width="220" height="80" fill="#3a3d44"/><rect x="200" y="150" width="60" height="20" rx="3" fill="#222"/><ellipse cx="300" cy="160" rx="40" ry="8" fill="#555"/>`),

    ground: () => wrap(sky() + `
      <path d="M0,150 Q60,128 120,140 T260,132 T400,140 L400,170 L0,170Z" fill="#5f8a55"/>
      ${rep(20, (i) => `<path d="M${i * 20},90 L${i * 20},170" stroke="#5b5b5b" stroke-width="1.2"/>`)}<path d="M0,92 L400,92 M0,120 L400,120" stroke="#5b5b5b" stroke-width="1.2"/>
      <path d="M0,170 L400,170 L400,300 L0,300Z" fill="#c69b6d"/><path d="M0,200 Q200,180 400,206" stroke="#e8d9c2" stroke-width="3" fill="none"/>
      ${rep(5, (i) => `<circle cx="${40 + i * 80}" cy="${240 + (i % 2) * 20}" r="3" fill="#fff"/>`)}`, skyDef('#7fc2ef', '#dff0fb')),

    ground_dusk: () => wrap(sky() + `
      <path d="M0,150 Q60,128 120,140 T260,132 T400,140 L400,170 L0,170Z" fill="#3d4a3a"/>
      ${rep(20, (i) => `<path d="M${i * 20},90 L${i * 20},170" stroke="#3a2f2f" stroke-width="1.2"/>`)}
      <circle cx="320" cy="130" r="26" fill="#ffcf7a" opacity=".9"/>
      <path d="M0,170 L400,170 L400,300 L0,300Z" fill="#8e5e44"/>`, skyDef('#f08c5a', '#f9d48f')),

    festival: () => wrap(`
      <rect width="400" height="300" fill="#141a3a"/>
      ${[[90, 70, '#f29bb2'], [300, 60, '#f2d264'], [200, 100, '#8ec5e6']].map(([x, y, c]) => rep(16, (i) => `<path d="M${x},${y} L${x + Math.cos(i / 16 * 6.28) * 48},${y + Math.sin(i / 16 * 6.28) * 48}" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 6"/>`)).join('')}
      <path d="M0,220 L400,220 L400,300 L0,300Z" fill="#1d1d22"/>
      ${rep(10, (i) => `<rect x="${i * 42}" y="196" width="38" height="30" fill="${i % 2 ? '#c0392b' : '#e9e1cf'}"/>`)}
      ${rep(12, (i) => `<ellipse cx="${18 + i * 34}" cy="190" rx="9" ry="12" fill="#ff9a3c"/>`)}
      <path d="M0,184 Q200,174 400,184" stroke="#333" stroke-width="1.5" fill="none"/>`),

    stadium: () => wrap(sky() + `
      <path d="M0,40 L400,70 L400,150 L0,150Z" fill="#5e6a7a"/>
      ${crowd(60, 80, ['#f3f3f3', '#c53b3b', '#2f4a8a', '#f2d264', '#e0e0e0'])}
      <rect x="0" y="146" width="400" height="16" fill="#2f5a2e"/>
      <path d="M0,162 L400,162 L400,300 L0,300Z" fill="#3f8a3a"/>${rep(8, (i) => `<rect x="${i * 50}" y="162" width="25" height="138" fill="#4a9944" opacity=".7"/>`)}
      <path d="M120,300 Q200,190 280,300Z" fill="#c69b6d"/>`, skyDef('#5fb3ee', '#cfe9fb')),

    koshien: () => wrap(sky() + `
      <path d="M0,40 L400,70 L400,150 L0,150Z" fill="#6a6f78"/>
      ${crowd(56, 88, ['#f3f3f3', '#c53b3b', '#f5f5f5', '#2f4a8a', '#ffcf3a'])}
      <rect x="0" y="140" width="400" height="22" fill="#2d6b2c"/>${rep(40, (i) => `<circle cx="${i * 10 + 5}" cy="${146 + (i % 3) * 5}" r="5" fill="#357a33"/>`)}
      <path d="M0,162 L400,162 L400,300 L0,300Z" fill="#c9a074"/><path d="M0,162 L400,162 L400,196 L0,196Z" fill="#3f8a3a"/>
      <circle cx="350" cy="30" r="18" fill="#fff6c8"/>`, skyDef('#3d9be6', '#bfe2fb')),

    mountain: () => wrap(sky() + `
      <path d="M0,150 L80,70 L160,140 L250,60 L340,130 L400,90 L400,300 L0,300Z" fill="#4f7350"/>
      <path d="M0,190 L100,120 L200,180 L300,110 L400,170 L400,300 L0,300Z" fill="#3e6040"/>
      <path d="M160,300 Q200,220 230,190 Q250,175 260,170 L270,172 Q250,190 240,220 Q220,260 240,300Z" fill="#a8977a"/>
      ${rep(12, (i) => `<path d="M${10 + i * 34},${250 + (i % 3) * 10} l10,-30 l10,30Z" fill="#2e4a30"/>`)}`, skyDef('#8fc0d8', '#d8e8ee')),

    mountain_night: () => wrap(sky() + `
      ${rep(30, (i) => `<circle cx="${rnd(i) * 400}" cy="${rnd(i + 50) * 120}" r="${0.8 + rnd(i + 9) * 1.4}" fill="#fff"/>`)}
      <path d="M0,150 L80,70 L160,140 L250,60 L340,130 L400,90 L400,300 L0,300Z" fill="#1a2620"/>
      <path d="M0,190 L100,120 L200,180 L300,110 L400,170 L400,300 L0,300Z" fill="#111a15"/>
      <circle cx="210" cy="230" r="40" fill="#f5efc8" opacity=".08"/>`, skyDef('#0b1026', '#1f2a44')),

    toilet: () => wrap(`
      <rect width="400" height="300" fill="#dfe6ea"/>
      ${rep(20, (i) => `<path d="M${i * 20},0 L${i * 20},300" stroke="#c4cfd5" stroke-width="1.5"/>`)}${rep(15, (i) => `<path d="M0,${i * 20} L400,${i * 20}" stroke="#c4cfd5" stroke-width="1.5"/>`)}
      ${rep(3, (i) => `<rect x="${40 + i * 120}" y="60" width="90" height="180" fill="#9fb1bd" stroke="#7d8f9b" stroke-width="3"/>`)}
      <ellipse cx="200" cy="270" rx="60" ry="14" fill="#fff" stroke="#bbb" stroke-width="3"/>`),

    corridor: () => wrap(`
      <rect width="400" height="300" fill="#9a9a95"/>
      <path d="M0,200 L400,200 L400,300 L0,300Z" fill="#7d7d78"/>${rep(10, (i) => `<path d="M${i * 44},200 L${i * 44 - 40},300" stroke="#6d6d68"/>`)}
      ${rep(4, (i) => `<rect x="${20 + i * 100}" y="60" width="60" height="140" fill="#6a5a46"/>`)}
      <rect x="0" y="40" width="400" height="6" fill="#efefef" opacity=".7"/>`),

    train: () => wrap(`
      <rect width="400" height="300" fill="#cfd6d0"/>
      ${rep(3, (i) => `<rect x="${20 + i * 130}" y="40" width="110" height="80" rx="8" fill="#a9d6f0"/><path d="M${20 + i * 130},100 L${60 + i * 130},80 L${90 + i * 130},95 L${130 + i * 130},70 L${130 + i * 130},120 L${20 + i * 130},120Z" fill="#6f9a5e"/>`)}
      <rect x="0" y="150" width="400" height="60" fill="#3e6e8f"/><rect x="0" y="140" width="400" height="14" fill="#2f5670"/>
      <path d="M0,210 L400,210 L400,300 L0,300Z" fill="#8a8a86"/>
      ${rep(8, (i) => `<path d="M${30 + i * 50},10 L${30 + i * 50},30" stroke="#888" stroke-width="2"/><circle cx="${30 + i * 50}" cy="34" r="6" fill="none" stroke="#888" stroke-width="2"/>`)}`),

    dagashi: () => wrap(`
      <rect width="400" height="300" fill="#8a6440"/>
      <rect x="20" y="20" width="360" height="40" fill="#5a3d24"/><text x="200" y="50" text-anchor="middle" font-size="24" font-weight="900" fill="#f2d264">だがし</text>
      ${rep(3, (r) => rep(8, (i) => `<rect x="${30 + i * 44}" y="${80 + r * 50}" width="36" height="36" fill="${['#e5533c', '#f2d264', '#8ec5e6', '#f29bb2', '#9bd28a'][(i + r) % 5]}"/>`))}
      <path d="M0,240 L400,240 L400,300 L0,300Z" fill="#6a4a30"/>`),

    principal: () => wrap(`
      <rect width="400" height="300" fill="#5c3a2a"/>
      <rect x="120" y="20" width="160" height="50" fill="#f3ead5" stroke="#3a2418" stroke-width="5"/><text x="200" y="55" text-anchor="middle" font-size="26" font-weight="900" fill="#222">規律</text>
      ${rep(4, (i) => `<rect x="${20 + i * 30}" y="100" width="20" height="120" fill="#3d2618"/>`)}
      <rect x="40" y="220" width="320" height="80" fill="#3a2418"/><rect x="40" y="214" width="320" height="10" fill="#6a4a30"/>`),

    classroom: () => wrap(`
      <rect width="400" height="300" fill="#e9e2cf"/>
      <rect x="60" y="30" width="280" height="110" fill="#2d4a3a" stroke="#8a6d4a" stroke-width="6"/><text x="200" y="95" text-anchor="middle" font-size="22" fill="#eee">期末試験</text>
      ${rep(4, (i) => desk(10 + i * 100, 220, '#a8875c'))}`),

    laundry: () => wrap(`
      <rect width="400" height="300" fill="#cfd2d6"/>
      ${rep(3, (i) => `<rect x="${40 + i * 120}" y="90" width="90" height="140" rx="6" fill="#f2f2f2" stroke="#999" stroke-width="3"/><circle cx="${85 + i * 120}" cy="165" r="30" fill="#7ea8c9" stroke="#888" stroke-width="4"/>`)}
      <rect x="0" y="0" width="400" height="20" fill="#666"/><rect x="180" y="30" width="40" height="6" fill="#fff"/>
      <path d="M0,230 L400,230 L400,300 L0,300Z" fill="#8e9196"/>`),

    office: () => wrap(`
      <rect width="400" height="300" fill="#e7e9ec"/>
      ${rep(5, (i) => `<rect x="${10 + i * 78}" y="20" width="70" height="100" fill="#a9cbe6"/>`)}${buildings(120, '#7d93a8', '#d8e6f2')}
      <rect x="0" y="120" width="400" height="10" fill="#c7cbd1"/>
      <path d="M0,130 L400,130 L400,300 L0,300Z" fill="#d6d9de"/>
      ${desk(20, 200, '#8d9299')}${pc(40, 200)}${pc(92, 200)}${desk(250, 200, '#8d9299')}${pc(268, 200)}${pc(320, 200)}`),

    meeting: () => wrap(`
      <rect width="400" height="300" fill="#e3e4e6"/>
      <rect x="40" y="30" width="230" height="130" fill="#fbfbfb" stroke="#999" stroke-width="4"/>
      <text x="60" y="64" font-size="20" font-weight="900" fill="#d6312a">目標必達</text>
      <path d="M60,140 L110,120 L150,130 L200,90 L250,60" stroke="#2c6fb5" stroke-width="4" fill="none"/>
      <path d="M0,200 L400,200 L400,300 L0,300Z" fill="#b9bcc2"/><rect x="40" y="210" width="320" height="30" fill="#5d4a3a"/>`),

    callcenter: () => wrap(`
      <rect width="400" height="300" fill="#dadde2"/>
      <rect x="20" y="20" width="360" height="40" fill="#22252b"/><text x="200" y="48" text-anchor="middle" font-size="20" font-weight="900" fill="#f2d264">本日 300コール 必達</text>
      ${rep(3, (r) => rep(5, (i) => `<rect x="${20 + i * 76}" y="${100 + r * 60}" width="66" height="44" fill="#6f7784"/><rect x="${24 + i * 76}" y="${104 + r * 60}" width="58" height="18" fill="#aab3c0"/>`))}`),

    station: () => wrap(sky() + buildings(210, '#8e9aa8', '#eaf1f7') + `
      <rect x="120" y="120" width="160" height="90" fill="#cfd3d8"/><rect x="140" y="104" width="120" height="22" fill="#1f5ea8"/><text x="200" y="121" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">○○駅</text>
      <path d="M0,210 L400,210 L400,300 L0,300Z" fill="#a6a6a0"/>
      ${rep(9, (i) => `<circle cx="${20 + i * 45}" cy="${236 + (i % 2) * 10}" r="9" fill="#3a3a44"/><rect x="${12 + i * 45}" y="${244 + (i % 2) * 10}" width="16" height="40" rx="6" fill="#3a3a44"/>`)}`, skyDef('#b9d6ea', '#eef4f8')),

    house: () => wrap(sky() + `
      <rect x="10" y="110" width="110" height="140" fill="#cdc6b6"/><path d="M0,110 L65,70 L130,110Z" fill="#6b5a4a"/>
      <rect x="280" y="100" width="120" height="150" fill="#d3cfc4"/><path d="M270,100 L340,60 L410,100Z" fill="#5d5a55"/>
      <rect x="150" y="40" width="100" height="210" fill="#f2efe8" stroke="#9a948a" stroke-width="3"/><path d="M144,40 L200,14 L256,40Z" fill="#3e3a36"/>
      ${rep(3, (i) => `<rect x="168" y="${60 + i * 60}" width="26" height="30" fill="#8db3d0"/><rect x="206" y="${60 + i * 60}" width="26" height="30" fill="#8db3d0"/>`)}
      <rect x="160" y="236" width="40" height="14" fill="#666"/><path d="M0,250 L400,250 L400,300 L0,300Z" fill="#9c9c96"/>
      <text x="200" y="285" text-anchor="middle" font-size="12" fill="#333">敷地12坪・3階建て</text>`, skyDef('#9fd0f0', '#eef6fb')),

    rain: () => wrap(`
      <rect width="400" height="300" fill="#6c757f"/>${buildings(240, '#4e5761', '#8c96a0')}
      <rect x="140" y="120" width="120" height="120" fill="#3e444b"/><rect x="186" y="170" width="28" height="70" fill="#2b2f34"/><circle cx="230" cy="150" r="5" fill="#f2d264"/>
      <path d="M0,240 L400,240 L400,300 L0,300Z" fill="#555c63"/>
      ${rep(70, (i) => `<path d="M${rnd(i) * 420},${rnd(i + 7) * 300} l-6,18" stroke="#c9d3dd" stroke-width="1.4" opacity=".7"/>`)}`),

    bank: () => wrap(`
      <rect width="400" height="300" fill="#eef0f2"/>
      <rect x="0" y="0" width="400" height="40" fill="#1f5ea8"/><text x="200" y="27" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">住宅ローン相談窓口</text>
      ${rep(3, (i) => `<rect x="${30 + i * 120}" y="70" width="100" height="70" fill="#d7dde3"/><text x="${80 + i * 120}" y="110" text-anchor="middle" font-size="18" fill="#1f5ea8">${i + 1}</text>`)}
      <rect x="0" y="200" width="400" height="100" fill="#8aa0b6"/><rect x="0" y="196" width="400" height="8" fill="#5c7189"/>`),

    carshop: () => wrap(sky() + `
      <rect x="0" y="120" width="400" height="80" fill="#f0f0f0"/><rect x="0" y="100" width="400" height="26" fill="#e5533c"/><text x="200" y="120" text-anchor="middle" font-size="18" font-weight="900" fill="#fff">MEGA MOTOR</text>
      ${rep(8, (i) => `<path d="M${10 + i * 50},40 L${10 + i * 50},100" stroke="#999" stroke-width="2"/><path d="M${10 + i * 50},40 L${40 + i * 50},48 L${10 + i * 50},56Z" fill="${['#e5533c', '#f2d264', '#1f5ea8'][i % 3]}"/>`)}
      <path d="M0,200 L400,200 L400,300 L0,300Z" fill="#8f8f8a"/>
      ${[[40, '#d0d4da'], [160, '#c53b3b'], [280, '#2a2a2a']].map(([x, c]) => `<path d="M${x},250 L${x + 10},228 Q${x + 30},210 ${x + 60},212 L${x + 90},228 L${x + 100},250Z" fill="${c}"/><circle cx="${x + 22}" cy="252" r="10" fill="#222"/><circle cx="${x + 80}" cy="252" r="10" fill="#222"/>`).join('')}
      <path d="M380,200 L380,120" stroke="#6b4a2a" stroke-width="6"/><path d="M380,120 L366,96 M380,120 L392,100 M380,140 L362,128" stroke="#6b4a2a" stroke-width="3"/>`, skyDef('#9fd0f0', '#eef6fb')),

    factory: () => wrap(`
      <rect width="400" height="300" fill="#5a5f66"/>
      <path d="M0,0 L400,0 L400,40 L0,40Z" fill="#3e434a"/>${rep(6, (i) => `<rect x="${20 + i * 66}" y="10" width="40" height="18" fill="#e8f0ff" opacity=".6"/>`)}
      <rect x="80" y="150" width="240" height="14" fill="#f2d264"/><rect x="100" y="164" width="12" height="80" fill="#888"/><rect x="288" y="164" width="12" height="80" fill="#888"/>
      <path d="M120,150 L140,120 Q200,104 260,110 L290,150Z" fill="#c53b3b"/>
      <path d="M0,244 L400,244 L400,300 L0,300Z" fill="#444"/>${rep(8, (i) => `<rect x="${i * 50}" y="244" width="25" height="8" fill="#f2d264"/>`)}`),

    night_city: () => wrap(sky() + buildings(240, '#151a26', '#f2d264') + `<path d="M0,240 L400,240 L400,300 L0,300Z" fill="#0d1018"/>
      ${rep(6, (i) => `<circle cx="${30 + i * 70}" cy="260" r="3" fill="#ffefb0"/>`)}`, skyDef('#0b1026', '#2b2c4a')),

    hall: () => wrap(`
      <rect width="400" height="300" fill="#121418"/>
      <path d="M100,0 L60,180 L140,180Z" fill="#fff8d6" opacity=".12"/><path d="M300,0 L260,180 L340,180Z" fill="#fff8d6" opacity=".12"/>
      <rect x="0" y="60" width="400" height="30" fill="#7a1020"/><text x="200" y="82" text-anchor="middle" font-size="18" font-weight="900" fill="#f2d264">全社総決起大会</text>
      <rect x="0" y="180" width="400" height="20" fill="#3a2a1e"/><rect x="175" y="120" width="50" height="60" fill="#5a3d24"/>
      ${crowd(220, 70, ['#22252b', '#2c3038', '#1a1d22'])}`),

    home: () => wrap(`
      <rect width="400" height="300" fill="#e3d6b6"/>
      <rect x="20" y="30" width="120" height="120" fill="#f4efe2" stroke="#8a6d4a" stroke-width="6"/>${rep(3, (i) => `<path d="M${20 + i * 40},30 L${20 + i * 40},150" stroke="#8a6d4a" stroke-width="2"/>`)}
      <rect x="250" y="40" width="110" height="80" fill="#5a3d24"/><circle cx="305" cy="70" r="16" fill="#e5533c"/>
      <path d="M0,200 L400,200 L400,300 L0,300Z" fill="#b8b07a"/>
      <rect x="110" y="190" width="180" height="40" fill="#8a3a2a"/><rect x="100" y="180" width="200" height="14" fill="#5a3d24"/>
      <circle cx="160" cy="176" r="10" fill="#f28c38"/><circle cx="185" cy="176" r="10" fill="#f28c38"/>`),

    cafe: () => wrap(`
      <rect width="400" height="300" fill="#6a4a34"/>
      ${rep(5, (i) => `<rect x="${20 + i * 76}" y="40" width="56" height="80" fill="#f3c98a" opacity=".85"/>`)}
      ${rep(5, (i) => `<circle cx="${48 + i * 76}" cy="20" r="8" fill="#ffe2a0"/>`)}
      <rect x="0" y="180" width="400" height="30" fill="#3d2a1e"/><rect x="0" y="210" width="400" height="90" fill="#4e3626"/>
      <path d="M60,170 Q70,150 90,170Z M300,170 Q312,150 328,170Z" fill="#f4f0e6"/>`),

    izakaya: () => wrap(`
      <rect width="400" height="300" fill="#4a2a1e"/>
      ${rep(6, (i) => `<rect x="${10 + i * 66}" y="20" width="56" height="70" fill="#f3e3c0"/><text x="${38 + i * 66}" y="60" text-anchor="middle" font-size="12" fill="#7a1020">${['生', '焼鳥', '枝豆', '刺身', 'ハイ', '唐揚'][i]}</text>`)}
      ${rep(4, (i) => `<ellipse cx="${60 + i * 100}" cy="120" rx="16" ry="22" fill="#e5533c"/>`)}
      <rect x="0" y="190" width="400" height="110" fill="#6a3e28"/><rect x="40" y="184" width="320" height="14" fill="#8a5a38"/>
      <rect x="120" y="150" width="18" height="34" fill="#f2d264" opacity=".9"/><rect x="260" y="150" width="18" height="34" fill="#f2d264" opacity=".9"/>`),

    restaurant: () => wrap(`
      <rect width="400" height="300" fill="#1e1a24"/>
      ${buildings(170, '#14121a', '#f2d264')}
      <rect x="0" y="0" width="400" height="170" fill="#000" opacity=".25"/>
      <rect x="0" y="200" width="400" height="100" fill="#3a2a2a"/><ellipse cx="200" cy="210" rx="140" ry="16" fill="#f4efe6"/>
      <rect x="196" y="160" width="8" height="40" fill="#f2d264"/><circle cx="200" cy="156" r="5" fill="#ffcf7a"/>`),

    clinic: () => wrap(`
      <rect width="400" height="300" fill="#eef5f4"/>
      <rect x="0" y="0" width="400" height="36" fill="#5bb1a6"/><text x="200" y="25" text-anchor="middle" font-size="16" fill="#fff">受付</text>
      <rect x="40" y="70" width="80" height="90" fill="#cfe7e3"/><rect x="290" y="60" width="70" height="100" fill="#fff" stroke="#bbb" stroke-width="3"/>
      <rect x="0" y="190" width="400" height="110" fill="#d8e9e6"/><rect x="0" y="184" width="400" height="10" fill="#9cc9c1"/>`),

    mansion: () => wrap(sky() + `
      <rect x="0" y="130" width="400" height="130" fill="#7a6a58"/>${rep(16, (i) => `<rect x="${i * 25}" y="130" width="22" height="8" fill="#5a4a3a"/>`)}
      <rect x="150" y="110" width="100" height="150" fill="#3d2a1e"/><path d="M140,110 L200,80 L260,110Z" fill="#2a1d14"/>
      <rect x="160" y="130" width="38" height="130" fill="#5a3d24"/><rect x="202" y="130" width="38" height="130" fill="#5a3d24"/>
      <path d="M0,260 L400,260 L400,300 L0,300Z" fill="#9c9c96"/>`, skyDef('#9fb4c4', '#d7e2ea')),

    lounge: () => wrap(`
      <rect width="400" height="300" fill="#1b1a20"/>${buildings(180, '#0f0f14', '#e6c36a')}
      <rect x="0" y="180" width="400" height="120" fill="#2c2620"/>
      <path d="M40,230 Q40,200 80,200 L140,200 Q160,200 160,230Z" fill="#6a1f2a"/><path d="M240,230 Q240,200 280,200 L340,200 Q360,200 360,230Z" fill="#6a1f2a"/>
      <rect x="180" y="210" width="40" height="30" fill="#c9a24a"/>`),

    shotengai: () => wrap(`
      <rect width="400" height="300" fill="#cfc7b4"/>
      <path d="M0,0 L400,0 L400,30 Q200,60 0,30Z" fill="#8fa3b4" opacity=".7"/>
      ${rep(6, (i) => `<rect x="${i * 68}" y="70" width="64" height="140" fill="${['#b45a3c', '#d2a35a', '#5a7a8a', '#8a5a7a', '#6a8a5a', '#a87a4a'][i]}"/><rect x="${i * 68 + 6}" y="76" width="52" height="18" fill="#f3ead5"/>`)}
      <path d="M0,210 L400,210 L400,300 L0,300Z" fill="#9a9384"/>`),

    hospital: () => wrap(`
      <rect width="400" height="300" fill="#eef1f3"/>
      <rect x="250" y="30" width="120" height="100" fill="#cde4f2" stroke="#c9ccd0" stroke-width="6"/>
      <rect x="20" y="180" width="300" height="60" fill="#fff" stroke="#c9ccd0" stroke-width="4"/><rect x="20" y="160" width="60" height="30" fill="#fff" stroke="#c9ccd0" stroke-width="4"/>
      <path d="M340,120 L340,240" stroke="#aaa" stroke-width="3"/><rect x="326" y="120" width="28" height="36" rx="6" fill="#d8eef8" stroke="#aaa"/>`),

    beach: () => wrap(sky() + `<path d="M0,160 L400,150 L400,220 L0,230Z" fill="#3a7fb0"/><path d="M0,230 L400,220 L400,300 L0,300Z" fill="#e7d6a8"/>
      <circle cx="320" cy="120" r="24" fill="#ffe2a0"/>`, skyDef('#f2a46a', '#fbe0b4')),
  };

  window.RIFUZIN_BG = (key) => (BG[key] || BG.office)();
})();
