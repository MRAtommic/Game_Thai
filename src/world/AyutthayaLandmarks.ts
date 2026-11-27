import * as THREE from 'three';
import { makeAyutthayaBrickTex, makeAyutthayaFigure, makeAyutthayaSignTex } from './AyutthayaArchitecture';

export interface AyutthayaLandmarkHandles {
  hearthLight: THREE.PointLight;
  templeLights: THREE.PointLight[];
  canalCorpses: THREE.Mesh[];
  pitFlames: THREE.Mesh[];
  pitSmoke: THREE.Mesh[];
  pitLight: THREE.PointLight;
  pretaShadow: THREE.Group;
  marketWalkers: { group: THREE.Group; baseX: number; range: number; speed: number; phase: number }[];
  templeArchSign: THREE.Mesh;
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  col: string,
  x: number,
  y: number,
  z: number,
  rough = 0.82,
  metal = 0.08
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: metal })
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function buildJunkShip(x: number, z: number, labelTitle: string, isEvac = false): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const hullCol = isEvac ? '#5c2d16' : '#4a2511';
  // Sculpted wooden hull + raised stern cabin + high bow
  addBox(g, 9.2, 1.35, 2.5, hullCol, 0, 0.42, 0, 0.85);
  addBox(g, 2.8, 1.45, 2.3, '#7c3f1d', -3.0, 1.5, 0, 0.8); // stern cabin
  addBox(g, 3.0, 0.14, 2.55, '#92400e', -3.0, 2.26, 0, 0.78);
  const bow = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 2.8, 4),
    new THREE.MeshStandardMaterial({ color: hullCol, roughness: 0.85 })
  );
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.x = Math.PI / 4;
  bow.scale.set(0.75, 1, 1.05);
  bow.position.set(5.4, 0.82, 0);
  g.add(bow);

  // Twin tall wooden masts with ribbed bamboo canvas sails
  [-0.8, 2.1].forEach((mx, mi) => {
    const h = mi === 0 ? 7.2 : 5.8;
    addBox(g, 0.16, h, 0.16, '#3f2210', mx, h / 2 + 0.5, 0, 0.9);
    const sail = addBox(g, 0.08, h * 0.55, mi === 0 ? 2.5 : 2.0, '#efe2c6', mx, h * 0.62 + 0.6, 0, 0.92);
    sail.rotation.y = Math.PI / 2;
    [0.38, 0.56, 0.74].forEach((ry) => {
      addBox(g, 2.3, 0.05, 0.1, '#78350f', mx, h * ry + 0.6, 0, 0.85);
    });
  });

  // Warm red Chinese/Ayutthaya hanging ship lanterns
  [-3.8, 0.5, 4.2].forEach((lx) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    l.position.set(lx, 2.45, -1.1);
    g.add(l);
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.75),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#eab308', '#fef08a', labelTitle) })
  );
  sign.position.set(0, 1.25, -1.32);
  sign.rotation.y = Math.PI;
  g.add(sign);

  // Note: ships face camera cleanly via z-side banner on +Z side too
  const signFront = sign.clone();
  signFront.position.set(0, 1.25, 1.32);
  signFront.rotation.y = 0;
  g.add(signFront);
  return g;
}

