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
  ctx.font = '700 33px "Noto Serif Thai", "IBM Plex Sans Thai", sans-serif';
  ctx.fillText(title, 256, subtitle ? 64 : 84, 468);
  if (subtitle) {
    ctx.font = '500 22px "IBM Plex Sans Thai", sans-serif';
    ctx.fillText(subtitle, 256, 108, 468);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Creates a detailed weathered Ayutthaya Siamese brick & mortar wall texture. */
export function makeAyutthayaBrickTex(repeatX = 12, repeatY = 3): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#4a2016';
  ctx.fillRect(0, 0, 256, 256);
  const brickCols = ['#9c432b', '#873521', '#ad4d34', '#752b1a', '#b85b3f', '#6b291b'];
  const rowH = 16;
  const brickW = 32;
  for (let row = 0; row < 16; row++) {
    const off = (row % 2) * (brickW / 2);
    for (let col = -1; col < 10; col++) {
      const x = col * brickW + off;
      const y = row * rowH;
      ctx.fillStyle = brickCols[(row * 7 + col * 3 + 16) % brickCols.length];
      ctx.fillRect(x + 1, y + 1, brickW - 2, rowH - 2);
      // Subtle top highlight & bottom shadow for 3D brick relief
      ctx.fillStyle = 'rgba(255, 224, 194, 0.14)';
      ctx.fillRect(x + 1, y + 1, brickW - 2, 2);
      ctx.fillStyle = 'rgba(20, 8, 4, 0.22)';
      ctx.fillRect(x + 1, y + rowH - 3, brickW - 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Creates an authentic scalloped Siamese terracotta/glazed roof-tile texture with ribbed depth. */
export function makeAyutthayaRoofTex(baseHex = '#991b1b', highlightHex = '#dc2626', borderHex = '#15803d'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  // Horizontal overlapping tile courses
  for (let row = 0; row < 16; row++) {
    const y = row * 16;
    ctx.fillStyle = row >= 13 ? borderHex : row % 2 === 0 ? baseHex : highlightHex;
    ctx.fillRect(0, y, 256, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, y + 14, 256, 2);
    for (let col = 0; col < 16; col++) {
      ctx.fillStyle = 'rgba(255,245,220,0.12)';
      ctx.fillRect(col * 16 + (row % 2) * 8, y, 2, 14);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Creates an Ayutthaya kingdom ground texture blending lush grass lawns with red-ochre royal avenue & stone curbing. */
export function makeAyutthayaGroundTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  // Top rear half: lush tropical courtyard lawns
  const lawnGrad = ctx.createLinearGradient(0, 0, 0, 128);
  lawnGrad.addColorStop(0, '#365314');
  lawnGrad.addColorStop(1, '#4d7c0f');
  ctx.fillStyle = lawnGrad;
  ctx.fillRect(0, 0, 512, 130);
  // Middle royal thoroughfare: warm compacted terracotta/laterite avenue
  const roadGrad = ctx.createLinearGradient(0, 124, 0, 224);
  roadGrad.addColorStop(0, '#7c4d32');
  roadGrad.addColorStop(0.5, '#8c5a3c');
  roadGrad.addColorStop(1, '#6b4228');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, 124, 512, 102);
  // Crisp stone curbstones & brick paver hints along road edges
  ctx.fillStyle = '#d6cfc2';
  ctx.fillRect(0, 122, 512, 5);
  ctx.fillStyle = '#5c3721';
  ctx.fillRect(0, 224, 512, 32);
  // Subtle organic speckles for texture realism
  for (let i = 0; i < 450; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,240,210,0.06)' : 'rgba(20,15,10,0.08)';
    ctx.fillRect((i * 73) % 512, (i * 41) % 256, 5, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(22, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Builds an authentic pitched multi-tier Siamese roof with recessed golden gables, Pan Lom bargeboards & Chofa horns. */
export function buildThaiTieredRoof(
  parent: THREE.Object3D,
  x: number,
  baseY: number,
  z: number,
  width: number,
  depth: number,
  roofMat: THREE.Material,
  goldMat: THREE.Material,
  trimMat: THREE.Material,
  tiers = 2
): void {
  const grp = new THREE.Group();
  grp.position.set(x, baseY, z);
  for (let t = 0; t < tiers; t++) {
    const scale = 1 - t * 0.24;
    const w = width * scale;
    const d = depth * (1 - t * 0.22);
    const yOff = t * (0.58 + depth * 0.08);
    const slopeHalfD = d * 0.34;
    const pitch = 0.56 - t * 0.04;
    const slopeLen = d * 0.58;

    const frontSlope = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, slopeLen), roofMat);
    frontSlope.position.set(0, yOff + slopeHalfD * 0.42, slopeHalfD * 0.55);
    frontSlope.rotation.x = pitch;

    const backSlope = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, slopeLen), roofMat);
    backSlope.position.set(0, yOff + slopeHalfD * 0.42, -slopeHalfD * 0.55);
    backSlope.rotation.x = -pitch;

    // Green/gold lower eave fascia trim
    const fasciaF = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.09, 0.14), trimMat);
    fasciaF.position.set(0, yOff - 0.02, slopeHalfD * 1.15);
    const fasciaB = fasciaF.clone();
    fasciaB.position.z = -slopeHalfD * 1.15;

    // Golden ridge crest & Pan Lom bargeboards at left/right gable ends
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.14, 0.18), goldMat);
    ridge.position.set(0, yOff + slopeHalfD * 0.85, 0);

    grp.add(frontSlope, backSlope, fasciaF, fasciaB, ridge);

    [-w * 0.48, w * 0.48].forEach((gx) => {
      const gable = new THREE.Mesh(new THREE.ConeGeometry(d * 0.35, slopeHalfD * 0.95, 4), goldMat);
      gable.rotation.y = Math.PI / 4;
      gable.scale.set(0.14, 1, 1.38);
      gable.position.set(gx, yOff + slopeHalfD * 0.42, 0);

      const chofa = new THREE.Mesh(new THREE.ConeGeometry(0.12 * scale, 0.85 * scale, 6), goldMat);
      chofa.position.set(gx * 1.06, yOff + slopeHalfD * 0.85 + 0.36 * scale, 0);
      chofa.rotation.z = gx > 0 ? -0.32 : 0.32;
      grp.add(gable, chofa);
    });
  }
  parent.add(grp);
}

