import { drawCh2ItemIconDataUrl } from './Chapter2Sprites';

export type Ch4CharacterKind =
  | 'man'
  | 'smith'
  | 'phudsorn'
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
  headband?: string;
  isMonk?: boolean;
  isFemale?: boolean;
  isZombie?: boolean;
  hasSword?: boolean;
}

const PALETTES: Record<Ch4CharacterKind, Ch4Palette> = {
  man: { skin: '#b97f56', shirt: '#f1e6d2', jong: '#7c2d12', sash: '#ca8a04', hair: '#18181b' },
  smith: { skin: '#9a6544', shirt: '#44403c', jong: '#292524', sash: '#78350f', hair: '#9ca3af', headband: '#92400e' },
  phudsorn: { skin: '#cf9b72', shirt: '#be185d', jong: '#4c1d95', sash: '#f472b6', hair: '#1c1917', isFemale: true },
  khun_ram: { skin: '#a8704a', shirt: '#991b1b', jong: '#7f1d1d', sash: '#facc15', hair: '#111827', headband: '#b91c1c', hasSword: true },
  monk_khong: { skin: '#be8b64', shirt: '#d97706', jong: '#b45309', sash: '#92400e', hair: '#be8b64', isMonk: true },
  child_kla: { skin: '#c89268', shirt: '#f59e0b', jong: '#365314', sash: '#fde047', hair: '#111827' },
  villager: { skin: '#b8825a', shirt: '#78716c', jong: '#1e293b', sash: '#a16207', hair: '#18181b' },
  bandit: { skin: '#8d5b3e', shirt: '#1c1917', jong: '#450a0a', sash: '#dc2626', hair: '#111827', headband: '#dc2626', hasSword: true },
  suea_kham: { skin: '#7c4c32', shirt: '#27272a', jong: '#7f1d1d', sash: '#ef4444', hair: '#18181b', headband: '#991b1b', hasSword: true },
  phee_ha: { skin: '#6b705c', shirt: '#57534e', jong: '#3f3f46', sash: '#7f1d1d', hair: '#1c1917', isZombie: true },
  narrator: { skin: '#b97f56', shirt: '#1e293b', jong: '#0f172a', sash: '#eab308', hair: '#18181b' },
};

/** Draws a crisp Ayutthaya period 2.5D character sprite on a 2D canvas (96x128 or 96x96). */
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

  // Ground contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(48, 121, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs & traditional bare feet / wraps
  ctx.fillStyle = p.isZombie ? '#4b5563' : '#78350f';
  ctx.fillRect(36 + stride * 0.5, 92, 9, 27);
  ctx.fillRect(51 - stride * 0.5, 92, 9, 27);
  ctx.fillStyle = p.skin;
  ctx.fillRect(35 + stride * 0.5, 114, 11, 6);
  ctx.fillRect(50 - stride * 0.5, 114, 11, 6);

  // Jong Kraben (traditional Thai wrapped lower garment)
  ctx.fillStyle = p.jong;
  ctx.beginPath();
  ctx.roundRect(30, 72 + bob, 36, 26, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(46, 76 + bob, 4, 22);

  // Upper body: Thai cotton shirt / monk robe / Sabai wrap
  ctx.fillStyle = p.shirt;
  ctx.beginPath();
  ctx.roundRect(28, 43 + bob, 40, 34, 8);
  ctx.fill();

  // Sash / Sabai diagonal wrap
  ctx.fillStyle = p.sash;
  if (p.isFemale || p.isMonk) {
    ctx.beginPath();
    ctx.moveTo(29, 44 + bob);
    ctx.lineTo(44, 44 + bob);
    ctx.lineTo(68, 76 + bob);
    ctx.lineTo(52, 76 + bob);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(28, 69 + bob, 40, 6);
  }

  // Zombie blood stains
  if (p.isZombie) {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(41, 56 + bob, 6, 0, Math.PI * 2);
    ctx.arc(54, 64 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Arms
  const armSwing = stride * 0.7;
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.roundRect(19, 46 + bob - armSwing * 0.4, 9, 28, 4);
  ctx.roundRect(68, 46 + bob + armSwing * 0.4, 9, 28, 4);
  ctx.fill();

  // Optional sword slung on back/hand
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

  // Neck & Head
  ctx.fillStyle = p.skin;
  ctx.fillRect(43, 34 + bob, 10, 12);
  ctx.beginPath();
  ctx.ellipse(48, 25 + bob, 15, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair / Thai Mahatthai cut / Bun / Headband
  if (!p.isMonk) {
    ctx.fillStyle = p.hair;
    ctx.beginPath();
    ctx.ellipse(48, 13 + bob, 15, 8, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    if (p.isFemale) {
      ctx.beginPath();
      ctx.arc(48, 7 + bob, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'child_kla') {
      // Traditional Thai topknot (ผมจุก)
      ctx.beginPath();
      ctx.arc(48, 7 + bob, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(44, 10 + bob, 8, 2.5);
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
