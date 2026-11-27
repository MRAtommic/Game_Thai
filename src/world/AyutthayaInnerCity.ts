import * as THREE from 'three';
import {
  addPartBox,
  buildThaiTieredRoof,
  makeAyutthayaBrickTex,
  makeAyutthayaFigure,
  makeAyutthayaRoofTex,
  makeAyutthayaSignTex,
  makeAyutthayaWarElephant,
} from './AyutthayaArchitecture';

export interface AyutthayaInnerHandles {
  palaceLight: THREE.PointLight;
  templeLight: THREE.PointLight;
  pitLight: THREE.PointLight;
  pitFlames: THREE.Mesh[];
  pitSmoke: THREE.Mesh[];
  pretaShadow: THREE.Group;
  soldiers: { group: THREE.Group; baseX: number; range: number; speed: number; phase: number }[];
}

function buildSiamesePrang(
  parent: THREE.Object3D,
  x: number,
  z: number,
  scale: number,
  brickMat: THREE.Material,
  stoneMat: THREE.Material,
  goldMat: THREE.Material
): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);

  // Triple-tiered Redented Laterite & Sandstone Base Plinth
  addPartBox(g, 5.2, 0.7, 5.2, brickMat, 0, 0.35, 0);
  addPartBox(g, 4.4, 0.65, 4.4, stoneMat, 0, 1.0, 0);
  addPartBox(g, 3.6, 0.55, 3.6, brickMat, 0, 1.55, 0);

  // Sculpted Khmer-Ayutthaya corn-cob spire tiers with redented niche reliefs & antefix pinnacles
  const tiers = [
    { rTop: 1.48, rBot: 1.82, h: 1.25, y: 2.4 },
    { rTop: 1.2, rBot: 1.48, h: 1.2, y: 3.58 },
    { rTop: 0.94, rBot: 1.2, h: 1.15, y: 4.72 },
    { rTop: 0.68, rBot: 0.94, h: 1.05, y: 5.78 },
    { rTop: 0.44, rBot: 0.68, h: 0.95, y: 6.72 },
    { rTop: 0.24, rBot: 0.44, h: 0.85, y: 7.58 },
  ];
  tiers.forEach((t, ti) => {
    const core = new THREE.Mesh(new THREE.CylinderGeometry(t.rTop, t.rBot, t.h, 12), brickMat);
    core.position.y = t.y;
    g.add(core);
    // Cardinal directional spire niches & corner stone rings
    addPartBox(g, t.rBot * 1.48, t.h * 0.36, t.rBot * 0.52, stoneMat, 0, t.y - 0.1, 0);
    addPartBox(g, t.rBot * 0.52, t.h * 0.36, t.rBot * 1.48, stoneMat, 0, t.y - 0.1, 0);
    if (ti % 2 === 0) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(t.rTop * 1.04, 0.055, 6, 12), stoneMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = t.y + t.h * 0.48;
      g.add(ring);
    }
  });

  const nophasun = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.45, 10), goldMat);
  nophasun.position.y = 8.65;
  g.add(nophasun);
  parent.add(g);
}

function buildGoldenBellChedi(
  parent: THREE.Object3D,
  x: number,
  z: number,
  scale: number,
  whiteMat: THREE.Material,
  goldMat: THREE.Material
): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);

  // Triple-stepped Whitewashed Redented Circumambulatory Terrace Base (ฐานประทักษิณ 3 ชั้น) + Gold Moldings
  addPartBox(g, 4.8, 0.65, 4.8, whiteMat, 0, 0.32, 0);
  addPartBox(g, 4.1, 0.55, 4.1, whiteMat, 0, 0.9, 0);
  addPartBox(g, 4.2, 0.12, 4.2, goldMat, 0, 1.2, 0);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.88, 0.95, 16), whiteMat);
  plinth.position.y = 1.68;
  const goldCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.62, 0.24, 20), goldMat);
  goldCollar.position.y = 2.22;

  // Smooth gleaming high-segment Golden Bell Dome (องค์ระฆังทอง) + Square Harmika Throne + Ringed Plong Chanai Spire!
  const bell = new THREE.Mesh(new THREE.SphereGeometry(1.48, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58), goldMat);
  bell.position.y = 2.38;
  const harmika = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.42, 0.92), goldMat);
  harmika.position.y = 3.92;
  g.add(plinth, goldCollar, bell, harmika);

  for (let r = 0; r < 7; r++) {
    const rad = 0.48 - r * 0.055;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.85, rad, 0.22, 16), goldMat);
    disc.position.y = 4.25 + r * 0.24;
    g.add(disc);
  }
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.9, 12), goldMat);
  needle.position.y = 6.75;
  g.add(needle);
  parent.add(g);
}