/** Helper to place a MeshStandard box cleanly onto parent. */
export function addPartBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** Adds an Ayutthaya period 3D villager/soldier/noble/bandit/zombie figure (+Z forward). */
export function makeAyutthayaFigure(
  shirtCol: string,
  jongCol: string,
  options?: {
    headbandCol?: string;
    hatCol?: string;
    helmetGold?: boolean;
    sabaiCol?: string;
    isMonk?: boolean;
    isZombie?: boolean;
    hasSword?: boolean;
    hasSpear?: boolean;
    seatedRowing?: boolean;
  }
): THREE.Group {
  const g = new THREE.Group();
  const skinCol = options?.isZombie ? '#6b705c' : '#b8825a';
  const skinMat = new THREE.MeshStandardMaterial({ color: skinCol, roughness: 0.78 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtCol, roughness: 0.8 });
  const jongMat = new THREE.MeshStandardMaterial({ color: jongCol, roughness: 0.85 });

  const legL = new THREE.Group();
  legL.name = 'legL';
  const legR = new THREE.Group();
  legR.name = 'legR';
  if (options?.seatedRowing) {
    // Natural seated rowing legs: thighs resting forward onto bench & bent shins stepping cleanly onto boat floor
    [-0.09, 0.09].forEach((lx, li) => {
      const grp = li === 0 ? legL : legR;
      grp.position.set(lx, 0.56, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.34, 7), jongMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(0, 0, 0.17);
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.36, 7), skinMat);
      shin.position.set(0, -0.18, 0.34);
      grp.add(thigh, shin);
    });
  } else {
    legL.position.set(-0.08, 0.56, 0);
    const legLM = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.54, 7), skinMat);
    legLM.position.y = -0.27;
    legL.add(legLM);

    legR.position.set(0.08, 0.56, 0);
    const legRM = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.54, 7), skinMat);
    legRM.position.y = -0.27;
    legR.add(legRM);
  }
  g.add(legL, legR);

  const jong = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.34, 8), jongMat);
  jong.position.y = 0.68;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.44, 8), shirtMat);
  torso.position.y = 1.04;
  if (options?.seatedRowing) {
    torso.rotation.x = 0.16;
    torso.position.z = 0.04;
  }
  g.add(jong, torso);

  if (options?.sabaiCol) {
    const sabai = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.42, 0.33),
      new THREE.MeshStandardMaterial({ color: options.sabaiCol, roughness: 0.75 })
    );
    sabai.position.y = 1.04;
    sabai.rotation.z = 0.38;
    sabai.scale.set(0.28, 1, 1.02);
    g.add(sabai);
  }

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
  if (options?.hasSpear) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 6), new THREE.MeshStandardMaterial({ color: '#5c3a21' }));
    shaft.position.set(0.05, 0.2, 0.06);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.24, 6), new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8 }));
    tip.position.set(0.05, 1.38, 0.06);
    armR.add(shaft, tip);
  }
  g.add(armL, armR);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 8), skinMat);
  head.position.y = 1.44;
  g.add(head);

  if (!options?.isMonk) {
    // Authentic Men's Mahatthai tuft (ผมทรงมหาดไทย) unless female wing-hair or noble/soldier headwear
    const isMahatthai = !options?.sabaiCol && !options?.helmetGold && !options?.hatCol;
    const hair = new THREE.Mesh(
      isMahatthai
        ? new THREE.CylinderGeometry(0.095, 0.11, 0.06, 8)
        : new THREE.SphereGeometry(0.152, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.54),
      new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 })
    );
    hair.position.y = isMahatthai ? 1.56 : 1.46;
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
  if (options?.helmetGold) {
    const helm = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.36, 8),
      new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.25 })
    );
    helm.position.y = 1.66;
    g.add(helm);
  } else if (options?.sabaiCol && !options?.isMonk && !options?.isZombie) {
    // Winged Ayutthaya lady hairstyle + gold hairpin
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.22), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 }));
    wing.position.y = 1.54;
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.7 }));
    pin.position.set(0.14, 1.57, 0);
    g.add(wing, pin);
  }

  const eyeCol = options?.isZombie ? '#ef4444' : '#111827';
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeCol });
  [-0.05, 0.05].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eye.position.set(ex, 1.45, 0.13);
    g.add(eye);
  });

  if (options?.seatedRowing) {
    armL.position.set(-0.2, 1.2, 0.06);
    armR.position.set(0.2, 1.2, 0.06);
    armL.rotation.set(-0.92, 0, -0.22);
    armR.rotation.set(-0.92, 0, 0.22);
  }
  if (options?.isZombie) {
    torso.rotation.x = 0.24;
    head.rotation.x = -0.15;
    armL.rotation.x = -1.15;
    armR.rotation.x = -1.15;
  }

  return g;
}

