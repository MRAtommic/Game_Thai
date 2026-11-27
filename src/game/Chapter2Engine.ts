import { drawCh2CharacterCanvas, drawCh2ItemIconDataUrl } from '../art/Chapter2Sprites';
import { SoundEngine } from '../audio/SoundEngine';
import { speakDialogueLine, stopVoiceActing } from '../audio/VoiceActor';
import { CH2_CLUES, CH2_ITEMS, CH2_RULES, CH2_ZONE_NAMES } from '../data/chapter2Data';
import { DialogueLine, EndingType, FloorIndex, TimePeriod, WeatherType } from '../types';
import { CutscenePlayer, IsaanCutsceneId } from '../ui/CutscenePlayer';
import { renderSharedInventoryBar } from '../ui/InventoryBar';
import { bindCameraZoomControls } from '../ui/mobileZoom';
import { CH2_MAX_X, CH2_MIN_X, Ch2RoomId, IsaanWorld, VillageMood } from '../world/IsaanWorld';

const CH2_SAVE_KEY = 'reuan_chan_ch2_save_v1';

interface Ch2Flags {
  bondedWithFamilyDay1: boolean;
  askedFishFolkloreDay1: boolean;
  boughtPorkDay1: boolean;
  heardHerbFolkloreDay1: boolean;
  greetedMonkDay1: boolean;
  finishedDay1Dinner: boolean;
  learnedSweetTrap: boolean;
  checkedUnderHouse: boolean;
  sawKrasueAtWindow: boolean;
  gotHerbsAndThorns: boolean;
  placedThornsAtWindow: boolean;
  checkedButcherDeep: boolean;
  checkedFishDeep: boolean;
  checkedYaiSai: boolean;
  readTempleHistory: boolean;
  saiSinPrepared: boolean;
  checkedSaiSinCircle: boolean;
  talkedToMonkOnce: boolean;
  gotBetelBox: boolean;
  monkBlessedFinal: boolean;
  comfortedSisterCrisis: boolean;
  banishedKrasue: boolean;
  endingReached: EndingType | null;
  talkedDrunk?: boolean;
  inspectedTakian?: boolean;
  visitedFair?: boolean;
  ateSomtam?: boolean;
  caughtPondFishDay1?: boolean;
  heardPaWarning?: boolean;
  inspectedTani?: boolean;
  wonFairPrize?: boolean;
  checkedChickenCoopDay2?: boolean;
  checkedClinic?: boolean;
  checkedSchool?: boolean;
  gaveAlmsMorning?: boolean;
  boughtFromTan?: boolean;
  soldFishToBua?: boolean;
}

interface Ch2SaveState {
  gameMinutes: number;
  day: number;
  weather: WeatherType;
  x: number;
  sanity: number;
  flashlightOn: boolean;
  inventory: string[];
  clues: string[];
  flags: Ch2Flags;
  baht?: number;
  battery?: number;
  photos?: string[];
}

interface Ch2Interactable {
  id: string;
  label: string;
  room?: Ch2RoomId;
  x: number;
  getX?: () => number;
  range?: number;
  getLabel?: () => string;
  onInteract: () => void;
}

const DEFAULT_CH2_FLAGS = (): Ch2Flags => ({
  bondedWithFamilyDay1: false,
  askedFishFolkloreDay1: false,
  boughtPorkDay1: false,
  heardHerbFolkloreDay1: false,
  greetedMonkDay1: false,
  finishedDay1Dinner: false,
  learnedSweetTrap: false,
  checkedUnderHouse: false,
  sawKrasueAtWindow: false,
  gotHerbsAndThorns: false,
  placedThornsAtWindow: false,
  checkedButcherDeep: false,
  checkedFishDeep: false,
  checkedYaiSai: false,
  readTempleHistory: false,
  saiSinPrepared: false,
  checkedSaiSinCircle: false,
  talkedToMonkOnce: false,
  gotBetelBox: false,
  monkBlessedFinal: false,
  comfortedSisterCrisis: false,
  banishedKrasue: false,
  endingReached: null,
});

export class Chapter2Engine {
  private world: IsaanWorld;
  private sound: SoundEngine;
  private onExitToMenu: () => void;
  private state: Ch2SaveState;

  private ac = new AbortController();
  private running = false;
  private rafId = 0;
  private paused = false;
  private lastTime = 0;

  private currentRoom: Ch2RoomId = 'outside';
  private outsideReturnX = 0;
  private playerZ = 0.85;
  private facing: 1 | -1 = 1;
  private ridingBike = false;
  private codes = new Set<string>();
  private touchMoveDir: -1 | 0 | 1 = 0;
  private isSprintingTouch = false;
  private stamina = 100;
  private lastRoosterDay = -1;
  private dogHowlCooldown = 0;
  private hudExtraTimer = 0;
  private stepTimer = 0;
  private autoSaveTimer = 5;

  // Krasue apparition & chase state
  private krasueShowTimer = 0;
  private krasueX = 12.0;
  private krasueChase = false;
  private krasueChaseTimer = 0;
  private krasueCooldown = 0;

  private activeDialogue: DialogueLine[] = [];
  private dialogueIndex = 0;
  private modalOpen = false;
  private cutscene = new CutscenePlayer();
  private iconCache = new Map<string, string>();
  private interactables: Ch2Interactable[] = [];

  // Shared HUD DOM references
  private hudTop = document.getElementById('hud-top')!;
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
  private hudExtra = document.getElementById('hud-extra');

  constructor(canvas: HTMLCanvasElement, sound: SoundEngine, onExitToMenu: () => void) {
    this.world = new IsaanWorld(canvas);
    this.sound = sound;
    this.onExitToMenu = onExitToMenu;
    this.state = this.createNewState();
    this.setupInteractables();
    this.bindInputs();
  }

  private createNewState(): Ch2SaveState {
    return {
      gameMinutes: 16 * 60 + 15, // Sunny afternoon homecoming!
      day: 1,
      weather: 'clear',
      x: 1.5,
      sanity: 100,
      flashlightOn: false,
      inventory: ['inhaler', 'camera'],
      clues: [],
      flags: DEFAULT_CH2_FLAGS(),
      baht: 120,
      battery: 100,
      photos: [],
    };
  }

  private playCutscene(id: IsaanCutsceneId, after?: () => void): void {
    this.codes.clear();
    this.touchMoveDir = 0;
    this.isSprintingTouch = false;
    this.cutscene.play(id, after);
  }

