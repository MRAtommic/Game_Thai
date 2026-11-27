import { drawCh2ItemIconDataUrl } from './Chapter2Sprites';

export type Ch4CharacterKind =
  | 'man'
  | 'smith'
  | 'phudsorn'
  | 'noble'
  | 'khun_ram'
  | 'monk_khong'
  | 'child_kla'
  | 'villager'
  | 'bandit'
  | 'suea_kham'
  | 'phee_ha'
  | 'narrator';

interface Ch4Palette {
  skin: string;
  shirt: string;
  jong: string;
  sash: string;
  hair: string;
  bareChest?: boolean;
  mahatthaiHair?: boolean;
  wingHair?: boolean;
  lomphok?: boolean;
  headband?: string;
  isMonk?: boolean;
  isFemale?: boolean;
  isZombie?: boolean;
  isSoldier?: boolean;
  hasSword?: boolean;
  tattooed?: boolean;
}

const PALETTES: Record<Ch4CharacterKind, Ch4Palette> = {
  // ชายกรุงศรีฯ: เสื้อคอกลมผูกเชือกแขนกระบอก + ผ้าขาวม้าคาดเอว + โจงกระเบนสีครั่ง + ทรงมหาดไทย
  man: { skin: '#b97f56', shirt: '#ece2ce', jong: '#6b1d17', sash: '#b45309', hair: '#18181b', mahatthaiHair: true },
  // ลุงสินช่างตีดาบ: เสื้อผ้าดิบครามเข้ม + ผ้าขาวม้าพาดไหล่ + โจงกระเบน + ผ้าคาดหัว
  smith: { skin: '#9a6544', shirt: '#334155', jong: '#27272a', sash: '#d97706', hair: '#9ca3af', headband: '#92400e', mahatthaiHair: true },
  // แม่พุดซ้อน: สไบจีบสีกลีบบัว + ผ้านุ่งจีบหน้านางลายทอง + ผมปีกอยุธยาโบราณ
  phudsorn: { skin: '#cf9b72', shirt: '#cf9b72', jong: '#4c1d95', sash: '#ec4899', hair: '#1c1917', isFemale: true, wingHair: true, bareChest: true },
  // ขุนนางอยุธยา (พระยาวิชัย): เสื้อครุยขาวขลิบทอง + สมปักปูม + ลอมพอกขุนนางสูง!
  noble: { skin: '#c48f68', shirt: '#f8fafc', jong: '#7c2d12', sash: '#eab308', hair: '#18181b', lomphok: true },
  // ขุนรามทหารอยุธยา: เสื้อยันต์แดงลงอาคม + ตะกรุดคาดสะพาย + โจงกระเบนรั้ง + หมวก/ประเจียดรบ
  khun_ram: { skin: '#a8704a', shirt: '#991b1b', jong: '#450a0a', sash: '#facc15', hair: '#111827', headband: '#facc15', isSoldier: true, hasSword: true },
  // หลวงตาคง: ห่มจีวรพาดสังฆาฏิสีกรักเข้ม
  monk_khong: { skin: '#be8b64', shirt: '#9a5418', jong: '#78350f', sash: '#b45309', hair: '#be8b64', isMonk: true },
  // เด็กชายกล้า: เปลือยอกคล้องลูกประคำ + โจงกระเบนสั้น + ผมจุกกลางกระหม่อม!
  child_kla: { skin: '#c89268', shirt: '#c89268', jong: '#365314', sash: '#eab308', hair: '#111827', bareChest: true },
  // ชาวบ้านสามัญชน: เสื้อผ้าฝ้ายเปลือกไม้ + ผ้าขาวม้าคาดเอว + โจงกระเบน + ทรงมหาดไทย
  villager: { skin: '#b8825a', shirt: '#78716c', jong: '#1e293b', sash: '#a16207', hair: '#18181b', mahatthaiHair: true },
  // โจรปล้นเมือง: เปลือยอกสักยันต์ + ผ้าประเจียดแดงโพกหัว + โจงกระเบนดำถกเขมร
  bandit: { skin: '#8d5b3e', shirt: '#8d5b3e', jong: '#1c1917', sash: '#dc2626', hair: '#111827', headband: '#dc2626', bareChest: true, tattooed: true, hasSword: true },
  // ขุนโจรเสือคำ: เสื้อกั๊กหนังดำสักยันต์ + ผ้าประเจียดแดง + ดาบใหญ่
  suea_kham: { skin: '#7c4c32', shirt: '#18181b', jong: '#450a0a', sash: '#ef4444', hair: '#18181b', headband: '#b91c1c', hasSword: true },
  // ผีห่าอโยธยา: ร่างซีดคล้ำผ้าพันศพขาดรุ่งริ่ง คราบเลือด ตาแดง
  phee_ha: { skin: '#6b705c', shirt: '#d6d3d1', jong: '#57534e', sash: '#7f1d1d', hair: '#1c1917', isZombie: true, mahatthaiHair: true },
  narrator: { skin: '#b97f56', shirt: '#1e293b', jong: '#0f172a', sash: '#eab308', hair: '#18181b' },
};