/** Adds a crafted Ayutthaya teak stilt house with Fa Pakon wood panels, open lit shutters, balcony railings, stair, & Thai gable crest. */
export function makeAyutthayaTeakHouse(
  x: number,
  z: number,
  options?: { roofColor?: string; nobleGoldTrim?: boolean; scale?: number }
): THREE.Group {
  const g = new THREE.Group();
  const s = options?.scale ?? 1.0;
  g.position.set(x, 0, z);
  g.scale.setScalar(s);

  const woodDark = new THREE.MeshStandardMaterial({ color: '#3b2112', roughness: 0.9 });
  const woodMid = new THREE.MeshStandardMaterial({ color: '#5c361d', roughness: 0.85 });
  const woodPanel = new THREE.MeshStandardMaterial({ color: '#784626', roughness: 0.82 });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#452613', roughness: 0.86 });
  const roofCol = options?.roofColor ?? '#7c2d12';
  const roofMat = new THREE.MeshStandardMaterial({
    map: makeAyutthayaRoofTex(roofCol, options?.nobleGoldTrim ? '#b91c1c' : '#9a3412', options?.nobleGoldTrim ? '#eab308' : roofCol),
    roughness: 0.68,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: options?.nobleGoldTrim ? '#eab308' : '#9a3412',
    metalness: options?.nobleGoldTrim ? 0.65 : 0.1,
    roughness: options?.nobleGoldTrim ? 0.3 : 0.75,
  });
  const warmGlow = new THREE.MeshBasicMaterial({ color: '#f59e0b' });

  // 6 sturdy stilt posts + cross-beams + under-house rice jar
  [-2.05, 0, 2.05].forEach((px) => {
    [-1.05, 1.05].forEach((pz) => addPartBox(g, 0.18, 1.5, 0.18, woodDark, px, 0.75, pz));
    addPartBox(g, 0.14, 0.14, 2.35, frameMat, px, 1.38, 0);
  });
  const jar = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), frameMat);
  jar.scale.set(1, 1.15, 1);
  jar.position.set(1.25, 0.3, 0.7);
  g.add(jar);

  // Elevated veranda deck + balustrade posts & front wooden staircase
  addPartBox(g, 5.1, 0.14, 3.3, woodMid, 0, 1.5, 0.25);
  [-2.3, -1.35, 1.35, 2.3].forEach((rx) => addPartBox(g, 0.08, 0.56, 0.08, woodDark, rx, 1.82, 1.8));
  addPartBox(g, 1.15, 0.07, 0.09, woodDark, -1.82, 2.08, 1.8);
  addPartBox(g, 1.15, 0.07, 0.09, woodDark, 1.82, 2.08, 1.8);
  // Slanted wooden staircase down to ground at center-left
  const stair = addPartBox(g, 0.75, 0.08, 1.65, woodMid, -0.45, 0.82, 2.35);
  stair.rotation.x = 0.78;
  [-0.85, -0.05].forEach((sx) => {
    const rail = addPartBox(g, 0.05, 0.42, 1.65, woodDark, sx, 1.05, 2.35);
    rail.rotation.x = 0.78;
  });

  // Main upper wall body + authentic Thai "Fa Pakon" vertical frames & recessed wood paneling
  addPartBox(g, 4.4, 1.65, 2.35, woodPanel, 0, 2.38, -0.2);
  [-2.18, -1.1, 0, 1.1, 2.18].forEach((bx) => addPartBox(g, 0.1, 1.68, 2.4, frameMat, bx, 2.38, -0.2));
  [1.64, 2.15, 3.12].forEach((by) => addPartBox(g, 4.48, 0.09, 2.4, frameMat, 0, by, -0.2));

  // Two open Ayutthaya wooden windows with warm interior light & flared hinged shutters!
  [-1.55, 1.55].forEach((wx) => {
    addPartBox(g, 0.62, 0.68, 0.06, warmGlow, wx, 2.52, 0.99);
    const shL = addPartBox(g, 0.3, 0.68, 0.05, woodDark, wx - 0.34, 2.52, 1.12);
    shL.rotation.y = -0.65;
    const shR = addPartBox(g, 0.3, 0.68, 0.05, woodDark, wx + 0.34, 2.52, 1.12);
    shR.rotation.y = 0.65;
  });
  // Carved teak doorway with gold trim lintel
  addPartBox(g, 0.76, 1.28, 0.08, woodDark, 0, 2.26, 1.0);
  addPartBox(g, 0.9, 0.12, 0.12, trimMat, 0, 2.94, 1.02);

  // Sloped 2-tier Ayutthaya Gable Roof, Overhanging Veranda Eave & Gable Chofa Crest!
  const rF = addPartBox(g, 5.4, 0.1, 1.95, roofMat, 0, 3.68, 0.64);
  rF.rotation.x = 0.48;
  const rB = addPartBox(g, 5.4, 0.1, 1.95, roofMat, 0, 3.68, -1.04);
  rB.rotation.x = -0.48;
  const porchAwning = addPartBox(g, 5.2, 0.08, 1.15, roofMat, 0, 3.12, 1.38);
  porchAwning.rotation.x = 0.34;
  addPartBox(g, 5.5, 0.14, 0.2, trimMat, 0, 4.12, -0.2);

  // Enclosed triangular gable end boards (จั่วเรือนไทย) + carved horn Pan Lom & Chofa finials!
  [-2.22, 2.22].forEach((gx) => {
    const gable = new THREE.Mesh(new THREE.ConeGeometry(1.26, 0.92, 4), woodMid);
    gable.rotation.y = Math.PI / 4;
    gable.scale.set(0.14, 1, 1.44);
    gable.position.set(gx, 3.62, -0.2);
    const chofa = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.68, 6), trimMat);
    chofa.position.set(gx * 1.12, 4.38, -0.2);
    chofa.rotation.z = gx > 0 ? -0.25 : 0.25;
    g.add(gable, chofa);
  });

  // Warm hanging oil lamp on veranda post
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
  lantern.position.set(0, 2.95, 1.48);
  g.add(lantern);

  return g;
}