function buildOctagonBastion(
  parent: THREE.Object3D,
  x: number,
  z: number,
  brickMat: THREE.Material,
  whiteMat: THREE.Material,
  roofMat: THREE.Material,
  goldMat: THREE.Material
): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const baseBrick = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.95, 1.85, 8), brickMat);
  baseBrick.position.y = 0.92;
  const cornice = new THREE.Mesh(new THREE.CylinderGeometry(2.72, 2.65, 0.22, 8), whiteMat);
  cornice.position.y = 1.92;
  const upperKeep = new THREE.Mesh(new THREE.CylinderGeometry(2.42, 2.55, 2.7, 8), whiteMat);
  upperKeep.position.y = 3.32;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.58, 2.48, 0.2, 8), whiteMat);
  rim.position.y = 4.74;
  // Gun slits around keep perimeter
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const merlon = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.65, 6), whiteMat);
    merlon.position.set(Math.cos(ang) * 2.32, 5.1, Math.sin(ang) * 2.32);
    g.add(merlon);
  }
  const roofLow = new THREE.Mesh(new THREE.ConeGeometry(2.85, 1.15, 8), roofMat);
  roofLow.position.y = 5.45;
  const roofHigh = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.1, 8), roofMat);
  roofHigh.position.y = 6.2;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.85, 8), goldMat);
  spire.position.y = 7.05;
  g.add(baseBrick, cornice, upperKeep, rim, roofLow, roofHigh, spire);
  parent.add(g);
}

/**
 * Builds Walled Inner Ayutthaya Capital (x = -12 .. +144) plus outer Ghost Gate & Mass Grave (+144 .. +188):
 * Victory Gate, Garrison & War Elephants, Grand Royal Palace & Lotus Courtyard, Wat Phra Si Sanphet Three Chedis,
 * Wat Chaiwatthanaram 5-Prang Complex, Sanctuary Sala, Mass Grave Pit, Preta & Evacuation Fleet.
 */
