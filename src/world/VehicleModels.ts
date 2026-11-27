import * as THREE from 'three';

export interface MotorcycleOptions {
  bodyColor: string;
  withRider?: boolean;
  riderJacket?: string;
  winVest?: boolean;
  helmetColor?: string;
  facing?: 1 | -1;
}

export interface MotorcycleBuildResult {
  group: THREE.Group;
  wheels: THREE.Group[];
  headlight?: THREE.PointLight;
}

export interface CarOptions {
  bodyColor: string;
  roofColor?: string;
  variant?: 'sedan' | 'taxi' | 'pickup' | 'police';
  facing?: 1 | -1;
  withPointHeadlight?: boolean;
}

export interface CarBuildResult {
  group: THREE.Group;
  wheels: THREE.Group[];
  headlight?: THREE.PointLight;
  carBeaconBlue?: THREE.Mesh;
  carBeaconRed?: THREE.Mesh;
}

function addMesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  col: string,
  x: number,
  y: number,
  z: number,
  rough = 0.45,
  metal = 0.25,
  emissive?: string
): THREE.Mesh {
  const mat = emissive
    ? new THREE.MeshBasicMaterial({ color: col })
    : new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: metal });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = !emissive;
  m.receiveShadow = !emissive;
  parent.add(m);
  return m;
}

export function createVehicleWheel(radius: number, width: number, tireCol = '#111827'): THREE.Group {
  const g = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: tireCol, roughness: 0.88 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.78, roughness: 0.24 });

  // Outer rubber tire rotated so cylinder axis aligns with Z (spinning around Z)
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), tireMat);
  tire.rotation.x = Math.PI / 2;
  g.add(tire);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.02, 12), rimMat);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);

  // Center brake hub & cross spokes so wheel rotation is visibly natural
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width + 0.04, 10), rimMat);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  for (let s = 0; s < 3; s++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.12, radius * 0.1, width + 0.025), rimMat);
    spoke.rotation.z = (s * Math.PI) / 3;
    g.add(spoke);
  }
  return g;
}