/** Builds a sculpted hollow Thai wooden rowing boat with curved gunwales, cross-thwarts, cargo baskets & seated rower. */
export function makeAyutthayaBoat(
  length = 4.2,
  withRower = false,
  rowerShirt = '#d97706',
  hasPrathunCanopy = false
): { group: THREE.Group; oarL?: THREE.Group; oarR?: THREE.Group } {
  const g = new THREE.Group();
  const darkWood = new THREE.MeshStandardMaterial({ color: '#452613', roughness: 0.85 });
  const plankWood = new THREE.MeshStandardMaterial({ color: '#784220', roughness: 0.78 });
  const trimWood = new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.72 });

  // Sculpted interior floorboard & wooden hull ribs (กงเรือ)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(length * 0.74, 0.07, 0.92), darkWood);
  floor.position.y = 0.08;
  g.add(floor);
  for (let rx = -length * 0.28; rx <= length * 0.28; rx += 0.65) {
    addPartBox(g, 0.07, 0.06, 0.9, trimWood, rx, 0.12, 0);
  }

  // Hollow curved outer gunwales + inner trim rail
  [-0.48, 0.48].forEach((sz) => {
    const gunwale = new THREE.Mesh(new THREE.BoxGeometry(length * 0.74, 0.3, 0.08), plankWood);
    gunwale.position.set(0, 0.23, sz);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length * 0.76, 0.06, 0.11), trimWood);
    rail.position.set(0, 0.38, sz);
    g.add(gunwale, rail);
  });

  // Upward-curving Siamese Sampan prow & stern with gilded bow post (โขนเรือ)
  [-1, 1].forEach((endDir) => {
    const prowDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.49, length * 0.28, 6), plankWood);
    prowDeck.rotation.z = endDir * (Math.PI / 2 - 0.12);
    prowDeck.rotation.x = Math.PI / 4;
    prowDeck.scale.set(0.62, 1, 1.05);
    prowDeck.position.set(endDir * (length * 0.46), 0.28, 0);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.36, 6), trimWood);
    tip.position.set(endDir * (length * 0.56), 0.48, 0);
    tip.rotation.z = -endDir * 0.35;
    g.add(prowDeck, tip);
  });

  // 3 Wooden cross-bench thwarts (ม้านั่งพายเรือ)
  [-0.9, 0, 0.9].forEach((bx) => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.055, 0.98), trimWood);
    seat.position.set(bx, 0.32, 0);
    g.add(seat);
  });

  if (hasPrathunCanopy) {
    // Classic arched woven-bamboo Thai canal cargo canopy + rattan wicker baskets
    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, length * 0.42, 10, 1, true, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.9, side: THREE.DoubleSide })
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.x = Math.PI / 2;
    canopy.position.set(-0.3, 0.56, 0);
    g.add(canopy);
    [-0.1, 0.28].forEach((cx, ci) => {
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.14, 0.24, 8),
        new THREE.MeshStandardMaterial({ color: ci === 0 ? '#ca8a04' : '#b45309', roughness: 0.85 })
      );
      basket.position.set(cx, 0.24, ci === 0 ? -0.18 : 0.18);
      g.add(basket);
    });
  }

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.58, 6), darkWood);
  pole.position.set(length * 0.35, 0.54, 0);
  const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.14, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
  lanternBody.position.set(length * 0.35, 0.86, 0);
  g.add(pole, lanternBody);

  const rowX = hasPrathunCanopy ? 0.9 : 0;
  if (withRower) {
    // Truly seated on the bench thwart (-0.25 aligns hips cleanly on y=0.32 bench and feet on floor!)
    const rower = makeAyutthayaFigure(rowerShirt, '#1e293b', { hatCol: '#ca8a04', seatedRowing: true });
    rower.position.set(rowX, -0.25, 0);
    rower.rotation.y = Math.PI / 2;
    g.add(rower);
  }

  // Animated wooden rowing paddles mounted on port & starboard tholepins
  const oarL = new THREE.Group();
  oarL.position.set(rowX + 0.18, 0.38, 0.48);
  const shaftL = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 1.65, 6), trimWood);
  shaftL.position.set(0, -0.45, 0.24);
  shaftL.rotation.x = 0.52;
  const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.42, 0.026), plankWood);
  bladeL.position.set(0, -1.04, 0.58);
  bladeL.rotation.x = 0.52;
  oarL.add(shaftL, bladeL);
  g.add(oarL);

  const oarR = oarL.clone();
  oarR.position.set(rowX + 0.18, 0.38, -0.48);
  oarR.scale.z = -1;
  g.add(oarR);

  return { group: g, oarL, oarR };
}

