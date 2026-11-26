import { drawCh2CharacterCanvas, drawCh2ItemIconDataUrl } from '../art/Chapter2Sprites';
import { SoundEngine } from '../audio/SoundEngine';
import { CH2_CLUES, CH2_ITEMS, CH2_RULES, CH2_ZONE_NAMES } from '../data/chapter2Data';
import { DialogueLine, EndingType, FloorIndex, TimePeriod, WeatherType } from '../types';
import { bindCameraZoomControls } from '../ui/mobileZoom';
import { CH2_MAX_X, CH2_MIN_X, Ch2RoomId, IsaanWorld } from '../world/IsaanWorld';

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
      inventory: ['inhaler'],
      clues: [],
      flags: DEFAULT_CH2_FLAGS(),
    };
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
    this.startDialogue([
      {
        speaker: 'หนุ่ม',
        role: 'บัณฑิตจบใหม่ — ลานหน้าบ้านไม้ยกสูง',
        portrait: 'player',
        text: 'ในที่สุดก็ได้กลับมาเหยียบแผ่นดินบ้านเกิดภาคอีสานสักที... สี่ปีที่ไปเรียนและทำงานในกรุงเทพฯ คิดถึงกลิ่นดิน กลิ่นทุ่งนา และเสียงลมเย็นๆ ใต้ถุนบ้านไม้ยกสูงชะมัด',
      },
      {
        speaker: 'หนุ่ม',
        role: 'คิดถึงครอบครัว',
        portrait: 'player',
        text: 'ป่านนี้แม่คำกับน้องแก้วคงรออยู่ข้างบนแล้ว แม่ส่งไลน์มาบอกตั้งแต่เมื่อวานว่าจะทำต้มไก่บ้านรอรับขวัญ เดี๋ยวรีบเดินขึ้นบันไดไปกอดแม่กับน้องก่อนดีกว่า!',
      },
    ]);
  }

  public continueGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    try {
      const raw = localStorage.getItem(CH2_SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Ch2SaveState;
        this.state = {
          ...this.createNewState(),
          ...parsed,
          flags: { ...DEFAULT_CH2_FLAGS(), ...(parsed.flags || {}) },
        };
      }
    } catch {
      this.state = this.createNewState();
    }
    this.currentRoom = 'outside';
    this.beginPlay();
    this.showToast('โหลด Chapter 2 เรียบร้อย');
  }

  private beginPlay(): void {
    document.getElementById('title-screen')?.classList.add('hidden');
    this.hudTop.classList.remove('hidden');
    this.invBar.classList.remove('hidden');
    this.touchUp.classList.add('hidden');
    this.touchDown.classList.add('hidden');
    this.touchFlashlight.classList.add('hidden');
    this.touchBike.classList.add('hidden');
    this.chaseBanner.querySelector('span:last-child')!.textContent =
      'ผีกระสือกำลังลอยไล่ตามมา! รีบวิ่งหนีเข้า "วงสายสิญจน์ลานวัด" พระอุโบสถ หรือขึ้นบ้านไม้ยกสูง';

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
    if (isTouch) {
      this.mobileControls.classList.remove('hidden');
      this.touchFlashlight.classList.remove('hidden'); // ไฟฉายแสดงตลอดในโหมดสัมผัส
      this.touchFlashlight.textContent = this.state.flashlightOn ? '🔦✓' : '🔦';
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
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ac.abort();
    this.chaseBanner.classList.add('hidden');
    this.touchUp.classList.add('hidden');
    this.touchDown.classList.add('hidden');
    document.getElementById('touch-shoot')?.classList.add('hidden');
    this.touchFlashlight.classList.add('hidden');
    this.touchBike.classList.add('hidden');
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
      this.touchBike.classList.toggle('hidden', !(isTouch && this.state.inventory.includes('bicycle')));
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
        if (!this.running) return;
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
        try { btn.setPointerCapture(ev.pointerId); } catch {}
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
    this.interactPrompt.addEventListener('click', () => {
      this.sound.init();
      if (this.activeDialogue.length === 0 && !this.modalOpen) this.tryInteract();
    }, sig);
  }

  private setupInteractables(): void {
    this.interactables = [
      {
        id: 'ch2_bicycle',
        x: -3.4,
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
        x: 5.0,
        range: 1.9,
        label: 'ขึ้นบันไดบ้านไม้ยกสูงไปหาแม่คำ & น้องแก้ว',
        onInteract: () => {
          this.sound.playDoorCreak();
          this.enterRoom('stilt_house', 5.0);
        },
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
        x: 110.5,
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

      // INSIDE STILT HOUSE ('stilt_house')
      {
        id: 'house_exit',
        room: 'stilt_house',
        x: -4.6,
        range: 1.5,
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
        x: 4.0,
        range: 1.6,
        label: 'พักผ่อน / นอนรอเวลา / เซฟเกม',
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
          this.adjustSanity(30);
          this.sound.playClueChime();
          this.showToast('ก้มกราบพระประธานในพระอุโบสถ — ใจสงบเยือกเย็น (+30 สติ)');
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
    this.state.x = room === 'temple_sala' ? -4.8 : -3.8;
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

    // 1) Warm Day 1 Homecoming Bonding!
    if (!f.bondedWithFamilyDay1) {
      f.bondedWithFamilyDay1 = true;
      this.addClue('family_story');
      this.startDialogue([
        {
          speaker: 'แม่คำ',
          role: 'แม่ของหนุ่ม (ยิ้มน้ำตาคลอ)',
          portrait: 'vendor',
          text: 'กลับมาแล้วเหรอลูกหนุ่ม! ดูสิ ผอมลงไปหน่อยนะเรา ทำแต่งานอยู่กรุงเทพฯ ... มานี่มา แม่ต้มไก่บ้านใส่ใบมะขามอ่อนของโปรดไว้รอแล้ว',
        },
        {
          speaker: 'น้องแก้ว',
          role: 'น้องสาวของหนุ่ม (ยิ้มดีใจ)',
          portrait: 'prim',
          text: 'พี่หนุ่ม! แก้วเอาสมุดพกเทอมนี้มาอวดด้วย ได้เกรดเฉลี่ยตั้ง 3.85 แน่ะ พี่สัญญาแล้วนะว่ากลับมาอยู่บ้านแล้วจะพาแก้วไปเดินตลาดกับไปไหว้พระด้วยกัน!',
        },
        {
          speaker: 'หนุ่ม',
          role: 'ลูกชายคนโต (กอดแม่กับน้อง)',
          portrait: 'player',
          text: 'เก่งมากน้องสาวพี่ เดี๋ยวพี่ซักพักจะออกไปเดินตลาดสดซื้อหมูสดกับผักมาให้แม่ทำกับข้าวมื้อใหญ่ แล้วแวะไปกราบหลวงพี่ที่วัดป่าด้วยเลย — ว่าแต่แม่ครับ แถวบ้านเรายังเงียบสงบดีอยู่ใช่ไหมครับ?',
        },
        {
          speaker: 'แม่คำ',
          role: 'แม่ของหนุ่ม',
          portrait: 'vendor',
          text: 'ก็สงบดีแหละลูก ยกเว้นช่วงหลังๆ กลางคืนหมามันชอบหอนแปลกๆ ... พอถามตาชมกับป้าบัวที่ตลาด แกก็พูดกันถึงเรื่องเก่ายี่สิบปีก่อนสมัยย่าบุญมายังอยู่ ว่าอย่าเดินทุ่งดึกๆ พี่หนุ่มลองไปเดินตลาดซื้อของแล้วแวะคุยทักทายผู้ใหญ่ในชุมชนดูนะลูก',
        },
      ]);
      this.saveGame();
      return;
    }

    // 2) Returning home on Day 1 evening with market groceries for a warm family dinner!
    if (!f.finishedDay1Dinner) {
      const finishedShoppingDay1 =
        f.boughtPorkDay1 && f.askedFishFolkloreDay1 && f.heardHerbFolkloreDay1 && f.greetedMonkDay1;
      if (!finishedShoppingDay1) {
        this.startDialogue([
          {
            speaker: 'แม่คำ',
            role: 'แม่ของหนุ่ม',
            portrait: 'vendor',
            text: 'ออกไปเดินตลาดสดทักทายเฮียตี๋เขียงหมู ป้าบัวแผงปลา ตาชมแผงสมุนไพร แล้วก็แวะกราบหลวงพี่ที่วัดป่าให้ครบก่อนนะลูก ค่ำๆ ค่อยกลับมากินข้าวเย็นด้วยกัน',
          },
        ]);
        return;
      }

      f.finishedDay1Dinner = true;
      if (this.state.inventory.includes('market_groceries')) {
        this.removeItem('market_groceries');
      }
      this.state.day += 1;
      this.state.gameMinutes = 8 * 60 + 30; // Peaceful morning of Day 2!
      this.state.sanity = 100;
      this.startDialogue([
        {
          speaker: 'หนุ่ม',
          role: 'คืนแรกอันแสนอบอุ่นในเรือนไม้',
          portrait: 'player',
          text: 'ส่งของสดให้แม่คำทำกับข้าวมื้อเย็น... กินข้าวเหนียวส้มตำพร้อมหน้าพร้อมตาทั้งแม่และน้องแก้ว หัวเราะกันจนลืมเรื่องเล่าชวนขนลุกในตลาดไปชั่วคราว คืนนั้นทุกคนหลับลงอย่างมีความสุข',
        },
        {
          speaker: 'แม่คำ (เช้าวันรุ่งขึ้น — 08:30 น.)',
          role: 'ชวนคุยบนเรือนไม้ยกสูง',
          portrait: 'vendor',
          text: 'หนุ่มตื่นแล้วเหรอลูก... แต่เมื่อคืนตอนตีสอง แม่สะดุ้งตื่นเพราะได้ยินเสียงแมวร้องขู่กับเสียงหมาหอนลากยาวใต้ถุนบ้านแปลกๆ ชอบกล',
        },
        {
          speaker: 'น้องแก้ว',
          role: 'น้องสาวของหนุ่ม (เพิ่งนึกขึ้นได้)',
          portrait: 'prim',
          text: 'เออใช่พี่หนุ่ม! เมื่อวานตอนบ่ายก่อนพี่เดินเข้าบ้าน มีป้าแก่ๆ หลังค่อมเอา "ข้าวต้มมัด" มายื่นให้แก้วตรงรั้วบ้าน แก้วเห็นกลิ่นมันคาวๆ แปลกๆ เลยแอบโยนทิ้งไว้ใต้แคร่ไม้ใต้ถุนบ้าน ยังไม่ได้บอกแม่เลย...',
        },
        {
          speaker: 'หนุ่ม',
          role: 'นึกถึงคำเล่าของตาชมในตลาด!',
          portrait: 'player',
          text: 'เดี๋ยวนะ... ข้าวต้มมัดกลิ่นคาวจากป้าแก่หลังค่อม?! เหมือนที่ตาชมเล่าเรื่องตำนานกระสือคายน้ำลายใส่ของกินเลย! ผมจะลงไปก้มดูใต้แคร่ไม้ไผ่ใต้ถุนบ้านเดี๋ยวนี้!',
        },
      ]);
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
          text: 'ข้าวต้มมัดมีเมือกเขียวกับผมหงอกจริงๆ เหรอลูก?! คืนนี้มันอาจจะบินมาถึงหน้าต่างเรือนก็ได้! ไปนอนรอเวลาถึงกลางคืน (21:00+) แล้วลองไปเฝ้าดูตรงหน้าต่างฝั่งขวาทีเถอะ',
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
          text: 'พี่หนุ่ม... หน้ามันน่ากลัวมากเลย มันจ้องมาที่แก้วตรงหน้าต่างเมื่อกี้! รีบไปขอ "หนามพุทรา" จากตาชมที่ตลาดมาวางขวางหน้าต่างทีนะพี่!',
        },
      ]);
      return;
    }

    // 5) Final Act 4 reassurance before Temple Cemetery
    if (f.monkBlessedFinal && !f.comfortedSisterCrisis) {
      f.comfortedSisterCrisis = true;
      this.startDialogue([
        {
          speaker: 'น้องแก้ว',
          role: 'น้องสาวของหนุ่ม (เพิ่งผ่านนาทีเฉียดตาย)',
          portrait: 'prim',
          text: 'พี่หนุ่ม! เมื่อกี้แก้วรู้สึกหนาววูบที่อกเหมือนจะหายใจไม่ออก แล้วก็มีเสียงขู่ดังกุกกักตรงกิ่งหนามพุทราที่พี่วางไว้ริมหน้าต่าง ก่อนที่แสงสีเขียวจะพุ่งหนีไป!',
        },
        {
          speaker: 'แม่คำ',
          role: 'แม่ของหนุ่ม',
          portrait: 'vendor',
          text: 'บุญรักษานะลูก... ถ้าไม่มีหนามพุทราของหนุ่ม น้องแก้วคงแย่ไปแล้ว ตอนนี้ของขลังหลวงพี่ก็พร้อมแล้ว ไปทำพิธีสะบั้นคำสาปที่โกศหมายเลข 4 หลังวัดให้จบเสียทีนะลูก แม่กับน้องจะล็อกบ้านรออย่างปลอดภัย',
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
        text: 'เจอห่อใบตองข้าวต้มมัดที่น้องแก้วโยนทิ้งไว้แล้ว! พอลองแหวกใบตองออกดู... กลิ่นคาวตีขึ้นจมูกจนแทบอาเจียน ด้านในมีเมือกเรืองแสงสีเขียวปนเส้นผมหงอกสีขาวขดอยู่!',
      },
      {
        speaker: 'หนุ่ม',
        role: 'ขนลุกซู่ทั้งตัว!',
        portrait: 'player',
        text: 'ตำนานที่คนในตลาดเล่าไม่ใช่เรื่องแต่ง! คืนนี้ต้องขึ้นไปนอนรอให้ถึงสามทุ่มครึ่ง (21:30+) แล้วคอยเฝ้าดูตรงหน้าต่างเรือนให้เห็นกับตาว่ามันกล้าลอยมาจริงไหม!',
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
      this.startDialogue([
        {
          speaker: 'หนุ่ม (ตะลึงงัน!)',
          role: 'หน้าต่างเรือนไม้ — กลางดึก',
          portrait: 'player',
          text: 'ลมหอบใหญ่พัดบานหน้าต่างเปิดผาง!! ตรงความมืดนอกชายคา มีหัวผู้หญิงผมกระเซิงลอยเคว้งคว้าง พร้อมตับไตไส้พุงสีเขียวแดงเรืองแสงวูบวาบ แสยะปากมีคราบเลือดจ้องตรงเข้ามาหาน้องแก้ว!!',
        },
        {
          speaker: 'หนุ่ม',
          role: 'รีบกระชากบานหน้าต่างปิด!',
          portrait: 'player',
          text: 'มันกรีดร้องแผดเสียงก่อนบินวูบหายไปทางทุ่งนาวัด!! ตรงขอบหน้าต่างมีคราบเมือกเรืองแสงหยดทิ้งไว้... เรื่องเล่าของตาชมเป็นความจริงทั้งหมด! พรุ่งนี้เช้าหรือตอนนี้ต้องรีบออกไปหาตาชมขอ "หนามพุทรา" มาขวางหน้าต่างให้ได้!',
        },
      ]);
      this.saveGame();
      return;
    }

    if (this.state.inventory.includes('jujube_thorns') && !f.placedThornsAtWindow) {
      f.placedThornsAtWindow = true;
      this.removeItem('jujube_thorns');
      this.sound.playPickup();
      this.startDialogue([
        {
          speaker: 'หนุ่ม',
          role: 'หน้าต่างเรือนไม้ยกสูง',
          portrait: 'player',
          text: 'นำกิ่งหนามพุทราสดมาขัดวางเรียงใต้ขอบหน้าต่างจนแน่นหนา! จากนี้ไปผีกระสือจะลอยเฉียดเข้ามาคายน้ำลายสืบทายาทไม่ได้แล้ว — ถึงเวลาออกไปสืบความจริงจากป้าบัว เฮียตี๋ และยายสายในตลาดให้ชัดเจนว่าใครคือกระสือตัวจริง!',
        },
      ]);
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
          text: 'อ้าว ไอ้หนุ่ม! เรียนจบกรุงเทพฯ แล้วเหรอเอ็ง เก่งมากลูก ช่วงนี้กลับมาอยู่บ้านก็เดินระวังหน่อยนะเว้ย คนเฒ่าคนแก่เริ่มพูดถึงตำนานเก่าอีกแล้ว',
        },
        {
          speaker: 'หนุ่ม',
          role: 'แวะคุยฟังเรื่องเล่าชุมชน',
          portrait: 'player',
          text: 'ตำนานอะไรเหรอครับตา? ตะกี้แม่คำก็เกริ่นๆ เรื่องเมื่อ 20 ปีก่อนเหมือนกัน',
        },
        {
          speaker: 'ตาชม',
          role: 'หมอยาสมุนไพรตลาดสดบ้านทุ่ง',
          portrait: 'uncle',
          text: 'โบราณเขาเล่าเรื่อง "ผีกระสือบ้านทุ่ง"... มันไม่ได้เกิดจากผีทั่วไป แต่เกิดจากคนเล่นของสายดำที่พอใกล้หมดอายุขัย วิญญาณจะบินไปเกาะขอบหน้าต่างเรือนที่มีหญิงสาว หรือหลอกเอาของกินปนน้ำลายให้กิน เพื่อสืบทอด "ทายาทกระสือ" ต่อไปอีกทอด! แล้วของที่มันกลัวที่สุดก็คือ "กิ่งหนามพุทรา" — ฟังหูไว้หูก็แล้วกันนะเอ็ง!',
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
          text: 'หา?! มันบินมาเกาะหน้าต่างบ้านเอ็งจริงๆ เรอะ!! ...อย่ารอช้า เอากิ่ง "หนามพุทรา" กับ "ห่อว่านใบหนาด" นี่ไปขัดวางไว้ใต้หน้าต่างบ้านทันที!',
        },
        {
          speaker: 'ตาชม',
          role: 'หมอยาสมุนไพรตลาดสดบ้านทุ่ง',
          portrait: 'uncle',
          text: 'พอวางหนามพุทราเสร็จแล้ว ตาเตือนว่าให้ไปสืบให้ชัดระหว่าง "ป้าบัวแผงปลา" ที่ชอบถือไฟเขียวกลางทุ่ง กับ "ยายสายท้ายตลาด" ที่มีพฤติกรรมลับๆ ล่อๆ จะได้รู้ว่าใครคือกระสือตัวจริง!',
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
          text: 'อ้าวหนุ่ม กลับมาอยู่บ้านกับแม่คำแล้วเรอะลูก! เอานี่ปลาช่อนสดๆ ไปฝากแม่ทำแกงต้มส้มสิ... แต่ช่วงนี้เดินกลางคืนแถวคันนาระวังหน่อยนะลูก ชาวบ้านชอบเห็นแสงไฟสีเขียววาบๆ แถวป่าช้าหลังวัด',
        },
      ]);
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
          text: 'ป้าบัวครับ... คืนนั้นผมเห็นดวงไฟหัวกระสือที่หน้าต่างบ้านจริงๆ! แล้วแสงสีเขียวที่ชาวบ้านเห็นแถวทุ่งนาหลังร้านป้าล่ะครับ ใช่ป้าไหม?',
        },
        {
          speaker: 'ป้าบัว',
          role: 'แม่ค้าแผงปลาตลาดสด',
          portrait: 'vendor',
          text: 'พุทโธ่ลูก! (ป้าบัวชูไฟฉายคาดหัวเก่าๆ ให้ดู) อันนี้ไฟฉายคาดหัวLED สีเขียวอมฟ้าของป้า ป้าใส่ส่องจับกบจับเขียดตอนฝนตกต่างหาก ไม่ใช่ผีสาง! แต่ไฟดวงที่ลอยสูงยอดต้นไผ่แล้วบินหายไปทางบ้านยายสายท้ายตลาดกับป่าช้าวัดน่ะ ป้าเห็นมากับตาเมื่อตีหนึ่งคืนก่อน!',
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
          text: 'เฮ้ยหนุ่ม กลับมาบ้านเราแล้วเหรอ! เอาหมูสามชั้นกับกระดูกหมูชุดนี้ไปให้แม่คำทำกับข้าวรับขวัญเลย ไม่คิดตังค์! ...เออแต่ว่าช่วงนี้หลังตลาดแปลกๆ ว่ะ ตับหมูสดในลังกูหายทุกคืนโดยหมาไม่เห่าสักตัว',
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
          text: 'มึงเห็นกับตาเลยเรอะหนุ่ม?! งั้นกูบอกตรงๆ เลย เมื่อเย็นวันก่อนกูเห็น "ยายสาย" หญิงชราหลังค่อมแอบมายืนขูดเลือดหมูตรงรางน้ำข้างเขียง พอเห็นกูเดินมาแกก็รีบวิ่งหนีจนทำจี้กระดูกเก่าหล่นไว้... แถวนี้มีแค่ตระกูลแกที่เก็บโกศอัฐิเก่าไว้ตรงป่าช้าวัดใหญ่!',
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
        text: '(แอบชะโงกดูข้างชานเรือน) โอ่งดินใบใหญ่คลุมผ้าขาวเก่าๆ ตั้งซ่อนอยู่มุมมืด... กลิ่นคาวเลือดเหมือนกับคราบตรงหน้าต่างบ้านเราและข้าวต้มมัดไม่มีผิด!',
      },
      {
        speaker: 'ยายสาย',
        role: 'หญิงชราหลังค่อม (โผล่หน้าจากเงามืด)',
        portrait: 'narrator',
        text: 'มามุงด้อมมองอะไรหน้าบ้านกูไอ้หนุ่ม! กลับไปกอดแม่กับน้องสาวหน้าแฉล้มของมึงไว้เถอะ... อีกไม่กี่ชั่วยามร่างเก่ากูก็จะดับแล้ว ถึงเวลานั้นใครก็ขวางทายาทไม่ได้!',
      },
      {
        speaker: 'หนุ่ม',
        role: 'คิดในใจ (กำหมัดแน่น)',
        portrait: 'player',
        text: 'ชัดเลย... ยายสายคือกระสือตัวจริง! ต้องรีบเดินไปวัดป่าฝั่งขวา อ่านจารึกในศาลาอุโบสถ แล้วขึ้นกุฏิกราบขอวิธีปราบจากหลวงพี่!',
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
        text: '"เมื่อยี่สิบปีก่อน หมอตำแยประจำหมู่บ้านลักลอบรับวิชาอาคมสายดำจนกลายร่างเป็นผีกระสือ... อาคมนั้นผูกติดไว้กับผ้าซิ่นเปื้อนเลือดที่ซ่อนในโกศบรรจุอัฐิหมายเลข 4 แห่งป่าช้าหลังวัด และหากลั่นวงสายสิญจน์ปลุกเสกรอบลาน วิญญาณร้ายไม่อาจข้ามเข้ามาได้"',
      },
      {
        speaker: 'หนุ่ม',
        role: 'ได้ยินเสียงชาวบ้านตะโกนมาจากลานวัดด้านนอก!',
        portrait: 'player',
        text: 'โกศอัฐิหมายเลข 4 หลังวัดงั้นเหรอ... เดี๋ยวนะ ข้างนอกอุโบสถเหมือนตาชม ป้าบัว และเฮียตี๋เพิ่งช่วยกันปักเสาล้อม "วงสายสิญจน์" เสร็จแล้ว! ออกไปดูชาวบ้านตรงลานวัดแล้วค่อยขึ้นกุฏิปรึกษาหลวงพี่ต่อดีกว่า!',
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
      this.startDialogue([
        {
          speaker: 'ตาชม',
          role: 'ในวงสายสิญจน์ลานวัดป่า (กำธูปในมือ)',
          portrait: 'uncle',
          text: 'รีบก้าวเท้าข้ามเข้ามาในวงสายสิญจน์เร็วไอ้หนุ่ม! หลวงพี่โยงด้ายสายสิญจน์จากพระประธานในอุโบสถออกมาล้อมรอบเสาไม้ไผ่ 8 ทิศให้ชาวบ้านแล้ว!',
        },
        {
          speaker: 'เฮียตี๋ & ป้าบัว',
          role: 'ชาวบ้านในวงสายสิญจน์',
          portrait: 'tom',
          text: 'จำไว้ให้ขึ้นใจนะหนุ่ม — ตราบใดที่ยืนอยู่ใน "วงสายสิญจน์" นี้ทุกคนจะปลอดภัย ผีกระสือไม่มีวันฝ่าด้ายขาวเข้ามาได้เด็ดขาด! แต่ถ้ามึงเดินออกไปนอกวงกลางทุ่งนาเมื่อไหร่แล้วโดนไล่ รีบวิ่งกลับมาเหยียบเข้าในวงนี้ให้ทัน! เอ้านี่ รับม้วนสายสิญจน์ปลุกเสกพกติดตัวไว้ด้วย แล้วรีบขึ้นกุฏิหลวงพี่ฝั่งขวาเลย!',
        },
      ]);
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
          text: 'เจริญพรโยมหนุ่ม กลับมาอยู่บ้านคราวนี้สีหน้าสดใสขึ้นเยอะนะโยม... ขอให้ตั้งใจทำงานเลี้ยงดูมารดาและน้องสาวให้อบอุ่น',
        },
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'แต่จำคำอาตมาไว้อย่างหนึ่งโยม — ช่วงเข้าพรรษาหน้าฝนนี้ กิเลสอาคมเก่าแก่ในบ้านทุ่งกำลังปะทุ หากค่ำคืนใดพบเจอเหตุอาเพศหรือสิ่งไม่ชอบมาพากล จงกลับมาหาอาตมาที่กุฏินี้ได้ทุกเมื่อนะโยม',
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
          text: 'เจริญพรโยมหนุ่ม... อาตมาเห็นคราบเมือกและข้าวต้มมัดต้องสาปแล้ว นี่คือมนตร์ดำ "สืบสายทายาทกระสือ" ของยายสายหมอตำแยแก่ที่วิญญาณกำลังจะละสังขารเก่า',
        },
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'แต่น้ำมนต์กับมีดหมอยังไม่พอจะตัดสายใยที่โยงหาน้องสาวโยมได้ เว้นแต่โยมจะนำ "เชี่ยนหมากเงินโบราณ" ที่คนทรงแอบฝังอาคมไว้ใต้ "ศาลปู่ตาริมทุ่งนา" กลับมาให้อาตมาทำลายอาคมเสียก่อน — มันจะปรากฏรอยอาคมเฉพาะหลัง 20:30 น. จงไปนอนรอเวลาแล้วไปเอามันมาด้วยความระวังตัว!',
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
      this.startDialogue([
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'สาธุ... โยมนำเชี่ยนหมากเงินกลับมาได้ทันเวลา เห็นชื่อ "แก้ว" จารึกไว้ชัดเจน... อาตมาจะสวดถอนอาคมให้เดี๋ยวนี้!',
        },
        {
          speaker: 'หลวงพี่',
          role: 'พระวิปัสสนา กุฏิวัดป่าบ้านทุ่ง',
          portrait: 'uncle',
          text: 'โยมจงรับ "ธูปสะกดวิญญาณ" "น้ำมนต์ปลุกเสก" และ "มีดหมอลงอาคม" ไป... จำคำอาตมาให้แม่นนะโยม เมื่อไปถึง "โกศอัฐิหมายเลข 4" หลังวัด: ให้ปักธูปสะกดและสาดน้ำมนต์ล้างอาคมก่อน แล้วค่อยใช้มีดหมอฟันตัดสายใย! แวะกลับไปปลอบแม่กับน้องแก้วบนเรือนสักคำ แล้วรีบไปปิดฉากที่ป่าช้าวัดเสีย!',
        },
      ]);
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

    this.startDialogue([
      {
        speaker: 'หนุ่ม',
        role: 'ข้างศาลปู่ตากลางทุ่งนายามวิกาล',
        portrait: 'player',
        text: 'ใต้แผ่นอิฐหลังศาลปู่ตา... เจอ "เชี่ยนหมากเงินโบราณ" ที่หลวงพี่บอกจริงๆ ด้วย! พอแง้มฝาดูข้างในมีใบข่อยเขียนรายชื่อผู้รับทายาทกระสือมาสามรุ่น... บรรทัดสุดท้ายเขียนด้วยเลือดสดๆ ว่า "แก้ว"!!',
      },
      {
        speaker: 'หนุ่ม',
        role: 'ขนลุกทั้งตัว!',
        portrait: 'player',
        text: 'เฮ้ย! นั่นแสงสีเขียวลอยพุ่งมาจากยอดตาลทางขวาแล้ว!! ต้องรีบถือเชี่ยนหมากเงินกลับขึ้นกุฏิให้หลวงพี่ทำพิธีปลุกเสกของขลังเดี๋ยวนี้!',
      },
    ]);
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
    this.krasueX = 77.2;
    this.sound.playScare();

    this.startDialogue([
      {
        speaker: 'หนุ่ม',
        role: 'หน้าโกศบรรจุอัฐิหมายเลข 4',
        portrait: 'player',
        text: 'ตรงช่องฐานโกศหมายเลข 4 มี "ผ้าซิ่นอาคมเปื้อนเลือด" ม้วนซ่อนไว้จริงๆ! พอกระชากออกมา ท้องฟ้าหลังป่าช้าก็มืดครึ้มลงฉับพลัน พร้อมแสงสีเขียวแดงลอยกรีดร้องพุ่งลงมาจากยอดไม้!!',
      },
      {
        speaker: 'ผีกระสือ (ร่างวิญญาณ)',
        role: 'หน้าโกศบรรจุอัฐิ',
        portrait: 'prim',
        text: 'มึงบังอาจมาแตะผ้าซิ่นต้นตระกูลกู!! ตอบมาสิว่าใครคือเจ้าของร่างที่ส่งต่อมนตร์ดำนี้ และเหตุใดจึงหมายหัวบ้านมึง?!',
        choices: [
          {
            label: 'ยายสาย หมอตำแยท้ายตลาด! หวังสืบทอดทายาทกระสือให้น้องสาวผม (น้องแก้ว)',
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
        text: 'รู้จักชื่อกูแล้วยังไง! สายเลือดในเชี่ยนหมากกำลังจะสูบวิญญาณน้องมึงอยู่แล้ว ไอ้หนุ่มจากเมืองกรุงจะทำอะไรได้!!',
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
              this.triggerEnding(perfect ? 'true' : 'normal');
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
        this.closeModal();
        this.updateHUD();
        this.saveGame();
        this.showToast('พักผ่อนเต็มอิ่ม รู้สึกสดชื่นขึ้นมาก');
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
    this.state.flashlightOn = !this.state.flashlightOn;
    this.btnFlashlight.classList.toggle('active', this.state.flashlightOn);
    this.touchFlashlight.classList.toggle('active', this.state.flashlightOn);
    this.touchFlashlight.textContent = this.state.flashlightOn ? '🔦✓' : '🔦';
  }

  private renderInventory(): void {
    this.invBar.innerHTML = '';
    this.state.inventory.forEach((id, idx) => {
      const item = CH2_ITEMS[id];
      if (!item) return;
      let url = this.iconCache.get(id);
      if (!url) {
        url = drawCh2ItemIconDataUrl(id);
        this.iconCache.set(id, url);
      }
      const btn = document.createElement('button');
      btn.className = 'inv-slot';
      if (id === 'bicycle' && this.ridingBike) btn.classList.add('active');
      btn.title = `${item.name}: ${item.description}`;
      btn.innerHTML = `<span class="inv-num">${idx + 1}</span><span class="inv-icon"><img class="inv-img" src="${url}" alt="${item.name}"/></span><span class="inv-name">${id === 'bicycle' && this.ridingBike ? 'กำลังปั่น [B]' : item.name}</span>`;
      btn.addEventListener('click', () => this.useItem(id));
      this.invBar.appendChild(btn);
    });
  }

  private tryInteract(): void {
    const found = this.getNearestInteractable();
    if (found) found.onInteract();
  }

  private getNearestInteractable(): Ch2Interactable | null {
    let best: Ch2Interactable | null = null;
    let bestD = Infinity;
    for (const item of this.interactables) {
      if ((item.room ?? 'outside') !== this.currentRoom) continue;
      if (item.id === 'ch2_bicycle' && this.state.inventory.includes('bicycle')) continue;
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
    this.openModal(`สมุดสืบเรื่องผีกระสือ (${this.state.clues.length}/${Object.keys(CH2_CLUES).length})`, clues);
  }

  private openMapModal(): void {
    this.sound.playUIClick();
    this.openModal(
      'แผนผังบ้านทุ่ง (Chapter 2)',
      `
      <div class="map-floor"><strong>โค้งต้นตะเคียน & ปากหมู่บ้าน (-105 .. -62): สิ่งลี้ลับ & ท่ารถ</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ศาลเจ้าแม่ตะเคียนคู่ผูกผ้าเจ็ดสี (-96.5) • ท่ารถสองแถว (-82) • ลุงทิดขี้เมาเดินโซเซ</div></div>
      <div class="map-floor"><strong>ตลาดใหญ่บ้านทุ่ง (-60 .. -24): ของกิน, ชาวบ้านเดินจับจ่าย & สืบคดี</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ส้มตำแม่ลำไย (-56.5) • บ้านยายสาย (-52) • ผักสด • เขียงหมู (-44) • ผ้าขาวม้า • ป้าบัว (-36) • น้ำแข็งไส • ตาชม (-28)</div></div>
      <div class="map-floor"><strong>ตรงกลาง (-20 .. +25): บ้านไม้ยกสูง, ทุ่งนา, ควาย & ท่าน้ำหว่านแห</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ใต้ถุนบ้าน • บันไดเรือนพบแม่คำ & น้องแก้ว • นาข้าว • ศาลปู่ตา (+17.5) • ท่าน้ำ (+20.4) • ป้ายรถวัดป่า (+25.2)</div></div>
      <div class="map-floor"><strong>วัดป่าบ้านทุ่ง (+26.5 .. +59): เขตอภัยทาน & วงสายสิญจน์</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ซุ้มมณฑป (+26.5) • วงสายสิญจน์ (+31.8) • พระอุโบสถเข้าด้านในได้ (+40.5) • กุฏิหลวงพี่ (+54.5)</div></div>
      <div class="map-floor"><strong>ลานงานวัด & สุสาน (+62 .. +115): ชิงช้าสวรรค์ & โกศหมายเลข 4</strong><div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">ปาลูกโป่ง (+65.5) • ชิงช้าสวรรค์ (+76) • เวทีรำวงหมอลำ (+87.8) • ซุ้มประตูป่าช้า (+95.5) • โกศหมายเลข 4 (+110.5)</div></div>
      `
    );
  }

  private interactTakianShrine(): void {
    this.sound.playClueChime();
    if (!this.state.flags.inspectedTakian) {
      this.state.flags.inspectedTakian = true;
      this.addClue('takian_clue');
      this.addItem('takian_charm');
      this.startDialogue([
        {
          speaker: 'เสียงกระซิบจากใต้ต้นตะเคียนคู่',
          role: 'สิ่งลี้ลับปากหมู่บ้าน',
          portrait: 'narrator',
          text: 'ลมเย็นยะเยือกพัดผ้าเจ็ดสีปลิวไสว กลิ่นดอกมะลิปนธูปโบราณโชยมา... ใต้โคนไม้มีผ้าเจ็ดสีพันม้วนเล็กๆ วางอยู่ พร้อมภาพนิมิตแวบหนึ่งถึงคืนที่หมอตำแยแก่แอบทำพิธีมืดตรงโกศอัฐิหลังวัด',
        },
        {
          speaker: 'หนุ่ม',
          role: 'ลูกชายคนโต',
          portrait: 'player',
          text: 'เจ้าแม่ตะเคียนทองกำลังเตือนเราแน่ๆ... เก็บผ้าเจ็ดสีนี้ติดตัวไว้คุ้มกันสติ แล้วรีบเช็กโกศหมายเลข 4 หลังงานวัดป่าให้ได้!',
        },
      ]);
    } else {
      this.showToast('พวงมาลัยและผ้าเจ็ดสีปลิวไหวเบาๆ เหมือนกำลังคุ้มครองคุณอยู่');
    }
  }

  private openSongthaewTransitModal(): void {
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
        this.state.x = dest;
        this.sound.playVehicleHorn();
        this.closeModal();
        this.updateHUD();
        this.saveGame();
        this.showToast('นั่งรถสองแถวมาถึงจุดหมายเรียบร้อย!');
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
        text: 'อึ้ก... ไอ้หนุ่มกลับมาบ้านเรอะ! เมื่อคืนข้านั่งก๊งอยู่ตรงท่ารถ รอรถสองแถว... รถแห่ขับช้าๆ ผ่านไปปุ๊บ ข้าเห็นหัวคนมีไส้เขียวๆ ลอยสวนไฟหน้ารถเข้าไปทางบ้านเรือนไทยเลยเว้ย!',
      },
      {
        speaker: 'หนุ่ม',
        role: 'ลูกชายคนโต',
        portrait: 'player',
        text: 'ลุงเห็นจริงๆ เหรอครับ? งั้นแสดงว่าไม่ใช่แค่คนลือ — ระวังตัวด้วยนะครับลุงทิด รีบเข้าบ้านก่อนดึกนะ!',
      },
    ]);
  }

  private interactSomtamStall(): void {
    this.sound.playUIClick();
    if (!this.state.flags.ateSomtam) {
      this.state.flags.ateSomtam = true;
      this.adjustSanity(25);
      this.startDialogue([
        {
          speaker: 'แม่ลำไย',
          role: 'แม่ค้าส้มตำครกไม้-ไก่ย่าง',
          portrait: 'vendor',
          text: 'อ้าวหนุ่ม! กลับจากกรุงเทพฯ แล้วเหรอ มาๆ กินส้มตำปูปลาร้ากับไก่ย่างร้อนๆ ให้หายเหนื่อย แม่แถมข้าวเหนียวห่อนึงเลย (+25 สติ) ช่วงนี้ตลาดคึกคักแต่อย่าเดินเลยไปแถวบ้านยายสายตอนมืดล่ะ!',
        },
      ]);
    } else {
      this.showToast('แม่ลำไยตำส้มตำครกไม้เสียงดังโป๊กๆ กลิ่นไก่ย่างหอมฟุ้งไปทั่วตลาด');
    }
  }

  private interactTempleFair(): void {
    this.sound.playUIClick();
    if (!this.state.flags.visitedFair) {
      this.state.flags.visitedFair = true;
      this.adjustSanity(15);
      this.addClue('fair_rumor');
      this.startDialogue([
        {
          speaker: 'โฆษกงานวัด & ชาวบ้าน',
          role: 'ลานงานบุญวัดป่าบ้านทุ่ง',
          portrait: 'tom',
          text: 'ม่วนซื่นโฮแซว! มาปาลูกโป่งสอยดาวขึ้นชิงช้าสวรรค์กันจ้า! (เดินชมงานวัดใจชื้นขึ้น +15 สติ)... แต่ขอเตือนนะหนุ่ม พอเลยสี่ทุ่มไฟเวทีหมอลำเบาลง อย่าเดินข้ามซุ้มประตูไปป่าช้าหลังวัดคนเดียวเด็ดขาด!',
        },
      ]);
    } else {
      this.adjustSanity(5);
      this.showToast('แสงไฟชิงช้าสวรรค์และเสียงกลองรำวงช่วยให้ใจชื้นขึ้น (+5 สติ) — ด้านขวาเลยไปคือซุ้มประตูป่าช้า');
    }
  }

  private interactRotHae(): void {
    this.sound.playUIClick();
    this.adjustSanity(10);
    this.showToast('🔊 เสียงหมอลำรถแห่บ้านทุ่งกระหึ่ม! ชาวบ้านเต้นตามขบวนอย่างสนุกสนาน (+10 สติ)');
  }

  private getNavigationGuide(): { text: string; direction: string } {
    const f = this.state.flags;
    const h = this.state.gameMinutes / 60;
    const isNight = h >= 20.5 || h < 5.5;
    let targetRoom: Ch2RoomId = 'outside';
    let targetX = 5.0;
    let text = '';

    if (!f.bondedWithFamilyDay1) {
      if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.0;
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
        text = 'เดินตลาดสดแวะคุยฟังเรื่องเล่าชุมชนจากตาชมแผงสมุนไพร';
      } else if (!f.askedFishFolkloreDay1) {
        targetRoom = 'outside';
        targetX = -36.0;
        text = 'แวะทักทายป้าบัวแผงปลาสดในตลาด';
      } else if (!f.boughtPorkDay1) {
        targetRoom = 'outside';
        targetX = -44.0;
        text = 'รับหมูสดจากเฮียตี๋เขียงหมูกลับไปให้แม่ทำกับข้าว';
      } else if (!f.greetedMonkDay1) {
        if (this.currentRoom !== 'kuti') {
          targetRoom = 'outside';
          targetX = 54.5;
          text = 'เดินไปทางขวาแวะกราบสวัสดีหลวงพี่ที่กุฏิวัดป่า';
        } else {
          targetRoom = 'kuti';
          targetX = 1.8;
          text = 'กราบสวัสดีหลวงพี่ในกุฏิ';
        }
      } else if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.0;
        text = 'กลับขึ้นบ้านไม้ยกสูงนำของสดให้แม่คำทำมื้อเย็นด้วยกัน';
      } else {
        targetRoom = 'stilt_house';
        targetX = -1.2;
        text = 'กินข้าวเย็นพร้อมหน้ากับแม่คำและน้องแก้ว';
      }
    } else if (!f.checkedUnderHouse) {
      targetRoom = 'outside';
      targetX = -1.8;
      text = 'ลงมาตรวจดูใต้แคร่ไม้ไผ่ใต้ถุนบ้านหาข้าวต้มมัดปริศนา';
    } else if (!f.sawKrasueAtWindow) {
      if (!isNight) {
        if (this.currentRoom !== 'stilt_house') {
          targetRoom = 'outside';
          targetX = 5.0;
          text = 'ขึ้นบ้านไม้ยกสูงนอนรอเวลาจนถึงกลางคืน (21:40)';
        } else {
          targetRoom = 'stilt_house';
          targetX = 4.0;
          text = 'กดนอนบนเสื่อรอถึงสามทุ่มครึ่ง (21:40)';
        }
      } else if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.0;
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
        targetX = 5.0;
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
          targetX = 5.0;
          text = 'นอนรอเวลาถึงสามทุ่มครึ่ง (21:40) บนเรือนไม้ยกสูง';
        } else {
          targetRoom = 'stilt_house';
          targetX = 4.0;
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
        targetX = 5.0;
        text = 'รีบขึ้นไปดูอาการน้องแก้วและแม่คำบนเรือนก่อนเข้าป่าช้าวัด';
      } else {
        targetRoom = 'stilt_house';
        targetX = -1.2;
        text = 'ปลอบขวัญน้องแก้วและแม่คำ';
      }
    } else if (!isNight) {
      if (this.currentRoom !== 'stilt_house') {
        targetRoom = 'outside';
        targetX = 5.0;
        text = 'นอนรอถึงเวลา 21:40 น. บนเรือนไม้ยกสูง';
      } else {
        targetRoom = 'stilt_house';
        targetX = 4.0;
        text = 'รอเวลาถึงกลางคืน (21:40)';
      }
    } else {
      targetRoom = 'outside';
      targetX = 110.5;
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
      const canMove = !this.modalOpen && this.activeDialogue.length === 0;
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
      if (isMoving) {
        if (moveX !== 0) this.facing = moveX > 0 ? 1 : -1;
        const speed = this.ridingBike && this.currentRoom === 'outside' ? 10.8 : 4.6;
        const roomLimit = this.currentRoom === 'temple_sala' ? 6.0 : 5.1;
        const minX = this.currentRoom !== 'outside' ? -roomLimit : CH2_MIN_X;
        const maxX = this.currentRoom !== 'outside' ? roomLimit : CH2_MAX_X;
        this.state.x = Math.max(minX, Math.min(maxX, this.state.x + moveX * speed * dt));
        // Keep player cleanly on road / inside floor walkway (never clipping behind building platforms!)
        const minZ = this.currentRoom !== 'outside' ? -0.15 : 0.25;
        const maxZ = this.currentRoom !== 'outside' ? 1.55 : 2.0;
        this.playerZ = Math.max(minZ, Math.min(maxZ, this.playerZ + moveZ * (this.ridingBike ? 3.2 : 2.1) * dt));
        this.updateHUD();
        if (!this.ridingBike) {
          this.stepTimer -= dt;
          if (this.stepTimer <= 0) {
            this.stepTimer = 0.28;
            this.sound.playFootstep(this.currentRoom === 'stilt_house' ? 'wood' : 'concrete');
          }
        }
      }

      const prevMin = Math.floor(this.state.gameMinutes);
      this.state.gameMinutes = (this.state.gameMinutes + dt * 1.4) % 1440;
      if (Math.floor(this.state.gameMinutes) !== prevMin) this.updateHUD();

      this.autoSaveTimer -= dt;
      if (this.autoSaveTimer <= 0) {
        this.autoSaveTimer = 5;
        this.saveGame();
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
        (this.state.x >= -4 && this.state.x <= 4);

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

      this.sound.updateAmbience(dt, this.state.weather, period, this.state.sanity, 0 as FloorIndex, this.krasueChase);
      this.sound.updateIsaanAmbience(dt, period, this.currentRoom === 'outside', this.krasueChase);
      this.sound.updateRotHaeMusic(
        dt,
        Math.abs(this.state.x - this.world.getRotHaeX()),
        this.currentRoom === 'outside',
        this.krasueChase
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
        this.krasueX
      );
    }
  }
}
