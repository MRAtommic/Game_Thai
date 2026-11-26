import * as THREE from 'three';

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

export interface TempleFairController {
  ferrisWheel: THREE.Group;
  gondolas: THREE.Group[];
  bulbs: THREE.Mesh[];
  stageLights: THREE.PointLight[];
  stageDancers: THREE.Group[];
}

export interface RuralActorsController {
  drunkGroup: THREE.Group;
  drunkX: number;
  drunkDir: 1 | -1;
  shoppers: { group: THREE.Group; baseX: number; range: number; speed: number; phase: number }[];
  wisps: { mesh: THREE.Mesh; baseX: number; baseY: number; phase: number }[];
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
    const g = new THREE.Group();
    const wheels: THREE.Group[] = [];
    if (isPickup) {
      addPart(g, 3.3, 0.45, 1.38, bodyCol, 0, 0.52, 0, 0.4, 0.3);
      addPart(g, 1.4, 0.58, 1.28, bodyCol, 0.25, 1.0, 0, 0.4, 0.25);
      addPart(g, 0.9, 0.42, 1.3, '#93c5fd', 0.28, 1.02, 0, 0.2, 0.4);
    } else {
      addPart(g, 3.2, 0.5, 1.35, bodyCol, 0, 0.52, 0, 0.35, 0.35);
      addPart(g, 1.75, 0.52, 1.24, bodyCol, -0.1, 1.0, 0, 0.35, 0.3);
      addPart(g, 1.2, 0.38, 1.26, '#7dd3fc', -0.08, 1.02, 0, 0.2, 0.45);
    }
    [-1.02, 1.02].forEach((wx) => {
      const w = makeWheel(0.26, 0.16);
      w.position.set(wx, 0.26, 0.68);
      g.add(w);
      wheels.push(w);
    });
    const hl = new THREE.PointLight('#fef9c3', 3.5, 9, 1.3);
    hl.position.set(1.8, 0.6, 0.2);
    g.add(hl);
    g.position.set(x, 0, laneZ);
    g.scale.x = dir;
    scene.add(g);
    vehicles.push({ group: g, wheels, headlight: hl, x, dir, speed, laneZ, minX: -108, maxX: 122 });
  };

  const spawnMotorbike = (x: number, dir: 1 | -1, bodyCol: string, jacketCol: string, laneZ: number, speed: number) => {
    const g = new THREE.Group();
    const wheels: THREE.Group[] = [];
    [-0.45, 0.45].forEach((wx) => {
      const w = makeWheel(0.22, 0.1);
      w.position.set(wx, 0.22, 0);
      g.add(w);
      wheels.push(w);
    });
    addPart(g, 0.95, 0.28, 0.24, bodyCol, 0, 0.48, 0, 0.4, 0.3);
    addPart(g, 0.12, 0.52, 0.34, '#cbd5e1', 0.36, 0.68, 0, 0.4, 0.6); // handlebar
    // Rider + helmet
    addPart(g, 0.32, 0.56, 0.24, jacketCol, -0.06, 0.88, 0);
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
    );
    helmet.position.set(-0.02, 1.28, 0);
    g.add(helmet);
    const hl = new THREE.PointLight('#fef08a', 2.6, 7.5, 1.4);
    hl.position.set(0.68, 0.68, 0.15);
    g.add(hl);
    g.position.set(x, 0, laneZ);
    g.scale.x = dir;
    scene.add(g);
    vehicles.push({ group: g, wheels, headlight: hl, x, dir, speed, laneZ, minX: -108, maxX: 122 });
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

  // Parked motorbikes & bicycles cleanly parked at the market & temple fair roadside
  [-58.8, -34.0, 27.6, 62.5].forEach((px, idx) => {
    const parked = new THREE.Group();
    [-0.38, 0.38].forEach((wx) => {
      const w = makeWheel(0.2, 0.08);
      w.position.set(wx, 0.2, 0);
      parked.add(w);
    });
    addPart(parked, 0.85, 0.26, 0.22, idx % 2 === 0 ? '#dc2626' : '#2563eb', 0, 0.45, 0, 0.4, 0.35);
    addPart(parked, 0.1, 0.46, 0.3, '#cbd5e1', 0.32, 0.62, 0, 0.4, 0.6);
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

  // 3) Ramwong / Morlam Fair Stage (เวทีรำวงงานวัด x = 87.8) + 4 Dancers!
  const stgX = 87.8;
  addPart(scene, 6.2, 0.72, 2.6, '#3b2416', stgX, 0.36, -2.1); // wooden stage deck
  addPart(scene, 6.2, 2.6, 0.18, '#1e1b4b', stgX, 2.0, -3.25); // backdrop
  addPart(scene, 6.6, 0.18, 2.8, '#991b1b', stgX, 3.45, -2.1); // canopy
  const stageBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.9),
    new THREE.MeshBasicMaterial({ map: makeBannerTex('#581c87', '#facc15', '#fef08a', 'เวทีรำวง & หมอลำซิ่ง', 'งานบุญประจำปีวัดป่าบ้านทุ่ง') })
  );
  stageBanner.position.set(stgX, 2.6, -3.14);
  scene.add(stageBanner);

  // Twin stage speaker stacks
  [-2.6, 2.6].forEach((sx) => addPart(scene, 0.65, 1.5, 0.65, '#09090b', stgX + sx, 1.48, -1.65));

  const stageLights: THREE.PointLight[] = [
    new THREE.PointLight('#f43f5e', 5.5, 12, 1.1),
    new THREE.PointLight('#22d3ee', 5.5, 12, 1.1),
    new THREE.PointLight('#facc15', 5.5, 14, 1.0),
  ];
  stageLights[0].position.set(66.5, 3.2, -0.5);
  stageLights[1].position.set(76.0, 4.4, -0.4);
  stageLights[2].position.set(87.8, 3.4, -0.3);
  stageLights.forEach((l) => scene.add(l));

  const stageDancers: THREE.Group[] = [];
  [85.6, 86.9, 88.6, 89.8].forEach((dx, idx) => {
    const d = makeVillagerFigure(flagCols[idx], '#1e293b');
    d.position.set(dx, idx % 2 === 0 ? 0.72 : 0, idx % 2 === 0 ? -1.8 : -0.75);
    scene.add(d);
    stageDancers.push(d);
  });

  return { ferrisWheel, gondolas, bulbs, stageLights, stageDancers };
}