/** Builds a detailed hollow Royal Ayutthaya Golden Swan Barge (เรือพระที่นั่งสุพรรณหงส์) with royal canopy & truly seated oarsmen. */
export function makeRoyalSwanBarge(): { group: THREE.Group; oars: THREE.Group[] } {
  const g = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.7, roughness: 0.22 });
  const redMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.68 });
  const woodFloor = new THREE.MeshStandardMaterial({ color: '#3b1f10', roughness: 0.85 });
  const royalRoofMat = new THREE.MeshStandardMaterial({ map: makeAyutthayaRoofTex('#991b1b', '#dc2626', '#eab308'), roughness: 0.55 });

  // Hollow Sculpted Long Gilded Barge Hull: open interior floor, crimson carpet & tall flared gilded gunwales!
  const keelFloor = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.12, 1.18), woodFloor);
  keelFloor.position.y = 0.12;
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.03, 0.48), redMat);
  carpet.position.y = 0.19;
  g.add(keelFloor, carpet);

  [-0.58, 0.58].forEach((sz) => {
    addPartBox(g, 9.8, 0.36, 0.09, goldMat, 0, 0.3, sz);
    addPartBox(g, 9.9, 0.12, 0.11, redMat, 0, 0.46, sz);
    addPartBox(g, 9.95, 0.06, 0.13, goldMat, 0, 0.54, sz);
  });
  [-1, 1].forEach((endDir) => {
    const endHull = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.62, 2.2, 6), goldMat);
    endHull.rotation.z = endDir * (Math.PI / 2 - 0.1);
    endHull.rotation.x = Math.PI / 4;
    endHull.scale.set(0.55, 1, 1.04);
    endHull.position.set(endDir * 5.7, 0.34, 0);
    g.add(endHull);
  });

  // Carved Royal Golden Swan Prow (S-curved neck, crest, feathered cheeks, hanging crystal tassel) & curved Tail
  const neckLow = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.26, 1.35, 10), goldMat);
  neckLow.position.set(5.95, 0.95, 0);
  neckLow.rotation.z = -0.34;
  const neckHigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 1.25, 10), goldMat);
  neckHigh.position.set(6.28, 1.98, 0);
  neckHigh.rotation.z = 0.12;
  const swanHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), goldMat);
  swanHead.scale.set(1.2, 1.0, 0.9);
  swanHead.position.set(6.22, 2.58, 0);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.48, 6), goldMat);
  crest.position.set(6.14, 2.86, 0);
  crest.rotation.z = 0.35;
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 7), goldMat);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(6.54, 2.52, 0);
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.55, 8), redMat);
  tassel.rotation.x = Math.PI;
  tassel.position.set(6.58, 2.16, 0);
  [-0.42, 0.42].forEach((wz) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.08), goldMat);
    wing.position.set(5.05, 0.58, wz);
    wing.rotation.z = 0.25;
    g.add(wing);
  });
  const tailLow = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.22, 1.4, 8), goldMat);
  tailLow.position.set(-5.7, 0.92, 0);
  tailLow.rotation.z = 0.44;
  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.9, 6), goldMat);
  tailTip.position.set(-6.12, 1.72, 0);
  tailTip.rotation.z = 0.18;
  g.add(neckLow, neckHigh, swanHead, crest, beak, tassel, tailLow, tailTip);

  // Ornate Central Royal Busabok Pavilion Throne: Multi-step dais, golden pillars, valance curtains & Mondop spire
  addPartBox(g, 2.35, 0.16, 1.18, goldMat, 0, 0.28, 0);
  addPartBox(g, 1.95, 0.22, 0.96, redMat, 0, 0.44, 0);
  addPartBox(g, 1.65, 0.1, 0.84, goldMat, 0, 0.58, 0);
  [-0.78, 0.78].forEach((px) => {
    [-0.38, 0.38].forEach((pz) => addPartBox(g, 0.085, 1.5, 0.085, goldMat, px, 1.32, pz));
  });
  addPartBox(g, 1.72, 0.18, 0.88, redMat, 0, 1.96, 0); // embroidered royal cornice
  const bTier1 = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.72, 4), royalRoofMat);
  bTier1.rotation.y = Math.PI / 4;
  bTier1.position.set(0, 2.38, 0);
  const bTier2 = new THREE.Mesh(new THREE.ConeGeometry(0.84, 0.7, 4), goldMat);
  bTier2.rotation.y = Math.PI / 4;
  bTier2.position.set(0, 2.78, 0);
  const bSpire = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.9, 8), goldMat);
  bSpire.position.set(0, 3.4, 0);
  g.add(bTier1, bTier2, bSpire);

  // Cross-benches & Truly Seated Royal Crimson Oarsmen gripping gilded paddles
  const oars: THREE.Group[] = [];
  [-4.1, -3.1, -2.1, 2.1, 3.1, 4.1].forEach((rx) => {
    addPartBox(g, 0.34, 0.06, 1.16, redMat, rx, 0.34, 0); // thwart seat bench
    const oarsman = makeAyutthayaFigure('#991b1b', '#eab308', { helmetGold: true, seatedRowing: true });
    oarsman.position.set(rx, -0.2, 0);
    oarsman.rotation.y = Math.PI / 2;
    oarsman.scale.setScalar(0.84);
    g.add(oarsman);

    [-0.56, 0.56].forEach((sz, si) => {
      const oar = new THREE.Group();
      oar.position.set(rx + 0.16, 0.48, sz);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 1.75, 6), goldMat);
      shaft.position.set(0, -0.54, si === 0 ? -0.3 : 0.3);
      shaft.rotation.x = si === 0 ? -0.52 : 0.52;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.025), goldMat);
      blade.position.set(0, -1.18, si === 0 ? -0.64 : 0.64);
      blade.rotation.x = si === 0 ? -0.52 : 0.52;
      oar.add(shaft, blade);
      g.add(oar);
      if (si === 1) oars.push(oar);
    });
  });

  return { group: g, oars };
}

