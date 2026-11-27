import * as THREE from 'three';
import { FloorIndex } from '../types';
import { CharacterKind } from '../art/SpriteFactory';

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
    rough = 0.75,
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

  // Exterior courtyard ground & luxury marble terrace (-16 .. +15)
  addBox(34, 0.4, 12.0, '#1e293b', -0.5, -0.2, 0.5, 0.85);
  addBox(24.8, 0.14, 5.2, '#f1f5f9', 0, 0.05, -0.5, 0.35, 0.12); // polished marble mansion floor

  // Grand 3-Story Cutaway Mansion Shell (x = -12 .. +12, 3 floors: y = 0 .. 12.6)
  // Back marble & mahogany walls per floor
  const wallCols = ['#f8f3e8', '#f3ead8', '#2c1e16'];
  for (let fl = 0; fl < 3; fl++) {
    const yb = fl * MANSION_FLOOR_H;
    addBox(24.2, MANSION_FLOOR_H, 0.28, wallCols[fl], 0, yb + MANSION_FLOOR_H / 2, -2.6, 0.72);
    // Floor slab + gold trim moulding
    addBox(24.4, 0.24, 5.2, '#e2e8f0', 0, yb + MANSION_FLOOR_H - 0.12, -0.2, 0.4, 0.1);
    addBox(24.5, 0.1, 0.12, '#ca8a04', 0, yb + MANSION_FLOOR_H - 0.04, 2.38, 0.3, 0.65);
    // Side walls
    addBox(0.35, MANSION_FLOOR_H, 5.2, '#e7e0d3', -12.1, yb + MANSION_FLOOR_H / 2, -0.2, 0.7);
    addBox(0.35, MANSION_FLOOR_H, 5.2, '#e7e0d3', 12.1, yb + MANSION_FLOOR_H / 2, -0.2, 0.7);

    // Ornate glowing floor chandeliers
    [-5.5, 4.5].forEach((lx) => {
      addBox(0.08, 0.45, 0.08, '#eab308', lx, yb + MANSION_FLOOR_H - 0.45, -0.4, 0.3, 0.7);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshBasicMaterial({ color: fl === 2 ? '#fef08a' : '#fffbeb' })
      );
      bulb.position.set(lx, yb + MANSION_FLOOR_H - 0.72, -0.4);
      group.add(bulb);
      const pl = new THREE.PointLight(fl === 2 ? '#fde68a' : '#ffedd5', 4.6, 15, 1.05);
      pl.position.set(lx, yb + MANSION_FLOOR_H - 0.9, 1.4);
      group.add(pl);
      lights.push(pl);
    });
  }

  // Grand Classical Pitched Roof + Gold Pediment Crest above Floor 3 (y = 12.6 .. 15.2)
  addBox(25.6, 0.35, 5.8, '#7f1d1d', 0, 12.75, -0.2, 0.55);
  const roofPeak = new THREE.Mesh(
    new THREE.ConeGeometry(13.8, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: '#450a0a', roughness: 0.65 })
  );
  roofPeak.rotation.y = Math.PI / 4;
  roofPeak.scale.set(1.3, 1.0, 0.35);
  roofPeak.position.set(0, 14.1, -0.2);
  group.add(roofPeak);

  // Luxury Black Sedan parked outside mansion gate (-14.2) & Wrought-Iron Gold Estate Gate
  addBox(0.32, 3.2, 0.32, '#e2e8f0', -12.6, 1.6, 1.6, 0.6);
  addBox(0.46, 0.22, 0.46, '#eab308', -12.6, 3.25, 1.6, 0.3, 0.6);
  for (let gz = -2.2; gz <= 1.2; gz += 0.35) {
    addBox(0.05, 2.2, 0.05, '#0f172a', -12.6, 1.1, gz, 0.4, 0.5);
  }

  // --- FLOOR 1 (y = 0): Grand Lobby, Stairwell Right (+8.5), Marble Pillars (Hiding) & Sofa ---
  addBox(2.4, 0.65, 1.0, '#7f1d1d', -5.5, 0.38, -1.5, 0.65); // velvet sofa
  addBox(1.8, 0.42, 0.9, '#ca8a04', 2.8, 0.21, -1.4, 0.4, 0.5); // gilded display table (Ev 1)
  // Grand Staircase Floor 1 -> Floor 2 (right side x = +8.5)
  for (let s = 0; s < 7; s++) {
    addBox(0.55, 0.22, 1.4, '#b45309', 7.4 + s * 0.45, 0.11 + s * 0.55, -1.65, 0.5);
  }

  // --- FLOOR 2 (y = 4.2): Art Gallery, Framed Gold Paintings, Red Velvet Curtains (Hiding) & Stairwell Left (-8.5) ---
  [-6.8, -1.5, 6.2].forEach((gx) => {
    addBox(1.65, 1.25, 0.08, '#ca8a04', gx, MANSION_FLOOR_H + 2.2, -2.42, 0.3, 0.7);
    addBox(1.38, 0.98, 0.1, '#1e3a8a', gx, MANSION_FLOOR_H + 2.2, -2.4, 0.5);
  });
  addBox(1.8, 0.75, 0.85, '#581c87', 1.5, MANSION_FLOOR_H + 0.38, -1.4, 0.5); // console table (Ev 2)
  // Staircase Floor 2 -> Floor 3 (left side x = -8.5)
  for (let s = 0; s < 7; s++) {
    addBox(0.55, 0.22, 1.4, '#b45309', -7.2 - s * 0.45, MANSION_FLOOR_H + 0.11 + s * 0.55, -1.65, 0.5);
  }

  // --- FLOOR 3 (y = 8.4): Sia Wirat's Secret Study, Safe, Mahogany Desk & Evidence #3 (+8.8) ---
  const y3 = MANSION_FLOOR_H * 2;
  addBox(2.2, 2.8, 0.7, '#451a03', -0.5, y3 + 1.4, -2.15, 0.7); // mahogany bookcase
  addBox(1.1, 1.35, 0.85, '#334155', 3.5, y3 + 0.68, -2.0, 0.4, 0.6); // steel safe
  addBox(0.28, 0.28, 0.1, '#eab308', 3.5, y3 + 0.75, -1.55, 0.3, 0.8); // safe dial
  addBox(2.3, 0.82, 1.05, '#451a03', 8.8, y3 + 0.41, -1.35, 0.6); // Sia's executive desk (Ev 3)
  addBox(0.42, 0.5, 0.3, '#f8fafc', 8.4, y3 + 0.95, -1.35, 0.5); // lamp

  // --- HIDING SPOTS (เสาหินอ่อน / พุ่มไม้ / ม่านหนา / ชั้นหนังสือ) ---
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
      bush.position.set(hs.x, yb + 0.65, 0.95);
      group.add(bush);
    } else if (hs.label.includes('ม่าน')) {
      addBox(0.95, 3.3, 0.45, '#7f1d1d', hs.x, yb + 1.65, 0.85, 0.8);
    } else if (hs.label.includes('ชั้นหนังสือ')) {
      addBox(1.3, 2.7, 0.6, '#3f1d0b', hs.x, yb + 1.35, 0.85, 0.75);
    } else {
      // Grand marble pillar in foreground-mid so player hides cleanly behind it!
      addBox(0.72, 3.8, 0.72, '#e2e8f0', hs.x, yb + 1.9, 0.9, 0.35, 0.1);
      addBox(0.92, 0.25, 0.92, '#ca8a04', hs.x, yb + 0.12, 0.9, 0.3, 0.6);
    }
  });

  // --- COLLECTIBLE EVIDENCE PROPS (3 Glowing Evidence Folders/Envelopes) ---
  const makeEv = (id: 'ev1' | 'ev2' | 'ev3', x: number, floor: FloorIndex, color: string) => {
    const yb = floor * MANSION_FLOOR_H;
    const m = addBox(0.45, 0.14, 0.32, color, x, yb + 0.9, -1.35, 0.3);
    const l = new THREE.PointLight('#fde047', 2.4, 5.5, 1.0);
    l.position.set(x, yb + 1.4, -0.8);
    group.add(l);
    return { id, mesh: m, light: l };
  };
  const evidenceMeshes = [
    makeEv('ev1', 2.8, 0, '#ef4444'), // ซองสินบน
    makeEv('ev2', 1.5, 1, '#38bdf8'), // แฟ้มบัญชีลับ
    makeEv('ev3', 8.8, 2, '#facc15'), // เอกสารสั่งเก็บพริม
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
    mesh.position.set(gc.x, yb + 1.05, 0.45);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.45, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(gc.x, yb + 0.04, 0.45);

    // Flat floor vision cone (4.4m long) showing guard's line of sight!
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
    cone.position.set(gc.x + gc.dir * 2.2, yb + 0.12, 0.45);

    group.add(mesh, shadow, cone);
    return { ...gc, mesh, shadow, cone, coneMat };
  });

  return { group, guards, hidingSpots, evidenceMeshes, lights };
}
