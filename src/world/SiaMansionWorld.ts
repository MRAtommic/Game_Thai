import * as THREE from 'three';
import { FloorIndex } from '../types';
import { CharacterKind } from '../art/SpriteFactory';
import { buildRealisticCar } from './VehicleModels';

export const MANSION_FLOOR_H = 4.2;

export interface MansionGuard {
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  cone: THREE.Mesh;
  coneMat: THREE.MeshBasicMaterial;
  floor: FloorIndex;
  x: number;
  minX: number;
  maxX: number;
  dir: 1 | -1;
  speed: number;
  kind: CharacterKind;
}

export interface MansionHidingSpot {
  x: number;
  floor: FloorIndex;
  label: string;
}

export interface SiaMansionRefs {
  group: THREE.Group;
  guards: MansionGuard[];
  hidingSpots: MansionHidingSpot[];
  evidenceMeshes: { id: 'ev1' | 'ev2' | 'ev3'; mesh: THREE.Object3D; light: THREE.PointLight }[];
  lights: THREE.PointLight[];
}

export function buildSiaMansionWorld(
  charFrames: Record<CharacterKind, THREE.CanvasTexture[]>,
  shadowTex: THREE.CanvasTexture
): SiaMansionRefs {
  const group = new THREE.Group();
  group.visible = false;

  const addBox = (
    w: number,
    h: number,
    d: number,
    color: string,
    x: number,
    y: number,
    z: number,
    rough = 0.72,
    metal = 0.08
  ): THREE.Mesh => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })
    );
    m.position.set(x, y, z);
    m.receiveShadow = true;
    m.castShadow = true;
    group.add(m);
    return m;
  };

  const lights: THREE.PointLight[] = [];

  // 1) Estate Courtyard, Paved Driveway, Marble Fountain & Luxury Black Sedan
  addBox(38, 0.4, 14.0, '#1e293b', -1.5, -0.2, 0.5, 0.85); // dark estate paving
  addBox(25.4, 0.16, 5.4, '#f8fafc', 0, 0.06, -0.45, 0.28, 0.14); // polished white marble terrace
  addBox(25.8, 0.1, 0.35, '#ca8a04', 0, 0.12, 2.25, 0.3, 0.65); // gold-trimmed terrace edge
  // Grand Entry Steps outside front mansion door (-12.3)
  for (let st = 0; st < 3; st++) {
    addBox(0.42, 0.08, 2.4, '#e2e8f0', -13.1 + st * 0.32, 0.04 + st * 0.04, 0.2, 0.3);
  }
  // Ornate 2-tier Marble Courtyard Fountain (-15.2, z = -1.6)
  const fPool = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.35, 0.32, 16),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.35 })
  );
  fPool.position.set(-15.5, 0.16, -1.6);
  const fWater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1, metalness: 0.4 })
  );
  fWater.position.set(-15.5, 0.31, -1.6);
  const fTier = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.22, 0.88, 12),
    new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.35 })
  );
  fTier.position.set(-15.5, 0.68, -1.6);
  group.add(fPool, fWater, fTier);

  // Sia Wirat's Luxury Black Sedan parked outside mansion gate (-15.2, z = 1.45)
  const siaSedan = buildRealisticCar({
    bodyColor: '#0f172a',
    roofColor: '#020617',
    variant: 'sedan',
    facing: 1,
  }).group;
  siaSedan.scale.multiplyScalar(0.85);
  siaSedan.position.set(-15.6, 0, 1.45);
  group.add(siaSedan);

  // European-Thai Wrought-Iron & Gold Estate Gate (-12.8)
  [-1.9, 1.8].forEach((gz) => {
    addBox(0.55, 3.6, 0.55, '#f8fafc', -12.8, 1.8, gz, 0.4);
    addBox(0.68, 0.24, 0.68, '#eab308', -12.8, 3.65, gz, 0.28, 0.7);
    const gOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshBasicMaterial({ color: '#fef08a' })
    );
    gOrb.position.set(-12.8, 3.95, gz);
    group.add(gOrb);
  });
  for (let gz = -1.5; gz <= 1.45; gz += 0.32) {
    addBox(0.05, 2.3, 0.05, '#0f172a', -12.8, 1.15, gz, 0.4, 0.6);
    addBox(0.08, 0.14, 0.08, '#eab308', -12.8, 2.32, gz, 0.3, 0.75);
  }

  // 2) Grand 3-Story Cutaway Mansion Structure (x = -12 .. +12, y = 0 .. 12.6)
  const wallCols = ['#f8f3e8', '#f4ead5', '#322016'];
  const panelCols = ['#e7decb', '#e2d2b5', '#4a2e1d'];
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.12,
    metalness: 0.45,
  });

  for (let fl = 0; fl < 3; fl++) {
    const yb = fl * MANSION_FLOOR_H;
    // Main back wall + 3D recessed Louis wainscoting moulding panels!
    addBox(24.4, MANSION_FLOOR_H, 0.3, wallCols[fl], 0, yb + MANSION_FLOOR_H / 2, -2.65, 0.68);
    addBox(24.4, 0.95, 0.08, panelCols[fl], 0, yb + 0.55, -2.48, 0.58);
    addBox(24.4, 0.12, 0.14, '#ca8a04', 0, yb + 1.06, -2.46, 0.3, 0.7);
    for (let px = -10.5; px <= 10.5; px += 3.0) {
      addBox(2.2, 0.65, 0.12, wallCols[fl], px, yb + 0.55, -2.45, 0.65);
    }

    // Tall Arched French Windows along rear wall with draped velvet curtains!
    [-7.5, -2.5, 2.5, 7.5].forEach((wx) => {
      addBox(1.5, 2.25, 0.1, '#ca8a04', wx, yb + 2.35, -2.48, 0.35, 0.6);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(1.32, 2.08, 0.06), glassMat);
      pane.position.set(wx, yb + 2.35, -2.44);
      group.add(pane);
      addBox(0.06, 2.08, 0.08, '#f8fafc', wx, yb + 2.35, -2.4, 0.4);
      addBox(1.32, 0.06, 0.08, '#f8fafc', wx, yb + 2.45, -2.4, 0.4);
      // Draped luxury curtains flanking each French window
      [-0.78, 0.78].forEach((cx) => {
        addBox(0.3, 2.4, 0.18, fl === 2 ? '#7f1d1d' : '#1e3a8a', wx + cx, yb + 2.35, -2.35, 0.85);
      });
    });

    // Floor slab + gold fascia + exterior classic colonnade pilasters
    addBox(24.6, 0.24, 5.4, fl === 0 ? '#f1f5f9' : '#e2e8f0', 0, yb + MANSION_FLOOR_H - 0.12, -0.15, 0.35, 0.12);
    addBox(24.8, 0.12, 0.16, '#eab308', 0, yb + MANSION_FLOOR_H - 0.04, 2.52, 0.25, 0.72);
    addBox(0.45, MANSION_FLOOR_H, 5.4, '#e7e0d3', -12.15, yb + MANSION_FLOOR_H / 2, -0.15, 0.65);
    addBox(0.45, MANSION_FLOOR_H, 5.4, '#e7e0d3', 12.15, yb + MANSION_FLOOR_H / 2, -0.15, 0.65);

    // Multi-Tier Crystal Chandeliers hanging from ceiling!
    [-5.0, 0.5, 5.5].forEach((lx) => {
      addBox(0.06, 0.38, 0.06, '#eab308', lx, yb + MANSION_FLOOR_H - 0.4, -0.4, 0.25, 0.75);
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.04, 6, 16),
        new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.75, roughness: 0.25 })
      );
      ring1.rotation.x = Math.PI / 2;
      ring1.position.set(lx, yb + MANSION_FLOOR_H - 0.68, -0.4);
      const crystalCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        new THREE.MeshBasicMaterial({ color: '#fef9c3' })
      );
      crystalCore.position.set(lx, yb + MANSION_FLOOR_H - 0.78, -0.4);
      group.add(ring1, crystalCore);
    });

    // Warm room illumination per floor
    [-5.5, 5.0].forEach((lx) => {
      const pl = new THREE.PointLight(fl === 2 ? '#fde68a' : '#fff7ed', 4.6, 16, 1.0);
      pl.position.set(lx, yb + MANSION_FLOOR_H - 0.9, 1.65);
      group.add(pl);
      lights.push(pl);
    });
  }

  // Grand Classical Mansion Roof, Gold Pediment Crest & Balcony Balustrades (y = 12.6 .. 15.6)
  addBox(25.8, 0.38, 6.0, '#7f1d1d', 0, 12.76, -0.15, 0.5);
  addBox(26.0, 0.14, 6.1, '#eab308', 0, 12.56, -0.15, 0.25, 0.7);
  const roofPeak = new THREE.Mesh(
    new THREE.ConeGeometry(14.0, 2.7, 4),
    new THREE.MeshStandardMaterial({ color: '#450a0a', roughness: 0.62 })
  );
  roofPeak.rotation.y = Math.PI / 4;
  roofPeak.scale.set(1.32, 1.0, 0.36);
  roofPeak.position.set(0, 14.25, -0.15);
  group.add(roofPeak);

  // --- FLOOR 1 (y = 0): Persian Carpet, Velvet Sofa Set, Illuminated Wine/Trophy Display & Grand Staircase (+8.5) ---
  addBox(8.6, 0.03, 2.4, '#7f1d1d', -1.8, 0.15, -0.6, 0.9); // red Persian carpet
  addBox(8.2, 0.035, 2.0, '#ca8a04', -1.8, 0.152, -0.6, 0.7); // gold carpet border
  addBox(7.6, 0.04, 1.6, '#991b1b', -1.8, 0.155, -0.6, 0.85);
  addBox(2.6, 0.68, 1.05, '#7f1d1d', -5.8, 0.42, -1.45, 0.65); // tufted velvet sofa
  addBox(1.5, 0.44, 0.85, '#e2e8f0', -5.8, 0.28, -0.15, 0.3, 0.1); // marble coffee table
  // Illuminated Gold-Trimmed Liquor & Bribery Cabinet + Display Pedestal (+2.8)
  addBox(1.6, 2.2, 0.55, '#451a03', 0.2, 1.15, -2.2, 0.55);
  addBox(1.35, 1.65, 0.08, '#fef3c7', 0.2, 1.35, -1.94, 0.2);
  addBox(1.6, 0.82, 0.85, '#ca8a04', 2.8, 0.42, -1.4, 0.35, 0.6); // gilded pedestal table (Ev 1)
  // Grand Staircase Floor 1 -> Floor 2 (right side x = +8.5) with teak & brass balusters!
  for (let s = 0; s < 7; s++) {
    addBox(0.6, 0.22, 1.45, '#92400e', 7.3 + s * 0.45, 0.12 + s * 0.56, -1.65, 0.45);
    addBox(0.06, 0.75, 0.06, '#eab308', 7.3 + s * 0.45, 0.6 + s * 0.56, -0.96, 0.3, 0.7);
  }

  // --- FLOOR 2 (y = 4.2): Art Gallery, Black Grand Piano, Gold-Framed Oil Paintings & Staircase Left (-8.5) ---
  [-6.8, -1.5, 6.2].forEach((gx, gi) => {
    addBox(1.85, 1.35, 0.1, '#ca8a04', gx, MANSION_FLOOR_H + 2.2, -2.4, 0.28, 0.72);
    addBox(1.52, 1.05, 0.12, gi === 1 ? '#7f1d1d' : '#1e3a8a', gx, MANSION_FLOOR_H + 2.2, -2.38, 0.55);
  });
  // Glossy Black Grand Piano at Floor 2 lounge (x = -4.2)
  addBox(1.85, 0.28, 1.35, '#09090b', -4.2, MANSION_FLOOR_H + 0.88, -1.55, 0.15, 0.35);
  [-4.95, -3.45].forEach((px) => addBox(0.1, 0.76, 0.1, '#09090b', px, MANSION_FLOOR_H + 0.38, -1.1, 0.2));
  addBox(1.65, 0.12, 0.35, '#f8fafc', -4.2, MANSION_FLOOR_H + 0.78, -0.82, 0.3); // piano keys
  addBox(1.85, 0.8, 0.85, '#581c87', 1.5, MANSION_FLOOR_H + 0.4, -1.4, 0.45); // console table (Ev 2)
  // Staircase Floor 2 -> Floor 3 (left side x = -8.5)
  for (let s = 0; s < 7; s++) {
    addBox(0.6, 0.22, 1.45, '#92400e', -7.2 - s * 0.45, MANSION_FLOOR_H + 0.12 + s * 0.56, -1.65, 0.45);
    addBox(0.06, 0.75, 0.06, '#eab308', -7.2 - s * 0.45, MANSION_FLOOR_H + 0.6 + s * 0.56, -0.96, 0.3, 0.7);
  }

  // --- FLOOR 3 (y = 8.4): Sia Wirat's Mahogany Penthouse Study, Safe, Grandfather Clock & Executive Desk (+8.8) ---
  const y3 = MANSION_FLOOR_H * 2;
  // Grand Mahogany Bookcase filled with colorful leather-bound books
  addBox(2.6, 3.0, 0.65, '#451a03', -0.5, y3 + 1.5, -2.2, 0.65);
  [0.7, 1.4, 2.1].forEach((by, bi) => {
    addBox(2.4, 0.08, 0.55, '#78350f', -0.5, y3 + by, -2.1, 0.6);
    ['#dc2626', '#2563eb', '#eab308', '#15803d', '#9333ea'].forEach((bc, ci) => {
      addBox(0.16, 0.38, 0.35, bc, -1.45 + ci * 0.46 + (bi % 2) * 0.1, y3 + by + 0.22, -2.02, 0.7);
    });
  });
  // Antique Grandfather Clock + Heavy Steel Vault Safe
  addBox(0.62, 2.35, 0.48, '#451a03', 1.8, y3 + 1.18, -2.15, 0.5);
  addBox(0.4, 0.4, 0.06, '#fef08a', 1.8, y3 + 1.95, -1.9, 0.3);
  addBox(1.25, 1.45, 0.9, '#334155', 3.6, y3 + 0.72, -2.05, 0.35, 0.65);
  addBox(0.32, 0.32, 0.1, '#eab308', 3.6, y3 + 0.8, -1.58, 0.25, 0.85);
  // Sia's Executive Mahogany Desk + Leather High-Back Chair + Green Banker Lamp (+8.8)
  addBox(2.45, 0.84, 1.1, '#451a03', 8.8, y3 + 0.42, -1.35, 0.55);
  addBox(2.52, 0.08, 1.16, '#ca8a04', 8.8, y3 + 0.84, -1.35, 0.35, 0.6);
  addBox(0.85, 1.35, 0.65, '#18181b', 8.8, y3 + 0.85, -2.05, 0.6); // executive chair
  addBox(0.36, 0.45, 0.25, '#15803d', 8.15, y3 + 1.05, -1.35, 0.35); // green banker lamp

  // --- HIDING SPOTS (จุดหลบซ่อนตามชั้น: พุ่มไม้, เสาหินอ่อนหัวบัวทอง, ม่านกำมะหยี่, ชั้นหนังสือ) ---
  const hidingSpots: MansionHidingSpot[] = [
    { x: -10.2, floor: 0, label: 'พุ่มไม้หน้าคฤหาสน์' },
    { x: -1.8, floor: 0, label: 'เสาหินอ่อนชั้น 1' },
    { x: 5.5, floor: 0, label: 'เสาหินอ่อนมุมบันได' },
    { x: -4.2, floor: 1, label: 'เสาแกลเลอรีชั้น 2' },
    { x: 4.5, floor: 1, label: 'ม่านกำมะหยี่ชั้น 2' },
    { x: -3.2, floor: 2, label: 'ชั้นหนังสือลับชั้น 3' },
    { x: 5.8, floor: 2, label: 'ม่านห้องทำงานชั้น 3' },
  ];
  hidingSpots.forEach((hs) => {
    const yb = hs.floor * MANSION_FLOOR_H;
    if (hs.label.includes('พุ่มไม้')) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 10, 8),
        new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.9 })
      );
      bush.position.set(hs.x, yb + 0.65, 1.05);
      group.add(bush);
    } else if (hs.label.includes('ม่าน')) {
      addBox(1.05, 3.4, 0.48, '#7f1d1d', hs.x, yb + 1.7, 0.95, 0.82);
      addBox(1.12, 0.14, 0.52, '#eab308', hs.x, yb + 3.45, 0.95, 0.3, 0.65);
    } else if (hs.label.includes('ชั้นหนังสือ')) {
      addBox(1.35, 2.75, 0.6, '#3f1d0b', hs.x, yb + 1.38, 0.95, 0.72);
    } else {
      // Grand fluted marble column with gold Corinthian capital
      addBox(0.72, 3.8, 0.72, '#f1f5f9', hs.x, yb + 1.9, 1.0, 0.3, 0.12);
      addBox(0.95, 0.24, 0.95, '#eab308', hs.x, yb + 0.14, 1.0, 0.25, 0.7);
      addBox(0.95, 0.24, 0.95, '#eab308', hs.x, yb + 3.82, 1.0, 0.25, 0.7);
    }
  });

  // --- COLLECTIBLE EVIDENCE PROPS (3 Glowing Evidence Folders/Envelopes) ---
  const makeEv = (id: 'ev1' | 'ev2' | 'ev3', x: number, floor: FloorIndex, color: string) => {
    const yb = floor * MANSION_FLOOR_H;
    const m = addBox(0.48, 0.14, 0.34, color, x, yb + 0.92, -1.35, 0.3);
    const l = new THREE.PointLight('#fde047', 2.6, 6.0, 1.0);
    l.position.set(x, yb + 1.45, -0.8);
    group.add(l);
    return { id, mesh: m, light: l };
  };
  const evidenceMeshes = [
    makeEv('ev1', 2.8, 0, '#ef4444'),
    makeEv('ev2', 1.5, 1, '#38bdf8'),
    makeEv('ev3', 8.8, 2, '#facc15'),
  ];

  // --- PATROLLING BODYGUARDS WITH VISION CONES ON FLOORS 1, 2, 3 ---
  const guardConfigs: { floor: FloorIndex; x: number; minX: number; maxX: number; dir: 1 | -1; speed: number; kind: CharacterKind }[] = [
    { floor: 0, x: 1.5, minX: -6.5, maxX: 6.5, dir: -1, speed: 2.0, kind: 'gang_hoodie' },
    { floor: 1, x: -2.0, minX: -6.0, maxX: 6.5, dir: 1, speed: 2.25, kind: 'gang_denim' },
    { floor: 2, x: 2.0, minX: -5.5, maxX: 7.2, dir: -1, speed: 2.45, kind: 'gang_maroon' },
  ];

  const guards: MansionGuard[] = guardConfigs.map((gc) => {
    const yb = gc.floor * MANSION_FLOOR_H;
    const tex = charFrames[gc.kind][0] ?? charFrames.worker[0];
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.48, 2.22),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide })
    );
    mesh.position.set(gc.x, yb + 1.08, 0.45);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.45, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(gc.x, yb + 0.08, 0.45);

    const coneMat = new THREE.MeshBasicMaterial({
      color: '#facc15',
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const coneGeo = new THREE.ConeGeometry(1.15, 4.4, 3);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.z = gc.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
    cone.rotation.x = Math.PI / 2;
    cone.position.set(gc.x + gc.dir * 2.2, yb + 0.16, 0.45);

    group.add(mesh, shadow, cone);
    return { ...gc, mesh, shadow, cone, coneMat };
  });

  return { group, guards, hidingSpots, evidenceMeshes, lights };
}
