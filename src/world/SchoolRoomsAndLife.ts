import * as THREE from 'three';
import { Ch3CharKind, createSchoolSignTexture } from '../art/Chapter3Sprites';
import { Ch3RoomId } from '../data/chapter3Data';
import {
  createLightConeTexture,
  createThaiDoorTexture,
  createThaiRoadTexture,
  createThaiTileFloorTexture,
  createThaiWallTexture,
  createThaiWindowTexture,
} from '../art/TextureFactory';
import { FloorIndex } from '../types';
import { buildRealisticCar, buildRealisticMotorcycle, buildRealisticSchoolBus } from './VehicleModels';

export const CH3_FLOOR_H = 4.2;

function setSpriteFacing(mesh: THREE.Mesh, facing: 1 | -1): void {
  const uv = mesh.geometry.attributes.uv as THREE.BufferAttribute;
  if (facing === 1) {
    uv.setXY(0, 0, 1);
    uv.setXY(1, 1, 1);
    uv.setXY(2, 0, 0);
    uv.setXY(3, 1, 0);
  } else {
    uv.setXY(0, 1, 1);
    uv.setXY(1, 0, 1);
    uv.setXY(2, 1, 0);
    uv.setXY(3, 0, 0);
  }
  uv.needsUpdate = true;
}

export interface SchoolLifeRefs {
  flagMesh: THREE.Mesh;
  busGroup: THREE.Group;
  busPhaseTimer: number;
  busStopped: boolean;
  busReturning: boolean;
  dropStudents: { mesh: THREE.Mesh; x: number; active: boolean; kind: 'student_boy' | 'student_girl' }[];
  vehicles: { group: THREE.Group; speed: number; dir: 1 | -1 }[];
  students: {
    mesh: THREE.Mesh;
    kind: 'student_boy' | 'student_girl';
    x: number;
    z: number;
    speed: number;
    minX: number;
    maxX: number;
    dir: 1 | -1;
  }[];
  cafeteriaEaters: THREE.Mesh[];
  bballPlayers: { mesh: THREE.Mesh; baseX: number; phase: number; facing: 1 | -1 }[];
  basketballMesh: THREE.Mesh;
  flagCeremonyMeshes: THREE.Mesh[];
  classRoomStudentMeshes: THREE.Mesh[];
  classTeacherMesh: THREE.Mesh;
  wilaiDayMesh: THREE.Mesh;
  somchaiOfficeMesh: THREE.Mesh;
  janitorMesh: THREE.Mesh;
  kongGangMeshes: THREE.Mesh[];
  coopVendorMesh: THREE.Mesh;
  momHomeMesh: THREE.Mesh;
  parkedBikeGroup: THREE.Group;
  shrineIncenseParticles: THREE.Mesh[];
  mirrorGhostMesh: THREE.Mesh;
  chadaCrownAltarMesh: THREE.Group;
}

function createBackboardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 160);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 144);
  ctx.lineWidth = 8;
  ctx.strokeRect(86, 72, 84, 62);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildSchoolRooms(
  scene: THREE.Scene,
  roomGroups: Partial<Record<Ch3RoomId, THREE.Group>>,
  charFrames: Record<Ch3CharKind, THREE.CanvasTexture[]>,
  shadowTex: THREE.CanvasTexture,
  addBox: (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    col: string,
    x: number,
    y: number,
    z: number,
    rough?: number
  ) => THREE.Mesh
): {
  classRoomStudentMeshes: THREE.Mesh[];
  classTeacherMesh: THREE.Mesh;
  wilaiDayMesh: THREE.Mesh;
  somchaiOfficeMesh: THREE.Mesh;
  mirrorGhostMesh: THREE.Mesh;
  chadaCrownAltarMesh: THREE.Group;
} {
  const wallTex = createThaiWallTexture(false);
  const darkWall = createThaiWallTexture(true);
  const tileTex = createThaiTileFloorTexture();
  const winLit = createThaiWindowTexture(true);

  const makeNpc = (parent: THREE.Object3D, kind: Ch3CharKind, x: number, y: number, z: number, facing: 1 | -1 = 1) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 2.02),
      new THREE.MeshStandardMaterial({
        map: charFrames[kind][0],
        transparent: true,
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.85,
      })
    );
    m.position.set(x, y + 0.96, z);
    m.receiveShadow = false;
    setSpriteFacing(m, facing);
    parent.add(m);
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.42),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.45, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(x, y + 0.025, z);
    parent.add(sh);
    return m;
  };

  const makeShell = (room: Ch3RoomId, w: number, wall: THREE.CanvasTexture, floorCol: string, lightCol: string, intensity: number) => {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    roomGroups[room] = g;

    const fl = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.3, 5.2),
      new THREE.MeshStandardMaterial({ map: tileTex, color: floorCol, roughness: 0.7 })
    );
    fl.position.set(0, -0.15, 0.2);
    fl.receiveShadow = true;
    g.add(fl);

    const bw = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 4.3),
      new THREE.MeshStandardMaterial({ map: wall, roughness: 0.9 })
    );
    bw.position.set(0, 2.15, -1.65);
    g.add(bw);

    addBox(g, 0.3, 4.3, 5.2, '#1e293b', -w / 2, 2.15, 0.2);
    addBox(g, 0.3, 4.3, 5.2, '#1e293b', w / 2, 2.15, 0.2);
    addBox(g, w, 0.25, 5.2, '#0f172a', 0, 4.35, 0.2);

    const pt = new THREE.PointLight(lightCol, intensity, 22, 1.0);
    pt.position.set(0, 3.65, 1.75);
    g.add(pt);
    const pt2 = new THREE.PointLight(lightCol, intensity * 0.65, 18, 1.1);
    pt2.position.set(w * 0.3, 3.65, 1.75);
    g.add(pt2);

    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 2.25),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ทางออก', false), roughness: 0.8 })
    );
    door.position.set(-w / 2 + 1.15, 1.15, -1.62);
    g.add(door);
    return g;
  };

  // 1) PROTAGONIST HOME
  const house = makeShell('protagonist_house', 13.6, wallTex, '#fde68a', '#ffdda1', 3.4);
  const hWin = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.45), new THREE.MeshBasicMaterial({ map: winLit }));
  hWin.position.set(-2.0, 2.25, -1.61);
  house.add(hWin);
  addBox(house, 1.8, 0.65, 0.7, '#78350f', -2.8, 0.32, -1.18);
  addBox(house, 1.1, 0.65, 0.14, '#0f172a', -2.8, 1.02, -1.24);
  addBox(house, 1.65, 0.78, 0.75, '#92400e', 1.4, 0.39, -1.12);
  addBox(house, 0.52, 0.36, 0.06, '#38bdf8', 1.4, 0.96, -1.22);
  addBox(house, 2.5, 0.55, 1.5, '#1e40af', 4.3, 0.28, -0.75);
  addBox(house, 2.5, 0.14, 1.5, '#f1f5f9', 4.3, 0.6, -0.75);
  addBox(house, 0.72, 0.18, 0.45, '#fde047', 4.9, 0.74, -0.75);
  // Mom stands cleanly on open living-room floor beside TV console so her full legs & shoes are completely visible!
  makeNpc(house, 'mom_ch3', -1.2, 0, -0.15, -1);

  // 2) CLASSROOM M.5/2
  const cls = makeShell('classroom_2b', 15.2, wallTex, '#e2e8f0', '#fff7e6', 3.6);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.65),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ม.5/2 • คาบนาฏศิลป์ & ประวัติไทย', 'ห้ามขึ้นชั้น 3 หลัง 18:00 น.', '#14532d', '#064e3b', '#b45309') })
  );
  board.position.set(0.4, 2.35, -1.61);
  cls.add(board);
  addBox(cls, 1.35, 0.88, 0.68, '#78350f', -3.5, 0.44, -1.05);
  const classRoomStudentMeshes: THREE.Mesh[] = [];
  [-1.2, 1.2, 3.6, 5.4].forEach((dx, idx) => {
    addBox(cls, 1.2, 0.68, 0.6, '#a16207', dx, 0.34, -0.98);
    addBox(cls, 0.52, 0.4, 0.45, '#78350f', dx, 0.2, -0.48);
    classRoomStudentMeshes.push(makeNpc(cls, idx % 2 === 0 ? 'student_girl' : 'student_boy', dx + 0.55, 0, -0.22, -1));
  });
  const classTeacherMesh = makeNpc(cls, 'teacher_somchai', -2.3, 0, -0.25, 1);

  // 3) TEACHER OFFICE
  const tOff = makeShell('teacher_office', 14.4, wallTex, '#cbd5e1', '#f0f9ff', 3.4);
  const tSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.15),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ห้องพักครูหมวดศิลปะ', 'ครูสมชาย & ครูวิไลวรรณ', '#1e3a8a', '#172554', '#facc15') })
  );
  tSign.position.set(0, 2.75, -1.61);
  tOff.add(tSign);
  addBox(tOff, 1.9, 0.78, 0.75, '#92400e', -2.6, 0.39, -1.12);
  addBox(tOff, 1.9, 0.78, 0.75, '#78350f', 1.8, 0.39, -1.12);
  addBox(tOff, 1.25, 1.75, 0.85, '#334155', 4.6, 0.88, -1.05, 0.45);
  addBox(tOff, 0.26, 0.26, 0.08, '#facc15', 4.6, 1.15, -0.6, 0.3);
  const somchaiOfficeMesh = makeNpc(tOff, 'teacher_somchai', -1.8, 0, -0.2, 1);
  const wilaiDayMesh = makeNpc(tOff, 'teacher_wilai', 1.2, 0, -0.2, -1);

  // 4) LIBRARY
  const lib = makeShell('library_room', 14.4, wallTex, '#d6d3d1', '#fef3c7', 3.1);
  [-3.2, 0.2, 3.6].forEach((bx) => {
    addBox(lib, 2.4, 3.0, 0.65, '#451a03', bx, 1.5, -1.25);
    [0.8, 1.5, 2.2].forEach((sy) => addBox(lib, 2.2, 0.22, 0.68, '#b45309', bx, sy, -1.23));
  });
  addBox(lib, 2.2, 0.72, 0.95, '#78350f', -0.4, 0.36, -0.15);
  addBox(lib, 0.45, 0.32, 0.45, '#15803d', -0.4, 0.88, -0.15);

  // 5) HAUNTED THAI MUSIC ROOM
  const mr = makeShell('music_room', 16.4, darkWall, '#451a03', '#ffb380', 2.4);
  // Narrow theater wing curtains strictly clear of the Music Room exit door (-7.05)!
  addBox(mr, 0.72, 4.1, 0.6, '#7f1d1d', -7.85, 2.05, -1.35);
  addBox(mr, 1.6, 4.1, 0.6, '#7f1d1d', 7.2, 2.05, -1.35);
  addBox(mr, 16.2, 0.55, 0.55, '#991b1b', 0, 3.9, -1.25);
  addBox(mr, 8.8, 0.34, 2.8, '#5c2c16', 2.6, 0.17, -0.45, 0.45);
  addBox(mr, 1.6, 1.05, 0.85, '#92400e', 5.4, 0.86, -0.95);
  addBox(mr, 1.4, 0.18, 0.7, '#eab308', 5.4, 1.45, -0.95);
  const chadaCrownAltarMesh = new THREE.Group();
  chadaCrownAltarMesh.position.set(5.4, 1.85, -0.95);
  const chadaCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.68, 12),
    new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.75, roughness: 0.2 })
  );
  chadaCrownAltarMesh.add(chadaCone);
  chadaCrownAltarMesh.visible = false;
  mr.add(chadaCrownAltarMesh);

  addBox(mr, 1.9, 0.62, 0.55, '#78350f', 1.8, 0.65, -0.35);
  addBox(mr, 1.82, 0.14, 0.46, '#fde68a', 1.8, 1.0, -0.35);
  const khongRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.12, 10, 20),
    new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.4 })
  );
  khongRing.rotation.x = Math.PI / 2;
  khongRing.position.set(-0.8, 0.62, -0.25);
  mr.add(khongRing);

  addBox(mr, 2.3, 2.85, 0.16, '#eab308', 3.6, 1.85, -1.52, 0.35);
  const mirrorSurf = new THREE.Mesh(
    new THREE.PlaneGeometry(2.05, 2.6),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.08, metalness: 0.85 })
  );
  mirrorSurf.position.set(3.6, 1.85, -1.42);
  mr.add(mirrorSurf);
  const mirrorGhostMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.95),
    new THREE.MeshBasicMaterial({ map: charFrames.dancer_ghost[0], transparent: true, opacity: 0 })
  );
  mirrorGhostMesh.position.set(3.6, 1.65, -1.38);
  mr.add(mirrorGhostMesh);

  const stageSpotlight = new THREE.SpotLight('#ff5252', 6.5, 14, Math.PI / 4, 0.6, 1.2);
  stageSpotlight.position.set(3.2, 4.1, 1.8);
  mr.add(stageSpotlight);

  return {
    classRoomStudentMeshes,
    classTeacherMesh,
    wilaiDayMesh,
    somchaiOfficeMesh,
    mirrorGhostMesh,
    chadaCrownAltarMesh,
  };
}

export function buildCampusGroundProps(
  exteriorGroup: THREE.Group,
  charFrames: Record<Ch3CharKind, THREE.CanvasTexture[]>,
  shadowTex: THREE.CanvasTexture,
  addBox: (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    col: string,
    x: number,
    y: number,
    z: number,
    rough?: number
  ) => THREE.Mesh
): Omit<
  SchoolLifeRefs,
  'classRoomStudentMeshes' | 'classTeacherMesh' | 'wilaiDayMesh' | 'somchaiOfficeMesh' | 'mirrorGhostMesh' | 'chadaCrownAltarMesh'