export function buildAyutthayaInnerCity(
  scene: THREE.Object3D,
  brickMat: THREE.Material,
  buildJunkShipFn: (x: number, z: number, title: string, isEvac: boolean) => THREE.Group
): AyutthayaInnerHandles {
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.72, roughness: 0.2 });
  const whiteStuccoMat = new THREE.MeshStandardMaterial({ color: '#f3ede0', roughness: 0.68 });
  const terracottaWallMat = new THREE.MeshStandardMaterial({ color: '#9c3a28', roughness: 0.78 });
  const redTileMat = new THREE.MeshStandardMaterial({ map: makeAyutthayaRoofTex('#991b1b', '#c23622', '#15803d'), roughness: 0.62 });
  const bastionRoofMat = new THREE.MeshStandardMaterial({ map: makeAyutthayaRoofTex('#7c2d12', '#9a3412', '#ca8a04'), roughness: 0.68 });
  const fineWallBrickMat = new THREE.MeshStandardMaterial({ map: makeAyutthayaBrickTex(44, 2), roughness: 0.84 });
  const greenTrimMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#452613', roughness: 0.88 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.75, roughness: 0.35 });

  // =========================================================================
  // 1) Fine-Brick Ayutthaya City Wall, Buttresses, Cornices, Sema Crenellations & Octagon Bastions (-12 .. +144)
  // =========================================================================
  addPartBox(scene, 156, 0.42, 1.48, whiteStuccoMat, 66, 0.21, -7.2); // limestone plinth step 1
  addPartBox(scene, 156, 0.34, 1.32, terracottaWallMat, 66, 0.56, -7.2); // brick plinth step 2
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(156, 3.65, 1.12), fineWallBrickMat);
  backWall.position.set(66, 2.52, -7.2);
  scene.add(backWall);
  addPartBox(scene, 156, 0.22, 1.34, whiteStuccoMat, 66, 4.44, -7.2); // upper white cornice molding
  addPartBox(scene, 156, 0.14, 1.18, terracottaWallMat, 66, 4.62, -7.2);

  // Rhythmic Pilaster Buttresses every 6m + Authentic Curved Sema Lotus Battlements every 1.4m
  for (let px = -9; px <= 141; px += 6) {
    addPartBox(scene, 0.48, 4.35, 1.28, whiteStuccoMat, px, 2.25, -7.14);
  }
  for (let bx = -10.5; bx <= 142.5; bx += 1.4) {
    addPartBox(scene, 0.72, 0.46, 0.34, whiteStuccoMat, bx, 4.86, -7.2);
    const semaCap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.34, 10), whiteStuccoMat);
    semaCap.rotation.x = Math.PI / 2;
    semaCap.position.set(bx, 5.1, -7.2);
    const finialTip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 6), whiteStuccoMat);
    finialTip.position.set(bx, 5.42, -7.2);
    scene.add(semaCap, finialTip);
  }

  // Iconic White-Masonry Octagonal Fortress Bastions (ป้อมเพชร & ป้อมมุมกำแพง) framing the city corners!
  buildOctagonBastion(scene, -11.5, -6.2, brickMat, whiteStuccoMat, bastionRoofMat, goldMat);
  buildOctagonBastion(scene, 144.2, -6.2, brickMat, whiteStuccoMat, bastionRoofMat, goldMat);

  // Western Victory Gate Archway crossing the Royal Road (x = +10, grand arched portal + Prasat roof tower)
  [7.1, 12.9].forEach((px) => {
    addPartBox(scene, 1.55, 4.85, 1.85, brickMat, px, 2.42, -2.5);
    addPartBox(scene, 1.72, 0.42, 2.02, whiteStuccoMat, px, 0.21, -2.5);
    addPartBox(scene, 1.68, 0.22, 1.98, whiteStuccoMat, px, 4.78, -2.5);
  });
  addPartBox(scene, 7.4, 1.05, 1.84, whiteStuccoMat, 10, 4.42, -2.5);
  addPartBox(scene, 1.1, 4.35, 4.4, brickMat, 7.2, 2.18, -4.8);
  addPartBox(scene, 1.1, 4.35, 4.4, brickMat, 12.8, 2.18, -4.8);
  buildThaiTieredRoof(scene, 10, 4.95, -2.5, 6.8, 2.5, redTileMat, goldMat, greenTrimMat, 2);
  const vSpire = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.55, 10), goldMat);
  vSpire.position.set(10, 7.25, -2.5);
  scene.add(vSpire);

  const gateSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 0.72),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#eab308', '#fef08a', 'ประตูชัยกำแพงพระนคร', 'เขตชั้นในกรุงศรีอยุธยา') })
  );
  gateSign.position.set(10, 4.25, -1.58);
  scene.add(gateSign);

  // =========================================================================
  // 2) Royal Military Garrison, War Elephants, Cannons & Guards (+14 .. +39)
  // =========================================================================
  // Barracks Pavilion + Spear/Shield Weapon Racks + White Elephant Royal Flags
  addPartBox(scene, 7.4, 0.16, 2.8, darkWoodMat, 22, 0.08, -3.1);
  [18.8, 22, 25.2].forEach((px) => addPartBox(scene, 0.18, 2.9, 0.18, darkWoodMat, px, 1.45, -1.9));
  [18.8, 25.2].forEach((px) => addPartBox(scene, 0.18, 2.9, 0.18, darkWoodMat, px, 1.45, -4.3));
  const barRf = addPartBox(scene, 7.8, 0.12, 3.2, redTileMat, 22, 3.05, -3.1);
  barRf.rotation.x = 0.22;
  const gSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#7f1d1d', '#eab308', '#fffbeb', 'ค่ายกองทหาร & ทัพช้างศึก') })
  );
  gSign.position.set(22, 2.45, -1.52);
  scene.add(gSign);

  // Red Royal Ayutthaya Standards & Cannons
  [14.8, 27.5, 39.2].forEach((fx) => {
    addPartBox(scene, 0.08, 4.6, 0.08, goldMat, fx, 2.3, -1.35);
    addPartBox(scene, 0.95, 0.6, 0.04, redTileMat, fx + 0.48, 4.15, -1.35);
    addPartBox(scene, 0.36, 0.28, 0.06, whiteStuccoMat, fx + 0.48, 4.15, -1.35);
  });
  [15.6, 29.2].forEach((cx) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.75, 10), ironMat);
    barrel.rotation.z = 0.36;
    barrel.position.set(cx, 0.62, -1.15);
    addPartBox(scene, 0.72, 0.38, 0.56, darkWoodMat, cx, 0.22, -1.15);
    scene.add(barrel);
  });

  // Two Majestic Royal War Elephants (ช้างศึกทรงเครื่อง!) flanking the Royal Garrison
  const el1 = makeAyutthayaWarElephant();
  el1.position.set(17.5, 0, -0.8);
  const el2 = makeAyutthayaWarElephant();
  el2.position.set(34.5, 0, -1.2);
  el2.scale.x = -1;
  scene.add(el1, el2);

  // Standing Ayutthaya Spearmen Formation + 2 Patrolling Soldiers
  [20.2, 21.8, 23.4, 25.0].forEach((sx) => {
    const grd = makeAyutthayaFigure('#991b1b', '#450a0a', { helmetGold: true, hasSpear: true });
    grd.position.set(sx, 0, -1.4);
    scene.add(grd);
  });
  const soldiers = [
    { baseX: 16, range: 6, speed: 1.0, phase: 0 },
    { baseX: 32, range: 5, speed: 0.95, phase: 1.6 },
  ].map((sd) => {
    const fig = makeAyutthayaFigure('#b91c1c', '#7f1d1d', { helmetGold: true, hasSpear: true });
    fig.position.set(sd.baseX, 0, -0.45);
    scene.add(fig);
    return { group: fig, ...sd };
  });

  // =========================================================================
  // 3) Grand Royal Palace of Ayutthaya, Terracotta Enclosure & Lotus Garden (+42 .. +90)
  // =========================================================================
  // Ornamental Crimson-Terracotta Courtyard Enclosure Wall with Lotus Sema Caps (inspired by Phra Borom Maha Ratchawang!)
  addPartBox(scene, 48, 2.25, 0.45, terracottaWallMat, 65.5, 1.12, -5.85);
  addPartBox(scene, 48, 0.2, 0.56, whiteStuccoMat, 65.5, 2.26, -5.85);
  for (let kx = 43; kx <= 88; kx += 1.25) {
    addPartBox(scene, 0.56, 0.45, 0.34, terracottaWallMat, kx, 2.55, -5.85);
    const kTip = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.32, 8), terracottaWallMat);
    kTip.rotation.x = Math.PI / 2;
    kTip.position.set(kx, 2.78, -5.85);
    scene.add(kTip);
  }
  [41.5, 89.5].forEach((px) => addPartBox(scene, 0.95, 3.6, 1.25, terracottaWallMat, px, 1.8, -2.5));

  // Heroic Royal Audience Throne Hall (พระที่นั่งสรรเพชญมหาปราสาท x = +66, z = -3.8)
  const palX = 66;
  const palZ = -3.8;
  addPartBox(scene, 14.8, 0.55, 5.2, whiteStuccoMat, palX, 0.28, palZ);
  addPartBox(scene, 13.8, 0.42, 4.6, whiteStuccoMat, palX, 0.72, palZ);
  addPartBox(scene, 14.1, 0.16, 4.75, goldMat, palX, 0.96, palZ);
  // White marble palace approach stairway + gilded Naga balustrades & lotus pillar capitals
  const pStair = addPartBox(scene, 3.0, 0.22, 1.6, whiteStuccoMat, palX, 0.42, palZ + 2.55);
  pStair.rotation.x = 0.48;
  [-1.6, 1.6].forEach((bx) => {
    const rail = addPartBox(scene, 0.18, 0.3, 1.65, goldMat, palX + bx, 0.68, palZ + 2.55);
    rail.rotation.x = 0.48;
  });
  [-5.6, -2.8, 0, 2.8, 5.6].forEach((ox) => {
    [1.95, -1.95].forEach((oz) => {
      addPartBox(scene, 0.32, 3.55, 0.32, goldMat, palX + ox, 2.72, palZ + oz);
      addPartBox(scene, 0.48, 0.26, 0.48, whiteStuccoMat, palX + ox, 4.4, palZ + oz); // lotus capital
    });
  });
  addPartBox(scene, 10.8, 3.3, 2.65, whiteStuccoMat, palX, 2.62, palZ);
  // Carved golden royal windows with warm interior light & grand arched portal
  const throneGlow = new THREE.MeshBasicMaterial({ color: '#fde047' });
  [-3.8, -1.9, 1.9, 3.8].forEach((wx) => {
    addPartBox(scene, 0.82, 1.44, 0.12, goldMat, palX + wx, 2.62, palZ + 1.33);
    addPartBox(scene, 0.56, 1.2, 0.14, throneGlow, palX + wx, 2.62, palZ + 1.34);
  });
  addPartBox(scene, 1.68, 2.32, 0.14, goldMat, palX, 2.12, palZ + 1.35);
  addPartBox(scene, 1.22, 2.0, 0.16, throneGlow, palX, 2.02, palZ + 1.36);

  // Authentic 3-Tiered Pitched Siamese Palace Roofs with Golden Gables & Chofa Horns + Towering 7-Tiered Mondop Spire!
  buildThaiTieredRoof(scene, palX, 4.45, palZ, 15.2, 5.2, redTileMat, goldMat, greenTrimMat, 3);
  const prangTier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.1, 1.2, 8), goldMat);
  prangTier1.position.set(palX, 7.65, palZ);
  const mondopRoof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.2, 8), goldMat);
  mondopRoof.position.set(palX, 9.65, palZ);
  const finialP = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.2, 10), goldMat);
  finialP.position.set(palX, 12.15, palZ);
  scene.add(prangTier1, mondopRoof, finialP);

  // Ornamental Royal Garden Lotus Pond + Carved Jaturamuk Garden Sala Pavilion + Flower Shrubs (x = +47 .. +57)
  addPartBox(scene, 8.8, 0.18, 3.0, whiteStuccoMat, 51.5, 0.09, -1.6);
  addPartBox(scene, 7.8, 0.1, 2.2, new THREE.MeshStandardMaterial({ color: '#0e7490', roughness: 0.22, metalness: 0.1 }), 51.5, 0.16, -1.6);
  [48.5, 50.5, 52.8, 54.6].forEach((lx, li) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 10), greenTrimMat);
    pad.position.set(lx, 0.22, -1.5 + (li % 2) * 0.35);
    scene.add(pad);
    const flower = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6), new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.45 }));
    flower.rotation.x = Math.PI;
    flower.position.set(lx + 0.08, 0.28, pad.position.z);
    scene.add(flower);
  });
  [47.2, 55.8].forEach((fx) => {
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), greenTrimMat);
    bush.position.set(fx, 0.32, -0.35);
    const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshStandardMaterial({ color: '#ef4444' }));
    blossom.position.set(fx + 0.14, 0.55, -0.25);
    scene.add(bush, blossom);
  });
  // Carved Ayutthaya Royal Garden Sala with marble base, golden columns & 2-tier Thai roof!
  addPartBox(scene, 3.8, 0.28, 2.8, whiteStuccoMat, 47.2, 0.14, -3.5);
  addPartBox(scene, 3.4, 0.16, 2.4, goldMat, 47.2, 0.34, -3.5);
  [-1.35, 1.35].forEach((ox) => {
    [-0.9, 0.9].forEach((oz) => addPartBox(scene, 0.16, 2.25, 0.16, goldMat, 47.2 + ox, 1.5, -3.5 + oz));
  });
  buildThaiTieredRoof(scene, 47.2, 2.6, -3.5, 4.1, 2.9, redTileMat, goldMat, greenTrimMat, 2);

  // Ladies of the Court & Royal Guards by the Palace Pond
  const courtLadyA = makeAyutthayaFigure('#f472b6', '#581c87', { sabaiCol: '#fde047' });
  courtLadyA.position.set(50.2, 0, -0.35);
  const courtLadyB = makeAyutthayaFigure('#38bdf8', '#1e3a8a', { sabaiCol: '#f9a8d4' });
  courtLadyB.position.set(52.1, 0, -0.45);
  const palaceGuard = makeAyutthayaFigure('#b91c1c', '#7f1d1d', { helmetGold: true, hasSpear: true });
  palaceGuard.position.set(58.5, 0, -1.25);
  scene.add(courtLadyA, courtLadyB, palaceGuard);

  const palSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.74),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#eab308', '#fef08a', 'พระบรมมหาราชวังอโยธยา', 'พระที่นั่งสรรเพชญมหาปราสาท • อุทยานสระบัว') })
  );
  palSign.position.set(palX, 3.65, -1.35);
  scene.add(palSign);

  const palaceLight = new THREE.PointLight('#fde68a', 5.4, 20, 1.0);
  palaceLight.position.set(palX, 3.8, -0.8);
  scene.add(palaceLight);

  // =========================================================================
  // 4) Wat Phra Si Sanphet (3 Golden Chedis) & Wat Chaiwatthanaram (5 Prangs) (+92 .. +141)
  // =========================================================================
  // Iconic Three Towering Golden Chedis (+98, +104, +110)
  buildGoldenBellChedi(scene, 96.5, -4.4, 0.92, whiteStuccoMat, goldMat);
  buildGoldenBellChedi(scene, 102.5, -4.4, 1.05, whiteStuccoMat, goldMat);
  buildGoldenBellChedi(scene, 108.5, -4.4, 0.92, whiteStuccoMat, goldMat);

  // Monumental 5-Prang Complex inspired by Wat Chaiwatthanaram + Low Cloister Perimeter Wall (+116 .. +133)!
  addPartBox(scene, 18.5, 0.55, 0.45, brickMat, 125, 0.28, -2.55);
  addPartBox(scene, 18.7, 0.14, 0.54, whiteStuccoMat, 125, 0.58, -2.55);
  buildSiamesePrang(scene, 117.5, -4.2, 0.65, brickMat, whiteStuccoMat, goldMat);
  buildSiamesePrang(scene, 121.0, -4.6, 0.85, brickMat, whiteStuccoMat, goldMat);
  buildSiamesePrang(scene, 125.0, -4.8, 1.15, brickMat, whiteStuccoMat, goldMat); // Towering Central Prang!
  buildSiamesePrang(scene, 129.0, -4.6, 0.85, brickMat, whiteStuccoMat, goldMat);
  buildSiamesePrang(scene, 132.5, -4.2, 0.65, brickMat, whiteStuccoMat, goldMat);

  // Open Sanctuary Sala (+136) with whitewashed marble steps, lotus pillars & authentic 2-tier pitched Thai roof!
  addPartBox(scene, 7.2, 0.34, 3.4, whiteStuccoMat, 136, 0.17, -2.2);
  addPartBox(scene, 6.8, 0.22, 3.0, goldMat, 136, 0.42, -2.2);
  [-3.0, 0, 3.0].forEach((px) => addPartBox(scene, 0.22, 2.95, 0.22, redTileMat, 136 + px, 1.85, -0.9));
  [-3.0, 3.0].forEach((px) => addPartBox(scene, 0.22, 2.95, 0.22, redTileMat, 136 + px, 1.85, -3.5));
  buildThaiTieredRoof(scene, 136, 3.35, -2.2, 7.8, 3.8, redTileMat, goldMat, greenTrimMat, 2);
  const templeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.72),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#fef08a', 'วัดพระศรีสรรเพชญ์ & พระปรางค์ ๕ ยอด', 'เขตอภัยทาน — ปลอดภัยจากผีห่า') })
  );
  templeSign.position.set(136, 2.65, -0.78);
  scene.add(templeSign);

  const templeLight = new THREE.PointLight('#fde68a', 5.0, 18, 1.0);
  templeLight.position.set(126, 3.8, -1.5);
  scene.add(templeLight);

  // =========================================================================
  // 5) East Wall "Pratu Phi" (Ghost Gate x = +143), Mass Grave Pit (+160) & Evac Fleet (+180)
  // =========================================================================
  [141.2, 145.6].forEach((px) => {
    addPartBox(scene, 1.35, 4.5, 1.65, brickMat, px, 2.25, -2.5);
    addPartBox(scene, 1.5, 0.36, 1.8, whiteStuccoMat, px, 0.18, -2.5);
  });
  addPartBox(scene, 6.0, 1.0, 1.65, brickMat, 143.4, 4.15, -2.5);
  buildThaiTieredRoof(scene, 143.4, 4.65, -2.5, 5.4, 2.2, darkWoodMat, goldMat, terracottaWallMat, 2);
  const ghostGateSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.66),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#27120c', '#ef4444', '#fecaca', 'ประตูผี (ทางออกป่าช้าห่า)', 'ห้ามชาวเมืองออกนอกกำแพงยามวิกาล') })
  );
  ghostGateSign.position.set(143.4, 3.95, -1.68);
  scene.add(ghostGateSign);

  // Mass Grave Pit (หลุมฝังรวมคนตายโรคห่า x = +160, 22 shrouded corpses piled inside!)
  const pitX = 160;
  const pitZ = -2.6;
  const pitSoil = new THREE.MeshStandardMaterial({ color: '#4a3222', roughness: 0.96 });
  const darkFloor = new THREE.MeshStandardMaterial({ color: '#1a110b', roughness: 0.98 });
  addPartBox(scene, 9.6, 0.08, 3.6, darkFloor, pitX, 0.02, pitZ);
  addPartBox(scene, 10.2, 0.48, 0.55, pitSoil, pitX, 0.24, pitZ - 1.85);
  addPartBox(scene, 10.2, 0.42, 0.52, pitSoil, pitX, 0.24, pitZ + 1.75);
  addPartBox(scene, 0.68, 0.45, 3.8, pitSoil, pitX - 5.0, 0.24, pitZ);
  addPartBox(scene, 0.68, 0.45, 3.8, pitSoil, pitX + 5.0, 0.24, pitZ);

  const clothMat1 = new THREE.MeshStandardMaterial({ color: '#d6d3d1', roughness: 0.94 });
  const clothMat2 = new THREE.MeshStandardMaterial({ color: '#a8a29e', roughness: 0.95 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
  for (let i = 0; i < 20; i++) {
    const layer = i >= 11 ? 1 : 0;
    const cx = pitX - 3.6 + (i % 10) * 0.8 + (layer ? 0.32 : 0);
    const cy = 0.16 + layer * 0.26;
    const cz = pitZ + ((i % 3) - 1) * 0.55;
    const corpse = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.38, 7), i % 2 === 0 ? clothMat1 : clothMat2);
    corpse.rotation.z = Math.PI / 2 + ((i % 5) - 2) * 0.09;
    corpse.rotation.y = ((i % 4) - 1.5) * 0.28;
    corpse.position.set(cx, cy, cz);
    scene.add(corpse);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 5, 8), ropeMat);
    tie.position.set(cx, cy, cz);
    tie.rotation.y = Math.PI / 2;
    scene.add(tie);
  }

  [-1.3, 1.3].forEach((ox) => addPartBox(scene, 0.1, 1.85, 0.1, darkWoodMat, pitX - 5.6 + ox, 0.92, -1.16));
  const pitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.68),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#ef4444', '#fecaca', 'หลุมศพใหญ่โรคห่า', 'ที่กองรวมศพผู้ป่วยตายห่านอกเมือง') })
  );
  pitSign.position.set(pitX - 5.6, 1.52, -1.1);
  scene.add(pitSign);

  const pitFlames: THREE.Mesh[] = [];
  const pitSmoke: THREE.Mesh[] = [];
  [-3.2, 0, 3.2].forEach((fx) => {
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 7), new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.86 }));
    fl.position.set(pitX + fx, 0.54, pitZ + 0.15);
    fl.visible = false;
    scene.add(fl);
    pitFlames.push(fl);

    const sm = new THREE.Mesh(new THREE.SphereGeometry(0.6, 7, 6), new THREE.MeshBasicMaterial({ color: '#475569', transparent: true, opacity: 0.36 }));
    sm.position.set(pitX + fx, 1.65, pitZ);
    sm.visible = false;
    scene.add(sm);
    pitSmoke.push(sm);
  });

  const pitLight = new THREE.PointLight('#fb923c', 1.2, 16, 1.15);
  pitLight.position.set(pitX, 1.8, pitZ + 0.8);
  scene.add(pitLight);

  // Towering Ayutthaya Cemetery Preta Silhouette (x = +158, z = -9.6)
  const pretaShadow = new THREE.Group();
  const pMat = new THREE.MeshBasicMaterial({ color: '#020306', transparent: true, opacity: 0.82 });
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
  pretaShadow.position.set(160, 0, -9.6);
  pretaShadow.visible = false;
  scene.add(pretaShadow);

  // Evacuation Junk Fleet at East Canal Dock (+180)
  scene.add(buildJunkShipFn(180, 6.2, 'เรือสำเภาหลวงอพยพ', true));

  return {
    palaceLight,
    templeLight,
    pitLight,
    pitFlames,
    pitSmoke,
    pretaShadow,
    soldiers,
  };
}
