import * as THREE from 'three';
import { buildRealisticCar, buildRealisticMotorcycle } from './VehicleModels';

function addPart(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  color: string,
  x: number,
  y: number,
  z: number,
  roughness = 0.78,
  metalness = 0.08
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness, metalness })
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function makeBannerTex(bg: string, border: string, textCol: string, line1: string, line2?: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 80;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 80);
  ctx.strokeStyle = border;
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 248, 72);
  ctx.fillStyle = textCol;
  ctx.font = 'bold 21px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(line1, 128, line2 ? 27 : 40);
  if (line2) {
    ctx.font = '14px "IBM Plex Sans Thai", sans-serif';
    ctx.fillText(line2, 128, 56);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWheel(radius: number, width: number): THREE.Group {
  const wg = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 14),
    new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85 })
  );
  tire.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width + 0.02, 8),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.65, roughness: 0.3 })
  );
  rim.rotation.x = Math.PI / 2;
  wg.add(tire, rim);
  return wg;
}

function makeVillagerFigure(shirtCol: string, pantsCol: string, hatCol?: string, bottleCol?: string): THREE.Group {
  const g = new THREE.Group();
  const leftLeg = addPart(g, 0.14, 0.52, 0.16, pantsCol, -0.08, 0.26, 0);
  const rightLeg = addPart(g, 0.14, 0.52, 0.16, pantsCol, 0.08, 0.26, 0);
  leftLeg.name = 'legL';
  rightLeg.name = 'legR';
  addPart(g, 0.34, 0.66, 0.24, shirtCol, 0, 0.85, 0);
  const leftArm = addPart(g, 0.1, 0.48, 0.1, '#cf9970', -0.23, 0.86, 0);
  const rightArm = addPart(g, 0.1, 0.48, 0.1, '#cf9970', 0.23, 0.86, 0);
  leftArm.name = 'armL';
  rightArm.name = 'armR';
  addPart(g, 0.26, 0.26, 0.24, '#cf9970', 0, 1.34, 0);
  addPart(g, 0.27, 0.1, 0.25, '#18181b', 0, 1.46, 0);
  if (hatCol) {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 8), new THREE.MeshStandardMaterial({ color: hatCol }));
    hat.position.set(0, 1.54, 0);
    g.add(hat);
  }
  if (bottleCol) {
    // Khai lao / Thai white liquor bottle held in swaying hand
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.055, 0.28, 8),
      new THREE.MeshStandardMaterial({ color: bottleCol, roughness: 0.25 })
    );
    bottle.position.set(0.28, 0.72, 0.08);
    bottle.rotation.z = -0.35;
    g.add(bottle);
  }
  return g;
}

export interface MovingVehicle {
  group: THREE.Group;
  wheels: THREE.Group[];
  headlight?: THREE.PointLight;
  x: number;
  dir: 1 | -1;
  speed: number;
  laneZ: number;
  minX: number;
  maxX: number;
}

export interface SongthaewController {
  group: THREE.Group;
  banner: THREE.Mesh;
  wheels: THREE.Group[];
  x: number;
  dir: 1 | -1;
  stopTimer: number;
  lastStopX: number;
  stopWaiters: { group: THREE.Group; stopX: number }[];
  headlight: THREE.PointLight;
}

export interface RotHaeController {
  group: THREE.Group;
  banner: THREE.Mesh;
  wheels: THREE.Group[];
  dancers: { group: THREE.Group; offsetX: number; offsetZ: number; phase: number }[];
  discoLight: THREE.PointLight;
  ledMeshes: THREE.Mesh[];
  x: number;
  dir: 1 | -1;
}

export type VillageMood = 'festive' | 'uneasy' | 'lockdown';

export interface TempleFairController {
  ferrisWheel: THREE.Group;
  gondolas: THREE.Group[];
  bulbs: THREE.Mesh[];
  stageLights: THREE.PointLight[];
  stageDancers: THREE.Group[];
  stageAudience: THREE.Group[];
  boothVendors: THREE.Group[];
  closedSign: THREE.Mesh;
}

export interface RuralActorsController {
  drunkGroup: THREE.Group;
  drunkX: number;
  drunkDir: 1 | -1;
  shoppers: { group: THREE.Group; baseX: number; range: number; speed: number; phase: number }[];
  wisps: { mesh: THREE.Mesh; baseX: number; baseY: number; phase: number }[];
  fireflies: { mesh: THREE.Mesh; baseX: number; baseY: number; phase: number }[];
  campfireGroup: THREE.Group;
  campfireLight: THREE.PointLight;
  khaenPlayer: THREE.Group;
  taniSpirit: THREE.Group;
  taniLight: THREE.PointLight;
  saleng: { group: THREE.Group; wheels: THREE.Group[]; x: number; dir: 1 | -1 };
  schoolSwing: THREE.Group;
  morningMonk: { group: THREE.Group; x: number; dir: 1 | -1 };
}

/** Builds the slow-moving Isaan Rot Hae speaker pickup truck + crowd of dancing villagers. */
export function buildRotHaeSystem(scene: THREE.Scene): RotHaeController {
  const group = new THREE.Group();
  const wheels: THREE.Group[] = [];

  // Pickup chassis & cab facing +X
  addPart(group, 4.4, 0.34, 1.55, '#1e293b', 0, 0.42, 0, 0.5, 0.4); // bed floor
  addPart(group, 1.55, 0.85, 1.5, '#b91c1c', 1.35, 0.96, 0, 0.4, 0.35); // red pickup hood + cab lower
  addPart(group, 1.05, 0.62, 1.44, '#dc2626', 1.12, 1.58, 0, 0.4, 0.3); // cab roof
  addPart(group, 0.14, 0.48, 1.32, '#93c5fd', 1.65, 1.5, 0, 0.2, 0.5); // windshield
  addPart(group, 2.75, 0.52, 1.55, '#991b1b', -0.78, 0.84, 0, 0.45, 0.3); // pickup cargo sides

  [-1.35, 1.35].forEach((wx) => {
    const w = makeWheel(0.32, 0.2);
    w.position.set(wx, 0.32, 0.78);
    group.add(w);
    wheels.push(w);
  });

  // Giant stacked concert speakers on truck bed! (ตู้ลำโพงรถแห่)
  [-1.55, -0.75, 0.05].forEach((sx, si) => {
    addPart(group, 0.68, 1.35, 1.3, '#0f172a', sx, 1.62, 0, 0.8);
    // Speaker cones on front/side facing camera (+Z)
    [1.3, 1.92].forEach((cy) => {
      const cone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: si === 1 ? '#facc15' : '#334155', roughness: 0.4 })
      );
      cone.rotation.x = Math.PI / 2;
      cone.position.set(sx, cy, 0.66);
      group.add(cone);
    });
  });

  // Steel truss frame & glowing party banner
  addPart(group, 2.6, 0.12, 1.35, '#cbd5e1', -0.75, 2.42, 0, 0.35, 0.75);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.62),
    new THREE.MeshBasicMaterial({
      map: makeBannerTex('#7e22ce', '#facc15', '#fef08a', 'รถแห่บ้านทุ่ง ออนทัวร์', 'ลำซิ่งชวนม่วน • จังหวะสามช่า'),
      side: THREE.DoubleSide,
    })
  );
  banner.position.set(-0.75, 2.75, 0.68);
  group.add(banner);

  // Flashing disco LEDs along truss
  const ledColors = ['#f43f5e', '#facc15', '#22d3ee', '#a855f7', '#4ade80'];
  const ledMeshes: THREE.Mesh[] = [];
  ledColors.forEach((col, i) => {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: col })
    );
    bulb.position.set(-1.75 + i * 0.5, 2.42, 0.72);
    group.add(bulb);
    ledMeshes.push(bulb);
  });

  const discoLight = new THREE.PointLight('#e879f9', 6.5, 14, 1.1);
  discoLight.position.set(-0.6, 2.8, 1.4);
  group.add(discoLight);

  group.position.set(-18, 0, 3.35);
  scene.add(group);

  // 6 Villagers dancing both in front of and walking slowly behind the Rot Hae!
  const dancerDefs = [
    { offsetX: 2.9, offsetZ: -0.38, shirt: '#ec4899', pants: '#1e293b', hat: '#facc15' },
    { offsetX: 3.7, offsetZ: 0.28, shirt: '#eab308', pants: '#1e3a8a', hat: undefined },
    { offsetX: -2.85, offsetZ: -0.28, shirt: '#22c55e', pants: '#0f172a', hat: '#a16207' },
    { offsetX: -3.55, offsetZ: 0.32, shirt: '#3b82f6', pants: '#334155', hat: undefined },
    { offsetX: -4.25, offsetZ: -0.18, shirt: '#f97316', pants: '#172554', hat: '#ca8a04' },
    { offsetX: 4.45, offsetZ: -0.1, shirt: '#a855f7', pants: '#18181b', hat: undefined },
  ];
  const dancers = dancerDefs.map((dd, idx) => {
    const dg = makeVillagerFigure(dd.shirt, dd.pants, dd.hat);
    dg.position.set(-18 + dd.offsetX, 0, 3.35 + dd.offsetZ);
    scene.add(dg);
    return { group: dg, offsetX: dd.offsetX, offsetZ: dd.offsetZ, phase: idx * 1.15 };
  });

  return { group, banner, wheels, dancers, discoLight, ledMeshes, x: -18, dir: 1 };
}

