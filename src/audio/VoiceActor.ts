/**
 * Natural Thai & Isaan Voice Acting Engine
 * Prioritizes high-quality Neural/Natural OS & Browser voices (Google ไทย, Microsoft Natural, Apple Kanya),
 * keeps pitch near 1.0 to avoid robotic distortion, normalizes numbers/symbols to natural spoken Thai,
 * and adds subtle spatial resonance only for spirit encounters.
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
const VOICE_MUTE_KEY = 'reuan_chan_voice_muted';
let voiceMuted = typeof localStorage !== 'undefined' && localStorage.getItem(VOICE_MUTE_KEY) === '1';

export function isVoiceMuted(): boolean {
  return voiceMuted;
}

export function setVoiceMuted(muted: boolean): void {
  voiceMuted = muted;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(VOICE_MUTE_KEY, muted ? '1' : '0');
  }
  if (muted) stopVoiceActing();
  const btn = typeof document !== 'undefined' ? document.getElementById('btn-voice') : null;
  const span = btn?.querySelector('span');
  if (span) span.textContent = muted ? 'พากย์: ปิด' : 'พากย์: เปิด';
  btn?.classList.toggle('muted', muted);
}

export function bindVoiceToggleButton(): void {
  if (typeof document === 'undefined') return;
  const btn = document.getElementById('btn-voice');
  if (!btn || btn.dataset.boundVoice) return;
  btn.dataset.boundVoice = '1';
  setVoiceMuted(voiceMuted);
  btn.addEventListener('click', () => {
    setVoiceMuted(!voiceMuted);
  });
}

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

const FEMALE_HINTS = ['premwadee', 'kanya', 'narisa', 'achara', 'female', 'woman'];
const MALE_HINTS = ['niwat', 'pattara', 'sarawut', 'male', 'man'];

function isMaleVoice(v: SpeechSynthesisVoice | null): boolean {
  if (!v) return false;
  const n = v.name.toLowerCase();
  return MALE_HINTS.some((h) => n.includes(h));
}

function scoreThaiVoice(v: SpeechSynthesisVoice, preferFemale: boolean): number {
  const n = v.name.toLowerCase();
  let score = 0;
  // Strongly prefer modern neural/natural voices
  if (n.includes('natural')) score += 60;
  if (n.includes('online')) score += 20;
  if (n.includes('google')) score += 45;
  if (n.includes('premwadee') || n.includes('niwat')) score += 40;
  if (n.includes('kanya') || n.includes('narisa')) score += 35;
  if (n.includes('pattara')) score -= 18; // Prefer Niwat over legacy Pattara when both exist
  if (!v.localService) score += 15;

  const isFem = FEMALE_HINTS.some((h) => n.includes(h));
  const isMal = MALE_HINTS.some((h) => n.includes(h));
  if (preferFemale) {
    if (isFem) score += 90;
    if (isMal) score -= 90;
  } else {
    if (isMal) score += 90;
    if (isFem) score -= 90;
  }
  return score;
}

function pickThaiVoice(preferFemale: boolean): SpeechSynthesisVoice | null {
  const voices = refreshVoices();
  const thai = voices.filter((v) => v.lang.toLowerCase().startsWith('th'));
  if (thai.length === 0) return null;
  return [...thai].sort((a, b) => scoreThaiVoice(b, preferFemale) - scoreThaiVoice(a, preferFemale))[0];
}

function classifyCharacter(speaker: string, role: string, portrait: string): VoiceSpec {
  const s = `${speaker} ${role}`.toLowerCase();
  // Keep pitch close to 1.0 (0.94 .. 1.07) so neural/OS voices stay natural and never sound metallic/robotic!
  if (
    portrait === 'prim' ||
    s.includes('ผี') ||
    s.includes('วิญญาณ') ||
    s.includes('ตะเคียน') ||
    s.includes('กระสือ') ||
    s.includes('พริม') ||
    s.includes('กระซิบ')
  ) {
    return { kind: 'ghost', preferFemale: true, basePitch: 0.93, baseRate: 0.87, volume: 0.9 };
  }
  if (s.includes('หลวงพี่') || s.includes('พระ')) {
    return { kind: 'monk', preferFemale: false, basePitch: 0.95, baseRate: 0.91, volume: 0.94 };
  }
  if (
    s.includes('น้องแก้ว') ||
    s.includes('อีหล่า') ||
    s.includes('มินต์') ||
    s.includes('พนักงาน') ||
    s.includes('เด็กสาว')
  ) {
    return { kind: 'girl', preferFemale: true, basePitch: 1.07, baseRate: 1.03, volume: 0.94 };
  }
  if (
    portrait === 'vendor' ||
    s.includes('แม่') ||
    s.includes('ป้า') ||
    s.includes('ยาย') ||
    s.includes('ครูวิไล')
  ) {
    return { kind: 'mother', preferFemale: true, basePitch: 1.02, baseRate: 0.97, volume: 0.94 };
  }
  if (
    s.includes('พี่ต้อม') ||
    s.includes('เสี่ย') ||
    s.includes('ก้อง') ||
    s.includes('สมชาย') ||
    s.includes('เฮียตี๋') ||
    s.includes('ช่าง')
  ) {
    return { kind: 'villain', preferFemale: false, basePitch: 0.95, baseRate: 1.01, volume: 0.95 };
  }
  if (
    portrait === 'uncle' ||
    s.includes('ลุง') ||
    s.includes('ตาชม') ||
    s.includes('ดาบ') ||
    s.includes('ยาม')
  ) {
    return { kind: 'elder', preferFemale: false, basePitch: 0.94, baseRate: 0.94, volume: 0.95 };
  }
  if (portrait === 'narrator' || s.includes('บันทึก') || s.includes('จารึก') || s.includes('คลิป')) {
    return { kind: 'narrator', preferFemale: false, basePitch: 0.98, baseRate: 0.96, volume: 0.9 };
  }
  return { kind: 'protagonist', preferFemale: false, basePitch: 1.0, baseRate: 1.01, volume: 0.95 };
}

function cleanDialogueForSpeech(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, ' ')
    .replace(/฿/g, ' บาท ')
    .replace(/LED/gi, 'แอลอีดี')
    .replace(/24-Seven/gi, 'ทเวนตี้โฟร์เซเว่น')
    .replace(/SD Card/gi, 'เอสดีการ์ด')
    .replace(/\.\.\./g, ', ')
    .replace(/\s*—\s*/g, ', ')
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(155, now + 0.85);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.9);
    osc.connect(gain);
    gain.connect(ghostAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.95);
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
  if (muted || voiceMuted) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const spoken = cleanDialogueForSpeech(text);
  if (!spoken) return;

  const serial = activeSerial;
  const spec = classifyCharacter(speaker, role, portrait);
  const voice = pickThaiVoice(spec.preferFemale);

  if (spec.kind === 'ghost') {
    playGhostEchoShimmer();
  }

  // Speak smoothly as a single natural utterance with subtle emotional pitch/rate shifts
  const utt = new SpeechSynthesisUtterance(spoken);
  utt.lang = 'th-TH';
  if (voice) utt.voice = voice;

  let pitch = spec.basePitch;
  let rate = spec.baseRate;
  if (/!|เฮ้ย|หา\?!|กรี๊ด|ระวัง/.test(text)) {
    pitch += 0.04;
    rate += 0.05;
  } else if (/\.\.\.|ถอนหายใจ|ขอโทษ|เสียชีวิต|หลอน/.test(text)) {
    pitch -= 0.02;
    rate -= 0.05;
  }

  // If browser has no male Thai voice (e.g. Android/Chrome female-only Google voice), lower pitch for male characters
  const isGoogleVoice = Boolean(voice && voice.name.toLowerCase().includes('google'));
  const gotMaleVoice = isMaleVoice(voice);
  if (!spec.preferFemale && !gotMaleVoice) {
    utt.pitch = spec.kind === 'elder' || spec.kind === 'monk' ? 0.78 : 0.84;
  } else if (isGoogleVoice) {
    utt.pitch = spec.kind === 'girl' ? 1.1 : 1.0;
  } else {
    utt.pitch = Math.max(0.84, Math.min(1.14, pitch));
  }
  utt.rate = Math.max(0.85, Math.min(1.1, rate));
  utt.volume = spec.volume;
  utt.onerror = () => {
    if (serial === activeSerial) activeSerial++;
  };
  window.speechSynthesis.speak(utt);
}
