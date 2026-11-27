import { SoundEngine } from './audio/SoundEngine';
import { bindVoiceToggleButton } from './audio/VoiceActor';
import { Chapter2Engine } from './game/Chapter2Engine';
import { Chapter3Engine } from './game/Chapter3Engine';
import { GameEngine } from './game/GameEngine';
import { bindSettingsMenu } from './ui/SettingsMenu';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const sharedSound = new SoundEngine();
let ch1: GameEngine | null = null;
let ch2: Chapter2Engine | null = null;
let ch3: Chapter3Engine | null = null;
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const isCoarseTouch = () =>
  window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

async function tryEnterLandscapeMode(): Promise<void> {
  if (!isCoarseTouch()) return;
  try {
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (!document.fullscreenElement) {
      if (docEl.requestFullscreen) await docEl.requestFullscreen();
      else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
    }
  } catch {
    // Some browsers disallow fullscreen without direct gesture or on iOS Safari
  }
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: 'landscape' | 'portrait') => Promise<void>;
    };
    await orientation?.lock?.('landscape');
  } catch {
    // Fallback handled gracefully by CSS #rotate-landscape-overlay
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

function replaceFreshCanvas(): HTMLCanvasElement {
  const old = document.getElementById('game-canvas') as HTMLCanvasElement;
  const fresh = old.cloneNode(false) as HTMLCanvasElement;
  old.replaceWith(fresh);
  return fresh;
}

function teardownActiveEngines(): void {
  ch1?.destroy();
  ch1 = null;
  ch2?.destroy();
  ch2 = null;
  ch3?.destroy();
  ch3 = null;
}

function launchChapter1(continueSave: boolean): void {
  teardownActiveEngines();
  const canvas = replaceFreshCanvas();
  ch1 = new GameEngine(canvas, sharedSound, () => launchChapter2(false));
  if (continueSave) ch1.continueGame();
  else ch1.startNewGame();
}

function launchChapter2(continueSave: boolean): void {
  try {
    sessionStorage.removeItem('reuan_chan_active_session');
  } catch {}
  teardownActiveEngines();
  const canvas = replaceFreshCanvas();
  ch2 = new Chapter2Engine(canvas, sharedSound, () => {
    teardownActiveEngines();
    document.getElementById('hud-top')?.classList.add('hidden');
    document.getElementById('inventory-bar')?.classList.add('hidden');
    document.getElementById('mobile-controls')?.classList.add('hidden');
    document.getElementById('title-screen')?.classList.remove('hidden');
    syncTitleButtons();
  });
  if (continueSave) ch2.continueGame();
  else ch2.startNewGame();
}

function launchChapter3(continueSave: boolean): void {
  try {
    sessionStorage.removeItem('reuan_chan_active_session');
  } catch {}
  teardownActiveEngines();
  const canvas = replaceFreshCanvas();
  ch3 = new Chapter3Engine(canvas, sharedSound, () => {
    teardownActiveEngines();
    document.getElementById('hud-top')?.classList.add('hidden');
    document.getElementById('inventory-bar')?.classList.add('hidden');
    document.getElementById('mobile-controls')?.classList.add('hidden');
    document.getElementById('title-screen')?.classList.remove('hidden');
    syncTitleButtons();
  });
  if (continueSave) ch3.continueGame();
  else ch3.startNewGame();
}

const btnStart = document.getElementById('btn-start-game')!;
const btnContinue = document.getElementById('btn-continue-game')!;
const btnStartCh2 = document.getElementById('btn-start-ch2')!;
const btnContinueCh2 = document.getElementById('btn-continue-ch2')!;
const btnStartCh3 = document.getElementById('btn-start-ch3')!;
const btnContinueCh3 = document.getElementById('btn-continue-ch3')!;
const btnInstallApp = document.getElementById('btn-install-app')!;
const iosInstallHint = document.getElementById('ios-install-hint')!;
const btnLockLandscape = document.getElementById('btn-lock-landscape');

function syncTitleButtons(): void {
  const hasCh1 = Boolean(localStorage.getItem('reuan_chan_dorm_save_v1'));
  const hasCh2 = Boolean(localStorage.getItem('reuan_chan_ch2_save_v1'));
  const hasCh3 = Boolean(localStorage.getItem('reuan_chan_ch3_save_v1'));
  btnContinue.classList.toggle('hidden', !hasCh1);
  btnContinueCh2.classList.toggle('hidden', !hasCh2);
  btnContinueCh3.classList.toggle('hidden', !hasCh3);
}
syncTitleButtons();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  btnInstallApp.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  btnInstallApp.classList.add('hidden');
});

const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
const isStandalone =
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.matchMedia?.('(display-mode: fullscreen)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
if (isIos && !isStandalone) {
  iosInstallHint.classList.remove('hidden');
}

btnInstallApp.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  btnInstallApp.classList.add('hidden');
});

btnLockLandscape?.addEventListener('click', () => {
  void tryEnterLandscapeMode();
});

btnStart.addEventListener('click', () => {
  void tryEnterLandscapeMode();
  launchChapter1(false);
});
btnContinue.addEventListener('click', () => {
  void tryEnterLandscapeMode();
  launchChapter1(true);
});
btnStartCh2.addEventListener('click', () => {
  void tryEnterLandscapeMode();
  launchChapter2(false);
});
btnContinueCh2.addEventListener('click', () => {
  void tryEnterLandscapeMode();
  launchChapter2(true);
});
btnStartCh3.addEventListener('click', () => {
  void tryEnterLandscapeMode();
  launchChapter3(false);
});
btnContinueCh3.addEventListener('click', () => {
  void tryEnterLandscapeMode();
  launchChapter3(true);
});

bindVoiceToggleButton();
bindSettingsMenu();

if (sessionStorage.getItem('reuan_chan_active_session') === '1' && localStorage.getItem('reuan_chan_dorm_save_v1')) {
  launchChapter1(true);
}
