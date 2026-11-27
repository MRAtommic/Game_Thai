import * as THREE from 'three';
import {
  Ch3CharKind,
  createCh3CharacterTexture,
  createSchoolSignTexture,
} from '../art/Chapter3Sprites';
import { Ch3RoomId } from '../data/chapter3Data';
import {
  createLightConeTexture,
  createStreetTreeTexture,
  createThaiDoorTexture,
  createThaiRoadTexture,
  createThaiTileFloorTexture,
  createThaiWallTexture,
  createThaiWindowTexture,
} from '../art/TextureFactory';
import { FloorIndex, TimePeriod, WeatherType } from '../types';
import {
  animateSchoolLife,
  buildCampusGroundProps,
  buildSchoolRooms,
  CH3_FLOOR_H,
  SchoolLifeRefs,
} from './SchoolRoomsAndLife';

export const CH3_MIN_X = -124.0;
export const CH3_MAX_X = 124.0;
export const CH3_BLDG_MIN_X = -12.0;
export const CH3_BLDG_MAX_X = 36.0;
export const CH3_STAIR_X = 33.2;

export class SchoolWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private hemiLight: THREE.HemisphereLight;
  private sunMoonLight: THREE.DirectionalLight;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;

  private exteriorGroup: THREE.Group;
  private roomGroups: Partial<Record<Ch3RoomId, THREE.Group>> = {};
  private lifeRefs!: SchoolLifeRefs;

  private playerMesh: THREE.Mesh;
  private playerShadow: THREE.Mesh;
  private ridingBikeGroup: THREE.Group;
  private bikeWheels: THREE.Mesh[] = [];
  private ghostMesh: THREE.Mesh;
  private ghostLight: THREE.PointLight;
  private gateLockMesh: THREE.Group;
  private corridorLights: { floor: FloorIndex; light: THREE.PointLight; baseInt: number; seed: number }[] = [];

  private rainLines: THREE.LineSegments;
  private rainPos: Float32Array;
  private rainCount = 460;

  private charFrames: Record<Ch3CharKind, THREE.CanvasTexture[]> = {
    peem: [],
    mom_ch3: [],
    teacher_somchai: [],
    teacher_wilai: [],
    janitor_man: [],
    kong_bully: [],
    student_girl: [],
    student_boy: [],
    vendor_coop: [],
    dancer_ghost: [],
    dancer_chase: [],
  };

  private animClock = 0;
  private zoomFactor = 1.0;
  private targetCamZ = 13.0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#4a729c');
    this.scene.fog = new THREE.FogExp2('#4a729c', 0.0085);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 180);
    this.camera.position.set(-106, 2.2, 13.0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.resize();

    this.hemiLight = new THREE.HemisphereLight('#bfd9ff', '#312b22', 0.92);
    this.scene.add(this.hemiLight);

    this.sunMoonLight = new THREE.DirectionalLight('#fff2d6', 1.15);
    this.sunMoonLight.position.set(16, 28, 16);
    this.sunMoonLight.castShadow = true;
    this.sunMoonLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.sunMoonLight);

    this.flashlight = new THREE.SpotLight('#fff0c8', 0, 17, Math.PI / 4, 0.5, 1.15);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight, this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    (['peem', 'student_boy', 'student_girl'] as Ch3CharKind[]).forEach((k) => {
      for (let f = 0; f < 4; f++) this.charFrames[k].push(createCh3CharacterTexture(k, f));
    });
    (['mom_ch3', 'teacher_somchai', 'teacher_wilai', 'janitor_man', 'kong_bully', 'vendor_coop', 'dancer_ghost', 'dancer_chase'] as Ch3CharKind[]).forEach(
      (k) => {
        for (let f = 0; f < 2; f++) this.charFrames[k].push(createCh3CharacterTexture(k, f));
      }
    );

    const shadowTex = this.makeShadowTex();
    this.exteriorGroup = new THREE.Group();
    this.scene.add(this.exteriorGroup);

    this.gateLockMesh = new THREE.Group();
    this.buildCampusGroundAndSky();
    this.buildThreeStorySchoolBuilding();
    const groundRefs = buildCampusGroundProps(this.exteriorGroup, this.charFrames, shadowTex, this.addBox.bind(this));
    const roomRefs = buildSchoolRooms(this.scene, this.roomGroups, this.charFrames, shadowTex, this.addBox.bind(this));
    this.lifeRefs = { ...groundRefs, ...roomRefs };

    this.playerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 2.02),
      new THREE.MeshStandardMaterial({ map: this.charFrames.peem[0], transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })
    );
    this.playerShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.42),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.48, depthWrite: false })
    );
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.playerMesh, this.playerShadow);

    // Visible 3D Road Bicycle mesh underneath Peem when riding!
    this.ridingBikeGroup = new THREE.Group();
    this.ridingBikeGroup.visible = false;
    [-0.52, 0.52].forEach((wx) => {
      const wheel = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.055, 8, 16),
        new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.85 })
      );
      wheel.position.set(wx, 0.34, 0);
      this.ridingBikeGroup.add(wheel);
      this.bikeWheels.push(wheel);
      const hub = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: '#cbd5e1' }));
      wheel.add(hub);
    });
    this.addBox(this.ridingBikeGroup, 0.96, 0.08, 0.08, '#0284c7', 0, 0.62, 0); // top tube
    this.addBox(this.ridingBikeGroup, 0.07, 0.48, 0.07, '#0369a1', 0.36, 0.66, 0); // handlebar post
    this.addBox(this.ridingBikeGroup, 0.08, 0.08, 0.42, '#1e293b', 0.42, 0.9, 0); // handlebar
    this.addBox(this.ridingBikeGroup, 0.24, 0.08, 0.14, '#111827', -0.25, 0.72, 0); // saddle
    const bikeHead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    bikeHead.position.set(0.48, 0.76, 0);
    this.ridingBikeGroup.add(bikeHead);
    this.scene.add(this.ridingBikeGroup);

    this.ghostMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 2.48),
      new THREE.MeshStandardMaterial({
        map: this.charFrames.dancer_ghost[0],
        transparent: true,
        alphaTest: 0.18,
        side: THREE.DoubleSide,
        emissive: '#450a0a',
      })
    );
    this.ghostMesh.visible = false;
    this.ghostLight = new THREE.PointLight('#ef4444', 0, 14, 1.1);
    this.scene.add(this.ghostMesh, this.ghostLight);

    this.rainPos = new Float32Array(this.rainCount * 6);
    for (let i = 0; i < this.rainCount; i++) {
      const rx = CH3_MIN_X + Math.random() * (CH3_MAX_X - CH3_MIN_X);
      const ry = Math.random() * 19;
      const rz = -3 + Math.random() * 7;
      this.rainPos[i * 6] = rx;
      this.rainPos[i * 6 + 1] = ry;
      this.rainPos[i * 6 + 2] = rz;
      this.rainPos[i * 6 + 3] = rx - 0.1;
      this.rainPos[i * 6 + 4] = ry - 0.55;
      this.rainPos[i * 6 + 5] = rz;
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    this.rainLines = new THREE.LineSegments(rGeo, new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0 }));
    this.scene.add(this.rainLines);
  }

  private addBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    col: string,
    x: number,
    y: number,
    z: number,
    rough = 0.85
  ): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: col, roughness: rough })
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  private makeShadowTex(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
    g.addColorStop(0, 'rgba(0,0,0,0.72)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  private buildCampusGroundAndSky(): void {
    const roadTex = createThaiRoadTexture();
    roadTex.repeat.set(16, 1);
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.4, 13.0),
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.72 })
    );
    road.position.set(-92, -0.2, 1.4);
    road.receiveShadow = true;
    this.exteriorGroup.add(road);

    const campusYard = new THREE.Mesh(
      new THREE.BoxGeometry(190, 0.42, 14.0),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.85 })
    );
    campusYard.position.set(42, -0.19, 1.2);
    campusYard.receiveShadow = true;
    this.exteriorGroup.add(campusYard);

    // Clean Green Campus Hedge & Brick Perimeter Wall behind East Grounds & Courtyard
    this.addBox(this.exteriorGroup, 92, 1.55, 0.45, '#14532d', 82, 0.77, -3.6, 0.9);
    this.addBox(this.exteriorGroup, 92, 0.4, 0.65, '#f8fafc', 82, 0.2, -3.6, 0.8);
    // Low cream brick campus wall along courtyard behind flagpole (-46 .. -14)
    this.addBox(this.exteriorGroup, 34, 1.25, 0.35, '#e2e8f0', -30, 0.62, -2.55, 0.85);
    this.addBox(this.exteriorGroup, 34, 0.22, 0.42, '#7f1d1d', -30, 1.32, -2.55, 0.75);

    const treeTex = createStreetTreeTexture();
    [-118, -98, -78, -60, -40, -18, 40, 60, 74, 102, 120].forEach((tx, idx) => {
      const tr = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 4.5),
        new THREE.MeshStandardMaterial({ map: treeTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })
      );
      tr.position.set(tx, 2.15, -3.2 - (idx % 2) * 0.4);
      this.exteriorGroup.add(tr);
    });

    // Soft atmospheric distant mountain ridge horizon (z = -28, never flat black boxes!)
    for (let bx = -130; bx <= 130; bx += 36) {
      const hill = new THREE.Mesh(
        new THREE.ConeGeometry(28, 12 + ((Math.abs(bx) * 3) % 6), 5),
        new THREE.MeshBasicMaterial({ color: '#334d6e' })
      );
      hill.position.set(bx, 4.5, -32.0);
      this.exteriorGroup.add(hill);
    }

    // Fence pillars + black wrought-iron school fence bars strictly AFTER gate entrance (-47 .. -14, NO pole inside gate at -52!)
    for (let fx = -47; fx <= -14; fx += 6.5) {
      this.addBox(this.exteriorGroup, 0.36, 2.25, 0.36, '#f8fafc', fx, 1.12, -2.55);
      if (fx + 6.5 <= -13) {
        const spanW = Math.min(6.5, -13 - fx);
        this.addBox(this.exteriorGroup, spanW, 0.08, 0.08, '#1e293b', fx + spanW / 2, 2.15, -2.55, 0.5);
        for (let bar = 0.5; bar < spanW; bar += 0.45) {
          this.addBox(this.exteriorGroup, 0.05, 0.85, 0.05, '#1e293b', fx + bar, 1.72, -2.55, 0.5);
        }
      }
    }
    this.addBox(this.gateLockMesh, 6.2, 2.6, 0.14, '#7f1d1d', -52, 1.3, -1.9);
    this.exteriorGroup.add(this.gateLockMesh);

    [-112, -88, -66, -42, -26, 46, 67, 88, 114].forEach((lx) => {
      this.addBox(this.exteriorGroup, 0.22, 5.8, 0.22, '#475569', lx, 2.9, -2.0);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.45), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
      b.position.set(lx, 5.75, -1.25);
      this.exteriorGroup.add(b);
      const pl = new THREE.PointLight('#ffd89a', 6.5, 20, 0.95);
      pl.position.set(lx, 5.4, 0.8);
      this.exteriorGroup.add(pl);
    });
  }

  private buildThreeStorySchoolBuilding(): void {
    const wallTex = createThaiWallTexture(false);
    const darkWall = createThaiWallTexture(true);
    const tileTex = createThaiTileFloorTexture();
    const winLit = createThaiWindowTexture(true);
    const winDark = createThaiWindowTexture(false);

    // Compact, realistically proportioned 3-story wing: -12 .. +36 (48m wide!)
    const totalW = CH3_BLDG_MAX_X - CH3_BLDG_MIN_X;
    const centerX = (CH3_BLDG_MIN_X + CH3_BLDG_MAX_X) / 2;

    // Exterior columns, Solid End Side-Walls (preventing sky gaps at building edges/stairwell) & decorative school cornice
    this.addBox(this.exteriorGroup, 0.42, CH3_FLOOR_H * 4, 4.15, '#cbd5e1', CH3_BLDG_MIN_X - 0.16, CH3_FLOOR_H * 2, 0.25, 0.88);
    this.addBox(this.exteriorGroup, 0.42, CH3_FLOOR_H * 4, 4.15, '#cbd5e1', CH3_BLDG_MAX_X + 0.16, CH3_FLOOR_H * 2, 0.25, 0.88);
    for (let px = CH3_BLDG_MIN_X; px <= CH3_BLDG_MAX_X; px += 8.0) {
      this.addBox(this.exteriorGroup, 0.52, CH3_FLOOR_H * 4, 0.52, '#e2e8f0', px, CH3_FLOOR_H * 2, 2.15);
    }

    // Sloped Thai Royal-Blue School Gable Roof topping Floor 3
    const roofY = CH3_FLOOR_H * 4 + 0.35;
    this.addBox(this.exteriorGroup, totalW + 2.2, 1.9, 5.4, '#1e3a8a', centerX, roofY + 0.85, 0.2, 0.6);
    this.addBox(this.exteriorGroup, totalW + 2.4, 0.32, 5.6, '#facc15', centerX, roofY, 0.2, 0.4);
    const bldgTitle = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, 1.55),
      new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('อาคารเรียนมัธยมจันทรารัตน์ (3 ชั้น)', 'ชั้น 1 หอสมุด-พักครู • ชั้น 2 ม.5/2 • ชั้น 3 ดนตรีไทย', '#1e3a8a', '#0f172a', '#facc15') })
    );
    bldgTitle.position.set(centerX, roofY + 0.9, 2.95);
    this.exteriorGroup.add(bldgTitle);

    // Ground Floor (ใต้ถุนอาคารเรียน -12 .. +36): Raised terrazzo floor, back wall, office doors, notice boards, trophy case & marble benches
    const lobbySlab = new THREE.Mesh(
      new THREE.BoxGeometry(totalW + 0.8, 0.14, 4.9),
      new THREE.MeshStandardMaterial({ map: tileTex, color: '#e2e8f0', roughness: 0.55 })
    );
    lobbySlab.position.set(centerX, 0.05, 0.4);
    lobbySlab.receiveShadow = true;
    this.exteriorGroup.add(lobbySlab);
    this.addBox(this.exteriorGroup, totalW + 1.0, 0.1, 0.35, '#94a3b8', centerX, 0.05, 2.85, 0.85);

    const groundWall = new THREE.Mesh(
      new THREE.BoxGeometry(totalW + 0.8, CH3_FLOOR_H + 0.1, 0.22),
      new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 })
    );
    groundWall.position.set(centerX, CH3_FLOOR_H / 2, -1.65);
    this.exteriorGroup.add(groundWall);
    this.addBox(this.exteriorGroup, totalW + 0.6, 0.85, 0.08, '#cbd5e1', centerX, 0.42, -1.5, 0.78);

    // Potted tropical shrubs beside ground-floor pillars
    for (let px = CH3_BLDG_MIN_X; px <= 28; px += 8.0) {
      this.addBox(this.exteriorGroup, 0.56, 0.42, 0.56, '#b45309', px + 0.65, 0.25, 1.85, 0.8);
      this.addBox(this.exteriorGroup, 0.68, 0.52, 0.68, '#15803d', px + 0.65, 0.66, 1.85, 0.9);
    }

    // Lobby Lights & Windows (including stairwell window at +33.4)
    [-6, 10, 24, 33].forEach((lx, idx) => {
      const pt = new THREE.PointLight('#fffbeb', 1.85, 16, 1.15);
      pt.position.set(lx, 3.25, 0.55);
      this.exteriorGroup.add(pt);
      this.corridorLights.push({ floor: 0, light: pt, baseInt: 1.85, seed: idx + 1 });
    });
    [-9.5, -4.0, 1.5, 11.0, 18.5, 29.0, 33.4].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.32), new THREE.MeshBasicMaterial({ map: winLit }));
      win.position.set(wx, 2.55, -1.52);
      this.exteriorGroup.add(win);
      this.addBox(this.exteriorGroup, 2.3, 0.12, 0.14, '#1e3a8a', wx, 1.84, -1.49, 0.6);
    });

    [
      { x: -7.5, label: 'ห้องธุรการ' },
      { x: -0.5, label: 'ห้องพยาบาล' },
      { x: 21.5, label: 'สภาฯ นร.' },
    ].forEach((d) => {
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 2.35),
        new THREE.MeshStandardMaterial({ map: createThaiDoorTexture(d.label, false), roughness: 0.78 })
      );
      door.position.set(d.x, 1.25, -1.49);
      this.exteriorGroup.add(door);
    });

    // Honor Trophy Cabinet (+3.5) with golden trophies
    this.addBox(this.exteriorGroup, 2.4, 2.05, 0.52, '#78350f', 3.5, 1.1, -1.25, 0.55);
    this.addBox(this.exteriorGroup, 2.1, 1.45, 0.42, '#bae6fd', 3.5, 1.25, -1.19, 0.15);
    [-0.65, 0, 0.65].forEach((ox) => {
      this.addBox(this.exteriorGroup, 0.22, 0.36, 0.2, '#facc15', 3.5 + ox, 1.05, -1.16, 0.25);
      this.addBox(this.exteriorGroup, 0.18, 0.28, 0.18, '#f59e0b', 3.5 + ox, 1.62, -1.16, 0.25);
    });

    // School Notice Boards (บอร์ดประชาสัมพันธ์) & Recycling Bins (+16.5)
    [7.2, 13.8, 26.5].forEach((bx, i) => {
      this.addBox(this.exteriorGroup, 2.8, 1.45, 0.08, '#1e3a8a', bx, 1.75, -1.48, 0.6);
      this.addBox(this.exteriorGroup, 2.55, 1.2, 0.06, '#d97706', bx, 1.75, -1.44, 0.88);
      this.addBox(this.exteriorGroup, 0.58, 0.72, 0.04, '#fef3c7', bx - 0.65, 1.82, -1.4, 0.9);
      this.addBox(this.exteriorGroup, 0.62, 0.65, 0.04, i === 1 ? '#fecaca' : '#e0f2fe', bx + 0.15, 1.72, -1.4, 0.9);
      this.addBox(this.exteriorGroup, 0.5, 0.55, 0.04, '#dcfce7', bx + 0.85, 1.8, -1.4, 0.9);
    });

    // Iconic Thai School Marble Bench Sets (โต๊ะม้าหินอ่อนใต้ถุนอาคาร)
    [10.2, 18.2, 26.2].forEach((mx) => {
      this.addBox(this.exteriorGroup, 1.5, 0.12, 0.95, '#e2e8f0', mx, 0.78, 0.55, 0.35);
      this.addBox(this.exteriorGroup, 0.85, 0.72, 0.52, '#cbd5e1', mx, 0.36, 0.55, 0.65);
      this.addBox(this.exteriorGroup, 1.45, 0.1, 0.36, '#f1f5f9', mx, 0.48, -0.15, 0.35);
      this.addBox(this.exteriorGroup, 1.45, 0.1, 0.36, '#f1f5f9', mx, 0.48, 1.25, 0.35);
    });

    // Stainless School Water Cooler & 4-Color Thai Recycling Bins
    this.addBox(this.exteriorGroup, 1.35, 1.15, 0.55, '#cbd5e1', 15.8, 0.62, -1.18, 0.25);
    ['#16a34a', '#eab308', '#2563eb', '#dc2626'].forEach((col, bi) => {
      this.addBox(this.exteriorGroup, 0.36, 0.68, 0.42, col, 17.1 + bi * 0.42, 0.38, -1.2, 0.55);
    });

    // Split corridor floor slab neatly so the stairwell (+31.6 .. +34.8) has an open stairwell shaft!
    const mainSlabW = 31.4 - CH3_BLDG_MIN_X; // -12 .. 31.4
    const mainSlabCX = (CH3_BLDG_MIN_X + 31.4) / 2;

    ([1, 2, 3] as FloorIndex[]).forEach((fl) => {
      const y = fl * CH3_FLOOR_H;

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(mainSlabW, 0.28, 4.5),
        new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.7 })
      );
      slab.position.set(mainSlabCX, y - 0.14, 0.3);
      slab.receiveShadow = true;
      this.exteriorGroup.add(slab);

      // Front balcony walkway bridge past the stairwell shaft
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 0.28, 2.0),
        new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.7 })
      );
      bridge.position.set(33.6, y - 0.14, 1.5);
      bridge.receiveShadow = true;
      this.exteriorGroup.add(bridge);

      this.addBox(this.exteriorGroup, totalW - 0.4, 0.12, 0.12, '#eab308', centerX, y + 1.02, 2.25);
      this.addBox(this.exteriorGroup, totalW - 0.4, 0.08, 0.08, '#94a3b8', centerX, y + 0.55, 2.25);

      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(totalW + 0.8, CH3_FLOOR_H + 0.1, 0.22),
        new THREE.MeshStandardMaterial({ map: fl === 3 ? darkWall : wallTex, roughness: 0.92 })
      );
      backWall.position.set(centerX, y + CH3_FLOOR_H / 2, -1.65);
      this.exteriorGroup.add(backWall);

      [-6, 10, 26, 33].forEach((lx, idx) => {
        const lCol = fl === 3 ? '#ff9980' : '#eef6ff';
        const pt = new THREE.PointLight(lCol, fl === 3 ? 0.95 : 2.2, 16, 1.2);
        pt.position.set(lx, y + 3.45, 0.4);
        this.exteriorGroup.add(pt);
        this.corridorLights.push({ floor: fl, light: pt, baseInt: fl === 3 ? 0.95 : 2.2, seed: fl * 10 + idx });
      });

      const wTex = fl === 3 ? winDark : winLit;
      [-8.5, -2.5, 9.5, 17.5, 29.2, 33.4].forEach((wx) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.35), new THREE.MeshBasicMaterial({ map: wTex }));
        win.position.set(wx, y + 2.35, -1.52);
        this.exteriorGroup.add(win);
        this.addBox(this.exteriorGroup, 2.3, 0.12, 0.14, fl === 3 ? '#334155' : '#1e3a8a', wx, y + 1.62, -1.49, 0.6);
      });
    });

    // Clean Realistic Diagonal Staircases at Right Wing (31.5 -> 34.8) with yellow safety nosings, stringer & iron handrail!
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#4c5057', roughness: 0.88 });
    const nosingMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.45 });
    const railMat = new THREE.MeshStandardMaterial({ color: '#1b1e24', metalness: 0.55, roughness: 0.45 });
    ([0, 1, 2] as FloorIndex[]).forEach((fromFloor) => {
      const yBase = fromFloor * CH3_FLOOR_H;
      const steps = 10;
      const startX = 31.6;
      const endX = 34.6;
      const totalDx = endX - startX;
      const totalDy = CH3_FLOOR_H - 0.14;
      const stepDx = totalDx / steps;
      const stepDy = totalDy / steps;

      for (let s = 0; s < steps; s++) {
        const sx = startX + (s + 0.5) * stepDx;
        const sy = yBase + (s + 0.5) * stepDy;
        const tread = new THREE.Mesh(new THREE.BoxGeometry(stepDx + 0.08, stepDy + 0.04, 1.3), concreteMat);
        tread.position.set(sx, sy, -0.45);
        tread.castShadow = true;
        tread.receiveShadow = true;
        this.exteriorGroup.add(tread);

        const nosing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 1.32), nosingMat);
        nosing.position.set(sx - stepDx * 0.45, sy + (stepDy + 0.04) * 0.5 + 0.015, -0.45);
        this.exteriorGroup.add(nosing);
      }

      const slopeLen = Math.hypot(totalDx, totalDy);
      const slopeAngle = Math.atan2(totalDy, totalDx);
      const stringer = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.24, 1.28), concreteMat);
      stringer.position.set((startX + endX) / 2 + 0.06, yBase + totalDy / 2 - 0.14, -0.45);
      stringer.rotation.z = slopeAngle;
      this.exteriorGroup.add(stringer);

      const railBar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, slopeLen + 0.2, 8), railMat);
      railBar.position.set((startX + endX) / 2, yBase + totalDy / 2 + 0.85, 0.18);
      railBar.rotation.z = slopeAngle - Math.PI / 2;
      this.exteriorGroup.add(railBar);

      for (let p = 0; p <= 3; p++) {
        const t = p / 3;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.88, 6), railMat);
        post.position.set(startX + t * totalDx, yBase + t * totalDy + 0.44, 0.18);
        this.exteriorGroup.add(post);
      }
    });

    const addDoor = (fl: FloorIndex, x: number, label: string, haunted = false) => {
      const y = fl * CH3_FLOOR_H;
      const d = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 2.35),
        new THREE.MeshStandardMaterial({ map: createThaiDoorTexture(label, haunted), roughness: 0.78 })
      );
      d.position.set(x, y + 1.2, -1.5);
      this.exteriorGroup.add(d);
    };
    const addLockerBank = (fl: FloorIndex, x: number) => {
      const y = fl * CH3_FLOOR_H;
      this.addBox(this.exteriorGroup, 2.2, 2.05, 0.65, '#475569', x, y + 1.02, -1.18, 0.45);
      for (let i = -0.7; i <= 0.7; i += 0.7) {
        this.addBox(this.exteriorGroup, 0.58, 1.88, 0.68, '#64748b', x + i, y + 1.02, -1.16, 0.4);
      }
    };

    // Floor 1: Library (+4), Locker (+14), Teacher Office (+21.5), Locker (+28)
    addDoor(1, 4.0, 'หอสมุด');
    addLockerBank(1, 14.0);
    addDoor(1, 21.5, 'พักครู');
    addLockerBank(1, 28.0);

    // Floor 2: Classroom M.5/2 (+4), Locker (+14), Restroom (+25)
    addDoor(2, 4.0, 'ม.5/2');
    addLockerBank(2, 14.0);
    addDoor(2, 25.0, 'ห้องน้ำ');

    // Floor 3: Closet (+8), Thai Music Room (+22)
    addDoor(3, 8.0, 'เก็บชุด', true);
    addDoor(3, 22.0, 'ดนตรีไทย', true);
    const hauntedBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 5.2),
      new THREE.MeshBasicMaterial({ map: createLightConeTexture('255, 65, 75'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 })
    );
    hauntedBeam.position.set(22.0, CH3_FLOOR_H * 3 + 2.1, -0.4);
    this.exteriorGroup.add(hauntedBeam);
  }

  public getTimePeriod(mins: number): TimePeriod {
    const h = (mins % 1440) / 60;
    if (h >= 5.5 && h < 7.5) return 'dawn';
    if (h >= 7.5 && h < 11.5) return 'morning';
    if (h >= 11.5 && h < 15.8) return 'noon';
    if (h >= 15.8 && h < 19.0) return 'evening';
    return 'night';
  }

  public update(
    dt: number,
    px: number,
    pz: number,
    pFloor: FloorIndex,
    room: Ch3RoomId,
    facing: 1 | -1,
    isMoving: boolean,
    flashlightOn: boolean,
    gameMinutes: number,
    weather: WeatherType,
    hasBike: boolean,
    ridingBike: boolean,
    showGhost: boolean,
    ghostChasing: boolean,
    ghostFloor: FloorIndex,
    ghostX: number,
    isHiding: boolean,
    mirrorRevealed: boolean,
    chadaReturned: boolean,
    gateLockedAtNight: boolean
  ): void {
    this.animClock += dt;
    const hour = (gameMinutes % 1440) / 60;
    const isInside = room !== 'outside';

    this.exteriorGroup.visible = !isInside;
    (Object.keys(this.roomGroups) as Ch3RoomId[]).forEach((rid) => {
      const grp = this.roomGroups[rid];
      if (grp) grp.visible = rid === room;
    });
    this.rainLines.visible = !isInside;
    this.gateLockMesh.visible = gateLockedAtNight;
    this.lifeRefs.parkedBikeGroup.visible = !hasBike;
    this.lifeRefs.chadaCrownAltarMesh.visible = chadaReturned;

    const mMat = this.lifeRefs.mirrorGhostMesh.material as THREE.MeshBasicMaterial;
    mMat.opacity = mirrorRevealed && !chadaReturned ? 0.85 + Math.sin(this.animClock * 4) * 0.12 : 0;
    mMat.map = this.charFrames.dancer_ghost[Math.floor(this.animClock * 3) % 2];

    const yBase = isInside ? 0 : pFloor * CH3_FLOOR_H;
    this.playerMesh.visible = !isHiding;
    this.playerShadow.visible = !isHiding;
    this.playerMesh.position.set(px, yBase + (ridingBike ? 1.25 : 0.96), pz);
    this.playerShadow.position.set(px, yBase + 0.026, pz);
    const pf = isMoving ? Math.floor(this.animClock * (ridingBike ? 11 : 8)) % 4 : 0;
    (this.playerMesh.material as THREE.MeshStandardMaterial).map = this.charFrames.peem[pf];
    this.playerMesh.scale.x = facing;

    // Visible 3D Bicycle tracking under Peem when riding!
    this.ridingBikeGroup.visible = ridingBike && !isHiding && !isInside && pFloor === 0;
    if (this.ridingBikeGroup.visible) {
      this.ridingBikeGroup.position.set(px, yBase + 0.02, pz + 0.05);
      this.ridingBikeGroup.scale.x = facing;
      if (isMoving) this.bikeWheels.forEach((w) => (w.rotation.z -= dt * 11));
    }

    this.flashlight.position.set(px + facing * 0.3, yBase + 1.18, pz + 0.25);
    this.flashlightTarget.position.set(px + facing * 6.5, yBase + 0.9, pz - 0.5);
    this.flashlight.intensity = flashlightOn && !isHiding ? 16.0 : 0;

    // Ghost Dancer visibility + terrifying pulsing chase strobe!
    const ghostVisible = showGhost && !chadaReturned && (!isInside || room === 'music_room');
    this.ghostMesh.visible = ghostVisible;
    if (ghostVisible) {
      const gy = (isInside ? 0 : ghostFloor * CH3_FLOOR_H) + 1.22 + Math.sin(this.animClock * (ghostChasing ? 7.5 : 3.2)) * 0.14;
      this.ghostMesh.position.set(ghostX, gy, 0.15);
      this.ghostMesh.scale.x = px >= ghostX ? 1 : -1;
      const mat = this.ghostMesh.material as THREE.MeshStandardMaterial;
      const gFrame = Math.floor(this.animClock * (ghostChasing ? 7 : 2.8)) % 2;
      mat.map = ghostChasing ? this.charFrames.dancer_chase[gFrame] : this.charFrames.dancer_ghost[gFrame];
      this.ghostLight.position.set(ghostX, gy + 0.4, 0.8);
      this.ghostLight.intensity = ghostChasing ? 3.8 + Math.sin(this.animClock * 18) * 1.4 : 1.8;
    } else {
      this.ghostLight.intensity = 0;
    }

    const isNight = hour >= 19.0 || hour < 5.5;
    this.corridorLights.forEach((cl) => {
      if (isNight && cl.floor === 3 && !chadaReturned) {
        cl.light.intensity = cl.baseInt * (Math.sin(this.animClock * 17 + cl.seed) > 0.65 ? 0.15 : 1.0);
      } else {
        cl.light.intensity = isNight ? cl.baseInt * 0.65 : cl.baseInt;
      }
    });

    animateSchoolLife(this.lifeRefs, this.charFrames, this.animClock, dt, hour, isInside);
    this.updateSkyAndRain(dt, gameMinutes, weather);

    const targetX = isInside
      ? THREE.MathUtils.clamp(px, -3.5, 3.5)
      : pFloor === 0
      ? THREE.MathUtils.clamp(px, -118, 118)
      : THREE.MathUtils.clamp(px, -7, 30);
    const targetY = (isInside ? 0 : pFloor * CH3_FLOOR_H) + 2.15;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, Math.min(1, dt * 6));
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, Math.min(1, dt * 6));
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetCamZ, Math.min(1, dt * 6));
    this.camera.lookAt(this.camera.position.x, this.camera.position.y - 0.15, 0);
    this.renderer.render(this.scene, this.camera);
  }

  private updateSkyAndRain(dt: number, mins: number, weather: WeatherType): void {
    const h = (mins % 1440) / 60;
    const sky = new THREE.Color('#090d1a');
    let hInt = 0.45;
    let sInt = 0.35;

    if (h >= 5.5 && h < 7.5) {
      sky.lerpColors(new THREE.Color('#0c1224'), new THREE.Color('#6b8cae'), (h - 5.5) / 2);
      hInt = 0.72;
      sInt = 0.75;
    } else if (h >= 7.5 && h < 16.0) {
      sky.set('#5583b5');
      hInt = 0.98;
      sInt = 1.2;
    } else if (h >= 16.0 && h < 19.0) {
      sky.lerpColors(new THREE.Color('#d97706'), new THREE.Color('#0f172a'), (h - 16.0) / 3);
      hInt = 0.78;
      sInt = 0.82;
    } else {
      sky.set('#070b17');
      hInt = 0.38;
      sInt = 0.25;
    }

    if (weather === 'rain' || weather === 'storm') sky.multiplyScalar(0.7);
    this.scene.background = sky;
    (this.scene.fog as THREE.FogExp2).color.copy(sky);
    (this.scene.fog as THREE.FogExp2).density = h >= 19 || h < 5.5 ? 0.015 : 0.008;
    this.hemiLight.intensity = hInt;
    this.sunMoonLight.intensity = sInt;

    const rMat = this.rainLines.material as THREE.LineBasicMaterial;
    const raining = weather === 'rain' || weather === 'storm';
    rMat.opacity = THREE.MathUtils.lerp(rMat.opacity, raining ? 0.45 : 0, dt * 3);
    if (raining) {
      for (let i = 0; i < this.rainCount; i++) {
        const k = i * 6;
        this.rainPos[k] -= 1.8 * dt;
        this.rainPos[k + 1] -= 16 * dt;
        if (this.rainPos[k + 1] < 0) {
          this.rainPos[k] = CH3_MIN_X + Math.random() * (CH3_MAX_X - CH3_MIN_X);
          this.rainPos[k + 1] = 19;
        }
        this.rainPos[k + 3] = this.rainPos[k] + 0.08;
        this.rainPos[k + 4] = this.rainPos[k + 1] - 0.55;
      }
      this.rainLines.geometry.attributes.position.needsUpdate = true;
    }
  }

  public setZoomFactor(factor: number): void {
    this.zoomFactor = THREE.MathUtils.clamp(factor, 0.72, 1.55);
    this.updateCameraFraming(false);
  }

  private updateCameraFraming(snap = true): void {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const aspect = w / h;
    const isMob = Math.min(w, h) <= 560 || (navigator.maxTouchPoints > 0 && h <= 640);
    const fov = isMob && aspect >= 1.15 ? 39 : aspect < 1.15 ? THREE.MathUtils.clamp(42 + (1.15 - aspect) * 24, 42, 58) : 42;
    const baseZ = isMob ? 9.4 : 13.0;
    this.targetCamZ = baseZ / this.zoomFactor;
    if (snap) this.camera.position.z = this.targetCamZ;
    this.camera.fov = fov;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public resize(): void {
    this.updateCameraFraming(true);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight));
  }

  public dispose(): void {
    this.renderer.dispose();
  }
}