  public startNewGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    this.state = this.createNewState();
    this.currentRoom = 'outside';
    this.ridingBike = false;
    this.krasueChase = false;
    this.krasueShowTimer = 0; // Slow-burn: NO Krasue on Day 1 arrival!
    this.saveGame();
    this.beginPlay();
    this.playCutscene('homecoming', () => {
      this.startDialogue([
        {
          speaker: 'หนุ่ม',
          role: 'บัณฑิตจบใหม่ — ลานหน้าบ้านไม้ยกสูง',
          portrait: 'player',
          text: 'ในที่สุดกะได้กลับมาเหยียบแผ่นดินบ้านเกิดอีสานบ้านเฮาจักเทื่อ... สี่ปีที่ไปเฮียนไปเฮ็ดงานอยู่เมืองกรุง คิดฮอดกลิ่นดิน กลิ่นท่งนา กับลมเย็นๆ ใต้ถุนเฮือนไม้ยกสูงคักอีหลี!',
        },
        {
          speaker: 'หนุ่ม',
          role: 'คิดถึงครอบครัว',
          portrait: 'player',
          text: 'ป่านนี้แม่คำกับอีหล่าแก้วคือสิรอท่าอยู่เทิงเฮือนแล้ว แม่ส่งไลน์มาบอกตั้งแต่มื้อวานว่าสิเฮ็ดต้มไก่บ้านรอรับขวัญลูก เดี๋ยวฟ้าวย่างขึ้นขั่นไดไปกอดแม่กับน้องก่อนดีกว่า!',
        },
      ]);
    });
  }

  public continueGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    try {
      const raw = localStorage.getItem(CH2_SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Ch2SaveState;
        const mergedInv = Array.isArray(parsed.inventory) ? [...parsed.inventory] : ['inhaler'];
        if (!mergedInv.includes('camera')) mergedInv.push('camera');
        this.state = {
          ...this.createNewState(),
          ...parsed,
          inventory: mergedInv,
          baht: parsed.baht ?? 120,
          battery: parsed.battery ?? 100,
          photos: Array.isArray(parsed.photos) ? parsed.photos : [],
          flags: { ...DEFAULT_CH2_FLAGS(), ...(parsed.flags || {}) },
        };
      }
    } catch {
      this.state = this.createNewState();
    }
    this.stamina = 100;
    this.currentRoom = 'outside';
    this.beginPlay();
    this.showToast('โหลด Chapter 2 เรียบร้อย');
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
      'ผีกระสือกำลังลอยไล่ตามมา! รีบวิ่งหนีเข้า "วงสายสิญจน์ลานวัด" ที่หลบตุ่มมังกร หรือขึ้นบ้านไม้ยกสูง';

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
    if (isTouch) {
      this.mobileControls.classList.remove('hidden');
      this.touchFlashlight.classList.remove('hidden'); // ไฟฉายแสดงตลอดในโหมดสัมผัส
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
    document.getElementById('touch-shoot')?.classList.add('hidden');
    this.touchFlashlight.classList.add('hidden');
    this.touchBike.classList.add('hidden');
    this.isSprintingTouch = false;
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
      const toSave = this.currentRoom === 'outside' ? this.state : { ...this.state, x: this.outsideReturnX };
      localStorage.setItem(CH2_SAVE_KEY, JSON.stringify(toSave));
      if (!silent) this.showToast('บันทึก Chapter 2 แล้ว');
    } catch {
      // ignore storage errors
    }
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
      (factor) => this.world.setZoomFactor(factor),
      this.ac.signal,
      (msg) => this.showToast(msg)
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
        if (code === 'KeyE' || code === 'Space') {
          e.preventDefault();
          this.tryInteract();
        } else if (code === 'KeyF') {
          this.toggleFlashlight();
        } else if (code === 'KeyC') {
          e.preventDefault();
          this.takeEvidencePhoto();
        } else if (code === 'KeyB') {
          if (this.state.inventory.includes('bicycle')) this.toggleBicycle();
          else this.showToast('ยังไม่มีจักรยาน — ลองเก็บจักรยานที่จอดอยู่ข้างบ้านไม้ยกสูง (ซ้ายมือ)');
        } else if (code === 'KeyR') {
          this.openRulesModal();
        } else if (code === 'KeyN') {
          this.openNotebookModal();
        } else if (code === 'KeyM') {
          this.openMapModal();
        } else if (code.startsWith('Digit')) {
          const idx = Number(code.replace('Digit', '')) - 1;
          if (idx >= 0 && idx < 9 && this.state.inventory[idx]) {
            this.useItem(this.state.inventory[idx]);
          }
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
        const label = this.btnSound.querySelector('span');
        if (label) label.textContent = next ? 'เสียง: ปิด' : 'เสียง: เปิด';
        else this.btnSound.textContent = next ? 'เสียง: ปิด' : 'เสียง: เปิด';
        this.btnSound.classList.toggle('muted', next);
      },
      sig
    );
    this.dialogueBox.addEventListener(
      'click',
      (e) => {
        if ((e.target as HTMLElement).closest('.choice-btn')) return;
        this.advanceDialogue();
      },
      sig
    );
    document.getElementById('modal-close')!.addEventListener('click', () => this.closeModal(), sig);
    this.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.modalBackdrop) this.closeModal();
    }, sig);

    const bindHold = (id: string, dir: -1 | 1) => {
      const btn = document.getElementById(id)!;
      let activePointerId: number | null = null;
      const start = (ev: PointerEvent) => {
        ev.preventDefault();
        this.sound.init();
        activePointerId = ev.pointerId;
        this.touchMoveDir = dir;
        btn.classList.add('pressed');
        try { btn.setPointerCapture(ev.pointerId); } catch { }
      };
      const end = (ev: PointerEvent) => {
        if (activePointerId !== null && ev.pointerId !== activePointerId) return;
        ev.preventDefault();
        activePointerId = null;
        if (this.touchMoveDir === dir) this.touchMoveDir = 0;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', start as EventListener, sig);
      btn.addEventListener('pointerup', end as EventListener, sig);
      btn.addEventListener('pointercancel', end as EventListener, sig);
    };
    bindHold('touch-left', -1);
    bindHold('touch-right', 1);
    document.getElementById('touch-interact')!.addEventListener(
      'click',
      () => {
        this.sound.init();
        if (this.activeDialogue.length > 0) this.advanceDialogue();
        else this.tryInteract();
      },
      sig
    );
    // ปุ่มไฟฉาย (มือถือ)
    this.touchFlashlight.addEventListener('click', () => {
      this.sound.init();
      this.toggleFlashlight();
    }, sig);
    // ปุ่มจักรยาน (มือถือ) — แสดงเมื่อมีจักรยานในกระเป๋า
    this.touchBike.addEventListener('click', () => {
      this.sound.init();
      if (this.state.inventory.includes('bicycle')) this.toggleBicycle();
    }, sig);
    // ปุ่มโหมดวิ่ง [กดทีเดียว เปิด/ปิด] & กล้องมือถือ [C]
    this.touchSprint?.addEventListener(
      'click',
      () => {
        this.sound.init();
        this.sound.playUIClick();
        this.isSprintingTouch = !this.isSprintingTouch;
        this.touchSprint?.classList.toggle('active', this.isSprintingTouch);
        if (this.touchSprint) {
          this.touchSprint.textContent = this.isSprintingTouch ? '🏃 วิ่ง ✓' : '🏃 วิ่ง';
        }
        this.showToast(this.isSprintingTouch ? 'เปิดโหมดวิ่งแล้ว! กดเดินเพื่อวิ่งเร็วได้เลย' : 'สลับกลับเป็นโหมดเดินปกติแล้ว');
      },
      sig
    );
    this.touchPhoto?.addEventListener('click', () => {
      this.sound.init();
      this.takeEvidencePhoto();
    }, sig);
    this.interactPrompt.addEventListener('click', () => {
      this.sound.init();
      if (this.activeDialogue.length === 0 && !this.modalOpen) this.tryInteract();
    }, sig);
  }

  private setupInteractables(): void {
    this.interactables = [
      {
        id: 'ch2_bicycle',
        x: -6.5,
        range: 1.9,
        label: 'เก็บจักรยานบ้านทุ่ง (ปั่นเดินทางเร็ว)',
        onInteract: () => {
          this.addItem('bicycle');
          this.sound.playBicycleBell();
          this.showToast('เก็บ "จักรยานบ้านทุ่ง" แล้ว! กดปุ่ม [B] หรือคลิกไอเทมจักรยานเพื่อขึ้นปั่นได้เลย');
        },
      },
      {
        id: 'ch2_under_house',
        x: -1.8,
        range: 2.0,
        label: 'สำรวจแคร่ไม้ไผ่ใต้ถุนบ้าน',
        onInteract: () => this.interactUnderHouse(),
      },
      {
        id: 'stilt_stairs',
        x: 5.9,
        range: 2.0,
        label: 'ขึ้นบันไดบ้านไม้ยกสูงไปหาแม่คำ & น้องแก้ว',
        onInteract: () => {
          this.sound.playDoorCreak();
          this.enterRoom('stilt_house', 5.9);
        },
      },
      {
        id: 'ch2_hide_jar1',
        x: 4.0,
        range: 1.8,
        getLabel: () => (this.krasueChase ? 'รีบหลบหลังตุ่มมังกรคู่ข้างเรือน! (หนีกระสือ)' : 'แอบดูหลังตุ่มมังกรคู่หน้าเรือน'),
        label: 'ตุ่มมังกรคู่หน้าเรือน',
        onInteract: () => this.interactHideSpot('ตุ่มมังกรคู่หน้าเรือน'),
      },
      {
        id: 'ch2_hide_jar2',
        x: 23.5,
        range: 2.0,
        getLabel: () => (this.krasueChase ? 'รีบซ่อนตัวในพุ่มกอไผ่ริมสะพานหนองน้ำ! (หนีกระสือ)' : 'จุดหลบภัยในกอไผ่ริมสะพานไม้'),
        label: 'กอไผ่ริมสะพานหนองน้ำ',
        onInteract: () => this.interactHideSpot('พุ่มกอไผ่ริมสะพานไม้'),
      },
      {
        id: 'ch2_morning_monk',
        x: 0,
        getX: () => this.world.getMorningMonkX(),
        range: 2.6,
        label: 'ใส่บาตรพระยามเช้า (05:30 - 07:45 น.)',
        onInteract: () => this.interactMorningMonk(),
      },
      {
        id: 'ch2_school',
        x: -112.0,
        range: 2.8,
        label: 'สำรวจโรงเรียนประถมบ้านทุ่ง & ชิงช้าโบราณ',
        onInteract: () => this.interactSchool(),
      },
      {
        id: 'ch2_showhuay',
        x: -89.5,
        range: 2.4,
        label: 'แวะร้านชำเจ๊แตน (ซื้อถ่านไฟฉาย / ยาดม / น้ำแดง & ตู้บุญเติม)',
        onInteract: () => this.interactShowHuayShop(),
      },
      {
        id: 'ch2_clinic',
        x: 96.0,
        range: 2.6,
        label: 'ตรวจอนามัยบ้านทุ่ง & บอร์ดข่าวสาธารณสุข',
        onInteract: () => this.interactClinic(),
      },
      {
        id: 'ch2_paddy_shrine',
        x: 17.5,
        range: 2.3,
        label: 'ตรวจดูโคนศาลปู่ตาริมทุ่งนา',
        onInteract: () => this.interactPaddyShrine(),
      },
      {
        id: 'ch2_herbs',
        x: -28.0,
        range: 2.2,
        label: 'คุยกับตาชมที่แผงสมุนไพรพื้นบ้าน',
        onInteract: () => this.interactHerbsStall(),
      },
      {
        id: 'ch2_fish',
        x: -36.0,
        range: 2.2,
        label: 'คุยกับป้าบัวที่แผงปลา-กบสด',
        onInteract: () => this.interactFishStall(),
      },
      {
        id: 'ch2_butcher',
        x: -44.0,
        range: 2.2,
        label: 'คุยกับเฮียตี๋ที่แผงเขียงหมูสด',
        onInteract: () => this.interactButcherStall(),
      },
      {
        id: 'ch2_yai_sai',
        x: -51.8,
        range: 2.3,
        label: 'ดูบ้านไม้เก่าท้ายตลาดของยายสาย',
        onInteract: () => this.interactYaiSaiHouse(),
      },
      {
        id: 'ch2_saisin_circle',
        x: 31.8,
        range: 2.8,
        getLabel: () =>
          this.state.flags.saiSinPrepared
            ? 'พูดคุยกับชาวบ้านในวงสายสิญจน์คุ้มกันภัย'
            : 'ลานวัดป่าหน้าอุโบสถ',
        label: 'ลานวัดป่าหน้าอุโบสถ',
        onInteract: () => this.interactSaiSinCircle(),
      },
      {
        id: 'ch2_sala',
        x: 40.5,
        range: 2.8,
        label: 'เดินเข้าไปภายในพระอุโบสถ / ศาลาวัดป่า',
        onInteract: () => {
          this.sound.playDoorCreak();
          this.enterRoom('temple_sala', 40.5);
        },
      },
      {
        id: 'ch2_kuti_door',
        x: 54.5,
        range: 2.3,
        label: 'ขึ้นกุฏิเข้ากราบหลวงพี่',
        onInteract: () => {
          this.sound.playDoorCreak();
          this.enterRoom('kuti', 54.5);
        },
      },
      {
        id: 'ch2_cemetery',
        x: 120.5,
        range: 2.8,
        label: 'ตรวจดูโกศบรรจุอัฐิหมายเลข 4 ท้ายป่าช้าวัด',
        onInteract: () => this.interactBoneUrnCemetery(),
      },
      {
        id: 'ch2_takian',
        x: -96.5,
        range: 2.6,
        label: 'กราบขอพรและตรวจดูศาลเจ้าแม่ตะเคียนคู่ผูกผ้าเจ็ดสี',
        onInteract: () => this.interactTakianShrine(),
      },
      {
        id: 'ch2_busstop_west',
        x: -82.0,
        range: 2.3,
        label: 'โบกขึ้นรถสองแถวสายบ้านทุ่ง (เดินทางข้ามโซน)',
        onInteract: () => this.openSongthaewTransitModal(),
      },
      {
        id: 'ch2_busstop_market',
        x: -24.5,
        range: 2.1,
        label: 'ขึ้นรถสองแถวหน้าตลาดใหญ่บ้านทุ่ง (เดินทางข้ามโซน)',
        onInteract: () => this.openSongthaewTransitModal(),
      },
      {
        id: 'ch2_busstop_temple',
        x: 61.4,
        range: 2.3,
        label: 'ขึ้นรถสองแถวหน้าลานงานวัดป่า (เดินทางข้ามโซน)',
        onInteract: () => this.openSongthaewTransitModal(),
      },
      {
        id: 'ch2_drunk',
        x: -71.0,
        getX: () => this.world.getDrunkWalkerX(),
        range: 2.3,
        label: 'คุยกับลุงทิดขี้เมาหน้าปากซอย',
        onInteract: () => this.interactDrunkVillager(),
      },
      {
        id: 'ch2_somtam',
        x: -57.8,
        range: 2.1,
        label: 'แวะร้านส้มตำครกไม้-ไก่ย่าง แม่ลำไย',
        onInteract: () => this.interactSomtamStall(),
      },
      {
        id: 'ch2_temple_fair',
        x: 76.0,
        range: 4.5,
        label: 'เดินเที่ยวงานวัดป่า (ชิงช้าสวรรค์ / ปาลูกโป่ง / เวทีรำวง)',
        onInteract: () => this.interactTempleFair(),
      },
      {
        id: 'ch2_rothae',
        x: -18.0,
        getX: () => this.world.getRotHaeX(),
        range: 3.4,
        label: 'ทักทายขบวนรถแห่บ้านทุ่ง (ฟังหมอลำซิ่งเพิ่มสติ)',
        onInteract: () => this.interactRotHae(),
      },
      {
        id: 'ch2_pond_fish',
        x: 20.4,
        range: 2.3,
        label: 'ท่าน้ำหนองน้ำบ้านทุ่ง (ตกปลาช่อน / ดูชาวบ้านหว่านแห)',
        onInteract: () => this.interactPondFishing(),
      },
      {
        id: 'ch2_pa_tower',
        x: -8.6,
        range: 2.3,
        label: 'ฟังประกาศจากหอกระจายข่าวผู้ใหญ่บ้าน',
        onInteract: () => this.interactPaTower(),
      },
      {
        id: 'ch2_bangfai',
        x: -67.5,
        range: 2.4,
        label: 'ชมซุ้มลานบุญบั้งไฟพญานาคประจำหมู่บ้าน',
        onInteract: () => this.interactBangFai(),
      },
      {
        id: 'ch2_tani',
        x: -20.5,
        range: 2.2,
        label: 'ตรวจดูกอกล้วยตานีริมคันนา',
        onInteract: () => this.interactTaniBanana(),
      },
      {
        id: 'ch2_chicken_coop',
        x: 10.2,
        range: 2.2,
        label: 'ตรวจดูเล้าไก่บ้านข้างเรือนยกสูง',
        onInteract: () => this.interactChickenCoop(),
      },

      // INSIDE STILT HOUSE ('stilt_house')
      {
        id: 'house_exit',
        room: 'stilt_house',
        x: -6.8,
        range: 1.6,
        label: 'เดินลงบันไดบ้านไม้ยกสูง',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'house_mom_sis',
        room: 'stilt_house',
        x: -1.2,
        range: 2.2,
        label: 'คุยกับแม่คำและน้องแก้ว',
        onInteract: () => this.interactMomAndSister(),
      },
      {
        id: 'house_window',
        room: 'stilt_house',
        x: 2.2,
        range: 1.7,
        getLabel: () => {
          const f = this.state.flags;
          if (!f.checkedUnderHouse) return 'มองวิวทุ่งนาจากหน้าต่างเรือนไม้';
          if (!f.sawKrasueAtWindow) return 'เฝ้าดูหน้าต่างเรือนยามค่ำคืน';
          if (this.state.inventory.includes('jujube_thorns') && !f.placedThornsAtWindow) {
            return 'วางหนามพุทราขวางหน้าต่างป้องกันกระสือ';
          }
          return 'ตรวจดูขอบหน้าต่างเรือนไม้';
        },
        label: 'หน้าต่างเรือนไม้',
        onInteract: () => this.interactHouseWindow(),
      },
      {
        id: 'house_sleep',
        room: 'stilt_house',
        x: 4.8,
        range: 1.8,
        label: 'พักผ่อน / นอนรอเวลา / ชาร์จไฟฉาย & เซฟเกม',
        onInteract: () => this.openSleepModal(),
      },

      // INSIDE GRAND TEMPLE HALL / UBOSOT ('temple_sala')
      {
        id: 'sala_exit',
        room: 'temple_sala',
        x: -5.6,
        range: 1.8,
        label: 'เดินออกจากพระอุโบสถสู่ลานวัดป่า',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'sala_inscription',
        room: 'temple_sala',
        x: -1.6,
        range: 2.2,
        label: 'อ่านจารึกใบลานโบราณในตู้พระธรรม',
        onInteract: () => this.interactTempleSala(),
      },
      {
        id: 'sala_buddha',
        room: 'temple_sala',
        x: 2.8,
        range: 2.4,
        label: 'กราบไหว้พระประธานในอุโบสถ (+30 สติ)',
        onInteract: () => {
          this.sound.playClueChime();
          this.playCutscene('pray_buddha', () => {
            this.adjustSanity(30);
            this.showToast('ก้มกราบพระประธานสามครั้งในพระอุโบสถ — ใจสงบเยือกเย็น (+30 สติ)');
          });
        },
      },

      // INSIDE LUANG PHI'S KUTI ('kuti')
      {
        id: 'kuti_exit',
        room: 'kuti',
        x: -4.8,
        range: 1.6,
        label: 'ลงจากกุฏิหลวงพี่',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'kuti_monk',
        room: 'kuti',
        x: 1.8,
        range: 2.2,
        label: 'กราบนมัสการพูดคุยกับหลวงพี่',
        onInteract: () => this.interactLuangPhi(),
      },
    ];
  }

  private enterRoom(room: Ch2RoomId, returnX: number): void {
    if (this.ridingBike) {
      this.ridingBike = false;
      this.touchBike.textContent = '🚲';
      this.touchBike.classList.remove('active');
      this.renderInventory();
    }
    this.outsideReturnX = returnX;
    this.currentRoom = room;
    this.state.x = room === 'temple_sala' ? -4.8 : room === 'stilt_house' ? -6.8 : -3.8;
    this.playerZ = 0.65;
    this.facing = 1;
    this.updateHUD();
  }

  private exitRoom(): void {
    this.sound.playDoorCreak();
    this.currentRoom = 'outside';
    this.state.x = this.outsideReturnX;
    this.playerZ = 0.85;
    this.updateHUD();
  }

  // ==================== ACT 1 -> ACT 5 INTERACTIONS ====================

  private interactMomAndSister(): void {
    const f = this.state.flags;
    this.adjustSanity(20);

    // 1) Warm Day 1 Homecoming Bonding with authentic Isaan warmth!
    if (!f.bondedWithFamilyDay1) {
      f.bondedWithFamilyDay1 = true;
      this.addClue('family_story');
      this.startDialogue([
        {
          speaker: 'แม่คำ',
          role: 'แม่ของหนุ่ม (ยิ้มน้ำตาคลอ)',
          portrait: 'vendor',
          text: 'กลับมาแล้วบ่ลูกหล่า! เบิ่งแหมะ จ่อยลงไปหลายแท้บักหนุ่ม... มานี่มา แม่ต้มไก่บ้านใส่ใบมะขามอ่อนกับแจ่วบองไว้รอท่าลูกแล้ว กินข้าวแลงนำกันเด้อมื้อนี้',
        },
        {
          speaker: 'น้องแก้ว',
          role: 'น้องสาวของหนุ่ม (ยิ้มดีใจ)',
          portrait: 'prim',
          text: 'อ้ายหนุ่ม! แก้วเอาสมุดพกเทอมนี้มาอวดนำเด้อ ได้เกรดตั้ง 3.85 พุ้นน่ะ มื้อนี้บ้านเฮามีงานบุญวัดป่า มีรถแห่หมอลำซิ่งแล่นผ่านหน้าเฮือนนำ อ้ายไปเลาะตลาด ไปตึกปลาหนองน้ำ กับแวะเบิ่งงานวัดซอยแม่ก่อนเด้อ!',
        },
        {
          speaker: 'หนุ่ม',
          role: 'ลูกชายคนโต (กอดแม่กับน้อง)',
          portrait: 'player',
          text: 'คักขนาดเลยอีหล่าอ้าย! เดี๋ยวอ้ายสิไปเลาะตลาดสดซื้อหมูซื้อผัก แวะซัดส้มตำแม่ลำไย ไปตึกปลาหนองน้ำมาให้แม่เฮ็ดต้มยำ แวะเบิ่งงานวัดกับกราบหลวงพี่นำ — ว่าแต่บ้านเฮาช่วงนี้ยังม่วนซื่นปกติอยู่แม่นบ่ครับแม่?',
        },
        {
          speaker: 'แม่คำ',
          role: 'แม่ของหนุ่ม',
          portrait: 'vendor',
          text: 'ตอนนี้คึกคักม่วนซื่นหลายลูก ทั้งงานวัดทั้งบุญบั้งไฟ... แต่ยามดึกๆ ช่วงนี้หมามันหอนแปลกๆ อยู่จักหน่อย ฟ้าวออกไปเลาะตลาดทักทายเฮียตี๋ ป้าบัว ตาชม ตึกปลาหนองน้ำ แวะงานวัด แล้วกราบหลวงพี่ก่อนค่ำเด้อลูก ค่อยมากินข้าวแลงพร้อมหน้ากัน!',
        },
      ]);
      this.saveGame();
      return;
    }

    // 2) Returning home on Day 1 evening with groceries & pond fish for warm family dinner!
    if (!f.finishedDay1Dinner) {
      const finishedShoppingDay1 =
        f.boughtPorkDay1 &&
        f.askedFishFolkloreDay1 &&
        f.heardHerbFolkloreDay1 &&
        f.caughtPondFishDay1 &&
        f.visitedFair &&
        f.greetedMonkDay1;
      if (!finishedShoppingDay1) {
        this.startDialogue([
          {
            speaker: 'แม่คำ',
            role: 'แม่ของหนุ่ม',
            portrait: 'vendor',
            text: 'ฟ้าวไปเลาะตลาดสด (ตาชม ป้าบัว เฮียตี๋) ตึกปลาค่อหนองน้ำ เลาะงานวัดให้ม่วน แล้วแวะกราบหลวงพี่อยู่กุฏิให้ครบก่อนเด้อลูก ค่ำๆ จั่งกลับมากินข้าวแลงนำกัน!',
          },
        ]);
        return;
      }

      f.finishedDay1Dinner = true;
      if (this.state.inventory.includes('market_groceries')) this.removeItem('market_groceries');
      if (this.state.inventory.includes('fresh_fish')) this.removeItem('fresh_fish');
      this.state.day += 1;
      this.state.gameMinutes = 8 * 60 + 30; // Peaceful morning of Day 2!
      this.state.sanity = 100;
      this.state.battery = 100;
      this.state.baht = (this.state.baht ?? 120) + 50;
      this.sound.playCoinJingle();
      this.playCutscene('family_dinner', () => {
        this.startDialogue([
          {
            speaker: 'หนุ่ม',
            role: 'คืนแรกอันแสนอบอุ่นในเรือนไม้',
            portrait: 'player',
            text: 'แม่คำเฮ็ดต้มยำปลาค่อกับปิ้งหมูหอมฟุ้ง! ทั้งเฮือนล้อมวงจกข้าวเหนียวกินข้าวแลงนำกันอย่างม่วนซื่น ใต้แสงตะเกียงท่ามกลางเสียงรถแห่แว่วมาแต่ไกล (+50 ฿ & ชาร์จไฟฉายเต็ม 100%)',
          },
          {
            speaker: 'แม่คำ (เช้าวันรุ่งขึ้น — 08:30 น.)',
            role: 'ชวนคุยบนเรือนไม้ยกสูง',
            portrait: 'vendor',
            text: 'ตื่นแล้วบ่บักหนุ่ม... เมื่อคืนยามตีสอง แม่สะดุ้งตื่นย้อนได้ยินเสียงแมวขู่กับเสียงหมาหอนลากยาวใต้ถุนเฮือนเป็นตาหลอนคัก คือจั่งมีอีหยังมากุ๊กกักอยู่ใต้ถุน!',
          },
          {
            speaker: 'น้องแก้ว',
            role: 'น้องสาวของหนุ่ม (เพิ่งนึกขึ้นได้)',
            portrait: 'prim',
            text: 'เออแม่นอ้ายหนุ่ม! มื้อวานตอนบ่ายก่อนอ้ายสิเข้าเฮือน มีแม่เฒ่าหลังค่อมยื่น "ข้าวต้มมัด" ให้แก้วอยู่ฮั้วเฮือน แก้วได้กลิ่นมันคาวๆ เป็นตาขี้เดียด เลยลักถิ่มไว้ใต้แคร่ไม้ไผ่ใต้ถุนเฮือน บ่กล้ากินดอก...',
          },
          {
            speaker: 'หนุ่ม',
            role: 'นึกถึงตำนานที่ตาชมเล่า!',
            portrait: 'player',
            text: 'เดี๋ยวเด้อ... ข้าวต้มมัดกลิ่นคาวจากแม่เฒ่าหลังค่อม?! คือจั่งที่ตาชมเว้าเรื่องตำนานผีกระสือคายน้ำลายใส่ของกินเลยตั๊ว! เดี๋ยวอ้ายสิลงไปก้มเบิ่งใต้แคร่ไม้ไผ่ใต้ถุนเฮือนเดี๋ยวนี้แหละ!',
          },
        ]);
      });
      f.learnedSweetTrap = true;
      this.saveGame();
      return;
    }

    // 3) Day 2 after finding cursed sweet -> Waiting for night at window
    if (f.checkedUnderHouse && !f.sawKrasueAtWindow) {
      this.startDialogue([
        {
          speaker: 'แม่คำ',
          role: 'แม่ของหนุ่ม (เสียงสั่น)',
          portrait: 'vendor',
          text: 'ข้าวต้มมัดมีเมือกเขียวกับเส้นผมหงอกอีหลีเบาะลูก?! คืนนี้มันอาจสิลอยมาฮอดป่องเอี้ยมเฮือนเฮากะได้! ฟ้าวไปนอนรอเวลาฮอดยามดึก (21:00+) แล้วลองไปจอบเบิ่งอยู่ป่องเอี้ยมฝั่งขวาเด้อลูก',
        },
      ]);
      return;
    }

    // 4) After Krasue appeared at window -> urgent thorns defense
    if (f.sawKrasueAtWindow && !f.placedThornsAtWindow) {
      this.startDialogue([
        {
          speaker: 'น้องแก้ว',
          role: 'น้องสาวของหนุ่ม (ร้องไห้กอดแม่)',
          portrait: 'prim',
          text: 'อ้ายหนุ่ม... หน้ามันเป็นตาย่านคักอีหลี มันจ้องมาหาแก้วอยู่ป่องเอี้ยมตะกี้นี่เอง! ฟ้าวไปขอ "หนามพุทรา" นำตาชมอยู่ตลาดมาวางกั้นป่องเอี้ยมแหน่อ้าย!',
        },
      ]);
      return;
    }

    // 5) Final Act 4 emotional climax — Mom reveals the 20-year-old secret before the Cemetery showdown!
    if (f.monkBlessedFinal && !f.comfortedSisterCrisis) {
      f.comfortedSisterCrisis = true;
      this.addClue('grandma_truth');
      this.startDialogue([
        {
          speaker: 'น้องแก้ว',
          role: 'น้องสาวของหนุ่ม (เพิ่งผ่านนาทีเฉียดตาย)',
          portrait: 'prim',
          text: 'อ้ายหนุ่ม! ตะกี้แก้วฮู้สึกหนาววาบอยู่หน้าอกคือสิหายใจบ่ออก แล้วกะได้ยินเสียงขู่ดังกุกกักอยู่ตรงกิ่งหนามพุทราที่อ้ายวางกั้นไว้ริมป่องเอี้ยม ก่อนที่แสงสีเขียวสิพุ่งหนีไป!',
        },
        {
          speaker: 'แม่คำ',
          role: 'แม่ของหนุ่ม (ตัดสินใจเล่าความจริงทั้งหมด)',
          portrait: 'vendor',
          text: 'บุญรักษาเด้อลูก... แม่คงปิดบังต่อไปบ่ได้แล้ว ความจริงเมื่อ 20 ปีก่อน สมัยย่าบุญมายังอยู่ ย่าเคยพาสัปเหร่อกับหลวงพ่อไล่แม่ของยายสายที่เป็นกระสือจนครอบครัวเลาแตกสาแหรกขาด น้องสาวของยายสายเลยตายคากระท่อมตอนออกลูก... ตั้งแต่นั้นมายายสายเลยผูกใจเจ็บแค้น สาบานสิสืบสายทายาทใส่ลูกสาวบ้านเฮาให้ได้!',
        },
        {
          speaker: 'หนุ่ม',
          role: 'เข้าใจทุกอย่างแล้ว',
          portrait: 'player',
          text: 'มิน่าล่ะครับแม่... ทั้งเรื่องในใบลาน ทั้งชื่อแก้วในเชี่ยนหมาก! แต่ความแค้น 20 ปีมันต้องจบลงคืนนี้แหละ อ้ายสิไปที่โกศหมายเลข 4 หลังวัดป่า ทั้งตัดอาคมทั้งปลดปล่อยวิญญาณแค้นให้มันจบสิ้นสักเทื่อ แม่กับน้องล็อกประตูเฮือนรอท่าเลยเด้อ!',
        },
      ]);
      this.saveGame();
      return;
    }

    this.showToast('แม่คำและน้องแก้วอยู่บนเรือนอย่างปลอดภัย ล็อกประตูหน้าต่างเรียบร้อยแล้ว');
  }

  private interactUnderHouse(): void {
    const f = this.state.flags;
    if (!f.learnedSweetTrap) {
      this.showToast('แคร่ไม้ไผ่เย็นสบายใต้ถุนบ้าน — อากาศโปร่งลมพัดทุ่งนาน่านั่งพัก');
      return;
    }
    if (f.checkedUnderHouse) {
      this.showToast('ใต้แคร่ไม่มีอะไรเพิ่มเติมแล้ว คุณเก็บข้าวต้มมัดต้องสาปไว้เป็นหลักฐานแล้ว');
      return;
    }
    f.checkedUnderHouse = true;
    this.addItem('rotten_sweet');
    this.addClue('sister_dream');
    this.startDialogue([
      {
        speaker: 'หนุ่ม',
        role: 'ก้มมองใต้แคร่ไม้ไผ่ (ใต้ถุนบ้าน)',
        portrait: 'player',
        text: 'พ้อห่อใบตองข้าวต้มมัดที่อีหล่าแก้วโยนถิ่มไว้แล้ว! พอแหวกใบตองออกเบิ่ง... กลิ่นคาวตีขึ้นฮูดังจนแทบฮาก ข้างในมีเมือกเรืองแสงสีเขียวปนเส้นผมหงอกสีขาวขดอยู่เต็ม!',
      },
      {
        speaker: 'หนุ่ม',
        role: 'ขนลุกซู่ทั้งตัว!',
        portrait: 'player',
        text: 'เรื่องที่คนในตลาดส่ากันบ่แม่นเรื่องตั๋วแล้ว! คืนนี้ต้องขึ้นไปนอนรอให้ฮอดสามทุ่มครึ่ง (21:30+) แล้วคอยจอบเบิ่งอยู่ป่องเอี้ยมเฮือนให้เห็นกับตาว่ามันกล้าลอยมาอีหลีบ่!',
      },
    ]);
    this.saveGame();
  }

  private interactHouseWindow(): void {
    const f = this.state.flags;
    const h = this.state.gameMinutes / 60;
    const isNight = h >= 20.5 || h < 5.5;

    if (!f.checkedUnderHouse) {
      this.showToast('มองออกไปเห็นทุ่งนาสีเขียวและทิวต้นตาลสุดลูกหูลูกตา อากาศบ้านเราดีจริงๆ');
      return;
    }

    // THE TERRIFYING NIGHT KRASUE ENCOUNTER AT THE WINDOW!
    if (!f.sawKrasueAtWindow) {
      if (!isNight) {
        this.showToast('ตอนกลางวันข้างนอกยังดูปกติ — ลองนอนบนเสื่อฝั่งขวาเพื่อรอเฝ้าหน้าต่างตอนกลางคืน (21:30 น.)');
        return;
      }
      f.sawKrasueAtWindow = true;
      this.addItem('krasue_ash');
      this.addClue('window_slime');
      this.sound.playScare();
      this.scareFlash.classList.add('active');
      setTimeout(() => this.scareFlash.classList.remove('active'), 320);
      this.krasueShowTimer = 6.0;
      this.krasueX = 6.5;
      this.adjustSanity(-20);
      this.playCutscene('krasue_window', () => {
        this.startDialogue([
          {
            speaker: 'หนุ่ม (ตะลึงงัน!)',
            role: 'หน้าต่างเรือนไม้ — กลางดึก',
            portrait: 'player',
            text: 'ลมหอบใหญ่พัดบานป่องเอี้ยมเปิดผาง!! กลางความมืดนอกชายคา มีหัวแม่หญิงผมยุ่งเหยิงลอยเคว้งคว้าง พร้อมตับไตไส้พุงสีเขียวแดงเรืองแสงวูบวาบ แสยะปากเปื้อนเลือดจ้องตรงเข้ามาหาอีหล่าแก้ว!!',
          },
          {
            speaker: 'หนุ่ม',
            role: 'รีบกระชากบานหน้าต่างปิด!',
            portrait: 'player',
            text: 'มันฮ้องกรี๊ดเสียงแหลมก่อนสิบินวูบหายไปทางท่งนาวัด!! ตรงขอบป่องเอี้ยมมีคราบเมือกเรืองแสงหยดถิ่มไว้... ข่าวลือแพร่กระจายไปทั่วบ้านทุ่งในพริบตา ไทบ้านฟ้าวปิดประตูหน้าต่างเข้าเฮือนเงียบกริบ บ่มีรถแล่น งานวัดกับรถแห่ปิดมิดซิดเลย!',
          },
        ]);
      });
      this.saveGame();
      return;
    }

    if (this.state.inventory.includes('jujube_thorns') && !f.placedThornsAtWindow) {
      f.placedThornsAtWindow = true;
      this.removeItem('jujube_thorns');
      this.sound.playPickup();
      this.playCutscene('jujube_thorns', () => {
        this.startDialogue([
          {
            speaker: 'หนุ่ม',
            role: 'หน้าต่างเรือนไม้ยกสูง',
            portrait: 'player',
            text: 'เอากิ่งหนามพุทราสดมาขัดวางเรียงใต้ขอบป่องเอี้ยมจนแน่นหนา! ต่อแต่นี้ผีกระสือสิลอยเฉียดเข้ามาคายน้ำลายสืบทายาทบ่ได้อีกแล้ว — ฮอดเวลาออกไปสืบความจริงนำป้าบัว เฮียตี๋ กับยายสายอยู่ตลาดให้แจ้งแล้วว่าไผคือกระสือตัวจริง!',
          },
        ]);
      });
      this.saveGame();
      return;
    }

    this.showToast(
      f.placedThornsAtWindow
        ? 'กิ่งหนามพุทราวางขวางไว้อย่างดี ผีกระสือไม่อาจเข้าใกล้หน้าต่างได้'
        : 'มีคราบเมือกเรืองแสงติดอยู่ — รีบไปเอาหนามพุทราจากแผงตาชมมาวางป้องกัน!'
    );
  }

  private interactHerbsStall(): void {
    const f = this.state.flags;
    if (f.saiSinPrepared) {
      this.showToast('แผงสมุนไพรปิดเงียบ — ตาชมย้ายไปรวมตัวกับชาวบ้านใน "วงสายสิญจน์" ลานวัดป่าแล้ว!');
      return;
    }
    if (!f.bondedWithFamilyDay1) {
      this.showToast('ตาชมกำลังจัดสมุนไพร (ลองขึ้นไปคุยกับแม่คำและน้องแก้วบนบ้านก่อน)');
      return;
    }

    if (!f.heardHerbFolkloreDay1) {
      f.heardHerbFolkloreDay1 = true;
      this.addClue('krasue_folklore');
      this.startDialogue([
        {
          speaker: 'ตาชม',
          role: 'หมอยาสมุนไพรตลาดสดบ้านทุ่ง',
          portrait: 'uncle',
          text: 'อ้าว บักหนุ่ม! เฮียนจบเมืองกรุงแล้วเบาะโต เก่งคักอีหลีลูก ช่วงนี้กลับมาอยู่บ้านเฮากะย่างระวังโตแหน่เด้อหล่า ผู้เฒ่าผู้แก่เพิ่นเริ่มเว้าถึงตำนานเก่าอีกแล้ว',
        },
        {
          speaker: 'หนุ่ม',
          role: 'แวะคุยฟังเรื่องเล่าชุมชน',
          portrait: 'player',
          text: 'ตำนานอีหยังครับตา? ตะกี้นี้แม่คำกะเกริ่นๆ เรื่องเมื่อ 20 ปีก่อนคือกันครับ',
        },
        {
          speaker: 'ตาชม',
          role: 'หมอยาสมุนไพรตลาดสดบ้านทุ่ง',
          portrait: 'uncle',
          text: 'ผู้เฒ่าผู้แก่เพิ่นเล่าเรื่อง "ผีกระสือบ้านทุ่ง"... มันบ่แม่นผีสางธรรมดา แต่เกิดจากคนเล่นของสายดำที่พอใกล้หมดอายุขัย วิญญาณสิถอดหัวบินไปเกาะขอบป่องเอี้ยมเฮือนที่มีผู้สาว หรือหลอกเอาของกินปนน้ำลายให้กิน เพื่อสืบทอด "ทายาทกระสือ" ต่อไปอีกทอด! แล้วแนวที่มันย่านที่สุดกะคือ "กิ่งหนามพุทรา" — ฟังหูไว้หูเด้อหล่า!',
        },
      ]);
      this.saveGame();
      return;
    }

    if (!f.sawKrasueAtWindow) {
      this.showToast('ตาชม: "กิ่งหนามพุทรามีเต็มแผงเลยหนุ่ม ถ้าวันไหนเจอเรื่องแปลกๆ ที่บ้านค่อยมาขอตาได้ตลอด"');
      return;
    }

    if (!f.gotHerbsAndThorns) {
      f.gotHerbsAndThorns = true;
      this.addClue('thorn_lore');
      this.addItem('jujube_thorns');
      this.addItem('herbal_pouch');
      this.startDialogue([
        {
          speaker: 'ตาชม',
          role: 'หมอยาสมุนไพรตลาดสดบ้านทุ่ง',
          portrait: 'uncle',
          text: 'หา?! มันลอยมาเกาะป่องเอี้ยมเฮือนโตอีหลีเบาะ!! ...อย่าซ้าเด็ดขาด เอากิ่ง "หนามพุทรา" กับ "ห่อว่านใบหนาด" นี่ไปขัดวางไว้ใต้ป่องเอี้ยมเฮือนเดี๋ยวนี้เลย!',
        },
        {
          speaker: 'ตาชม',
          role: 'หมอยาสมุนไพรตลาดสดบ้านทุ่ง',
          portrait: 'uncle',
          text: 'พอวางหนามพุทราแล้ว ตาบอกให้ไปสืบเบิ่งให้แจ้งระหว่าง "ป้าบัวแผงปลา" ที่มักถือไฟเขียวกลางท่งนา กับ "ยายสายท้ายตลาด" ที่เฮ็ดโตลับๆ ล่อๆ สิได้ฮู้ว่าไผเป็นกระสือตัวจริง!',
        },
      ]);
      this.saveGame();
    } else {
      this.showToast('ตาชม: "วางหนามพุทราไว้หน้าหน้าต่างแล้ว อย่าลืมคุยสืบป้าบัว เฮียตี๋ และยายสายให้ครบด้วย"');
    }
  }

  private interactFishStall(): void {
    const f = this.state.flags;
    if (f.saiSinPrepared) {
      this.showToast('แผงปลาปิดเงียบ — ป้าบัวย้ายไปอยู่ใน "วงสายสิญจน์" หน้าลานวัดป่าแล้ว!');
      return;
    }
    if (!f.bondedWithFamilyDay1) {
      this.showToast('แผงปลาป้าบัวคึกคักในยามบ่าย (แวะขึ้นไปหาแม่คำและน้องแก้วก่อน)');
      return;
    }

    if (!f.askedFishFolkloreDay1) {
      f.askedFishFolkloreDay1 = true;
      this.startDialogue([
        {
          speaker: 'ป้าบัว',
          role: 'แม่ค้าแผงปลาตลาดสด',
          portrait: 'vendor',
          text: 'อ้าวหนุ่ม กลับมาอยู่บ้านนำแม่คำแล้วเบาะลูก! เอานี่ ปลาค่อสดๆ ไปฝากแม่เฮ็ดต้มส้มแหน่... แต่ช่วงนี้ย่างกลางคืนแถวคันแทนาให้ระวังโตแหน่เด้อลูก ไทบ้านมักเห็นแสงไฟสีเขียววูบวาบแถวป่าช้าหลังวัด',
        },
      ]);
      this.saveGame();
      return;
    }

    if (f.finishedDay1Dinner && this.state.inventory.includes('fresh_fish')) {
      this.removeItem('fresh_fish');
      this.state.baht = (this.state.baht ?? 120) + 60;
      this.state.flags.soldFishToBua = true;
      this.sound.playCoinJingle();
      this.updateExtraHud();
      this.showToast('ขายปลาช่อนสดให้ป้าบัวแผงปลาได้เงิน +60 ฿!');
      this.saveGame();
      return;
    }

    if (f.sawKrasueAtWindow && !f.checkedFishDeep) {
      f.checkedFishDeep = true;
      this.addClue('pond_clue');
      this.startDialogue([
        {
          speaker: 'หนุ่ม',
          role: 'หน้าแผงปลาป้าบัว',
          portrait: 'player',
          text: 'ป้าบัวครับ... คืนนั้นข้อยเห็นดวงไฟหัวกระสืออยู่ป่องเอี้ยมเฮือนอีหลี! แล้วแสงสีเขียวที่ไทบ้านเห็นแถวท่งนาหลังร้านป้าล่ะครับ แม่นป้าบ่ครับ?',
        },
        {
          speaker: 'ป้าบัว',
          role: 'แม่ค้าแผงปลาตลาดสด',
          portrait: 'vendor',
          text: 'พุทโธ่ลูกเอ๊ย! (ป้าบัวชูไฟส่องกบคาดหัวเก่าๆ ให้เบิ่ง) อันนี้ไฟฉายคาดหัว LED สีเขียวของป้าเอง ป้าใส่ส่องกบส่องเขียดยามฝนตกตั๊ว บ่แม่นผีสางดอก! แต่ดวงไฟที่ลอยสูงเทิงยอดไผ่แล้วบินหายไปทางเฮือนยายสายท้ายตลาดกับป่าช้าวัดน่ะ ป้าเห็นเต็มสองตาเมื่อตีหนึ่งคืนก่อนพุ้น!',
        },
      ]);
      this.saveGame();
      return;
    }

    this.showToast('ป้าบัว: "ป้าเป็นคนส่องกบด้วยไฟฉายคาดหัวเองลูก ส่วนกระสือตัวจริงบินไปทางบ้านยายสายท้ายตลาดโน่น!"');
  }

  private interactButcherStall(): void {
    const f = this.state.flags;
    if (f.saiSinPrepared) {
      this.showToast('เขียงหมูปิดร้านแล้ว — เฮียตี๋ไปช่วยชาวบ้านปักเสาล้อม "วงสายสิญจน์" ที่ลานวัดป่า!');
      return;
    }
    if (!f.bondedWithFamilyDay1) {
      this.showToast('เฮียตี๋กำลังสับหมูอยู่หลังเขียง (แวะขึ้นไปหาแม่คำและน้องแก้วก่อน)');
      return;
    }

    if (!f.boughtPorkDay1) {
      f.boughtPorkDay1 = true;
      this.addItem('market_groceries');
      this.startDialogue([
        {
          speaker: 'เฮียตี๋',
          role: 'เจ้าของเขียงหมูสด',
          portrait: 'tom',
          text: 'เฮ้ยบักหนุ่ม กลับมาบ้านเฮาแล้วเบาะ! เอาหมูสามชั้นกับกระดูกหมูชุดนี้ไปให้แม่คำเฮ็ดกับข้าวรับขวัญเลย บ่เอาเงินดอก! ...เออแต่ว่าช่วงนี้หลังตลาดมันแปลกๆ ว่ะ ตับหมูสดในลังกูหายทุกคืนแบบหมาบ่เห่าจักโตเลย',
        },
      ]);
      this.saveGame();
      return;
    }

    if (f.sawKrasueAtWindow && !f.checkedButcherDeep) {
      f.checkedButcherDeep = true;
      this.addClue('butcher_clue');
      this.startDialogue([
        {
          speaker: 'เฮียตี๋',
          role: 'เจ้าของเขียงหมูสด (ลดเสียงลง)',
          portrait: 'tom',
          text: 'โตเห็นกับตาเลยเบาะหนุ่ม?! ซั่นกูเว้าตรงๆ เลยเด้อ เมื่อแลงมื้อก่อนกูเห็น "ยายสาย" แม่เฒ่าหลังค่อมลักมายืนขูดเลือดหมูอยู่ฮางน้ำข้างเขียง พอเห็นกูย่างมาเลากะฟ้าวแล่นหนีจนเฮ็ดจี้กระดูกเก่าตกไว้... แถวนี้มีแต่ตระกูลเลาที่เก็บโกศอัฐิเก่าไว้ตรงป่าช้าวัดใหญ่!',
        },
      ]);
      this.saveGame();
      return;
    }

    this.showToast('เฮียตี๋: "ระวังตัวไว้ไอ้หนุ่ม ตับหมูหายทุกคืนกูมั่นใจว่าฝีมือยายสายแน่"');
  }

  private interactYaiSaiHouse(): void {
    const f = this.state.flags;
    if (!f.sawKrasueAtWindow) {
      this.showToast('บ้านไม้เก่าท้ายตลาดของยายสายปิดเงียบ มองจากภายนอกดูไม่มีคนอยู่');
      return;
    }
    f.checkedYaiSai = true;
    this.addClue('yai_sai_clue');
    this.startDialogue([
      {
        speaker: 'หนุ่ม',
        role: 'หน้าบ้านไม้เก่าท้ายตลาด',
        portrait: 'player',
        text: '(ลักชะโงกเบิ่งข้างชานเฮือน) ตุ่มดินใบใหญ่คลุมผ้าขาวเก่าๆ ตั้งซ่อนอยู่มุมมืด... กลิ่นคาวเลือดคือกันกับคราบตรงป่องเอี้ยมเฮือนเฮาและข้าวต้มมัดเป๊ะเลย!',
      },
      {
        speaker: 'ยายสาย',
        role: 'หญิงชราหลังค่อม (โผล่หน้าจากเงามืด)',
        portrait: 'narrator',
        text: 'มามุงจอบเบิ่งอีหยังหน้าเฮือนกูบักหนุ่ม! ฟ้าวกลับไปกอดแม่กับน้องสาวหน้าแฉล้มของมึงไว้สา... อีกบ่กี่ชั่วยามร่างเก่ากูกะสิมอดดับแล้ว ฮอดยามนั้นไผกะขวางทายาทกูบ่ได้ดอก!',
      },
      {
        speaker: 'หนุ่ม',
        role: 'คิดในใจ (กำหมัดแน่น)',
        portrait: 'player',
        text: 'แจ้งคักเลย... ยายสายคือกระสือตัวจริง! ต้องฟ้าวย่างไปวัดป่าฝั่งขวา อ่านจารึกในศาลาอุโบสถ แล้วขึ้นกุฏิกราบขอวิธีปราบนำหลวงพี่!',
      },
    ]);
    this.saveGame();
  }

  private interactTempleSala(): void {
    const f = this.state.flags;
    this.adjustSanity(30);
    if (!f.sawKrasueAtWindow) {
      this.showToast('ตู้พระธรรมและจารึกใบลานโบราณภายในอุโบสถ — ตอนนี้ยังไม่พบเหตุผิดปกติในวัด (+30 สติ)');
      return;
    }
    f.readTempleHistory = true;
    f.saiSinPrepared = true;
    this.addClue('temple_history');
    this.startDialogue([
      {
        speaker: 'จารึกใบลานโบราณ — ภายในพระอุโบสถ',
        role: 'ประวัติหมู่บ้านบ้านทุ่ง',
        portrait: 'narrator',
        text: '"เมื่อยี่สิบปีก่อน หมอตำแยประจำหมู่บ้านลักลอบฮับวิชาอาคมสายดำจนกลายร่างเป็นผีกระสือ... อาคมนั้นผูกติดไว้กับผ้าซิ่นเปื้อนเลือดที่ซ่อนอยู่ในโกศอัฐิหมายเลข 4 แห่งป่าช้าหลังวัด และหากลั่นวงสายสิญจน์ปลุกเสกรอบลาน วิญญาณร้ายบ่อาจข้ามเข้ามาได้"',
      },
      {
        speaker: 'หนุ่ม',
        role: 'ได้ยินเสียงชาวบ้านตะโกนมาจากลานวัดด้านนอก!',
        portrait: 'player',
        text: 'โกศอัฐิหมายเลข 4 หลังวัดซั่นเบาะ... เดี๋ยวเด้อ ข้างนอกอุโบสถคือตาชม ป้าบัว กับเฮียตี๋เพิ่งซอยกันปักเสาล้อม "วงสายสิญจน์" แล้วๆ นี่! ออกไปเบิ่งไทบ้านตรงลานวัดแล้วจั่งขึ้นกุฏิปรึกษาหลวงพี่ต่อดีกว่า!',
      },
    ]);
    this.saveGame();
  }

  private interactSaiSinCircle(): void {
    const f = this.state.flags;
    if (!f.saiSinPrepared) {
      this.showToast('ลานวัดป่ากว้างขวาง — เห็นชาวบ้านเดินเข้าออกอุโบสถและเสียงควายร้องแว่วมาจากทุ่งนา');
      return;
    }
    this.adjustSanity(25);
    if (!f.checkedSaiSinCircle) {
      f.checkedSaiSinCircle = true;
      this.addItem('sai_sin');
      this.addClue('saisin_lore');
      this.playCutscene('saisin_ward', () => {
        this.startDialogue([
          {
            speaker: 'ตาชม',
            role: 'ในวงสายสิญจน์ลานวัดป่า (กำธูปในมือ)',
            portrait: 'uncle',
            text: 'ฟ้าวก้าวขาข้ามเข้ามาในวงสายสิญจน์เร็วบักหนุ่ม! หลวงพี่โยงด้ายสายสิญจน์จากพระประธานในอุโบสถออกมาล้อมรอบเสาไม้ไผ่ 8 ทิศให้ไทบ้านแล้ว!',
          },
          {
            speaker: 'เฮียตี๋ & ป้าบัว',
            role: 'ชาวบ้านในวงสายสิญจน์',
            portrait: 'tom',
            text: 'จำไว้ให้แม่นเด้อบักหนุ่ม — ตราบใดที่ยืนอยู่ใน "วงสายสิญจน์" นี้ทุกคนสิปลอดภัย ผีกระสือบ่มีทางฝ่าด้ายขาวเข้ามาได้เด็ดขาด! แต่ถ้ามึงย่างออกไปนอกวงกลางท่งนายามได๋แล้วโดนไล่ ฟ้าวแล่นกลับมาเหยียบเข้าในวงนี้ให้ทันเด้อ! เอ้านี่ ฮับม้วนสายสิญจน์ปลุกเสกพกติดโตไว้นำ แล้วฟ้าวขึ้นกุฏิหลวงพี่ฝั่งขวาเลย!',
          },
        ]);
      });
      this.saveGame();
      return;
    }
    this.showToast('อยู่ในเขตวงสายสิญจน์ลานวัด: ปลอดภัยจากผีกระสือ! ชาวบ้านต่างสวดมนต์รอหนุ่มอยู่ (+25 สติ)');
  }

  private interactLuangPhi(): void {
    const f = this.state.flags;
    if (!f.greetedMonkDay1) {
      f.greetedMonkDay1 = true;
      this.startDialogue([
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'เจริญพรโยมหนุ่ม กลับมาอยู่บ้านเทื่อนี้หน้าตาผ่องใสขึ้นหลายเด้อโยม... ขอให้ตั้งใจเฮ็ดงานเลี้ยงดูแม่กับน้องสาวให้อบอุ่นเด้อ',
        },
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'แต่จำคำอาตมาไว้อย่างหนึ่งเด้อโยม — ช่วงเข้าพรรษาหน้าฝนนี้ อาคมเก่าแก่ในบ้านทุ่งกำลังปะทุ หากค่ำคืนใดพ้อเหตุอาเพศหรือแนวบ่ดีบ่งาม ให้กลับมาหาอาตมาอยู่กุฏินี้ได้ทุกยามเด้อโยม',
        },
      ]);
      this.saveGame();
      return;
    }

    if (!f.sawKrasueAtWindow) {
      this.adjustSanity(20);
      this.showToast('หลวงพี่: "กลับไปกินข้าวเย็นกับโยมแม่และน้องแก้วเถิดโยม คืนนี้พักผ่อนให้เต็มที่" (+20 สติ)');
      return;
    }

    if (!f.talkedToMonkOnce) {
      f.talkedToMonkOnce = true;
      this.startDialogue([
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'เจริญพรโยมหนุ่ม... อาตมาเห็นคราบเมือกกับข้าวต้มมัดต้องสาปแล้ว นี่คือมนตร์ดำ "สืบสายทายาทกระสือ" ของยายสายหมอตำแยเฒ่าที่วิญญาณกำลังสิละสังขารเก่า',
        },
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'แต่น้ำมนต์กับมีดหมอยังบ่พอสิตัดสายใยที่โยงหาน้องสาวโยมได้ เว้นแต่โยมสิไปเอา "เชี่ยนหมากเงินโบราณ" ที่คนทรงลักฝังอาคมไว้ใต้ "ศาลปู่ตาริมท่งนา" กลับมาให้อาตมาทำลายอาคมเสียก่อน — มันสิปรากฏฮอยอาคมเฉพาะหลัง 20:30 น. ให้ไปนอนรอเวลาแล้วไปเอามันมาด้วยความระมัดระวังเด้อโยม!',
        },
      ]);
      this.saveGame();
      return;
    }

    if (f.gotBetelBox && !f.monkBlessedFinal) {
      f.monkBlessedFinal = true;
      this.addItem('sacred_incense');
      this.addItem('holy_water');
      this.addItem('sacred_knife');
      this.addClue('monk_ritual');
      this.playCutscene('monk_blessing', () => {
        this.startDialogue([
          {
            speaker: 'หลวงพี่',
            role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
            portrait: 'uncle',
            text: 'สาธุ... โยมนำเชี่ยนหมากเงินกลับมาได้ทันเวลา เห็นซื่อ "แก้ว" จารึกไว้แจ้งคัก... อาตมาสิสวดถอนอาคมให้เดี๋ยวนี้แหละ!',
          },
          {
            speaker: 'หลวงพี่',
            role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
            portrait: 'uncle',
            text: 'โยมจงฮับ "ธูปสะกดวิญญาณ" "น้ำมนต์ปลุกเสก" และ "มีดหมอลงอาคม" ไป... จำคำอาตมาให้แม่นเด้อโยม ยามไปฮอด "โกศอัฐิหมายเลข 4" หลังวัด: ให้ปักธูปสะกดกับสาดน้ำมนต์ล้างอาคมก่อน แล้วจั่งใช้มีดหมอฟันตัดสายใย! แวะกลับไปปลอบแม่กับน้องแก้วเทิงเฮือนจักคำ แล้วฟ้าวไปปิดฉากอยู่ป่าช้าวัดเสีย!',
          },
        ]);
      });
      this.saveGame();
      return;
    }

    this.adjustSanity(25);
    this.showToast('หลวงพี่: "จำลำดับพิธีให้แม่นโยม ปักธูปสะกด & สาดน้ำมนต์ก่อน แล้วค่อยใช้มีดหมอฟันตัดสายใยหน้าโกศหมายเลข 4" (+25 สติ)');
  }

  private interactPaddyShrine(): void {
    const f = this.state.flags;
    if (!f.talkedToMonkOnce) {
      this.showToast('ศาลปู่ตาริมทุ่งนาบ้านทุ่ง — เทียนไขสั่นไหวในสายลม รู้สึกเหมือนมีของบางอย่างซ่อนอยู่ใต้ฐานไม้');
      return;
    }
    if (f.gotBetelBox) {
      this.showToast('ใต้ฐานศาลปู่ตาว่างเปล่า คุณเก็บเชี่ยนหมากเงินโบราณขึ้นมาแล้ว');
      return;
    }
    const h = this.state.gameMinutes / 60;
    const isNight = h >= 20.5 || h < 5.5;
    if (!isNight) {
      this.showToast('หลวงพี่กำชับว่าวิญญาณจะเปิดเผยตำแหน่งเชี่ยนหมากเฉพาะตอนกลางคืนหลัง 20:30 น. (ไปนอนรอเวลาที่บ้านยกสูงก่อน)');
      return;
    }

    f.gotBetelBox = true;
    this.addItem('silver_betel_box');
    this.addClue('curse_list');
    this.krasueShowTimer = 3.5;
    this.krasueX = 24.5;
    this.sound.playScare();

    this.playCutscene('paddy_shrine_dug', () => {
      this.startDialogue([
        {
          speaker: 'หนุ่ม',
          role: 'ข้างศาลปู่ตากลางทุ่งนายามวิกาล',
          portrait: 'player',
          text: 'ใต้แผ่นอิฐหลังศาลปู่ตา... พ้อ "เชี่ยนหมากเงินโบราณ" ที่หลวงพี่บอกอีหลีด้วย! พอแง้มฝาเบิ่งข้างในมีใบข่อยเขียนซื่อผู้ฮับทายาทกระสือมาสามรุ่น... บรรทัดสุดท้ายเขียนด้วยเลือดสดๆ ว่า "แก้ว"!!',
        },
        {
          speaker: 'หนุ่ม',
          role: 'ขนลุกทั้งตัว!',
          portrait: 'player',
          text: 'เฮ้ย! นั่นแสงสีเขียวลอยพุ่งมาจากยอดตาลทางขวาแล้ว!! ต้องฟ้าวถือเชี่ยนหมากเงินกลับขึ้นกุฏิให้หลวงพี่เฮ็ดพิธีปลุกเสกของขลังเดี๋ยวนี้!',
        },
      ]);
    });
    this.saveGame();
  }

  private interactBoneUrnCemetery(): void {
    const f = this.state.flags;
    const h = this.state.gameMinutes / 60;
    const isNight = h >= 20.5 || h < 5.5;

    if (!isNight) {
      this.showToast('โกศบรรจุอัฐิหมายเลข 4 เงียบเชียบในยามกลางวัน — ต้องกลับมาเผชิญหน้าหลัง 20:30 น.');
      return;
    }

    if (!f.monkBlessedFinal) {
      this.triggerScare(25, 'หลังโกศอัฐิมีหัวกระสือลอยวาบ! ต้องไปหาเชี่ยนหมากเงินและรับธูป น้ำมนต์ มีดหมอจากหลวงพี่ก่อน!', this.state.x - 4);
      return;
    }

    this.krasueShowTimer = 12.0;
    this.krasueX = 123.0;
    this.sound.playScare();

    this.startDialogue([
      {
        speaker: 'หนุ่ม',
        role: 'หน้าโกศบรรจุอัฐิหมายเลข 4',
        portrait: 'player',
        text: 'ตรงช่องฐานโกศหมายเลข 4 มี "ผ้าซิ่นอาคมเปื้อนเลือด" ม้วนซ่อนไว้เทิ่งนี้จริงๆ! พอกระชากออกมา ท้องฟ้าหลังป่าช้ากะมืดครึ้มลงทันที พร้อมแสงสีเขียวแดงลอยฮ้องกรี๊ดพุ่งลงมาจากยอดไม้!!',
      },
      {
        speaker: 'ผีกระสือ — ยายสาย (น้ำเสียงทั้งโกรธและเจ็บปวด)',
        role: 'หน้าโกศบรรจุอัฐิหมายเลข 4',
        portrait: 'prim',
        text: 'มึงบังอาจมาแตะต้องผ้าซิ่นต้นตระกูลกู!! ตลอดยี่สิบปีกูต้องทนทุกข์ทรมานอยู่กับร่างครึ่งผีครึ่งคน ย่ามึงพรากครอบครัวกูไป... ตอบมาเบิ่งว่าไผคือเจ้าของร่างที่ส่งต่อมนตร์ดำนี้ และย้อนอีหยังจั่งหมายหัวเฮือนมึง?!',
        choices: [
          {
            label: 'ยายสาย หมอตำแยท้ายตลาด! แค้นย่าบุญมาเมื่อ 20 ปีก่อน จึงหมายจะสืบทอดทายาทกระสือให้น้องแก้ว!',
            action: () => this.askFinalRitualStep(),
          },
          {
            label: 'ป้าบัว แผงปลา! ที่ชอบถือไฟสีเขียวเดินตามทุ่งนา',
            action: () => this.triggerEnding('bad'),
          },
          {
            label: 'ไม่มีใครเป็นทั้งนั้น แค่วิญญาณเร่ร่อนผ่านมา',
            action: () => this.triggerEnding('bad'),
          },
        ],
      },
    ]);
  }

  private askFinalRitualStep(): void {
    this.startDialogue([
      {
        speaker: 'ผีกระสือ (คำรามกราดเกรี้ยว)',
        role: 'พุ่งเข้าประชิดตัว!',
        portrait: 'prim',
        text: 'ฮู้จักซื่อกูแล้วจั่งได๋! สายเลือดในเชี่ยนหมากกำลังสิสูบวิญญาณน้องมึงอยู่แล้ว บักหนุ่มจากเมืองกรุงสิเฮ็ดอีหยังได้!!',
        choices: [
          {
            label: 'ปักธูปสะกดวิญญาณ สาดน้ำมนต์ล้างผ้าซิ่นอาคมก่อน แล้วฟันซ้ำด้วยมีดหมอลงอาคม!',
            action: () => {
              const f = this.state.flags;
              f.banishedKrasue = true;
              const perfect =
                f.placedThornsAtWindow &&
                f.checkedUnderHouse &&
                f.checkedButcherDeep &&
                f.checkedFishDeep &&
                f.checkedYaiSai;
              const endType: EndingType = perfect ? 'true' : 'normal';
              this.saveGame();
              this.sound.playClueChime();
              this.playCutscene('banish_ritual', () => {
                this.startDialogue([
                  {
                    speaker: 'รุ่งเช้า — พิธีบายศรีสู่ขวัญบนเรือนไม้บ้านทุ่ง',
                    role: 'หมู่บ้านกลับมามีชีวิตชีวาอีกครั้ง',
                    portrait: 'vendor',
                    text: 'พอตัดสายใยอาคมขาดสะบั้น เสียงฮ้องกรี๊ดของผีกระสือกะสลายหายไปพร้อมแสงตะวันยามมื้อเซ้า... แม่คำ น้องแก้ว ตาชม ป้าบัว เฮียตี๋ กับหลวงพี่ซอยกันจัด "พาขวัญบายศรีสู่ขวัญ" ผูกแขนรับขวัญให้หนุ่มและน้องแก้วกลางเฮือนไม้!',
                  },
                  {
                    speaker: 'น้องแก้ว & ชาวบ้าน',
                    role: 'งานวัดและเสียงรถแห่กลับมาดังก้องทุ่งนา',
                    portrait: 'prim',
                    text: '"มาเด้อขวัญเอ๊ย... ขวัญเจ้ามาอยู่กับเนื้อกับโต!" นอกเฮือนไม้ รถสองแถว รถแห่หมอลำ กับไฟชิงช้าสวรรค์งานวัดป่ากลับมาคึกคักม่วนซื่นอบอุ่นคือเก่า!',
                    choices: [
                      {
                        label: 'ปิดฉาก Chapter 2 อย่างภาคภูมิใจ',
                        action: () => this.triggerEnding(endType),
                      },
                    ],
                  },
                ]);
              });
            },
          },
          {
            label: 'รีบเอามีดหมอฟันใส่หัวกระสือเลยโดยไม่สาดน้ำมนต์และปักธูป',
            action: () => this.triggerEnding('normal'),
          },
          {
            label: 'สาดน้ำมนต์ใส่โกศอัฐิแล้ววิ่งหนีกลับบ้านทันที',
            action: () => this.triggerEnding('bad'),
          },
        ],
      },
    ]);
  }

  private openSleepModal(): void {
    this.openModal(
      'เสื่อและหมอน — บนเรือนไม้ยกสูง',
      `
      <p>พักเอาแรงรอช่วงเวลาที่ต้องการ หรือบันทึกความคืบหน้าของ Chapter 2</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
        <button class="secondary-btn" data-sleep="480">ตื่นตอนเช้า (08:00)</button>
        <button class="secondary-btn" data-sleep="1040">รอถึงเย็น (17:20)</button>
        <button class="primary-btn" data-sleep="1300">รอถึงสามทุ่มครึ่ง (21:40)</button>
        <button class="secondary-btn" id="ch2-save-btn">บันทึกเกมตอนนี้</button>
      </div>
      `
    );
    this.modalBody.querySelectorAll('[data-sleep]').forEach((el) => {
      el.addEventListener('click', () => {
        const min = Number((el as HTMLElement).dataset.sleep);
        if (min <= this.state.gameMinutes) this.state.day += 1;
        this.state.gameMinutes = min;
        this.state.sanity = 100;
        this.state.battery = 100;
        this.stamina = 100;
        this.closeModal();
        this.updateHUD();
        this.saveGame();
        this.showToast('พักผ่อนเต็มอิ่ม ชาร์จแบตไฟฉายเต็ม 100% เรียบร้อย');
      });
    });
    document.getElementById('ch2-save-btn')?.addEventListener('click', () => this.saveGame(false));
  }

  private triggerEnding(type: EndingType): void {
    this.state.flags.endingReached = type;
    this.paused = true;
    this.ridingBike = false;
    this.krasueChase = false;
    this.chaseBanner.classList.add('hidden');
    this.saveGame();

    const texts: Record<EndingType, { title: string; sub: string; body: string }> = {
      true: {
        title: 'Chapter 2 True Ending — รุ่งสางพ้นเคราะห์ทายาทกระสือ',
        sub: 'ตัดขาดสายใยวิญญาณกระสือ ปิดตำนานยี่สิบปีของหมู่บ้านลงได้อย่างสมบูรณ์',
        body: 'ธูปสะกดวิญญาณปักลงกลางดิน ตามด้วยน้ำมนต์หลวงพี่ที่สาดแผดเผาผ้าซิ่นอาคมจนเปลวไฟสีเขียวลุกท่วม ก่อนที่หนุ่มจะสะบั้นเชี่ยนหมากเงินและผ้าซิ่นขาดสะบั้นด้วยมีดหมอลงอาคม! เสียงกรีดร้องสะเทือนป่าช้าเงียบหายไปพร้อมเสียงระฆังวัดยามรุ่งสาง... เมื่อเดินกลับมาถึงบ้านไม้ยกสูง ทั้งหนามพุทราหน้าหน้าต่างที่ยังสมบูรณ์ดี แม่คำ และน้องแก้วต่างโผเข้ากอดหนุ่มทั้งน้ำตา คำสาปทายาทกระสือของยายสายถูกทำลายสิ้นซากตลอดกาล',
      },
      normal: {
        title: 'Chapter 2 Normal Ending — กระสือถอยหนีแต่เงาอาคมยังไม่ดับ',
        sub: 'ขับไล่วิญญาณออกจากป่าช้าได้... แต่หลักฐานหรือขั้นตอนการตัดอาคมยังไม่สมบูรณ์',
        body: 'หนุ่มขับไล่ดวงไฟกระสือพ้นโกศหมายเลข 4 ไปได้สำเร็จ ทว่าเพราะสืบตลาดไม่ครบหรือข้ามขั้นตอนพิธีของหลวงพี่ รุ่งเช้าชาวบ้านพบว่ายายสายหายตัวลึกลับจากเรือนท้ายตลาด ทิ้งไว้เพียงความสงบชั่วคราวใต้เงาทุ่งนาอีสาน...',
      },
      bad: {
        title: 'Chapter 2 Bad Ending — ทายาทคนใหม่แห่งบ้านทุ่ง',
        sub: 'พิธีล้มเหลวกลางป่าช้าโกศอัฐิ',
        body: 'ความลังเลและคำกล่าวหาที่ผิดพลาดทำให้ดวงไฟกระสือโกรธเกรี้ยวพุ่งทะยานข้ามทุ่งนากลับไปยังเรือนไม้ยกสูงก่อนรุ่งสาง... คืนถัดมา เสียงหมาหอนเกรียวกราวกลับมาดังขึ้นอีก พร้อมดวงไฟสีเขียวดวงใหม่ที่ลอยเหนือเรือนไม้ท้ายทุ่ง',
      },
    };
    const data = texts[type];
    this.openModal(
      data.title,
      `
      <h3 style="color:#f6d594;margin-top:0">${data.sub}</h3>
      <p>${data.body}</p>
      <div style="margin-top:14px;padding:10px;background:rgba(255,255,255,0.04);border-radius:3px;font-size:0.86rem;color:#9fa6b8">
        บันทึกเบาะแส Chapter 2: <strong>${this.state.clues.length}/${Object.keys(CH2_CLUES).length}</strong> • วันที่อยู่บ้านทุ่ง: วันที่ ${this.state.day}
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
        <button id="ch2-restart" class="secondary-btn">เล่น Chapter 2 ใหม่</button>
        <button id="ch2-menu" class="primary-btn">กลับหน้าหลักเลือกบท</button>
      </div>
      `
    );
    document.getElementById('ch2-restart')?.addEventListener('click', () => {
      this.closeModal();
      this.paused = false;
      this.startNewGame();
    });
    document.getElementById('ch2-menu')?.addEventListener('click', () => {
      this.closeModal();
      this.onExitToMenu();
    });
  }

  private useItem(itemId: string): void {
    const item = CH2_ITEMS[itemId];
    if (!item) return;
    this.sound.playUIClick();
    if (itemId === 'inhaler') {
      if (this.state.sanity >= 100) return this.showToast('สติยังเต็มร้อย เก็บไว้ก่อน');
      this.adjustSanity(35);
      this.removeItem('inhaler');
      return this.showToast('สูดยาดมเรียกสติ (+35 สติ)');
    }
    if (itemId === 'herbal_pouch') {
      this.adjustSanity(40);
      this.removeItem('herbal_pouch');
      return this.showToast('เปิดห่อว่านใบหนาดสูดกลิ่นข่มขวัญ (+40 สติ)');
    }
    if (itemId === 'takian_charm') {
      this.adjustSanity(45);
      this.removeItem('takian_charm');
      return this.showToast('ยกผ้าเจ็ดสีเจ้าแม่ตะเคียนอธิษฐานข่มขวัญ (+45 สติ)');
    }
    if (itemId === 'fair_amulet') {
      this.adjustSanity(40);
      this.removeItem('fair_amulet');
      return this.showToast('อาราธนาเหรียญหลวงพ่อวัดป่าเรียกขวัญกลับคืน (+40 สติ)');
    }
    if (itemId === 'battery_cell') {
      if ((this.state.battery ?? 100) >= 98) return this.showToast('แบตไฟฉายยังเต็มอยู่ เก็บถ่านตรากบไว้ก่อน');
      this.state.battery = Math.min(100, (this.state.battery ?? 0) + 85);
      this.removeItem('battery_cell');
      this.sound.playPickup();
      this.updateExtraHud();
      return this.showToast('ใส่ถ่านตรากบใหม่แล้ว! แบตเตอรี่ไฟฉายกลับมาสว่างจ้า');
    }
    if (itemId === 'red_soda') {
      this.adjustSanity(30);
      this.stamina = 100;
      this.removeItem('red_soda');
      this.sound.playPickup();
      this.updateExtraHud();
      return this.showToast('ดื่มน้ำแดงเย็นเจี๊ยบ! (+30 สติ & กำลังวิ่งเต็ม 100%)');
    }
    if (itemId === 'camera') {
      this.takeEvidencePhoto();
      return;
    }
    if (itemId === 'bicycle') {
      this.toggleBicycle();
      return;
    }
    this.showToast(`${item.name} — ${item.description}`);
  }

  private toggleBicycle(): void {
    if (this.currentRoom !== 'outside') {
      return this.showToast('ปั่นจักรยานในอาคารไม่ได้ ต้องเดินลงไปข้างนอกก่อน');
    }
    this.ridingBike = !this.ridingBike;
    this.sound.playBicycleBell();
    this.renderInventory();
    // อัปเดตปุ่มจักรยานบนมือถือ
    this.touchBike.textContent = this.ridingBike ? '🚲✓' : '🚲';
    this.touchBike.classList.toggle('active', this.ridingBike);
    this.showToast(
      this.ridingBike
        ? 'ขึ้นปั่นจักรยานบ้านทุ่งแล้ว! (ความเร็ว x2.3 — กด [B] หรือคลิกไอเทมเพื่อจอดลง)'
        : 'จอดลงจากจักรยานแล้ว'
    );
  }

  private addItem(id: string): void {
    if (!this.state.inventory.includes(id)) {
      this.state.inventory.push(id);
      this.sound.playPickup();
      this.renderInventory();
      this.showToast(`เก็บไอเทม: ${CH2_ITEMS[id].name}`);
      // แสดงปุ่มจักรยานบนมือถือเมื่อเก็บจักรยาน
      if (id === 'bicycle') this.touchBike.classList.remove('hidden');
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
      this.showToast(`จดบันทึกใหม่: ${CH2_CLUES[id].title}`);
      this.saveGame();
    }
  }

  private adjustSanity(delta: number): void {
    this.state.sanity = Math.max(0, Math.min(100, Math.round(this.state.sanity + delta)));
    this.updateHUD();
    if (this.state.sanity === 0 && !this.state.flags.endingReached) {
      this.krasueChase = false;
      this.ridingBike = false;
      this.touchBike.textContent = '🚲';
      this.touchBike.classList.remove('active');
      this.renderInventory();
      this.chaseBanner.classList.add('hidden');
      this.state.sanity = 60;
      this.currentRoom = 'outside';
      this.state.x = 40.5;
      this.showToast('หมดสติกลางทุ่งนา... ฟื้นขึ้นมาอีกทีอยู่ใต้ร่มเงาศาลาวัดป่าแล้ว', true);
    }
  }

  private triggerScare(loss: number, msg: string, kx?: number): void {
    this.sound.playScare();
    this.scareFlash.classList.add('active');
    setTimeout(() => this.scareFlash.classList.remove('active'), 260);
    if (kx !== undefined) {
      this.krasueX = kx;
      this.krasueShowTimer = 2.8;
    }
    this.adjustSanity(-loss);
    this.showToast(msg, true);
  }

  private toggleFlashlight(): void {
    this.sound.init();
    this.sound.playSwitchClick();
    if (!this.state.flashlightOn && (this.state.battery ?? 100) <= 0) {
      this.showToast('แบตไฟฉายหมด! ซื้อถ่านตรากบที่ร้านชำเจ๊แตน หรือนอนชาร์จบนเรือน', true);
      return;
    }
    this.state.flashlightOn = !this.state.flashlightOn;
    this.btnFlashlight.classList.toggle('active', this.state.flashlightOn);
    this.touchFlashlight.classList.toggle('active', this.state.flashlightOn);
    this.touchFlashlight.textContent = this.state.flashlightOn ? '🔦✓' : '🔦';
  }

  private renderInventory(): void {
    renderSharedInventoryBar({
      invBar: this.invBar,
      modalBody: this.modalBody,
      items: this.state.inventory,
      getMeta: (id) => {
        const item = CH2_ITEMS[id];
        if (!item) return undefined;
        return {
          name: item.name,
          description: item.description,
          badgeText: id === 'bicycle' && this.ridingBike ? 'กำลังปั่น [B]' : item.name,
          active: id === 'bicycle' && this.ridingBike,
        };
      },
      getIconUrl: (id) => {
        let url = this.iconCache.get(id);
        if (!url) {
          url = drawCh2ItemIconDataUrl(id);
          this.iconCache.set(id, url);
        }
        return url;
      },
      onUse: (id) => this.useItem(id),
      onReorder: (newOrder) => {
        this.state.inventory = newOrder;
        this.saveGame();
      },
      onOpenModal: (title, html) => this.openModal(title, html),
      onCloseModal: () => this.closeModal(),
      onPlayClick: () => this.sound.playUIClick(),
    });
  }

  private tryInteract(): void {
    const found = this.getNearestInteractable();
    if (found) found.onInteract();
  }

  private getVillageMood(): VillageMood {
    const f = this.state.flags;
    if (f.banishedKrasue) return 'festive';
    if (f.sawKrasueAtWindow) return 'lockdown';
    if (f.checkedUnderHouse || f.heardPaWarning) return 'uneasy';
    return 'festive';
  }

  private getNearestInteractable(): Ch2Interactable | null {
    const mood = this.getVillageMood();
    const h = (this.state.gameMinutes % 1440) / 60;
    let best: Ch2Interactable | null = null;
    let bestD = Infinity;
    for (const item of this.interactables) {
      if ((item.room ?? 'outside') !== this.currentRoom) continue;
      if (item.id === 'ch2_bicycle' && this.state.inventory.includes('bicycle')) continue;
      if (item.id === 'ch2_rothae' && mood !== 'festive') continue;
      if (item.id === 'ch2_drunk' && mood === 'lockdown') continue;
      if (item.id === 'ch2_morning_monk' && (h < 5.5 || h > 7.75 || mood === 'lockdown')) continue;
      const ix = item.getX ? item.getX() : item.x;
      const d = Math.abs(this.state.x - ix);
      if (d <= (item.range ?? 1.8) && d < bestD) {
        best = item;
        bestD = d;
      }
    }
    return best;
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
    speakDialogueLine(line.speaker, line.role, line.text, line.portrait, this.sound.isMuted());
    const ctx = this.dialoguePortrait.getContext('2d')!;
    ctx.clearRect(0, 0, 96, 96);
    const kindMap: Record<string, Parameters<typeof drawCh2CharacterCanvas>[0]> = {
      player: 'noom',
      vendor: 'mom',
      prim: 'sister',
      uncle: 'monk',
      tom: 'butcher',
    };
    const k = kindMap[line.portrait];
    if (k) {
      const sp = drawCh2CharacterCanvas(k, 0);
      ctx.drawImage(sp, 16, 4, 96, 120, 0, 0, 96, 96);
    } else {
      ctx.fillStyle = '#182236';
      ctx.fillRect(0, 0, 96, 96);
    }

    this.dialogueChoices.innerHTML = '';
    if (line.choices && line.choices.length > 0) {
      this.dialogueContinue.classList.add('hidden');
      line.choices.forEach((ch) => {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.textContent = ch.label;
        b.addEventListener('click', () => {
          this.sound.playUIClick();
          stopVoiceActing();
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

  private openModal(title: string, html: string): void {
    this.modalTitle.textContent = title;
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
      'ความเชื่อโบราณเรื่องผีกระสือ',
      CH2_RULES.map((r) => `<div class="rule-card"><div class="rule-title">${r.number} ${r.title}</div><div>${r.desc}</div></div>`).join('')
    );
  }

  private openNotebookModal(): void {
    this.sound.playUIClick();
    const clues =
      this.state.clues.length === 0
        ? '<p style="color:#9fa6b8">ยังไม่ได้สืบเบาะแสเพิ่มเติม</p>'
        : this.state.clues
          .map((id) => {
            const c = CH2_CLUES[id];
            return `<div class="clue-item"><div class="clue-title">${c.title}</div><div>${c.detail}</div></div>`;
          })
          .join('');
    const photos = this.state.photos ?? [];
    const photoHtml =
      photos.length === 0
        ? '<p style="color:#9fa6b8;font-size:0.85rem">ยังไม่มีภาพถ่ายหลักฐาน (กด [C] หรือปุ่ม 📷 ใกล้สิ่งผิดปกติ)</p>'
        : photos
          .map((p, idx) => `<div class="clue-item"><div class="clue-title">📷 ภาพหลักฐานที่ ${idx + 1}</div><div>${p}</div></div>`)
          .join('');
    this.openModal(
      `สมุดสืบ & ภาพหลักฐาน (${this.state.clues.length}/${Object.keys(CH2_CLUES).length})`,
      `${clues}<h4 style="color:#f6d594;margin:14px 0 6px">อัลบั้มภาพถ่ายมือถือ (${photos.length})</h4>${photoHtml}`
    );
  }

  private openMapModal(): void {
    this.sound.playUIClick();
    this.openModal(
      'แผนผังบ้านทุ่ง (Chapter 2)',
      `
      <div class="map-floor"><strong>เขตโรงเรียน & ร้านชำเจ๊แตน (-115 .. -62): ชิงช้าผีสิง, ตะเคียนคู่ & ท่ารถ</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ร.ร.บ้านทุ่ง (-112) • ซุ้มหมู่บ้าน (-104.5) • ศาลเจ้าแม่ตะเคียน (-96.5) • ร้านชำเจ๊แตน (-89.5) • ท่ารถสองแถว (-82) • ลุงทิด (-71) • ซุ้มบั้งไฟ (-67.5)</div></div>
      <div class="map-floor"><strong>ตลาดใหญ่บ้านทุ่ง (-60 .. -24): ของกิน, ชาวบ้านเดินจับจ่าย & สืบคดี</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ส้มตำแม่ลำไย (-57.8) • บ้านยายสาย (-52) • เขียงหมู (-44) • ป้าบัว (-36) • ตาชม (-28) • ท่ารถตลาด (-24.5)</div></div>
      <div class="map-floor"><strong>ย่านกลางทุ่ง (-20 .. +25): เรือนไม้หลังใหญ่, หอข่าว & สะพานหนองน้ำ</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ดงกล้วยตานี (-20.5) • ยุ้งข้าว (-11.4) • หอกระจายข่าว (-8.6) • บ้านไม้ยกสูงของหนุ่ม (0 / บันได +5.9) • ตุ่มซ่อนตัว (+4.0) • เล้าไก่ (+10.2) • ศาลปู่ตา (+17.5) • ท่าน้ำ (+20.4) • สะพานไม้ & กอไผ่หลบภัย (+23.5)</div></div>
      <div class="map-floor"><strong>วัดป่าบ้านทุ่ง (+26.5 .. +59): เขตอภัยทาน & วงสายสิญจน์</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ซุ้มมณฑป (+26.5) • วงสายสิญจน์ (+31.8) • พระอุโบสถเข้าด้านในได้ (+40.5) • กุฏิหลวงพี่ (+54.5)</div></div>
      <div class="map-floor"><strong>งานวัด, อนามัย & ป่าช้า (+62 .. +125): ชิงช้าสวรรค์, อนามัย & โกศหมายเลข 4</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ปาลูกโป่ง (+65.5) • ชิงช้าสวรรค์ (+76) • เวทีรำวง (+87.8) • อนามัยบ้านทุ่ง (+96) • ซุ้มป่าช้า (+103.5) • โกศหมายเลข 4 (+120.5)</div></div>
      `
    );
  }

  private interactTakianShrine(): void {
    this.sound.playClueChime();
    if (!this.state.flags.inspectedTakian) {
      this.state.flags.inspectedTakian = true;
      this.addClue('takian_clue');
      this.addItem('takian_charm');
      this.playCutscene('takian_shrine', () => {
        this.startDialogue([
          {
            speaker: 'เสียงกระซิบจากใต้ต้นตะเคียนคู่',
            role: 'สิ่งลี้ลับปากหมู่บ้าน',
            portrait: 'narrator',
            text: 'ลมเย็นยะเยือกพัดผ้าเจ็ดสีปลิวไสว กลิ่นดอกมะลิปนธูปโบราณโชยมา... "มีดวงวิญญาณอาฆาตกำลังตามกลิ่นอีหล่าสาวเข้าเฮือนไม้ในคืนนี้! จงเอาผ้าเจ็ดสีผืนนี้พกติดโตไว้ แล้วฟ้าวกลับขึ้นเฮือนเฝ้าป่องเอี้ยมยามดึกก่อนที่มันสิคายน้ำลายสืบทายาทสำเร็จ!"',
          },
          {
            speaker: 'หนุ่ม',
            role: 'ลูกชายคนโต',
            portrait: 'player',
            text: 'เจ้าแม่ตะเคียนทองกำลังเตือนเฮาแน่ๆ... เก็บผ้าเจ็ดสีนี้ติดโตไว้ แล้วคืนนี้ต้องขึ้นไปจอบเบิ่งอยู่ป่องเอี้ยมเฮือนให้เห็นกับตา!',
          },
        ]);
      });
      this.saveGame();
    } else {
      this.showToast('พวงมาลัยและผ้าเจ็ดสีปลิวไหวเบาๆ เหมือนกำลังคุ้มครองคุณอยู่');
    }
  }

  private openSongthaewTransitModal(): void {
    if (this.getVillageMood() === 'lockdown') {
      this.showToast('ช่วงนี้รถสองแถวและรถทุกคันหยุดวิ่งหมดแล้ว! ชาวบ้านปิดบ้านเงียบ — ต้องเดินหรือปั่นจักรยานเอาเอง', true);
      return;
    }
    this.sound.playVehicleHorn();
    this.openModal(
      'ขึ้นรถสองแถวสายบ้านทุ่ง (เดินทางข้ามหมู่บ้าน)',
      `
      <p style="color:#d6d3d1;margin-top:0">เลือกป้ายปลายทางที่ต้องการลง (ฟรีสำหรับคนในหมู่บ้าน!):</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button class="secondary-btn" data-bus="-82">🚌 ท่ารถปากหมู่บ้าน & ศาลเจ้าแม่ตะเคียน (-82 ม.)</button>
        <button class="secondary-btn" data-bus="-24.5">🚌 หน้าตลาดใหญ่บ้านทุ่ง — ส้มตำ เขียงหมู สมุนไพร (-24 ม.)</button>
        <button class="secondary-btn" data-bus="0">🚌 หน้าบ้านไม้ยกสูงของหนุ่ม (0 ม.)</button>
        <button class="secondary-btn" data-bus="26.5">🚌 หน้าซุ้มประตูวัดป่า & วงสายสิญจน์ (+26 ม.)</button>
        <button class="secondary-btn" data-bus="61.4">🎡 ป้ายรถวัดป่า & ลานงานวัดชิงช้าสวรรค์ (+61 ม.)</button>
      </div>
      `
    );
    document.querySelectorAll<HTMLButtonElement>('[data-bus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dest = Number(btn.dataset.bus);
        this.ridingBike = false;
        this.touchBike.textContent = '🚲';
        this.touchBike.classList.remove('active');
        this.renderInventory();
        this.closeModal();
        this.sound.playVehicleHorn();
        this.playCutscene('songthaew_ride', () => {
          this.state.x = dest;
          this.sound.playVehicleHorn();
          this.updateHUD();
          this.saveGame();
          this.showToast('นั่งรถสองแถวมาถึงจุดหมายเรียบร้อย!');
        });
      });
    });
  }

  private interactDrunkVillager(): void {
    this.sound.playUIClick();
    this.state.flags.talkedDrunk = true;
    this.addClue('drunk_witness');
    this.startDialogue([
      {
        speaker: 'ลุงทิดขี้เมา',
        role: 'ชาวบ้านปากซอย (เมาเหล้าขาว)',
        portrait: 'uncle',
        text: 'อึ้ก... บักหนุ่มกลับมาบ้านเฮาแล้วเบาะ! เมื่อคืนข้อยนั่งก๊งเหล้าขาวอยู่ท่ารถ รอรถสองแถว... รถแห่แล่นช้าๆ ผ่านไปปุ๊บ ข้อยเห็นหัวคนมีไส้เขียวๆ ลอยสวนไฟหน้ารถเข้าไปทางเฮือนไม้ไทยเลยเว้ย!',
      },
      {
        speaker: 'หนุ่ม',
        role: 'ลูกชายคนโต',
        portrait: 'player',
        text: 'ลุงเห็นอีหลีเบาะครับ? ซั่นแสดงว่าบ่แม่นแค่คำส่าลือ — ระวังโตแหน่เด้อครับลุงทิด ฟ้าวเข้าเฮือนก่อนค่ำมืดเด้อ!',
      },
    ]);
  }

  private interactSomtamStall(): void {
    this.sound.playUIClick();
    if (this.getVillageMood() === 'lockdown') {
      this.showToast('ร้านส้มตำแม่ลำไยปิดเงียบแล้ว — แม่ค้าต่างรีบเก็บแผงหนีข่าวกระสืออาละวาด!', true);
      return;
    }
    if (!this.state.flags.ateSomtam) {
      this.state.flags.ateSomtam = true;
      this.adjustSanity(25);
      this.playCutscene('somtam_feast', () => {
        this.startDialogue([
          {
            speaker: 'แม่ลำไย',
            role: 'แม่ค้าส้มตำครกไม้-ไก่ย่าง',
            portrait: 'vendor',
            text: 'อ้าวหนุ่ม! กลับจากเมืองกรุงแล้วบ่ มาๆ กินส้มตำปูปลาร้ากับปิ้งไก่ฮ้อนๆ ให้เซาเมื่อย แม่แถมข้าวเหนียวห่อนึงเลย (+25 สติ) ช่วงนี้ตลาดคึกคักแต่อย่าย่างเลยไปแถวเฮือนยายสายยามมืดเด้อหล่า!',
          },
        ]);
      });
    } else {
      this.showToast('แม่ลำไยตำส้มตำครกไม้เสียงดังโป๊กๆ กลิ่นไก่ย่างหอมฟุ้งไปทั่วตลาด');
    }
  }

  private interactPondFishing(): void {
    if (!this.state.flags.bondedWithFamilyDay1) {
      this.showToast('ชาวบ้านกำลังหว่านแหจับปลาในหนองน้ำ — ขึ้นไปคุยกับแม่คำและน้องแก้วบนเรือนก่อนนะ');
      return;
    }
    if (this.state.flags.caughtPondFishDay1 && (!this.state.flags.finishedDay1Dinner || this.state.inventory.includes('fresh_fish'))) {
      this.playCutscene('cast_net_fishing', () => {
        this.adjustSanity(10);
        this.showToast(
          this.state.inventory.includes('fresh_fish')
            ? 'มีปลาช่อนสดในกระเป๋าแล้ว เอาไปขายให้ป้าบัวที่ตลาดได้ (+60 ฿)!'
            : 'ดูชาวบ้านหว่านแหริมหนองน้ำบ้านทุ่งอย่างเพลิดเพลิน (+10 สติ)'
        );
      });
      return;
    }
    this.sound.playUIClick();
    this.openModal(
      'ท่าน้ำหนองน้ำบ้านทุ่ง — ตกปลาช่อนไปฝากแม่คำ',
      `
      <p style="margin-top:0">ลุงชาวบ้านบนท่าน้ำชวนหนุ่มลองเหวี่ยงเบ็ดตกปลาช่อนตัวโตกลับไปให้แม่ทำต้มยำมื้อเย็น! กดจับจังหวะตอนทุ่นกระตุกได้เลย:</p>
      <div id="fish-bar" style="height:26px;background:#0f172a;border:1px solid #38bdf8;border-radius:8px;position:relative;overflow:hidden;margin:14px 0">
        <div style="position:absolute;left:38%;width:24%;top:0;bottom:0;background:rgba(34,197,94,0.35);border-left:2px solid #4ade80;border-right:2px solid #4ade80"></div>
        <div id="fish-cursor" style="position:absolute;top:2px;bottom:2px;width:10px;background:#facc15;border-radius:4px;left:0%"></div>
      </div>
      <button id="btn-pull-fish" class="primary-btn" style="width:100%">🎣 วัดเบ็ด / ดึงแหจับปลา!</button>
      `
    );
    const cursor = document.getElementById('fish-cursor')!;
    let pos = 0;
    let dir = 1;
    const timer = window.setInterval(() => {
      if (!this.modalOpen) {
        clearInterval(timer);
        return;
      }
      pos += dir * 3.8;
      if (pos >= 94) {
        pos = 94;
        dir = -1;
      } else if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      cursor.style.left = `${pos}%`;
    }, 30);
    document.getElementById('btn-pull-fish')?.addEventListener('click', () => {
      clearInterval(timer);
      this.sound.playPickup();
      this.state.flags.caughtPondFishDay1 = true;
      this.addItem('fresh_fish');
      this.closeModal();
      this.playCutscene('cast_net_fishing', () => {
        this.startDialogue([
          {
            speaker: 'หนุ่ม',
            role: 'บนท่าน้ำไม้หนองน้ำบ้านทุ่ง',
            portrait: 'player',
            text: pos >= 34 && pos <= 64
              ? 'เย้!! วัดเบ็ดจังหวะเป๊ะ ได้ "ปลาช่อนนา" ตัวเบ้อเริ่มเลย! เอาไปฝากแม่คำเฮ็ดต้มยำปลาแซ่บๆ มื้อแลงนี้แน่นอน!'
              : 'ฮึบ! เกือบหลุดมือแต่ลุงชาวบ้านช่วยหว่านแหช้อนขึ้นมาได้ทัน! ได้ "ปลาช่อนสดหนองน้ำ" ตัวโตฝากแม่คำแล้ว!',
          },
        ]);
      });
      this.saveGame();
    });
  }

  private interactTempleFair(): void {
    this.sound.playUIClick();
    const mood = this.getVillageMood();
    if (mood === 'lockdown') {
      this.showToast('งานวัดปิดร้างมืดสนิท! ป้ายหน้าซุ้มเขียนว่า "งดจัดงานรำวงและมหรสพ ชาวบ้านโปรดเข้าบ้าน"', true);
      return;
    }
    if (mood === 'uneasy') {
      this.showToast('ซุ้มงานวัดเริ่มลดไฟหรี่ลงแล้ว คนเที่ยวงานบางตาเพราะข่าวลือผีกระสือเริ่มหนาหู');
      return;
    }
    this.openModal(
      'งานบุญประจำปี วัดป่าบ้านทุ่ง 🎡',
      `
      <p style="margin-top:0">บรรยากาศงานวัดคึกคักสุดๆ! มีทั้งชิงช้าสวรรค์ เวทีหมอลำ ซุ้มปาลูกโป่ง และซุ้มสอยดาวลุ้นโชค:</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button id="btn-fair-dart" class="primary-btn">🎈 เล่นปาลูกโป่งงานวัด (ฟื้น +20 สติ & ฟังข่าวชาวบ้าน)</button>
        <button id="btn-fair-soidao" class="secondary-btn">⭐ สอยดาวลุ้นโชควัดป่า ${this.state.flags.wonFairPrize ? '(สอยได้รางวัลแล้ว ✓)' : '(ลุ้นของขลังวัดป่า!)'}</button>
      </div>
      `
    );
    document.getElementById('btn-fair-dart')?.addEventListener('click', () => {
      this.sound.playBalloonPop();
      this.state.flags.visitedFair = true;
      this.adjustSanity(20);
      this.addClue('fair_rumor');
      this.closeModal();
      this.playCutscene('temple_fair', () => {
        this.startDialogue([
          {
            speaker: 'โฆษกงานวัด & ชาวบ้าน',
            role: 'ซุ้มปาลูกโป่งงานวัดป่า',
            portrait: 'tom',
            text: 'ปัง! ปัง! แม่นคักบักหนุ่ม ปาแตก 3 ลูกรวดเลย (+20 สติ)! ช่วงนี้ม่วนซื่นเต็มที่เด้อ แต่อย่าเผลอย่างเลยซุ้มประตูโขงไปป่าช้าหลังวัดยามดึกล่ะ ไทบ้านส่าเรื่องหลอนหนาหูแฮง!',
          },
        ]);
      });
      this.saveGame();
    });
    document.getElementById('btn-fair-soidao')?.addEventListener('click', () => {
      this.sound.playClueChime();
      this.state.flags.visitedFair = true;
      this.addClue('fair_rumor');
      this.closeModal();
      this.playCutscene('temple_fair', () => {
        if (!this.state.flags.wonFairPrize) {
          this.state.flags.wonFairPrize = true;
          this.addItem('fair_amulet');
          this.showToast('🎉 สอยดาวได้รางวัลใหญ่: "เหรียญหลวงพ่อวัดป่า" พกไว้กันขวัญหนีดีฝ่อ!');
        } else {
          this.adjustSanity(10);
          this.showToast('🎈 ชมชิงช้าสวรรค์และรำวงหมอลำหน้าเวที (+10 สติ)');
        }
        this.saveGame();
      });
    });
  }

  private interactPaTower(): void {
    this.sound.playPaSystemChime();
    const mood = this.getVillageMood();
    if (!this.state.flags.heardPaWarning && mood !== 'festive') {
      this.state.flags.heardPaWarning = true;
      this.addClue('speaker_warning');
      this.saveGame();
    }
    const text =
      mood === 'lockdown'
        ? '📣 [เสียงตามสายผู้ใหญ่บ้าน] "ประกาศด่วน! ขณะนี้พบผีกระสือออกอาละวาดในบ้านทุ่ง! ขอให้ทุกบ้านปิดประตูหน้าต่าง ขัดหนามพุทรา และงดวิ่งรถทุกชนิดหลังค่ำ!"'
        : mood === 'uneasy'
          ? '📣 [เสียงตามสายผู้ใหญ่บ้าน] "แจ้งข่าวลูกบ้านบ้านทุ่ง... ช่วงนี้มีข่าวลือเรื่องตับหมูหายและดวงไฟประหลาด จึงของดรถแห่ชั่วคราว และอย่าออกจากบ้านยามวิกาลเด้อ!"'
          : '📣 [เสียงตามสายผู้ใหญ่บ้าน] "สวัสดีพี่น้องบ้านทุ่งอีสาน! มื้อนี้มีงานวัดประจำปีและขบวนรถแห่ ขอให้ทุกคนม่วนซื่นและคอยช่วยสอดส่องดูแลกันนะจ๊ะ!"';
    this.startDialogue([{ speaker: 'เสียงจากหอกระจายข่าว', role: 'ผู้ใหญ่บ้านบ้านทุ่ง', portrait: 'uncle', text }]);
  }

  private interactBangFai(): void {
    this.sound.playUIClick();
    if (this.getVillageMood() === 'lockdown') {
      this.showToast('ลานบั้งไฟเงียบวังเวงไร้ผู้คนเพราะข่าวลือผีกระสือ');
    } else {
      this.playCutscene('bangfai_festival', () => {
        this.adjustSanity(8);
        this.showToast('ซุ้มบั้งไฟพญานาคพุ่งทะยานสู่ฟ้า — ประเพณีขอฝนชาวอีสาน (+8 สติ)');
      });
    }
  }

  private interactChickenCoop(): void {
    const f = this.state.flags;
    if (!f.checkedUnderHouse) {
      this.showToast('เล้าไก่บ้านข้างเรือน — แม่ไก่และลูกเจี๊ยบกำลังจิกข้าวเปลือกกันอย่างคึกคัก');
      return;
    }
    if (!f.checkedChickenCoopDay2) {
      f.checkedChickenCoopDay2 = true;
      this.addClue('coop_slime');
      this.sound.playScare();
      this.adjustSanity(-10);
      this.startDialogue([
        {
          speaker: 'หนุ่ม (ตกใจสุดขีด!)',
          role: 'หน้าเล้าไก่ข้างบ้าน',
          portrait: 'player',
          text: 'เฮ้ย!! ไก่ในเล้าหายไปตั้งหลายโต เหลือแต่ซากขนไก่กับฮอยข่วนบนไม้ไผ่ — แถมมี "เมือกเรืองแสงสีเขียว" คือกันกับตรงข้าวต้มมัดหยดเป็นทางยาวออกไปทางดงกล้วยกับปากหมู่บ้าน!',
        },
        {
          speaker: 'ชาวบ้านเลี้ยงไก่',
          role: 'ข้างเล้าไก่บ้าน (เสียงสั่น)',
          portrait: 'uncle',
          text: 'ข้อยว่าแล้วบักหนุ่ม! เมื่อคืนมีคนเห็นเงาไฟลอยเฉียดเล้าไก่... โตลองไปกราบถามเจ้าแม่ตะเคียนปากหมู่บ้านหรือเว้านำลุงทิดขี้เมาเบิ่ง เผื่อเลาเห็นทางที่มันลอยไป!',
        },
      ]);
      this.saveGame();
      return;
    }
    this.showToast('หน้าเล้าไก่ยังมีรอยคราบเมือกเรืองแสงจางๆ ติดอยู่ที่ไม้ไผ่');
  }

  private interactTaniBanana(): void {
    const mood = this.getVillageMood();
    const h = this.state.gameMinutes / 60;
    const isNight = h >= 19.0 || h < 5.8;
    if (mood !== 'festive' && isNight) {
      this.sound.playScare();
      this.state.flags.inspectedTani = true;
      this.addClue('banana_spirit');
      this.adjustSanity(-10);
      this.startDialogue([
        {
          speaker: 'เงาหญิงชุดเขียวในดงกล้วยตานี',
          role: 'สิ่งลี้ลับริมคันนา',
          portrait: 'narrator',
          text: '(กลิ่นดอกกล้วยป่าเย็นยะเยือกลอยโชย...) "อย่าย่างออกห่างวงสายสิญจน์หลายเด้อพ่อหนุ่ม... ดวงไฟอาคมจากท้ายตลาดมักลอยผ่านกอข้อยไปทางโกศหลังวัดทุกคืน..."',
        },
      ]);
      this.saveGame();
    } else {
      this.showToast('กอกล้วยตานีริมคันนาปลิวไสวตามสายลม — ช่วงกลางวันดูร่มรื่นปกติ');
    }
  }

  private interactRotHae(): void {
    this.sound.playUIClick();
    this.adjustSanity(10);
    this.showToast('🔊 เสียงหมอลำรถแห่บ้านทุ่งกระหึ่ม! ชาวบ้านเต้นตามขบวนอย่างสนุกสนาน (+10 สติ)');
  }

  private interactSchool(): void {
    const mood = this.getVillageMood();
    const h = (this.state.gameMinutes % 1440) / 60;
    const isNight = h >= 19.0 || h < 5.8;
    if (!this.state.flags.checkedSchool) {
      this.state.flags.checkedSchool = true;
      this.addClue('school_diary');
      if (isNight || mood !== 'festive') this.sound.playScare();
      else this.sound.playClueChime();
      this.startDialogue([
        {
          speaker: 'หนุ่ม',
          role: 'หน้าอาคารเรียนเก่า ร.ร.บ้านทุ่งประชานุเคราะห์',
          portrait: 'player',
          text: isNight
            ? 'ชิงช้าไม้หน้าโรงเรียนแกว่งเองทั้งที่ไม่มีลมพัด... ใต้กระดานดำศาลาริมสนามมีสมุดบันทึกครูเวรตกอยู่: "20 ปีก่อน มีเด็กหญิงหายตัวหลังเสียงหัวเราะหญิงแก่จากบ้านท้ายตลาด..."'
            : 'โรงเรียนประถมบ้านทุ่งที่หนุ่มกับน้องแก้วเคยวิ่งเล่น... ใต้โต๊ะไม้มี "สมุดบันทึกครูเวรรุ่นเก่า" เขียนเล่าเหตุการณ์ประหลาดเมื่อ 20 ปีก่อนของบ้านท้ายตลาดเก็บไว้ด้วย',
        },
      ]);
      this.saveGame();
      return;
    }
    this.showToast(isNight ? 'ชิงช้าหน้าโรงเรียนแกว่งเอี๊ยดอ๊าดชวนขนลุกในความมืด...' : 'ลานเสาธงโรงเรียนบ้านทุ่ง — ร่มรื่นด้วยต้นไม้ใหญ่');
  }

  private interactClinic(): void {
    if (!this.state.flags.checkedClinic) {
      this.state.flags.checkedClinic = true;
      this.addClue('clinic_record');
      this.sound.playClueChime();
      this.startDialogue([
        {
          speaker: 'หมออนามัยบ้านทุ่ง',
          role: 'รพ.สต.บ้านทุ่ง (หน้าบอร์ดข่าวสาธารณสุข)',
          portrait: 'vendor',
          text: 'อ้าวหนุ่ม! กลับมาพอดีเลย ช่วงนี้มีไทบ้านหลายรายเข้ามาเอายาแก้ผวาแล้วกะแจ้งว่าพ้อคราบเมือกคล้ายน้ำเหลืองปนคาวเลือดยามดึก ลุงกับหมอบันทึกรายงานไว้เทิงบอร์ดแล้ว แต่หมอว่าบ่น่าแม่นโรคติดต่อธรรมดาดอก...',
        },
        {
          speaker: 'หนุ่ม',
          role: 'ดูแฟ้มตรวจและบอร์ดแจ้งเตือน',
          portrait: 'player',
          text: 'เก็บข้อมูล "บันทึกการเจ็บป่วยประหลาด" จากอนามัยไว้เชื่อมโยงกับสมุดสืบคดีแล้ว (+25 สติ พักตรวจสุขภาพฟรี)',
        },
      ]);
      this.adjustSanity(25);
      this.saveGame();
      return;
    }
    this.adjustSanity(15);
    this.showToast('หมออนามัย: "ดูแลสุขภาพและพกยาดมไว้เสมอนะหนุ่ม" (+15 สติ)');
  }

  private interactShowHuayShop(): void {
    if (this.getVillageMood() === 'lockdown' && (this.state.gameMinutes % 1440) / 60 >= 20) {
      this.showToast('ร้านชำเจ๊แตนปิดประตูล็อกแม่กุญแจแน่นหนาหลังสองทุ่ม! รีบหาจุดปลอดภัยหรือรอเช้า', true);
      return;
    }
    const baht = this.state.baht ?? 120;
    this.sound.playUIClick();
    this.openModal(
      `ร้านชำเจ๊แตน & ตู้บุญเติม (เงินติดตัว: ${baht} ฿)`,
      `
      <p style="margin-top:0">เจ๊แตนยิ้มต้อนรับหน้าร้าน: "เอาหยังล่ะหนุ่ม? มีทั้งถ่านไฟฉายตรากบ ยาดม และน้ำแดงเย็นๆ!"</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button class="primary-btn" data-buy="battery_cell" data-price="30">🔋 ถ่านไฟฉายตรากบ (30 ฿) — ฟื้นแบตไฟฉาย +85%</button>
        <button class="secondary-btn" data-buy="inhaler" data-price="25">🌿 ยาดมสมุนไพร (25 ฿) — เรียกสติ +35%</button>
        <button class="secondary-btn" data-buy="red_soda" data-price="20">🥤 น้ำแดงเย็น (20 ฿) — ฟื้นสติ +30% & กำลังวิ่งเต็ม 100%</button>
      </div>
      <p style="font-size:0.8rem;color:#9fa6b8;margin-top:10px">ทิป: จับปลาช่อนหนองน้ำมาขายป้าบัวที่ตลาดได้ตัวละ +60 ฿ หรือชาร์จแบตไฟฉายฟรีตอนนอนบนเรือน</p>
      `
    );
    this.modalBody.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.buy!;
        const price = Number(btn.dataset.price);
        const cur = this.state.baht ?? 120;
        if (cur < price) {
          this.showToast(`เงินไม่พอ (ต้องใช้ ${price} ฿ — ตกปลาหนองน้ำขายป้าบัวได้ +60 ฿)`, true);
          return;
        }
        this.state.baht = cur - price;
        this.sound.playCoinJingle();
        if (itemId === 'battery_cell' && this.state.inventory.includes('battery_cell')) {
          this.state.battery = Math.min(100, (this.state.battery ?? 0) + 85);
          this.showToast(`ซื้อและใส่ถ่านตรากบแล้ว! (-${price} ฿ / แบต ${Math.round(this.state.battery)}%)`);
        } else if (itemId === 'red_soda' && this.state.inventory.includes('red_soda')) {
          this.adjustSanity(30);
          this.stamina = 100;
          this.showToast(`ซื้อน้ำแดงดื่มหน้าร้านเจ๊แตนสดชื่น! (-${price} ฿)`);
        } else {
          this.addItem(itemId);
        }
        this.closeModal();
        this.updateHUD();
        this.saveGame();
      });
    });
  }

  private interactMorningMonk(): void {
    const f = this.state.flags;
    this.adjustSanity(40);
    this.sound.playClueChime();
    if (!f.gaveAlmsMorning) {
      f.gaveAlmsMorning = true;
      this.playCutscene('morning_alms', () => {
        this.startDialogue([
          {
            speaker: 'หลวงพี่ (ออกบิณฑบาตยามเช้า)',
            role: 'ถนนหน้าหมู่บ้านบ้านทุ่ง',
            portrait: 'uncle',
            text: 'สาธุ... บุญรักษาเด้อโยมหนุ่ม ตื่นมื้อเซ้ามาใส่บาตรให้ใจผ่องใส (+40 สติ) แผ่ส่วนบุญกุศลให้เจ้ากรรมนายเวรในบ้านทุ่งนำกันเด้อโยม',
          },
        ]);
      });
      this.saveGame();
      return;
    }
    this.playCutscene('morning_alms', () => {
      this.showToast('ใส่บาตรรับศีลรับพรจากหลวงพี่ยามเช้า (+40 สติ)');
    });
  }

  private interactHideSpot(spotName: string): void {
    if (!this.krasueChase) {
      this.showToast(`${spotName} — จุดอับสายตาใช้หลบซ่อนตัวเวลาถูกผีกระสือไล่ตามในยามค่ำคืน`);
      return;
    }
    this.krasueChase = false;
    this.krasueCooldown = 14;
    this.krasueShowTimer = 0;
    this.chaseBanner.classList.add('hidden');
    this.sound.playSwitchClick();
    this.showToast(`กลั้นใจหลบซ่อนหลัง${spotName}ทันเวลา! ดวงไฟผีกระสือลอยผ่านเลยไปในความมืด`);
  }

  private takeEvidencePhoto(): void {
    if (this.modalOpen || this.activeDialogue.length > 0) return;
    this.sound.playCameraShutter();
    const x = this.state.x;
    const photos = this.state.photos ?? (this.state.photos = []);
    let caption: string | null = null;
    if (this.krasueChase || this.krasueShowTimer > 0) {
      caption = 'ภาพถ่ายดวงไฟสีเขียวและเงาหัวผีกระสือกลางอากาศ!';
    } else if (this.currentRoom === 'outside' && Math.abs(x - 10.2) < 4.5 && this.state.flags.checkedChickenCoopDay2) {
      caption = 'ภาพคราบเมือกเรืองแสงและรอยข่วนที่เล้าไก่บ้าน';
    } else if (this.currentRoom === 'outside' && Math.abs(x - -20.5) < 4.5) {
      caption = 'ภาพเงาลึกลับริมกอกล้วยตานีคันนา';
    } else if (this.currentRoom === 'outside' && Math.abs(x - -51.8) < 4.5) {
      caption = 'ภาพโอ่งมังกรเปื้อนรอยลากหน้าบ้านยายสาย';
    } else if (this.currentRoom === 'outside' && Math.abs(x - -96.5) < 4.5) {
      caption = 'ภาพศาลเจ้าแม่ตะเคียนคู่ผูกผ้าเจ็ดสี';
    } else if (this.currentRoom === 'outside' && Math.abs(x - -112.0) < 4.5) {
      caption = 'ภาพชิงช้าไม้โรงเรียนประถมบ้านทุ่ง';
    } else if (this.currentRoom === 'outside' && Math.abs(x - 120.5) < 4.5) {
      caption = 'ภาพโกศบรรจุอัฐิหมายเลข 4 ท้ายป่าช้าวัด';
    }

    if (caption) {
      if (!photos.includes(caption)) {
        photos.push(caption);
        this.adjustSanity(15);
        this.saveGame();
        this.showToast(`📷 แชะ! บันทึกหลักฐาน: ${caption} (+15 สติ)`);
      } else {
        this.showToast(`📷 แชะ! มีภาพ "${caption}" ในอัลบั้มสมุดสืบแล้ว`);
      }
    } else {
      this.showToast('📷 แชะ! เก็บภาพบรรยากาศบ้านทุ่งอีสาน (ลองถ่ายใกล้จุดลี้ลับหรือตอนกระสือปรากฏตัว!)');
    }
  }

  private getNavigationGuide(): { text: string; direction: string } {
    const f = this.state.flags;
    const h = this.state.gameMinutes / 60;
    const isNight = h >= 20.5 || h < 5.5;
    let targetRoom: Ch2RoomId = 'outside';
    let targetX = 5.9;
    let text = '';

    if (!f.bondedWithFamilyDay1) {
      if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.9;
        text = 'ขึ้นบันไดบ้านไม้ยกสูงไปหาแม่คำและน้องแก้ว';
      } else {
        targetRoom = 'stilt_house';
        targetX = -1.2;
        text = 'คุยทักทายแม่คำและน้องแก้วบนเรือนไม้';
      }
    } else if (!f.finishedDay1Dinner) {
      if (!f.heardHerbFolkloreDay1) {
        targetRoom = 'outside';
        targetX = -28.0;
        text = 'เดินตลาดใหญ่แวะคุยฟังเรื่องเล่าชุมชนจากตาชมแผงสมุนไพร';
      } else if (!f.askedFishFolkloreDay1) {
        targetRoom = 'outside';
        targetX = -36.0;
        text = 'แวะทักทายป้าบัวแผงปลาสดในตลาด';
      } else if (!f.boughtPorkDay1) {
        targetRoom = 'outside';
        targetX = -44.0;
        text = 'รับหมูสดจากเฮียตี๋เขียงหมูกลับไปให้แม่ทำกับข้าว';
      } else if (!f.caughtPondFishDay1) {
        targetRoom = 'outside';
        targetX = 20.4;
        text = 'เดินไปท่าน้ำหนองน้ำ (+20 ม.) ตกปลาช่อนสดฝากแม่คำทำต้มยำ';
      } else if (!f.visitedFair) {
        targetRoom = 'outside';
        targetX = 76.0;
        text = 'แวะเที่ยวงานวัดป่า (ปาลูกโป่ง / สอยดาว) ก่อนงานจะปิด!';
      } else if (!f.greetedMonkDay1) {
        if (this.currentRoom !== 'kuti') {
          targetRoom = 'outside';
          targetX = 54.5;
          text = 'เดินไปแวะกราบสวัสดีหลวงพี่ที่กุฏิวัดป่า';
        } else {
          targetRoom = 'kuti';
          targetX = 1.8;
          text = 'กราบสวัสดีหลวงพี่ในกุฏิ';
        }
      } else if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.9;
        text = 'กลับขึ้นบ้านไม้ยกสูงนำของสดและปลาช่อนให้แม่คำทำมื้อเย็นด้วยกัน';
      } else {
        targetRoom = 'stilt_house';
        targetX = -1.2;
        text = 'กินข้าวแลงพร้อมหน้ากับแม่คำและน้องแก้ว';
      }
    } else if (!f.checkedUnderHouse) {
      targetRoom = 'outside';
      targetX = -1.8;
      text = 'ลงมาตรวจดูใต้แคร่ไม้ไผ่ใต้ถุนบ้านหาข้าวต้มมัดปริศนา';
    } else if (!f.heardPaWarning && !f.sawKrasueAtWindow) {
      targetRoom = 'outside';
      targetX = -8.6;
      text = 'ฟังประกาศเตือนภัยจากหอกระจายข่าวหมู่บ้าน (รถแห่เริ่มหยุดวิ่ง!)';
    } else if (!f.checkedChickenCoopDay2 && !f.sawKrasueAtWindow) {
      targetRoom = 'outside';
      targetX = 10.2;
      text = 'ตรวจดูความผิดปกติที่เล้าไก่บ้านข้างเรือนยกสูง';
    } else if (!f.inspectedTakian && !f.sawKrasueAtWindow) {
      targetRoom = 'outside';
      targetX = -96.5;
      text = 'ไปกราบขอพร & สืบเบาะแสที่ศาลเจ้าแม่ตะเคียนคู่ปากหมู่บ้าน (-96 ม.)';
    } else if (!f.sawKrasueAtWindow) {
      if (!isNight) {
        if (this.currentRoom !== 'stilt_house') {
          targetRoom = 'outside';
          targetX = 5.9;
          text = 'ขึ้นบ้านไม้ยกสูงนอนรอเวลาจนถึงกลางคืน (21:40)';
        } else {
          targetRoom = 'stilt_house';
          targetX = 4.8;
          text = 'กดนอนบนเสื่อรอถึงสามทุ่มครึ่ง (21:40)';
        }
      } else if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.9;
        text = 'รีบขึ้นเรือนไปเฝ้าดูหน้าต่างบ้านในยามค่ำคืน!';
      } else {
        targetRoom = 'stilt_house';
        targetX = 2.2;
        text = 'เดินไปเฝ้าดูหน้าต่างฝั่งขวา';
      }
    } else if (!f.gotHerbsAndThorns) {
      targetRoom = 'outside';
      targetX = -28.0;
      text = 'รีบไปขอ "หนามพุทรา" จากแผงสมุนไพรตาชมเดี๋ยวนี้!';
    } else if (!f.placedThornsAtWindow) {
      if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.9;
        text = 'นำหนามพุทรากลับขึ้นไปวางขวางหน้าต่างบ้านยกสูง';
      } else {
        targetRoom = 'stilt_house';
        targetX = 2.2;
        text = 'กด [E] วางหนามพุทราขวางหน้าต่างเรือน';
      }
    } else if (!f.checkedFishDeep || !f.checkedButcherDeep || !f.checkedYaiSai) {
      targetRoom = 'outside';
      if (!f.checkedFishDeep) {
        targetX = -36.0;
        text = 'สืบถามป้าบัวแผงปลาเรื่องไฟสีเขียวกลางทุ่งนา';
      } else if (!f.checkedButcherDeep) {
        targetX = -44.0;
        text = 'เค้นถามเฮียตี๋เขียงหมูเรื่องตับหายและจี้กระดูก';
      } else {
        targetX = -51.8;
        text = 'ไปดูบ้านท้ายตลาดและโอ่งน้ำของยายสาย';
      }
    } else if (!f.readTempleHistory) {
      if (this.currentRoom !== 'temple_sala') {
        targetRoom = 'outside';
        targetX = 40.5;
        text = 'เดินผ่านซุ้มประตูวัดป่าเข้าไปในพระอุโบสถ อ่านจารึกใบลานโบราณ';
      } else {
        targetRoom = 'temple_sala';
        targetX = -1.6;
        text = 'อ่านจารึกใบลานโบราณในตู้พระธรรม';
      }
    } else if (f.saiSinPrepared && !f.checkedSaiSinCircle) {
      targetRoom = 'outside';
      targetX = 31.8;
      text = 'เดินเข้าไปใน "วงสายสิญจน์" หน้าลานวัด คุยกับตาชม ป้าบัว และเฮียตี๋';
    } else if (!f.talkedToMonkOnce) {
      if (this.currentRoom !== 'kuti') {
        targetRoom = 'outside';
        targetX = 54.5;
        text = 'ขึ้นกุฏิกราบปรึกษาหลวงพี่เรื่องคำสาปทายาทกระสือ';
      } else {
        targetRoom = 'kuti';
        targetX = 1.8;
        text = 'ขอคำชี้แนะจากหลวงพี่';
      }
    } else if (!f.gotBetelBox) {
      if (!isNight) {
        if (this.currentRoom !== 'stilt_house') {
          targetRoom = 'outside';
          targetX = 5.9;
          text = 'นอนรอเวลาถึงสามทุ่มครึ่ง (21:40) บนเรือนไม้ยกสูง';
        } else {
          targetRoom = 'stilt_house';
          targetX = 4.8;
          text = 'กดนอนบนเสื่อรอเวลา 21:40 น.';
        }
      } else {
        targetRoom = 'outside';
        targetX = 17.5;
        text = 'เดินไป "ศาลปู่ตาริมทุ่งนา" เพื่อขุดเอาเชี่ยนหมากเงินโบราณ';
      }
    } else if (!f.monkBlessedFinal) {
      if (this.currentRoom !== 'kuti') {
        targetRoom = 'outside';
        targetX = 54.5;
        text = 'นำเชี่ยนหมากเงินกลับขึ้นกุฏิให้หลวงพี่ปลุกเสกของขลัง';
      } else {
        targetRoom = 'kuti';
        targetX = 1.8;
        text = 'ส่งเชี่ยนหมากเงินให้หลวงพี่ทำพิธีเสกธูป น้ำมนต์ & มีดหมอ';
      }
    } else if (!f.comfortedSisterCrisis) {
      if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.9;
        text = 'รีบขึ้นไปดูอาการน้องแก้วและแม่คำบนเรือนก่อนเข้าป่าช้าวัด';
      } else {
        targetRoom = 'stilt_house';
        targetX = -1.2;
        text = 'ปลอบขวัญน้องแก้วและแม่คำ';
      }
    } else if (!isNight) {
      if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.9;
        text = 'นอนรอถึงเวลา 21:40 น. บนเรือนไม้ยกสูง';
      } else {
        targetRoom = 'stilt_house';
        targetX = 4.8;
        text = 'รอเวลาถึงกลางคืน (21:40)';
      }
    } else {
      targetRoom = 'outside';
      targetX = 120.5;
      text = 'เดินผ่านงานวัดป่าไปโกศบรรจุอัฐิหมายเลข 4 หลังวัดเพื่อทำพิธีตัดขาดทายาทกระสือ';
    }

    let direction = '';
    if (this.currentRoom !== targetRoom) {
      direction =
        this.currentRoom !== 'outside'
          ? '◀ เดินไปประตูซ้ายเพื่อลงบันไดเรือน/กุฏิ'
          : targetX < this.state.x
            ? `◀ เดินไปทางซ้าย (${Math.round(Math.abs(targetX - this.state.x))} ม.)`
            : `▶ เดินไปทางขวา (${Math.round(Math.abs(targetX - this.state.x))} ม.)`;
    } else {
      const dx = targetX - this.state.x;
      direction =
        Math.abs(dx) <= 1.8
          ? 'ถึงจุดหมายแล้ว — กด [E]'
          : dx < 0
            ? `◀ เดินไปทางซ้าย (${Math.round(Math.abs(dx))} ม.)`
            : `▶ เดินไปทางขวา (${Math.round(Math.abs(dx))} ม.)`;
    }
    return { text, direction };
  }

  private updateHUD(): void {
    const totalM = Math.floor(this.state.gameMinutes) % 1440;
    this.hudClock.textContent = `${String(Math.floor(totalM / 60)).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    const pMap: Record<TimePeriod, string> = { dawn: 'รุ่งสาง', morning: 'เช้า', noon: 'เที่ยง', evening: 'เย็น', night: 'กลางคืน' };
    this.hudPeriod.textContent = pMap[period];
    this.hudWeather.textContent = this.state.weather === 'rain' ? 'ฝนตก' : 'ลมพัดทุ่ง';
    this.hudLocation.textContent = CH2_ZONE_NAMES(this.state.x, this.currentRoom);
    this.hudSanityVal.textContent = `${this.state.sanity}%`;
    this.hudSanityFill.style.width = `${this.state.sanity}%`;
    this.hudSanityFill.style.background = this.state.sanity > 60 ? '#679c77' : this.state.sanity > 30 ? '#c99746' : '#b83b3b';
    this.sanityOverlay.classList.toggle('low-sanity', this.state.sanity <= 55 && this.state.sanity > 25);
    this.sanityOverlay.classList.toggle('critical-sanity', this.state.sanity <= 25);

    const g = this.getNavigationGuide();
    this.hudQuest.textContent = `เป้าหมาย: ${g.text}`;
    this.hudNav.textContent = g.direction;
    this.updateExtraHud();
  }

  private updateExtraHud(): void {
    if (!this.hudExtra) return;
    this.hudExtra.textContent = `💰 ${this.state.baht ?? 120} ฿ • 🏃 ${Math.round(this.stamina)}% • 🔋 ${Math.round(this.state.battery ?? 100)}%`;
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
      const canMove = !this.modalOpen && this.activeDialogue.length === 0 && !this.cutscene.isPlaying();
      this.mobileControls.classList.toggle('overlay-paused', !canMove);
      this.interactPrompt.classList.toggle('overlay-paused', !canMove);
      this.invBar.classList.toggle('overlay-paused', !canMove);
      let moveX = 0;
      let moveZ = 0;
      if (canMove) {
        if (this.codes.has('KeyA') || this.codes.has('ArrowLeft') || this.touchMoveDir === -1) moveX -= 1;
        if (this.codes.has('KeyD') || this.codes.has('ArrowRight') || this.touchMoveDir === 1) moveX += 1;
        if (this.codes.has('KeyW') || this.codes.has('ArrowUp')) moveZ -= 1;
        if (this.codes.has('KeyS') || this.codes.has('ArrowDown')) moveZ += 1;
      }

      const isMoving = moveX !== 0 || moveZ !== 0;
      const wantSprint =
        isMoving &&
        !this.ridingBike &&
        (this.codes.has('ShiftLeft') || this.codes.has('ShiftRight') || this.isSprintingTouch) &&
        this.stamina > 2;
      if (wantSprint) {
        this.stamina = Math.max(0, this.stamina - 24 * dt);
      } else {
        this.stamina = Math.min(100, this.stamina + 14 * dt);
      }

      if (this.state.flashlightOn) {
        this.state.battery = Math.max(0, (this.state.battery ?? 100) - 1.15 * dt);
        if (this.state.battery <= 0) {
          this.state.flashlightOn = false;
          this.btnFlashlight.classList.remove('active');
          this.touchFlashlight.classList.remove('active');
          this.touchFlashlight.textContent = '🔦';
          this.sound.playSwitchClick();
          this.showToast('ถ่านไฟฉายหมด! ซื้อถ่านที่ร้านเจ๊แตน (-89 ม.) หรือนอนชาร์จบนเรือนฟรี', true);
        }
      }

      this.hudExtraTimer -= dt;
      if (this.hudExtraTimer <= 0) {
        this.hudExtraTimer = 0.25;
        this.updateExtraHud();
      }

      if (isMoving) {
        if (moveX !== 0) this.facing = moveX > 0 ? 1 : -1;
        const speed = this.ridingBike && this.currentRoom === 'outside' ? 10.8 : wantSprint ? 7.4 : 4.6;
        const roomLimit = this.currentRoom === 'stilt_house' ? 7.1 : this.currentRoom === 'temple_sala' ? 6.0 : 5.1;
        const minX = this.currentRoom !== 'outside' ? -roomLimit : CH2_MIN_X;
        const maxX = this.currentRoom !== 'outside' ? roomLimit : CH2_MAX_X;
        this.state.x = Math.max(minX, Math.min(maxX, this.state.x + moveX * speed * dt));
        // Keep player cleanly on road / inside floor walkway (never clipping behind building platforms!)
        const minZ = this.currentRoom !== 'outside' ? -0.15 : 0.25;
        const maxZ = this.currentRoom !== 'outside' ? 1.55 : 2.0;
        this.playerZ = Math.max(minZ, Math.min(maxZ, this.playerZ + moveZ * (this.ridingBike ? 3.2 : wantSprint ? 2.8 : 2.1) * dt));
        this.updateHUD();
        if (!this.ridingBike) {
          this.stepTimer -= dt;
          if (this.stepTimer <= 0) {
            this.stepTimer = wantSprint ? 0.19 : 0.28;
            this.sound.playFootstep(this.currentRoom === 'stilt_house' ? 'wood' : 'concrete');
          }
        }
      }

      const prevMin = Math.floor(this.state.gameMinutes);
      this.state.gameMinutes = (this.state.gameMinutes + dt * 1.4) % 1440;
      const curMin = Math.floor(this.state.gameMinutes);
      if (curMin !== prevMin) this.updateHUD();
      if (curMin >= 330 && curMin <= 345 && this.lastRoosterDay !== this.state.day) {
        this.lastRoosterDay = this.state.day;
        this.sound.playRoosterCrow();
      }

      this.autoSaveTimer -= dt;
      if (this.autoSaveTimer <= 0) {
        this.autoSaveTimer = 5;
        this.saveGame();
      }

      if (this.dogHowlCooldown > 0) this.dogHowlCooldown -= dt;
      if (this.krasueChase && this.dogHowlCooldown <= 0) {
        this.dogHowlCooldown = 14;
        this.sound.playDogHowl();
      }

      if (this.krasueCooldown > 0) this.krasueCooldown -= dt;
      if (this.krasueShowTimer > 0 && !this.krasueChase) this.krasueShowTimer -= dt;

      const period = this.world.getTimePeriod(this.state.gameMinutes);
      const inSaiSin =
        this.state.flags.saiSinPrepared &&
        this.currentRoom === 'outside' &&
        this.state.x >= 29.0 &&
        this.state.x <= 34.6;
      const safe =
        this.currentRoom !== 'outside' ||
        inSaiSin ||
        (this.state.x >= -5.5 && this.state.x <= 6.5);

      if (this.krasueChase) {
        if (safe) {
          this.krasueChase = false;
          this.krasueCooldown = 12;
          this.chaseBanner.classList.add('hidden');
          if (inSaiSin) {
            this.world.triggerSaiSinFlash();
            this.sound.playClueChime();
            this.krasueX = this.state.x < 31.8 ? 26.2 : 37.6;
            this.krasueShowTimer = 2.0;
            this.showToast('ก้าวเข้าวงสายสิญจน์ทันเวลา! ด้ายสายสิญจน์ส่องแสงวาบขวางจนผีกระสือกรีดร้องกระเด็นถอยกลับไป!');
          } else {
            this.krasueShowTimer = 0;
            this.showToast('เข้ามาในเขตปลอดภัยทันเวลา... แสงกระสือลอยถอยกลับไปทางทุ่งนา');
          }
        } else {
          this.krasueChaseTimer -= dt;
          const dir = this.state.x >= this.krasueX ? 1 : -1;
          this.krasueX += dir * 3.1 * dt;
          this.krasueShowTimer = 1.0;
          if (Math.abs(this.krasueX - this.state.x) < 0.85) {
            this.krasueChase = false;
            this.krasueCooldown = 14;
            this.chaseBanner.classList.add('hidden');
            this.triggerScare(32, 'ผีกระสือพุ่งเฉียดตัวพร้อมกลิ่นคาวคลุ้ง!', this.state.x - dir * 3);
          } else if (this.krasueChaseTimer <= 0) {
            this.krasueChase = false;
            this.krasueCooldown = 12;
            this.chaseBanner.classList.add('hidden');
          }
        }
      } else if (
        this.state.flags.sawKrasueAtWindow &&
        canMove &&
        !safe &&
        period === 'night' &&
        this.krasueCooldown <= 0 &&
        this.state.flashlightOn &&
        Math.abs(this.state.x) > 12 &&
        Math.random() < dt * 0.14
      ) {
        this.krasueX = this.state.x + this.facing * 7.5;
        this.krasueShowTimer = 3.0;
        this.sound.playScare();
        this.krasueChase = true;
        this.krasueChaseTimer = 12;
        this.chaseBanner.classList.remove('hidden');
        this.showToast('แสงไฟฉายส่องโดนผีกระสือกลางทุ่ง! มันหันหัวพุ่งตรงเข้ามาหาคุณแล้ว!', true);
      }

      const nearest = canMove ? this.getNearestInteractable() : null;
      if (nearest) {
        this.interactPrompt.classList.remove('hidden');
        this.interactLabel.textContent = nearest.getLabel ? nearest.getLabel() : nearest.label;
      } else {
        this.interactPrompt.classList.add('hidden');
      }

      const villageMood = this.getVillageMood();
      const outdoorQuiet = this.currentRoom === 'outside' && !this.krasueChase && !this.cutscene.isPlaying();
      this.sound.updateAmbience(dt, this.state.weather, period, this.state.sanity, 0 as FloorIndex, this.krasueChase);
      this.sound.updateIsaanAmbience(dt, period, this.currentRoom === 'outside', this.krasueChase);
      this.sound.updateRotHaeMusic(
        dt,
        Math.abs(this.state.x - this.world.getRotHaeX()),
        outdoorQuiet && villageMood === 'festive',
        this.krasueChase
      );
      this.sound.updateIsaanMarketAmbience(
        dt,
        Math.abs(this.state.x - (-42.0)),
        outdoorQuiet && villageMood !== 'lockdown'
      );
      this.sound.updateTempleFairAmbience(
        dt,
        Math.abs(this.state.x - 76.0),
        outdoorQuiet && villageMood === 'festive'
      );

      this.world.update(
        dt,
        this.state.x,
        this.playerZ,
        this.currentRoom,
        this.facing,
        isMoving,
        this.state.flashlightOn,
        this.state.gameMinutes,
        this.state.weather,
        this.state.flags.placedThornsAtWindow,
        this.state.flags.saiSinPrepared,
        this.state.inventory.includes('bicycle'),
        this.ridingBike,
        this.krasueShowTimer > 0 || this.krasueChase,
        this.krasueChase,
        this.krasueX,
        villageMood,
        this.state.flags.banishedKrasue
      );
    }
  }
}
