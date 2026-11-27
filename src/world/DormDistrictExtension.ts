import * as THREE from 'three';
import {
  createGeneratorSignTexture,
  createLaundrySignTexture,
  createPoliceBoxSignTexture,
  createThaiDoorTexture,
  createThaiRoadTexture,
  createThaiWallTexture,
} from '../art/TextureFactory';
import { RoomId } from '../types';
import { CharacterKind } from '../art/SpriteFactory';
import { buildRealisticCar, buildRealisticMotorcycle } from './VehicleModels';
import { build25DStreetTree } from './NatureModels';

export const FLOOR_HEIGHT = 4.2;

export interface DormExtensionAnimRefs {
  skytrainGroup: THREE.Group;
  policeBlueLight: THREE.PointLight;
  policeRedLight: THREE.PointLight;
  policeBeaconBlue: THREE.Mesh;
  policeBeaconRed: THREE.Mesh;
  carBeaconBlue: THREE.Mesh;
  carBeaconRed: THREE.Mesh;
  laundryDrums: THREE.Object3D[];
  courtBall: THREE.Mesh;
  canalRipples: THREE.Mesh[];
  winMotoMesh: THREE.Mesh;
  policeMesh: THREE.Mesh;
  laundryMesh: THREE.Mesh;
  electricianMesh: THREE.Mesh;
  courtNpcMeshes: THREE.Mesh[];
  generatorRotor: THREE.Mesh;
}