> {
  const makeNpc = (kind: Ch3CharKind, x: number, y: FloorIndex | number, z: number, facing: 1 | -1 = 1) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 2.02),
      new THREE.MeshStandardMaterial({
        map: charFrames[kind][0],
        transparent: true,
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.85,
      })
    );
    m.position.set(x, y + 0.96, z);
    m.receiveShadow = false;
    setSpriteFacing(m, facing);
    exteriorGroup.add(m);
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.42),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.45, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(x, y + 0.025, z);
    exteriorGroup.add(sh);
    return m;
  };

  // Rich 2.5D Two-Story Home of Protagonist Peem (-110) with Pitched Tiled Roof, Front Porch, Windows & Balcony!
  addBox(exteriorGroup, 10.6, 4.9, 2.8, '#fef3c7', -110, 2.45, -2.1, 0.82);
  addBox(exteriorGroup, 11.2, 0.18, 3.4, '#e2e8f0', -110, 4.92, -1.95, 0.6); // concrete eave molding
  // Two-tier sloped Thai terracotta roof instead of flat rectangular box!
  const roofPitchF = addBox(exteriorGroup, 11.4, 0.22, 2.4, '#9a3412', -110, 5.42, -1.05, 0.55);
  roofPitchF.rotation.x = 0.42;
  const roofPitchB = addBox(exteriorGroup, 11.4, 0.22, 2.4, '#7c2d12', -110, 5.42, -2.85, 0.6);
  roofPitchB.rotation.x = -0.42;
  addBox(exteriorGroup, 11.5, 0.2, 0.3, '#c2410c', -110, 5.95, -1.95, 0.45); // ridge cap
  // Protruding Front Porch Canopy, Pillars, Concrete Steps & Recessed Carved Entrance Door
  addBox(exteriorGroup, 3.6, 0.14, 1.35, '#cbd5e1', -110, 0.07, -0.35, 0.65);
  addBox(exteriorGroup, 3.8, 0.24, 1.5, '#7c2d12', -110, 2.68, -0.35, 0.6);
  [-111.65, -108.35].forEach((px) => addBox(exteriorGroup, 0.18, 2.55, 0.18, '#f8fafc', px, 1.35, 0.25, 0.55));
  const homeDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32, 2.24),
    new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('บ้านภีม', false), roughness: 0.72 })
  );
  homeDoor.position.set(-110, 1.24, -0.68);
  exteriorGroup.add(homeDoor);
  // Warm 1st-floor transparent living room glass window + 2nd-floor balcony railing & glowing upstairs windows!
  const houseGlassMat = new THREE.MeshStandardMaterial({
    color: '#bae6fd',
    transparent: true,
    opacity: 0.28,
    roughness: 0.08,
    depthWrite: false,
  });
  [-113.4, -106.6].forEach((wx) => {
    addBox(exteriorGroup, 1.85, 1.25, 0.12, '#0f172a', wx, 1.52, -0.68, 0.35);
    addBox(exteriorGroup, 1.65, 1.05, 0.04, '#fde68a', wx, 1.52, -0.72, 0.4); // warm living room glow behind glass
    const wg = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.08, 0.03), houseGlassMat);
    wg.position.set(wx, 1.52, -0.64);
    exteriorGroup.add(wg);
    addBox(exteriorGroup, 1.85, 1.25, 0.1, '#fef08a', wx, 3.85, -0.68, 0.35);
    addBox(exteriorGroup, 2.0, 0.12, 0.22, '#9a3412', wx, 3.2, -0.64, 0.6);
  });
  addBox(exteriorGroup, 6.2, 0.55, 0.14, '#e2e8f0', -110, 3.05, -0.15, 0.7); // 2nd-floor front balcony parapet
  // Front garden brick fence wings & bougainvillea bush flanking porch
  [-113.8, -106.2].forEach((fx) => {
    addBox(exteriorGroup, 2.8, 0.75, 0.22, '#cbd5e1', fx, 0.38, 0.25, 0.8);
    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 7), new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 }));
    shrub.position.set(fx, 0.92, 0.25);
    exteriorGroup.add(shrub);
  });
  const homeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.76),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('บ้านของภีม', 'ซอยจันทรารัตน์ 5', '#0f766e', '#115e59', '#fde68a') })
  );
  homeSign.position.set(-110, 2.74, 0.44);
  exteriorGroup.add(homeSign);
  const homeLight = new THREE.PointLight('#fde68a', 5.2, 16, 1.05);
  homeLight.position.set(-110, 3.2, 1.65);
  exteriorGroup.add(homeLight);
  const momHomeMesh = makeNpc('mom_ch3', -107.6, 0, -0.05, -1);

  // Sleek Diamond Road Bicycle parked outside Peem's house (-104.5)
  const parkedBikeGroup = new THREE.Group();
  parkedBikeGroup.position.set(-104.5, 0, -0.35);
  [-0.5, 0.5].forEach((wx) => {
    const wh = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 16), new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.7 }));
    wh.position.set(wx, 0.3, 0);
    parkedBikeGroup.add(wh);
  });
  addBox(parkedBikeGroup, 0.62, 0.055, 0.05, '#0284c7', -0.05, 0.7, 0);
  addBox(parkedBikeGroup, 0.56, 0.055, 0.05, '#0284c7', 0.14, 0.52, 0).rotation.z = 0.68;
  addBox(parkedBikeGroup, 0.5, 0.055, 0.05, '#cbd5e1', 0.36, 0.62, 0).rotation.z = -0.35;
  addBox(parkedBikeGroup, 0.12, 0.05, 0.4, '#cbd5e1', 0.34, 0.9, 0);
  addBox(parkedBikeGroup, 0.22, 0.07, 0.13, '#111827', -0.22, 0.8, 0);
  exteriorGroup.add(parkedBikeGroup);

  // Iconic Thai "ชายสี่หมี่เกี๊ยว" Street Noodle Cart just outside School Entrance (-61.0)!
  const bamiGrp = new THREE.Group();
  bamiGrp.position.set(-61.0, 0, -1.65);
  // Signature Yellow & Red Stall Cart + Wheels + Glass Roast-Pork Display + Soup Pot
  addBox(bamiGrp, 2.5, 0.95, 1.15, '#facc15', 0, 0.72, 0, 0.45);
  addBox(bamiGrp, 2.54, 0.32, 1.18, '#dc2626', 0, 0.42, 0, 0.55);
  [-0.85, 0.85].forEach((wx) => {
    const wh = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 8, 14), new THREE.MeshStandardMaterial({ color: '#111827' }));
    wh.position.set(wx, 0.26, 0.58);
    bamiGrp.add(wh);
  });
  // Stainless 4-corner canopy posts + glowing yellow-red Chay Si Bami Kiew lightbox canopy!
  [-1.18, 1.18].forEach((px) => addBox(bamiGrp, 0.08, 1.65, 0.08, '#cbd5e1', px, 1.98, 0.52, 0.3));
  addBox(bamiGrp, 2.75, 0.65, 1.38, '#dc2626', 0, 2.75, 0, 0.45);
  const bamiSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.65, 0.68),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ชายสี่หมี่เกี๊ยว', 'บะหมี่เกี๊ยวหมูแดง • ปู • 35 ฿', '#facc15', '#ca8a04', '#dc2626') })
  );
  bamiSign.position.set(0, 2.72, 0.71);
  bamiGrp.add(bamiSign);
  // Crystal-clear transparent glass showcase cabinet showing hanging red BBQ pork, egg noodles & greens + soup pot!
  const bamiCaseGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.72, 0.65),
    new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.24, roughness: 0.08, depthWrite: false })
  );
  bamiCaseGlass.position.set(-0.58, 1.55, 0.08);
  bamiGrp.add(bamiCaseGlass);
  addBox(bamiGrp, 1.15, 0.04, 0.68, '#cbd5e1', -0.58, 1.92, 0.08, 0.25); // stainless top trim
  [-0.78, -0.58, -0.38].forEach((px) => addBox(bamiGrp, 0.11, 0.36, 0.14, '#b91c1c', px, 1.65, 0.08, 0.4));
  addBox(bamiGrp, 0.22, 0.14, 0.2, '#facc15', -0.68, 1.28, 0.1, 0.5); // yellow egg noodles
  addBox(bamiGrp, 0.22, 0.12, 0.2, '#22c55e', -0.4, 1.27, 0.1, 0.55); // fresh choy sum
  const soupPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.24, 0.38, 12),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.7, roughness: 0.25 })
  );
  soupPot.position.set(0.55, 1.38, 0.08);
  const bamiBulb = new THREE.PointLight('#fde047', 5.6, 13, 1.0);
  bamiBulb.position.set(0, 2.25, 1.55);
  bamiGrp.add(soupPot, bamiBulb);
  // Plastic red stools & folding condiment table beside the cart
  addBox(bamiGrp, 1.3, 0.06, 0.75, '#f8fafc', 2.2, 0.72, 0.1, 0.5);
  [1.75, 2.65].forEach((sx) => addBox(bamiGrp, 0.36, 0.45, 0.36, '#ef4444', sx, 0.22, 0.15, 0.6));
  exteriorGroup.add(bamiGrp);
  makeNpc('vendor_coop', -61.0, 0.12, -2.55, 1);

  // Iconic 3D Straddling Thai School Entrance Archway (x = -52, z = -2.35 .. +2.65) matching Image #2 cleanly with ONE single flush sign!
  [-2.35, 2.65].forEach((gz) => {
    addBox(exteriorGroup, 1.05, 0.42, 1.05, '#e2e8f0', -52, 0.21, gz, 0.75); // stone plinth base
    addBox(exteriorGroup, 0.84, 4.35, 0.84, '#7f1d1d', -52, 2.38, gz, 0.7);  // crimson pillar
    addBox(exteriorGroup, 1.04, 0.26, 1.04, '#eab308', -52, 4.66, gz, 0.35); // gold pillar capital
  });
  // Overhead Thai crimson arch beam & tiled roof ridge straddling road entrance
  addBox(exteriorGroup, 1.15, 0.92, 6.2, '#450a0a', -52, 5.22, 0.15, 0.65);
  addBox(exteriorGroup, 1.35, 0.24, 6.45, '#b91c1c', -52, 5.78, 0.15, 0.55);
  addBox(exteriorGroup, 0.98, 0.44, 4.2, '#991b1b', -52, 6.08, 0.15, 0.55);
  const gateSpire = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.88, 4),
    new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.6, roughness: 0.25 })
  );
  gateSpire.rotation.y = Math.PI / 4;
  gateSpire.position.set(-52, 6.72, 0.15);
  exteriorGroup.add(gateSpire);

  // ONE single flush School Sign on the West face of the straddling archway beam (NO duplicate overhanging sign!)
  const archTex = createSchoolSignTexture('โรงเรียนมัธยมจันทรารัตน์', 'วิชา จริยา นาฏศิลป์สยาม', '#7f1d1d', '#450a0a', '#facc15');
  const archSignWest = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.88), new THREE.MeshBasicMaterial({ map: archTex }));
  archSignWest.rotation.y = -Math.PI / 2;
  archSignWest.position.set(-52.6, 5.22, 0.15);
  exteriorGroup.add(archSignWest);
  const archLight = new THREE.PointLight('#fde68a', 5.8, 16, 1.0);
  archLight.position.set(-52.4, 4.4, 1.55);
  exteriorGroup.add(archLight);

  // Detailed School Guard Booth (ป้อมยามโรงเรียน -45.5) with recessed see-through sliding glass, inner guard light & counter!
  addBox(exteriorGroup, 2.9, 2.75, 0.2, '#f1f5f9', -45.5, 1.38, -2.25, 0.8); // interior back wall
  addBox(exteriorGroup, 2.9, 1.12, 1.85, '#f1f5f9', -45.5, 0.56, -1.35, 0.8); // lower wall
  addBox(exteriorGroup, 0.55, 2.75, 1.85, '#f1f5f9', -46.65, 1.38, -1.35, 0.8);
  addBox(exteriorGroup, 0.55, 2.75, 1.85, '#f1f5f9', -44.35, 1.38, -1.35, 0.8);
  addBox(exteriorGroup, 2.9, 0.65, 1.85, '#f1f5f9', -45.5, 2.42, -1.35, 0.8); // header
  addBox(exteriorGroup, 2.94, 0.72, 2.04, '#1e3a8a', -45.5, 0.36, -1.35, 0.65); // navy base skirt
  addBox(exteriorGroup, 3.35, 0.26, 2.45, '#1e3a8a', -45.5, 2.86, -1.32, 0.55); // sloped eaves roof
  addBox(exteriorGroup, 3.4, 0.1, 2.5, '#facc15', -45.5, 2.72, -1.32, 0.45);
  addBox(exteriorGroup, 1.5, 0.72, 0.45, '#78350f', -45.25, 1.25, -1.15); // interior desk visible through glass!
  const inGuardLight = new THREE.PointLight('#fef08a', 2.6, 5.5, 1.1);
  inGuardLight.position.set(-45.25, 2.1, -1.25);
  exteriorGroup.add(inGuardLight);
  // Transparent sliding glass guard window (z = -0.34), frame, inner glowing guard room & counter ledge
  addBox(exteriorGroup, 1.72, 1.08, 0.08, '#0f172a', -45.25, 1.68, -0.35, 0.35);
  const boothGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.9, 0.04),
    new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.24, roughness: 0.08, depthWrite: false })
  );
  boothGlass.position.set(-45.25, 1.68, -0.32);
  exteriorGroup.add(boothGlass);
  addBox(exteriorGroup, 0.06, 0.9, 0.08, '#334155', -45.25, 1.68, -0.29, 0.35); // middle sliding mullion
  addBox(exteriorGroup, 1.88, 0.1, 0.34, '#cbd5e1', -45.25, 1.12, -0.22, 0.5); // outer ledge shelf
  const boothDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 2.05),
    new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ประตูยาม', false), roughness: 0.75 })
  );
  boothDoor.position.set(-46.45, 1.05, -0.33);
  const boothSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.42),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ป้อมยามรักษาการณ์', 'ลุงมั่น เวร 24 ชม.', '#1e3a8a', '#0f172a', '#fde047') })
  );
  boothSign.position.set(-45.25, 2.44, -0.31);
  exteriorGroup.add(boothDoor, boothSign);
  const guardLight = new THREE.PointLight('#fef08a', 4.4, 12, 1.05);
  guardLight.position.set(-45.25, 2.15, 1.55);
  exteriorGroup.add(guardLight);
  const janitorMesh = makeNpc('janitor_man', -44.0, 0, -0.15, -1);

  const kongGangMeshes = [
    makeNpc('kong_bully', -38.5, 0, -0.15, -1),
    makeNpc('student_boy', -36.9, 0, -0.35, -1),
  ];

  // Central Flagpole & Fluttering Multi-Segment Thai Flag visible in camera view (-26)
  addBox(exteriorGroup, 3.3, 0.32, 3.3, '#e2e8f0', -26, 0.16, -1.1, 0.75);
  addBox(exteriorGroup, 2.2, 0.32, 2.2, '#cbd5e1', -26, 0.48, -1.1, 0.7);
  addBox(exteriorGroup, 1.5, 0.26, 2.26, '#1e3a8a', -26, 0.44, -1.08, 0.45);
  const poleCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.09, 6.2, 10),
    new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.35, roughness: 0.35 })
  );
  poleCyl.position.set(-26, 3.65, -1.1);
  poleCyl.castShadow = true;
  const poleFinial = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.75, roughness: 0.25 })
  );
  poleFinial.position.set(-26, 6.82, -1.1);
  exteriorGroup.add(poleCyl, poleFinial);

  const fc = document.createElement('canvas');
  fc.width = 256;
  fc.height = 160;
  const fCtx = fc.getContext('2d')!;
  fCtx.fillStyle = '#dc2626';
  fCtx.fillRect(0, 0, 256, 27);
  fCtx.fillRect(0, 133, 256, 27);
  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(0, 27, 256, 27);
  fCtx.fillRect(0, 106, 256, 27);
  fCtx.fillStyle = '#1e3a8a';
  fCtx.fillRect(0, 54, 256, 52);
  const fTex = new THREE.CanvasTexture(fc);
  fTex.colorSpace = THREE.SRGBColorSpace;
  const flagMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 1.45, 16, 4),
    new THREE.MeshStandardMaterial({ map: fTex, side: THREE.DoubleSide, roughness: 0.65 })
  );
  flagMesh.castShadow = true;
  flagMesh.position.set(-24.8, 5.55, -1.1);
  exteriorGroup.add(flagMesh);
  const flagCeremonyMeshes = [-31, -28.8, -23.5, -21.2].map((sx, idx) =>
    makeNpc(idx % 2 === 0 ? 'student_girl' : 'student_boy', sx, 0, -0.3, 1)
  );

  // ================= RICH MULTI-BAY SCHOOL CAFETERIA (+42 .. +58, center +50) =================
  addBox(exteriorGroup, 16.5, 0.18, 5.2, '#475569', 50, 0.09, -0.2); // tiled canteen terrace
  addBox(exteriorGroup, 17.2, 0.45, 5.6, '#ea580c', 50, 3.85, -0.3, 0.6); // orange canteen roof
  addBox(exteriorGroup, 16.8, 0.35, 0.4, '#facc15', 50, 3.55, 2.45, 0.5);
  [42.2, 47.5, 52.8, 57.8].forEach((px) => {
    addBox(exteriorGroup, 0.22, 3.8, 0.22, '#f8fafc', px, 1.9, 2.3);
    addBox(exteriorGroup, 0.22, 3.8, 0.22, '#f8fafc', px, 1.9, -2.5);
  });
  // Food stalls + Transparent Glass Curry/Noodle Showcases + Glass Drink Chiller + Coop Vendors!
  addBox(exteriorGroup, 15.2, 1.1, 0.9, '#fef9c3', 50, 0.55, -2.1);
  const coopGlass = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 0.62, 0.04),
    new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.24, roughness: 0.08, depthWrite: false })
  );
  coopGlass.position.set(49.2, 1.42, -1.65);
  exteriorGroup.add(coopGlass);
  // Visible thai curry trays & stainless noodle pots inside glass canteen counter!
  [44.4, 45.8, 51.0, 52.2].forEach((px, pi) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.7, roughness: 0.25 })
    );
    pot.position.set(px, 1.25, -2.0);
    exteriorGroup.add(pot);
    addBox(exteriorGroup, 0.42, 0.08, 0.32, ['#65a30d', '#ea580c', '#facc15', '#b91c1c'][pi], px + 0.55, 1.14, -1.96, 0.3);
  });
  // Transparent glass beverage fridge on right wing (+55.8) inside canteen
  addBox(exteriorGroup, 1.4, 2.25, 0.65, '#e2e8f0', 55.8, 1.12, -2.15, 0.3);
  addBox(exteriorGroup, 1.2, 1.8, 0.04, '#bae6fd', 55.8, 1.18, -1.85);
  [55.4, 55.8, 56.2].forEach((dx, di) => {
    addBox(exteriorGroup, 0.16, 0.34, 0.16, ['#38bdf8', '#22c55e', '#ef4444'][di], dx, 1.48, -1.78, 0.3);
    addBox(exteriorGroup, 0.16, 0.32, 0.16, '#f59e0b', dx, 0.92, -1.78, 0.3);
  });
  const coopSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.1),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('โรงอาหาร & สหกรณ์โรงเรียน', 'ก๋วยเตี๋ยว • ข้าวแกง • น้ำปั่น • ถ่านไฟฉาย', '#b45309', '#78350f', '#fef08a') })
  );
  coopSign.position.set(50, 3.25, 2.68);
  exteriorGroup.add(coopSign);
  const coopLight = new THREE.PointLight('#fde68a', 6.8, 20, 0.95);
  coopLight.position.set(50, 3.3, 1.65);
  exteriorGroup.add(coopLight);

  // Canteen wooden dining tables & benches with seated eating students & food plates!
  const cafeteriaEaters: THREE.Mesh[] = [];
  [45.5, 50.0, 54.5].forEach((tx, idx) => {
    addBox(exteriorGroup, 0.1, 0.72, 0.72, '#334155', tx - 1.05, 0.36, 0.05);
    addBox(exteriorGroup, 0.1, 0.72, 0.72, '#334155', tx + 1.05, 0.36, 0.05);
    addBox(exteriorGroup, 2.55, 0.08, 0.78, '#b45309', tx, 0.72, 0.05);
    addBox(exteriorGroup, 2.55, 0.08, 0.36, '#78350f', tx, 0.44, -0.46);
    addBox(exteriorGroup, 2.55, 0.08, 0.36, '#78350f', tx, 0.44, 0.56);
    // White rice plates & red-soda cups cleanly resting ON tabletop
    [-0.55, 0.55].forEach((ox) => {
      addBox(exteriorGroup, 0.34, 0.04, 0.34, '#f8fafc', tx + ox, 0.78, 0.05, 0.3);
      addBox(exteriorGroup, 0.1, 0.16, 0.1, '#ef4444', tx + ox + 0.24, 0.84, 0.02, 0.25);
    });
    // Sit students cleanly ON the back bench so shoulders & chest sit well above tabletop (no clipping!)
    cafeteriaEaters.push(makeNpc(idx % 2 === 0 ? 'student_girl' : 'student_boy', tx - 0.55, 0.14, -0.44, 1));
    cafeteriaEaters.push(makeNpc(idx % 2 === 0 ? 'student_boy' : 'student_girl', tx + 0.55, 0.14, -0.44, -1));
  });
  const coopVendorMesh = makeNpc('vendor_coop', 48.2, 0.12, -2.75, 1);
  makeNpc('vendor_coop', 51.8, 0.12, -2.75, -1);

  // ================= OUTDOOR TILED SCHOOL RESTROOM BUILDING (+62 .. +72, center +67) =================
  addBox(exteriorGroup, 10.2, 3.4, 2.8, '#e0f2fe', 67, 1.7, -1.65, 0.65);
  addBox(exteriorGroup, 10.8, 0.45, 3.4, '#0369a1', 67, 3.55, -1.65, 0.5);
  addBox(exteriorGroup, 10.2, 0.9, 2.82, '#0284c7', 67, 0.45, -1.64, 0.5); // blue tile wainscot
  const restSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.0),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ห้องน้ำนักเรียน (นอกอาคาร)', 'ชาย ♂  |  หญิง ♀  (เข้าหลบภัยได้)', '#0369a1', '#0c4a6e', '#bae6fd') })
  );
  restSign.position.set(67, 2.85, -0.2);
  exteriorGroup.add(restSign);
  // Two tiled entrance baffle doors + outer washing sinks & mirrors
  const bathDoorL = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 2.15),
    new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ชาย', false) })
  );
  bathDoorL.position.set(64.2, 1.08, -0.21);
  const bathDoorR = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 2.15),
    new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('หญิง', false) })
  );
  bathDoorR.position.set(69.8, 1.08, -0.21);
  exteriorGroup.add(bathDoorL, bathDoorR);
  // Handwashing sink counter + ceramic basins + chrome faucets + mirror between doors
  addBox(exteriorGroup, 2.4, 0.82, 0.55, '#f8fafc', 67.0, 0.41, 0.05, 0.35);
  [-0.58, 0.58].forEach((sx) => {
    addBox(exteriorGroup, 0.52, 0.06, 0.36, '#94a3b8', 67.0 + sx, 0.84, 0.06, 0.2);
    addBox(exteriorGroup, 0.06, 0.16, 0.08, '#475569', 67.0 + sx, 0.92, -0.1, 0.25);
  });
  addBox(exteriorGroup, 2.1, 0.72, 0.06, '#bae6fd', 67.0, 1.55, -0.2, 0.15);
  addBox(exteriorGroup, 2.2, 0.8, 0.04, '#475569', 67.0, 1.55, -0.22, 0.4);
  const restLight = new THREE.PointLight('#bae6fd', 4.6, 15, 1.05);
  restLight.position.set(67, 2.9, 1.65);
  exteriorGroup.add(restLight);

  // ================= FULL STANDARD BASKETBALL COURT WITH BOTH HOOPS & PLAYERS (+77 .. +99, center +88) =================
  addBox(exteriorGroup, 21.6, 0.04, 6.4, '#15803d', 88, 0.03, 0.45, 0.85);
  // Painted maroon keys & crisp white court lines
  addBox(exteriorGroup, 3.2, 0.046, 2.6, '#991b1b', 79.4, 0.035, 0.45);
  addBox(exteriorGroup, 3.2, 0.046, 2.6, '#991b1b', 96.6, 0.035, 0.45);
  addBox(exteriorGroup, 21.2, 0.05, 0.1, '#f8fafc', 88, 0.04, 3.5);
  addBox(exteriorGroup, 21.2, 0.05, 0.1, '#f8fafc', 88, 0.04, -2.55);
  addBox(exteriorGroup, 0.1, 0.05, 6.1, '#f8fafc', 77.4, 0.04, 0.45); // endlines
  addBox(exteriorGroup, 0.1, 0.05, 6.1, '#f8fafc', 98.6, 0.04, 0.45);
  addBox(exteriorGroup, 0.08, 0.05, 6.1, '#f8fafc', 88, 0.04, 0.45);  // halfcourt line
  const centerCircle = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.18, 28),
    new THREE.MeshBasicMaterial({ color: '#f8fafc', side: THREE.DoubleSide })
  );
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.set(88, 0.055, 0.45);
  exteriorGroup.add(centerCircle);

  // Semicircle 3-point arcs at both ends
  [
    { x: 78.6, start: -Math.PI / 2, len: Math.PI },
    { x: 97.4, start: Math.PI / 2, len: Math.PI },
  ].forEach((arcDef) => {
    const arcMesh = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 2.46, 24, 1, arcDef.start, arcDef.len),
      new THREE.MeshBasicMaterial({ color: '#f8fafc', side: THREE.DoubleSide })
    );
    arcMesh.rotation.x = -Math.PI / 2;
    arcMesh.position.set(arcDef.x, 0.055, 0.25);
    exteriorGroup.add(arcMesh);
  });

  // Both Left (+78.0) and Right (+98.0) Standard Basketball Hoops (Backboard + Red Shooter Box + Rim + Net!)
  const bbTex = createBackboardTexture();
  [
    { x: 78.0, dir: 1 as const },
    { x: 98.0, dir: -1 as const },
  ].forEach((hp) => {
    // Stanchion base pole & angled arm reaching onto the court
    addBox(exteriorGroup, 0.22, 4.1, 0.22, '#334155', hp.x - hp.dir * 0.65, 2.05, 0.2);
    addBox(exteriorGroup, 0.95, 0.16, 0.16, '#334155', hp.x - hp.dir * 0.22, 3.75, 0.2);

    // Oriented Backboard facing court center (rotated Y ±PI/2 so it reads crisp in 2.5D perspective!)
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.25, 1.85),
      new THREE.MeshStandardMaterial({ map: bbTex, roughness: 0.35 })
    );
    board.position.set(hp.x + hp.dir * 0.25, 3.65, 0.2);
    exteriorGroup.add(board);

    // Red shooter target frame visible on both side faces cleanly
    addBox(exteriorGroup, 0.12, 0.48, 0.68, '#dc2626', hp.x + hp.dir * 0.26, 3.45, 0.2);

    // Bright Orange Iron Rim + White Hanging Mesh Net!
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.038, 10, 18),
      new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.35 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(hp.x + hp.dir * 0.58, 3.12, 0.2);
    exteriorGroup.add(rim);

    const net = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.14, 0.46, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: '#f1f5f9', wireframe: true })
    );
    net.position.set(hp.x + hp.dir * 0.58, 2.88, 0.2);
    exteriorGroup.add(net);
  });

  const courtLight = new THREE.PointLight('#fffbeb', 8.5, 26, 0.9);
  courtLight.position.set(88, 5.8, 1.5);
  exteriorGroup.add(courtLight);

  // 4 Animated Students playing Basketball + Bouncing/Arcing 3D Orange Basketball!
  const bballPlayers: SchoolLifeRefs['bballPlayers'] = [
    { mesh: makeNpc('student_boy', 83.5, 0, -0.35, 1), baseX: 83.5, phase: 0, facing: 1 },
    { mesh: makeNpc('student_boy', 86.8, 0, 0.65, 1), baseX: 86.8, phase: 1.5, facing: 1 },
    { mesh: makeNpc('student_girl', 90.2, 0, -0.25, -1), baseX: 90.2, phase: 3.1, facing: -1 },
    { mesh: makeNpc('student_boy', 93.4, 0, 0.55, -1), baseX: 93.4, phase: 4.5, facing: -1 },
  ];
  const bbCanv = document.createElement('canvas');
  bbCanv.width = 64;
  bbCanv.height = 64;
  const bbCtx = bbCanv.getContext('2d')!;
  bbCtx.fillStyle = '#ea580c';
  bbCtx.fillRect(0, 0, 64, 64);
  bbCtx.strokeStyle = '#1f2937';
  bbCtx.lineWidth = 4;
  bbCtx.beginPath();
  bbCtx.moveTo(0, 32);
  bbCtx.lineTo(64, 32);
  bbCtx.moveTo(32, 0);
  bbCtx.lineTo(32, 64);
  bbCtx.stroke();
  const bbBallTex = new THREE.CanvasTexture(bbCanv);
  bbBallTex.colorSpace = THREE.SRGBColorSpace;
  const basketballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({ map: bbBallTex, roughness: 0.45 })
  );
  basketballMesh.position.set(88, 1.2, 0.25);
  exteriorGroup.add(basketballMesh);

  // Giant Bodhi Tree with 7-Color Cloth + Traditional Thai Spirit Shrine (ศาลตายายทรงไทย +112.2)
  const bodhiTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.92, 5.0, 10),
    new THREE.MeshStandardMaterial({ color: '#452817', roughness: 0.9 })
  );
  bodhiTrunk.position.set(115.2, 2.5, -1.9);
  exteriorGroup.add(bodhiTrunk);
  // 7-colored Thai sacred satin sashes tied around Bodhi trunk
  ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'].forEach((sc, si) => {
    const sash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.7, 0.11, 10),
      new THREE.MeshStandardMaterial({ color: sc, roughness: 0.4 })
    );
    sash.position.set(115.2, 1.55 + si * 0.12, -1.9);
    exteriorGroup.add(sash);
  });
  [
    { x: 115.2, y: 5.7, z: -1.9, r: 3.1, c: '#166534' },
    { x: 113.2, y: 5.2, z: -1.4, r: 2.3, c: '#15803d' },
    { x: 117.1, y: 5.1, z: -1.5, r: 2.2, c: '#15803d' },
    { x: 114.6, y: 6.8, z: -2.1, r: 2.4, c: '#14532d' },
  ].forEach((lf) => {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(lf.r, 12, 10), new THREE.MeshStandardMaterial({ color: lf.c, roughness: 0.85 }));
    crown.position.set(lf.x, lf.y, lf.z);
    exteriorGroup.add(crown);
  });

  // Traditional Thai Spirit House (ศาลตายาย) on stepped plinth & central pillar at +112.2
  const shrineGrp = new THREE.Group();
  shrineGrp.position.set(112.2, 0, -0.75);
  // Tiered stone pedestal & central carved pillar
  addBox(shrineGrp, 2.1, 0.18, 1.5, '#cbd5e1', 0, 0.09, 0, 0.75);
  addBox(shrineGrp, 1.75, 0.18, 1.25, '#e2e8f0', 0, 0.27, 0, 0.7);
  addBox(shrineGrp, 0.46, 0.78, 0.46, '#b45309', 0, 0.75, 0, 0.6);
  addBox(shrineGrp, 1.85, 0.12, 1.35, '#92400e', 0, 1.18, 0, 0.55); // veranda deck
  // Teak shrine house body, gold sanctum doorway & 4 corner columns
  addBox(shrineGrp, 1.22, 0.92, 0.92, '#7c2d12', 0, 1.7, -0.1, 0.6);
  addBox(shrineGrp, 0.68, 0.66, 0.12, '#fde047', 0, 1.66, 0.32, 0.3); // golden sanctum glow
  [-0.55, 0.55].forEach((px) => addBox(shrineGrp, 0.08, 0.96, 0.08, '#facc15', px, 1.68, 0.42, 0.35));
  // Tiered Thai gable roof + golden chofah spires
  const roofLower = new THREE.Mesh(
    new THREE.ConeGeometry(1.18, 0.52, 4),
    new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.45 })
  );
  roofLower.rotation.y = Math.PI / 4;
  roofLower.position.set(0, 2.4, -0.05);
  shrineGrp.add(roofLower);
  const roofUpper = new THREE.Mesh(
    new THREE.ConeGeometry(0.76, 0.55, 4),
    new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 })
  );
  roofUpper.rotation.y = Math.PI / 4;
  roofUpper.position.set(0, 2.74, -0.05);
  shrineGrp.add(roofUpper);
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.42, 6),
    new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.5, roughness: 0.25 })
  );
  spire.position.set(0, 3.12, -0.05);
  shrineGrp.add(spire);
  // Offerings on veranda: Brass incense pot, marigold garlands & 2 red Fanta bottles
  addBox(shrineGrp, 0.22, 0.18, 0.22, '#f59e0b', 0, 1.32, 0.48, 0.35);
  addBox(shrineGrp, 0.08, 0.22, 0.08, '#ef4444', -0.45, 1.34, 0.48, 0.25);
  addBox(shrineGrp, 0.08, 0.22, 0.08, '#ef4444', 0.45, 1.34, 0.48, 0.25);
  [-0.58, 0, 0.58].forEach((gx) => addBox(shrineGrp, 0.18, 0.26, 0.1, '#facc15', gx, 2.02, 0.54, 0.45));
  exteriorGroup.add(shrineGrp);

  const shrineLight = new THREE.PointLight('#fbbf24', 5.6, 16, 1.0);
  shrineLight.position.set(112.6, 2.75, 1.65);
  exteriorGroup.add(shrineLight);
  const shrineIncenseParticles: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const sm = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#f1f5f9', transparent: true, opacity: 0.38 })
    );
    sm.position.set(112.2, 1.48 + i * 0.32, -0.25);
    exteriorGroup.add(sm);
    shrineIncenseParticles.push(sm);
  }

  // Lots of Lively Roaming Daytime Students (10 walkers across town, gate, yard, cafeteria, restrooms!)
  const studentSpawns: { kind: 'student_boy' | 'student_girl'; x: number; z: number; s: number; min: number; max: number; dir: 1 | -1 }[] = [
    { kind: 'student_girl', x: -72, z: 0.35, s: 1.5, min: -102, max: -54, dir: 1 },
    { kind: 'student_boy', x: -58, z: 0.55, s: 1.65, min: -92, max: -46, dir: 1 },
    { kind: 'student_girl', x: -42, z: 0.3, s: 1.5, min: -49, max: 12, dir: 1 },
    { kind: 'student_boy', x: -24, z: 0.45, s: 1.75, min: -46, max: 28, dir: -1 },
    { kind: 'student_girl', x: -8, z: 0.25, s: 1.45, min: -35, max: 38, dir: 1 },
    { kind: 'student_boy', x: 16, z: 0.4, s: 1.6, min: -14, max: 52, dir: -1 },
    { kind: 'student_girl', x: 38, z: 0.3, s: 1.55, min: 14, max: 72, dir: 1 },
    { kind: 'student_boy', x: 64, z: 0.5, s: 1.7, min: 40, max: 84, dir: -1 },
    { kind: 'student_girl', x: 78, z: 0.35, s: 1.4, min: 52, max: 102, dir: 1 },
    { kind: 'student_boy', x: 28, z: 0.2, s: 1.5, min: -10, max: 60, dir: 1 },
  ];
  const students: SchoolLifeRefs['students'] = studentSpawns.map((d) => ({
    mesh: makeNpc(d.kind, d.x, 0, d.z, d.dir),
    kind: d.kind,
    x: d.x,
    z: d.z,
    speed: d.s,
    minX: d.min,
    maxX: d.max,
    dir: d.dir,
  }));

  // Detailed Realistic Yellow School Bus that drives in & DROPS OFF STUDENTS at the gate (-56.5)!
  const busGroup = buildRealisticSchoolBus();
  busGroup.position.set(-108, 0, 3.25);
  exteriorGroup.add(busGroup);

  const dropStudents: SchoolLifeRefs['dropStudents'] = [
    { mesh: makeNpc('student_girl', -56, 0, 1.2, 1), x: -56, active: false, kind: 'student_girl' },
    { mesh: makeNpc('student_boy', -57, 0, 1.4, 1), x: -57, active: false, kind: 'student_boy' },
  ];
  dropStudents.forEach((ds) => (ds.mesh.visible = false));

  // Passing Town Traffic (-124 .. -56)
  const coneTex = createLightConeTexture('255, 226, 160');
  const courtyardCone = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 5.5),
    new THREE.MeshBasicMaterial({ map: coneTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.24 })
  );
  courtyardCone.position.set(-26, 4.8, -0.5);
  exteriorGroup.add(courtyardCone);
  void createThaiRoadTexture;

  const vehicles: SchoolLifeRefs['vehicles'] = [];
  const townCar = buildRealisticCar({ bodyColor: '#dc2626', roofColor: '#e2e8f0', variant: 'sedan', facing: -1 }).group;
  townCar.scale.multiplyScalar(0.86);
  townCar.position.set(-68, 0, 4.1);
  exteriorGroup.add(townCar);
  vehicles.push({ group: townCar, speed: 8.6, dir: -1 });

  const townBike = buildRealisticMotorcycle({
    bodyColor: '#2563eb',
    withRider: true,
    riderJacket: '#0f172a',
    facing: 1,
  }).group;
  townBike.position.set(-96, 0, 3.15);
  exteriorGroup.add(townBike);
  vehicles.push({ group: townBike, speed: 7.2, dir: 1 });

  return {
    flagMesh,
    busGroup,
    busPhaseTimer: 0,
    busStopped: false,
    busReturning: false,
    dropStudents,
    vehicles,
    students,
    cafeteriaEaters,
    bballPlayers,
    basketballMesh,
    flagCeremonyMeshes,
    janitorMesh,
    kongGangMeshes,
    coopVendorMesh,
    momHomeMesh,
    parkedBikeGroup,
    shrineIncenseParticles,
  };
}

