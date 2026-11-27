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
  vehicles: { group: THREE.Group; speed: number; dir: 1 | -1 }[];
  students: {
    mesh: THREE.Mesh;
    shadow: THREE.Mesh;
    kind: 'student_boy' | 'student_girl';
    x: number;
    z: number;
    speed: number;
    minX: number;
    maxX: number;
    dir: 1 | -1;
  }[];
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

  // 1) PROTAGONIST HOME ('protagonist_house') — Warm cozy family interior
  const house = makeShell('protagonist_house', 13.6, wallTex, '#fde68a', '#ffdda1', 3.4);
  const hWin = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.45), new THREE.MeshBasicMaterial({ map: winLit }));
  hWin.position.set(-2.0, 2.25, -1.61);
  house.add(hWin);
  // Living table + TV stand
  addBox(house, 1.8, 0.65, 0.9, '#78350f', -2.6, 0.32, -0.65);
  addBox(house, 1.1, 0.65, 0.14, '#0f172a', -2.6, 1.02, -0.75);
  // Study desk & glowing lamp + Cozy Bed on Right (+4.2)
  addBox(house, 1.65, 0.78, 0.85, '#92400e', 1.4, 0.39, -1.05);
  addBox(house, 0.52, 0.36, 0.06, '#38bdf8', 1.4, 0.96, -1.15);
  addBox(house, 2.5, 0.55, 1.5, '#1e40af', 4.3, 0.28, -0.75);
  addBox(house, 2.5, 0.14, 1.5, '#f1f5f9', 4.3, 0.6, -0.75);
  addBox(house, 0.72, 0.18, 0.45, '#fde047', 4.9, 0.74, -0.75);
  makeNpc(house, 'mom_ch3', -2.2, 0, -0.25, 1);

  // 2) CLASSROOM M.5/2 ('classroom_2b') — Real chalkboard, teacher podium, rows of desks & hiding desk!
  const cls = makeShell('classroom_2b', 15.2, wallTex, '#e2e8f0', '#fff7e6', 3.6);
  // Green Chalkboard + Thai lesson header
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.65),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ม.5/2 • คาบนาฏศิลป์ & ประวัติไทย', 'ห้ามขึ้นชั้น 3 หลัง 18:00 น.', '#14532d', '#064e3b', '#b45309') })
  );
  board.position.set(0.4, 2.35, -1.61);
  cls.add(board);
  // Teacher Podium + Student Desks
  addBox(cls, 1.35, 0.88, 0.75, '#78350f', -3.2, 0.44, -0.85);
  const classRoomStudentMeshes: THREE.Mesh[] = [];
  [-1.2, 1.2, 3.6, 5.4].forEach((dx, idx) => {
    addBox(cls, 1.25, 0.68, 0.65, '#a16207', dx, 0.34, -0.75);
    addBox(cls, 0.55, 0.42, 0.5, '#78350f', dx, 0.21, -0.15);
    const st = makeNpc(cls, idx % 2 === 0 ? 'student_girl' : 'student_boy', dx, 0, -0.2, -1);
    classRoomStudentMeshes.push(st);
  });
  const classTeacherMesh = makeNpc(cls, 'teacher_somchai', -3.2, 0, -0.35, 1);

  // 3) TEACHER OFFICE ('teacher_office') — Desks, Trophy wall & Kru Wilai's Steel Security Safe!
  const tOff = makeShell('teacher_office', 14.4, wallTex, '#cbd5e1', '#f0f9ff', 3.4);
  const tSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.15),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('ห้องพักครูหมวดศิลปะ', 'ครูสมชาย & ครูวิไลวรรณ', '#1e3a8a', '#172554', '#facc15') })
  );
  tSign.position.set(0, 2.75, -1.61);
  tOff.add(tSign);
  addBox(tOff, 1.9, 0.78, 0.9, '#92400e', -2.4, 0.39, -0.8);
  addBox(tOff, 1.9, 0.78, 0.9, '#78350f', 1.6, 0.39, -0.8);
  // Locked Steel Safe on Right (+4.6)
  addBox(tOff, 1.25, 1.75, 0.85, '#334155', 4.6, 0.88, -1.05, 0.45);
  addBox(tOff, 0.26, 0.26, 0.08, '#facc15', 4.6, 1.15, -0.6, 0.3);
  const somchaiOfficeMesh = makeNpc(tOff, 'teacher_somchai', -2.2, 0, -0.2, 1);
  const wilaiDayMesh = makeNpc(tOff, 'teacher_wilai', 1.7, 0, -0.2, -1);

  // 4) LIBRARY & ARCHIVES ('library_room') — Towering Bookcases & 2554 Newspaper Archive!
  const lib = makeShell('library_room', 14.4, wallTex, '#d6d3d1', '#fef3c7', 3.1);
  [-3.2, 0.2, 3.6].forEach((bx) => {
    addBox(lib, 2.4, 3.0, 0.65, '#451a03', bx, 1.5, -1.25);
    [0.8, 1.5, 2.2].forEach((sy) => addBox(lib, 2.2, 0.22, 0.68, '#b45309', bx, sy, -1.23));
  });
  // Study tables with green reading lamps
  addBox(lib, 2.2, 0.72, 0.95, '#78350f', -0.4, 0.36, -0.15);
  addBox(lib, 0.45, 0.32, 0.45, '#15803d', -0.4, 0.88, -0.15);

  // 5) HAUNTED THAI MUSIC & DANCE ROOM ('music_room') — Ornate Stage, Ranat Ek, Khong Wong & Antique Mirror!
  const mr = makeShell('music_room', 16.4, darkWall, '#451a03', '#ffb380', 2.4);
  // Dramatic Volumetric Lighting & Crimson Velvet Theater Curtains
  [-7.2, 7.2].forEach((cx) => addBox(mr, 1.6, 4.1, 0.6, '#7f1d1d', cx, 2.05, -1.35));
  addBox(mr, 16.2, 0.55, 0.55, '#991b1b', 0, 3.9, -1.25);
  // Raised Teak Practice Stage (center-right: -1.5 .. +6.5)
  addBox(mr, 8.8, 0.34, 2.8, '#5c2c16', 2.6, 0.17, -0.45, 0.45);
  // Ornate Gilded Thai Teacher Altar (โต๊ะหมู่บูชาครูนาฏศิลป์ x = +5.4)
  addBox(mr, 1.6, 1.05, 0.85, '#92400e', 5.4, 0.86, -0.95);
  addBox(mr, 1.4, 0.18, 0.7, '#eab308', 5.4, 1.45, -0.95);
  const chadaCrownAltarMesh = new THREE.Group();
  chadaCrownAltarMesh.position.set(5.4, 1.85, -0.95);
  const chadaCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.68, 12),
    new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.75, roughness: 0.2 })
  );
  chadaCrownAltarMesh.add(chadaCone);
  chadaCrownAltarMesh.visible = false; // Appears once player returns the stolen Gold Chada!
  mr.add(chadaCrownAltarMesh);

  // Sculpted 3D Ranat Ek (ระนาดเอก at x = +1.8) + 3D Khong Wong (ฆ้องวงใหญ่ at x = -0.8) + Taphon drum!
  addBox(mr, 1.9, 0.62, 0.55, '#78350f', 1.8, 0.65, -0.35);
  addBox(mr, 1.82, 0.14, 0.46, '#fde68a', 1.8, 1.0, -0.35);
  const khongRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.12, 10, 20),
    new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.4 })
  );
  khongRing.rotation.x = Math.PI / 2;
  khongRing.position.set(-0.8, 0.62, -0.25);
  mr.add(khongRing);

  // Giant Antique Silver-Framed Mirror (x = +3.6) with hidden Ghost Dancer reflection inside!
  addBox(mr, 2.3, 2.85, 0.16, '#eab308', 3.6, 1.85, -1.52, 0.35);
  const mirrorSurf = new THREE.Mesh(
    new THREE.PlaneGeometry(2.05, 2.6),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.08, metalness: 0.85 })
  );
  mirrorSurf.position.set(3.6, 1.85, -1.42);
  mr.add(mirrorSurf);
  const mirrorGhostMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.95),
    new THREE.MeshBasicMaterial({ map: charFrames.dancer_ghost[0], transparent: true, opacity: 0.0 })
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

  // Protagonist House Exterior (-110)
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

  // Parked Road Bicycle beside Home (-104.5)
  const parkedBikeGroup = new THREE.Group();
  parkedBikeGroup.position.set(-104.5, 0, -0.35);
  [-0.45, 0.45].forEach((wx) => {
    const wh = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 16), new THREE.MeshStandardMaterial({ color: '#111827' }));
    wh.position.set(wx, 0.36, 0);
    parkedBikeGroup.add(wh);
  });
  addBox(parkedBikeGroup, 0.92, 0.08, 0.08, '#0284c7', 0, 0.62, 0);
  exteriorGroup.add(parkedBikeGroup);

  // School Gate Arch (-52) + Flagpole Plaza (-26)
  [-55.2, -48.8].forEach((gx) => addBox(exteriorGroup, 1.1, 4.8, 1.1, '#7f1d1d', gx, 2.4, -0.8));
  addBox(exteriorGroup, 8.2, 1.15, 1.2, '#450a0a', -52, 4.85, -0.8);
  const archSign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 1.25),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('โรงเรียนมัธยมจันทรารัตน์', 'วิชา จริยา นาฏศิลป์สยาม', '#7f1d1d', '#450a0a', '#facc15') })
  );
  archSign.position.set(-52, 4.85, -0.18);
  exteriorGroup.add(archSign);

  // Guard Booth (-45.5) & Janitor Uncle Man
  addBox(exteriorGroup, 2.6, 2.6, 1.8, '#e2e8f0', -45.5, 1.3, -1.2);
  addBox(exteriorGroup, 2.9, 0.35, 2.0, '#1e3a8a', -45.5, 2.75, -1.2);
  const janitorMesh = makeNpc('janitor_man', -44.0, 0, -0.25, -1);

  // Bully Kong & Gang leaning near Gate (-38.5)
  const kongGangMeshes = [
    makeNpc('kong_bully', -38.5, 0, -0.15, -1),
    makeNpc('student_boy', -36.9, 0, -0.35, -1),
  ];

  // Central Flagpole & Fluttering Thai National Flag (-26)
  addBox(exteriorGroup, 3.2, 0.45, 3.2, '#cbd5e1', -26, 0.22, -1.1);
  addBox(exteriorGroup, 0.14, 11.5, 0.14, '#e2e8f0', -26, 5.75, -1.1);
  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 128;
  flagCanvas.height = 80;
  const fCtx = flagCanvas.getContext('2d')!;
  fCtx.fillStyle = '#ef4444';
  fCtx.fillRect(0, 0, 128, 13);
  fCtx.fillRect(0, 67, 128, 13);
  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(0, 13, 128, 14);
  fCtx.fillRect(0, 53, 128, 14);
  fCtx.fillStyle = '#1e3a8a';
  fCtx.fillRect(0, 27, 128, 26);
  const flagTex = new THREE.CanvasTexture(flagCanvas);
  flagTex.colorSpace = THREE.SRGBColorSpace;
  const flagMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 1.3),
    new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide })
  );
  flagMesh.position.set(-24.9, 10.6, -1.1);
  exteriorGroup.add(flagMesh);

  const flagCeremonyMeshes = [-31, -28.8, -23.5, -21.2].map((sx, idx) =>
    makeNpc(idx % 2 === 0 ? 'student_girl' : 'student_boy', sx, 0, -0.3, 1)
  );

  // Cafeteria & Co-op Store (+70)
  addBox(exteriorGroup, 10.5, 3.6, 2.8, '#fef9c3', 70, 1.8, -1.4);
  addBox(exteriorGroup, 11.2, 0.45, 3.4, '#ea580c', 70, 3.7, -1.4);
  const coopSign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.05),
    new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('สหกรณ์ & โรงอาหารโรงเรียน', 'น้ำดื่ม • ถ่านไฟฉาย • ของขลัง', '#b45309', '#78350f', '#fef08a') })
  );
  coopSign.position.set(70, 3.25, 0.02);
  exteriorGroup.add(coopSign);
  const coopLight = new THREE.PointLight('#fde68a', 4.5, 16, 1.1);
  coopLight.position.set(70, 3.2, 1.4);
  exteriorGroup.add(coopLight);
  const coopVendorMesh = makeNpc('vendor_coop', 68.5, 0, -0.1, 1);

  // School Basketball Hoop & Court (+90)
  addBox(exteriorGroup, 9.0, 0.03, 5.4, '#166534', 90, 0.025, 0.6);
  addBox(exteriorGroup, 0.18, 3.9, 0.18, '#334155', 90, 1.95, -1.65);
  addBox(exteriorGroup, 1.75, 1.1, 0.1, '#ffffff', 90, 3.45, -1.4);

  // Giant Bodhi Tree & Spirit Shrine (+114)
  addBox(exteriorGroup, 1.6, 4.8, 1.4, '#3b2416', 114, 2.4, -1.8);
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 14, 12),
    new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.9 })
  );
  crown.position.set(114, 5.8, -1.8);
  exteriorGroup.add(crown);
  addBox(exteriorGroup, 1.4, 1.2, 1.1, '#92400e', 112.2, 1.2, -0.8);
  const shrineLight = new THREE.PointLight('#ef4444', 3.4, 12, 1.2);
  shrineLight.position.set(112.2, 2.1, -0.2);
  exteriorGroup.add(shrineLight);
  const shrineIncenseParticles: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const sm = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.35 })
    );
    sm.position.set(112.2, 1.6 + i * 0.35, -0.7);
    exteriorGroup.add(sm);
    shrineIncenseParticles.push(sm);
  }

  // Roaming Daytime Students across campus
  const students: SchoolLifeRefs['students'] = [
    { mesh: makeNpc('student_girl', -42, 0, 0.3, 1), shadow: new THREE.Mesh(), kind: 'student_girl', x: -42, z: 0.3, speed: 1.5, minX: -90, maxX: -4, dir: 1 },
    { mesh: makeNpc('student_boy', 22, 0, 0.35, -1), shadow: new THREE.Mesh(), kind: 'student_boy', x: 22, z: 0.35, speed: 1.7, minX: -12, maxX: 82, dir: -1 },
    { mesh: makeNpc('student_girl', 76, 0, 0.25, 1), shadow: new THREE.Mesh(), kind: 'student_girl', x: 76, z: 0.25, speed: 1.4, minX: 48, maxX: 98, dir: 1 },
  ];

  // Traffic vehicles along town road (-124 .. -56)
  const roadTex = createThaiRoadTexture();
  void roadTex;
  const coneTex = createLightConeTexture('255, 226, 160');
  const courtyardCone = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 5.5),
    new THREE.MeshBasicMaterial({ map: coneTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.24 })
  );
  courtyardCone.position.set(-26, 4.8, -0.5);
  exteriorGroup.add(courtyardCone);

  const vehicles: SchoolLifeRefs['vehicles'] = [];
  [
    { x: -96, z: 3.1, speed: 7.4, dir: 1 as const, col: '#eab308' },
    { x: -68, z: 3.9, speed: 8.6, dir: -1 as const, col: '#dc2626' },
  ].forEach((vc) => {
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
    vehicles,
    students,
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

  // Flutter National Flag
  refs.flagMesh.rotation.y = Math.sin(clock * 4.5) * 0.25;
  refs.flagMesh.position.y = 10.6 + Math.sin(clock * 3.1) * 0.06;

  // Incense smoke at Bodhi shrine
  refs.shrineIncenseParticles.forEach((p, idx) => {
    const c = (clock * 0.5 + idx * 0.16) % 1;
    p.position.y = 1.65 + c * 1.9;
    p.position.x = 112.2 + Math.sin(clock * 2.2 + idx) * 0.18;
    (p.material as THREE.MeshBasicMaterial).opacity = (1 - c) * 0.4;
  });

  // Daytime flag ceremony, bullies, classroom, & teachers
  refs.flagCeremonyMeshes.forEach((m, idx) => {
    m.visible = assemblyHours;
    if (assemblyHours) (m.material as THREE.MeshStandardMaterial).map = charFrames[idx % 2 === 0 ? 'student_girl' : 'student_boy'][Math.floor(clock * 1.5) % 2];
  });
  refs.kongGangMeshes.forEach((m, idx) => {
    m.visible = hour >= 7.0 && hour < 19.2;
    (m.material as THREE.MeshStandardMaterial).map = charFrames[idx === 0 ? 'kong_bully' : 'student_boy'][Math.floor(clock * 1.6) % 2];
  });
  refs.coopVendorMesh.visible = hour >= 6.5 && hour < 17.5;
  refs.classTeacherMesh.visible = schoolHours;
  refs.classRoomStudentMeshes.forEach((m) => (m.visible = schoolHours));
  refs.wilaiDayMesh.visible = schoolHours || hour < 18.2;
  refs.somchaiOfficeMesh.visible = schoolHours || hour < 18.0;
  refs.janitorMesh.visible = !inNight || hour >= 20.0;

  if (!isInside) {
    // Roaming students only during school morning/afternoon!
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

    // Moving Town Road traffic (-124 .. -56)
    refs.vehicles.forEach((v) => {
      v.group.position.x += v.dir * v.speed * dt;
      if (v.dir === 1 && v.group.position.x > -55) v.group.position.x = -124;
      if (v.dir === -1 && v.group.position.x < -124) v.group.position.x = -55;
    });
  }
}
