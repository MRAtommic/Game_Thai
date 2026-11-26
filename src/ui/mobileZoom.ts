const ZOOM_STORAGE_KEY = 'reuan_chan_cam_zoom';

const ZOOM_PRESETS = [
  { factor: 1.0, label: 'ระยะ: พอดี' },
  { factor: 1.32, label: 'ระยะ: ใกล้' },
  { factor: 0.78, label: 'ระยะ: กว้าง' },
] as const;

export interface ZoomController {
  cyclePreset: () => void;
}

/** Binds the HUD zoom cycle button and 2-finger canvas pinch zoom to a world camera. */
export function bindCameraZoomControls(
  canvas: HTMLCanvasElement,
  setZoomFactor: (factor: number) => void,
  signal: AbortSignal,
  onToast?: (msg: string) => void
): ZoomController {
  const btnZoom = document.getElementById('btn-zoom');
  let currentZoom = 1.0;

  try {
    const saved = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
    if (Number.isFinite(saved) && saved >= 0.7 && saved <= 1.6) {
      currentZoom = saved;
    }
  } catch {
    // ignore storage errors
  }

  const syncLabel = () => {
    if (!btnZoom) return;
    const span = btnZoom.querySelector('span');
    let text = 'ระยะ: กำหนดเอง';
    if (Math.abs(currentZoom - 1.0) < 0.09) text = 'ระยะ: พอดี';
    else if (currentZoom >= 1.15) text = 'ระยะ: ใกล้';
    else if (currentZoom <= 0.88) text = 'ระยะ: กว้าง';
    if (span) span.textContent = text;
    btnZoom.classList.toggle('active', Math.abs(currentZoom - 1.0) >= 0.09);
  };

  const applyZoom = (factor: number, save = true) => {
    currentZoom = Math.min(1.55, Math.max(0.72, factor));
    setZoomFactor(currentZoom);
    syncLabel();
    if (save) {
      try {
        localStorage.setItem(ZOOM_STORAGE_KEY, currentZoom.toFixed(2));
      } catch {}
    }
  };

  applyZoom(currentZoom, false);

  const cyclePreset = () => {
    const idx = ZOOM_PRESETS.findIndex((p) => Math.abs(p.factor - currentZoom) < 0.09);
    const next = ZOOM_PRESETS[(idx + 1) % ZOOM_PRESETS.length];
    applyZoom(next.factor);
    onToast?.(`ปรับมุมกล้อง: ${next.label.replace('ระยะ: ', '')}`);
  };

  btnZoom?.addEventListener('click', () => {
    (document.activeElement as HTMLElement | null)?.blur();
    cyclePreset();
  }, { signal });

  // 2-finger pinch-to-zoom directly on the 3D canvas
  let pinchStartDist = 0;
  let pinchStartZoom = currentZoom;
  const distBetween = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  canvas.addEventListener('touchstart', (ev) => {
    if (ev.touches.length === 2) {
      pinchStartDist = distBetween(ev.touches[0], ev.touches[1]);
      pinchStartZoom = currentZoom;
    }
  }, { passive: true, signal });

  canvas.addEventListener('touchmove', (ev) => {
    if (ev.touches.length === 2 && pinchStartDist > 10) {
      const dist = distBetween(ev.touches[0], ev.touches[1]);
      applyZoom(pinchStartZoom * (dist / pinchStartDist), false);
    }
  }, { passive: true, signal });

  canvas.addEventListener('touchend', (ev) => {
    if (ev.touches.length < 2 && pinchStartDist > 0) {
      pinchStartDist = 0;
      applyZoom(currentZoom, true);
    }
  }, { passive: true, signal });

  return { cyclePreset };
}
