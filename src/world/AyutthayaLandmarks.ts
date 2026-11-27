import * as THREE from 'three';
import {
  addPartBox,
  AyutthayaHorseHandle,
  makeAyutthayaBoat,
  makeAyutthayaBrickTex,
  makeAyutthayaFigure,
  makeAyutthayaHorse,
  makeAyutthayaSignTex,
  makeRoyalSwanBarge,
} from './AyutthayaArchitecture';
import { AyutthayaInnerHandles, buildAyutthayaInnerCity } from './AyutthayaInnerCity';

export interface AyutthayaTrafficHorse extends AyutthayaHorseHandle {
  x: number;
  dir: 1 | -1;
  speed: number;
  minX: number;
  maxX: number;
  phase: number;
}

export interface AyutthayaLandmarkHandles extends AyutthayaInnerHandles {
  hearthLight: THREE.PointLight;
  canalCorpses: THREE.Mesh[];
  swanBarge: { group: THREE.Group; oars: THREE.Group[]; x: number; dir: 1 | -1 };
  marketWalkers: { group: THREE.Group; baseX: number; range: number; speed: number; phase: number }[];
  trafficHorses: AyutthayaTrafficHorse[];
}

function buildJunkShip(x: number, z: number, labelTitle: string, isEvac = false): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const hullMat = new THREE.MeshStandardMaterial({ color: isEvac ? '#5c2d16' : '#4a2511', roughness: 0.85 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: '#7c3f1d', roughness: 0.8 });
  const mastMat = new THREE.MeshStandardMaterial({ color: '#3f2210', roughness: 0.9 });
  const sailMat = new THREE.MeshStandardMaterial({ color: '#efe2c6', roughness: 0.92 });

  addPartBox(g, 9.2, 1.35, 2.5, hullMat, 0, 0.42, 0);
  addPartBox(g, 2.8, 1.45, 2.3, cabinMat, -3.0, 1.5, 0);
  addPartBox(g, 3.0, 0.14, 2.55, mastMat, -3.0, 2.26, 0);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.8, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.x = Math.PI / 4;
  bow.scale.set(0.75, 1, 1.05);
  bow.position.set(5.4, 0.82, 0);
  g.add(bow);

  [-0.8, 2.1].forEach((mx, mi) => {
    const h = mi === 0 ? 7.2 : 5.8;
    addPartBox(g, 0.16, h, 0.16, mastMat, mx, h / 2 + 0.5, 0);
    const sail = addPartBox(g, 0.08, h * 0.55, mi === 0 ? 2.5 : 2.0, sailMat, mx, h * 0.62 + 0.6, 0);
    sail.rotation.y = Math.PI / 2;
    [0.38, 0.56, 0.74].forEach((ry) => addPartBox(g, 2.3, 0.05, 0.1, mastMat, mx, h * ry + 0.6, 0));
  });

  [-3.8, 0.5, 4.2].forEach((lx) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
    l.position.set(lx, 2.45, -1.1);
    g.add(l);
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 0.76),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#eab308', '#fef08a', labelTitle), side: THREE.DoubleSide })
  );
  sign.position.set(0, 1.25, -1.32);
  g.add(sign);
  return g;
}

/**
 * Builds all 380 meters (-190..+190) of Ayutthaya Kingdom: Chao Phraya Canal, 8 Boat Piers, Royal Swan Barge,
 * Floating Market & Raft Houses, Peasant Village & Rice Paddies, Blacksmith Forge, Nobleman's Compound,
 * Walled City, Garrison, Royal Palace, Triple Golden Chedis, Five-Prang Wat Chai, Ghost Gate & Mass Grave Pit.
 */