export function animateSchoolLife(
  refs: SchoolLifeRefs,
  charFrames: Record<Ch3CharKind, THREE.CanvasTexture[]>,
  clock: number,
  dt: number,
  hour: number,
  isInside: boolean
): void {
  const schoolHours = hour >= 6.8 && hour < 16.5;
  const assemblyHours = hour >= 7.2 && hour <= 8.6;
  const inNight = hour >= 19.0 || hour < 5.5;

  // Smooth vertex-wave cloth animation for the Thai National Flag in breeze!
  const posAttr = refs.flagMesh.geometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const lx = posAttr.getX(i);
    const pin = Math.max(0, (lx + 1.175) / 2.35);
    const waveZ = Math.sin(pin * 4.8 - clock * 6.8) * pin * 0.24;
    const waveY = Math.cos(pin * 3.2 - clock * 5.2) * pin * 0.08;
    posAttr.setZ(i, waveZ);
    posAttr.setY(i, ((i / 17) | 0) * (-1.45 / 4) + 0.725 + waveY);
  }
  posAttr.needsUpdate = true;
  refs.flagMesh.geometry.computeVertexNormals();

  refs.shrineIncenseParticles.forEach((p, idx) => {
    const c = (clock * 0.5 + idx * 0.16) % 1;
    p.position.y = 1.65 + c * 1.9;
    p.position.x = 112.2 + Math.sin(clock * 2.2 + idx) * 0.18;
    (p.material as THREE.MeshBasicMaterial).opacity = (1 - c) * 0.4;
  });

  refs.flagCeremonyMeshes.forEach((m, idx) => {
    m.visible = assemblyHours;
    if (assemblyHours) (m.material as THREE.MeshStandardMaterial).map = charFrames[idx % 2 === 0 ? 'student_girl' : 'student_boy'][Math.floor(clock * 1.5) % 2];
  });
  refs.kongGangMeshes.forEach((m, idx) => {
    m.visible = hour >= 7.0 && hour < 19.2;
    (m.material as THREE.MeshStandardMaterial).map = charFrames[idx === 0 ? 'kong_bully' : 'student_boy'][Math.floor(clock * 1.6) % 2];
  });
  refs.coopVendorMesh.visible = hour >= 6.5 && hour < 17.5;
  refs.cafeteriaEaters.forEach((m, idx) => {
    m.visible = schoolHours;
    if (schoolHours) (m.material as THREE.MeshStandardMaterial).map = charFrames[idx % 2 === 0 ? 'student_girl' : 'student_boy'][0];
  });
  refs.classTeacherMesh.visible = schoolHours;
  refs.classRoomStudentMeshes.forEach((m) => (m.visible = schoolHours));
  refs.wilaiDayMesh.visible = schoolHours || hour < 18.2;
  refs.somchaiOfficeMesh.visible = schoolHours || hour < 18.0;
  refs.janitorMesh.visible = !inNight || hour >= 20.0;

  if (!isInside) {
    // Natural Pickup Basketball Game: Dribble down court -> Jump Shot release -> True Parabolic Arc -> Net Swish & Rebound!
    const bballActive = schoolHours || hour < 18.5;
    refs.basketballMesh.visible = bballActive;
    if (bballActive) {
      const cycle = clock % 8.0;
      const goingRight = cycle < 4.0;
      const dir: 1 | -1 = goingRight ? 1 : -1;
      const p = (cycle % 4.0) / 4.0;
      const startX = goingRight ? 82.0 : 94.0;
      const shootX = goingRight ? 91.5 : 84.5;
      const rimX = goingRight ? 97.42 : 78.58;

      let ballX = shootX;
      let ballY = 0.25;
      let ballZ = 0.2;
      let shooterJump = 0;
      let defenderJump = 0;

      if (p < 0.45) {
        // Dribble advance down court toward shooting spot
        const t = p / 0.45;
        const hx = startX + (shootX - startX) * t;
        ballX = hx + dir * 0.45;
        ballY = 0.2 + Math.abs(Math.sin(t * Math.PI * 5.0)) * 0.88;
        ballZ = 0.15 + Math.sin(t * Math.PI) * 0.25;
      } else if (p < 0.56) {
        // Gather & jump shot release
        const t = (p - 0.45) / 0.11;
        shooterJump = Math.sin(t * Math.PI) * 0.58;
        defenderJump = Math.sin(t * Math.PI) * 0.42;
        ballX = shootX + dir * (0.3 + t * 0.4);
        ballY = 1.45 + t * 0.72 + shooterJump * 0.4;
        ballZ = 0.2;
      } else if (p < 0.82) {
        // High parabolic shot arc directly into hoop rim (3.12m)
        const s = (p - 0.56) / 0.26;
        const relX = shootX + dir * 0.7;
        ballX = relX + (rimX - relX) * s;
        ballY = 2.17 + (3.12 - 2.17) * s + Math.sin(s * Math.PI) * 1.85;
        ballZ = 0.2;
        refs.basketballMesh.rotation.z -= dir * dt * 11;
      } else {
        // Clean swish falling straight down through net & single natural floor bounce
        const sw = (p - 0.82) / 0.18;
        ballX = rimX - dir * sw * 0.85;
        ballY = sw < 0.55 ? 3.12 - Math.pow(sw / 0.55, 1.5) * 2.9 : 0.22 + Math.sin(((sw - 0.55) / 0.45) * Math.PI) * 0.65;
        ballZ = 0.2;
      }

      refs.basketballMesh.position.set(ballX, ballY, ballZ);
      const handlerIdx = goingRight ? 1 : 2;
      const handlerX = p < 0.45 ? startX + (shootX - startX) * (p / 0.45) : shootX;
      refs.bballPlayers.forEach((bp, idx) => {
        bp.mesh.visible = true;
        const isHandler = idx === handlerIdx;
        const isDefender = idx === (goingRight ? 2 : 1);
        const targetX = isHandler
          ? handlerX
          : isDefender
          ? handlerX + dir * (p < 0.45 ? 2.4 : 1.75)
          : idx === 0
          ? 83.2 + Math.sin(clock * 1.1 + bp.phase) * 2.2
          : 93.0 + Math.sin(clock * 1.1 + bp.phase) * 2.2;
        const jY = isHandler ? shooterJump : isDefender ? defenderJump : 0;
        const playerZ = isHandler ? 0.15 : isDefender ? 0.28 : idx === 0 ? -0.75 : 0.95;
        bp.mesh.position.set(targetX, 0.96 + jY, playerZ);
        setSpriteFacing(bp.mesh, (isHandler ? dir : isDefender ? -dir : targetX < ballX ? 1 : -1) as 1 | -1);
        const running = p < 0.45 && (isHandler || isDefender || Math.abs(Math.cos(clock * 1.1 + bp.phase)) > 0.35);
        (bp.mesh.material as THREE.MeshStandardMaterial).map = charFrames[idx === 2 ? 'student_girl' : 'student_boy'][
          running ? Math.floor(clock * 8) % 4 : 0
        ];
      });
    } else {
      refs.bballPlayers.forEach((bp) => (bp.mesh.visible = false));
    }

    // Roaming Campus Students
    refs.students.forEach((st) => {
      st.mesh.visible = schoolHours;
      if (!schoolHours) return;
      st.x += st.dir * st.speed * dt;
      if (st.x >= st.maxX) st.dir = -1;
      if (st.x <= st.minX) st.dir = 1;
      st.mesh.position.set(st.x, 0.96, st.z);
      setSpriteFacing(st.mesh, st.dir);
      (st.mesh.material as THREE.MeshStandardMaterial).map = charFrames[st.kind][Math.floor(clock * 6) % 4];
    });

    // School Bus stays strictly on town road OUTSIDE gate (stops at -59.0, drops off students walking inside, turns west back along far lane!)
    refs.busGroup.visible = hour < 18.5;
    if (refs.busGroup.visible) {
      if (refs.busStopped) {
        refs.busPhaseTimer -= dt;
        refs.dropStudents.forEach((ds) => {
          ds.mesh.visible = ds.active;
          if (ds.active) {
            ds.x += 2.2 * dt;
            ds.mesh.position.set(ds.x, 0.96, 1.05 - Math.min(1, (ds.x + 58) / 7) * 0.85);
            (ds.mesh.material as THREE.MeshStandardMaterial).map = charFrames[ds.kind][Math.floor(clock * 6) % 4];
            if (ds.x > -46) ds.active = false;
          }
        });
        if (refs.busPhaseTimer <= 0) {
          refs.busStopped = false;
          refs.busReturning = true;
          refs.busGroup.scale.x = -1;
          refs.busGroup.position.z = 0.25;
        }
      } else if (refs.busReturning) {
        refs.busGroup.position.x -= 8.4 * dt;
        if (refs.busGroup.position.x < -124) {
          refs.busReturning = false;
          refs.busGroup.scale.x = 1;
          refs.busGroup.position.z = 3.25;
        }
      } else {
        refs.busGroup.position.x = Math.min(-59.0, refs.busGroup.position.x + 8.2 * dt);
        if (refs.busGroup.position.x >= -59.2) {
          if (schoolHours) {
            refs.busStopped = true;
            refs.busPhaseTimer = 3.6;
            refs.dropStudents.forEach((ds, i) => {
              ds.active = true;
              ds.x = -58.8 - i * 1.1;
            });
          } else {
            refs.busReturning = true;
            refs.busGroup.scale.x = -1;
            refs.busGroup.position.z = 0.25;
          }
        }
      }
    }

    refs.vehicles.forEach((v) => {
      v.group.position.x += v.dir * v.speed * dt;
      if (v.dir === 1 && v.group.position.x > -55) v.group.position.x = -124;
      if (v.dir === -1 && v.group.position.x < -124) v.group.position.x = -55;
    });
  }
}