/** Builds a detailed realistic Thai scooter/motorcycle with telescopic fork, exhaust, mirrors, and optional rider. */
export function buildRealisticMotorcycle(opts: MotorcycleOptions): MotorcycleBuildResult {
  const grp = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const facing = opts.facing ?? 1;

  // Front & rear spoked wheels + tires
  [-0.5, 0.5].forEach((wx) => {
    const w = createVehicleWheel(0.23, 0.11);
    w.position.set(wx, 0.23, 0);
    grp.add(w);
    wheels.push(w);
  });

  // Curved front mudguard hugging cleanly OVER top of front tire & sporty rear fender
  const fFender = addMesh(grp, new THREE.BoxGeometry(0.32, 0.06, 0.13), opts.bodyColor, 0.48, 0.48, 0, 0.35, 0.2);
  fFender.rotation.z = -0.24;
  const rFender = addMesh(grp, new THREE.BoxGeometry(0.32, 0.07, 0.14), '#1f2937', -0.56, 0.52, 0, 0.7);
  rFender.rotation.z = -0.35;

  // Tilted telescopic front forks + triple clamp (x = +0.37)
  [-0.075, 0.075].forEach((fz) => {
    const fork = addMesh(grp, new THREE.CylinderGeometry(0.026, 0.026, 0.62, 8), '#cbd5e1', 0.41, 0.54, fz, 0.25, 0.85);
    fork.rotation.z = 0.34;
  });

  // Underbone engine block, crankcase & angled chrome exhaust pipe + heat shield
  addMesh(grp, new THREE.CylinderGeometry(0.11, 0.12, 0.22, 10), '#334155', -0.02, 0.32, 0, 0.6, 0.5);
  const exhaust = addMesh(grp, new THREE.CylinderGeometry(0.036, 0.045, 0.66, 10), '#94a3b8', -0.24, 0.28, 0.15, 0.2, 0.9);
  exhaust.rotation.z = Math.PI / 2 - 0.12;
  const shield = addMesh(grp, new THREE.BoxGeometry(0.42, 0.055, 0.04), '#1e293b', -0.28, 0.29, 0.19, 0.6);
  shield.rotation.z = -0.12;

  // Step-through scooter fairing, tapered nose cowl & sleek rear side covers
  const frontShield = addMesh(grp, new THREE.BoxGeometry(0.22, 0.54, 0.28), opts.bodyColor, 0.28, 0.58, 0, 0.3, 0.2);
  frontShield.rotation.z = 0.28;
  addMesh(grp, new THREE.BoxGeometry(0.46, 0.16, 0.24), '#1e293b', 0.06, 0.38, 0, 0.65); // step floorboard
  const rearFairing = addMesh(grp, new THREE.BoxGeometry(0.62, 0.24, 0.27), opts.bodyColor, -0.25, 0.56, 0, 0.3, 0.2);
  rearFairing.rotation.z = 0.12;
  // Two-tone contoured saddle seat + rear pillion grab bar
  addMesh(grp, new THREE.CylinderGeometry(0.13, 0.14, 0.58, 10), '#1f2937', -0.18, 0.68, 0, 0.75, 0.05).rotation.z =
    Math.PI / 2 + 0.08;
  const grab = addMesh(grp, new THREE.TorusGeometry(0.11, 0.018, 6, 10, Math.PI), '#cbd5e1', -0.52, 0.7, 0, 0.25, 0.8);
  grab.rotation.x = Math.PI / 2;
  grab.rotation.z = Math.PI / 2;

  // Scooter headlight cowl, angled handlebars, grips & twin rearview mirrors
  addMesh(grp, new THREE.BoxGeometry(0.22, 0.16, 0.22), opts.bodyColor, 0.28, 0.9, 0, 0.3, 0.2);
  addMesh(grp, new THREE.CylinderGeometry(0.018, 0.018, 0.54, 8), '#475569', 0.26, 0.95, 0, 0.3, 0.75).rotation.x =
    Math.PI / 2;
  [-0.25, 0.25].forEach((mz) => {
    addMesh(grp, new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), '#94a3b8', 0.28, 1.01, mz, 0.25, 0.8);
    addMesh(grp, new THREE.SphereGeometry(0.045, 8, 6), '#111827', 0.28, 1.09, mz, 0.35).scale.set(0.5, 0.85, 1.15);
  });

  // Glowing clear headlight, amber blinkers, ruby taillight & white plate
  addMesh(grp, new THREE.SphereGeometry(0.075, 10, 8), '#fef9c3', 0.4, 0.76, 0, 0.1, 0, '#fef9c3').scale.set(
    0.75,
    1.0,
    1.15
  );
  addMesh(grp, new THREE.SphereGeometry(0.045, 8, 8), '#ef4444', -0.57, 0.61, 0, 0.1, 0, '#ef4444');
  addMesh(grp, new THREE.BoxGeometry(0.03, 0.11, 0.16), '#f8fafc', -0.63, 0.47, 0, 0.4);

  let headlight: THREE.PointLight | undefined;

  if (opts.withRider) {
    const pantCol = '#1e293b';
    const jacketCol = opts.winVest ? '#f97316' : opts.riderJacket ?? '#334155';
    const helmetCol = opts.helmetColor ?? (opts.winVest ? '#fb923c' : '#e2e8f0');

    // Rounded seated rider legs (thighs + knees + lower shins + boots)
    [-0.12, 0.12].forEach((lz) => {
      const thigh = addMesh(grp, new THREE.CylinderGeometry(0.062, 0.052, 0.34, 8), pantCol, -0.02, 0.7, lz, 0.85, 0.05);
      thigh.rotation.z = 1.18;
      const shin = addMesh(grp, new THREE.CylinderGeometry(0.05, 0.042, 0.34, 8), pantCol, 0.11, 0.49, lz, 0.85, 0.05);
      shin.rotation.z = -0.18;
      addMesh(grp, new THREE.BoxGeometry(0.16, 0.07, 0.08), '#0f172a', 0.09, 0.32, lz, 0.75);
    });

    // Articulated torso leaning slightly forward + Win safety stripe if orange motorcycle taxi
    const torso = addMesh(grp, new THREE.CylinderGeometry(0.13, 0.11, 0.46, 10), jacketCol, -0.1, 0.99, 0, 0.75, 0.08);
    torso.scale.set(0.82, 1, 1.25);
    torso.rotation.z = -0.24;
    if (opts.winVest) {
      const stripe = addMesh(grp, new THREE.CylinderGeometry(0.134, 0.132, 0.07, 10), '#e2e8f0', -0.1, 0.96, 0, 0.4);
      stripe.scale.set(0.83, 1, 1.26);
      stripe.rotation.z = -0.24;
    }

    // Rider arms reaching realistically onto handlebars
    [-0.17, 0.17].forEach((az) => {
      const arm = addMesh(grp, new THREE.CylinderGeometry(0.042, 0.036, 0.42, 8), jacketCol, 0.06, 1.04, az * 0.95, 0.75);
      arm.rotation.z = 1.15;
    });

    // Full-face glossy helmet + tinted dark smoked visor
    const helmet = addMesh(grp, new THREE.SphereGeometry(0.16, 12, 10), helmetCol, -0.02, 1.33, 0, 0.25, 0.25);
    helmet.scale.set(1.08, 1.02, 0.96);
    addMesh(grp, new THREE.CylinderGeometry(0.13, 0.13, 0.09, 10, 1, false, -0.7, 1.4), '#0f172a', 0.05, 1.33, 0, 0.15, 0.6).rotation.y =
      Math.PI / 2;

    headlight = new THREE.PointLight('#fef08a', 2.4, 7.5, 1.4);
    headlight.position.set(0.75, 0.76, 0.15);
    grp.add(headlight);
  }

  grp.scale.x = facing;
  return { group: grp, wheels, headlight };
}

