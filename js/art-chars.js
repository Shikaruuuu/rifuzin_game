// キャラクター立ち絵（バストアップ）をSVGで描く
// look: { skin, hair, hairC, outfit, oc, acc, female, old, glasses, shades, beard, mark }
// expr: normal / angry / shout / smile / sad / blush / smug / shock
(function () {
  const LINE = '#2a2320';
  const S = `stroke="${LINE}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const BODY = 'M28,360 Q34,282 112,262 L188,262 Q266,282 272,360Z';
  const FACE_M = 'M88,138 Q88,212 150,226 Q212,212 212,138 Q212,78 150,78 Q88,78 88,138Z';
  const FACE_F = 'M92,140 Q94,206 150,222 Q206,206 208,140 Q208,80 150,80 Q92,80 92,140Z';

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt)));
    const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // ---------- 髪（後ろ） ----------
  function hairBack(L) {
    const c = L.hairC;
    switch (L.hair) {
      case 'long': return `<path d="M68,150 Q62,52 150,48 Q238,52 232,150 L240,300 Q206,312 194,262 L106,262 Q94,312 60,300Z" fill="${c}" ${S}/>`;
      case 'bob': return `<path d="M74,150 Q70,56 150,54 Q230,56 226,150 L230,222 Q214,232 200,212 L100,212 Q86,232 70,222Z" fill="${c}" ${S}/>`;
      case 'pony': return `<path d="M210,96 Q262,110 252,190 Q246,236 226,256 Q236,200 214,150Z" fill="${c}" ${S}/>
        <path d="M80,150 Q74,58 150,54 Q226,58 220,150Z" fill="${c}" ${S}/>`;
      default: return '';
    }
  }

  // ---------- 髪（前） ----------
  function hairFront(L) {
    const c = L.hairC;
    switch (L.hair) {
      case 'bozu': return `<path d="M86,138 Q82,70 150,68 Q218,70 214,138 Q206,104 150,100 Q94,104 86,138Z" fill="${c}" opacity=".6"/>`;
      case 'short': return `<path d="M82,150 Q74,62 150,56 Q226,62 218,150 L208,118 Q192,100 174,112 L162,94 L142,112 L120,96 L104,116 L92,112Z" fill="${c}" ${S}/>`;
      case 'slick': return `<path d="M84,142 Q78,64 150,60 Q222,64 216,142 Q212,104 192,94 Q156,84 124,96 Q100,104 92,120Z" fill="${c}" ${S}/>
        <path d="M120,80 Q150,72 186,84" stroke="${shade(c, 50)}" stroke-width="3" fill="none"/>`;
      case 'side': return `<path d="M86,150 Q84,112 96,104 L102,140Z M214,150 Q216,112 204,104 L198,140Z" fill="${c}" ${S}/>
        <path d="M130,84 Q150,78 170,84" stroke="${c}" stroke-width="3" fill="none"/>`;
      case 'perm': {
        let s = '';
        const pts = [[96, 104], [112, 84], [134, 72], [158, 70], [180, 76], [200, 92], [210, 114], [88, 126], [212, 132], [124, 92], [148, 86], [172, 90], [192, 104]];
        pts.forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="14" fill="${c}" ${S}/>`));
        return s;
      }
      case 'cap': return `<path d="M84,132 Q82,62 150,58 Q218,62 216,132Z" fill="${L.acc}" ${S}/>
        <path d="M84,128 Q150,112 216,128 Q236,134 240,146 Q150,128 80,144Z" fill="${shade(L.acc, -30)}" ${S}/>
        ${L.mark ? `<text x="150" y="112" text-anchor="middle" font-family="'Dela Gothic One',sans-serif" font-size="26" fill="#fff">${L.mark}</text>` : ''}`;
      case 'long': return `<path d="M88,140 Q84,64 150,60 Q216,64 212,140 Q196,100 176,96 Q162,120 142,100 Q120,118 102,104 Q92,118 88,140Z" fill="${c}" ${S}/>`;
      case 'bob': return `<path d="M86,142 Q82,64 150,62 Q218,64 214,142 Q210,112 196,112 L104,112 Q90,112 86,142Z" fill="${c}" ${S}/>`;
      case 'pony': return `<path d="M88,138 Q86,66 150,62 Q214,66 212,138 Q200,104 180,100 Q156,116 136,102 Q112,114 98,108Z" fill="${c}" ${S}/>`;
      case 'bald': return `<path d="M88,150 Q86,120 94,112 L98,146Z M212,150 Q214,120 206,112 L202,146Z" fill="${c}"/>`;
      default: return '';
    }
  }

  // ---------- 服 ----------
  function outfit(L) {
    const oc = L.oc, acc = L.acc || '#b33';
    const body = (fill) => `<path d="${BODY}" fill="${fill}" ${S}/>`;
    switch (L.outfit) {
      case 'uniform': return body('#f4f3ee') +
        `<path d="M70,300 L70,360 M100,280 L100,360 M200,280 L200,360 M230,300 L230,360" stroke="${acc}" stroke-width="2" opacity=".25"/>
         <path d="M118,262 L150,304 L182,262Z" fill="${acc}" ${S}/>
         ${L.mark ? `<text x="150" y="346" text-anchor="middle" font-family="'Dela Gothic One',sans-serif" font-size="30" fill="${acc}">${L.mark}</text>` : ''}`;
      case 'gakuran': return body('#17181d') +
        `<rect x="120" y="248" width="60" height="24" rx="5" fill="#17181d" ${S}/>
         <circle cx="150" cy="300" r="5" fill="#d8b24a"/><circle cx="150" cy="336" r="5" fill="#d8b24a"/>`;
      case 'jersey': return body(oc) +
        `<path d="M50,330 Q78,284 118,266 M250,330 Q222,284 182,266" stroke="#fff" stroke-width="7" fill="none"/>
         <path d="M150,272 L150,360" stroke="${shade(oc, 60)}" stroke-width="3"/>
         <path d="M122,262 Q150,282 178,262" fill="none" stroke="${shade(oc, -40)}" stroke-width="6"/>`;
      case 'suit': return body(oc) +
        `<path d="M122,262 L150,332 L178,262Z" fill="#fbfbf8" ${S}/>
         <path d="M143,272 L157,272 L161,328 L150,344 L139,328Z" fill="${acc}" ${S}/>
         <path d="M112,264 L146,340 M188,264 L154,340" stroke="${shade(oc, -30)}" stroke-width="4" fill="none"/>`;
      case 'sailor': return body('#f7f7f4') +
        `<path d="M64,306 Q98,268 122,262 L150,322 L178,262 Q202,268 236,306 L204,322 L150,348 L96,322Z" fill="${oc}" ${S}/>
         <path d="M134,322 L150,332 L166,322 L160,350 L150,340 L140,350Z" fill="${acc}" ${S}/>`;
      case 'yukata': return body(oc) +
        `<path d="M118,262 L176,360" stroke="#f3eee3" stroke-width="10"/>
         <path d="M182,262 L140,334" stroke="#f3eee3" stroke-width="10"/>
         <circle cx="80" cy="320" r="10" fill="${acc}" opacity=".8"/><circle cx="222" cy="306" r="12" fill="${acc}" opacity=".8"/><circle cx="240" cy="346" r="8" fill="${acc}" opacity=".8"/>`;
      case 'blouse': return body('#fbfbf8') +
        `<path d="M60,360 Q66,300 110,272 L136,330 L150,360Z M240,360 Q234,300 190,272 L164,330 L150,360Z" fill="${oc}" ${S}/>
         <path d="M130,264 Q150,290 170,264 L162,300 L150,290 L138,300Z" fill="${acc}" ${S}/>`;
      case 'nurse': return body('#fdfbfc') +
        `<path d="M124,262 L150,300 L176,262" fill="none" stroke="${acc}" stroke-width="5"/>
         <rect x="190" y="300" width="34" height="24" rx="3" fill="#fff" stroke="${acc}" stroke-width="3"/>`;
      case 'apron': return body(oc) +
        `<path d="M100,300 L120,268 M200,300 L180,268" stroke="#f3eee3" stroke-width="8"/>
         <path d="M96,300 L204,300 L210,360 L90,360Z" fill="#f3eee3" ${S}/>`;
      case 'tsunagi': return body(oc) +
        `<path d="M118,262 L150,290 L182,262" fill="none" stroke="${shade(oc, -40)}" stroke-width="6"/>
         <path d="M150,290 L150,360" stroke="#ccc" stroke-width="3"/>
         <rect x="176" y="306" width="46" height="18" rx="2" fill="#fff" ${S}/>`;
      case 'casual':
      default: return body(oc) + `<path d="M120,262 Q150,286 180,262" fill="none" stroke="${shade(oc, -40)}" stroke-width="6"/>`;
    }
  }

  // ---------- 顔のパーツ ----------
  function eyes(L, e) {
    const dark = '#1d1a1a';
    const f = L.female;
    const ex = [124, 176], ey = 150;
    const iris = f ? '#4a2c22' : dark;
    let s = '';
    const brow = (pathL, pathR) => `<path d="${pathL}" ${S} stroke-width="${f ? 3.5 : 5}" fill="none" stroke="${L.hairC === '#f2f2f2' ? '#888' : shade(L.hairC, -10)}"/><path d="${pathR}" ${S} stroke-width="${f ? 3.5 : 5}" fill="none" stroke="${L.hairC === '#f2f2f2' ? '#888' : shade(L.hairC, -10)}"/>`;
    const open = (rx, ry) => ex.map((x) => `<ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${iris}"/><circle cx="${x + 2}" cy="${ey - 3}" r="${f ? 3 : 2}" fill="#fff"/>`).join('') +
      (f ? ex.map((x) => `<path d="M${x - 11},${ey - 8} Q${x},${ey - 15} ${x + 11},${ey - 8}" ${S} stroke-width="4" fill="none"/>`).join('') : '');
    const arcs = () => ex.map((x) => `<path d="M${x - 9},${ey + 2} Q${x},${ey - 9} ${x + 9},${ey + 2}" ${S} stroke-width="4" fill="none"/>`).join('');
    switch (e) {
      case 'angry':
      case 'shout':
        s += brow('M106,130 L140,144', 'M194,130 L160,144');
        s += ex.map((x) => `<path d="M${x - 9},${ey - 3} L${x + 9},${ey - 3} Q${x + 7},${ey + 8} ${x},${ey + 8} Q${x - 7},${ey + 8} ${x - 9},${ey - 3}Z" fill="${iris}"/>`).join('');
        break;
      case 'smile':
      case 'blush':
        s += brow('M110,134 Q124,126 138,134', 'M162,134 Q176,126 190,134');
        s += arcs();
        break;
      case 'sad':
        s += brow('M108,138 L138,130', 'M192,138 L162,130');
        s += open(f ? 7 : 5.5, f ? 9 : 7.5);
        s += `<path d="M184,162 Q180,172 184,178 Q190,172 184,162Z" fill="#9fd3f0"/>`;
        break;
      case 'smug':
        s += brow('M108,136 Q124,132 138,136', 'M162,128 Q176,122 190,130');
        s += ex.map((x) => `<path d="M${x - 9},${ey - 1} L${x + 9},${ey - 1} Q${x + 7},${ey + 8} ${x},${ey + 8} Q${x - 7},${ey + 8} ${x - 9},${ey - 1}Z" fill="${iris}"/><path d="M${x - 11},${ey - 2} L${x + 11},${ey - 2}" ${S} stroke-width="3.5"/>`).join('');
        break;
      case 'shock':
        s += brow('M108,128 Q124,120 138,128', 'M162,128 Q176,120 190,128');
        s += ex.map((x) => `<circle cx="${x}" cy="${ey}" r="10" fill="#fff" ${S}/><circle cx="${x}" cy="${ey}" r="3" fill="${dark}"/>`).join('');
        break;
      default:
        s += brow('M108,136 Q124,130 138,136', 'M162,136 Q176,130 192,136');
        s += open(f ? 7 : 5.5, f ? 10 : 8);
    }
    return s;
  }

  function mouth(L, e) {
    const lip = L.female ? '#c4566a' : LINE;
    switch (e) {
      case 'angry': return `<path d="M136,198 Q150,188 164,198" ${S} stroke="${lip}" fill="none"/>`;
      case 'shout': return `<path d="M128,188 Q150,182 172,188 Q170,216 150,218 Q130,216 128,188Z" fill="#5a1b1b" ${S}/><path d="M138,208 Q150,200 162,208 Q156,216 150,216 Q144,216 138,208Z" fill="#d0565c"/>`;
      case 'smile': return `<path d="M134,188 Q150,206 166,188Z" fill="#7a2626" ${S}/>`;
      case 'blush': return `<path d="M140,192 Q150,200 160,192" ${S} stroke="${lip}" fill="none"/>`;
      case 'sad': return `<path d="M138,200 Q150,192 162,200" ${S} stroke="${lip}" fill="none"/>`;
      case 'smug': return `<path d="M136,194 Q156,198 168,186" ${S} stroke="${lip}" fill="none"/>`;
      case 'shock': return `<ellipse cx="150" cy="198" rx="8" ry="10" fill="#5a1b1b" ${S}/>`;
      default: return `<path d="M140,194 Q150,198 160,194" ${S} stroke="${lip}" fill="none"/>`;
    }
  }

  function extras(L, e) {
    let s = '';
    if (e === 'blush' || (L.female && e === 'smile')) s += `<ellipse cx="114" cy="174" rx="12" ry="6" fill="#f08a9c" opacity=".55"/><ellipse cx="186" cy="174" rx="12" ry="6" fill="#f08a9c" opacity=".55"/>`;
    if (L.old) s += `<path d="M122,108 Q150,102 178,108 M128,118 Q150,113 172,118" stroke="${shade(L.skin, -50)}" stroke-width="2" fill="none"/><path d="M122,176 Q118,190 126,200 M178,176 Q182,190 174,200" stroke="${shade(L.skin, -45)}" stroke-width="2" fill="none"/>`;
    if (L.beard) s += `<path d="M104,178 Q108,222 150,228 Q192,222 196,178 Q180,206 150,208 Q120,206 104,178Z" fill="${L.hairC}" opacity=".35"/>`;
    if (L.mustache) s += `<path d="M130,182 Q150,174 170,182 Q160,188 150,184 Q140,188 130,182Z" fill="${L.hairC}"/>`;
    if (L.glasses) s += `<rect x="104" y="138" width="40" height="26" rx="8" fill="none" ${S}/><rect x="156" y="138" width="40" height="26" rx="8" fill="none" ${S}/><path d="M144,148 L156,148" ${S}/>`;
    if (L.shades) s += `<path d="M100,138 L146,138 L142,162 Q122,168 106,160Z M154,138 L200,138 L194,160 Q178,168 158,162Z" fill="#111" ${S}/><path d="M146,142 L154,142" ${S}/>`;
    if (e === 'angry' || e === 'shout') s += `<g transform="translate(206,86)" stroke="#d6312a" stroke-width="5" fill="none" stroke-linecap="round"><path d="M-12,-4 Q-4,-4 -4,-12"/><path d="M4,-12 Q4,-4 12,-4"/><path d="M12,4 Q4,4 4,12"/><path d="M-4,12 Q-4,4 -12,4"/></g>`;
    if (e === 'shock' || e === 'sad') s += `<path d="M214,110 Q206,124 214,132 Q222,124 214,110Z" fill="#9fd3f0" ${S} stroke-width="2"/>`;
    if (e === 'shout') s += `<path d="M40,120 L70,130 M34,160 L66,160 M40,200 L70,190 M260,120 L230,130 M266,160 L234,160 M260,200 L230,190" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  }

  function draw(look, expr) {
    const L = Object.assign({ skin: '#f2c9a8', hair: 'short', hairC: '#222', outfit: 'casual', oc: '#556', acc: '#b33' }, look);
    const e = expr || 'normal';
    const face = L.female ? FACE_F : FACE_M;
    return `<svg viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${hairBack(L)}
      ${outfit(L)}
      <path d="M128,200 L128,268 Q150,282 172,268 L172,200Z" fill="${shade(L.skin, -25)}" ${S}/>
      <ellipse cx="88" cy="152" rx="10" ry="15" fill="${L.skin}" ${S}/><ellipse cx="212" cy="152" rx="10" ry="15" fill="${L.skin}" ${S}/>
      <path d="${face}" fill="${L.skin}" ${S}/>
      ${hairFront(L)}
      ${eyes(L, e)}
      <path d="M150,164 L146,176 L152,177" fill="none" stroke="${shade(L.skin, -60)}" stroke-width="2.5" stroke-linecap="round"/>
      ${mouth(L, e)}
      ${extras(L, e)}
    </svg>`;
  }

  window.RIFUZIN_CHAR = draw;
})();
