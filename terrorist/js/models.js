// 学校にテロリスト — 3Dモデル（プリミティブの組み合わせ）
(function () {
  const mats = {};
  function mat(c, opts) {
    const k = c + (opts ? JSON.stringify(opts) : '');
    if (!mats[k]) mats[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, opts || {}));
    return mats[k];
  }
  const geos = {};
  function boxGeo(w, h, d) {
    const k = w + ',' + h + ',' + d;
    if (!geos[k]) geos[k] = new THREE.BoxGeometry(w, h, d);
    return geos[k];
  }
  function box(w, h, d, c, x, y, z) {
    const m = new THREE.Mesh(boxGeo(w, h, d), mat(c));
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }
  const sphereGeo = new THREE.SphereGeometry(1, 14, 10);
  function sphere(r, c, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(sphereGeo, mat(c));
    m.position.set(x || 0, y || 0, z || 0);
    m.scale.set(r * (sx || 1), r * (sy || 1), r * (sz || 1));
    return m;
  }

  const SKIN = 0xf1c7a0;

  // 人型。o: { top, pants, sleeve, hair, skirt, kind }
  function human(o) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);

    const mkLeg = (x) => {
      const p = new THREE.Group();
      p.position.set(x, 0.72, 0);
      if (o.skirt) {
        p.add(box(0.12, 0.5, 0.13, SKIN, 0, -0.42, 0));
        p.add(box(0.13, 0.22, 0.14, 0x1b1d2a, 0, -0.6, 0)); // ハイソックス
      } else {
        p.add(box(0.15, 0.68, 0.17, o.pants, 0, -0.34, 0));
      }
      p.add(box(0.15, 0.08, 0.24, o.shoes || 0x222222, 0, -0.69, 0.04));
      body.add(p);
      return p;
    };
    const legL = mkLeg(-0.1), legR = mkLeg(0.1);

    const torso = box(0.44, 0.56, 0.26, o.top, 0, 1.0, 0);
    body.add(torso);
    if (o.skirt) {
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.3, 10), mat(o.skirt));
      sk.position.y = 0.66;
      body.add(sk);
      // セーラー襟とスカーフ
      body.add(box(0.46, 0.08, 0.22, 0xf4f4f4, 0, 1.25, -0.03));
      body.add(box(0.12, 0.14, 0.04, 0xd8303a, 0, 1.12, 0.15));
    } else if (o.kind === 'gakuran') {
      body.add(box(0.45, 0.06, 0.27, 0xffffff, 0, 1.3, 0)); // カラー
      for (let i = 0; i < 4; i++) body.add(box(0.04, 0.04, 0.02, 0xd8b04a, 0, 1.2 - i * 0.12, 0.135));
    } else if (o.kind === 'terror') {
      body.add(box(0.48, 0.38, 0.3, o.vest || 0x2b2e22, 0, 1.03, 0)); // ベスト
      body.add(box(0.1, 0.14, 0.06, 0x3a3d2c, -0.12, 0.95, 0.16));
      body.add(box(0.1, 0.14, 0.06, 0x3a3d2c, 0.12, 0.95, 0.16));
    }

    const mkArm = (x) => {
      const p = new THREE.Group();
      p.position.set(x, 1.24, 0);
      p.add(box(0.12, 0.52, 0.13, o.sleeve || o.top, 0, -0.25, 0));
      p.add(box(0.1, 0.1, 0.1, o.glove || SKIN, 0, -0.55, 0));
      body.add(p);
      return p;
    };
    const armL = mkArm(-0.29), armR = mkArm(0.29);

    const head = new THREE.Group();
    head.position.y = 1.47;
    body.add(head);
    if (o.kind === 'terror') {
      head.add(sphere(0.17, 0x151515, 0, 0, 0, 1, 1.08, 1));
      head.add(box(0.24, 0.06, 0.05, SKIN, 0, 0.02, 0.15));
      head.add(box(0.05, 0.03, 0.02, 0x111111, -0.05, 0.02, 0.18));
      head.add(box(0.05, 0.03, 0.02, 0x111111, 0.05, 0.02, 0.18));
      if (o.boss) {
        head.add(sphere(0.19, 0x7a1414, 0.02, 0.1, -0.01, 1, 0.45, 1.05)); // ベレー帽
      }
    } else {
      head.add(sphere(0.17, SKIN, 0, 0, 0));
      head.add(box(0.03, 0.04, 0.02, 0x222222, -0.06, 0.01, 0.16));
      head.add(box(0.03, 0.04, 0.02, 0x222222, 0.06, 0.01, 0.16));
      head.add(sphere(0.185, o.hair, 0, 0.05, -0.03, 1, 0.9, 1));
      if (o.longHair) head.add(box(0.32, 0.42, 0.1, o.hair, 0, -0.18, -0.13));
    }

    let gun = null;
    if (o.kind === 'terror') {
      gun = new THREE.Group();
      gun.add(box(0.07, 0.1, 0.62, 0x1a1a1a, 0, 0, 0.1));
      gun.add(box(0.05, 0.16, 0.06, 0x1a1a1a, 0, -0.1, -0.02));
      gun.position.set(0.12, 1.02, 0.2);
      body.add(gun);
      armL.rotation.x = -1.0; armL.rotation.z = -0.5;
      armR.rotation.x = -0.9;
    }

    // 足元の影
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    g.add(shadow);

    if (o.scale) body.scale.setScalar(o.scale);

    const parts = { group: g, body, legL, legR, armL, armR, head, gun, kind: o.kind, armPose: [armL.rotation.x, armR.rotation.x], walkT: Math.random() * 6 };
    return parts;
  }

  // ポーズ。mode: 'stand' | 'crouch' | 'sit' | 'down' | 'tied'
  function pose(p, mode, moving, dt, speed) {
    const b = p.body;
    p.walkT += dt * (speed || 6);
    const s = moving ? Math.sin(p.walkT) : 0;
    b.rotation.set(0, 0, 0);
    b.position.set(0, 0, 0);
    if (mode === 'stand') {
      p.legL.rotation.x = s * 0.6; p.legR.rotation.x = -s * 0.6;
      if (p.kind === 'terror') {
        p.armL.rotation.x = p.armPose[0]; p.armR.rotation.x = p.armPose[1];
      } else {
        p.armL.rotation.x = -s * 0.5; p.armR.rotation.x = s * 0.5;
        p.armL.rotation.z = 0; p.armR.rotation.z = 0;
      }
      b.position.y = moving ? Math.abs(Math.cos(p.walkT)) * 0.04 : 0;
    } else if (mode === 'crouch') {
      b.position.y = -0.36;
      b.rotation.x = 0.25;
      p.legL.rotation.x = -1.25 + s * 0.3; p.legR.rotation.x = -1.25 - s * 0.3;
      if (p.kind !== 'terror') { p.armL.rotation.x = -0.6 + s * 0.3; p.armR.rotation.x = -0.6 - s * 0.3; }
    } else if (mode === 'sit') {
      b.position.y = -0.5;
      p.legL.rotation.x = -1.5; p.legR.rotation.x = -1.5;
      p.armL.rotation.x = 0.45; p.armR.rotation.x = 0.45;
      p.armL.rotation.z = 0.15; p.armR.rotation.z = -0.15;
    } else if (mode === 'down' || mode === 'tied') {
      b.rotation.x = -Math.PI / 2;
      b.position.y = 0.16;
      b.position.z = 0.75;
      p.legL.rotation.x = 0.1; p.legR.rotation.x = -0.1;
      p.armL.rotation.x = mode === 'tied' ? 0.3 : -2.6;
      p.armR.rotation.x = mode === 'tied' ? 0.3 : -2.4;
    }
  }

  function player() {
    return human({ kind: 'gakuran', top: 0x1a1d29, pants: 0x1a1d29, hair: 0x15110e });
  }
  function terrorist(boss) {
    return human({
      kind: 'terror', boss, top: boss ? 0x2a2a2a : 0x4a4f3a, pants: boss ? 0x222222 : 0x3c3f33,
      vest: boss ? 0x5c1515 : 0x2b2e22, glove: 0x111111, shoes: 0x111111, scale: boss ? 1.18 : 1.1,
    });
  }
  function girl() {
    return human({ kind: 'sailor', top: 0x1c2747, sleeve: 0x1c2747, skirt: 0x1c2747, hair: 0x2b1a12, longHair: true, shoes: 0x3a2618 });
  }
  const HAIRS = [0x15110e, 0x2b1a12, 0x3a2a1c, 0x1d1712, 0x4a3320];
  function student(i) {
    const hair = HAIRS[i % HAIRS.length];
    if (i % 2) return human({ kind: 'sailor', top: 0x1c2747, sleeve: 0x1c2747, skirt: 0x1c2747, hair, longHair: i % 4 === 1, shoes: 0x3a2618 });
    return human({ kind: 'gakuran', top: 0x1a1d29, pants: 0x1a1d29, hair });
  }

  // ダンボール
  function cardboard() {
    const g = new THREE.Group();
    g.add(box(0.8, 0.72, 0.66, 0xb48a52, 0, 0.36, 0));
    g.add(box(0.81, 0.08, 0.2, 0xd8c08a, 0, 0.72, 0));
    g.add(box(0.3, 0.2, 0.01, 0x7a5a30, 0, 0.42, 0.335));
    return g;
  }

  // アイテムのモデル
  function item(type) {
    const g = new THREE.Group();
    if (type === 'chalk') {
      g.add(box(0.3, 0.12, 0.18, 0xf5f2e6, 0, 0.06, 0));
      g.add(box(0.06, 0.06, 0.2, 0xe5533c, -0.06, 0.15, 0));
      g.add(box(0.06, 0.06, 0.2, 0xf2d264, 0.06, 0.15, 0));
    } else if (type === 'ext') {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), mat(0xd42a20));
      c.position.y = 0.25; g.add(c);
      g.add(box(0.08, 0.08, 0.2, 0x222222, 0, 0.52, 0.06));
    } else if (type === 'med') {
      g.add(box(0.34, 0.22, 0.24, 0xf5f5f5, 0, 0.11, 0));
      g.add(box(0.2, 0.06, 0.02, 0xd42a20, 0, 0.12, 0.125));
      g.add(box(0.06, 0.18, 0.02, 0xd42a20, 0, 0.12, 0.125));
    } else if (type === 'key') {
      g.add(box(0.06, 0.04, 0.24, 0xf2c94c, 0, 0.1, 0));
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), mat(0xf2c94c));
      r.position.set(0, 0.1, -0.16); r.rotation.x = Math.PI / 2; g.add(r);
      g.add(box(0.06, 0.04, 0.06, 0xf2c94c, 0.04, 0.1, 0.1));
    } else if (type === 'box') {
      g.add(box(0.6, 0.12, 0.5, 0xb48a52, 0, 0.06, 0));
    } else if (type === 'tape') {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.05, 8, 16), mat(0xc9b48a));
      t.rotation.x = Math.PI / 2; t.position.y = 0.06; g.add(t);
    } else if (type === 'stun') {
      g.add(box(0.12, 0.08, 0.3, 0x222222, 0, 0.06, 0));
      g.add(box(0.1, 0.04, 0.06, 0x4aa8ff, 0, 0.11, 0.12));
    } else if (type === 'gun' || type === 'ammo') {
      g.add(box(0.06, 0.12, 0.28, 0x2a2a2a, 0, 0.12, 0));
      g.add(box(0.05, 0.14, 0.06, 0x2a2a2a, 0, 0.04, -0.08));
    }
    return g;
  }

  // ラベルスプライト（!、? など）
  const spriteCache = {};
  function labelTexture(text, color, size) {
    const k = text + color + size;
    if (spriteCache[k]) return spriteCache[k];
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    x.font = '900 ' + (size || 96) + 'px "Dela Gothic One", "Zen Kaku Gothic New", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 14; x.strokeStyle = 'rgba(0,0,0,.85)';
    x.strokeText(text, 128, 66);
    x.fillStyle = color; x.fillText(text, 128, 66);
    const t = new THREE.CanvasTexture(c);
    spriteCache[k] = t;
    return t;
  }
  function label(text, color, size, scale) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(text, color, size), depthTest: false, transparent: true }));
    s.scale.set(1.2 * (scale || 1), 0.6 * (scale || 1), 1);
    s.renderOrder = 10;
    return s;
  }
  function setLabel(s, text, color, size) {
    s.material.map = labelTexture(text, color, size);
    s.material.needsUpdate = true;
  }

  // 部屋の札
  function plate(text) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#f4efe1'; x.fillRect(0, 0, 256, 64);
    x.strokeStyle = '#3a3226'; x.lineWidth = 6; x.strokeRect(3, 3, 250, 58);
    x.fillStyle = '#1f1a12';
    x.font = '700 36px "Zen Kaku Gothic New", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 128, 34);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({ map: t }));
    return m;
  }

  TG.models = { mat, box, sphere, human, pose, player, terrorist, girl, student, cardboard, item, label, setLabel, plate };
})();