export function buildDormDistrictExtension(
  _scene: THREE.Scene,
  exteriorGroup: THREE.Group,
  charFrames: Record<CharacterKind, THREE.CanvasTexture[]>,
  shadowTex: THREE.CanvasTexture,
  addBox: (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    col: string,
    x: number,
    y: number,
    z: number,
    rough?: number
  ) => THREE.Mesh
): DormExtensionAnimRefs {
  const roadTex = createThaiRoadTexture();
  roadTex.repeat.set(6, 1);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.72,
    metalness: 0.12,
  });
  const wallTex = createThaiWallTexture(false);

  const makeNpc = (kind: CharacterKind, x: number, y: number, z: number, facing: 1 | -1 = 1) => {
    const mat = new THREE.MeshStandardMaterial({
      map: charFrames[kind][0],
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.85,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 1.95), mat);
    m.position.set(x, y + 0.94, z);
    m.scale.x = facing;
    exteriorGroup.add(m);
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.42),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.48, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(x, y + 0.025, z);
    exteriorGroup.add(sh);
    return m;
  };

  // ================= 1. SKYLINE DEPTH & ELEVATED BTS SKYTRAIN =================
  // Concrete elevated viaduct running high behind the whole Soi 9 skyline (z = -11.5, y = 10.6)
  addBox(exteriorGroup, 195, 0.9, 2.8, '#2d3340', -44, 10.6, -11.5, 0.9);
  for (let px = -126; px <= 44; px += 17) {
    addBox(exteriorGroup, 1.25, 11.0, 1.25, '#252a34', px, 5.2, -11.5, 0.92);
  }
  // Distant glowing Bangkok condos & office towers (z = -17)
  [-118, -94, -70, -48, -28, -4, 18, 38].forEach((tx, idx) => {
    const h = 15 + (idx % 3) * 5;
    addBox(exteriorGroup, 8.5, h, 3.0, '#0b1120', tx, h / 2 - 0.5, -17.5, 1.0);
    for (let wy = 4; wy < h - 2; wy += 2.2) {
      if ((wy + idx) % 3 !== 0) {
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(1.1, 0.65),
          new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? '#f59e0b' : '#38bdf8' })
        );
        win.position.set(tx - 1.5 + (wy % 3) * 1.4, wy, -15.95);
        exteriorGroup.add(win);
      }
    }
  });

  // Animated 3-car Bangkok Skytrain
  const skytrainGroup = new THREE.Group();
  skytrainGroup.position.set(-40, 11.75, -10.8);
  [-11.2, 0, 11.2].forEach((cx) => {
    addBox(skytrainGroup, 10.6, 1.55, 1.4, '#e2e8f0', cx, 0, 0, 0.4);
    addBox(skytrainGroup, 10.6, 0.35, 1.42, '#dc2626', cx, -0.45, 0, 0.4);
    addBox(skytrainGroup, 10.6, 0.25, 1.42, '#1d4ed8', cx, -0.2, 0, 0.4);
    for (let wx = -4.2; wx <= 4.2; wx += 1.65) {
      const tw = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.55),
        new THREE.MeshBasicMaterial({ color: '#fef08a' })
      );
      tw.position.set(cx + wx, 0.2, 0.72);
      skytrainGroup.add(tw);
    }
  });
  exteriorGroup.add(skytrainGroup);

  // ================= 2. ROOFTOP ACCESS & ROOF WATER TANK =================
  // Removed protruding corridor wall AC boxes cleanly per user request!

  // Rooftop Access Door on Floor 3 Left Wing (x = -11.2) + visible roof tank above Dorm
  const roofDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 2.25),
    new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('ดาดฟ้า', true), roughness: 0.78 })
  );
  roofDoor.position.set(-11.2, FLOOR_HEIGHT * 3 + 1.15, -1.32);
  exteriorGroup.add(roofDoor);
  // Roof concrete parapet & silver cylindrical water tank above Floor 3
  const roofY = FLOOR_HEIGHT * 4 + 0.25;
  addBox(exteriorGroup, 26.2, 0.55, 0.24, '#475569', -1.8, roofY + 0.2, 2.35, 0.9);
  const exteriorTank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 2.1, 14),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.65, roughness: 0.35 })
  );
  exteriorTank.position.set(1.5, roofY + 1.1, -0.5);
  exteriorGroup.add(exteriorTank);

  // ================= 3. WIN-MOTO STAND CLEAR OF PARKING SHED (-22.2) =================
  addBox(exteriorGroup, 2.3, 0.12, 1.75, '#ea580c', -22.2, 2.45, -1.15, 0.6); // orange umbrella roof
  addBox(exteriorGroup, 0.08, 2.45, 0.08, '#475569', -22.2, 1.22, -1.15);
  addBox(exteriorGroup, 1.85, 0.45, 0.55, '#64748b', -22.2, 0.24, -1.25); // bench
  // Realistic Parked Orange Win Motorcycle cleanly beside bench
  const winBike = buildRealisticMotorcycle({ bodyColor: '#f97316', withRider: false, facing: -1 }).group;
  winBike.position.set(-23.05, 0, -0.78);
  winBike.rotation.y = 0.14;
  exteriorGroup.add(winBike);
  const winMotoMesh = makeNpc('win_moto', -21.5, 0, -0.58, -1);

  // ================= 4. FAR-WEST SOI 9: POLICE KIOSK (-104.5) & CANAL BRIDGE (-118.5) =================
  // Road west from -96 .. -114.8 & -122.2 .. -134
  const westRoad1 = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.4, 13.0), roadMat);
  westRoad1.position.set(-105.3, -0.2, 1.45);
  westRoad1.receiveShadow = true;
  exteriorGroup.add(westRoad1);

  const westRoad2 = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.4, 13.0), roadMat);
  westRoad2.position.set(-128.2, -0.2, 1.45);
  westRoad2.receiveShadow = true;
  exteriorGroup.add(westRoad2);

  // Back walls around Police Kiosk
  const policeBackWall = new THREE.Mesh(
    new THREE.PlaneGeometry(18.5, 4.8),
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 })
  );
  policeBackWall.position.set(-105.2, 2.4, -2.35);
  exteriorGroup.add(policeBackWall);

  // Police Community Booth (x = -104.5)
  addBox(exteriorGroup, 4.2, 2.9, 2.1, '#f1f5f9', -104.5, 1.45, -1.2, 0.75);
  addBox(exteriorGroup, 4.5, 0.35, 2.4, '#7f1d1d', -104.5, 3.05, -1.2, 0.65);
  const policeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 0.92),
    new THREE.MeshBasicMaterial({ map: createPoliceBoxSignTexture() })
  );
  policeSign.position.set(-104.5, 2.95, 0.02);
  exteriorGroup.add(policeSign);
  const policeGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.15),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.25, metalness: 0.35 })
  );
  policeGlass.position.set(-104.5, 1.65, -0.14);
  exteriorGroup.add(policeGlass);

  // Flashing blue & red beacons on Police Booth roof
  const policeBeaconBlue = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.22, 10),
    new THREE.MeshBasicMaterial({ color: '#3b82f6' })
  );
  policeBeaconBlue.position.set(-105.0, 3.35, -0.55);
  const policeBeaconRed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.22, 10),
    new THREE.MeshBasicMaterial({ color: '#ef4444' })
  );
  policeBeaconRed.position.set(-104.0, 3.35, -0.55);
  exteriorGroup.add(policeBeaconBlue, policeBeaconRed);
  const policeBlueLight = new THREE.PointLight('#3b82f6', 2.4, 12, 1.2);
  policeBlueLight.position.set(-105.0, 3.4, 0.6);
  const policeRedLight = new THREE.PointLight('#ef4444', 2.4, 12, 1.2);
  policeRedLight.position.set(-104.0, 3.4, 0.6);
  exteriorGroup.add(policeBlueLight, policeRedLight);

  const policeMesh = makeNpc('police', -102.2, 0, 0.05, 1);

  // Thai Police Patrol Car ("รถสายตรวจตำรวจ 191") parked cleanly beside standing officer & booth
  const policeCarRes = buildRealisticCar({ bodyColor: '#7f1d1d', variant: 'police', facing: -1 });
  policeCarRes.group.position.set(-99.3, 0, -0.78);
  exteriorGroup.add(policeCarRes.group);
  const carBeaconBlue = policeCarRes.carBeaconBlue!;
  const carBeaconRed = policeCarRes.carBeaconRed!;

  // Canal (คลองซอย 9) at x = -118.5 & Concrete/Steel Bridge spanning -114.6 .. -122.4
  const canalWater = new THREE.Mesh(
    new THREE.PlaneGeometry(8.6, 22.0),
    new THREE.MeshStandardMaterial({ color: '#0c2733', roughness: 0.12, metalness: 0.72 })
  );
  canalWater.rotation.x = -Math.PI / 2;
  canalWater.position.set(-118.5, -0.34, 1.0);
  exteriorGroup.add(canalWater);

  // Canal animated water ripples
  const canalRipples: THREE.Mesh[] = [];
  [-1.5, 0.8, 3.2].forEach((rz, idx) => {
    const rip = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.38, 16),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    rip.rotation.x = -Math.PI / 2;
    rip.position.set(-118.5 + (idx - 1) * 1.4, -0.32, rz);
    exteriorGroup.add(rip);
    canalRipples.push(rip);
  });

  // Bridge deck & yellow-green steel railings
  const bridgeDeck = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, 0.38, 6.2),
    new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8 })
  );
  bridgeDeck.position.set(-118.5, -0.17, 0.8);
  exteriorGroup.add(bridgeDeck);
  [-1.9, 3.4].forEach((bz) => {
    addBox(exteriorGroup, 8.1, 0.12, 0.1, '#eab308', -118.5, 1.05, bz);
    addBox(exteriorGroup, 8.1, 0.08, 0.08, '#94a3b8', -118.5, 0.58, bz);
    for (let px = -122.2; px <= -114.8; px += 1.48) {
      addBox(exteriorGroup, 0.1, 1.05, 0.1, '#64748b', px, 0.52, bz);
    }
  });
  const bridgeTree = build25DStreetTree({ scale: 1.05 });
  bridgeTree.position.set(-124.2, 0, -1.8);
  exteriorGroup.add(bridgeTree);

  const canalLight = new THREE.PointLight('#67e8f9', 4.5, 15, 1.1);
  canalLight.position.set(-118.5, 4.2, 1.4);
  exteriorGroup.add(canalLight);

  // ================= 5. EAST EXPANSION: BASKETBALL COURT (+19.5), 24H LAUNDRY (+27.5), GENERATOR (+35.8) =================
  const eastGround = new THREE.Mesh(
    new THREE.BoxGeometry(31.5, 0.42, 11.2),
    new THREE.MeshStandardMaterial({ color: '#2b313a', roughness: 0.86, metalness: 0.06 })
  );
  eastGround.position.set(31.5, -0.19, 1.2);
  eastGround.receiveShadow = true;
  exteriorGroup.add(eastGround);

  const eastWall = new THREE.Mesh(
    new THREE.PlaneGeometry(31.5, 4.8),
    new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.94 })
  );
  eastWall.position.set(31.5, 2.4, -2.35);
  exteriorGroup.add(eastWall);

  // A) 3D Outdoor Street Basketball Half-Court (x = +19.5) with Backboard Truss, Net, 3-Pt Arc & Natural Shooting Match!
  addBox(exteriorGroup, 7.6, 0.03, 5.4, '#14532d', 19.5, 0.025, 0.7, 0.85);
  addBox(exteriorGroup, 2.5, 0.035, 2.2, '#b91c1c', 19.5, 0.03, -0.75, 0.85); // key area
  addBox(exteriorGroup, 7.6, 0.04, 0.08, '#f8fafc', 19.5, 0.032, 3.35); // front boundary line
  addBox(exteriorGroup, 7.6, 0.04, 0.08, '#f8fafc', 19.5, 0.032, -1.95); // baseline
  addBox(exteriorGroup, 0.08, 0.04, 5.4, '#f8fafc', 15.75, 0.032, 0.7);
  addBox(exteriorGroup, 0.08, 0.04, 5.4, '#f8fafc', 23.25, 0.032, 0.7);
  const arc3 = new THREE.Mesh(
    new THREE.RingGeometry(2.35, 2.45, 24, 1, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: '#f8fafc', side: THREE.DoubleSide })
  );
  arc3.rotation.x = -Math.PI / 2;
  arc3.position.set(19.5, 0.042, -0.75);
  exteriorGroup.add(arc3);

  // Heavy 3D Stanchion Pole + Angled Boom Arm + Glass Backboard + Orange Rim + Hanging White Net!
  addBox(exteriorGroup, 0.22, 4.05, 0.22, '#334155', 19.5, 2.02, -1.95);
  addBox(exteriorGroup, 0.18, 0.18, 0.68, '#334155', 19.5, 3.55, -1.62);
  addBox(exteriorGroup, 1.78, 1.15, 0.1, '#f8fafc', 19.5, 3.52, -1.32, 0.3);
  addBox(exteriorGroup, 1.84, 0.08, 0.12, '#1e293b', 19.5, 4.1, -1.32, 0.4);
  addBox(exteriorGroup, 0.62, 0.46, 0.04, '#dc2626', 19.5, 3.44, -1.25);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.038, 10, 18),
    new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.35 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(19.5, 3.1, -0.94);
  const hoopNet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.14, 0.46, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: '#f8fafc', wireframe: true })
  );
  hoopNet.position.set(19.5, 2.86, -0.94);
  exteriorGroup.add(rim, hoopNet);

  // Textured 3D Basketball for natural dribble & shot physics
  const bbCanv = document.createElement('canvas');
  bbCanv.width = 64;
  bbCanv.height = 64;
  const bbCtx = bbCanv.getContext('2d')!;
  bbCtx.fillStyle = '#ea580c';
  bbCtx.fillRect(0, 0, 64, 64);
  bbCtx.strokeStyle = '#1f2937';
  bbCtx.lineWidth = 4;
  bbCtx.beginPath();
  bbCtx.moveTo(0, 32);
  bbCtx.lineTo(64, 32);
  bbCtx.moveTo(32, 0);
  bbCtx.lineTo(32, 64);
  bbCtx.stroke();
  const courtBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 14),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(bbCanv), roughness: 0.45 })
  );
  courtBall.position.set(17.8, 0.5, 0.2);
  exteriorGroup.add(courtBall);

  const courtLight = new THREE.PointLight('#fff4d6', 8.5, 20, 1.0);
  courtLight.position.set(19.5, 4.8, 1.4);
  exteriorGroup.add(courtLight);
  const courtNpcMeshes = [
    makeNpc('student', 17.6, 0, -0.2, 1),
    makeNpc('worker_yellow', 21.4, 0, 0.15, -1),
  ];

  // B) 24-Hour Coin Laundry Shop with True 3D Recessed Room & Deep Front-Load Washers (x = +27.5)
  // Recessed interior back tile wall, left & right side walls, tiled shop floor & protruding lit canopy
  addBox(exteriorGroup, 6.4, 0.14, 2.5, '#cbd5e1', 27.5, 0.07, -0.95, 0.45); // raised tiled interior apron
  addBox(exteriorGroup, 6.4, 3.6, 0.24, '#e0f2fe', 27.5, 1.85, -2.18, 0.5);   // bright interior back wall
  addBox(exteriorGroup, 0.24, 3.6, 2.5, '#bae6fd', 24.42, 1.85, -0.95, 0.6); // left depth side wall
  addBox(exteriorGroup, 0.24, 3.6, 2.5, '#bae6fd', 30.58, 1.85, -0.95, 0.6); // right depth side wall
  addBox(exteriorGroup, 6.6, 0.35, 2.75, '#0284c7', 27.5, 3.72, -0.9, 0.45); // overhanging marquee ceiling
  addBox(exteriorGroup, 6.7, 0.16, 2.8, '#0369a1', 27.5, 3.92, -0.9, 0.45);

  const laundrySign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 0.96),
    new THREE.MeshBasicMaterial({ map: createLaundrySignTexture() })
  );
  laundrySign.position.set(27.5, 3.55, 0.5);
  exteriorGroup.add(laundrySign);

  // Stainless machine platform plinth + detergent vending dispenser on left side wall
  addBox(exteriorGroup, 5.2, 0.14, 1.05, '#64748b', 27.5, 0.14, -1.45, 0.4);
  addBox(exteriorGroup, 0.5, 1.15, 0.35, '#f8fafc', 24.75, 1.4, -1.65, 0.35);

  const laundryDrums: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) {
    const mx = 25.6 + i * 1.25;
    const mz = -1.45; // deep cabinet sits back on raised tiled platform
    // Deep cabinet housing + top recessed silver/cyan control fascia + coin slot
    addBox(exteriorGroup, 0.98, 1.32, 0.92, '#f8fafc', mx, 0.85, mz, 0.32);
    addBox(exteriorGroup, 0.96, 0.22, 0.95, '#0284c7', mx, 1.4, mz + 0.01, 0.35);
    addBox(exteriorGroup, 0.22, 0.08, 0.04, '#22d3ee', mx - 0.25, 1.4, mz + 0.49, 0.2); // LED timer readout

    // 3D Recessed Steel Drum Tunnel Cavity + Chrome Bezel Door Ring + Side Handle
    const recessWall = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.38, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: '#1e293b', side: THREE.BackSide, roughness: 0.45, metalness: 0.5 })
    );
    recessWall.rotation.x = Math.PI / 2;
    recessWall.position.set(mx, 0.78, mz + 0.28);
    const backDrumCap = new THREE.Mesh(
      new THREE.CircleGeometry(0.27, 16),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4, metalness: 0.65 })
    );
    backDrumCap.position.set(mx, 0.78, mz + 0.1);
    const doorBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.055, 10, 18),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.75, roughness: 0.22 })
    );
    doorBezel.position.set(mx, 0.78, mz + 0.48);
    addBox(exteriorGroup, 0.05, 0.16, 0.06, '#0369a1', mx + 0.31, 0.78, mz + 0.51, 0.3); // door latch

    // 3D Rotating Inner Drum Assembly recessed inside cabinet (clothes + soapy foam paddles!)
    const drumGrp = new THREE.Group();
    drumGrp.position.set(mx, 0.78, mz + 0.24);
    const soapWater = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 14),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#7dd3fc' : '#bae6fd', transparent: true, opacity: 0.55 })
    );
    drumGrp.add(soapWater);
    ['#f43f5e', '#facc15', '#f8fafc', '#38bdf8'].forEach((clCol, ci) => {
      const ang = (ci / 4) * Math.PI * 2;
      const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.12, 0.2),
        new THREE.MeshStandardMaterial({ color: clCol, roughness: 0.75 })
      );
      cloth.position.set(Math.cos(ang) * 0.12, Math.sin(ang) * 0.12, 0.02);
      cloth.rotation.z = ang;
      drumGrp.add(cloth);
    });
    exteriorGroup.add(recessWall, backDrumCap, doorBezel, drumGrp);
    laundryDrums.push(drumGrp);
  }
  // Wooden laundry folding bench & colorful clothes baskets in foreground aisle
  addBox(exteriorGroup, 1.5, 0.44, 0.45, '#92400e', 29.55, 0.28, -0.35, 0.75);
  addBox(exteriorGroup, 0.48, 0.32, 0.38, '#f43f5e', 29.4, 0.66, -0.35, 0.6);
  const laundryLight = new THREE.PointLight('#bae6fd', 5.5, 13, 1.0);
  laundryLight.position.set(27.5, 3.1, -0.35);
  exteriorGroup.add(laundryLight);
  const laundryMesh = makeNpc('laundry_lady', 24.9, 0.08, 0.15, 1);

  // C) Generator Shed & Electrician Chang Tong Workshop (x = +35.8)
  addBox(exteriorGroup, 5.2, 3.1, 2.2, '#334155', 35.8, 1.55, -1.2, 0.75);
  const genSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.95),
    new THREE.MeshBasicMaterial({ map: createGeneratorSignTexture() })
  );
  genSign.position.set(35.8, 2.55, -0.08);
  exteriorGroup.add(genSign);
  // Diesel generator block & spinning cooling turbine
  addBox(exteriorGroup, 2.1, 1.25, 1.1, '#ca8a04', 36.2, 0.64, -0.25, 0.45);
  const generatorRotor = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.1, 0.05),
    new THREE.MeshBasicMaterial({ color: '#111827' })
  );
  generatorRotor.position.set(36.2, 0.7, 0.33);
  exteriorGroup.add(generatorRotor);
  const genLight = new THREE.PointLight('#fde047', 3.4, 12, 1.2);
  genLight.position.set(35.8, 2.5, 1.2);
  exteriorGroup.add(genLight);
  const electricianMesh = makeNpc('electrician', 34.1, 0, 0.1, 1);

  // Streetlamps cleanly outside Basketball Court & East Wing
  [-104.5, -118.5, 23.6, 34.5].forEach((lx) => {
    addBox(exteriorGroup, 0.22, 5.5, 0.22, '#525862', lx, 2.75, -1.15);
    const bulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.35),
      new THREE.MeshBasicMaterial({ color: '#ffd580' })
    );
    bulb.position.set(lx, 5.35, -0.25);
    exteriorGroup.add(bulb);
  });

  return {
    skytrainGroup,
    policeBlueLight,
    policeRedLight,
    policeBeaconBlue,
    policeBeaconRed,
    carBeaconBlue,
    carBeaconRed,
    laundryDrums,
    courtBall,
    canalRipples,
    winMotoMesh,
    policeMesh,
    laundryMesh,
    electricianMesh,
    courtNpcMeshes,
    generatorRotor,
  };
}

