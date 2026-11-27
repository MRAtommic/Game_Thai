import type { SoundEngine } from '../audio/SoundEngine';
import { isVoiceMuted, setVoiceMuted } from '../audio/VoiceActor';

const UI_TRANS_KEY = 'reuan_chan_ui_transparent';

function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

export function isUiTransparent(): boolean {
  const stored = localStorage.getItem(UI_TRANS_KEY);
  if (stored === '1') return true;
  if (stored === '0') return false;
  return isTouchDevice();
}

export function setUiTransparent(enabled: boolean): void {
  localStorage.setItem(UI_TRANS_KEY, enabled ? '1' : '0');
  document.body.classList.toggle('ui-transparent', enabled);
}

function markSegmented(groupId: string, activeVal: string): void {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  grp.querySelectorAll<HTMLButtonElement>('.seg-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.val === activeVal);
  });
}

/**
 * Binds the #btn-settings modal menu with tactile segmented controls
 * synchronized with existing HUD audio, voice, zoom, rules, and transparency state.
 */
export function bindSettingsMenu(sound?: SoundEngine): void {
  setUiTransparent(isUiTransparent());

  const overlay = document.getElementById('settings-overlay');
  const openBtn = document.getElementById('btn-settings');
  const closeBtn = document.getElementById('settings-close');

  const btnMusic = document.getElementById('btn-music');
  const btnSound = document.getElementById('btn-sound');
  const btnVoice = document.getElementById('btn-voice');
  const btnZoom = document.getElementById('btn-zoom');
  const btnRules = document.getElementById('btn-rules');
  const setRulesBtn = document.getElementById('set-rules');

  const getMusicOn = (): boolean =>
    sound ? sound.isMusicEnabled() : localStorage.getItem('reuan_chan_music_muted') !== '1';
  const applyMusicOn = (on: boolean) => {
    sound?.init();
    if (sound) sound.setMusicEnabled(on);
    else localStorage.setItem('reuan_chan_music_muted', on ? '0' : '1');
    const span = btnMusic?.querySelector('span');
    if (span) span.textContent = on ? 'ดนตรี: เปิด' : 'ดนตรี: ปิด';
    btnMusic?.classList.toggle('muted', !on);
    markSegmented('seg-music', on ? 'on' : 'off');
  };

  const getSoundOn = (): boolean => {
    if (localStorage.getItem('reuan_chan_sound_muted') === '1') return false;
    return !(btnSound?.querySelector('span')?.textContent ?? '').includes('ปิด');
  };
  const getZoomName = (): string =>
    (btnZoom?.querySelector('span')?.textContent ?? 'ระยะ: พอดี').replace('ระยะ:', '').trim() || 'พอดี';

  const syncStates = () => {
    markSegmented('seg-ui-trans', document.body.classList.contains('ui-transparent') ? '1' : '0');
    const musicOn = getMusicOn();
    markSegmented('seg-music', musicOn ? 'on' : 'off');
    const mSpan = btnMusic?.querySelector('span');
    if (mSpan) mSpan.textContent = musicOn ? 'ดนตรี: เปิด' : 'ดนตรี: ปิด';
    btnMusic?.classList.toggle('muted', !musicOn);
    markSegmented('seg-sound', getSoundOn() ? 'on' : 'off');
    markSegmented('seg-voice', isVoiceMuted() ? 'off' : 'on');
    markSegmented('seg-zoom', getZoomName());
  };

  const openModal = () => {
    syncStates();
    overlay?.classList.remove('hidden');
  };

  const closeModal = () => {
    overlay?.classList.add('hidden');
  };

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      closeModal();
    }
  });

  btnMusic?.addEventListener('click', () => {
    (document.activeElement as HTMLElement | null)?.blur();
    applyMusicOn(!getMusicOn());
  });

  document.getElementById('seg-music')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
    if (!btn) return;
    applyMusicOn(btn.dataset.val === 'on');
  });

  document.getElementById('seg-ui-trans')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
    if (!btn) return;
    setUiTransparent(btn.dataset.val === '1');
    syncStates();
  });

  document.getElementById('seg-sound')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
    if (!btn) return;
    const wantOn = btn.dataset.val === 'on';
    if (getSoundOn() !== wantOn) {
      const before = localStorage.getItem('reuan_chan_sound_muted');
      btnSound?.click();
      // If on title screen (no engine bound yet), update storage & label directly
      if (localStorage.getItem('reuan_chan_sound_muted') === before) {
        localStorage.setItem('reuan_chan_sound_muted', wantOn ? '0' : '1');
        const span = btnSound?.querySelector('span');
        if (span) span.textContent = wantOn ? 'เสียง: เปิด' : 'เสียง: ปิด';
        btnSound?.classList.toggle('muted', !wantOn);
      }
      setTimeout(syncStates, 0);
    }
  });

  document.getElementById('seg-voice')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
    if (!btn) return;
    const wantMute = btn.dataset.val === 'off';
    if (isVoiceMuted() !== wantMute) {
      if (btnVoice) {
        btnVoice.click();
      } else {
        setVoiceMuted(wantMute);
      }
      setTimeout(syncStates, 0);
    }
  });

  document.getElementById('seg-zoom')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.seg-btn');
    const target = btn?.dataset.val;
    if (!target || !btnZoom) return;
    for (let i = 0; i < 3; i++) {
      if (getZoomName() === target) break;
      btnZoom.click();
    }
    setTimeout(syncStates, 0);
  });

  setRulesBtn?.addEventListener('click', () => {
    closeModal();
    btnRules?.click();
  });

  syncStates();
}