/** Builds a sculptural Royal Ayutthaya War Elephant (ช้างศึกทรงเครื่อง) with contoured head/ears, S-curved trunk, ringed tusks, gilded howdah canopy & mahout. */
export function makeAyutthayaWarElephant(): THREE.Group {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.86 });
  const skinShadowMat = new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.9 });
  const redCloth = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.68 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.72, roughness: 0.22 });
  const ivoryMat = new THREE.MeshStandardMaterial({ color: '#fef9c3', roughness: 0.3 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#111827' });

  // 4 sculpted pillar legs with muscular upper haunches, knee pads & ivory toenails
  [-0.76, 0.76].forEach((lx) => {
    [-0.44, 0.44].forEach((lz) => {
      const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.72, 12), skinMat);
      upperLeg.position.set(lx, 1.0, lz);
      const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.62, 12), skinShadowMat);
      lowerLeg.position.set(lx, 0.34, lz);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.16, 12), skinMat);
      foot.position.set(lx, 0.08, lz);
      [-0.1, 0, 0.1].forEach((nz) => {
        const nail = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), ivoryMat);
        nail.position.set(lx - 0.26, 0.06, lz + nz);
        g.add(nail);
      });
      g.add(upperLeg, lowerLeg, foot);
    });
  });

  // Contoured barrel chest, muscular shoulders, rear rump & tail with tuft
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.88, 16, 12), skinMat);
  chest.scale.set(1.05, 1.02, 0.92);
  chest.position.set(-0.52, 1.72, 0);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12), skinShadowMat);
  belly.scale.set(1.15, 0.92, 0.94);
  belly.position.set(0.12, 1.66, 0);
  const rump = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 12), skinMat);
  rump.scale.set(0.95, 0.96, 0.88);
  rump.position.set(0.74, 1.7, 0);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.85, 7), skinShadowMat);
  tail.position.set(1.42, 1.38, 0);
  tail.rotation.z = 0.28;
  const tailBrush = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 7), new THREE.MeshStandardMaterial({ color: '#18181b' }));
  tailBrush.position.set(1.56, 0.96, 0);
  tailBrush.rotation.x = Math.PI;
  g.add(chest, belly, rump, tail, tailBrush);

  // Ornate Crimson Silk Battle Caparison, Gilded Fringe Trim & Belly Straps (ผ้าคลุมช้างศึก + สายพานทอง)
  const caparison = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 0.96, 1.58, 16, 1, true, -0.35, Math.PI + 0.7), redCloth);
  caparison.rotation.z = Math.PI / 2;
  caparison.rotation.x = Math.PI;
  caparison.position.set(0.08, 1.66, 0);
  addPartBox(g, 1.62, 0.1, 1.78, goldMat, 0.08, 1.44, 0);
  [-0.38, 0.48].forEach((sx) => {
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.035, 6, 18), goldMat);
    belt.rotation.y = Math.PI / 2;
    belt.scale.set(1, 0.95, 1);
    belt.position.set(sx, 1.66, 0);
    g.add(belt);
  });
  g.add(caparison);

  // Sculpted Skull, Twin Cranial Domes (โหนกกระพองช้าง), Brow Cap, Rounded Ears, Ringed Curved Ivory Tusks & 3-Segment S-Trunk (-X forward)
  const neckMuscle = new THREE.Mesh(new THREE.SphereGeometry(0.68, 12, 10), skinMat);
  neckMuscle.position.set(-1.05, 1.98, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 12), skinMat);
  skull.scale.set(1.06, 1.12, 0.95);
  skull.position.set(-1.38, 2.08, 0);
  // Twin iconic Asian elephant forehead domes + royal gilded forehead cloth (ผ้าปกกระพอง)
  [-0.18, 0.18].forEach((dz) => {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), skinMat);
    dome.position.set(-1.42, 2.58, dz);
    g.add(dome);
  });
  const headCloth = new THREE.Mesh(new THREE.SphereGeometry(0.54, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), redCloth);
  headCloth.position.set(-1.36, 2.25, 0);
  headCloth.rotation.z = 0.35;
  const browCrest = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.45, 8), goldMat);
  browCrest.position.set(-1.72, 2.52, 0);
  browCrest.rotation.z = 0.6;
  g.add(neckMuscle, skull, headCloth, browCrest);

  // Contoured Rounded Fan Ears + Two-Piece Curved Ivory Tusks with Golden Rings (สนับงาทอง)
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.34, 0.08, 12), skinMat);
    ear.scale.set(0.85, 1, 1.25);
    ear.rotation.z = Math.PI / 2;
    ear.rotation.y = side * -0.45;
    ear.position.set(-1.18, 2.05, side * 0.56);

    const earTrim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 5, 12, Math.PI * 1.2), goldMat);
    earTrim.rotation.y = Math.PI / 2 + side * -0.45;
    earTrim.position.set(-1.19, 2.05, side * 0.59);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeMat);
    eye.position.set(-1.76, 2.18, side * 0.38);

    // 2-segment curving ivory tusk with gold ring collar
    const tuskBase = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.095, 0.46, 10), ivoryMat);
    tuskBase.rotation.z = Math.PI / 2 + 0.45;
    tuskBase.position.set(-1.82, 1.66, side * 0.28);
    const tuskRing = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.02, 6, 10), goldMat);
    tuskRing.rotation.z = 0.45;
    tuskRing.rotation.y = Math.PI / 2;
    tuskRing.position.set(-1.92, 1.6, side * 0.28);
    const tuskTip = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.58, 10), ivoryMat);
    tuskTip.rotation.z = Math.PI / 2 - 0.32;
    tuskTip.position.set(-2.24, 1.66, side * 0.28);
    g.add(ear, earTrim, eye, tuskBase, tuskRing, tuskTip);
  });

  // 3-Segment Sculpted S-Curved Trunk
  const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.125, 0.55, 10), skinMat);
  trunk1.position.set(-1.84, 1.72, 0);
  trunk1.rotation.z = -0.42;
  const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.1, 0.55, 10), skinMat);
  trunk2.position.set(-2.02, 1.25, 0);
  trunk2.rotation.z = -0.15;
  const trunkTip = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.065, 0.42, 10), skinMat);
  trunkTip.position.set(-2.14, 0.88, 0);
  trunkTip.rotation.z = 0.55;
  g.add(trunk1, trunk2, trunkTip);

  // Ornate Canopied Royal War Howdah (สัปคับทองทรงมณฑป) + Mahout Rider
  addPartBox(g, 1.05, 0.28, 1.04, redCloth, 0.14, 2.48, 0);
  addPartBox(g, 1.12, 0.1, 1.1, goldMat, 0.14, 2.34, 0);
  [-0.36, 0.56].forEach((hx) => {
    [-0.44, 0.44].forEach((hz) => addPartBox(g, 0.065, 0.92, 0.065, goldMat, hx, 3.04, hz));
  });
  const hRoof = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.55, 4), goldMat);
  hRoof.rotation.y = Math.PI / 4;
  hRoof.position.set(0.1, 3.74, 0);
  g.add(hRoof);

  const mahout = makeAyutthayaFigure('#991b1b', '#eab308', { helmetGold: true, hasSpear: true });
  mahout.position.set(-0.72, 1.98, 0);
  mahout.rotation.y = -Math.PI / 2;
  mahout.scale.setScalar(0.86);
  g.add(mahout);

  return g;
}

export interface AyutthayaHorseHandle {
  group: THREE.Group;
  legs: THREE.Group[];
  rider?: THREE.Group;
}

