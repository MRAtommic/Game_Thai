import * as THREE from 'three';

export type Ch3CharKind =
  | 'peem'
  | 'mom_ch3'
  | 'teacher_somchai'
  | 'teacher_wilai'
  | 'janitor_man'
  | 'kong_bully'
  | 'student_girl'
  | 'student_boy'
  | 'vendor_coop'
  | 'dancer_ghost'
  | 'dancer_chase';

export function drawCh3CharacterCanvas(
  kind: Ch3CharKind,
  frame = 0,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const w = 128;
  const h = 192;
  const canvas = targetCanvas ?? document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const bob = frame === 1 || frame === 3 ? -3 : 0;
  const stride = frame === 1 ? 11 : frame === 3 ? -11 : 0;

  if (kind === 'dancer_ghost' || kind === 'dancer_chase') {
    const chase = kind === 'dancer_chase';
    const fy = frame % 2 === 1 ? -6 : 0;
    const tilt = chase ? 0.19 : 0.07;

    ctx.save();
    ctx.translate(64, 96);
    ctx.rotate(tilt);
    ctx.translate(-64, -96);

    // Suffocating crimson-void shadow aura
    const aura = ctx.createRadialGradient(64, 88 + fy, 6, 64, 88 + fy, 64);
    aura.addColorStop(0, chase ? 'rgba(185, 28, 28, 0.72)' : 'rgba(20, 12, 16, 0.65)');
    aura.addColorStop(0.55, chase ? 'rgba(88, 10, 14, 0.35)' : 'rgba(120, 53, 15, 0.22)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    // Long jagged soaked black hair hanging behind shoulders
    ctx.fillStyle = '#07080c';
    ctx.beginPath();
    ctx.moveTo(35, 24 + fy);
    ctx.lineTo(24, 105 + fy);
    ctx.lineTo(36, 150 + fy);
    ctx.lineTo(94, 146 + fy);
    ctx.lineTo(104, 100 + fy);
    ctx.lineTo(92, 24 + fy);
    ctx.closePath();
    ctx.fill();

    // Tattered blood-soaked gold-crimson pleated skirt fading mistily into void
    const sk = ctx.createLinearGradient(0, 102 + fy, 0, 182 + fy);
    sk.addColorStop(0, '#7f1d1d');
    sk.addColorStop(0.45, '#3b0712');
    sk.addColorStop(1, 'rgba(5, 3, 6, 0)');
    ctx.fillStyle = sk;
    ctx.beginPath();
    ctx.moveTo(42, 104 + fy);
    ctx.lineTo(86, 104 + fy);
    ctx.lineTo(96, 180 + fy);
    ctx.lineTo(32, 180 + fy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a16207';
    ctx.fillRect(58, 104 + fy, 12, 52);

    // Corpse-pale torso + Blood-drenched Gold Sabai wrap
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.roundRect(45, 68 + fy, 38, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(45, 68 + fy);
    ctx.lineTo(74, 68 + fy);
    ctx.lineTo(84, 108 + fy);
    ctx.lineTo(54, 108 + fy);
    ctx.closePath();
    ctx.fill();
    // Heavy dried blood streaks across torso & Sabai
    ctx.fillStyle = 'rgba(127, 14, 22, 0.92)';
    ctx.beginPath();
    ctx.ellipse(63, 86 + fy, 13, 18, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Long clawed pale ghost arms + golden wrist bangles reaching forward when chasing!
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (chase) {
      ctx.moveTo(44, 74 + fy);
      ctx.quadraticCurveTo(22, 54 + fy, 18, 34 + fy);
      ctx.moveTo(84, 74 + fy);
      ctx.quadraticCurveTo(108, 50 + fy, 114, 30 + fy);
    } else {
      ctx.moveTo(45, 74 + fy);
      ctx.quadraticCurveTo(22, 62 + fy, 26, 42 + fy);
      ctx.moveTo(83, 74 + fy);
      ctx.quadraticCurveTo(105, 86 + fy, 100, 106 + fy);
    }
    ctx.stroke();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chase ? 18 : 24, chase ? 40 + fy : 48 + fy);
    ctx.lineTo(chase ? 24 : 30, chase ? 42 + fy : 50 + fy);
    ctx.stroke();

    // Snapped crooked neck + Severely tilted Head with Corpse Shading
    ctx.fillStyle = '#3f0d14';
    ctx.fillRect(57, 56 + fy, 14, 14);
    ctx.save();
    ctx.translate(64, 41 + fy);
    ctx.rotate(chase ? -0.38 : 0.24); // Unnerving broken neck head tilt!

    const faceGrad = ctx.createRadialGradient(4, -4, 3, 0, 0, 20);
    faceGrad.addColorStop(0, '#cbd5e1');
    faceGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Chada Crown crooked on head
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.lineTo(16, -12);
    ctx.lineTo(7, -30);
    ctx.lineTo(0, -44);
    ctx.lineTo(-7, -30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-12, -16, 24, 5);

    // Sunken black eye sockets + Piercing Glowing Red/White Pinpricks + Blood Tears + Screaming Jaw!
    ctx.fillStyle = '#050507';
    ctx.beginPath();
    ctx.ellipse(-6, -2, 5, 6, 0.15, 0, Math.PI * 2);
    ctx.ellipse(7, -2, 5, 6, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = chase ? '#ff1f1f' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(-6, -2, chase ? 2.1 : 1.4, 0, Math.PI * 2);
    ctx.arc(7, -2, chase ? 2.1 : 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-8, 3, 2.8, 10);
    ctx.fillRect(6, 3, 2.8, 11);

    if (chase) {
      ctx.fillStyle = '#090204';
      ctx.beginPath();
      ctx.ellipse(0, 12, 5.5, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#1f080d';
      ctx.fillRect(-5, 11, 10, 3);
    }

    // Wet hair strands framing face
    ctx.fillStyle = '#07080c';
    ctx.fillRect(-17, -14, 5, 28);
    ctx.fillRect(12, -14, 5, 28);
    ctx.restore();

    ctx.restore();
    return canvas;
  }

  // Standard grounded human figures
  const legCols: Record<string, [string, string]> = {
    peem: ['#1e3a8a', '#1e293b'], // Thai boy school navy shorts
    kong_bully: ['#111827', '#0f172a'], // Dark senior trousers
    student_boy: ['#1e3a8a', '#1e293b'],
    student_girl: ['#172554', '#0f172a'],
    teacher_somchai: ['#786246', '#292524'],
    teacher_wilai: ['#4c1d95', '#1e1b4b'],
    mom_ch3: ['#475569', '#334155'],
    janitor_man: ['#1e293b', '#0f172a'],
    vendor_coop: ['#3f3f46', '#18181b'],
  };
  const shirtCols: Record<string, string> = {
    peem: '#f8fafc', // crisp white Thai school uniform
    kong_bully: '#e2e8f0',
    student_boy: '#f1f5f9',
    student_girl: '#ffffff',
    teacher_somchai: '#a38968', // Khaki teacher uniform
    teacher_wilai: '#db2777', // Crimson-magenta Thai silk blouse
    mom_ch3: '#0284c7',
    janitor_man: '#334155', // Navy janitor shirt
    vendor_coop: '#f59e0b',
  };

  const [pCol, sCol] = legCols[kind] ?? ['#1e293b', '#0f172a'];
  const torsoCol = shirtCols[kind] ?? '#e2e8f0';

  // Legs
  ctx.fillStyle = '#d4a37a';
  ctx.fillRect(52 + stride, 122, 11, 46);
  ctx.fillRect(67 - stride, 122, 11, 46);
  ctx.fillStyle = pCol;
  if (kind === 'student_girl' || kind === 'teacher_wilai') {
    // Thai skirt
    ctx.beginPath();
    ctx.moveTo(45, 118);
    ctx.lineTo(83, 118);
    ctx.lineTo(88, kind === 'teacher_wilai' ? 168 : 150);
    ctx.lineTo(40, kind === 'teacher_wilai' ? 168 : 150);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(49 + stride, 118, 15, kind === 'peem' || kind === 'student_boy' ? 28 : 48);
    ctx.fillRect(66 - stride, 118, 15, kind === 'peem' || kind === 'student_boy' ? 28 : 48);
  }
  // Shoes
  ctx.fillStyle = sCol;
  ctx.fillRect(49 + stride, 168, 16, 10);
  ctx.fillRect(66 - stride, 168, 16, 10);

  // Arms
  ctx.fillStyle = '#d9a77e';
  ctx.fillRect(36 - stride * 0.7, 74 + bob, 9, 36);
  ctx.fillRect(83 + stride * 0.7, 74 + bob, 9, 36);

  // Torso
  ctx.fillStyle = torsoCol;
  ctx.beginPath();
  ctx.roundRect(43, 68 + bob, 42, 54, 8);
  ctx.fill();

  // Character-specific accessories!
  if (kind === 'peem') {
    // Cross-body school bag & blue ribbon collar
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(48, 70 + bob);
    ctx.lineTo(82, 116 + bob);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(72, 104 + bob, 18, 20);
  } else if (kind === 'student_girl') {
    ctx.fillStyle = '#1e3a8a'; // Bow tie
    ctx.fillRect(58, 72 + bob, 12, 6);
  } else if (kind === 'kong_bully') {
    ctx.fillStyle = '#ef4444'; // Bandana / wristband attitude
    ctx.fillRect(82 + stride * 0.7, 100 + bob, 11, 5);
  } else if (kind === 'teacher_wilai') {
    ctx.fillStyle = '#facc15'; // Gold brooch
    ctx.beginPath();
    ctx.arc(54, 84 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'janitor_man') {
    ctx.fillStyle = '#d97706'; // Key ring at belt
    ctx.beginPath();
    ctx.arc(76, 115 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head & Hair
  ctx.fillStyle = '#e0ad84';
  ctx.beginPath();
  ctx.ellipse(64, 41 + bob, 18, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = kind === 'janitor_man' ? '#94a3b8' : '#18181b';
  ctx.beginPath();
  ctx.ellipse(64, 25 + bob, 20, 11, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  if (kind === 'student_girl' || kind === 'teacher_wilai' || kind === 'mom_ch3') {
    ctx.beginPath();
    ctx.arc(46, 34 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#111827';
  ctx.fillRect(57, 39 + bob, 4, 4);
  ctx.fillRect(71, 39 + bob, 4, 4);

  return canvas;
}

export function createCh3CharacterTexture(kind: Ch3CharKind, frame = 0): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(drawCh3CharacterCanvas(kind, frame));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSchoolSignTexture(
  title: string,
  sub: string,
  bgA = '#7f1d1d',
  bgB = '#450a0a',
  border = '#facc15'
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 420;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 420, 128);
  g.addColorStop(0, bgA);
  g.addColorStop(1, bgB);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 420, 128);
  ctx.strokeStyle = border;
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 410, 118);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 28px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText(title, 210, 46);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 18px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText(sub, 210, 88);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function drawCh3ItemIconDataUrl(id: string): string {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const ctx = c.getContext('2d')!;

  if (id === 'camera_phone') {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(14, 6, 20, 36, 4);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(16, 10, 16, 25);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(24, 22, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'inhaler') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(19, 10, 10, 28);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(19, 24, 10, 14);
  } else if (id === 'bicycle') {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(13, 32, 8, 0, Math.PI * 2);
    ctx.moveTo(43, 32);
    ctx.arc(35, 32, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(13, 32);
    ctx.lineTo(24, 20);
    ctx.lineTo(35, 32);
    ctx.stroke();
  } else if (id === 'chilled_soda') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(17, 13, 14, 26);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(22, 5, 4, 9);
  } else if (id === 'battery_pack') {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(14, 12, 20, 26);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(19, 8, 10, 4);
    ctx.fillRect(21, 19, 6, 12);
  } else if (id === 'gold_chada') {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(12, 38);
    ctx.lineTo(36, 38);
    ctx.lineTo(29, 20);
    ctx.lineTo(24, 6);
    ctx.lineTo(19, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(14, 33, 20, 5);
  } else if (id === 'old_cassette') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, 14, 32, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(14, 18, 20, 7);
  } else if (id === 'holy_sai_sin') {
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(24, 24, 12, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Key / generic brass key
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(16, 20, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(22, 18, 18, 4);
    ctx.fillRect(34, 22, 4, 6);
  }

  return c.toDataURL();
}
