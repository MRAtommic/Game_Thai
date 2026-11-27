import * as THREE from 'three';

/** Creates a weathered painted Ayutthaya wooden signboard texture. */
export function makeAyutthayaSignTex(
  bgHex: string,
  borderHex: string,
  textHex: string,
  title: string,
  subtitle?: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 144;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 144);
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 128);
  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.font = '700 34px "Noto Serif Thai", "IBM Plex Sans Thai", sans-serif';
  ctx.fillText(title, 256, subtitle ? 64 : 84, 468);
  if (subtitle) {
    ctx.font = '500 22px "IBM Plex Sans Thai", sans-serif';
    ctx.fillText(subtitle, 256, 108, 468);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Creates an ancient Ayutthaya red-orange brick wall texture. */
export function makeAyutthayaBrickTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#5c261b';
  ctx.fillRect(0, 0, 256, 256);
  const brickCols = ['#8c3826', '#7b3020', '#9a412d', '#6e2a1d', '#a34932'];
  const rowH = 16;
  const brickW = 36;
  for (let row = 0; row < 16; row++) {
    const off = (row % 2) * (brickW / 2);
    for (let col = -1; col < 9; col++) {
      ctx.fillStyle = brickCols[(row * 5 + col + 9) % brickCols.length];
      ctx.fillRect(col * brickW + off + 1, row * rowH + 1, brickW - 2, rowH - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Adds an Ayutthaya period 3D villager/soldier/bandit/zombie figure (+Z forward). */
export function makeAyutthayaFigure(
  shirtCol: string,
  jongCol: string,
  options?: { headbandCol?: string; hatCol?: string; isMonk?: boolean; isZombie?: boolean; hasSword?: boolean }
): THREE.Group {
  const g = new THREE.Group();
  const skinCol = options?.isZombie ? '#6b705c' : '#b8825a';
  const skinMat = new THREE.MeshStandardMaterial({ color: skinCol, roughness: 0.78 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtCol, roughness: 0.8 });
  const jongMat = new THREE.MeshStandardMaterial({ color: jongCol, roughness: 0.85 });

  // Pivoted legs
  const legL = new THREE.Group();
  legL.name = 'legL';
  legL.position.set(-0.08, 0.56, 0);
  const legLM = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.54, 7), skinMat);
  legLM.position.y = -0.27;
  legL.add(legLM);

  const legR = new THREE.Group();
  legR.name = 'legR';
  legR.position.set(0.08, 0.56, 0);
  const legRM = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.54, 7), skinMat);
  legRM.position.y = -0.27;
  legR.add(legRM);
  g.add(legL, legR);

  // Jong Kraben & Torso
  const jong = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.34, 8), jongMat);
  jong.position.y = 0.68;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.44, 8), shirtMat);
  torso.position.y = 1.04;
  g.add(jong, torso);

  // Pivoted arms
  const armL = new THREE.Group();
  armL.name = 'armL';
  armL.position.set(-0.2, 1.22, 0);
  const armLM = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.44, 7), skinMat);
  armLM.position.y = -0.22;
  armL.add(armLM);

  const armR = new THREE.Group();
  armR.name = 'armR';
  armR.position.set(0.2, 1.22, 0);
  const armRM = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.44, 7), skinMat);
  armRM.position.y = -0.22;
  armR.add(armRM);
  if (options?.hasSword) {
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: '#eab308' }));
    hilt.position.set(0, -0.42, 0.05);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.58, 0.06), new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.7, roughness: 0.25 }));
    blade.position.set(0, -0.42, 0.34);
    blade.rotation.x = Math.PI / 2.2;
    armR.add(hilt, blade);
  }
  g.add(armL, armR);

  // Head & eyes (+Z face)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 8), skinMat);
  head.position.y = 1.44;
  g.add(head);

  if (!options?.isMonk) {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.54),
      new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 })
    );
    hair.position.y = 1.46;
    g.add(hair);
  }
  if (options?.headbandCol) {
    const hb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.153, 0.153, 0.045, 10),
      new THREE.MeshStandardMaterial({ color: options.headbandCol, roughness: 0.7 })
    );
    hb.position.y = 1.49;
    g.add(hb);
  }
  if (options?.hatCol) {
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.13, 10),
      new THREE.MeshStandardMaterial({ color: options.hatCol, roughness: 0.85 })
    );
    hat.position.y = 1.59;
    g.add(hat);
  }

  const eyeCol = options?.isZombie ? '#ef4444' : '#111827';
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeCol });
  [-0.05, 0.05].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eye.position.set(ex, 1.45, 0.13);
    g.add(eye);
  });

  if (options?.isZombie) {
    torso.rotation.x = 0.24;
    head.rotation.x = -0.15;
    armL.rotation.x = -1.15;
    armR.rotation.x = -1.15;
  }

  return g;
}

