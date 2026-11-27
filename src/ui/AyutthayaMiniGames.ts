import { SoundEngine } from '../audio/SoundEngine';

export type AyutthayaMiniGameKind = 'forge' | 'duel' | 'ranat';

export interface MiniGameResult {
  kind: AyutthayaMiniGameKind;
  won: boolean;
  score: number;
}

/**
 * Opens an interactive Thai-Ayutthaya mini-game inside the shared modal overlay:
 * - 'forge': Timed blacksmith hammering to sharpen Namphi steel & craft bolts
 * - 'duel': Reflex sword/archery target skirmish (hit bandits, avoid villagers!)
 * - 'ranat': Traditional Thai Ranat Ek 5-tone melody rhythm game
 */
export function launchAyutthayaMiniGame(
  kind: AyutthayaMiniGameKind,
  sound: SoundEngine,
  modalBackdrop: HTMLElement,
  modalTitle: HTMLElement,
  modalBody: HTMLElement,
  onComplete: (res: MiniGameResult) => void
): () => void {
  modalBackdrop.classList.remove('hidden');
  let stopped = false;
  let rafId = 0;
  let intervalId = 0;
  const ac = new AbortController();

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    if (intervalId) window.clearInterval(intervalId);
    ac.abort();
  };

  if (kind === 'forge') {
    modalTitle.textContent = '🔨 มินิเกม: ตีดาบเหล็กน้ำพี้';
    modalBody.innerHTML = `
      <div class="mg-wrap">
        <p class="mg-desc">กดปุ่ม <strong>[Space]</strong> หรือแตะ <strong>🔨 ทุบทั่ง!</strong> ให้ค้อนตรงแถบสีทอง เพื่อชุบคมดาบ (+35% ดาเมจ) และรับลูกดอกเพิ่ม!</p>
        <div class="mg-stats">
          <span id="mg-forge-hits">สำเร็จ: 0 / 5</span>
          <span id="mg-forge-tries">โอกาสเหลือ: 8</span>
        </div>
        <div class="mg-bar-track">
          <div class="mg-bar-zone" id="mg-forge-zone"></div>
          <div class="mg-bar-cursor" id="mg-forge-cursor"></div>
        </div>
        <div id="mg-forge-feedback" class="mg-feedback">จังหวะดี = คมกริบ!</div>
        <button id="mg-forge-btn" type="button" class="primary-btn mg-action-btn">🔨 ทุบเหล็กกลางทั่ง!</button>
      </div>
    `;

    let hits = 0;
    let tries = 8;
    let pos = 10;
    let dir = 1;
    let zoneLeft = 40;
    const zoneW = 20;
    let last = performance.now();

    const zoneEl = document.getElementById('mg-forge-zone')!;
    const cursorEl = document.getElementById('mg-forge-cursor')!;
    const hitsEl = document.getElementById('mg-forge-hits')!;
    const triesEl = document.getElementById('mg-forge-tries')!;
    const fbEl = document.getElementById('mg-forge-feedback')!;
    zoneEl.style.left = `${zoneLeft}%`;
    zoneEl.style.width = `${zoneW}%`;

    const strike = () => {
      if (stopped) return;
      tries--;
      const center = pos;
      if (center >= zoneLeft - 1.5 && center <= zoneLeft + zoneW + 1.5) {
        hits++;
        sound.playSwordHit();
        fbEl.textContent = hits >= 5 ? '🔥 เหล็กน้ำพี้สมบูรณ์แบบ!' : '✨ เปรี้ยง! ตรงจุดไฟแรง!';
        fbEl.style.color = '#facc15';
        zoneLeft = 15 + Math.random() * 55;
        zoneEl.style.left = `${zoneLeft}%`;
      } else {
        sound.playDoorCreak();
        fbEl.textContent = '💨 พลาดเป้าเหล็กร้อน รีบตีใหม่!';
        fbEl.style.color = '#f87171';
      }
      hitsEl.textContent = `สำเร็จ: ${hits} / 5`;
      triesEl.textContent = `โอกาสเหลือ: ${tries}`;
      if (hits >= 5 || tries <= 0) {
        cleanup();
        setTimeout(() => onComplete({ kind: 'forge', won: hits >= 5, score: hits }), 350);
      }
    };

    document.getElementById('mg-forge-btn')?.addEventListener('click', strike, { signal: ac.signal });
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          strike();
        }
      },
      { signal: ac.signal }
    );

    const step = (now: number) => {
      if (stopped) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      pos += dir * (82 + hits * 14) * dt;
      if (pos >= 97) { pos = 97; dir = -1; }
      else if (pos <= 3) { pos = 3; dir = 1; }
      cursorEl.style.left = `${pos}%`;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return cleanup;
  }

  if (kind === 'duel') {
    modalTitle.textContent = '⚔️ มินิเกม: ลานประลองยุทธ์อยุธยา';
    modalBody.innerHTML = `
      <div class="mg-wrap">
        <p class="mg-desc">รีบฟัน <strong>👹 โจร / ผีห่า</strong> หรือรับ <strong>🏹 ธนู</strong> ให้ไว! <strong>ห้ามฟัน 👨‍🌾 ชาวบ้าน!</strong> (กดปุ่ม 1-3 หรือแตะช่อง)</p>
        <div class="mg-stats">
          <span id="mg-duel-score">คะแนน: 0 (เป้า 8)</span>
          <span id="mg-duel-time">เวลา: 18 วิ</span>
        </div>
        <div class="mg-duel-grid">
          <button type="button" class="mg-slot" data-idx="0"><span>—</span><small>[1]</small></button>
          <button type="button" class="mg-slot" data-idx="1"><span>—</span><small>[2]</small></button>
          <button type="button" class="mg-slot" data-idx="2"><span>—</span><small>[3]</small></button>
        </div>
        <div id="mg-duel-fb" class="mg-feedback">เตรียมดาบให้พร้อม!</div>
      </div>
    `;

    let score = 0;
    let timeLeft = 18;
    type TargetType = 'empty' | 'enemy' | 'civ';
    const slots: TargetType[] = ['empty', 'empty', 'empty'];
    const slotEls = Array.from(modalBody.querySelectorAll<HTMLButtonElement>('.mg-slot'));
    const scoreEl = document.getElementById('mg-duel-score')!;
    const timeEl = document.getElementById('mg-duel-time')!;
    const fbEl = document.getElementById('mg-duel-fb')!;

    const renderSlots = () => {
      slotEls.forEach((el, idx) => {
        const sp = el.querySelector('span')!;
        const t = slots[idx];
        el.classList.toggle('is-enemy', t === 'enemy');
        el.classList.toggle('is-civ', t === 'civ');
        sp.textContent = t === 'enemy' ? '👹 โจร/ผีห่า!' : t === 'civ' ? '👨‍🌾 ชาวบ้าน' : '· ว่าง ·';
      });
    };

    const spawnWave = () => {
      for (let i = 0; i < 3; i++) slots[i] = 'empty';
      const eIdx = Math.floor(Math.random() * 3);
      slots[eIdx] = 'enemy';
      if (Math.random() < 0.55) {
        const cIdx = (eIdx + 1 + Math.floor(Math.random() * 2)) % 3;
        slots[cIdx] = 'civ';
      }
      renderSlots();
    };
    spawnWave();

    const hitSlot = (idx: number) => {
      if (stopped) return;
      const t = slots[idx];
      if (t === 'enemy') {
        score++;
        sound.playSwordHit();
        fbEl.textContent = '⚔️ ฉับ! ฟันโดนจังๆ +1';
        fbEl.style.color = '#4ade80';
        slots[idx] = 'empty';
        renderSlots();
        setTimeout(() => { if (!stopped) spawnWave(); }, 180);
      } else if (t === 'civ') {
        score = Math.max(0, score - 2);
        sound.playHurt();
        fbEl.textContent = '⚠️ ฟันถูกชาวบ้าน! -2 คะแนน';
        fbEl.style.color = '#f87171';
        slots[idx] = 'empty';
        renderSlots();
      } else {
        sound.playSwordSlash();
        fbEl.textContent = '💨 ฟันลม!';
        fbEl.style.color = '#94a3b8';
      }
      scoreEl.textContent = `คะแนน: ${score} (เป้า 8)`;
    };

    slotEls.forEach((btn, idx) => btn.addEventListener('click', () => hitSlot(idx), { signal: ac.signal }));
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.code === 'Digit1') hitSlot(0);
        else if (e.code === 'Digit2') hitSlot(1);
        else if (e.code === 'Digit3') hitSlot(2);
      },
      { signal: ac.signal }
    );

    let subTick = 0;
    intervalId = window.setInterval(() => {
      if (stopped) return;
      subTick++;
      if (subTick % 2 === 0) {
        timeLeft--;
        timeEl.textContent = `เวลา: ${timeLeft} วิ`;
        if (timeLeft <= 0) {
          cleanup();
          onComplete({ kind: 'duel', won: score >= 8, score });
          return;
        }
      }
      if (subTick % 3 === 0) spawnWave();
    }, 500);
    return cleanup;
  }

  // 'ranat' Thai Classical Ranat Ek Rhythm Mini-Game
  modalTitle.textContent = '🎵 มินิเกม: ตีระนาดเอกถวายพระ';
  modalBody.innerHTML = `
    <div class="mg-wrap">
      <p class="mg-desc">ฟังและจำทำนองลูกระนาดที่เรืองแสง แล้วกดตีตามลำดับ (กด <strong>1–5</strong> หรือแตะไม้ระนาด) ให้ผ่าน 3 รอบ!</p>
      <div class="mg-stats">
        <span id="mg-ranat-round">บทที่: 1 / 3</span>
        <span id="mg-ranat-state">กำลังบรรเลงตัวอย่าง...</span>
      </div>
      <div class="mg-ranat-row">
        <button type="button" class="mg-key" data-k="0">โด<span>[1]</span></button>
        <button type="button" class="mg-key" data-k="1">เร<span>[2]</span></button>
        <button type="button" class="mg-key" data-k="2">มี<span>[3]</span></button>
        <button type="button" class="mg-key" data-k="3">ซอล<span>[4]</span></button>
        <button type="button" class="mg-key" data-k="4">ลา<span>[5]</span></button>
      </div>
      <div id="mg-ranat-fb" class="mg-feedback">ตั้งใจฟังเสียงระนาด...</div>
    </div>
  `;

  let round = 1;
  let seq: number[] = [];
  let userStep = 0;
  let lockingInput = true;
  const keyEls = Array.from(modalBody.querySelectorAll<HTMLButtonElement>('.mg-key'));
  const roundEl = document.getElementById('mg-ranat-round')!;
  const stateEl = document.getElementById('mg-ranat-state')!;
  const fbEl = document.getElementById('mg-ranat-fb')!;

  const flashKey = (k: number) => {
    const el = keyEls[k];
    if (!el) return;
    el.classList.add('lit');
    sound.playRanatNote(k, false);
    setTimeout(() => el.classList.remove('lit'), 260);
  };

  const startRound = () => {
    if (stopped) return;
    lockingInput = true;
    userStep = 0;
    const len = 2 + round;
    seq = Array.from({ length: len }, () => Math.floor(Math.random() * 5));
    roundEl.textContent = `บทที่: ${round} / 3`;
    stateEl.textContent = 'กำลังบรรเลงตัวอย่าง...';
    fbEl.textContent = 'ฟังและดูแป้นที่สว่าง';
    fbEl.style.color = '#fef08a';

    seq.forEach((note, i) => {
      setTimeout(() => {
        if (stopped) return;
        flashKey(note);
        if (i === seq.length - 1) {
          setTimeout(() => {
            if (stopped) return;
            lockingInput = false;
            stateEl.textContent = 'ถึงตาคุณตีตาม!';
            fbEl.textContent = `ตีตามลำดับ (${seq.length} โน้ต)`;
          }, 360);
        }
      }, 420 + i * 480);
    });
  };

  const pressKey = (k: number) => {
    if (stopped || lockingInput) return;
    flashKey(k);
    if (k === seq[userStep]) {
      userStep++;
      if (userStep >= seq.length) {
        if (round >= 3) {
          lockingInput = true;
          fbEl.textContent = '🎶 ไพเราะจับใจ! จิตใจสงบและได้น้ำมนต์ศักดิ์สิทธิ์!';
          fbEl.style.color = '#4ade80';
          cleanup();
          setTimeout(() => onComplete({ kind: 'ranat', won: true, score: 3 }), 450);
        } else {
          round++;
          lockingInput = true;
          fbEl.textContent = '✨ ถูกต้อง! เตรียมฟังบทถัดไป...';
          fbEl.style.color = '#4ade80';
          setTimeout(startRound, 700);
        }
      }
    } else {
      lockingInput = true;
      sound.playRanatNote(k, true);
      fbEl.textContent = '❌ ตีผิดจังหวะ ลองฟังใหม่อีกรอบ!';
      fbEl.style.color = '#f87171';
      setTimeout(startRound, 800);
    }
  };

  keyEls.forEach((btn, k) => btn.addEventListener('click', () => pressKey(k), { signal: ac.signal }));
  window.addEventListener(
    'keydown',
    (e) => {
      const m: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4 };
      if (e.code in m) pressKey(m[e.code]);
    },
    { signal: ac.signal }
  );

  startRound();
  return cleanup;
}
