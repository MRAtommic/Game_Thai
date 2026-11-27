import * as THREE from 'three';

export interface StreetTreeOptions {
  dark?: boolean;
  scale?: number;
}

/** Builds a rich 2.5D volumetric Thai street tree with tapered trunk, branches, and layered foliage spheres. */
export function build25DStreetTree(opts: StreetTreeOptions = {}): THREE.Group {
  const grp = new THREE.Group();
  const dark = opts.dark ?? false;
  const s = opts.scale ?? 1;

  const barkCol = dark ? '#2a1c15' : '#4a2f1d';
  const backLeaf = dark ? '#112116' : '#114a26';
  const midLeaf = dark ? '#1a3322' : '#166534';
  const topLeaf = dark ? '#274730' : '#228b3d';

  const barkMat = new THREE.MeshStandardMaterial({ color: barkCol, roughness: 0.92 });

  // Ground root collar & tapered trunk
  const root = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.32, 9), barkMat);
  root.position.set(0, 0.16, 0);
  root.castShadow = true;
  root.receiveShadow = true;
  grp.add(root);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 1.95, 9), barkMat);
  trunk.position.set(0, 1.1, 0);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  grp.add(trunk);

  // Two angled structural limbs supporting the upper canopy
  const limbL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.95, 7), barkMat);
  limbL.position.set(-0.28, 2.02, 0.05);
  limbL.rotation.z = 0.56;
  limbL.castShadow = true;
  grp.add(limbL);

  const limbR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.92, 7), barkMat);
  limbR.position.set(0.28, 1.98, -0.06);
  limbR.rotation.z = -0.52;
  limbR.castShadow = true;
  grp.add(limbR);

  // Layered 2.5D volumetric foliage crowns with real Z depth (back shadow layer -> mid -> highlight)
  const puffs: { x: number; y: number; z: number; rx: number; ry: number; rz: number; col: string }[] = [
    { x: -0.45, y: 2.38, z: -0.35, rx: 0.85, ry: 0.72, rz: 0.68, col: backLeaf },
    { x: 0.48, y: 2.35, z: -0.32, rx: 0.82, ry: 0.7, rz: 0.65, col: backLeaf },
    { x: 0.0, y: 2.95, z: -0.25, rx: 0.95, ry: 0.82, rz: 0.72, col: backLeaf },
    { x: -0.58, y: 2.48, z: 0.12, rx: 0.76, ry: 0.66, rz: 0.65, col: midLeaf },
    { x: 0.56, y: 2.45, z: 0.15, rx: 0.78, ry: 0.68, rz: 0.66, col: midLeaf },
    { x: -0.18, y: 2.75, z: 0.28, rx: 0.82, ry: 0.74, rz: 0.68, col: midLeaf },
    { x: 0.22, y: 3.05, z: 0.16, rx: 0.74, ry: 0.68, rz: 0.62, col: topLeaf },
    { x: -0.26, y: 3.12, z: 0.08, rx: 0.68, ry: 0.6, rz: 0.58, col: topLeaf },
  ];
  puffs.forEach((p) => {
    const geo = new THREE.DodecahedronGeometry(0.95, 1);
    const mat = new THREE.MeshStandardMaterial({ color: p.col, roughness: 0.86, flatShading: true });
    const crown = new THREE.Mesh(geo, mat);
    crown.position.set(p.x, p.y, p.z);
    crown.scale.set(p.rx, p.ry, p.rz);
    crown.castShadow = true;
    crown.receiveShadow = true;
    grp.add(crown);
  });

  grp.scale.setScalar(s);
  return grp;
}

/** Builds a 2.5D tropical Thai banana tree clump with curved stems, broad arched fronds & banana flower. */
export function build25DBananaClump(scale = 1): THREE.Group {
  const grp = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: '#4d6b2b', roughness: 0.88 });
  const leafDarkMat = new THREE.MeshStandardMaterial({ color: '#1b5e20', roughness: 0.75, side: THREE.DoubleSide });
  const leafBrightMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.72, side: THREE.DoubleSide });

  // 2 clustered pseudostems rising from a base clump
  [
    { x: -0.12, z: 0, h: 1.85, tilt: 0.06 },
    { x: 0.22, z: -0.12, h: 1.45, tilt: -0.09 },
  ].forEach((st, idx) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, st.h, 8), stemMat);
    stem.position.set(st.x, st.h / 2, st.z);
    stem.rotation.z = st.tilt;
    stem.castShadow = true;
    grp.add(stem);

    // 4-5 arched broad banana fronds radiating in 3D space
    const count = idx === 0 ? 5 : 4;
    for (let i = 0; i < count; i++) {
      const yaw = (i / count) * Math.PI * 2 + idx * 0.6;
      const frond = new THREE.Group();
      frond.position.set(st.x, st.h - 0.1, st.z);
      frond.rotation.y = yaw;

      // Arched leaf blade + central midrib
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.38, 4, 1), i % 2 === 0 ? leafBrightMat : leafDarkMat);
      blade.position.set(0.55, 0.18, 0);
      blade.rotation.set(0.35, 0, -0.28);
      blade.castShadow = true;
      frond.add(blade);

      const tip = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.28), i % 2 === 0 ? leafBrightMat : leafDarkMat);
      tip.position.set(1.22, -0.04, 0);
      tip.rotation.set(0.35, 0, -0.68);
      frond.add(tip);

      grp.add(frond);
    }
  });

  // Hanging reddish-purple banana blossom bud (หัวปลี)
  const bud = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.26, 7),
    new THREE.MeshStandardMaterial({ color: '#881337', roughness: 0.6 })
  );
  bud.position.set(0.24, 1.38, 0.15);
  bud.rotation.z = Math.PI;
  grp.add(bud);

  grp.scale.setScalar(scale);
  return grp;
}