/** Builds a sculpted hollow Thai wooden rowing boat with benches, oil lantern, and optional rower. */
export function makeAyutthayaBoat(length = 4.2, withRower = false, rowerShirt = '#d97706'): {
  group: THREE.Group;
  oarL?: THREE.Group;
  oarR?: THREE.Group;
} {
  const g = new THREE.Group();
  const darkWood = new THREE.MeshStandardMaterial({ color: '#452613', roughness: 0.85 });
  const plankWood = new THREE.MeshStandardMaterial({ color: '#6e3d20', roughness: 0.8 });

  // Hollow boat hull: flat keel, curved planked sides, tapered front & stern decks
  const floor = new THREE.Mesh(new THREE.BoxGeometry(length * 0.72, 0.08, 0.96), darkWood);
  floor.position.y = 0.08;
  g.add(floor);

  [-0.48, 0.48].forEach((sz) => {
    const gunwale = new THREE.Mesh(new THREE.BoxGeometry(length * 0.76, 0.28, 0.07), plankWood);
    gunwale.position.set(0, 0.22, sz);
    g.add(gunwale);
  });

  [-1, 1].forEach((endDir) => {
    const prowDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.48, length * 0.26, 4), plankWood);
    prowDeck.rotation.z = endDir * (Math.PI / 2);
    prowDeck.rotation.x = Math.PI / 4;
    prowDeck.scale.set(0.65, 1, 1.08);
    prowDeck.position.set(endDir * (length * 0.46), 0.24, 0);
    g.add(prowDeck);
  });

  // Wooden cross-thwart benches inside hull
  [-0.85, 0, 0.85].forEach((bx) => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.94), darkWood);
    seat.position.set(bx, 0.26, 0);
    g.add(seat);
  });

  // Hanging brass oil lantern mounted directly on bow post
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 6), darkWood);
  pole.position.set(length * 0.34, 0.52, 0);
  const lanternBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.06, 0.14, 8),
    new THREE.MeshBasicMaterial({ color: '#fde68a' })
  );
  lanternBody.position.set(length * 0.34, 0.82, 0);
  g.add(pole, lanternBody);

  let oarL: THREE.Group | undefined;
  let oarR: THREE.Group | undefined;
  if (withRower) {
    const rower = makeAyutthayaFigure(rowerShirt, '#1e293b', { hatCol: '#ca8a04' });
    rower.position.set(-0.2, -0.32, 0);
    rower.rotation.y = Math.PI / 2; // face bow (+X)
    g.add(rower);

    oarL = new THREE.Group();
    oarL.position.set(0.1, 0.34, 0.52);
    const shaftL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.55, 6), darkWood);
    shaftL.position.set(0, -0.48, 0.25);
    shaftL.rotation.x = 0.52;
    const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.025), plankWood);
    bladeL.position.set(0, -1.02, 0.56);
    bladeL.rotation.x = 0.52;
    oarL.add(shaftL, bladeL);
    g.add(oarL);

    oarR = oarL.clone();
    oarR.position.set(0.1, 0.34, -0.52);
    oarR.scale.z = -1;
    g.add(oarR);
  }

  return { group: g, oarL, oarR };
}