/** Builds a detailed realistic 3D Thai car (sedan, green-yellow taxi, pickup truck, or police patrol car). */
export function buildRealisticCar(opts: CarOptions): CarBuildResult {
  const grp = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const variant = opts.variant ?? 'sedan';
  const facing = opts.facing ?? 1;
  const roofCol = opts.roofColor ?? (variant === 'taxi' ? '#eab308' : variant === 'police' ? '#f8fafc' : opts.bodyColor);
  const bodyCol = variant === 'taxi' ? '#16a34a' : variant === 'police' ? '#7f1d1d' : opts.bodyColor;

  // Front & rear wheels on both sides (z = ±0.72) with chrome alloy rims
  [-1.08, 1.08].forEach((wx) => {
    [-0.72, 0.72].forEach((wz) => {
      const w = createVehicleWheel(0.27, 0.19);
      w.position.set(wx, 0.27, wz);
      grp.add(w);
      wheels.push(w);
    });
  });

  // Lower rocker panels, front & rear wrap-around bumpers
  addMesh(grp, new THREE.BoxGeometry(3.68, 0.14, 1.54), '#1e293b', 0, 0.25, 0, 0.6, 0.3);
  addMesh(grp, new THREE.BoxGeometry(0.45, 0.07, 1.25), '#334155', 1.66, 0.42, 0, 0.4, 0.65); // front grille

  if (variant === 'pickup') {
    // Extended cab + sculpted front hood + open pickup truck bed
    addMesh(grp, new THREE.BoxGeometry(1.95, 0.56, 1.5), bodyCol, 0.85, 0.56, 0, 0.35, 0.28);
    addMesh(grp, new THREE.BoxGeometry(1.75, 0.48, 1.52), bodyCol, -0.95, 0.54, 0, 0.38, 0.25); // cargo bed sides
    addMesh(grp, new THREE.BoxGeometry(1.55, 0.1, 1.32), '#1e293b', -0.95, 0.62, 0, 0.75); // dark bed liner
    addMesh(grp, new THREE.BoxGeometry(1.18, 0.5, 1.38), roofCol, 0.32, 1.06, 0, 0.3, 0.25); // pickup cab roof
    addMesh(grp, new THREE.BoxGeometry(0.95, 0.38, 1.41), '#0f172a', 0.32, 1.04, 0, 0.15, 0.45); // cab side glass
    const wf = addMesh(grp, new THREE.BoxGeometry(0.42, 0.46, 1.34), '#1e293b', 0.92, 0.96, 0, 0.12, 0.5);
    wf.rotation.z = -0.62;
  } else {
    // Sedan / Taxi / Police Car sculpted body (rear trunk, white doors for police, sloped hood)
    if (variant === 'police') {
      addMesh(grp, new THREE.BoxGeometry(1.18, 0.54, 1.5), '#7f1d1d', 1.22, 0.54, 0, 0.32, 0.28); // maroon hood
      addMesh(grp, new THREE.BoxGeometry(1.52, 0.56, 1.52), '#f8fafc', -0.02, 0.55, 0, 0.25, 0.2); // white patrol doors
      addMesh(grp, new THREE.BoxGeometry(0.92, 0.56, 1.5), '#7f1d1d', -1.24, 0.55, 0, 0.32, 0.28); // maroon trunk
      addMesh(grp, new THREE.BoxGeometry(3.54, 0.05, 1.54), '#eab308', 0, 0.77, 0, 0.25); // upper gold patrol pin-stripe above door emblem
    } else {
      addMesh(grp, new THREE.BoxGeometry(3.56, 0.54, 1.5), bodyCol, 0, 0.54, 0, 0.3, 0.28);
    }

    // Sloped greenhouse cabin, windshield A-pillar, rear C-pillar & smoked window glass
    addMesh(grp, new THREE.BoxGeometry(1.62, 0.48, 1.38), roofCol, -0.1, 1.04, 0, 0.28, 0.25);
    addMesh(grp, new THREE.BoxGeometry(1.48, 0.36, 1.41), '#0f172a', -0.1, 1.02, 0, 0.14, 0.5);
    addMesh(grp, new THREE.BoxGeometry(0.08, 0.42, 1.43), roofCol, -0.1, 1.04, 0, 0.3); // center B-pillar
    const windF = addMesh(grp, new THREE.BoxGeometry(0.45, 0.46, 1.34), '#1e293b', 0.72, 0.95, 0, 0.12, 0.5);
    windF.rotation.z = -0.68;
    const windR = addMesh(grp, new THREE.BoxGeometry(0.42, 0.44, 1.34), '#1e293b', -0.94, 0.95, 0, 0.12, 0.5);
    windR.rotation.z = 0.62;
  }

  // Side wing mirrors & metallic door handles (positioned cleanly at beltline y = 0.72 clear of door decals!)
  [-0.78, 0.78].forEach((mz) => {
    addMesh(grp, new THREE.BoxGeometry(0.14, 0.1, 0.12), bodyCol, 0.62, 0.85, mz, 0.35);
    addMesh(grp, new THREE.BoxGeometry(0.18, 0.04, 0.05), '#cbd5e1', 0.18, 0.72, mz * 0.98, 0.3, 0.7);
    addMesh(grp, new THREE.BoxGeometry(0.18, 0.04, 0.05), '#cbd5e1', -0.45, 0.72, mz * 0.98, 0.3, 0.7);
  });

  // Glowing dual headlights + red brake taillights
  [-0.5, 0.5].forEach((lz) => {
    addMesh(grp, new THREE.BoxGeometry(0.09, 0.15, 0.26), '#fef08a', 1.82, 0.56, lz, 0.1, 0, '#fef08a');
    addMesh(grp, new THREE.BoxGeometry(0.09, 0.15, 0.26), '#ef4444', -1.8, 0.58, lz, 0.1, 0, '#ef4444');
  });

  let headlight: THREE.PointLight | undefined;
  let carBeaconBlue: THREE.Mesh | undefined;
  let carBeaconRed: THREE.Mesh | undefined;

  if (variant === 'taxi') {
    addMesh(grp, new THREE.BoxGeometry(0.28, 0.14, 0.5), '#fef08a', 0.12, 1.35, 0, 0.1, 0, '#fef08a');
  }

  if (variant === 'police') {
    // Crisp Thai Police 191 door crest & roof siren lightbar (counter-scaled for facing so text NEVER mirrors!)
    const pCard = document.createElement('canvas');
    pCard.width = 256;
    pCard.height = 88;
    const pCtx = pCard.getContext('2d')!;
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(0, 0, 256, 88);
    pCtx.fillStyle = '#7f1d1d';
    pCtx.fillRect(0, 68, 256, 20);
    pCtx.fillStyle = '#1e293b';
    pCtx.font = 'bold 26px "IBM Plex Sans Thai", sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText('POLICE 191', 128, 32);
    pCtx.fillStyle = '#b91c1c';
    pCtx.font = 'bold 20px "IBM Plex Sans Thai", sans-serif';
    pCtx.fillText('ตำรวจสายตรวจ', 128, 59);
    const doorMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pCard) });
    [-0.78, 0.78].forEach((dz) => {
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.34), doorMat);
      decal.position.set(-0.02, 0.49, dz);
      if (dz < 0) decal.rotation.y = Math.PI;
      // Compensate parent group's scale.x = facing so text reads cleanly left-to-right!
      decal.scale.x = facing;
      grp.add(decal);
    });
    addMesh(grp, new THREE.BoxGeometry(0.28, 0.08, 1.02), '#1e293b', -0.08, 1.31, 0, 0.5);
    carBeaconBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.12, 0.44),
      new THREE.MeshBasicMaterial({ color: '#3b82f6' })
    );
    carBeaconBlue.position.set(-0.08, 1.39, 0.26);
    carBeaconRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.12, 0.44),
      new THREE.MeshBasicMaterial({ color: '#ef4444' })
    );
    carBeaconRed.position.set(-0.08, 1.39, -0.26);
    grp.add(carBeaconBlue, carBeaconRed);
  }

  if (opts.withPointHeadlight) {
    headlight = new THREE.PointLight('#fef9c3', 3.4, 9.5, 1.3);
    headlight.position.set(1.95, 0.62, 0.2);
    grp.add(headlight);
  }

  grp.scale.x = facing;
  return { group: grp, wheels, headlight, carBeaconBlue, carBeaconRed };
}

