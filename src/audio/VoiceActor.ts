/**
 * Expressive Thai & Isaan Voice Acting Engine
 * Uses OS/Browser Thai voices with character-specific vocal profiles,
 * emotional prosody modulation (pitch/rate per phrase), parenthetical cue stripping,
 * and subtle Web Audio spatial whisper resonance for spirits.
 */

export type VoiceProfileKind =
  | 'protagonist'
  | 'girl'
  | 'mother'
  | 'elder'
  | 'monk'
  | 'villain'
  | 'ghost'
  | 'narrator';

interface VoiceSpec {
  kind: VoiceProfileKind;
  preferFemale: boolean;
  basePitch: number;
  baseRate: number;
  volume: number;
}

let activeSerial = 0;
let cachedVoices: SpeechSynthesisVoice[] = [];
let ghostAudioCtx: AudioContext | null = null;

function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const list = window.speechSynthesis.getVoices();
  if (list.length > 0) cachedVoices = list;
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoices();
  };
}

function pickThaiVoice(preferFemale: boolean): SpeechSynthesisVoice | null {
  const voices = refreshVoices();
  const thai = voices.filter((v) => v.lang.toLowerCase().startsWith('th'));
  if (thai.length === 0) return null;
  if (thai.length === 1) return thai[0];

  const femaleHints = ['premwadee', 'kanya', 'narisa', 'achara', 'female', 'woman', 'pattara'];
  const maleHints = ['niwat', 'male', 'man', 'sarawut', 'patt'];
  const hints = preferFemale ? femaleHints : maleHints;
  const matched = thai.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  return matched ?? thai[0];
}

function classifyCharacter(speaker: string, role: string, portrait: string): VoiceSpec {
  const s = `${speaker} ${role}`.toLowerCase();
  if (
    portrait === 'prim' ||
    s.includes('ผี') ||
    s.includes('วิญญาณ') ||
    s.includes('ตะเคียน') ||
    s.includes('กระสือ') ||
    s.includes('พริม') ||
    s.includes('กระซิบ')
  ) {
    return { kind: 'ghost', preferFemale: true, basePitch: 0.78, baseRate: 0.82, volume: 0.9 };
  }
  if (s.includes('หลวงพี่') || s.includes('พระ')) {
    return { kind: 'monk', preferFemale: false, basePitch: 0.84, baseRate: 0.88, volume: 0.92 };
  }
  if (
    s.includes('น้องแก้ว') ||
    s.includes('อีหล่า') ||
    s.includes('มินต์') ||
    s.includes('พนักงาน') ||
    s.includes('เด็กสาว')
  ) {
    return { kind: 'girl', preferFemale: true, basePitch: 1.24, baseRate: 1.04, volume: 0.92 };
  }
  if (
    portrait === 'vendor' ||
    s.includes('แม่') ||
    s.includes('ป้า') ||
    s.includes('ยาย') ||
    s.includes('ครูวิไล')
  ) {
    return { kind: 'mother', preferFemale: true, basePitch: 1.08, baseRate: 0.96, volume: 0.92 };
  }
  if (
    s.includes('พี่ต้อม') ||
    s.includes('เสี่ย') ||
    s.includes('ก้อง') ||
    s.includes('สมชาย') ||
    s.includes('เฮียตี๋') ||
    s.includes('ช่าง')
  ) {
    return { kind: 'villain', preferFemale: false, basePitch: 0.85, baseRate: 1.0, volume: 0.94 };
  }
  if (
    portrait === 'uncle' ||
    s.includes('ลุง') ||
    s.includes('ตาชม') ||
    s.includes('ดาบ') ||
    s.includes('ยาม')
  ) {
    return { kind: 'elder', preferFemale: false, basePitch: 0.79, baseRate: 0.91, volume: 0.94 };
  }
  if (portrait === 'narrator' || s.includes('บันทึก') || s.includes('จารึก') || s.includes('คลิป')) {
    return { kind: 'narrator', preferFemale: false, basePitch: 0.92, baseRate: 0.95, volume: 0.88 };
  }
  return { kind: 'protagonist', preferFemale: false, basePitch: 0.98, baseRate: 1.03, volume: 0.95 };
}

