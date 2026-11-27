import * as THREE from 'three';
import { addPartBox, makeAyutthayaBrickTex, makeAyutthayaFigure, makeAyutthayaSignTex } from './AyutthayaArchitecture';

export type Ch4RoomId =
  | 'outside'
  | 'market_hall'
  | 'peasant_house'
  | 'blacksmith_interior'
  | 'noble_mansion'
  | 'garrison_fort'
  | 'royal_palace'
  | 'temple_ubosot';

export const CH4_ROOM_META: Record<
  Exclude<Ch4RoomId, 'outside'>,
  { name: string; halfW: number; camZ: number; camY: number; actionX: number; actionLabel: string }
> = {
  market_hall: {
    name: 'ภายในเรือนแพตลาดน้ำอโยธยา',
    halfW: 8.2,
    camZ: 12.6,
    camY: 2.35,
    actionX: 4.5,
    actionLabel: 'หยิบสมุนไพร & ชมเครื่องสังคโลก [E]',
  },
  peasant_house: {
    name: 'ภายในเรือนไทยฝาปะกนชาวบ้าน',
    halfW: 7.5,
    camZ: 12.0,
    camY: 2.3,
    actionX: 4.2,
    actionLabel: 'พักกายบนแคร่เรือนไทย & ไหว้หิ้งพระ [E]',
  },
  blacksmith_interior: {
    name: 'ภายในโรงตีดาบหลวงลุงสิน',
    halfW: 8.2,
    camZ: 12.6,
    camY: 2.35,
    actionX: 4.8,
    actionLabel: 'ตีลูกดอกหน้าไม้เพิ่มจากคลังเหล็กน้ำพี้ [E]',
  },
  noble_mansion: {
    name: 'ภายในโถงจวนพระยาวิชัย (เรือนขุนนาง)',
    halfW: 8.8,
    camZ: 13.4,
    camY: 2.55,
    actionX: 5.2,
    actionLabel: 'เปิดตู้โอสถหลวง & ชมหีบสมบัติเบญจรงค์ [E]',
  },
  garrison_fort: {
    name: 'ภายในหอบัญชาการกองทัพประตูชัย',
    halfW: 8.8,
    camZ: 13.2,
    camY: 2.5,
    actionX: 4.6,
    actionLabel: 'ตรวจแผนที่ยุทธศาสตร์กรุงศรีอยุธยา [E]',
  },
  royal_palace: {
    name: 'ภายในพระที่นั่งสรรเพชญมหาปราสาท (พระบรมมหาราชวัง)',
    halfW: 11.2,
    camZ: 15.6,
    camY: 3.15,
    actionX: 6.2,
    actionLabel: 'ถวายบังคม & รับพระราชทานโอสถหลวง [E]',
  },
  temple_ubosot: {
    name: 'ภายในพระอุโบสถหลวง วัดพระศรีสรรเพชญ์',
    halfW: 11.2,
    camZ: 15.6,
    camY: 3.15,
    actionX: 6.0,
    actionLabel: 'กราบพระประธานทองคำ & ตักน้ำพระพุทธมนต์ [E]',
  },
};

function addExitDoorway(parent: THREE.Group, x: number, height: number, frameMat: THREE.Material, doorMat: THREE.Material): void {
  addPartBox(parent, 1.85, 2.85, 0.25, frameMat, x, 1.42, -1.6);
  addPartBox(parent, 1.45, 2.5, 0.28, doorMat, x, 1.28, -1.58);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 0.5),
    new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#450a0a', '#eab308', '#fef08a', 'ประตูออกไปข้างนอก [E]') })
  );
  sign.position.set(x, Math.min(height - 0.8, 3.25), -1.38);
  parent.add(sign);
}

