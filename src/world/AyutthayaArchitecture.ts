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
  tex.repeat.set(6, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
  }
): THREE.Group {
  const g = new THREE.Group();
  const skinCol = options?.isZombie ? '#6b705c' : '#b8825a';
  const skinMat = new THREE.MeshStandardMaterial({ color: skinCol, roughness: 0.78 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtCol, roughness: 0.8 });
  const jongMat = new THREE.MeshStandardMaterial({ color: jongCol, roughness: 0.85 });

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

  const jong = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.34, 8), jongMat);
  jong.position.y = 0.68;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.44, 8), shirtMat);
  torso.position.y = 1.04;
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
  const roofMat = new THREE.MeshStandardMaterial({ color: options?.roofColor ?? '#7c2d12', roughness: 0.76 });
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

/** Builds a sculpted hollow Thai wooden rowing boat with optional woven bamboo canopy or seated rower. */
export function makeAyutthayaBoat(
  length = 4.2,
  withRower = false,
  rowerShirt = '#d97706',
  hasPrathunCanopy = false
): { group: THREE.Group; oarL?: THREE.Group; oarR?: THREE.Group } {
  const g = new THREE.Group();
  const darkWood = new THREE.MeshStandardMaterial({ color: '#452613', roughness: 0.85 });
  const plankWood = new THREE.MeshStandardMaterial({ color: '#6e3d20', roughness: 0.8 });

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

  [-0.85, 0, 0.85].forEach((bx) => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.94), darkWood);
    seat.position.set(bx, 0.26, 0);
    g.add(seat);
  });

  if (hasPrathunCanopy) {
    // Classic arched woven-bamboo Thai canal cargo canopy (หลังคาเรือประทุน)
    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, length * 0.42, 8, 1, true, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.92, side: THREE.DoubleSide })
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.x = Math.PI / 2;
    canopy.position.set(-0.25, 0.58, 0);
    g.add(canopy);
  }

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 6), darkWood);
  pole.position.set(length * 0.34, 0.52, 0);
  const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.14, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
  lanternBody.position.set(length * 0.34, 0.82, 0);
  g.add(pole, lanternBody);

  let oarL: THREE.Group | undefined;
  let oarR: THREE.Group | undefined;
  if (withRower) {
    const rower = makeAyutthayaFigure(rowerShirt, '#1e293b', { hatCol: '#ca8a04' });
    rower.position.set(hasPrathunCanopy ? 0.9 : -0.2, -0.3, 0);
    rower.rotation.y = Math.PI / 2;
    g.add(rower);

    oarL = new THREE.Group();
    oarL.position.set(hasPrathunCanopy ? 1.1 : 0.1, 0.34, 0.52);
    const shaftL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.55, 6), darkWood);
    shaftL.position.set(0, -0.48, 0.25);
    shaftL.rotation.x = 0.52;
    const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.025), plankWood);
    bladeL.position.set(0, -1.02, 0.56);
    bladeL.rotation.x = 0.52;
    oarL.add(shaftL, bladeL);
    g.add(oarL);

    oarR = oarL.clone();
    oarR.position.set(oarL.position.x, 0.34, -0.52);
    oarR.scale.z = -1;
    g.add(oarR);
  }

  return { group: g, oarL, oarR };
}

/** Builds a majestic Royal Ayutthaya Golden Swan Barge (เรือพระที่นั่งสุพรรณหงส์) with royal canopy & oarsmen. */
export function makeRoyalSwanBarge(): { group: THREE.Group; oars: THREE.Group[] } {
  const g = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.25 });
  const redMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.72 });

  // Sleek long gilded barge hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.46, 1.15), goldMat);
  hull.position.y = 0.22;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.14, 1.22), redMat);
  trim.position.y = 0.42;
  g.add(hull, trim);

  // Sculpted sweeping golden swan prow + tail
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 2.2, 8), goldMat);
  neck.position.set(5.9, 1.15, 0);
  neck.rotation.z = -0.35;
  const swanHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), goldMat);
  swanHead.position.set(6.35, 2.15, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.38, 6), goldMat);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(6.62, 2.12, 0);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 1.9, 8), goldMat);
  tail.position.set(-5.8, 1.0, 0);
  tail.rotation.z = 0.42;
  g.add(neck, swanHead, beak, tail);

  // Central Royal Busabok Pavilion Canopy
  addPartBox(g, 2.2, 0.2, 1.1, redMat, 0, 0.56, 0);
  [-0.9, 0.9].forEach((px) => {
    [-0.45, 0.45].forEach((pz) => addPartBox(g, 0.08, 1.35, 0.08, goldMat, px, 1.25, pz));
  });
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.15, 4), goldMat);
  canopy.rotation.y = Math.PI / 4;
  canopy.position.set(0, 2.45, 0);
  g.add(canopy);

  // Crimson-coated Royal Oarsmen & gilded paddles
  const oars: THREE.Group[] = [];
  [-3.8, -2.5, 2.5, 3.8].forEach((rx) => {
    const oarsman = makeAyutthayaFigure('#991b1b', '#eab308', { helmetGold: true });
    oarsman.position.set(rx, -0.15, 0);
    oarsman.rotation.y = Math.PI / 2;
    oarsman.scale.setScalar(0.84);
    g.add(oarsman);

    const oar = new THREE.Group();
    oar.position.set(rx, 0.4, 0.58);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.65, 6), goldMat);
    shaft.position.set(0, -0.52, 0.28);
    shaft.rotation.x = 0.5;
    oar.add(shaft);
    g.add(oar);
    oars.push(oar);
  });

  return { group: g, oars };
}

