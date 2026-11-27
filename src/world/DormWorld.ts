import * as THREE from 'three';
import { FloorIndex, RoomId, TimePeriod, WeatherType } from '../types';
import { buildRealisticCar, buildRealisticMotorcycle } from './VehicleModels';
import { build25DBananaClump, build25DStreetTree } from './NatureModels';
import {
  CharacterKind,
  createCharacterTexture,
  createUniformPropTexture,
} from '../art/SpriteFactory';
import {
  createAbandonedSignTexture,
  createBathroomTileTexture,
  createBusStopSignTexture,
  createCalendarTexture,
  createConvenienceStoreSignTexture,
  createCrackedMirrorTexture,
  createDormSignTexture,
  createGraffitiWallTexture,
  createIsaanSignTexture,
  createLightConeTexture,
  createMarketAwningTexture,
  createMarketSignTexture,
  createNoodleCartSignTexture,
  createNoticeBoardTexture,
  createRugTexture,
  createThaiAlleySignTexture,
  createThaiDoorTexture,
  createThaiRoadTexture,
  createThaiTileFloorTexture,
  createThaiWallTexture,
  createThaiWindowTexture,
  createZincRoofTexture,
} from '../art/TextureFactory';
import {
  animateDormExtension,
  buildDormDistrictExtension,
  buildRooftopRoom,
  DormExtensionAnimRefs,
} from './DormDistrictExtension';

export const FLOOR_HEIGHT = 4.2;
export const STREET_MIN_X = -128.0;
export const EAST_MAX_X = 44.0;
export const WORLD_MIN_X = -13.2;
export const WORLD_MAX_X = 13.2;
export const STAIR_X = 12.0;

interface CorridorLightItem {
  light: THREE.PointLight;
  bulbMat: THREE.MeshBasicMaterial;
  coneMat?: THREE.MeshBasicMaterial;
  floor: FloorIndex;
  baseIntensity: number;
  flickerSeed: number;
}

