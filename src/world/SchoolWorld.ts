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
export const CH3_MAX_X = 128.0;
export const CH3_BLDG_MIN_X = -12.0;
export const CH3_BLDG_MAX_X = 62.0;
export const CH3_STAIR_X = 59.5;

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

    // Hero Peem
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

    // Floating Thai Ghost Dancer (ผีนางรำ)
    this.ghostMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 2.38),
      new THREE.MeshStandardMaterial({
        map: this.charFrames.dancer_ghost[0],
        transparent: true,
        alphaTest: 0.2,
        side: THREE.DoubleSide,
        emissive: '#380909',
      })
    );
    this.ghostMesh.visible = false;
    this.ghostLight = new THREE.PointLight('#ef4444', 0, 12, 1.2);
    this.scene.add(this.ghostMesh, this.ghostLight);

    // Rain particle curtain across the whole campus & town
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
      new THREE.BoxGeometry(82, 0.4, 13.0),
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.72 })
    );
    road.position.set(-92, -0.2, 1.4);
    road.receiveShadow = true;
    this.exteriorGroup.add(road);

    // Grand Thai High School Terrazzo/Asphalt Courtyard (-52 .. +134)
    const campusYard = new THREE.Mesh(
      new THREE.BoxGeometry(192, 0.42, 14.0),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.85 })
    );
    campusYard.position.set(42, -0.19, 1.2);
    campusYard.receiveShadow = true;
    this.exteriorGroup.add(campusYard);

    // Distant Bangkok cityscape & royal palm trees
    const treeTex = createStreetTreeTexture();
    [-118, -98, -78, -60, -40, -18, 66, 82, 102, 120].forEach((tx, idx) => {
      const tr = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 4.4),
        new THREE.MeshStandardMaterial({ map: treeTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })
      );
      tr.position.set(tx, 2.1, -2.6 - (idx % 2) * 0.4);
      this.exteriorGroup.add(tr);
    });
    for (let bx = -120; bx <= 120; bx += 22) {
      const bh = 12 + ((bx * 7) & 7);
      this.addBox(this.exteriorGroup, 12, bh, 3, '#0b1324', bx, bh / 2 - 1, -14.5, 1.0);
    }

    // Perimeter School Fence & Lockable Iron Gate (-52)
    for (let fx = -52; fx <= -13; fx += 6) {
      this.addBox(this.exteriorGroup, 0.35, 2.3, 0.3, '#f8fafc', fx, 1.15, -2.5);
    }
    this.addBox(this.gateLockMesh, 6.2, 2.8, 0.14, '#7f1d1d', -52, 1.4, -0.65);
    this.exteriorGroup.add(this.gateLockMesh);

    // Tall School Streetlamps
    [-112, -88, -66, -42, -26, 76, 94, 114].forEach((lx) => {
      this.addBox(this.exteriorGroup, 0.22, 5.8, 0.22, '#475569', lx, 2.9, -1.6);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.45), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
      b.position.set(lx, 5.75, -0.85);
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

    const totalW = CH3_BLDG_MAX_X - CH3_BLDG_MIN_X; // 74m majestic academic wing!
    const centerX = (CH3_BLDG_MIN_X + CH3_BLDG_MAX_X) / 2;

    // Concrete Columns along the whole 3-Story facade
    for (let px = CH3_BLDG_MIN_X; px <= CH3_BLDG_MAX_X; px += 9.2) {
      this.addBox(this.exteriorGroup, 0.55, CH3_FLOOR_H * 4, 0.55, '#cbd5e1', px, CH3_FLOOR_H * 2, 2.15);
    }

    // Sloped Iconic Thai Royal-Blue School Gable Roof topping Floor 3!
    const roofY = CH3_FLOOR_H * 4 + 0.35;
    this.addBox(this.exteriorGroup, totalW + 2.4, 1.85, 5.4, '#1e3a8a', centerX, roofY + 0.85, 0.2, 0.6);
    this.addBox(this.exteriorGroup, totalW + 2.6, 0.32, 5.6, '#facc15', centerX, roofY, 0.2, 0.4);
    const bldgTitle = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 1.65),
      new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('อาคารจันทรารัตน์ (ตึกอำนวยการ 3 ชั้น)', 'ชั้น 1 หอสมุด-พักครู • ชั้น 2 ห้องเรียน • ชั้น 3 ดนตรีไทย', '#1e3a8a', '#0f172a', '#facc15') })
    );
    bldgTitle.position.set(25, roofY + 0.9, 2.95);
    this.exteriorGroup.add(bldgTitle);

    ([1, 2, 3] as FloorIndex[]).forEach((fl) => {
      const y = fl * CH3_FLOOR_H;
      // Balcony slab & safety railing
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(totalW, 0.3, 4.6),
        new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.7 })
      );
      slab.position.set(centerX, y - 0.15, 0.3);
      slab.receiveShadow = true;
      this.exteriorGroup.add(slab);

      this.addBox(this.exteriorGroup, totalW - 4.0, 0.12, 0.12, '#eab308', centerX - 2.0, y + 1.02, 2.25);
      this.addBox(this.exteriorGroup, totalW - 4.0, 0.08, 0.08, '#94a3b8', centerX - 2.0, y + 0.55, 2.25);

      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(totalW, CH3_FLOOR_H + 0.1),
        new THREE.MeshStandardMaterial({ map: fl === 3 ? darkWall : wallTex, roughness: 0.92 })
      );
      backWall.position.set(centerX, y + CH3_FLOOR_H / 2, -1.55);
      this.exteriorGroup.add(backWall);

      // Corridor fluorescent lights
      [-4, 16, 36, 52].forEach((lx, idx) => {
        const lCol = fl === 3 ? '#ff9980' : '#eef6ff';
        const pt = new THREE.PointLight(lCol, fl === 3 ? 0.95 : 2.1, 16, 1.2);
        pt.position.set(lx, y + 3.45, 0.4);
        this.exteriorGroup.add(pt);
        this.corridorLights.push({ floor: fl, light: pt, baseInt: fl === 3 ? 0.95 : 2.1, seed: fl * 10 + idx });

        const wTex = fl === 3 ? winDark : winLit;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.35), new THREE.MeshBasicMaterial({ map: wTex }));
        win.position.set(lx + 4.5, y + 2.35, -1.51);
        this.exteriorGroup.add(win);
      });
    });

    // Stairwell Ramp Steps at Right Wing (CH3_STAIR_X = +59.5) connecting Floor 0->1->2->3
    ([0, 1, 2] as FloorIndex[]).forEach((fl) => {
      const yBase = fl * CH3_FLOOR_H;
      for (let s = 0; s < 10; s++) {
        this.addBox(this.exteriorGroup, 2.4, 0.25, 1.15, '#94a3b8', CH3_STAIR_X, yBase + (s + 0.5) * (CH3_FLOOR_H / 10), 1.4 - s * 0.14);
      }
    });

    // Doors & Lockers aligned precisely to Game Interaction X!
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

    // Floor 1 Doors & Lockers
    addDoor(1, 8.0, 'หอสมุด');
    addLockerBank(1, 22.0);
    addDoor(1, 44.0, 'พักครู');
    addLockerBank(1, 52.0);

    // Floor 2 Doors & Lockers
    addDoor(2, 10.0, 'ม.5/2');
    addLockerBank(2, 24.0);
    addDoor(2, 48.0, 'ห้องน้ำ');
    addLockerBank(2, 50.0);

    // Floor 3 Thai Music Room (Double Haunted Red Doors at x = +42.0 + Red Cone Glow)
    addDoor(3, 18.0, 'เก็บชุด', true);
    addDoor(3, 42.0, 'ดนตรีไทย', true);
    const hauntedBeam = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 5.2),
      new THREE.MeshBasicMaterial({ map: createLightConeTexture('255, 65, 75'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 })
    );
    hauntedBeam.position.set(42.0, CH3_FLOOR_H * 3 + 2.1, -0.4);
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

    // Mirror reflection apparition inside Music Room!
    const mMat = this.lifeRefs.mirrorGhostMesh.material as THREE.MeshBasicMaterial;
    mMat.opacity = mirrorRevealed && !chadaReturned ? 0.85 + Math.sin(this.animClock * 4) * 0.12 : 0;
    mMat.map = this.charFrames.dancer_ghost[Math.floor(this.animClock * 3) % 2];

    const yBase = isInside ? 0 : pFloor * CH3_FLOOR_H;
    this.playerMesh.visible = !isHiding;
    this.playerShadow.visible = !isHiding;
    this.playerMesh.position.set(px, yBase + (ridingBike ? 1.15 : 0.96), pz);
    this.playerShadow.position.set(px, yBase + 0.026, pz);
    const pf = isMoving ? Math.floor(this.animClock * (ridingBike ? 11 : 8)) % 4 : 0;
    (this.playerMesh.material as THREE.MeshStandardMaterial).map = this.charFrames.peem[pf];
    this.playerMesh.scale.x = facing;

    this.flashlight.position.set(px + facing * 0.3, yBase + 1.18, pz + 0.25);
    this.flashlightTarget.position.set(px + facing * 6.5, yBase + 0.9, pz - 0.5);
    this.flashlight.intensity = flashlightOn && !isHiding ? 16.0 : 0;

    // Ghost Dancer visibility & eerie swaying dance
    const ghostVisible = showGhost && !chadaReturned && (!isInside || room === 'music_room');
    this.ghostMesh.visible = ghostVisible;
    if (ghostVisible) {
      const gy = (isInside ? 0 : ghostFloor * CH3_FLOOR_H) + 1.18 + Math.sin(this.animClock * 3.2) * 0.12;
      this.ghostMesh.position.set(ghostX, gy, 0.15);
      this.ghostMesh.scale.x = px >= ghostX ? 1 : -1;
      const mat = this.ghostMesh.material as THREE.MeshStandardMaterial;
      const gFrame = Math.floor(this.animClock * (ghostChasing ? 6 : 2.8)) % 2;
      mat.map = ghostChasing ? this.charFrames.dancer_chase[gFrame] : this.charFrames.dancer_ghost[gFrame];
      this.ghostLight.position.set(ghostX, gy + 0.4, 0.8);
      this.ghostLight.intensity = ghostChasing ? 3.5 : 1.6;
    } else {
      this.ghostLight.intensity = 0;
    }

    // Flicker Floor 3 haunted corridor lights at night!
    const isNight = hour >= 19.0 || hour < 5.5;
    this.corridorLights.forEach((cl) => {
      if (isNight && cl.floor === 3 && !chadaReturned) {
        const flk = Math.sin(this.animClock * 17 + cl.seed) > 0.65 ? 0.15 : 1.0;
        cl.light.intensity = cl.baseInt * flk;
      } else {
        cl.light.intensity = isNight ? cl.baseInt * 0.65 : cl.baseInt;
      }
    });

    animateSchoolLife(this.lifeRefs, this.charFrames, this.animClock, dt, hour, isInside);
    this.updateSkyAndRain(dt, gameMinutes, weather);

    // Smooth camera tracking
    const targetX = isInside
      ? THREE.MathUtils.clamp(px, -3.5, 3.5)
      : pFloor === 0
      ? THREE.MathUtils.clamp(px, -118, 122)
      : THREE.MathUtils.clamp(px, -7, 56);
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
