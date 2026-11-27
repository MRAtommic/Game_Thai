import * as THREE from 'three';

export type CharacterKind =
  | 'player'
  | 'uncle'
  | 'tom'
  | 'vendor'
  | 'student'
  | 'worker'
  | 'noodle_chef'
  | 'worker_yellow'
  | 'office_lady'
  | 'uncle_local'
  | 'gang_maroon'
  | 'gang_denim'
  | 'gang_hoodie'
  | 'gang_plaid'
  | 'clerk'
  | 'zombie'
  | 'prim'
  | 'prim_chase'
  | 'win_moto'
  | 'police'
  | 'laundry_lady'
  | 'electrician';

/**
 * Draws a high-resolution (128x192) illustrated/painted 2D character sprite.
 */
export function drawCharacterCanvas(
  kind: CharacterKind,
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
  const stride = frame === 1 ? 13 : frame === 3 ? -13 : 0;
  const liftL = frame === 1 ? -4 : 0;
  const liftR = frame === 3 ? -4 : 0;

  // Ground contact shadow is rendered flat on the 3D floor in DormWorld.ts

  if (kind === 'player') {
    drawLeg(ctx, 52 + stride, 122 + liftL, 13, 52, '#1c2434', '#0f1219');
    drawLeg(ctx, 68 - stride, 122 + liftR, 13, 52, '#242e42', '#131720');

    drawRoundedRect(ctx, 36 - stride * 0.85, 72 + bob, 11, 44, 5, '#cfd6e2');
    drawCircle(ctx, 41 - stride * 0.85, 117 + bob, 5, '#deb08a');

    const shirtGrad = ctx.createLinearGradient(44, 68, 84, 126);
    shirtGrad.addColorStop(0, '#eef1f6');
    shirtGrad.addColorStop(1, '#c4cddb');
    drawRoundedRect(ctx, 43, 68 + bob, 42, 58, 9, shirtGrad);

    ctx.fillStyle = '#1d273b';
    ctx.beginPath();
    ctx.moveTo(61, 72 + bob);
    ctx.lineTo(67, 72 + bob);
    ctx.lineTo(68, 112 + bob);
    ctx.lineTo(64, 118 + bob);
    ctx.lineTo(60, 112 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4e3b27';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(47, 70 + bob);
    ctx.lineTo(82, 118 + bob);
    ctx.stroke();
    drawRoundedRect(ctx, 73, 108 + bob, 20, 22, 4, '#5c442c');

    // Front arm swinging opposite to front leg
    drawRoundedRect(ctx, 81 + stride * 0.85, 72 + bob, 11, 43, 5, '#e2e8f2');
    drawCircle(ctx, 86 + stride * 0.85, 116 + bob, 5, '#e6b892');

    drawRoundedRect(ctx, 58, 56 + bob, 12, 15, 4, '#d3a27a');
    drawHead(ctx, 64, 41 + bob, 19, 22, '#e6b892', '#cc9970');

    ctx.fillStyle = '#171922';
    ctx.beginPath();
    ctx.ellipse(63, 27 + bob, 22, 13, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(41, 28 + bob);
    ctx.quadraticCurveTo(43, 44 + bob, 48, 42 + bob);
    ctx.lineTo(52, 30 + bob);
    ctx.lineTo(62, 34 + bob);
    ctx.lineTo(74, 29 + bob);
    ctx.lineTo(84, 38 + bob);
    ctx.quadraticCurveTo(87, 25 + bob, 80, 19 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#151821';
    ctx.fillRect(58, 39 + bob, 4, 5);
    ctx.fillRect(72, 39 + bob, 4, 5);
    ctx.fillRect(56, 35 + bob, 7, 2);
    ctx.fillRect(71, 35 + bob, 7, 2);
  } else if (kind === 'uncle') {
    drawLeg(ctx, 51, 122, 14, 52, '#162033', '#0d1016');
    drawLeg(ctx, 67, 122, 14, 52, '#1d2a42', '#0d1016');

    const uniGrad = ctx.createLinearGradient(42, 68, 86, 126);
    uniGrad.addColorStop(0, '#6a87a8');
    uniGrad.addColorStop(1, '#445c78');
    drawRoundedRect(ctx, 41, 68 + bob, 46, 58, 9, uniGrad);

    ctx.fillStyle = '#1b1d24';
    ctx.fillRect(41, 115 + bob, 46, 7);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(60, 115 + bob, 8, 7);

    ctx.fillStyle = '#e8c456';
    ctx.beginPath();
    ctx.arc(75, 84 + bob, 4.5, 0, Math.PI * 2);
    ctx.fill();

    drawRoundedRect(ctx, 34, 72 + bob, 11, 42, 5, '#587494');
    drawCircle(ctx, 39, 115 + bob, 5.5, '#c79069');
    drawRoundedRect(ctx, 84, 72 + bob, 11, 42, 5, '#6481a3');
    drawCircle(ctx, 89, 115 + bob, 5.5, '#c79069');
    drawRoundedRect(ctx, 88, 111 + bob, 14, 7, 2, '#282d36');

    drawRoundedRect(ctx, 58, 56 + bob, 12, 15, 4, '#b8825b');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#c9936c', '#ab7650');

    ctx.fillStyle = '#d8dce3';
    drawRoundedRect(ctx, 56, 50 + bob, 18, 4, 2, '#d8dce3');
    ctx.fillStyle = '#151821';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);

    ctx.fillStyle = '#17253d';
    ctx.beginPath();
    ctx.ellipse(64, 24 + bob, 22, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(43, 21 + bob, 42, 7);
    ctx.fillStyle = '#0e1624';
    ctx.fillRect(45, 27 + bob, 46, 4);
    ctx.fillStyle = '#e8c456';
    ctx.beginPath();
    ctx.arc(64, 20 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'tom') {
    drawLeg(ctx, 51, 122, 13, 52, '#181a21', '#26201c');
    drawLeg(ctx, 68, 122, 13, 52, '#20222b', '#26201c');

    const jkt = ctx.createLinearGradient(42, 66, 86, 126);
    jkt.addColorStop(0, '#5a2128');
    jkt.addColorStop(1, '#361318');
    drawRoundedRect(ctx, 41, 66 + bob, 46, 60, 8, jkt);
    ctx.fillStyle = '#22242c';
    ctx.fillRect(58, 68 + bob, 12, 58);

    drawRoundedRect(ctx, 34, 70 + bob, 11, 44, 5, '#471a20');
    drawCircle(ctx, 39, 115 + bob, 5, '#d6a680');
    drawRoundedRect(ctx, 84, 70 + bob, 11, 44, 5, '#542027');
    drawCircle(ctx, 89, 115 + bob, 5, '#d6a680');

    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#c7956f');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#daab85', '#bf8c65');

    ctx.fillStyle = '#141318';
    ctx.beginPath();
    ctx.ellipse(64, 26 + bob, 22, 13, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(42, 24 + bob, 6, 15);
    ctx.fillStyle = '#111';
    ctx.fillRect(57, 39 + bob, 5, 3.5);
    ctx.fillRect(71, 39 + bob, 5, 3.5);
    ctx.fillRect(56, 35 + bob, 7, 2.5);
    ctx.fillRect(70, 35 + bob, 7, 2.5);
  } else if (kind === 'vendor') {
    // Pa Kim: Thai market food stall auntie with floral shirt & apron
    drawLeg(ctx, 51, 124, 13, 48, '#2b2d36', '#6b4226');
    drawLeg(ctx, 68, 124, 13, 48, '#2b2d36', '#6b4226');

    const blouse = ctx.createLinearGradient(42, 68, 86, 126);
    blouse.addColorStop(0, '#c8687a');
    blouse.addColorStop(1, '#944353');
    drawRoundedRect(ctx, 41, 68 + bob, 46, 58, 10, blouse);

    // Apron
    drawRoundedRect(ctx, 47, 78 + bob, 34, 52, 6, '#e8e2d0');
    ctx.fillStyle = '#b84242';
    ctx.fillRect(47, 100 + bob, 34, 12);

    // Arms holding ladle/bag
    drawRoundedRect(ctx, 33, 72 + bob, 11, 38, 5, '#b85a6c');
    drawCircle(ctx, 38, 112 + bob, 5.5, '#d6a47e');
    drawRoundedRect(ctx, 84, 72 + bob, 11, 38, 5, '#c8687a');
    drawCircle(ctx, 89, 112 + bob, 5.5, '#d6a47e');

    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#c7936c');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#dba982', '#be8a63');

    // Hair bun
    ctx.fillStyle = '#1b1a20';
    ctx.beginPath();
    ctx.ellipse(64, 25 + bob, 20, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(64, 15 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);
    ctx.fillStyle = '#7c3434';
    ctx.fillRect(60, 50 + bob, 8, 2.5);
  } else if (kind === 'student') {
    // Thai school/high-school kid walking with backpack
    drawLeg(ctx, 53 + stride, 126 + liftL, 11, 46, '#1e293b', '#111');
    drawLeg(ctx, 67 - stride, 126 + liftR, 11, 46, '#1e293b', '#111');
    // Backpack behind
    drawRoundedRect(ctx, 35, 76 + bob, 14, 34, 4, '#2563eb');
    // White school shirt
    drawRoundedRect(ctx, 45, 72 + bob, 38, 54, 8, '#e2e8f0');
    drawRoundedRect(ctx, 80 + stride * 0.6, 76 + bob, 10, 38, 4, '#cbd5e1');
    drawCircle(ctx, 85 + stride * 0.6, 115 + bob, 4.5, '#e2b38c');
    drawRoundedRect(ctx, 59, 60 + bob, 10, 14, 4, '#d1a079');
    drawHead(ctx, 64, 45 + bob, 17, 19, '#e2b38c', '#c7946c');
    ctx.fillStyle = '#14171f';
    ctx.beginPath();
    ctx.ellipse(64, 32 + bob, 19, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 44 + bob, 3.5, 4);
    ctx.fillRect(71, 44 + bob, 3.5, 4);
  } else if (kind === 'worker') {
    // Factory technician in olive-green work jacket + cap
    drawLeg(ctx, 51 + stride, 122 + liftL, 13, 52, '#24292e', '#111318');
    drawLeg(ctx, 68 - stride, 122 + liftR, 13, 52, '#24292e', '#111318');
    const jacket = ctx.createLinearGradient(42, 68, 86, 126);
    jacket.addColorStop(0, '#4d6b47');
    jacket.addColorStop(1, '#33472e');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, jacket);
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(59, 70 + bob, 10, 42); // inner tee
    drawRoundedRect(ctx, 35 - stride * 0.5, 72 + bob, 10, 40, 4, '#3f573a');
    drawCircle(ctx, 40 - stride * 0.5, 113 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 83 + stride * 0.5, 72 + bob, 10, 40, 4, '#4d6b47');
    drawCircle(ctx, 88 + stride * 0.5, 113 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#bd8962');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#cf9970', '#b37e57');
    // Goatee + dark cap
    ctx.fillStyle = '#221f22';
    ctx.fillRect(59, 53 + bob, 10, 4);
    ctx.fillStyle = '#1b1d24';
    ctx.beginPath();
    ctx.ellipse(64, 25 + bob, 21, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(46, 25 + bob, 42, 4);
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);
  } else if (kind === 'noodle_chef') {
    // Noodle cart owner Hia Moo: white tee, red street-food apron, mustache & headband
    drawLeg(ctx, 51, 122, 13, 52, '#1f2937', '#292524');
    drawLeg(ctx, 68, 122, 13, 52, '#1f2937', '#292524');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, '#d6d3ce');
    drawRoundedRect(ctx, 47, 78 + bob, 34, 50, 5, '#991b1b'); // red apron
    drawRoundedRect(ctx, 35, 72 + bob, 10, 38, 4, '#cbd5e1');
    drawCircle(ctx, 40, 111 + bob, 5, '#dca982');
    drawRoundedRect(ctx, 83, 72 + bob, 10, 38, 4, '#e2e8f0');
    drawCircle(ctx, 88, 111 + bob, 5, '#dca982');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#c48f68');
    drawHead(ctx, 64, 41 + bob, 20, 21, '#dca982', '#be8b65');
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(64, 26 + bob, 21, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(44, 27 + bob, 40, 5); // cloth headband
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(57, 48 + bob, 14, 3); // mustache
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 3.5);
    ctx.fillRect(71, 40 + bob, 4, 3.5);
  } else if (kind === 'worker_yellow') {
    // Construction / plant worker in bright hi-vis yellow vest + black shirt + glasses
    drawLeg(ctx, 51 + stride, 122 + liftL, 13, 52, '#27272a', '#09090b');
    drawLeg(ctx, 68 - stride, 122 + liftR, 13, 52, '#27272a', '#09090b');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, '#1f2937');
    drawRoundedRect(ctx, 45, 72 + bob, 38, 52, 6, '#ca8a04'); // safety vest
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(45, 96 + bob, 38, 6); // reflective stripe
    drawRoundedRect(ctx, 35 - stride * 0.5, 72 + bob, 10, 40, 4, '#27272a');
    drawCircle(ctx, 40 - stride * 0.5, 113 + bob, 5, '#c48a62');
    drawRoundedRect(ctx, 83 + stride * 0.5, 72 + bob, 10, 40, 4, '#27272a');
    drawCircle(ctx, 88 + stride * 0.5, 113 + bob, 5, '#c48a62');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#b37a54');
    drawHead(ctx, 64, 41 + bob, 18, 21, '#c48a62', '#a8704c');
    ctx.fillStyle = '#111318';
    ctx.beginPath();
    ctx.ellipse(64, 25 + bob, 20, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 37 + bob, 8, 6);
    ctx.strokeRect(67, 37 + bob, 8, 6);
    ctx.fillStyle = '#111';
    ctx.fillRect(57, 39 + bob, 3, 3);
    ctx.fillRect(70, 39 + bob, 3, 3);
  } else if (kind === 'office_lady') {
    // Casual neighborhood woman in terracotta cardigan + dark skirt/pants + long hair
    drawLeg(ctx, 52 + stride, 124 + liftL, 11, 50, '#1e2430', '#44403c');
    drawLeg(ctx, 67 - stride, 124 + liftR, 11, 50, '#1e2430', '#44403c');
    drawRoundedRect(ctx, 44, 70 + bob, 40, 54, 9, '#b45348');
    drawRoundedRect(ctx, 37 - stride * 0.5, 74 + bob, 9, 38, 4, '#9e4339');
    drawCircle(ctx, 41 - stride * 0.5, 113 + bob, 4.5, '#ecc2a0');
    drawRoundedRect(ctx, 82 + stride * 0.5, 74 + bob, 9, 38, 4, '#b45348');
    drawCircle(ctx, 86 + stride * 0.5, 113 + bob, 4.5, '#ecc2a0');
    drawRoundedRect(ctx, 59, 57 + bob, 10, 14, 4, '#dab08c');
    ctx.fillStyle = '#1d1614';
    ctx.fillRect(43, 28 + bob, 42, 46); // back long hair
    drawHead(ctx, 64, 42 + bob, 17, 20, '#ecc2a0', '#d1a27e');
    ctx.fillStyle = '#1d1614';
    ctx.beginPath();
    ctx.ellipse(64, 27 + bob, 19, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 41 + bob, 3.5, 4);
    ctx.fillRect(70, 41 + bob, 3.5, 4);
    ctx.fillStyle = '#a83844';
    ctx.fillRect(61, 51 + bob, 6, 2);
  } else if (kind === 'uncle_local') {
    // Older Thai uncle in plaid maroon/cream shirt & grey-streaked hair
    drawLeg(ctx, 51, 122, 13, 52, '#334155', '#3f2e22');
    drawLeg(ctx, 68, 122, 13, 52, '#334155', '#3f2e22');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, '#7c2d12');
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(50, 68 + bob, 3, 58);
    ctx.fillRect(74, 68 + bob, 3, 58);
    ctx.fillRect(42, 92 + bob, 44, 3);
    drawRoundedRect(ctx, 35, 72 + bob, 10, 38, 4, '#6b2510');
    drawCircle(ctx, 40, 111 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 83, 72 + bob, 10, 38, 4, '#7c2d12');
    drawCircle(ctx, 88, 111 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#bc8760');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#cf9970', '#b37e57');
    ctx.fillStyle = '#64748b'; // salt-and-pepper hair
    ctx.beginPath();
    ctx.ellipse(64, 25 + bob, 20, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(57, 50 + bob, 14, 3);
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 4, 4);
    ctx.fillRect(71, 40 + bob, 4, 4);
  } else if (
    kind === 'gang_maroon' ||
    kind === 'gang_denim' ||
    kind === 'gang_hoodie' ||
    kind === 'gang_plaid'
  ) {
    // 4 distinct Thai vocational-tech delinquents smoking cigarettes!
    const topCol =
      kind === 'gang_maroon'
        ? '#6b1d28'
        : kind === 'gang_denim'
        ? '#1e3a5f'
        : kind === 'gang_hoodie'
        ? '#1f2329'
        : '#3f2e24';
    const pantCol = kind === 'gang_hoodie' ? '#111318' : '#1e293b';
    drawLeg(ctx, 51, 122, 13, 52, pantCol, '#18181b');
    drawLeg(ctx, 68, 122, 13, 52, pantCol, '#18181b');
    drawRoundedRect(ctx, 41, 68 + bob, 46, 58, 8, topCol);
    if (kind === 'gang_denim') {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(57, 70 + bob, 14, 52); // white inner tank under open denim vest
    } else if (kind === 'gang_plaid') {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(56, 70 + bob, 16, 54);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(42, 86 + bob, 14, 4);
      ctx.fillRect(72, 86 + bob, 14, 4);
    } else if (kind === 'gang_maroon') {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(59, 68 + bob, 10, 56);
    }
    // Raised arm holding lit cigarette + subtle glowing ember!
    drawRoundedRect(ctx, 35, 72 + bob, 10, 40, 4, topCol);
    drawCircle(ctx, 40, 113 + bob, 5, '#cf9970');
    drawRoundedRect(ctx, 83, 66 + bob, 10, 26, 4, topCol);
    drawCircle(ctx, 88, 65 + bob, 5, '#cf9970');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(88, 61 + bob, 10, 3); // cigarette
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(96, 61 + bob, 3, 3); // glowing orange ember

    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#bd8962');
    drawHead(ctx, 64, 41 + bob, 19, 21, '#cf9970', '#b37e57');
    ctx.fillStyle = '#141418';
    if (kind === 'gang_maroon') {
      // Mullet / long back hair + undercut
      ctx.fillRect(42, 24 + bob, 8, 28);
      ctx.beginPath();
      ctx.ellipse(64, 26 + bob, 20, 12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'gang_hoodie') {
      ctx.beginPath();
      ctx.ellipse(64, 28 + bob, 23, 15, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(44, 28 + bob, 14, 15);
    } else {
      ctx.beginPath();
      ctx.ellipse(64, 25 + bob, 21, 13, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    if (kind === 'gang_denim') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(54, 37 + bob, 10, 6); // dark shades!
      ctx.fillRect(67, 37 + bob, 10, 6);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(58, 40 + bob, 4, 3.5);
      ctx.fillRect(71, 40 + bob, 4, 3.5);
      ctx.fillRect(56, 36 + bob, 7, 2);
      ctx.fillRect(70, 36 + bob, 7, 2);
    }
  } else if (kind === 'clerk') {
    // 24-Seven convenience store clerk in green-orange apron vest + neat collar
    drawLeg(ctx, 52, 122, 12, 52, '#1e293b', '#0f172a');
    drawLeg(ctx, 68, 122, 12, 52, '#1e293b', '#0f172a');
    drawRoundedRect(ctx, 43, 68 + bob, 42, 58, 9, '#f1f5f9');
    drawRoundedRect(ctx, 45, 72 + bob, 38, 52, 6, '#15803d'); // green smock
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(45, 74 + bob, 38, 6); // orange stripe
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(45, 80 + bob, 38, 4); // red stripe
    drawRoundedRect(ctx, 36, 72 + bob, 10, 38, 4, '#cbd5e1');
    drawCircle(ctx, 41, 111 + bob, 5, '#e2b38c');
    drawRoundedRect(ctx, 82, 72 + bob, 10, 38, 4, '#e2e8f0');
    drawCircle(ctx, 87, 111 + bob, 5, '#e2b38c');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#d1a079');
    drawHead(ctx, 64, 41 + bob, 18, 20, '#e2b38c', '#c7946c');
    ctx.fillStyle = '#171922';
    ctx.beginPath();
    ctx.ellipse(64, 26 + bob, 20, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 3.5, 4);
    ctx.fillRect(71, 40 + bob, 3.5, 4);
  } else if (kind === 'zombie') {
    // Decayed dorm zombie hallucination with outstretched arms & glowing eyes
    const zBob = frame % 2 === 1 ? -5 : 0;
    drawLeg(ctx, 51 + stride, 122 + liftL, 13, 52, '#2d3733', '#111614');
    drawLeg(ctx, 68 - stride, 122 + liftR, 13, 52, '#252e2a', '#111614');
    drawRoundedRect(ctx, 43, 68 + zBob, 42, 56, 8, '#4a554c'); // tattered shirt
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(50, 78 + zBob, 16, 22); // blood stain
    // Outstretched zombie arms reaching forward!
    drawRoundedRect(ctx, 78, 72 + zBob, 30, 10, 4, '#6b8269');
    drawRoundedRect(ctx, 76, 86 + zBob, 28, 10, 4, '#5a6e58');
    drawRoundedRect(ctx, 58, 56 + zBob, 12, 14, 4, '#5d735b');
    drawHead(ctx, 64, 42 + zBob, 19, 21, '#789176', '#4c5e4a');
    ctx.fillStyle = '#0f1210';
    ctx.beginPath();
    ctx.ellipse(64, 26 + zBob, 19, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Glowing eerie green-yellow zombie eyes + screaming mouth
    ctx.fillStyle = '#bef264';
    ctx.fillRect(57, 39 + zBob, 5, 4);
    ctx.fillRect(71, 39 + zBob, 5, 4);
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(59, 49 + zBob, 10, 8);
  } else if (kind === 'win_moto') {
    // Win Motorcycle Taxi Driver in iconic bright orange vest (#f97316) with #9 badge
    drawLeg(ctx, 51 + stride, 122 + liftL, 13, 52, '#1e293b', '#0f172a');
    drawLeg(ctx, 68 - stride, 122 + liftR, 13, 52, '#1e293b', '#0f172a');
    drawRoundedRect(ctx, 43, 68 + bob, 42, 56, 9, '#f1f5f9');
    drawRoundedRect(ctx, 44, 70 + bob, 40, 52, 7, '#ea580c'); // orange vest
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('9', 64, 101 + bob);
    drawRoundedRect(ctx, 35, 72 + bob, 11, 39, 5, '#e2e8f0');
    drawRoundedRect(ctx, 82, 72 + bob, 11, 39, 5, '#e2e8f0');
    drawHead(ctx, 64, 41 + bob, 18, 20, '#d8a47b', '#ba865e');
    // Baseball cap
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(64, 24 + bob, 20, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(46, 23 + bob, 42, 4);
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 3.5, 4);
    ctx.fillRect(71, 40 + bob, 3.5, 4);
  } else if (kind === 'police') {
    // Thai Police Sergeant in khaki uniform + police cap (solid neck, hands, belt & waist seam!)
    drawLeg(ctx, 50, 118, 14, 56, '#6e583d', '#111318');
    drawLeg(ctx, 66, 118, 14, 56, '#6e583d', '#111318');
    ctx.fillStyle = '#6e583d';
    ctx.fillRect(46, 115 + bob, 36, 12); // solid trouser hip bridge under belt
    drawRoundedRect(ctx, 42, 68 + bob, 44, 54, 8, '#8c7454');
    ctx.fillStyle = '#271e16';
    ctx.fillRect(42, 113 + bob, 44, 7);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(60, 113 + bob, 8, 7);
    drawRoundedRect(ctx, 34, 72 + bob, 11, 38, 5, '#836b4c');
    drawCircle(ctx, 39.5, 112 + bob, 4.5, '#d6a179');
    drawRoundedRect(ctx, 83, 72 + bob, 11, 38, 5, '#836b4c');
    drawCircle(ctx, 88.5, 112 + bob, 4.5, '#d6a179');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 15, 4, '#b68158'); // solid neck bridge!
    drawHead(ctx, 64, 41 + bob, 18, 20, '#d6a179', '#b68158');
    ctx.fillStyle = '#624f38';
    ctx.beginPath();
    ctx.ellipse(64, 22 + bob, 22, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14171f';
    ctx.fillRect(45, 25 + bob, 42, 5);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(64, 18 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 3.5, 4);
    ctx.fillRect(71, 40 + bob, 3.5, 4);
  } else if (kind === 'laundry_lady') {
    // Auntie Samorn at 24h Laundry in light blue blouse + pastel apron
    drawLeg(ctx, 52, 118, 12, 56, '#334155', '#1e293b');
    drawLeg(ctx, 67, 118, 12, 56, '#334155', '#1e293b');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, '#7dd3fc');
    drawRoundedRect(ctx, 46, 78 + bob, 36, 46, 6, '#f9a8d4'); // pink apron
    drawRoundedRect(ctx, 35, 72 + bob, 10, 38, 4, '#67e8f9');
    drawRoundedRect(ctx, 83, 72 + bob, 10, 38, 4, '#67e8f9');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#c3936c');
    drawHead(ctx, 64, 41 + bob, 18, 20, '#dfb08a', '#c3936c');
    // Hair bun
    ctx.fillStyle = '#2c2523';
    ctx.beginPath();
    ctx.arc(46, 28 + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(64, 26 + bob, 19, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 3.5, 4);
    ctx.fillRect(71, 40 + bob, 3.5, 4);
  } else if (kind === 'electrician') {
    // Chang Tong in navy work coveralls + yellow hard hat + tool belt
    drawLeg(ctx, 51, 118, 13, 56, '#1e3a5f', '#111827');
    drawLeg(ctx, 68, 118, 13, 56, '#1e3a5f', '#111827');
    drawRoundedRect(ctx, 42, 68 + bob, 44, 58, 9, '#1d4ed8');
    ctx.fillStyle = '#facc15';
    ctx.fillRect(42, 92 + bob, 44, 5); // safety reflective stripe
    ctx.fillStyle = '#78350f';
    ctx.fillRect(42, 114 + bob, 44, 7); // tool belt
    drawRoundedRect(ctx, 34, 72 + bob, 10, 40, 4, '#2563eb');
    drawRoundedRect(ctx, 84, 72 + bob, 10, 40, 4, '#2563eb');
    drawRoundedRect(ctx, 58, 56 + bob, 12, 14, 4, '#b47f57');
    drawHead(ctx, 64, 41 + bob, 18, 20, '#d59e74', '#b47f57');
    // Yellow safety helmet
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(64, 24 + bob, 22, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(42, 23 + bob, 45, 4);
    ctx.fillStyle = '#111';
    ctx.fillRect(58, 40 + bob, 3.5, 4);
    ctx.fillRect(71, 40 + bob, 3.5, 4);
  } else {
    // Terrifying Thai Horror Spirit (Prim normal + chasing!)
    const isChase = kind === 'prim_chase';
    const fy = frame % 2 === 1 ? -5 : 0;
    const tilt = isChase ? 0.08 : 0.04;

    ctx.save();
    ctx.translate(64, 96);
    ctx.rotate(tilt); // unsettling crooked head/body tilt!
    ctx.translate(-64, -96);

    // Dark suffocating shadow aura (crimson when chasing)
    const aura = ctx.createRadialGradient(64, 88 + fy, 8, 64, 88 + fy, 62);
    aura.addColorStop(0, isChase ? 'rgba(135, 10, 16, 0.45)' : 'rgba(8, 10, 16, 0.55)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    // Jagged tangled black hair silhouette behind
    ctx.fillStyle = '#07080c';
    ctx.beginPath();
    ctx.moveTo(36, 26 + fy);
    ctx.lineTo(28, 95 + fy);
    ctx.lineTo(38, 140 + fy);
    ctx.lineTo(92, 138 + fy);
    ctx.lineTo(100, 92 + fy);
    ctx.lineTo(90, 26 + fy);
    ctx.closePath();
    ctx.fill();

    // Tattered dark pleated skirt fading into void
    const skirtGrad = ctx.createLinearGradient(0, 110 + fy, 0, 174 + fy);
    skirtGrad.addColorStop(0, '#0f131e');
    skirtGrad.addColorStop(1, 'rgba(5, 6, 10, 0)');
    ctx.fillStyle = skirtGrad;
    ctx.beginPath();
    ctx.moveTo(45, 112 + fy);
    ctx.lineTo(83, 112 + fy);
    ctx.lineTo(94, 172 + fy);
    ctx.lineTo(34, 172 + fy);
    ctx.closePath();
    ctx.fill();

    // Soiled, blood-soaked white student blouse
    const blouse = ctx.createLinearGradient(44, 68 + fy, 84, 114 + fy);
    blouse.addColorStop(0, '#a8b0ba');
    blouse.addColorStop(1, '#68717d');
    drawRoundedRect(ctx, 45, 68 + fy, 38, 46, 7, blouse);

    // Heavy dried blood streaks across chest & collar
    ctx.fillStyle = 'rgba(110, 8, 14, 0.9)';
    ctx.beginPath();
    ctx.ellipse(66, 90 + fy, 11, 15, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(58, 70 + fy, 12, 18);

    // Elongated corpse-pale arms with dark bruised fingertips
    const armReach = isChase ? -16 : 0;
    drawRoundedRect(ctx, 33, 72 + fy + armReach * 0.4, 9, 54, 4, '#8d96a2');
    drawRoundedRect(ctx, 86, 72 + fy + armReach * 0.4, 9, 54, 4, '#8d96a2');
    ctx.fillStyle = '#291c22';
    ctx.fillRect(34, 120 + fy + armReach * 0.4, 7, 9);
    ctx.fillRect(87, 120 + fy + armReach * 0.4, 7, 9);

    // Bruised / rope-marked neck
    ctx.fillStyle = '#3a1a22';
    ctx.fillRect(57, 56 + fy, 14, 13);

    // Corpse-pale hollow face
    drawHead(ctx, 64, 41 + fy, 17, 21, '#aeb6bf', '#6d7580');

    // Deep sunken black eye sockets
    ctx.fillStyle = '#08090d';
    ctx.beginPath();
    ctx.ellipse(56, 40 + fy, 5.2, 6.2, 0.1, 0, Math.PI * 2);
    ctx.ellipse(72, 40 + fy, 5.2, 6.2, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Terrifying tiny glowing pinprick pupils (red when chasing, cold white when stalking)
    ctx.fillStyle = isChase ? '#ff2424' : '#e4eef8';
    ctx.beginPath();
    ctx.arc(56, 40 + fy, isChase ? 1.8 : 1.3, 0, Math.PI * 2);
    ctx.arc(72, 40 + fy, isChase ? 1.8 : 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Dark blood tears / hollow screaming mouth
    ctx.fillStyle = '#2a070c';
    ctx.fillRect(54, 45 + fy, 2.5, 7);
    ctx.fillRect(71, 45 + fy, 2.5, 9);

    if (isChase) {
      // Wide distorted screaming mouth
      ctx.fillStyle = '#0a0406';
      ctx.beginPath();
      ctx.ellipse(64, 54 + fy, 5.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#180c10';
      ctx.fillRect(59, 53 + fy, 10, 2.5);
    }

    // Messy wet hair strands hanging over face
    ctx.fillStyle = '#07080c';
    ctx.beginPath();
    ctx.ellipse(64, 24 + fy, 20, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(42, 24 + fy, 7, 56);
    ctx.fillRect(79, 24 + fy, 7, 56);
    ctx.fillRect(61, 21 + fy, 3, 22);
    ctx.fillRect(67, 22 + fy, 2.5, 19);

    ctx.restore();
  }

  return canvas;
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

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
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

export function createCharacterTexture(kind: CharacterKind, frame = 0): THREE.CanvasTexture {
  const canvas = drawCharacterCanvas(kind, frame);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createUniformPropTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 128;
  const ctx = c.getContext('2d')!;

  ctx.strokeStyle = '#9aa3b2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(48, 12, 6, Math.PI, Math.PI * 2);
  ctx.moveTo(48, 18);
  ctx.lineTo(22, 30);
  ctx.lineTo(74, 30);
  ctx.closePath();
  ctx.stroke();

  const shirt = ctx.createLinearGradient(20, 30, 76, 75);
  shirt.addColorStop(0, '#eef2f8');
  shirt.addColorStop(1, '#bcc7d6');
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.moveTo(22, 30);
  ctx.lineTo(74, 30);
  ctx.lineTo(82, 54);
  ctx.lineTo(70, 56);
  ctx.lineTo(68, 76);
  ctx.lineTo(28, 76);
  ctx.lineTo(26, 56);
  ctx.lineTo(14, 54);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#182033';
  ctx.beginPath();
  ctx.moveTo(28, 74);
  ctx.lineTo(68, 74);
  ctx.lineTo(76, 120);
  ctx.lineTo(20, 120);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0d121f';
  ctx.lineWidth = 2;
  for (let x = 32; x <= 64; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 74);
    ctx.lineTo(x + (x - 48) * 0.25, 120);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
