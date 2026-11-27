import * as THREE from 'three';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function toTex(c: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  return tex;
}

/** Weathered Thai concrete plaster wall with rain streaks, mold, and lower institutional green paint */
export function createThaiWallTexture(darkFloor3 = false): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 256);
  // Upper aged cream plaster
  ctx.fillStyle = darkFloor3 ? '#3b3e3d' : '#7b7c72';
  ctx.fillRect(0, 0, 512, 175);
  // Lower institutional teal-green paint (classic Thai dorm/school)
  ctx.fillStyle = darkFloor3 ? '#1e2825' : '#2d473e';
  ctx.fillRect(0, 175, 512, 81);

  // Darker trim line
  ctx.fillStyle = '#182420';
  ctx.fillRect(0, 173, 512, 4);

  // Grime & plaster speckles
  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,240,0.05)';
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }

  // Vertical rain/damp stains from top
  for (let i = 0; i < 18; i++) {
    const sx = Math.random() * 512;
    const len = 40 + Math.random() * 140;
    const grad = ctx.createLinearGradient(sx, 0, sx, len);
    grad.addColorStop(0, 'rgba(18, 22, 18, 0.36)');
    grad.addColorStop(1, 'rgba(18, 22, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, 0, 8 + Math.random() * 18, len);
  }

  // Cracks
  ctx.strokeStyle = 'rgba(15, 16, 15, 0.45)';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 5; k++) {
    let cx = 40 + Math.random() * 430;
    let cy = 20 + Math.random() * 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += (Math.random() - 0.5) * 24;
      cy += 8 + Math.random() * 14;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  return toTex(c, 4, 1);
}

/** Vintage Thai terrazzo / checkered corridor tiles */
export function createThaiTileFloorTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#4c4f4d';
  ctx.fillRect(0, 0, 256, 256);

  const size = 64;
  for (let y = 0; y < 256; y += size) {
    for (let x = 0; x < 256; x += size) {
      const alt = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = alt ? '#565955' : '#444846';
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      // Terrazzo flecks
      for (let f = 0; f < 18; f++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(220,215,195,0.14)' : 'rgba(20,22,20,0.18)';
        ctx.fillRect(x + Math.random() * size, y + Math.random() * size, 2, 2);
      }
    }
  }
  return toTex(c, 12, 2);
}

/** Wet Thai asphalt road with subtle yellow/white alley markings */
export function createThaiRoadTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 256);
  ctx.fillStyle = '#1b1e24';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.18)';
    ctx.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
  }
  // Red-white Thai no-parking curb stripe along sidewalk edge
  for (let x = 0; x < 512; x += 64) {
    ctx.fillStyle = (x / 64) % 2 === 0 ? '#7d2020' : '#a9a79d';
    ctx.fillRect(x, 12, 64, 14);
  }
  return toTex(c, 5, 1);
}

/** Corrugated rusted zinc roof texture (สังกะสี) */
export function createZincRoofTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 128);
  for (let x = 0; x < 256; x += 8) {
    const grad = ctx.createLinearGradient(x, 0, x + 8, 0);
    grad.addColorStop(0, '#3e444a');
    grad.addColorStop(0.5, '#646d75');
    grad.addColorStop(1, '#2b3036');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, 8, 128);
  }
  // Rust patches
  for (let r = 0; r < 22; r++) {
    ctx.fillStyle = 'rgba(118, 52, 24, 0.38)';
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 128, 6 + Math.random() * 18, 4 + Math.random() * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTex(c, 2, 1);
}