/** Builds an expressive sculpted 3D Ayutthaya War/Travel Horse (+X facing) with anatomical chest/rump, flowing mane, bridle, ornate saddle & articulated legs. */
export function makeAyutthayaHorse(
  coatColor = '#6e3819',
  options?: { withRider?: boolean; riderShirt?: string; riderHelmetGold?: boolean }
): AyutthayaHorseHandle {
  const g = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.7 });
  const coatDarkMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.82 });
  const maneMat = new THREE.MeshStandardMaterial({ color: coatColor === '#e2e8f0' ? '#94a3b8' : '#18181b', roughness: 0.9 });
  const hoofMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65 });
  const saddleMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.65 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.72, roughness: 0.24 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#09090b' });

  // Anatomical contoured torso: muscular chest slope, dipped saddle back, rounded croup & flanks
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), coatMat);
  chest.scale.set(1.12, 1.04, 0.92);
  chest.position.set(0.58, 1.06, 0);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.37, 1.15, 14), coatMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.scale.set(0.96, 1, 0.94);
  barrel.position.set(0, 1.02, 0);
  const croup = new THREE.Mesh(new THREE.SphereGeometry(0.41, 14, 10), coatMat);
  croup.scale.set(1.12, 1.0, 0.92);
  croup.position.set(-0.56, 1.06, 0);
  const withers = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), coatMat);
  withers.position.set(0.55, 1.32, 0);
  g.add(chest, barrel, croup, withers);

  // Proud Arching Neck, Layered Mane Tufts, Tapered Equine Head (Cheeks + Sloped Muzzle + Bridle) & Flowing Two-Tier Tail
  const neckLower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.56, 12), coatMat);
  neckLower.position.set(0.8, 1.36, 0);
  neckLower.rotation.z = -0.62;
  const neckUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.21, 0.48, 12), coatMat);
  neckUpper.position.set(0.98, 1.66, 0);
  neckUpper.rotation.z = -0.34;
  g.add(neckLower, neckUpper);

  // Flowing layered horse mane sweeping gracefully along the arched neck crest
  const maneStrip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.72, 0.085), maneMat);
  maneStrip.position.set(0.75, 1.56, 0);
  maneStrip.rotation.z = -0.5;
  const maneUpper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.36, 0.08), maneMat);
  maneUpper.position.set(0.92, 1.84, 0);
  maneUpper.rotation.z = -0.22;
  g.add(maneStrip, maneUpper);

  // Unified Anatomical Horse Head Group rotated naturally forward-down (-0.52 rad ~ 30 deg)
  const headGrp = new THREE.Group();
  headGrp.position.set(1.06, 1.84, 0);
  headGrp.rotation.z = -0.52;

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.168, 14, 12), coatMat);
  cranium.scale.set(1.15, 0.96, 0.8);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.145, 0.44, 14), coatMat);
  muzzle.rotation.z = -Math.PI / 2; // rotates +Y cylinder tip straight along local +X!
  muzzle.scale.set(1.0, 0.92, 0.84);
  muzzle.position.set(0.24, -0.015, 0);
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.084, 12, 10), coatDarkMat);
  noseTip.scale.set(1.05, 0.9, 0.86);
  noseTip.position.set(0.45, -0.015, 0);
  const jawUnder = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), coatMat);
  jawUnder.position.set(0.08, -0.075, 0);
  const bridleNose = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.014, 6, 14), goldMat);
  bridleNose.rotation.y = Math.PI / 2;
  bridleNose.position.set(0.32, -0.015, 0);
  const bridleHead = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.014, 6, 14), goldMat);
  bridleHead.rotation.y = Math.PI / 2;
  bridleHead.position.set(0.04, 0.01, 0);
  const forelock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.07), maneMat);
  forelock.position.set(0.08, 0.14, 0);
  forelock.rotation.z = -0.35;
  headGrp.add(cranium, muzzle, noseTip, jawUnder, bridleNose, bridleHead, forelock);

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.16, 7), coatMat);
    ear.position.set(-0.07, 0.17, side * 0.078);
    ear.rotation.z = -0.15;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeMat);
    eye.position.set(0.11, 0.055, side * 0.11);
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMat);
    nostril.position.set(0.42, 0.015, side * 0.052);
    const cheekStrap = addPartBox(headGrp, 0.28, 0.018, 0.016, goldMat, 0.18, 0.0, side * 0.095);
    cheekStrap.rotation.z = -0.08;
    const rein = addPartBox(g, 0.82, 0.016, 0.016, goldMat, 0.82, 1.54, side * 0.16);
    rein.rotation.z = 0.18;
    headGrp.add(ear, eye, nostril);
  });
  g.add(headGrp);

  // Sweeping Dual-Section Horse Tail
  const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 0.35, 8), maneMat);
  tailBase.position.set(-0.96, 1.18, 0);
  tailBase.rotation.z = -0.65;
  const tailSwish = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.68, 8), maneMat);
  tailSwish.position.set(-1.12, 0.82, 0);
  tailSwish.rotation.z = -0.18;
  g.add(tailBase, tailSwish);

  // Embroidered Crimson-Gold Saddle Cloth, Contoured Leather Saddle & Brass Stirrups (อานม้าทรง + ผ้าคลุม + โกลน)
  const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.4, 0.74, 14, 1, true, -0.45, Math.PI + 0.9), saddleMat);
  cloth.rotation.z = Math.PI / 2;
  cloth.rotation.x = Math.PI;
  cloth.position.set(0.04, 1.04, 0);
  addPartBox(g, 0.56, 0.1, 0.66, goldMat, 0.04, 1.38, 0);
  addPartBox(g, 0.14, 0.14, 0.56, saddleMat, 0.28, 1.46, 0); // front pommel
  addPartBox(g, 0.14, 0.16, 0.58, saddleMat, -0.2, 1.47, 0); // rear cantle
  g.add(cloth);
  [-0.36, 0.36].forEach((sz) => {
    addPartBox(g, 0.03, 0.34, 0.03, goldMat, 0.04, 1.18, sz);
    addPartBox(g, 0.1, 0.04, 0.06, goldMat, 0.04, 1.01, sz); // stirrup iron
  });

  // 4 Articulated Muscular Pivoted Legs (upper haunch/forearm + knee joint + slender cannon + hoof)
  const legs: THREE.Group[] = [];
  [
    [0.58, 0.2],
    [0.58, -0.2],
    [-0.56, 0.2],
    [-0.56, -0.2],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Group();
    leg.position.set(lx, 0.88, lz);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.072, 0.42, 10), coatMat);
    upper.position.y = -0.2;
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.074, 8, 8), coatDarkMat);
    knee.position.y = -0.42;
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.38, 9), coatMat);
    lower.position.y = -0.62;
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.078, 0.11, 9), hoofMat);
    hoof.position.y = -0.84;
    leg.add(upper, knee, lower, hoof);
    g.add(leg);
    legs.push(leg);
  });

  let rider: THREE.Group | undefined;
  if (options?.withRider) {
    rider = makeAyutthayaFigure(options.riderShirt ?? '#991b1b', '#450a0a', {
      helmetGold: options.riderHelmetGold,
      hasSpear: options.riderHelmetGold,
      headbandCol: options.riderHelmetGold ? undefined : '#a16207',
    });
    rider.position.set(0.04, 0.96, 0);
    rider.rotation.y = Math.PI / 2; // faces +X along horse travel direction!
    g.add(rider);
  }

  return { group: g, legs, rider };
}