/** Builds a detailed Royal Ayutthaya War Elephant (ช้างศึกทรงเครื่อง) with silk howdah & mahout. */
export function makeAyutthayaWarElephant(): THREE.Group {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 });
  const redCloth = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.72 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.25 });
  const ivoryMat = new THREE.MeshStandardMaterial({ color: '#fef9c3', roughness: 0.35 });

  // 4 sturdy elephant legs
  [-0.78, 0.78].forEach((lx) => {
    [-0.42, 0.42].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 1.25, 8), skinMat);
      leg.position.set(lx, 0.62, lz);
      g.add(leg);
    });
  });

  // Massive barrel torso + crimson-gold battle caparison
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), skinMat);
  body.scale.set(1.35, 0.92, 0.85);
  body.position.set(0, 1.68, 0);
  const blanket = addPartBox(g, 1.55, 0.75, 1.62, redCloth, 0, 1.82, 0);
  blanket.scale.set(1, 1, 1.02);
  addPartBox(g, 1.6, 0.14, 1.66, goldMat, 0, 1.44, 0);
  g.add(body);

  // Elephant Head, Ears, Curved Ivory Tusks & Trunk (facing -X toward city gate / river!)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), skinMat);
  head.position.set(-1.32, 2.02, 0);
  [-0.55, 0.55].forEach((ez) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.48), skinMat);
    ear.position.set(-1.12, 2.05, ez);
    ear.rotation.y = ez > 0 ? -0.35 : 0.35;
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.85, 8), ivoryMat);
    tusk.rotation.z = Math.PI / 1.55;
    tusk.position.set(-1.72, 1.56, ez * 0.52);
    g.add(ear, tusk);
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 1.15, 8), skinMat);
  trunk.position.set(-1.82, 1.42, 0);
  trunk.rotation.z = -0.3;
  g.add(head, trunk);

  // Gilded War Howdah seat & Mahout Rider
  addPartBox(g, 0.92, 0.52, 0.96, goldMat, 0.08, 2.52, 0);
  const mahout = makeAyutthayaFigure('#991b1b', '#eab308', { helmetGold: true, hasSpear: true });
  mahout.position.set(-0.75, 1.88, 0);
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

/** Builds a detailed 3D Ayutthaya Horse (+X facing) with 4 pivoted galloping legs, flowing mane/tail, crimson-gold saddle, and optional rider. */
export function makeAyutthayaHorse(
  coatColor = '#6e3819',
  options?: { withRider?: boolean; riderShirt?: string; riderHelmetGold?: boolean }
): AyutthayaHorseHandle {
  const g = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.78 });
  const maneMat = new THREE.MeshStandardMaterial({ color: coatColor === '#e2e8f0' ? '#cbd5e1' : '#18181b', roughness: 0.9 });
  const hoofMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.85 });
  const saddleMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.68 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.28 });

  // Muscular barrel horse torso
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 1.48, 10), coatMat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 1.04, 0);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.37, 9, 8), coatMat);
  chest.position.set(0.68, 1.04, 0);
  const rump = new THREE.Mesh(new THREE.SphereGeometry(0.37, 9, 8), coatMat);
  rump.position.set(-0.68, 1.04, 0);
  g.add(body, chest, rump);

  // Arched Neck, Sculpted Equine Head, Ears, Flowing Mane & Swishing Tail (+X forward!)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.78, 8), coatMat);
  neck.position.set(0.9, 1.44, 0);
  neck.rotation.z = -0.58;
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.08), maneMat);
  mane.position.set(0.8, 1.5, 0);
  mane.rotation.z = -0.58;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.22), coatMat);
  head.position.set(1.22, 1.68, 0);
  head.rotation.z = -0.35;
  [-0.07, 0.07].forEach((ez) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 5), coatMat);
    ear.position.set(1.06, 1.86, ez);
    g.add(ear);
  });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.78, 6), maneMat);
  tail.position.set(-1.02, 0.94, 0);
  tail.rotation.z = -0.45;
  g.add(neck, mane, head, tail);

  // Crimson & Gold Siamese War/Travel Saddle
  addPartBox(g, 0.56, 0.14, 0.78, saddleMat, 0.05, 1.38, 0);
  addPartBox(g, 0.6, 0.06, 0.82, goldMat, 0.05, 1.31, 0);

  // 4 Pivoted Galloping Legs (Front Left, Front Right, Back Left, Back Right)
  const legs: THREE.Group[] = [];
  [
    [0.58, 0.2],
    [0.58, -0.2],
    [-0.58, 0.2],
    [-0.58, -0.2],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Group();
    leg.position.set(lx, 0.84, lz);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.76, 7), coatMat);
    upper.position.y = -0.38;
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.1, 7), hoofMat);
    hoof.position.y = -0.78;
    leg.add(upper, hoof);
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
    rider.position.set(0.05, 0.95, 0);
    rider.rotation.y = Math.PI / 2; // faces +X along horse travel direction!
    g.add(rider);
  }

  return { group: g, legs, rider };
}

/** Places lush Ayutthaya Bodhi trees, arched coconut palms, bamboo groves, skyline spires & lotus across the 380m map. */
export function buildAyutthayaFoliage(scene: THREE.Scene): void {
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
