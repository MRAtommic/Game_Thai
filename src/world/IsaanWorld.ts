import * as THREE from 'three';
import { TimePeriod, WeatherType } from '../types';
import { Ch2CharacterKind, createCh2BikeRiderTexture, createCh2CharacterTexture } from '../art/Chapter2Sprites';
import {
  createLightConeTexture,
  createMarketAwningTexture,
  createRugTexture,
  createThaiDoorTexture,
  createThaiTileFloorTexture,
  createThaiWallTexture,
  createThaiWindowTexture,
  createZincRoofTexture,
} from '../art/TextureFactory';
import { build25DBananaClump, build25DStreetTree } from './NatureModels';

import {
  animateIsaanWorldLife,
  buildExpandedVillageLife,
  buildRotHaeSystem,
  buildSongthaewSystem,
  buildTempleFairZone,
  buildTrafficAndParkedVehicles,
  MovingVehicle,
  RotHaeController,
  RuralActorsController,
  SongthaewController,
  TempleFairController,
  VillageMood,
} from './IsaanFestivalsAndTraffic';

export type { VillageMood };

export const CH2_MIN_X = -118.0;
export const CH2_MAX_X = 136.0;

export type Ch2RoomId = 'outside' | 'stilt_house' | 'temple_sala' | 'kuti';

