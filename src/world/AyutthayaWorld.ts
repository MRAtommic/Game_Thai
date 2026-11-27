import * as THREE from 'three';
import { Ch4CharacterKind, drawCh4CharacterCanvas } from '../art/Chapter4Sprites';
import { WeatherType } from '../types';
import { AyutthayaHorseHandle, buildAyutthayaFoliage, makeAyutthayaBoat, makeAyutthayaFigure, makeAyutthayaHorse, makeAyutthayaSignTex } from './AyutthayaArchitecture';
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
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
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
    this.renderer.shadowMap.enabled = !isMobileOrTablet;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.hemiLight = new THREE.HemisphereLight('#fde68a', '#1c1917', 1.35);
    this.sunLight = new THREE.DirectionalLight('#fed7aa', 1.25);
    this.sunLight.position.set(-20, 22, 16);
    this.scene.add(this.hemiLight, this.sunLight);

    this.torchLight = new THREE.PointLight('#fb923c', 0, 14, 1.1);
    this.torchLight.position.set(-46, 1.7, 1.4);
    this.scene.add(this.torchLight);

    this.initSprites();
    this.landmarks = buildAyutthayaLandmarks(this.scene);
    buildAyutthayaFoliage(this.scene);

    // Street / pier torches spanning all 380m of Ayutthaya neighborhoods
    [-168, -146, -124, -100, -82, -56, -38, -14, 10, 26, 46, 66, 94, 125, 143, 178].forEach((tx) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 2.35, 6),
        new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 })
      );
      post.position.set(tx, 1.18, 2.25);
      const cup = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 6), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
      cup.position.set(tx, 2.42, 2.25);
      this.scene.add(post, cup);
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
      this.scene.add(boat.group);
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
    this.scene.add(this.trainingDummy);

    // Docked spare boat neatly moored beside Blacksmith River Pier & Player's navigable Boat
    this.dockedPierBoat = makeAyutthayaBoat(3.9, false).group;
    this.dockedPierBoat.position.set(-83.6, -0.14, 5.65);
    this.scene.add(this.dockedPierBoat);

    this.playerBoat = makeAyutthayaBoat(4.1, false);
    this.playerBoat.group.position.set(-83.6, -0.14, 5.65);
    this.playerBoat.group.visible = false;
    this.scene.add(this.playerBoat.group);

    // Protagonist's own loyal Chestnut War Horse (parked by Blacksmith & mounted cleanly when riding!)
    this.parkedHorse = makeAyutthayaHorse('#7c2d12');
    this.parkedHorse.group.position.set(-86.5, 0, -0.4);
    this.scene.add(this.parkedHorse.group);

    this.playerHorse = makeAyutthayaHorse('#7c2d12');
    this.playerHorse.group.position.set(-84, 0, 0.85);
    this.playerHorse.group.visible = false;
    this.scene.add(this.playerHorse.group);

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

    // Sword slash effect arc + reusable arrow pool
    this.slashArcMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 1.15, 12, 1, -0.8, 1.8),
      new THREE.MeshBasicMaterial({ color: '#fef08a', side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
    );
    this.slashArcMesh.visible = false;
    this.scene.add(this.slashArcMesh);

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
      this.scene.add(m);
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
      this.scene.add(fg);
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
      this.scene.add(sm);
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
    this.scene.add(this.rainSystem);

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
    fig.position.set(x, 0, 0.55);
    this.scene.add(fig);

    const view: AyutthayaEnemyView = { id, kind, x, z: 0.55, dir: -1, hp, maxHp: hp, alive: true, mesh: fig, hpFill: fill };
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

  public triggerSwordSlash(playerX: number, facing: 1 | -1): void {
    this.slashTimer = 0.22;
    this.slashDir = facing;
    this.slashArcMesh.position.set(playerX + facing * 1.0, 1.05, 0.9);
    this.slashArcMesh.scale.x = facing;
    this.slashArcMesh.visible = true;
    if (Math.abs(playerX - -60.5) < 3.0) {
      this.dummyHitTimer = 0.55;
    }
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
    mood: AyutthayaMood
  ): void {
    this.animClock += dt;
    const hr = (gameMinutes % 1440) / 60;
    const isNight = hr >= 18.5 || hr < 5.5;

    // Sky/fog lighting progression from golden prosperous Ayutthaya -> smoky plague -> fiery riot night!
    const bgHex =
      mood === 'prosperous'
        ? hr < 17
          ? '#3b678c'
          : '#4a2b25'
        : mood === 'plague'
          ? '#1e1c24'
          : mood === 'riot'
            ? '#240f0c'
            : '#14111c';
    (this.scene.background as THREE.Color).lerp(new THREE.Color(bgHex), Math.min(1, dt * 1.4));
    (this.scene.fog as THREE.FogExp2).color.copy(this.scene.background as THREE.Color);
    (this.scene.fog as THREE.FogExp2).density = mood === 'prosperous' ? 0.0085 : mood === 'plague' ? 0.015 : 0.017;

    this.hemiLight.intensity = mood === 'prosperous' && !isNight ? 1.5 : mood === 'riot' ? 0.92 : 0.78;
    this.sunLight.intensity = mood === 'prosperous' && !isNight ? 1.35 : 0.35;

    // Update protagonist sprite (on shore, seated on wooden boat, OR galloping astride chestnut horse!)
    const playerZ = isRowing ? 5.15 : 0.85;
    const gallopBob = isRidingHorse && isMoving ? Math.abs(Math.sin(this.animClock * 11)) * 0.08 : 0;
    const playerY = isRowing
      ? 0.96 + Math.sin(this.animClock * 4.0) * 0.04
      : isRidingHorse
        ? 1.72 + gallopBob
        : 0.95;
    this.playerMesh.position.set(playerX, playerY, playerZ);
    this.playerShadow.position.set(playerX, 0.02, playerZ);
    this.playerShadow.visible = !isRowing;

    const frame = isMoving && !isRidingHorse ? Math.floor(this.animClock * (isRowing ? 6 : 9)) % 4 : 0;
    const pMat = this.playerMesh.material as THREE.MeshStandardMaterial;
    pMat.map = this.charFrames.man[frame];
    this.playerMesh.scale.x = playerFacing;

    // Player's controllable wooden rowing boat & chestnut horse
    this.playerBoat.group.visible = isRowing;
    this.dockedPierBoat.visible = !isRowing;
    if (isRowing) {
      this.playerBoat.group.position.set(playerX, -0.12 + Math.sin(this.animClock * 3.5) * 0.04, 5.2);
      this.playerBoat.group.scale.x = playerFacing;
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
    }

    if (this.slashTimer > 0) {
      this.slashTimer -= dt;
      this.slashArcMesh.position.set(playerX + this.slashDir * 1.0, 1.05, playerZ);
      this.slashArcMesh.rotation.z = this.slashDir * (0.6 - this.slashTimer * 5);
      if (this.slashTimer <= 0) this.slashArcMesh.visible = false;
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

    // Enemy & Survivor facing + walk stride + HP bar scale
    this.enemyViews.forEach((ev, idx) => {
      ev.mesh.visible = ev.alive;
      if (!ev.alive) return;
      ev.mesh.position.x = ev.x;
      ev.mesh.rotation.y = ev.dir * (Math.PI / 2);
      const stride = Math.sin(this.animClock * (ev.kind === 'phee_ha' ? 5.2 : 7.0) + idx);
      const lL = ev.mesh.getObjectByName('legL');
      const lR = ev.mesh.getObjectByName('legR');
      if (lL) lL.rotation.x = stride * 0.42;
      if (lR) lR.rotation.x = -stride * 0.42;
      ev.hpFill.scale.x = Math.max(0.01, ev.hp / ev.maxHp);
      ev.hpFill.parent!.rotation.y = -ev.mesh.rotation.y; // Keep HP bar facing camera!
    });

    this.survivorViews.forEach((sv, idx) => {
      sv.mesh.visible = sv.alive;
      if (!sv.alive) return;
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

    // Rain visibility
    this.rainSystem.visible = weather === 'rain' || weather === 'storm';
    if (this.rainSystem.visible) {
      this.rainSystem.position.x = this.camera.position.x;
    }

    // Smooth camera follow
    const camX = THREE.MathUtils.clamp(playerX, CH4_MIN_X + 6, CH4_MAX_X - 6);
    const alpha = 1 - Math.exp(-8.5 * Math.min(dt, 0.05));
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camX, alpha);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, isRowing ? 2.8 : 2.35, alpha);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetCamZ + (isRowing ? 1.8 : 0), alpha);
    this.camera.lookAt(this.camera.position.x, this.camera.position.y - 0.15, isRowing ? 2.5 : 0);
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