export function buildRooftopRoom(
  scene: THREE.Scene,
  roomGroups: Partial<Record<RoomId, THREE.Group>>,
  roomLights: { room: RoomId; light: THREE.PointLight; baseIntensity: number }[],
  addBox: (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    col: string,
    x: number,
    y: number,
    z: number,
    rough?: number
  ) => THREE.Mesh
): void {
  const g = new THREE.Group();
  g.visible = false;
  scene.add(g);
  roomGroups.rooftop = g;

  // Concrete rooftop slab
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(16.0, 0.3, 6.2),
    new THREE.MeshStandardMaterial({ color: '#272c35', roughness: 0.9 })
  );
  deck.position.set(0, -0.15, 0);
  deck.receiveShadow = true;
  g.add(deck);

  // Waist-high parapet walls with city night skyline glowing far behind
  addBox(g, 16.0, 1.05, 0.26, '#3b424d', 0, 0.52, -2.55, 0.9);
  addBox(g, 0.3, 1.05, 5.8, '#3b424d', -7.85, 0.52, 0, 0.9);
  addBox(g, 0.3, 1.05, 5.8, '#3b424d', 7.85, 0.52, 0, 0.9);

  // Distant Bangkok glowing skyline buildings seen from Dorm Rooftop!
  [-6.5, -3.5, 0.5, 4.2, 7.0].forEach((bx, idx) => {
    const bh = 6 + (idx % 3) * 2.5;
    addBox(g, 2.4, bh, 1.2, '#0b101d', bx, bh / 2 - 2.2, -5.8, 1.0);
    const glowWin = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, 0.35),
      new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? '#f59e0b' : '#38bdf8' })
    );
    glowWin.position.set(bx, 1.4 + (idx % 2), -5.18);
    g.add(glowWin);
  });

  // Stairwell exit bulkhead on Left (-5.2)
  addBox(g, 2.4, 2.8, 2.2, '#334155', -5.6, 1.4, -1.15, 0.85);
  const exitDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 2.2),
    new THREE.MeshStandardMaterial({ map: createThaiDoorTexture('บันไดลง', true), roughness: 0.8 })
  );
  exitDoor.position.set(-5.2, 1.15, -0.02);
  g.add(exitDoor);

  // Giant Stainless Water Tank (แท็งก์น้ำใหญ่ x = +1.5) & Steel Support Stand
  addBox(g, 2.0, 0.8, 2.0, '#475569', 1.5, 0.4, -1.1, 0.7);
  const waterTank = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 2.35, 16),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.7, roughness: 0.28 })
  );
  waterTank.position.set(1.5, 1.95, -1.1);
  g.add(waterTank);

  // Rooftop telecom antenna + red aircraft warning light (x = +4.4)
  addBox(g, 0.14, 4.8, 0.14, '#64748b', 4.4, 2.4, -1.8);
  const warnBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshBasicMaterial({ color: '#ef4444' })
  );
  warnBeacon.position.set(4.4, 4.85, -1.8);
  g.add(warnBeacon);

  const roofLight = new THREE.PointLight('#a5c9ff', 2.8, 18, 1.1);
  roofLight.position.set(0, 3.8, 1.2);
  g.add(roofLight);
  roomLights.push({ room: 'rooftop', light: roofLight, baseIntensity: 2.8 });
}