function paintSignTex(bg: string, border: string, textCol: string, line1: string, line2?: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 240;
  c.height = 80;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 240, 80);
  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 232, 72);
  ctx.fillStyle = textCol;
  ctx.font = 'bold 22px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(line1, 120, line2 ? 28 : 40);
  if (line2) {
    ctx.font = '14px "IBM Plex Sans Thai", sans-serif';
    ctx.fillText(line2, 120, 56);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintTempleWallMuralTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  // Warm Thai sanctuary ivory-cream plaster background + red/gold Lai Thai wainscoting
  ctx.fillStyle = '#efe5cf';
  ctx.fillRect(0, 0, 512, 256);

  // Lower crimson temple dado & golden border trim
  ctx.fillStyle = '#5c1414';
  ctx.fillRect(0, 198, 512, 58);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, 194, 512, 6);
  ctx.fillRect(0, 14, 512, 7);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 0, 512, 14);

  // Subtle Traditional Golden Bodhi Trees & Kanok Mural Panels along sanctuary wall
  for (let px = 42; px < 500; px += 92) {
    ctx.strokeStyle = 'rgba(180, 120, 40, 0.38)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 28, 34, 56, 146);
    // Sacred Bodhi leaf / temple flame silhouette inside mural panel
    ctx.fillStyle = 'rgba(195, 145, 50, 0.25)';
    ctx.beginPath();
    ctx.moveTo(px, 46);
    ctx.quadraticCurveTo(px + 22, 84, px + 14, 118);
    ctx.quadraticCurveTo(px, 128, px - 14, 118);
    ctx.quadraticCurveTo(px - 22, 84, px, 46);
    ctx.fill();
    ctx.fillStyle = 'rgba(139, 34, 34, 0.35)';
    ctx.fillRect(px - 3, 120, 6, 48);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintUbosotExteriorTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(0, 0, 512, 192);
  // Golden base & eave molding trims
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 512, 10);
  ctx.fillRect(0, 176, 512, 16);
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 168, 512, 8);
  // Gilded Thai Mondop arched windows flanking center door
  [92, 172, 340, 420].forEach((wx) => {
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(wx - 20, 58, 40, 82);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(wx - 24, 58);
    ctx.lineTo(wx, 24);
    ctx.lineTo(wx + 24, 58);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx - 17, 60, 34, 78);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintBuddhaAltarSpriteTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  // Soft divine radiant aura behind Sukhothai Phra Prathan
  const glow = ctx.createRadialGradient(128, 120, 14, 128, 120, 118);
  glow.addColorStop(0, 'rgba(254, 249, 195, 0.92)');
  glow.addColorStop(0.5, 'rgba(234, 179, 8, 0.45)');
  glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 256);

  // Carved crimson & gold Zhum Ruan Kaew flame frame (ซุ้มเรือนแก้ว)
  ctx.save();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(54, 232);
  ctx.quadraticCurveTo(44, 78, 128, 16);
  ctx.quadraticCurveTo(212, 78, 202, 232);
  ctx.stroke();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Multi-petal Golden Lotus Throne (ฐานบัลลังก์กลีบบัวหงาย-บัวคว่ำ)
  const throneGrad = ctx.createLinearGradient(58, 200, 198, 240);
  throneGrad.addColorStop(0, '#92400e');
  throneGrad.addColorStop(0.5, '#eab308');
  throneGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = throneGrad;
  ctx.beginPath();
  ctx.roundRect(54, 210, 148, 28, 5);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  for (let px = 64; px <= 184; px += 15) {
    ctx.beginPath();
    ctx.arc(px, 212, 7.5, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted Cross-legged Meditation Lap & Folded Knees (พระเพลาขัดสมาธิปางมารวิชัย)
  const bodyGrad = ctx.createLinearGradient(90, 96, 166, 208);
  bodyGrad.addColorStop(0, '#fef08a');
  bodyGrad.addColorStop(0.5, '#facc15');
  bodyGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(64, 204);
  ctx.quadraticCurveTo(60, 178, 86, 174);
  ctx.lineTo(170, 174);
  ctx.quadraticCurveTo(196, 178, 192, 204);
  ctx.closePath();
  ctx.fill();

  // Tapered Graceful Torso & Arms reaching lap/knee
  ctx.beginPath();
  ctx.moveTo(86, 114);
  ctx.quadraticCurveTo(128, 102, 170, 114);
  ctx.lineTo(160, 176);
  ctx.lineTo(96, 176);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 13;
  // Left arm resting palm up in lap + Right arm over knee (ปางมารวิชัย)
  ctx.beginPath();
  ctx.moveTo(89, 118);
  ctx.quadraticCurveTo(79, 152, 116, 180);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(167, 118);
  ctx.quadraticCurveTo(178, 152, 164, 190);
  ctx.stroke();

  // Pleated Sanghati sash across chest (ผ้าสังฆาฏิ)
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(104, 112, 18, 56);

  // Neck + Graceful Oval Sukhothai Head + Elongated Earlobes (พระกรรณยาว)
  ctx.fillStyle = '#facc15';
  ctx.fillRect(120, 96, 16, 16);
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.roundRect(104, 72, 6, 26, 3);
  ctx.roundRect(146, 72, 6, 26, 3);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.ellipse(128, 76, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair Curls, Ushnisha Dome & Curved Thai Flame Ketumala (พระเกตุมาลาเปลวเพลิง)
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(128, 58, 18, 8, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(128, 53, 8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(123, 50);
  ctx.quadraticCurveTo(120, 38, 128, 25);
  ctx.quadraticCurveTo(135, 38, 133, 50);
  ctx.closePath();
  ctx.fill();

  // Serene arched eyebrows, downcast meditation eyes & gentle smile
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(120, 72, 5, Math.PI + 0.3, Math.PI * 2 - 0.3);
  ctx.arc(136, 72, 5, Math.PI + 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(117, 76, 6, 2);
  ctx.fillRect(133, 76, 6, 2);
  ctx.beginPath();
  ctx.arc(128, 86, 4.5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintLaiRodNamCabinetTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#18110e'; // rich black lacquer (ลงรัก)
  ctx.fillRect(0, 0, 128, 192);
  ctx.strokeStyle = '#eab308'; // gold leaf trim (ปิดทองลายรดน้ำ)
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 118, 182);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(14, 14, 46, 164);
  ctx.strokeRect(68, 14, 46, 164);
  // Subtle Kanok scroll motifs on cabinet doors
  ctx.fillStyle = '#ca8a04';
  [37, 91].forEach((cx) => {
    ctx.beginPath();
    ctx.arc(cx, 62, 11, 0, Math.PI * 2);
    ctx.arc(cx, 126, 11, 0, Math.PI * 2);
    ctx.fill();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class IsaanWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private hemiLight: THREE.HemisphereLight;
  private sunMoonLight: THREE.DirectionalLight;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;

  private exteriorGroup: THREE.Group;
  private roomGroups: Partial<Record<Ch2RoomId, THREE.Group>> = {};
  private roomLights: { room: Ch2RoomId; light: THREE.PointLight; baseIntensity: number }[] = [];

  private playerMesh: THREE.Mesh;
  private playerShadow: THREE.Mesh;
  private butcherMesh: THREE.Mesh;
  private herbVendorMesh: THREE.Mesh;
  private fishVendorMesh: THREE.Mesh;
  private yaiSaiMesh: THREE.Mesh;
  private krasueMesh: THREE.Mesh;
  private krasueLight: THREE.PointLight;
  private placedThornsMesh: THREE.Group;

  // Sacred Thai Sai Sin Protective Ring (ลานวัดป่า)
  private saiSinGroup: THREE.Group;
  private saiSinGlowMat: THREE.MeshBasicMaterial;
  private saiSinThreadMat: THREE.LineBasicMaterial;
  private saiSinLight: THREE.PointLight;
  private saiSinFlash = 0;

  // Living Isaan Rural Life animations (ควายเดินมีคนจูง, เลี้ยงไก่, หว่านแห, ทำนา)
  private buffaloHerderGroup: THREE.Group;
  private buffaloWalkX = -15.5;
  private buffaloWalkDir: 1 | -1 = 1;
  private chickens: THREE.Group[] = [];
  private riceFarmers: THREE.Group[] = [];
  private castNetMesh: THREE.Mesh;
  private netRopeLine: THREE.Line;
  private netRippleMesh: THREE.Mesh;
  private caughtFishGroup: THREE.Group;

  // Rideable rural bicycle item
  private parkedBikeGroup: THREE.Group;
  private ridingBikeGroup: THREE.Group;
  private bikeWheels: THREE.Group[] = [];
  private bikeCrank: THREE.Group = new THREE.Group();
  private noomBikeFrames: THREE.CanvasTexture[] = [];

  private swayingPlants: THREE.Mesh[] = [];
  private villageLights: { light: THREE.PointLight; base: number }[] = [];

  private rainLines: THREE.LineSegments;
  private rainPositions: Float32Array;
  private rainCount = 620;

  // Expanded Isaan village traffic, Rot Hae, Songthaew, Temple Fair & Rural actors
  private rotHaeCtrl!: RotHaeController;
  private songthaewCtrl!: SongthaewController;
  private trafficVehicles: MovingVehicle[] = [];
  private templeFairCtrl!: TempleFairController;
  private ruralActorsCtrl!: RuralActorsController;
  private baiSriGroup: THREE.Group = new THREE.Group();

  private charFrames: Record<Ch2CharacterKind, THREE.CanvasTexture[]> = {
    noom: [],
    mom: [],
    sister: [],
    monk: [],
    butcher: [],
    herbal_vendor: [],
    fish_vendor: [],
    yai_sai: [],
    krasue: [],
  };

  private animClock = 0;
  private zoomFactor = 1.0;
  private targetCamZ = 13.4;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#131926');
    this.scene.fog = new THREE.FogExp2('#131926', 0.015);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 110);
    this.camera.position.set(0, 2.3, 13.4);

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
    this.renderer.toneMappingExposure = 1.12;
    this.resize();

    this.hemiLight = new THREE.HemisphereLight('#788db5', '#211c14', 0.68);
    this.scene.add(this.hemiLight);

    this.sunMoonLight = new THREE.DirectionalLight('#ffcf96', 0.9);
    this.sunMoonLight.position.set(-10, 22, 14);
    this.sunMoonLight.castShadow = true;
    this.sunMoonLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.sunMoonLight);

    this.flashlight = new THREE.SpotLight('#fff0cc', 0, 14, Math.PI / 4, 0.55, 1.2);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight, this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    for (let f = 0; f < 4; f++) {
      this.charFrames.noom.push(createCh2CharacterTexture('noom', f));
      this.noomBikeFrames.push(createCh2BikeRiderTexture(f));
    }
    for (let f = 0; f < 2; f++) {
      this.charFrames.mom.push(createCh2CharacterTexture('mom', f));
      this.charFrames.sister.push(createCh2CharacterTexture('sister', f));
      this.charFrames.monk.push(createCh2CharacterTexture('monk', f));
      this.charFrames.butcher.push(createCh2CharacterTexture('butcher', f));
      this.charFrames.herbal_vendor.push(createCh2CharacterTexture('herbal_vendor', f));
      this.charFrames.fish_vendor.push(createCh2CharacterTexture('fish_vendor', f));
      this.charFrames.yai_sai.push(createCh2CharacterTexture('yai_sai', f));
      this.charFrames.krasue.push(createCh2CharacterTexture('krasue', f));
    }

    this.exteriorGroup = new THREE.Group();
    const preExt = this.scene.children.length;
    this.placedThornsMesh = new THREE.Group();
    this.saiSinGroup = new THREE.Group();
    this.saiSinGlowMat = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    this.saiSinThreadMat = new THREE.LineBasicMaterial({ color: '#f8fafc' });
    this.saiSinLight = new THREE.PointLight('#fde68a', 0, 11, 1.2);
    this.buffaloHerderGroup = new THREE.Group();
    this.castNetMesh = new THREE.Mesh();
    this.netRopeLine = new THREE.Line();
    this.netRippleMesh = new THREE.Mesh();
    this.caughtFishGroup = new THREE.Group();
    this.parkedBikeGroup = this.buildBicycleMesh(false);
    this.ridingBikeGroup = this.buildBicycleMesh(true);

    this.buildLandscapeAndRiceFields();
    this.buildRuralDailyLife();
    this.buildVillageFreshMarket();
    this.buildStiltHouseAndUnderneath();
    this.buildLargeTempleAndCemetery();
    this.buildSaiSinCircle();

    // Expanded village attractions, vehicles, Rot Hae, Songthaew, Temple Fair & Takian Shrine
    const extAwningMat = new THREE.MeshStandardMaterial({
      map: createMarketAwningTexture(),
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    this.rotHaeCtrl = buildRotHaeSystem(this.scene);
    this.songthaewCtrl = buildSongthaewSystem(this.scene);
    this.trafficVehicles = buildTrafficAndParkedVehicles(this.scene);
    this.templeFairCtrl = buildTempleFairZone(this.scene);
    this.ruralActorsCtrl = buildExpandedVillageLife(this.scene, extAwningMat);

    const extObjs = this.scene.children.slice(preExt);
    extObjs.forEach((o) => this.exteriorGroup.add(o));
    this.scene.add(this.exteriorGroup);

    this.buildInteriors();

    const shadowTex = this.createContactShadowTexture();
    this.playerMesh = this.makeChar(this.charFrames.noom[0], 1.5, 2.25);
    this.playerMesh.position.set(0, 0.94, 0.85);
    this.playerShadow = this.makeShadow(shadowTex);
    this.playerShadow.position.set(0, 0.02, 0.85);
    this.ridingBikeGroup.visible = false;
    this.scene.add(this.playerMesh, this.playerShadow, this.ridingBikeGroup);

    this.butcherMesh = this.makeChar(this.charFrames.butcher[0], 1.48, 2.22);
    this.butcherMesh.position.set(-44.0, 1.02, -1.78);
    this.exteriorGroup.add(this.butcherMesh);

    this.fishVendorMesh = this.makeChar(this.charFrames.fish_vendor[0], 1.48, 2.22);
    this.fishVendorMesh.position.set(-36.0, 1.02, -1.78);
    this.exteriorGroup.add(this.fishVendorMesh);

    this.herbVendorMesh = this.makeChar(this.charFrames.herbal_vendor[0], 1.48, 2.22);
    this.herbVendorMesh.position.set(-28.0, 1.02, -1.78);
    this.exteriorGroup.add(this.herbVendorMesh);

    this.yaiSaiMesh = this.makeChar(this.charFrames.yai_sai[0], 1.44, 2.15);
    this.yaiSaiMesh.position.set(-51.8, 0.94, -0.55);
    this.exteriorGroup.add(this.yaiSaiMesh);

    this.krasueMesh = this.makeChar(this.charFrames.krasue[0], 1.75, 2.55, '#1e3814');
    this.krasueMesh.position.set(6.5, 3.2, -0.4);
    this.krasueMesh.visible = false;
    this.scene.add(this.krasueMesh);

    this.krasueLight = new THREE.PointLight('#a3e635', 0, 8.5, 1.3);
    this.scene.add(this.krasueLight);

    // Rain particles spanning expanded -115 .. +130 world
    this.rainPositions = new Float32Array(this.rainCount * 6);
    const rGeo = new THREE.BufferGeometry();
    for (let i = 0; i < this.rainCount; i++) {
      const rx = -115 + Math.random() * 245;
      const ry = Math.random() * 18;
      const rz = 1.5 + Math.random() * 4.5;
      this.rainPositions[i * 6] = rx;
      this.rainPositions[i * 6 + 1] = ry;
      this.rainPositions[i * 6 + 2] = rz;
      this.rainPositions[i * 6 + 3] = rx - 0.1;
      this.rainPositions[i * 6 + 4] = ry - 0.5;
      this.rainPositions[i * 6 + 5] = rz;
    }
    rGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    this.rainLines = new THREE.LineSegments(
      rGeo,
      new THREE.LineBasicMaterial({ color: '#9ec2e8', transparent: true, opacity: 0 })
    );
    this.scene.add(this.rainLines);
  }

  private buildBicycleMesh(trackParts = false): THREE.Group {
    const g = new THREE.Group();
    const tireMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.72, roughness: 0.25 });

    [-0.54, 0.54].forEach((wx) => {
      const wheelGrp = new THREE.Group();
      wheelGrp.position.set(wx, 0.3, 0);
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 18), tireMat);
      wheelGrp.add(tire);
      // 4 silver wheel spokes so rotation is clearly visible while pedaling!
      [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].forEach((ang) => {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.022, 0.02), metalMat);
        spoke.rotation.z = ang;
        wheelGrp.add(spoke);
      });
      g.add(wheelGrp);
      if (trackParts) this.bikeWheels.push(wheelGrp);
    });

    // Green vintage Thai diamond bicycle frame scaled to align with seated rider pose!
    this.addBox(g, 0.64, 0.055, 0.05, '#15803d', -0.06, 0.72, 0); // top tube
    this.addBox(g, 0.62, 0.055, 0.05, '#15803d', -0.24, 0.5, 0).rotation.z = 0.72; // seat stay
    this.addBox(g, 0.58, 0.055, 0.05, '#15803d', 0.14, 0.52, 0).rotation.z = 0.68; // down tube
    this.addBox(g, 0.52, 0.055, 0.05, '#15803d', -0.14, 0.56, 0).rotation.z = 1.32; // seat post
    this.addBox(g, 0.55, 0.055, 0.05, '#cbd5e1', 0.38, 0.62, 0).rotation.z = -0.35; // front fork
    this.addBox(g, 0.12, 0.05, 0.44, '#cbd5e1', 0.36, 0.94, 0); // swept handlebar
    this.addBox(g, 0.24, 0.07, 0.14, '#78350f', -0.22, 0.84, 0); // leather saddle
    this.addBox(g, 0.24, 0.22, 0.24, '#a16207', 0.52, 0.76, 0); // front woven basket

    // Rotating central pedal crank arm
    const crank = new THREE.Group();
    crank.position.set(-0.04, 0.32, 0);
    this.addBox(crank, 0.04, 0.24, 0.03, '#e2e8f0', 0, 0, 0.06);
    this.addBox(crank, 0.1, 0.04, 0.08, '#111827', 0, 0.12, 0.08);
    g.add(crank);
    if (trackParts) this.bikeCrank = crank;
    return g;
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
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness })
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  /**
   * Builds a clean, symmetrical pitched Thai gable roof (no sheared cones!).
   * Length runs along X (width `w`), slopes pitch front (+Z) and back (-Z) across depth `d`.
   */
  private addThaiGableRoof(
    parent: THREE.Object3D,
    x: number,
    eaveY: number,
    z: number,
    w: number,
    d: number,
    height: number,
    roofColor: string,
    trimColor = '#78350f',
    gableWallColor?: string
  ): void {
    const halfD = d / 2 + 0.35;
    const slopeLen = Math.hypot(halfD, height);
    const slopeAngle = Math.atan2(height, halfD);

    const slopeMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.72 });
    [-1, 1].forEach((side) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.65, 0.14, slopeLen), slopeMat);
      panel.position.set(x, eaveY + height * 0.5, z + side * (halfD * 0.5));
      panel.rotation.x = side * slopeAngle;
      panel.castShadow = true;
      panel.receiveShadow = true;
      parent.add(panel);
    });

    // Ridge beam (สันหลังคา) + bargeboard cap
    this.addBox(parent, w + 0.8, 0.2, 0.24, trimColor, x, eaveY + height + 0.04, z, 0.5);

    // Gable end triangles on left and right edges (หน้าจั่วซ้าย-ขวา)
    if (gableWallColor) {
      const shape = new THREE.Shape();
      shape.moveTo(-d * 0.48, 0);
      shape.lineTo(d * 0.48, 0);
      shape.lineTo(0, height - 0.02);
      shape.closePath();
      const triGeo = new THREE.ShapeGeometry(shape);
      const triMat = new THREE.MeshStandardMaterial({ color: gableWallColor, roughness: 0.85, side: THREE.DoubleSide });
      [-1, 1].forEach((endSign) => {
        const tri = new THREE.Mesh(triGeo, triMat);
        tri.rotation.y = Math.PI / 2;
        tri.position.set(x + endSign * (w * 0.49), eaveY, z);
        parent.add(tri);
      });
    }
  }

  private createContactShadowTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0,0,0,0.68)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  private makeShadow(tex: THREE.CanvasTexture): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.52),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  private makeChar(tex: THREE.CanvasTexture, w: number, h: number, emissive = '#000000'): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.25,
        roughness: 0.72,
        emissive,
        emissiveIntensity: 0.55,
      })
    );
    m.castShadow = true;
    m.receiveShadow = false;
    return m;
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

  private addPlane(
    w: number,
    h: number,
    tex: THREE.Texture,
    x: number,
    y: number,
    z: number,
    transparent = false
  ): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.85,
        transparent,
        alphaTest: transparent ? 0.25 : 0,
      })
    );
    m.position.set(x, y, z);
    this.scene.add(m);
    return m;
  }

  private addBackgroundStiltHouse(x: number, z: number, roofCol: string, lit: boolean): void {
    // 6 Tall teak stilts resting on concrete footings + raised teak veranda deck + wooden front stairs
    [-2.4, 0, 2.4].forEach((dx) => {
      this.addBox(this.scene, 0.34, 0.16, 0.34, '#94a3b8', x + dx, 0.08, z + 0.78);
      this.addBox(this.scene, 0.22, 3.6, 0.22, '#3b2416', x + dx, 1.8, z + 0.78);
      this.addBox(this.scene, 0.22, 3.6, 0.22, '#3b2416', x + dx, 1.8, z - 0.88);
    });
    this.addBox(this.scene, 5.9, 0.18, 2.5, '#593722', x, 1.68, z + 0.05); // wide veranda floor
    // Open front balcony handrail + wooden balusters on veranda edge
    this.addBox(this.scene, 5.5, 0.07, 0.08, '#854d0e', x, 2.24, z + 1.2);
    for (let bx = -2.4; bx <= 1.6; bx += 0.5) {
      this.addBox(this.scene, 0.06, 0.5, 0.06, '#78350f', x + bx, 1.98, z + 1.2);
    }
    // Wooden stairs descending smoothly from veranda right edge (+2.1)
    for (let s = 0; s < 5; s++) {
      this.addBox(this.scene, 0.28, 0.1, 0.8, '#6b4226', x + 2.05 + (4 - s) * 0.22, 0.22 + s * 0.32, z + 0.88);
    }

    // Upper teak house walls with horizontal wooden plank siding & teak door + twin windows!
    this.addBox(this.scene, 5.1, 2.05, 1.65, '#422a1b', x, 2.78, z - 0.12);
    [2.1, 2.45, 2.8, 3.15, 3.5].forEach((py) => {
      this.addBox(this.scene, 5.16, 0.055, 0.05, '#5c3a22', x, py, z + 0.72);
    });
    const bDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 1.55),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('เรือนไทย', false), roughness: 0.78 })
    );
    bDoor.position.set(x + 1.15, 2.58, z + 0.72);
    this.scene.add(bDoor);
    // Protruding porch eave overhang & symmetrical gable roof
    this.addBox(this.scene, 5.6, 0.1, 0.9, '#6b4226', x, 3.72, z + 0.9);
    this.addThaiGableRoof(this.scene, x, 3.78, z - 0.12, 5.4, 2.15, 1.45, roofCol, '#78350f', '#2b180d');

    // Authentic Lived-In Isaan Under-Stilt Details (ใต้ถุนบ้าน: แคร่ไม้ไผ่ + เปลญวน + โอ่งมังกร + กองฟืน + หลอดไฟใต้ถุน)!
    // 1) Bamboo daybed (แคร่) + rolled reed mat on left
    this.addBox(this.scene, 1.95, 0.1, 1.05, '#8c6239', x - 1.2, 0.48, z - 0.1);
    [-2.0, -0.4].forEach((lx) => this.addBox(this.scene, 0.09, 0.45, 0.95, '#593722', x + lx, 0.24, z - 0.1));
    this.addBox(this.scene, 0.36, 0.12, 0.42, '#dc2626', x - 1.8, 0.58, z - 0.1); // red khit pillow
    // 2) Slung woven Pha Khao Ma hammock (เปลญวน) on right stilt bay
    this.addBox(this.scene, 1.8, 0.08, 0.52, '#b91c1c', x + 1.15, 0.72, z - 0.15).rotation.z = 0.08;
    // 3) Glazed ceramic Thai water jar (ตุ่มน้ำ) + wooden firewood stack
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.2, 0.62, 12),
      new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.55 })
    );
    jar.position.set(x - 0.05, 0.31, z + 0.18);
    this.scene.add(jar);

    if (lit) {
      const w = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 0.9),
        new THREE.MeshStandardMaterial({ map: createThaiWindowTexture(true), emissive: '#3b2408', emissiveIntensity: 0.65 })
      );
      w.position.set(x - 1.15, 2.86, z + 0.72);
      this.scene.add(w);
      // Warm hanging bulb underneath house deck lighting up the under-stilt bamboo bed, hammock & jar!
      const underBulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
      underBulb.position.set(x, 1.52, z + 0.4);
      this.scene.add(underBulb);
      const l = new THREE.PointLight('#ffbf69', 3.4, 10.5, 1.15);
      l.position.set(x, 1.48, z + 1.65);
      this.scene.add(l);
    }
  }

  private addWaterBuffalo(x: number, z: number, facing: 1 | -1): void {
    const g = new THREE.Group();
    this.addBox(g, 1.55, 0.72, 0.72, '#2d2a30', 0, 0.85, 0, 0.9);
    this.addBox(g, 0.48, 0.42, 0.44, '#242126', 0.85 * facing, 0.98, 0, 0.9);
    [-0.25, 0.25].forEach((hz) => {
      const horn = this.addBox(g, 0.08, 0.42, 0.08, '#9ca3af', 0.8 * facing, 1.28, hz, 0.6);
      horn.rotation.x = hz > 0 ? 0.55 : -0.55;
      horn.rotation.z = -0.35 * facing;
    });
    [-0.5, 0.45].forEach((lx) => {
      [-0.2, 0.2].forEach((lz) => {
        this.addBox(g, 0.14, 0.52, 0.14, '#1c1a1e', lx, 0.26, lz);
      });
    });
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  private buildLandscapeAndRiceFields(): void {
    // Rural laterite earthen sidewalk + wide 2-lane village asphalt highway + lush paddy soil across -132..+148
    this.addBox(this.scene, 290, 0.4, 9.8, '#4b3b2c', 8, -0.2, 1.45, 0.92);
    this.addBox(this.scene, 290, 0.36, 16.5, '#23381f', 8, -0.22, -8.8, 0.95);
    this.addBox(this.scene, 290, 0.04, 2.7, '#272a30', 8, 0.015, 4.0, 0.9); // dark asphalt highway
    for (let lx = -126; lx <= 138; lx += 5.0) {
      this.addBox(this.scene, 2.4, 0.05, 0.1, '#facc15', lx, 0.022, 4.0, 0.6);
    }

    // Smooth organic Phuphan mountain silhouettes across expanded horizon (layered rounded ridges, no pointy cones!)
    for (let mx = -125; mx <= 145; mx += 18) {
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshBasicMaterial({ color: mx % 36 === 0 ? '#0d1522' : '#121d2e' })
      );
      hill.scale.set(1.35, 0.62 + (Math.abs(mx) % 4) * 0.1, 0.55);
      hill.position.set(mx, 0, mx % 36 === 0 ? -21 : -17);
      this.scene.add(hill);
    }

    // Neighbor elevated stilt houses behind the village road & paddies (clear of Store -89.5 & Fair)
    this.addBackgroundStiltHouse(-107.0, -5.6, '#4c2618', true);
    this.addBackgroundStiltHouse(-73.5, -5.8, '#3d2c20', true);
    this.addBackgroundStiltHouse(-58.5, -4.5, '#4c2618', true);
    this.addBackgroundStiltHouse(-39.5, -5.6, '#3d2c20', true);
    this.addBackgroundStiltHouse(-31.0, -5.8, '#3f3024', true);
    this.addBackgroundStiltHouse(-22.5, -4.8, '#473022', true);
    this.addBackgroundStiltHouse(-15.5, -6.0, '#36261d', true);
    this.addBackgroundStiltHouse(14.0, -5.8, '#4c2618', true);
    this.addBackgroundStiltHouse(106.0, -6.2, '#3d2c20', false);

    // Cozy Rice-Field Hut (เถียงนาอีสาน at x = -16.8, z = -3.8)
    [-17.8, -15.8].forEach((hx) => {
      this.addBox(this.scene, 0.14, 2.8, 0.14, '#593722', hx, 1.4, -3.2);
      this.addBox(this.scene, 0.14, 2.8, 0.14, '#593722', hx, 1.4, -4.4);
    });
    this.addBox(this.scene, 2.4, 0.12, 1.6, '#78502e', -16.8, 1.15, -3.8);
    this.addThaiGableRoof(this.scene, -16.8, 2.75, -3.8, 2.4, 1.7, 0.85, '#6b4f2e');

    // Open Scenic Village Pond & Boat Pier Bay (หนองน้ำบ้านทุ่ง + ท่าเรือไม้ x = 18.2 .. 25.0)
    const pondMat = new THREE.MeshStandardMaterial({ color: '#0f3b4d', roughness: 0.1, metalness: 0.72 });
    const pond = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 5.6), pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(21.6, 0.04, -3.15);
    this.scene.add(pond);
    this.addBox(this.scene, 7.6, 0.12, 0.35, '#5c4632', 21.6, 0.04, -0.38); // pond earthen bank edge

    // Traditional Wooden Boat Pier (ท่าเรือไม้ยื่นลงหนองน้ำที่ x = 20.4)
    [19.75, 21.05].forEach((px) => {
      [-0.8, -1.9, -2.95].forEach((pz) => {
        this.addBox(this.scene, 0.14, 0.88, 0.14, '#3b2416', px, 0.25, pz);
      });
    });
    this.addBox(this.scene, 1.65, 0.12, 2.65, '#78502e', 20.4, 0.45, -1.8); // pier plank deck
    this.addBox(this.scene, 1.2, 0.14, 0.45, '#593722', 20.4, 0.22, -0.35); // shore step onto pier
    // Mooring post + warm pier lantern
    this.addBox(this.scene, 0.12, 1.85, 0.12, '#4f311c', 19.7, 1.15, -2.9);
    const pierLampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
    pierLampBulb.position.set(19.7, 2.08, -2.9);
    this.scene.add(pierLampBulb);
    const pierLight = new THREE.PointLight('#ffcf78', 4.5, 11, 1.1);
    pierLight.position.set(20.6, 2.2, -2.2);
    this.scene.add(pierLight);

    // Classic Wooden Thai Rowboat floating by the pier (เรือพายไม้)
    this.addBox(this.scene, 2.1, 0.22, 0.72, '#5c3c20', 22.9, 0.08, -2.0);
    this.addBox(this.scene, 1.7, 0.14, 0.56, '#78502e', 22.9, 0.2, -2.0);
    this.addBox(this.scene, 1.6, 0.05, 0.08, '#92400e', 22.9, 0.28, -1.82); // wooden oar

    this.addWaterBuffalo(-14.2, -3.4, 1);
    this.addWaterBuffalo(14.0, -3.2, -1);

    // Scarecrow moved slightly to -14.8 clear of Rice Granary (-11.4)
    this.addBox(this.scene, 0.1, 1.85, 0.1, '#5c3c20', -14.8, 0.92, -2.7);
    this.addBox(this.scene, 1.1, 0.12, 0.1, '#991b1b', -14.8, 1.38, -2.7);
    const strawHat = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 6), new THREE.MeshStandardMaterial({ color: '#a16207' }));
    strawHat.position.set(-14.8, 1.88, -2.7);
    this.scene.add(strawHat);

    // Haystacks & Bamboo Chicken Coops cleanly spaced into distinct yard zones
    [-12.2, 13.4].forEach((fx) => {
      this.addBox(this.scene, 0.12, 2.1, 0.12, '#4f311c', fx, 1.05, -2.25);
      const hay = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 1.75, 10),
        new THREE.MeshStandardMaterial({ color: '#a17a36', roughness: 0.95 })
      );
      hay.position.set(fx, 0.88, -2.25);
      this.scene.add(hay);
    });
    [8.7, 11.7].forEach((cx) => {
      const coop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.44, 0.55, 8, 1, true),
        new THREE.MeshStandardMaterial({ color: '#8c6239', roughness: 0.85, side: THREE.DoubleSide })
      );
      coop.position.set(cx, 0.28, -0.95);
      this.scene.add(coop);
    });

    const treePositions = [-103, -90, -77, -64, -60.5, -21, -18.8, -14, -7.2, 7.2, 13.0, 16.0, 93.8, 100.5, 106.0, 117.0];
    treePositions.forEach((tx, idx) => {
      const tr = idx % 2 === 0 ? build25DStreetTree({ scale: 1.12 }) : build25DBananaClump(1.08);
      tr.position.set(tx, 0, -2.9 - (idx % 3) * 0.45);
      tr.rotation.y = idx * 0.7;
      this.scene.add(tr);
    });
    void this.addPlane;

    const riceZones = [-22, -19, -16, -13, 13.2, 15.8];
    riceZones.forEach((rx) => {
      for (let i = 0; i < 6; i++) {
        this.addBox(
          this.scene,
          0.16,
          0.78 + (i % 3) * 0.18,
          0.16,
          i % 2 === 0 ? '#4d7c2b' : '#739134',
          rx + (i - 2.5) * 0.4,
          0.35,
          -2.5 - (i % 3) * 0.55,
          0.9
        );
      }
      this.addBox(this.scene, 2.8, 0.08, 0.08, '#6b4c2e', rx, 0.55, -2.05);
    });

    // Bamboo Clumps cleanly placed away from buildings, pond & bus shelters
    [-20.5, -7.8, 94.4, 98.5].forEach((bx) => {
      for (let k = -1; k <= 1; k++) {
        const stalk = this.addBox(this.scene, 0.09, 5.2 + Math.abs(k) * 0.4, 0.09, '#3f6212', bx + k * 0.24, 2.6, -2.85);
        stalk.rotation.z = k * 0.06;
      }
    });

    [-17.5, -9.2, 14.0, 96.5].forEach((px) => {
      this.addBox(this.scene, 0.24, 6.8, 0.24, '#473628', px, 3.4, -4.2);
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 1.3, 6),
        new THREE.MeshStandardMaterial({ color: '#1e3f20', roughness: 0.85 })
      );
      crown.position.set(px, 7.0, -4.2);
      this.scene.add(crown);
    });

    // Paddy Spirit Shrine (ศาลปู่ตาริมทุ่งนา at +17.5, behind walkway at z = -1.25)
    this.addBox(this.scene, 0.16, 1.5, 0.16, '#593722', 17.5, 0.75, -1.35);
    this.addBox(this.scene, 1.1, 0.1, 0.85, '#784e2e', 17.5, 1.5, -1.35);
    this.addBox(this.scene, 0.8, 0.55, 0.7, '#4a2e1a', 17.5, 1.82, -1.35);
    this.addThaiGableRoof(this.scene, 17.5, 2.1, -1.35, 0.9, 0.8, 0.45, '#7f1d1d');
    // Natural Village Subdistrict Checkpoint Boom Barrier & Bamboo Fence at highway ends (-120.5 & +138.5)
    [-120.5, 138.5].forEach((endX) => {
      // Whitewashed checkpoint pillars + striped wooden boom gate bar across road + roadside bamboo fence
      [-1.5, 4.8].forEach((pz) => {
        this.addBox(this.scene, 0.34, 1.45, 0.34, '#e2e8f0', endX, 0.72, pz, 0.8);
        this.addBox(this.scene, 0.42, 0.14, 0.42, '#b91c1c', endX, 1.48, pz, 0.7);
      });
      this.addBox(this.scene, 0.14, 0.14, 6.2, '#dc2626', endX, 1.02, 1.65);
      for (let bz = -0.8; bz <= 4.2; bz += 1.2) {
        this.addBox(this.scene, 0.16, 0.16, 0.5, '#f8fafc', endX, 1.02, bz);
      }
      const endTree = build25DStreetTree({ scale: 1.18 });
      endTree.position.set(endX + (endX < 0 ? -1.8 : 1.8), 0, -2.1);
      this.scene.add(endTree);
    });
    const shrineCandle = new THREE.PointLight('#ff9a3c', 3.4, 9, 1.2);
    shrineCandle.position.set(17.5, 1.8, -0.55);
    this.scene.add(shrineCandle);

    // Tall utility poles along z = -3.4 spanning the expanded 254m village!
    const vPoles = [-110, -92.5, -79, -64, -48, -32, -16, 12, 27, 46, 59.5, 93.0, 114];
    vPoles.forEach((px) => {
      this.addBox(this.scene, 0.22, 7.2, 0.22, '#4a3f35', px, 3.6, -3.4);
      this.addBox(this.scene, 0.1, 0.08, 1.4, '#475569', px, 6.7, -2.7);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#ffcf78' })
      );
      bulb.position.set(px, 6.56, -2.05);
      this.scene.add(bulb);
      const l = new THREE.PointLight('#ffcc78', 8.5, 24, 0.78);
      l.position.set(px, 5.2, 1.95);
      this.scene.add(l);
      this.villageLights.push({ light: l, base: 8.5 });
    });
    for (let i = 0; i < vPoles.length - 1; i++) {
      const mid = new THREE.Vector3((vPoles[i] + vPoles[i + 1]) / 2, 6.3, -3.4);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(vPoles[i], 6.7, -3.4),
        mid,
        new THREE.Vector3(vPoles[i + 1], 6.7, -3.4),
      ]);
      this.scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.02, 5, false), new THREE.MeshBasicMaterial({ color: '#111318' })));
    }
  }

  private buildRuralDailyLife(): void {
    // 1) Villager leading a walking Water Buffalo along the rice paddy edge (ชาวบ้านจูงควายเดิน z = -2.1)
    const herder = new THREE.Group();
    this.addBox(herder, 0.34, 0.72, 0.24, '#1e3a8a', -1.4, 0.92, 0); // morhom shirt
    this.addBox(herder, 0.3, 0.56, 0.22, '#172554', -1.4, 0.3, 0); // pants
    this.addBox(herder, 0.26, 0.28, 0.24, '#d9a47c', -1.4, 1.42, 0); // head
    const hHat = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 8), new THREE.MeshStandardMaterial({ color: '#a16207' }));
    hHat.position.set(-1.4, 1.62, 0);
    herder.add(hHat);
    this.buffaloHerderGroup.add(herder);

    const walkBuff = new THREE.Group();
    this.addBox(walkBuff, 1.45, 0.68, 0.68, '#2d2a30', 0.45, 0.82, 0);
    this.addBox(walkBuff, 0.45, 0.4, 0.42, '#242126', -0.38, 0.96, 0);
    [-0.22, 0.22].forEach((hz) => {
      const horn = this.addBox(walkBuff, 0.07, 0.38, 0.07, '#9ca3af', -0.34, 1.24, hz);
      horn.rotation.x = hz > 0 ? 0.5 : -0.5;
      horn.rotation.z = 0.35;
    });
    [0.05, 0.95].forEach((lx) => {
      [-0.18, 0.18].forEach((lz) => this.addBox(walkBuff, 0.13, 0.48, 0.13, '#1c1a1e', lx, 0.24, lz));
    });
    this.buffaloHerderGroup.add(walkBuff);

    // Lead rope connecting villager's hand to the buffalo's nose!
    const ropePts = [new THREE.Vector3(-1.25, 0.9, 0), new THREE.Vector3(-0.85, 0.72, 0), new THREE.Vector3(-0.55, 0.92, 0)];
    this.buffaloHerderGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(ropePts), new THREE.LineBasicMaterial({ color: '#d6b384' }))
    );
    this.buffaloHerderGroup.position.set(this.buffaloWalkX, 0, -2.15);
    this.scene.add(this.buffaloHerderGroup);

    // 2) Raised Wooden/Bamboo Chicken Coop (เล้าไก่บ้าน) + Villager feeding Chickens in open right lawn at x = +10.2!
    const coopX = 10.2;
    [coopX - 0.75, coopX + 0.75].forEach((cx) => {
      this.addBox(this.scene, 0.12, 1.55, 0.12, '#4f311c', cx, 0.78, -2.05);
      this.addBox(this.scene, 0.12, 1.55, 0.12, '#4f311c', cx, 0.78, -2.85);
    });
    this.addBox(this.scene, 1.75, 0.1, 0.95, '#78502e', coopX, 0.52, -2.45);
    this.addBox(this.scene, 1.65, 0.9, 0.85, '#3b2416', coopX, 1.0, -2.5);
    this.addBox(this.scene, 1.55, 0.18, 0.75, '#eab308', coopX, 0.62, -2.45);
    for (let s = -3; s <= 3; s++) {
      if (s === 0) continue;
      this.addBox(this.scene, 0.06, 0.85, 0.06, '#a16207', coopX + s * 0.22, 1.02, -2.04);
    }
    this.addThaiGableRoof(this.scene, coopX, 1.48, -2.45, 1.85, 1.15, 0.55, '#6b4f2e');
    const chickRamp = this.addBox(this.scene, 0.36, 0.06, 0.82, '#8c6239', coopX, 0.28, -1.72);
    chickRamp.rotation.x = 0.58;
    const coopLamp = new THREE.PointLight('#ffbe6b', 2.8, 9, 1.2);
    coopLamp.position.set(coopX, 2.0, -1.2);
    this.scene.add(coopLamp);

    // Farmer tossing feed beside chicken coop + pecking chickens
    this.addBox(this.scene, 0.34, 0.68, 0.24, '#92400e', 11.2, 0.9, -1.25);
    this.addBox(this.scene, 0.3, 0.55, 0.22, '#3b2416', 11.2, 0.28, -1.25);
    this.addBox(this.scene, 0.26, 0.26, 0.24, '#cf9970', 11.2, 1.38, -1.25);
    [9.45, 10.05, 10.65].forEach((cx, idx) => {
      const chk = new THREE.Group();
      this.addBox(chk, 0.26, 0.18, 0.16, idx === 0 ? '#b45309' : '#f8fafc', 0, 0.22, 0);
      this.addBox(chk, 0.1, 0.12, 0.1, '#ef4444', 0.14 * (idx % 2 === 0 ? 1 : -1), 0.32, 0);
      chk.position.set(cx, 0, -1.08 - (idx % 2) * 0.2);
      this.scene.add(chk);
      this.chickens.push(chk);
    });

    // 3) Fisherman standing ON TOP OF Wooden Pier casting a Fishing Net with Haul Line & Catching Fish! (x = 20.5 .. 22.3)
    const pierDeckY = 0.5;
    this.addBox(this.scene, 0.34, 0.7, 0.24, '#0f766e', 20.5, pierDeckY + 0.9, -2.55);
    this.addBox(this.scene, 0.3, 0.55, 0.22, '#1e293b', 20.5, pierDeckY + 0.28, -2.55);
    this.addBox(this.scene, 0.26, 0.26, 0.24, '#cf9970', 20.5, pierDeckY + 1.38, -2.55);
    this.addBox(this.scene, 0.36, 0.08, 0.08, '#cf9970', 20.72, pierDeckY + 1.0, -2.52).rotation.z = -0.25; // outstretched holding arm
    const fHat = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 8), new THREE.MeshStandardMaterial({ color: '#a16207' }));
    fHat.position.set(20.5, pierDeckY + 1.58, -2.55);
    this.scene.add(fHat);
    // Wicker Thai fish basket (ข้องใส่ปลา) beside fisherman on pier
    const basket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 0.32, 10),
      new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.85 })
    );
    basket.position.set(20.02, pierDeckY + 0.16, -2.35);
    this.scene.add(basket);

    // Throwing Net (แห) + Dynamic Hand Rope Line (เส้นเชือกจอมแห) + Wriggling Fish Caught Inside!
    this.castNetMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.92, 0.72, 12, 2, true),
      new THREE.MeshBasicMaterial({ color: '#f1f5f9', wireframe: true, transparent: true, opacity: 0.88 })
    );
    this.castNetMesh.position.set(22.1, 0.55, -2.85);
    this.scene.add(this.castNetMesh);

    const ropeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(20.85, pierDeckY + 0.96, -2.52),
      new THREE.Vector3(21.45, 1.0, -2.68),
      new THREE.Vector3(22.1, 0.9, -2.85),
    ]);
    this.netRopeLine = new THREE.Line(ropeGeo, new THREE.LineBasicMaterial({ color: '#fef3c7' }));
    this.scene.add(this.netRopeLine);

    // 3 Silvery-Orange Caught Thai Fish inside the hauled net!
    [
      { dx: -0.14, dy: -0.18, col: '#cbd5e1' },
      { dx: 0.12, dy: -0.24, col: '#94a3b8' },
      { dx: 0.0, dy: -0.1, col: '#f59e0b' },
    ].forEach((fd) => {
      const f = new THREE.Group();
      this.addBox(f, 0.28, 0.11, 0.08, fd.col, 0, 0, 0, 0.35);
      this.addBox(f, 0.1, 0.14, 0.04, '#ea580c', -0.16, 0, 0, 0.4); // tail fin
      f.position.set(fd.dx, fd.dy, 0);
      this.caughtFishGroup.add(f);
    });
    this.caughtFishGroup.visible = false;
    this.scene.add(this.caughtFishGroup);

    this.netRippleMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.65, 20),
      new THREE.MeshBasicMaterial({ color: '#bae6fd', transparent: true, opacity: 0.52, side: THREE.DoubleSide })
    );
    this.netRippleMesh.rotation.x = -Math.PI / 2;
    this.netRippleMesh.position.set(22.1, 0.06, -2.85);
    this.scene.add(this.netRippleMesh);

    // 4) Two Villagers planting & tending rice in the green paddies (ชาวบ้านทำนา/ดำนา)
    [-19.2, -12.8].forEach((fx, idx) => {
      const f = new THREE.Group();
      this.addBox(f, 0.34, 0.68, 0.24, idx === 0 ? '#1e3a8a' : '#7f1d1d', 0, 0.85, 0);
      this.addBox(f, 0.3, 0.52, 0.22, '#1e293b', 0, 0.26, 0);
      this.addBox(f, 0.26, 0.26, 0.24, '#c7936c', 0, 1.34, 0);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.22, 8), new THREE.MeshStandardMaterial({ color: '#a16207' }));
      hat.position.set(0, 1.55, 0);
      f.add(hat);
      f.position.set(fx, 0, -3.2 - idx * 0.3);
      this.scene.add(f);
      this.riceFarmers.push(f);
    });
  }

  private buildVillageFreshMarket(): void {
    const awningMat = new THREE.MeshStandardMaterial({
      map: createMarketAwningTexture(),
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const zincMat = new THREE.MeshStandardMaterial({
      map: createZincRoofTexture(),
      roughness: 0.65,
      metalness: 0.3,
    });

    // Market Archway Wooden Banner supported by 2 full-height pillars (-36)
    [-37.8, -34.2].forEach((px) => {
      this.addBox(this.scene, 0.14, 4.7, 0.14, '#4f311c', px, 2.35, -0.35);
    });
    const mSign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.05),
      new THREE.MeshStandardMaterial({ map: paintSignTex('#1e293b', '#eab308', '#fef08a', 'ตลาดสดบ้านทุ่ง', 'ของสด • หมู • ปลา • สมุนไพรพื้นบ้าน') })
    );
    mSign.position.set(-36, 4.1, -0.26);
    this.scene.add(mSign);

    const buildStallStructure = (sx: number, signTex: THREE.CanvasTexture, counterCol: string, counterH: number) => {
      // 4 grounded stall posts + top beams holding the awning cleanly ABOVE the shop sign!
      [-1.95, 1.95].forEach((dx) => {
        this.addBox(this.scene, 0.11, 2.35, 0.11, '#593722', sx + dx, 1.18, -0.45); // front post
        this.addBox(this.scene, 0.11, 3.25, 0.11, '#4f311c', sx + dx, 1.62, -2.05); // tall back post
        const rafter = this.addBox(this.scene, 0.08, 0.08, 1.9, '#593722', sx + dx, 2.75, -1.25);
        rafter.rotation.x = 0.52;
      });
      this.addBox(this.scene, 4.05, 0.09, 0.09, '#593722', sx, 2.3, -0.45); // front eave beam
      const awning = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.2), awningMat);
      awning.position.set(sx, 2.76, -1.26);
      awning.rotation.x = -1.05;
      this.scene.add(awning);

      // Front counter table at z = -1.15 so merchants stand BEHIND it at z = -1.78!
      this.addBox(this.scene, 3.5, counterH, 0.88, counterCol, sx, counterH / 2, -1.15);
      // Wooden backing panel + shop sign mounted strictly IN FRONT of awning lip (zero clipping!)
      this.addBox(this.scene, 2.22, 0.68, 0.05, '#3b2416', sx, 2.04, -0.25);
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.15, 0.62),
        new THREE.MeshStandardMaterial({ map: signTex })
      );
      sign.position.set(sx, 2.04, -0.21);
      this.scene.add(sign);
    };

    // 1) Rich 2.5D Yai Sai's Rustic Timber Cottage & Covered Porch at -52.5 (replaces flat black box!)
    // Raised teak veranda plinth, wooden stairs & front porch pillars supporting sloped tin porch roof
    this.addBox(this.scene, 5.1, 0.26, 2.75, '#4f311c', -52.5, 0.13, -1.95, 0.88); // wooden veranda deck
    this.addBox(this.scene, 1.35, 0.14, 0.42, '#6b4226', -53.35, 0.08, -0.45, 0.85); // wooden front step
    this.addBox(this.scene, 4.75, 2.9, 1.75, '#422a1b', -52.5, 1.7, -2.55, 0.88); // warm aged teak cabin
    // Horizontal teak clapboard siding ribs & vertical corner frame beams for rich architectural depth
    [0.65, 1.05, 1.45, 1.85, 2.25, 2.65].forEach((py) => {
      this.addBox(this.scene, 4.82, 0.07, 0.06, '#5c3a22', -52.5, py, -1.66, 0.82);
    });
    [-54.82, -52.5, -50.18].forEach((px) => {
      this.addBox(this.scene, 0.16, 2.9, 0.16, '#2b190e', px, 1.7, -1.66, 0.85);
      if (px !== -52.5) this.addBox(this.scene, 0.14, 2.55, 0.14, '#3b2416', px, 1.4, -0.82, 0.85); // front porch pillars
    });
    // Sloped porch tin awning + symmetrical Thai Gable Roof above!
    const yaiPorchRoof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 1.45), zincMat);
    yaiPorchRoof.position.set(-52.5, 2.72, -1.22);
    yaiPorchRoof.rotation.x = 0.22;
    this.scene.add(yaiPorchRoof);
    this.addThaiGableRoof(this.scene, -52.5, 3.18, -2.55, 5.2, 2.35, 1.45, '#592c1b', '#78350f', '#2b180d');
    // Detailed weathered wooden door + warm amber glowing louvered shutter window + bamboo porch bench + hanging lantern!
    const yaiDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.12, 2.05),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('เรือนยายสาย', true), roughness: 0.78 })
    );
    yaiDoor.position.set(-53.35, 1.28, -1.65);
    const yaiWin = new THREE.Mesh(
      new THREE.PlaneGeometry(1.38, 1.08),
      new THREE.MeshStandardMaterial({ map: createThaiWindowTexture(true), emissive: '#522c08', emissiveIntensity: 0.65 })
    );
    yaiWin.position.set(-51.45, 1.72, -1.65);
    this.scene.add(yaiDoor, yaiWin);
    this.addBox(this.scene, 1.2, 0.08, 0.42, '#854d0e', -51.4, 0.62, -1.12, 0.8); // porch bamboo bench
    const yaiBulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
    yaiBulb.position.set(-52.45, 2.48, -0.92);
    const yaiLantern = new THREE.PointLight('#ff9a3c', 3.6, 10, 1.05);
    yaiLantern.position.set(-52.45, 2.35, 0.85);
    this.scene.add(yaiBulb, yaiLantern);
    // Big earthen herb jar on veranda side
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.24, 0.72, 12),
      new THREE.MeshStandardMaterial({ color: '#5c3822', roughness: 0.7 })
    );
    jar.position.set(-50.2, 0.62, -1.05);
    this.scene.add(jar);
    this.addBox(this.scene, 0.65, 0.08, 0.65, '#e2e8f0', -50.2, 1.0, -1.05);

    // 2) Pork Butcher Stall (-44.0): round chopping block + meat cleaver + layered pork belly slabs + overhead hanging hook bar!
    buildStallStructure(-44.0, paintSignTex('#7f1d1d', '#facc15', '#fef9c3', 'เขียงหมูเฮียตี๋'), '#69442a', 0.88);
    const block = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.2, 14), new THREE.MeshStandardMaterial({ color: '#c49664', roughness: 0.75 }));
    block.position.set(-44.55, 0.98, -1.08);
    this.scene.add(block);
    // Meat cleaver blade + handle resting on chopping block
    this.addBox(this.scene, 0.22, 0.03, 0.14, '#cbd5e1', -44.5, 1.09, -1.06, 0.25);
    this.addBox(this.scene, 0.14, 0.04, 0.05, '#78350f', -44.34, 1.09, -1.06, 0.7);
    // Layered pork belly cuts (สามชั้น & สันคอ) on metal tray
    this.addBox(this.scene, 0.95, 0.04, 0.52, '#cbd5e1', -43.55, 0.9, -1.08, 0.3);
    [-43.82, -43.38].forEach((mx) => {
      this.addBox(this.scene, 0.36, 0.08, 0.28, '#dc2626', mx, 0.95, -1.08, 0.45);
      this.addBox(this.scene, 0.36, 0.04, 0.28, '#fecdd3', mx, 1.01, -1.08, 0.5); // fat layer!
    });
    // Overhead steel hook bar with hanging pork cuts
    this.addBox(this.scene, 2.2, 0.04, 0.04, '#94a3b8', -44.0, 1.95, -1.25, 0.3);
    [-44.5, -43.5].forEach((hx) => {
      this.addBox(this.scene, 0.03, 0.22, 0.03, '#cbd5e1', hx, 1.84, -1.25, 0.3);
      this.addBox(this.scene, 0.18, 0.34, 0.12, '#b91c1c', hx, 1.62, -1.25, 0.45);
    });

    // 3) Fish & Amphibian Tub Stall (-36.0): water tubs filled with whole silver fish & green frogs + woven dried-fish tray!
    buildStallStructure(-36.0, paintSignTex('#0c4a6e', '#bae6fd', '#f0f9ff', 'แผงปลา-กบ ป้าบัว'), '#475569', 0.78);
    [-36.9, -35.2].forEach((tx, ti) => {
      const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.32, 14), new THREE.MeshStandardMaterial({ color: ti === 0 ? '#0284c7' : '#0369a1', roughness: 0.4 }));
      tub.position.set(tx, 0.94, -1.1);
      this.scene.add(tub);
      // Water disk inside tub
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.41, 14), new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.15, metalness: 0.4 }));
      water.rotation.x = -Math.PI / 2;
      water.position.set(tx, 1.08, -1.1);
      this.scene.add(water);
      if (ti === 0) {
        // 3 Whole silver fish (pla chon / pla nin) with tail fins!
        [-0.16, 0.04, 0.18].forEach((fx, fi) => {
          const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshStandardMaterial({ color: fi === 1 ? '#e2e8f0' : '#94a3b8', metalness: 0.45, roughness: 0.25 }));
          fBody.scale.set(1.65, 0.55, 0.65);
          fBody.position.set(tx + fx, 1.1, -1.1 + (fi % 2) * 0.12);
          fBody.rotation.y = fi * 0.5;
          this.scene.add(fBody);
        });
      } else {
        // 3 Plump green frogs sitting in right tub
        [-0.14, 0.08, -0.02].forEach((gx, gi) => {
          const frog = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 0.5 }));
          frog.scale.set(1.1, 0.85, 1.2);
          frog.position.set(tx + gx, 1.11, -1.18 + gi * 0.14);
          this.scene.add(frog);
        });
      }
    });
    // Bamboo woven tray (กระด้ง) in center with mackerel fish
    const fishTray = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.06, 12), new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.85 }));
    fishTray.position.set(-36.05, 0.81, -0.98);
    this.scene.add(fishTray);
    [-36.14, -35.96].forEach((mx) => {
      const mack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.28, 8), new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.5 }));
      mack.rotation.z = Math.PI / 2;
      mack.position.set(mx, 0.86, -0.98);
      this.scene.add(mack);
    });

    // 4) Herb, Garlic & Jujube Thorns Stall (-28.0): round woven baskets with leaf bundles, garlic bulbs, and spiky thorn branches!
    buildStallStructure(-28.0, paintSignTex('#14532d', '#eab308', '#f0fdf4', 'สมุนไพร & หนามพุทรา'), '#593722', 0.85);
    [-28.9, -28.0, -27.1].forEach((hx, hi) => {
      // Round bamboo Kra-dong tray (กระจาดสาน)
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.14, 14), new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.88 }));
      basket.position.set(hx, 0.92, -1.08);
      this.scene.add(basket);
      if (hi === 0) {
        // Green herb leaf bundles (ห่อว่านใบหนาด & ตะไคร้)
        [-0.1, 0.08].forEach((lx) => {
          const herb = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 7), new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.75 }));
          herb.rotation.z = lx > 0 ? -0.5 : 0.45;
          herb.rotation.x = 0.5;
          herb.position.set(hx + lx, 1.02, -1.06);
          this.scene.add(herb);
        });
      } else if (hi === 1) {
        // White garlic bulbs piled in woven basket (กระเทียม & หอมแดง)
        [[-0.12, 0.02], [0.06, -0.04], [0.14, 0.08], [-0.02, 0.1]].forEach(([gx, gz], gi) => {
          const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.085, 8, 8),
            new THREE.MeshStandardMaterial({ color: gi === 3 ? '#be185d' : '#f8fafc', roughness: 0.6 })
          );
          bulb.position.set(hx + gx, 1.01, -1.08 + gz);
          this.scene.add(bulb);
        });
      } else {
        // Tangled spiky Jujube thorn branches (กิ่งหนามพุทรา) sticking cleanly out of basket!
        for (let b = -2; b <= 2; b++) {
          const branch = this.addBox(this.scene, 0.52, 0.035, 0.035, '#713f12', hx + b * 0.05, 1.03 + Math.abs(b % 2) * 0.04, -1.08, 0.9);
          branch.rotation.z = b * 0.26;
          branch.rotation.y = b * 0.35;
        }
      }
    });
  }

  private buildStiltHouseAndUnderneath(): void {
    // Grand Detailed 12.6m Thai-Isaan Teak Stilt House (บ้านเรือนไทยอีสานหลังใหญ่ของหนุ่ม x = -6.2 .. +6.2)
    [-5.4, -1.8, 1.8, 5.4].forEach((sx) => {
      // Concrete foundation footings + thick dark-teak house stilts!
      this.addBox(this.scene, 0.52, 0.22, 0.52, '#94a3b8', sx, 0.11, -1.15);
      this.addBox(this.scene, 0.52, 0.22, 0.52, '#94a3b8', sx, 0.11, -3.45);
      this.addBox(this.scene, 0.36, 4.4, 0.36, '#3b2416', sx, 2.2, -1.15);
      this.addBox(this.scene, 0.36, 4.4, 0.36, '#3b2416', sx, 2.2, -3.45);
    });

    // Ground Underneath Living Space: Large Bamboo Bed + Hammock + Dragon Jars + Flower Bush!
    this.addBox(this.scene, 3.0, 0.14, 1.5, '#8c6239', -2.2, 0.56, -2.05); // spacious bamboo bed (แคร่ใหญ่)
    [-3.4, -2.2, -1.0].forEach((lx) => this.addBox(this.scene, 0.12, 0.55, 1.35, '#5c3c20', lx, 0.28, -2.05));
    // Woven Pha Khao Ma hammock slung between stilts (เปลญวนใต้ถุน!)
    this.addBox(this.scene, 2.4, 0.1, 0.72, '#dc2626', 1.8, 0.88, -2.15).rotation.z = 0.08;
    // Sticky-rice kratib, somtam clay mortar + woven tray & warm tungsten under-stilt lamp on main house bamboo daybed!
    this.addBox(this.scene, 0.38, 0.1, 0.38, '#dc2626', -3.15, 0.68, -2.05); // woven reed mat & khit pillow
    const mainKratib = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.12, 0.2, 10),
      new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.78 })
    );
    mainKratib.position.set(-1.9, 0.72, -1.95);
    const underMainBulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
    underMainBulb.position.set(-0.6, 1.92, -1.35);
    const underMainLight = new THREE.PointLight('#ffbe6b', 3.6, 12, 1.05);
    underMainLight.position.set(-0.6, 1.8, 0.95);
    this.scene.add(mainKratib, underMainBulb, underMainLight);
    // Twin Thai Dragon Water Jars + Blooming Pink Bougainvillea Pot beside front steps
    [3.65, 4.45].forEach((jx) => {
      const tJar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.28, 0.84, 14),
        new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.55 })
      );
      tJar.position.set(jx, 0.42, -1.75);
      this.scene.add(tJar);
    });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.38, 10), new THREE.MeshStandardMaterial({ color: '#9a3412' }));
    pot.position.set(-5.6, 0.19, -0.65);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshStandardMaterial({ color: '#15803d' }));
    bush.position.set(-5.6, 0.58, -0.65);
    const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.24, 7, 7), new THREE.MeshStandardMaterial({ color: '#ec4899' }));
    blossom.position.set(-5.5, 0.82, -0.52);
    this.scene.add(pot, bush, blossom);

    // Wide Raised Teak Deck + Carved Front Balcony Balusters + Grand 2-Tier Roof + Front Gable Portico!
    this.addBox(this.scene, 12.6, 0.26, 3.4, '#4f311c', 0, 2.1, -2.28); // wide veranda floor
    this.addBox(this.scene, 11.4, 2.65, 2.6, '#3e2514', 0, 3.52, -2.45); // tall upper teak house walls
    // 2-tier main Thai gable roof + center decorative front porch gable (มุขหน้าจั่วเรือนไทย!)
    this.addThaiGableRoof(this.scene, 0, 4.82, -2.45, 11.8, 3.1, 1.85, '#4c2618', '#eab308', '#2b180d');
    this.addThaiGableRoof(this.scene, 0, 5.55, -2.45, 7.2, 2.2, 1.15, '#7c2d12', '#facc15', '#3b2416');
    this.addBox(this.scene, 3.2, 0.14, 1.1, '#593722', 0, 4.72, -1.0); // front entrance portico eave

    // Carved Front Balcony Railing + Vertical Balusters (ระเบียงลูกกรงไม้สัก)
    this.addBox(this.scene, 12.2, 0.1, 0.12, '#78350f', 0, 2.88, -0.68);
    this.addBox(this.scene, 12.2, 0.1, 0.12, '#593722', 0, 2.32, -0.68);
    for (let bx = -5.8; bx <= 5.8; bx += 0.58) {
      this.addBox(this.scene, 0.08, 0.56, 0.08, '#854d0e', bx, 2.6, -0.68);
    }

    // Center Carved Teak Entrance Door + 2 Glowing Thai Windows + Hanging Balcony Lanterns!
    const hDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 2.0),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('เรือนหนุ่ม') })
    );
    hDoor.position.set(0, 3.35, -1.14);
    this.scene.add(hDoor);
    const winTex = createThaiWindowTexture(true);
    [-3.4, 3.2].forEach((wx) => {
      const w = new THREE.Mesh(
        new THREE.PlaneGeometry(1.75, 1.35),
        new THREE.MeshStandardMaterial({ map: winTex, emissive: '#3d2508', emissiveIntensity: 0.7 })
      );
      w.position.set(wx, 3.55, -1.14);
      this.scene.add(w);
    });
    [-4.8, 4.8].forEach((lx) => {
      const lOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
      lOrb.position.set(lx, 4.45, -0.78);
      this.scene.add(lOrb);
    });

    for (let ti = 0; ti < 5; ti++) {
      const thorn = this.addBox(this.placedThornsMesh, 0.95, 0.08, 0.08, '#713f12', 3.2, 3.1 + (ti % 2) * 0.15, -0.98);
      thorn.rotation.z = (ti - 2) * 0.28;
    }
    this.placedThornsMesh.visible = false;
    this.scene.add(this.placedThornsMesh);

    // Grand Wide Wooden Staircase at right edge (+5.8) with handrails!
    for (let s = 0; s < 6; s++) {
      this.addBox(this.scene, 0.36, 0.12, 1.15, '#593722', 5.5 + (5 - s) * 0.28, 0.32 + s * 0.35, -0.62);
    }
    this.addBox(this.scene, 1.9, 0.08, 0.08, '#78350f', 6.1, 1.55, -0.08).rotation.z = -0.68;

    const houseLight = new THREE.PointLight('#ffbe6b', 5.6, 18, 1.0);
    houseLight.position.set(0, 3.2, 1.9);
    this.scene.add(houseLight);

    // Classic Bicycle parked left of Grand Stilt House (-6.5) & E-taen cart at +7.8
    this.parkedBikeGroup.position.set(-6.5, 0, -0.35);
    this.exteriorGroup.add(this.parkedBikeGroup);
    this.addBox(this.scene, 1.9, 0.65, 0.95, '#1e3a5f', 8.0, 0.6, -1.65);
    [7.3, 8.7].forEach((wx) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 14), new THREE.MeshStandardMaterial({ color: '#111827' }));
      w.position.set(wx, 0.26, -1.18);
      this.scene.add(w);
    });
  }

  private buildLargeTempleAndCemetery(): void {
    // 0) Clean Stone & Sand Temple Courtyard Flooring (ลานวัดป่า x = 26.5 .. 61.5)
    this.addBox(this.scene, 35.0, 0.06, 6.2, '#78716c', 44.0, 0.03, 0.2, 0.92);

    // 1) Temple Entrance Naga Mondop Gate Archway (ซุ้มประตูโขงยอดมณฑปวัดป่า at x = +26.5)
    [-2.2, 2.65].forEach((gz) => {
      this.addBox(this.scene, 0.85, 0.45, 0.85, '#d6d3d1', 26.5, 0.22, gz); // column lotus base
      this.addBox(this.scene, 0.65, 4.4, 0.65, '#f5f5f4', 26.5, 2.35, gz);
      this.addBox(this.scene, 0.82, 0.25, 0.82, '#eab308', 26.5, 4.48, gz);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
      lamp.position.set(26.15, 2.9, gz);
      this.scene.add(lamp);
    });
    // Overhead carved Thai archway beam + 3-tier golden Mondop roof spire
    this.addBox(this.scene, 1.05, 0.78, 5.7, '#991b1b', 26.5, 4.82, 0.22);
    this.addBox(this.scene, 1.15, 0.2, 5.8, '#eab308', 26.5, 5.25, 0.22);
    const gateRoofMid = this.addBox(this.scene, 0.85, 0.55, 3.8, '#7f1d1d', 26.5, 5.55, 0.22);
    gateRoofMid.castShadow = true;
    const gateSpire = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.35, 8),
      new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.72, roughness: 0.25 })
    );
    gateSpire.position.set(26.5, 6.45, 0.22);
    this.scene.add(gateSpire);

    const gateTex = paintSignTex('#450a0a', '#eab308', '#fef08a', 'วัดป่าบ้านทุ่ง', 'เขตอภัยทาน');
    const gateSignWest = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.78), new THREE.MeshStandardMaterial({ map: gateTex }));
    gateSignWest.rotation.y = -Math.PI / 2;
    gateSignWest.position.set(25.92, 4.84, 0.22);
    this.scene.add(gateSignWest);
    const gateSignFront = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.62), new THREE.MeshStandardMaterial({ map: gateTex }));
    gateSignFront.position.set(26.5, 3.85, 2.99);
    this.scene.add(gateSignFront);
    const gateLight = new THREE.PointLight('#ffcf78', 5.2, 16, 1.1);
    gateLight.position.set(26.5, 4.1, 1.85);
    this.scene.add(gateLight);

    // Authentic Thai Temple Boundary Wall (กำแพงแก้ววัดไทย: ฐานบัว + เสาหัวเม็ดทรงมัณฑ์ + สันหลังคาแดงทอง + ช่องซุ้มลายไทย!)
    // Rear perimeter temple wall (z = -3.95)
    this.addBox(this.scene, 35.0, 0.32, 0.42, '#d6d3d1', 44.0, 0.16, -3.95); // stucco base plinth
    this.addBox(this.scene, 35.0, 1.55, 0.28, '#f5f0e6', 44.0, 1.05, -3.95); // whitewashed wall
    this.addBox(this.scene, 35.0, 0.24, 0.42, '#7f1d1d', 44.0, 1.92, -3.95); // red tile wall coping
    this.addBox(this.scene, 35.0, 0.1, 0.32, '#eab308', 44.0, 2.08, -3.95); // gold ridge trim
    for (let wx = 29.0; wx <= 60.0; wx += 3.5) {
      // Rear tall lotus-capped pilasters + recessed arched mural panels
      this.addBox(this.scene, 0.42, 2.2, 0.44, '#e7e5e4', wx, 1.1, -3.95);
      const lotusRear = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.42, 8),
        new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.6, roughness: 0.3 })
      );
      lotusRear.position.set(wx, 2.42, -3.95);
      this.scene.add(lotusRear);
      if (wx + 1.75 < 60.5) {
        this.addBox(this.scene, 2.4, 0.95, 0.06, '#991b1b', wx + 1.75, 1.12, -3.79); // recessed red/gold border panel
      }
    }
    // Front Kamphaeng Kaew Low Balustrade Wall (กำแพงแก้วด้านหน้า z = 2.25 — เคลียร์ถนนรถวิ่งด้านหน้า!)
    this.addBox(this.scene, 34.4, 0.24, 0.32, '#d6d3d1', 44.0, 0.12, 2.25);
    this.addBox(this.scene, 34.4, 0.26, 0.24, '#f5f0e6', 44.0, 0.36, 2.25);
    this.addBox(this.scene, 34.4, 0.14, 0.3, '#991b1b', 44.0, 0.56, 2.25);
    [29.5, 33.0, 36.5, 40.0, 43.5, 47.0, 50.5, 54.0, 57.5].forEach((wx) => {
      this.addBox(this.scene, 0.36, 0.88, 0.36, '#f5f0e6', wx, 0.44, 2.25);
      this.addBox(this.scene, 0.42, 0.12, 0.42, '#eab308', wx, 0.9, 2.25);
      const lotusFront = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.32, 8),
        new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.6, roughness: 0.3 })
      );
      lotusFront.position.set(wx, 1.12, 2.25);
      this.scene.add(lotusFront);
    });

    // Golden Thai Sri Lanka Bell Chedi (พระเจดีย์สีทองทรงระฆังข้างอุโบสถ at x = +34.4, z = -2.65)
    this.addBox(this.scene, 2.4, 0.45, 2.4, '#e7e5e4', 34.4, 0.22, -2.65);
    this.addBox(this.scene, 1.8, 0.45, 1.8, '#f5f0e6', 34.4, 0.68, -2.65);
    const chediBell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.85, 1.35, 16),
      new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.72, roughness: 0.28 })
    );
    chediBell.position.set(34.4, 1.55, -2.65);
    this.scene.add(chediBell);
    const chediSpire = new THREE.Mesh(
      new THREE.ConeGeometry(0.44, 1.75, 12),
      new THREE.MeshStandardMaterial({ color: '#fde047', metalness: 0.78, roughness: 0.2 })
    );
    chediSpire.position.set(34.4, 3.05, -2.65);
    this.scene.add(chediSpire);

    // Festive Isaan Tung Flags (ธงตุงอีสาน) flanking temple plaza
    [28.6, 46.2, 49.4].forEach((tx, ti) => {
      this.addBox(this.scene, 0.08, 4.5, 0.08, '#78350f', tx, 2.25, -2.55);
      this.addBox(this.scene, 0.34, 2.5, 0.04, ti % 2 === 0 ? '#eab308' : '#f8fafc', tx + 0.2, 3.1, -2.55);
    });

    // 2) Grand Authentic Thai Ubosot (พระอุโบสถทรงไทย + ช่อฟ้าสีทอง + ใบเสมา + บันไดพญานาค at x = +40.5)
    this.addBox(this.scene, 11.4, 0.68, 3.4, '#e7e5e4', 40.5, 0.34, -2.4);
    this.addBox(this.scene, 10.2, 3.7, 2.8, '#f5f0e6', 40.5, 2.5, -2.45);
    const ubosotFront = new THREE.Mesh(
      new THREE.PlaneGeometry(10.2, 3.7),
      new THREE.MeshStandardMaterial({ map: paintUbosotExteriorTex(), roughness: 0.7 })
    );
    ubosotFront.position.set(40.5, 2.5, -1.03);
    this.scene.add(ubosotFront);
    [-4.2, -1.6, 1.6, 4.2].forEach((dx) => {
      this.addBox(this.scene, 0.38, 3.75, 0.38, '#991b1b', 40.5 + dx, 2.52, -0.92);
      this.addBox(this.scene, 0.46, 0.22, 0.46, '#eab308', 40.5 + dx, 4.25, -0.92); // gold lotus capitals
    });
    // Symmetrical 2-tier Thai Gable Roof + Swept Golden Chofah (ช่อฟ้าปลายงอนสีทอง!)
    this.addThaiGableRoof(this.scene, 40.5, 4.35, -2.35, 11.0, 3.6, 1.55, '#7f1d1d', '#ca8a04', '#eab308');
    this.addThaiGableRoof(this.scene, 40.5, 5.25, -2.35, 8.2, 2.3, 1.25, '#991b1b', '#eab308', '#fef08a');
    [-5.3, 5.3].forEach((cx) => {
      const chofah = this.addBox(this.scene, 0.14, 0.95, 0.14, '#fde047', 40.5 + cx, 6.2, -2.35, 0.3);
      chofah.rotation.z = cx > 0 ? -0.35 : 0.35;
    });
    // Sacred Sema Boundary Stones (ใบเสมาหินแกะสลักรอบอุโบสถ)
    [35.2, 45.8].forEach((sx) => {
      this.addBox(this.scene, 0.75, 0.65, 0.75, '#e7e5e4', sx, 0.32, -0.75);
      this.addBox(this.scene, 0.45, 0.75, 0.14, '#cbd5e1', sx, 0.98, -0.75);
      this.addBox(this.scene, 0.25, 0.28, 0.16, '#eab308', sx, 1.42, -0.75);
    });
    // Emerald-Gold Twin Naga Staircase + Carved Gilded Entry Doors
    this.addBox(this.scene, 2.8, 0.24, 0.9, '#e7e5e4', 40.5, 0.12, -0.45);
    this.addBox(this.scene, 2.4, 0.24, 0.6, '#f5f0e6', 40.5, 0.36, -0.65);
    [-1.25, 1.25].forEach((nx) => {
      this.addBox(this.scene, 0.2, 0.58, 0.95, '#15803d', 40.5 + nx, 0.4, -0.45); // emerald Naga body
      this.addBox(this.scene, 0.3, 0.52, 0.22, '#eab308', 40.5 + nx, 0.8, 0.0); // golden Naga fanned head crest!
    });
    const salaDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 2.45),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('อุโบสถ') })
    );
    salaDoor.position.set(40.5, 1.9, -1.0);
    this.scene.add(salaDoor);
    const salaLight = new THREE.PointLight('#ffd278', 8.2, 20, 1.0);
    salaLight.position.set(40.5, 3.8, 1.85);
    this.scene.add(salaLight);

    // Temple Timber Bell Tower (หอระฆังไม้สัก at x = +47.8, z = -2.55)
    [47.2, 48.4].forEach((bx) => {
      this.addBox(this.scene, 0.16, 4.6, 0.16, '#4f311c', bx, 2.3, -2.15);
      this.addBox(this.scene, 0.16, 4.6, 0.16, '#4f311c', bx, 2.3, -2.95);
    });
    this.addBox(this.scene, 1.6, 0.14, 1.2, '#593722', 47.8, 3.0, -2.55);
    this.addThaiGableRoof(this.scene, 47.8, 4.55, -2.55, 1.8, 1.4, 0.9, '#7f1d1d', '#ca8a04');
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.26, 0.48, 12),
      new THREE.MeshStandardMaterial({ color: '#ca8a04', metalness: 0.75, roughness: 0.25 })
    );
    bell.position.set(47.8, 3.85, -2.55);
    this.scene.add(bell);

    // 3) Senior Monk's Wooden Kuti (กุฏิหลวงพี่ at x = +54.5, cleanly back at z = -2.35!)
    this.addBox(this.scene, 6.2, 0.45, 2.5, '#3f2c1d', 54.5, 0.88, -2.35);
    this.addBox(this.scene, 5.4, 2.5, 2.2, '#573a24', 54.5, 2.35, -2.45);
    [-2.4, 0, 2.4].forEach((kx) => this.addBox(this.scene, 0.24, 0.9, 0.24, '#332215', 54.5 + kx, 0.45, -1.25));
    // Symmetrical Kuti Gable Roof + Side Entry Steps (player never clips platform!)
    this.addThaiGableRoof(this.scene, 54.5, 3.6, -2.45, 5.8, 2.6, 1.45, '#452214', '#78350f', '#382012');
    for (let ks = 0; ks < 4; ks++) {
      this.addBox(this.scene, 0.95, 0.22, 0.24, '#593722', 54.5, 0.11 + ks * 0.22, -0.45 - ks * 0.22);
    }
    const kDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 2.2),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('กุฏิ') })
    );
    kDoor.position.set(54.5, 2.2, -1.32);
    this.scene.add(kDoor);
    const kutiLight = new THREE.PointLight('#ffbe6b', 5.2, 12, 1.1);
    kutiLight.position.set(54.5, 2.9, 0.3);
    this.scene.add(kutiLight);

    // Cemetery Archway Exit Gate past Clinic (+103.5) & Bone Urn #4 at +120.5!
    [-2.2, 2.65].forEach((gz) => {
      this.addBox(this.scene, 0.55, 3.8, 0.55, '#94a3b8', 103.5, 1.9, gz);
    });
    this.addBox(this.scene, 0.68, 0.5, 5.4, '#475569', 103.5, 3.85, 0.22);

    // 4) Thai Bone-Urn Cemetery (สุสานไทย & โกศบรรจุอัฐิ at +107 .. +125, Urn #4 at +120.5!)
    const cSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.75),
      new THREE.MeshStandardMaterial({ map: paintSignTex('#1e293b', '#94a3b8', '#f1f5f9', 'เขตป่าช้า โกศอัฐิ') })
    );
    cSign.position.set(105.8, 2.1, -1.2);
    this.scene.add(cSign);

    [110.0, 113.5, 117.0, 120.5, 124.0].forEach((ux, idx) => {
      const hScale = idx === 3 ? 1.35 : 0.95 + (idx % 2) * 0.2;
      const tone = idx === 3 ? '#9ca3af' : '#d6d3d1';
      this.addBox(this.scene, 1.3 * hScale, 0.45, 1.3 * hScale, '#64748b', ux, 0.22, -1.65);
      this.addBox(this.scene, 0.95 * hScale, 1.15 * hScale, 0.95 * hScale, tone, ux, 0.95 * hScale, -1.65);
      const bellUrn = new THREE.Mesh(
        new THREE.ConeGeometry(0.55 * hScale, 1.2 * hScale, 8),
        new THREE.MeshStandardMaterial({ color: tone, roughness: 0.7 })
      );
      bellUrn.position.set(ux, 2.0 * hScale, -1.65);
      this.scene.add(bellUrn);
      const finial = new THREE.Mesh(
        new THREE.ConeGeometry(0.14 * hScale, 0.55 * hScale, 8),
        new THREE.MeshStandardMaterial({ color: '#ca8a04', metalness: 0.6 })
      );
      finial.position.set(ux, 2.75 * hScale, -1.65);
      this.scene.add(finial);
      this.addBox(this.scene, 0.42, 0.52, 0.08, '#1e293b', ux, 0.85, -1.14);
    });
    const cemLight = new THREE.PointLight('#84cc16', 2.8, 16, 1.3);
    cemLight.position.set(120.5, 2.4, 0.4);
    this.scene.add(cemLight);
  }

  private buildSaiSinCircle(): void {
    // Authentic Thai Sacred Sai Sin White Thread Circle centered on temple courtyard (x = 31.8, z = 0.65)
    // Encloses walkable zone x = 29.0 .. 34.6!
    const cx = 31.8;
    const cz = 0.65;
    const rx = 2.85;
    const rz = 1.65;
    const count = 8;
    const ptsLow: THREE.Vector3[] = [];
    const ptsHigh: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const sx = cx + Math.cos(ang) * rx;
      const sz = cz + Math.sin(ang) * rz;
      // Bamboo stake wrapped in white sacred cloth band
      this.addBox(this.saiSinGroup, 0.09, 1.65, 0.09, '#a16207', sx, 0.82, sz);
      this.addBox(this.saiSinGroup, 0.13, 0.22, 0.13, '#f8fafc', sx, 1.48, sz);
      // Small white talisman pennant
      this.addBox(this.saiSinGroup, 0.18, 0.24, 0.02, '#f8fafc', sx + 0.1, 1.52, sz);
      ptsLow.push(new THREE.Vector3(sx, 0.92, sz));
      ptsHigh.push(new THREE.Vector3(sx, 1.48, sz));
    }

    // Continuous white Sai Sin loops at two heights
    this.saiSinGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ptsLow), this.saiSinThreadMat));
    this.saiSinGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ptsHigh), this.saiSinThreadMat));

    // Sacred Overhead Web + Anchor Thread leading up to the Temple Ubosot eaves (โยงจากหลังคาอุโบสถมาคล้องวง!)
    const apex = new THREE.Vector3(cx, 2.75, cz);
    ptsHigh.forEach((p) => {
      this.saiSinGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, apex]), this.saiSinThreadMat));
    });
    const templeRoofAnchor = new THREE.Vector3(36.0, 4.35, -1.6);
    this.saiSinGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([apex, templeRoofAnchor]), this.saiSinThreadMat));

    // Glowing protective ring on ground
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.85, 36), this.saiSinGlowMat);
    ring.rotation.x = -Math.PI / 2;
    ring.scale.set(1.0, rz / rx, 1.0);
    ring.position.set(cx, 0.07, cz);
    this.saiSinGroup.add(ring);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.58),
      new THREE.MeshStandardMaterial({ map: paintSignTex('#1e293b', '#f8fafc', '#fef08a', 'เขตวงสายสิญจน์', 'ผีเข้าไม่ได้ • ปลอดภัย') })
    );
    sign.position.set(cx, 2.35, cz - 1.4);
    this.saiSinGroup.add(sign);

    this.saiSinLight.position.set(cx, 2.2, cz);
    this.saiSinGroup.add(this.saiSinLight);
    this.saiSinGroup.visible = false;
    this.scene.add(this.saiSinGroup);
  }

  private buildInteriors(): void {
    const wallTex = createThaiWallTexture(false);
    const tileTex = createThaiTileFloorTexture();

    const makeRoom = (room: Ch2RoomId, lightCol: string, intensity: number, width = 12.6): THREE.Group => {
      const g = new THREE.Group();
      g.visible = false;
      this.scene.add(g);
      this.roomGroups[room] = g;

      const floorColor = room === 'stilt_house' ? '#6b472b' : room === 'temple_sala' ? '#d6d3d1' : '#cbd5e1';
      const wallColor = room === 'stilt_house' ? '#8c623d' : room === 'temple_sala' ? '#f5f5f4' : '#e2e8f0';

      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.28, 4.8),
        new THREE.MeshStandardMaterial({ map: tileTex, color: floorColor, roughness: 0.7 })
      );
      floor.position.set(0, -0.14, 0.45);
      g.add(floor);
      this.addBox(g, width + 0.2, 0.24, 5.0, '#2b2016', 0, 4.18, 0.45);

      const bw = new THREE.Mesh(
        new THREE.PlaneGeometry(width + 0.2, 4.4),
        new THREE.MeshStandardMaterial({ map: wallTex, color: wallColor, roughness: 0.88 })
      );
      bw.position.set(0, 2.08, -1.5);
      g.add(bw);
      const sideX = width / 2;
      this.addBox(g, 0.45, 4.4, 5.0, '#2d2219', -sideX, 2.08, 0.45);
      this.addBox(g, 0.45, 4.4, 5.0, '#2d2219', sideX, 2.08, 0.45);

      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(1.42, 2.52),
        new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ออก'), roughness: 0.78 })
      );
      door.position.set(-sideX + 1.5, 1.26, -1.42);
      g.add(door);

      const cone = new THREE.Mesh(
        new THREE.PlaneGeometry(3.8, 3.8),
        new THREE.MeshBasicMaterial({
          map: createLightConeTexture('255, 224, 175'),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.24,
        })
      );
      cone.position.set(0, 2.0, -0.2);
      g.add(cone);

      const l = new THREE.PointLight(lightCol, intensity, 16, 1.15);
      l.position.set(0, 3.5, 1.85);
      g.add(l);
      this.roomLights.push({ room, light: l, baseIntensity: intensity });
      return g;
    };

    // 1) Grand Detailed Stilt House Interior ('stilt_house', 16.4m wide!)
    const house = makeRoom('stilt_house', '#ffcf88', 3.4, 16.4);
    // Warm wooden ceiling beam, wall wainscot & Thai vintage wall calendar
    this.addBox(house, 16.2, 0.14, 0.18, '#593722', 0, 3.3, -1.42);
    this.addBox(house, 16.2, 0.85, 0.06, '#4f311c', 0, 0.42, -1.44);
    // Teak Kitchen Cupboard (moved cleanly right of Exit Door -6.7!) + Vintage CRT TV on stand + Standing Fan
    this.addBox(house, 1.0, 1.85, 0.55, '#6b4226', -5.3, 0.92, -1.15);
    this.addBox(house, 0.84, 1.2, 0.04, '#cbd5e1', -5.3, 1.15, -0.86); // wire-mesh cupboard doors
    this.addBox(house, 1.15, 0.65, 0.55, '#4f311c', -4.05, 0.32, -1.15); // TV table
    this.addBox(house, 0.72, 0.58, 0.45, '#1e293b', -4.05, 0.94, -1.15); // retro CRT TV
    this.addBox(house, 0.48, 0.4, 0.04, '#38bdf8', -4.05, 0.96, -0.92); // glowing TV screen
    // Home Buddha Altar Shelf & Family Portrait Frame of Grandma Boonma (x = -2.8)
    this.addBox(house, 0.95, 0.1, 0.45, '#78350f', -2.8, 2.35, -1.25);
    this.addBox(house, 0.24, 0.38, 0.2, '#eab308', -2.8, 2.58, -1.25); // golden home Buddha
    this.addBox(house, 0.65, 0.78, 0.06, '#92400e', -1.85, 2.15, -1.42); // framed family portrait!
    this.addBox(house, 0.5, 0.62, 0.04, '#fef3c7', -1.85, 2.15, -1.39);
    // Large woven floor mat + Khantoke dinner tray + Kratib + Bai Sri tray
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 2.0),
      new THREE.MeshStandardMaterial({ map: createRugTexture('#7c2d12', '#eab308') })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-0.5, 0.02, -0.2);
    house.add(rug);
    const khantoke = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 0.22, 12), new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.7 }));
    khantoke.position.set(-0.6, 0.11, -0.28);
    house.add(khantoke);
    const kratib = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.14, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.75 })
    );
    kratib.position.set(-0.48, 0.32, -0.28);
    house.add(kratib);
    const hWin = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.45),
      new THREE.MeshStandardMaterial({ map: createThaiWindowTexture(false) })
    );
    hWin.position.set(2.4, 2.05, -1.44);
    house.add(hWin);
    // Sleeping area with wooden bed, Thai Khit pillows, and sheer white mosquito-net canopy (มุ้งนอน x = 4.8)
    this.addBox(house, 2.2, 0.18, 1.35, '#1e3a5f', 4.8, 0.09, -0.78);
    this.addBox(house, 0.55, 0.16, 0.78, '#dc2626', 5.45, 0.24, -0.78); // red Khit pillow!
    [3.85, 5.75].forEach((px) => this.addBox(house, 0.06, 2.0, 0.06, '#78350f', px, 1.0, -1.35));
    const netCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 1.45, 1.2),
      new THREE.MeshBasicMaterial({ color: '#f8fafc', transparent: true, opacity: 0.16 })
    );
    netCanopy.position.set(4.8, 1.28, -0.82);
    house.add(netCanopy);
    const momSprite = this.makeChar(this.charFrames.mom[0], 1.48, 2.2);
    momSprite.position.set(-2.0, 0.94, -0.8);
    const sisSprite = this.makeChar(this.charFrames.sister[0], 1.4, 2.05);
    sisSprite.position.set(0.9, 0.9, -0.8);
    house.add(momSprite, sisSprite);

    // Sacred Phan Bai Sri banana-leaf blessing tray (พานบายศรีสู่ขวัญ) for celebratory finale!
    const baiSriMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.65 });
    const brassTray = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.14, 12), new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.6 }));
    brassTray.position.set(0, 0.07, 0);
    const coneLower = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 8), baiSriMat);
    coneLower.position.set(0, 0.36, 0);
    const topFlower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    topFlower.position.set(0, 0.62, 0);
    this.baiSriGroup.add(brassTray, coneLower, topFlower);
    this.baiSriGroup.position.set(-0.4, 0.02, 0.1);
    this.baiSriGroup.visible = false;
    house.add(this.baiSriGroup);

    // 2) Grand Temple Hall / Ubosot Interior ('temple_sala') — Rich Golden Thai Sanctuary!
    const sala = makeRoom('temple_sala', '#ffdf9a', 4.2, 14.2);
    // Replace generic dorm concrete wall inside Ubosot with ornate Thai Temple Mural Wall!
    const muralWall = new THREE.Mesh(
      new THREE.PlaneGeometry(14.3, 4.35),
      new THREE.MeshStandardMaterial({ map: paintTempleWallMuralTex(), roughness: 0.8 })
    );
    muralWall.position.set(0, 2.08, -1.46);
    sala.add(muralWall);
    // Warm golden sanctuary lights across both altar and scripture hall
    const altarSpot = new THREE.PointLight('#fde047', 4.5, 10, 1.0);
    altarSpot.position.set(2.8, 3.3, 0.2);
    sala.add(altarSpot);

    [-4.2, -1.4, 1.4, 4.2].forEach((cx) => {
      this.addBox(sala, 0.34, 4.15, 0.34, '#991b1b', cx, 2.08, -1.22);
      this.addBox(sala, 0.46, 0.26, 0.46, '#eab308', cx, 3.92, -1.22);
      this.addBox(sala, 0.44, 0.22, 0.44, '#eab308', cx, 0.11, -1.22);
    });
    // Authentic Lacquered Black & Gold Leaf Palm-Leaf Scripture Cabinet (ตู้พระธรรมลายรดน้ำ at x = -1.6)
    this.addBox(sala, 1.4, 2.15, 0.72, '#1c120d', -1.6, 1.08, -1.05);
    const cabinetFront = new THREE.Mesh(
      new THREE.PlaneGeometry(1.36, 2.08),
      new THREE.MeshStandardMaterial({ map: paintLaiRodNamCabinetTex(), roughness: 0.45 })
    );
    cabinetFront.position.set(-1.6, 1.08, -0.68);
    sala.add(cabinetFront);

    // Raised Red-Gold Altar Table (โต๊ะหมู่บูชา) + Seated Golden Phra Prathan Buddha with Glowing Arch!
    this.addBox(sala, 3.3, 0.5, 1.35, '#7f1d1d', 2.8, 0.25, -0.95);
    this.addBox(sala, 2.5, 0.38, 1.05, '#ca8a04', 2.8, 0.68, -0.95);
    const buddhaTex = paintBuddhaAltarSpriteTex();
    const buddhaSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(2.65, 2.65),
      new THREE.MeshBasicMaterial({ map: buddhaTex, transparent: true })
    );
    buddhaSprite.position.set(2.8, 2.15, -0.96);
    sala.add(buddhaSprite);
    // Golden Lotus Vases, Brass Candlesticks & Glowing Incense Bowl on Altar
    [-0.95, 0.95].forEach((ox) => {
      this.addBox(sala, 0.16, 0.36, 0.16, '#eab308', 2.8 + ox, 1.05, -0.6); // brass vase
      this.addBox(sala, 0.22, 0.16, 0.22, '#f43f5e', 2.8 + ox, 1.28, -0.6); // pink lotus buds
      const candleFlame = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
      candleFlame.position.set(2.8 + ox * 0.55, 1.15, -0.52);
      sala.add(candleFlame);
    });
    this.addBox(sala, 0.34, 0.22, 0.34, '#d97706', 2.8, 0.98, -0.52); // brass incense pot

    // Crimson & Gold Prayer Rug
    const prayerMat = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.55),
      new THREE.MeshStandardMaterial({ map: createRugTexture('#7f1d1d', '#eab308') })
    );
    prayerMat.rotation.x = -Math.PI / 2;
    prayerMat.position.set(0.5, 0.02, 0.15);
    sala.add(prayerMat);

    // 3) Senior Monk's Kuti Interior ('kuti') — also gets matching Buddha Shrine!
    const kuti = makeRoom('kuti', '#ffd899', 2.4, 12.6);
    this.addBox(kuti, 1.4, 0.9, 0.85, '#593722', -1.8, 0.45, -1.05);
    const kutiBuddha = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({ map: buddhaTex, transparent: true })
    );
    kutiBuddha.position.set(-1.8, 1.48, -1.05);
    kuti.add(kutiBuddha);
    this.addBox(kuti, 1.8, 0.08, 1.2, '#78350f', 1.8, 0.04, -0.5);
    const monkSprite = this.makeChar(this.charFrames.monk[0], 1.5, 2.24);
    monkSprite.position.set(1.8, 0.96, -0.85);
    kuti.add(monkSprite);
  }

  public getTimePeriod(gameMinutes: number): TimePeriod {
    const h = gameMinutes / 60;
    if (h >= 5.5 && h < 7.5) return 'dawn';
    if (h >= 7.5 && h < 11.5) return 'morning';
    if (h >= 11.5 && h < 15.5) return 'noon';
    if (h >= 15.5 && h < 18.5) return 'evening';
    return 'night';
  }

  public triggerSaiSinFlash(): void {
    this.saiSinFlash = 1.6;
  }

  public update(
    dt: number,
    playerX: number,
    playerZ: number,
    currentRoom: Ch2RoomId,
    playerFacing: 1 | -1,
    isMoving: boolean,
    flashlightOn: boolean,
    gameMinutes: number,
    weather: WeatherType,
    thornsPlaced: boolean,
    saiSinActive: boolean,
    hasBicycleItem: boolean,
    isRidingBike: boolean,
    showKrasue: boolean,
    krasueChasing: boolean,
    krasueX: number,
    mood: VillageMood = 'festive',
    showBaiSri = false
  ): void {
    this.animClock += dt;
    const isInside = currentRoom !== 'outside';
    this.baiSriGroup.visible = showBaiSri && currentRoom === 'stilt_house';

    this.exteriorGroup.visible = !isInside;
    (Object.keys(this.roomGroups) as Ch2RoomId[]).forEach((rid) => {
      const grp = this.roomGroups[rid];
      if (grp) grp.visible = rid === currentRoom;
    });
    this.rainLines.visible = !isInside;
    this.placedThornsMesh.visible = thornsPlaced && !isInside;

    // Sai Sin Circle visibility + villager refuge positioning!
    this.saiSinGroup.visible = saiSinActive && !isInside;
    if (this.saiSinFlash > 0) this.saiSinFlash = Math.max(0, this.saiSinFlash - dt * 2.5);
    if (saiSinActive) {
      const pulse = 0.25 + Math.sin(this.animClock * 3.5) * 0.06 + this.saiSinFlash * 0.45;
      this.saiSinGlowMat.opacity = Math.min(0.95, pulse);
      this.saiSinLight.intensity = 3.8 + this.saiSinFlash * 8.0;
      this.saiSinThreadMat.color.set(this.saiSinFlash > 0.15 ? '#fde047' : '#f8fafc');
      // Move market villagers safely inside the Sai Sin circle on temple plaza
      this.butcherMesh.position.set(30.6, 0.94, -0.15);
      this.fishVendorMesh.position.set(31.8, 0.94, -0.35);
      this.herbVendorMesh.position.set(33.0, 0.94, -0.15);
    } else {
      this.saiSinLight.intensity = 0;
      this.butcherMesh.position.set(-44.0, 1.02, -1.78);
      this.fishVendorMesh.position.set(-36.0, 1.02, -1.78);
      this.herbVendorMesh.position.set(-28.0, 1.02, -1.78);
    }

    const riding = isRidingBike && !isInside;
    const py = riding ? 1.13 : 0.94;
    this.parkedBikeGroup.visible = !hasBicycleItem && !isInside;
    this.ridingBikeGroup.visible = riding;
    // Center bicycle slightly behind near-side leg/arm plane so Noom cleanly straddles & holds handlebars!
    this.ridingBikeGroup.position.set(playerX, 0.02, playerZ - 0.04);
    this.ridingBikeGroup.scale.x = playerFacing;

    if (riding && isMoving) {
      this.bikeWheels.forEach((w) => {
        w.rotation.z -= 11.5 * dt;
      });
      this.bikeCrank.rotation.z -= 10.0 * dt;
    }

    this.playerMesh.position.set(playerX, py, playerZ);
    this.playerShadow.position.set(playerX, 0.024, playerZ);
    const walkFrame = isMoving ? Math.floor(this.animClock * (riding ? 10 : 9)) % 4 : 0;
    (this.playerMesh.material as THREE.MeshStandardMaterial).map = riding
      ? this.noomBikeFrames[walkFrame]
      : this.charFrames.noom[walkFrame];
    this.setMeshFacing(this.playerMesh, playerFacing);

    this.flashlight.position.set(playerX + playerFacing * 0.28, py + 0.25, playerZ + 0.25);
    this.flashlightTarget.position.set(playerX + playerFacing * 5.6, py - 0.1, playerZ - 0.55);
    this.flashlight.intensity = flashlightOn ? 12.5 : 0;

    this.swayingPlants.forEach((p, i) => {
      p.rotation.z = Math.sin(this.animClock * 1.9 + i) * 0.04;
    });

    // Living rural animations: buffalo with herder strolling, chickens pecking, casting net splashes, farming!
    const isDayOrEvening = gameMinutes / 60 >= 6.0 && gameMinutes / 60 < 19.8;
    this.buffaloHerderGroup.visible = isDayOrEvening && !saiSinActive;
    if (this.buffaloHerderGroup.visible) {
      this.buffaloWalkX += this.buffaloWalkDir * 1.15 * dt;
      if (this.buffaloWalkX > 15.8) this.buffaloWalkDir = -1;
      else if (this.buffaloWalkX < -21.5) this.buffaloWalkDir = 1;
      this.buffaloHerderGroup.position.x = this.buffaloWalkX;
      this.buffaloHerderGroup.scale.x = -this.buffaloWalkDir;
      this.buffaloHerderGroup.position.y = Math.abs(Math.sin(this.animClock * 4.2)) * 0.04;
    }
    this.chickens.forEach((c, idx) => {
      c.rotation.z = Math.sin(this.animClock * 7.5 + idx * 2.1) > 0.45 ? -0.35 : 0;
    });
    this.riceFarmers.forEach((f, idx) => {
      f.rotation.x = 0.28 + Math.sin(this.animClock * 2.0 + idx) * 0.16;
    });
    // 4-phase realistic net cast + sink + pull UP with wriggling fish caught inside!
    const castCycle = (this.animClock * 0.26) % 1;
    let netX = 22.1;
    let netY = 0.28;
    let netSpread = 1.0;
    let ropeSag = 0.28;
    let showCaughtFish = false;

    if (castCycle < 0.2) {
      // Throw outward in an arc
      const p = castCycle / 0.2;
      netX = THREE.MathUtils.lerp(21.1, 22.1, p);
      netY = 0.95 + Math.sin(p * Math.PI) * 0.7 - p * 0.68;
      netSpread = 0.4 + p * 0.65;
      ropeSag = 0.15;
    } else if (castCycle < 0.48) {
      // Sunk in pond water, concentric ripple expanding
      netX = 22.1;
      netY = 0.22;
      netSpread = 1.05;
      ropeSag = 0.26;
    } else if (castCycle < 0.88) {
      // Pulling haul rope UP out of the pond with wriggling fish caught inside!
      const p = (castCycle - 0.48) / 0.4;
      netX = THREE.MathUtils.lerp(22.1, 21.15, p);
      netY = THREE.MathUtils.lerp(0.24, 1.38, Math.sin(p * (Math.PI / 2)));
      netSpread = 0.95 - p * 0.42;
      ropeSag = 0.03; // taut rope while hauling!
      showCaughtFish = p > 0.15;
    } else {
      // Lowering catch onto pier & preparing next cast
      const p = (castCycle - 0.88) / 0.12;
      netX = THREE.MathUtils.lerp(21.15, 21.0, p);
      netY = THREE.MathUtils.lerp(1.38, 0.95, p);
      netSpread = 0.5;
      ropeSag = 0.08;
      showCaughtFish = true;
    }

    this.castNetMesh.position.set(netX, netY, -2.85);
    this.castNetMesh.scale.set(netSpread, 1, netSpread);
    this.caughtFishGroup.visible = showCaughtFish;
    if (showCaughtFish) {
      this.caughtFishGroup.position.set(netX, netY - 0.05, -2.85);
      this.caughtFishGroup.children.forEach((f, idx) => {
        f.rotation.z = Math.sin(this.animClock * 18 + idx * 1.9) * 0.42;
        f.rotation.y = Math.cos(this.animClock * 12 + idx) * 0.3;
      });
    }

    // Update dynamic hand-line rope connecting pier fisherman's hands to the top of the net!
    const ropeArr = (this.netRopeLine.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const hx = 20.88;
    const hy = 1.46;
    const hz = -2.52;
    const nx = netX;
    const ny = netY + 0.34;
    const nz = -2.85;
    ropeArr[0] = hx;
    ropeArr[1] = hy;
    ropeArr[2] = hz;
    ropeArr[3] = (hx + nx) * 0.5;
    ropeArr[4] = (hy + ny) * 0.5 - ropeSag;
    ropeArr[5] = (hz + nz) * 0.5;
    ropeArr[6] = nx;
    ropeArr[7] = ny;
    ropeArr[8] = nz;
    this.netRopeLine.geometry.attributes.position.needsUpdate = true;

    const inWaterPhase = castCycle >= 0.15 && castCycle < 0.55;
    this.netRippleMesh.visible = inWaterPhase;
    const ripScale = 0.55 + ((castCycle - 0.15) / 0.4) * 1.8;
    this.netRippleMesh.scale.set(ripScale, ripScale, 1);
    (this.netRippleMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 - ((castCycle - 0.15) / 0.4) * 0.6);

    this.krasueMesh.visible = showKrasue && !isInside;
    if (showKrasue && !isInside) {
      const kf = Math.floor(this.animClock * 6) % 2;
      (this.krasueMesh.material as THREE.MeshStandardMaterial).map = this.charFrames.krasue[kf];
      const hoverY = (krasueChasing ? 1.55 : 2.95) + Math.sin(this.animClock * 3.2) * 0.22;
      this.krasueMesh.position.set(krasueX, hoverY, krasueChasing ? 0.55 : -0.35);
      this.setMeshFacing(this.krasueMesh, playerX >= krasueX ? 1 : -1);
      this.krasueLight.position.set(krasueX, hoverY - 0.1, 0.55);
      this.krasueLight.intensity = 3.2 + Math.sin(this.animClock * 9) * 1.1;
      this.krasueLight.color.set(krasueChasing ? '#ef4444' : '#a3e635');
    } else {
      this.krasueLight.intensity = 0;
    }

    const h = gameMinutes / 60;
    const sky = new THREE.Color('#141c2c');
    let hemi = 0.65;
    let sun = 0.45;
    if (h >= 6.5 && h < 16.5) {
      sky.set(mood === 'lockdown' ? '#3d4c5c' : mood === 'uneasy' ? '#516c87' : '#5e82a3');
      hemi = mood === 'lockdown' ? 0.68 : 1.0;
      sun = mood === 'lockdown' ? 0.65 : 1.15;
    } else if (h >= 16.5 && h < 19.0) {
      sky.set(mood === 'lockdown' ? '#1f2436' : '#3b3248');
      hemi = mood === 'lockdown' ? 0.52 : 0.78;
      sun = mood === 'lockdown' ? 0.35 : 0.65;
    } else {
      sky.set(mood === 'lockdown' ? '#090e18' : '#121a2d');
      hemi = mood === 'lockdown' ? 0.42 : 0.62;
      sun = mood === 'lockdown' ? 0.25 : 0.42;
    }
    this.scene.background = sky;
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.copy(sky);
    fog.density = mood === 'lockdown' ? 0.023 : mood === 'uneasy' ? 0.018 : 0.014;
    this.hemiLight.intensity = hemi;
    this.sunMoonLight.intensity = sun;

    const isDay = h >= 7.0 && h < 17.5;
    const isNight = h >= 19.0 || h < 5.8;
    animateIsaanWorldLife(
      dt,
      this.animClock,
      gameMinutes,
      isDay,
      isNight,
      mood,
      this.rotHaeCtrl,
      this.songthaewCtrl,
      this.trafficVehicles,
      this.templeFairCtrl,
      this.ruralActorsCtrl
    );

    for (const vl of this.villageLights) {
      const moodDim = mood === 'lockdown' ? 0.55 : 1.0;
      vl.light.intensity = (isDay ? vl.base * 0.18 : vl.base) * moodDim;
    }
    for (const rl of this.roomLights) {
      rl.light.intensity = rl.room === currentRoom ? rl.baseIntensity : 0;
    }

    const rMat = this.rainLines.material as THREE.LineBasicMaterial;
    const raining = weather === 'rain' || weather === 'storm';
    rMat.opacity = THREE.MathUtils.lerp(rMat.opacity, raining ? 0.42 : 0, dt * 3);
    if (raining) {
      for (let i = 0; i < this.rainCount; i++) {
        const idx = i * 6;
        this.rainPositions[idx] -= 2.2 * dt;
        this.rainPositions[idx + 1] -= 16 * dt;
        if (this.rainPositions[idx + 1] < 0) {
          this.rainPositions[idx] = -115 + Math.random() * 245;
          this.rainPositions[idx + 1] = 17 + Math.random() * 2;
        }
        this.rainPositions[idx + 3] = this.rainPositions[idx] - 0.15;
        this.rainPositions[idx + 4] = this.rainPositions[idx + 1] - 0.55;
      }
      this.rainLines.geometry.attributes.position.needsUpdate = true;
    }

    const camX = isInside ? THREE.MathUtils.clamp(playerX, -1.6, 1.6) : THREE.MathUtils.clamp(playerX, CH2_MIN_X + 5.5, CH2_MAX_X - 5.5);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camX, Math.min(1, dt * 5.5));
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 2.2, Math.min(1, dt * 5.5));
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetCamZ, Math.min(1, dt * 6.0));
    this.camera.lookAt(this.camera.position.x, this.camera.position.y - 0.2, 0);
    this.renderer.render(this.scene, this.camera);
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
    const baseFov = isMobileScreen && aspect >= 1.15 ? 38 : aspect < 1.15 ? THREE.MathUtils.clamp(42 + (1.15 - aspect) * 24, 42, 58) : 42;
    const baseZ = isMobileScreen ? (aspect < 1.0 ? THREE.MathUtils.clamp(11.8 + (1.0 - aspect) * 5.5, 11.8, 15.8) : 9.6) : 13.4;
    this.targetCamZ = baseZ / this.zoomFactor;
    if (snapZ) this.camera.position.z = this.targetCamZ;
    this.camera.fov = baseFov;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public getRotHaeX(): number {
    return this.rotHaeCtrl.x;
  }

  public getSongthaewX(): number {
    return this.songthaewCtrl.x;
  }

  public getDrunkWalkerX(): number {
    return this.ruralActorsCtrl.drunkX;
  }

  public getMorningMonkX(): number {
    return this.ruralActorsCtrl.morningMonk.x;
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
