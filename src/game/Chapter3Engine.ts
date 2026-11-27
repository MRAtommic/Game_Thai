import { drawCh3CharacterCanvas, drawCh3ItemIconDataUrl } from '../art/Chapter3Sprites';
import { SoundEngine } from '../audio/SoundEngine';
import {
  CH3_CLUES,
  CH3_ITEMS,
  CH3_RULES,
  CH3_ZONE_NAMES,
  Ch3RoomId,
} from '../data/chapter3Data';
import { DialogueLine, EndingType, FloorIndex, TimePeriod, WeatherType } from '../types';
import { CutscenePlayer, IsaanCutsceneId } from '../ui/CutscenePlayer';
import { renderSharedInventoryBar } from '../ui/InventoryBar';
import { bindCameraZoomControls } from '../ui/mobileZoom';
import {
  CH3_BLDG_MAX_X,
  CH3_BLDG_MIN_X,
  CH3_MAX_X,
  CH3_MIN_X,
  CH3_STAIR_X,
  SchoolWorld,
} from '../world/SchoolWorld';

const CH3_SAVE_KEY = 'reuan_chan_ch3_save_v1';

interface Ch3Flags {
  talkedMomIntro: boolean;
  acceptedDare: boolean;
  attendedClass: boolean;
  checkedLibrary: boolean;
  talkedJanitor: boolean;
  prayedShrine: boolean;
  sneakedNightSchool: boolean;
  playedRanatNight: boolean;
  snappedMirrorPhoto: boolean;
  hidFromGhostOnce: boolean;
  unlockedSafeProof: boolean;
  confrontedKongTwist: boolean;
  returnedChadaCrown: boolean;
  endingReached: EndingType | null;
}

interface Ch3SaveState {
  gameMinutes: number;
  day: number;
  weather: WeatherType;
  floor: FloorIndex;
  x: number;
  sanity: number;
  flashlightOn: boolean;
  inventory: string[];
  clues: string[];
  photos: string[];
  baht: number;
  battery: number;
  flags: Ch3Flags;
}

interface Ch3Interactable {
  id: string;
  label: string;
  floor: FloorIndex;
  room?: Ch3RoomId;
  x: number;
  range?: number;
  getLabel?: () => string;
  onInteract: () => void;
}

const DEFAULT_CH3_FLAGS = (): Ch3Flags => ({
  talkedMomIntro: false,
  acceptedDare: false,
  attendedClass: false,
  checkedLibrary: false,
  talkedJanitor: false,
  prayedShrine: false,
  sneakedNightSchool: false,
  playedRanatNight: false,
  snappedMirrorPhoto: false,
  hidFromGhostOnce: false,
  unlockedSafeProof: false,
  confrontedKongTwist: false,
  returnedChadaCrown: false,
  endingReached: null,
});

export class Chapter3Engine {
  private world: SchoolWorld;
  private sound: SoundEngine;
  private onExitToMenu: () => void;
  private state: Ch3SaveState;

  private ac = new AbortController();
  private running = false;
  private rafId = 0;
  private paused = false;
  private lastTime = 0;

  private currentRoom: Ch3RoomId = 'protagonist_house';
  private outsideReturnX = -110.0;
  private playerZ = 0.45;
  private facing: 1 | -1 = 1;
  private ridingBike = false;
  private isHiding = false;
  private hideSpotLabel = '';
  private stamina = 100;
  private isSprintingTouch = false;
  private codes = new Set<string>();
  private touchMoveDir: -1 | 0 | 1 = 0;
  private stepTimer = 0;
  private autoSaveTimer = 5;
  private hudExtraTimer = 0;
  private lastBellHour = -1;

  // Ghost Dancer AI & Chase State
  private ghostFloor: FloorIndex = 3;
  private ghostX = 40.0;
  private ghostShowTimer = 0;
  private ghostChase = false;
  private ghostChaseTimer = 0;
  private ghostCooldown = 0;

  private activeDialogue: DialogueLine[] = [];
  private dialogueIndex = 0;
  private modalOpen = false;
  private cutscene = new CutscenePlayer();
  private iconCache = new Map<string, string>();
  private interactables: Ch3Interactable[] = [];

  // Shared HUD DOM references
  private hudTop = document.getElementById('hud-top')!;
  private hudExtra = document.getElementById('hud-extra');
  private invBar = document.getElementById('inventory-bar')!;
  private mobileControls = document.getElementById('mobile-controls')!;
  private interactPrompt = document.getElementById('interact-prompt')!;
  private interactLabel = document.getElementById('interact-label')!;
  private chaseBanner = document.getElementById('chase-banner')!;
  private hudClock = document.getElementById('hud-clock')!;
  private hudPeriod = document.getElementById('hud-period')!;
  private hudWeather = document.getElementById('hud-weather')!;
  private hudLocation = document.getElementById('hud-location')!;
  private hudSanityVal = document.getElementById('hud-sanity-val')!;
  private hudSanityFill = document.getElementById('hud-sanity-fill')!;
  private hudQuest = document.getElementById('hud-quest')!;
  private hudNav = document.getElementById('hud-nav')!;
  private sanityOverlay = document.getElementById('sanity-overlay')!;
  private scareFlash = document.getElementById('scare-flash')!;
  private toastContainer = document.getElementById('toast-container')!;

  private dialogueBox = document.getElementById('dialogue-box')!;
  private dialoguePortrait = document.getElementById('dialogue-portrait') as HTMLCanvasElement;
  private dialogueSpeaker = document.getElementById('dialogue-speaker')!;
  private dialogueRole = document.getElementById('dialogue-role')!;
  private dialogueText = document.getElementById('dialogue-text')!;
  private dialogueChoices = document.getElementById('dialogue-choices')!;
  private dialogueContinue = document.getElementById('dialogue-continue')!;

  private modalBackdrop = document.getElementById('modal-backdrop')!;
  private modalTitle = document.getElementById('modal-title')!;
  private modalBody = document.getElementById('modal-body')!;

  private btnFlashlight = document.getElementById('btn-flashlight')!;
  private btnSound = document.getElementById('btn-sound')!;
  private touchUp = document.getElementById('touch-up')!;
  private touchDown = document.getElementById('touch-down')!;
  private touchFlashlight = document.getElementById('touch-flashlight')!;
  private touchBike = document.getElementById('touch-bike')!;
  private touchSprint = document.getElementById('touch-sprint');
  private touchPhoto = document.getElementById('touch-photo');

  constructor(canvas: HTMLCanvasElement, sound: SoundEngine, onExitToMenu: () => void) {
    this.world = new SchoolWorld(canvas);
    this.sound = sound;
    this.onExitToMenu = onExitToMenu;
    this.state = this.createNewState();
    this.setupInteractables();
    this.bindInputs();
  }

  private createNewState(): Ch3SaveState {
    return {
      gameMinutes: 7 * 60 + 25, // Fresh morning before school bell!
      day: 1,
      weather: 'clear',
      floor: 0,
      x: 1.5, // Starts inside Peem's House!
      sanity: 100,
      flashlightOn: false,
      inventory: ['camera_phone', 'inhaler'],
      clues: [],
      photos: [],
      baht: 150,
      battery: 100,
      flags: DEFAULT_CH3_FLAGS(),
    };
  }

  private playCutscene(id: IsaanCutsceneId, after?: () => void): void {
    this.codes.clear();
    this.touchMoveDir = 0;
    this.cutscene.play(id, after);
  }