/** Draws authentic Ayutthaya Kingdom period character outfits & hairstyles on a 2D canvas. */
export function drawCh4CharacterCanvas(
  ctx: CanvasRenderingContext2D,
  kind: Ch4CharacterKind,
  frame: number,
  w = 96,
  h = 128
): void {
  const p = PALETTES[kind] ?? PALETTES.villager;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.scale(w / 96, h / 128);

  const stride = frame === 1 ? 6 : frame === 3 ? -6 : 0;
  const bob = frame === 1 || frame === 3 ? -2 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(48, 121, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bare legs & feet (authentic Ayutthaya commoners walked barefoot)
  ctx.fillStyle = p.isZombie ? '#4b5563' : p.skin;
  ctx.fillRect(36 + stride * 0.5, 92, 9, 27);
  ctx.fillRect(51 - stride * 0.5, 92, 9, 27);

  // Jong Kraben (wrapped & tucked between legs, showing fold & gold pattern edge for nobles)
  ctx.fillStyle = p.jong;
  ctx.beginPath();
  ctx.roundRect(29, 71 + bob, 38, 28, 5);
  ctx.fill();
  ctx.fillStyle = kind === 'noble' ? '#eab308' : 'rgba(0,0,0,0.22)';
  ctx.fillRect(46, 76 + bob, 4, 23);

  // Torso (bare skin with Sabai/tattoos OR tied traditional tunic / Khrui robe)
  ctx.fillStyle = p.bareChest ? p.skin : p.shirt;
  ctx.beginPath();
  ctx.roundRect(28, 43 + bob, 40, 34, 8);
  ctx.fill();

  // Chest tattooing (สักยันต์เกราะเพชร) or Yantra Jacket lines (เสื้อยันต์ทหาร)
  if (p.tattooed) {
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(36, 48 + bob, 24, 18);
    ctx.beginPath();
    ctx.moveTo(36, 48 + bob);
    ctx.lineTo(60, 66 + bob);
    ctx.moveTo(60, 48 + bob);
    ctx.lineTo(36, 66 + bob);
    ctx.stroke();
  } else if (p.isSoldier) {
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(35, 47 + bob, 26, 20);
  }

  // Sabai wrap (women & monks), gold sash (nobles), or Pha Khao Ma waist tie
  ctx.fillStyle = p.sash;
  if (p.isFemale || p.isMonk) {
    ctx.beginPath();
    ctx.moveTo(28, 44 + bob);
    ctx.lineTo(44, 44 + bob);
    ctx.lineTo(68, 76 + bob);
    ctx.lineTo(52, 76 + bob);
    ctx.closePath();
    ctx.fill();
    if (p.isFemale) {
      // Decorative floral Sabai fold border
      ctx.fillStyle = '#fde047';
      ctx.fillRect(32, 72 + bob, 32, 3);
    }
  } else {
    ctx.fillRect(28, 69 + bob, 40, 6);
    if (kind === 'noble') {
      // Gold trim collar down front of Phraya Khrui robe
      ctx.fillStyle = '#eab308';
      ctx.fillRect(45, 44 + bob, 6, 28);
    }
  }

  if (p.isZombie) {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(41, 56 + bob, 6, 0, Math.PI * 2);
    ctx.arc(54, 64 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const armSwing = stride * 0.7;
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.roundRect(19, 46 + bob - armSwing * 0.4, 9, 28, 4);
  ctx.roundRect(68, 46 + bob + armSwing * 0.4, 9, 28, 4);
  ctx.fill();

  if (p.hasSword) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(73, 68 + bob + armSwing * 0.4);
    ctx.lineTo(87, 36 + bob);
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(70, 65 + bob + armSwing * 0.4, 8, 4);
  }

  // Head
  ctx.fillStyle = p.skin;
  ctx.fillRect(43, 34 + bob, 10, 12);
  ctx.beginPath();
  ctx.ellipse(48, 25 + bob, 15, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Authentic Ayutthaya Hairstyles & Headwear!
  if (!p.isMonk) {
    ctx.fillStyle = p.hair;
    if (p.lomphok) {
      // Nobleman Tall Pointed White Lomphok Crown Hat (ลอมพอกขุนนาง)!
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(33, 18 + bob);
      ctx.lineTo(48, 1 + bob);
      ctx.lineTo(63, 18 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.fillRect(33, 15 + bob, 30, 4);
    } else if (p.wingHair) {
      // Traditional Ayutthaya Lady "Phom Peek" winged crown + gold hairpin (ผมปีกสตรีอยุธยา)
      ctx.beginPath();
      ctx.ellipse(48, 13 + bob, 17, 7, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(30, 13 + bob, 7, 10);
      ctx.fillRect(59, 13 + bob, 7, 10);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(62, 12 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'child_kla') {
      // Topknot (ผมจุกเด็กอยุธยา)
      ctx.beginPath();
      ctx.arc(48, 7 + bob, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(44, 10 + bob, 8, 2.5);
    } else if (p.mahatthaiHair) {
      // Iconic Men's Mahatthai Tuft (ทรงมหาดไทยไถข้างไว้หย่อมบนกระหม่อม)!
      ctx.beginPath();
      ctx.ellipse(48, 12 + bob, 10, 5.5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(48, 13 + bob, 15, 8, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }
  if (p.headband) {
    ctx.fillStyle = p.headband;
    ctx.fillRect(33, 14 + bob, 30, 5);
  }

  // Facial features
  if (p.isZombie) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(42, 24 + bob, 2.8, 0, Math.PI * 2);
    ctx.arc(54, 24 + bob, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.ellipse(48, 32 + bob, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#111827';
    ctx.fillRect(40, 21 + bob, 5, 2);
    ctx.fillRect(51, 21 + bob, 5, 2);
    ctx.fillRect(41, 25 + bob, 3.2, 3.2);
    ctx.fillRect(52, 25 + bob, 3.2, 3.2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(45, 32 + bob, 6, 2);
  }

  ctx.restore();
}

const iconCache: Record<string, string> = {};

/** Returns crisp SVG data URLs for Ayutthaya Chapter 4 inventory icons. */
export function drawCh4ItemIconDataUrl(iconId: string): string {
  if (iconCache[iconId]) return iconCache[iconId];
  let svg = '';
  if (iconId === 'sword') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M12 50 L48 10 C53 15 47 26 20 53 Z" fill="#cbd5e1" stroke="#334155" stroke-width="2"/><rect x="8" y="45" width="12" height="5" rx="2" transform="rotate(-45 14 48)" fill="#eab308"/><rect x="4" y="51" width="10" height="4" rx="2" transform="rotate(-45 9 53)" fill="#78350f"/></svg>`;
  } else if (iconId === 'bow') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M18 10 Q48 32 18 54" fill="none" stroke="#92400e" stroke-width="5" stroke-linecap="round"/><line x1="18" y1="10" x2="18" y2="54" stroke="#e2e8f0" stroke-width="2"/><line x1="14" y1="32" x2="54" y2="32" stroke="#d97706" stroke-width="3"/><polygon points="56,32 48,27 48,37" fill="#cbd5e1"/></svg>`;
  } else if (iconId === 'torch') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="28" y="28" width="8" height="28" rx="3" fill="#78350f"/><path d="M32 6 C22 18 22 28 32 30 C42 28 42 18 32 6 Z" fill="#f97316"/><path d="M32 13 C27 20 27 27 32 28 C37 27 37 20 32 13 Z" fill="#fde047"/></svg>`;
  } else if (iconId === 'herb') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="40" rx="18" ry="15" fill="#9a3412"/><ellipse cx="32" cy="27" rx="13" ry="5" fill="#7c2d12"/><path d="M26 24 Q20 12 31 16 Q38 8 38 24" fill="#22c55e"/></svg>`;
  } else if (iconId === 'holywater') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M22 44 C22 54 42 54 42 44 L42 36 L22 36 Z" fill="#eab308"/><rect x="18" y="34" width="28" height="5" rx="2" fill="#ca8a04"/><rect x="29" y="18" width="6" height="16" fill="#fef08a"/><circle cx="32" cy="14" r="5" fill="#38bdf8"/></svg>`;
  } else if (iconId === 'bucket') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M18 22 L46 22 L42 54 L22 54 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/><path d="M20 22 Q32 8 44 22" fill="none" stroke="#94a3b8" stroke-width="3"/><ellipse cx="32" cy="25" rx="12" ry="4" fill="#38bdf8"/></svg>`;
  } else if (iconId === 'amulet') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="34" rx="14" ry="18" fill="#ca8a04" stroke="#fef08a" stroke-width="3"/><ellipse cx="32" cy="34" rx="8" ry="11" fill="#451a03"/></svg>`;
  } else {
    return drawCh2ItemIconDataUrl(iconId);
  }
  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  iconCache[iconId] = url;
  return url;
}