/** Builds a detailed realistic yellow-white Thai School Bus with windows, signage, wheels, and mirrors. */
export function buildRealisticSchoolBus(): THREE.Group {
  const grp = new THREE.Group();
  // Main lower yellow body + upper white window cabin
  addMesh(grp, new THREE.BoxGeometry(4.6, 0.92, 1.56), '#eab308', 0, 0.76, 0, 0.35, 0.2);
  addMesh(grp, new THREE.BoxGeometry(4.45, 0.78, 1.5), '#f8fafc', -0.04, 1.58, 0, 0.28, 0.15);
  addMesh(grp, new THREE.BoxGeometry(4.56, 0.12, 1.58), '#1d4ed8', 0, 1.18, 0, 0.35); // navy school stripe
  addMesh(grp, new THREE.BoxGeometry(4.74, 0.18, 1.62), '#1e293b', 0, 0.32, 0, 0.6); // front & rear bumpers

  // Panoramic passenger windows & sloped front windshield
  addMesh(grp, new THREE.BoxGeometry(3.8, 0.48, 1.53), '#0f172a', -0.12, 1.56, 0, 0.12, 0.5);
  [-1.35, -0.55, 0.25, 1.05].forEach((mx) => {
    addMesh(grp, new THREE.BoxGeometry(0.1, 0.52, 1.55), '#f8fafc', mx, 1.56, 0, 0.3); // window mullions
  });
  const frontGlass = addMesh(grp, new THREE.BoxGeometry(0.32, 0.62, 1.42), '#1e293b', 2.15, 1.48, 0, 0.12, 0.5);
  frontGlass.rotation.z = -0.22;

  // Dual headlights, turn signals, destination marquee & roof AC pods
  [-0.52, 0.52].forEach((lz) => {
    addMesh(grp, new THREE.BoxGeometry(0.08, 0.16, 0.24), '#fef08a', 2.34, 0.62, lz, 0.1, 0, '#fef08a');
    addMesh(grp, new THREE.BoxGeometry(0.08, 0.16, 0.22), '#ef4444', -2.33, 0.66, lz, 0.1, 0, '#ef4444');
  });
  addMesh(grp, new THREE.BoxGeometry(0.12, 0.18, 0.9), '#f59e0b', 2.12, 1.92, 0, 0.1, 0, '#fde047'); // marquee light
  [-0.85, 0.65].forEach((ax) => addMesh(grp, new THREE.BoxGeometry(0.85, 0.14, 0.95), '#cbd5e1', ax, 2.02, 0, 0.4));

  // Side mirrors + 4 realistic chrome-rimmed bus wheels
  [-0.85, 0.85].forEach((mz) => {
    addMesh(grp, new THREE.BoxGeometry(0.12, 0.24, 0.12), '#1e293b', 2.18, 1.32, mz, 0.4);
  });
  [-1.45, 1.45].forEach((wx) => {
    [-0.76, 0.76].forEach((wz) => {
      const w = createVehicleWheel(0.34, 0.22);
      w.position.set(wx, 0.34, wz);
      grp.add(w);
    });
  });

  return grp;
}