function cleanDialogueForSpeech(raw: string): string {
  // Strip UI reward tags like (+25 สติ), (+50 ฿ ...), (21:00+) and stage directions in parentheses
  return raw
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitExpressiveChunks(text: string): string[] {
  // Split natural breathing clauses on ellipses, em-dashes, exclamations & questions
  const rawParts = text.split(/(?<=[!?…—]|\.\.\.)\s+|\s+—\s+/g);
  const out: string[] = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Keep chunks reasonably sized so prosody shifts naturally mid-line
    if (trimmed.length > 75) {
      const mid = trimmed.lastIndexOf(' ', 65);
      if (mid > 20) {
        out.push(trimmed.slice(0, mid).trim(), trimmed.slice(mid + 1).trim());
        continue;
      }
    }
    out.push(trimmed);
  }
  return out;
}

function playGhostEchoShimmer(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!ghostAudioCtx) ghostAudioCtx = new Ctx();
    if (ghostAudioCtx.state === 'suspended') {
      void ghostAudioCtx.resume();
    }
    const now = ghostAudioCtx.currentTime;
    const osc = ghostAudioCtx.createOscillator();
    const gain = ghostAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.9);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.95);
    osc.connect(gain);
    gain.connect(ghostAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.0);
  } catch {
    // Ignore audio context restriction before gesture
  }
}

export function stopVoiceActing(): void {
  activeSerial++;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakDialogueLine(
  speaker: string,
  role: string,
  text: string,
  portrait = 'narrator',
  muted = false
): void {
  stopVoiceActing();
  if (muted) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const spoken = cleanDialogueForSpeech(text);
  if (!spoken) return;

  const serial = activeSerial;
  const spec = classifyCharacter(speaker, role, portrait);
  const voice = pickThaiVoice(spec.preferFemale);
  const chunks = splitExpressiveChunks(spoken);
  if (chunks.length === 0) return;

  if (spec.kind === 'ghost') {
    playGhostEchoShimmer();
  }

  let idx = 0;
  const speakNext = () => {
    if (serial !== activeSerial || idx >= chunks.length) return;
    const chunk = chunks[idx++];
    const utt = new SpeechSynthesisUtterance(chunk);
    utt.lang = 'th-TH';
    if (voice) utt.voice = voice;

    // Emotional modulation per clause!
    let pitch = spec.basePitch;
    let rate = spec.baseRate;
    const isExclaim = /!|เฮ้ย|หา\?!|กรี๊ด|ระวัง|บ้าเอ๊ย|คัก/.test(chunk);
    const isQuestion = /\?|แม่นบ่|เบาะ|เหรอ|หรือ|จั่งได๋|ทำไม|ไหน/.test(chunk);
    const isSomber = /\.\.\.|ถอนหายใจ|ขอโทษ|ตาย|หลอน|กลัว|ย่าน|เงียบ/.test(chunk);

    if (isExclaim) {
      pitch += 0.11;
      rate += 0.08;
    } else if (isQuestion) {
      pitch += 0.08;
    } else if (isSomber) {
      pitch -= 0.05;
      rate -= 0.1;
    }

    utt.pitch = Math.max(0.55, Math.min(1.65, pitch));
    utt.rate = Math.max(0.68, Math.min(1.3, rate));
    utt.volume = spec.volume;
    utt.onend = () => {
      if (serial !== activeSerial) return;
      // Natural tiny breathing pause between clauses
      window.setTimeout(speakNext, isSomber ? 180 : 85);
    };
    utt.onerror = () => {
      if (serial === activeSerial) speakNext();
    };
    window.speechSynthesis.speak(utt);
  };

  speakNext();
}
