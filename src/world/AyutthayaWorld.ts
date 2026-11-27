import * as THREE from 'three';
import { Ch4CharacterKind, drawCh4CharacterCanvas } from '../art/Chapter4Sprites';
import { WeatherType } from '../types';
import { AyutthayaHorseHandle, buildAyutthayaFoliage, makeAyutthayaBoat, makeAyutthayaFigure, makeAyutthayaHorse, makeAyutthayaSignTex } from './AyutthayaArchitecture';
import { buildAyutthayaInteriors, CH4_ROOM_META, Ch4RoomId } from './AyutthayaInteriorRooms';
import { AyutthayaLandmarkHandles, buildAyutthayaLandmarks } from './AyutthayaLandmarks';

export const CH4_MIN_X = -188;
export const CH4_MAX_X = 188;

export type AyutthayaMood = 'prosperous' | 'plague' | 'riot' | 'climax';

export interface AyutthayaEnemyView {
  id: string;
  kind: 'phee_ha' | 'bandit' | 'suea_kham';
  x: number;
  z: number;
  dir: 1 | -1;
  hp: number;
  maxHp: number;
  alive: boolean;
  mesh: THREE.Group;
  hpFill: THREE.Mesh;
  wounds: THREE.Mesh[];
  flashTimer: number;
  windUp: number;
  stunTimer: number;
}

export interface AyutthayaSurvivorView {
  id: string;
  name: string;
  x: number;
  hp: number;
  maxHp: number;
  rescued: boolean;
  alive: boolean;
  underAttack: boolean;
  mesh: THREE.Group;
  hpFill: THREE.Mesh;
}

export interface AyutthayaFireView {
  id: string;
  label: string;
  x: number;
  active: boolean;
  extinguished: boolean;
  group: THREE.Group;
  light: THREE.PointLight;
}

export interface AyutthayaProjectileView {
  x: number;
  y: number;
  vx: number;
  active: boolean;
  mesh: THREE.Mesh;
}

export class AyutthayaWorld {
  private scene: THREE.Scene;
  private exteriorGroup: THREE.Group;
  private roomGroups: Partial<Record<Ch4RoomId, THREE.Group>> = {};
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private torchLight: THREE.PointLight;

  private landmarks: AyutthayaLandmarkHandles;
  private charFrames: Record<Ch4CharacterKind, THREE.CanvasTexture[]> = {
    man: [],
    smith: [],
    phudsorn: [],
    noble: [],
    khun_ram: [],
    monk_khong: [],
    child_kla: [],
    villager: [],
    bandit: [],
    suea_kham: [],
    phee_ha: [],
    narrator: [],
  };

