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

/**
 * Binds the #btn-settings modal menu and synchronizes audio, voice, camera zoom,
 * rules, and UI transparency controls with the existing HUD buttons.
 */
export function bindSettingsMenu(): void {
  setUiTransparent(isUiTransparent());

  const overlay = document.getElementById('settings-overlay');
  const openBtn = document.getElementById('btn-settings');
  const closeBtn = document.getElementById('settings-close');

  const btnSound = document.getElementById('btn-sound');
  const btnVoice = document.getElementById('btn-voice');
  const btnZoom = document.getElementById('btn-zoom');
  const btnRules = document.getElementById('btn-rules');

  const setUiTransBtn = document.getElementById('set-ui-trans');
  const setSoundBtn = document.getElementById('set-sound');
  const setVoiceBtn = document.getElementById('set-voice');
  const setZoomBtn = document.getElementById('set-zoom');
  const setRulesBtn = document.getElementById('set-rules');

  const uiTransState = document.getElementById('set-ui-trans-state');
  const soundState = document.getElementById('set-sound-state');
  const voiceState = document.getElementById('set-voice-state');
  const zoomState = document.getElementById('set-zoom-state');

  const syncStates = () => {
    const transOn = document.body.classList.contains('ui-transparent');
    if (uiTransState) {
      uiTransState.textContent = transOn ? 'โปร่งใส' : 'ทึบปกติ';
      uiTransState.classList.toggle('is-off', !transOn);
    }

    const soundLabel = btnSound?.querySelector('span')?.textContent ?? '';
    const soundOff = soundLabel.includes('ปิด');
    if (soundState) {
      soundState.textContent = soundOff ? 'ปิด' : 'เปิด';
      soundState.classList.toggle('is-off', soundOff);
    }

    const voiceOff = isVoiceMuted();
    if (voiceState) {
      voiceState.textContent = voiceOff ? 'ปิด' : 'เปิด';
      voiceState.classList.toggle('is-off', voiceOff);
    }

    const zoomLabel = btnZoom?.querySelector('span')?.textContent ?? 'ระยะ: พอดี';
    if (zoomState) {
      zoomState.textContent = zoomLabel.replace('ระยะ:', '').trim() || 'พอดี';
    }
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

  setUiTransBtn?.addEventListener('click', () => {
    setUiTransparent(!document.body.classList.contains('ui-transparent'));
    syncStates();
  });

  setSoundBtn?.addEventListener('click', () => {
    btnSound?.click();
    setTimeout(syncStates, 0);
  });

  setVoiceBtn?.addEventListener('click', () => {
    if (btnVoice) {
      btnVoice.click();
    } else {
      setVoiceMuted(!isVoiceMuted());
    }
    setTimeout(syncStates, 0);
  });

  setZoomBtn?.addEventListener('click', () => {
    btnZoom?.click();
    setTimeout(syncStates, 0);
  });

  setRulesBtn?.addEventListener('click', () => {
    closeModal();
    btnRules?.click();
  });

  syncStates();
}