  public startNewGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    this.state = this.createNewState();
    this.currentRoom = 'protagonist_house';
    this.outsideReturnX = -110.0;
    this.ridingBike = false;
    this.isHiding = false;
    this.ghostChase = false;
    this.ghostShowTimer = 0;
    this.saveGame();
    this.beginPlay();
    this.startDialogue([
      {
        speaker: 'ภีม (เช้าวันจันทร์ — บ้านพักซอย 5)',
        role: 'นักเรียนชั้น ม.5/2',
        portrait: 'player',
        text: 'เจ็ดโมงครึ่งแล้ว... ต้องรีบไปโรงเรียนมัธยมจันทรารัตน์ก่อนเข้าแถวเคารพธงชาติ! เดี๋ยวเดินไปกอดลาแม่ตรงห้องรับแขกฝั่งซ้าย แล้วค่อยขี่จักรยานหน้าบ้านไปโรงเรียนดีกว่า',
      },
    ]);
  }

  public continueGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    try {
      const raw = localStorage.getItem(CH3_SAVE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Ch3SaveState;
        this.state = {
          ...this.createNewState(),
          ...p,
          flags: { ...DEFAULT_CH3_FLAGS(), ...(p.flags || {}) },
        };
      }
    } catch {
      this.state = this.createNewState();
    }
    this.currentRoom = 'outside';
    this.stamina = 100;
    this.isHiding = false;
    this.beginPlay();
    this.showToast('โหลด Chapter 3: โรงเรียนผีนางรำ เรียบร้อย');
  }

  private beginPlay(): void {
    document.getElementById('title-screen')?.classList.add('hidden');
    this.hudTop.classList.remove('hidden');
    this.hudExtra?.classList.remove('hidden');
    this.invBar.classList.remove('hidden');
    this.touchUp.classList.add('hidden');
    this.touchDown.classList.add('hidden');
    this.touchFlashlight.classList.add('hidden');
    this.touchBike.classList.add('hidden');
    this.isSprintingTouch = false;
    if (this.touchSprint) {
      this.touchSprint.classList.add('hidden');
      this.touchSprint.classList.remove('active');
      this.touchSprint.textContent = '🏃 วิ่ง';
    }
    this.touchPhoto?.classList.add('hidden');
    this.chaseBanner.querySelector('span:last-child')!.textContent =
      'ผีนางรำกำลังร่ายรำลอยไล่ล่า! รีบกด [Shift / 🏃 วิ่ง] หนีเข้าซ่อนในตู้ล็อกเกอร์ หรือใต้โต๊ะเรียน [E]!';

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
    if (isTouch) {
      this.mobileControls.classList.remove('hidden');
      this.touchFlashlight.classList.remove('hidden');
      this.touchFlashlight.textContent = this.state.flashlightOn ? '🔦✓' : '🔦';
      this.touchSprint?.classList.remove('hidden');
      this.touchPhoto?.classList.remove('hidden');
      if (this.state.inventory.includes('bicycle')) {
        this.touchBike.classList.remove('hidden');
        this.touchBike.textContent = this.ridingBike ? '🚲✓' : '🚲';
      }
    }

    this.running = true;
    this.lastTime = performance.now();
    this.renderInventory();
    this.updateHUD();
    const tick = (t: number) => {
      if (!this.running) return;
      this.loop(t);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    this.cutscene.stop();
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ac.abort();
    this.chaseBanner.classList.add('hidden');
    this.touchUp.classList.add('hidden');
    this.touchDown.classList.add('hidden');
    this.touchFlashlight.classList.add('hidden');
    this.touchBike.classList.add('hidden');
    if (this.touchSprint) {
      this.touchSprint.classList.add('hidden');
      this.touchSprint.classList.remove('active');
      this.touchSprint.textContent = '🏃 วิ่ง';
    }
    this.touchPhoto?.classList.add('hidden');
    this.hudExtra?.classList.add('hidden');
    this.interactPrompt.classList.add('hidden');
    this.dialogueBox.classList.add('hidden');
    this.modalBackdrop.classList.add('hidden');
    this.mobileControls.classList.remove('overlay-paused');
    this.interactPrompt.classList.remove('overlay-paused');
    this.invBar.classList.remove('overlay-paused');
    this.world.dispose();
  }

  private saveGame(silent = true): void {
    try {
      const toSave =
        this.currentRoom === 'outside'
          ? this.state
          : { ...this.state, x: this.outsideReturnX };
      localStorage.setItem(CH3_SAVE_KEY, JSON.stringify(toSave));
      if (!silent) this.showToast('บันทึก Chapter 3 แล้ว');
    } catch {}
  }

  private bindInputs(): void {
    const sig = { signal: this.ac.signal };
    const handleResize = () => {
      this.world.resize();
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
      this.mobileControls.classList.toggle('hidden', !isTouch);
      this.touchFlashlight.classList.toggle('hidden', !isTouch);
      this.touchSprint?.classList.toggle('hidden', !isTouch);
      this.touchPhoto?.classList.toggle('hidden', !isTouch);
      this.touchBike.classList.toggle('hidden', !(isTouch && this.state.inventory.includes('bicycle')));
      this.renderInventory();
    };
    window.addEventListener('resize', handleResize, sig);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 120), sig);
    window.visualViewport?.addEventListener('resize', handleResize, sig);
    window.addEventListener('blur', () => {
      this.codes.clear();
      this.touchMoveDir = 0;
    }, sig);

    bindCameraZoomControls(
      this.world.renderer.domElement,
      (f) => this.world.setZoomFactor(f),
      this.ac.signal,
      (m) => this.showToast(m)
    );

    window.addEventListener(
      'keydown',
      (e) => {
        if (!this.running || this.cutscene.isPlaying()) return;
        const code = e.code;
        this.codes.add(code);
        if (e.repeat) return;
        if (this.modalOpen) {
          if (code === 'Escape') this.closeModal();
          return;
        }
        if (this.activeDialogue.length > 0) {
          if (code === 'KeyE' || code === 'Space' || code === 'Enter') {
            e.preventDefault();
            this.advanceDialogue();
          }
          return;
        }
        if (this.isHiding) {
          if (code === 'KeyE' || code === 'Space') {
            e.preventDefault();
            this.exitHideSpot();
          }
          return;
        }
        if (code === 'KeyE' || code === 'Space') {
          e.preventDefault();
          this.tryInteract();
        } else if (code === 'KeyW' || code === 'ArrowUp') {
          this.tryChangeFloor(1);
        } else if (code === 'KeyS' || code === 'ArrowDown') {
          this.tryChangeFloor(-1);
        } else if (code === 'KeyF') {
          this.toggleFlashlight();
        } else if (code === 'KeyC') {
          e.preventDefault();
          this.takePhoto();
        } else if (code === 'KeyB') {
          if (this.state.inventory.includes('bicycle')) this.toggleBicycle();
        } else if (code === 'KeyR') {
          this.openRulesModal();
        } else if (code === 'KeyN') {
          this.openNotebookModal();
        } else if (code === 'KeyM') {
          this.openMapModal();
        } else if (code.startsWith('Digit')) {
          const idx = Number(code.replace('Digit', '')) - 1;
          if (idx >= 0 && idx < 9 && this.state.inventory[idx]) this.useItem(this.state.inventory[idx]);
        }
      },
      sig
    );
    window.addEventListener('keyup', (e) => this.codes.delete(e.code), sig);

    const blur = () => (document.activeElement as HTMLElement | null)?.blur();
    this.btnFlashlight.addEventListener('click', () => { blur(); this.toggleFlashlight(); }, sig);
    document.getElementById('btn-rules')!.addEventListener('click', () => { blur(); this.openRulesModal(); }, sig);
    document.getElementById('btn-notebook')!.addEventListener('click', () => { blur(); this.openNotebookModal(); }, sig);
    document.getElementById('btn-map')!.addEventListener('click', () => { blur(); this.openMapModal(); }, sig);
    this.btnSound.addEventListener(
      'click',
      () => {
        blur();
        this.sound.init();
        const next = !this.sound.isMuted();
        this.sound.setMuted(next);
        const lb = this.btnSound.querySelector('span');
        if (lb) lb.textContent = next ? 'เสียง: ปิด' : 'เสียง: เปิด';
        this.btnSound.classList.toggle('muted', next);
      },
      sig
    );
    this.dialogueBox.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.choice-btn')) return;
      this.advanceDialogue();
    }, sig);
    document.getElementById('modal-close')!.addEventListener('click', () => this.closeModal(), sig);
    this.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.modalBackdrop) this.closeModal();
    }, sig);

    const bindHold = (id: string, dir: -1 | 1) => {
      const btn = document.getElementById(id)!;
      let pId: number | null = null;
      const start = (ev: PointerEvent) => {
        ev.preventDefault();
        this.sound.init();
        pId = ev.pointerId;
        this.touchMoveDir = dir;
        btn.classList.add('pressed');
        try { btn.setPointerCapture(ev.pointerId); } catch {}
      };
      const end = (ev: PointerEvent) => {
        if (pId !== null && ev.pointerId !== pId) return;
        ev.preventDefault();
        pId = null;
        if (this.touchMoveDir === dir) this.touchMoveDir = 0;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', start as EventListener, sig);
      btn.addEventListener('pointerup', end as EventListener, sig);
      btn.addEventListener('pointercancel', end as EventListener, sig);
    };
    bindHold('touch-left', -1);
    bindHold('touch-right', 1);

    document.getElementById('touch-interact')!.addEventListener('click', () => {
      this.sound.init();
      if (this.activeDialogue.length > 0) this.advanceDialogue();
      else if (this.isHiding) this.exitHideSpot();
      else this.tryInteract();
    }, sig);
    this.touchUp.addEventListener('click', () => { this.sound.init(); this.tryChangeFloor(1); }, sig);
    this.touchDown.addEventListener('click', () => { this.sound.init(); this.tryChangeFloor(-1); }, sig);
    this.touchFlashlight.addEventListener('click', () => { this.sound.init(); this.toggleFlashlight(); }, sig);
    this.touchBike.addEventListener('click', () => {
      this.sound.init();
      if (this.state.inventory.includes('bicycle')) this.toggleBicycle();
    }, sig);
    this.touchSprint?.addEventListener('click', () => {
      this.sound.init();
      this.sound.playUIClick();
      this.isSprintingTouch = !this.isSprintingTouch;
      this.touchSprint?.classList.toggle('active', this.isSprintingTouch);
      if (this.touchSprint) this.touchSprint.textContent = this.isSprintingTouch ? '🏃 วิ่ง ✓' : '🏃 วิ่ง';
      this.showToast(this.isSprintingTouch ? 'เปิดโหมดวิ่งแล้ว!' : 'กลับสู่โหมดเดินปกติ');
    }, sig);
    this.touchPhoto?.addEventListener('click', () => { this.sound.init(); this.takePhoto(); }, sig);
    this.interactPrompt.addEventListener('click', () => {
      this.sound.init();
      if (this.isHiding) this.exitHideSpot();
      else if (this.activeDialogue.length === 0 && !this.modalOpen) this.tryInteract();
    }, sig);
  }

  private setupInteractables(): void {
    this.interactables = [
      // OUTSIDE GROUND FLOOR (floor 0)
      {
        id: 'ch3_home_door',
        floor: 0,
        x: -110.0,
        range: 2.2,
        label: 'เข้าบ้านของภีม (หาแม่ / นอนพัก & ชาร์จไฟฉาย)',
        onInteract: () => this.enterRoom('protagonist_house', 0, -110.0),
      },
      {
        id: 'ch3_bike',
        floor: 0,
        x: -104.5,
        range: 2.0,
        label: 'เก็บจักรยานเสือหมอบ (ปั่นไปโรงเรียนไว x2.3)',
        onInteract: () => {
          this.addItem('bicycle');
          this.sound.playBicycleBell();
          this.showToast('เก็บจักรยานเสือหมอบแล้ว! กด [B] หรือปุ่ม 🚲 เพื่อปั่นได้เลย');
        },
      },
      {
        id: 'ch3_school_bus',
        floor: 0,
        x: -88.0,
        range: 2.5,
        label: 'ขึ้นรถสองแถวรับส่งนักเรียน (เดินทางด่วน บ้าน ↔ โรงเรียน)',
        onInteract: () => this.openSchoolBusModal(),
      },
      {
        id: 'ch3_school_gate',
        floor: 0,
        x: -52.0,
        range: 2.5,
        getLabel: () =>
          this.isNightTime() ? 'แอบมุดรั้วประตูโรงเรียนยามวิกาล!' : 'ซุ้มประตูโรงเรียนมัธยมจันทรารัตน์',
        label: 'ซุ้มประตูโรงเรียน',
        onInteract: () => {
          if (this.isNightTime()) {
            this.state.flags.sneakedNightSchool = true;
            this.sound.playDoorCreak();
            this.state.x = -40.0;
            this.showToast('แอบลอดช่องข้างรั้วเหล็กเข้ามาในโรงเรียนตอนกลางคืนได้แล้ว! เงียบเชียบสุดๆ...', true);
            this.saveGame();
          } else {
            this.showToast('ซุ้มประตูโรงเรียนมัธยมจันทรารัตน์ — รีบเดินไปเข้าแถวหรือขึ้นห้อง ม.5/2 ได้เลย');
          }
        },
      },
      {
        id: 'ch3_janitor',
        floor: 0,
        x: -44.0,
        range: 2.3,
        label: 'คุยกับลุงมั่น ภารโรงเวรป้อมหน้าโรงเรียน',
        onInteract: () => this.interactJanitor(),
      },
      {
        id: 'ch3_kong_gang',
        floor: 0,
        x: -38.5,
        range: 2.4,
        label: 'คุยกับกลุ่มไอ้ก้อง (หัวโจกที่ท้าพิสูจน์คืนนี้)',
        onInteract: () => this.interactKongGang(),
      },
      {
        id: 'ch3_coop',
        floor: 0,
        x: 70.0,
        range: 2.8,
        label: 'สหกรณ์ & โรงอาหารโรงเรียน (ซื้อน้ำแดง / ถ่านไฟฉาย)',
        onInteract: () => this.interactCoopShop(),
      },
      {
        id: 'ch3_bball',
        floor: 0,
        x: 90.0,
        range: 2.8,
        label: 'สนามบาสโรงเรียน — มินิเกมชู้ตบาส (+25 สติ)',
        onInteract: () => this.interactBasketballGame(),
      },
      {
        id: 'ch3_shrine',
        floor: 0,
        x: 112.2,
        range: 2.6,
        label: 'กราบศาลตายายใต้ต้นโพธิ์หลังโรงเรียน',
        onInteract: () => this.interactSchoolShrine(),
      },

      // FLOOR 1 (Library + Teacher Office + 2 Hiding Lockers)
      {
        id: 'ch3_library_door',
        floor: 1,
        x: 8.0,
        range: 2.0,
        label: 'เข้าไปในหอสมุด & ค้นข่าวเก่า 15 ปีก่อน',
        onInteract: () => this.enterRoom('library_room', 1, 8.0),
      },
      {
        id: 'ch3_locker_f1a',
        floor: 1,
        x: 22.0,
        range: 1.9,
        label: 'ซ่อนตัวในตู้ล็อกเกอร์ชั้น 1',
        onInteract: () => this.enterHideSpot('ตู้ล็อกเกอร์ชั้น 1'),
      },
      {
        id: 'ch3_teacher_door',
        floor: 1,
        x: 44.0,
        range: 2.0,
        label: 'เข้าไปในห้องพักครูหมวดศิลปะ',
        onInteract: () => this.interactTeacherDoor(),
      },
      {
        id: 'ch3_locker_f1b',
        floor: 1,
        x: 52.0,
        range: 1.9,
        label: 'ซ่อนตัวในตู้ล็อกเกอร์มุมบันไดชั้น 1',
        onInteract: () => this.enterHideSpot('ตู้ล็อกเกอร์มุมบันไดชั้น 1'),
      },

      // FLOOR 2 (Classroom M.5/2 + Bath + Lockers)
      {
        id: 'ch3_class_door',
        floor: 2,
        x: 10.0,
        range: 2.0,
        label: 'เข้าห้องเรียน ม.5/2 (เข้าเรียน / ค้นใต้โต๊ะ)',
        onInteract: () => this.enterRoom('classroom_2b', 2, 10.0),
      },
      {
        id: 'ch3_locker_f2a',
        floor: 2,
        x: 24.0,
        range: 1.9,
        label: 'ซ่อนตัวในตู้ล็อกเกอร์ชั้น 2',
        onInteract: () => this.enterHideSpot('ตู้ล็อกเกอร์ชั้น 2'),
      },
      {
        id: 'ch3_bath_hide',
        floor: 2,
        x: 48.0,
        range: 2.0,
        label: 'หลบเข้าห้องน้ำนักเรียนชั้น 2 (ที่ซ่อน)',
        onInteract: () => this.enterHideSpot('ห้องน้ำนักเรียนชั้น 2'),
      },

      // FLOOR 3 (Haunted Music Room + Prop Closet)
      {
        id: 'ch3_closet_f3',
        floor: 3,
        x: 18.0,
        range: 1.9,
        label: 'แอบซ่อนในห้องเก็บชุดรำชั้น 3',
        onInteract: () => this.enterHideSpot('ห้องเก็บชุดรำชั้น 3'),
      },
      {
        id: 'ch3_music_door',
        floor: 3,
        x: 42.0,
        range: 2.2,
        label: 'เปิดประตูห้องดนตรีไทย & นาฏศิลป์ (ชั้น 3)',
        onInteract: () => this.interactMusicDoor(),
      },

      // INSIDE HOUSE ('protagonist_house')
      {
        id: 'house_exit',
        floor: 0,
        room: 'protagonist_house',
        x: -5.6,
        range: 1.8,
        label: 'เดินออกหน้าบ้าน',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'house_mom',
        floor: 0,
        room: 'protagonist_house',
        x: -2.2,
        range: 2.2,
        label: 'คุยกับแม่ในห้องรับแขก',
        onInteract: () => this.interactMomAtHome(),
      },
      {
        id: 'house_bed',
        floor: 0,
        room: 'protagonist_house',
        x: 4.3,
        range: 2.2,
        label: 'นอนพัก / เลื่อนเวลาไปกลางคืนหรือเช้า / ชาร์จไฟฉาย 100%',
        onInteract: () => this.openSleepModal(),
      },

      // INSIDE CLASSROOM ('classroom_2b')
      {
        id: 'cls_exit',
        floor: 2,
        room: 'classroom_2b',
        x: -6.4,
        range: 1.8,
        label: 'เดินออกระเบียงชั้น 2',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'cls_lesson',
        floor: 2,
        room: 'classroom_2b',
        x: -3.2,
        range: 2.2,
        label: 'เข้าเรียน & ตอบคำถามกับครูสมชาย (ช่วงกลางวัน)',
        onInteract: () => this.interactClassroomLesson(),
      },
      {
        id: 'cls_desk_hide',
        floor: 2,
        room: 'classroom_2b',
        x: 3.6,
        range: 2.2,
        getLabel: () => (this.ghostChase ? 'มุดซ่อนใต้โต๊ะเรียน ม.5/2!!' : 'ตรวจดูใต้โต๊ะเรียนของเพื่อน'),
        label: 'โต๊ะเรียน ม.5/2',
        onInteract: () => {
          if (this.ghostChase) this.enterHideSpot('ใต้โต๊ะเรียน ม.5/2');
          else this.interactClassroomNote();
        },
      },

      // INSIDE LIBRARY ('library_room')
      {
        id: 'lib_exit',
        floor: 1,
        room: 'library_room',
        x: -6.0,
        range: 1.8,
        label: 'ออกจากหอสมุด',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'lib_archive',
        floor: 1,
        room: 'library_room',
        x: 0.2,
        range: 2.5,
        label: 'ค้นแฟ้มหนังสือพิมพ์เก่าปี 2554 บนชั้นหนังสือ',
        onInteract: () => this.interactLibraryArchive(),
      },

      // INSIDE TEACHER OFFICE ('teacher_office')
      {
        id: 'tOff_exit',
        floor: 1,
        room: 'teacher_office',
        x: -6.0,
        range: 1.8,
        label: 'ออกจากห้องพักครู',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'tOff_wilai',
        floor: 1,
        room: 'teacher_office',
        x: 1.7,
        range: 2.2,
        label: 'พูดคุยสอบถามครูวิไล (หัวหน้าชมรมนาฏศิลป์)',
        onInteract: () => this.interactTeacherWilai(),
      },
      {
        id: 'tOff_safe',
        floor: 1,
        room: 'teacher_office',
        x: 4.6,
        range: 2.2,
        label: 'ตู้เซฟนิรภัยมุมโต๊ะครูวิไล (ใส่รหัส 3 หลัก)',
        onInteract: () => this.interactTeacherSafe(),
      },

      // INSIDE MUSIC ROOM ('music_room')
      {
        id: 'mr_exit',
        floor: 3,
        room: 'music_room',
        x: -7.0,
        range: 1.8,
        label: 'ออกจากห้องดนตรีไทย',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'mr_ranat',
        floor: 3,
        room: 'music_room',
        x: 1.8,
        range: 2.0,
        label: 'ตีระนาดเอกหน้าเวที (มินิเกมตามคำท้า!)',
        onInteract: () => this.interactRanatStage(),
      },
      {
        id: 'mr_mirror',
        floor: 3,
        room: 'music_room',
        x: 3.6,
        range: 2.0,
        label: 'ตรวจดู & ถ่ายรูปหน้ากระจกนาฏศิลป์ [กด E]',
        onInteract: () => this.interactMusicMirror(),
      },
      {
        id: 'mr_altar',
        floor: 3,
        room: 'music_room',
        x: 5.4,
        range: 2.2,
        label: 'แท่นบูชาครูนาฏศิลป์ — คืนชฎาทอง & ปิดฉากความจริง',
        onInteract: () => this.interactMusicAltar(),
      },
    ];
  }

  private isNightTime(): boolean {
    const h = (this.state.gameMinutes % 1440) / 60;
    return h >= 19.0 || h < 5.5;
  }

  private enterRoom(room: Ch3RoomId, fl: FloorIndex, returnX: number): void {
    if (this.ridingBike) {
      this.ridingBike = false;
      this.touchBike.textContent = '🚲';
      this.touchBike.classList.remove('active');
      this.renderInventory();
    }
    this.sound.playDoorCreak();
    this.outsideReturnX = returnX;
    this.state.floor = fl;
    this.currentRoom = room;
    this.state.x = room === 'music_room' ? -5.8 : room === 'classroom_2b' ? -5.2 : -4.8;
    this.playerZ = 0.45;
    this.facing = 1;
    this.updateHUD();
  }

  private exitRoom(): void {
    this.sound.playDoorCreak();
    this.currentRoom = 'outside';
    this.state.x = this.outsideReturnX;
    this.playerZ = 0.45;
    this.updateHUD();
  }

  private enterHideSpot(label: string): void {
    this.isHiding = true;
    this.hideSpotLabel = label;
    this.sound.playDoorCreak();
    this.updateHUD();

    const completeHide = () => {
      if (this.ghostChase) {
        this.ghostChase = false;
        this.ghostCooldown = 14;
        this.chaseBanner.classList.add('hidden');
        this.showToast(`ซ่อนใน "${label}" สำเร็จ! ผีนางรำลอยผ่านหน้าไปอย่างหวุดหวิด — กด [E] เพื่อออกมา`);
      } else {
        this.showToast(`กำลังซ่อนตัวใน "${label}" — กด [E] หรือแตะ สำรวจ เพื่อกลับออกมา`);
      }
    };

    if (!this.state.flags.hidFromGhostOnce && this.ghostChase) {
      this.state.flags.hidFromGhostOnce = true;
      this.saveGame();
      this.playCutscene('locker_hide', completeHide);
    } else {
      completeHide();
    }
  }

  private exitHideSpot(): void {
    this.isHiding = false;
    this.sound.playDoorCreak();
    this.showToast(`ออกจาก${this.hideSpotLabel}แล้ว`);
  }

  private tryChangeFloor(delta: 1 | -1): void {
    if (this.currentRoom !== 'outside') return;
    if (Math.abs(this.state.x - CH3_STAIR_X) > 2.2) return;
    const next = (this.state.floor + delta) as FloorIndex;
    if (next < 0 || next > 3) return;
    this.state.floor = next;
    this.sound.playFootstep('concrete');
    this.updateHUD();
  }

  private interactMomAtHome(): void {
    const f = this.state.flags;
    this.adjustSanity(25);
    if (!f.talkedMomIntro) {
      f.talkedMomIntro = true;
      this.state.baht += 50;
      this.sound.playCoinJingle();
      this.startDialogue([
        {
          speaker: 'แม่ของภีม',
          role: 'บ้านพักซอย 5',
          portrait: 'vendor',
          text: 'ภีม รีบกินข้าวแล้วไปโรงเรียนนะลูก (+50 ฿ ค่าขนม) ตอนนี้โรงเรียนมัธยมจันทรารัตน์มีข่าวเด็กโดนรุ่นพี่แกล้งท้าให้แอบเข้าไปตอนดึกด้วย แม่เป็นห่วง อย่าไปหลงเชื่อคำท้าอันตรายนะลูก!',
        },
      ]);
      this.saveGame();
      return;
    }
    this.showToast('แม่: "ตั้งใจเรียนนะลูก ถ้ามืดแล้วให้รีบกลับมานอนพักที่บ้าน" (+25 สติ)');
  }

  private interactKongGang(): void {
    const f = this.state.flags;
    if (!f.acceptedDare) {
      f.acceptedDare = true;
      this.addClue('dare_pact');
      this.playCutscene('school_dare', () => {
        this.startDialogue([
          {
            speaker: 'ไอ้ก้อง (หัวโจก ม.6)',
            role: 'หน้าซุ้มประตูโรงเรียน',
            portrait: 'tom',
            text: 'เฮ้ยไอ้ภีม! อยากเข้าแก๊งพวกกูจริงๆ ป่าววะ? งั้นคืนนี้หลังสองทุ่ม (19:30+) มึงกล้าแอบปีนรั้วขึ้นไป "ห้องดนตรีไทยชั้น 3" แล้วตีระนาดเอกให้ดัง 3 ที พร้อมถ่ายรูปหน้ากระจกกลับมาอวดพวกกูไหมล่ะ! ถ้าปอดแหกก็ไสหัวไป!',
          },
          {
            speaker: 'ภีม',
            role: 'รับคำท้า (แต่สังเกตสายตาไอ้ก้องแปลกๆ...)',
            portrait: 'player',
            text: 'ได้! เย็นนี้กูจะสืบข้อมูลในห้องเรียนกับห้องสมุดก่อน แล้วคืนนี้กูจะขึ้นไปถ่ายรูปมาให้ดู!',
          },
        ]);
      });
      this.saveGame();
      return;
    }

    if (f.unlockedSafeProof && !f.confrontedKongTwist) {
      f.confrontedKongTwist = true;
      this.addClue('gongs_betrayal');
      this.startDialogue([
        {
          speaker: 'ภีม (กำหลักฐานตู้เซฟแน่น!)',
          role: 'เค้นคอถามไอ้ก้อง',
          portrait: 'player',
          text: 'ไอ้ก้อง!! กูรู้หมดแล้วว่า "ครูวิไล" คือน้าแท้ๆ ของมึง! มึงหลอกท้าเด็กใหม่ขึ้นไปตายบนชั้น 3 เพื่อสังเวยเบี่ยงเบนวิญญาณพี่ดาวให้ครูวิไลรอดตัวใช่ไหม?!',
        },
        {
          speaker: 'ไอ้ก้อง (หน้าซีดตัวสั่นยอมรับ!)',
          role: 'หน้าโรงเรียน',
          portrait: 'tom',
          text: 'อย่านะเว้ยภีม! น้าวิไลบังคับกู... น้าบอกว่าถ้าไม่มีใครขึ้นไปตีระนาดล่อวิญญาณพี่ดาวประกาย น้าจะต้องตายแทน!! รีบเอาชฎาทองไปวางคืนบนแท่นบูชาห้องดนตรีไทยเถอะ กูยอมแล้ว!',
        },
      ]);
      this.saveGame();
      return;
    }

    this.showToast(
      f.snappedMirrorPhoto
        ? 'ไอ้ก้อง: "เฮ้ย! มึงถ่ายติดผีนางรำมาจริงเหรอวะ?! กู... กูไม่เกี่ยวแล้วนะ!"'
        : 'ไอ้ก้อง: "คืนนี้หลัง 19:00 น. แน่จริงก็ขึ้นไปตีระนาดและถ่ายรูปหน้ากระจกชั้น 3 มาให้ดู!"'
    );
  }

  private interactClassroomLesson(): void {
    const h = (this.state.gameMinutes % 1440) / 60;
    if (h < 6.8 || h > 16.5) {
      this.showToast('ห้องเรียน ม.5/2 เงียบสนิทนอกเวลาเรียน — ลองมาเข้าเรียนช่วงกลางวัน (07:00–16:00 น.)');
      return;
    }
    const f = this.state.flags;
    this.openModal(
      'คาบเรียนนาฏศิลป์ & ประวัติศาสตร์ — ครูสมชาย',
      `
      <p style="margin-top:0">ครูสมชาย: "นักเรียนภีม! ลองตอบคำถามหน้ากระดานหน่อยซิ เครื่องดนตรีไทยชนิดใดเป็น 'เครื่องตีทำนองเอก' ที่ทำจากไม้ไผ่บงและใช้บรรเลงนำวงปี่พาทย์?"</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button class="primary-btn" data-ans="right">🥁 ระนาดเอก</button>
        <button class="secondary-btn" data-ans="wrong">🎸 จะเข้</button>
        <button class="secondary-btn" data-ans="wrong">🎺 ปี่ชวา</button>
      </div>
      `
    );
    this.modalBody.querySelectorAll<HTMLButtonElement>('[data-ans]').forEach((b) => {
      b.addEventListener('click', () => {
        this.closeModal();
        if (b.dataset.ans === 'right') {
          this.sound.playClueChime();
          this.adjustSanity(25);
          if (!f.attendedClass) {
            f.attendedClass = true;
            this.state.baht += 50;
            this.sound.playCoinJingle();
            this.addClue('school_rumor');
            this.playCutscene('classroom_lesson', () => {
              this.startDialogue([
                {
                  speaker: 'เพื่อนร่วมชั้น ม.5/2 (กระซิบ)',
                  role: 'หลังจบคาบเรียน',
                  portrait: 'prim',
                  text: 'เก่งมากภีม! (+25 สติ & +50 ฿) ว่าแต่อย่ารับคำท้าไอ้ก้องเลยนะ... เมื่อ 15 ปีก่อน "พี่ดาวประกาย" ตกเวทีห้องดนตรีไทยคอหักตาย คืนนี้ลองก้มค้นใต้โต๊ะฝั่งขวาดูสิมีคนเขียนคำใบ้ทิ้งไว้!',
                },
              ]);
            });
          } else {
            this.showToast('ครูสมชาย: "ตอบถูกเก่งมาก! (+25 สติ)"');
          }
          this.saveGame();
        } else {
          this.showToast('ครูสมชาย: "ยังไม่ใช่ลูก เครื่องตีไม้ไผ่บงคือ ระนาดเอก นะ!"', true);
        }
      });
    });
  }

  private interactClassroomNote(): void {
    this.addClue('classroom_note');
    this.sound.playPickup();
    this.startDialogue([
      {
        speaker: 'ภีม (ก้มมองใต้โต๊ะเรียน)',
        role: 'ห้องเรียน ม.5/2',
        portrait: 'player',
        text: 'เจอกระดาษโน้ตเก่าซุกอยู่: "เวทีห้องนาฏศิลป์ลื่นผิดปกติเหมือนถูกทาน้ำมันเคลือบเงา ค้นข่าวเก่าปี 2554 ในหอสมุดชั้น 1 ดู แล้วจะรู้ว่าใครได้ประโยชน์ (รหัสตู้เซฟ 514)"!',
      },
    ]);
  }

  private interactLibraryArchive(): void {
    const f = this.state.flags;
    if (!f.checkedLibrary) {
      f.checkedLibrary = true;
      this.addClue('library_archive');
      this.addItem('old_cassette');
      this.sound.playClueChime();
      this.startDialogue([
        {
          speaker: 'ภีม (เปิดแฟ้มข่าวเก่าปี 2554)',
          role: 'หอสมุดโรงเรียนชั้น 1',
          portrait: 'player',
          text: 'เจอข่าวหน้าหนึ่งเมื่อ 15 ปีก่อน! "ดาวประกาย เฉือนชนะคู่แข่งคนสนิท น.ส. วิไลวรรณ คว้าตัวแทนนาฏศิลป์ระดับประเทศ ก่อนพลัดตกเวทีซ้อมเสียชีวิตคืนถัดมา"... แถมในซอกหนังสือมีม้วน "เทปโหมโรง 2554" กับกุญแจพวงหนึ่งซ่อนอยู่ด้วย!',
        },
      ]);
      this.saveGame();
    } else {
      this.showToast('ค้นแฟ้มข่าวปี 2554 เรียบร้อยแล้ว');
    }
  }

  private interactJanitor(): void {
    const f = this.state.flags;
    if (!f.talkedJanitor) {
      f.talkedJanitor = true;
      this.addClue('janitor_witness');
      this.addItem('teacher_key');
      this.addItem('music_room_key');
      this.sound.playPickup();
      this.startDialogue([
        {
          speaker: 'ลุงมั่น (ภารโรงเก่าแก่)',
          role: 'ป้อมหน้าโรงเรียน',
          portrait: 'uncle',
          text: 'หนุ่มภีมเอ๊ย... ลุงเห็นนะว่าไอ้ก้องมันท้าเอ็งขึ้นชั้น 3! เอ็งรู้ไหมคืนเกิดเหตุเมื่อ 15 ปีก่อน ลุงเห็นผู้หญิงหอบกระป๋องน้ำมันขึ้นไปราดพื้นเวทีนาฏศิลป์ แล้วไอ้ก้องมันก็คือ "หลานชายแท้ๆ ของครูวิไล"!',
        },
        {
          speaker: 'ลุงมั่น',
          role: 'ยื่นพวงกุญแจสำรองให้ภีม',
          portrait: 'uncle',
          text: 'ถ้าเอ็งคิดจะพิสูจน์เปิดโปงความจริง ลุงฝาก "กุญแจห้องพักครู" กับ "กุญแจห้องดนตรีไทย" ไว้ให้ เผื่อเอ็งต้องแอบเข้าไปกลางดึกตอนตึกเงียบ!',
        },
      ]);
      this.saveGame();
      return;
    }
    this.adjustSanity(15);
    this.showToast('ลุงมั่น: "ระวังตัวบนชั้น 3 ด้วยนะลูก ถ้าได้ยินเสียงระนาดรีบเข้าตู้ล็อกเกอร์!" (+15 สติ)');
  }

  private interactTeacherDoor(): void {
    if (!this.state.inventory.includes('teacher_key')) {
      this.showToast('ประตูห้องพักครูหมวดศิลปะล็อกอยู่ — ลองคุยขอพวงกุญแจจากลุงมั่นภารโรงป้อมหน้าโรงเรียน');
      return;
    }
    this.enterRoom('teacher_office', 1, 44.0);
  }

  private interactTeacherWilai(): void {
    const h = (this.state.gameMinutes % 1440) / 60;
    if (h >= 19 || h < 5.5) {
      this.showToast('โต๊ะครูวิไลว่างเปล่าในยามวิกาล... แต่ตู้เซฟเหล็กมุมห้องยังคงตั้งอยู่');
      return;
    }
    this.startDialogue([
      {
        speaker: 'ครูวิไล (ยิ้มเย็นผิดปกติ)',
        role: 'หัวหน้าชมรมนาฏศิลป์',
        portrait: 'vendor',
        text: 'อ้าว ภีม ม.5/2 มีธุระอะไรที่ห้องพักครูจ๊ะ? อย่าไปสนใจข่าวลือไร้สาระเรื่องห้องดนตรีไทยชั้น 3 เลยนะ... แต่ถ้าอยากลองพิสูจน์ตอนกลางคืนกับเพื่อนๆ ครูก็ไม่ห้ามหรอก หึหึ',
      },
    ]);
  }

  private interactTeacherSafe(): void {
    const f = this.state.flags;
    if (f.unlockedSafeProof) {
      this.showToast('ตู้เซฟเปิดออกแล้ว — คุณนำ "ชฎาทองโบราณ" ออกมาเรียบร้อย');
      return;
    }
    let code = '';
    this.openModal(
      'ตู้เซฟนิรภัยมุมโต๊ะครูวิไล',
      `
      <p style="text-align:center;color:#9fa6b8;margin-top:0">ใส่รหัส 3 หลัก (คำใบ้: โน้ตใต้โต๊ะห้อง ม.5/2 = 514)</p>
      <div class="keypad-display" id="safe-disp">---</div>
      <div class="keypad-grid">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'ตกลง'].map((k) => `<button class="keypad-btn" data-skp="${k}">${k}</button>`).join('')}
      </div>
      `
    );
    const disp = document.getElementById('safe-disp')!;
    this.modalBody.querySelectorAll<HTMLButtonElement>('[data-skp]').forEach((b) => {
      b.addEventListener('click', () => {
        this.sound.playSwitchClick();
        const v = b.dataset.skp!;
        if (v === 'C') code = '';
        else if (v === 'ตกลง') {
          if (code === '514') {
            f.unlockedSafeProof = true;
            this.addItem('gold_chada');
            this.addClue('wilai_safe_proof');
            this.closeModal();
            this.sound.playClueChime();
            this.startDialogue([
              {
                speaker: 'ภีม (เบิกตากว้าง!!)',
                role: 'หน้าตู้เซฟห้องพักครู',
                portrait: 'player',
                text: 'ข้างในตู้เซฟมี "ชฎาทองโบราณของพี่ดาวประกาย" กับบันทึกสารภาพว่าครูวิไลแอบทาน้ำมันขี้ผึ้งบนเวทีและขังพี่ดาวไว้จนคอหักตาย!! รีบนำชฎาทองนี้ขึ้นไปคืนบนแท่นบูชาห้องดนตรีไทยชั้น 3 เดี๋ยวนี้!',
              },
            ]);
            this.saveGame();
            return;
          } else {
            this.showToast('รหัสตู้เซฟไม่ถูกต้อง!', true);
            code = '';
          }
        } else if (code.length < 3) code += v;
        disp.textContent = code.padEnd(3, '-');
      });
    });
  }

  private interactMusicDoor(): void {
    if (!this.state.inventory.includes('music_room_key')) {
      this.showToast('ประตูห้องดนตรีไทยล็อกโซ่! ขอ "กุญแจห้องดนตรีไทย" จากลุงมั่นภารโรงป้อมหน้าโรงเรียน');
      return;
    }
    this.enterRoom('music_room', 3, 42.0);
  }

  private interactRanatStage(): void {
    const f = this.state.flags;
    if (f.playedRanatNight) {
      this.sound.playRanatNote(0, true);
      this.showToast('เสียงระนาดเอกก้องสะท้อนเย็นยะเยือกในห้องดนตรีไทย!');
      return;
    }
    if (!this.isNightTime()) {
      this.sound.playRanatNote(2, false);
      this.showToast('ลองตีระนาดเอกตอนกลางวันเสียงไพเราะกังวาน — คำท้าต้องมาตีและถ่ายรูปหลัง 19:00 น.!');
      return;
    }

    // Interactive 4-Key Thai Ranat Rhythm Mini-Game!
    let seqIdx = 0;
    const targetSeq = [0, 1, 2, 3];
    this.openModal(
      'มินิเกมตีระนาดเอก 3 จังหวะ (ทำตามคำท้ากลางดึก!)',
      `
      <p style="margin-top:0">กดตีลูกระนาดเรียงตามลำดับโน้ตโบราณ <strong style="color:#fde047">โด → เร → มี → ซอล</strong>:</p>
      <div id="ranat-prog" style="margin-bottom:10px;color:#38bdf8">ขั้นที่ 1/4: กดลูก "โด"</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <button class="secondary-btn" data-rn="2">มี</button>
        <button class="secondary-btn" data-rn="0">โด</button>
        <button class="secondary-btn" data-rn="3">ซอล</button>
        <button class="secondary-btn" data-rn="1">เร</button>
      </div>
      `
    );
    const names = ['โด', 'เร', 'มี', 'ซอล'];
    this.modalBody.querySelectorAll<HTMLButtonElement>('[data-rn]').forEach((b) => {
      b.addEventListener('click', () => {
        const n = Number(b.dataset.rn);
        this.sound.playRanatNote(n, true);
        if (n === targetSeq[seqIdx]) {
          seqIdx++;
          if (seqIdx >= 4) {
            f.playedRanatNight = true;
            this.closeModal();
            this.playCutscene('music_room_ranat', () => {
              this.ghostChase = true;
              this.ghostChaseTimer = 14;
              this.ghostFloor = 3;
              this.ghostX = 6.2;
              this.chaseBanner.classList.remove('hidden');
              this.sound.playScare();
              this.showToast('วิญญาณผีนางรำตื่นขึ้นหน้ากระจกแล้ว!! ถ่ายรูปหน้ากระจก [C / E] แล้วรีบหนี!', true);
            });
            this.saveGame();
          } else {
            document.getElementById('ranat-prog')!.textContent = `ขั้นที่ ${seqIdx + 1}/4: กดลูก "${names[seqIdx]}"`;
          }
        } else {
          seqIdx = 0;
          document.getElementById('ranat-prog')!.textContent = 'ผิดคีย์! เริ่มกดใหม่จากลูก "โด"';
        }
      });
    });
  }

  private interactMusicMirror(): void {
    const f = this.state.flags;
    if (!this.isNightTime()) {
      this.showToast('กระจกบานใหญ่หน้าเวทีห้องดนตรีไทย — ตอนกลางวันสะท้อนเงาห้องเรียนปกติ');
      return;
    }
    this.sound.playCameraShutter();
    if (!f.snappedMirrorPhoto) {
      f.snappedMirrorPhoto = true;
      this.addClue('mirror_photo');
      if (!this.state.photos.includes('ภาพถ่ายผีนางรำหน้ากระจกห้องดนตรีไทย')) {
        this.state.photos.push('ภาพถ่ายผีนางรำหน้ากระจกห้องดนตรีไทย');
      }
      this.sound.playScare();
      this.adjustSanity(-15);
      this.startDialogue([
        {
          speaker: 'ภีม (ชัตเตอร์มือถือสว่างวาบ!)',
          role: 'หน้ากระจกห้องดนตรีไทย — กลางดึก',
          portrait: 'player',
          text: 'แชะ!! ในรูปถ่ายติดเงาหญิงสาวสวมสไบแดงยืนร่ายรำเอียงคอหักซ้อนอยู่ด้านหลังจริงๆ!! คำท้าสำเร็จแล้ว... แต่ตอนนี้เธอยื่นนิ้วชี้ไปทาง "ห้องพักครูชั้น 1" ราวกับอยากให้เราหา "ชฎาทอง" ของเธอกลับมา!',
        },
      ]);
      this.saveGame();
    } else {
      this.showToast('ถ่ายภาพหลักฐานหน้ากระจกไว้แล้ว — รีบไปค้นตู้เซฟห้องพักครูชั้น 1 หรือคืนชฎาทองที่แท่นบูชา!');
    }
  }

  private interactMusicAltar(): void {
    const f = this.state.flags;
    if (!this.state.inventory.includes('gold_chada')) {
      this.showToast('แท่นบูชาครูนาฏศิลป์ว่างเปล่าไร้ "ชฎาทองโบราณ" — ลองไปค้นตู้เซฟในห้องพักครูวิไล (ชั้น 1)');
      return;
    }
    f.returnedChadaCrown = true;
    this.removeItem('gold_chada');
    this.ghostChase = false;
    this.chaseBanner.classList.add('hidden');
    this.sound.playClueChime();
    this.saveGame();

    const endType: EndingType =
      f.unlockedSafeProof && f.snappedMirrorPhoto && f.confrontedKongTwist ? 'true' : 'normal';

    this.playCutscene('dancer_finale', () => {
      this.startDialogue([
        {
          speaker: 'วิญญาณพี่ดาวประกาย',
          role: 'หน้าแท่นบูชาห้องดนตรีไทย',
          portrait: 'prim',
          text: '(ร่ายรำโค้งคำนับอย่างอ่อนช้อยกลางแสงสีทอง) "ขอบคุณที่นำชฎาทองและทวงคืนความยุติธรรมให้พี่... จากนี้ไปโรงเรียนมัธยมจันทรารัตน์จะไม่มีเสียงร่ำไห้ยามค่ำคืนอีกแล้ว..."',
          choices: [
            {
              label: 'สรุปความจริงทั้งหมดและปิดฉาก Chapter 3 อย่างสมบูรณ์',
              action: () => this.triggerEnding(endType),
            },
          ],
        },
      ]);
    });
  }

  private triggerEnding(type: EndingType): void {
    this.state.flags.endingReached = type;
    this.paused = true;
    this.ghostChase = false;
    this.chaseBanner.classList.add('hidden');
    this.saveGame();

    const info: Record<EndingType, { title: string; sub: string; body: string }> = {
      true: {
        title: 'Chapter 3 True Ending — ตำนานผีนางรำพังทลาย',
        sub: 'คืนชฎาทองให้พี่ดาวประกาย และเปิดโปงแผนชั่วของครูวิไล & ไอ้ก้อง',
        body: 'ภาพถ่ายหน้ากระจก เทปเพลงโหมโรงปี 2554 และหลักฐานในตู้เซฟห้องพักครูส่งตรงถึงตำรวจและผู้อำนวยการโรงเรียน! ครูวิไลถูกจับข้อหาฆาตกรรมอำพรางเมื่อ 15 ปีก่อน ส่วนไอ้ก้องสารภาพผิดและขอขมาผู้เสียหายทุกคน พี่ดาวประกายจากไปสู่สุคติในรุ่งอรุณ...',
      },
      normal: {
        title: 'Chapter 3 Normal Ending — คืนชฎาแต่ความลับยังไม่สิ้น',
        sub: 'ดวงวิญญาณสงบลงชั่วคราว แต่ยังสืบปากคำไอ้ก้องไม่ครบ',
        body: 'ภีมวางชฎาทองคืนที่แท่นบูชาได้สำเร็จ ผีนางรำสงบลงและยอมปล่อยให้ภีมกลับบ้านอย่างปลอดภัย ทว่าครูวิไลยังอ้างว่าไม่รู้เห็นเรื่องเก่า...',
      },
      bad: {
        title: 'Chapter 3 Bad Ending — นาฏศิลป์นิรันดร์บนชั้น 3',
        sub: 'สติหมดสิ้นท่ามกลางเสียงระนาดยามวิกาล',
        body: 'ความกลัวครอบงำจนภีมก้าวพลาดในความมืด เหลือเพียงมือถือและกล้องที่ยังเปิดแฟลชทิ้งไว้หน้ากระจกห้องดนตรีไทย...',
      },
    };

    const d = info[type];
    this.openModal(
      d.title,
      `
      <h3 style="color:#f6d594;margin-top:0">${d.sub}</h3>
      <p>${d.body}</p>
      <div style="margin-top:14px;padding:10px;background:rgba(255,255,255,0.05);border-radius:4px;font-size:0.86rem;color:#9fa6b8">
        เบาะแสที่รวบรวมได้: <strong>${this.state.clues.length}/${Object.keys(CH3_CLUES).length}</strong> • วันที่: วันที่ ${this.state.day}
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
        <button id="ch3-restart" class="secondary-btn">เล่น Chapter 3 ใหม่</button>
        <button id="ch3-menu" class="primary-btn">กลับหน้าหลักเลือกบท</button>
      </div>
      `
    );
    document.getElementById('ch3-restart')?.addEventListener('click', () => {
      this.closeModal();
      this.paused = false;
      this.startNewGame();
    });
    document.getElementById('ch3-menu')?.addEventListener('click', () => {
      this.closeModal();
      this.onExitToMenu();
    });
  }

  private openSchoolBusModal(): void {
    this.sound.playVehicleHorn();
    this.openModal(
      'รถสองแถวนักเรียน — เดินทางด่วน',
      `
      <p style="margin-top:0">เลือกจุดจอดรถสองแถว (ฟรีสำหรับนักเรียน):</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button class="secondary-btn" data-bus="-110">🏠 หน้าบ้านของภีม (-110 ม.)</button>
        <button class="secondary-btn" data-bus="-52">🏫 หน้าซุ้มประตูโรงเรียนมัธยมจันทรารัตน์ (-52 ม.)</button>
        <button class="secondary-btn" data-bus="68">🍱 หน้าโรงอาหาร & สหกรณ์โรงเรียน (+68 ม.)</button>
      </div>
      `
    );
    this.modalBody.querySelectorAll<HTMLButtonElement>('[data-bus]').forEach((b) => {
      b.addEventListener('click', () => {
        const dest = Number(b.dataset.bus);
        this.closeModal();
        this.ridingBike = false;
        this.playCutscene('songthaew_ride', () => {
          this.state.x = dest;
          this.updateHUD();
          this.saveGame();
        });
      });
    });
  }

  private interactCoopShop(): void {
    const h = (this.state.gameMinutes % 1440) / 60;
    if (h >= 18.0 || h < 6.0) {
      this.showToast('ร้านสหกรณ์โรงเรียนปิดประตูเหล็กแล้วในยามค่ำคืน!');
      return;
    }
    this.openModal(
      `สหกรณ์โรงเรียน (เงินติดตัว: ${this.state.baht} ฿)`,
      `
      <p style="margin-top:0">ป้าแม่ค้าสหกรณ์: "เอาหยังดีลูกภีม เตรียมเสบียงไว้เผื่ออยู่ดึกทำรายงานไหม?"</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button class="primary-btn" data-buy="battery_pack" data-p="30">🔋 ถ่านไฟฉายพลังสูง (30 ฿) — ฟื้นแบต +85%</button>
        <button class="secondary-btn" data-buy="inhaler" data-p="25">🌿 ยาดมสมุนไพร (25 ฿) — ฟื้นสติ +35%</button>
        <button class="secondary-btn" data-buy="chilled_soda" data-p="20">🥤 น้ำแดงโซดา (20 ฿) — ฟื้นสติ +30% & กำลังวิ่ง 100%</button>
      </div>
      `
    );
    this.modalBody.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.buy!;
        const p = Number(b.dataset.p);
        if (this.state.baht < p) return this.showToast(`เงินไม่พอ (ต้องใช้ ${p} ฿)`, true);
        this.state.baht -= p;
        this.sound.playCoinJingle();
        this.addItem(id);
        this.closeModal();
        this.updateExtraHud();
        this.saveGame();
      });
    });
  }

  private interactBasketballGame(): void {
    this.openModal(
      'สนามบาสโรงเรียน — มินิเกมชู้ตบาส',
      `
      <p style="margin-top:0">กดปล่อยบอลเมื่อเคอร์เซอร์วิ่งเข้าโซนสีส้ม:</p>
      <div style="height:24px;background:#0f172a;border:1px solid #f97316;border-radius:8px;position:relative;overflow:hidden;margin:14px 0">
        <div style="position:absolute;left:38%;width:24%;top:0;bottom:0;background:rgba(249,115,22,0.4)"></div>
        <div id="ch3-bb" style="position:absolute;top:2px;bottom:2px;width:10px;background:#fde047;left:0%"></div>
      </div>
      <button id="ch3-bb-go" class="primary-btn" style="width:100%">🏀 ชู้ตบาส!</button>
      `
    );
    const cur = document.getElementById('ch3-bb')!;
    let pos = 0;
    let dir = 1;
    const tm = window.setInterval(() => {
      if (!this.modalOpen) return clearInterval(tm);
      pos += dir * 3.8;
      if (pos >= 92) { pos = 92; dir = -1; }
      else if (pos <= 0) { pos = 0; dir = 1; }
      cur.style.left = `${pos}%`;
    }, 28);
    document.getElementById('ch3-bb-go')?.addEventListener('click', () => {
      clearInterval(tm);
      this.closeModal();
      const hit = pos >= 35 && pos <= 65;
      this.adjustSanity(hit ? 25 : 10);
      if (hit) this.sound.playClueChime();
      this.showToast(hit ? 'สวบ! ลงห่วงสวยๆ (+25 สติ)' : 'แกร๊ง! ขยับร่างกายคลายเครียด (+10 สติ)');
    });
  }

  private interactSchoolShrine(): void {
    const f = this.state.flags;
    this.adjustSanity(25);
    this.sound.playClueChime();
    if (!f.prayedShrine) {
      f.prayedShrine = true;
      this.addItem('holy_sai_sin');
      this.showToast('กราบขอพรศาลตายายใต้ต้นโพธิ์ ได้รับ "ด้ายสายสิญจน์ศาลตายาย" คุ้มครองกาย!');
      this.saveGame();
    } else {
      this.showToast('นั่งพักใต้ร่มต้นโพธิ์ศาลตายาย (+25 สติ)');
    }
  }

  private openSleepModal(): void {
    this.openModal(
      'ห้องนอนของภีม — พักผ่อน & รอเวลา',
      `
      <p style="margin-top:0">เลือกเวลาตื่น ชาร์จแบตไฟฉายมือถือเต็ม 100% หรือเซฟเกม:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
        <button class="secondary-btn" data-slp="460">🌅 เช้าไปเรียน (07:40)</button>
        <button class="secondary-btn" data-slp="750">☀️ เที่ยงวัน (12:30)</button>
        <button class="primary-btn" data-slp="1260">🌙 คืนท้าพิสูจน์ (21:00)</button>
        <button class="secondary-btn" id="ch3-save-now">💾 บันทึกเกมตอนนี้</button>
      </div>
      `
    );
    this.modalBody.querySelectorAll<HTMLElement>('[data-slp]').forEach((el) => {
      el.addEventListener('click', () => {
        const m = Number(el.dataset.slp);
        if (m <= this.state.gameMinutes) this.state.day++;
        this.state.gameMinutes = m;
        this.state.sanity = 100;
        this.state.battery = 100;
        this.stamina = 100;
        this.closeModal();
        this.updateHUD();
        this.saveGame();
        this.showToast('พักผ่อน & ชาร์จไฟฉายเต็ม 100% เรียบร้อย!');
      });
    });
    document.getElementById('ch3-save-now')?.addEventListener('click', () => this.saveGame(false));
  }

  private takePhoto(): void {
    if (this.modalOpen || this.activeDialogue.length > 0 || this.cutscene.isPlaying()) return;
    this.sound.playCameraShutter();
    if (this.currentRoom === 'music_room' && Math.abs(this.state.x - 3.6) < 2.8) {
      this.interactMusicMirror();
    } else if (this.ghostChase || this.ghostShowTimer > 0) {
      if (!this.state.photos.includes('ภาพถ่ายผีนางรำกลางทางเดิน')) {
        this.state.photos.push('ภาพถ่ายผีนางรำกลางทางเดิน');
        this.adjustSanity(15);
        this.saveGame();
      }
      this.showToast('📷 แชะ! เก็บภาพผีนางรำได้กลางทางเดิน (+15 สติ)');
    } else {
      this.showToast('📷 แชะ! บันทึกภาพบรรยากาศโรงเรียน (จุดสำคัญ: หน้ากระจกห้องดนตรีไทยตอนกลางคืน)');
    }
  }

  private toggleBicycle(): void {
    if (this.currentRoom !== 'outside' || this.state.floor !== 0) {
      return this.showToast('ปั่นจักรยานได้เฉพาะบนถนน/ลานชั้นล่างเท่านั้น');
    }
    this.ridingBike = !this.ridingBike;
    this.sound.playBicycleBell();
    this.touchBike.textContent = this.ridingBike ? '🚲✓' : '🚲';
    this.touchBike.classList.toggle('active', this.ridingBike);
    this.renderInventory();
    this.showToast(this.ridingBike ? 'ขึ้นปั่นจักรยานเสือหมอบ!' : 'จอดจักรยานแล้ว');
  }

  private toggleFlashlight(): void {
    this.sound.init();
    this.sound.playSwitchClick();
    if (!this.state.flashlightOn && this.state.battery <= 0) {
      return this.showToast('แบตไฟฉายหมด! ซื้อถ่านที่สหกรณ์หรือนอนชาร์จที่บ้าน', true);
    }
    this.state.flashlightOn = !this.state.flashlightOn;
    this.btnFlashlight.classList.toggle('active', this.state.flashlightOn);
    this.touchFlashlight.classList.toggle('active', this.state.flashlightOn);
    this.touchFlashlight.textContent = this.state.flashlightOn ? '🔦✓' : '🔦';
  }

  private useItem(id: string): void {
    const it = CH3_ITEMS[id];
    if (!it) return;
    this.sound.playUIClick();
    if (id === 'inhaler') {
      this.adjustSanity(35);
      this.removeItem('inhaler');
      return this.showToast('สูดยาดมเรียกสติ (+35 สติ)');
    }
    if (id === 'chilled_soda') {
      this.adjustSanity(30);
      this.stamina = 100;
      this.removeItem('chilled_soda');
      return this.showToast('ดื่มน้ำแดงโซดาเย็นซ่า (+30 สติ & กำลังวิ่ง 100%)');
    }
    if (id === 'holy_sai_sin') {
      this.adjustSanity(45);
      this.removeItem('holy_sai_sin');
      return this.showToast('อาราธนาด้ายสายสิญจน์ศาลตายาย (+45 สติ)');
    }
    if (id === 'battery_pack') {
      this.state.battery = Math.min(100, this.state.battery + 85);
      this.removeItem('battery_pack');
      this.updateExtraHud();
      return this.showToast('ชาร์จพลังไฟฉาย +85% แล้ว!');
    }
    if (id === 'bicycle') return this.toggleBicycle();
    if (id === 'camera_phone') return this.takePhoto();
    this.showToast(`${it.name} — ${it.description}`);
  }

  private addItem(id: string): void {
    if (!this.state.inventory.includes(id)) {
      this.state.inventory.push(id);
      this.sound.playPickup();
      this.renderInventory();
      if (id === 'bicycle') this.touchBike.classList.remove('hidden');
      this.showToast(`เก็บไอเทม: ${CH3_ITEMS[id]?.name}`);
      this.saveGame();
    }
  }

  private removeItem(id: string): void {
    this.state.inventory = this.state.inventory.filter((x) => x !== id);
    this.renderInventory();
    this.saveGame();
  }

  private addClue(id: string): void {
    if (!this.state.clues.includes(id)) {
      this.state.clues.push(id);
      this.sound.playClueChime();
      this.showToast(`เบาะแสใหม่: ${CH3_CLUES[id].title}`);
      this.saveGame();
    }
  }

  private adjustSanity(delta: number): void {
    this.state.sanity = Math.max(0, Math.min(100, Math.round(this.state.sanity + delta)));
    this.updateHUD();
    if (this.state.sanity === 0 && !this.state.flags.endingReached) {
      this.triggerEnding('bad');
    }
  }

  private renderInventory(): void {
    renderSharedInventoryBar({
      invBar: this.invBar,
      modalBody: this.modalBody,
      items: this.state.inventory,
      getMeta: (id) => {
        const it = CH3_ITEMS[id];
        if (!it) return undefined;
        return {
          name: it.name,
          description: it.description,
          badgeText: id === 'bicycle' && this.ridingBike ? 'กำลังปั่น [B]' : it.name,
          active: id === 'bicycle' && this.ridingBike,
        };
      },
      getIconUrl: (id) => {
        let u = this.iconCache.get(id);
        if (!u) {
          u = drawCh3ItemIconDataUrl(id);
          this.iconCache.set(id, u);
        }
        return u;
      },
      onUse: (id) => this.useItem(id),
      onReorder: (order) => {
        this.state.inventory = order;
        this.saveGame();
      },
      onOpenModal: (t, h) => this.openModal(t, h),
      onCloseModal: () => this.closeModal(),
      onPlayClick: () => this.sound.playUIClick(),
    });
  }

  private getNearestInteractable(): Ch3Interactable | null {
    let best: Ch3Interactable | null = null;
    let bestD = Infinity;
    for (const it of this.interactables) {
      if ((it.room ?? 'outside') !== this.currentRoom) continue;
      if (this.currentRoom === 'outside' && it.floor !== this.state.floor) continue;
      if (it.id === 'ch3_bike' && this.state.inventory.includes('bicycle')) continue;
      const d = Math.abs(this.state.x - it.x);
      if (d <= (it.range ?? 2.0) && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    return best;
  }

  private tryInteract(): void {
    const f = this.getNearestInteractable();
    if (f) f.onInteract();
  }

  private startDialogue(lines: DialogueLine[]): void {
    this.activeDialogue = lines;
    this.dialogueIndex = 0;
    this.dialogueBox.classList.remove('hidden');
    this.renderDialogueLine();
  }

  private renderDialogueLine(): void {
    const line = this.activeDialogue[this.dialogueIndex];
    if (!line) return;
    this.dialogueSpeaker.textContent = line.speaker;
    this.dialogueRole.textContent = line.role;
    this.dialogueText.textContent = line.text;
    const ctx = this.dialoguePortrait.getContext('2d')!;
    ctx.clearRect(0, 0, 96, 96);
    const kindMap = {
      player: 'peem',
      vendor: 'mom_ch3',
      uncle: 'janitor_man',
      tom: 'kong_bully',
      prim: 'dancer_ghost',
      worker: 'teacher_somchai',
      narrator: 'teacher_wilai',
    } as const;
    const sp = drawCh3CharacterCanvas(kindMap[line.portrait], 0);
    ctx.drawImage(sp, 16, 4, 96, 120, 0, 0, 96, 96);

    this.dialogueChoices.innerHTML = '';
    if (line.choices?.length) {
      this.dialogueContinue.classList.add('hidden');
      line.choices.forEach((ch) => {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.textContent = ch.label;
        b.addEventListener('click', () => {
          this.sound.playUIClick();
          this.dialogueBox.classList.add('hidden');
          this.activeDialogue = [];
          ch.action?.();
        });
        this.dialogueChoices.appendChild(b);
      });
    } else {
      this.dialogueContinue.classList.remove('hidden');
    }
  }

  private advanceDialogue(): void {
    const cur = this.activeDialogue[this.dialogueIndex];
    if (cur?.choices?.length) return;
    this.sound.playUIClick();
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.activeDialogue.length) {
      this.dialogueBox.classList.add('hidden');
      this.activeDialogue = [];
      cur?.onFinish?.();
    } else {
      this.renderDialogueLine();
    }
  }

  private openModal(t: string, html: string): void {
    this.modalTitle.textContent = t;
    this.modalBody.innerHTML = html;
    this.modalBackdrop.classList.remove('hidden');
    this.modalOpen = true;
  }

  private closeModal(): void {
    this.modalBackdrop.classList.add('hidden');
    this.modalOpen = false;
  }

  private openRulesModal(): void {
    this.sound.playUIClick();
    this.openModal(
      'กฎเหล็กโรงเรียนมัธยมจันทรารัตน์',
      CH3_RULES.map((r) => `<div class="rule-card"><div class="rule-title">${r.number} ${r.title}</div><div>${r.desc}</div></div>`).join('')
    );
  }

  private openNotebookModal(): void {
    this.sound.playUIClick();
    const list =
      this.state.clues.length === 0
        ? '<p style="color:#9fa6b8">ยังไม่มีเบาะแส</p>'
        : this.state.clues.map((id) => `<div class="clue-item"><div class="clue-title">${CH3_CLUES[id].title}</div><div>${CH3_CLUES[id].detail}</div></div>`).join('');
    this.openModal(`สมุดสืบปมโรงเรียน (${this.state.clues.length}/${Object.keys(CH3_CLUES).length})`, list);
  }

  private openMapModal(): void {
    this.sound.playUIClick();
    this.openModal(
      'แผนผังโรงเรียนมัธยมจันทรารัตน์ & บ้านภีม',
      `
      <div class="map-floor"><strong>บ้านของภีม & ป้ายสองแถว (-124 .. -56)</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">บ้านภีม (-110) • จักรยาน (-104.5) • ป้ายสองแถว (-88)</div></div>
      <div class="map-floor"><strong>ชั้น 0 — หน้าประตู เสาธง โรงอาหาร & ศาล (-52 .. +124)</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ประตู (-52) • ลุงมั่น (-44) • แก๊งไอ้ก้อง (-38.5) • บันไดขึ้นชั้น 1-3 (+59.5) • สหกรณ์ (+70) • สนามบาส (+90) • ศาลตายาย (+112)</div></div>
      <div class="map-floor"><strong>ชั้น 1: หอสมุด (+8) • ล็อกเกอร์ (+22/+52) • ห้องพักครู (+44)</strong></div>
      <div class="map-floor"><strong>ชั้น 2: ห้องเรียน ม.5/2 (+10) • ล็อกเกอร์ (+24) • ห้องน้ำหลบภัย (+48)</strong></div>
      <div class="map-floor"><strong>ชั้น 3: ห้องเก็บชุดหลบภัย (+18) • ห้องดนตรีไทยต้องคำสาป (+42)</strong></div>
      `
    );
  }

  private getNavigationGuide(): { text: string; direction: string } {
    const f = this.state.flags;
    let tRoom: Ch3RoomId = 'outside';
    let tFloor: FloorIndex = 0;
    let tx = -110;
    let text = '';

    if (!f.talkedMomIntro) {
      tRoom = 'protagonist_house';
      tx = -2.2;
      text = 'คุยลาแม่คำในห้องรับแขกเพื่อรับค่าขนมก่อนไปโรงเรียน';
    } else if (!f.acceptedDare) {
      tx = -38.5;
      text = 'ปั่นจักรยาน/นั่งสองแถวไปหน้าโรงเรียน (-38 ม.) คุยกับกลุ่มไอ้ก้อง';
    } else if (!f.attendedClass) {
      tRoom = 'classroom_2b';
      tFloor = 2;
      tx = -3.2;
      text = 'ขึ้นชั้น 2 เข้าห้องเรียน ม.5/2 เรียนกับครูสมชาย (+25 สติ & +50 ฿)';
    } else if (!f.checkedLibrary) {
      tRoom = 'library_room';
      tFloor = 1;
      tx = 0.2;
      text = 'เข้าหอสมุดชั้น 1 (+8 ม.) ค้นแฟ้มข่าวเก่าปี 2554';
    } else if (!f.talkedJanitor) {
      tx = -44.0;
      text = 'ไปป้อมยามหน้าโรงเรียน (-44 ม.) ขอกุญแจห้องพักครู & ห้องดนตรีไทยจากลุงมั่น';
    } else if (!this.isNightTime() && !f.playedRanatNight) {
      tRoom = 'protagonist_house';
      tx = 4.3;
      text = 'กลับบ้านพักนอนบนเตียงรอถึงคืนท้าพิสูจน์ (21:00 น.) หรือสำรวจศาล/สหกรณ์ก่อน!';
    } else if (!f.playedRanatNight || !f.snappedMirrorPhoto) {
      tRoom = 'music_room';
      tFloor = 3;
      tx = f.playedRanatNight ? 3.6 : 1.8;
      text = f.playedRanatNight ? 'ถ่ายรูปหน้ากระจกห้องดนตรีไทย [E/C]' : 'ขึ้นชั้น 3 เข้าห้องดนตรีไทย (+42 ม.) ตีระนาดเอกหน้าเวที!';
    } else if (!f.unlockedSafeProof) {
      tRoom = 'teacher_office';
      tFloor = 1;
      tx = 4.6;
      text = 'เข้าห้องพักครูชั้น 1 (+44 ม.) ไขตู้เซฟ (514) นำชฎาทองออกมา!';
    } else if (!f.confrontedKongTwist) {
      tx = -38.5;
      text = 'ไปเค้นความจริงจากไอ้ก้องหน้าโรงเรียน (-38 ม.) เรื่องครูวิไล!';
    } else {
      tRoom = 'music_room';
      tFloor = 3;
      tx = 5.4;
      text = 'นำชฎาทองขึ้นห้องดนตรีไทยชั้น 3 วางคืนบนแท่นบูชาปลดปล่อยวิญญาณ!';
    }

    let direction = '';
    if (this.currentRoom !== tRoom) {
      direction =
        this.currentRoom !== 'outside'
          ? '◀ เดินไปประตูซ้ายเพื่อออกจากห้อง'
          : this.state.floor !== tFloor
          ? Math.abs(this.state.x - CH3_STAIR_X) <= 2.2
            ? tFloor > this.state.floor ? `▲ กด [W] ขึ้นชั้น ${this.state.floor + 1}` : `▼ กด [S] ลงชั้น ${this.state.floor - 1}`
            : CH3_STAIR_X > this.state.x ? '▶ เดินไปบันไดฝั่งขวา (+59.5 ม.)' : '◀ เดินไปบันไดฝั่งขวา (+59.5 ม.)'
          : tx < this.state.x ? `◀ เดินไปทางซ้าย (${Math.round(this.state.x - tx)} ม.)` : `▶ เดินไปทางขวา (${Math.round(tx - this.state.x)} ม.)`;
    } else if (this.currentRoom === 'outside' && this.state.floor !== tFloor) {
      direction =
        Math.abs(this.state.x - CH3_STAIR_X) <= 2.2
          ? tFloor > this.state.floor ? `▲ กด [W] ขึ้นชั้น ${this.state.floor + 1}` : `▼ กด [S] ลงชั้น ${this.state.floor - 1}`
          : CH3_STAIR_X > this.state.x ? '▶ ไปบันไดฝั่งขวา (+59.5 ม.)' : '◀ ไปบันไดฝั่งขวา (+59.5 ม.)';
    } else {
      const dx = tx - this.state.x;
      direction = Math.abs(dx) <= 2.0 ? 'ถึงจุดหมายแล้ว — กด [E]' : dx < 0 ? `◀ ซ้าย (${Math.round(-dx)} ม.)` : `▶ ขวา (${Math.round(dx)} ม.)`;
    }
    return { text, direction };
  }

  private updateHUD(): void {
    const tm = Math.floor(this.state.gameMinutes) % 1440;
    this.hudClock.textContent = `${String(Math.floor(tm / 60)).padStart(2, '0')}:${String(tm % 60).padStart(2, '0')}`;
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    const pMap: Record<TimePeriod, string> = { dawn: 'รุ่งสาง', morning: 'เช้า', noon: 'กลางวัน', evening: 'เย็น', night: 'กลางคืน' };
    this.hudPeriod.textContent = pMap[period];
    this.hudWeather.textContent = this.state.weather === 'rain' ? 'ฝนปรอย' : 'แดดร่มลมตก';
    this.hudLocation.textContent = CH3_ZONE_NAMES(this.state.x, this.state.floor, this.currentRoom);
    this.hudSanityVal.textContent = `${this.state.sanity}%`;
    this.hudSanityFill.style.width = `${this.state.sanity}%`;
    this.hudSanityFill.style.background = this.state.sanity > 60 ? '#679c77' : this.state.sanity > 30 ? '#c99746' : '#b83b3b';
    this.sanityOverlay.classList.toggle('low-sanity', this.state.sanity <= 55 && this.state.sanity > 25);
    this.sanityOverlay.classList.toggle('critical-sanity', this.state.sanity <= 25);

    const g = this.getNavigationGuide();
    this.hudQuest.textContent = `เป้าหมาย: ${g.text}`;
    this.hudNav.textContent = g.direction;
    this.updateExtraHud();

    // Show staircase up/down mobile buttons near stairs
    const nearStair = this.currentRoom === 'outside' && Math.abs(this.state.x - CH3_STAIR_X) <= 2.2;
    this.touchUp.classList.toggle('hidden', !(nearStair && this.state.floor < 3));
    this.touchDown.classList.toggle('hidden', !(nearStair && this.state.floor > 0));
  }

  private updateExtraHud(): void {
    if (this.hudExtra) {
      this.hudExtra.textContent = `💰 ${this.state.baht} ฿ • 🏃 ${Math.round(this.stamina)}% • 🔋 ${Math.round(this.state.battery)}%`;
    }
  }

  private showToast(msg: string, horror = false): void {
    const el = document.createElement('div');
    el.className = `toast ${horror ? 'horror' : ''}`;
    el.textContent = msg;
    this.toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  private loop(now: number): void {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this.paused) {
      const canMove = !this.modalOpen && this.activeDialogue.length === 0 && !this.cutscene.isPlaying() && !this.isHiding;
      this.mobileControls.classList.toggle('overlay-paused', !canMove && !this.isHiding);
      this.interactPrompt.classList.toggle('overlay-paused', !canMove && !this.isHiding);
      this.invBar.classList.toggle('overlay-paused', !canMove);

      let mx = 0;
      let mz = 0;
      if (canMove) {
        if (this.codes.has('KeyA') || this.codes.has('ArrowLeft') || this.touchMoveDir === -1) mx -= 1;
        if (this.codes.has('KeyD') || this.codes.has('ArrowRight') || this.touchMoveDir === 1) mx += 1;
        if (this.codes.has('KeyW') || this.codes.has('ArrowUp')) mz -= 1;
        if (this.codes.has('KeyS') || this.codes.has('ArrowDown')) mz += 1;
      }

      const moving = mx !== 0 || mz !== 0;
      const wantSprint =
        moving &&
        !this.ridingBike &&
        (this.codes.has('ShiftLeft') || this.codes.has('ShiftRight') || this.isSprintingTouch) &&
        this.stamina > 2;
      this.stamina = wantSprint ? Math.max(0, this.stamina - 24 * dt) : Math.min(100, this.stamina + 15 * dt);

      if (this.state.flashlightOn && !this.isHiding) {
        this.state.battery = Math.max(0, this.state.battery - 1.0 * dt);
        if (this.state.battery <= 0) {
          this.state.flashlightOn = false;
          this.btnFlashlight.classList.remove('active');
          this.touchFlashlight.classList.remove('active');
          this.touchFlashlight.textContent = '🔦';
          this.sound.playSwitchClick();
          this.showToast('แบตไฟฉายหมด! ซื้อที่สหกรณ์หรือกลับไปนอนชาร์จที่บ้าน', true);
        }
      }

      this.hudExtraTimer -= dt;
      if (this.hudExtraTimer <= 0) {
        this.hudExtraTimer = 0.25;
        this.updateExtraHud();
      }

      const isNight = this.isNightTime();
      if (moving) {
        if (mx !== 0) this.facing = mx > 0 ? 1 : -1;
        const speed = this.ridingBike && this.state.floor === 0 ? 10.6 : wantSprint ? 7.4 : 4.6;
        let minX = this.currentRoom !== 'outside' ? -6.6 : this.state.floor === 0 ? CH3_MIN_X : CH3_BLDG_MIN_X;
        const maxX = this.currentRoom !== 'outside' ? 6.6 : this.state.floor === 0 ? CH3_MAX_X : CH3_BLDG_MAX_X;
        let nextX = this.state.x + mx * speed * dt;
        // Night gate blocks straight entry at -52 unless you climbed through side gate!
        if (this.currentRoom === 'outside' && this.state.floor === 0 && isNight && !this.state.flags.sneakedNightSchool) {
          if (this.state.x <= -52.1 && nextX > -52.8) {
            nextX = -52.8;
            this.showToast('ประตูใหญ่ล็อกตอนกลางคืน — กด [E] แอบลอดรั้วข้างป้อมยามเข้าไป!');
          }
        }
        this.state.x = Math.max(minX, Math.min(maxX, nextX));
        this.playerZ = Math.max(-0.35, Math.min(0.95, this.playerZ + mz * 2.1 * dt));
        this.updateHUD();
        if (!this.ridingBike) {
          this.stepTimer -= dt;
          if (this.stepTimer <= 0) {
            this.stepTimer = wantSprint ? 0.19 : 0.28;
            this.sound.playFootstep('concrete');
          }
        }
      }

      const prevM = Math.floor(this.state.gameMinutes);
      this.state.gameMinutes = (this.state.gameMinutes + dt * 1.4) % 1440;
      const curH = Math.floor(this.state.gameMinutes / 60);
      if ((curH === 8 || curH === 12 || curH === 16) && this.lastBellHour !== curH) {
        this.lastBellHour = curH;
        this.sound.playSchoolBell();
      }
      if (Math.floor(this.state.gameMinutes) !== prevM) this.updateHUD();

      this.autoSaveTimer -= dt;
      if (this.autoSaveTimer <= 0) {
        this.autoSaveTimer = 5;
        this.saveGame();
      }

      if (this.ghostCooldown > 0) this.ghostCooldown -= dt;
      if (this.ghostShowTimer > 0 && !this.ghostChase) this.ghostShowTimer -= dt;

      // Ghost Dancer Pursuit Logic
      if (this.ghostChase && !this.isHiding) {
        this.ghostChaseTimer -= dt;
        if (this.currentRoom === 'protagonist_house' || this.state.x < -55) {
          this.ghostChase = false;
          this.chaseBanner.classList.add('hidden');
          this.ghostCooldown = 12;
        } else {
          this.ghostFloor = this.state.floor;
          const dir = this.state.x >= this.ghostX ? 1 : -1;
          this.ghostX += dir * 3.15 * dt;
          this.ghostShowTimer = 1.0;
          if (Math.abs(this.ghostX - this.state.x) < 0.85) {
            this.ghostChase = false;
            this.ghostCooldown = 14;
            this.chaseBanner.classList.add('hidden');
            this.sound.playScare();
            this.scareFlash.classList.add('active');
            setTimeout(() => this.scareFlash.classList.remove('active'), 260);
            this.adjustSanity(-30);
            this.showToast('ผีนางรำพุ่งร่ายรำเฉียดลำคอจนสติหลุด! (-30 สติ)', true);
          } else if (this.ghostChaseTimer <= 0) {
            this.ghostChase = false;
            this.chaseBanner.classList.add('hidden');
            this.ghostCooldown = 10;
          }
        }
      } else if (
        isNight &&
        !this.isHiding &&
        !this.state.flags.returnedChadaCrown &&
        this.state.flags.playedRanatNight &&
        canMove &&
        this.ghostCooldown <= 0 &&
        this.state.floor >= 1 &&
        this.state.flashlightOn &&
        Math.random() < dt * 0.14
      ) {
        this.ghostFloor = this.state.floor;
        this.ghostX = this.state.x + this.facing * 7.5;
        this.ghostChase = true;
        this.ghostChaseTimer = 12;
        this.ghostShowTimer = 2.5;
        this.chaseBanner.classList.remove('hidden');
        this.sound.playScare();
        this.showToast('เสียงระนาดดังลั่น! ผีนางรำกำลังลอยตามแสงไฟฉายมาแล้ว — รีบหนีซ่อนในล็อกเกอร์!', true);
      }

      const nearest = this.isHiding
        ? { id: 'hide_exit', label: `ออกจาก${this.hideSpotLabel} [E]`, floor: this.state.floor, x: this.state.x, onInteract: () => this.exitHideSpot() }
        : canMove
        ? this.getNearestInteractable()
        : null;
      if (nearest) {
        this.interactPrompt.classList.remove('hidden');
        this.interactLabel.textContent = nearest.getLabel ? nearest.getLabel() : nearest.label;
      } else {
        this.interactPrompt.classList.add('hidden');
      }

      // Spatial Thai Classical Music & School Ambience
      const h = (this.state.gameMinutes % 1440) / 60;
      const inSchoolHours = h >= 7.0 && h < 16.5;
      const distCampus = this.currentRoom === 'outside' ? Math.abs(this.state.x - 10) : 0;
      const musicProx =
        this.currentRoom === 'music_room' || this.ghostChase
          ? 1.0
          : this.currentRoom === 'outside' && this.state.floor === 3
          ? Math.max(0.25, 1 - Math.abs(this.state.x - 42) / 55)
          : this.currentRoom === 'outside' && this.state.x > -30 && this.state.x < 85 && (inSchoolHours || isNight)
          ? 0.22
          : 0;

      this.sound.updateAmbience(
        dt,
        this.state.weather,
        this.world.getTimePeriod(this.state.gameMinutes),
        this.state.sanity,
        this.state.floor,
        this.ghostChase
      );
      this.sound.updateSchoolCrowdAmbience(
        dt,
        1 - distCampus / 68,
        inSchoolHours && !isNight && !this.ghostChase && !this.cutscene.isPlaying()
      );
      this.sound.updateThaiClassicalAmbience(
        dt,
        !this.cutscene.isPlaying() ? musicProx : 0,
        isNight || this.ghostChase,
        this.ghostChase
      );

      this.world.update(
        dt,
        this.state.x,
        this.playerZ,
        this.state.floor,
        this.currentRoom,
        this.facing,
        moving,
        this.state.flashlightOn,
        this.state.gameMinutes,
        this.state.weather,
        this.state.inventory.includes('bicycle'),
        this.ridingBike,
        this.ghostShowTimer > 0 || this.ghostChase,
        this.ghostChase,
        this.ghostFloor,
        this.ghostX,
        this.isHiding,
        this.state.flags.snappedMirrorPhoto,
        this.state.flags.returnedChadaCrown,
        isNight && !this.state.flags.sneakedNightSchool
      );
    }
  }
}