/** Builds Ayutthaya Canal, Piers, Markets, Blacksmith Forge, City Wall & Open Gate, Wat Mahathat & Mass Grave Pit. */
export function buildAyutthayaLandmarks(scene: THREE.Scene): AyutthayaLandmarkHandles {
  const brickMat = new THREE.MeshStandardMaterial({ map: makeAyutthayaBrickTex(), roughness: 0.88 });
  const templeLights: THREE.PointLight[] = [];

  // 1) Ground Roadway & Chao Phraya Canal (-135 .. +135)
  addBox(scene, 270, 0.3, 14, '#4b3726', 0, -0.15, -3.2, 0.95); // packed clay village road & yards
  const canalWater = new THREE.Mesh(
    new THREE.PlaneGeometry(270, 8.5),
    new THREE.MeshStandardMaterial({ color: '#0f3b4c', roughness: 0.46, metalness: 0.12 })
  );
  canalWater.rotation.x = -Math.PI / 2;
  canalWater.position.set(0, -0.22, 7.1);
  scene.add(canalWater);
  // Wooden canal embankment retaining wall + pilings along z = 2.85
  addBox(scene, 270, 0.55, 0.32, '#3d2516', 0, -0.08, 2.85, 0.92);
  for (let px = -126; px <= 126; px += 4.5) {
    addBox(scene, 0.18, 0.85, 0.18, '#2b180e', px, -0.02, 2.95, 0.95);
  }

  // 5 Wooden Boat Piers (ท่าน้ำ) with grounded left-side signboard post clear of dock & canal boats
  [-112, -52, 22, 74, 116].forEach((px, idx) => {
    addBox(scene, 3.6, 0.14, 2.1, '#6b3e22', px, 0.08, 3.6, 0.85);
    [-1.4, 1.4].forEach((ox) => {
      addBox(scene, 0.16, 1.25, 0.16, '#3f2210', px + ox, 0.42, 4.48, 0.9);
    });
    // Left bank post dedicated to pier sign (no floating signs or overlap with dock moorings!)
    addBox(scene, 0.1, 1.55, 0.1, '#451a03', px - 2.05, 0.78, 2.7, 0.9);
    const pierSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 0.44),
      new THREE.MeshBasicMaterial({
        map: makeAyutthayaSignTex(
          '#451a03',
          '#eab308',
          '#fef08a',
          idx === 4 ? 'ท่าเรืออพยพ' : 'ท่าน้ำลงเรือ [E]'
        ),
        side: THREE.DoubleSide,
      })
    );
    pierSign.position.set(px - 2.05, 1.38, 2.76);
    scene.add(pierSign);
  });

  // Grand Junk Ships at both river ends
  scene.add(buildJunkShip(-119, 6.2, 'เรือสำเภาสินค้าน่านน้ำ', false));
  scene.add(buildJunkShip(120, 6.2, 'เรือสำเภาหลวงอพยพ', true));

  // Floating shrouded corpses along the canal (hidden during peaceful Act 1)
  const canalCorpses: THREE.Mesh[] = [];
  [-92, -32, 36, 98].forEach((cx, ci) => {
    const c = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.15, 1.45, 8),
      new THREE.MeshStandardMaterial({ color: ci % 2 === 0 ? '#cbd5e1' : '#9ca3af', roughness: 0.9 })
    );
    c.rotation.z = Math.PI / 2;
    c.rotation.y = 0.25 * (ci % 2 === 0 ? 1 : -1);
    c.position.set(cx, -0.18, 5.2 + (ci % 2) * 1.1);
    c.visible = false;
    scene.add(c);
    canalCorpses.push(c);
  });

  // 2) Ayutthaya Waterside Market (-104 .. -74)
  const stalls = [
    { x: -101, name: 'ตลาดเครื่องเทศ & ผ้าไหม', roof: '#7c2d12', items: ['#dc2626', '#facc15', '#a855f7'] },
    { x: -91, name: 'แผงหม้อดิน & เครื่องถ้วยชาม', roof: '#854d0e', items: ['#b45309', '#78350f', '#cbd5e1'] },
    { x: -80, name: 'โรงครัวขนมไทย & ปลาตากแห้ง', roof: '#991b1b', items: ['#f59e0b', '#e2e8f0', '#ea580c'] },
  ];
  stalls.forEach((st) => {
    addBox(scene, 5.2, 0.14, 2.3, '#57361e', st.x, 0.07, -2.1, 0.9);
    [-2.4, 2.4].forEach((sx) => {
      addBox(scene, 0.14, 2.95, 0.14, '#452613', st.x + sx, 1.48, -3.1, 0.88);
      addBox(scene, 0.14, 2.85, 0.14, '#452613', st.x + sx, 1.42, -1.1, 0.88);
    });
    const rfF = addBox(scene, 5.6, 0.08, 1.55, st.roof, st.x, 3.08, -1.55, 0.82);
    rfF.rotation.x = 0.34;
    const rfB = addBox(scene, 5.6, 0.08, 1.55, st.roof, st.x, 3.08, -2.65, 0.82);
    rfB.rotation.x = -0.34;
    addBox(scene, 4.4, 0.78, 0.72, '#6b3e22', st.x, 0.45, -1.55, 0.84);
    st.items.forEach((ic, ii) => {
      const prop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.15, 0.32, 10),
        new THREE.MeshStandardMaterial({ color: ic, roughness: 0.65 })
      );
      prop.position.set(st.x - 1.1 + ii * 1.1, 0.98, -1.5);
      scene.add(prop);
    });
    const vendor = makeAyutthayaFigure(st.items[0], '#451a03');
    vendor.position.set(st.x, 0, -2.25);
    scene.add(vendor);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.68),
      new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#fffbeb', st.name) })
    );
    sign.position.set(st.x, 2.38, -0.82);
    scene.add(sign);
  });

  // Patrolling market walkers (facing direction of travel, proper stride!)
  const marketWalkers = [
    { baseX: -96, range: 6, speed: 1.0, shirt: '#f43f5e' },
    { baseX: -84, range: 5, speed: 0.9, shirt: '#38bdf8' },
    { baseX: -48, range: 6, speed: 0.95, shirt: '#eab308' },
    { baseX: -28, range: 5, speed: 1.05, shirt: '#a3e635' },
  ].map((mw, idx) => {
    const fig = makeAyutthayaFigure(mw.shirt, '#1e293b', { hatCol: idx % 2 === 0 ? '#a16207' : undefined });
    fig.position.set(mw.baseX, 0, -0.35 + (idx % 2) * 0.4);
    scene.add(fig);
    return { group: fig, baseX: mw.baseX, range: mw.range, speed: mw.speed, phase: idx * 1.4 };
  });

  // 3) Ayutthaya Village Stilt Houses & Open Blacksmith Forge (-60 .. -18)
  [-59, -32, -20].forEach((hx, hi) => {
    const hGrp = new THREE.Group();
    hGrp.position.set(hx, 0, -3.2);
    [-2.0, 0, 2.0].forEach((px) => {
      [-1.0, 1.0].forEach((pz) => addBox(hGrp, 0.18, 1.45, 0.18, '#3b2112', px, 0.72, pz, 0.9));
    });
    addBox(hGrp, 4.7, 0.14, 2.8, '#5c361d', 0, 1.46, 0, 0.85);
    addBox(hGrp, 4.3, 1.55, 2.35, '#784626', 0, 2.28, 0, 0.84);
    [-1.1, 1.1].forEach((wx) => addBox(hGrp, 0.72, 0.66, 0.08, '#3f2210', wx, 2.35, 1.18, 0.8));
    // Multi-tiered Thai gable roof with enclosed triangular gable walls (ทรงไทยจั่วเต็ม)
    const rF = addBox(hGrp, 5.2, 0.1, 1.9, hi === 0 ? '#7c2d12' : '#572814', 0, 3.45, 0.78, 0.78);
    rF.rotation.x = 0.48;
    const rB = addBox(hGrp, 5.2, 0.1, 1.9, hi === 0 ? '#7c2d12' : '#572814', 0, 3.45, -0.78, 0.78);
    rB.rotation.x = -0.48;
    addBox(hGrp, 5.3, 0.14, 0.2, '#9a3412', 0, 3.88, 0, 0.72);
    [-2.12, 2.12].forEach((gx) => {
      const gable = new THREE.Mesh(
        new THREE.ConeGeometry(1.22, 0.85, 4),
        new THREE.MeshStandardMaterial({ color: '#6b3e22', roughness: 0.85 })
      );
      gable.rotation.y = Math.PI / 4;
      gable.scale.set(0.14, 1, 1.42);
      gable.position.set(gx, 3.42, 0);
      hGrp.add(gable);
    });
    scene.add(hGrp);
  });

  // Open Blacksmith Forge (โรงตีดาบหลวงลุงสิน x = -46) — raised pitched Thai roof well clear of sign!
  const forgeX = -46;
  const fGrp = new THREE.Group();
  fGrp.position.set(forgeX, 0, -2.5);
  addBox(fGrp, 5.8, 0.16, 2.6, '#44403c', 0, 0.08, 0, 0.92);
  addBox(fGrp, 5.6, 3.05, 0.18, '#4a2b17', 0, 1.6, -1.2, 0.88);
  [-2.7, 2.7].forEach((px) => addBox(fGrp, 0.2, 3.05, 0.2, '#3b2112', px, 1.52, 1.1, 0.88));
  const fRoofF = addBox(fGrp, 6.2, 0.1, 1.75, '#7c2d12', 0, 3.28, 0.72, 0.82);
  fRoofF.rotation.x = 0.34;
  const fRoofB = addBox(fGrp, 6.2, 0.1, 1.75, '#7c2d12', 0, 3.28, -0.72, 0.82);
  fRoofB.rotation.x = -0.34;
  addBox(fGrp, 6.25, 0.12, 0.18, '#9a3412', 0, 3.58, 0, 0.75);
  // Brick hearth + glowing embers + iron anvil + quench tub
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, 0.95), brickMat);
  hearth.position.set(-1.55, 0.65, -0.55);
  fGrp.add(hearth);
  const coals = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
  coals.scale.set(1.3, 0.5, 1.0);
  coals.position.set(-1.55, 1.18, -0.45);
  fGrp.add(coals);
  addBox(fGrp, 0.65, 0.55, 0.42, '#1e293b', 0.2, 0.42, -0.3, 0.4, 0.85); // steel anvil
  addBox(fGrp, 0.95, 0.48, 0.65, '#451a03', 1.45, 0.36, -0.3, 0.85); // quench tub
  // Sword rack + clearly framed Blacksmith sign cleanly below roof eaves!
  addBox(fGrp, 1.2, 1.35, 0.12, '#78350f', 2.0, 0.82, -1.0, 0.8);
  addBox(fGrp, 5.6, 0.12, 0.1, '#3b2112', 0, 2.75, 1.12, 0.88);
  const forgeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#facc15', '#fef08a', 'โรงตีดาบหลวงลุงสิน', 'ตีดาบน้ำพี้ • เติมลูกดอก • ปราบห่า') })
  );
  forgeSign.position.set(0, 2.48, 1.26);
  fGrp.add(forgeSign);
  scene.add(fGrp);

  const hearthLight = new THREE.PointLight('#fb923c', 4.6, 12, 1.1);
  hearthLight.position.set(forgeX - 1.5, 1.65, -1.8);
  scene.add(hearthLight);

  // 4) Iconic Red-Brick Ayutthaya City Wall & Open Victory Gate (x = -4 .. +28, gate center x = +12)
  const wallY = 3.6;
  // Left & Right Brick Curtain Walls with authentic diamond battlements (ใบเสมา)
  [
    { x: 2.2, w: 13.0 },
    { x: 21.8, w: 13.0 },
  ].forEach((seg) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(seg.w, wallY, 1.3), brickMat);
    wall.position.set(seg.x, wallY / 2, -2.5);
    scene.add(wall);
    const numSema = Math.floor(seg.w / 1.45);
    for (let i = 0; i < numSema; i++) {
      const bx = seg.x - seg.w / 2 + 0.75 + i * 1.45;
      const sema = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.72, 4), brickMat);
      sema.rotation.y = Math.PI / 4;
      sema.position.set(bx, wallY + 0.34, -2.5);
      scene.add(sema);
    }
  });
  // Open Vaulted City Gate Archway (x = 12, walk cleanly through z = -2.5!)
  [9.35, 14.65].forEach((gx) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.3, 4.4, 1.65), brickMat);
    pier.position.set(gx, 2.2, -2.5);
    scene.add(pier);
  });
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.15, 1.68), brickMat);
  archTop.position.set(12, 4.15, -2.5);
  scene.add(archTop);
  // Multi-tiered Thai Prasat roof atop the City Gate Tower!
  addBox(scene, 5.4, 0.16, 2.4, '#7c2d12', 12, 4.82, -2.5, 0.78);
  addBox(scene, 3.8, 0.16, 1.8, '#9a3412', 12, 5.15, -2.5, 0.75);
  const spireTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.25 })
  );
  spireTop.position.set(12, 5.95, -2.5);
  scene.add(spireTop);
  const gateSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#eab308', '#fef08a', 'ประตูชัยกำแพงพระนคร') })
  );
  gateSign.position.set(12, 3.95, -1.62);
  scene.add(gateSign);
  // Twin iron cannons flanking gate + fire braziers
  [7.4, 16.6].forEach((cx) => {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.2, 1.55, 10),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.75, roughness: 0.35 })
    );
    barrel.rotation.z = cx < 12 ? 0.35 : -0.35;
    barrel.position.set(cx, 0.56, -1.1);
    addBox(scene, 0.65, 0.35, 0.52, '#451a03', cx, 0.22, -1.1, 0.88);
    scene.add(barrel);
  });

  // 5) Wat Mahathat Ayutthaya Temple Complex (+40 .. +82)
  // Authentic Thai open archway gate at x = 44 + Prang tower at x = 62 + Open Sanctuary Sala at x = 72
  [41.8, 46.2].forEach((tx) => {
    const tPier = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.4, 0.9), brickMat);
    tPier.position.set(tx, 1.7, -2.2);
    scene.add(tPier);
  });
  const tLintel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.65, 1.05), brickMat);
  tLintel.position.set(44, 3.55, -2.2);
  scene.add(tLintel);
  const tRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.55, 1.15, 4),
    new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.7 })
  );
  tRoof.rotation.y = Math.PI / 4;
  tRoof.position.set(44, 4.45, -2.2);
  scene.add(tRoof);
  const templeArchSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 0.64),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#fef08a', 'วัดมหาธาตุ (เขตอภัยทาน)') })
  );
  templeArchSign.position.set(44, 3.55, -1.64);
  scene.add(templeArchSign);

  // Towering Multi-Tiered Ayutthaya Phra Prang (พระปรางค์วัดมหาธาตุ x = 60, z = -4.2)
  const prangX = 60;
  const prangMat = new THREE.MeshStandardMaterial({ color: '#8f4734', roughness: 0.85 });
  [
    { w: 5.2, h: 1.2, y: 0.6 },
    { w: 3.9, h: 1.4, y: 1.9 },
    { w: 3.0, h: 1.5, y: 3.35 },
    { w: 2.25, h: 1.35, y: 4.75 },
    { w: 1.6, h: 1.2, y: 6.0 },
    { w: 1.05, h: 1.1, y: 7.1 },
  ].forEach((tier) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(tier.w * 0.42, tier.w * 0.5, tier.h, 8), prangMat);
    m.position.set(prangX, tier.y, -4.2);
    scene.add(m);
  });
  const prangTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.55, 8),
    new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.25 })
  );
  prangTop.position.set(prangX, 8.4, -4.2);
  scene.add(prangTop);

  // Open Sanctuary Sala (ศาลาการเปรียญเขตอภัยทาน x = 70, z = -2.2) where survivors take refuge!
  addBox(scene, 7.2, 0.24, 3.2, '#7c3e20', 70, 0.12, -2.2, 0.85);
  [-3.2, 0, 3.2].forEach((px) => addBox(scene, 0.22, 3.0, 0.22, '#991b1b', 70 + px, 1.6, -0.8, 0.7));
  [-3.2, 3.2].forEach((px) => addBox(scene, 0.22, 3.0, 0.22, '#991b1b', 70 + px, 1.6, -3.6, 0.7));
  const salaRfF = addBox(scene, 7.8, 0.12, 2.2, '#991b1b', 70, 3.38, -1.35, 0.7);
  salaRfF.rotation.x = 0.42;
  const salaRfB = addBox(scene, 7.8, 0.12, 2.2, '#991b1b', 70, 3.38, -3.05, 0.7);
  salaRfB.rotation.x = -0.42;
  const salaLight = new THREE.PointLight('#fde68a', 5.2, 16, 1.0);
  salaLight.position.set(70, 2.65, -1.8);
  scene.add(salaLight);
  templeLights.push(salaLight);

  // 6) Plague Cemetery & Mass Grave Pit (หลุมศพใหญ่โรคห่า x = 97, z = -2.6) + Preta Shadow!
  const pitX = 97;
  const pitZ = -2.6;
  // Dark sunken pit floor + outer soil earth berms forming a clear dug trench
  addBox(scene, 7.6, 0.08, 3.4, '#1c120c', pitX, 0.02, pitZ, 0.98);
  [
    [pitX, 0.24, pitZ - 1.75, 8.2, 0.48, 0.55],
    [pitX, 0.24, pitZ + 1.65, 8.2, 0.42, 0.5],
    [pitX - 4.0, 0.24, pitZ, 0.65, 0.45, 3.6],
    [pitX + 4.0, 0.24, pitZ, 0.65, 0.45, 3.6],
  ].forEach(([bx, by, bz, bw, bh, bd]) => addBox(scene, bw, bh, bd, '#4a3222', bx, by, bz, 0.96));

  // Piled shroud-wrapped plague corpses mounded inside the mass grave pit!
  const clothMat1 = new THREE.MeshStandardMaterial({ color: '#d6d3d1', roughness: 0.94 });
  const clothMat2 = new THREE.MeshStandardMaterial({ color: '#a8a29e', roughness: 0.95 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
  for (let i = 0; i < 14; i++) {
    const layer = i >= 8 ? 1 : 0;
    const cx = pitX - 2.6 + (i % 7) * 0.86 + (layer ? 0.35 : 0);
    const cy = 0.16 + layer * 0.26;
    const cz = pitZ + ((i % 3) - 1) * 0.52;
    const corpse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.13, 1.38, 7),
      i % 2 === 0 ? clothMat1 : clothMat2
    );
    corpse.rotation.z = Math.PI / 2 + ((i % 5) - 2) * 0.09;
    corpse.rotation.y = ((i % 4) - 1.5) * 0.28;
    corpse.position.set(cx, cy, cz);
    scene.add(corpse);

    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 5, 8), ropeMat);
    tie.position.set(cx, cy, cz);
    tie.rotation.y = Math.PI / 2;
    scene.add(tie);
  }

  // Smoldering funeral pyre flames & smoke beside/inside the pit + sign
  const pitFlames: THREE.Mesh[] = [];
  const pitSmoke: THREE.Mesh[] = [];
  [-2.5, 0, 2.5].forEach((fx) => {
    const fl = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.72, 7),
      new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.85 })
    );
    fl.position.set(pitX + fx, 0.52, pitZ + 0.15);
    fl.visible = false;
    scene.add(fl);
    pitFlames.push(fl);

    const sm = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 7, 6),
      new THREE.MeshBasicMaterial({ color: '#475569', transparent: true, opacity: 0.36 })
    );
    sm.position.set(pitX + fx, 1.65, pitZ);
    sm.visible = false;
    scene.add(sm);
    pitSmoke.push(sm);
  });

  [-1.2, 1.2].forEach((ox) => addBox(scene, 0.1, 1.85, 0.1, '#451a03', pitX - 4.6 + ox, 0.92, -1.16, 0.9));
  const pitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#ef4444', '#fecaca', 'หลุมฝังกลบศพโรคห่า', 'เขตอันตราย — ห้ามเข้าใกล้หลังตะวันตกดิน') })
  );
  pitSign.position.set(pitX - 4.6, 1.52, -1.1);
  scene.add(pitSign);

  const pitLight = new THREE.PointLight('#fb923c', 1.2, 14, 1.15);
  pitLight.position.set(pitX, 1.6, pitZ + 0.8);
  scene.add(pitLight);

  // Towering Ayutthaya Cemetery Preta shadow (visible at night behind the grave pit)
  const pretaShadow = new THREE.Group();
  const pMat = new THREE.MeshBasicMaterial({ color: '#020306', transparent: true, opacity: 0.8 });
  [-0.24, 0.24].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 4.4, 7), pMat);
    leg.position.set(lx, 2.2, 0);
    pretaShadow.add(leg);
  });
  const pTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 2.2, 8), pMat);
  pTorso.position.set(0, 5.4, 0);
  const pNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 7), pMat);
  pNeck.position.set(0, 7.0, 0);
  const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 9, 8), pMat);
  pHead.position.set(0, 7.65, 0);
  pretaShadow.add(pTorso, pNeck, pHead);
  [-0.07, 0.07].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    eye.position.set(ex, 7.68, 0.19);
    pretaShadow.add(eye);
  });
  [-0.36, 0.36].forEach((ax, ai) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 3.2, 7), pMat);
    arm.name = ai === 0 ? 'pretaArmL' : 'pretaArmR';
    arm.position.set(ax, 4.8, 0.08);
    arm.rotation.z = ai === 0 ? 0.12 : -0.12;
    pretaShadow.add(arm);
  });
  pretaShadow.position.set(96, 0, -9.2);
  pretaShadow.visible = false;
  scene.add(pretaShadow);

  return {
    hearthLight,
    templeLights,
    canalCorpses,
    pitFlames,
    pitSmoke,
    pitLight,
    pretaShadow,
    marketWalkers,
    templeArchSign,
  };
}
