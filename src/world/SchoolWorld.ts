import * as THREE from 'three';
import {
  Ch3CharKind,
  createCh3CharacterTexture,
  createPeemBikeTexture,
  createSchoolSignTexture,
} from '../art/Chapter3Sprites';
import { Ch3RoomId } from '../data/chapter3Data';
import {
  createLightConeTexture,
  createThaiDoorTexture,
  createThaiRoadTexture,
  createThaiTileFloorTexture,
  createThaiWallTexture,
  createThaiWindowTexture,
} from '../art/TextureFactory';
import { build25DStreetTree } from './NatureModels';
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
  private rimLight: THREE.DirectionalLight;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private bikeHeadlight: THREE.SpotLight;
  private bikeHeadlightTarget: THREE.Object3D;

  private exteriorGroup: THREE.Group;
  private roomGroups: Partial<Record<Ch3RoomId, THREE.Group>> = {};
  private lifeRefs!: SchoolLifeRefs;

  private playerMesh: THREE.Mesh;
  private playerShadow: THREE.Mesh;
  private ridingBikeGroup: THREE.Group;
  private bikeWheels: THREE.Group[] = [];
  private bikeCrank: THREE.Group = new THREE.Group();
  private ghostMesh: THREE.Mesh;
  private ghostLight: THREE.PointLight;
  private gateLockMesh: THREE.Group;
  private corridorLights: { floor: FloorIndex; light: THREE.PointLight; baseInt: number; seed: number }[] = [];
  private skyBackdropMesh!: THREE.Mesh;
  private skyCanvas!: HTMLCanvasElement;
  private skyTex!: THREE.CanvasTexture;
  private celestialGroup!: THREE.Group;
  private sunDisc!: THREE.Mesh;
  private sunHalo!: THREE.Mesh;
  private cloudMeshes: { mesh: THREE.Mesh; speed: number; baseX: number }[] = [];
  private dustPoints!: THREE.Points;
  private dustPos!: Float32Array;
  private dustCount = 140;
  private lampCones: THREE.Mesh[] = [];
  private peemBikeFrames: THREE.CanvasTexture[] = [];
  private shopStates: { shutter: THREE.Mesh; light: THREE.PointLight; staff: THREE.Mesh; guest: THREE.Mesh }[] = [];

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

    // High-res moving directional sun/moon light casting dynamic shadows across the entire 248m world
    this.sunMoonLight = new THREE.DirectionalLight('#fff2d6', 1.25);
    this.sunMoonLight.position.set(-90, 26, 18);
    this.sunMoonLight.target.position.set(-106, 0, 0);
    this.sunMoonLight.castShadow = true;
    this.sunMoonLight.shadow.mapSize.set(2048, 2048);
    this.sunMoonLight.shadow.camera.left = -28;
    this.sunMoonLight.shadow.camera.right = 28;
    this.sunMoonLight.shadow.camera.top = 22;
    this.sunMoonLight.shadow.camera.bottom = -14;
    this.sunMoonLight.shadow.camera.near = 1;
    this.sunMoonLight.shadow.camera.far = 90;
    this.sunMoonLight.shadow.bias = -0.0005;
    this.scene.add(this.sunMoonLight, this.sunMoonLight.target);

    // Cool atmospheric rim/fill backlight separating buildings, columns & silhouettes
    this.rimLight = new THREE.DirectionalLight('#93c5fd', 0.42);
    this.rimLight.position.set(14, 16, -18);
    this.scene.add(this.rimLight);

    this.flashlight = new THREE.SpotLight('#fff0c8', 0, 18, Math.PI / 4, 0.5, 1.1);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight, this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.bikeHeadlight = new THREE.SpotLight('#fef08a', 0, 16, Math.PI / 5, 0.45, 1.0);
    this.bikeHeadlightTarget = new THREE.Object3D();
    this.scene.add(this.bikeHeadlight, this.bikeHeadlightTarget);
    this.bikeHeadlight.target = this.bikeHeadlightTarget;

    (['peem', 'student_boy', 'student_girl'] as Ch3CharKind[]).forEach((k) => {
      for (let f = 0; f < 4; f++) this.charFrames[k].push(createCh3CharacterTexture(k, f));
    });
    for (let f = 0; f < 4; f++) this.peemBikeFrames.push(createPeemBikeTexture(f));
    (['mom_ch3', 'teacher_somchai', 'teacher_wilai', 'janitor_man', 'kong_bully', 'vendor_coop', 'dancer_ghost', 'dancer_chase'] as Ch3CharKind[]).forEach(
      (k) => {
        for (let f = 0; f < 2; f++) this.charFrames[k].push(createCh3CharacterTexture(k, f));
      }
    );

    const shadowTex = this.makeShadowTex();
    this.exteriorGroup = new THREE.Group();
    this.scene.add(this.exteriorGroup);

    this.gateLockMesh = new THREE.Group();
    this.buildAtmosphericSkyBackdrop();
    this.buildCampusGroundAndSky();
    this.buildThreeStorySchoolBuilding();
    const groundRefs = buildCampusGroundProps(this.exteriorGroup, this.charFrames, shadowTex, this.addBox.bind(this));
    const roomRefs = buildSchoolRooms(this.scene, this.roomGroups, this.charFrames, shadowTex, this.addBox.bind(this));
    this.lifeRefs = { ...groundRefs, ...roomRefs };

    this.playerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 2.02),
      new THREE.MeshStandardMaterial({ map: this.charFrames.peem[0], transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })
    );
    this.playerMesh.receiveShadow = false;
    this.playerShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.42),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.48, depthWrite: false })
    );
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.playerMesh, this.playerShadow);

    // Chapter-2-grade Diamond Road Bicycle mesh with spinning 4-spoke wheels & pedal crank!
    this.ridingBikeGroup = this.buildDetailedBicycleMesh();
    this.ridingBikeGroup.visible = false;
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
    // Low cream brick campus wall & wrought-iron fence running cleanly AFTER Guard Booth (-43 .. -14)
    this.addBox(this.exteriorGroup, 30, 1.25, 0.35, '#e2e8f0', -28.5, 0.62, -2.55, 0.85);
    this.addBox(this.exteriorGroup, 30, 0.22, 0.42, '#7f1d1d', -28.5, 1.32, -2.55, 0.75);

    // 2.5D Volumetric Campus Street Trees in open clear gaps (ZERO flat planes!)
    [-102.2, -89.0, -75.5, -64.2, -41.0, -17.5, 39.5, 60.0, 74.5, 102.5, 120.0].forEach((tx, idx) => {
      const tr = build25DStreetTree({ scale: 1.12 });
      tr.position.set(tx, 0, -3.35 - (idx % 2) * 0.3);
      tr.rotation.y = idx * 0.75;
      this.exteriorGroup.add(tr);
    });

    // Multi-layered Painted Parallax Mountain Silhouettes & Town Skyline (smooth rolling ridges, zero low-poly triangles!)
    const ridgeTex = this.createMountainHorizonTexture();
    for (let hx = -110; hx <= 110; hx += 72) {
      const mtn = new THREE.Mesh(
        new THREE.PlaneGeometry(76, 18),
        new THREE.MeshBasicMaterial({ map: ridgeTex, transparent: true, fog: false })
      );
      mtn.position.set(hx, 6.2, -34.0);
      this.exteriorGroup.add(mtn);
    }

    // Sidewalk paving apron behind street curb (-132 .. -52, z = -3.3 .. -9.0) so roadside buildings sit solidly on ground!
    this.addBox(this.exteriorGroup, 80, 0.16, 5.8, '#64748b', -92, 0.08, -6.1, 0.85);
    this.addBox(this.exteriorGroup, 80, 0.14, 0.28, '#cbd5e1', -92, 0.07, -3.25, 0.8);

    // Grounded 2-Story Thai Town Shophouses (ตึกแถวเปิดร้านตอนกลางวัน — ปิดประตูเหล็กม้วนแบบไทยตอนกลางคืน!)
    const shophouseWin = createThaiWindowTexture(true);
    const shutterTex = this.createThaiShutterTexture();
    [
      { x: -120.5, wall: '#e2e8f0', roof: '#1e3a8a', awning: '#b91c1c', sign: 'ร้านขายของชำป้าพร', sub: 'ขนม • เครื่องดื่ม • เปิด 06:00-19:00', staff: 'mom_ch3' as Ch3CharKind, guest: 'student_girl' as Ch3CharKind },
      { x: -96, wall: '#fef3c7', roof: '#7c2d12', awning: '#0f766e', sign: 'ร้านกาแฟโบราณ & นมสด', sub: 'ชาเย็น • โอวัลติน • เปิดบริการ', staff: 'vendor_coop' as Ch3CharKind, guest: 'student_boy' as Ch3CharKind },
      { x: -82, wall: '#dbeafe', roof: '#1e293b', awning: '#1d4ed8', sign: 'ร้านเครื่องเขียนจันทรา', sub: 'สมุด • ดินสอ • ถ่ายเอกสาร', staff: 'mom_ch3' as Ch3CharKind, guest: 'student_girl' as Ch3CharKind },
      { x: -69, wall: '#f1f5f9', roof: '#7f1d1d', awning: '#b45309', sign: 'ร้านสะดวกซื้อหน้าโรงเรียน', sub: 'เปิดกลางวัน • ปิด 19:00 น.', staff: 'vendor_coop' as Ch3CharKind, guest: 'student_boy' as Ch3CharKind },
    ].forEach((sh) => {
      const bw = 7.4;
      const bz = -6.0;
      const frontZ = bz + 1.75; // -4.25
      // 2nd Floor Upper Body (y = 2.8 .. 5.56) + Side Columns & Back Interior Shop Wall so Ground Floor is WIDE OPEN!
      this.addBox(this.exteriorGroup, bw, 2.76, 3.5, sh.wall, sh.x, 4.18, bz, 0.88);
      this.addBox(this.exteriorGroup, bw, 2.68, 0.25, '#fef3c7', sh.x, 1.5, bz - 1.5, 0.85); // warm lit interior back wall
      this.addBox(this.exteriorGroup, 0.72, 2.68, 3.5, sh.wall, sh.x - 3.34, 1.5, bz, 0.85); // left framing pillar
      this.addBox(this.exteriorGroup, 0.72, 2.68, 3.5, sh.wall, sh.x + 3.34, 1.5, bz, 0.85); // right framing pillar
      // Flush Roof & Cornice
      this.addBox(this.exteriorGroup, bw + 0.35, 0.22, 3.85, '#cbd5e1', sh.x, 5.66, bz, 0.7);
      this.addBox(this.exteriorGroup, bw + 0.6, 0.75, 4.0, sh.roof, sh.x, 6.1, bz, 0.65);

      // Stocked Shop Display Shelves, Counter & Colorful Merchandise + Warm Shop Light + Staff & Customer INSIDE!
      this.addBox(this.exteriorGroup, 4.6, 1.9, 0.36, '#78350f', sh.x, 1.12, bz - 1.1, 0.7);
      ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f97316', '#e879f9'].forEach((mc, mi) => {
        this.addBox(this.exteriorGroup, 0.42, 0.38, 0.28, mc, sh.x - 1.7 + mi * 0.68, 1.48, bz - 0.95, 0.4);
        this.addBox(this.exteriorGroup, 0.38, 0.32, 0.28, mc, sh.x - 1.7 + mi * 0.68, 0.96, bz - 0.95, 0.4);
      });
      this.addBox(this.exteriorGroup, 3.6, 0.92, 0.62, '#b45309', sh.x + 0.4, 0.62, frontZ - 0.65, 0.55);
      const shopBulb = new THREE.PointLight('#fde68a', 5.2, 12, 1.0);
      shopBulb.position.set(sh.x, 2.45, frontZ + 1.1);
      this.exteriorGroup.add(shopBulb);
      // Clear see-through glass display counter front & glowing showcase interior inside every shophouse!
      const sGlass = new THREE.Mesh(
        new THREE.BoxGeometry(3.45, 0.58, 0.03),
        new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.24, roughness: 0.08, depthWrite: false })
      );
      sGlass.position.set(sh.x + 0.4, 1.34, frontZ - 0.35);
      const inShopLight = new THREE.PointLight('#fffbeb', 3.4, 7.5, 1.0);
      inShopLight.position.set(sh.x, 2.35, frontZ - 0.9);
      this.exteriorGroup.add(sGlass, inShopLight);

      const staffMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.36, 1.94),
        new THREE.MeshStandardMaterial({ map: this.charFrames[sh.staff][0], transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })
      );
      staffMesh.position.set(sh.x + 0.6, 1.1, frontZ - 1.15);
      const guestMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.34, 1.92),
        new THREE.MeshStandardMaterial({ map: this.charFrames[sh.guest][0], transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })
      );
      guestMesh.position.set(sh.x - 1.35, 1.1, frontZ - 0.45);
      guestMesh.scale.x = 1;
      this.exteriorGroup.add(staffMesh, guestMesh);

      // Authentic Thai Corrugated Steel Roll-Up Shutter (rolls down flush at night!) + Steel Header Box
      this.addBox(this.exteriorGroup, 6.0, 0.22, 0.28, '#475569', sh.x, 2.68, frontZ + 0.04, 0.5);
      const shutterMesh = new THREE.Mesh(
        new THREE.BoxGeometry(5.96, 2.52, 0.08),
        new THREE.MeshStandardMaterial({ map: shutterTex, metalness: 0.45, roughness: 0.55 })
      );
      shutterMesh.position.set(sh.x, 2.52, frontZ + 0.02);
      shutterMesh.scale.y = 0.12;
      this.exteriorGroup.add(shutterMesh);
      this.shopStates.push({ shutter: shutterMesh, light: shopBulb, staff: staffMesh, guest: guestMesh });

      // Sloped striped canopy awning + Shop Sign mounted cleanly on front lip of awning fascia (zero overlap!)
      this.addBox(this.exteriorGroup, 5.8, 0.12, 1.15, sh.awning, sh.x, 2.72, frontZ + 0.48, 0.75).rotation.x = 0.2;
      const shopSign = new THREE.Mesh(
        new THREE.PlaneGeometry(4.1, 0.64),
        new THREE.MeshBasicMaterial({ map: createSchoolSignTexture(sh.sign, sh.sub, sh.roof, '#0f172a', '#fde68a') })
      );
      shopSign.position.set(sh.x, 2.86, frontZ + 1.08);
      this.exteriorGroup.add(shopSign);

      // 2nd Floor balcony rail & warm glowing Thai windows
      this.addBox(this.exteriorGroup, bw - 0.6, 0.48, 0.14, '#cbd5e1', sh.x, 3.35, frontZ + 0.16, 0.8);
      [-1.7, 1.7].forEach((wx) => {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.25), new THREE.MeshBasicMaterial({ map: shophouseWin }));
        w.position.set(sh.x + wx, 4.46, frontZ + 0.04);
        this.exteriorGroup.add(w);
        this.addBox(this.exteriorGroup, 1.9, 0.1, 0.12, sh.roof, sh.x + wx, 3.8, frontZ + 0.06, 0.6);
      });
    });

    // Utility Power Poles & Catenary Cables placed strictly in open bays between buildings (never in front of windows!)
    const poleXs = [-124.5, -103.5, -89.5, -75.8, -64.6, -42.0, -16.5, 40.2, 59.5, 74.0, 103.5, 121.0];
    poleXs.forEach((px, idx) => {
      this.addBox(this.exteriorGroup, 0.22, 8.2, 0.22, '#334155', px, 4.1, -3.55, 0.9);
      this.addBox(this.exteriorGroup, 1.35, 0.12, 0.14, '#475569', px, 7.6, -3.55, 0.7);
      if (idx + 1 < poleXs.length) {
        const nx = poleXs[idx + 1];
        const sagPts = [
          new THREE.Vector3(px, 7.55, -3.55),
          new THREE.Vector3((px + nx) / 2, 6.95, -3.55),
          new THREE.Vector3(nx, 7.55, -3.55),
        ];
        const wireGeo = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(...sagPts).getPoints(10));
        this.exteriorGroup.add(new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: '#0f172a', transparent: true, opacity: 0.72 })));
      }
    });

    // Crisp Flush Asphalt Road Markings (PlaneGeometry flat on pavement so ZERO boxy thickness or crosswalk overlap!)
    const addRoadMark = (w: number, d: number, col: string, x: number, z: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.92, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.012, z);
      this.exteriorGroup.add(m);
    };
    addRoadMark(75, 0.12, '#e2e8f0', -91, -2.35); // far white edge stripe along sidewalk curb
    addRoadMark(75, 0.12, '#e2e8f0', -91, 5.25);  // near white edge stripe
    for (let rx = -126; rx <= -58; rx += 4.6) {
      // Skip centerline dashes directly inside Zebra Crosswalks (-88 & -56.5)
      if (Math.abs(rx + 88.0) < 2.2 || Math.abs(rx + 56.5) < 2.4) continue;
      addRoadMark(2.0, 0.14, '#facc15', rx, 1.55); // realistic yellow highway dashed centerline
    }
    [-56.5, -88.0].forEach((zx) => {
      for (let zBar = -1.6; zBar <= 4.4; zBar += 0.85) {
        addRoadMark(2.2, 0.42, '#f8fafc', zx, zBar);
      }
    });

    // Fence pillars + iron fence starting AFTER Guard Booth (-43 .. -14) so nothing sticks behind Gate/Booth
    for (let fx = -42.5; fx <= -14; fx += 6.5) {
      this.addBox(this.exteriorGroup, 0.36, 2.25, 0.36, '#f8fafc', fx, 1.12, -2.55);
      if (fx + 6.5 <= -13) {
        const spanW = Math.min(6.5, -13 - fx);
        this.addBox(this.exteriorGroup, spanW, 0.08, 0.08, '#1e293b', fx + spanW / 2, 2.15, -2.55, 0.5);
        for (let bar = 0.5; bar < spanW; bar += 0.45) {
          this.addBox(this.exteriorGroup, 0.05, 0.85, 0.05, '#1e293b', fx + bar, 1.72, -2.55, 0.5);
        }
      }
    }
    // See-through Wrought-Iron Sliding Gate at x = -52 (replaces solid red blocking wall at night!)
    this.addBox(this.gateLockMesh, 0.1, 0.1, 4.6, '#1e293b', -52, 1.9, 0.15, 0.45);
    this.addBox(this.gateLockMesh, 0.1, 0.12, 4.6, '#1e293b', -52, 0.2, 0.15, 0.45);
    this.addBox(this.gateLockMesh, 0.1, 0.08, 4.6, '#475569', -52, 1.05, 0.15, 0.45);
    for (let gz = -1.95; gz <= 2.25; gz += 0.35) {
      this.addBox(this.gateLockMesh, 0.05, 1.95, 0.05, '#0f172a', -52, 1.05, gz, 0.4);
    }
    this.addBox(this.gateLockMesh, 0.14, 0.24, 0.2, '#facc15', -52, 1.05, 0.15, 0.3); // brass padlock
    this.exteriorGroup.add(this.gateLockMesh);

    const lampConeTex = createLightConeTexture('255, 224, 150');
    [-104.0, -88.5, -75.2, -58.2, -41.2, -31.0, 39.2, 60.2, 74.8, 102.0, 119.5].forEach((lx) => {
      this.addBox(this.exteriorGroup, 0.22, 5.8, 0.22, '#475569', lx, 2.9, -2.0);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.45), new THREE.MeshBasicMaterial({ color: '#fde68a' }));
      b.position.set(lx, 5.75, -1.25);
      this.exteriorGroup.add(b);
      const pl = new THREE.PointLight('#ffd89a', 6.5, 20, 0.95);
      pl.position.set(lx, 5.4, 0.8);
      this.exteriorGroup.add(pl);
      const cone = new THREE.Mesh(
        new THREE.PlaneGeometry(4.4, 5.6),
        new THREE.MeshBasicMaterial({ map: lampConeTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.2 })
      );
      cone.position.set(lx, 3.1, -0.8);
      this.exteriorGroup.add(cone);
      this.lampCones.push(cone);
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

    // Upper-floor solid end walls (Floors 1-3, y = 4.2 .. 16.8) keep classrooms & stairwell enclosed while Ground Floor remains an open breezeway entrance!
    this.addBox(this.exteriorGroup, 0.42, CH3_FLOOR_H * 3, 4.15, '#cbd5e1', CH3_BLDG_MIN_X - 0.16, CH3_FLOOR_H * 2.5, 0.25, 0.88);
    this.addBox(this.exteriorGroup, 0.42, CH3_FLOOR_H * 3, 4.15, '#cbd5e1', CH3_BLDG_MAX_X + 0.16, CH3_FLOOR_H * 2.5, 0.25, 0.88);
    // Ground-floor left & right rear bay trim + West Main Building Entrance Portal facing courtyard (-12.0)!
    this.addBox(this.exteriorGroup, 0.42, CH3_FLOOR_H, 1.5, '#e2e8f0', CH3_BLDG_MIN_X - 0.16, CH3_FLOOR_H / 2, -1.05, 0.85);
    this.addBox(this.exteriorGroup, 0.42, CH3_FLOOR_H, 1.5, '#e2e8f0', CH3_BLDG_MAX_X + 0.16, CH3_FLOOR_H / 2, -1.05, 0.85);
    const mainEntrancePortal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 2.55),
      new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ทางเข้าอาคาร', false), roughness: 0.65 })
    );
    mainEntrancePortal.rotation.y = -Math.PI / 2;
    mainEntrancePortal.position.set(CH3_BLDG_MIN_X - 0.39, 1.32, -0.95);
    this.exteriorGroup.add(mainEntrancePortal);
    for (let px = CH3_BLDG_MIN_X; px <= CH3_BLDG_MAX_X; px += 8.0) {
      this.addBox(this.exteriorGroup, 0.52, CH3_FLOOR_H * 4, 0.52, '#e2e8f0', px, CH3_FLOOR_H * 2, 2.15);
    }

    // Sloped Thai Royal-Blue School Gable Roof + ONE Unobstructed Building Title Sign cleanly centered along roof fascia
    const roofY = CH3_FLOOR_H * 4 + 0.35;
    this.addBox(this.exteriorGroup, totalW + 2.2, 1.9, 5.4, '#1e3a8a', centerX, roofY + 0.85, 0.2, 0.6);
    this.addBox(this.exteriorGroup, totalW + 2.4, 0.32, 5.6, '#facc15', centerX, roofY, 0.2, 0.4);
    const bldgTitle = new THREE.Mesh(
      new THREE.PlaneGeometry(9.2, 1.65),
      new THREE.MeshBasicMaterial({ map: createSchoolSignTexture('อาคารเรียนมัธยมจันทรารัตน์ (3 ชั้น)', 'ชั้น 1 หอสมุด-พักครู • ชั้น 2 ม.5/2 • ชั้น 3 ดนตรีไทย', '#1e3a8a', '#0f172a', '#facc15') })
    );
    bldgTitle.position.set(centerX, roofY + 0.9, 3.18);
    this.exteriorGroup.add(bldgTitle);

    // Ground Floor (ใต้ถุนอาคารเรียน -12 .. +36): Terrazzo floor, clean dark baseboard, full-height doors & lobby props
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
    this.addBox(this.exteriorGroup, totalW + 0.6, 0.14, 0.04, '#1e293b', centerX, 0.1, -1.52, 0.78);

    // Sculpted terracotta potted ferns beside ground-floor pillars
    for (let px = CH3_BLDG_MIN_X; px <= 28; px += 8.0) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.22, 0.44, 10),
        new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.75 })
      );
      pot.position.set(px + 0.68, 0.3, 1.82);
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 10, 8),
        new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.88 })
      );
      bush.position.set(px + 0.68, 0.72, 1.82);
      this.exteriorGroup.add(pot, bush);
    }

    // Bright Lobby Ceiling Lights & Full Windows
    [-6, 4, 14, 24, 33].forEach((lx, idx) => {
      const pt = new THREE.PointLight('#fffbeb', 2.8, 17, 1.1);
      pt.position.set(lx, 3.35, 0.55);
      this.exteriorGroup.add(pt);
      this.corridorLights.push({ floor: 0, light: pt, baseInt: 2.8, seed: idx + 1 });
    });
    [-10.0, -4.0, 1.5, 11.0, 18.5, 29.0, 33.4].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.32), new THREE.MeshBasicMaterial({ map: winLit }));
      win.position.set(wx, 2.55, -1.48);
      this.exteriorGroup.add(win);
      this.addBox(this.exteriorGroup, 2.3, 0.12, 0.14, '#1e3a8a', wx, 1.84, -1.45, 0.6);
    });

    // Full-height Ground Floor Building Doors (flush with tiled terrace, NO white stripe overlapping!)
    [
      { x: -10.8, label: 'โถงอาคาร' },
      { x: -7.5, label: 'ห้องธุรการ' },
      { x: -0.5, label: 'ห้องพยาบาล' },
      { x: 21.5, label: 'สภาฯ นร.' },
    ].forEach((d) => {
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(1.42, 2.42),
        new THREE.MeshStandardMaterial({ map: createThaiDoorTexture(d.label, false), roughness: 0.75 })
      );
      door.position.set(d.x, 1.28, -1.42);
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
        const pt = new THREE.PointLight(lCol, fl === 3 ? 0.95 : 2.5, 16, 1.15);
        pt.position.set(lx, y + 3.45, 1.45);
        this.exteriorGroup.add(pt);
        this.corridorLights.push({ floor: fl, light: pt, baseInt: fl === 3 ? 0.95 : 2.5, seed: fl * 10 + idx });
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
    const riding = ridingBike && !isHiding && !isInside && pFloor === 0;
    this.playerMesh.visible = !isHiding;
    this.playerShadow.visible = !isHiding;
    this.playerMesh.position.set(px, yBase + (riding ? 1.13 : 0.96), pz);
    this.playerShadow.position.set(px, yBase + 0.026, pz);
    const pf = isMoving ? Math.floor(this.animClock * (riding ? 10 : 8)) % 4 : 0;
    (this.playerMesh.material as THREE.MeshStandardMaterial).map = riding
      ? this.peemBikeFrames[pf]
      : this.charFrames.peem[pf];
    // Flip UV horizontally instead of negative scale.x so front normal always faces +Z toward street/room lights!
    const uv = this.playerMesh.geometry.attributes.uv as THREE.BufferAttribute;
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

    // Detailed Chapter-2-grade Diamond Bicycle + crank + headlight tracking under Peem!
    this.ridingBikeGroup.visible = riding;
    if (riding) {
      this.ridingBikeGroup.position.set(px, yBase + 0.02, pz - 0.04);
      this.ridingBikeGroup.scale.x = facing;
      if (isMoving) {
        this.bikeWheels.forEach((w) => (w.rotation.z -= dt * 11.5));
        this.bikeCrank.rotation.z -= dt * 10.0;
      }
      this.bikeHeadlight.position.set(px + facing * 0.5, yBase + 0.85, pz);
      this.bikeHeadlightTarget.position.set(px + facing * 7.5, yBase + 0.05, pz);
      this.bikeHeadlight.intensity = hour >= 16.5 || hour < 6.8 ? 14.0 : 4.0;
    } else {
      this.bikeHeadlight.intensity = 0;
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
    this.shopStates.forEach((st) => {
      st.shutter.scale.y = THREE.MathUtils.lerp(st.shutter.scale.y, isNight ? 1.0 : 0.12, Math.min(1, dt * 4));
      st.shutter.position.y = THREE.MathUtils.lerp(st.shutter.position.y, isNight ? 1.42 : 2.52, Math.min(1, dt * 4));
      st.light.intensity = isNight ? 0 : 4.8;
      const showInside = !isNight || st.shutter.scale.y < 0.45;
      st.staff.visible = showInside;
      st.guest.visible = showInside;
    });
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

    // Track Sky Backdrop, Celestial Disc, Clouds & Dynamic High-Res Sun/Moon Shadow Camera with Camera!
    this.skyBackdropMesh.visible = !isInside;
    this.celestialGroup.visible = !isInside;
    this.dustPoints.visible = !isInside;
    this.skyBackdropMesh.position.x = this.camera.position.x;
    this.skyBackdropMesh.position.y = this.camera.position.y + 8.0;
    this.sunMoonLight.target.position.set(this.camera.position.x, yBase, 0);
    this.sunMoonLight.position.set(this.camera.position.x + 16, yBase + 26, 18);
    this.rimLight.position.set(this.camera.position.x - 14, yBase + 16, -18);

    this.renderer.render(this.scene, this.camera);
  }

  private createThaiShutterTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    // Classic Thai steel roller-shutter slats (ประตูเหล็กม้วนสีเทาเงิน/ฟ้าอมเทา)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 256, 192);
    for (let y = 0; y < 192; y += 12) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, y, 256, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, y + 6, 256, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, y + 1, 256, 1.5);
    }
    // Side vertical guide rails + heavy bottom lock bar + center brass padlock clasp
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 10, 192);
    ctx.fillRect(246, 0, 10, 192);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 178, 256, 14);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(108, 170, 40, 12);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(123, 176, 10, 10);
    // Small Thai "ปิดร้าน" hanger card in middle
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(88, 76, 80, 32);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(88, 76, 80, 32);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 16px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ปิดร้าน', 128, 92);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  private createMountainHorizonTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    // Far misty ridge
    ctx.fillStyle = 'rgba(51, 77, 110, 0.72)';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.bezierCurveTo(90, 48, 180, 96, 260, 38);
    ctx.bezierCurveTo(350, 10, 440, 88, 512, 54);
    ctx.lineTo(512, 160);
    ctx.fill();
    // Closer lush ridge silhouette
    ctx.fillStyle = 'rgba(30, 58, 72, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.bezierCurveTo(120, 95, 220, 128, 330, 84);
    ctx.bezierCurveTo(410, 62, 470, 110, 512, 92);
    ctx.lineTo(512, 160);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildAtmosphericSkyBackdrop(): void {
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = 256;
    this.skyCanvas.height = 128;
    this.skyTex = new THREE.CanvasTexture(this.skyCanvas);
    this.skyTex.colorSpace = THREE.SRGBColorSpace;

    this.skyBackdropMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 74),
      new THREE.MeshBasicMaterial({ map: this.skyTex, fog: false, depthWrite: false })
    );
    this.skyBackdropMesh.position.set(-106, 10, -56);
    this.scene.add(this.skyBackdropMesh);

    this.celestialGroup = new THREE.Group();
    this.sunDisc = new THREE.Mesh(new THREE.CircleGeometry(2.8, 24), new THREE.MeshBasicMaterial({ color: '#fef08a', fog: false }));
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hctx = haloCanvas.getContext('2d')!;
    const hg = hctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    hg.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    hg.addColorStop(0.5, 'rgba(251, 191, 36, 0.25)');
    hg.addColorStop(1, 'rgba(251, 191, 36, 0)');
    hctx.fillStyle = hg;
    hctx.fillRect(0, 0, 128, 128);
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    haloTex.colorSpace = THREE.SRGBColorSpace;
    this.sunHalo = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, fog: false, depthWrite: false })
    );
    this.sunHalo.position.z = -0.1;
    this.celestialGroup.add(this.sunDisc, this.sunHalo);
    this.scene.add(this.celestialGroup);

    // Seamless soft cloud sprites (opaque fill on canvas + soft mesh opacity so circles never show overlapping rings!)
    const cc = document.createElement('canvas');
    cc.width = 256;
    cc.height = 96;
    const cctx = cc.getContext('2d')!;
    cctx.fillStyle = '#ffffff';
    [
      [70, 56, 32],
      [114, 42, 40],
      [158, 48, 34],
      [194, 60, 24],
      [50, 66, 22],
      [130, 62, 30],
    ].forEach(([cx, cy, cr]) => {
      cctx.beginPath();
      cctx.arc(cx, cy, cr, 0, Math.PI * 2);
      cctx.fill();
    });
    const cTex = new THREE.CanvasTexture(cc);
    cTex.colorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < 8; i++) {
      const cm = new THREE.Mesh(
        new THREE.PlaneGeometry(18 + (i % 3) * 5, 6.2),
        new THREE.MeshBasicMaterial({ map: cTex, transparent: true, opacity: 0.36, fog: false, depthWrite: false })
      );
      const bx = -120 + i * 34;
      cm.position.set(bx, 13.5 + (i % 3) * 2.4, -44 - (i % 2) * 3);
      this.exteriorGroup.add(cm);
      this.cloudMeshes.push({ mesh: cm, speed: 0.4 + (i % 3) * 0.22, baseX: bx });
    }

    // Floating sunlight dust motes / night fireflies
    this.dustPos = new Float32Array(this.dustCount * 3);
    for (let i = 0; i < this.dustCount; i++) {
      this.dustPos[i * 3] = CH3_MIN_X + Math.random() * (CH3_MAX_X - CH3_MIN_X);
      this.dustPos[i * 3 + 1] = 0.4 + Math.random() * 6.5;
      this.dustPos[i * 3 + 2] = -1.5 + Math.random() * 4.5;
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPos, 3));
    this.dustPoints = new THREE.Points(
      dGeo,
      new THREE.PointsMaterial({ color: '#fde68a', size: 0.09, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
    );
    this.scene.add(this.dustPoints);
  }

  private buildDetailedBicycleMesh(): THREE.Group {
    const g = new THREE.Group();
    const tireMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.68 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.75, roughness: 0.22 });

    [-0.54, 0.54].forEach((wx) => {
      const wheelGrp = new THREE.Group();
      wheelGrp.position.set(wx, 0.3, 0);
      wheelGrp.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 18), tireMat));
      [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].forEach((ang) => {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.022, 0.02), metalMat);
        spoke.rotation.z = ang;
        wheelGrp.add(spoke);
      });
      g.add(wheelGrp);
      this.bikeWheels.push(wheelGrp);
    });

    this.addBox(g, 0.64, 0.055, 0.05, '#0284c7', -0.06, 0.72, 0);
    this.addBox(g, 0.62, 0.055, 0.05, '#0284c7', -0.24, 0.5, 0).rotation.z = 0.72;
    this.addBox(g, 0.58, 0.055, 0.05, '#0369a1', 0.14, 0.52, 0).rotation.z = 0.68;
    this.addBox(g, 0.52, 0.055, 0.05, '#0284c7', -0.14, 0.56, 0).rotation.z = 1.32;
    this.addBox(g, 0.55, 0.055, 0.05, '#cbd5e1', 0.38, 0.62, 0).rotation.z = -0.35;
    this.addBox(g, 0.12, 0.05, 0.44, '#cbd5e1', 0.36, 0.94, 0);
    this.addBox(g, 0.24, 0.07, 0.14, '#111827', -0.22, 0.84, 0);
    this.addBox(g, 0.24, 0.2, 0.22, '#78350f', 0.52, 0.76, 0);
    const headBulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    headBulb.position.set(0.5, 0.84, 0);
    g.add(headBulb);

    const crank = new THREE.Group();
    crank.position.set(-0.04, 0.32, 0);
    this.addBox(crank, 0.04, 0.24, 0.03, '#e2e8f0', 0, 0, 0.06);
    this.addBox(crank, 0.1, 0.04, 0.08, '#111827', 0, 0.12, 0.08);
    g.add(crank);
    this.bikeCrank = crank;
    return g;
  }

  private updateSkyAndRain(dt: number, mins: number, weather: WeatherType): void {
    const h = (mins % 1440) / 60;
    const sky = new THREE.Color('#090d1a');
    let zenithCol = '#0b1024';
    let horizCol = '#1e293b';
    let hInt = 0.45;
    let sInt = 0.35;
    let sunCol = '#fff2d6';

    if (h >= 5.5 && h < 7.5) {
      sky.lerpColors(new THREE.Color('#0c1224'), new THREE.Color('#6b8cae'), (h - 5.5) / 2);
      zenithCol = '#1e3a5f';
      horizCol = '#f59e0b';
      sunCol = '#fed7aa';
      hInt = 0.78;
      sInt = 0.95;
    } else if (h >= 7.5 && h < 16.0) {
      sky.set('#4c7fb8');
      zenithCol = '#1d4ed8';
      horizCol = '#93c5fd';
      sunCol = '#fff7ed';
      hInt = 1.05;
      sInt = 1.35;
    } else if (h >= 16.0 && h < 19.0) {
      sky.lerpColors(new THREE.Color('#d97706'), new THREE.Color('#0f172a'), (h - 16.0) / 3);
      zenithCol = '#312e81';
      horizCol = h < 17.6 ? '#ea580c' : '#1e1b4b';
      sunCol = '#fb923c';
      hInt = 0.82;
      sInt = 0.92;
    } else {
      sky.set('#060a14');
      zenithCol = '#020617';
      horizCol = '#0f172a';
      sunCol = '#cbd5e1';
      hInt = 0.4;
      sInt = 0.32;
    }

    if (weather === 'rain' || weather === 'storm') {
      sky.multiplyScalar(0.68);
      zenithCol = '#1e293b';
      horizCol = '#475569';
    }

    // Paint dynamic multi-stop gradient Sky Canvas + Stars at night
    const sctx = this.skyCanvas.getContext('2d')!;
    const grad = sctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, zenithCol);
    grad.addColorStop(0.68, `#${sky.getHexString()}`);
    grad.addColorStop(1, horizCol);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 128);
    if (h >= 18.8 || h < 5.8) {
      sctx.fillStyle = 'rgba(255,255,255,0.65)';
      for (let st = 0; st < 28; st++) sctx.fillRect((st * 47) % 256, (st * 23) % 72, 1.5, 1.5);
    }
    this.skyTex.needsUpdate = true;

    // Celestial Sun/Moon Arc across sky
    const isNight = h >= 19.0 || h < 5.5;
    const arcT = isNight ? ((h >= 19 ? h - 19 : h + 5) / 10.5) : ((h - 5.5) / 13.5);
    this.celestialGroup.position.set(
      this.camera.position.x + (arcT - 0.5) * 44,
      8.5 + Math.sin(arcT * Math.PI) * 14.0,
      -48
    );
    (this.sunDisc.material as THREE.MeshBasicMaterial).color.set(isNight ? '#e2e8f0' : '#fef08a');
    (this.sunHalo.material as THREE.MeshBasicMaterial).opacity = isNight ? 0.35 : 0.8;

    this.scene.background = sky;
    (this.scene.fog as THREE.FogExp2).color.copy(sky);
    (this.scene.fog as THREE.FogExp2).density = isNight ? 0.0135 : 0.0068;
    this.hemiLight.intensity = hInt;
    this.sunMoonLight.intensity = sInt;
    this.sunMoonLight.color.set(sunCol);

    this.lampCones.forEach((cone) => {
      (cone.material as THREE.MeshBasicMaterial).opacity = isNight ? 0.42 : h >= 16.5 || h < 7.0 ? 0.26 : 0.04;
    });
    this.cloudMeshes.forEach((c) => {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x > 130) c.mesh.position.x = -130;
      (c.mesh.material as THREE.MeshBasicMaterial).opacity = isNight ? 0.14 : 0.48;
    });
    for (let i = 0; i < this.dustCount; i++) {
      this.dustPos[i * 3] += Math.sin(this.animClock * 0.7 + i) * 0.18 * dt;
      this.dustPos[i * 3 + 1] += Math.cos(this.animClock * 1.1 + i) * 0.12 * dt;
    }
    this.dustPoints.geometry.attributes.position.needsUpdate = true;
    (this.dustPoints.material as THREE.PointsMaterial).color.set(isNight ? '#f87171' : '#fde68a');

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