/** Builds Thai village Songthaew passenger truck + waiting passengers at the 3 bus stops. */
export function buildSongthaewSystem(scene: THREE.Scene): SongthaewController {
  const group = new THREE.Group();
  const wheels: THREE.Group[] = [];

  // Two-tone blue-cream Thai Songthaew
  addPart(group, 1.35, 0.85, 1.48, '#1d4ed8', 1.35, 0.92, 0, 0.45, 0.25); // front cab
  addPart(group, 1.0, 0.58, 1.42, '#1e40af', 1.1, 1.54, 0, 0.45, 0.2); // cab roof
  addPart(group, 0.14, 0.45, 1.3, '#bae6fd', 1.62, 1.48, 0, 0.2, 0.4); // windshield
  addPart(group, 2.85, 0.48, 1.52, '#1e3a8a', -0.72, 0.72, 0, 0.55); // rear passenger bed lower
  addPart(group, 2.9, 0.12, 1.56, '#fef3c7', -0.74, 1.95, 0, 0.5); // cream canopy roof
  addPart(group, 2.92, 0.12, 1.58, '#eab308', -0.74, 1.84, 0, 0.5); // yellow route stripe
  [-2.05, 0.45].forEach((px) => {
    addPart(group, 0.1, 1.05, 0.1, '#cbd5e1', px, 1.42, 0.72);
    addPart(group, 0.1, 1.05, 0.1, '#cbd5e1', px, 1.42, -0.72);
  });
  addPart(group, 0.35, 0.1, 1.35, '#94a3b8', -2.25, 0.45, 0); // rear boarding step

  // Two passengers visibly seated inside on wooden benches
  [-1.25, -0.35].forEach((px, pi) => {
    addPart(group, 0.26, 0.46, 0.22, pi === 0 ? '#f472b6' : '#f59e0b', px, 1.12, 0.25);
    addPart(group, 0.2, 0.2, 0.2, '#d9a47c', px, 1.46, 0.25);
  });

  const signPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.42),
    new THREE.MeshBasicMaterial({
      map: makeBannerTex('#1e3a8a', '#facc15', '#ffffff', 'สองแถว บ้านทุ่ง - ตลาด - วัด'),
      side: THREE.DoubleSide,
    })
  );
  signPlane.position.set(-0.75, 1.98, 0.8);
  group.add(signPlane);

  [-1.3, 1.3].forEach((wx) => {
    const w = makeWheel(0.3, 0.18);
    w.position.set(wx, 0.3, 0.76);
    group.add(w);
    wheels.push(w);
  });

  const hl = new THREE.PointLight('#fef08a', 4.0, 10, 1.4);
  hl.position.set(2.3, 0.85, 0.4);
  group.add(hl);

  group.position.set(-60, 0, 4.45);
  scene.add(group);

  // Waiting passengers standing beside the 3 Songthaew stops (-82, -24.5, +61.6)
  const stopWaiters = [-80.4, -24.5, 63.1].map((sx, idx) => {
    const w = makeVillagerFigure(idx === 0 ? '#0ea5e9' : idx === 1 ? '#f43f5e' : '#eab308', '#1e293b', idx === 2 ? '#a16207' : undefined);
    w.position.set(sx, 0, 1.95);
    scene.add(w);
    return { group: w, stopX: sx };
  });

  return { group, banner: signPlane, wheels, x: -60, dir: 1, stopTimer: 0, lastStopX: 999, stopWaiters, headlight: hl };
}

/** Builds ambient cars, motorbikes, and commuter bicycles along the village highway + parked roadside vehicles. */
export function buildTrafficAndParkedVehicles(scene: THREE.Scene): MovingVehicle[] {
  const vehicles: MovingVehicle[] = [];

  const spawnCar = (x: number, dir: 1 | -1, bodyCol: string, laneZ: number, speed: number, isPickup: boolean) => {
    const res = buildRealisticCar({
      bodyColor: bodyCol,
      variant: isPickup ? 'pickup' : 'sedan',
      facing: 1,
      withPointHeadlight: true,
    });
    res.group.position.set(x, 0, laneZ);
    res.group.scale.x = dir;
    scene.add(res.group);
    vehicles.push({ group: res.group, wheels: res.wheels, headlight: res.headlight, x, dir, speed, laneZ, minX: -108, maxX: 122 });
  };

  const spawnMotorbike = (x: number, dir: 1 | -1, bodyCol: string, jacketCol: string, laneZ: number, speed: number) => {
    const res = buildRealisticMotorcycle({
      bodyColor: bodyCol,
      withRider: true,
      riderJacket: jacketCol,
      helmetColor: '#f8fafc',
      facing: 1,
    });
    res.group.position.set(x, 0, laneZ);
    res.group.scale.x = dir;
    scene.add(res.group);
    vehicles.push({ group: res.group, wheels: res.wheels, headlight: res.headlight, x, dir, speed, laneZ, minX: -108, maxX: 122 });
  };

  const spawnVillagerBike = (x: number, dir: 1 | -1, shirtCol: string, laneZ: number, speed: number) => {
    const g = new THREE.Group();
    const wheels: THREE.Group[] = [];
    [-0.42, 0.42].forEach((wx) => {
      const w = makeWheel(0.24, 0.06);
      w.position.set(wx, 0.24, 0);
      g.add(w);
      wheels.push(w);
    });
    addPart(g, 0.72, 0.06, 0.06, '#0f766e', 0, 0.56, 0);
    addPart(g, 0.26, 0.52, 0.22, shirtCol, -0.05, 0.92, 0);
    addPart(g, 0.2, 0.2, 0.2, '#cf9970', 0, 1.28, 0);
    g.position.set(x, 0, laneZ);
    g.scale.x = dir;
    scene.add(g);
    vehicles.push({ group: g, wheels, x, dir, speed, laneZ, minX: -104, maxX: 98 });
  };

  // Moving village highway traffic (far lane z=3.45 going right, near lane z=4.55 going left)
  spawnCar(-85, 1, '#94a3b8', 3.45, 5.4, true); // silver pickup
  spawnCar(48, -1, '#0284c7', 4.65, 5.8, false); // blue sedan
  spawnMotorbike(-45, 1, '#dc2626', '#1e293b', 3.15, 6.6);
  spawnMotorbike(18, -1, '#16a34a', '#92400e', 4.35, 6.2);
  spawnMotorbike(72, -1, '#2563eb', '#be185d', 4.5, 6.8);
  spawnVillagerBike(-30, 1, '#f59e0b', 2.85, 3.2);
  spawnVillagerBike(60, -1, '#10b981', 2.9, 3.0);

  // Parked realistic motorbikes cleanly parked at the market & temple fair roadside
  [-58.8, -34.0, 27.6, 62.5].forEach((px, idx) => {
    const parked = buildRealisticMotorcycle({
      bodyColor: idx % 2 === 0 ? '#dc2626' : '#2563eb',
      withRider: false,
      facing: idx % 2 === 0 ? 1 : -1,
    }).group;
    parked.position.set(px, 0, -0.32);
    parked.rotation.y = idx % 2 === 0 ? 0.18 : -0.2;
    scene.add(parked);
  });

  return vehicles;
}

