import * as THREE from 'three';
import {
  addPartBox,
  makeAyutthayaFigure,
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

  // Stepped sandstone/laterite base plinth
  addPartBox(g, 4.6, 0.8, 4.6, brickMat, 0, 0.4, 0);
  addPartBox(g, 3.8, 0.75, 3.8, stoneMat, 0, 1.15, 0);

  // Iconic Khmer-Ayutthaya tapered corn-cob spire tiers with projecting pediment niches
  const tiers = [
    { rTop: 1.4, rBot: 1.75, h: 1.3, y: 2.15 },
    { rTop: 1.12, rBot: 1.4, h: 1.3, y: 3.4 },
    { rTop: 0.85, rBot: 1.12, h: 1.2, y: 4.6 },
    { rTop: 0.58, rBot: 0.85, h: 1.1, y: 5.7 },
    { rTop: 0.34, rBot: 0.58, h: 1.0, y: 6.7 },
  ];
  tiers.forEach((t) => {
    const core = new THREE.Mesh(new THREE.CylinderGeometry(t.rTop, t.rBot, t.h, 8), brickMat);
    core.position.y = t.y;
    g.add(core);
    // Cardinal directional spire niches
    addPartBox(g, t.rBot * 1.45, t.h * 0.42, t.rBot * 1.45, stoneMat, 0, t.y - 0.12, 0);
  });

  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.25, 8), goldMat);
  finial.position.y = 7.75;
  g.add(finial);
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

  // Octagonal whitewashed Sri Lankan-Ayutthaya stepped base + gleaming golden bell dome!
  addPartBox(g, 4.2, 0.9, 4.2, whiteMat, 0, 0.45, 0);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.85, 1.1, 8), whiteMat);
  plinth.position.y = 1.4;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(1.45, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), goldMat);
  bell.position.y = 2.05;
  const harmika = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.72, 0.65, 8), goldMat);
  harmika.position.y = 3.65;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.1, 12), goldMat);
  spire.position.y = 5.45;
  g.add(plinth, bell, harmika, spire);
  parent.add(g);
}

/**
 * Builds Walled Inner Ayutthaya Capital (x = -12 .. +144) plus outer Ghost Gate & Mass Grave (+144 .. +188):
 * Victory Gate, Garrison & War Elephants, Grand Royal Palace & Lotus Courtyard, Wat Phra Si Sanphet Three Chedis,
 * Wat Chaiwatthanaram 5-Prang Complex, Sanctuary Sala, Mass Grave Pit, Preta & Evacuation Fleet.
 */
