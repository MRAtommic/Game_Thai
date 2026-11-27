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

export const CH3_FLOOR_H = 4.2;

export interface SchoolLifeRefs {
  flagMesh: THREE.Mesh;
  busGroup: THREE.Group;
  busPhaseTimer: number;
  busStopped: boolean;
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
    m.scale.x = facing;
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
    pt.position.set(0, 3.65, 0.8);
    g.add(pt);
    const pt2 = new THREE.PointLight(lightCol, intensity * 0.65, 18, 1.1);
    pt2.position.set(w * 0.3, 3.65, 0.8);
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
  addBox(house, 1.8, 0.65, 0.9, '#78350f', -2.6, 0.32, -0.65);
  addBox(house, 1.1, 0.65, 0.14, '#0f172a', -2.6, 1.02, -0.75);
  addBox(house, 1.65, 0.78, 0.85, '#92400e', 1.4, 0.39, -1.05);
  addBox(house, 0.52, 0.36, 0.06, '#38bdf8', 1.4, 0.96, -1.15);
  addBox(house, 2.5, 0.55, 1.5, '#1e40af', 4.3, 0.28, -0.75);
  addBox(house, 2.5, 0.14, 1.5, '#f1f5f9', 4.3, 0.6, -0.75);
  addBox(house, 0.72, 0.18, 0.45, '#fde047', 4.9, 0.74, -0.75);
  makeNpc(house, 'mom_ch3', -2.2, 0, -0.25, 1);

