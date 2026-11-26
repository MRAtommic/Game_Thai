import { SoundEngine } from './audio/SoundEngine';
import { Chapter2Engine } from './game/Chapter2Engine';
import { GameEngine } from './game/GameEngine';

const sharedSound = new SoundEngine();
let ch1: GameEngine | null = null;
let ch2: Chapter2Engine | null = null;

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

const btnStart = document.getElementById('btn-start-game')!;
const btnContinue = document.getElementById('btn-continue-game')!;
const btnStartCh2 = document.getElementById('btn-start-ch2')!;
const btnContinueCh2 = document.getElementById('btn-continue-ch2')!;

function syncTitleButtons(): void {
  const hasCh1 = Boolean(localStorage.getItem('reuan_chan_dorm_save_v1'));
  const hasCh2 = Boolean(localStorage.getItem('reuan_chan_ch2_save_v1'));
  btnContinue.classList.toggle('hidden', !hasCh1);
  btnContinueCh2.classList.toggle('hidden', !hasCh2);
}
syncTitleButtons();

btnStart.addEventListener('click', () => launchChapter1(false));
btnContinue.addEventListener('click', () => launchChapter1(true));
btnStartCh2.addEventListener('click', () => launchChapter2(false));
btnContinueCh2.addEventListener('click', () => launchChapter2(true));

if (sessionStorage.getItem('reuan_chan_active_session') === '1' && localStorage.getItem('reuan_chan_dorm_save_v1')) {
  launchChapter1(true);
}