/** Builds Takian Twin Trees Shrine (-96.5), Bus Stops (-82, +26), 4 new Big Market stalls, Drunk walker, and 6 Market Shoppers. */
export function buildExpandedVillageLife(scene: THREE.Scene, awningMat: THREE.Material): RuralActorsController {
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

  // Floating ghostly wisps around Takian shrine & relocated Cemetery (+98..+115)
  const wisps: RuralActorsController['wisps'] = [];
  [-97.2, -95.4, 102.0, 107.5, 111.2, 114.0].forEach((wx, idx) => {
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
    // Props on table
    addPart(scene, 0.45, 0.22, 0.4, idx === 0 ? '#ca8a04' : idx === 1 ? '#16a34a' : idx === 2 ? '#db2777' : '#38bdf8', st.x - 0.5, 0.92, -1.08);
    addPart(scene, 0.42, 0.24, 0.38, idx === 0 ? '#dc2626' : '#facc15', st.x + 0.55, 0.94, -1.08);
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

  return { drunkGroup, drunkX: -71.0, drunkDir: 1, shoppers, wisps };
}

/** Updates all moving vehicles, Songthaew bus stops, Rot Hae dancers/lights, Ferris wheel, drunk walker & market shoppers. */
export function animateIsaanWorldLife(
  dt: number,
  clock: number,
  isDay: boolean,
  rotHae: RotHaeController,
  songthaew: SongthaewController,
  vehicles: MovingVehicle[],
  fair: TempleFairController,
  rural: RuralActorsController
): void {
  // 1) Rot Hae slow cruise + flashing neon LEDs + crowd dancing & walking along!
  const rotSpeed = 2.05;
  rotHae.x += rotHae.dir * rotSpeed * dt;
  if (rotHae.x > 91) rotHae.dir = -1;
  else if (rotHae.x < -94) rotHae.dir = 1;
  rotHae.group.position.x = rotHae.x;
  rotHae.group.scale.x = rotHae.dir;
  // Counter-flip banner text so Thai signage never mirrors backward when driving left
  rotHae.banner.scale.x = rotHae.dir;
  rotHae.wheels.forEach((w) => (w.rotation.z -= 5.8 * dt));
  // Beat-synced strobe colors at 132 BPM
  const beatIdx = Math.floor(clock * 4.4);
  const partyCols = ['#f43f5e', '#22d3ee', '#facc15', '#a855f7', '#4ade80'];
  rotHae.discoLight.color.set(partyCols[beatIdx % partyCols.length]);
  rotHae.discoLight.intensity = 5.5 + Math.sin(clock * 14) * 2.5;
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

  // 2) Songthaew route with stops at -82 (Pak Soi), -24.5 (Market), +61.4 (Temple & Fair)
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
  // Waiting passengers step forward excitedly when Songthaew stops near them
  songthaew.stopWaiters.forEach((w) => {
    const nearBus = Math.abs(songthaew.x - w.stopX) < 3.0 && songthaew.stopTimer > 0;
    w.group.position.z = THREE.MathUtils.lerp(w.group.position.z, nearBus ? 2.85 : 1.95, Math.min(1, dt * 4));
  });

  // 3) Ambient highway traffic (Cars, Motorbikes, Bicycles)
  for (const v of vehicles) {
    v.x += v.dir * v.speed * dt;
    if (v.x > v.maxX) v.x = v.minX;
    else if (v.x < v.minX) v.x = v.maxX;
    v.group.position.x = v.x;
    v.wheels.forEach((w) => (w.rotation.z -= v.speed * 2.6 * dt));
    if (v.headlight) v.headlight.intensity = isDay ? 0.35 : 3.4;
  }

  // 4) Temple Fair Ferris Wheel + blinking carnival bulbs + Morlam stage dancers
  fair.ferrisWheel.rotation.z += 0.28 * dt;
  fair.gondolas.forEach((g) => {
    g.rotation.z = -fair.ferrisWheel.rotation.z;
  });
  fair.bulbs.forEach((b, i) => {
    const on = Math.floor(clock * 4 + i) % 3 !== 0;
    (b.material as THREE.MeshBasicMaterial).opacity = on ? 1 : 0.35;
  });
  fair.stageLights.forEach((l, i) => {
    l.intensity = (isDay ? 1.8 : 5.6) + Math.sin(clock * 5.2 + i * 2) * 2.0;
  });
  fair.stageDancers.forEach((d, idx) => {
    d.rotation.z = Math.sin(clock * 4.5 + idx * 1.3) * 0.1;
    const armL = d.getObjectByName('armL');
    const armR = d.getObjectByName('armR');
    if (armL) armL.rotation.z = 0.8 + Math.sin(clock * 5.5 + idx) * 0.5;
    if (armR) armR.rotation.z = -0.8 - Math.cos(clock * 5.5 + idx) * 0.5;
  });

  // 5) Drunk villager staggering back and forth (-77 .. -65)
  rural.drunkX += rural.drunkDir * 0.95 * dt;
  if (rural.drunkX > -65) rural.drunkDir = -1;
  else if (rural.drunkX < -77) rural.drunkDir = 1;
  rural.drunkGroup.position.x = rural.drunkX;
  rural.drunkGroup.rotation.z = Math.sin(clock * 3.1) * 0.18;
  rural.drunkGroup.position.y = Math.abs(Math.sin(clock * 4.0)) * 0.04;

  // 6) Market & Fair shoppers strolling naturally
  rural.shoppers.forEach((s) => {
    const sx = s.baseX + Math.sin(clock * 0.45 * s.speed + s.phase) * s.range;
    const dir = Math.cos(clock * 0.45 * s.speed + s.phase) >= 0 ? 1 : -1;
    s.group.position.x = sx;
    s.group.scale.x = dir;
    s.group.position.y = Math.abs(Math.sin(clock * 5.2 + s.phase)) * 0.03;
  });

  // 7) Ghostly floating wisps around Twin Takian Shrine & Cemetery
  rural.wisps.forEach((w) => {
    w.mesh.position.x = w.baseX + Math.sin(clock * 1.1 + w.phase) * 0.45;
    w.mesh.position.y = w.baseY + Math.sin(clock * 1.9 + w.phase) * 0.35;
  });
}