  // 2) CLASSROOM M.5/2
  const cls = makeShell('classroom_2b', 15.2, wallTex, '#e2e8f0', '#fff7e6', 3.6);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.65),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ม.5/2 • คาบนาฏศิลป์ & ประวัติไทย', 'ห้ามขึ้นชั้น 3 หลัง 18:00 น.', '#14532d', '#064e3b', '#b45309') })
  );
  board.position.set(0.4, 2.35, -1.61);
  cls.add(board);
  addBox(cls, 1.35, 0.88, 0.75, '#78350f', -3.2, 0.44, -0.85);
  const classRoomStudentMeshes: THREE.Mesh[] = [];
  [-1.2, 1.2, 3.6, 5.4].forEach((dx, idx) => {
    addBox(cls, 1.25, 0.68, 0.65, '#a16207', dx, 0.34, -0.75);
    addBox(cls, 0.55, 0.42, 0.5, '#78350f', dx, 0.21, -0.15);
    classRoomStudentMeshes.push(makeNpc(cls, idx % 2 === 0 ? 'student_girl' : 'student_boy', dx, 0, -0.2, -1));
  });
  const classTeacherMesh = makeNpc(cls, 'teacher_somchai', -3.2, 0, -0.35, 1);

  // 3) TEACHER OFFICE
  const tOff = makeShell('teacher_office', 14.4, wallTex, '#cbd5e1', '#f0f9ff', 3.4);
  const tSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.15),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ห้องพักครูหมวดศิลปะ', 'ครูสมชาย & ครูวิไลวรรณ', '#1e3a8a', '#172554', '#facc15') })
  );
  tSign.position.set(0, 2.75, -1.61);
  tOff.add(tSign);
  addBox(tOff, 1.9, 0.78, 0.9, '#92400e', -2.4, 0.39, -0.8);
  addBox(tOff, 1.9, 0.78, 0.9, '#78350f', 1.6, 0.39, -0.8);
  addBox(tOff, 1.25, 1.75, 0.85, '#334155', 4.6, 0.88, -1.05, 0.45);
  addBox(tOff, 0.26, 0.26, 0.08, '#facc15', 4.6, 1.15, -0.6, 0.3);
  const somchaiOfficeMesh = makeNpc(tOff, 'teacher_somchai', -2.2, 0, -0.2, 1);
  const wilaiDayMesh = makeNpc(tOff, 'teacher_wilai', 1.7, 0, -0.2, -1);

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
  [-7.2, 7.2].forEach((cx) => addBox(mr, 1.6, 4.1, 0.6, '#7f1d1d', cx, 2.05, -1.35));
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
    m.scale.x = facing;
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

  // Protagonist House (-110) + Parked Bicycle (-104.5)
  addBox(exteriorGroup, 10.5, 4.8, 3.0, '#fef3c7', -110, 2.4, -1.9, 0.85);
  addBox(exteriorGroup, 11.4, 1.35, 3.6, '#9a3412', -110, 5.2, -1.9, 0.7);
  addBox(exteriorGroup, 1.4, 2.3, 0.14, '#78350f', -110, 1.15, -0.35);
  const homeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.82),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('บ้านของภีม', 'ซอยจันทรารัตน์ 5', '#0f766e', '#115e59', '#fde68a') })
  );
  homeSign.position.set(-110, 3.05, -0.32);
  exteriorGroup.add(homeSign);
  const homeLight = new THREE.PointLight('#fde68a', 4.8, 16, 1.1);
  homeLight.position.set(-110, 3.2, 1.4);
  exteriorGroup.add(homeLight);
  const momHomeMesh = makeNpc('mom_ch3', -107.6, 0, -0.05, -1);

  const parkedBikeGroup = new THREE.Group();
  parkedBikeGroup.position.set(-104.5, 0, -0.35);
  [-0.45, 0.45].forEach((wx) => {
    const wh = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 16), new THREE.MeshStandardMaterial({ color: '#111827' }));
    wh.position.set(wx, 0.36, 0);
    parkedBikeGroup.add(wh);
  });
  addBox(parkedBikeGroup, 0.92, 0.08, 0.08, '#0284c7', 0, 0.62, 0);
  exteriorGroup.add(parkedBikeGroup);

  // Ornate Thai School Entrance Archway set cleanly at campus threshold z = -1.95 (never blocking walking road!)
  [-55.4, -48.6].forEach((gx) => {
    addBox(exteriorGroup, 1.15, 4.8, 1.15, '#7f1d1d', gx, 2.4, -1.95);
    addBox(exteriorGroup, 1.4, 0.28, 1.4, '#facc15', gx, 4.75, -1.95);
  });
  addBox(exteriorGroup, 8.4, 1.25, 1.3, '#450a0a', -52, 5.1, -1.95);
  const archSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 1.25),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('โรงเรียนมัธยมจันทรารัตน์', 'วิชา จริยา นาฏศิลป์สยาม', '#7f1d1d', '#450a0a', '#facc15') })
  );
  archSign.position.set(-52, 5.1, -1.26);
  exteriorGroup.add(archSign);

  addBox(exteriorGroup, 2.6, 2.6, 1.8, '#e2e8f0', -45.5, 1.3, -1.2);
  addBox(exteriorGroup, 2.9, 0.35, 2.0, '#1e3a8a', -45.5, 2.75, -1.2);
  const janitorMesh = makeNpc('janitor_man', -44.0, 0, -0.25, -1);

  const kongGangMeshes = [
    makeNpc('kong_bully', -38.5, 0, -0.15, -1),
    makeNpc('student_boy', -36.9, 0, -0.35, -1),
  ];

  // Central Flagpole & Fluttering Flag (-26)
  addBox(exteriorGroup, 3.2, 0.45, 3.2, '#cbd5e1', -26, 0.22, -1.1);
  addBox(exteriorGroup, 0.14, 11.5, 0.14, '#e2e8f0', -26, 5.75, -1.1);
  const fc = document.createElement('canvas');
  fc.width = 128;
  fc.height = 80;
  const fCtx = fc.getContext('2d')!;
  fCtx.fillStyle = '#ef4444';
  fCtx.fillRect(0, 0, 128, 13);
  fCtx.fillRect(0, 67, 128, 13);
  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(0, 13, 128, 14);
  fCtx.fillRect(0, 53, 128, 14);
  fCtx.fillStyle = '#1e3a8a';
  fCtx.fillRect(0, 27, 128, 26);
  const fTex = new THREE.CanvasTexture(fc);
  fTex.colorSpace = THREE.SRGBColorSpace;
  const flagMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 1.3),
    new THREE.MeshBasicMaterial({ map: fTex, side: THREE.DoubleSide })
  );
  flagMesh.position.set(-24.9, 10.6, -1.1);
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
  // Food stalls + Soup pots + Co-op Sign!
  addBox(exteriorGroup, 15.2, 1.1, 0.9, '#fef9c3', 50, 0.55, -2.1);
  [44.5, 45.8, 51.0, 52.2].forEach((px) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.7, roughness: 0.25 })
    );
    pot.position.set(px, 1.25, -2.0);
    exteriorGroup.add(pot);
  });
  const coopSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.1),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('โรงอาหาร & สหกรณ์โรงเรียน', 'ก๋วยเตี๋ยว • ข้าวแกง • น้ำปั่น • ถ่านไฟฉาย', '#b45309', '#78350f', '#fef08a') })
  );
  coopSign.position.set(50, 3.25, 2.68);
  exteriorGroup.add(coopSign);
  const coopLight = new THREE.PointLight('#fde68a', 6.5, 18, 1.0);
  coopLight.position.set(50, 3.3, 0.8);
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
  const coopVendorMesh = makeNpc('vendor_coop', 48.0, 0.06, -1.35, 1);

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
  const restLight = new THREE.PointLight('#bae6fd', 4.5, 14, 1.1);
  restLight.position.set(67, 2.9, 1.1);
  exteriorGroup.add(restLight);

  // ================= FULL STANDARD BASKETBALL COURT WITH BOTH HOOPS & PLAYERS (+77 .. +99, center +88) =================
  addBox(exteriorGroup, 21.6, 0.04, 6.4, '#15803d', 88, 0.03, 0.45, 0.85);
  // Painted maroon keys & crisp white court lines
  addBox(exteriorGroup, 3.2, 0.046, 2.6, '#991b1b', 79.4, 0.035, 0.45);
  addBox(exteriorGroup, 3.2, 0.046, 2.6, '#991b1b', 96.6, 0.035, 0.45);
  addBox(exteriorGroup, 21.2, 0.05, 0.1, '#f8fafc', 88, 0.04, 3.5);
  addBox(exteriorGroup, 21.2, 0.05, 0.1, '#f8fafc', 88, 0.04, -2.55);
  const centerCircle = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.18, 28),
    new THREE.MeshBasicMaterial({ color: '#f8fafc', side: THREE.DoubleSide })
  );
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.set(88, 0.055, 0.45);
  exteriorGroup.add(centerCircle);

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
  const basketballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 14),
    new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.45 })
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

  const shrineLight = new THREE.PointLight('#fbbf24', 5.5, 16, 1.0);
  shrineLight.position.set(112.6, 2.75, 0.6);
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

  // Yellow School Bus that drives in & DROPS OFF STUDENTS at the gate (-56.5)!
  const busGroup = new THREE.Group();
  addBox(busGroup, 4.4, 1.6, 1.5, '#eab308', 0, 1.05, 0, 0.35);
  addBox(busGroup, 4.2, 0.55, 1.54, '#f8fafc', 0, 1.52, 0, 0.25);
  addBox(busGroup, 0.9, 0.65, 1.56, '#1e293b', 1.65, 1.38, 0, 0.15); // front windshield
  [-1.35, 1.35].forEach((wx) => addBox(busGroup, 0.55, 0.55, 1.58, '#0f172a', wx, 0.3, 0));
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
  [{ x: -68, z: 4.1, speed: 8.6, dir: -1 as const, col: '#dc2626' }].forEach((vc) => {
    const grp = new THREE.Group();
    addBox(grp, 2.8, 0.95, 1.2, vc.col, 0, 0.72, 0, 0.4);
    addBox(grp, 1.9, 0.55, 1.08, '#f8fafc', 0, 1.38, 0, 0.3);
    [-0.95, 0.95].forEach((wx) => addBox(grp, 0.42, 0.42, 1.26, '#0f172a', wx, 0.24, 0));
    grp.position.set(vc.x, 0, vc.z);
    exteriorGroup.add(grp);
    vehicles.push({ group: grp, speed: vc.speed, dir: vc.dir });
  });

  return {
    flagMesh,
    busGroup,
    busPhaseTimer: 0,
    busStopped: false,
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

  refs.flagMesh.rotation.y = Math.sin(clock * 4.5) * 0.25;
  refs.flagMesh.position.y = 10.6 + Math.sin(clock * 3.1) * 0.06;

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
    // Active Basketball Players & Arcing Orange Basketball!
    refs.basketballMesh.visible = schoolHours || hour < 18.5;
    refs.bballPlayers.forEach((bp, idx) => {
      bp.mesh.visible = schoolHours || hour < 18.5;
      if (!bp.mesh.visible) return;
      const dx = Math.sin(clock * 2.0 + bp.phase) * 1.6;
      const jump = Math.max(0, Math.sin(clock * 3.8 + bp.phase)) * 0.45;
      bp.mesh.position.set(bp.baseX + dx, 0.96 + jump, idx % 2 === 0 ? -0.35 : 0.65);
      bp.mesh.scale.x = bp.facing;
      (bp.mesh.material as THREE.MeshStandardMaterial).map = charFrames[idx === 2 ? 'student_girl' : 'student_boy'][Math.floor(clock * 7) % 4];
    });
    if (refs.basketballMesh.visible) {
      const arc = (clock * 0.85) % 1;
      refs.basketballMesh.position.x = 79.0 + Math.abs(Math.sin(clock * 1.4)) * 18.2;
      refs.basketballMesh.position.y = 0.25 + Math.abs(Math.sin(arc * Math.PI * 2)) * 2.9;
      refs.basketballMesh.position.z = 0.2 + Math.cos(clock * 2) * 0.45;
    }

    // Roaming Campus Students
    refs.students.forEach((st) => {
      st.mesh.visible = schoolHours;
      if (!schoolHours) return;
      st.x += st.dir * st.speed * dt;
      if (st.x >= st.maxX) st.dir = -1;
      if (st.x <= st.minX) st.dir = 1;
      st.mesh.position.set(st.x, 0.96, st.z);
      st.mesh.scale.x = st.dir;
      (st.mesh.material as THREE.MeshStandardMaterial).map = charFrames[st.kind][Math.floor(clock * 6) % 4];
    });

    // School Bus driving up, pausing at Gate (-57.5) & dropping off students!
    refs.busGroup.visible = hour < 18.5;
    if (refs.busGroup.visible) {
      if (refs.busStopped) {
        refs.busPhaseTimer -= dt;
        refs.dropStudents.forEach((ds) => {
          ds.mesh.visible = ds.active;
          if (ds.active) {
            ds.x += 2.2 * dt;
            ds.mesh.position.set(ds.x, 0.96, 1.05 - Math.min(1, (ds.x + 56) / 6) * 0.7);
            (ds.mesh.material as THREE.MeshStandardMaterial).map = charFrames[ds.kind][Math.floor(clock * 6) % 4];
            if (ds.x > -46) ds.active = false;
          }
        });
        if (refs.busPhaseTimer <= 0) {
          refs.busStopped = false;
          refs.busGroup.position.x = -56.0;
        }
      } else {
        refs.busGroup.position.x += 8.2 * dt;
        if (schoolHours && refs.busGroup.position.x >= -58.0 && refs.busGroup.position.x <= -56.2) {
          refs.busStopped = true;
          refs.busPhaseTimer = 3.6;
          refs.dropStudents.forEach((ds, i) => {
            ds.active = true;
            ds.x = -57.2 - i * 1.1;
          });
        }
        if (refs.busGroup.position.x > -18) refs.busGroup.position.x = -124;
      }
    }

    refs.vehicles.forEach((v) => {
      v.group.position.x += v.dir * v.speed * dt;
      if (v.dir === 1 && v.group.position.x > -55) v.group.position.x = -124;
      if (v.dir === -1 && v.group.position.x < -124) v.group.position.x = -55;
    });
  }
}