export function animateDormExtension(
  refs: DormExtensionAnimRefs,
  charFrames: Record<CharacterKind, THREE.CanvasTexture[]>,
  clock: number,
  dt: number
): void {
  // Glide BTS Skytrain across horizon
  refs.skytrainGroup.position.x += 9.5 * dt;
  if (refs.skytrainGroup.position.x > 65) refs.skytrainGroup.position.x = -140;

  // Alternate flashing red/blue police beacon (booth + patrol car)
  const blueOn = Math.floor(clock * 4.5) % 2 === 0;
  refs.policeBlueLight.intensity = blueOn ? 3.2 : 0.25;
  refs.policeRedLight.intensity = blueOn ? 0.25 : 3.2;
  (refs.policeBeaconBlue.material as THREE.MeshBasicMaterial).color.set(blueOn ? '#60a5fa' : '#1e3a8a');
  (refs.policeBeaconRed.material as THREE.MeshBasicMaterial).color.set(blueOn ? '#7f1d1d' : '#f87171');
  (refs.carBeaconBlue.material as THREE.MeshBasicMaterial).color.set(blueOn ? '#60a5fa' : '#1e3a8a');
  (refs.carBeaconRed.material as THREE.MeshBasicMaterial).color.set(blueOn ? '#7f1d1d' : '#f87171');

  // Spin 24h laundromat washer drums & generator rotor
  refs.laundryDrums.forEach((drum, idx) => {
    drum.rotation.z += dt * (4.2 + idx * 0.7);
  });
  refs.generatorRotor.rotation.z += dt * 7.5;

  // Natural half-court basketball shooting loop: dribble in -> jump shot -> parabolic rim arc -> net swish & bounce back!
  const cyc = (clock % 4.4) / 4.4;
  const fromLeft = Math.floor(clock / 4.4) % 2 === 0;
  const shooterIdx = fromLeft ? 0 : 1;
  const shooterStartX = fromLeft ? 16.9 : 22.1;
  const shooterSpotX = fromLeft ? 18.2 : 20.8;
  const dir: 1 | -1 = fromLeft ? 1 : -1;
  let bx = shooterSpotX;
  let by = 0.25;
  let bz = -0.1;
  let sJump = 0;

  if (cyc < 0.44) {
    const t = cyc / 0.44;
    const curX = shooterStartX + (shooterSpotX - shooterStartX) * t;
    bx = curX + dir * 0.35;
    by = 0.2 + Math.abs(Math.sin(t * Math.PI * 4)) * 0.82;
    bz = 0.2 - t * 0.35;
  } else if (cyc < 0.56) {
    const t = (cyc - 0.44) / 0.12;
    sJump = Math.sin(t * Math.PI) * 0.55;
    bx = shooterSpotX + dir * (0.25 + t * 0.3);
    by = 1.4 + t * 0.75 + sJump * 0.35;
    bz = -0.15 - t * 0.2;
  } else if (cyc < 0.82) {
    const s = (cyc - 0.56) / 0.26;
    bx = shooterSpotX + dir * 0.55 + (19.5 - (shooterSpotX + dir * 0.55)) * s;
    by = 2.15 + (3.1 - 2.15) * s + Math.sin(s * Math.PI) * 1.45;
    bz = -0.35 + (-0.94 + 0.35) * s;
    refs.courtBall.rotation.x += dt * 9;
    refs.courtBall.rotation.z -= dir * dt * 9;
  } else {
    const sw = (cyc - 0.82) / 0.18;
    bx = 19.5 - dir * sw * 0.85;
    by = sw < 0.55 ? 3.1 - Math.pow(sw / 0.55, 1.5) * 2.88 : 0.22 + Math.sin(((sw - 0.55) / 0.45) * Math.PI) * 0.6;
    bz = -0.94 + sw * 0.75;
  }
  refs.courtBall.position.set(bx, by, bz);

  refs.courtNpcMeshes.forEach((npc, idx) => {
    const isShooter = idx === shooterIdx;
    const xPos = isShooter
      ? cyc < 0.44
        ? shooterStartX + (shooterSpotX - shooterStartX) * (cyc / 0.44)
        : shooterSpotX
      : idx === 0
      ? 17.5 + Math.sin(clock * 1.6) * 0.5
      : 21.3 + Math.sin(clock * 1.6) * 0.5;
    npc.position.set(xPos, 0.94 + (isShooter ? sJump : 0), isShooter ? 0.1 - Math.min(0.4, cyc) : 0.2);
    npc.scale.x = xPos < 19.5 ? 1 : -1;
    (npc.material as THREE.MeshStandardMaterial).map =
      charFrames[idx === 0 ? 'student' : 'worker_yellow'][isShooter && cyc < 0.44 ? Math.floor(clock * 7) % 2 : 0];
  });

  // Expand canal water ripples gently
  refs.canalRipples.forEach((rip, idx) => {
    const s = 0.65 + ((clock * 0.65 + idx * 0.33) % 1) * 1.4;
    rip.scale.setScalar(s);
    (rip.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.45 * (1 - ((clock * 0.65 + idx * 0.33) % 1)));
  });

  // Subtle idle frame animations for remaining NPCs
  const f2 = Math.floor(clock * 1.7) % 2;
  (refs.winMotoMesh.material as THREE.MeshStandardMaterial).map = charFrames.win_moto[f2];
  (refs.policeMesh.material as THREE.MeshStandardMaterial).map = charFrames.police[f2];
  (refs.laundryMesh.material as THREE.MeshStandardMaterial).map = charFrames.laundry_lady[f2];
  (refs.electricianMesh.material as THREE.MeshStandardMaterial).map = charFrames.electrician[f2];
}