export class DormWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private hemiLight: THREE.HemisphereLight;
  private sunMoonLight: THREE.DirectionalLight;
  private lightningLight: THREE.DirectionalLight;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;

  private corridorLights: CorridorLightItem[] = [];
  private rainLines: THREE.LineSegments;
  private rainPositions: Float32Array;
  private rainCount = 480;

  private hangingUniform: THREE.Mesh;
  private bananaTrees: THREE.Mesh[] = [];
  private ceilingFan: THREE.Group;
  private spiritCandleLight: THREE.PointLight;
  private breakerLedMat: THREE.MeshBasicMaterial;
  private room304SealGroup: THREE.Group;
  private floor3GateMesh: THREE.Group;

  private exteriorGroup: THREE.Group;
  private roomGroups: Partial<Record<RoomId, THREE.Group>> = {};
  private roomLights: { room: RoomId; light: THREE.PointLight; baseIntensity: number }[] = [];

  private playerMesh: THREE.Mesh;
  private playerShadow: THREE.Mesh;
  private uncleMesh: THREE.Mesh;
  private uncleShadow: THREE.Mesh;
  private tomMesh: THREE.Mesh;
  private tomShadow: THREE.Mesh;
  private vendorMesh: THREE.Mesh;
  private vendorShadow: THREE.Mesh;
  private noodleVendorMesh: THREE.Mesh;
  private noodleLight: THREE.PointLight;
  private noodleSeatedMeshes: THREE.Mesh[] = [];
  private busSeatedMeshes: THREE.Mesh[] = [];
  private gangSmokingMeshes: { mesh: THREE.Mesh; smoke: THREE.Mesh; baseX: number; baseY: number }[] = [];
  private workerSeatedMeshes: THREE.Mesh[] = [];
  private isaanLight: THREE.PointLight;
  private movingVehicles: {
    group: THREE.Group;
    speed: number;
    minX: number;
    maxX: number;
    baseZ: number;
    dir: 1 | -1;
  }[] = [];
  private pedestrians: {
    mesh: THREE.Mesh;
    shadow: THREE.Mesh;
    kind: 'student' | 'worker' | 'worker_yellow' | 'office_lady';
    x: number;
    z: number;
    speed: number;
    minX: number;
    maxX: number;
    dir: 1 | -1;
    dayOnly: boolean;
    nightOnly: boolean;
  }[] = [];
  private primMesh: THREE.Mesh;
  private primAuraLight: THREE.PointLight;
  private zombieMeshes: THREE.Mesh[] = [];
  private zombieShadows: THREE.Mesh[] = [];
  private playerGunGroup: THREE.Group;
  private gunFlashMesh: THREE.Group;
  private gunFlashLight: THREE.PointLight;
  private gunTracerMesh: THREE.Mesh;

  private charFrames: Record<CharacterKind, THREE.CanvasTexture[]> = {
    player: [],
    uncle: [],
    tom: [],
    vendor: [],
    student: [],
    worker: [],
    noodle_chef: [],
    worker_yellow: [],
    office_lady: [],
    uncle_local: [],
    gang_maroon: [],
    gang_denim: [],
    gang_hoodie: [],
    gang_plaid: [],
    clerk: [],
    zombie: [],
    prim: [],
    prim_chase: [],
    win_moto: [],
    police: [],
    laundry_lady: [],
    electrician: [],
  };

  private extRefs!: DormExtensionAnimRefs;
  private animClock = 0;
  private lastThunderCallback?: () => void;
  private lightningTimer = 6;
  private lightningFlashDecay = 0;
  private zoomFactor = 1.0;
  private targetCamZ = 12.6;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#090d18');
    this.scene.fog = new THREE.FogExp2('#090d18', 0.028);

    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      180
    );
    this.camera.position.set(0, 2.2, 12.6);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.resize();

    this.hemiLight = new THREE.HemisphereLight('#5c729c', '#181414', 0.55);
    this.scene.add(this.hemiLight);

    this.sunMoonLight = new THREE.DirectionalLight('#ffd7a8', 0.85);
    this.sunMoonLight.position.set(6, 22, 12);
    this.sunMoonLight.castShadow = true;
    this.sunMoonLight.shadow.mapSize.set(1024, 1024);
    this.sunMoonLight.shadow.camera.near = 2;
    this.sunMoonLight.shadow.camera.far = 48;
    this.sunMoonLight.shadow.camera.left = -18;
    this.sunMoonLight.shadow.camera.right = 18;
    this.sunMoonLight.shadow.camera.top = 20;
    this.sunMoonLight.shadow.camera.bottom = -4;
    this.sunMoonLight.shadow.bias = -0.002;
    this.sunMoonLight.shadow.normalBias = 0.04;
    this.scene.add(this.sunMoonLight);

    this.lightningLight = new THREE.DirectionalLight('#cfe2ff', 0);
    this.lightningLight.position.set(-6, 20, 12);
    this.scene.add(this.lightningLight);

    this.flashlight = new THREE.SpotLight('#fff0cc', 0, 13, Math.PI / 4.2, 0.55, 1.3);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    for (let f = 0; f < 4; f++) {
      this.charFrames.player.push(createCharacterTexture('player', f));
      this.charFrames.student.push(createCharacterTexture('student', f));
      this.charFrames.worker.push(createCharacterTexture('worker', f));
      this.charFrames.worker_yellow.push(createCharacterTexture('worker_yellow', f));
      this.charFrames.office_lady.push(createCharacterTexture('office_lady', f));
      this.charFrames.zombie.push(createCharacterTexture('zombie', f));
    }
    for (let f = 0; f < 2; f++) {
      this.charFrames.uncle.push(createCharacterTexture('uncle', f));
      this.charFrames.tom.push(createCharacterTexture('tom', f));
      this.charFrames.vendor.push(createCharacterTexture('vendor', f));
      this.charFrames.noodle_chef.push(createCharacterTexture('noodle_chef', f));
      this.charFrames.uncle_local.push(createCharacterTexture('uncle_local', f));
      this.charFrames.gang_maroon.push(createCharacterTexture('gang_maroon', f));
      this.charFrames.gang_denim.push(createCharacterTexture('gang_denim', f));
      this.charFrames.gang_hoodie.push(createCharacterTexture('gang_hoodie', f));
      this.charFrames.gang_plaid.push(createCharacterTexture('gang_plaid', f));
      this.charFrames.clerk.push(createCharacterTexture('clerk', f));
      this.charFrames.prim.push(createCharacterTexture('prim', f));
      this.charFrames.prim_chase.push(createCharacterTexture('prim_chase', f));
      this.charFrames.win_moto.push(createCharacterTexture('win_moto', f));
      this.charFrames.police.push(createCharacterTexture('police', f));
      this.charFrames.laundry_lady.push(createCharacterTexture('laundry_lady', f));
      this.charFrames.electrician.push(createCharacterTexture('electrician', f));
    }

    this.hangingUniform = new THREE.Mesh();
    this.ceilingFan = new THREE.Group();
    this.spiritCandleLight = new THREE.PointLight('#ff8f3a', 1.6, 6.0);
    this.breakerLedMat = new THREE.MeshBasicMaterial({ color: '#37d67a' });
    this.room304SealGroup = new THREE.Group();
    this.floor3GateMesh = new THREE.Group();

    this.exteriorGroup = new THREE.Group();
    const preExteriorCount = this.scene.children.length;
    this.noodleLight = new THREE.PointLight('#ffdf8a', 1.9, 8.5, 1.45);
    this.isaanLight = new THREE.PointLight('#ffbe6b', 2.2, 10.5, 1.4);

    this.buildArchitecture();
    this.buildFloor0YardAndGuardBooth();
    this.buildOuterThaiStreet();
    this.buildFloor1Lobby();
    this.buildFloor2Residential();
    this.buildFloor3Forbidden();
    this.buildDistantAlleyAndParallax();

    // Reparent all exterior meshes/lights into exteriorGroup cleanly
    const extObjects = this.scene.children.slice(preExteriorCount);
    extObjects.forEach((obj) => this.exteriorGroup.add(obj));
    this.scene.add(this.exteriorGroup);

    this.buildRoomInteriors();
    buildRooftopRoom(this.scene, this.roomGroups, this.roomLights, this.addBox.bind(this));

    // Lit 2.5D character meshes (receive scene lights, fog, and shadows + real floor contact shadows!)
    const shadowTex = this.createContactShadowTexture();
    this.extRefs = buildDormDistrictExtension(
      this.scene,
      this.exteriorGroup,
      this.charFrames,
      shadowTex,
      this.addBox.bind(this)
    );

    this.playerMesh = this.makeLitCharacter(this.charFrames.player[0], 1.5, 2.25);
    this.playerMesh.position.set(-11.2, 0.94, 0.45);
    this.playerShadow = this.makeFloorShadow(shadowTex, 0.56);
    this.playerShadow.position.set(-11.2, 0.018, 0.45);
    this.scene.add(this.playerMesh, this.playerShadow);

    this.uncleMesh = this.makeLitCharacter(this.charFrames.uncle[0], 1.5, 2.25);
    this.uncleMesh.position.set(-8.4, 0.94, 0.18);
    this.uncleShadow = this.makeFloorShadow(shadowTex, 0.56);
    this.uncleShadow.position.set(-8.4, 0.018, 0.18);
    this.exteriorGroup.add(this.uncleMesh, this.uncleShadow);

    this.tomMesh = this.makeLitCharacter(this.charFrames.tom[0], 1.5, 2.25);
    this.tomMesh.position.set(5.4, FLOOR_HEIGHT * 2 + 0.94, 0.25);
    this.tomShadow = this.makeFloorShadow(shadowTex, 0.56);
    this.tomShadow.position.set(5.4, FLOOR_HEIGHT * 2 + 0.018, 0.25);
    this.exteriorGroup.add(this.tomMesh, this.tomShadow);

    this.vendorMesh = this.makeLitCharacter(this.charFrames.vendor[0], 1.5, 2.25);
    this.vendorMesh.position.set(-61.0, 0.94, 0.15);
    this.vendorShadow = this.makeFloorShadow(shadowTex, 0.56);
    this.vendorShadow.position.set(-61.0, 0.025, 0.15);
    this.exteriorGroup.add(this.vendorMesh, this.vendorShadow);

    this.noodleVendorMesh = this.makeLitCharacter(this.charFrames.noodle_chef[0], 1.5, 2.25);
    this.noodleVendorMesh.position.set(-42.0, 0.94, -0.85);
    this.exteriorGroup.add(this.noodleVendorMesh);

    // Seated customers eating at the noodle cart folding table (-39.8)
    const noodleCustKinds: ('office_lady' | 'uncle_local')[] = ['office_lady', 'uncle_local'];
    [-40.48, -39.12].forEach((nx, idx) => {
      const cust = this.makeLitCharacter(this.charFrames[noodleCustKinds[idx]][0], 1.44, 2.08);
      cust.position.set(nx, 0.7, 0.16);
      this.setMeshFacing(cust, idx === 0 ? 1 : -1);
      this.noodleSeatedMeshes.push(cust);
      this.exteriorGroup.add(cust);
    });

    // Seated factory workers celebrating/drinking at Isaan restaurant (-72.5) with distinct outfits!
    const workerKinds: ('worker' | 'worker_yellow' | 'uncle_local')[] = ['worker', 'worker_yellow', 'uncle_local'];
    [-73.3, -72.0, -70.8].forEach((wx, idx) => {
      const wm = this.makeLitCharacter(this.charFrames[workerKinds[idx]][0], 1.48, 2.15);
      wm.position.set(wx, 0.72, idx === 1 ? -0.45 : -0.1);
      this.setMeshFacing(wm, idx === 0 ? 1 : -1);
      this.workerSeatedMeshes.push(wm);
      this.exteriorGroup.add(wm);
    });

    // Two people sitting cleanly on the front edge of the Bus Stop bench (-34.5)
    const busKinds: ('office_lady' | 'student')[] = ['office_lady', 'student'];
    [-35.15, -33.85].forEach((bx, idx) => {
      const bm = this.makeLitCharacter(this.charFrames[busKinds[idx]][0], 1.42, 2.05);
      bm.position.set(bx, 0.9, -0.76);
      this.setMeshFacing(bm, idx === 0 ? 1 : -1);
      this.busSeatedMeshes.push(bm);
      this.exteriorGroup.add(bm);
    });

    // 4 Smoking Vocational-Tech Delinquent Gangsters hanging out by the Abandoned House (-85..-93)
    const gangDefs: { kind: 'gang_maroon' | 'gang_denim' | 'gang_hoodie' | 'gang_plaid'; x: number; z: number; face: 1 | -1 }[] = [
      { kind: 'gang_maroon', x: -84.6, z: 0.15, face: -1 },
      { kind: 'gang_denim', x: -86.2, z: -0.25, face: 1 },
      { kind: 'gang_hoodie', x: -91.2, z: -0.2, face: 1 },
      { kind: 'gang_plaid', x: -92.6, z: 0.2, face: -1 },
    ];
    gangDefs.forEach((gd) => {
      const gm = this.makeLitCharacter(this.charFrames[gd.kind][0], 1.5, 2.25);
      gm.position.set(gd.x, 0.94, gd.z);
      this.setMeshFacing(gm, gd.face);
      const gs = this.makeFloorShadow(shadowTex, 0.56);
      gs.position.set(gd.x, 0.025, gd.z);

      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.38 })
      );
      const baseX = gd.x + gd.face * 0.44;
      const baseY = 1.42;
      smoke.position.set(baseX, baseY, gd.z + 0.05);

      this.gangSmokingMeshes.push({ mesh: gm, smoke, baseX, baseY });
      this.exteriorGroup.add(gm, gs, smoke);
    });

    this.buildAmbientTrafficAndPedestrians(shadowTex);

    this.primMesh = this.makeLitCharacter(this.charFrames.prim[0], 1.55, 2.32, '#1a2433');
    this.primMesh.position.set(-2.5, FLOOR_HEIGHT * 2 + 1.05, -0.35);
    this.primMesh.visible = false;
    this.scene.add(this.primMesh);

    this.primAuraLight = new THREE.PointLight('#b81828', 0, 5.5, 1.5);
    this.scene.add(this.primAuraLight);

    // Pool of 8 Zombie meshes & gunshot visual FX for Drunk Zombie Hallucination Mode
    for (let zi = 0; zi < 8; zi++) {
      const zm = this.makeLitCharacter(this.charFrames.zombie[0], 1.5, 2.25, '#142a18');
      zm.visible = false;
      const zs = this.makeFloorShadow(shadowTex, 0.56);
      zs.visible = false;
      this.zombieMeshes.push(zm);
      this.zombieShadows.push(zs);
      this.scene.add(zm, zs);
    }

    // Detailed 3D 9mm Handgun anchored to player hand when drunk!
    this.playerGunGroup = new THREE.Group();
    // Matte gunmetal slide + chrome barrel + orange front sight + wooden-dark tactical grip + trigger guard
    this.addBox(this.playerGunGroup, 0.42, 0.11, 0.08, '#1f2937', 0.18, 0.06, 0, 0.28);
    this.addBox(this.playerGunGroup, 0.43, 0.04, 0.072, '#334155', 0.18, 0.115, 0, 0.25);
    this.addBox(this.playerGunGroup, 0.07, 0.055, 0.055, '#94a3b8', 0.41, 0.07, 0, 0.15); // barrel tip
    this.addBox(this.playerGunGroup, 0.025, 0.03, 0.025, '#f97316', 0.37, 0.145, 0); // orange sight
    const grip = this.addBox(this.playerGunGroup, 0.11, 0.22, 0.075, '#451a03', 0.02, -0.07, 0, 0.65);
    grip.rotation.z = 0.22;
    this.addBox(this.playerGunGroup, 0.1, 0.02, 0.05, '#334155', 0.13, -0.02, 0); // trigger guard
    this.playerGunGroup.visible = false;
    this.scene.add(this.playerGunGroup);

    // Multi-point star muzzle flash + muzzle illumination light
    this.gunFlashMesh = new THREE.Group();
    const flashMat = new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.95 });
    const f1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), flashMat);
    const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
    this.gunFlashMesh.add(f1, f2);
    this.gunFlashMesh.visible = false;
    this.scene.add(this.gunFlashMesh);

    this.gunFlashLight = new THREE.PointLight('#ffbe55', 0, 11, 1.3);
    this.scene.add(this.gunFlashLight);

    this.gunTracerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color: '#fef08a', transparent: true, opacity: 0.9 })
    );
    this.gunTracerMesh.visible = false;
    this.scene.add(this.gunTracerMesh);

    // Rain particle system (kept outside the balcony z > 2.65 so rain doesn't fall indoors!)
    this.rainPositions = new Float32Array(this.rainCount * 6);
    const rainGeo = new THREE.BufferGeometry();
    for (let i = 0; i < this.rainCount; i++) {
      const rx = (Math.random() - 0.5) * 34;
      const ry = Math.random() * 18;
      const rz = 2.65 + Math.random() * 4.2;
      this.rainPositions[i * 6] = rx;
      this.rainPositions[i * 6 + 1] = ry;
      this.rainPositions[i * 6 + 2] = rz;
      this.rainPositions[i * 6 + 3] = rx - 0.08;
      this.rainPositions[i * 6 + 4] = ry - 0.45;
      this.rainPositions[i * 6 + 5] = rz;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: '#9ec2e8',
      transparent: true,
      opacity: 0,
    });
    this.rainLines = new THREE.LineSegments(rainGeo, rainMat);
    this.scene.add(this.rainLines);
  }

  public onThunder(cb: () => void): void {
    this.lastThunderCallback = cb;
  }

  private setMeshFacing(mesh: THREE.Mesh, facing: 1 | -1): void {
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

  private makeLitCharacter(
    tex: THREE.Texture,
    w: number,
    h: number,
    emissive = '#000000'
  ): THREE.Mesh {
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.25,
      roughness: 0.88,
      metalness: 0.02,
      emissive,
      emissiveIntensity: emissive === '#000000' ? 0 : 0.45,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.receiveShadow = false;
    return mesh;
  }

  private createContactShadowTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    g.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  private makeFloorShadow(tex: THREE.Texture, radius: number): THREE.Mesh {
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 1.15), mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  private addTexturedPlane(
    w: number,
    h: number,
    tex: THREE.Texture,
    x: number,
    y: number,
    z: number,
    roughness = 0.88,
    transparent = false
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness,
        transparent,
        alphaTest: transparent ? 0.1 : 0,
        side: THREE.DoubleSide,
      })
    );
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  private addBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    color: string,
    x: number,
    y: number,
    z: number,
    roughness = 0.85
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.08 })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private addCorridorLight(
    floor: FloorIndex,
    x: number,
    color: string,
    rgbStr: string,
    intensity: number,
    flickerSeed: number
  ): void {
    const y = floor * FLOOR_HEIGHT + 3.58;
    this.addBox(this.scene, 1.35, 0.08, 0.22, '#2b303a', x, y + 0.08, -0.35);
    const bulbMat = new THREE.MeshBasicMaterial({ color });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.06, 0.12), bulbMat);
    bulb.position.set(x, y, -0.35);
    this.scene.add(bulb);

    const light = new THREE.PointLight(color, intensity, 10.5, 1.35);
    light.position.set(x, y - 0.15, 1.45);
    this.scene.add(light);

    // Soft additive light cone below fixture
    const coneMat = new THREE.MeshBasicMaterial({
      map: createLightConeTexture(rgbStr),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const cone = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.3), coneMat);
    cone.position.set(x, y - 1.65, -0.2);
    this.scene.add(cone);

    this.corridorLights.push({
      light,
      bulbMat,
      coneMat,
      floor,
      baseIntensity: intensity,
      flickerSeed,
    });
  }

  private addThaiDoor(
    floor: FloorIndex,
    x: number,
    label: string,
    damaged = false
  ): void {
    const yBase = floor * FLOOR_HEIGHT;
    const doorTex = createThaiDoorTexture(label, damaged);
    const mesh = this.addTexturedPlane(1.42, 2.52, doorTex, x, yBase + 1.26, -1.32, 0.78);
    if (damaged) mesh.rotation.z = 0.025;
  }

  private addThaiWindow(floor: FloorIndex, x: number, lit = false, zWall = -1.4): void {
    const yBase = floor * FLOOR_HEIGHT;
    const tex = createThaiWindowTexture(lit);
    this.addTexturedPlane(1.65, 1.35, tex, x, yBase + 1.98, zWall + 0.08, 0.45);
    // 3D protruding concrete sill & rain awning above window for real depth
    this.addBox(this.scene, 1.82, 0.1, 0.24, '#363b42', x, yBase + 1.28, zWall + 0.12);
    this.addBox(this.scene, 1.88, 0.08, 0.34, '#2c3138', x, yBase + 2.68, zWall + 0.16);
  }

  private addHangingWire(p1: THREE.Vector3, p2: THREE.Vector3, sag = 0.45, radius = 0.022): void {
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
    const geo = new THREE.TubeGeometry(curve, 14, radius, 5, false);
    const mat = new THREE.MeshBasicMaterial({ color: '#111318' });
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  private buildArchitecture(): void {
    const roadTex = createThaiRoadTexture();
    roadTex.repeat.set(14, 1);
    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.72,
      metalness: 0.12,
    });
    // Outer public Soi 9 road stops cleanly outside the dorm gate (x = -115 .. -15.2)
    const road = new THREE.Mesh(new THREE.BoxGeometry(100, 0.4, 13.0), roadMat);
    road.position.set(-65.2, -0.2, 1.45);
    road.receiveShadow = true;
    this.scene.add(road);

    // Open Side-Street T-Junction (ซอยแยกเข้าซอย 9) at x = -30.2 .. -24.2 heading deep into -Z
    const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.39, 19.5), roadMat);
    crossRoad.position.set(-27.2, -0.202, -9.2);
    crossRoad.receiveShadow = true;
    this.scene.add(crossRoad);
    // Raised concrete corner curbs flanking the side-street opening & dashed center road line
    [-30.35, -24.05].forEach((cx) => {
      this.addBox(this.scene, 0.3, 0.2, 16.5, '#646c78', cx, 0.1, -10.5);
    });
    for (let dz = -2.0; dz >= -17.5; dz -= 2.4) {
      this.addBox(this.scene, 0.12, 0.02, 1.15, '#eab308', -27.2, 0.005, dz);
    }
    // Deep alley streetlamp illuminating the side-street recess
    const alleyPole = this.addBox(this.scene, 0.22, 5.2, 0.22, '#525862', -24.5, 2.6, -9.5);
    alleyPole.castShadow = false;
    const alleyBulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.4),
      new THREE.MeshBasicMaterial({ color: '#ffd580' })
    );
    alleyBulb.position.set(-25.1, 4.95, -9.5);
    this.scene.add(alleyBulb);
    const alleyLight = new THREE.PointLight('#ffd580', 8.5, 18, 0.9);
    alleyLight.position.set(-27.0, 4.7, -9.5);
    this.scene.add(alleyLight);

    // Dorm private concrete courtyard & raised curb (clearly separates dorm from public road!)
    const yardMat = new THREE.MeshStandardMaterial({
      color: '#343a40',
      roughness: 0.86,
      metalness: 0.06,
    });
    const dormYard = new THREE.Mesh(new THREE.BoxGeometry(31.2, 0.42, 11.2), yardMat);
    dormYard.position.set(0.4, -0.19, 1.2);
    dormYard.receiveShadow = true;
    this.scene.add(dormYard);

    // Painted concrete curb + low fence ledge & yellow/black safety bollards at dorm boundary
    this.addBox(this.scene, 0.28, 0.22, 11.0, '#787f8a', -15.1, 0.11, 1.2);
    this.addBox(this.scene, 31.0, 0.22, 0.28, '#68707a', 0.4, 0.11, 2.65);
    [-15.1, -15.1, -15.1].forEach((bx, bi) => {
      const bz = 2.65 + bi * 1.15;
      this.addBox(this.scene, 0.16, 0.72, 0.16, '#eab308', bx, 0.36, bz);
      this.addBox(this.scene, 0.17, 0.18, 0.17, '#111827', bx, 0.52, bz);
    });

    // Soft feathered shimmering rainwater puddles (never pitch-black metallic holes!)
    const pudCanv = document.createElement('canvas');
    pudCanv.width = 128;
    pudCanv.height = 128;
    const pudCtx = pudCanv.getContext('2d')!;
    const pg = pudCtx.createRadialGradient(64, 64, 12, 64, 64, 60);
    pg.addColorStop(0, 'rgba(72, 102, 138, 0.48)');
    pg.addColorStop(0.55, 'rgba(48, 72, 102, 0.28)');
    pg.addColorStop(1, 'rgba(48, 72, 102, 0)');
    pudCtx.fillStyle = pg;
    pudCtx.fillRect(0, 0, 128, 128);
    const pudTex = new THREE.CanvasTexture(pudCanv);
    pudTex.colorSpace = THREE.SRGBColorSpace;
    const puddleMat = new THREE.MeshStandardMaterial({
      map: pudTex,
      transparent: true,
      opacity: 0.72,
      roughness: 0.14,
      metalness: 0.18,
      depthWrite: false,
    });
    [-77.0, -68.0, -56.0, -47.0, -38.0, -29.0, -22.5, -16.8, -7.5, -1.2, 4.8, 9.6].forEach((pxPos, i) => {
      const puddle = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3 + (i % 2) * 0.7, 1.45 + (i % 3) * 0.25),
        puddleMat
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.18;
      puddle.position.set(pxPos, pxPos < -15.2 ? 0.015 : 0.024, pxPos < -15.2 ? 2.4 + (i % 2) * 0.6 : 1.15);
      this.scene.add(puddle);
    });

    const wallTex12 = createThaiWallTexture(false);
    const wallTex3 = createThaiWallTexture(true);
    const tileTex = createThaiTileFloorTexture();

    for (let f = 1 as FloorIndex; f <= 3; f = (f + 1) as FloorIndex) {
      const yBase = f * FLOOR_HEIGHT;

      // Terrazzo tile floor slab (embeds cleanly into left exterior wall, leaves stairwell opening on right)
      const floorMat = new THREE.MeshStandardMaterial({
        map: tileTex,
        roughness: 0.65,
        metalness: 0.08,
      });
      const mainSlab = new THREE.Mesh(new THREE.BoxGeometry(25.4, 0.28, 4.4), floorMat);
      mainSlab.position.set(-1.9, yBase - 0.14, 0.3);
      mainSlab.receiveShadow = true;
      this.scene.add(mainSlab);

      // Front balcony walkway bridge past the stairwell opening
      const frontWalk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 2.0), floorMat);
      frontWalk.position.set(12.71, yBase - 0.14, 1.5);
      frontWalk.receiveShadow = true;
      this.scene.add(frontWalk);

      // Textured Thai plaster back wall (overlaps slabs & side walls cleanly — zero gaps)
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(29.6, 4.36),
        new THREE.MeshStandardMaterial({
          map: f === 3 ? wallTex3 : wallTex12,
          roughness: 0.92,
        })
      );
      backWall.position.set(0, yBase + 2.1, -1.4);
      backWall.receiveShadow = true;
      this.scene.add(backWall);

      if (f === 3) {
        // Stairwell safety railing on Floor 3 around the open stair shaft
        this.addBox(this.scene, 2.7, 0.08, 0.08, '#262b34', 12.15, yBase + 0.95, 0.45);
        this.addBox(this.scene, 0.06, 0.95, 0.06, '#1b1f26', 10.85, yBase + 0.48, 0.45);
        this.addBox(this.scene, 0.06, 0.95, 0.06, '#1b1f26', 13.45, yBase + 0.48, 0.45);
      }

      // Slender iron balcony railing + handrail
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 29.1, 8),
        new THREE.MeshStandardMaterial({ color: '#262b34', metalness: 0.5, roughness: 0.5 })
      );
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, yBase + 0.95, 2.25);
      this.scene.add(rail);

      for (let rx = -14; rx <= 14; rx += 2.0) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6),
          new THREE.MeshStandardMaterial({ color: '#1b1f26' })
        );
        post.position.set(rx, yBase + 0.48, 2.25);
        this.scene.add(post);
      }
    }

    // Right exterior wall: Floors 1-3 weathered plaster; Floor 0 has an OPEN Side Doorway out to the Basketball Court!
    const upperWallH = FLOOR_HEIGHT * 3 + 0.1;
    const rightExtWall = this.addBox(
      this.scene,
      0.55,
      upperWallH,
      4.5,
      '#3b403c',
      14.55,
      FLOOR_HEIGHT + upperWallH / 2 - 0.05,
      0.35
    );
    rightExtWall.material = new THREE.MeshStandardMaterial({ map: wallTex12, roughness: 0.92 });

    // Left exterior wall: weathered plaster on Floors 1-3, with an OPEN Dorm Side Gate / Archway on Floor 0!
    const leftExtWall = this.addBox(
      this.scene,
      0.55,
      upperWallH,
      4.5,
      '#3b403c',
      -14.55,
      FLOOR_HEIGHT + upperWallH / 2 - 0.05,
      0.35
    );
    leftExtWall.material = new THREE.MeshStandardMaterial({ map: wallTex12, roughness: 0.92 });

    // Add large Thai louver windows (with sills & iron grilles) on BOTH left & right end-walls on Floors 1-3!
    const sideWinDark = createThaiWindowTexture(false);
    const sideWinLit = createThaiWindowTexture(true);
    for (let f = 1 as FloorIndex; f <= 3; f = (f + 1) as FloorIndex) {
      const wy = f * FLOOR_HEIGHT + 2.05;
      // Left end-wall window facing into corridor (+X)
      const leftWin = new THREE.Mesh(
        new THREE.PlaneGeometry(2.1, 1.45),
        new THREE.MeshStandardMaterial({
          map: f === 2 ? sideWinLit : sideWinDark,
          roughness: 0.45,
          emissive: f === 3 ? '#15253d' : f === 2 ? '#3d2508' : '#08101c',
          emissiveIntensity: 0.65,
        })
      );
      leftWin.rotation.y = Math.PI / 2;
      leftWin.position.set(-14.25, wy, 0.45);
      this.scene.add(leftWin);
      this.addBox(this.scene, 0.24, 0.1, 2.26, '#363b42', -14.18, wy - 0.76, 0.45);
      this.addBox(this.scene, 0.3, 0.08, 2.32, '#2c3138', -14.15, wy + 0.76, 0.45);

      // Right stairwell end-wall window facing left (-X)
      const rightWin = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 1.38),
        new THREE.MeshStandardMaterial({
          map: f === 1 ? sideWinLit : sideWinDark,
          roughness: 0.45,
          emissive: f === 1 ? '#3d2508' : '#0d192b',
          emissiveIntensity: 0.5,
        })
      );
      rightWin.rotation.y = -Math.PI / 2;
      rightWin.position.set(14.25, wy, 0.45);
      this.scene.add(rightWin);
      this.addBox(this.scene, 0.24, 0.1, 2.06, '#363b42', 14.18, wy - 0.72, 0.45);
      this.addBox(this.scene, 0.3, 0.08, 2.12, '#2c3138', 14.15, wy + 0.72, 0.45);
    }
    // Floor 0 Left Archway Pillars + Overhead Lintel + Open Sliding Iron Gate (completely walkable!)
    this.addBox(this.scene, 0.55, FLOOR_HEIGHT, 0.9, '#2b3033', -14.55, FLOOR_HEIGHT / 2, -1.45);
    this.addBox(this.scene, 0.55, FLOOR_HEIGHT, 0.55, '#2b3033', -14.55, FLOOR_HEIGHT / 2, 2.32);
    this.addBox(this.scene, 0.58, 0.95, 4.5, '#262b2e', -14.55, FLOOR_HEIGHT - 0.45, 0.35);
    // Open iron gate wing parked by back pillar + warm gate lamp
    for (let gz = -1.0; gz <= -0.35; gz += 0.16) {
      this.addBox(this.scene, 0.05, 2.5, 0.05, '#596370', -14.55, 1.25, gz);
    }
    this.addBox(this.scene, 0.12, 0.12, 0.95, '#464f5c', -14.55, 2.52, -0.68);
    const gateBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#ffd996' })
    );
    gateBulb.position.set(-14.55, 3.15, 0.9);
    this.scene.add(gateBulb);
    const gateLight = new THREE.PointLight('#ffd080', 1.6, 7.5, 1.5);
    gateLight.position.set(-14.55, 3.0, 0.9);
    this.scene.add(gateLight);

    // Floor 0 Right Exit Doorway out to Basketball Court (+14.55): pillars, lintel, propped-open wooden exit door & lamp!
    this.addBox(this.scene, 0.55, FLOOR_HEIGHT, 1.15, '#2b3033', 14.55, FLOOR_HEIGHT / 2, -1.32);
    this.addBox(this.scene, 0.55, FLOOR_HEIGHT, 0.55, '#2b3033', 14.55, FLOOR_HEIGHT / 2, 2.32);
    this.addBox(this.scene, 0.58, 1.15, 4.5, '#262b2e', 14.55, FLOOR_HEIGHT - 0.55, 0.35);
    // Open steel-and-wood side exit door leaf swung open against back jamb + door frame + warm lamp
    this.addBox(this.scene, 0.14, 2.55, 0.14, '#5a3a22', 14.55, 1.28, -0.72);
    this.addBox(this.scene, 0.14, 2.55, 0.14, '#5a3a22', 14.55, 1.28, 1.98);
    this.addBox(this.scene, 0.18, 0.14, 2.85, '#5a3a22', 14.55, 2.6, 0.63);
    const rightOpenDoor = this.addBox(this.scene, 0.95, 2.48, 0.08, '#6e4526', 14.98, 1.24, -0.34, 0.72);
    rightOpenDoor.rotation.y = 0.28;
    const exitBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#ffd996' })
    );
    exitBulb.position.set(14.55, 3.0, 0.65);
    this.scene.add(exitBulb);
    const exitLight = new THREE.PointLight('#ffd080', 1.8, 8.5, 1.4);
    exitLight.position.set(14.55, 2.85, 0.65);
    this.scene.add(exitLight);

    // Real diagonal Thai concrete staircases connecting Floors 0->1, 1->2, 2->3
    for (let f = 0 as FloorIndex; f <= 2; f = (f + 1) as FloorIndex) {
      this.buildStaircase(f);
    }

    // Sloped corrugated zinc eaves / roof on top of Floor 3 + top fascia beam sealing roof to walls
    this.addBox(this.scene, 29.6, 0.35, 0.6, '#23272c', 0, FLOOR_HEIGHT * 4 - 0.1, -1.25);
    const zincMat = new THREE.MeshStandardMaterial({
      map: createZincRoofTexture(),
      roughness: 0.68,
      metalness: 0.35,
    });
    const topRoof = new THREE.Mesh(new THREE.BoxGeometry(30.6, 0.28, 5.4), zincMat);
    topRoof.position.set(0, FLOOR_HEIGHT * 4 + 0.05, 0.3);
    topRoof.rotation.x = 0.025;
    this.scene.add(topRoof);
  }

  private buildStaircase(fromFloor: FloorIndex): void {
    const yBase = fromFloor * FLOOR_HEIGHT;
    const steps = 10;
    const startX = 10.9;
    const endX = 13.65;
    const totalDx = endX - startX;
    const totalDy = FLOOR_HEIGHT - 0.14;
    const stepDx = totalDx / steps;
    const stepDy = totalDy / steps;

    // Solid stepped concrete treads + subtle yellow safety nosing strips (cleanly offset above tread)
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#4c5057', roughness: 0.88 });
    const nosingMat = new THREE.MeshStandardMaterial({ color: '#9c7a2d', roughness: 0.55 });
    for (let s = 0; s < steps; s++) {
      const sx = startX + (s + 0.5) * stepDx;
      const sy = yBase + (s + 0.5) * stepDy;

      const tread = new THREE.Mesh(new THREE.BoxGeometry(stepDx + 0.08, stepDy + 0.04, 1.3), concreteMat);
      tread.position.set(sx, sy, -0.45);
      tread.castShadow = true;
      tread.receiveShadow = true;
      this.scene.add(tread);

      const nosing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 1.32), nosingMat);
      nosing.position.set(sx - stepDx * 0.45, sy + (stepDy + 0.04) * 0.5 + 0.015, -0.45);
      this.scene.add(nosing);
    }

    // Top landing pad connecting into upper corridor
    this.addBox(this.scene, 0.85, 0.26, 1.4, '#444850', 13.95, yBase + FLOOR_HEIGHT - 0.13, -0.45);

    // Sloped concrete stringer beam beneath the steps
    const slopeLen = Math.hypot(totalDx, totalDy);
    const slopeAngle = Math.atan2(totalDy, totalDx);
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.24, 1.28), concreteMat);
    stringer.position.set((startX + endX) / 2 + 0.06, yBase + totalDy / 2 - 0.14, -0.45);
    stringer.rotation.z = slopeAngle;
    this.scene.add(stringer);

    // Sloped iron handrail + vertical balusters on front edge of stairs
    const railMat = new THREE.MeshStandardMaterial({ color: '#1b1e24', metalness: 0.55, roughness: 0.45 });
    const railBar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, slopeLen + 0.2, 8), railMat);
    railBar.position.set((startX + endX) / 2, yBase + totalDy / 2 + 0.85, 0.18);
    railBar.rotation.z = slopeAngle - Math.PI / 2;
    this.scene.add(railBar);

    for (let p = 0; p <= 3; p++) {
      const t = p / 3;
      const px = startX + t * totalDx;
      const py = yBase + t * totalDy;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.88, 6), railMat);
      post.position.set(px, py + 0.44, 0.18);
      this.scene.add(post);
    }

    // Stenciled Thai floor direction plate ("ขึ้นชั้น 1/2/3")
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 48;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#171c26';
    ctx.fillRect(0, 0, 96, 48);
    ctx.strokeStyle = '#b08944';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 92, 44);
    ctx.fillStyle = '#ebcfa0';
    ctx.font = 'bold 20px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ชั้น ${fromFloor + 1}`, 48, 25);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.32),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
    );
    sign.position.set(11.35, yBase + 2.35, -1.24);
    this.scene.add(sign);
  }

  private buildFloor0YardAndGuardBooth(): void {
    // Concrete perimeter wall behind yard with ventilated Thai breeze-block trim along top
    this.addTexturedPlane(34, 4.3, createThaiWallTexture(false), 0, 2.15, -1.9, 0.95);
    this.addThaiWindow(0, -12.3, false, -1.9);
    this.addThaiWindow(0, 2.8, true, -1.9);
    // Concrete structural pilasters along dorm facade
    [-13.8, -6.2, 1.2, 7.8].forEach((px) => {
      this.addBox(this.scene, 0.36, 4.2, 0.28, '#2f3538', px, 2.1, -1.78);
    });

    // Dorm Entrance Portal & Thai Metal Accordion Gate (ประตูเหล็กยืด)
    this.addBox(this.scene, 3.9, 3.6, 0.45, '#32363d', -1.5, 1.8, -1.55);
    this.addBox(this.scene, 2.3, 2.7, 0.5, '#090c12', -1.5, 1.35, -1.42);
    for (let gx = -2.45; gx <= -0.55; gx += 0.38) {
      this.addBox(this.scene, 0.04, 2.55, 0.04, '#5a636e', gx, 1.32, -1.16);
    }

    // Dorm Wooden Sign (with solid backing offset cleanly in front of portal)
    this.addBox(this.scene, 3.66, 1.16, 0.06, '#1d120a', -1.5, 3.3, -1.26);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.1),
      new THREE.MeshStandardMaterial({ map: createDormSignTexture(), roughness: 0.75 })
    );
    signMesh.position.set(-1.5, 3.3, -1.22);
    this.scene.add(signMesh);

    // Thai Alley Street Sign ("ซอย 9") cleanly mounted in front of its pole beside the exit gate
    this.addBox(this.scene, 0.08, 2.75, 0.08, '#4e5561', -13.45, 1.38, -0.14);
    this.addBox(this.scene, 1.14, 0.58, 0.05, '#1e242b', -13.45, 2.65, -0.06);
    const alleySign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.55),
      new THREE.MeshStandardMaterial({ map: createThaiAlleySignTexture(), roughness: 0.6 })
    );
    alleySign.position.set(-13.45, 2.65, -0.03);
    this.scene.add(alleySign);

    // Guard Booth (ป้อมยาม) with slanted corrugated zinc roof + Thai jalouse window
    this.addBox(this.scene, 3.1, 2.85, 2.3, '#3c4854', -8.5, 1.42, -0.75);
    const zincMat = new THREE.MeshStandardMaterial({
      map: createZincRoofTexture(),
      roughness: 0.65,
      metalness: 0.35,
    });
    const boothRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 3.1), zincMat);
    boothRoof.position.set(-8.5, 3.05, -0.55);
    boothRoof.rotation.x = 0.14;
    this.scene.add(boothRoof);

    // Lit jalouse window on guard booth
    const boothWin = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 1.15),
      new THREE.MeshBasicMaterial({ map: createThaiWindowTexture(true) })
    );
    boothWin.position.set(-8.5, 1.75, 0.42);
    this.scene.add(boothWin);

    const boothLight = new THREE.PointLight('#ffbb5c', 2.5, 8.0, 1.5);
    boothLight.position.set(-8.5, 2.2, 1.2);
    this.scene.add(boothLight);

    // Thai Plastic Stool outside guard booth
    const stool = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.45, 10),
      new THREE.MeshStandardMaterial({ color: '#1b5e91', roughness: 0.45 })
    );
    stool.position.set(-6.5, 0.22, -0.1);
    this.scene.add(stool);

    // Thai Concrete Utility Pole + Hanging Streetlamp + Tangled Overhead Wires!
    this.addBox(this.scene, 0.28, 4.7, 0.28, '#5e6064', -4.8, 2.35, -0.95);
    this.addBox(this.scene, 1.2, 0.1, 0.1, '#4a4e54', -4.5, 4.1, -0.95);
    // Transformer drum
    const trans = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: '#454a52', metalness: 0.35 })
    );
    trans.position.set(-4.8, 3.65, -0.65);
    this.scene.add(trans);

    const poleBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshBasicMaterial({ color: '#ffd98a' })
    );
    poleBulb.position.set(-4.0, 3.65, -0.8);
    this.scene.add(poleBulb);

    const streetLight = new THREE.PointLight('#ffcc70', 2.8, 11.5, 1.35);
    streetLight.position.set(-4.0, 3.55, 1.25);
    this.scene.add(streetLight);

    const streetConeMat = new THREE.MeshBasicMaterial({
      map: createLightConeTexture('255, 200, 110'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.42,
    });
    const streetCone = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.8), streetConeMat);
    streetCone.position.set(-4.0, 1.75, -0.65);
    this.scene.add(streetCone);

    this.corridorLights.push({
      light: streetLight,
      bulbMat: poleBulb.material as THREE.MeshBasicMaterial,
      coneMat: streetConeMat,
      floor: 0,
      baseIntensity: 2.4,
      flickerSeed: 1.7,
    });

    // Overhead Soi electric poles stay strictly outside Dorm walls (x < -16, NEVER running cables across inside Floor 1!)

    // Ornate Thai Spirit House (ศาลพระภูมิ) at x = 6.2
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.22, 1.35, 8),
      new THREE.MeshStandardMaterial({ color: '#d4c4a1', roughness: 0.7 })
    );
    ped.position.set(6.2, 0.68, -0.8);
    this.scene.add(ped);
    this.addBox(this.scene, 1.0, 0.1, 0.9, '#e0d2b4', 6.2, 1.38, -0.8);
    this.addBox(this.scene, 0.78, 0.58, 0.72, '#efe3c8', 6.2, 1.7, -0.8);
    // Multi-tiered Thai roof
    const roof1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 0.45, 4),
      new THREE.MeshStandardMaterial({ color: '#8f2424', roughness: 0.5 })
    );
    roof1.rotation.y = Math.PI / 4;
    roof1.position.set(6.2, 2.2, -0.8);
    this.scene.add(roof1);
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.6, roughness: 0.3 })
    );
    spire.position.set(6.2, 2.55, -0.8);
    this.scene.add(spire);
    // Marigold garland ring
    const garland = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.04, 8, 14),
      new THREE.MeshStandardMaterial({ color: '#f5a623', roughness: 0.6 })
    );
    garland.position.set(6.2, 1.82, -0.4);
    this.scene.add(garland);
    // Red Fanta bottle prop
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.045, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: '#d91e2a', roughness: 0.2 })
    );
    bottle.position.set(6.48, 1.54, -0.45);
    this.scene.add(bottle);

    this.spiritCandleLight.position.set(6.2, 1.75, -0.25);
    this.scene.add(this.spiritCandleLight);

    // 2.5D Volumetric Banana Clumps behind Spirit House & Yard
    [4.4, 7.6].forEach((bx, idx) => {
      const clump = build25DBananaClump(0.95);
      clump.position.set(bx, 0, -1.55 - idx * 0.12);
      clump.rotation.y = idx === 0 ? 0.35 : -0.4;
      this.scene.add(clump);
    });

    // Clothesline with swaying Thai student uniform (x = 8.9)
    const poleL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 2.35, 8),
      new THREE.MeshStandardMaterial({ color: '#4a3d33' })
    );
    poleL.position.set(8.1, 1.17, -0.6);
    const poleR = poleL.clone();
    poleR.position.set(9.7, 1.17, -0.6);
    this.scene.add(poleL, poleR);
    this.addHangingWire(new THREE.Vector3(8.1, 2.2, -0.6), new THREE.Vector3(9.7, 2.2, -0.6), 0.14, 0.015);

    this.hangingUniform = this.addTexturedPlane(
      0.92,
      1.22,
      createUniformPropTexture(),
      8.9,
      1.52,
      -0.58,
      0.85,
      true
    );
  }

  private buildOuterThaiStreet(): void {
    // Spaced-out Thai Soi backdrop: shophouses, graffiti walls & lush street trees (-15 to -86)
    const wallTex = createThaiWallTexture(false);
    const graffitiTex = createGraffitiWallTexture();

    // Main outer soi back walls cleanly split around the open Side-Street T-Junction (-30.2 .. -24.0)!
    this.addTexturedPlane(10.0, 4.8, wallTex, -19.0, 2.4, -2.35, 0.95);
    this.addTexturedPlane(25.8, 4.8, wallTex, -43.1, 2.4, -2.35, 0.95);
    this.addTexturedPlane(46, 4.8, wallTex, -79, 2.4, -2.35, 0.95);

    // Side-alley left & right shophouse return walls going deep back into -Z (-30.2 and -24.0)
    [-30.2, -24.0].forEach((sideX, idx) => {
      const sideWall = new THREE.Mesh(
        new THREE.PlaneGeometry(17.0, 4.8),
        new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 })
      );
      sideWall.position.set(sideX, 2.4, -10.85);
      sideWall.rotation.y = idx === 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(sideWall);
    });

    // Graffiti murals placed strictly on solid wall segments (never across the side-alley road!)
    this.addTexturedPlane(6.5, 3.2, graffitiTex, -46.5, 1.6, -2.28, 0.92);
    this.addTexturedPlane(6.8, 3.2, graffitiTex, -66.5, 1.6, -2.28, 0.92);
    this.addTexturedPlane(6.5, 3.2, graffitiTex, -80.5, 1.6, -2.28, 0.92);

    // Upper shophouse windows along the soi
    [-18.0, -21.2, -34.5, -42.0, -59.5, -63.0, -72.5, -75.8].forEach((wx, idx) => {
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1.55, 1.28),
        new THREE.MeshBasicMaterial({ map: createThaiWindowTexture(idx % 2 === 0) })
      );
      win.position.set(wx, 2.75, -2.26);
      this.scene.add(win);
      this.addBox(this.scene, 1.72, 0.1, 0.22, '#3a4048', wx, 2.08, -2.2);
    });
    // Shophouse shutters & municipal trash bins
    [-16.2, -31.8, -48.0, -68.0].forEach((dx) => {
      this.addBox(this.scene, 1.65, 2.35, 0.12, '#3b424c', dx, 1.18, -2.28);
      for (let sy = 0.4; sy <= 2.1; sy += 0.34) {
        this.addBox(this.scene, 1.55, 0.04, 0.14, '#242930', dx, sy, -2.26);
      }
    });
    // Green/blue municipal trash bins along sidewalk
    [-23.2, -47.2, -67.2].forEach((bx, idx) => {
      this.addBox(this.scene, 0.52, 0.78, 0.52, idx % 2 === 0 ? '#15803d' : '#1d4ed8', bx, 0.39, -1.65);
    });

    // 2.5D Volumetric Thai Street Trees flanking sidewalks cleanly in open gaps
    [-23.5, -37.0, -45.2, -57.6, -67.0, -78.0].forEach((tx, idx) => {
      const tree = build25DStreetTree({ scale: idx % 2 === 0 ? 1.04 : 0.96 });
      tree.position.set(tx, 0, -2.02 - (idx % 2) * 0.08);
      tree.rotation.y = idx * 0.8;
      this.scene.add(tree);
    });

    // Tall Thai Concrete Utility Poles (6.8m) + High Curved Streetlamps placed strictly in open gaps between shops along back curb
    const poles = [-15.8, -31.2, -37.6, -46.4, -56.8, -67.8, -79.5, -94.8];
    poles.forEach((px, pIdx) => {
      // Tall concrete square pole (pushed cleanly back to z = -1.88 so it never pierces shop roofs or awnings)
      this.addBox(this.scene, 0.28, 6.9, 0.28, '#5a5f66', px, 3.45, -1.88);
      // Upper steel cross-arms & ceramic insulators
      this.addBox(this.scene, 1.35, 0.1, 0.12, '#3d424a', px, 6.25, -1.88);
      this.addBox(this.scene, 1.05, 0.08, 0.1, '#3d424a', px, 5.45, -1.88);
      [-0.5, 0, 0.5].forEach((ix) => {
        this.addBox(this.scene, 0.08, 0.16, 0.08, '#94a3b8', px + ix, 6.38, -1.88);
      });
      // Coiled black telecom cable loop hanging mid-pole (classic Bangkok soi detail!)
      if (pIdx % 2 === 1) {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(0.24, 0.032, 6, 14),
          new THREE.MeshBasicMaterial({ color: '#111318' })
        );
        coil.position.set(px + 0.18, 4.45, -1.72);
        this.scene.add(coil);
        // Utility transformer cylinder
        const tr = new THREE.Mesh(
          new THREE.CylinderGeometry(0.26, 0.26, 0.65, 12),
          new THREE.MeshStandardMaterial({ color: '#474c54', metalness: 0.4 })
        );
        tr.position.set(px - 0.28, 5.15, -1.66);
        this.scene.add(tr);
      }

      // High curved Thai streetlamp arm reaching forward over sidewalk & road (height ~5.8m)
      this.addBox(this.scene, 0.1, 0.1, 1.75, '#64748b', px, 5.85, -1.02);
      this.addBox(this.scene, 0.42, 0.14, 0.55, '#475569', px, 5.8, -0.14);

      const warmLamp = pIdx % 2 === 0;
      const bulbColor = warmLamp ? '#ffd580' : '#e6f3ff';
      const coneRgb = warmLamp ? '255, 206, 120' : '215, 238, 255';
      const highBulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.08, 0.4),
        new THREE.MeshBasicMaterial({ color: bulbColor })
      );
      highBulb.position.set(px, 5.71, -0.14);
      this.scene.add(highBulb);

      const highLight = new THREE.PointLight(bulbColor, 11.5, 26, 0.72);
      highLight.position.set(px, 5.45, 1.15);
      this.scene.add(highLight);

      const coneMat = new THREE.MeshBasicMaterial({
        map: createLightConeTexture(coneRgb),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.38,
      });
      const highCone = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.8), coneMat);
      highCone.position.set(px, 2.85, -0.05);
      this.scene.add(highCone);

      this.corridorLights.push({
        light: highLight,
        bulbMat: highBulb.material as THREE.MeshBasicMaterial,
        coneMat,
        floor: 0,
        baseIntensity: 11.5,
        flickerSeed: pIdx * 0.9,
      });
    });

    // Multi-tier tangled Thai electric & fiber cables spanning every pole cleanly along back sidewalk
    for (let i = 0; i < poles.length - 1; i++) {
      const x1 = poles[i];
      const x2 = poles[i + 1];
      this.addHangingWire(new THREE.Vector3(x1, 6.25, -1.88), new THREE.Vector3(x2, 6.25, -1.88), 0.42, 0.024);
      this.addHangingWire(new THREE.Vector3(x1, 5.45, -1.88), new THREE.Vector3(x2, 5.45, -1.88), 0.55, 0.024);
      this.addHangingWire(new THREE.Vector3(x1, 4.75, -1.78), new THREE.Vector3(x2, 4.8, -1.78), 0.78, 0.032);
      this.addHangingWire(new THREE.Vector3(x1, 4.5, -1.75), new THREE.Vector3(x2, 4.42, -1.75), 0.92, 0.022);
      this.addHangingWire(new THREE.Vector3(x1, 4.25, -1.73), new THREE.Vector3(x2, 4.22, -1.73), 0.62, 0.018);
    }

    // 1) Parking Shed (โรงจอดรถยนต์ & มอเตอร์ไซค์ at x = -17.5, generous bay spacing with Win Stand at -22.2!)
    const zincMat = new THREE.MeshStandardMaterial({
      map: createZincRoofTexture(),
      roughness: 0.65,
      metalness: 0.35,
    });
    const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 3.4), zincMat);
    shedRoof.position.set(-17.5, 2.75, -0.5);
    shedRoof.rotation.x = 0.12;
    this.scene.add(shedRoof);
    [-20.0, -15.0].forEach((sx) => {
      this.addBox(this.scene, 0.1, 2.75, 0.1, '#4b5563', sx, 1.37, 0.85);
      this.addBox(this.scene, 0.1, 2.75, 0.1, '#4b5563', sx, 1.37, -1.65);
    });
    const shedLight = new THREE.PointLight('#ffe0a8', 4.5, 14, 0.95);
    shedLight.position.set(-17.5, 2.5, 0.9);
    this.scene.add(shedLight);

    // Realistic Parked Sedan + Realistic Parked Scooter cleanly centered clear of BOTH sedan & concrete Dorm curb
    const shedSedan = buildRealisticCar({ bodyColor: '#2b3b4e', roofColor: '#233142', variant: 'sedan', facing: 1 }).group;
    shedSedan.scale.multiplyScalar(0.78);
    shedSedan.position.set(-18.5, 0, -0.72);
    this.scene.add(shedSedan);

    const shedBike = buildRealisticMotorcycle({ bodyColor: '#8c2222', withRider: false, facing: -1 }).group;
    shedBike.position.set(-16.25, 0, -0.58);
    shedBike.rotation.y = 0.08;
    this.scene.add(shedBike);

    // 2) Thai Bus Stop (ป้ายรถเมล์ at x = -34.5)
    this.addBox(this.scene, 3.2, 0.12, 1.8, '#3f4552', -34.5, 2.55, -0.65);
    this.addBox(this.scene, 2.9, 1.8, 0.14, '#2b3340', -34.5, 1.35, -1.45);
    this.addBox(this.scene, 2.1, 0.12, 0.45, '#5b6472', -34.5, 0.52, -1.05);
    this.addBox(this.scene, 0.08, 2.55, 0.08, '#475569', -35.9, 1.27, -0.1);
    this.addBox(this.scene, 0.08, 2.55, 0.08, '#475569', -33.1, 1.27, -0.1);
    this.addBox(this.scene, 0.08, 2.65, 0.08, '#64748b', -32.4, 1.32, -0.34);
    this.addBox(this.scene, 0.78, 1.15, 0.04, '#1e293b', -32.4, 2.25, -0.27);
    const busBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 1.12),
      new THREE.MeshStandardMaterial({ map: createBusStopSignTexture(), roughness: 0.6 })
    );
    busBoard.position.set(-32.4, 2.25, -0.24);
    this.scene.add(busBoard);
    const busBulb = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.14),
      new THREE.MeshBasicMaterial({ color: '#e6f3ff' })
    );
    busBulb.position.set(-34.5, 2.46, -0.6);
    this.scene.add(busBulb);
    const busLight = new THREE.PointLight('#dceeff', 4.8, 15, 0.9);
    busLight.position.set(-34.5, 2.35, 0.6);
    this.scene.add(busLight);

    // 3) Detailed Thai Noodle Cart (รถเข็นบะหมี่เกี๊ยวหมูแดง at x = -42.0) with transparent glass showcase!
    this.addBox(this.scene, 2.25, 0.92, 0.88, '#991b1b', -42.0, 0.58, -0.55); // cart lower body
    this.addBox(this.scene, 2.2, 0.08, 0.92, '#cbd5e1', -42.0, 1.06, -0.55, 0.25); // stainless counter top
    // Transparent glass display cabinet (stainless frame + crystal clear glass + bright food visible inside!)
    this.addBox(this.scene, 1.24, 0.05, 0.72, '#cbd5e1', -42.45, 1.78, -0.55, 0.25); // glass cabinet top
    [-43.04, -41.86].forEach((gx) => {
      this.addBox(this.scene, 0.04, 0.72, 0.04, '#cbd5e1', gx, 1.42, -0.21, 0.25);
      this.addBox(this.scene, 0.04, 0.72, 0.04, '#cbd5e1', gx, 1.42, -0.89, 0.25);
    });
    // Back reflector mirror + visible hanging red BBQ pork, egg noodle bundles & green veggies inside glass!
    this.addBox(this.scene, 1.16, 0.68, 0.04, '#fef9c3', -42.45, 1.42, -0.86, 0.2);
    [-42.85, -42.65, -42.45].forEach((px) => {
      this.addBox(this.scene, 0.11, 0.34, 0.14, '#b91c1c', px, 1.54, -0.55, 0.4); // mu daeng strips
    });
    [-42.2, -42.0].forEach((nx) => {
      const noodleBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 10, 8),
        new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.65 })
      );
      noodleBall.position.set(nx, 1.22, -0.52);
      this.scene.add(noodleBall);
    });
    this.addBox(this.scene, 0.24, 0.12, 0.22, '#22c55e', -42.68, 1.16, -0.45, 0.6); // crisp greens
    this.addBox(this.scene, 0.22, 0.1, 0.2, '#f8fafc', -42.36, 1.15, -0.45, 0.5); // pork meatballs
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      transparent: true,
      opacity: 0.24,
      roughness: 0.08,
      metalness: 0.15,
      depthWrite: false,
    });
    const glassFront = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.7, 0.03), glassMat);
    glassFront.position.set(-42.45, 1.42, -0.2);
    this.scene.add(glassFront);
    // Warm showcase tungsten bulb illuminating glass cabinet food
    const showcaseLight = new THREE.PointLight('#fde68a', 2.4, 5.5, 1.1);
    showcaseLight.position.set(-42.45, 1.68, -0.45);
    this.scene.add(showcaseLight);
    // Steaming stainless broth pot + ladle
    const soupPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, 0.42, 14),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.7, roughness: 0.22 })
    );
    soupPot.position.set(-41.35, 1.3, -0.55);
    this.scene.add(soupPot);
    this.addBox(this.scene, 0.04, 0.45, 0.04, '#cbd5e1', -41.25, 1.56, -0.55);
    [-42.85, -41.15].forEach((wx) => {
      const cw = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.05, 8, 14),
        new THREE.MeshStandardMaterial({ color: '#111827' })
      );
      cw.position.set(wx, 0.22, -0.12);
      this.scene.add(cw);
    });
    // Cart umbrella & sign (mounted cleanly in front of the umbrella lip so text is 100% unobstructed)
    this.addBox(this.scene, 0.06, 2.4, 0.06, '#64748b', -42.0, 1.6, -0.55);
    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(1.7, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.7 })
    );
    umbrella.position.set(-42.0, 2.95, -0.45);
    this.scene.add(umbrella);
    this.addBox(this.scene, 2.15, 0.7, 0.04, '#7f1d1d', -42.0, 2.4, 0.95);
    const noodleSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.66),
      new THREE.MeshStandardMaterial({ map: createNoodleCartSignTexture(), roughness: 0.6 })
    );
    noodleSign.position.set(-42.0, 2.4, 0.98);
    this.scene.add(noodleSign);
    // Folding sidewalk table, red plastic stools & noodle bowls
    this.addBox(this.scene, 1.25, 0.06, 0.85, '#cbd5e1', -39.8, 0.68, 0.15);
    this.addBox(this.scene, 0.06, 0.68, 0.75, '#475569', -39.8, 0.34, 0.15);
    [-40.15, -39.45].forEach((bx) => {
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.09, 0.09, 12),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
      );
      bowl.position.set(bx, 0.76, 0.14);
      this.scene.add(bowl);
    });
    this.addBox(this.scene, 0.12, 0.18, 0.12, '#e2e8f0', -39.8, 0.8, 0.16); // condiment caddy
    [-40.5, -39.1].forEach((sx) => {
      const stool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.24, 0.42, 10),
        new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.45 })
      );
      stool.position.set(sx, 0.21, 0.2);
      this.scene.add(stool);
    });
    this.noodleLight.position.set(-42.0, 2.45, 1.45);
    this.scene.add(this.noodleLight);

    // 4) True 3D Recessed 24-Seven Convenience Store Front (เซเว่นปากซอย at x = -51.5) — Deep interior visible through real glass!
    const sX = -51.5;
    // Recessed store back wall (z = -2.25) + interior light ceiling, terrazzo floor & framing pillars
    this.addBox(this.scene, 6.4, 2.75, 0.16, '#f8fafc', sX, 1.4, -2.25, 0.35);
    this.addBox(this.scene, 6.4, 0.08, 2.2, '#e2e8f0', sX, 0.04, -1.2, 0.25); // bright floor
    this.addBox(this.scene, 6.4, 0.14, 2.2, '#ffffff', sX, 2.78, -1.2, 0.25); // clean ceiling
    [-54.45, -48.55].forEach((wx) => {
      this.addBox(this.scene, 0.55, 2.8, 2.2, '#f1f5f9', wx, 1.4, -1.2, 0.45);
    });
    // Glowing interior 7-Eleven tri-color frieze + 3D stocked snack shelves & brightly lit cooler visible inside!
    this.addBox(this.scene, 5.4, 0.12, 0.05, '#f97316', sX, 2.48, -2.15);
    this.addBox(this.scene, 5.4, 0.1, 0.05, '#16a34a', sX, 2.36, -2.15);
    this.addBox(this.scene, 5.4, 0.08, 0.05, '#ef4444', sX, 2.25, -2.15);
    // 3D snack gondola racks on left & right wings (leaving center automatic doorway WIDE OPEN!)
    const gxL = -53.35;
    this.addBox(this.scene, 1.35, 1.55, 0.45, '#e2e8f0', gxL, 0.8, -1.78, 0.45);
    ['#ef4444', '#facc15', '#22c55e', '#38bdf8'].forEach((pc, pi) => {
      this.addBox(this.scene, 0.22, 0.28, 0.22, pc, gxL - 0.45 + pi * 0.3, 1.28, -1.62, 0.35);
      this.addBox(this.scene, 0.22, 0.26, 0.22, pc, gxL - 0.45 + pi * 0.3, 0.78, -1.62, 0.35);
    });
    // Interior checkout counter tucked cleanly on the right wing behind the right window (-49.65), NEVER blocking center door!
    this.addBox(this.scene, 1.55, 0.88, 0.6, '#ffffff', -49.65, 0.44, -1.55, 0.35);
    this.addBox(this.scene, 1.58, 0.08, 0.64, '#16a34a', -49.65, 0.9, -1.55, 0.35);
    this.addBox(this.scene, 1.65, 1.65, 0.4, '#e2e8f0', -51.5, 0.85, -1.96, 0.4); // deep rear chilled aisle wall rack
    const inShopLight = new THREE.PointLight('#ffffff', 4.6, 9.5, 0.9);
    inShopLight.position.set(sX, 2.45, -1.0);
    this.scene.add(inShopLight);
    // Protruding 3D Sign Canopy (z = -0.18 .. +0.32) with stepped bezel & glowing fascia!
    this.addBox(this.scene, 6.65, 1.15, 0.55, '#f8fafc', sX, 3.32, -0.08, 0.35);
    this.addBox(this.scene, 6.72, 0.14, 0.62, '#cbd5e1', sX, 3.88, -0.05, 0.3);
    const fascia = new THREE.Mesh(
      new THREE.PlaneGeometry(6.35, 0.98),
      new THREE.MeshBasicMaterial({ map: createConvenienceStoreSignTexture() })
    );
    fascia.position.set(sX, 3.3, 0.21);
    this.scene.add(fascia);
    // Real aluminum frame + OPEN center automatic doorway (-52.2 .. -50.8) + parted sliding glass panels on left/right!
    [-54.15, -52.45, -50.55, -48.85].forEach((mx) => {
      this.addBox(this.scene, 0.08, 2.7, 0.1, '#334155', mx, 1.35, -0.18, 0.4);
    });
    this.addBox(this.scene, 5.4, 0.1, 0.1, '#334155', sX, 2.68, -0.18, 0.4);
    [-53.3, -49.7].forEach((px) => {
      const sidePane = new THREE.Mesh(new THREE.BoxGeometry(1.62, 2.55, 0.03), glassMat);
      sidePane.position.set(px, 1.32, -0.18);
      this.scene.add(sidePane);
    });
    // Slightly retracted open sliding door leaves flanking the open center entrance
    [-52.18, -50.82].forEach((dx) => {
      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.5, 0.04), glassMat);
      doorLeaf.position.set(dx, 1.3, -0.15);
      this.scene.add(doorLeaf);
    });
    // Exterior threshold step, green welcome mat & sidewalk ATM kiosk flanking storefront!
    this.addBox(this.scene, 5.8, 0.06, 0.65, '#cbd5e1', sX, 0.03, 0.12, 0.6);
    this.addBox(this.scene, 1.5, 0.07, 0.42, '#16a34a', sX, 0.04, 0.16, 0.85);
    this.addBox(this.scene, 0.55, 1.45, 0.42, '#1d4ed8', sX - 2.95, 0.72, -0.04, 0.35); // sidewalk ATM
    this.addBox(this.scene, 0.38, 0.32, 0.05, '#bae6fd', sX - 2.95, 1.08, 0.18);
    const storeLight = new THREE.PointLight('#eef8ff', 3.8, 13.5, 1.15);
    storeLight.position.set(sX, 2.65, 1.65);
    this.scene.add(storeLight);

    // 5) Thai Street Market Stalls (ตลาดร้านค้า & แผงป้ากิม at x = -61.0)
    const awningMat = new THREE.MeshStandardMaterial({
      map: createMarketAwningTexture(),
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const awning1 = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.3), awningMat);
    awning1.position.set(-61.0, 2.55, -0.35);
    awning1.rotation.x = -0.95;
    this.scene.add(awning1);
    const awning2 = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.1), awningMat);
    awning2.position.set(-64.8, 2.5, -0.35);
    awning2.rotation.x = -0.95;
    this.scene.add(awning2);
    [-63.0, -59.0, -66.2].forEach((mx) => {
      this.addBox(this.scene, 0.08, 2.55, 0.08, '#475569', mx, 1.27, 0.15);
    });
    this.addBox(this.scene, 3.6, 0.88, 0.9, '#6b442a', -61.0, 0.44, -0.65);
    this.addBox(this.scene, 2.8, 0.85, 0.85, '#593722', -64.6, 0.42, -0.65);
    // Transparent sneeze-guard showcase over curry pots showing colored curries inside!
    const mGlass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.48, 0.03), glassMat);
    mGlass.position.set(-61.2, 1.15, -0.22);
    this.scene.add(mGlass);
    [-61.9, -61.2, -60.5].forEach((px, pi) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.16, 0.24, 12),
        new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.65, roughness: 0.25 })
      );
      pot.position.set(px, 1.0, -0.55);
      this.scene.add(pot);
      // Visible curry / stew surface inside each pot
      const stew = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.03, 12),
        new THREE.MeshStandardMaterial({ color: ['#65a30d', '#ea580c', '#78350f'][pi], roughness: 0.3 })
      );
      stew.position.set(px, 1.12, -0.55);
      this.scene.add(stew);
    });
    this.addBox(this.scene, 2.34, 0.69, 0.04, '#3b2416', -61.0, 2.26, 0.62);
    const marketSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 0.65),
      new THREE.MeshStandardMaterial({ map: createMarketSignTexture(), roughness: 0.65 })
    );
    marketSign.position.set(-61.0, 2.26, 0.65);
    this.scene.add(marketSign);
    const marketLight = new THREE.PointLight('#ffca78', 3.0, 11, 1.3);
    marketLight.position.set(-61.2, 2.45, 1.45);
    this.scene.add(marketLight);

    // 6) Thai Isaan Food & Drink Restaurant (ร้านลาบ-ส้มตำ แซ่บซอย 9 at x = -72.5)
    const isaanRoof = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.12, 3.6), zincMat);
    isaanRoof.position.set(-72.5, 2.8, -0.45);
    isaanRoof.rotation.x = 0.14;
    this.scene.add(isaanRoof);
    [-75.8, -69.2].forEach((ix) => {
      this.addBox(this.scene, 0.1, 2.8, 0.1, '#475569', ix, 1.4, 0.9);
      this.addBox(this.scene, 0.1, 2.8, 0.1, '#475569', ix, 1.4, -1.7);
    });
    this.addBox(this.scene, 2.64, 0.84, 0.04, '#14532d', -71.5, 2.52, 1.38);
    const isaanSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.8),
      new THREE.MeshStandardMaterial({ map: createIsaanSignTexture(), roughness: 0.55 })
    );
    isaanSign.position.set(-71.5, 2.52, 1.42);
    this.scene.add(isaanSign);
    // Glass Somtam & Sticky Rice Cabinet + Mortar + Charcoal Grill with sizzling pork!
    this.addBox(this.scene, 1.35, 0.85, 0.72, '#334155', -73.6, 0.42, -0.78);
    const sGlass = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.52, 0.56), glassMat);
    sGlass.position.set(-73.6, 1.12, -0.78);
    this.scene.add(sGlass);
    this.addBox(this.scene, 0.34, 0.18, 0.24, '#84cc16', -73.85, 0.96, -0.78); // shredded green papaya
    this.addBox(this.scene, 0.24, 0.14, 0.2, '#ef4444', -73.45, 0.95, -0.78); // red tomatoes
    const kratib = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.85 })
    );
    kratib.position.set(-73.12, 0.98, -0.68);
    this.scene.add(kratib);
    // Charcoal grill with glowing embers + pork neck skewers + red ice cooler
    this.addBox(this.scene, 1.15, 0.82, 0.65, '#334155', -75.05, 0.41, -0.85);
    this.addBox(this.scene, 0.85, 0.08, 0.45, '#ea580c', -75.05, 0.84, -0.85);
    this.addBox(this.scene, 0.55, 0.06, 0.32, '#9a3412', -75.05, 0.91, -0.85); // grilling pork neck
    this.addBox(this.scene, 0.72, 0.56, 0.52, '#b91c1c', -69.8, 0.28, -0.65); // red ice box
    // Round drinking table + amber bottles & ice bucket
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.4 })
    );
    tableTop.position.set(-72.1, 0.72, -0.15);
    this.scene.add(tableTop);
    this.addBox(this.scene, 0.08, 0.7, 0.08, '#475569', -72.1, 0.35, -0.15);
    [-72.3, -72.05, -71.85].forEach((bx, i) => {
      this.addBox(this.scene, 0.07, 0.25, 0.07, i === 1 ? '#e2e8f0' : '#78350f', bx, 0.87, -0.15);
    });
    this.isaanLight.position.set(-72.5, 2.45, 1.5);
    this.scene.add(this.isaanLight);

    // 7) Abandoned House at end of Soi 9 (บ้านร้างท้ายซอย at x = -88.6) + Rusted Fence & Gangster Hangout
    // Decaying two-story concrete & timber structure with crooked sagging corrugated roof
    this.addBox(this.scene, 6.2, 3.8, 2.2, '#24292e', -88.6, 1.9, -1.65, 0.95);
    this.addBox(this.scene, 5.2, 2.2, 1.9, '#2e221b', -88.6, 4.6, -1.75, 0.92); // upper timber loft
    const abadRoof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.16, 3.2), zincMat);
    abadRoof.position.set(-88.6, 5.8, -1.4);
    abadRoof.rotation.set(0.18, 0, -0.05);
    this.scene.add(abadRoof);
    // Boarded dark crooked windows & front porch pillars
    [-90.2, -87.0].forEach((wx) => {
      this.addThaiWindow(0, wx, false, -0.58);
      this.addBox(this.scene, 1.7, 0.14, 0.08, '#4a3121', wx, 2.1, -0.45).rotation.z = 0.24;
      this.addBox(this.scene, 1.7, 0.14, 0.08, '#3b2416', wx, 1.8, -0.44).rotation.z = -0.18;
    });
    // Rusted corrugated zinc fence & broken crooked entrance gap
    [-92.2, -91.0, -86.2, -85.0].forEach((fx) => {
      this.addBox(this.scene, 1.1, 1.75, 0.1, '#4b382e', fx, 0.88, -0.42, 0.85);
    });
    this.addBox(this.scene, 0.1, 2.2, 0.1, '#525862', -85.4, 1.1, -0.15);
    const abadSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 0.78),
      new THREE.MeshStandardMaterial({ map: createAbandonedSignTexture(), roughness: 0.75 })
    );
    abadSign.position.set(-85.4, 1.65, -0.08);
    abadSign.rotation.z = -0.06;
    this.scene.add(abadSign);
    // 2.5D gnarled dark tree by the abandoned gate + dim creepy porch glow
    const darkTree = build25DStreetTree({ dark: true, scale: 1.06 });
    darkTree.position.set(-93.4, 0, -1.25);
    this.scene.add(darkTree);
    const abadLight = new THREE.PointLight('#648270', 2.6, 12, 1.2);
    abadLight.position.set(-88.6, 2.6, 0.8);
    this.scene.add(abadLight);
  }

  private buildAmbientTrafficAndPedestrians(shadowTex: THREE.CanvasTexture): void {
    // 1) Realistic Moving Motorcycles with articulated riders along Soi 9 road
    [
      { x: -46, z: 3.1, speed: 6.8, dir: 1 as const, col: '#b91c1c', jacket: '#f97316', winVest: true },
      { x: -58, z: 3.45, speed: 7.4, dir: -1 as const, col: '#1d4ed8', jacket: '#1e293b', winVest: false },
    ].forEach((cfg) => {
      const grp = buildRealisticMotorcycle({
        bodyColor: cfg.col,
        withRider: true,
        riderJacket: cfg.jacket,
        winVest: cfg.winVest,
        facing: cfg.dir,
      }).group;
      grp.position.set(cfg.x, 0, cfg.z);
      this.exteriorGroup.add(grp);
      this.movingVehicles.push({ group: grp, speed: cfg.speed, minX: -90, maxX: -27.2, baseZ: cfg.z, dir: cfg.dir });
    });

    // 2) Realistic Moving Thai Cars (Green-Yellow Bangkok Taxi & Silver Sedan at z = +4.15)
    [
      { x: -75, z: 4.1, speed: 8.6, dir: 1 as const, variant: 'taxi' as const, body: '#16a34a', roof: '#eab308' },
      { x: -36, z: 4.55, speed: 9.2, dir: -1 as const, variant: 'sedan' as const, body: '#475569', roof: '#64748b' },
    ].forEach((car) => {
      const grp = buildRealisticCar({
        bodyColor: car.body,
        roofColor: car.roof,
        variant: car.variant,
        facing: car.dir,
      }).group;
      grp.scale.multiplyScalar(0.84);
      grp.position.set(car.x, 0, car.z);
      this.exteriorGroup.add(grp);
      this.movingVehicles.push({ group: grp, speed: car.speed, minX: -90, maxX: -27.2, baseZ: car.z, dir: car.dir });
    });

    // 3) Walking Sidewalk Pedestrians (Distinct student, office woman & night worker)
    const pDefs: { kind: 'student' | 'worker' | 'worker_yellow' | 'office_lady'; x: number; z: number; speed: number; minX: number; maxX: number; dir: 1 | -1; dayOnly: boolean; nightOnly: boolean }[] = [
      { kind: 'student', x: -34, z: 0.4, speed: 1.55, minX: -102, maxX: 30, dir: 1, dayOnly: true, nightOnly: false },
      { kind: 'office_lady', x: -64, z: 0.65, speed: 1.35, minX: -106, maxX: -24, dir: -1, dayOnly: true, nightOnly: false },
      { kind: 'worker_yellow', x: -55, z: 0.35, speed: 1.45, minX: -84, maxX: 34, dir: -1, dayOnly: false, nightOnly: true },
    ];
    pDefs.forEach((pd) => {
      const mesh = this.makeLitCharacter(this.charFrames[pd.kind][0], 1.45, 2.15);
      mesh.position.set(pd.x, 0.9, pd.z);
      const shadow = this.makeFloorShadow(shadowTex, 0.5);
      shadow.position.set(pd.x, 0.025, pd.z);
      this.exteriorGroup.add(mesh, shadow);
      this.pedestrians.push({ ...pd, mesh, shadow });
    });
  }

  private buildFloor1Lobby(): void {
    const y = FLOOR_HEIGHT;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.35),
      new THREE.MeshBasicMaterial({ map: createNoticeBoardTexture() })
    );
    board.position.set(-9.2, y + 1.9, -1.32);
    this.scene.add(board);

    this.addThaiWindow(1, -12.0, false);
    this.addThaiWindow(1, -1.0, true);
    this.addThaiWindow(1, 5.2, false);
    this.addThaiWindow(1, 9.5, true);

    // Green/Steel Thai dorm mailboxes (x = -4.5)
    this.addBox(this.scene, 2.2, 1.45, 0.35, '#4c5966', -4.5, y + 1.6, -1.28);
    for (let i = 0; i < 4; i++) {
      this.addBox(this.scene, 0.42, 0.46, 0.38, '#232933', -5.2 + i * 0.48, y + 1.85, -1.24);
      this.addBox(this.scene, 0.42, 0.46, 0.38, '#232933', -5.2 + i * 0.48, y + 1.32, -1.24);
    }

    // Storage room door (x = 2.5)
    this.addThaiDoor(1, 2.5, 'เก็บของ');

    // Main electrical breaker panel (x = 7.5)
    this.addBox(this.scene, 0.85, 1.15, 0.22, '#3d4552', 7.5, y + 1.75, -1.32);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), this.breakerLedMat);
    led.position.set(7.75, y + 2.15, -1.19);
    this.scene.add(led);

    this.addCorridorLight(1, -7.5, '#e8f4ff', '200, 235, 255', 1.75, 2.3);
    this.addCorridorLight(1, 3.5, '#e0f2ff', '190, 230, 255', 1.85, 6.1);
  }

  private buildFloor2Residential(): void {
    this.addThaiWindow(2, -12.4, false);
    this.addThaiDoor(2, -9.5, '202');
    this.addThaiWindow(2, -6.2, true);
    this.addThaiDoor(2, -2.5, 'ห้องน้ำ');
    this.addThaiWindow(2, 1.6, false);
    this.addThaiDoor(2, 5.4, '204');
    this.addThaiWindow(2, 8.8, true);

    this.addCorridorLight(2, -8.5, '#ffe3b3', '255, 220, 165', 1.75, 3.2);
    this.addCorridorLight(2, -2.5, '#9ce8ff', '130, 230, 255', 1.45, 6.4);
    this.addCorridorLight(2, 5.8, '#ffe3b3', '255, 220, 165', 1.65, 9.8);
  }

  private buildFloor3Forbidden(): void {
    const y = FLOOR_HEIGHT * 3;
    this.addThaiWindow(3, -12.3, false);
    this.addThaiWindow(3, -8.8, false);
    this.addThaiDoor(3, -5.6, '302', false);
    this.addThaiWindow(3, -1.8, false);
    this.addThaiWindow(3, 7.0, false);
    this.addThaiWindow(3, 9.4, false);

    // Rusty Ceiling fan slowly spinning
    this.ceilingFan.position.set(-4.0, y + 3.65, -0.2);
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: '#262930' })
    );
    this.ceilingFan.add(rod);
    this.addBox(this.ceilingFan, 1.8, 0.03, 0.16, '#383d47', 0, -0.22, 0);
    this.addBox(this.ceilingFan, 0.16, 0.03, 1.8, '#383d47', 0, -0.22, 0);
    this.scene.add(this.ceilingFan);

    // Room 304 (Prim's room with blood/scratch damage)
    this.addThaiDoor(3, 3.5, '304', true);

    // Holy thread / talisman seal on Room 304
    this.addBox(this.room304SealGroup, 1.4, 0.05, 0.05, '#e8dec1', 3.5, y + 1.5, -1.16);
    this.addBox(this.room304SealGroup, 1.4, 0.05, 0.05, '#e8dec1', 3.5, y + 1.1, -1.16);
    this.addBox(this.room304SealGroup, 0.24, 0.65, 0.04, '#a62121', 3.5, y + 1.45, -1.13);
    this.scene.add(this.room304SealGroup);

    // Detailed chain & padlock gate blocking Floor 3 stairwell
    const fy = FLOOR_HEIGHT * 2;
    this.addBox(this.floor3GateMesh, 1.75, 0.14, 0.08, '#991b1b', 11.4, fy + 1.25, 0.35);
    this.addBox(this.floor3GateMesh, 0.1, 1.4, 0.1, '#475569', 10.75, fy + 0.7, 0.35);
    this.addBox(this.floor3GateMesh, 0.1, 1.4, 0.1, '#475569', 12.1, fy + 0.7, 0.35);
    // Steel chain links & brass padlock
    for (let cx = 10.85; cx <= 12.0; cx += 0.22) {
      const link = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.02, 6, 10),
        new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.75, roughness: 0.3 })
      );
      link.position.set(cx, fy + 0.92, 0.4);
      this.floor3GateMesh.add(link);
    }
    this.addBox(this.floor3GateMesh, 0.18, 0.22, 0.08, '#d4af37', 11.4, fy + 0.85, 0.44, 0.35);
    this.scene.add(this.floor3GateMesh);

    this.addCorridorLight(3, -8.0, '#b5d6ff', '160, 200, 255', 0.5, 11.2);
    this.addCorridorLight(3, 3.5, '#ffd0a6', '255, 195, 145', 0.45, 14.5);
  }

  private buildDistantAlleyAndParallax(): void {
    // Distant Bangkok shophouse silhouettes (z = -6.5) for rich atmospheric depth
    const heights = [9, 13, 10, 15, 8, 12];
    heights.forEach((h, i) => {
      const bx = -16 + i * 6.5;
      const b = this.addBox(this.scene, 5.4, h, 2, '#0c101b', bx, h / 2 - 0.5, -6.8, 1.0);
      b.castShadow = false;
      // Tiny distant apartment window lights
      if (i % 2 === 1) {
        const w = new THREE.Mesh(
          new THREE.PlaneGeometry(0.45, 0.55),
          new THREE.MeshBasicMaterial({ color: '#c48d44' })
        );
        w.position.set(bx - 0.8, h * 0.65, -5.75);
        this.scene.add(w);
      }
    });

    // Foreground parallax utility pole silhouette on far left (z = 4.6)
    const fgPole = this.addBox(this.scene, 0.25, 14, 0.25, '#07090f', -13.5, 6.5, 4.5, 1.0);
    fgPole.castShadow = false;
  }

  private buildRoomInteriors(): void {
    const wallTex12 = createThaiWallTexture(false);
    const wallTex3 = createThaiWallTexture(true);
    const bathWallTex = createBathroomTileTexture();
    const tileTex = createThaiTileFloorTexture();
    const winDark = createThaiWindowTexture(false);
    const winLit = createThaiWindowTexture(true);
    const calNormal = createCalendarTexture(false);
    const calOct = createCalendarTexture(true);
    const mirrorTex = createCrackedMirrorTexture(false);
    const bloodMirrorTex = createCrackedMirrorTexture(true);

    const createShell = (
      room: RoomId,
      darkStyle: boolean,
      lightColor: string,
      rgbStr: string,
      lightIntensity: number,
      hasWindow: boolean,
      winX = 0.5,
      winLitFlag = false,
      customWallTex?: THREE.Texture
    ): THREE.Group => {
      const g = new THREE.Group();
      g.visible = false;
      this.scene.add(g);
      this.roomGroups[room] = g;

      // Floor with patterned tiles
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(12.4, 0.28, 4.6),
        new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.65, metalness: 0.06 })
      );
      floor.position.set(0, -0.14, 0.3);
      floor.receiveShadow = true;
      g.add(floor);

      // Ceiling + Top Molding
      this.addBox(g, 12.6, 0.24, 4.8, '#20242b', 0, 4.12, 0.3);
      this.addBox(g, 12.2, 0.1, 0.14, '#2f353d', 0, 3.96, -1.44);

      // Back Wall + Baseboard Molding + Side Walls
      const bw = new THREE.Mesh(
        new THREE.PlaneGeometry(12.6, 4.3),
        new THREE.MeshStandardMaterial({
          map: customWallTex ?? (darkStyle ? wallTex3 : wallTex12),
          roughness: 0.9,
        })
      );
      bw.position.set(0, 2.05, -1.5);
      bw.receiveShadow = true;
      g.add(bw);
      this.addBox(g, 12.2, 0.12, 0.08, '#24292e', 0, 0.06, -1.46);

      this.addBox(g, 0.45, 4.3, 4.8, darkStyle ? '#22262b' : '#313734', -6.1, 2.05, 0.3);
      this.addBox(g, 0.45, 4.3, 4.8, darkStyle ? '#22262b' : '#313734', 6.1, 2.05, 0.3);

      // Exit Door on left (-4.6) + light switch + doormat
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(1.42, 2.52),
        new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ออก'), roughness: 0.78 })
      );
      door.position.set(-4.6, 1.26, -1.42);
      g.add(door);
      this.addBox(g, 0.12, 0.18, 0.04, '#cbd5e1', -3.68, 1.32, -1.46); // light switch
      this.addBox(g, 1.2, 0.03, 0.65, '#473629', -4.6, 0.015, -0.95); // doormat

      if (hasWindow) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(1.75, 1.38),
          new THREE.MeshStandardMaterial({
            map: winLitFlag ? winLit : winDark,
            roughness: 0.45,
            emissive: winLitFlag ? '#2b1b08' : '#101d30',
            emissiveIntensity: 0.5,
          })
        );
        win.position.set(winX, 2.05, -1.42);
        g.add(win);
        this.addBox(g, 1.94, 0.1, 0.24, '#363b42', winX, 1.32, -1.36);
        this.addBox(g, 1.98, 0.08, 0.28, '#2c3138', winX, 2.78, -1.34);
        // Curtain rod + flanking cloth curtains
        this.addBox(g, 2.35, 0.04, 0.06, '#64748b', winX, 2.9, -1.34);
        const curtainCol = darkStyle ? '#374151' : '#574c41';
        this.addBox(g, 0.32, 1.65, 0.08, curtainCol, winX - 0.95, 2.05, -1.32);
        this.addBox(g, 0.32, 1.65, 0.08, curtainCol, winX + 0.95, 2.05, -1.32);
      }

      // Ceiling Fluorescent Light + Soft Volumetric Cone
      this.addBox(g, 1.4, 0.08, 0.22, '#2b303a', 0, 3.92, -0.2);
      const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(1.22, 0.06, 0.12),
        new THREE.MeshBasicMaterial({ color: lightColor })
      );
      bulb.position.set(0, 3.86, -0.2);
      g.add(bulb);

      const cone = new THREE.Mesh(
        new THREE.PlaneGeometry(3.8, 3.8),
        new THREE.MeshBasicMaterial({
          map: createLightConeTexture(rgbStr),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.24,
        })
      );
      cone.position.set(0, 2.0, -0.2);
      g.add(cone);

      const light = new THREE.PointLight(lightColor, lightIntensity, 14, 1.1);
      light.position.set(0, 3.6, 1.65);
      g.add(light);
      this.roomLights.push({ room, light, baseIntensity: lightIntensity });

      return g;
    };

    // 1. Storage Room (ห้องเก็บของ ชั้น 1)
    const storage = createShell('storage', true, '#ffdfa8', '255, 220, 165', 1.85, false);
    // 3-tier industrial rack on right (x = 2.8)
    [0.55, 1.3, 2.05].forEach((sy) => {
      this.addBox(storage, 2.6, 0.07, 0.9, '#593b24', 2.8, sy, -0.9);
    });
    [-1.22, 0, 1.22].forEach((dx) => {
      this.addBox(storage, 0.09, 2.35, 0.9, '#3d2716', 2.8 + dx, 1.18, -0.9);
    });
    // Detailed supply boxes, blue/white water jugs, paint cans
    this.addBox(storage, 0.72, 0.48, 0.62, '#8c6b45', 2.15, 0.83, -0.9);
    this.addBox(storage, 0.56, 0.42, 0.55, '#a17c50', 3.45, 0.8, -0.9);
    this.addBox(storage, 0.42, 0.48, 0.42, '#2563eb', 2.25, 1.58, -0.88); // blue jug
    this.addBox(storage, 0.65, 0.48, 0.55, '#7a5c3a', 3.35, 1.58, -0.9);
    this.addBox(storage, 0.45, 0.38, 0.45, '#b91c1c', 2.55, 2.28, -0.9); // red toolbox
    // Wooden crates, red mop bucket, broom & dustpan in center
    this.addBox(storage, 1.15, 0.62, 0.88, '#4f3825', -0.4, 0.31, -0.95);
    this.addBox(storage, 0.75, 0.42, 0.65, '#66482f', -0.25, 0.83, -0.95);
    this.addBox(storage, 0.44, 0.36, 0.44, '#991b1b', -1.85, 0.18, -0.85); // mop bucket
    this.addBox(storage, 0.05, 1.75, 0.05, '#755336', -2.35, 0.88, -1.2); // broomstick
    // Wall pegboard/checklist
    this.addBox(storage, 0.8, 1.0, 0.04, '#cbd5e1', -2.6, 1.85, -1.46);

    // 2. Room 202 (ห้องพระเอก ชั้น 2)
    const r202 = createShell('room202', false, '#ffe6ba', '255, 226, 180', 2.1, true, 0.4, true);
    // Tall wooden wardrobe with louver vent & brass handles (x = -2.4)
    this.addBox(r202, 1.35, 2.45, 0.82, '#4f311e', -2.4, 1.22, -1.0);
    this.addBox(r202, 0.04, 1.9, 0.04, '#2e1b0f', -2.4, 1.25, -0.58);
    this.addBox(r202, 0.06, 0.18, 0.05, '#d4af37', -2.52, 1.25, -0.56);
    this.addBox(r202, 0.06, 0.18, 0.05, '#d4af37', -2.28, 1.25, -0.56);
    // Woven patterned rug beside bed
    const rug202 = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.45),
      new THREE.MeshStandardMaterial({ map: createRugTexture('#4f3626', '#c89e4c'), roughness: 0.9 })
    );
    rug202.rotation.x = -Math.PI / 2;
    rug202.position.set(1.3, 0.015, 0.25);
    r202.add(rug202);
    // Study desk + glowing warm desk lamp + laptop + mug + tucked chair (x = -0.6)
    this.addBox(r202, 1.45, 0.08, 0.82, '#694329', -0.6, 0.76, -0.96);
    [-1.25, 0.05].forEach((lx) => this.addBox(r202, 0.08, 0.74, 0.72, '#472c1b', lx, 0.37, -0.96));
    this.addBox(r202, 0.14, 0.34, 0.14, '#d4af37', -1.02, 0.97, -1.02); // lamp stand
    this.addBox(r202, 0.32, 0.22, 0.32, '#f59e0b', -1.02, 1.18, -1.02); // lamp shade
    const deskLamp = new THREE.PointLight('#ffbe5e', 1.4, 4.2, 1.5);
    deskLamp.position.set(-1.02, 1.12, -0.78);
    r202.add(deskLamp);
    this.addBox(r202, 0.42, 0.04, 0.3, '#cbd5e1', -0.45, 0.82, -0.92); // notebook/laptop
    this.addBox(r202, 0.48, 0.46, 0.48, '#3b2416', -0.45, 0.46, -0.45); // chair
    // Calendar + Thai wall fan
    const cal202 = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.74), new THREE.MeshStandardMaterial({ map: calNormal }));
    cal202.position.set(-1.3, 2.25, -1.46);
    r202.add(cal202);
    // Single Bed with headboard, sheet, folded blanket, two pillows (x = 2.9)
    this.addBox(r202, 0.12, 1.05, 1.32, '#3d2618', 1.65, 0.52, -0.78); // headboard
    this.addBox(r202, 2.45, 0.38, 1.28, '#4a3121', 2.9, 0.19, -0.78);
    this.addBox(r202, 2.32, 0.24, 1.18, '#dbeafe', 2.92, 0.48, -0.78);
    this.addBox(r202, 1.5, 0.26, 1.2, '#1e3a5f', 3.3, 0.5, -0.78); // navy blanket
    this.addBox(r202, 0.52, 0.14, 0.82, '#f8fafc', 2.02, 0.65, -0.78); // pillow

    // 3. Bathroom Floor 2 (ห้องน้ำรวม ชั้น 2 — with Thai ceramic wall tiles!)
    const bath = createShell('bathroom2', false, '#a5f3fc', '130, 230, 255', 1.75, true, 0.4, false, bathWallTex);
    // Double porcelain sink counter + chrome faucets + soap & cup (x = -1.5)
    this.addBox(bath, 1.65, 0.18, 0.68, '#d1d5db', -1.5, 0.92, -1.12);
    this.addBox(bath, 0.22, 0.84, 0.35, '#9ca3af', -2.1, 0.42, -1.15);
    this.addBox(bath, 0.22, 0.84, 0.35, '#9ca3af', -0.9, 0.42, -1.15);
    [-1.85, -1.15].forEach((fx) => {
      this.addBox(bath, 0.06, 0.18, 0.12, '#cbd5e1', fx, 1.1, -1.32); // faucet
    });
    this.addBox(bath, 0.1, 0.16, 0.1, '#10b981', -1.5, 1.09, -1.18); // soap bottle
    const mirror = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.15),
      new THREE.MeshStandardMaterial({ map: mirrorTex, metalness: 0.45, roughness: 0.25 })
    );
    mirror.position.set(-1.5, 1.82, -1.44);
    bath.add(mirror);
    // Towel rack + hanging damp towel
    this.addBox(bath, 0.7, 0.04, 0.08, '#94a3b8', -2.8, 1.45, -1.42);
    this.addBox(bath, 0.48, 0.72, 0.05, '#cbd5e1', -2.8, 1.1, -1.38);
    // Metal floor drain grate + Thai water bucket & dipper (x = -0.2)
    this.addBox(bath, 0.45, 0.03, 0.45, '#1e293b', -0.2, 0.02, -0.55);
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.19, 0.42, 12),
      new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 })
    );
    bucket.position.set(0.65, 0.21, -1.05);
    bath.add(bucket);
    // Two detailed toilet stall partitions + doors + brass latches
    [2.0, 3.8].forEach((tx) => {
      this.addBox(bath, 1.5, 2.35, 0.08, '#3b5759', tx, 1.18, -0.75);
      this.addBox(bath, 0.08, 2.35, 1.15, '#2d4547', tx - 0.75, 1.18, -1.1);
      this.addBox(bath, 0.14, 0.05, 0.04, '#d4af37', tx - 0.5, 1.15, -0.69); // latch
    });

    // 4. Room 204 (ห้องพี่ต้อม ชั้น 2)
    const r204 = createShell('room204', true, '#ffd4a3', '255, 212, 160', 1.6, true, 0.6, false);
    // Wardrobe + hanging maroon shop jacket (x = -2.4)
    this.addBox(r204, 1.32, 2.42, 0.82, '#382216', -2.4, 1.21, -1.0);
    this.addBox(r204, 0.52, 0.85, 0.08, '#5a2128', -1.55, 1.65, -1.4); // shop jacket on hook
    // Messy desk + glowing monitor + beer bottles + chair (x = 0.2)
    this.addBox(r204, 1.55, 0.78, 0.85, '#472c1b', 0.2, 0.39, -0.95);
    this.addBox(r204, 0.62, 0.42, 0.06, '#0f172a', 0.15, 1.05, -1.12); // monitor
    this.addBox(r204, 0.56, 0.36, 0.04, '#38bdf8', 0.15, 1.05, -1.08); // screen glow
    [0.65, 0.8].forEach((bx) => {
      this.addBox(r204, 0.09, 0.24, 0.09, '#15803d', bx, 0.9, -0.88);
    });
    this.addBox(r204, 0.5, 0.5, 0.5, '#1e293b', 0.25, 0.25, -0.35);
    // Unmade dark bed + hidden metal lockbox underneath (x = 3.1)
    this.addBox(r204, 2.45, 0.45, 1.25, '#2b1d15', 3.1, 0.28, -0.75);
    this.addBox(r204, 2.3, 0.24, 1.15, '#334155', 3.1, 0.58, -0.75);
    this.addBox(r204, 1.35, 0.26, 1.18, '#1e293b', 3.4, 0.6, -0.75);
    this.addBox(r204, 0.62, 0.22, 0.48, '#475569', 2.85, 0.11, -0.32); // hidden metal box!
    this.addBox(r204, 0.12, 0.14, 0.06, '#d4af37', 2.85, 0.12, -0.07); // lock

    // 5. Room 304 (ห้องพริม ชั้น 3 — จุดเกิดเหตุ!)
    const r304 = createShell('room304', true, '#b5d6ff', '165, 205, 255', 1.25, true, -1.6, false);
    // October 14 wall calendar circled in red!
    const cal304 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.78),
      new THREE.MeshStandardMaterial({ map: calOct })
    );
    cal304.position.set(0.1, 2.15, -1.46);
    r304.add(cal304);
    // Faded floral floor rug + scattered fallen books/photos
    const rug304 = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 1.4),
      new THREE.MeshStandardMaterial({ map: createRugTexture('#4c2b36', '#c4969e'), roughness: 0.92 })
    );
    rug304.rotation.x = -Math.PI / 2;
    rug304.position.set(1.5, 0.015, 0.2);
    r304.add(rug304);
    this.addBox(r304, 0.34, 0.05, 0.44, '#3b82f6', -1.2, 0.03, -0.35);
    this.addBox(r304, 0.32, 0.05, 0.42, '#cbd5e1', -0.95, 0.05, -0.15);
    // Overturned wooden chair (x = -0.3)
    const chair = this.addBox(r304, 0.55, 0.55, 0.55, '#472d1d', -0.3, 0.28, -0.55);
    chair.rotation.z = 1.15;
    // Detailed Vanity dressing table + cracked bloody mirror + perfume + RED DIARY (x = 1.4)
    this.addBox(r304, 1.45, 0.78, 0.74, '#3d2419', 1.4, 0.39, -1.02);
    const vanityMirror = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 1.15),
      new THREE.MeshStandardMaterial({ map: bloodMirrorTex, metalness: 0.45, roughness: 0.22 })
    );
    vanityMirror.position.set(1.4, 1.42, -1.36);
    r304.add(vanityMirror);
    this.addBox(r304, 0.1, 0.2, 0.1, '#f472b6', 0.95, 0.88, -0.98); // perfume bottle
    this.addBox(r304, 0.32, 0.06, 0.4, '#991b1b', 1.65, 0.82, -0.92); // glowing red diary!
    const diaryGlow = new THREE.PointLight('#ef4444', 0.6, 2.5, 1.5);
    diaryGlow.position.set(1.65, 1.05, -0.75);
    r304.add(diaryGlow);
    // Dusty bed with pink-grey blanket & fallen pillow (x = 3.6)
    this.addBox(r304, 0.12, 1.05, 1.26, '#332118', 2.48, 0.52, -0.78);
    this.addBox(r304, 2.25, 0.38, 1.22, '#332118', 3.6, 0.19, -0.78);
    this.addBox(r304, 2.15, 0.24, 1.12, '#94a3b8', 3.6, 0.48, -0.78);
    this.addBox(r304, 1.4, 0.26, 1.14, '#5e3c47', 3.9, 0.5, -0.78);
    this.addBox(r304, 0.48, 0.14, 0.68, '#cbd5e1', 2.65, 0.08, 0.1); // fallen pillow on floor

    // 6. 24-Seven Convenience Store Interior ('seven24') — Super bright crisp Thai convenience store!
    const seven = createShell('seven24', false, '#ffffff', '255, 255, 255', 7.5, false);
    // Crisp bright white interior walls, ceiling panels & clean terrazzo floor covering dark shell
    this.addBox(seven, 12.2, 3.9, 0.08, '#f8fafc', 0, 2.0, -1.49, 0.35);
    this.addBox(seven, 0.1, 3.9, 4.8, '#f1f5f9', -5.9, 2.0, 0.6, 0.4);
    this.addBox(seven, 0.1, 3.9, 4.8, '#f1f5f9', 5.9, 2.0, 0.6, 0.4);
    this.addBox(seven, 12.0, 0.08, 4.8, '#ffffff', 0, 3.96, 0.6, 0.25);
    this.addBox(seven, 12.0, 0.04, 4.8, '#e2e8f0', 0, 0.02, 0.6, 0.22);
    // 3 overhead 6000K bright LED ceiling panels + front-aligned lights (illuminates player & shelf fronts!)
    [-3.6, 0, 3.4].forEach((lx) => {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.08, 0.55),
        new THREE.MeshBasicMaterial({ color: '#ffffff' })
      );
      panel.position.set(lx, 3.88, 0.5);
      seven.add(panel);
      const ledPt = new THREE.PointLight('#ffffff', 4.8, 15, 0.8);
      ledPt.position.set(lx, 3.45, 1.75);
      seven.add(ledPt);
      this.roomLights.push({ room: 'seven24', light: ledPt, baseIntensity: 4.8 });
    });
    // Clean white & iconic 24-Seven tri-color horizontal wall stripes
    this.addBox(seven, 12.0, 0.2, 0.05, '#f97316', 0, 3.42, -1.43);
    this.addBox(seven, 12.0, 0.18, 0.05, '#16a34a', 0, 3.22, -1.43);
    this.addBox(seven, 12.0, 0.14, 0.05, '#ef4444', 0, 3.05, -1.43);
    // 1) Open-Front 3-Tier Recessed Snack & Cup-Noodle Rack (clear of Exit Door -4.6)
    const rackX = -2.95;
    this.addBox(seven, 0.96, 1.58, 0.04, '#475569', rackX, 0.82, -1.38, 0.65); // dark perforated steel back
    [-3.43, -2.47].forEach((rx) => this.addBox(seven, 0.05, 1.58, 0.56, '#cbd5e1', rx, 0.82, -1.12, 0.4));
    [0.32, 0.78, 1.24, 1.58].forEach((sy, si) => {
      this.addBox(seven, 0.94, 0.04, 0.54, '#f8fafc', rackX, sy, -1.12, 0.35);
      if (si < 3) this.addBox(seven, 0.94, 0.04, 0.03, si % 2 === 0 ? '#16a34a' : '#f97316', rackX, sy, -0.84);
    });
    // Real 3D puffed snack bags (top), tapered cup noodles (mid), and cereal/cracker boxes (bottom)
    [-3.22, -2.95, -2.68].forEach((sx, si) => {
      const bag = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.25, 0.09),
        new THREE.MeshStandardMaterial({ color: ['#ef4444', '#facc15', '#22c55e'][si], roughness: 0.35 })
      );
      bag.position.set(sx, 1.4, -1.04);
      bag.rotation.x = -0.18;
      seven.add(bag);
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.065, 0.16, 12),
        new THREE.MeshStandardMaterial({ color: ['#f97316', '#dc2626', '#fde047'][si], roughness: 0.3 })
      );
      cup.position.set(sx, 0.88, -1.02);
      seven.add(cup);
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.088, 0.088, 0.015, 12),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25 })
      );
      lid.position.set(sx, 0.96, -1.02);
      seven.add(lid);
      this.addBox(seven, 0.19, 0.26, 0.14, ['#ec4899', '#3b82f6', '#eab308'][si], sx, 0.48, -1.04, 0.4);
    });

    // Helper: realistic cylindrical PET bottle / long-neck bottle + neck + screw cap + paper label!
    const addShelfBottle = (bx: number, by: number, bz: number, bodyCol: string, labelCol: string, tall = false) => {
      const h = tall ? 0.26 : 0.2;
      const r = tall ? 0.052 : 0.048;
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h, 10),
        new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.2, metalness: 0.08 })
      );
      body.position.set(bx, by + h / 2, bz);
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.42, r * 0.92, 0.06, 10),
        new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.2 })
      );
      neck.position.set(bx, by + h + 0.03, bz);
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.46, r * 0.46, 0.025, 10),
        new THREE.MeshStandardMaterial({ color: labelCol, roughness: 0.3 })
      );
      cap.position.set(bx, by + h + 0.07, bz);
      const label = new THREE.Mesh(
        new THREE.CylinderGeometry(r + 0.003, r + 0.003, h * 0.48, 10),
        new THREE.MeshStandardMaterial({ color: labelCol, roughness: 0.35 })
      );
      label.position.set(bx, by + h * 0.52, bz);
      seven.add(body, neck, cap, label);
    };

    // 2) Deep Recessed 2-Door Illuminated Drink Chiller Cooler (x = -1.2)
    this.addBox(seven, 2.18, 2.45, 0.06, '#e0f2fe', -1.2, 1.24, -1.42, 0.25); // glowing chilled interior back
    [-2.27, -0.13].forEach((cx) => this.addBox(seven, 0.08, 2.45, 0.68, '#334155', cx, 1.24, -1.1, 0.4)); // side frames
    this.addBox(seven, 2.22, 0.22, 0.72, '#0f172a', -1.2, 2.38, -1.08, 0.35); // top chiller fascia
    this.addBox(seven, 2.18, 0.14, 0.68, '#1e293b', -1.2, 0.08, -1.1, 0.5); // bottom plinth
    this.addBox(seven, 0.07, 2.15, 0.08, '#1e293b', -1.2, 1.2, -0.76, 0.35); // center double-door mullion
    [-1.34, -1.06].forEach((hx) => this.addBox(seven, 0.025, 0.55, 0.05, '#cbd5e1', hx, 1.22, -0.7, 0.2)); // chrome handles
    const coolerLight = new THREE.PointLight('#e0f2fe', 2.4, 4.5, 1.0);
    coolerLight.position.set(-1.2, 2.1, -0.95);
    seven.add(coolerLight);
    [0.52, 1.08, 1.62].forEach((sy, si) => {
      this.addBox(seven, 2.06, 0.03, 0.54, '#cbd5e1', -1.2, sy, -1.12, 0.3);
      const bodyPalette = ['#38bdf8', '#dc2626', '#22c55e', '#f59e0b', '#7c3aed', '#ec4899'];
      const labelPalette = ['#ffffff', '#fef08a', '#dcfce7', '#ffedd5', '#ede9fe', '#fce7f3'];
      [-2.02, -1.72, -1.44, -0.96, -0.68, -0.4].forEach((bx, bi) => {
        const cIdx = (bi + si) % bodyPalette.length;
        addShelfBottle(bx, sy + 0.02, -0.98, bodyPalette[cIdx], labelPalette[cIdx], si === 2);
        addShelfBottle(bx + 0.06, sy + 0.02, -1.2, bodyPalette[(cIdx + 2) % 6], '#ffffff', false); // back row parallax depth!
      });
    });
    const chGlass = new THREE.Mesh(
      new THREE.BoxGeometry(2.12, 2.1, 0.03),
      new THREE.MeshStandardMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.22, roughness: 0.08, depthWrite: false })
    );
    chGlass.position.set(-1.2, 1.2, -0.74);
    seven.add(chGlass);

    // 3) Deep Recessed Liquor & Ready-Meal Display Cabinet (x = +0.85)
    this.addBox(seven, 1.65, 2.45, 0.06, '#fef3c7', 0.85, 1.24, -1.42, 0.35);
    [0.05, 1.65].forEach((cx) => this.addBox(seven, 0.08, 2.45, 0.68, '#334155', cx, 1.24, -1.1, 0.4));
    this.addBox(seven, 1.68, 0.22, 0.72, '#1e293b', 0.85, 2.38, -1.08, 0.4);
    this.addBox(seven, 1.65, 0.14, 0.68, '#1e293b', 0.85, 0.08, -1.1, 0.5);
    [0.52, 1.08, 1.62].forEach((sy, si) => {
      this.addBox(seven, 1.54, 0.03, 0.54, '#cbd5e1', 0.85, sy, -1.12, 0.3);
      if (si >= 1) {
        [0.32, 0.58, 0.85, 1.12, 1.38].forEach((lx, li) => {
          addShelfBottle(lx, sy + 0.02, -1.0, li % 2 === 0 ? '#14532d' : '#78350f', '#facc15', true);
          addShelfBottle(lx + 0.05, sy + 0.02, -1.22, '#0f172a', '#cbd5e1', true);
        });
      } else {
        // Ready-to-eat Bento trays on bottom tier
        [0.45, 0.85, 1.25].forEach((bx, bi) => {
          this.addBox(seven, 0.28, 0.08, 0.24, '#18181b', bx, sy + 0.06, -1.02, 0.4);
          this.addBox(seven, 0.24, 0.05, 0.2, ['#facc15', '#fb923c', '#ef4444'][bi], bx, sy + 0.11, -1.02, 0.4);
        });
      }
    });
    const cabGlass = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 2.1, 0.03),
      new THREE.MeshStandardMaterial({ color: '#fef9c3', transparent: true, opacity: 0.2, roughness: 0.08, depthWrite: false })
    );
    cabGlass.position.set(0.85, 1.2, -0.74);
    seven.add(cabGlass);

    // 4) Checkout Counter + Glass Steamed Bun Warmer (ตู้ซาลาเปาเห็นลูกข้างใน!) + Slurpee + Clerk NPC
    this.addBox(seven, 2.7, 1.02, 0.9, '#ffffff', 3.25, 0.51, -0.65);
    this.addBox(seven, 2.75, 0.12, 0.96, '#16a34a', 3.25, 1.04, -0.65);
    this.addBox(seven, 0.48, 0.08, 0.4, '#cbd5e1', 2.25, 1.14, -0.58, 0.3);
    this.addBox(seven, 0.48, 0.06, 0.4, '#dc2626', 2.25, 1.58, -0.58, 0.4);
    const bunGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.4, 0.36),
      new THREE.MeshStandardMaterial({ color: '#fef9c3', transparent: true, opacity: 0.28, roughness: 0.08, depthWrite: false })
    );
    bunGlass.position.set(2.25, 1.38, -0.58);
    seven.add(bunGlass);
    // 4 fluffy white steamed buns (ซาลาเปา) & shumai inside glass steamer!
    [2.16, 2.34].forEach((bx) => {
      [1.24, 1.42].forEach((by) => {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshStandardMaterial({ color: '#fffbeb', roughness: 0.7 }));
        bun.scale.set(1.1, 0.78, 1.1);
        bun.position.set(bx, by, -0.58);
        seven.add(bun);
      });
    });
    this.addBox(seven, 0.52, 0.42, 0.35, '#0f172a', 2.95, 1.28, -0.58); // POS monitor
    this.addBox(seven, 0.46, 0.32, 0.05, '#38bdf8', 2.95, 1.28, -0.4);
    // 2-flavor Slurpee Machine with translucent dome lids!
    this.addBox(seven, 0.54, 0.52, 0.42, '#cbd5e1', 4.18, 1.34, -0.72, 0.3);
    [4.04, 4.32].forEach((sx, si) => {
      const dome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.26, 12),
        new THREE.MeshStandardMaterial({ color: si === 0 ? '#ef4444' : '#38bdf8', roughness: 0.15, transparent: true, opacity: 0.85 })
      );
      dome.position.set(sx, 1.72, -0.72);
      seven.add(dome);
    });
    const storeClerk = this.makeLitCharacter(this.charFrames.clerk[0], 1.48, 2.2);
    storeClerk.position.set(3.4, 1.02, -1.05);
    seven.add(storeClerk);
  }

  public getTimePeriod(gameMinutes: number): TimePeriod {
    const h = gameMinutes / 60;
    if (h >= 5.5 && h < 7.5) return 'dawn';
    if (h >= 7.5 && h < 11.5) return 'morning';
    if (h >= 11.5 && h < 15.5) return 'noon';
    if (h >= 15.5 && h < 18.5) return 'evening';
    return 'night';
  }

  public update(
    dt: number,
    playerX: number,
    playerZ: number,
    playerFloor: FloorIndex,
    currentRoom: RoomId,
    playerFacing: 1 | -1,
    isMoving: boolean,
    flashlightOn: boolean,
    gameMinutes: number,
    weather: WeatherType,
    breakerTripped: boolean,
    unlockedFloor3: boolean,
    unlockedRoom304: boolean,
    showTom: boolean,
    showVendor: boolean,
    showPrim: boolean,
    primChasing: boolean,
    primPos: { x: number; floor: FloorIndex },
    sanity: number,
    drunkMode = false,
    zombies: { x: number; floor: FloorIndex; alive: boolean; dir: 1 | -1 }[] = [],
    gunFlashTimer = 0,
    gunBeamEndX = 0
  ): void {
    this.animClock += dt;

    const isInsideRoom = currentRoom !== 'outside';
    this.exteriorGroup.visible = !isInsideRoom;
    (Object.keys(this.roomGroups) as RoomId[]).forEach((rid) => {
      const grp = this.roomGroups[rid];
      if (grp) grp.visible = rid === currentRoom;
    });
    this.rainLines.visible = !isInsideRoom;

    const yBase = isInsideRoom ? 0 : playerFloor * FLOOR_HEIGHT;
    const footGroundedY = yBase + 0.94;
    this.playerMesh.position.set(playerX, footGroundedY, playerZ);
    this.playerShadow.position.set(playerX, yBase + 0.026, playerZ);

    const walkFrame = isMoving ? Math.floor(this.animClock * 9) % 4 : 0;
    const pMat = this.playerMesh.material as THREE.MeshStandardMaterial;
    pMat.map = this.charFrames.player[walkFrame];
    this.setMeshFacing(this.playerMesh, playerFacing);

    this.flashlight.position.set(playerX + playerFacing * 0.28, footGroundedY + 0.25, playerZ + 0.25);
    this.flashlightTarget.position.set(playerX + playerFacing * 5.4, footGroundedY - 0.1, playerZ - 0.55);
    this.flashlight.intensity = flashlightOn ? 12.5 : 0;

    const uncleFrame = Math.floor(this.animClock * 1.5) % 2;
    (this.uncleMesh.material as THREE.MeshStandardMaterial).map = this.charFrames.uncle[uncleFrame];

    this.tomMesh.visible = showTom;
    this.tomShadow.visible = showTom;
    if (showTom) {
      const tomFrame = Math.floor(this.animClock * 1.8) % 2;
      (this.tomMesh.material as THREE.MeshStandardMaterial).map = this.charFrames.tom[tomFrame];
    }

    this.vendorMesh.visible = showVendor;
    this.vendorShadow.visible = showVendor;
    if (showVendor) {
      const vendorFrame = Math.floor(this.animClock * 1.6) % 2;
      (this.vendorMesh.material as THREE.MeshStandardMaterial).map = this.charFrames.vendor[vendorFrame];
    }

    // Animate street life (noodle cart, Isaan factory workers, moving bikes/cars & walking pedestrians)
    const hour = gameMinutes / 60;
    const noodleOpen = hour >= 17.0 || hour < 2.0;
    this.noodleVendorMesh.visible = noodleOpen;
    this.noodleLight.intensity = noodleOpen ? 2.4 : 0;
    this.noodleSeatedMeshes.forEach((cm, idx) => {
      cm.visible = noodleOpen;
      if (noodleOpen) {
        cm.position.y = 0.7 + Math.sin(this.animClock * 2.2 + idx * 1.4) * 0.025;
      }
    });

    const isaanOpen = hour >= 16.5 || hour < 1.5;
    this.isaanLight.intensity = isaanOpen ? 2.6 : 0;
    this.workerSeatedMeshes.forEach((wm, idx) => {
      wm.visible = isaanOpen;
      if (isaanOpen) {
        wm.position.y = 0.72 + Math.sin(this.animClock * 2.4 + idx * 1.7) * 0.03;
      }
    });

    // Subtle idle breathing for Bus Stop passengers & drifting cigarette smoke for the 4 delinquent gangsters!
    this.busSeatedMeshes.forEach((bm, idx) => {
      bm.position.y = 0.9 + Math.sin(this.animClock * 1.6 + idx * 2.0) * 0.015;
    });
    this.gangSmokingMeshes.forEach((g, idx) => {
      const cycle = (this.animClock * 0.75 + idx * 0.31) % 1;
      g.smoke.position.set(g.baseX + Math.sin(cycle * 4 + idx) * 0.14, g.baseY + cycle * 0.85, g.smoke.position.z);
      g.smoke.scale.setScalar(0.8 + cycle * 1.6);
      (g.smoke.material as THREE.MeshBasicMaterial).opacity = (1 - cycle) * 0.36;
    });

    if (!isInsideRoom) {
      animateDormExtension(this.extRefs, this.charFrames, this.animClock, dt);
      // Traffic uses the open Side-Street T-Junction (-30.2 .. -24.0) seamlessly—never touching walls or entering the dorm!
      for (const v of this.movingVehicles) {
        if (v.dir === 1) {
          if (v.group.position.x < -29.2) {
            v.group.position.x += v.speed * dt;
            v.group.position.z = v.baseZ;
            v.group.rotation.y = 0;
          } else {
            // Curve smoothly left down the open asphalt lane (x = -26.0, heading into -Z)
            v.group.position.x = THREE.MathUtils.lerp(v.group.position.x, -26.0, Math.min(1, dt * 4.2));
            v.group.position.z -= v.speed * 0.92 * dt;
            v.group.rotation.y = THREE.MathUtils.lerp(v.group.rotation.y, Math.PI / 2, Math.min(1, dt * 5.5));
            if (v.group.position.z < -16.5) {
              v.group.position.set(v.minX, 0, v.baseZ);
              v.group.rotation.y = 0;
            }
          }
        } else {
          // Westbound traffic: drives OUT from deep inside the side-alley (-28.3, z = -16.5), turns West onto Soi 9
          if (v.group.position.x > -29.8 && v.group.position.z < v.baseZ - 0.15) {
            v.group.position.z += v.speed * 0.88 * dt;
            if (v.group.position.z > 0.2) {
              v.group.position.x -= v.speed * 0.45 * dt;
              v.group.rotation.y = THREE.MathUtils.lerp(v.group.rotation.y, 0, Math.min(1, dt * 5.5));
            } else {
              v.group.position.x = THREE.MathUtils.lerp(v.group.position.x, -28.3, Math.min(1, dt * 5));
              v.group.rotation.y = Math.PI / 2;
            }
          } else {
            v.group.position.x += v.dir * v.speed * dt;
            v.group.position.z = THREE.MathUtils.lerp(v.group.position.z, v.baseZ, Math.min(1, dt * 6));
            v.group.rotation.y = THREE.MathUtils.lerp(v.group.rotation.y, 0, Math.min(1, dt * 6));
            if (v.group.position.x < v.minX) {
              v.group.position.set(-28.3, 0, -16.5);
              v.group.rotation.y = Math.PI / 2;
            }
          }
        }
      }

      const isDaytime = hour >= 6.0 && hour < 19.0;
      const isEveningNight = hour >= 17.5 || hour < 1.5;
      for (const p of this.pedestrians) {
        const active = (p.dayOnly && isDaytime) || (p.nightOnly && isEveningNight);
        p.mesh.visible = active;
        p.shadow.visible = active;
        if (!active) continue;
        p.x += p.dir * p.speed * dt;
        if (p.x >= p.maxX) p.dir = -1;
        if (p.x <= p.minX) p.dir = 1;
        p.mesh.position.set(p.x, 0.9, p.z);
        p.shadow.position.set(p.x, 0.025, p.z);
        const pf = Math.floor(this.animClock * 6.5) % 4;
        (p.mesh.material as THREE.MeshStandardMaterial).map = this.charFrames[p.kind][pf];
        this.setMeshFacing(p.mesh, p.dir);
      }
    }

    this.primMesh.visible = showPrim;
    if (showPrim) {
      const primFrame = Math.floor(this.animClock * (primChasing ? 7 : 3)) % 2;
      const primMat = this.primMesh.material as THREE.MeshStandardMaterial;
      primMat.map = primChasing
        ? this.charFrames.prim_chase[primFrame]
        : this.charFrames.prim[primFrame];
      primMat.opacity = primChasing ? 0.96 : 0.84 + Math.sin(this.animClock * 4) * 0.1;
      primMat.emissive.set(primChasing ? '#4a080d' : '#182433');
      const jitterX = primChasing ? Math.sin(this.animClock * 24) * 0.04 : 0;
      const py = (isInsideRoom ? 0 : primPos.floor * FLOOR_HEIGHT) + 1.05 + Math.sin(this.animClock * 2.5) * 0.06;
      const faceDir: 1 | -1 = playerX >= primPos.x ? 1 : -1;
      this.setMeshFacing(this.primMesh, faceDir);
      this.primMesh.scale.set(primChasing ? 1.1 : 1.0, primChasing ? 1.1 : 1.0, 1);
      this.primMesh.position.set(primPos.x + jitterX, py, primChasing ? 0.35 : -0.35);
      this.primAuraLight.position.set(primPos.x, py + 0.2, 0.5);
      this.primAuraLight.intensity = primChasing ? 2.4 + Math.sin(this.animClock * 10) * 0.5 : 0.85;
      this.primAuraLight.color.set(primChasing ? '#b81828' : '#7098c8');
    } else {
      this.primAuraLight.intensity = 0;
    }

    this.room304SealGroup.visible = !unlockedRoom304;
    this.floor3GateMesh.visible = !unlockedFloor3;
    this.breakerLedMat.color.set(breakerTripped ? '#e03e3e' : '#37d67a');
    this.ceilingFan.rotation.y += dt * (breakerTripped ? 0.2 : 1.1);

    const windPower =
      weather === 'storm' ? 0.22 : weather === 'windy' ? 0.16 : weather === 'rain' ? 0.09 : 0.03;
    this.hangingUniform.rotation.z = Math.sin(this.animClock * 3.4) * windPower;
    // Keep trees firmly planted & upright in concrete (no unnatural trunk wobbling!)
    this.bananaTrees.forEach((tree) => {
      tree.rotation.z = 0;
    });

    const isOuterStreet = !isInsideRoom && playerFloor === 0 && (playerX < -13.5 || playerX > 13.5);
    (this.scene.fog as THREE.FogExp2).density = isOuterStreet ? 0.013 : 0.028;
    this.updateTimeLighting(gameMinutes, weather, isOuterStreet, currentRoom === 'seven24');

    const period = this.getTimePeriod(gameMinutes);
    const isDay = period === 'morning' || period === 'noon';
    for (const item of this.corridorLights) {
      if (breakerTripped && item.floor >= 1) {
        item.light.intensity = 0;
        item.bulbMat.color.set('#14161c');
        if (item.coneMat) item.coneMat.opacity = 0;
        continue;
      }
      // Keep lights completely steady (no strobing/flickering!)
      const dayScale = item.floor === 0 && isDay ? 0.12 : 1;
      item.light.intensity = item.baseIntensity * dayScale;
      item.bulbMat.color.set('#e8f4ff');
      if (item.coneMat) {
        item.coneMat.opacity = 0.34 * (item.floor === 0 && isDay ? 0.05 : 1);
      }
    }

    for (const rl of this.roomLights) {
      rl.light.intensity =
        rl.room === currentRoom && (!breakerTripped || rl.room === 'seven24') ? rl.baseIntensity : 0;
    }

    this.spiritCandleLight.intensity = 1.35 + Math.sin(this.animClock * 2.8) * 0.1;
    this.updateWeatherFX(dt, weather);

    // Render Player 3D Pistol, Zombies & Gunshot FX in Drunk Hallucination Mode
    if (drunkMode) {
      const recoil = gunFlashTimer > 0 ? 1 : 0;
      this.playerGunGroup.visible = true;
      this.playerGunGroup.scale.x = playerFacing;
      this.playerGunGroup.position.set(
        playerX + playerFacing * (0.34 - recoil * 0.08),
        footGroundedY + 0.04 + recoil * 0.04,
        playerZ + 0.1
      );
      this.playerGunGroup.rotation.z = playerFacing * recoil * 0.28;
    } else {
      this.playerGunGroup.visible = false;
    }

    for (let zi = 0; zi < this.zombieMeshes.length; zi++) {
      const zm = this.zombieMeshes[zi];
      const zs = this.zombieShadows[zi];
      const zData = zombies[zi];
      if (!drunkMode || !zData || !zData.alive || isInsideRoom) {
        zm.visible = false;
        zs.visible = false;
        continue;
      }
      const zy = zData.floor * FLOOR_HEIGHT;
      zm.visible = true;
      zs.visible = true;
      zm.position.set(zData.x, zy + 0.94, 0.42);
      zs.position.set(zData.x, zy + 0.025, 0.42);
      const zf = Math.floor(this.animClock * 7 + zi) % 4;
      (zm.material as THREE.MeshStandardMaterial).map = this.charFrames.zombie[zf];
      this.setMeshFacing(zm, zData.dir);
    }

    if (drunkMode && gunFlashTimer > 0) {
      const muzzleX = playerX + playerFacing * 0.84;
      const muzzleY = footGroundedY + 0.12;
      const beamLen = Math.max(0.5, Math.abs(gunBeamEndX - muzzleX));
      this.gunFlashMesh.visible = true;
      this.gunFlashMesh.position.set(muzzleX, muzzleY, playerZ + 0.12);
      this.gunFlashMesh.rotation.z += dt * 40;
      this.gunFlashLight.position.set(muzzleX, muzzleY + 0.15, playerZ + 0.4);
      this.gunFlashLight.intensity = 6.5;
      this.gunTracerMesh.visible = true;
      this.gunTracerMesh.scale.set(beamLen, 1, 1);
      this.gunTracerMesh.position.set((muzzleX + gunBeamEndX) * 0.5, muzzleY, playerZ + 0.1);
    } else {
      this.gunFlashMesh.visible = false;
      this.gunFlashLight.intensity = 0;
      this.gunTracerMesh.visible = false;
    }

    const camTargetX = isInsideRoom
      ? THREE.MathUtils.clamp(playerX, currentRoom === 'rooftop' ? -3.0 : -1.2, currentRoom === 'rooftop' ? 3.0 : 1.2)
      : playerFloor === 0
        ? THREE.MathUtils.clamp(playerX, -122.0, 38.0)
        : THREE.MathUtils.clamp(playerX, -7.8, 7.8);
    const camTargetY = (isInsideRoom ? 0 : playerFloor * FLOOR_HEIGHT) + 2.05;

    this.renderer.toneMappingExposure = sanity < 40 ? 0.94 : 1.1;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camTargetX, Math.min(1, dt * 5.5));
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, camTargetY, Math.min(1, dt * 5.5));
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetCamZ, Math.min(1, dt * 6.0));
    this.camera.lookAt(this.camera.position.x, this.camera.position.y - 0.16, 0);
    if (drunkMode) {
      this.camera.rotation.z += Math.sin(this.animClock * 3.1) * 0.048;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateTimeLighting(
    gameMinutes: number,
    weather: WeatherType,
    isOuterStreet = false,
    isBrightStore = false
  ): void {
    const h = gameMinutes / 60;
    const sky = new THREE.Color('#070b16');
    let hemiInt = 0.34;
    let sunInt = 0.22;
    const sunColor = new THREE.Color('#9ab4ff');

    if (h >= 5.5 && h < 7.5) {
      const t = (h - 5.5) / 2;
      sky.lerpColors(new THREE.Color('#090e1c'), new THREE.Color('#5b5170'), t);
      hemiInt = THREE.MathUtils.lerp(0.34, 0.78, t);
      sunInt = THREE.MathUtils.lerp(0.25, 0.72, t);
      sunColor.lerpColors(new THREE.Color('#8096d0'), new THREE.Color('#ffaa75'), t);
    } else if (h >= 7.5 && h < 11.5) {
      sky.set('#4c6b8c');
      hemiInt = 0.94;
      sunInt = 1.15;
      sunColor.set('#fff1d4');
    } else if (h >= 11.5 && h < 15.5) {
      sky.set('#5e7d99');
      hemiInt = 1.05;
      sunInt = 1.25;
      sunColor.set('#fff9ed');
    } else if (h >= 15.5 && h < 18.5) {
      const t = (h - 15.5) / 3;
      sky.lerpColors(new THREE.Color('#6a5861'), new THREE.Color('#101424'), t);
      hemiInt = THREE.MathUtils.lerp(0.9, isOuterStreet ? 0.72 : 0.36, t);
      sunInt = THREE.MathUtils.lerp(0.95, isOuterStreet ? 0.44 : 0.24, t);
      sunColor.lerpColors(new THREE.Color('#ff9457'), new THREE.Color('#6677aa'), t);
    } else {
      sky.set(isOuterStreet ? '#0f182c' : '#0a101e');
      hemiInt = isOuterStreet ? 0.78 : 0.46;
      sunInt = isOuterStreet ? 0.48 : 0.34;
      sunColor.set(isOuterStreet ? '#ffd7a3' : '#89a6e6');
    }

    if (weather === 'rain' || weather === 'storm') {
      sky.multiplyScalar(weather === 'storm' ? 0.55 : 0.72);
      hemiInt *= isOuterStreet ? 0.9 : 0.78;
      sunInt *= isOuterStreet ? 0.8 : 0.6;
    }

    if (isBrightStore) {
      hemiInt = 1.95;
      sunInt = 1.45;
      sunColor.set('#ffffff');
    }

    this.scene.background = sky;
    (this.scene.fog as THREE.FogExp2).color.copy(sky);
    this.hemiLight.intensity = hemiInt;
    this.sunMoonLight.intensity = sunInt;
    this.sunMoonLight.color.copy(sunColor);
  }

  private updateWeatherFX(dt: number, weather: WeatherType): void {
    const rainMat = this.rainLines.material as THREE.LineBasicMaterial;
    const isRaining = weather === 'rain' || weather === 'storm';
    rainMat.opacity = THREE.MathUtils.lerp(
      rainMat.opacity,
      weather === 'storm' ? 0.58 : weather === 'rain' ? 0.38 : 0,
      dt * 3
    );

    if (isRaining) {
      const speedY = weather === 'storm' ? 22 : 15;
      const slantX = weather === 'storm' ? -4.5 : -1.5;
      for (let i = 0; i < this.rainCount; i++) {
        const idx = i * 6;
        this.rainPositions[idx] += slantX * dt;
        this.rainPositions[idx + 1] -= speedY * dt;
        if (this.rainPositions[idx + 1] < 0) {
          this.rainPositions[idx] = -132 + Math.random() * 178;
          this.rainPositions[idx + 1] = 17 + Math.random() * 2;
        }
        this.rainPositions[idx + 3] = this.rainPositions[idx] - slantX * 0.03;
        this.rainPositions[idx + 4] = this.rainPositions[idx + 1] - 0.55;
      }
      this.rainLines.geometry.attributes.position.needsUpdate = true;
    }

    if (weather === 'storm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 7 + Math.random() * 11;
        this.lightningFlashDecay = 1;
        const overlay = document.getElementById('lightning-overlay');
        overlay?.classList.add('flash');
        setTimeout(() => overlay?.classList.remove('flash'), 120);
        this.lastThunderCallback?.();
      }
    }

    if (this.lightningFlashDecay > 0) {
      this.lightningFlashDecay = Math.max(0, this.lightningFlashDecay - dt * 5);
      this.lightningLight.intensity = this.lightningFlashDecay * 4.5;
    } else {
      this.lightningLight.intensity = 0;
    }
  }

  public setZoomFactor(factor: number): void {
    this.zoomFactor = THREE.MathUtils.clamp(factor, 0.72, 1.55);
    this.updateCameraFraming(false);
  }

  private updateCameraFraming(snapZ = true): void {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const aspect = w / h;
    const isMobileScreen = Math.min(w, h) <= 560 || (navigator.maxTouchPoints > 0 && h <= 640);
    // Mobile screens zoom closer by default so the player doesn't look tiny
    const baseFov = isMobileScreen && aspect >= 1.15 ? 38 : aspect < 1.15 ? THREE.MathUtils.clamp(42 + (1.15 - aspect) * 24, 42, 58) : 42;
    const baseZ = isMobileScreen ? (aspect < 1.0 ? THREE.MathUtils.clamp(11.4 + (1.0 - aspect) * 5.5, 11.4, 15.2) : 9.2) : 12.6;
    this.targetCamZ = baseZ / this.zoomFactor;
    if (snapZ) this.camera.position.z = this.targetCamZ;
    this.camera.fov = baseFov;
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