/** Places lush Ayutthaya Bodhi trees, coconut palms, bamboo groves, and mango trees across the 250m map. */
export function buildAyutthayaFoliage(scene: THREE.Scene): void {
  const leafDark = new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.9 });
  const leafMid = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.88 });
  const leafBright = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.86 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#452918', roughness: 0.92 });

  // Sacred Bodhi Trees (ต้นโพธิ์ร่มรื่น)
  const bodhiXs = [-116, -98, -74, -56, -24, 2, 34, 42, 68, 86, 108];
  bodhiXs.forEach((bx, idx) => {
    const grp = new THREE.Group();
    grp.position.set(bx, 0, idx % 2 === 0 ? -4.8 : -4.2);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.52, 3.8, 8), trunkMat);
    trunk.position.y = 1.9;
    grp.add(trunk);
    [
      [0, 4.4, 0, 1.85],
      [-1.15, 3.8, 0.2, 1.35],
      [1.15, 3.9, -0.15, 1.35],
      [0, 5.25, 0, 1.25],
    ].forEach(([cx, cy, cz, rad], ci) => {
      const canopy = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rad, 0),
        ci % 2 === 0 ? leafDark : leafMid
      );
      canopy.scale.set(1.25, 0.78, 1.05);
      canopy.position.set(cx, cy, cz);
      grp.add(canopy);
    });
    scene.add(grp);
  });

  // Distant Ayutthaya Horizon: Temple spires & lush dark tree line (fills background sky naturally!)
  const horizonMat = new THREE.MeshStandardMaterial({ color: '#1b2824', roughness: 0.95 });
  const distantPrangMat = new THREE.MeshStandardMaterial({ color: '#3b2419', roughness: 0.92 });
  for (let hx = -126; hx <= 126; hx += 9) {
    const mound = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2 + (Math.abs(hx) % 3) * 0.7, 0), horizonMat);
    mound.scale.set(1.6, 0.75, 0.9);
    mound.position.set(hx, 1.3, -10.5);
    scene.add(mound);
    if (Math.abs(hx) % 27 === 0) {
      const chedi = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.8, 8), distantPrangMat);
      chedi.position.set(hx + 2.5, 4.2, -12.0);
      scene.add(chedi);
    }
  }

  // Canal-bank Coconut Palms with natural arched drooping fronds + coconut clusters!
  const palmXs = [-122, -104, -86, -64, -38, -14, 18, 48, 76, 104, 120];
  palmXs.forEach((px, idx) => {
    const grp = new THREE.Group();
    grp.position.set(px, 0, idx % 2 === 0 ? -1.4 : 2.35);
    const h = 4.4 + (idx % 3) * 0.65;
    const tilt = idx % 2 === 0 ? 0.08 : -0.07;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.19, h, 7), trunkMat);
    stem.position.y = h / 2;
    stem.rotation.z = tilt;
    grp.add(stem);

    // Compute exact crown apex from trunk lean
    const crown = new THREE.Group();
    crown.position.set(-Math.sin(tilt) * h * 0.5, Math.cos(tilt) * h, 0);
    // Cluster of coconuts at crown base
    [[-0.12, -0.1, 0.08], [0.12, -0.1, -0.06], [0, -0.14, 0.12]].forEach(([cx, cy, cz]) => {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), leafDark);
      nut.position.set(cx, cy, cz);
      crown.add(nut);
    });
    // 7 gracefully arching palm fronds (inner rising arch + drooping leaf tip!)
    for (let f = 0; f < 7; f++) {
      const ang = (f / 7) * Math.PI * 2;
      const frondGrp = new THREE.Group();
      frondGrp.rotation.y = ang;
      const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.9), leafBright);
      seg1.position.set(0, 0.12, 0.44);
      seg1.rotation.x = -0.22;
      const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.95), leafMid);
      seg2.position.set(0, -0.02, 1.25);
      seg2.rotation.x = 0.48;
      frondGrp.add(seg1, seg2);
      crown.add(frondGrp);
    }
    grp.add(crown);
    scene.add(grp);
  });

  // Canal lotus pads & pink lotus flowers drifting along shallow water edge
  for (let lx = -118; lx <= 118; lx += 7.5) {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.02, 8),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.75 })
    );
    pad.position.set(lx, -0.2, 3.35 + (Math.abs(lx) % 2) * 0.4);
    scene.add(pad);
    if (Math.floor(lx) % 2 === 0) {
      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 6), new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.5 }));
      bloom.rotation.x = Math.PI;
      bloom.position.set(lx + 0.08, -0.12, pad.position.z);
      scene.add(bloom);
    }
  }

  // Dense Bamboo Clusters (กอไผ่รอบป่าช้าและท้ายหมู่บ้าน)
  [-68, -28, 36, 84, 92, 106, 114].forEach((bx, idx) => {
    const grp = new THREE.Group();
    grp.position.set(bx, 0, idx % 2 === 0 ? -3.7 : -4.4);
    for (let c = 0; c < 5; c++) {
      const culm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.065, 3.6 + (c % 3) * 0.65, 6),
        leafBright
      );
      culm.position.set((c - 2) * 0.16, 1.85, (c % 2) * 0.14);
      culm.rotation.z = (c - 2) * 0.07;
      grp.add(culm);
      const tuft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), leafMid);
      tuft.position.set((c - 2) * 0.22, 3.65 + (c % 2) * 0.45, (c % 2) * 0.14);
      grp.add(tuft);
    }
    scene.add(grp);
  });
}
