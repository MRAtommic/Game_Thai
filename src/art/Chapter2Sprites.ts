import * as THREE from 'three';

export type Ch2CharacterKind =
  | 'noom'
  | 'mom'
  | 'sister'
  | 'monk'
  | 'butcher'
  | 'herbal_vendor'
  | 'fish_vendor'
  | 'yai_sai'
  | 'krasue';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  return [c, ctx];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  lightCol: string,
  shadowCol: string
): void {
  const grad = ctx.createRadialGradient(cx + 4, cy - 4, 4, cx, cy, ry + 2);
  grad.addColorStop(0, lightCol);
  grad.addColorStop(1, shadowCol);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pantCol: string,
  shoeCol: string
): void {
  drawRoundedRect(ctx, x, y, w, h - 8, 4, pantCol);
  drawRoundedRect(ctx, x - 2, y + h - 10, w + 5, 10, 4, shoeCol);
}

export function drawCh2CharacterCanvas(
  kind: Ch2CharacterKind,
  frame = 0,
  targetCanvas?: HTMLCanvasElement
): HTMLCanvasElement {
  const w = 128;
  const h = 192;
  const canvas = targetCanvas ?? document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, w, h);

  const bob = frame === 1 || frame === 3 ? -4 : 0;
  const stride = frame === 1 ? 12 : frame === 3 ? -12 : 0;
  const liftL = frame === 1 ? -4 : 0;
  const liftR = frame === 3 ? -4 : 0;

  if (kind === 'noom') {
    // หนุ่ม: Graduated Thai young man back in Isaan (chambray indigo/checkered rolled shirt + jeans + crossbag)
    drawLeg(ctx, 52 + stride, 122 + liftL, 13, 52, '#1e3a5f', '#1c1917');
    drawLeg(ctx, 68 - stride, 122 + liftR, 13, 52, '#23446e', '#1c1917');

    drawRoundedRect(ctx, 36 - stride * 0.85, 72 + bob, 11, 36, 5, '#3b5978');
    drawCircle(ctx, 41 - stride * 0.85, 110 + bob, 5, '#d9a47c');

    const shirt = ctx.createLinearGradient(42, 68, 86, 126);
    shirt.addColorStop(0, '#4f7396');
    shirt.addColorStop(1, '#314b66');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, shirt);
    ctx.fillStyle = '#e7e2d8';
    ctx.fillRect(60, 70 + bob, 8, 20); // white tee neck

    ctx.strokeStyle = '#5c4028';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(46, 70 + bob);
    ctx.lineTo(81, 118 + bob);
    ctx.stroke();

    drawRoundedRect(ctx, 81 + stride * 0.85, 72 + bob, 11, 36, 5, '#46688a');
    drawCircle(ctx, 86 + stride * 0.85, 110 + bob, 5, '#d9a47c');

    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#c7936c');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#dba67e', '#bf8a63');

    ctx.fillStyle = '#18181f';
    ctx.beginPath();
    ctx.ellipse(64, 26 + bob, 21, 13, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(42, 24 + bob, 8, 12);
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(72, 40 + bob, 4, 4);
    ctx.fillRect(56, 36 + bob, 7, 2);
    ctx.fillRect(71, 36 + bob, 7, 2);
  } else if (kind === 'mom') {
    // แม่คำ: Traditional Isaan mother in woven sin skirt + cream cotton blouse
    drawRoundedRect(ctx, 45, 118, 38, 52, 4, '#5e2129'); // Thai sin pattern skirt
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(45, 156, 38, 6);
    drawRoundedRect(ctx, 42, 68 + bob, 44, 52, 9, '#d6ceb8');
    drawRoundedRect(ctx, 35, 72 + bob, 10, 36, 4, '#c4bca6');
    drawCircle(ctx, 40, 110 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 83, 72 + bob, 10, 36, 4, '#d6ceb8');
    drawCircle(ctx, 88, 110 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#bd8962');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#cf9970', '#b37e57');
    ctx.fillStyle = '#262930';
    ctx.beginPath();
    ctx.ellipse(64, 25 + bob, 20, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(64, 15 + bob, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);
  } else if (kind === 'sister') {
    // น้องแก้ว: Younger teenage sister in soft pastel tee + dark skirt/shorts + twin pigtails/long hair
    drawLeg(ctx, 53, 126, 11, 46, '#d9a47c', '#7c2d12');
    drawLeg(ctx, 67, 126, 11, 46, '#d9a47c', '#7c2d12');
    drawRoundedRect(ctx, 46, 108 + bob, 36, 26, 4, '#1e293b');
    drawRoundedRect(ctx, 45, 72 + bob, 38, 42, 8, '#f59e0b');
    drawRoundedRect(ctx, 38, 75 + bob, 9, 32, 4, '#d97706');
    drawCircle(ctx, 42, 109 + bob, 4.5, '#e6b892');
    drawRoundedRect(ctx, 82, 75 + bob, 9, 32, 4, '#f59e0b');
    drawCircle(ctx, 86, 109 + bob, 4.5, '#e6b892');
    ctx.fillStyle = '#17171c';
    ctx.fillRect(42, 26 + bob, 44, 48); // long hair
    drawHead(ctx, 64, 43 + bob, 17, 19, '#e6b892', '#c7946c');
    ctx.fillStyle = '#17171c';
    ctx.beginPath();
    ctx.ellipse(64, 28 + bob, 19, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 42 + bob, 3.5, 4);
    ctx.fillRect(70, 42 + bob, 3.5, 4);
  } else if (kind === 'monk') {
    // หลวงพี่: Saffron-robed Thai forest monk
    drawRoundedRect(ctx, 43, 66 + bob, 42, 104, 8, '#c2590c'); // saffron robe (สบง/จีวร)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(43, 68 + bob);
    ctx.lineTo(85, 115 + bob);
    ctx.lineTo(85, 68 + bob);
    ctx.closePath();
    ctx.fill();
    drawCircle(ctx, 39, 112 + bob, 5, '#cf9970');
    drawCircle(ctx, 87, 112 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 58, 54 + bob, 12, 14, 4, '#bd8962');
    drawHead(ctx, 64, 39 + bob, 18, 21, '#cf9970', '#b37e57');
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 38 + bob, 4, 3.5);
    ctx.fillRect(71, 38 + bob, 4, 3.5);
    ctx.fillRect(56, 34 + bob, 7, 1.8);
    ctx.fillRect(70, 34 + bob, 7, 1.8);
  } else if (kind === 'butcher') {
    // เฮียตี๋เขียงหมู: Apron + towel + headband
    drawLeg(ctx, 51, 122, 13, 52, '#1f2937', '#18181b');
    drawLeg(ctx, 68, 122, 13, 52, '#1f2937', '#18181b');
    drawRoundedRect(ctx, 41, 68 + bob, 46, 58, 9, '#475569');
    drawRoundedRect(ctx, 46, 76 + bob, 36, 52, 4, '#e2e8f0');
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(54, 92 + bob, 18, 14); // meat smudges on apron
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#c48f68');
    drawHead(ctx, 64, 41 + bob, 20, 21, '#dca982', '#be8b65');
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(64, 25 + bob, 21, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);
  } else if (kind === 'herbal_vendor') {
    // ตาชม สมุนไพร: Straw farming hat + indigo/morhom farmer shirt
    drawLeg(ctx, 51, 122, 13, 52, '#172554', '#3f2e22');
    drawLeg(ctx, 68, 122, 13, 52, '#172554', '#3f2e22');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, '#1e3a8a'); // morhom indigo shirt
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#bd8962');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#cf9970', '#b37e57');
    // Traditional Thai woven bamboo hat (งอบ / หมวกสาน)
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.moveTo(30, 31 + bob);
    ctx.lineTo(64, 10 + bob);
    ctx.lineTo(98, 31 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);
  } else if (kind === 'fish_vendor') {
    // ป้าบัวแผงปลา: Auntie in blue-teal market shirt + indigo wrap skirt + white head towel
    drawRoundedRect(ctx, 45, 118, 38, 52, 4, '#1e3a5f');
    drawRoundedRect(ctx, 41, 68 + bob, 46, 54, 9, '#0284c7');
    drawRoundedRect(ctx, 47, 78 + bob, 34, 44, 4, '#38bdf8'); // market apron
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#c7936c');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#d6a17a', '#b37e57');
    ctx.fillStyle = '#e2e8f0'; // market head cloth
    ctx.beginPath();
    ctx.ellipse(64, 24 + bob, 20, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);
  } else if (kind === 'yai_sai') {
    // ยายสาย: Stooped creepy village elder woman in black shawl + grey hair
    drawRoundedRect(ctx, 45, 118, 38, 52, 4, '#1f1e24');
    drawRoundedRect(ctx, 42, 72 + bob, 44, 52, 9, '#2e2b33');
    drawRoundedRect(ctx, 58, 58 + bob, 12, 14, 4, '#a88367');
    drawHead(ctx, 64, 44 + bob, 18, 20, '#b59175', '#916e54');
    ctx.fillStyle = '#9ca3af'; // silver-grey hair bun
    ctx.beginPath();
    ctx.ellipse(64, 28 + bob, 19, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(54, 21 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 42 + bob, 4, 4);
    ctx.fillRect(70, 42 + bob, 4, 4);
  } else {
    // ผีกระสือ (Krasue!): Floating female head + eerily glowing suspended heart/lungs/entrails!
    const fy = frame % 2 === 1 ? -6 : 2;
    const sway = frame % 2 === 1 ? 5 : -5;

    // Eerie bioluminescent green-crimson aura around organs
    const aura = ctx.createRadialGradient(64, 118 + fy, 6, 64, 118 + fy, 54);
    aura.addColorStop(0, 'rgba(132, 204, 22, 0.55)');
    aura.addColorStop(0.5, 'rgba(185, 28, 28, 0.35)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    // Trailing dripping intestines swaying beneath severed neck
    ctx.lineWidth = 5;
    [
      { dx: -12, col: '#b91c1c', len: 168 },
      { dx: -4, col: '#dc2626', len: 178 },
      { dx: 5, col: '#84cc16', len: 172 },
      { dx: 13, col: '#991b1b', len: 162 },
    ].forEach((gut, idx) => {
      ctx.strokeStyle = gut.col;
      ctx.beginPath();
      ctx.moveTo(64 + gut.dx * 0.5, 68 + fy);
      ctx.quadraticCurveTo(64 + gut.dx + sway * (idx % 2 === 0 ? 1 : -1), 120 + fy, 64 + gut.dx, gut.len + fy);
      ctx.stroke();
    });

    // Glowing heart & lungs cluster
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(54, 86 + fy, 10, 15, -0.2, 0, Math.PI * 2);
    ctx.ellipse(74, 86 + fy, 10, 15, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.arc(64, 92 + fy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Flowing black hair behind severed floating head
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(40, 26 + fy);
    ctx.lineTo(30, 86 + fy);
    ctx.lineTo(98, 86 + fy);
    ctx.lineTo(88, 26 + fy);
    ctx.closePath();
    ctx.fill();

    // Pale floating severed face + piercing glowing eyes + bloody mouth
    drawHead(ctx, 64, 42 + fy, 18, 22, '#cbd5e1', '#64748b');
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(56, 40 + fy, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(72, 40 + fy, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bef264'; // glowing green-yellow pinprick pupils!
    ctx.beginPath();
    ctx.arc(56, 40 + fy, 2.1, 0, Math.PI * 2);
    ctx.arc(72, 40 + fy, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(64, 54 + fy, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

export function createCh2CharacterTexture(kind: Ch2CharacterKind, frame = 0): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(drawCh2CharacterCanvas(kind, frame));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCh2BikeRiderTexture(frame = 0): THREE.CanvasTexture {
  // Side-profile seated cycling pose facing +X (saddle hip on left-center, arms reaching +X handlebar, 4 crank phases)
  const [c, ctx] = makeCanvas(128, 192);
  const phase = (frame % 4) * (Math.PI / 2);
  const pedalRx = Math.cos(phase) * 14;
  const pedalRy = Math.sin(phase) * 13;
  const bounce = Math.abs(Math.sin(phase)) * -2;

  const hipX = 48;
  const hipY = 108 + bounce;
  const crankX = 60;
  const crankY = 148;

  // Far leg (darker denim, behind crank)
  const fFootX = crankX - pedalRx;
  const fFootY = crankY - pedalRy;
  const fKneeX = (hipX + fFootX) * 0.5 + 16;
  const fKneeY = (hipY + fFootY) * 0.5 - 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#172554';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(fKneeX, fKneeY);
  ctx.lineTo(fFootX, fFootY);
  ctx.stroke();
  drawRoundedRect(ctx, fFootX - 6, fFootY - 3, 14, 7, 3, '#111827');

  // Far arm gripping handlebar
  ctx.strokeStyle = '#334e68';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(64, 70 + bounce);
  ctx.lineTo(80, 79 + bounce);
  ctx.lineTo(95, 84);
  ctx.stroke();

  // Torso leaning forward onto handlebars
  ctx.save();
  ctx.translate(hipX + 6, hipY - 2);
  ctx.rotate(0.32); // forward cyclist lean toward +X
  drawRoundedRect(ctx, -16, -46, 32, 48, 8, '#3f5f7f');
  ctx.fillStyle = '#5c4028'; // shoulder strap
  ctx.fillRect(-10, -45, 7, 44);
  ctx.restore();

  // Neck + Head looking forward (+X)
  drawRoundedRect(ctx, 64, 52 + bounce, 11, 13, 4, '#c7936c');
  drawHead(ctx, 73, 39 + bounce, 17, 19, '#dba67e', '#bf8a63');
  ctx.fillStyle = '#18181f';
  ctx.beginPath();
  ctx.ellipse(71, 25 + bounce, 19, 11, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(52, 24 + bounce, 8, 13);
  ctx.fillStyle = '#111';
  ctx.fillRect(80, 38 + bounce, 4, 4); // eye facing right
  ctx.fillRect(78, 34 + bounce, 7, 2);

  // Near leg pedaling in full crank motion (front side of bike frame!)
  const nFootX = crankX + pedalRx;
  const nFootY = crankY + pedalRy;
  const nKneeX = (hipX + nFootX) * 0.5 + 18;
  const nKneeY = (hipY + nFootY) * 0.5 - 8;
  ctx.strokeStyle = '#23446e';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(nKneeX, nKneeY);
  ctx.lineTo(nFootX, nFootY);
  ctx.stroke();
  drawRoundedRect(ctx, nFootX - 6, nFootY - 3, 15, 8, 3, '#1c1917');

  // Near arm bent at elbow holding front handlebar grip
  ctx.strokeStyle = '#4f7396';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(62, 69 + bounce);
  ctx.lineTo(79, 80 + bounce);
  ctx.lineTo(96, 86);
  ctx.stroke();
  drawCircle(ctx, 97, 86, 5, '#d9a47c');

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function drawCh2ItemIconDataUrl(itemId: string): string {
  const [c, ctx] = makeCanvas(48, 48);
  if (itemId === 'inhaler') {
    ctx.fillStyle = '#e7ece8';
    ctx.fillRect(18, 10, 12, 28);
    ctx.fillStyle = '#2b7a4b';
    ctx.fillRect(18, 8, 12, 9);
    ctx.fillRect(18, 24, 12, 14);
  } else if (itemId === 'market_groceries') {
    // Woven market basket filled with fresh meat & greens
    ctx.fillStyle = '#92400e';
    ctx.fillRect(10, 20, 28, 18);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(24, 20, 10, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(14, 15, 10, 7);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(25, 13, 10, 9);
  } else if (itemId === 'krasue_ash') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 14, 28, 24);
    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.arc(24, 26, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (itemId === 'jujube_thorns') {
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, 38);
    ctx.lineTo(40, 10);
    ctx.stroke();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    [
      [16, 30, 10, 22],
      [24, 24, 34, 28],
      [30, 18, 22, 10],
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  } else if (itemId === 'herbal_pouch') {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(14, 16, 20, 22);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(18, 8, 12, 10);
  } else if (itemId === 'holy_water') {
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(17, 14, 14, 26);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(20, 7, 8, 7);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(19, 22, 10, 10);
  } else if (itemId === 'rotten_sweet') {
    // Leaf-wrapped Thai sticky rice sweet with eerie green slime stain
    ctx.fillStyle = '#365314';
    ctx.fillRect(10, 18, 28, 16);
    ctx.fillStyle = '#a3e635';
    ctx.fillRect(18, 22, 12, 8);
  } else if (itemId === 'silver_betel_box') {
    // Engraved silver antique Thai betel chest
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(11, 15, 26, 20);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(13, 17, 22, 16);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(20, 22, 8, 6);
  } else if (itemId === 'sacred_incense') {
    // 3 ritual incense sticks glowing amber
    ctx.strokeStyle = '#d6b384';
    ctx.lineWidth = 2.5;
    [18, 24, 30].forEach((ix) => {
      ctx.beginPath();
      ctx.moveTo(ix, 38);
      ctx.lineTo(ix, 12);
      ctx.stroke();
      ctx.fillStyle = '#f97316';
      ctx.fillRect(ix - 1.5, 9, 3, 4);
    });
  } else if (itemId === 'sai_sin') {
    // Blessed white Thai Sai Sin sacred thread spool
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(24, 24, 13, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(24, 24, 9, 6, 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillRect(21, 16, 6, 16);
  } else if (itemId === 'bicycle') {
    // Classic rural Isaan bicycle icon
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(13, 31, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(35, 31, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(13, 31);
    ctx.lineTo(23, 31);
    ctx.lineTo(31, 20);
    ctx.lineTo(18, 20);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(35, 31);
    ctx.lineTo(30, 15);
    ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(15, 16, 7, 3);
  } else if (itemId === 'takian_charm') {
    // 7-color Takian sacred cloth ribbon charm (ผ้าเจ็ดสี)
    const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    cols.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(10 + i * 4, 15, 4, 24 - (i % 2) * 4);
    });
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(9, 12, 30, 5);
  } else {
    // sacred_knife (มีดหมอลงอาคม)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(14, 32);
    ctx.lineTo(38, 10);
    ctx.lineTo(34, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(10, 30, 8, 10);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(16, 28, 6, 4);
  }
  return c.toDataURL();
}