/** Detailed Thai wooden room door with louvers, transom grille, and brass room plate */
export function createThaiDoorTexture(roomLabel: string, damaged = false): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(160, 280);
  // Dark wood frame
  ctx.fillStyle = '#331f14';
  ctx.fillRect(0, 0, 160, 280);

  // Door wood panel
  const woodGrad = ctx.createLinearGradient(12, 0, 148, 0);
  woodGrad.addColorStop(0, '#4f3120');
  woodGrad.addColorStop(0.5, '#5d3a26');
  woodGrad.addColorStop(1, '#412719');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(12, 14, 136, 260);

  // Wood grain lines
  ctx.strokeStyle = 'rgba(20, 10, 5, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 18; x < 144; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, 274);
    ctx.stroke();
  }

  // Upper glass louver / wooden slats (บานเกล็ดระบายอากาศ)
  ctx.fillStyle = '#1b1410';
  ctx.fillRect(28, 32, 104, 48);
  for (let y = 36; y < 78; y += 8) {
    ctx.fillStyle = '#6f4c35';
    ctx.fillRect(30, y, 100, 4);
  }

  // Lower inset panels
  ctx.strokeStyle = '#29170d';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 104, 104, 68);
  ctx.strokeRect(28, 184, 104, 72);

  // Brass doorknob + deadbolt
  ctx.fillStyle = '#c8a248';
  ctx.beginPath();
  ctx.arc(128, 152, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7c6222';
  ctx.beginPath();
  ctx.arc(128, 136, 4, 0, Math.PI * 2);
  ctx.fill();

  // Room number plate
  if (roomLabel) {
    ctx.fillStyle = '#14171f';
    ctx.fillRect(50, 84, 60, 24);
    ctx.strokeStyle = '#c8a248';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 84, 60, 24);
    ctx.fillStyle = '#f2dcb0';
    ctx.font = 'bold 14px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(roomLabel, 80, 96);
  }

  if (damaged) {
    // Scratch marks & dark grime on Room 304
    ctx.strokeStyle = 'rgba(100, 12, 16, 0.72)';
    ctx.lineWidth = 2.5;
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.moveTo(48 + s * 10, 118);
      ctx.lineTo(68 + s * 9, 178);
      ctx.stroke();
    }
  }

  return toTex(c);
}/** Thai jalouse glass window with wrought iron grille (หน้าต่างบานเกล็ด + เหล็กดัด) */
export function createThaiWindowTexture(lit = false): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(160, 140);
  ctx.fillStyle = '#232830';
  ctx.fillRect(0, 0, 160, 140);

  // Glass glow or dark reflection
  const grad = ctx.createLinearGradient(0, 8, 0, 132);
  if (lit) {
    grad.addColorStop(0, '#ffcf7d');
    grad.addColorStop(1, '#c97d34');
  } else {
    grad.addColorStop(0, '#182438');
    grad.addColorStop(1, '#0c121d');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(10, 10, 140, 120);

  // Louver glass slats
  ctx.strokeStyle = lit ? 'rgba(90, 50, 15, 0.45)' : 'rgba(130, 165, 210, 0.22)';
  ctx.lineWidth = 2;
  for (let y = 18; y < 128; y += 12) {
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(150, y);
    ctx.stroke();
  }

  // Vertical iron security bars (เหล็กดัด)
  ctx.fillStyle = '#11141a';
  for (let x = 28; x < 140; x += 26) {
    ctx.fillRect(x, 10, 4, 120);
  }
  ctx.fillRect(10, 68, 140, 4);

  return toTex(c);
}/** Organic tropical banana tree / foliage alpha sprite */
export function createBananaTreeTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(192, 220);
  // Trunk
  const trunk = ctx.createLinearGradient(88, 60, 106, 218);
  trunk.addColorStop(0, '#3e5428');
  trunk.addColorStop(1, '#242e18');
  ctx.fillStyle = trunk;
  ctx.beginPath();
  ctx.moveTo(90, 75);
  ctx.lineTo(104, 75);
  ctx.lineTo(110, 218);
  ctx.lineTo(84, 218);
  ctx.closePath();
  ctx.fill();

  // Drooping banana leaves
  const leafAngles = [-2.5, -1.9, -1.2, -0.5, 0.2, 0.8, 1.4];
  leafAngles.forEach((ang, i) => {
    ctx.save();
    ctx.translate(97, 78);
    ctx.rotate(ang);
    ctx.fillStyle = i % 2 === 0 ? '#1d3b1e' : '#264a24';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(38, -24, 82, 8);
    ctx.quadraticCurveTo(38, 20, 0, 5);
    ctx.fill();
    // Leaf central rib
    ctx.strokeStyle = '#365e30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.quadraticCurveTo(38, -10, 76, 7);
    ctx.stroke();
    ctx.restore();
  });

  return toTex(c);
}/** Soft radial glow cone texture for atmospheric volumetric light illusion */
export function createLightConeTexture(rgb: string): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128, 192);
  const grad = ctx.createLinearGradient(64, 0, 64, 192);
  grad.addColorStop(0, `rgba(${rgb}, 0.42)`);
  grad.addColorStop(0.6, `rgba(${rgb}, 0.14)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(52, 0);
  ctx.lineTo(76, 0);
  ctx.lineTo(124, 192);
  ctx.lineTo(4, 192);
  ctx.closePath();
  ctx.fill();

  return toTex(c);
}/** Weathered Thai wooden dorm sign + alleyway street plate */
export function createDormSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(320, 100);
  const bg = ctx.createLinearGradient(0, 0, 0, 100);
  bg.addColorStop(0, '#442c1a');
  bg.addColorStop(1, '#26170d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 320, 100);

  ctx.strokeStyle = '#8b683b';
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, 310, 90);

  // Thai corner ornament motifs
  ctx.fillStyle = '#c89e4c';
  ctx.fillRect(10, 10, 10, 4);
  ctx.fillRect(10, 10, 4, 10);
  ctx.fillRect(300, 10, 10, 4);
  ctx.fillRect(306, 10, 4, 10);

  ctx.fillStyle = '#f2dfb8';
  ctx.font = 'bold 34px "Noto Serif Thai", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('หอพักเรือนจันทร์', 160, 42);

  ctx.fillStyle = '#bfa06e';
  ctx.font = '15px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ซอย 9 • ห้องเช่ารายเดือน', 160, 74);

  return toTex(c);
}/** Thai alley street sign ("ซอย 9" / "เขตอภัยทาน / ระวังสายไฟ") */
export function createThaiAlleySignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(160, 80);
  ctx.fillStyle = '#f0efe9';
  ctx.fillRect(0, 0, 160, 80);
  ctx.fillStyle = '#155c37';
  ctx.fillRect(0, 0, 160, 26);
  ctx.strokeStyle = '#1b1d22';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 156, 76);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ถนนเทศบาล', 80, 18);

  ctx.fillStyle = '#14171d';
  ctx.font = 'bold 26px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ซอย 9', 80, 58);
  return toTex(c);
}/** Thai Notice Board */
export function createNoticeBoardTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 160);
  ctx.fillStyle = '#382517';
  ctx.fillRect(0, 0, 256, 160);
  ctx.fillStyle = '#5e4933';
  ctx.fillRect(10, 10, 236, 140);

  // Paper 1: Red warning
  ctx.save();
  ctx.translate(22, 20);
  ctx.rotate(-0.04);
  ctx.fillStyle = '#ebe2cb';
  ctx.fillRect(0, 0, 96, 68);
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 96, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ประกาศด่วน', 18, 13);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 12px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ห้ามขึ้นชั้น 3', 10, 36);
  ctx.font = '10px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('หลัง 21:00 น.', 12, 52);
  ctx.restore();

  // Paper 2: Utility bills
  ctx.save();
  ctx.translate(136, 24);
  ctx.rotate(0.05);
  ctx.fillStyle = '#f5ebc1';
  ctx.fillRect(0, 0, 92, 60);
  ctx.fillStyle = '#222';
  ctx.font = '11px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ค่าไฟ 8 บ./หน่วย', 8, 22);
  ctx.fillText('ค่าน้ำ 18 บ./หน่วย', 8, 40);
  ctx.restore();

  // Paper 3: Maid note
  ctx.fillStyle = '#dfd5bc';
  ctx.fillRect(46, 98, 164, 40);
  ctx.fillStyle = '#6f1d1b';
  ctx.font = 'bold 12px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ตู้ จม. 304 รหัสเลขห้อง', 58, 122);

  return toTex(c);
}/** Custom painted item icon on canvas (replaces AI-looking emojis!) */
export function drawItemIconDataUrl(itemId: string): string {
  const [c, ctx] = makeCanvas(48, 48);

  if (itemId === 'room202_key' || itemId === 'storage_key' || itemId === 'room304_key') {
    const col = itemId === 'room304_key' ? '#b85c5c' : itemId === 'storage_key' ? '#c89b4b' : '#b7c2d0';
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(16, 18, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(21, 22);
    ctx.lineTo(38, 37);
    ctx.lineTo(34, 41);
    ctx.moveTo(31, 31);
    ctx.lineTo(27, 35);
    ctx.stroke();
  } else if (itemId === 'inhaler') {
    // Classic Thai white/green cylindrical nasal inhaler
    ctx.fillStyle = '#e7ece8';
    ctx.fillRect(18, 10, 12, 28);
    ctx.fillStyle = '#2b7a4b';
    ctx.fillRect(18, 8, 12, 9);
    ctx.fillRect(18, 24, 12, 14);
    ctx.strokeStyle = '#1b3b28';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 8, 12, 30);
  } else if (itemId === 'canned_coffee') {
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(14, 10, 20, 28);
    ctx.fillStyle = '#c89448';
    ctx.fillRect(14, 10, 20, 4);
    ctx.fillRect(14, 34, 20, 4);
    ctx.fillStyle = '#f2e4c9';
    ctx.fillRect(18, 19, 12, 9);
  } else if (itemId === 'snack_bread') {
    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, 14, 28, 20);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(13, 17, 22, 14);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(15, 22, 18, 4);
  } else if (itemId === 'drinking_water') {
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(17, 13, 14, 27);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(20, 8, 8, 5);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(17, 22, 14, 8);
  } else if (itemId === 'soda_can') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(15, 11, 18, 28);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(15, 10, 18, 3);
    ctx.fillRect(15, 37, 18, 3);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(17, 21, 14, 6);
  } else if (itemId === 'thai_liquor') {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(16, 17, 16, 23);
    ctx.fillRect(20, 8, 8, 10);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(20, 7, 8, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(18, 24, 12, 10);
  } else if (itemId === 'incense_soda') {
    // Red Fanta bottle + 3 incense sticks
    ctx.fillStyle = '#c91d2b';
    ctx.fillRect(21, 16, 12, 24);
    ctx.fillRect(24, 10, 6, 7);
    ctx.fillStyle = '#f0ede4';
    ctx.fillRect(26, 6, 2, 7); // straw
    ctx.strokeStyle = '#8b6f47';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 38);
    ctx.lineTo(15, 10);
    ctx.moveTo(16, 38);
    ctx.lineTo(18, 12);
    ctx.stroke();
  } else if (itemId === 'holy_thread') {
    // White sacred thread coil
    ctx.strokeStyle = '#ede8da';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(24, 24, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c4baa3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 24, 8, 0.4, Math.PI * 1.8);
    ctx.stroke();
  } else if (itemId === 'talisman') {
    // Thai sacred yellow/red cloth talisman (ผ้ายันต์)
    ctx.fillStyle = '#d4a64a';
    ctx.fillRect(12, 8, 24, 32);
    ctx.strokeStyle = '#8b1e1e';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 11, 18, 26);
    ctx.beginPath();
    ctx.moveTo(24, 15);
    ctx.lineTo(18, 29);
    ctx.lineTo(30, 29);
    ctx.closePath();
    ctx.stroke();
  } else if (itemId === 'screwdriver') {
    // Rusty Phillips screwdriver
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(10, 28, 12, 12);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(20, 28);
    ctx.lineTo(37, 11);
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(35, 9, 4, 4);
  } else if (itemId === 'cctv_sd_card') {
    // SD card with copper pins
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(14, 9, 20, 30);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(17, 18, 14, 15);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(17, 11, 3, 5);
    ctx.fillRect(22, 11, 3, 5);
    ctx.fillRect(27, 11, 3, 5);
  } else if (itemId === 'wire_cutter') {
    ctx.strokeStyle = '#8c96a4';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(14, 10);
    ctx.lineTo(28, 28);
    ctx.moveTo(34, 10);
    ctx.lineTo(20, 28);
    ctx.stroke();
    ctx.strokeStyle = '#a82a2a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(26, 26);
    ctx.lineTo(34, 40);
    ctx.moveTo(22, 26);
    ctx.lineTo(14, 40);
    ctx.stroke();
  } else if (itemId === 'voice_recorder') {
    ctx.fillStyle = '#262b36';
    ctx.fillRect(15, 9, 18, 30);
    ctx.fillStyle = '#52687a';
    ctx.fillRect(18, 13, 12, 8);
    ctx.fillStyle = '#d44242';
    ctx.beginPath();
    ctx.arc(24, 29, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (itemId === 'canal_lockbox') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, 14, 28, 22);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 14, 28, 22);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(21, 19, 6, 8);
  } else if (itemId === 'master_key_card') {
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(10, 14, 28, 18);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(14, 20, 6, 5);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(23, 18, 11, 3);
    ctx.fillRect(23, 24, 9, 3);
  } else if (itemId === 'sports_drink') {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(18, 12, 12, 26);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(20, 8, 8, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, 21, 12, 7);
  } else {
    // Prim's diary
    ctx.fillStyle = '#6b1d25';
    ctx.fillRect(13, 8, 22, 32);
    ctx.fillStyle = '#c8a248';
    ctx.fillRect(13, 8, 4, 32);
    ctx.fillStyle = '#e8dcc2';
    ctx.fillRect(20, 15, 11, 6);
  }

  return c.toDataURL();
}

/** Iconic Thai convenience store fascia sign (orange-green-red horizontal stripes) */
export function createConvenienceStoreSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(320, 96);
  ctx.fillStyle = '#f5f4ef';
  ctx.fillRect(0, 0, 320, 96);

  // Iconic tri-color stripes
  ctx.fillStyle = '#ea6a1a';
  ctx.fillRect(0, 8, 320, 14);
  ctx.fillStyle = '#117a47';
  ctx.fillRect(0, 26, 320, 44);
  ctx.fillStyle = '#cf242a';
  ctx.fillRect(0, 74, 320, 14);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('24-SEVEN ปากซอย', 160, 49);

  return toTex(c);
}/** Convenience store illuminated interior glass storefront */
export function createStorefrontGlassTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 160);
  const bg = ctx.createLinearGradient(0, 0, 0, 160);
  bg.addColorStop(0, '#eef7fb');
  bg.addColorStop(1, '#cbe3ee');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 160);

  // Store shelves inside
  for (let y = 32; y <= 112; y += 26) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(14, y, 228, 5);
    for (let x = 20; x < 235; x += 18) {
      ctx.fillStyle = ['#d94848', '#2f855a', '#d69e2e', '#3182ce'][Math.floor(x / 18) % 4];
      ctx.fillRect(x, y - 16, 12, 16);
    }
  }

  // Sliding glass door frame in center
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.strokeRect(86, 14, 84, 144);
  ctx.beginPath();
  ctx.moveTo(128, 14);
  ctx.lineTo(128, 158);
  ctx.stroke();

  // Blue "OPEN 24 ชม." sticker
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(184, 48, 48, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('24 ชม.', 208, 64);

  return toTex(c);
}/** Thai Bus Stop route board texture */
export function createBusStopSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128, 192);
  ctx.fillStyle = '#e8eef5';
  ctx.fillRect(0, 0, 128, 192);
  ctx.fillStyle = '#184e8c';
  ctx.fillRect(0, 0, 128, 44);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 188);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ป้ายรถเมล์', 64, 28);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('สาย 8  •  29', 64, 78);
  ctx.font = '13px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ปากซอยเรือนจันทร์', 64, 108);
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 12px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('เที่ยวสุดท้าย 22:30', 64, 148);

  return toTex(c);
}/** Striped Thai street market canvas awning */
export function createMarketAwningTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 128);
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = (x / 32) % 2 === 0 ? '#a82828' : '#eae4d3';
    ctx.fillRect(x, 0, 32, 128);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 108, 256, 20);
  return toTex(c);
}/** Thai Market food stall sign */
export function createMarketSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(224, 64);
  ctx.fillStyle = '#fff5d6';
  ctx.fillRect(0, 0, 224, 64);
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 220, 60);
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 22px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ข้าวแกงป้ากิม', 112, 24);
  ctx.fillStyle = '#1e293b';
  ctx.font = '13px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ตามสั่ง • น้ำดื่ม • 05:30–20:30', 112, 47);
  return toTex(c);
}/** Glossy Thai vintage bathroom grid tiles with grime & water stains */
export function createBathroomTileTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 256);
  ctx.fillStyle = '#335252';
  ctx.fillRect(0, 0, 512, 256);

  // Upper painted damp wall
  ctx.fillStyle = '#5c706b';
  ctx.fillRect(0, 0, 512, 86);

  // Lower tiled section (4x4 rows)
  const ts = 32;
  for (let y = 86; y < 256; y += ts) {
    for (let x = 0; x < 512; x += ts) {
      ctx.fillStyle = ((x / ts + y / ts) % 2 === 0) ? '#3c6361' : '#355856';
      ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
    }
  }

  // Water stains & mold
  for (let i = 0; i < 24; i++) {
    const gx = Math.random() * 512;
    const gy = 60 + Math.random() * 170;
    const grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, 24);
    grad.addColorStop(0, 'rgba(15, 25, 22, 0.35)');
    grad.addColorStop(1, 'rgba(15, 25, 22, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(gx - 24, gy - 24, 48, 48);
  }
  return toTex(c, 2, 1);
}

/** Thai wall calendar texture (can show Oct 14 circled in red!) */
export function createCalendarTexture(october = false): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(96, 128);
  ctx.fillStyle = '#e8e2d0';
  ctx.fillRect(0, 0, 96, 128);
  ctx.fillStyle = october ? '#7f1d1d' : '#1e3a5f';
  ctx.fillRect(0, 0, 96, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(october ? 'ตุลาคม' : 'พฤศจิกายน', 48, 24);

  // Grid numbers
  ctx.fillStyle = '#1f2937';
  ctx.font = '9px sans-serif';
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 7; col++) {
      const day = r * 7 + col + 1;
      if (day <= 31) {
        const dx = 11 + col * 12;
        const dy = 52 + r * 14;
        ctx.fillText(String(day), dx, dy);
        if (october && day === 14) {
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(dx, dy - 3, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
  return toTex(c);
}/** Cracked mirror texture for Bathroom 2 & Prim's Vanity */
export function createCrackedMirrorTexture(bloodTint = false): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(128, 160);
  const grad = ctx.createLinearGradient(0, 0, 128, 160);
  grad.addColorStop(0, '#78899c');
  grad.addColorStop(0.45, '#526273');
  grad.addColorStop(1, '#333e4a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 160);

  // Diagonal specular reflection streak
  ctx.fillStyle = 'rgba(220, 238, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(52, 0);
  ctx.lineTo(115, 160);
  ctx.lineTo(78, 160);
  ctx.closePath();
  ctx.fill();

  // Cracks radiating from center-right
  ctx.strokeStyle = 'rgba(15, 22, 30, 0.8)';
  ctx.lineWidth = 1.6;
  const cx = 82;
  const cy = 58;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (25 + Math.random() * 45), cy + Math.sin(a) * (25 + Math.random() * 55));
    ctx.stroke();
  }

  if (bloodTint) {
    ctx.fillStyle = 'rgba(120, 14, 22, 0.35)';
    ctx.beginPath();
    ctx.ellipse(42, 118, 14, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#2d2018';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, 128, 160);
  return toTex(c);
}/** Woven Thai patterned room rug */
export function createRugTexture(colorA: string, colorB: string): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(192, 128);
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 192, 128);
  ctx.strokeStyle = colorB;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 172, 108);
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 152, 88);
  // Subtle weave stripes
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let y = 0; y < 128; y += 6) {
    ctx.fillRect(0, y, 192, 2);
  }
  return toTex(c);
}/** Weathered Thai concrete wall with spray-paint graffiti & street stencil notices */
export function createGraffitiWallTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 256);
  ctx.fillStyle = '#5c5e56';
  ctx.fillRect(0, 0, 512, 256);

  // Grime & damp patches
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,240,0.04)';
    ctx.fillRect(Math.random() * 512, Math.random() * 256, 3, 3);
  }

  // Spray-paint wild-style Thai street tag ("SOI 9" + abstract skull/lightning)
  ctx.save();
  ctx.translate(150, 130);
  ctx.rotate(-0.08);
  ctx.font = 'bold 54px sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#111827';
  ctx.strokeText('SOI 9', -80, 0);
  const tagGrad = ctx.createLinearGradient(-80, -40, 80, 10);
  tagGrad.addColorStop(0, '#f97316');
  tagGrad.addColorStop(0.5, '#eab308');
  tagGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = tagGrad;
  ctx.fillText('SOI 9', -80, 0);
  ctx.restore();

  // Spray drips
  ctx.fillStyle = '#ef4444';
  [120, 165, 205, 232].forEach((dx, idx) => {
    ctx.fillRect(dx, 132, 3, 18 + (idx % 3) * 14);
  });

  // Classic Thai stencil warning ("ห้ามทิ้งขยะ ปรับ 2,000")
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(320, 118, 138, 62);
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 3;
  ctx.strokeRect(322, 120, 134, 58);
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 14px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ห้ามทิ้งขยะ', 389, 142);
  ctx.fillStyle = '#111827';
  ctx.font = '12px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ฝ่าฝืนปรับ 2,000 บ.', 389, 163);

  // Cyan spray art swirl on far left
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(48, 128, 28, 0, Math.PI * 1.6);
  ctx.stroke();

  return toTex(c);
}/** Thai Street Noodle Cart Sign ("บะหมี่เกี๊ยวหมูแดง") */
export function createNoodleCartSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(240, 72);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, 0, 240, 72);
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 232, 64);
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 21px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('บะหมี่เกี๊ยวหมูแดง', 120, 26, 210);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('พิเศษ 50 บ. • 17:00–02:00 น.', 120, 52, 210);
  return toTex(c);
}

/** Thai Isaan Food & Drink Restaurant Sign ("ลาบ-ส้มตำ แซ่บซอย 9") */
export function createIsaanSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(272, 80);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, 272, 80);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 264, 72);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 21px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ร้านลาบ-ส้มตำ อีสานแท้', 136, 28, 240);
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('จิ้มจุ่ม • คอหมูย่าง • เครื่องดื่มเย็น', 136, 56, 240);
  return toTex(c);
}/** Lush Thai street shade tree (ต้นหูกวาง / ต้นไม้ริมทาง) */
export function createStreetTreeTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(220, 260);
  // Trunk & branches
  ctx.fillStyle = '#3b2b1e';
  ctx.beginPath();
  ctx.moveTo(98, 120);
  ctx.lineTo(122, 120);
  ctx.lineTo(130, 256);
  ctx.lineTo(90, 256);
  ctx.closePath();
  ctx.fill();

  // Layered dark & mid green foliage clusters
  const clusters = [
    { x: 110, y: 78, r: 58, col: '#18361c' },
    { x: 64, y: 102, r: 44, col: '#1f4423' },
    { x: 156, y: 102, r: 44, col: '#1b3d1f' },
    { x: 92, y: 66, r: 42, col: '#28542a' },
    { x: 134, y: 74, r: 38, col: '#244d27' },
  ];
  clusters.forEach((cl) => {
    ctx.fillStyle = cl.col;
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
    ctx.fill();
  });

  return toTex(c);
}

/** Weathered red-white Thai warning board for Abandoned House ("เขตอันตราย บ้านร้าง ห้ามเข้า") */
export function createAbandonedSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(220, 110);
  ctx.fillStyle = '#d6d0c4';
  ctx.fillRect(0, 0, 220, 110);
  ctx.fillStyle = 'rgba(62, 48, 34, 0.25)';
  ctx.fillRect(0, 82, 220, 28);
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 210, 100);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(5, 5, 210, 32);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('เขตบ้านร้าง — ห้ามเข้า', 110, 22);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('โครงสร้างชำรุด โปรดระวังอันตราย', 110, 62);
  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 13px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ท้ายซอยเรือนจันทร์ 9', 110, 88);
  return toTex(c);
}

/** Royal Thai Police Kiosk sign ("ป้อมตำรวจซอย 9") */
export function createPoliceBoxSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(300, 92);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 0, 300, 92);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 288, 80);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 23px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ที่พักสายตรวจ ซอย 9', 150, 34, 260);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 14px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('สน.คลองสามวา • แจ้งเหตุด่วน 191', 150, 66, 260);
  return toTex(c);
}

/** 24-Hour Coin Laundry neon sign ("ซักสะอาด ซอย 9 • 24 ชม.") */
export function createLaundrySignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(340, 96);
  const g = ctx.createLinearGradient(0, 0, 340, 96);
  g.addColorStop(0, '#0284c7');
  g.addColorStop(1, '#38bdf8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 340, 96);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 328, 84);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ซักสะอาด ซอย 9 • 24 ชม.', 170, 35, 296);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 15px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('บริการซัก-อบผ้าหยอดเหรียญ ป้าสมร', 170, 67, 296);
  return toTex(c);
}

/** Generator / Utility Workshop warning sign */
export function createGeneratorSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(290, 90);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 290, 90);
  ctx.fillStyle = '#111827';
  for (let i = -20; i < 310; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, 90);
    ctx.lineTo(i + 14, 90);
    ctx.lineTo(i + 26, 70);
    ctx.lineTo(i + 12, 70);
    ctx.fill();
  }
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 20px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡ ห้องเครื่องปั่นไฟหอพัก', 145, 30, 260);
  ctx.font = 'bold 13px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText('ช่างตง ประจำซอย 9 • อันตรายไฟแรงสูง', 145, 55, 260);
  return toTex(c);
}