export function buildAyutthayaInnerCity(
  scene: THREE.Scene,
  brickMat: THREE.Material,
  buildJunkShipFn: (x: number, z: number, title: string, isEvac: boolean) => THREE.Group
): AyutthayaInnerHandles {
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.68, roughness: 0.22 });
  const whiteStuccoMat = new THREE.MeshStandardMaterial({ color: '#f1ebe0', roughness: 0.75 });
  const redTileMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.72 });
  const greenTrimMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.65 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#452613', roughness: 0.88 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.75, roughness: 0.35 });

  // =========================================================================
  // 1) Continuous Red-Brick Ayutthaya Backdrop Wall & Sema Battlements (-12 .. +144)
  // =========================================================================
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(156, 4.4, 1.15), brickMat);
  backWall.position.set(66, 2.2, -7.2);
  scene.add(backWall);
  for (let bx = -10; bx <= 142; bx += 2.2) {
    const sema = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.76, 4), brickMat);
    sema.rotation.y = Math.PI / 4;
    sema.position.set(bx, 4.72, -7.2);
    scene.add(sema);
  }

  // Western Victory Gate Archway crossing the Royal Road (x = +10, open 3.8m archway!)
  [7.2, 12.8].forEach((px) => addPartBox(scene, 1.35, 4.8, 1.7, brickMat, px, 2.4, -2.5));
  addPartBox(scene, 7.0, 1.15, 1.74, brickMat, 10, 4.4, -2.5);
  // Wing walls connecting Victory Gate cleanly back to the city perimeter
  [-4.2, -6.0].forEach(() => {});
  addPartBox(scene, 1.1, 4.2, 4.4, brickMat, 7.2, 2.1, -4.8);
  addPartBox(scene, 1.1, 4.2, 4.4, brickMat, 12.8, 2.1, -4.8);
  // Multi-tier Thai Gate Tower Spire atop Victory Gate
  addPartBox(scene, 5.4, 0.16, 2.4, redTileMat, 10, 5.1, -2.5);
  addPartBox(scene, 3.6, 0.16, 1.8, redTileMat, 10, 5.45, -2.5);
  const vSpire = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.45, 8), goldMat);
  vSpire.position.set(10, 6.25, -2.5);
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
  // 3) Grand Royal Palace of Ayutthaya & Lotus Garden (+42 .. +90)
  // =========================================================================
  // Red Royal Inner Courtyard Wall with gilded Palace Gate (x = +44) & Royal Lotus Pond!
  [41.5, 89.5].forEach((px) => addPartBox(scene, 0.85, 3.6, 1.2, brickMat, px, 1.8, -2.5));
  addPartBox(scene, 14, 2.2, 0.42, brickMat, 51, 1.1, -5.6);
  addPartBox(scene, 14, 2.2, 0.42, brickMat, 80, 1.1, -5.6);

  // Heroic Royal Audience Throne Hall (พระที่นั่งวิหารสมเด็จ / พระมหาปราสาท x = +66, z = -3.8)
  const palX = 66;
  const palZ = -3.8;
  addPartBox(scene, 13.5, 0.72, 4.4, whiteStuccoMat, palX, 0.36, palZ);
  addPartBox(scene, 14.2, 0.22, 4.8, goldMat, palX, 0.78, palZ);
  // White marble palace approach stairway + gilded balustrades & lotus pillar bases
  const pStair = addPartBox(scene, 2.8, 0.22, 1.5, whiteStuccoMat, palX, 0.38, palZ + 2.45);
  pStair.rotation.x = 0.45;
  [-1.48, 1.48].forEach((bx) => {
    const rail = addPartBox(scene, 0.16, 0.28, 1.55, goldMat, palX + bx, 0.62, palZ + 2.45);
    rail.rotation.x = 0.45;
  });
  [-5.6, -2.8, 0, 2.8, 5.6].forEach((ox) => {
    [1.9, -1.9].forEach((oz) => {
      addPartBox(scene, 0.3, 3.4, 0.3, goldMat, palX + ox, 2.55, palZ + oz);
      addPartBox(scene, 0.46, 0.24, 0.46, whiteStuccoMat, palX + ox, 4.18, palZ + oz); // lotus capital!
    });
  });
  addPartBox(scene, 10.6, 3.2, 2.6, whiteStuccoMat, palX, 2.45, palZ);
  // Illuminated gilded royal throne hall windows with carved gold frames & arched portal
  const throneGlow = new THREE.MeshBasicMaterial({ color: '#fde047' });
  [-3.8, -1.9, 1.9, 3.8].forEach((wx) => {
    addPartBox(scene, 0.78, 1.38, 0.1, goldMat, palX + wx, 2.45, palZ + 1.31);
    addPartBox(scene, 0.56, 1.18, 0.12, throneGlow, palX + wx, 2.45, palZ + 1.32);
  });
  addPartBox(scene, 1.58, 2.22, 0.12, goldMat, palX, 1.95, palZ + 1.33);
  addPartBox(scene, 1.16, 1.92, 0.14, throneGlow, palX, 1.85, palZ + 1.34);

  // Layered Multi-Tiered Thai Crimson & Emerald-Bordered Palace Roofs + Golden Chofa Horns & Mondop Spire!
  [
    { w: 15.2, h: 0.48, d: 5.4, y: 4.5, mat: greenTrimMat },
    { w: 14.4, h: 0.56, d: 4.9, y: 4.95, mat: redTileMat },
    { w: 11.4, h: 0.52, d: 4.1, y: 5.55, mat: greenTrimMat },
    { w: 10.6, h: 0.6, d: 3.6, y: 6.0, mat: redTileMat },
    { w: 7.4, h: 0.55, d: 2.8, y: 6.65, mat: goldMat },
  ].forEach((tier, ti) => {
    addPartBox(scene, tier.w, tier.h, tier.d, tier.mat, palX, tier.y, palZ);
    if (ti === 1 || ti === 3) {
      [-tier.w * 0.48, tier.w * 0.48].forEach((cx) => {
        const chofa = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 6), goldMat);
        chofa.position.set(palX + cx, tier.y + 0.62, palZ);
        chofa.rotation.z = cx > 0 ? -0.35 : 0.35;
        scene.add(chofa);
      });
    }
  });
  const mondopRoof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.4, 4), goldMat);
  mondopRoof.rotation.y = Math.PI / 4;
  mondopRoof.position.set(palX, 8.6, palZ);
  const finialP = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.9, 8), goldMat);
  finialP.position.set(palX, 11.0, palZ);
  scene.add(mondopRoof, finialP);

  // Ornamental Royal Garden Lotus Pond + Thai Garden Sala + Courtiers in Sabai (x = +48 .. +57)
  addPartBox(scene, 8.5, 0.16, 2.8, whiteStuccoMat, 51.5, 0.08, -1.6);
  addPartBox(scene, 7.6, 0.08, 2.1, new THREE.MeshStandardMaterial({ color: '#0e7490', roughness: 0.25 }), 51.5, 0.14, -1.6);
  [48.5, 50.5, 52.8, 54.6].forEach((lx) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 8), greenTrimMat);
    pad.position.set(lx, 0.2, -1.5 + (Math.floor(lx) % 2) * 0.35);
    scene.add(pad);
  });
  // Ornate Royal Garden Sala Pavilion beside the Lotus Pond
  addPartBox(scene, 3.4, 0.2, 2.4, whiteStuccoMat, 47.2, 0.1, -3.5);
  [-1.4, 1.4].forEach((ox) => {
    [-0.9, 0.9].forEach((oz) => addPartBox(scene, 0.14, 2.2, 0.14, goldMat, 47.2 + ox, 1.2, -3.5 + oz));
  });
  const sRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), redTileMat);
  sRoof.rotation.y = Math.PI / 4;
  sRoof.position.set(47.2, 2.95, -3.5);
  scene.add(sRoof);

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

  // Monumental 5-Prang Complex inspired by Wat Chaiwatthanaram (+118 .. +132)!
  buildSiamesePrang(scene, 117.5, -4.2, 0.65, brickMat, whiteStuccoMat, goldMat);
  buildSiamesePrang(scene, 121.0, -4.6, 0.85, brickMat, whiteStuccoMat, goldMat);
  buildSiamesePrang(scene, 125.0, -4.8, 1.15, brickMat, whiteStuccoMat, goldMat); // Towering Central Prang!
  buildSiamesePrang(scene, 129.0, -4.6, 0.85, brickMat, whiteStuccoMat, goldMat);
  buildSiamesePrang(scene, 132.5, -4.2, 0.65, brickMat, whiteStuccoMat, goldMat);

  // Open Sanctuary Sala (+136) where Monk Khong blesses survivors & keeps people safe
  addPartBox(scene, 6.8, 0.24, 3.0, darkWoodMat, 136, 0.12, -2.2);
  [-3.0, 0, 3.0].forEach((px) => addPartBox(scene, 0.22, 3.0, 0.22, redTileMat, 136 + px, 1.6, -0.9));
  [-3.0, 3.0].forEach((px) => addPartBox(scene, 0.22, 3.0, 0.22, redTileMat, 136 + px, 1.6, -3.5));
  const salaF = addPartBox(scene, 7.4, 0.12, 2.1, redTileMat, 136, 3.35, -1.38);
  salaF.rotation.x = 0.4;
  const salaB = addPartBox(scene, 7.4, 0.12, 2.1, redTileMat, 136, 3.35, -3.02);
  salaB.rotation.x = -0.4;
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
  [141.2, 145.6].forEach((px) => addPartBox(scene, 1.2, 4.4, 1.5, brickMat, px, 2.2, -2.5));
  addPartBox(scene, 5.8, 1.0, 1.54, brickMat, 143.4, 4.1, -2.5);
  addPartBox(scene, 4.4, 0.18, 2.0, darkWoodMat, 143.4, 4.7, -2.5);
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