/** Builds the vibrant Isaan Wat Pa Temple Fair (งานวัด): rotating Ferris Wheel, connected string flags, game booths with vendors, and Morlam stage. */
export function buildTempleFairZone(scene: THREE.Scene): TempleFairController {
  // Festive brick-stone fairground plaza flooring (+59.5 .. +94.5) blending cleanly from Temple courtyard
  addPart(scene, 35.0, 0.06, 6.2, '#574c45', 77.0, 0.03, 0.2, 0.92);

  // 1) Giant Illuminated Rotating Ferris Wheel (ชิงช้าสวรรค์งานวัด x = 76, z = -3.4)
  const wheelCenterX = 76.0;
  const wheelCenterY = 4.65;
  const wheelZ = -3.4;
  // Supporting A-frame legs
  [-1.6, 1.6].forEach((dx) => {
    const leg = addPart(scene, 0.18, 5.2, 0.18, '#475569', wheelCenterX + dx * 0.62, 2.4, wheelZ, 0.5, 0.6);
    leg.rotation.z = dx > 0 ? 0.32 : -0.32;
  });

  const ferrisWheel = new THREE.Group();
  ferrisWheel.position.set(wheelCenterX, wheelCenterY, wheelZ);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(3.35, 0.09, 8, 28),
    new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#ca8a04', emissiveIntensity: 0.4, metalness: 0.5 })
  );
  ferrisWheel.add(rim);

  const gondolas: THREE.Group[] = [];
  const bulbs: THREE.Mesh[] = [];
  const gColors = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#ec4899'];
  const spokesCount = 10;
  for (let i = 0; i < spokesCount; i++) {
    const ang = (i / spokesCount) * Math.PI * 2;
    const spoke = addPart(ferrisWheel, 0.06, 6.65, 0.06, '#e2e8f0', 0, 0, 0, 0.4, 0.7);
    spoke.rotation.z = ang;

    const gx = Math.cos(ang) * 3.35;
    const gy = Math.sin(ang) * 3.35;
    const gon = new THREE.Group();
    gon.position.set(gx, gy, 0);
    addPart(gon, 0.58, 0.46, 0.48, gColors[i % gColors.length], 0, -0.34, 0, 0.45);
    addPart(gon, 0.62, 0.08, 0.5, '#fef08a', 0, -0.02, 0, 0.4);
    ferrisWheel.add(gon);
    gondolas.push(gon);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: gColors[i % gColors.length] })
    );
    bulb.position.set(gx * 0.92, gy * 0.92, 0.14);
    ferrisWheel.add(bulb);
    bulbs.push(bulb);
  }
  scene.add(ferrisWheel);

  // Grounded string-flag poles + catenary wire holding ALL triangular flags & carnival bulbs (no floating cones!)
  [62.8, 76.0, 91.2].forEach((px) => addPart(scene, 0.12, 4.95, 0.12, '#475569', px, 2.48, -1.35));
  const stringPts: THREE.Vector3[] = [];
  const flagCols = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#f472b6'];
  for (let fx = 62.8; fx <= 91.2; fx += 1.42) {
    const t = (fx - 62.8) / 28.4;
    const fy = 4.78 - Math.sin(t * Math.PI) * 0.42;
    stringPts.push(new THREE.Vector3(fx, fy, -1.35));
    const flag = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.34, 3),
      new THREE.MeshBasicMaterial({ color: flagCols[Math.floor(fx) % flagCols.length] })
    );
    flag.rotation.z = Math.PI;
    flag.position.set(fx, fy - 0.18, -1.35);
    scene.add(flag);

    if (Math.floor(fx) % 2 === 0) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 6, 6),
        new THREE.MeshBasicMaterial({ color: flagCols[(Math.floor(fx) + 2) % flagCols.length] })
      );
      b.position.set(fx, fy + 0.04, -1.31);
      scene.add(b);
      bulbs.push(b);
    }
  }
  const flagCord = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stringPts), 28, 0.02, 5, false),
    new THREE.MeshBasicMaterial({ color: '#1e293b' })
  );
  scene.add(flagCord);

  // 2) Balloon Dart Booth (65.5), Star-Plucking Soidao Booth (70.5), Luk Chin & Cotton Candy Booth (81.5) — with vendors & grounded signs!
  const fairStalls = [
    { x: 65.5, sign: 'ปาลูกโป่ง งานวัด', sub: 'ปาแตก 3 ลูก รับตุ๊กตา!', bg: '#be123c', border: '#fde047', shirt: '#fb7185' },
    { x: 70.5, sign: 'สอยดาวลุ้นโชค', sub: '20 บาท ลุ้นรางวัลใหญ่', bg: '#1d4ed8', border: '#facc15', shirt: '#38bdf8' },
    { x: 81.5, sign: 'ลูกชิ้น & สายไหม', sub: 'ปิ้งร้อนๆ งานวัดป่า', bg: '#b45309', border: '#fef08a', shirt: '#fbbf24' },
  ];
  fairStalls.forEach((st, idx) => {
    [-1.4, 1.4].forEach((dx) => {
      addPart(scene, 0.1, 2.75, 0.1, '#78350f', st.x + dx, 1.38, -0.78);
      addPart(scene, 0.1, 2.9, 0.1, '#78350f', st.x + dx, 1.45, -2.15);
    });
    addPart(scene, 3.2, 0.14, 1.85, idx % 2 === 0 ? '#dc2626' : '#0284c7', st.x, 2.78, -1.45, 0.6);
    addPart(scene, 2.7, 0.78, 0.72, '#78350f', st.x, 0.39, -1.12);
    // Grounded sign fascia panel right beneath roof beam
    addPart(scene, 2.34, 0.64, 0.05, '#1e1b4b', st.x, 2.26, -0.66);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.26, 0.58),
      new THREE.MeshBasicMaterial({ map: makeBannerTex(st.bg, st.border, '#ffffff', st.sign, st.sub) })
    );
    sign.position.set(st.x, 2.26, -0.62);
    scene.add(sign);

    // Friendly booth vendor behind counter
    const boothVendor = makeVillagerFigure(st.shirt, '#1e293b');
    boothVendor.position.set(st.x + 0.55, 0, -1.65);
    scene.add(boothVendor);

    if (idx === 0) {
      // Wall of colorful balloons on Balloon Dart booth!
      addPart(scene, 2.4, 1.3, 0.1, '#1e293b', st.x, 1.5, -2.05);
      for (let bx = -0.85; bx <= 0.85; bx += 0.42) {
        for (let by = 1.15; by <= 1.88; by += 0.36) {
          const bal = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 8, 8),
            new THREE.MeshStandardMaterial({ color: flagCols[Math.abs(Math.round((bx + by) * 5)) % flagCols.length] })
          );
          bal.position.set(st.x + bx, by, -1.96);
          scene.add(bal);
        }
      }
    } else if (idx === 1) {
      // Soidao tree branch with hanging golden paper prize stars!
      addPart(scene, 0.1, 1.8, 0.1, '#854d0e', st.x - 0.55, 0.9, -1.72);
      addPart(scene, 1.2, 0.08, 0.08, '#854d0e', st.x - 0.45, 1.65, -1.72);
      [-0.9, -0.6, -0.3, 0.0].forEach((ox, si) => {
        addPart(scene, 0.16, 0.16, 0.04, si % 2 === 0 ? '#facc15' : '#f472b6', st.x + ox, 1.38 + (si % 2) * 0.1, -1.68);
      });
    } else {
      // Warm grill + colorful pink/blue cotton candy cones on counter!
      addPart(scene, 0.85, 0.16, 0.45, '#334155', st.x - 0.55, 0.86, -1.1);
      ['#f472b6', '#38bdf8', '#fde047'].forEach((cc, ci) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({ color: cc }));
        puff.position.set(st.x + 0.15 + ci * 0.32, 1.0, -1.08);
        scene.add(puff);
      });
    }
  });

  // 3) Ramwong / Morlam Concert Stage (เวทีรำวง & หมอลำซิ่ง x = 87.8) + Lead Singer + 4 Glittering Dancers + Cheering Audience Below!
  const stgX = 87.8;
  addPart(scene, 8.2, 0.72, 2.7, '#3b2416', stgX, 0.36, -2.1); // wide raised stage deck
  addPart(scene, 8.2, 0.1, 2.74, '#facc15', stgX, 0.7, -2.1, 0.35, 0.4); // gold stage trim
  addPart(scene, 8.2, 2.8, 0.18, '#1e1b4b', stgX, 2.1, -3.35); // concert backdrop
  addPart(scene, 8.6, 0.22, 3.0, '#991b1b', stgX, 3.6, -2.1); // marquee roof
  const stageBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 0.96),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#581c87', '#facc15', '#fef08a', 'เวทีรำวง & หมอลำซิ่ง', 'งานบุญประจำปีวัดป่าบ้านทุ่ง') })
  );
  stageBanner.position.set(stgX, 2.75, -3.22);
  scene.add(stageBanner);

  // Twin outer concert speaker towers with dual circular woofer cones (well clear of dancers!)
  [-3.65, 3.65].forEach((sx) => {
    addPart(scene, 0.75, 1.75, 0.75, '#09090b', stgX + sx, 1.58, -1.9);
    [1.22, 1.95].forEach((cy) => {
      const woofer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.06, 14),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.5 })
      );
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(stgX + sx, cy, -1.5);
      scene.add(woofer);
    });
  });

  // Hanging concert disco wash bulbs along stage front canopy
  ['#f43f5e', '#facc15', '#22d3ee', '#a855f7'].forEach((col, bi) => {
    const spotBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: col })
    );
    spotBulb.position.set(stgX - 2.4 + bi * 1.6, 3.45, -0.75);
    scene.add(spotBulb);
  });

  const stageLights: THREE.PointLight[] = [
    new THREE.PointLight('#f43f5e', 5.5, 12, 1.1),
    new THREE.PointLight('#22d3ee', 5.5, 12, 1.1),
    new THREE.PointLight('#facc15', 6.5, 15, 1.0),
    new THREE.PointLight('#e879f9', 4.8, 12, 1.0),
  ];
  stageLights[0].position.set(66.5, 3.2, -0.5);
  stageLights[1].position.set(76.0, 4.4, -0.4);
  stageLights[2].position.set(87.8, 3.3, -0.8);
  stageLights[3].position.set(87.8, 2.8, -1.2);
  stageLights.forEach((l) => scene.add(l));

  const stageDancers: THREE.Group[] = [];
  const stageAudience: THREE.Group[] = [];
  const boothVendors: THREE.Group[] = [];
  [65.5, 70.5, 81.5].forEach((fx, fi) => {
    const v = makeVillagerFigure(['#fb7185', '#38bdf8', '#fbbf24'][fi], '#1e293b');
    v.position.set(fx - 0.55, 0, -1.65);
    scene.add(v);
    boothVendors.push(v);
  });

  const makeShowPerformer = (dressCol: string, plumeCol: string, isLeadSinger = false): THREE.Group => {
    const g = new THREE.Group();
    const legL = addPart(g, 0.1, 0.52, 0.1, '#dfb089', -0.07, 0.26, 0);
    const legR = addPart(g, 0.1, 0.52, 0.1, '#dfb089', 0.07, 0.26, 0);
    legL.name = 'legL';
    legR.name = 'legR';
    // Flared sparkling sequined mini-skirt + metallic gold belt + fitted bodice
    const skirt = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.42, 10),
      new THREE.MeshStandardMaterial({ color: dressCol, roughness: 0.28, metalness: 0.45 })
    );
    skirt.position.set(0, 0.62, 0);
    g.add(skirt);
    addPart(g, 0.28, 0.07, 0.2, '#facc15', 0, 0.78, 0, 0.3, 0.6); // gold sequin waist
    addPart(g, 0.28, 0.42, 0.2, dressCol, 0, 0.98, 0, 0.35, 0.35);
    const armL = addPart(g, 0.08, 0.44, 0.08, '#dfb089', -0.2, 1.0, 0);
    const armR = addPart(g, 0.08, 0.44, 0.08, '#dfb089', 0.2, 1.0, 0);
    armL.name = 'armL';
    armR.name = 'armR';
    // Head + long flowing dark hair + glamorous tall feathered Mor Lam showgirl crown!
    addPart(g, 0.24, 0.25, 0.22, '#e8bc96', 0, 1.36, 0);
    addPart(g, 0.28, 0.36, 0.14, '#111827', 0, 1.32, -0.08);
    addPart(g, 0.25, 0.1, 0.23, '#18181b', 0, 1.48, 0);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.3, 6),
      new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.7, roughness: 0.25 })
    );
    crown.position.set(0, 1.62, 0);
    const plume = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.24, 0.06),
      new THREE.MeshStandardMaterial({ color: plumeCol, emissive: plumeCol, emissiveIntensity: 0.25 })
    );
    plume.position.set(0, 1.72, -0.02);
    g.add(crown, plume);

    if (isLeadSinger) {
      // Chrome mic stand + silver microphone in front of singer!
      addPart(g, 0.04, 1.25, 0.04, '#e2e8f0', 0, 0.62, 0.26, 0.25, 0.8);
      addPart(g, 0.22, 0.04, 0.22, '#334155', 0, 0.02, 0.26, 0.4, 0.6);
      const micHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.8, roughness: 0.2 })
      );
      micHead.position.set(0, 1.26, 0.26);
      g.add(micHead);
    }
    return g;
  };

  // Lead Singer centered front on stage (index 0) + 4 Glittering Female Backup Dancers evenly across stage!
  const leadSinger = makeShowPerformer('#db2777', '#fde047', true);
  leadSinger.position.set(stgX, 0.72, -1.45);
  scene.add(leadSinger);
  stageDancers.push(leadSinger);

  [
    { x: stgX - 2.35, dress: '#f43f5e', plume: '#fdf2f8' },
    { x: stgX - 1.18, dress: '#06b6d4', plume: '#fef08a' },
    { x: stgX + 1.18, dress: '#a855f7', plume: '#fbcfe8' },
    { x: stgX + 2.35, dress: '#eab308', plume: '#ffffff' },
  ].forEach((dc) => {
    const d = makeShowPerformer(dc.dress, dc.plume, false);
    d.position.set(dc.x, 0.72, -2.05);
    scene.add(d);
    stageDancers.push(d);
  });

  // Lively Cheering Villager Audience Crowd watching & swaying below the stage!
  [
    { x: stgX - 3.1, z: -0.25, shirt: '#38bdf8', glow: '#f43f5e' },
    { x: stgX - 2.1, z: 0.05, shirt: '#fbbf24', glow: '' },
    { x: stgX - 1.05, z: -0.3, shirt: '#4ade80', glow: '#22d3ee' },
    { x: stgX + 0.05, z: 0.12, shirt: '#f472b6', glow: '' },
    { x: stgX + 1.15, z: -0.25, shirt: '#c084fc', glow: '#fde047' },
    { x: stgX + 2.2, z: 0.05, shirt: '#fb7185', glow: '' },
    { x: stgX + 3.15, z: -0.22, shirt: '#2dd4bf', glow: '#f43f5e' },
  ].forEach((aud) => {
    const v = makeVillagerFigure(aud.shirt, '#1e293b');
    if (aud.glow) {
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8),
        new THREE.MeshBasicMaterial({ color: aud.glow })
      );
      stick.position.set(-0.24, 1.18, 0.1);
      v.add(stick);
    }
    v.position.set(aud.x, 0, aud.z);
    scene.add(v);
    stageAudience.push(v);
  });

  // Notice banner shown across stage when fair cancels during Krasue lockdown
  const closedSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.85),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#450a0a', '#ef4444', '#fecaca', 'งดจัดงานวัดชั่วคราว', 'เตือนภัยผีกระสือ — ชาวบ้านเข้าบ้านก่อนมืด!') })
  );
  closedSign.position.set(76.0, 1.85, -0.55);
  closedSign.visible = false;
  scene.add(closedSign);

  return { ferrisWheel, gondolas, bulbs, stageLights, stageDancers, stageAudience, boothVendors, closedSign };
}