function createRoomShell(
  halfW: number,
  height: number,
  floorMat: THREE.Material,
  wallMat: THREE.Material,
  trimMat: THREE.Material,
  ceilingMat: THREE.Material,
  lightCol: string,
  lightIntensity = 3.2
): THREE.Group {
  const g = new THREE.Group();
  const fullW = halfW * 2 + 2.4;
  // Floor, Rear Mural Wall, Left/Right Side Walls, Coffered Ceiling & Baseboards
  addPartBox(g, fullW, 0.24, 9.2, floorMat, 0, -0.12, 0.4);
  addPartBox(g, fullW, height, 0.35, wallMat, 0, height / 2, -2.2);
  addPartBox(g, fullW, 0.28, 0.42, trimMat, 0, 0.14, -2.02); // lower baseboard
  addPartBox(g, fullW, 0.28, 0.42, trimMat, 0, height - 0.14, -2.02); // upper cornice
  addPartBox(g, 0.35, height, 9.2, wallMat, -halfW - 1.1, height / 2, 0.4);
  addPartBox(g, 0.35, height, 9.2, wallMat, halfW + 1.1, height / 2, 0.4);
  addPartBox(g, fullW, 0.3, 9.2, ceilingMat, 0, height, 0.4);

  const l1 = new THREE.PointLight(lightCol, lightIntensity, 28, 1.0);
  l1.position.set(-halfW * 0.42, height - 1.2, 1.4);
  const l2 = new THREE.PointLight(lightCol, lightIntensity, 28, 1.0);
  l2.position.set(halfW * 0.42, height - 1.2, 1.4);
  g.add(l1, l2);
  return g;
}