/** Places lush Ayutthaya Bodhi trees, arched coconut palms, bamboo groves, skyline spires & lotus across the 380m map. */
export function buildAyutthayaFoliage(scene: THREE.Object3D): void {
  const leafDark = new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.9 });
  const leafMid = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.88 });
  const leafBright = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.86 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#452918', roughness: 0.92 });
  const horizonMat = new THREE.MeshStandardMaterial({ color: '#1b2824', roughness: 0.95 });
  const distantPrangMat = new THREE.MeshStandardMaterial({ color: '#3b2419', roughness: 0.92 });

  // Distant Ayutthaya Kingdom skyline of temple spires & emerald forests (-186 .. +186)
  for (let hx = -186; hx <= 186; hx += 9) {
    const mound = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4 + (Math.abs(hx) % 3) * 0.7, 0), horizonMat);
    mound.scale.set(1.65, 0.82, 0.95);
    mound.position.set(hx, 1.4, -11.5);
    scene.add(mound);
    if (Math.abs(hx) % 27 === 0) {
      const chedi = new THREE.Mesh(new THREE.ConeGeometry(1.15, 5.2, 8), distantPrangMat);
      chedi.position.set(hx + 2.5, 4.4, -12.8);
      scene.add(chedi);
    }
  }

  // Sacred Bodhi Trees (ต้นโพธิ์ร่มรื่น) flanking villages, nobles & temples
  const bodhiXs = [-176, -152, -126, -104, -74, -56, -24, 4, 34, 46, 86, 108, 134, 154, 174];
  bodhiXs.forEach((bx, idx) => {
    const grp = new THREE.Group();
    grp.position.set(bx, 0, idx % 2 === 0 ? -5.2 : -4.4);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.52, 3.8, 8), trunkMat);
    trunk.position.y = 1.9;
    grp.add(trunk);
    [
      [0, 4.4, 0, 1.85],
      [-1.15, 3.8, 0.2, 1.35],
      [1.15, 3.9, -0.15, 1.35],
      [0, 5.25, 0, 1.25],
    ].forEach(([cx, cy, cz, rad], ci) => {
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), ci % 2 === 0 ? leafDark : leafMid);
      canopy.scale.set(1.25, 0.78, 1.05);
      canopy.position.set(cx, cy, cz);
      grp.add(canopy);
    });
    scene.add(grp);
  });

  // Canal-bank Arched Coconut Palms with natural curved fronds & coconuts
  const palmXs = [-182, -158, -138, -114, -92, -64, -38, -14, 18, 52, 88, 122, 148, 176];
  palmXs.forEach((px, idx) => {
    const grp = new THREE.Group();
    grp.position.set(px, 0, idx % 2 === 0 ? -1.45 : 2.35);
    const h = 4.4 + (idx % 3) * 0.65;
    const tilt = idx % 2 === 0 ? 0.08 : -0.07;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.19, h, 7), trunkMat);
    stem.position.y = h / 2;
    stem.rotation.z = tilt;
    grp.add(stem);

    const crown = new THREE.Group();
    crown.position.set(-Math.sin(tilt) * h * 0.5, Math.cos(tilt) * h, 0);
    [[-0.12, -0.1, 0.08], [0.12, -0.1, -0.06], [0, -0.14, 0.12]].forEach(([cx, cy, cz]) => {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), leafDark);
      nut.position.set(cx, cy, cz);
      crown.add(nut);
    });
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

  // Dense Bamboo Clusters (กอไผ่) & canal lotus blossoms across river bank
  [-142, -98, -68, -28, 36, 138, 152, 168].forEach((bx, idx) => {
    const grp = new THREE.Group();
    grp.position.set(bx, 0, idx % 2 === 0 ? -3.8 : -4.5);
    for (let c = 0; c < 5; c++) {
      const culm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 3.6 + (c % 3) * 0.65, 6), leafBright);
      culm.position.set((c - 2) * 0.16, 1.85, (c % 2) * 0.14);
      culm.rotation.z = (c - 2) * 0.07;
      grp.add(culm);
      const tuft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), leafMid);
      tuft.position.set((c - 2) * 0.22, 3.65 + (c % 2) * 0.45, (c % 2) * 0.14);
      grp.add(tuft);
    }
    scene.add(grp);
  });

  for (let lx = -180; lx <= 180; lx += 8) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 8), leafBright);
    pad.position.set(lx, -0.2, 3.35 + (Math.abs(lx) % 2) * 0.45);
    scene.add(pad);
    if (Math.floor(lx) % 2 === 0) {
      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 6), new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.5 }));
      bloom.rotation.x = Math.PI;
      bloom.position.set(lx + 0.08, -0.12, pad.position.z);
      scene.add(bloom);
    }
  }
}