/** Builds School & Haunted Swing (-112), Welcome Arch (-104.5), Takian (-96.5), Show-huay Store (-89.5), Bang Fai (-67.5), PA Tower (-8.6), Granary (-11.4), Clinic (+96), Lotus Bridge, Morning Monk, Tani, and Saleng. */
export function buildExpandedVillageLife(scene: THREE.Scene, awningMat: THREE.Material): RuralActorsController {
  // 00) Ban Thung Primary School & Eerie Playground Swing (โรงเรียนประถมบ้านทุ่ง x = -112.5)
  addPart(scene, 5.8, 2.8, 2.2, '#e2e8f0', -113.5, 1.4, -2.4, 0.88);
  addPart(scene, 6.2, 0.16, 2.6, '#1e3a8a', -113.5, 2.95, -2.4, 0.7);
  addPart(scene, 2.0, 1.05, 0.08, '#14532d', -112.2, 1.55, -1.26, 0.8); // green chalkboard!
  const schSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.65),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#1e3a8a', '#facc15', '#ffffff', 'โรงเรียนบ้านทุ่งวิทยา', 'กระดานดำ & สนามเด็กเล่น') })
  );
  schSign.position.set(-113.5, 2.55, -1.24);
  scene.add(schSign);
  // Thai Flagpole + Swinging Playground Frame (-109.2)
  addPart(scene, 0.08, 4.6, 0.08, '#f8fafc', -109.8, 2.3, -1.4);
  addPart(scene, 0.55, 0.34, 0.03, '#dc2626', -109.5, 4.35, -1.4);
  addPart(scene, 0.55, 0.12, 0.04, '#1d4ed8', -109.5, 4.35, -1.39);
  [-109.1, -107.7].forEach((sx) => addPart(scene, 0.08, 2.2, 0.08, '#dc2626', sx, 1.1, -1.6));
  addPart(scene, 1.6, 0.08, 0.08, '#facc15', -108.4, 2.2, -1.6);
  const schoolSwing = new THREE.Group();
  schoolSwing.position.set(-108.4, 2.18, -1.6);
  addPart(schoolSwing, 0.03, 1.45, 0.03, '#94a3b8', -0.26, -0.72, 0);
  addPart(schoolSwing, 0.03, 1.45, 0.03, '#94a3b8', 0.26, -0.72, 0);
  addPart(schoolSwing, 0.62, 0.06, 0.28, '#92400e', 0, -1.46, 0);
  scene.add(schoolSwing);

  // 00B) Deep 2.5D Jae Tan's Village Grocery Store + Transparent Drink Chiller + Boonterm Kiosk (x = -89.5)
  addPart(scene, 5.0, 2.7, 0.16, '#fef3c7', -89.5, 1.35, -3.25, 0.6); // deep bright cream back wall
  addPart(scene, 5.0, 0.12, 2.2, '#cbd5e1', -89.5, 0.06, -2.2, 0.4); // store terrace floor
  [-91.85, -87.15].forEach((wx) => addPart(scene, 0.28, 2.75, 2.2, '#fde68a', wx, 1.38, -2.2, 0.75));
  addPart(scene, 5.4, 0.18, 2.6, '#0369a1', -89.5, 2.8, -2.05, 0.5); // blue corrugated awning roof
  const shopSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 0.72),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#0369a1', '#facc15', '#ffffff', 'ร้านเจ๊แตน โชห่วย', 'ถ่านไฟฉาย • ยาดม • น้ำแดง • บุญเติม') })
  );
  shopSign.position.set(-89.5, 2.52, -0.72);
  scene.add(shopSign);
  // Illuminated stocked snack shelves + transparent glass drink cooler visible inside the open storefront!
  addPart(scene, 2.2, 1.75, 0.42, '#78350f', -90.4, 0.92, -2.9, 0.65);
  ['#ef4444', '#facc15', '#22c55e', '#38bdf8'].forEach((pc, pi) => {
    addPart(scene, 0.34, 0.28, 0.22, pc, -91.1 + pi * 0.45, 1.45, -2.75, 0.35);
    addPart(scene, 0.34, 0.26, 0.22, pc, -91.1 + pi * 0.45, 0.95, -2.75, 0.35);
  });
  // Transparent glass village drink chiller (-88.4) showing glowing colored drinks inside
  addPart(scene, 1.25, 1.95, 0.55, '#e2e8f0', -88.4, 1.0, -2.85, 0.3);
  addPart(scene, 1.05, 1.55, 0.04, '#bae6fd', -88.4, 1.05, -2.6, 0.1);
  [-88.72, -88.4, -88.08].forEach((dx, di) => {
    addPart(scene, 0.16, 0.32, 0.16, ['#38bdf8', '#dc2626', '#22c55e'][di], dx, 1.38, -2.45, 0.3);
    addPart(scene, 0.16, 0.3, 0.16, '#f59e0b', dx, 0.85, -2.45, 0.3);
  });
  const sGlassMat = new THREE.MeshStandardMaterial({
    color: '#bae6fd',
    transparent: true,
    opacity: 0.24,
    roughness: 0.08,
    depthWrite: false,
  });
  const chillerGlass = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.03), sGlassMat);
  chillerGlass.position.set(-88.4, 1.05, -2.35);
  scene.add(chillerGlass);
  // Front hardwood counter + transparent glass sweet jar showcase!
  addPart(scene, 2.5, 0.85, 0.65, '#78350f', -89.9, 0.42, -1.25);
  const candyCase = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.38, 0.42), sGlassMat);
  candyCase.position.set(-90.1, 1.04, -1.22);
  scene.add(candyCase);
  ['#ef4444', '#22c55e', '#facc15'].forEach((jc, ji) => {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 10), new THREE.MeshStandardMaterial({ color: jc, roughness: 0.3 }));
    jar.position.set(-90.5 + ji * 0.4, 0.98, -1.22);
    scene.add(jar);
  });
  // Orange Boonterm top-up machine kiosk at front right of store!
  addPart(scene, 0.52, 1.55, 0.42, '#ea580c', -87.4, 0.78, -0.92, 0.4);
  addPart(scene, 0.36, 0.42, 0.06, '#7dd3fc', -87.4, 1.18, -0.7, 0.2);
  const shopVendor = makeVillagerFigure('#f472b6', '#1e293b');
  shopVendor.position.set(-89.9, 0, -1.9);
  scene.add(shopVendor);
  const inShopBulb = new THREE.PointLight('#ffffff', 3.6, 8, 1.0);
  inShopBulb.position.set(-89.5, 2.35, -1.7);
  const shopLight = new THREE.PointLight('#fde68a', 4.6, 13, 1.05);
  shopLight.position.set(-89.5, 2.5, 1.45);
  scene.add(inShopBulb, shopLight);

  // 00C) Deep 2.5D Ban Thung Health Clinic & Community Hall (อนามัยบ้านทุ่ง x = +96.0) with see-through glass reception!
  addPart(scene, 5.4, 2.9, 0.18, '#f8fafc', 96.0, 1.45, -3.35, 0.45); // clean clinical back wall
  addPart(scene, 5.4, 0.12, 2.2, '#e2e8f0', 96.0, 0.06, -2.3, 0.35);
  [93.45, 98.55].forEach((cx) => addPart(scene, 0.32, 2.9, 2.2, '#f1f5f9', cx, 1.45, -2.3, 0.55));
  addPart(scene, 5.8, 0.18, 2.7, '#0f766e', 96.0, 3.0, -2.25, 0.55);
  addPart(scene, 2.4, 0.85, 0.55, '#0f766e', 96.0, 0.44, -2.55, 0.45); // reception desk inside clinic
  addPart(scene, 1.6, 1.5, 0.35, '#ffffff', 97.4, 0.85, -2.95, 0.35); // glowing medicine cabinet inside
  const clinicGlass = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.2, 0.03), sGlassMat);
  clinicGlass.position.set(96.0, 1.25, -1.25);
  scene.add(clinicGlass);
  // Red medical cross emblem + Clinic banner
  addPart(scene, 0.55, 0.16, 0.06, '#dc2626', 96.0, 2.55, -1.16);
  addPart(scene, 0.16, 0.55, 0.06, '#dc2626', 96.0, 2.55, -1.16);
  const clinicSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.58),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#0f766e', '#fef08a', '#ffffff', 'รพ.สต. อนามัยบ้านทุ่ง', 'สมุดเวชระเบียน • ปฐมพยาบาล') })
  );
  clinicSign.position.set(96.0, 2.02, -1.14);
  scene.add(clinicSign);
  const inClinicLight = new THREE.PointLight('#ffffff', 3.4, 8, 1.0);
  inClinicLight.position.set(96.0, 2.45, -1.85);
  const clinicLight = new THREE.PointLight('#bae6fd', 4.4, 13, 1.05);
  clinicLight.position.set(96.0, 2.55, 1.45);
  scene.add(inClinicLight, clinicLight);

  // 00D) Wooden Footbridge & Blooming Lotus Pads in Village Pond (+21.8 .. +24.8)
  addPart(scene, 2.4, 0.12, 0.95, '#78502e', 23.2, 0.36, -1.6);
  [22.1, 24.3].forEach((bx) => addPart(scene, 0.12, 0.85, 0.12, '#4f311c', bx, 0.42, -1.2));
  [
    [22.4, -2.6, '#f472b6'],
    [23.7, -3.5, '#f8fafc'],
    [24.4, -2.4, '#fb7185'],
    [21.6, -4.1, '#f472b6'],
  ].forEach(([lx, lz, lcol]) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 10), new THREE.MeshStandardMaterial({ color: '#15803d' }));
    pad.position.set(lx as number, 0.06, lz as number);
    const lotus = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 7), new THREE.MeshStandardMaterial({ color: lcol as string }));
    lotus.rotation.x = Math.PI;
    lotus.position.set(lx as number, 0.15, lz as number);
    scene.add(pad, lotus);
  });

  // 00E) Morning Almsgiving Monk (พระสงฆ์ออกบิณฑบาตยามเช้า 05:45 - 07:45 น.)
  const monkGrp = makeVillagerFigure('#d97706', '#b45309');
  // Black alms bowl cradled in front
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.4 }));
  bowl.position.set(0.22, 0.86, 0.14);
  monkGrp.add(bowl);
  monkGrp.position.set(-18, 0, 0.2);
  monkGrp.visible = false;
  scene.add(monkGrp);

  // 0A) Village Welcome Archway ("ยินดีต้อนรับสู่ บ้านทุ่งอีสาน" with giant Khaen at x = -104.5)
  [-105.6, -103.4].forEach((ax) => {
    addPart(scene, 0.28, 4.3, 0.28, '#593722', ax, 2.15, -0.8);
    for (let k = -1; k <= 1; k++) {
      addPart(scene, 0.05, 1.55 + Math.abs(k) * 0.25, 0.05, '#ca8a04', ax + k * 0.07, 2.4, -0.62);
    }
  });
  addPart(scene, 3.2, 0.22, 0.45, '#7f1d1d', -104.5, 4.3, -0.8);
  const welcomeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 0.72),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#14532d', '#eab308', '#fef08a', 'ยินดีต้อนรับ บ้านทุ่งอีสาน', 'วิถีถิ่น • ศรัทธา • บุญบั้งไฟ') })
  );
  welcomeSign.position.set(-104.5, 3.72, -0.62);
  scene.add(welcomeSign);

  // 0B) Traditional Rocket Festival Launch Pad (ซุ้มบั้งไฟพญานาค x = -67.5)
  addPart(scene, 2.6, 0.22, 1.6, '#78350f', -67.5, 0.11, -1.65);
  [-68.3, -66.7].forEach((bx) => addPart(scene, 0.12, 3.8, 0.12, '#92400e', bx, 1.9, -1.85));
  addPart(scene, 2.2, 0.12, 0.12, '#eab308', -67.5, 3.3, -1.85);
  const rocket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 3.3, 10),
    new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.45 })
  );
  rocket.position.set(-67.5, 2.25, -1.7);
  rocket.rotation.z = -0.35;
  scene.add(rocket);
  const rocketCone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 10), new THREE.MeshStandardMaterial({ color: '#facc15' }));
  rocketCone.position.set(-66.95, 3.82, -1.7);
  rocketCone.rotation.z = -0.35;
  scene.add(rocketCone);
  const bfSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.52),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#7f1d1d', '#facc15', '#fef08a', 'ลานบุญบั้งไฟบ้านทุ่ง') })
  );
  bfSign.position.set(-67.5, 3.3, -1.74);
  scene.add(bfSign);

  // 0C) Village PA Loudspeaker Broadcast Tower (หอกระจายข่าวผู้ใหญ่บ้าน x = -8.6, clear of big stilt house)
  [-8.8, -8.4].forEach((tx) => addPart(scene, 0.1, 6.2, 0.1, '#64748b', tx, 3.1, -1.45, 0.5, 0.6));
  addPart(scene, 0.7, 0.12, 0.4, '#94a3b8', -8.6, 5.75, -1.45);
  [-1, 1].forEach((side) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 8, 1, true), new THREE.MeshStandardMaterial({ color: '#e2e8f0', side: THREE.DoubleSide }));
    horn.rotation.z = side * (Math.PI / 2.2);
    horn.position.set(-8.6 + side * 0.4, 5.95, -1.4);
    scene.add(horn);
  });
  const paSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.46),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#1e293b', '#eab308', '#fef08a', 'หอกระจายข่าวหมู่บ้าน') })
  );
  paSign.position.set(-8.6, 2.2, -1.22);
  scene.add(paSign);

  // 0D) Elevated Isaan Wooden Rice Granary (ยุ้งฉางข้าวอีสาน x = -11.4)
  [-12.4, -10.4].forEach((gx) => {
    addPart(scene, 0.2, 2.5, 0.2, '#3b2416', gx, 1.25, -2.0);
    addPart(scene, 0.2, 2.5, 0.2, '#3b2416', gx, 1.25, -3.1);
  });
  addPart(scene, 2.4, 1.35, 1.4, '#78502e', -11.4, 2.15, -2.55);
  addPart(scene, 2.8, 0.16, 1.85, '#92400e', -11.4, 3.05, -2.55);
  const redJar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.68, 12), new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.6 }));
  redJar.position.set(-9.9, 0.34, -1.75);
  scene.add(redJar);

  // 0E) Yellow Golden Shower Blossoms (ดอกคูณเหลืองอีสาน) along village roads
  [-88, -62, -23.5, 12.2, 58.2].forEach((kx) => {
    const trunk = addPart(scene, 0.18, 3.4, 0.18, '#473628', kx, 1.7, -3.1);
    void trunk;
    [[-0.35, 3.5], [0.35, 3.65], [0, 3.9]].forEach(([dx, dy]) => {
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 7), new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#ca8a04', emissiveIntensity: 0.22 }));
      bloom.position.set(kx + dx, dy, -2.95);
      scene.add(bloom);
    });
  });

  // 0F) Cozy Campfire & Grilled Fish Circle under Stilt House (-1.8, visible in festive nights!)
  const campfireGroup = new THREE.Group();
  const embers = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 7), new THREE.MeshBasicMaterial({ color: '#f97316' }));
  embers.position.set(0, 0.18, 0);
  campfireGroup.add(embers);
  const sitA = makeVillagerFigure('#38bdf8', '#1e293b');
  sitA.position.set(-0.62, 0, -0.05);
  const sitB = makeVillagerFigure('#f472b6', '#1e293b');
  sitB.position.set(0.62, 0, -0.05);
  campfireGroup.add(sitA, sitB);
  campfireGroup.position.set(-1.8, 0, -1.05);
  scene.add(campfireGroup);
  const campfireLight = new THREE.PointLight('#fb923c', 3.4, 8, 1.2);
  campfireLight.position.set(-1.8, 0.75, -0.85);
  scene.add(campfireLight);

  // 0G) Morlam Khaen Player seated on the Cozy Rice-Field Hut (เถียงนา x = -16.8)
  const khaenPlayer = makeVillagerFigure('#1e3a8a', '#0f172a', '#a16207');
  // Twin Khaen bamboo pipes held to mouth
  addPart(khaenPlayer, 0.06, 0.95, 0.12, '#eab308', 0.26, 1.32, 0.16);
  khaenPlayer.position.set(-16.8, 1.15, -3.55);
  scene.add(khaenPlayer);

  // 0H) Mysterious Nang Tani Banana-Tree Spirit (นางตานีดงกล้วย x = -20.5) — only glows at eerie lockdown night!
  const taniSpirit = makeVillagerFigure('#16a34a', '#15803d');
  taniSpirit.position.set(-20.5, 0.25, -2.4);
  taniSpirit.visible = false;
  scene.add(taniSpirit);
  const taniLight = new THREE.PointLight('#4ade80', 0, 7, 1.3);
  taniLight.position.set(-20.5, 1.4, -2.0);
  scene.add(taniLight);

  // 0I) Sidecar Ice-Cream Saleng Motorcycle (รถซาเล้งขายไอติมกะทิ)
  const salengGrp = new THREE.Group();
  const salengWheels: THREE.Group[] = [];
  [-0.45, 0.45].forEach((wx) => {
    const w = makeWheel(0.22, 0.1);
    w.position.set(wx, 0.22, 0);
    salengGrp.add(w);
    salengWheels.push(w);
  });
  addPart(salengGrp, 0.95, 0.26, 0.24, '#0284c7', 0, 0.46, 0);
  addPart(salengGrp, 0.85, 0.48, 0.72, '#e2e8f0', 0.05, 0.56, 0.56); // ice-cream chest sidecar!
  addPart(salengGrp, 0.06, 1.2, 0.06, '#cbd5e1', 0.05, 1.25, 0.56);
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.28, 8), new THREE.MeshStandardMaterial({ color: '#f43f5e', roughness: 0.5 }));
  umbrella.position.set(0.05, 1.88, 0.56);
  salengGrp.add(umbrella);
  addPart(salengGrp, 0.3, 0.52, 0.22, '#facc15', -0.05, 0.88, 0); // driver
  salengGrp.position.set(12, 0, 3.0);
  scene.add(salengGrp);

  // 0J) Golden Fireflies twinkling over rice paddies at dusk/night!
  const fireflies: RuralActorsController['fireflies'] = [];
  [-20.2, -17.5, -14.8, -11.5, 13.0, 16.5, 19.2].forEach((fx, fi) => {
    const ff = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0.8 })
    );
    const fy = 0.85 + (fi % 3) * 0.42;
    ff.position.set(fx, fy, -2.1 - (fi % 2) * 0.6);
    scene.add(ff);
    fireflies.push({ mesh: ff, baseX: fx, baseY: fy, phase: fi * 1.1 });
  });

  // 1) Mysterious Twin Takian Trees & 7-Color Sacred Cloth Shrine (ต้นตะเคียนคู่ x = -96.5)
  [-97.3, -95.7].forEach((tx, idx) => {
    addPart(scene, 0.75, 8.6, 0.72, '#3d2817', tx, 4.3, -2.1 - idx * 0.25, 0.95);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 3.2, 7),
      new THREE.MeshStandardMaterial({ color: '#14331d', roughness: 0.9 })
    );
    canopy.position.set(tx, 8.2, -2.1 - idx * 0.25);
    scene.add(canopy);
    // 7-Color sacred Thai cloths wrapped tightly around ancient trunks!
    ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'].forEach((col, ci) => {
      addPart(scene, 0.84, 0.11, 0.8, col, tx, 1.35 + ci * 0.14, -2.1 - idx * 0.25, 0.5);
    });
  });
  // Small Takian altar table + eerie green-gold candle light
  addPart(scene, 1.6, 0.75, 0.85, '#593722', -96.5, 0.38, -1.25);
  const takianSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.65),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#14532d', '#eab308', '#fef08a', 'ศาลเจ้าแม่ตะเคียนทอง', 'ผ้าเจ็ดสี • สิ่งศักดิ์สิทธิ์ปากหมู่บ้าน') })
  );
  takianSign.position.set(-96.5, 2.75, -1.55);
  scene.add(takianSign);
  const takianLight = new THREE.PointLight('#4ade80', 3.8, 12, 1.15);
  takianLight.position.set(-96.5, 2.0, -0.5);
  scene.add(takianLight);

  // Floating ghostly wisps around Twin Takian Shrine & relocated Cemetery (+108..+124)
  const wisps: RuralActorsController['wisps'] = [];
  [-97.2, -95.4, 111.0, 116.5, 120.5, 123.5].forEach((wx, idx) => {
    const wisp = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: wx < 0 ? '#fef08a' : '#bef264', transparent: true, opacity: 0.72 })
    );
    const baseY = 1.2 + (idx % 3) * 0.55;
    wisp.position.set(wx, baseY, -1.35);
    scene.add(wisp);
    wisps.push({ mesh: wisp, baseX: wx, baseY, phase: idx * 1.4 });
  });

  // 2) Rural Songthaew Bus Shelters (-82.0 Pak Soi, +61.4 Wat Pa / Temple Fair) — grounded benches & clean clearance!
  [-82.0, 61.4].forEach((sx, si) => {
    [-1.35, 1.35].forEach((dx) => {
      addPart(scene, 0.12, 2.55, 0.12, '#475569', sx + dx, 1.28, -0.85);
      addPart(scene, 0.12, 2.65, 0.12, '#475569', sx + dx, 1.32, -2.05);
    });
    addPart(scene, 3.1, 0.14, 1.6, '#1d4ed8', sx, 2.6, -1.45); // blue shelter roof
    // Grounded wooden waiting bench + legs
    addPart(scene, 2.3, 0.12, 0.5, '#92400e', sx, 0.52, -1.55);
    [-0.95, 0.95].forEach((bx) => addPart(scene, 0.14, 0.5, 0.42, '#4f311c', sx + bx, 0.25, -1.55));
    // Fascia signboard mounted flush onto front roof edge
    addPart(scene, 2.1, 0.56, 0.05, '#0f172a', sx, 2.66, -0.64);
    const stopSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.04, 0.5),
      new THREE.MeshBasicMaterial({ map: makeBannerTex('#1e3a8a', '#facc15', '#ffffff', si === 0 ? 'ท่ารถสองแถวบ้านทุ่ง' : 'ป้ายรถวัดป่า-งานวัด') })
    );
    stopSign.position.set(sx, 2.66, -0.6);
    scene.add(stopSign);
    const sl = new THREE.PointLight('#fed7aa', 3.0, 9, 1.2);
    sl.position.set(sx, 2.25, -0.75);
    scene.add(sl);
  });
  // Sleek roadside bus-stop sign pole at Market Entrance (-24.5)
  addPart(scene, 0.1, 2.5, 0.1, '#94a3b8', -24.5, 1.25, -0.75);
  const mBusSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.48),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#1e3a8a', '#facc15', '#ffffff', 'ป้ายรถตลาดสด') })
  );
  mBusSign.position.set(-24.5, 2.35, -0.68);
  scene.add(mBusSign);

  // 3) 4 NEW Big Market Stalls expanding the fresh market (-57.8 Somtam, -48.2 Fruits/Veg, -40.0 Fabric, -32.0 Shaved Ice/Coffee)
  const extraStalls = [
    { x: -57.8, sign: 'ส้มตำครกไม้ แม่ลำไย', sub: 'ไก่ย่าง • ข้าวเหนียว • ปูปลาร้า', bg: '#9a3412', border: '#fde047', counter: '#78350f' },
    { x: -48.2, sign: 'แผงผัก-ผลไม้สด', sub: 'กล้วย • มะละกอ • พริกแห้ง', bg: '#15803d', border: '#fef08a', counter: '#593722' },
    { x: -40.0, sign: 'ผ้าขาวม้า & พวงมาลัย', sub: 'ผ้าถุงลายไทย • ดอกไม้ไหว้พระ', bg: '#86198f', border: '#facc15', counter: '#6b4226' },
    { x: -32.0, sign: 'กาแฟโบราณ & น้ำแข็งไส', sub: 'ชาเย็น • โอเลี้ยง • ขนมหวาน', bg: '#0f766e', border: '#fde68a', counter: '#475569' },
  ];
  extraStalls.forEach((st, idx) => {
    [-1.7, 1.7].forEach((dx) => {
      addPart(scene, 0.1, 2.2, 0.1, '#593722', st.x + dx, 1.1, -0.45);
      addPart(scene, 0.1, 3.0, 0.1, '#4f311c', st.x + dx, 1.5, -2.0);
    });
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.1), awningMat);
    awning.position.set(st.x, 2.75, -1.25);
    awning.rotation.x = -1.05;
    scene.add(awning);
    addPart(scene, 3.1, 0.82, 0.82, st.counter, st.x, 0.41, -1.12);
    // Wooden backing board + shop sign mounted strictly in front of awning edge (zero clipping!)
    addPart(scene, 2.16, 0.62, 0.05, '#3b2416', st.x, 2.02, -0.25);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 0.56),
      new THREE.MeshBasicMaterial({ map: makeBannerTex(st.bg, st.border, '#ffffff', st.sign, st.sub) })
    );
    sign.position.set(st.x, 2.02, -0.21);
    scene.add(sign);
    // Vendor figure behind counter
    const vendor = makeVillagerFigure(['#fb923c', '#22c55e', '#c084fc', '#38bdf8'][idx], '#1e293b');
    vendor.position.set(st.x, 0, -1.78);
    scene.add(vendor);

    // Real recognizable Thai market merchandise on each stall counter (no plain square cubes!)
    if (idx === 0) {
      // Somtam & Grilled Chicken: Wooden Mortar & Pestle (ครกสาก), Kratib sticky rice basket, charcoal chicken grill!
      const mortar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.28, 12), new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8 }));
      mortar.position.set(st.x - 0.82, 0.96, -1.06);
      scene.add(mortar);
      const pestle = addPart(scene, 0.05, 0.32, 0.05, '#d97706', st.x - 0.78, 1.14, -1.06, 0.7);
      pestle.rotation.z = -0.45;
      // Kratib bamboo sticky-rice basket
      const kratib = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.2, 10), new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.85 }));
      kratib.position.set(st.x - 0.35, 0.92, -1.04);
      scene.add(kratib);
      // Charcoal grill with glowing embers + golden roasted chicken skewers!
      addPart(scene, 0.88, 0.14, 0.42, '#334155', st.x + 0.55, 0.89, -1.08, 0.7);
      addPart(scene, 0.78, 0.04, 0.34, '#ea580c', st.x + 0.55, 0.97, -1.08, 0.4);
      [-0.22, 0.0, 0.22].forEach((gx) => {
        const chick = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.45 }));
        chick.scale.set(1.4, 0.75, 0.9);
        chick.position.set(st.x + 0.55 + gx, 1.02, -1.08);
        scene.add(chick);
      });
    } else if (idx === 1) {
      // Fresh Fruits & Vegetables: Hanging yellow banana hands, green watermelons, red papaya/tomato tray!
      addPart(scene, 0.8, 0.04, 0.04, '#cbd5e1', st.x - 0.75, 1.98, -0.75);
      [-0.95, -0.58].forEach((bx) => {
        for (let b = 0; b < 4; b++) {
          const ban = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.2, 6), new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.5 }));
          ban.rotation.z = -0.3 + b * 0.2;
          ban.position.set(st.x + bx + b * 0.045, 1.82, -0.75);
          scene.add(ban);
        }
      });
      // Striped round watermelons + woven basket with red chilies/tomatoes + cabbages
      [-0.65, -0.32].forEach((wx) => {
        const melon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.4 }));
        melon.position.set(st.x + wx, 0.98, -1.08);
        scene.add(melon);
      });
      const vegTray = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.85 }));
      vegTray.position.set(st.x + 0.52, 0.87, -1.08);
      scene.add(vegTray);
      [[-0.1, '#ef4444'], [0.06, '#ef4444'], [0.16, '#84cc16'], [-0.02, '#f97316']].forEach(([ox, col], vi) => {
        const veg = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: col as string, roughness: 0.5 }));
        veg.position.set(st.x + 0.52 + (ox as number), 0.96, -1.08 + (vi % 2) * 0.08);
        scene.add(veg);
      });
    } else if (idx === 2) {
      // Pha Khao Ma & Marigold/Jasmine Garlands: Stacked colorful cylindrical fabric bolts + hanging circular flower garlands!
      ['#dc2626', '#2563eb', '#9333ea', '#16a34a'].forEach((fc, fi) => {
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.55, 10), new THREE.MeshStandardMaterial({ color: fc, roughness: 0.75 }));
        roll.rotation.z = Math.PI / 2;
        roll.position.set(st.x - 0.6 + (fi % 2) * 0.06, 0.93 + Math.floor(fi / 2) * 0.18, -1.08);
        scene.add(roll);
      });
      // Garland display rack with marigold & white jasmine rings!
      addPart(scene, 0.95, 0.04, 0.04, '#78350f', st.x + 0.55, 1.52, -1.06);
      [-0.3, 0.0, 0.3].forEach((gx) => {
        addPart(scene, 0.05, 0.68, 0.05, '#78350f', st.x + 0.55 + gx, 1.16, -1.06);
        const garland = new THREE.Mesh(
          new THREE.TorusGeometry(0.12, 0.042, 8, 14),
          new THREE.MeshStandardMaterial({ color: gx === 0 ? '#f8fafc' : '#facc15', roughness: 0.4 })
        );
        garland.position.set(st.x + 0.55 + gx, 1.32, -1.02);
        scene.add(garland);
      });
    } else {
      // Ancient Iced Coffee & Shaved Ice: Stainless coffee boiler pots, iced orange Cha Yen cups with straws, syrup bottles & shaved-ice bowls!
      [-0.78, -0.48].forEach((px) => {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.36, 12), new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.7, roughness: 0.25 }));
        pot.position.set(st.x + px, 1.0, -1.12);
        scene.add(pot);
      });
      // Glasses of Cha Yen (orange Thai tea) & O-Liang (dark iced coffee) with straws!
      [[-0.08, '#f97316'], [0.18, '#292524']].forEach(([cx, col]) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.18, 10), new THREE.MeshStandardMaterial({ color: col as string, roughness: 0.3 }));
        cup.position.set(st.x + (cx as number), 0.91, -0.96);
        scene.add(cup);
        const straw = addPart(scene, 0.015, 0.14, 0.015, '#facc15', st.x + (cx as number) + 0.02, 1.03, -0.96);
        straw.rotation.z = -0.22;
      });
      // Shaved ice cone bowl + red & green Hale's syrup bottles!
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.08, 0.09, 12), new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
      bowl.position.set(st.x + 0.62, 0.86, -1.04);
      const iceDome = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.22, 10), new THREE.MeshStandardMaterial({ color: '#f43f5e', roughness: 0.35 }));
      iceDome.position.set(st.x + 0.62, 1.01, -1.04);
      scene.add(bowl, iceDome);
      [0.92, 1.08].forEach((bx, bi) => {
        const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.28, 8), new THREE.MeshStandardMaterial({ color: bi === 0 ? '#dc2626' : '#16a34a', roughness: 0.2 }));
        bot.position.set(st.x + bx, 0.96, -1.16);
        scene.add(bot);
      });
    }
  });

  // 4) Staggering Village Drunkard ("ลุงทิดขี้เมา") near Pak Soi (-77 .. -65)
  const drunkGroup = makeVillagerFigure('#64748b', '#1e293b', '#854d0e', '#15803d');
  drunkGroup.position.set(-71.0, 0, -0.35);
  scene.add(drunkGroup);

  // 5) 6 Animated Market Shoppers walking back & forth along the Big Market (-57 .. -26)
  const shopperDefs = [
    { baseX: -53.5, range: 3.4, speed: 0.95, shirt: '#f43f5e', z: -0.25 },
    { baseX: -46.0, range: 4.2, speed: 1.1, shirt: '#38bdf8', z: 0.15 },
    { baseX: -39.0, range: 3.8, speed: 0.88, shirt: '#a3e635', z: -0.2 },
    { baseX: -33.5, range: 3.6, speed: 1.05, shirt: '#fbbf24', z: 0.18 },
    { baseX: -29.5, range: 2.8, speed: 0.9, shirt: '#c084fc', z: -0.15 },
    { baseX: 73.0, range: 6.5, speed: 1.05, shirt: '#f472b6', z: -0.1 }, // Temple fair visitor!
  ];
  const shoppers = shopperDefs.map((sd, idx) => {
    const sg = makeVillagerFigure(sd.shirt, '#1e293b', idx % 2 === 0 ? '#a16207' : undefined);
    // Woven market basket on arm
    addPart(sg, 0.2, 0.2, 0.2, '#b45309', -0.28, 0.55, 0.12);
    sg.position.set(sd.baseX, 0, sd.z);
    scene.add(sg);
    return { group: sg, baseX: sd.baseX, range: sd.range, speed: sd.speed, phase: idx * 1.35 };
  });

  return {
    drunkGroup,
    drunkX: -71.0,
    drunkDir: 1,
    shoppers,
    wisps,
    fireflies,
    campfireGroup,
    campfireLight,
    khaenPlayer,
    taniSpirit,
    taniLight,
    saleng: { group: salengGrp, wheels: salengWheels, x: 12, dir: -1 },
    schoolSwing,
    morningMonk: { group: monkGrp, x: -18, dir: 1 },
  };
}