  private playerMesh: THREE.Mesh;
  private playerShadow: THREE.Mesh;
  private playerBoat: { group: THREE.Group; oarL?: THREE.Group; oarR?: THREE.Group };
  private dockedPierBoat: THREE.Group;
  private playerHorse: AyutthayaHorseHandle;
  private parkedHorse: AyutthayaHorseHandle;
  private playerTorchGroup: THREE.Group;
  private playerTorchFlame: THREE.Mesh;
  private playerSwordMesh: THREE.Group;
  private slashArcMesh: THREE.Mesh;
  private slashTimer = 0;
  private slashDir = 1;
  private swordSwingTimer = 0;
  private swordComboStep = 1;
  private parryShieldMesh: THREE.Mesh;
  private parryShieldTimer = 0;
  private cameraShake = 0;
  private fxParticles: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];
  private bloodPools: { mesh: THREE.Mesh; life: number }[] = [];

  private riverTraders: { group: THREE.Group; oarL?: THREE.Group; oarR?: THREE.Group; x: number; dir: 1 | -1; speed: number; z: number }[] = [];
  private trainingDummy: THREE.Group;
  private dummyHitTimer = 0;

  private npcMeshes: Record<string, THREE.Mesh> = {};
  private enemyViews: AyutthayaEnemyView[] = [];
  private survivorViews: AyutthayaSurvivorView[] = [];
  private fireViews: AyutthayaFireView[] = [];
  private projectilePool: AyutthayaProjectileView[] = [];

  private rainSystem: THREE.LineSegments;
  private smokePlumes: THREE.Mesh[] = [];
  private skyCanvas: HTMLCanvasElement;
  private skyTex: THREE.CanvasTexture;
  private skyPlane: THREE.Mesh;
  private lastSkyKey = '';
  private celestialOrb: THREE.Mesh;
  private celestialGlow: THREE.Mesh;
  private cloudMat: THREE.MeshStandardMaterial;
  private cloudClusters: { group: THREE.Group; x: number; speed: number; baseY: number }[] = [];
  private animClock = 0;
  private zoomFactor = 1.0;
  private targetCamZ = 14.2;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#2d241c');
    this.scene.fog = new THREE.FogExp2('#2d241c', 0.011);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 130);
    this.camera.position.set(-84, 2.4, 14.2);

    const isMobileOrTablet = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobileOrTablet,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileOrTablet ? 1.0 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.hemiLight = new THREE.HemisphereLight('#bae6fd', '#443222', 0.68);
    this.sunLight = new THREE.DirectionalLight('#fff1d6', 2.05);
    this.sunLight.position.set(-66, 26, 20);
    this.sunLight.target.position.set(-84, 0, -2);
    this.sunLight.castShadow = true;
    const smRes = isMobileOrTablet ? 1024 : 2048;
    this.sunLight.shadow.mapSize.set(smRes, smRes);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 85;
    this.sunLight.shadow.camera.left = -30;
    this.sunLight.shadow.camera.right = 30;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -16;
    this.sunLight.shadow.bias = -0.0007;
    this.sunLight.shadow.normalBias = 0.025;

    this.fillLight = new THREE.DirectionalLight('#93c5fd', 0.42);
    this.fillLight.position.set(-20, 12, -16);
    this.scene.add(this.hemiLight, this.sunLight, this.sunLight.target, this.fillLight);

    this.torchLight = new THREE.PointLight('#fb923c', 0, 14, 1.1);
    this.torchLight.position.set(-46, 1.7, 1.4);
    this.scene.add(this.torchLight);

    // Dynamic Gradient Sky Backdrop, Sun/Moon Halo & Drifting Puffy 3D Clouds!
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 16;
    this.skyCanvas.height = 128;
    this.skyTex = new THREE.CanvasTexture(this.skyCanvas);
    this.exteriorGroup = new THREE.Group();
    this.scene.add(this.exteriorGroup);

    this.skyTex.colorSpace = THREE.SRGBColorSpace;
    this.skyPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(460, 120),
      new THREE.MeshBasicMaterial({ map: this.skyTex, depthWrite: false, fog: false })
    );
    this.skyPlane.position.set(0, 32, -38);
    this.exteriorGroup.add(this.skyPlane);

    this.celestialOrb = new THREE.Mesh(
      new THREE.CircleGeometry(3.6, 20),
      new THREE.MeshBasicMaterial({ color: '#fef08a', fog: false })
    );
    this.celestialGlow = new THREE.Mesh(
      new THREE.CircleGeometry(9.5, 20),
      new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.25, fog: false, depthWrite: false })
    );
    this.celestialOrb.position.set(-40, 22, -35);
    this.celestialGlow.position.set(-40, 22, -35.5);
    this.exteriorGroup.add(this.celestialOrb, this.celestialGlow);

    this.cloudMat = new THREE.MeshStandardMaterial({ color: '#fffbf0', roughness: 0.96, metalness: 0.0, fog: false });
    for (let ci = 0; ci < 18; ci++) {
      const cg = new THREE.Group();
      const scale = 0.85 + (ci % 4) * 0.35;
      [
        [0, 0, 0, 1.4],
        [-1.3, -0.2, 0.2, 1.05],
        [1.35, -0.15, -0.2, 1.1],
        [-0.5, 0.65, 0.1, 1.0],
        [0.65, 0.55, 0.15, 0.95],
      ].forEach(([ox, oy, oz, rad]) => {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), this.cloudMat);
        puff.scale.set(1.35, 0.72, 0.8);
        puff.position.set(ox * scale, oy * scale, oz * scale);
        cg.add(puff);
      });
      const cx = -185 + ci * 22;
      const cy = 8.4 + (ci % 4) * 1.65;
      const cz = -19 - (ci % 3) * 4.5;
      cg.position.set(cx, cy, cz);
      this.exteriorGroup.add(cg);
      this.cloudClusters.push({ group: cg, x: cx, speed: 0.45 + (ci % 3) * 0.22, baseY: cy });
    }

    this.initSprites();
    this.landmarks = buildAyutthayaLandmarks(this.exteriorGroup);
    buildAyutthayaFoliage(this.exteriorGroup);
    this.roomGroups = buildAyutthayaInteriors(this.scene);

    // Enable authentic cast & receive shadows across Ayutthaya exterior & interior architecture
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        const isGroundOrWater = obj.geometry instanceof THREE.PlaneGeometry;
        obj.receiveShadow = true;
        obj.castShadow = !isGroundOrWater;
      }
    });

    // Street / pier torches spanning all 380m of Ayutthaya neighborhoods
    [-168, -146, -124, -100, -82, -56, -38, -14, 10, 26, 46, 66, 94, 125, 143, 178].forEach((tx) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 2.35, 6),
        new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 })
      );
      post.position.set(tx, 1.18, 2.25);
      const cup = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 6), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
      cup.position.set(tx, 2.42, 2.25);
      this.exteriorGroup.add(post, cup);
    });

    // Ambient Ayutthaya river merchant boats rowing along Chao Phraya canal
    [
      { x: -155, dir: 1 as const, z: 5.9, speed: 2.2, shirt: '#dc2626' },
      { x: -45, dir: -1 as const, z: 6.9, speed: 2.6, shirt: '#0284c7' },
      { x: 90, dir: 1 as const, z: 6.1, speed: 2.1, shirt: '#ca8a04' },
    ].forEach((rb) => {
      const boat = makeAyutthayaBoat(4.2, true, rb.shirt);
      boat.group.position.set(rb.x, -0.14, rb.z);
      boat.group.scale.x = rb.dir;
      this.exteriorGroup.add(boat.group);
      this.riverTraders.push({ group: boat.group, oarL: boat.oarL, oarR: boat.oarR, ...rb });
    });

    // Straw combat training dummy beside Blacksmith Forge (x = -77.5)
    this.trainingDummy = new THREE.Group();
    this.trainingDummy.position.set(-77.5, 0, -0.85);
    const dPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.15, 6), new THREE.MeshStandardMaterial({ color: '#5c3a21' }));
    dPost.position.y = 1.08;
    const dBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.95, 8), new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.95 }));
    dBody.position.y = 1.2;
    const dArm = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: '#a16207' }));
    dArm.position.y = 1.38;
    const dSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.35),
      new THREE.MeshBasicMaterial({ map: makeAyutthayaSignTex('#451a03', '#facc15', '#ffffff', 'หุ่นซ้อมดาบ [F]') })
    );
    dSign.position.set(0, 2.02, 0.1);
    this.trainingDummy.add(dPost, dBody, dArm, dSign);
    this.exteriorGroup.add(this.trainingDummy);

    // Docked spare boat neatly moored beside Blacksmith River Pier & Player's navigable Boat
    this.dockedPierBoat = makeAyutthayaBoat(3.9, false).group;
    this.dockedPierBoat.position.set(-83.6, -0.14, 5.65);
    this.exteriorGroup.add(this.dockedPierBoat);

    this.playerBoat = makeAyutthayaBoat(4.1, false);
    this.playerBoat.group.position.set(-83.6, -0.14, 5.65);
    this.playerBoat.group.visible = false;
    this.exteriorGroup.add(this.playerBoat.group);

    // Protagonist's own loyal Chestnut War Horse (parked by Blacksmith & mounted cleanly when riding!)
    this.parkedHorse = makeAyutthayaHorse('#7c2d12');
    this.parkedHorse.group.position.set(-86.5, 0, -0.4);
    this.exteriorGroup.add(this.parkedHorse.group);

    this.playerHorse = makeAyutthayaHorse('#7c2d12');
    this.playerHorse.group.position.set(-84, 0, 0.85);
    this.playerHorse.group.visible = false;
    this.exteriorGroup.add(this.playerHorse.group);

    const shadowTex = this.createShadowTex();
    this.playerMesh = this.makeSpriteMesh(this.charFrames.man[0], 1.5, 2.2);
    this.playerMesh.position.set(-84, 0.95, 0.85);
    this.playerShadow = this.makeShadow(shadowTex);
    this.playerShadow.position.set(-84, 0.02, 0.85);
    this.scene.add(this.playerMesh, this.playerShadow);

    // Visible 3D held flaming resin torch (ไต้ไฟถือในมือ) & optional held Ayutthaya steel sword!
    this.playerTorchGroup = new THREE.Group();
    const tStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.025, 0.56, 6),
      new THREE.MeshStandardMaterial({ color: '#5c3a21', roughness: 0.9 })
    );
    tStick.rotation.z = -0.32;
    const tWrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.14, 7),
      new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.95 })
    );
    tWrap.position.set(0.08, 0.24, 0);
    tWrap.rotation.z = -0.32;
    this.playerTorchFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.24, 7),
      new THREE.MeshBasicMaterial({ color: '#fb923c' })
    );
    this.playerTorchFlame.position.set(0.11, 0.38, 0);
    const tCore = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.15, 6), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    tCore.position.y = -0.02;
    this.playerTorchFlame.add(tCore);
    this.playerTorchGroup.add(tStick, tWrap, this.playerTorchFlame);
    this.playerTorchGroup.visible = false;
    this.scene.add(this.playerTorchGroup);

    this.playerSwordMesh = new THREE.Group();
    const sHilt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: '#eab308' }));
    const sBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.62, 0.025),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.72, roughness: 0.25 })
    );
    sBlade.position.set(0.06, 0.3, 0);
    sBlade.rotation.z = -0.25;
    this.playerSwordMesh.add(sHilt, sBlade);
    this.playerSwordMesh.visible = false;
    this.scene.add(this.playerSwordMesh);

    // Sword slash effect arc + parry guard shield + particle & blood pool FX + arrow pool
    this.slashArcMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 1.25, 14, 1, -0.9, 2.0),
      new THREE.MeshBasicMaterial({ color: '#fef08a', side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    this.slashArcMesh.visible = false;
    this.scene.add(this.slashArcMesh);

    this.parryShieldMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.88, 16),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    this.parryShieldMesh.visible = false;
    this.scene.add(this.parryShieldMesh);

    const dropGeo = new THREE.SphereGeometry(0.065, 6, 6);
    for (let i = 0; i < 36; i++) {
      const m = new THREE.Mesh(dropGeo, new THREE.MeshBasicMaterial({ color: '#dc2626' }));
      m.visible = false;
      this.scene.add(m);
      this.fxParticles.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.5 });
    }

    const poolGeo = new THREE.CircleGeometry(0.42, 10);
    for (let i = 0; i < 14; i++) {
      const pm = new THREE.Mesh(
        poolGeo,
        new THREE.MeshBasicMaterial({ color: '#7f1d1d', transparent: true, opacity: 0.78, depthWrite: false })
      );
      pm.rotation.x = -Math.PI / 2;
      pm.visible = false;
      this.scene.add(pm);
      this.bloodPools.push({ mesh: pm, life: 0 });
    }

    for (let i = 0; i < 8; i++) {
      const aMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.72, 6),
        new THREE.MeshBasicMaterial({ color: '#fde68a' })
      );
      aMesh.rotation.z = Math.PI / 2;
      aMesh.visible = false;
      this.scene.add(aMesh);
      this.projectilePool.push({ x: 0, y: 1.1, vx: 0, active: false, mesh: aMesh });
    }

    // Core story NPCs across the 380m Ayutthaya Kingdom
    const npcDefs: { id: string; kind: Ch4CharacterKind; x: number; z: number }[] = [
      { id: 'smith', kind: 'smith', x: -81.5, z: -0.9 },
      { id: 'phudsorn', kind: 'phudsorn', x: -157, z: -0.9 },
      { id: 'noble', kind: 'noble', x: -38, z: -0.85 },
      { id: 'khun_ram', kind: 'khun_ram', x: 11.5, z: -0.85 },
      { id: 'monk_khong', kind: 'monk_khong', x: 136, z: -1.1 },
      { id: 'child_kla', kind: 'child_kla', x: -102, z: -0.8 },
    ];
    npcDefs.forEach((n) => {
      const m = this.makeSpriteMesh(this.charFrames[n.kind][0], 1.48, 2.15);
      m.position.set(n.x, 0.94, n.z);
      this.exteriorGroup.add(m);
      this.npcMeshes[n.id] = m;
    });

    // City Arson Fires (4 district flashpoints during riot)
    this.fireViews = [
      { id: 'fire_market', label: 'เพลิงไหม้ตลาดน้ำอโยธยา', x: -157 },
      { id: 'fire_village', label: 'เพลิงไหม้ชุมชนเรือนไทย', x: -100 },
      { id: 'fire_noble', label: 'เพลิงไหม้บ้านขุนนาง', x: -38 },
      { id: 'fire_gate', label: 'เพลิงไหม้ประตูชัย & หน้าวัง', x: 14 },
    ].map((fd) => {
      const fg = new THREE.Group();
      fg.position.set(fd.x, 0, -1.35);
      [-0.6, 0, 0.65].forEach((ox, oi) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.45 + oi * 0.08, 1.8 + (oi % 2) * 0.5, 7),
          new THREE.MeshBasicMaterial({ color: oi === 1 ? '#fde047' : '#f97316', transparent: true, opacity: 0.9 })
        );
        cone.position.set(ox, 0.95, 0);
        fg.add(cone);
      });
      const flLight = new THREE.PointLight('#fb923c', 0, 14, 1.1);
      flLight.position.set(0, 1.8, 0.6);
      fg.add(flLight);
      fg.visible = false;
      this.exteriorGroup.add(fg);
      return { id: fd.id, label: fd.label, x: fd.x, active: false, extinguished: false, group: fg, light: flLight };
    });

    // Floating background smoke clouds during city riot
    for (let i = 0; i < 6; i++) {
      const sm = new THREE.Mesh(
        new THREE.SphereGeometry(1.1 + (i % 2) * 0.4, 7, 6),
        new THREE.MeshBasicMaterial({ color: '#1c1917', transparent: true, opacity: 0.35 })
      );
      sm.position.set(-90 + i * 38, 4.8, -5.5);
      sm.visible = false;
      this.exteriorGroup.add(sm);
      this.smokePlumes.push(sm);
    }

    // Rain particle system (used if weather transitions)
    const rPos: number[] = [];
    for (let i = 0; i < 420; i++) {
      const rx = (Math.random() - 0.5) * 44;
      const ry = Math.random() * 14;
      const rz = (Math.random() - 0.5) * 14;
      rPos.push(rx, ry, rz, rx - 0.14, ry - 0.85, rz);
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
    this.rainSystem = new THREE.LineSegments(
      rGeo,
      new THREE.LineBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.36 })
    );
    this.rainSystem.visible = false;
    this.exteriorGroup.add(this.rainSystem);

    // Optimize static PointLights once on mobile/tablet (ZERO per-frame light .visible changes!)
    if (isMobileOrTablet) {
      let keep = 0;
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.PointLight && obj !== this.torchLight && !this.fireViews.some((f) => f.light === obj)) {
          if (keep % 2 !== 0) obj.visible = false;
          keep++;
        }
      });
      this.hemiLight.intensity += 0.18;
    }

    this.updateCameraFraming(true);
  }

  private initSprites(): void {
    const kinds: Ch4CharacterKind[] = [
      'man',
      'smith',
      'phudsorn',
      'noble',
      'khun_ram',
      'monk_khong',
      'child_kla',
      'villager',
      'bandit',
      'suea_kham',
      'phee_ha',
      'narrator',
    ];
    kinds.forEach((k) => {
      for (let f = 0; f < 4; f++) {
        const c = document.createElement('canvas');
        c.width = 96;
        c.height = 128;
        drawCh4CharacterCanvas(c.getContext('2d')!, k, f, 96, 128);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        this.charFrames[k].push(tex);
      }
    });
  }

  private createShadowTex(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 16, 2, 32, 16, 28);
    g.addColorStop(0, 'rgba(0,0,0,0.6)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 32);
    return new THREE.CanvasTexture(c);
  }

  private makeShadow(tex: THREE.CanvasTexture): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.42),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  private makeSpriteMesh(tex: THREE.CanvasTexture, w: number, h: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.25, roughness: 0.85, side: THREE.DoubleSide })
    );
  }

  private createHpBarMesh(color: string): { barGrp: THREE.Group; fill: THREE.Mesh } {
    const barGrp = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.12), new THREE.MeshBasicMaterial({ color: '#09090b' }));
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.08), new THREE.MeshBasicMaterial({ color }));
    fill.position.z = 0.01;
    barGrp.add(bg, fill);
    return { barGrp, fill };
  }

  /** Spawns visible 3D enemy group (Phee Ha undead or Bandit) with overhead HP bar. */
  public addEnemyVisual(id: string, kind: 'phee_ha' | 'bandit' | 'suea_kham', x: number, hp: number): AyutthayaEnemyView {
    const shirt = kind === 'phee_ha' ? '#57534e' : kind === 'suea_kham' ? '#18181b' : '#27272a';
    const jong = kind === 'phee_ha' ? '#3f3f46' : '#7f1d1d';
    const fig = makeAyutthayaFigure(shirt, jong, {
      isZombie: kind === 'phee_ha',
      headbandCol: kind !== 'phee_ha' ? '#dc2626' : undefined,
      hasSword: kind !== 'phee_ha',
    });
    if (kind === 'suea_kham') fig.scale.setScalar(1.16);
    const { barGrp, fill } = this.createHpBarMesh('#ef4444');
    barGrp.position.y = kind === 'suea_kham' ? 2.15 : 1.95;
    fig.add(barGrp);

    // 3 visible crimson slash wound decals revealed progressively as zombie/bandit takes sword hits!
    const woundMat1 = new THREE.MeshBasicMaterial({ color: '#b91c1c' });
    const woundMat2 = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const wChest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.048, 0.36), woundMat1);
    wChest.position.set(0, 1.12, 0.02);
    wChest.rotation.z = 0.55;
    const wBelly = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.052, 0.36), woundMat2);
    wBelly.position.set(0, 0.88, 0.02);
    wBelly.rotation.z = -0.48;
    const wFace = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.038, 0.31), woundMat1);
    wFace.position.set(0.02, 1.44, 0.02);
    wFace.rotation.z = 0.65;
    const wounds = [wChest, wBelly, wFace];
    wounds.forEach((w) => {
      w.visible = false;
      fig.add(w);
    });

    fig.position.set(x, 0, 0.55);
    this.scene.add(fig);

    const view: AyutthayaEnemyView = {
      id,
      kind,
      x,
      z: 0.55,
      dir: -1,
      hp,
      maxHp: hp,
      alive: true,
      mesh: fig,
      hpFill: fill,
      wounds,
      flashTimer: 0,
      windUp: 0,
      stunTimer: 0,
    };
    this.enemyViews.push(view);
    return view;
  }

  /** Spawns a visible 3D survivor villager with overhead green HP bar. */
  public addSurvivorVisual(id: string, name: string, kind: Ch4CharacterKind, x: number): AyutthayaSurvivorView {
    const colMap: Record<string, [string, string]> = {
      phudsorn: ['#be185d', '#4c1d95'],
      smith: ['#44403c', '#292524'],
      child_kla: ['#f59e0b', '#365314'],
      villager: ['#64748b', '#1e293b'],
    };
    const [s, j] = colMap[kind] ?? colMap.villager;
    const fig = makeAyutthayaFigure(s, j);
    if (kind === 'child_kla') fig.scale.setScalar(0.8);
    const { barGrp, fill } = this.createHpBarMesh('#22c55e');
    barGrp.position.y = 1.92;
    fig.add(barGrp);
    fig.position.set(x, 0, -0.25);
    this.scene.add(fig);

    const view: AyutthayaSurvivorView = {
      id,
      name,
      x,
      hp: 100,
      maxHp: 100,
      rescued: false,
      alive: true,
      underAttack: false,
      mesh: fig,
      hpFill: fill,
    };
    this.survivorViews.push(view);
    return view;
  }

  public clearDynamicActors(): void {
    this.enemyViews.forEach((e) => this.scene.remove(e.mesh));
    this.survivorViews.forEach((s) => this.scene.remove(s.mesh));
    this.enemyViews = [];
    this.survivorViews = [];
  }

  public getEnemyViews(): AyutthayaEnemyView[] {
    return this.enemyViews;
  }

  public getSurvivorViews(): AyutthayaSurvivorView[] {
    return this.survivorViews;
  }

  public getFireViews(): AyutthayaFireView[] {
    return this.fireViews;
  }

  public triggerSwordSlash(playerX: number, facing: 1 | -1, comboStep = 1, buffed = false): void {
    this.slashTimer = comboStep === 3 ? 0.32 : 0.22;
    this.swordSwingTimer = 0.24;
    this.swordComboStep = comboStep;
    this.slashDir = facing;
    const scale = comboStep === 3 ? 1.55 : comboStep === 2 ? 1.22 : 1.05;
    this.slashArcMesh.position.set(playerX + facing * 1.05, 1.08, 0.9);
    this.slashArcMesh.scale.set(facing * scale, scale, 1);
    (this.slashArcMesh.material as THREE.MeshBasicMaterial).color.set(
      comboStep === 3 ? '#f97316' : buffed ? '#fde047' : '#fef9c3'
    );
    this.slashArcMesh.visible = true;
    if (buffed) this.spawnParticles(playerX + facing * 0.9, 1.1, 0.85, 5, '#fde047', facing);
    if (Math.abs(playerX - -77.5) < 3.0) {
      this.dummyHitTimer = 0.55;
      this.spawnParticles(-77.5, 1.25, -0.8, 6, '#facc15', facing);
    }
  }

  private spawnParticles(x: number, y: number, z: number, count: number, colorHex: string, dirX: number): void {
    let spawned = 0;
    for (const p of this.fxParticles) {
      if (p.life > 0) continue;
      p.life = 0.35 + Math.random() * 0.25;
      p.maxLife = p.life;
      p.mesh.position.set(x, y, z);
      (p.mesh.material as THREE.MeshBasicMaterial).color.set(colorHex);
      p.mesh.scale.setScalar(0.75 + Math.random() * 0.85);
      p.mesh.visible = true;
      p.vx = dirX * (2.5 + Math.random() * 4.5) + (Math.random() - 0.5) * 2.5;
      p.vy = 2.2 + Math.random() * 4.0;
      p.vz = (Math.random() - 0.5) * 2.4;
      spawned++;
      if (spawned >= count) break;
    }
  }

  public triggerHitImpact(x: number, dirX: number, isCrit = false, enemyKilled = false): void {
    this.spawnParticles(x, 1.15, 0.65, isCrit ? 14 : 8, '#dc2626', dirX);
    this.spawnParticles(x, 1.2, 0.72, isCrit ? 8 : 4, '#fef08a', -dirX);
    this.cameraShake = Math.max(this.cameraShake, isCrit ? 0.32 : 0.16);

    const slot = this.bloodPools.find((bp) => bp.life <= 0) ?? this.bloodPools[0];
    slot.life = enemyKilled ? 22 : 12;
    slot.mesh.position.set(x + dirX * 0.25, 0.032, 0.52 + (Math.random() - 0.5) * 0.3);
    slot.mesh.scale.setScalar(enemyKilled ? 1.55 : isCrit ? 1.15 : 0.78);
    (slot.mesh.material as THREE.MeshBasicMaterial).opacity = enemyKilled ? 0.82 : 0.58;
    slot.mesh.visible = true;
  }

  public triggerParryGuard(x: number, dirX: number, blockedHit = false): void {
    this.parryShieldTimer = 0.38;
    this.parryShieldMesh.position.set(x + dirX * 0.65, 1.12, 0.92);
    (this.parryShieldMesh.material as THREE.MeshBasicMaterial).color.set(blockedHit ? '#facc15' : '#38bdf8');
    this.parryShieldMesh.visible = true;
    if (blockedHit) {
      this.spawnParticles(x + dirX * 0.65, 1.2, 0.9, 10, '#facc15', dirX);
      this.cameraShake = Math.max(this.cameraShake, 0.24);
    }
  }

  public triggerPlayerHurt(x: number, dirX: number): void {
    this.spawnParticles(x, 1.05, 0.85, 10, '#ef4444', dirX);
    this.cameraShake = Math.max(this.cameraShake, 0.28);
  }

  public spawnArrowProjectile(playerX: number, dir: 1 | -1): AyutthayaProjectileView | null {
    const slot = this.projectilePool.find((p) => !p.active);
    if (!slot) return null;
    slot.active = true;
    slot.x = playerX + dir * 0.6;
    slot.y = 1.05;
    slot.vx = dir * 18.5;
    slot.mesh.position.set(slot.x, slot.y, 0.85);
    slot.mesh.visible = true;
    return slot;
  }

  public getProjectiles(): AyutthayaProjectileView[] {
    return this.projectilePool;
  }

  public update(
    dt: number,
    playerX: number,
    playerFacing: 1 | -1,
    isMoving: boolean,
    isRowing: boolean,
    isRidingHorse: boolean,
    torchOn: boolean,
    hasSword: boolean,
    gameMinutes: number,
    weather: WeatherType,
    mood: AyutthayaMood,
    room: Ch4RoomId = 'outside'
  ): void {
    this.animClock += dt;
    const hr = (gameMinutes % 1440) / 60;
    const isNight = hr >= 18.5 || hr < 5.5;
    const isInside = room !== 'outside';

    this.exteriorGroup.visible = !isInside;
    (Object.keys(this.roomGroups) as Ch4RoomId[]).forEach((rid) => {
      const grp = this.roomGroups[rid];
      if (grp) grp.visible = rid === room;
    });

    // Dynamic Sky Gradient, Sun/Moon Arc, Drifting Clouds & Natural Rain/Wind Weather!
    const topCol =
      weather === 'storm'
        ? '#0f172a'
        : mood === 'riot'
          ? '#1c0b0a'
          : isNight
            ? '#080e24'
            : hr >= 16.5
              ? '#242b52'
              : '#1e4e79';
    const midCol =
      weather === 'storm' || mood === 'plague'
        ? '#334155'
        : mood === 'riot'
          ? '#4c1d12'
          : isNight
            ? '#132042'
            : hr >= 16.5
              ? '#9a4332'
              : '#4a8ab5';
    const horCol =
      weather === 'storm' || weather === 'rain'
        ? '#475569'
        : mood === 'riot'
          ? '#9a3412'
          : isNight
            ? '#1c2c4c'
            : hr >= 16.5
              ? '#f59e0b'
              : '#bae6fd';
    const skyKey = `${topCol}_${midCol}_${horCol}`;
    if (skyKey !== this.lastSkyKey) {
      this.lastSkyKey = skyKey;
      const sctx = this.skyCanvas.getContext('2d')!;
      const gr = sctx.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, topCol);
      gr.addColorStop(0.55, midCol);
      gr.addColorStop(1, horCol);
      sctx.fillStyle = gr;
      sctx.fillRect(0, 0, 16, 128);
      this.skyTex.needsUpdate = true;
    }

    (this.scene.background as THREE.Color).lerp(new THREE.Color(horCol), Math.min(1, dt * 1.4));
    (this.scene.fog as THREE.FogExp2).color.copy(this.scene.background as THREE.Color);
    (this.scene.fog as THREE.FogExp2).density =
      weather === 'rain' || weather === 'storm' ? 0.015 : mood === 'prosperous' ? 0.0075 : 0.014;

    // Update Celestial Sun/Moon position & cloud lighting tint
    const skyX = this.camera.position.x;
    this.skyPlane.position.x = skyX;
    const sunT = Math.max(0, Math.min(1, isNight ? (hr >= 18.5 ? hr - 18.5 : hr + 5.5) / 11 : (hr - 5.5) / 13));
    const orbX = skyX + (sunT - 0.5) * 40;
    const orbY = 9.5 + Math.sin(sunT * Math.PI) * 7.8;
    this.celestialOrb.position.set(orbX, orbY, -35);
    this.celestialGlow.position.set(orbX, orbY, -35.5);
    (this.celestialOrb.material as THREE.MeshBasicMaterial).color.set(
      isNight ? '#e2e8f0' : hr >= 16.5 ? '#fb923c' : '#fef08a'
    );
    (this.celestialGlow.material as THREE.MeshBasicMaterial).opacity = weather === 'storm' ? 0.06 : isNight ? 0.18 : 0.28;

    const windMult = weather === 'windy' ? 2.4 : weather === 'storm' ? 3.2 : weather === 'rain' ? 1.8 : 1.0;
    const cloudCol =
      weather === 'storm' || weather === 'rain'
        ? '#64748b'
        : mood === 'riot'
          ? '#b45309'
          : isNight
            ? '#334155'
            : hr >= 16.5
              ? '#fed7aa'
              : '#fffdf7';
    this.cloudMat.color.lerp(new THREE.Color(cloudCol), Math.min(1, dt * 2.0));
    this.cloudClusters.forEach((cl) => {
      cl.x += cl.speed * windMult * dt;
      if (cl.x > CH4_MAX_X + 20) cl.x = CH4_MIN_X - 20;
      cl.group.position.x = cl.x;
      cl.group.position.y = cl.baseY + Math.sin(this.animClock * 0.4 + cl.x * 0.05) * 0.25;
    });

    this.hemiLight.intensity = mood === 'prosperous' && !isNight ? 0.68 : mood === 'riot' ? 0.56 : 0.48;
    this.sunLight.intensity = weather === 'storm' ? 0.55 : isNight ? 0.48 : mood === 'prosperous' ? 2.1 : 1.05;
    this.sunLight.color.set(isNight ? '#93c5fd' : hr >= 16.5 ? '#fdba74' : '#fff1d6');
    this.sunLight.position.set(this.camera.position.x + (sunT - 0.5) * 26 + 10, 24, 20);
    this.sunLight.target.position.set(this.camera.position.x, 0, -2);
    this.fillLight.intensity = isNight ? 0.25 : 0.42;

    // Update protagonist sprite (seated inside boat gunwales, standing on shore, or galloping horse)
    const playerZ = isRowing ? 5.18 : 0.85;
    const gallopBob = isRidingHorse && isMoving ? Math.abs(Math.sin(this.animClock * 11)) * 0.08 : 0;
    const playerY = isRowing
      ? 0.72 + Math.sin(this.animClock * 4.0) * 0.035
      : isRidingHorse
        ? 1.72 + gallopBob
        : 0.95;
    this.playerMesh.position.set(playerX, playerY, playerZ);
    this.playerShadow.position.set(playerX, isInside ? 0.048 : 0.02, playerZ);
    this.playerShadow.visible = !isRowing;

    const frame = isMoving && !isRidingHorse ? Math.floor(this.animClock * (isRowing ? 6 : 9)) % 4 : 0;
    const pMat = this.playerMesh.material as THREE.MeshStandardMaterial;
    pMat.map = this.charFrames.man[frame];
    this.playerMesh.scale.x = playerFacing;

    // Player's controllable wooden rowing boat with sweeping oars & chestnut horse
    this.playerBoat.group.visible = isRowing;
    this.dockedPierBoat.visible = !isRowing;
    if (isRowing) {
      this.playerBoat.group.position.set(playerX, -0.14 + Math.sin(this.animClock * 3.5) * 0.035, 5.2);
      this.playerBoat.group.scale.x = playerFacing;
      const pSweep = isMoving ? Math.sin(this.animClock * 5.2) * 0.5 : 0.08;
      if (this.playerBoat.oarL) this.playerBoat.oarL.rotation.z = pSweep;
      if (this.playerBoat.oarR) this.playerBoat.oarR.rotation.z = pSweep;
    }

    this.playerHorse.group.visible = isRidingHorse && !isRowing;
    this.parkedHorse.group.visible = !isRidingHorse;
    if (this.playerHorse.group.visible) {
      this.playerHorse.group.position.set(playerX, gallopBob * 0.45, playerZ - 0.06);
      this.playerHorse.group.scale.x = playerFacing;
      const gSwing = isMoving ? Math.sin(this.animClock * 12) * 0.56 : 0;
      this.playerHorse.legs.forEach((leg, li) => {
        leg.rotation.z = li === 0 || li === 3 ? gSwing : -gSwing;
      });
    }

    this.torchLight.intensity = torchOn ? 3.1 + Math.sin(this.animClock * 16) * 0.45 : 0;
    this.torchLight.position.set(playerX + playerFacing * 0.48, playerY + 0.5, playerZ - 0.15);

    this.playerTorchGroup.visible = torchOn;
    if (torchOn) {
      this.playerTorchGroup.position.set(playerX + playerFacing * 0.36, playerY + 0.02, playerZ + 0.16);
      this.playerTorchGroup.scale.x = playerFacing;
      this.playerTorchFlame.scale.setScalar(0.88 + Math.sin(this.animClock * 20) * 0.16);
    }

    this.playerSwordMesh.visible = hasSword && !isRowing;
    if (this.playerSwordMesh.visible) {
      this.playerSwordMesh.position.set(playerX - playerFacing * 0.28, playerY - 0.08, playerZ + 0.12);
      this.playerSwordMesh.scale.x = playerFacing;
      if (this.swordSwingTimer > 0) {
        this.swordSwingTimer -= dt;
        const p = 1 - Math.max(0, this.swordSwingTimer) / 0.24;
        const swingAngle = this.swordComboStep === 2 ? 1.4 - p * 2.5 : -0.9 + p * 2.6;
        this.playerSwordMesh.rotation.z = -swingAngle;
        this.playerSwordMesh.position.x = playerX + playerFacing * (0.28 + Math.sin(p * Math.PI) * 0.35);
      } else {
        this.playerSwordMesh.rotation.z = 0;
      }
    }

    if (this.slashTimer > 0) {
      this.slashTimer -= dt;
      this.slashArcMesh.position.set(playerX + this.slashDir * 1.05, 1.08, playerZ);
      const twist = this.swordComboStep === 2 ? -0.7 + this.slashTimer * 5.2 : 0.7 - this.slashTimer * 5.2;
      this.slashArcMesh.rotation.z = this.slashDir * twist;
      if (this.slashTimer <= 0) this.slashArcMesh.visible = false;
    }
    if (this.parryShieldTimer > 0) {
      this.parryShieldTimer -= dt;
      this.parryShieldMesh.position.set(playerX + playerFacing * 0.65, playerY + 0.14, playerZ + 0.1);
      this.parryShieldMesh.scale.setScalar(1 + (0.38 - this.parryShieldTimer) * 1.1);
      if (this.parryShieldTimer <= 0) this.parryShieldMesh.visible = false;
    }

    // Update blood/spark particles & ground blood pools
    for (const p of this.fxParticles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vy -= 14.5 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.life <= 0 || p.mesh.position.y <= 0.03) {
        p.life = 0;
        p.mesh.visible = false;
      }
    }
    for (const bp of this.bloodPools) {
      if (bp.life <= 0) continue;
      bp.life -= dt;
      (bp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.75, bp.life * 0.08);
      if (bp.life <= 0) bp.mesh.visible = false;
    }
    if (this.dummyHitTimer > 0) {
      this.dummyHitTimer -= dt;
      this.trainingDummy.rotation.z = Math.sin(this.animClock * 26) * 0.25 * this.dummyHitTimer;
    } else {
      this.trainingDummy.rotation.z = 0;
    }

    // River boats with proper facing & sweeping wooden oars
    this.riverTraders.forEach((rb, ri) => {
      rb.group.visible = mood !== 'riot';
      if (!rb.group.visible) return;
      rb.x += rb.dir * rb.speed * dt;
      if (rb.x > 136) rb.dir = -1;
      else if (rb.x < -140) rb.dir = 1;
      rb.group.position.x = rb.x;
      rb.group.scale.x = rb.dir;
      const sweep = Math.sin(this.animClock * 3.4 + ri) * 0.48;
      if (rb.oarL) rb.oarL.rotation.z = sweep;
      if (rb.oarR) rb.oarR.rotation.z = sweep;
    });
    // Royal Golden Swan Barge cruising along the Royal Canal (-15 .. +95)
    const sb = this.landmarks.swanBarge;
    sb.group.visible = mood !== 'riot';
    if (sb.group.visible) {
      sb.x += sb.dir * 2.4 * dt;
      if (sb.x > 88) sb.dir = -1;
      else if (sb.x < -12) sb.dir = 1;
      sb.group.position.x = sb.x;
      sb.group.scale.x = sb.dir;
      sb.group.position.y = -0.1 + Math.sin(this.animClock * 1.6) * 0.035;
      const bSweep = Math.sin(this.animClock * 3.0) * 0.45;
      sb.oars.forEach((oar) => { oar.rotation.z = bSweep; });
    }

    // Ambient Ayutthaya Cavalry & Courier Horses galloping/trotting along the Royal Road!
    this.landmarks.trafficHorses.forEach((th) => {
      th.group.visible = mood !== 'riot';
      if (!th.group.visible) return;
      th.x += th.dir * th.speed * dt;
      if (th.x > th.maxX) th.dir = -1;
      else if (th.x < th.minX) th.dir = 1;
      th.group.position.x = th.x;
      th.group.scale.x = th.dir;
      const gSwing = Math.sin(this.animClock * 9.5 + th.phase) * 0.48;
      th.legs.forEach((leg, li) => {
        leg.rotation.z = li === 0 || li === 3 ? gSwing : -gSwing;
      });
    });

    // Patrolling Army Garrison Soldiers facing travel direction
    this.landmarks.soldiers.forEach((sl) => {
      sl.group.visible = true;
      const sx = sl.baseX + Math.sin(this.animClock * 0.55 * sl.speed + sl.phase) * sl.range;
      const sdir = Math.cos(this.animClock * 0.55 * sl.speed + sl.phase) >= 0 ? 1 : -1;
      sl.group.position.x = sx;
      sl.group.rotation.y = sdir * (Math.PI / 2);
      const stride = Math.sin(this.animClock * 5.2 + sl.phase);
      const lL = sl.group.getObjectByName('legL');
      const lR = sl.group.getObjectByName('legR');
      if (lL) lL.rotation.x = stride * 0.36;
      if (lR) lR.rotation.x = -stride * 0.36;
    });

    // Market walkers facing direction of travel (`rotation.y = dir * PI/2`) with leg/arm strides!
    const showMarketCrowd = mood === 'prosperous' || mood === 'plague';
    this.landmarks.marketWalkers.forEach((mw) => {
      mw.group.visible = showMarketCrowd;
      if (!showMarketCrowd) return;
      const sx = mw.baseX + Math.sin(this.animClock * 0.45 * mw.speed + mw.phase) * mw.range;
      const dir = Math.cos(this.animClock * 0.45 * mw.speed + mw.phase) >= 0 ? 1 : -1;
      mw.group.position.x = sx;
      mw.group.rotation.y = dir * (Math.PI / 2);
      const stride = Math.sin(this.animClock * 5.8 * mw.speed + mw.phase);
      const lL = mw.group.getObjectByName('legL');
      const lR = mw.group.getObjectByName('legR');
      const aL = mw.group.getObjectByName('armL');
      const aR = mw.group.getObjectByName('armR');
      if (lL) lL.rotation.x = stride * 0.4;
      if (lR) lR.rotation.x = -stride * 0.4;
      if (aL) aL.rotation.x = -stride * 0.28;
      if (aR) aR.rotation.x = stride * 0.28;
    });

    // Floating canal corpses, mass grave pyres, smoke & Ayutthaya cemetery Preta
    const chaosStarted = mood !== 'prosperous';
    this.landmarks.canalCorpses.forEach((c, ci) => {
      c.visible = chaosStarted;
      if (chaosStarted) c.position.y = -0.18 + Math.sin(this.animClock * 1.4 + ci) * 0.04;
    });
    this.landmarks.pitFlames.forEach((f, fi) => {
      f.visible = chaosStarted;
      if (chaosStarted) f.scale.setScalar(0.85 + Math.sin(this.animClock * 12 + fi) * 0.25);
    });
    this.landmarks.pitSmoke.forEach((sm, si) => {
      sm.visible = chaosStarted;
      if (chaosStarted) sm.position.y = 1.4 + ((this.animClock * 0.8 + si) % 2.4);
    });
    this.landmarks.pitLight.intensity = chaosStarted ? 3.8 + Math.sin(this.animClock * 10) * 0.8 : 0.8;

    this.landmarks.pretaShadow.visible = isNight || mood === 'riot' || mood === 'climax';
    if (this.landmarks.pretaShadow.visible) {
      this.landmarks.pretaShadow.position.x = 160 + Math.sin(this.animClock * 0.12) * 14;
      this.landmarks.pretaShadow.rotation.z = Math.sin(this.animClock * 0.9) * 0.05;
    }

    // Active Arson Fires & Sky Smoke
    this.fireViews.forEach((fv, fi) => {
      fv.group.visible = fv.active && !fv.extinguished;
      fv.light.intensity = fv.group.visible ? 5.2 + Math.sin(this.animClock * 15 + fi) * 1.2 : 0;
      if (fv.group.visible) {
        fv.group.scale.y = 0.9 + Math.sin(this.animClock * 11 + fi) * 0.18;
      }
    });
    this.smokePlumes.forEach((sm, si) => {
      sm.visible = mood === 'riot' || mood === 'climax';
      if (sm.visible) sm.position.y = 4.2 + Math.sin(this.animClock * 0.8 + si) * 0.7;
    });

    // Enemy & Survivor facing + walk stride + progressive wounds + wind-up + stun stagger (only shown outside!)
    this.enemyViews.forEach((ev, idx) => {
      ev.mesh.visible = !isInside && ev.alive;
      if (!ev.mesh.visible) return;
      if (ev.flashTimer > 0) ev.flashTimer -= dt;
      if (ev.stunTimer > 0) ev.stunTimer -= dt;
      const shakeOff = ev.flashTimer > 0 ? Math.sin(this.animClock * 65) * 0.08 : 0;
      ev.mesh.position.x = ev.x + shakeOff;
      ev.mesh.rotation.y = ev.dir * (Math.PI / 2);
      ev.mesh.rotation.z = ev.stunTimer > 0 ? Math.sin(this.animClock * 18) * 0.16 : 0;
      const hpPct = ev.hp / ev.maxHp;
      if (ev.wounds[0]) ev.wounds[0].visible = hpPct < 0.88;
      if (ev.wounds[1]) ev.wounds[1].visible = hpPct < 0.58;
      if (ev.wounds[2]) ev.wounds[2].visible = hpPct < 0.34;
      const stride = ev.stunTimer > 0 ? 0 : Math.sin(this.animClock * (ev.kind === 'phee_ha' ? 5.2 : 7.0) + idx);
      const lL = ev.mesh.getObjectByName('legL');
      const lR = ev.mesh.getObjectByName('legR');
      const aL = ev.mesh.getObjectByName('armL');
      const aR = ev.mesh.getObjectByName('armR');
      if (lL) lL.rotation.x = stride * 0.42;
      if (lR) lR.rotation.x = -stride * 0.42;
      if (aL && aR && ev.kind !== 'phee_ha') {
        // Raise arms visibly to telegraph incoming strike before dealing damage!
        const windAng = ev.windUp > 0 ? -1.45 * ev.windUp : -stride * 0.25;
        aR.rotation.x = windAng;
        aL.rotation.x = stride * 0.25;
      }
      ev.hpFill.scale.x = Math.max(0.01, hpPct);
      ev.hpFill.parent!.rotation.y = -ev.mesh.rotation.y; // Keep HP bar facing camera!
    });

    this.survivorViews.forEach((sv, idx) => {
      sv.mesh.visible = !isInside && sv.alive;
      if (!sv.mesh.visible) return;
      sv.mesh.position.x = sv.x;
      const moveDir = sv.rescued ? 1 : playerX >= sv.x ? 1 : -1;
      sv.mesh.rotation.y = moveDir * (Math.PI / 2);
      const stride = sv.rescued && sv.x < 130 ? Math.sin(this.animClock * 6.5 + idx) : 0;
      const lL = sv.mesh.getObjectByName('legL');
      const lR = sv.mesh.getObjectByName('legR');
      if (lL) lL.rotation.x = stride * 0.4;
      if (lR) lR.rotation.x = -stride * 0.4;
      sv.hpFill.scale.x = Math.max(0.01, sv.hp / sv.maxHp);
      sv.hpFill.parent!.rotation.y = -sv.mesh.rotation.y;
    });

    // Hide static story NPC billboards whenever their interactive 3D survivor entity is active in the world
    const activeSurvIds = new Set(this.survivorViews.map((s) => s.id));
    Object.entries(this.npcMeshes).forEach(([nid, mesh]) => {
      mesh.visible = !activeSurvIds.has(nid);
    });

    // Rain streak falling animation
    this.rainSystem.visible = weather === 'rain' || weather === 'storm';
    if (this.rainSystem.visible) {
      this.rainSystem.position.x = this.camera.position.x - ((this.animClock * (weather === 'storm' ? 6 : 3)) % 2);
      this.rainSystem.position.y = -((this.animClock * 16) % 3);
    }

    // Smooth camera follow & crisp room framing inside palaces/temples/halls
    if (isInside) {
      const rMeta = CH4_ROOM_META[room as Exclude<Ch4RoomId, 'outside'>];
      (this.scene.background as THREE.Color).set('#18100c');
      (this.scene.fog as THREE.FogExp2).density = 0.002;
      this.hemiLight.intensity = 0.78;
      this.sunLight.intensity = 0.62;
      this.sunLight.position.set(this.camera.position.x + 6, 12, 14);
      this.sunLight.target.position.set(this.camera.position.x, 0, -1);
      const camX = THREE.MathUtils.clamp(playerX, -(rMeta.halfW - 4.2), rMeta.halfW - 4.2);
      const alpha = 1 - Math.exp(-8.5 * Math.min(dt, 0.05));
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camX, alpha);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, rMeta.camY, alpha);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, rMeta.camZ * this.zoomFactor, alpha);
      this.camera.lookAt(this.camera.position.x, rMeta.camY - 0.18, -0.5);
    } else {
      const camX = THREE.MathUtils.clamp(playerX, CH4_MIN_X + 6, CH4_MAX_X - 6);
      const alpha = 1 - Math.exp(-8.5 * Math.min(dt, 0.05));
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camX, alpha);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, isRowing ? 2.8 : 2.35, alpha);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetCamZ + (isRowing ? 1.8 : 0), alpha);
      this.camera.lookAt(this.camera.position.x, this.camera.position.y - 0.15, isRowing ? 2.5 : 0);
    }
    if (this.cameraShake > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 0.6;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.6);
    }
    this.renderer.render(this.scene, this.camera);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public setZoomFactor(factor: number): void {
    this.zoomFactor = THREE.MathUtils.clamp(factor, 0.72, 1.55);
    this.updateCameraFraming(false);
  }

  private updateCameraFraming(snap = true): void {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const isShort = window.innerHeight <= 560 || aspect > 1.75;
    this.camera.fov = isShort ? 44 : 42;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const baseZ = (aspect < 1.3 ? 17.5 : isShort ? 13.8 : 14.4) / this.zoomFactor;
    this.targetCamZ = THREE.MathUtils.clamp(baseZ, 9.5, 22.0);
    if (snap) this.camera.position.z = this.targetCamZ;
  }

  public resize(): void {
    this.updateCameraFraming(true);
    const isMobileOrTablet = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileOrTablet ? 1.0 : 2));
    this.renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight));
  }

  public dispose(): void {
    this.renderer.dispose();
  }
}
