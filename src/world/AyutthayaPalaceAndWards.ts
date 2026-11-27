import * as THREE from 'three';
import {
  makeAyutthayaFigure,
  makeAyutthayaSignTex,
  makeAyutthayaWarElephant,
  makeRoyalSwanBarge,
} from './AyutthayaArchitecture';

function box(
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

/**
 * Builds the entire walled Inner Ayutthaya Capital (-54 .. +92):
 * Brick Sema city walls + open gates, Nobleman Teak Compound & lotus pond,
 * Ayutthaya Army Barracks & War Elephants, Grand Palace & Three Golden Chedis,
 * Royal Suphannahong Barge, and 5-Prang Wat Chaiwatthanaram Temple Sanctuary.
 */
export function buildAyutthayaWalledCity(
  scene: THREE.Scene,
  brickMat: THREE.Material
): { royalBarge: THREE.Group; palaceGateSign: THREE.Mesh } {
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.68, roughness: 0.28 });
  const redWallMat = new THREE.MeshStandardMaterial({ color: '#8f251b', roughness: 0.85 });
  const whiteStucco = new THREE.MeshStandardMaterial({ color: '#f1ede4', roughness: 0.72 });
  const woodDark = new THREE.MeshStandardMaterial({ color: '#452613', roughness: 0.88 });
  const woodMid = new THREE.MeshStandardMaterial({ color: '#784626', roughness: 0.84 });
  const greenTileMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.55 });
  const redTileMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.65 });
  const prangStoneMat = new THREE.MeshStandardMaterial({ color: '#8a4633', roughness: 0.88 });
  const pondWaterMat = new THREE.MeshStandardMaterial({ color: '#0e4f5c', roughness: 0.25, metalness: 0.25 });

  // =========================================================================
  // 1) Continuous Red-Brick Ayutthaya City Wall & Gates (-54 .. +92, back z = -3.8)
  // =========================================================================
  // Left Gateway (-46): Victory Gate opening (-48.2 .. -43.8), Right Gateway (+90): East Gate (+88 .. +92)
  const wallSpans = [
    { x1: -54, x2: -48.2 },
    { x1: -43.8, x2: 14 }, // spans Nobleman district + Army camp into Palace wall
    { x1: 56, x2: 88 },
  ];
  wallSpans.forEach(({ x1, x2 }) => {
    const w = x2 - x1;
    const cx = (x1 + x2) / 2;
    box(scene, w, 3.6, 0.95, brickMat, cx, 1.8, -4.15);
    const semaCount = Math.floor(w / 1.45);
    for (let i = 0; i < semaCount; i++) {
      const sx = x1 + 0.7 + i * 1.45;
      const sema = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.68, 4), brickMat);
      sema.rotation.y = Math.PI / 4;
      sema.position.set(sx, 3.92, -4.15);
      scene.add(sema);
    }
  });

  // Twin Open Monumental City Gates (-46 West Victory Gate, +90 East Gate)
  [
    { gx: -46, label: 'ประตูชัยกำแพงพระนคร (ฝั่งตลาด)' },
    { gx: 90, label: 'ประตูผีออกป่าช้านอกกำแพง' },
  ].forEach(({ gx, label }) => {
    [-2.5, 2.5].forEach((ox) => box(scene, 1.2, 4.4, 1.5, brickMat, gx + ox, 2.2, -3.55));
    box(scene, 6.2, 1.05, 1.55, brickMat, gx, 4.15, -3.55);
    box(scene, 5.0, 0.14, 2.1, redTileMat, gx, 4.78, -3.55);
    box(scene, 3.4, 0.14, 1.6, redTileMat, gx, 5.1, -3.55);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 8), goldMat);
    fin.position.set(gx, 5.8, -3.55);
    scene.add(fin);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.3, 0.66),
      new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#eab308', '#fef08a', label) })
    );
    sign.position.set(gx, 3.98, -2.74);
    scene.add(sign);
  });

  // =========================================================================
  // 2) Nobleman Courtyard Compound / เรือนขุนนาง (-35 .. -15) + Lotus Pond
  // =========================================================================
  const nobleX = -25;
  // Red-brick garden courtyard wall with open Thai gate + Lotus Pond (สระบัว) in front!
  box(scene, 7.2, 1.35, 0.4, whiteStucco, -31.5, 0.68, -1.65);
  box(scene, 7.2, 1.35, 0.4, whiteStucco, -18.5, 0.68, -1.65);
  [-26.8, -23.2].forEach((gx) => box(scene, 0.75, 2.55, 0.55, whiteStucco, gx, 1.28, -1.65));
  const nobleGateRf = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.05, 4), redTileMat);
  nobleGateRf.rotation.y = Math.PI / 4;
  nobleGateRf.position.set(nobleX, 3.05, -1.65);
  scene.add(nobleGateRf);

  // Ornamental lotus reflection pond in front of nobleman gate
  box(scene, 4.4, 0.18, 1.45, brickMat, -30.5, 0.09, -0.55);
  box(scene, 4.0, 0.06, 1.15, pondWaterMat, -30.5, 0.19, -0.55);

  // Elevated 3-bay Ayutthaya Nobleman Teak House (เรือนหมู่ขุนนางหลังคากระบั้นจั่ว)
  [-30.5, -25, -19.5].forEach((hx, hi) => {
    const h = hi === 1 ? 1.55 : 1.35;
    [-1.4, 1.4].forEach((sx) => {
      box(scene, 0.18, h, 0.18, woodDark, hx + sx, h / 2, -2.5);
      box(scene, 0.18, h, 0.18, woodDark, hx + sx, h / 2, -3.5);
    });
    box(scene, 4.4, 0.14, 2.2, woodDark, hx, h + 0.07, -3.0);
    box(scene, 3.9, 1.55, 1.85, woodMid, hx, h + 0.88, -3.0);
    const rf1 = box(scene, 4.8, 0.1, 1.6, redTileMat, hx, h + 2.02, -2.42);
    rf1.rotation.x = 0.52;
    const rf2 = box(scene, 4.8, 0.1, 1.6, redTileMat, hx, h + 2.02, -3.58);
    rf2.rotation.x = -0.52;
    box(scene, 4.9, 0.12, 0.18, goldMat, hx, h + 2.42, -3.0);
  });
  const nobleSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.65),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#fef08a', 'จวนพระยาอโยธยา (ย่านขุนนาง)') })
  );
  nobleSign.position.set(nobleX, 2.38, -1.25);
  scene.add(nobleSign);

  // =========================================================================
  // 3) Ayutthaya Army Garrison, Watchtower & War Elephants (-11 .. +14)
  // =========================================================================
  // Timber garrison watchtower (-9) + spear/halberd weapon racks (-4) + flagpoles (+1, +7)
  [-10.4, -7.6].forEach((wx) => {
    box(scene, 0.18, 4.5, 0.18, woodDark, wx, 2.25, -2.8);
    box(scene, 0.18, 4.5, 0.18, woodDark, wx, 2.25, -1.4);
  });
  box(scene, 3.4, 0.16, 2.1, woodMid, -9, 3.1, -2.1);
  box(scene, 3.8, 0.14, 2.4, redTileMat, -9, 4.65, -2.1);
  // Barracks weapon racks & archery targets
  box(scene, 3.2, 1.35, 0.25, woodDark, -4, 0.68, -2.4);
  box(scene, 4.4, 0.14, 1.8, woodMid, -4, 1.75, -2.4);
  [-5.2, -3.6, -2.0].forEach((tx) => {
    const bull = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 10), whiteStucco);
    bull.rotation.x = Math.PI / 2;
    bull.position.set(tx, 0.92, -1.45);
    scene.add(bull);
  });
  // Royal White Elephant Battle Flags (ธงช้างเผือกพื้นแดง!)
  [-6.8, 12.2].forEach((fx) => {
    box(scene, 0.08, 4.6, 0.08, goldMat, fx, 2.3, -1.2);
    box(scene, 1.1, 0.72, 0.04, redWallMat, fx + 0.56, 4.18, -1.2);
    const elephBadge = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.06), whiteStucco);
    elephBadge.position.set(fx + 0.56, 4.18, -1.2);
    scene.add(elephBadge);
  });
  // 5 Formation Ayutthaya Guards with Spears & Armor + 2 Armored War Elephants!
  [-5.5, -3.5, -1.5, 8.5, 10.5].forEach((sx) => {
    const sol = makeAyutthayaFigure('#991b1b', '#7f1d1d', { headbandCol: '#facc15', hasSpear: true });
    sol.position.set(sx, 0, -1.15);
    scene.add(sol);
  });
  const el1 = makeAyutthayaWarElephant();
  el1.position.set(2.2, 0, -2.0);
  const el2 = makeAyutthayaWarElephant();
  el2.position.set(6.4, 0, -2.2);
  scene.add(el1, el2);
  const armySign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.65),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#eab308', '#fef08a', 'ค่ายทหารกรุงศรีฯ & กองช้างศึก') })
  );
  armySign.position.set(-1.5, 2.35, -1.25);
  scene.add(armySign);

  // =========================================================================
  // 4) GRAND PALACE OF AYUTTHAYA & THREE GOLDEN CHEDIS (+16 .. +55)
  // =========================================================================
  // Crimson Imperial Palace Enclosure Wall with Sema battlements
  box(scene, 14, 3.1, 0.85, redWallMat, 23, 1.55, -2.4);
  box(scene, 14, 3.1, 0.85, redWallMat, 47, 1.55, -2.4);
  for (let px = 17; px <= 53; px += 1.4) {
    if (Math.abs(px - 35) < 4.5) continue;
    const sema = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), redWallMat);
    sema.rotation.y = Math.PI / 4;
    sema.position.set(px, 3.38, -2.4);
    scene.add(sema);
  }
  // Ornate Open Palace Gateway (ประตูวิเศษไชยศรี +35) + Royal Reflection Lotus Pond in front!
  [31.8, 38.2].forEach((px) => box(scene, 1.05, 3.8, 1.15, whiteStucco, px, 1.9, -2.4));
  box(scene, 7.6, 0.85, 1.25, whiteStucco, 35, 3.9, -2.4);
  const gRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.45, 4), greenTileMat);
  gRoof.rotation.y = Math.PI / 4;
  gRoof.position.set(35, 4.95, -2.4);
  scene.add(gRoof);
  const palaceGateSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#facc15', '#fef08a', 'พระบรมมหาราชวัง & วัดพระศรีสรรเพชญ์') })
  );
  palaceGateSign.position.set(35, 3.78, -1.72);
  scene.add(palaceGateSign);

  // Royal Palace Lotus Garden Pond in courtyard foreground (just like reference image #5!)
  box(scene, 8.2, 0.16, 1.85, brickMat, 24.5, 0.08, -0.95);
  box(scene, 7.8, 0.06, 1.55, pondWaterMat, 24.5, 0.18, -0.95);

  // Grand Phra Thinang Sanphet Prasat Hall (พระที่นั่งทรงปราสาทเขียว-แดง-ยอดทอง!)
  const hallX = 35;
  box(scene, 11.5, 1.2, 4.2, whiteStucco, hallX, 0.6, -5.2);
  [-4.4, -2.2, 0, 2.2, 4.4].forEach((px) => box(scene, 0.34, 3.6, 0.34, goldMat, hallX + px, 2.8, -3.5));
  box(scene, 10.6, 3.2, 3.4, whiteStucco, hallX, 2.6, -5.4);
  // Multi-tiered Green/Crimson Palace Roofs + Golden Mondop Spire (9.5m tall!)
  box(scene, 12.6, 0.55, 5.0, redTileMat, hallX, 4.45, -5.0);
  box(scene, 10.0, 0.55, 3.8, greenTileMat, hallX, 5.05, -5.0);
  box(scene, 7.4, 0.55, 2.8, redTileMat, hallX, 5.65, -5.0);
  const palaceSpire = new THREE.Mesh(new THREE.ConeGeometry(1.15, 4.2, 8), goldMat);
  palaceSpire.position.set(hallX, 7.9, -5.0);
  scene.add(palaceSpire);

  // Iconic Three Towering Golden Bell Chedis (เจดีย์สามองค์วัดพระศรีสรรเพชญ์ x = 44, 48.5, 53)
  [43.8, 48.5, 53.2].forEach((cx, ci) => {
    const scale = ci === 1 ? 1.15 : 0.96;
    box(scene, 3.2 * scale, 1.1, 3.2 * scale, whiteStucco, cx, 0.55, -5.8);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.95 * scale, 1.45 * scale, 2.4 * scale, 14), goldMat);
    bell.position.set(cx, 2.1 * scale, -5.8);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.92 * scale, 4.6 * scale, 14), goldMat);
    cone.position.set(cx, 5.3 * scale, -5.8);
    scene.add(bell, cone);
  });

  // Grand Royal Suphannahong Barge moored along the Royal Palace Riverfront!
  const royalBarge = makeRoyalSwanBarge().group;
  royalBarge.position.set(28, -0.1, 7.2);
  scene.add(royalBarge);

  // =========================================================================
  // 5) WAT CHAIWATTHANARAM 5-PRANG TEMPLE & SANCTUARY SALA (+57 .. +86)
  // =========================================================================
  // 5-Prang Quincunx Complex (พระปรางค์ 5 ยอดแบบวัดไชยวัฒนาราม x = 67, z = -4.6)
  const buildPrang = (x: number, z: number, scale: number) => {
    box(scene, 4.6 * scale, 0.95 * scale, 4.6 * scale, prangStoneMat, x, 0.48 * scale, z);
    [
      { r1: 1.85, r2: 1.55, h: 1.4, y: 1.6 },
      { r1: 1.45, r2: 1.15, h: 1.5, y: 3.0 },
      { r1: 1.08, r2: 0.82, h: 1.4, y: 4.4 },
      { r1: 0.74, r2: 0.5, h: 1.3, y: 5.7 },
      { r1: 0.44, r2: 0.14, h: 1.5, y: 7.05 },
    ].forEach((t) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(t.r2 * scale, t.r1 * scale, t.h * scale, 8),
        prangStoneMat
      );
      m.position.set(x, t.y * scale, z);
      scene.add(m);
    });
  };
  buildPrang(66.5, -5.0, 1.38); // Massive 11m Central Prang!
  buildPrang(61.5, -3.5, 0.82); // Front-left corner Prang
  buildPrang(71.5, -3.5, 0.82); // Front-right corner Prang
  buildPrang(58.2, -5.2, 0.66); // Outer left Prang
  buildPrang(74.8, -5.2, 0.66); // Outer right Prang

  // Open Sanctuary Sala (ศาลาการเปรียญเขตอภัยทาน x = 80, z = -2.0) where survivors gather safely!
  box(scene, 7.6, 0.24, 3.2, woodMid, 80, 0.12, -2.0);
  [-3.4, 0, 3.4].forEach((px) => box(scene, 0.22, 3.0, 0.22, redWallMat, 80 + px, 1.6, -0.6));
  [-3.4, 3.4].forEach((px) => box(scene, 0.22, 3.0, 0.22, redWallMat, 80 + px, 1.6, -3.4));
  const salaRf1 = box(scene, 8.2, 0.12, 2.2, redTileMat, 80, 3.38, -1.15);
  salaRf1.rotation.x = 0.42;
  const salaRf2 = box(scene, 8.2, 0.12, 2.2, redTileMat, 80, 3.38, -2.85);
  salaRf2.rotation.x = -0.42;
  const temploSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.64),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#fef08a', 'วัดไชยวัฒนาราม (เขตอภัยทาน)') })
  );
  temploSign.position.set(80, 2.75, -0.42);
  scene.add(temploSign);

  return { royalBarge, palaceGateSign };
}