/** Updates all moving vehicles, Songthaew, Rot Hae, Temple Fair & Rural actors smoothly reacting to current VillageMood! */
export function animateIsaanWorldLife(
  dt: number,
  clock: number,
  gameMinutes: number,
  isDay: boolean,
  isNight: boolean,
  mood: VillageMood,
  rotHae: RotHaeController,
  songthaew: SongthaewController,
  vehicles: MovingVehicle[],
  fair: TempleFairController,
  rural: RuralActorsController
): void {
  const isFestive = mood === 'festive';
  const isLockdown = mood === 'lockdown';

  // 1) Rot Hae ONLY runs during 'festive' village life — canceled once Krasue rumors & outbreak begin!
  rotHae.group.visible = isFestive;
  rotHae.dancers.forEach((d) => {
    d.group.visible = isFestive;
  });
  rotHae.discoLight.intensity = isFestive ? 5.5 + Math.sin(clock * 14) * 2.5 : 0;
  if (isFestive) {
    const rotSpeed = 2.05;
    rotHae.x += rotHae.dir * rotSpeed * dt;
    if (rotHae.x > 91) rotHae.dir = -1;
    else if (rotHae.x < -94) rotHae.dir = 1;
    rotHae.group.position.x = rotHae.x;
    rotHae.group.scale.x = rotHae.dir;
    rotHae.banner.scale.x = rotHae.dir;
    rotHae.wheels.forEach((w) => (w.rotation.z -= 5.8 * dt));
    const beatIdx = Math.floor(clock * 4.4);
    const partyCols = ['#f43f5e', '#22d3ee', '#facc15', '#a855f7', '#4ade80'];
    rotHae.discoLight.color.set(partyCols[beatIdx % partyCols.length]);
    rotHae.ledMeshes.forEach((b, i) => {
      (b.material as THREE.MeshBasicMaterial).color.set(partyCols[(beatIdx + i) % partyCols.length]);
    });
    rotHae.dancers.forEach((d) => {
      d.group.position.x = rotHae.x + d.offsetX * rotHae.dir;
      d.group.position.y = Math.abs(Math.sin(clock * 7.2 + d.phase)) * 0.14;
      d.group.rotation.z = Math.sin(clock * 5.8 + d.phase) * 0.12;
      const armL = d.group.getObjectByName('armL');
      const armR = d.group.getObjectByName('armR');
      if (armL) armL.rotation.z = 1.9 + Math.sin(clock * 9.0 + d.phase) * 0.65;
      if (armR) armR.rotation.z = -1.9 - Math.cos(clock * 9.0 + d.phase) * 0.65;
    });
  }

  // 2) Songthaew stops running completely in lockdown ("ไม่มีรถวิ่ง หมู่บ้านก็เงียบ")!
  songthaew.group.visible = !isLockdown;
  if (!isLockdown) {
    const stops = [-82.0, -24.5, 61.4];
    if (songthaew.stopTimer > 0) {
      songthaew.stopTimer -= dt;
    } else {
      songthaew.x += songthaew.dir * 5.2 * dt;
      if (songthaew.x > 88) {
        songthaew.dir = -1;
        songthaew.lastStopX = 999;
      } else if (songthaew.x < -98) {
        songthaew.dir = 1;
        songthaew.lastStopX = 999;
      }
      for (const sx of stops) {
        if (Math.abs(songthaew.x - sx) < 0.25 && Math.abs(songthaew.lastStopX - sx) > 3) {
          songthaew.stopTimer = 3.6;
          songthaew.lastStopX = sx;
          break;
        }
      }
      songthaew.wheels.forEach((w) => (w.rotation.z -= 12 * dt));
    }
    songthaew.group.position.x = songthaew.x;
    songthaew.group.scale.x = songthaew.dir;
    songthaew.banner.scale.x = songthaew.dir;
    songthaew.headlight.intensity = isDay ? 0.5 : 4.2;
  } else {
    songthaew.headlight.intensity = 0;
  }
  songthaew.stopWaiters.forEach((w) => {
    w.group.visible = !isLockdown;
    if (!isLockdown) {
      const nearBus = Math.abs(songthaew.x - w.stopX) < 3.0 && songthaew.stopTimer > 0;
      w.group.position.z = THREE.MathUtils.lerp(w.group.position.z, nearBus ? 2.85 : 1.95, Math.min(1, dt * 4));
    }
  });

  // 3) ALL highway traffic stops completely during lockdown curfew — dead silent village!
  vehicles.forEach((v, idx) => {
    const visible = isFestive ? true : mood === 'uneasy' ? idx % 2 === 0 : false;
    v.group.visible = visible;
    if (!visible) return;
    v.x += v.dir * v.speed * dt;
    if (v.dir === 1 && v.x > 134) v.x = -126;
    else if (v.dir === -1 && v.x < -126) v.x = 134;
    v.group.position.x = v.x;
    v.wheels.forEach((w) => (w.rotation.z -= v.speed * 2.6 * dt));
    if (v.headlight) v.headlight.intensity = isDay ? 0.35 : 3.4;
  });

  rural.saleng.group.visible = isFestive;
  if (isFestive) {
    rural.saleng.x += rural.saleng.dir * 3.8 * dt;
    if (rural.saleng.x > 82) rural.saleng.dir = -1;
    else if (rural.saleng.x < -90) rural.saleng.dir = 1;
    rural.saleng.group.position.x = rural.saleng.x;
    rural.saleng.group.scale.x = rural.saleng.dir;
    rural.saleng.wheels.forEach((w) => (w.rotation.z -= 9.5 * dt));
  }

  // 4) Temple Fair shuts down completely in 'lockdown' — dark silent Ferris Wheel, empty stage & closed notice!
  fair.closedSign.visible = isLockdown;
  if (!isLockdown) {
    fair.ferrisWheel.rotation.z += (isFestive ? 0.28 : 0.1) * dt;
    fair.gondolas.forEach((g) => {
      g.rotation.z = -fair.ferrisWheel.rotation.z;
    });
  }
  fair.bulbs.forEach((b, i) => {
    const mat = b.material as THREE.MeshBasicMaterial;
    if (isLockdown) {
      mat.opacity = 0.12;
    } else {
      const on = Math.floor(clock * 4 + i) % 3 !== 0;
      mat.opacity = isFestive ? (on ? 1 : 0.35) : on ? 0.45 : 0.15;
    }
  });
  fair.stageLights.forEach((l, i) => {
    if (isLockdown) l.intensity = 0.25;
    else if (isFestive) l.intensity = (isDay ? 1.8 : 5.6) + Math.sin(clock * 5.2 + i * 2) * 2.0;
    else l.intensity = 1.4;
  });
  fair.stageDancers.forEach((d, idx) => {
    d.visible = isFestive;
    if (isFestive) {
      if (idx === 0) {
        // Lead Singer swaying expressively behind mic stand
        d.rotation.z = Math.sin(clock * 3.4) * 0.08;
        d.position.y = 0.72 + Math.abs(Math.sin(clock * 4.2)) * 0.05;
        const armL = d.getObjectByName('armL');
        const armR = d.getObjectByName('armR');
        if (armL) armL.rotation.z = 1.15 + Math.sin(clock * 5.0) * 0.35;
        if (armR) armR.rotation.z = -0.65 - Math.cos(clock * 4.5) * 0.25;
      } else {
        // 4 Pretty Backup Dancers performing synchronized Mor Lam choreography!
        d.rotation.z = Math.sin(clock * 5.5 + idx * 0.8) * 0.14;
        d.position.y = 0.72 + Math.abs(Math.sin(clock * 6.8 + idx * 0.8)) * 0.1;
        const armL = d.getObjectByName('armL');
        const armR = d.getObjectByName('armR');
        if (armL) armL.rotation.z = 1.0 + Math.sin(clock * 6.5 + idx) * 0.6;
        if (armR) armR.rotation.z = -1.0 - Math.cos(clock * 6.5 + idx) * 0.6;
      }
    }
  });
  fair.stageAudience.forEach((a, idx) => {
    a.visible = isFestive;
    if (isFestive) {
      a.position.y = Math.abs(Math.sin(clock * 5.2 + idx * 1.1)) * 0.08;
      a.rotation.z = Math.sin(clock * 3.2 + idx) * 0.07;
      const armL = a.getObjectByName('armL');
      const armR = a.getObjectByName('armR');
      if (armL) armL.rotation.z = 1.35 + Math.sin(clock * 6.0 + idx) * 0.45;
      if (armR) armR.rotation.z = -0.95 - Math.cos(clock * 6.0 + idx) * 0.45;
    }
  });
  fair.boothVendors.forEach((v) => {
    v.visible = !isLockdown;
  });

  // 5) Drunkard hides home during lockdown curfew; shoppers shrink in uneasy mode & vanish in lockdown!
  rural.drunkGroup.visible = !isLockdown;
  if (!isLockdown) {
    rural.drunkX += rural.drunkDir * 0.95 * dt;
    if (rural.drunkX > -65) rural.drunkDir = -1;
    else if (rural.drunkX < -77) rural.drunkDir = 1;
    rural.drunkGroup.position.x = rural.drunkX;
    rural.drunkGroup.rotation.z = Math.sin(clock * 3.1) * 0.18;
    rural.drunkGroup.position.y = Math.abs(Math.sin(clock * 4.0)) * 0.04;
  }

  rural.shoppers.forEach((s, idx) => {
    const show = isFestive ? true : mood === 'uneasy' ? idx % 2 === 0 : false;
    s.group.visible = show;
    if (!show) return;
    const sx = s.baseX + Math.sin(clock * 0.45 * s.speed + s.phase) * s.range;
    const dir = Math.cos(clock * 0.45 * s.speed + s.phase) >= 0 ? 1 : -1;
    s.group.position.x = sx;
    s.group.scale.x = dir;
    s.group.position.y = Math.abs(Math.sin(clock * 5.2 + s.phase)) * 0.03;
  });

  // 6) Campfire circle & Khaen player active during 'festive', gone when rumors/outbreak strike!
  rural.campfireGroup.visible = isFestive;
  rural.campfireLight.intensity = isFestive ? 3.2 + Math.sin(clock * 9) * 0.6 : 0;
  rural.khaenPlayer.visible = isFestive;
  if (isFestive) {
    rural.khaenPlayer.rotation.z = Math.sin(clock * 3.2) * 0.08;
  }

  // 7) Fireflies twinkle above paddies at night; Tani banana-tree spirit appears eerily at night during uneasy/lockdown!
  rural.fireflies.forEach((ff) => {
    ff.mesh.visible = isNight || !isDay;
    if (ff.mesh.visible) {
      ff.mesh.position.x = ff.baseX + Math.sin(clock * 1.4 + ff.phase) * 0.6;
      ff.mesh.position.y = ff.baseY + Math.sin(clock * 2.1 + ff.phase) * 0.35;
      (ff.mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + (Math.sin(clock * 4.5 + ff.phase) + 1) * 0.35;
    }
  });
  const showTani = isNight && mood !== 'festive';
  rural.taniSpirit.visible = showTani;
  rural.taniLight.intensity = showTani ? 2.2 + Math.sin(clock * 4) * 0.6 : 0;

  // 8) Ghostly floating wisps around Twin Takian Shrine & Cemetery
  rural.wisps.forEach((w) => {
    w.mesh.position.x = w.baseX + Math.sin(clock * 1.1 + w.phase) * 0.45;
    w.mesh.position.y = w.baseY + Math.sin(clock * 1.9 + w.phase) * 0.35;
  });

  // 9) Haunted school swing gently rocks on its own in uneasy/lockdown nights!
  rural.schoolSwing.rotation.x =
    isNight && mood !== 'festive' ? Math.sin(clock * 2.2) * 0.28 : Math.sin(clock * 0.9) * 0.03;

  // 10) Morning almsgiving monk (พระสงฆ์ออกบิณฑบาตช่วง 05:30 - 07:45 น.)
  const hr = gameMinutes / 60;
  const isAlmsTime = hr >= 5.5 && hr <= 7.75;
  rural.morningMonk.group.visible = isAlmsTime;
  if (isAlmsTime) {
    rural.morningMonk.x += rural.morningMonk.dir * 1.45 * dt;
    if (rural.morningMonk.x > 24) rural.morningMonk.dir = -1;
    else if (rural.morningMonk.x < -24) rural.morningMonk.dir = 1;
    rural.morningMonk.group.position.x = rural.morningMonk.x;
    rural.morningMonk.group.scale.x = rural.morningMonk.dir;
    rural.morningMonk.group.position.y = Math.abs(Math.sin(clock * 4.2)) * 0.03;
  }
}