export function buildAyutthayaLandmarks(scene: THREE.Scene): AyutthayaLandmarkHandles {
  const brickMat = new THREE.MeshStandardMaterial({ map: makeAyutthayaBrickTex(), roughness: 0.88 });
  const woodDark = new THREE.MeshStandardMaterial({ color: '#3b2112', roughness: 0.9 });
  const woodMid = new THREE.MeshStandardMaterial({ color: '#5c361d', roughness: 0.85 });
  const woodPlank = new THREE.MeshStandardMaterial({ color: '#784626', roughness: 0.84 });
  const thatchMat = new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.92 });
  const redRoofMat = new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.78 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.62, roughness: 0.28 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.72, roughness: 0.35 });

  // 1) 390m Roadway, Chao Phraya River Canal & 8 Boat Piers
  addPartBox(scene, 396, 0.3, 15.5, new THREE.MeshStandardMaterial({ color: '#4b3726', roughness: 0.95 }), 0, -0.15, -3.5);
  const canalWater = new THREE.Mesh(
    new THREE.PlaneGeometry(396, 10.5),
    new THREE.MeshStandardMaterial({ color: '#0f3b4c', roughness: 0.46, metalness: 0.12 })
  );
  canalWater.rotation.x = -Math.PI / 2;
  canalWater.position.set(0, -0.22, 8.1);
  scene.add(canalWater);
  addPartBox(scene, 396, 0.55, 0.34, woodDark, 0, -0.08, 2.85);
  for (let px = -188; px <= 188; px += 5) {
    addPartBox(scene, 0.18, 0.85, 0.18, woodDark, px, -0.02, 2.95);
  }

  [-168, -128, -84, -36, 18, 72, 134, 178].forEach((px, idx) => {
    addPartBox(scene, 3.6, 0.14, 2.1, woodMid, px, 0.08, 3.6);
    [-1.4, 1.4].forEach((ox) => addPartBox(scene, 0.16, 1.25, 0.16, woodDark, px + ox, 0.42, 4.48));
    addPartBox(scene, 0.1, 1.55, 0.1, woodDark, px - 2.05, 0.78, 2.7);
    const pierSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 0.44),
      new THREE.MeshBasicMaterial({
        map: makeAyutthayaSignTex('#451a03', '#eab308', '#fef08a', idx === 7 ? 'ท่าเรืออพยพ' : 'ท่าน้ำลงเรือ [E]'),
        side: THREE.DoubleSide,
      })
    );
    pierSign.position.set(px - 2.05, 1.38, 2.76);
    scene.add(pierSign);
  });

  // Grand Foreign Junk Ship & Red-Brick Riverside Warehouse (-182)
  scene.add(buildJunkShip(-180, 6.4, 'เรือสำเภาสินค้าน่านน้ำ', false));
  const wh = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.0, 2.6), brickMat);
  wh.position.set(-182, 1.5, -2.5);
  scene.add(wh);
  addPartBox(scene, 6.0, 0.2, 3.0, redRoofMat, -182, 3.1, -2.5);

  // Floating River Corpses (visible once plague starts)
  const canalCorpses: THREE.Mesh[] = [];
  const corpseMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9 });
  [-150, -96, -24, 48, 156].forEach((cx, ci) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 1.45, 8), corpseMat);
    c.rotation.z = Math.PI / 2;
    c.rotation.y = 0.25 * (ci % 2 === 0 ? 1 : -1);
    c.position.set(cx, -0.18, 5.4 + (ci % 2) * 1.1);
    c.visible = false;
    scene.add(c);
    canalCorpses.push(c);
  });

  // Royal Golden Swan Barge cruising along the Chao Phraya riverfront!
  const sb = makeRoyalSwanBarge();
  sb.group.position.set(30, -0.1, 7.3);
  scene.add(sb.group);

  // =========================================================================
  // 2) Ayutthaya Grand Floating Market & Raft Houses (-174 .. -122)
  // =========================================================================
  // Elevated Raft-Houses connected by timber boardwalk + Canopied Vendor Boats right below!
  const raftConfigs = [
    { x: -168, title: 'แพเครื่องเทศ & สมุนไพร', col: '#dc2626' },
    { x: -157, title: 'ตลาดน้ำผ้าแพร & สังคโลก', col: '#eab308' },
    { x: -146, title: 'แพขนมไทย & ปลาแม่น้ำ', col: '#be185d' },
    { x: -135, title: 'ท่าเทียบเรือสินค้าตลาดน้ำ', col: '#0284c7' },
  ];
  raftConfigs.forEach((rc, idx) => {
    addPartBox(scene, 6.2, 0.16, 2.6, woodMid, rc.x, 0.08, -2.0);
    [-2.8, 2.8].forEach((ox) => {
      addPartBox(scene, 0.14, 2.9, 0.14, woodDark, rc.x + ox, 1.45, -3.1);
      addPartBox(scene, 0.14, 2.8, 0.14, woodDark, rc.x + ox, 1.4, -0.9);
    });
    const rfF = addPartBox(scene, 6.6, 0.08, 1.6, idx % 2 === 0 ? thatchMat : redRoofMat, rc.x, 3.05, -1.45);
    rfF.rotation.x = 0.34;
    const rfB = addPartBox(scene, 6.6, 0.08, 1.6, idx % 2 === 0 ? thatchMat : redRoofMat, rc.x, 3.05, -2.55);
    rfB.rotation.x = -0.34;
    addPartBox(scene, 5.2, 0.72, 0.72, woodPlank, rc.x, 0.42, -1.4);

    // Colorful produce baskets & clay pots on market counter
    [-1.2, 0, 1.2].forEach((bx) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.14, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: rc.col, roughness: 0.65 })
      );
      pot.position.set(rc.x + bx, 0.94, -1.38);
      scene.add(pot);
    });
    const vendor = makeAyutthayaFigure(rc.col, '#451a03', { sabaiCol: idx % 2 === 0 ? '#fde047' : undefined });
    vendor.position.set(rc.x, 0, -2.2);
    scene.add(vendor);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.68),
      new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#fffbeb', rc.title) })
    );
    sign.position.set(rc.x, 2.38, -0.78);
    scene.add(sign);

    // Floating bamboo-canopied vendor sampan moored right along the Floating Market canal!
    const floatBoat = makeAyutthayaBoat(3.5, true, rc.col, true);
    floatBoat.group.position.set(rc.x + 1.2, -0.14, 4.15);
    floatBoat.group.scale.x = idx % 2 === 0 ? 1 : -1;
    scene.add(floatBoat.group);
  });

  // =========================================================================
  // 3) Peasant Village, Emerald Rice Paddies, Brick Kiln & Blacksmith Forge (-120 .. -64)
  // =========================================================================
  // Emerald & Golden Rice Paddies + Elevated Rice Granary (ยุ้งข้าว + นาข้าวอยุธยา)
  const paddyMat = new THREE.MeshStandardMaterial({ color: '#3f6212', roughness: 0.92 });
  [-116, -106].forEach((px) => {
    addPartBox(scene, 8.5, 0.08, 4.2, paddyMat, px, 0.03, -3.2);
    for (let r = -3.4; r <= 3.4; r += 0.9) {
      const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 5), new THREE.MeshStandardMaterial({ color: '#65a30d', roughness: 0.9 }));
      stalk.position.set(px + r, 0.35, -3.1 + (Math.floor(r * 2) % 2) * 0.8);
      scene.add(stalk);
    }
  });
  // Elevated Peasant Stilt Houses (-112, -98, -70) + Sala Waterfront (-96)
  [-112, -97, -69].forEach((hx, hi) => {
    const hGrp = new THREE.Group();
    hGrp.position.set(hx, 0, -3.3);
    [-2.0, 0, 2.0].forEach((px) => {
      [-1.0, 1.0].forEach((pz) => addPartBox(hGrp, 0.18, 1.45, 0.18, woodDark, px, 0.72, pz));
    });
    addPartBox(hGrp, 4.7, 0.14, 2.8, woodMid, 0, 1.46, 0);
    addPartBox(hGrp, 4.3, 1.55, 2.35, woodPlank, 0, 2.28, 0);
    [-1.1, 1.1].forEach((wx) => addPartBox(hGrp, 0.72, 0.66, 0.08, woodDark, wx, 2.35, 1.18));
    const rF = addPartBox(hGrp, 5.2, 0.1, 1.9, hi === 1 ? thatchMat : redRoofMat, 0, 3.45, 0.78);
    rF.rotation.x = 0.48;
    const rB = addPartBox(hGrp, 5.2, 0.1, 1.9, hi === 1 ? thatchMat : redRoofMat, 0, 3.45, -0.78);
    rB.rotation.x = -0.48;
    addPartBox(hGrp, 5.3, 0.14, 0.2, redRoofMat, 0, 3.88, 0);
    [-2.12, 2.12].forEach((gx) => {
      const gable = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.85, 4), woodMid);
      gable.rotation.y = Math.PI / 4;
      gable.scale.set(0.14, 1, 1.42);
      gable.position.set(gx, 3.42, 0);
      hGrp.add(gable);
    });
    scene.add(hGrp);
  });

  // Brick Stacks & Rice Granary Yard at -104 (just like historical Ayutthaya riverside print!)
  const brickStack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 1.1), brickMat);
  brickStack.position.set(-104, 0.38, -1.6);
  scene.add(brickStack);

  // Open Blacksmith Forge (โรงตีดาบหลวงลุงสิน x = -82)
  const forgeX = -82;
  const fGrp = new THREE.Group();
  fGrp.position.set(forgeX, 0, -2.5);
  addPartBox(fGrp, 5.8, 0.16, 2.6, ironMat, 0, 0.08, 0);
  addPartBox(fGrp, 5.6, 3.05, 0.18, woodMid, 0, 1.6, -1.2);
  [-2.7, 2.7].forEach((px) => addPartBox(fGrp, 0.2, 3.05, 0.2, woodDark, px, 1.52, 1.1));
  const fRoofF = addPartBox(fGrp, 6.2, 0.1, 1.75, redRoofMat, 0, 3.28, 0.72);
  fRoofF.rotation.x = 0.34;
  const fRoofB = addPartBox(fGrp, 6.2, 0.1, 1.75, redRoofMat, 0, 3.28, -0.72);
  fRoofB.rotation.x = -0.34;
  addPartBox(fGrp, 6.25, 0.12, 0.18, redRoofMat, 0, 3.58, 0);
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, 0.95), brickMat);
  hearth.position.set(-1.55, 0.65, -0.55);
  const coals = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
  coals.scale.set(1.3, 0.5, 1.0);
  coals.position.set(-1.55, 1.18, -0.45);
  fGrp.add(hearth, coals);
  addPartBox(fGrp, 0.65, 0.55, 0.42, ironMat, 0.2, 0.42, -0.3);
  addPartBox(fGrp, 0.95, 0.48, 0.65, woodDark, 1.45, 0.36, -0.3);
  addPartBox(fGrp, 5.6, 0.12, 0.1, woodDark, 0, 2.75, 1.12);
  const forgeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#facc15', '#fef08a', 'โรงตีดาบหลวงลุงสิน', 'ตีดาบน้ำพี้ • เติมลูกดอก • ปราบห่า') })
  );
  forgeSign.position.set(0, 2.48, 1.26);
  fGrp.add(forgeSign);
  scene.add(fGrp);

  const hearthLight = new THREE.PointLight('#fb923c', 4.6, 14, 1.1);
  hearthLight.position.set(forgeX - 1.5, 1.65, -1.8);
  scene.add(hearthLight);

  // =========================================================================
  // 4) Nobleman's Compound / บ้านขุนนางอยุธยา (-60 .. -14, center -38)
  // =========================================================================
  const nobX = -38;
  // Brick perimeter courtyard walls & ornate open Noble Gate (x = -38)
  [-52, -24].forEach((wx) => addPartBox(scene, 0.85, 2.8, 3.2, brickMat, wx, 1.4, -3.5));
  [-46, -30].forEach((px) => addPartBox(scene, 11.0, 2.2, 0.45, brickMat, px, 1.1, -1.9));
  // Open courtyard Thai Archway at -38
  [-40.2, -35.8].forEach((gx) => addPartBox(scene, 0.8, 3.3, 0.8, brickMat, gx, 1.65, -1.9));
  addPartBox(scene, 5.4, 0.65, 0.9, brickMat, nobX, 3.35, -1.9);
  const nobArchRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.1, 4), redRoofMat);
  nobArchRoof.rotation.y = Math.PI / 4;
  nobArchRoof.position.set(nobX, 4.15, -1.9);
  scene.add(nobArchRoof);

  // Grand Elevated 3-House Nobleman Compound (เรือนหมู่คหบดี/ขุนนาง)
  [-45, -38, -31].forEach((rx, ri) => {
    const rGrp = new THREE.Group();
    rGrp.position.set(rx, 0, -4.4);
    addPartBox(rGrp, 5.8, 1.6, 2.8, woodMid, 0, 0.8, 0);
    addPartBox(rGrp, 5.0, 1.8, 2.4, woodPlank, 0, 2.5, 0);
    const rrF = addPartBox(rGrp, 6.2, 0.12, 2.0, redRoofMat, 0, 3.85, 0.82);
    rrF.rotation.x = 0.46;
    const rrB = addPartBox(rGrp, 6.2, 0.12, 2.0, redRoofMat, 0, 3.85, -0.82);
    rrB.rotation.x = -0.46;
    addPartBox(rGrp, 6.3, 0.16, 0.22, goldMat, 0, 4.3, 0); // gilded noble gable ridge!
    if (ri === 1) {
      addPartBox(rGrp, 8.2, 0.18, 2.4, woodMid, 0, 1.62, 1.5); // central wide wooden courtyard veranda (ชานเรือน)
    }
    scene.add(rGrp);
  });
  const nobSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#fef08a', 'เรือนหมู่พระยาวิชัย (บ้านขุนนาง)', 'คฤหาสน์คหบดี & คลังโอสถหลวง') })
  );
  nobSign.position.set(nobX, 3.35, -1.35);
  scene.add(nobSign);

  // Patrolling Villagers & Noble Servants walking cleanly facing travel direction
  const marketWalkers = [
    { baseX: -158, range: 9, speed: 1.0, shirt: '#f43f5e' },
    { baseX: -140, range: 8, speed: 0.92, shirt: '#38bdf8' },
    { baseX: -102, range: 7, speed: 0.95, shirt: '#eab308' },
    { baseX: -38, range: 7, speed: 0.9, shirt: '#a855f7' },
    { baseX: 60, range: 8, speed: 1.0, shirt: '#ec4899' },
  ].map((mw, idx) => {
    const fig = makeAyutthayaFigure(mw.shirt, '#1e293b', {
      hatCol: idx % 2 === 0 ? '#a16207' : undefined,
      sabaiCol: idx >= 3 ? '#fde047' : undefined,
    });
    fig.position.set(mw.baseX, 0, -0.35 + (idx % 2) * 0.4);
    scene.add(fig);
    return { group: fig, baseX: mw.baseX, range: mw.range, speed: mw.speed, phase: idx * 1.4 };
  });

  // Ayutthaya Cavalry Patrol Horses & Courier Steeds trotting/galloping along the Royal Highway!
  const horseDefs = [
    { x: -120, dir: 1 as const, speed: 4.4, coat: '#6e3819', shirt: '#78716c', helm: false, z: 1.85, minX: -172, maxX: 8 },
    { x: -18, dir: -1 as const, speed: 4.9, coat: '#e2e8f0', shirt: '#f8fafc', helm: true, z: 1.95, minX: -54, maxX: 85 },
    { x: 24, dir: 1 as const, speed: 5.2, coat: '#1c1917', shirt: '#991b1b', helm: true, z: 1.8, minX: -48, maxX: 138 },
    { x: 96, dir: -1 as const, speed: 4.7, coat: '#7c3f1d', shirt: '#991b1b', helm: true, z: 1.9, minX: 10, maxX: 140 },
  ];
  const trafficHorses: AyutthayaTrafficHorse[] = horseDefs.map((hd, hi) => {
    const h = makeAyutthayaHorse(hd.coat, {
      withRider: true,
      riderShirt: hd.shirt,
      riderHelmetGold: hd.helm,
    });
    h.group.position.set(hd.x, 0, hd.z);
    h.group.scale.x = hd.dir;
    scene.add(h.group);
    return { ...h, x: hd.x, dir: hd.dir, speed: hd.speed, minX: hd.minX, maxX: hd.maxX, phase: hi * 1.1 };
  });

  // Build Inner Walled Ayutthaya Kingdom + Royal Palace + Temples + Cemetery
  const inner = buildAyutthayaInnerCity(scene, brickMat, buildJunkShip);

  return {
    hearthLight,
    canalCorpses,
    swanBarge: { group: sb.group, oars: sb.oars, x: 30, dir: 1 },
    marketWalkers,
    trafficHorses,
    ...inner,
  };
}
