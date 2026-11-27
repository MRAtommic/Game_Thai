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
    const tilt = chase ? 0.14 : 0.05;

    ctx.save();
    ctx.translate(64, 96);
    ctx.rotate(tilt);
    ctx.translate(-64, -96);

    // Ominous Thai gold-crimson glow aura
    const aura = ctx.createRadialGradient(64, 90 + fy, 8, 64, 90 + fy, 62);
    aura.addColorStop(0, chase ? 'rgba(220, 38, 38, 0.55)' : 'rgba(250, 204, 21, 0.32)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    // Ornate floating silk skirt (ผ้านุ่งโจง/จีบหน้านางสีแดงดำทอง) fading mistily
    const sk = ctx.createLinearGradient(0, 102 + fy, 0, 178 + fy);
    sk.addColorStop(0, '#7f1d1d');
    sk.addColorStop(0.55, '#450a0a');
    sk.addColorStop(1, 'rgba(10, 5, 8, 0)');
    ctx.fillStyle = sk;
    ctx.beginPath();
    ctx.moveTo(42, 104 + fy);
    ctx.lineTo(86, 104 + fy);
    ctx.lineTo(94, 176 + fy);
    ctx.lineTo(34, 176 + fy);
    ctx.closePath();
    ctx.fill();
    // Gold Thai embroidery center pleat
    ctx.fillStyle = '#eab308';
    ctx.fillRect(58, 104 + fy, 12, 55);

    // Corpselike torso + Golden Sabai (สไบปักดิ้นทองเปื้อนเลือด)
    ctx.fillStyle = '#a8b0ba';
    ctx.beginPath();
    ctx.roundRect(45, 68 + fy, 38, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(45, 68 + fy);
    ctx.lineTo(74, 68 + fy);
    ctx.lineTo(84, 108 + fy);
    ctx.lineTo(54, 108 + fy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(153, 27, 27, 0.85)';
    ctx.fillRect(54, 78 + fy, 14, 18); // dried blood over sabai

    // Gracefully curved Thai dancer arms & golden bangles (กรายรำสุดหลอน!)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(46, 74 + fy);
    ctx.quadraticCurveTo(22, 62 + fy, 26, 44 + fy);
    ctx.moveTo(82, 74 + fy);
    ctx.quadraticCurveTo(106, chase ? 58 + fy : 84 + fy, 102, chase ? 40 + fy : 102 + fy);
    ctx.stroke();

    // Bruised broken neck + Pale painted Thai dancer face
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(57, 56 + fy, 14, 13);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(64, 42 + fy, 16, 19, chase ? -0.15 : 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Tall Golden Thai Chada Headdress silhouette!
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(48, 30 + fy);
    ctx.lineTo(80, 30 + fy);
    ctx.lineTo(70, 14 + fy);
    ctx.lineTo(64, 2 + fy);
    ctx.lineTo(58, 14 + fy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(52, 26 + fy, 24, 5);

    // Wide black eye sockets + piercing red/white pupils + blood tears
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(57, 40 + fy, 4.5, 0, Math.PI * 2);
    ctx.arc(71, 40 + fy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = chase ? '#ef4444' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(57, 40 + fy, 1.8, 0, Math.PI * 2);
    ctx.arc(71, 40 + fy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(55, 44 + fy, 3, 9);
    ctx.fillRect(70, 44 + fy, 3, 9);

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
