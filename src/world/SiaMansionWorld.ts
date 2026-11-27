import * as THREE from 'three';
import { FloorIndex } from '../types';
import { CharacterKind } from '../art/SpriteFactory';
import { createThaiDoorTexture, createThaiTileFloorTexture } from '../art/TextureFactory';
import { buildRealisticCar } from './VehicleModels';

export const MANSION_FLOOR_H = 4.2;

export type MansionSubRoomId = 'sia_study_1' | 'sia_gallery_2' | 'sia_office_3';

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
  interiorRooms: Record<MansionSubRoomId, THREE.Group>;
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
    parent: THREE.Object3D,
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
    parent.add(m);
    return m;
  };

  const addCylinder = (
    parent: THREE.Object3D,
    rt: number,
    rb: number,
    h: number,
    color: string,
    x: number,
    y: number,
    z: number,
    rough = 0.4,
    metal = 0.15,
    seg = 14
  ): THREE.Mesh => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, seg),
      new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const lights: THREE.PointLight[] = [];

  // 1) Lush Estate Courtyard, Curved Stone Driveway, Multi-Tier Fountain, Topiary Hedges & Luxury Sedan
  addBox(group, 40, 0.4, 15.0, '#1e293b', -1.5, -0.2, 0.6, 0.85);
  addBox(group, 26.2, 0.18, 5.8, '#f8fafc', 0, 0.07, -0.3, 0.28, 0.14); // marble terrace plinth
  addBox(group, 26.5, 0.1, 0.3, '#ca8a04', 0, 0.16, 2.55, 0.28, 0.7);  // gold terrace trim
  // Grand Entry Steps + Cylindrical Roman Portico Flanking Front Entrance (-9.5)
  for (let st = 0; st < 3; st++) {
    addBox(group, 4.4 - st * 0.35, 0.08, 2.6, '#e2e8f0', -12.6 + st * 0.25, 0.04 + st * 0.04, 0.3, 0.3);
  }
  // Multi-Tier Round Marble Courtyard Fountain (-15.5)
  addCylinder(group, 1.35, 1.45, 0.34, '#e2e8f0', -15.5, 0.17, -1.5, 0.35, 0.1, 20);
  addCylinder(group, 1.18, 1.18, 0.08, '#38bdf8', -15.5, 0.33, -1.5, 0.1, 0.45, 20);
  addCylinder(group, 0.26, 0.36, 0.95, '#f1f5f9', -15.5, 0.72, -1.5, 0.35, 0.1, 16);
  addCylinder(group, 0.65, 0.28, 0.22, '#f8fafc', -15.5, 1.15, -1.5, 0.35, 0.1, 16);
  const fSpray = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#bae6fd', transparent: true, opacity: 0.7 })
  );
  fSpray.position.set(-15.5, 1.4, -1.5);
  group.add(fSpray);

  // Luxury Black Sedan parked outside wrought-iron gate
  const siaSedan = buildRealisticCar({ bodyColor: '#0f172a', roofColor: '#020617', variant: 'sedan', facing: 1 }).group;
  siaSedan.scale.multiplyScalar(0.86);
  siaSedan.position.set(-15.8, 0, 1.55);
  group.add(siaSedan);

  // Ornate Wrought-Iron & Gold Estate Gate (-13.2)
  [-1.95, 1.95].forEach((gz) => {
    addCylinder(group, 0.32, 0.36, 3.6, '#f8fafc', -13.2, 1.8, gz, 0.35, 0.1, 16);
    addCylinder(group, 0.42, 0.38, 0.25, '#eab308', -13.2, 3.65, gz, 0.25, 0.75, 16);
    const gOrb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    gOrb.position.set(-13.2, 3.95, gz);
    group.add(gOrb);
  });
  for (let gz = -1.55; gz <= 1.55; gz += 0.32) {
    addBox(group, 0.05, 2.35, 0.05, '#0f172a', -13.2, 1.18, gz, 0.35, 0.65);
    addCylinder(group, 0.01, 0.06, 0.18, '#eab308', -13.2, 2.42, gz, 0.25, 0.75, 8);
  }

  // 2) Sculpted 3-Story Luxury Mansion with Round Roman Columns, Protruding Balconies, Arched Windows & Multi-Tier Roof!
  const wallCols = ['#f8f3e8', '#f3ead5', '#362218'];
  const glassMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.5 });

  for (let fl = 0; fl < 3; fl++) {
    const yb = fl * MANSION_FLOOR_H;
    // Recessed main wall + sculpted pilasters + curved arched French windows!
    addBox(group, 24.4, MANSION_FLOOR_H, 0.32, wallCols[fl], 0, yb + MANSION_FLOOR_H / 2, -2.55, 0.65);
    addBox(group, 24.4, 0.95, 0.1, fl === 2 ? '#4d2f20' : '#e7decb', 0, yb + 0.54, -2.36, 0.55);
    addBox(group, 24.4, 0.1, 0.14, '#ca8a04', 0, yb + 1.05, -2.35, 0.28, 0.72);

    // Arched French Windows with curved golden arches & draped curtains
    [-8.2, -3.4, 6.2].forEach((wx) => {
      addBox(group, 1.48, 2.1, 0.1, '#ca8a04', wx, yb + 2.25, -2.36, 0.32, 0.65);
      const archRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.09, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.28 })
      );
      archRing.position.set(wx, yb + 3.25, -2.32);
      group.add(archRing);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.95, 0.06), glassMat);
      pane.position.set(wx, yb + 2.25, -2.32);
      group.add(pane);
      [-0.78, 0.78].forEach((cx) => {
        addCylinder(group, 0.16, 0.22, 2.35, fl === 2 ? '#7f1d1d' : '#1e3a8a', wx + cx, yb + 2.3, -2.2, 0.85, 0, 10);
      });
    });

    // Protruding Front Balcony Veranda & Turned Round Balusters on Floors 2 & 3 (with real open Stairwell Holes!)
    if (fl === 0) {
      // Floor 2 slab (above Floor 1): leave open stairwell gap on RIGHT (+6.8 .. +10.8, z < -0.5) so stairs pass cleanly through!
      addBox(group, 19.3, 0.24, 5.6, '#f1f5f9', -2.85, yb + MANSION_FLOOR_H - 0.12, -0.05, 0.32, 0.12); // -12.5 .. +6.8
      addBox(group, 4.0, 0.24, 3.2, '#f1f5f9', 8.8, yb + MANSION_FLOOR_H - 0.12, 1.15, 0.32, 0.12);   // front walkway past stairwell
      addBox(group, 1.7, 0.24, 5.6, '#f1f5f9', 11.65, yb + MANSION_FLOOR_H - 0.12, -0.05, 0.32, 0.12); // +10.8 .. +12.5
      // Brass safety rail around Floor 2 stairwell opening
      addBox(group, 4.0, 0.06, 0.06, '#eab308', 8.8, yb + MANSION_FLOOR_H + 0.72, -0.45, 0.25, 0.75);
      addCylinder(group, 0.04, 0.04, 0.72, '#eab308', 6.85, yb + MANSION_FLOOR_H + 0.36, -0.45, 0.25, 0.75, 8);
    } else if (fl === 1) {
      // Floor 3 slab (above Floor 2): leave open stairwell gap on LEFT (-10.8 .. -6.8, z < -0.5) so stairs pass cleanly through!
      addBox(group, 1.7, 0.24, 5.6, '#e2e8f0', -11.65, yb + MANSION_FLOOR_H - 0.12, -0.05, 0.32, 0.12); // -12.5 .. -10.8
      addBox(group, 4.0, 0.24, 3.2, '#e2e8f0', -8.8, yb + MANSION_FLOOR_H - 0.12, 1.15, 0.32, 0.12);   // front walkway past stairwell
      addBox(group, 19.3, 0.24, 5.6, '#e2e8f0', 2.85, yb + MANSION_FLOOR_H - 0.12, -0.05, 0.32, 0.12);  // -6.8 .. +12.5
      addBox(group, 4.0, 0.06, 0.06, '#eab308', -8.8, yb + MANSION_FLOOR_H + 0.72, -0.45, 0.25, 0.75);
      addCylinder(group, 0.04, 0.04, 0.72, '#eab308', -6.85, yb + MANSION_FLOOR_H + 0.36, -0.45, 0.25, 0.75, 8);
    } else {
      addBox(group, 25.0, 0.24, 5.6, '#e2e8f0', 0, yb + MANSION_FLOOR_H - 0.12, -0.05, 0.32, 0.12);
    }
    addBox(group, 25.2, 0.12, 0.18, '#eab308', 0, yb + MANSION_FLOOR_H - 0.04, 2.75, 0.25, 0.75);
    if (fl > 0) {
      // Turned classical balcony railing along front terrace edge (z = +2.65)
      addBox(group, 24.6, 0.09, 0.14, '#f8fafc', 0, yb + 0.78, 2.65, 0.35);
      for (let bx = -11.5; bx <= 11.5; bx += 0.75) {
        addCylinder(group, 0.045, 0.06, 0.68, '#f1f5f9', bx, yb + 0.42, 2.65, 0.4, 0.1, 8);
      }
    }

    // Side walls with real openings: Grand open arched Mansion Entryway on Floor 1 Left (-12.15) & Gold-Framed Side Windows on upper/right walls!
    [-12.15, 12.15].forEach((cx) => {
      addCylinder(group, 0.34, 0.38, MANSION_FLOOR_H, '#f1f5f9', cx, yb + MANSION_FLOOR_H / 2, 2.45, 0.35, 0.1, 16);
      addCylinder(group, 0.46, 0.38, 0.24, '#eab308', cx, yb + MANSION_FLOOR_H - 0.18, 2.45, 0.25, 0.75, 16);
      if (cx === -12.15 && fl === 0) {
        // Open arched front entry doorway (clear walk-through at z = -0.5 .. +1.4!)
        addBox(group, 0.38, MANSION_FLOOR_H, 1.9, wallCols[fl], cx, yb + MANSION_FLOOR_H / 2, -1.65, 0.65);
        addBox(group, 0.38, 1.25, 2.8, wallCols[fl], cx, yb + 3.55, 0.7, 0.65); // lintel header above doorway
        addBox(group, 0.46, 0.16, 2.2, '#eab308', cx, yb + 2.95, 0.45, 0.25, 0.72); // gold door arch trim
        // Open double mahogany doors swung inward
        addBox(group, 0.75, 2.75, 0.12, '#451a03', cx + 0.45, yb + 1.4, -0.62, 0.55);
      } else {
        // Side wall piers framing a recessed transparent side window!
        addBox(group, 0.36, MANSION_FLOOR_H, 1.8, wallCols[fl], cx, yb + MANSION_FLOOR_H / 2, -1.6, 0.65);
        addBox(group, 0.36, MANSION_FLOOR_H, 1.4, wallCols[fl], cx, yb + MANSION_FLOOR_H / 2, 1.65, 0.65);
        addBox(group, 0.36, 1.1, 1.7, wallCols[fl], cx, yb + 0.55, 0.1, 0.65);
        addBox(group, 0.36, 1.15, 1.7, wallCols[fl], cx, yb + 3.6, 0.1, 0.65);
        addBox(group, 0.42, 0.1, 1.72, '#ca8a04', cx, yb + 1.12, 0.1, 0.3, 0.65); // gold window sill
        addBox(group, 0.42, 0.1, 1.72, '#ca8a04', cx, yb + 3.0, 0.1, 0.3, 0.65);  // gold window lintel
        const sidePane = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 1.85, 1.6),
          new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.24, roughness: 0.08, depthWrite: false })
        );
        sidePane.position.set(cx, yb + 2.06, 0.1);
        group.add(sidePane);
      }
    });

    // Multi-tier Crystal Chandeliers (brass rings + crystal octahedrons + candle bulbs)
    [-5.0, 0.5, 5.5].forEach((lx) => {
      addCylinder(group, 0.03, 0.03, 0.42, '#eab308', lx, yb + MANSION_FLOOR_H - 0.38, -0.35, 0.25, 0.8, 8);
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.04, 8, 18),
        new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.78, roughness: 0.22 })
      );
      ring1.rotation.x = Math.PI / 2;
      ring1.position.set(lx, yb + MANSION_FLOOR_H - 0.68, -0.35);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 1),
        new THREE.MeshBasicMaterial({ color: '#fef9c3' })
      );
      crystal.position.set(lx, yb + MANSION_FLOOR_H - 0.78, -0.35);
      group.add(ring1, crystal);
    });

    [-5.5, 5.0].forEach((lx) => {
      const pl = new THREE.PointLight(fl === 2 ? '#fde68a' : '#fff7ed', 4.6, 16, 1.0);
      pl.position.set(lx, yb + MANSION_FLOOR_H - 0.9, 1.85);
      group.add(pl);
      lights.push(pl);
    });
  }

  // Grand European Hip Roof + Center Domed Rotunda Crest + Chimneys (replaces blocky triangle!)
  addBox(group, 26.0, 0.36, 6.2, '#7f1d1d', 0, 12.76, -0.05, 0.5);
  addBox(group, 26.2, 0.14, 6.3, '#eab308', 0, 12.56, -0.05, 0.25, 0.72);
  addBox(group, 22.0, 1.25, 4.6, '#5c1414', 0, 13.5, -0.2, 0.65);
  addBox(group, 16.0, 1.1, 3.2, '#450a0a', 0, 14.4, -0.2, 0.65);
  const centralDome = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: '#ca8a04', metalness: 0.65, roughness: 0.25 })
  );
  centralDome.position.set(0, 14.8, -0.2);
  group.add(centralDome);
  addCylinder(group, 0.06, 0.18, 1.1, '#fde047', 0, 17.0, -0.2, 0.2, 0.85, 10);

  // --- DOORS TO ENTERABLE LUXURY ROOMS ON EACH FLOOR! ---
  const makeMansionDoor = (x: number, floor: FloorIndex, label: string) => {
    const yb = floor * MANSION_FLOOR_H;
    addBox(group, 1.62, 2.52, 0.16, '#ca8a04', x, yb + 1.28, -2.35, 0.3, 0.65);
    const doorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.38, 2.34),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture(label, false), roughness: 0.6 })
    );
    doorMesh.position.set(x, yb + 1.24, -2.25);
    group.add(doorMesh);
  };
  makeMansionDoor(2.8, 0, 'ห้องรับรองเสี่ย');
  makeMansionDoor(1.5, 1, 'ห้องนิรภัยชั้น 2');
  makeMansionDoor(8.5, 2, 'ห้องทำงานเสี่ย');

  // Staircases with brass handrails (Floor 1 -> 2 at +8.5, Floor 2 -> 3 at -8.5)
  for (let s = 0; s < 7; s++) {
    addBox(group, 0.62, 0.22, 1.5, '#92400e', 7.3 + s * 0.45, 0.12 + s * 0.56, -1.55, 0.45);
    addCylinder(group, 0.035, 0.035, 0.78, '#eab308', 7.3 + s * 0.45, 0.6 + s * 0.56, -0.85, 0.25, 0.75, 8);
    addBox(group, 0.62, 0.22, 1.5, '#92400e', -7.2 - s * 0.45, MANSION_FLOOR_H + 0.12 + s * 0.56, -1.55, 0.45);
    addCylinder(group, 0.035, 0.035, 0.78, '#eab308', -7.2 - s * 0.45, MANSION_FLOOR_H + 0.6 + s * 0.56, -0.85, 0.25, 0.75, 8);
  }

  // --- HIDING SPOTS (Round Fluted Roman Columns, Topiary Bushes, Velvet Drapes) ---
  const hidingSpots: MansionHidingSpot[] = [
    { x: -10.2, floor: 0, label: 'พุ่มไม้ตัดแต่งหน้าคฤหาสน์' },
    { x: -1.8, floor: 0, label: 'เสาโรมันหินอ่อนชั้น 1' },
    { x: 5.5, floor: 0, label: 'เสาโรมันมุมบันได' },
    { x: -4.2, floor: 1, label: 'เสาโรมันแกลเลอรีชั้น 2' },
    { x: 4.5, floor: 1, label: 'ม่านกำมะหยี่ชั้น 2' },
    { x: -3.2, floor: 2, label: 'ตู้หนังสือหรูชั้น 3' },
    { x: 5.8, floor: 2, label: 'ม่านห้องทำงานชั้น 3' },
  ];
  hidingSpots.forEach((hs) => {
    const yb = hs.floor * MANSION_FLOOR_H;
    if (hs.label.includes('พุ่มไม้')) {
      addCylinder(group, 0.28, 0.22, 0.42, '#9a3412', hs.x, yb + 0.21, 1.15, 0.65);
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.68, 12, 10),
        new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 })
      );
      bush.position.set(hs.x, yb + 0.82, 1.15);
      group.add(bush);
    } else if (hs.label.includes('ม่าน')) {
      addCylinder(group, 0.45, 0.52, 3.4, '#7f1d1d', hs.x, yb + 1.7, 1.05, 0.85, 0, 12);
      addCylinder(group, 0.54, 0.48, 0.18, '#eab308', hs.x, yb + 3.45, 1.05, 0.25, 0.7, 12);
    } else if (hs.label.includes('ตู้หนังสือ')) {
      addBox(group, 1.4, 2.75, 0.58, '#451a03', hs.x, yb + 1.38, 1.05, 0.7);
    } else {
      // Round Roman fluted marble column with gold base & Corinthian capital!
      addCylinder(group, 0.34, 0.38, 3.75, '#f8fafc', hs.x, yb + 1.9, 1.08, 0.28, 0.12, 16);
      addCylinder(group, 0.48, 0.52, 0.22, '#eab308', hs.x, yb + 0.14, 1.08, 0.25, 0.75, 16);
      addCylinder(group, 0.54, 0.36, 0.28, '#eab308', hs.x, yb + 3.8, 1.08, 0.25, 0.75, 16);
    }
  });

  // --- 3) ENTERABLE LUXURY INTERIOR ROOMS (ตกแต่งหรูหรา มีมิติลึกทุกห้อง!) ---
  const tileTex = createThaiTileFloorTexture();
  const buildSubRoom = (accentCol: string, wallCol: string, wainscotCol: string, evId: 'ev1' | 'ev2' | 'ev3', evCol: string) => {
    const rg = new THREE.Group();
    rg.visible = false;
    // Main back wall, recessed Louis wainscoting panels, gold moulding & ceiling cornice
    addBox(rg, 13.0, 4.2, 0.25, wallCol, 0, 2.1, -1.65, 0.62);
    addBox(rg, 13.0, 0.95, 0.08, wainscotCol, 0, 0.52, -1.5, 0.55);
    addBox(rg, 13.0, 0.1, 0.14, '#ca8a04', 0, 1.04, -1.48, 0.28, 0.72);
    addBox(rg, 13.0, 0.14, 0.22, '#ca8a04', 0, 4.08, -1.48, 0.28, 0.72);
    for (let px = -5.0; px <= 5.0; px += 2.5) {
      addBox(rg, 1.85, 0.65, 0.1, wallCol, px, 0.52, -1.47, 0.6);
    }
    // Polished marble floor & side walls
    addBox(rg, 13.0, 0.2, 4.4, '#f8fafc', 0, -0.05, 0.4, 0.28);
    const flPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(12.8, 4.2),
      new THREE.MeshStandardMaterial({ map: tileTex, color: '#fffbeb', roughness: 0.32 })
    );
    flPlane.rotation.x = -Math.PI / 2;
    flPlane.position.set(0, 0.06, 0.4);
    rg.add(flPlane);
    addBox(rg, 0.3, 4.2, 4.4, wallCol, -6.35, 2.1, 0.4, 0.68);
    addBox(rg, 0.3, 4.2, 4.4, wallCol, 6.35, 2.1, 0.4, 0.68);
    // Flanking interior fluted Roman columns with gold bases & capitals
    [-5.8, 5.8].forEach((cx) => {
      addCylinder(rg, 0.24, 0.28, 3.9, '#f8fafc', cx, 2.0, -1.25, 0.28, 0.12, 14);
      addCylinder(rg, 0.34, 0.38, 0.2, '#eab308', cx, 0.15, -1.25, 0.25, 0.75, 14);
      addCylinder(rg, 0.38, 0.26, 0.22, '#eab308', cx, 3.95, -1.25, 0.25, 0.75, 14);
    });
    // Tall arched night French windows with gold arch rings & draped velvet curtains
    [-2.4, 1.6].forEach((wx) => {
      addBox(rg, 1.42, 2.0, 0.08, '#ca8a04', wx, 2.25, -1.49, 0.3, 0.65);
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.66, 0.08, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.68, roughness: 0.25 })
      );
      arch.position.set(wx, 3.22, -1.46);
      rg.add(arch);
      const pane = new THREE.Mesh(
        new THREE.BoxGeometry(1.24, 1.84, 0.05),
        new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.5 })
      );
      pane.position.set(wx, 2.25, -1.45);
      rg.add(pane);
      addBox(rg, 0.05, 1.84, 0.07, '#f8fafc', wx, 2.25, -1.41, 0.4);
      addBox(rg, 1.24, 0.05, 0.07, '#f8fafc', wx, 2.4, -1.41, 0.4);
      [-0.72, 0.72].forEach((dcx) => {
        addCylinder(rg, 0.14, 0.2, 2.25, accentCol, wx + dcx, 2.25, -1.36, 0.85, 0, 10);
      });
    });
    // Exit door back to mansion hallway (left at x = -4.6) with gold arch frame
    addBox(rg, 1.56, 2.48, 0.12, '#ca8a04', -4.6, 1.25, -1.5, 0.3, 0.65);
    const exitDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 2.3),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ออกโถงคฤหาสน์', false), roughness: 0.6 })
    );
    exitDoor.position.set(-4.6, 1.2, -1.42);
    rg.add(exitDoor);
    // Multi-tier crystal chandelier + wall sconces + Persian carpet with gold border!
    [-1.4, 2.0].forEach((lx) => {
      addCylinder(rg, 0.03, 0.03, 0.38, '#eab308', lx, 3.92, 0.1, 0.25, 0.8, 8);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.04, 8, 18),
        new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.78, roughness: 0.22 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(lx, 3.68, 0.1);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 1),
        new THREE.MeshBasicMaterial({ color: '#fef9c3' })
      );
      crystal.position.set(lx, 3.55, 0.1);
      rg.add(ring, crystal);
    });
    addBox(rg, 7.6, 0.03, 2.4, '#ca8a04', 0.4, 0.07, 0.25, 0.65);
    addBox(rg, 7.2, 0.035, 2.0, accentCol, 0.4, 0.075, 0.25, 0.88);
    // Evidence table & glowing collectible folder inside room (x = +2.6)
    addBox(rg, 2.25, 0.82, 0.98, '#451a03', 2.6, 0.41, -0.78, 0.52);
    addBox(rg, 2.34, 0.08, 1.05, '#ca8a04', 2.6, 0.84, -0.78, 0.28, 0.68);
    const evMesh = addBox(rg, 0.52, 0.15, 0.36, evCol, 2.6, 0.96, -0.78, 0.3);
    const evLight = new THREE.PointLight('#fde047', 3.0, 7.5, 1.0);
    evLight.position.set(2.6, 1.5, -0.2);
    const roomLight = new THREE.PointLight('#fff7ed', 5.0, 18, 0.85);
    roomLight.position.set(0, 3.5, 1.6);
    rg.add(evLight, roomLight);
    lights.push(roomLight);
    return { rg, evId, evMesh, evLight };
  };

  // Floor 1 Reception Room: Marble Fireplace with warm embers, Tufted Louis Sofa, Round Coffee Table & Trophy Showcase!
  const r1 = buildSubRoom('#7f1d1d', '#f8f3e8', '#e7decb', 'ev1', '#ef4444');
  // Marble fireplace at center-left (x = -0.4, z = -1.25)
  addBox(r1.rg, 1.9, 1.45, 0.55, '#f1f5f9', -0.4, 0.72, -1.28, 0.35);
  addBox(r1.rg, 2.1, 0.14, 0.68, '#ca8a04', -0.4, 1.48, -1.26, 0.25, 0.7);
  addBox(r1.rg, 1.1, 0.75, 0.32, '#18181b', -0.4, 0.4, -1.16, 0.9);
  const fireGlow = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
  fireGlow.position.set(-0.4, 0.32, -1.1);
  r1.rg.add(fireGlow);
  // Tufted sofa, round marble coffee table & gold tea service
  addBox(r1.rg, 2.5, 0.72, 0.95, '#7f1d1d', -2.6, 0.4, -0.75, 0.65);
  addBox(r1.rg, 2.5, 0.55, 0.22, '#991b1b', -2.6, 0.88, -1.12, 0.65);
  [-3.3, -1.9].forEach((px) => addBox(r1.rg, 0.38, 0.32, 0.16, '#eab308', px, 0.78, -0.9, 0.5));
  addCylinder(r1.rg, 0.56, 0.56, 0.08, '#f1f5f9', -2.6, 0.46, 0.42, 0.25, 0.15, 16);
  addCylinder(r1.rg, 0.12, 0.12, 0.42, '#ca8a04', -2.6, 0.22, 0.42, 0.25, 0.75, 12);
  // Illuminated glass liquor/trophy display cabinet at right (x = +4.6)
  addBox(r1.rg, 1.4, 2.4, 0.62, '#451a03', 4.6, 1.2, -1.22, 0.5);
  addBox(r1.rg, 1.15, 1.75, 0.1, '#fef3c7', 4.6, 1.38, -0.95, 0.2);

  // Floor 2 Gallery Room: Curved Black Grand Piano + Bench, Gold-Framed Oil Paintings with Picture Lights & Jewel Display!
  const r2 = buildSubRoom('#1e3a8a', '#f3ead5', '#e2d2b5', 'ev2', '#38bdf8');
  // Grand Piano (curved tail body, angled open lid, keyboard & stool) at x = -1.6
  addBox(r2.rg, 1.95, 0.26, 1.35, '#09090b', -1.6, 0.88, -0.75, 0.12, 0.45);
  addCylinder(r2.rg, 0.68, 0.68, 0.26, '#09090b', -0.9, 0.88, -0.95, 0.12, 0.45, 14);
  [-2.35, -0.85, -1.1].forEach((px, pi) => addCylinder(r2.rg, 0.055, 0.04, 0.82, '#09090b', px, 0.41, pi === 2 ? -1.25 : -0.35, 0.2, 0.2, 8));
  addBox(r2.rg, 1.65, 0.1, 0.34, '#f8fafc', -1.7, 0.76, -0.05, 0.3); // keys
  addBox(r2.rg, 0.9, 0.45, 0.42, '#451a03', -1.7, 0.24, 0.55, 0.5);   // piano bench
  // Gold-framed oil paintings with picture lamps + illuminated crystal gem pedestal (x = +4.6)
  [-0.4, 4.4].forEach((gx, gi) => {
    addBox(r2.rg, 1.75, 1.28, 0.08, '#ca8a04', gx, 2.35, -1.48, 0.28, 0.72);
    addBox(r2.rg, 1.42, 0.98, 0.1, gi === 0 ? '#7f1d1d' : '#1e3a8a', gx, 2.35, -1.46, 0.55);
    addBox(r2.rg, 0.7, 0.06, 0.18, '#fde047', gx, 3.08, -1.38, 0.2); // picture lamp
  });
  addCylinder(r2.rg, 0.38, 0.42, 0.95, '#f8fafc', 4.6, 0.48, -0.75, 0.28, 0.15, 14);
  const gemCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.55, 0.65),
    new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.28, roughness: 0.08, depthWrite: false })
  );
  gemCase.position.set(4.6, 1.22, -0.75);
  r2.rg.add(gemCase);

  // Floor 3 Executive Office: Mahogany Bookcase with Colorful Books, Grandfather Clock, Steel Vault Safe & Executive Chair!
  const r3 = buildSubRoom('#78350f', '#362218', '#4d2f20', 'ev3', '#facc15');
  // Grand Mahogany Bookcase with colorful hardcover books (x = -1.6)
  addBox(r3.rg, 2.4, 2.95, 0.6, '#451a03', -1.6, 1.48, -1.22, 0.65);
  [0.7, 1.4, 2.1].forEach((by, bi) => {
    addBox(r3.rg, 2.2, 0.08, 0.5, '#78350f', -1.6, by, -1.15, 0.55);
    ['#dc2626', '#2563eb', '#eab308', '#15803d', '#9333ea'].forEach((bc, ci) => {
      addBox(r3.rg, 0.16, 0.38, 0.32, bc, -2.45 + ci * 0.42 + (bi % 2) * 0.08, by + 0.22, -1.08, 0.7);
    });
  });
  // Antique Grandfather Clock (x = +0.2) & Heavy Steel Vault Safe (x = +4.6)
  addBox(r3.rg, 0.62, 2.35, 0.48, '#451a03', 0.2, 1.18, -1.25, 0.5);
  addCylinder(r3.rg, 0.2, 0.2, 0.06, '#fef08a', 0.2, 1.95, -1.0, 0.3, 0.4, 14);
  addBox(r3.rg, 1.3, 1.5, 0.88, '#334155', 4.6, 0.75, -1.12, 0.35, 0.65);
  addCylinder(r3.rg, 0.18, 0.18, 0.08, '#eab308', 4.6, 0.85, -0.66, 0.25, 0.85, 14);
  // Executive leather high-back chair & green banker lamp on Sia's desk (+2.6)
  addBox(r3.rg, 0.85, 1.35, 0.58, '#18181b', 2.6, 0.88, -1.35, 0.55);
  addBox(r3.rg, 0.34, 0.42, 0.24, '#15803d', 1.85, 1.05, -0.78, 0.3);

  const interiorRooms: Record<MansionSubRoomId, THREE.Group> = {
    sia_study_1: r1.rg,
    sia_gallery_2: r2.rg,
    sia_office_3: r3.rg,
  };
  const evidenceMeshes = [
    { id: r1.evId, mesh: r1.evMesh, light: r1.evLight },
    { id: r2.evId, mesh: r2.evMesh, light: r2.evLight },
    { id: r3.evId, mesh: r3.evMesh, light: r3.evLight },
  ];

  // --- 4) PATROLLING BODYGUARDS WITH VISION CONES ON FLOORS 1, 2, 3 ---
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

  return { group, interiorRooms, guards, hidingSpots, evidenceMeshes, lights };
}