/** Builds all 7 richly detailed enterable 3D Ayutthaya interior halls, palaces & temples. */
export function buildAyutthayaInteriors(scene: THREE.Scene): Partial<Record<Ch4RoomId, THREE.Group>> {
  const goldMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.72, roughness: 0.2 });
  const redLacquerMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.55 });
  const redCarpetMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.72 });
  const marbleMat = new THREE.MeshStandardMaterial({ color: '#f1ebe0', roughness: 0.42 });
  const teakDarkMat = new THREE.MeshStandardMaterial({ color: '#3b2112', roughness: 0.85 });
  const teakMidMat = new THREE.MeshStandardMaterial({ color: '#6e3d20', roughness: 0.76 });
  const teakLightMat = new THREE.MeshStandardMaterial({ color: '#92542c', roughness: 0.72 });
  const whiteClothMat = new THREE.MeshStandardMaterial({ color: '#fafaf9', roughness: 0.65 });
  const brickMat = new THREE.MeshStandardMaterial({ map: makeAyutthayaBrickTex(8, 3), roughness: 0.85 });
  const warmWindowMat = new THREE.MeshBasicMaterial({ color: '#fde68a' });
  const exitDarkMat = new THREE.MeshStandardMaterial({ color: '#1c100a', roughness: 0.9 });

  const rooms: Partial<Record<Ch4RoomId, THREE.Group>> = {};

  // =========================================================================
  // 1) ROYAL PALACE THRONE HALL (พระที่นั่งสรรเพชญมหาปราสาท)
  // =========================================================================
  const palace = createRoomShell(11.2, 8.6, marbleMat, redLacquerMat, goldMat, redLacquerMat, '#fde68a', 3.6);
  // Crimson & Gold Royal Carpet extending down the grand marble nave
  addPartBox(palace, 22.0, 0.04, 2.5, redCarpetMat, 0, 0.02, 0.6);
  addPartBox(palace, 22.0, 0.045, 0.14, goldMat, 0, 0.025, 1.85);
  addPartBox(palace, 22.0, 0.045, 0.14, goldMat, 0, 0.025, -0.65);

  // Twin Colonnade of Towering Gilded Lotus-Capital Palace Pillars + Arched Sunlit Windows
  [-8.5, -5.0, -1.5, 2.0, 5.5].forEach((px) => {
    [-1.4, 2.2].forEach((pz) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 7.6, 12), redLacquerMat);
      col.position.set(px, 3.85, pz);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.45, 12), goldMat);
      base.position.set(px, 0.22, pz);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.24, 0.48, 12), goldMat);
      cap.position.set(px, 7.65, pz);
      palace.add(col, base, cap);
    });
  });
  [-6.8, -3.2, 0.3, 3.8].forEach((wx) => {
    addPartBox(palace, 1.25, 2.75, 0.16, goldMat, wx, 3.6, -1.98);
    addPartBox(palace, 0.92, 2.4, 0.18, warmWindowMat, wx, 3.6, -1.96);
  });
  // Gilded Hanging Palace Chandeliers
  [-4.5, 1.5].forEach((lx) => {
    addPartBox(palace, 0.05, 2.2, 0.05, goldMat, lx, 7.3, 0.6);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 6, 14), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(lx, 6.2, 0.6);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), warmWindowMat);
    orb.position.set(lx, 6.2, 0.6);
    palace.add(ring, orb);
  });

  // Grand 3-Tiered Golden Throne Dais, Busabok Mandala Canopy & Twin 9-Tier White Royal Umbrellas (เศวตฉัตร)!
  const tX = 6.8;
  addPartBox(palace, 5.2, 0.42, 3.8, marbleMat, tX, 0.21, -0.2);
  addPartBox(palace, 4.2, 0.45, 3.1, goldMat, tX, 0.64, -0.2);
  addPartBox(palace, 3.0, 0.5, 2.3, redLacquerMat, tX, 1.1, -0.2);
  addPartBox(palace, 2.1, 0.32, 1.5, goldMat, tX, 1.5, -0.2);
  // Throne Chair & Carved Busabok Crown
  addPartBox(palace, 1.25, 0.42, 0.95, goldMat, tX, 1.88, -0.45);
  addPartBox(palace, 1.35, 1.7, 0.2, goldMat, tX, 2.7, -0.95);
  [-0.88, 0.88].forEach((ox) => {
    [-0.95, 0.65].forEach((oz) => addPartBox(palace, 0.12, 3.2, 0.12, goldMat, tX + ox, 3.25, -0.2 + oz));
  });
  const bSpire1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.45, 4), goldMat);
  bSpire1.rotation.y = Math.PI / 4;
  bSpire1.position.set(tX, 5.45, -0.2);
  const bSpire2 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.85, 8), goldMat);
  bSpire2.position.set(tX, 6.65, -0.2);
  palace.add(bSpire1, bSpire2);

  // Twin 9-Tier Royal Umbrellas (พระมหาเศวตฉัตร) + Brass Floral Phan Phum Trays
  [tX - 2.35, tX + 2.35].forEach((ux) => {
    addPartBox(palace, 0.09, 5.4, 0.09, goldMat, ux, 2.7, -0.2);
    for (let u = 0; u < 7; u++) {
      const r = 0.72 - u * 0.075;
      const tier = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 0.18, 14), whiteClothMat);
      tier.position.set(ux, 3.6 + u * 0.25, -0.2);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 5, 14), goldMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(ux, 3.52 + u * 0.25, -0.2);
      palace.add(tier, rim);
    }
    const phan = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.65, 8), goldMat);
    phan.position.set(ux, 1.05, 1.1);
    palace.add(phan);
  });

  // Royal Guards & Court Officials attending inside the Throne Hall
  [-2.5, 2.8].forEach((gx) => {
    const grd = makeAyutthayaFigure('#991b1b', '#eab308', { helmetGold: true, hasSpear: true });
    grd.position.set(gx, 0, -1.0);
    palace.add(grd);
  });
  addExitDoorway(palace, -9.2, 8.6, goldMat, exitDarkMat);
  palace.visible = false;
  scene.add(palace);
  rooms.royal_palace = palace;

  // =========================================================================
  // 2) WAT PHRA SI SANPHET UBOSOT TEMPLE HALL (พระอุโบสถหลวง)
  // =========================================================================
  const temple = createRoomShell(11.2, 8.4, marbleMat, redLacquerMat, goldMat, redLacquerMat, '#fde047', 3.4);
  addPartBox(temple, 22.0, 0.04, 2.6, redCarpetMat, 0, 0.02, 0.5);
  [-8.0, -4.5, -1.0, 2.5].forEach((px) => {
    [-1.4, 2.1].forEach((pz) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 7.5, 12), redLacquerMat);
      col.position.set(px, 3.75, pz);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.45, 8), goldMat);
      cap.rotation.x = Math.PI;
      cap.position.set(px, 7.3, pz);
      temple.add(col, cap);
    });
  });

  // Grand Seated Golden Buddha Statue (พระพุทธปฏิมากรปางมารวิชัยขนาดใหญ่) + Arch Aureole (ซุ้มเรือนแก้ว)
  const bX = 6.6;
  addPartBox(temple, 5.2, 0.75, 3.8, marbleMat, bX, 0.38, -0.3);
  addPartBox(temple, 4.3, 0.72, 3.1, goldMat, bX, 1.05, -0.3);
  const lotusPed = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.85, 0.48, 16), goldMat);
  lotusPed.position.set(bX, 1.62, -0.3);
  const bLap = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.48, 0.55, 16), goldMat);
  bLap.scale.set(1.2, 1, 0.85);
  bLap.position.set(bX, 2.08, -0.3);
  const bTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.82, 1.55, 14), goldMat);
  bTorso.position.set(bX, 3.05, -0.3);
  const bShoulders = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), goldMat);
  bShoulders.scale.set(1.2, 0.65, 0.82);
  bShoulders.position.set(bX, 3.62, -0.3);
  const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), goldMat);
  bHead.position.set(bX, 4.32, -0.3);
  const bFlame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.62, 8), goldMat);
  bFlame.position.set(bX, 4.92, -0.3);
  const aureole = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.11, 8, 24, Math.PI * 1.25), goldMat);
  aureole.rotation.z = -Math.PI * 0.125;
  aureole.position.set(bX, 3.45, -0.75);
  temple.add(lotusPed, bLap, bTorso, bShoulders, bHead, bFlame, aureole);

  // Altar Offering Tables, Tall Altar Candles, Holy Water Bowl & Monk Khong
  addPartBox(temple, 3.2, 0.65, 1.1, teakDarkMat, bX - 3.3, 0.32, 0.2);
  [-0.8, 0, 0.8].forEach((ox) => {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.65, 8), whiteClothMat);
    candle.position.set(bX - 3.3 + ox, 0.95, 0.2);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), warmWindowMat);
    fl.position.set(bX - 3.3 + ox, 1.34, 0.2);
    temple.add(candle, fl);
  });
  const holyBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.26, 12), goldMat);
  holyBowl.position.set(bX - 4.2, 0.78, 0.45);
  temple.add(holyBowl);
  const monk = makeAyutthayaFigure('#ea580c', '#c2410c', { isMonk: true });
  monk.position.set(1.5, 0, -0.4);
  temple.add(monk);
  addExitDoorway(temple, -9.2, 8.4, goldMat, exitDarkMat);
  temple.visible = false;
  scene.add(temple);
  rooms.temple_ubosot = temple;

  // =========================================================================
  // 3) NOBLEMAN MANSION INTERIOR (โถงเรือนหมู่พระยาวิชัย)
  // =========================================================================
  const noble = createRoomShell(8.8, 6.2, teakMidMat, teakLightMat, teakDarkMat, teakDarkMat, '#fcd34d', 3.0);
  addPartBox(noble, 8.8, 0.04, 3.4, redCarpetMat, 0.8, 0.02, 0.3);
  [-6, -2, 2, 6].forEach((px) => addPartBox(noble, 0.26, 6.0, 0.26, teakDarkMat, px, 3.0, -1.9));
  [-4, 0, 4].forEach((wx) => {
    addPartBox(noble, 1.2, 1.6, 0.1, teakDarkMat, wx, 2.8, -1.95);
    addPartBox(noble, 0.9, 1.3, 0.12, warmWindowMat, wx, 2.8, -1.93);
  });
  // Carved Pearl-Inlaid Teak Daybed (ตั่งขุนนาง), Gold Folding Screen, Treasure Chest & Medicine Cabinet
  addPartBox(noble, 3.2, 0.55, 1.8, teakDarkMat, 4.8, 0.28, -0.5);
  addPartBox(noble, 2.8, 0.12, 1.6, redCarpetMat, 4.8, 0.6, -0.5);
  addPartBox(noble, 0.55, 0.48, 0.55, goldMat, 5.9, 0.88, -0.5); // triangular silk pillow cushion
  addPartBox(noble, 3.6, 2.5, 0.12, goldMat, 5.2, 1.25, -1.65); // gilded lacquer folding screen!
  addPartBox(noble, 1.25, 0.72, 0.78, teakDarkMat, 1.8, 0.36, -1.2);
  addPartBox(noble, 1.28, 0.12, 0.82, goldMat, 1.8, 0.7, -1.2); // brass-bound treasure chest
  addPartBox(noble, 1.4, 2.4, 0.65, teakMidMat, -2.5, 1.2, -1.55); // royal herbal medicine cabinet
  const nobleNpc = makeAyutthayaFigure('#eab308', '#581c87', { hatCol: '#f5f5f4' });
  nobleNpc.position.set(3.2, 0, 0.3);
  noble.add(nobleNpc);
  addExitDoorway(noble, -7.2, 6.2, goldMat, exitDarkMat);
  noble.visible = false;
  scene.add(noble);
  rooms.noble_mansion = noble;

  // =========================================================================
  // 4) ROYAL GARRISON WAR ROOM (หอบัญชาการกองทัพ & คลังยุทโธปกรณ์)
  // =========================================================================
  const fort = createRoomShell(8.8, 6.2, teakDarkMat, brickMat, marbleMat, teakDarkMat, '#fb923c', 3.0);
  // Royal Crimson & White Elephant War Banners + War Strategy Table + Great War Drum!
  [-3.8, 0, 3.8].forEach((bx) => {
    addPartBox(fort, 1.4, 2.2, 0.08, redCarpetMat, bx, 3.4, -1.96);
    addPartBox(fort, 0.65, 0.48, 0.1, marbleMat, bx, 3.4, -1.94);
  });
  // War Strategy Map Table in center
  addPartBox(fort, 3.4, 0.88, 1.8, teakDarkMat, 1.4, 0.44, -0.2);
  addPartBox(fort, 2.6, 0.06, 1.35, marbleMat, 1.4, 0.9, -0.2);
  addPartBox(fort, 0.6, 0.32, 0.4, goldMat, 1.4, 1.06, -0.2); // miniature golden palace on map
  // Giant War Drum + Weapon Racks (spears & shields)
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.25, 12), redCarpetMat);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(5.8, 1.05, -0.8);
  fort.add(drum);
  addPartBox(fort, 0.2, 0.9, 1.1, teakDarkMat, 5.8, 0.45, -0.8);
  [4.0, 4.5, 5.0].forEach((sx) => {
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), teakMidMat);
    sp.position.set(sx, 1.2, -1.65);
    fort.add(sp);
  });
  const ramNpc = makeAyutthayaFigure('#b91c1c', '#7f1d1d', { helmetGold: true, hasSpear: true });
  ramNpc.position.set(3.2, 0, 0.25);
  fort.add(ramNpc);
  addExitDoorway(fort, -7.2, 6.2, goldMat, exitDarkMat);
  fort.visible = false;
  scene.add(fort);
  rooms.garrison_fort = fort;

  // =========================================================================
  // 5) ROYAL BLACKSMITH FORGE INTERIOR (โรงตีดาบหลวงลุงสิน)
  // =========================================================================
  const forge = createRoomShell(8.2, 5.8, teakDarkMat, brickMat, teakDarkMat, teakDarkMat, '#fb923c', 3.4);
  // Glowing Charcoal Hearth, Chimney Hood, Anvil, Quench Trough & Weapon Racks!
  addPartBox(forge, 2.6, 1.2, 1.4, brickMat, 5.2, 0.6, -1.1);
  addPartBox(forge, 1.8, 3.6, 1.2, brickMat, 5.2, 3.4, -1.3);
  const coals = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), new THREE.MeshBasicMaterial({ color: '#f97316' }));
  coals.scale.set(1.5, 0.5, 1);
  coals.position.set(5.2, 1.25, -0.9);
  forge.add(coals);
  const ironMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.78, roughness: 0.3 });
  addPartBox(forge, 1.1, 0.65, 0.55, ironMat, 3.0, 0.42, -0.2); // blacksmith anvil
  addPartBox(forge, 1.4, 0.55, 0.72, teakMidMat, 1.0, 0.28, -0.8); // quenching trough
  [-2.5, -1.8, -1.1, -0.4].forEach((sx) => {
    addPartBox(forge, 0.08, 1.45, 0.04, ironMat, sx, 1.45, -1.65); // displayed Namphi swords
  });
  const smithNpc = makeAyutthayaFigure('#78350f', '#292524', { headbandCol: '#e5e5e5' });
  smithNpc.position.set(2.2, 0, -0.4);
  forge.add(smithNpc);
  addExitDoorway(forge, -6.5, 5.8, teakMidMat, exitDarkMat);
  forge.visible = false;
  scene.add(forge);
  rooms.blacksmith_interior = forge;

  // =========================================================================
  // 6) FLOATING MARKET HALL INTERIOR (โถงเรือนแพตลาดน้ำอโยธยา)
  // =========================================================================
  const market = createRoomShell(8.2, 5.6, teakMidMat, teakLightMat, teakDarkMat, teakDarkMat, '#fde047', 3.0);
  // Silk Hanging Lanterns, Rolled Thai Brocade Silk Bolts, Ceramic Sangkalok Jars & Produce Stalls!
  [-4.2, -1.0, 2.2, 5.2].forEach((lx, li) => {
    const col = li % 2 === 0 ? '#ef4444' : '#eab308';
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshBasicMaterial({ color: col }));
    lan.position.set(lx, 4.4, 0.2);
    market.add(lan);
  });
  [0.5, 3.8].forEach((cx, ci) => {
    addPartBox(market, 2.8, 0.85, 1.2, teakDarkMat, cx, 0.42, -0.9);
    [-0.7, 0, 0.7].forEach((ox, oi) => {
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.16, 0.38, 10),
        new THREE.MeshStandardMaterial({ color: oi === 0 ? '#dc2626' : ci === 0 ? '#0284c7' : '#eab308', roughness: 0.4 })
      );
      jar.position.set(cx + ox, 1.05, -0.85);
      market.add(jar);
    });
  });
  addPartBox(market, 1.8, 2.2, 0.65, teakDarkMat, 6.2, 1.1, -1.4); // rolled Thai silk shelf
  const marketNpc = makeAyutthayaFigure('#be185d', '#4c1d95', { sabaiCol: '#fde047' });
  marketNpc.position.set(2.4, 0, -0.2);
  market.add(marketNpc);
  addExitDoorway(market, -6.5, 5.6, teakMidMat, exitDarkMat);
  market.visible = false;
  scene.add(market);
  rooms.market_hall = market;

  // =========================================================================
  // 7) PEASANT TEAK STILT HOUSE INTERIOR (ภายในเรือนไทยฝาปะกน)
  // =========================================================================
  const peasant = createRoomShell(7.5, 5.4, teakMidMat, teakLightMat, teakDarkMat, teakDarkMat, '#fbbf24', 2.8);
  // Woven Reed Mats, Bamboo Raised Bed, Household Spirit/Buddha Altar, Earthen Stove & Water Jars
  addPartBox(peasant, 4.2, 0.04, 2.6, new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.9 }), 3.2, 0.02, -0.2);
  addPartBox(peasant, 2.8, 0.48, 1.45, teakDarkMat, 4.2, 0.24, -0.9); // bamboo sleeping platform
  addPartBox(peasant, 1.1, 0.65, 0.55, goldMat, -0.5, 2.4, -1.85); // home altar shelf
  const homeBuddha = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 8), goldMat);
  homeBuddha.position.set(-0.5, 2.95, -1.85);
  const wJar = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), teakDarkMat);
  wJar.scale.set(1, 1.25, 1);
  wJar.position.set(-3.2, 0.42, -1.2);
  peasant.add(homeBuddha, wJar);
  addExitDoorway(peasant, -5.9, 5.4, teakDarkMat, exitDarkMat);
  peasant.visible = false;
  scene.add(peasant);
  rooms.peasant_house = peasant;

  return rooms;
}
