import { drawCharacterCanvas, CharacterKind } from '../art/SpriteFactory';
import { drawItemIconDataUrl } from '../art/TextureFactory';
import { SoundEngine } from '../audio/SoundEngine';
import { CLUES, DORM_RULES, FLOOR_NAMES, ITEMS } from '../data/storyData';
import {
  DialogueLine,
  EndingType,
  FloorIndex,
  GameFlags,
  InteractableDef,
  RoomId,
  SaveState,
  TimePeriod,
  WeatherType,
} from '../types';
import { DormWorld, STAIR_X, STREET_MIN_X, WORLD_MAX_X, WORLD_MIN_X } from '../world/DormWorld';

const SAVE_KEY = 'reuan_chan_dorm_save_v1';
const SESSION_ACTIVE_KEY = 'reuan_chan_active_session';

function safeStorageGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage quota or private mode errors
  }
}

const DEFAULT_FLAGS = (): GameFlags => ({
  talkedToUncleIntro: false,
  gotRoom202Key: false,
  checkedMailbox: false,
  mailboxUnlocked: false,
  gotStorageKey: false,
  storageUnlocked: false,
  gaveUncleCoffee: false,
  uncleSecretRevealed: false,
  offeredRedFanta: false,
  sawBathroomGhost: false,
  confrontedTomDay: false,
  confrontedTomNight: false,
  breakerTripped: false,
  breakerFixedCount: 0,
  gotHolyThread: false,
  gotScrewdriver: false,
  room204BoxUnlocked: false,
  checkedRoom304Chair: false,
  gotCctvCard: false,
  gotPrimDiary: false,
  gotVoiceRecorder: false,
  gotTalisman: false,
  unlockedFloor3: false,
  unlockedRoom304: false,
  insideRoom304: false,
  endingReached: null,
});

export class GameEngine {
  private world: DormWorld;
  private sound: SoundEngine;
  private state: SaveState;

  private running = false;
  private rafStarted = false;
  private rafId = 0;
  private ac = new AbortController();
  private onStartChapter2?: () => void;
  private paused = false;
  private lastTime = 0;

  private playerZ = 0.45;
  private currentRoom: RoomId = 'outside';
  private outsideReturnX = -11.2;
  private facing: 1 | -1 = 1;
  private codes = new Set<string>();
  private touchMoveDir: -1 | 0 | 1 = 0;
  private stepTimer = 0;
  private weatherTimer = 55;
  private stairCooldown = 0;
  private autoSaveTimer = 5;

  // Rules & Ghost Chase state
  private primShowTimer = 0;
  private primPos: { x: number; floor: FloorIndex } = { x: -2.5, floor: 2 };
  private chaseActive = false;
  private chaseTimer = 0;
  private chaseCooldown = 0;
  private darkRuleTimer = 0;
  private shineAtGhostTimer = 0;
  private floor3RuleCooldown = 0;

  // Drunk Zombie Hallucination Mode state
  private drunkMode = false;
  private drunkKills = 0;
  private gunCooldown = 0;
  private gunFlashTimer = 0;
  private gunBeamEndX = 0;
  private zombieGroanTimer = 1.6;
  private zombies: {
    x: number;
    floor: FloorIndex;
    alive: boolean;
    dir: 1 | -1;
    speed: number;
    respawnTimer: number;
  }[] = [];

  // Dialogue & Modal state
  private activeDialogue: DialogueLine[] = [];
  private dialogueIndex = 0;
  private modalOpen = false;
  private iconUrlCache = new Map<string, string>();
  private interactables: InteractableDef[] = [];

  // DOM references
  private hudTop = document.getElementById('hud-top')!;
  private invBar = document.getElementById('inventory-bar')!;
  private mobileControls = document.getElementById('mobile-controls')!;
  private interactPrompt = document.getElementById('interact-prompt')!;
  private interactLabel = document.getElementById('interact-label')!;
  private chaseBanner = document.getElementById('chase-banner')!;
  private drunkBanner = document.getElementById('drunk-banner')!;
  private drunkStatusText = document.getElementById('drunk-status-text')!;
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
  private touchShoot = document.getElementById('touch-shoot')!;

  constructor(canvas: HTMLCanvasElement, sharedSound?: SoundEngine, onStartChapter2?: () => void) {
    this.world = new DormWorld(canvas);
    this.sound = sharedSound ?? new SoundEngine();
    this.onStartChapter2 = onStartChapter2;
    this.state = this.createNewState();

    this.world.onThunder(() => {
      this.sound.playThunder();
      if (this.state.floor >= 1 && Math.random() < 0.35 && !this.state.flags.breakerTripped) {
        this.state.flags.breakerTripped = true;
        this.showToast('ไฟทั้งตึกดับพรึ่บลงหลังเสียงฟ้าผ่า... ต้องเปิดไฟฉายแล้วลงไปดูคัตเอาต์ชั้น 1', true);
      }
      if (this.state.floor >= 2 && Math.random() < 0.45 && !this.chaseActive) {
        this.triggerPrimFlash(this.state.x > 0 ? -7.5 : 7.5, this.state.floor, 2.2);
      }
    });

    this.setupInteractables();
    this.bindInputs();
  }

  private createNewState(): SaveState {
    return {
      version: 1,
      gameMinutes: 17 * 60 + 25,
      day: 1,
      weather: 'windy',
      floor: 0,
      x: -11.2,
      sanity: 100,
      flashlightOn: false,
      inventory: ['inhaler'],
      clues: [],
      flags: DEFAULT_FLAGS(),
    };
  }

  public hasSave(): boolean {
    return Boolean(safeStorageGet(localStorage, SAVE_KEY));
  }

  public shouldAutoResume(): boolean {
    return safeStorageGet(sessionStorage, SESSION_ACTIVE_KEY) === '1' && this.hasSave();
  }

  public startNewGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    this.state = this.createNewState();
    this.currentRoom = 'outside';
    this.chaseActive = false;
    this.primShowTimer = 0;
    this.saveGame();
    this.beginPlay();
    this.startDialogue([
      {
        speaker: 'ต้น',
        role: 'นักศึกษาปี 2',
        portrait: 'player',
        text: 'ซอยลึกเอาเรื่องแฮะ... แต่หอนี้ค่าเช่าถูกกว่าที่อื่นเกือบครึ่ง เดินเข้าม. ก็แป๊บเดียว',
      },
      {
        speaker: 'ต้น',
        role: 'นักศึกษาปี 2',
        portrait: 'player',
        text: 'ลมเริ่มแรงแล้ว เดี๋ยวแวะไปรับกุญแจห้อง 202 กับลุงยามตรงป้อมหน้าหอก่อนดีกว่า',
      },
    ]);
  }

  public continueGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    const raw = safeStorageGet(localStorage, SAVE_KEY);
    if (!raw) {
      this.startNewGame();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SaveState;
      this.state = {
        ...this.createNewState(),
        ...parsed,
        flags: { ...DEFAULT_FLAGS(), ...(parsed.flags || {}) },
      };
    } catch {
      this.state = this.createNewState();
    }
    this.currentRoom = 'outside';
    this.chaseActive = false;
    this.primShowTimer = 0;
    this.beginPlay();
    this.showToast('โหลดข้อมูลล่าสุดเรียบร้อย');
  }

  private beginPlay(): void {
    safeStorageSet(sessionStorage, SESSION_ACTIVE_KEY, '1');
    document.documentElement.classList.remove('resuming');
    document.getElementById('title-screen')?.classList.add('hidden');
    this.hudTop.classList.remove('hidden');
    this.invBar.classList.remove('hidden');

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
    if (isTouch) {
      this.mobileControls.classList.remove('hidden');
    }

    this.running = true;
    this.lastTime = performance.now();
    this.renderInventory();
    this.updateHUD();
    if (!this.rafStarted) {
      this.rafStarted = true;
      this.rafId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  public destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ac.abort();
    this.chaseBanner.classList.add('hidden');
    this.drunkBanner.classList.add('hidden');
    this.touchShoot.classList.add('hidden');
    this.sanityOverlay.classList.remove('drunk-mode');
    this.world.dispose();
  }

  public saveGame(silent = true): void {
    const toSave: SaveState =
      this.currentRoom === 'outside'
        ? this.state
        : { ...this.state, x: this.outsideReturnX };
    safeStorageSet(localStorage, SAVE_KEY, JSON.stringify(toSave));
    if (!silent) this.showToast('บันทึกความคืบหน้าแล้ว');
  }

  private bindInputs(): void {
    const sig = { signal: this.ac.signal };
    window.addEventListener('resize', () => this.world.resize(), sig);
    window.addEventListener('blur', () => this.codes.clear(), sig);

    window.addEventListener('keydown', (e) => {
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

      if (code === 'Space' && this.drunkMode) {
        e.preventDefault();
        this.shootZombieGun();
        return;
      }
      if (code === 'KeyJ' && this.drunkMode) {
        e.preventDefault();
        this.shootZombieGun();
        return;
      }
      if (code === 'KeyO' && this.drunkMode) {
        e.preventDefault();
        this.endDrunkZombieMode();
        return;
      }
      if (code === 'KeyE' || code === 'Space') {
        e.preventDefault();
        this.tryInteract();
      } else if (code === 'KeyW' || code === 'ArrowUp') {
        if (Math.abs(this.state.x - STAIR_X) <= 1.55) {
          this.tryChangeFloor(1);
        }
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        if (Math.abs(this.state.x - STAIR_X) <= 1.55) {
          this.tryChangeFloor(-1);
        }
      } else if (code === 'KeyF') {
        this.toggleFlashlight();
      } else if (code === 'KeyR') {
        this.openRulesModal();
      } else if (code === 'KeyN') {
        this.openNotebookModal();
      } else if (code === 'KeyM') {
        this.openMapModal();
      } else if (code.startsWith('Digit')) {
        const idx = Number(code.replace('Digit', '')) - 1;
        if (idx >= 0 && idx < 9 && this.state.inventory[idx]) {
          this.useInventoryItem(this.state.inventory[idx]);
        }
      }
    }, sig);

    window.addEventListener('keyup', (e) => {
      this.codes.delete(e.code);
    }, sig);

    const blurActive = () => (document.activeElement as HTMLElement | null)?.blur();
    this.btnFlashlight.addEventListener('click', () => {
      blurActive();
      this.toggleFlashlight();
    }, sig);
    document.getElementById('btn-rules')!.addEventListener('click', () => {
      blurActive();
      this.openRulesModal();
    }, sig);
    document.getElementById('btn-notebook')!.addEventListener('click', () => {
      blurActive();
      this.openNotebookModal();
    }, sig);
    document.getElementById('btn-map')!.addEventListener('click', () => {
      blurActive();
      this.openMapModal();
    }, sig);
    this.btnSound.addEventListener('click', () => {
      blurActive();
      this.sound.init();
      const next = !this.sound.isMuted();
      this.sound.setMuted(next);
      this.btnSound.textContent = next ? 'เสียง: ปิด' : 'เสียง: เปิด';
    }, sig);

    this.dialogueBox.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.choice-btn')) return;
      this.advanceDialogue();
    }, sig);

    document.getElementById('modal-close')!.addEventListener('click', () => this.closeModal(), sig);
    this.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.modalBackdrop) this.closeModal();
    }, sig);

    const bindHoldBtn = (id: string, dir: -1 | 1) => {
      const btn = document.getElementById(id)!;
      const start = (ev: Event) => {
        ev.preventDefault();
        this.sound.init();
        this.touchMoveDir = dir;
        btn.classList.add('pressed');
      };
      const end = (ev: Event) => {
        ev.preventDefault();
        if (this.touchMoveDir === dir) this.touchMoveDir = 0;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', start, sig);
      btn.addEventListener('pointerup', end, sig);
      btn.addEventListener('pointercancel', end, sig);
      btn.addEventListener('pointerleave', end, sig);
    };

    bindHoldBtn('touch-left', -1);
    bindHoldBtn('touch-right', 1);

    document.getElementById('touch-interact')!.addEventListener('click', () => {
      this.sound.init();
      if (this.activeDialogue.length > 0) {
        this.advanceDialogue();
      } else {
        this.tryInteract();
      }
    }, sig);

    this.touchUp.addEventListener('click', () => {
      this.sound.init();
      this.tryChangeFloor(1);
    }, sig);
    this.touchDown.addEventListener('click', () => {
      this.sound.init();
      this.tryChangeFloor(-1);
    }, sig);
    this.touchShoot.addEventListener('click', () => {
      this.sound.init();
      this.shootZombieGun();
    }, sig);
    document.getElementById('btn-sober-up')?.addEventListener('click', () => {
      this.sound.init();
      if (this.drunkMode) this.endDrunkZombieMode();
    }, sig);
    this.world.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (e.button === 0 && this.drunkMode && !this.modalOpen && this.activeDialogue.length === 0) {
        this.sound.init();
        this.shootZombieGun();
      }
    });
  }

  private toggleFlashlight(): void {
    this.sound.init();
    this.sound.playSwitchClick();
    this.state.flashlightOn = !this.state.flashlightOn;
    this.btnFlashlight.classList.toggle('active', this.state.flashlightOn);
  }

  private addItem(itemId: string): void {
    if (!this.state.inventory.includes(itemId)) {
      this.state.inventory.push(itemId);
      this.sound.playPickup();
      this.renderInventory();
      this.showToast(`เก็บไอเทม: ${ITEMS[itemId].name}`);
      this.saveGame();
    }
  }

  private removeItem(itemId: string): void {
    this.state.inventory = this.state.inventory.filter((id) => id !== itemId);
    this.renderInventory();
    this.saveGame();
  }

  private addClue(clueId: string): void {
    if (!this.state.clues.includes(clueId)) {
      this.state.clues.push(clueId);
      this.sound.playClueChime();
      this.showToast(`จดบันทึกใหม่: ${CLUES[clueId].title}`);
      this.saveGame();
    }
  }

  private adjustSanity(delta: number): void {
    this.state.sanity = Math.max(0, Math.min(100, Math.round(this.state.sanity + delta)));
    this.updateHUD();

    if (this.state.sanity === 0 && !this.state.flags.endingReached) {
      this.chaseActive = false;
      this.chaseBanner.classList.add('hidden');
      if (this.state.floor === 3) {
        this.triggerEnding('bad');
      } else {
        this.state.sanity = 55;
        this.state.floor = this.state.flags.gotRoom202Key ? 2 : 0;
        this.state.x = this.state.floor === 2 ? -9.5 : -8.0;
        this.state.gameMinutes = (this.state.gameMinutes + 120) % 1440;
        this.showToast('ภาพตรงหน้าดับวูบลง... รู้สึกตัวอีกทีก็มานั่งหอบอยู่ในที่ปลอดภัยแล้ว', true);
      }
    }
  }

  private startGhostChase(reason: string, spawnX?: number): void {
    if (this.chaseActive || this.chaseCooldown > 0) return;
    this.chaseActive = true;
    this.chaseTimer = 14;
    this.primPos = {
      x: spawnX ?? (this.state.x > 0 ? Math.max(-12.5, this.state.x - 6.5) : Math.min(12.5, this.state.x + 6.5)),
      floor: this.state.floor,
    };
    this.primShowTimer = 14;
    this.sound.playScare();
    this.scareFlash.classList.add('active');
    setTimeout(() => this.scareFlash.classList.remove('active'), 240);
    this.chaseBanner.classList.remove('hidden');
    this.showToast(reason, true);
  }

  private stopGhostChase(safeMessage?: string): void {
    this.chaseActive = false;
    this.primShowTimer = 0;
    this.chaseCooldown = 10;
    this.chaseBanner.classList.add('hidden');
    if (safeMessage) this.showToast(safeMessage);
  }

  private triggerScare(sanityLoss: number, message: string, ghostFloor?: FloorIndex, ghostX?: number): void {
    this.sound.playScare();
    this.scareFlash.classList.add('active');
    setTimeout(() => this.scareFlash.classList.remove('active'), 260);
    if (ghostFloor !== undefined && ghostX !== undefined) {
      this.triggerPrimFlash(ghostX, ghostFloor, 2.2);
    }
    this.adjustSanity(-sanityLoss);
    this.showToast(message, true);
  }

  private triggerPrimFlash(x: number, floor: FloorIndex, duration: number): void {
    this.primPos = { x, floor };
    this.primShowTimer = duration;
  }

  private getItemIconUrl(itemId: string): string {
    let url = this.iconUrlCache.get(itemId);
    if (!url) {
      url = drawItemIconDataUrl(itemId);
      this.iconUrlCache.set(itemId, url);
    }
    return url;
  }

  private renderInventory(): void {
    this.invBar.innerHTML = '';
    if (this.state.inventory.length === 0) {
      this.invBar.innerHTML = '<span style="font-size:0.8rem;color:#8892a8;padding:6px 10px">กระเป๋าว่างเปล่า</span>';
      return;
    }

    this.state.inventory.forEach((itemId, idx) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const btn = document.createElement('button');
      btn.className = 'inv-slot';
      btn.title = `${item.name}: ${item.description}`;
      const imgUrl = this.getItemIconUrl(itemId);
      btn.innerHTML = `
        <span class="inv-num">${idx + 1}</span>
        <span class="inv-icon"><img class="inv-img" src="${imgUrl}" alt="${item.name}" /></span>
        <span class="inv-name">${item.name}</span>
      `;
      btn.addEventListener('click', () => this.useInventoryItem(itemId));
      this.invBar.appendChild(btn);
    });
  }

  private useInventoryItem(itemId: string): void {
    const item = ITEMS[itemId];
    if (!item) return;
    this.sound.playUIClick();

    if (itemId === 'inhaler') {
      if (this.state.sanity >= 100) {
        this.showToast('ตอนนี้ยังโอเคอยู่ เก็บยาดมไว้ใช้ตอนจำเป็นดีกว่า');
        return;
      }
      this.adjustSanity(35);
      this.removeItem('inhaler');
      this.showToast('สูดยาดมเข้าไปเต็มปอด รู้สึกใจเย็นลงเยอะเลย (+35 Sanity)');
      return;
    }

    if (itemId === 'snack_bread') {
      this.adjustSanity(20);
      this.removeItem('snack_bread');
      this.showToast('กินขนมปังกับไส้กรอกเซเว่นรองท้อง อร่อยใช้ได้เลย (+20 สติ)');
      return;
    }

    if (itemId === 'drinking_water') {
      this.adjustSanity(15);
      this.removeItem('drinking_water');
      this.showToast('ดื่มน้ำเย็นล้างหน้าชื่นใจ (+15 สติ)');
      return;
    }

    if (itemId === 'soda_can') {
      this.adjustSanity(25);
      this.removeItem('soda_can');
      this.showToast('ซดน้ำอัดลมซ่าเย็นเจี๊ยบ น้ำตาลพุ่งจนตาสว่าง (+25 สติ)');
      return;
    }

    if (itemId === 'thai_liquor') {
      if (this.drunkMode) {
        this.showToast('แค่ตอนนี้ก็เมาจนเห็นซอมบี้ทั้งหอแล้ว!');
        return;
      }
      this.removeItem('thai_liquor');
      this.startDrunkZombieMode();
      return;
    }

    if (itemId === 'wire_cutter') {
      if (this.currentRoom === 'outside' && this.state.floor === 2 && Math.abs(this.state.x - STAIR_X) <= 2.2) {
        this.cutFloor3Chain();
      } else {
        this.showToast('คีมตัดเหล็ก — เดินไปที่บันไดทางขึ้นชั้น 3 (บนชั้น 2 ฝั่งขวา) แล้วกด [E] เพื่อตัดโซ่');
      }
      return;
    }

    this.showToast(`${item.name} — ${item.description}`);
  }

  private cutFloor3Chain(): void {
    if (this.state.flags.unlockedFloor3) {
      this.showToast('โซ่ทางขึ้นชั้น 3 ถูกตัดออกแล้ว');
      return;
    }
    if (!this.state.inventory.includes('wire_cutter')) {
      this.showToast('บันไดขึ้นชั้น 3 มีโซ่เหล็กคล้องกุญแจแน่น! ต้องหา "คีมตัดเหล็ก" จากห้องเก็บของชั้น 1');
      return;
    }
    this.state.flags.unlockedFloor3 = true;
    this.sound.playSwitchClick();
    this.showToast('แกร๊ก! ใช้คีมตัดเหล็กตัดโซ่คล้องทางขึ้นชั้น 3 ขาดแล้ว — กด [W] เพื่อขึ้นชั้น 3');
    this.saveGame();
  }

  private setupInteractables(): void {
    this.interactables = [
      // FLOOR 0
      {
        id: 'uncle_chai',
        floor: 0,
        x: -8.5,
        range: 1.75,
        label: 'คุยกับลุงชัย (ยาม)',
        onInteract: () => this.interactUncle(),
      },
      {
        id: 'dorm_sign',
        floor: 0,
        x: -1.5,
        range: 1.6,
        label: 'ดูป้ายหน้าหอพัก',
        onInteract: () => {
          if (this.state.sanity < 45) {
            this.showToast('แสงไฟตกกระทบป้ายไม้จนอ่านเพี้ยนเป็นคำอื่น... รีบเดินเข้าตึกดีกว่า', true);
          } else {
            this.showToast('ป้ายไม้เก่า "หอพักเรือนจันทร์ ซอย 9" สีซีดจางจนแทบมองไม่ออกในความมืด');
          }
        },
      },
      {
        id: 'spirit_house',
        floor: 0,
        x: 6.2,
        range: 1.6,
        getLabel: () =>
          this.state.inventory.includes('incense_soda')
            ? 'วางธูปกับน้ำแดงที่ศาลพระภูมิ'
            : 'ยกมือไหว้ศาลพระภูมิ',
        label: 'ศาลพระภูมิ',
        onInteract: () => this.interactSpiritHouse(),
      },
      {
        id: 'clothesline',
        floor: 0,
        x: 8.9,
        range: 1.35,
        label: 'ดูชุดนักศึกษาบนราวตากผ้า',
        onInteract: () => {
          const period = this.world.getTimePeriod(this.state.gameMinutes);
          if (period === 'night') {
            this.startGhostChase(
              'เสื้อตัวนั้นเปียกชุ่มและเย็นเฉียบราวกับเพิ่งจมน้ำ... จู่ๆ ก็มีเสียงฝีเท้าเปียกน้ำวิ่งเข้ามาจากด้านหลัง!',
              12.2
            );
          } else {
            this.showToast('ชุดนักศึกษาหญิงเก่าๆ ตัวหนึ่งแขวนค้างอยู่ ลุงยามน่าจะลืมเก็บ... หรือไม่มีใครกล้าเก็บกันแน่');
          }
        },
      },

      // OUTSIDE DORM (SOI 9 STREET ZONE)
      {
        id: 'parking_shed',
        floor: 0,
        x: -19.5,
        range: 2.2,
        label: 'สำรวจโรงจอดรถและมอเตอร์ไซค์',
        onInteract: () => this.interactParkingShed(),
      },
      {
        id: 'bus_stop',
        floor: 0,
        x: -34.5,
        range: 2.0,
        label: 'ดูป้ายรถเมล์ปากซอย',
        onInteract: () => this.interactBusStop(),
      },
      {
        id: 'noodle_cart',
        floor: 0,
        x: -42.0,
        range: 2.2,
        getLabel: () => {
          const h = this.state.gameMinutes / 60;
          const open = h >= 17.0 || h < 2.0;
          return open ? 'สั่งบะหมี่เกี๊ยวหมูแดง (รถเข็น)' : 'ดูรถเข็นบะหมี่ (ยังไม่ตั้งร้าน)';
        },
        label: 'ร้านบะหมี่รถเข็น',
        onInteract: () => this.interactNoodleCart(),
      },
      {
        id: 'convenience_store',
        floor: 0,
        x: -51.5,
        range: 2.4,
        label: 'เข้าร้านสะดวกซื้อ 24-Seven ปากซอย',
        onInteract: () => this.interactConvenienceStore(),
      },
      {
        id: 'market_vendor',
        floor: 0,
        x: -61.0,
        range: 2.2,
        getLabel: () => {
          const h = this.state.gameMinutes / 60;
          const open = h >= 5.5 && h < 20.5;
          return open ? 'คุยกับป้ากิม (แม่ค้าตลาดปากซอย)' : 'ดูแผงร้านข้าวแกง (ปิดร้านแล้ว)';
        },
        label: 'ตลาดร้านค้าปากซอย',
        onInteract: () => this.interactMarketVendor(),
      },
      {
        id: 'isaan_shop',
        floor: 0,
        x: -72.5,
        range: 2.6,
        getLabel: () => {
          const h = this.state.gameMinutes / 60;
          const open = h >= 16.5 || h < 1.5;
          return open
            ? 'แวะร้านลาบ-ส้มตำอีสานแท้ (กลุ่มพนักงานโรงงาน)'
            : 'ดูร้านลาบ-ส้มตำ (ยังปิดอยู่)';
        },
        label: 'ร้านอาหารอีสานปากซอย',
        onInteract: () => this.interactIsaanShop(),
      },
      {
        id: 'delinquent_gang',
        floor: 0,
        x: -85.6,
        range: 2.2,
        label: 'คุยกับกลุ่มเด็กช่างที่ยืนดูดบุหรี่',
        onInteract: () => this.interactDelinquentGang(),
      },
      {
        id: 'abandoned_house',
        floor: 0,
        x: -90.2,
        range: 2.6,
        label: 'สำรวจบ้านร้างท้ายซอย 9',
        onInteract: () => this.interactAbandonedHouse(),
      },

      // FLOOR 1
      {
        id: 'notice_board',
        floor: 1,
        x: -9.2,
        range: 1.6,
        label: 'อ่านบอร์ดประกาศหอพัก',
        onInteract: () => {
          this.addClue('notice_code');
          this.startDialogue([
            {
              speaker: 'บอร์ดประกาศชั้น 1',
              role: 'กระดานไม้เก่า',
              portrait: 'narrator',
              text: 'มีกระดาษกฎการเข้าพักแผ่นหนึ่งติดหมุดไว้ ลายมือด้านล่างเขียนเพิ่มด้วยปากกาหมึกแดงจางๆ: "ถ้าไฟดับอย่ามัวแต่ยืนมืดๆ ถ้าเห็นใครยืนสุดทางเดิน อย่าเอาไฟฉายไปส่องหน้าเขา"',
            },
            {
              speaker: 'กระดาษโน้ตมุมบอร์ด',
              role: 'ลายมือป้าแม่บ้าน',
              portrait: 'narrator',
              text: '"ตู้จดหมาย 304 ล็อกรหัส 3 หลักเอาไว้: หลักร้อย = ชั้นที่เกิดเรื่อง (ชั้น 3), สองหลักท้าย = วันที่ฝนตกหนักคืนน้องหายตัว (ต.ค. ปีก่อน — ลองไปดูสลิปหรือถามคนแถวหน้าหอได้)"',
            },
            {
              speaker: 'ต้น',
              role: 'คิดในใจ',
              portrait: 'player',
              text: 'ชั้น 3... ส่วนวันที่ในเดือนตุลาคมยังไม่รู้ว่าเป็นวันที่เท่าไร คงต้องเดินออกไปสืบแถวโรงจอดรถหรือปากซอยหน้าหอแล้วล่ะ',
            },
          ]);
        },
      },
      {
        id: 'mailboxes',
        floor: 1,
        x: -4.5,
        range: 1.6,
        getLabel: () =>
          this.state.flags.mailboxUnlocked ? 'ดูตู้จดหมาย 304' : 'ไขรหัสตู้จดหมาย 304',
        label: 'ตู้จดหมาย',
        onInteract: () => this.interactMailbox(),
      },
      {
        id: 'storage_room',
        floor: 1,
        x: 2.5,
        range: 1.5,
        getLabel: () =>
          this.state.flags.storageUnlocked ? 'เดินเข้าไปในห้องเก็บของ' : 'เปิดห้องเก็บของใต้บันได',
        label: 'ห้องเก็บของ',
        onInteract: () => this.interactStorage(),
      },
      {
        id: 'breaker_panel',
        floor: 1,
        x: 7.5,
        range: 1.5,
        getLabel: () =>
          this.state.flags.breakerTripped ? 'สับคัตเอาต์ไฟขึ้น' : 'เช็กตู้คัตเอาต์',
        label: 'ตู้คัตเอาต์',
        onInteract: () => {
          this.sound.playSwitchClick();
          if (this.state.flags.breakerTripped) {
            this.state.flags.breakerTripped = false;
            this.state.flags.breakerFixedCount++;
            this.darkRuleTimer = 0;
            this.showToast('ไฟทางเดินติดกลับมาแล้ว... เสียงหลอดฟลูออเรสเซนต์ฮัมเบาๆ');
            this.saveGame();
          } else {
            this.showToast('ตู้คัตเอาต์สภาพเก่ากึ๊ก สายไฟพันเทปดำเต็มไปหมด มิน่าถึงตัดบ่อย');
          }
        },
      },

      // FLOOR 2
      {
        id: 'room_202',
        floor: 2,
        x: -9.5,
        range: 1.5,
        label: 'เปิดประตูเข้าห้อง 202',
        onInteract: () => this.interactRoom202(),
      },
      {
        id: 'bathroom_2',
        floor: 2,
        x: -2.5,
        range: 1.5,
        label: 'เดินเข้าไปในห้องน้ำรวม ชั้น 2',
        onInteract: () => this.enterRoom('bathroom2', 2, -2.5),
      },
      {
        id: 'room_204',
        floor: 2,
        x: 5.4,
        range: 1.5,
        getLabel: () => {
          const period = this.world.getTimePeriod(this.state.gameMinutes);
          return period === 'night'
            ? 'แอบย่องเข้าไปในห้อง 204'
            : 'คุยกับคนห้อง 204';
        },
        label: 'ห้อง 204',
        onInteract: () => this.interactRoom204(),
      },
      {
        id: 'floor3_chain_gate',
        floor: 2,
        x: 11.4,
        range: 1.7,
        condition: () => !this.state.flags.unlockedFloor3,
        getLabel: () =>
          this.state.inventory.includes('wire_cutter')
            ? 'ใช้คีมตัดโซ่ทางขึ้นชั้น 3'
            : 'ตรวจดูโซ่คล้องทางขึ้นชั้น 3',
        label: 'โซ่กั้นบันไดชั้น 3',
        onInteract: () => this.cutFloor3Chain(),
      },

      // FLOOR 3
      {
        id: 'f3_window',
        floor: 3,
        x: -12.3,
        range: 1.6,
        label: 'มองออกไปนอกหน้าต่างชั้น 3',
        onInteract: () => {
          this.adjustSanity(-5);
          this.showToast('จากตรงนี้มองเห็นป้อมลุงยามอยู่ข้างล่าง... แต่ทางเดินข้างหลังเงียบจนได้ยินเสียงลมหายใจตัวเอง');
        },
      },
      {
        id: 'f3_evidence',
        floor: 3,
        x: -4.0,
        range: 1.5,
        label: 'ก้มดูรอยขูดบนพื้นทางเดิน',
        onInteract: () => {
          this.triggerScare(
            10,
            'พื้นปูนมีรอยขูดเป็นทางยาวลากเข้าไปทางห้อง 304... เหมือนมีคนดิ้นรนสุดชีวิตก่อนประตูปิดลง',
            3,
            1.5
          );
        },
      },
      {
        id: 'room_304',
        floor: 3,
        x: 3.5,
        range: 1.6,
        getLabel: () =>
          this.state.flags.unlockedRoom304 ? 'เดินเข้าไปในห้อง 304' : 'สำรวจประตูห้อง 304',
        label: 'ห้อง 304',
        onInteract: () => this.interactRoom304(),
      },

      // ========== INSIDE ROOM INTERACTABLES ==========
      // Storage Room
      {
        id: 'storage_exit',
        floor: 1,
        room: 'storage',
        x: -4.6,
        range: 1.5,
        label: 'ออกไปที่โถงชั้น 1',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'storage_crate',
        floor: 1,
        room: 'storage',
        x: -0.4,
        range: 1.6,
        label: 'ค้นลังแฟ้มเวรยาม & เอกสารเก่า',
        onInteract: () => {
          this.addClue('dorm_ledger');
          this.startDialogue([
            {
              speaker: 'แฟ้มเวรยามหอพัก (14 ต.ค.)',
              role: 'ในลังเอกสารเก่า',
              portrait: 'narrator',
              text: 'กล้องวงจรปิดชั้น 3 ดับสนิทเวลา 22:07 น. หลังตู้คัตเอาต์ถูกสับ... ด้านหลังมีบันทึกผู้เกี่ยวข้องในหอที่มีชื่อย่อ "ต." สองคน: พี่ต้อม (ห้อง 204) และ ช่างตง (ช่างไฟประจำหอ)',
            },
            {
              speaker: 'ต้น',
              role: 'คิดในใจ',
              portrait: 'player',
              text: 'อักษรย่อ "ต." มีตั้งสองคนเหรอ?! แบบนี้ต้องออกไปถามพยานร้าน 24-Seven กับร้านปากซอยให้แน่ใจแล้วว่าใครอยู่หอคืนนั้นกันแน่',
            },
          ]);
          this.saveGame();
        },
      },
      {
        id: 'storage_shelf',
        floor: 1,
        room: 'storage',
        x: 2.8,
        range: 1.7,
        label: 'หยิบของบนชั้นวางของ',
        onInteract: () => this.collectStorageSupplies(),
      },

      // Room 202 (Player's Room)
      {
        id: 'r202_exit',
        floor: 2,
        room: 'room202',
        x: -4.6,
        range: 1.5,
        label: 'ออกไปที่ทางเดินชั้น 2',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'r202_desk',
        floor: 2,
        room: 'room202',
        x: -0.6,
        range: 1.6,
        label: 'ดูโต๊ะอ่านหนังสือ & ใบกฎหอพัก',
        onInteract: () => this.openRulesModal(),
      },
      {
        id: 'r202_bed',
        floor: 2,
        room: 'room202',
        x: 2.8,
        range: 1.8,
        label: 'พักผ่อนบนเตียง / นอนรอเวลา / เซฟเกม',
        onInteract: () => this.openSleepModal(),
      },

      // Bathroom Floor 2
      {
        id: 'bath_exit',
        floor: 2,
        room: 'bathroom2',
        x: -4.6,
        range: 1.5,
        label: 'ออกไปที่ทางเดินชั้น 2',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'bath_mirror',
        floor: 2,
        room: 'bathroom2',
        x: -1.4,
        range: 1.5,
        label: 'ส่องกระจกอ่างล้างหน้า',
        onInteract: () => this.interactBathMirror(),
      },
      {
        id: 'bath_drain',
        floor: 2,
        room: 'bathroom2',
        x: -0.2,
        range: 1.4,
        label: 'ก้มดูท่อระบายน้ำ',
        onInteract: () => this.interactBathDrain(),
      },
      {
        id: 'bath_stalls',
        floor: 2,
        room: 'bathroom2',
        x: 2.7,
        range: 1.8,
        label: 'เช็กประตูห้องน้ำด้านใน',
        onInteract: () => {
          const period = this.world.getTimePeriod(this.state.gameMinutes);
          if (period === 'night') {
            this.triggerScare(8, 'ประตูห้องน้ำด้านในกระแทกปิดเองดังปัง!', 2, 3.2);
          } else {
            this.showToast('ห้องน้ำว่างเปล่า มีเพียงกลิ่นอับชื้นและน้ำหยด');
          }
        },
      },

      // Room 204 (P' Tom's Room)
      {
        id: 'r204_exit',
        floor: 2,
        room: 'room204',
        x: -4.6,
        range: 1.5,
        label: 'รีบออกจากห้อง 204',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'r204_desk',
        floor: 2,
        room: 'room204',
        x: 0.2,
        range: 1.6,
        label: 'สำรวจโต๊ะทำงานของพี่ต้อม',
        onInteract: () => {
          this.startDialogue([
            {
              speaker: 'โต๊ะทำงานห้อง 204',
              role: 'ภายในห้องพี่ต้อม',
              portrait: 'narrator',
              text: 'บนโต๊ะมีสมุดบัญชีชมรมที่ตัวเลขถูกขีดฆ่าแก้เต็มไปหมด ข้างจอมอนิเตอร์มีกระดาษโพสต์อิทแปะไว้ว่า: "กันลืมรหัสกล่องเหล็กใต้เตียง (3 หลัก): เวลาที่นัดมันไว้(กี่ทุ่ม 1 หลัก) + วันที่คืนนั้น(2 หลัก)"',
            },
          ]);
        },
      },
      {
        id: 'r204_box',
        floor: 2,
        room: 'room204',
        x: 3.0,
        range: 1.8,
        getLabel: () =>
          this.state.flags.room204BoxUnlocked
            ? 'ดูก่อนกล่องเหล็กใต้เตียงพี่ต้อม'
            : 'ไขรหัสกล่องเหล็กใต้เตียงพี่ต้อม',
        label: 'ค้นกล่องเหล็กใต้เตียงพี่ต้อม',
        onInteract: () => this.collectTomRecorder(),
      },

      // 24-Seven Convenience Store Interior ('seven24')
      {
        id: 'seven_exit',
        floor: 0,
        room: 'seven24',
        x: -4.6,
        range: 1.5,
        label: 'เดินออกหน้าร้าน 24-Seven',
        onInteract: () => {
          this.sound.playSevenChime();
          this.exitRoom();
        },
      },
      {
        id: 'seven_snacks',
        floor: 0,
        room: 'seven24',
        x: -1.8,
        range: 1.8,
        label: 'หยิบของกิน / น้ำดื่ม / น้ำอัดลม & กาแฟ',
        onInteract: () => this.openSevenSnacksModal(),
      },
      {
        id: 'seven_liquor',
        floor: 0,
        room: 'seven24',
        x: 0.7,
        range: 1.6,
        label: 'ดูตู้เครื่องดื่มแอลกอฮอล์ (เหล้าขาว)',
        onInteract: () => {
          if (this.state.inventory.includes('thai_liquor')) {
            this.showToast('คุณหยิบเหล้าขาว 40 ดีกรีใส่กระเป๋าไว้แล้ว ลองกดใช้จากช่องไอเทมด้านล่างดูสิ');
          } else {
            this.addItem('thai_liquor');
            this.showToast('หยิบเหล้าขาวมา 1 ขวด — กดใช้ในช่องไอเทมด้านล่างได้ถ้าใจถึงพอ');
          }
        },
      },
      {
        id: 'seven_clerk',
        floor: 0,
        room: 'seven24',
        x: 3.1,
        range: 1.8,
        label: 'คุยกับพนักงานแคชเชียร์ 24-Seven',
        onInteract: () => this.talkSevenClerk(),
      },

      // Room 304 (Prim's Room)
      {
        id: 'r304_exit',
        floor: 3,
        room: 'room304',
        x: -4.6,
        range: 1.5,
        label: 'กลับออกไปที่โถงชั้น 3',
        onInteract: () => this.exitRoom(),
      },
      {
        id: 'r304_books',
        floor: 3,
        room: 'room304',
        x: -1.2,
        range: 1.5,
        label: 'ตรวจดูแฟ้มเอกสารที่ตกเกลื่อนพื้น',
        onInteract: () => this.collectRoom304BooksAndCard(),
      },
      {
        id: 'r304_chair',
        floor: 3,
        room: 'room304',
        x: -0.3,
        range: 1.5,
        label: 'ตรวจดูเก้าอี้ที่ล้ม & รอยครูดบนพื้น',
        onInteract: () => this.inspectRoom304Chair(),
      },
      {
        id: 'r304_vanity',
        floor: 3,
        room: 'room304',
        x: 1.4,
        range: 1.6,
        label: 'หยิบสมุดบันทึกสีแดงบนโต๊ะเครื่องแป้ง',
        onInteract: () => this.collectPrimDiaryAndConclude(),
      },
    ];
  }

  private interactUncle(): void {
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    const f = this.state.flags;

    if (!f.talkedToUncleIntro) {
      f.talkedToUncleIntro = true;
      f.gotRoom202Key = true;
      this.addItem('room202_key');
      this.addClue('rumor_prim');
      this.startDialogue([
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'อ้าว ไอ้หนุ่มห้อง 202 เหรอ มาถึงค่ำเชียว รถติดแถวปากซอยล่ะสิ... เอ้านี่กุญแจห้อง แล้วพกไฟฉายนี่ติดมือไปด้วยนะ ไฟทางเดินหอมันเก่า ชอบดับเวลาฝนตก',
        },
        {
          speaker: 'ต้น',
          role: 'นักศึกษาปี 2',
          portrait: 'player',
          text: 'ขอบคุณครับลุง... ว่าแต่หอนี้ดูเงียบๆ นะครับ ชั้น 3 ไม่เห็นมีไฟเปิดสักดวงเลย',
        },
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'อ๋อ... ข้างบนเขาปิดซ่อมน่ะ ท่อน้ำมันรั่วซึม ลุงเอาโซ่คล้องบันไดไว้แล้ว เอ็งก็อย่าเพิ่งขึ้นไปเดินล่ะ เดี๋ยวเหยียบเศษปูน... เออ เข้าไปแล้วแวะอ่านป้ายบอร์ดชั้น 1 ด้วยนะ เจ้าของหอเขาแปะข้อปฏิบัติไว้หลายอย่าง',
        },
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'คืนนี้ฝนท่าจะตกหนัก ลุงต้องนั่งเฝ้าเวรยันเช้าเลย เฮ้อ... ถ้าง่วงๆ คงต้องหากาแฟกระป๋องสักป๋องมาซดละมั้ง',
        },
      ]);
      this.saveGame();
      return;
    }

    if (
      period === 'night' &&
      this.state.inventory.includes('canned_coffee') &&
      !f.gaveUncleCoffee
    ) {
      f.gaveUncleCoffee = true;
      f.uncleSecretRevealed = true;
      f.gotTalisman = true;
      this.removeItem('canned_coffee');
      this.addItem('talisman');
      this.addClue('uncle_witness');
      this.startDialogue([
        {
          speaker: 'ต้น',
          role: 'นักศึกษาปี 2',
          portrait: 'player',
          text: 'ลุงชัยครับ ผมเจอกาแฟกระป๋องแช่อยู่ข้างล่างเลยหยิบมาฝาก เห็นลุงนั่งคนเดียวดึกๆ',
        },
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'เฮ้ย ขอบใจมากลูก... ไม่ต้องลำบากขนาดนี้ก็ได้ (ลุงเปิดกระป๋องซดอึกใหญ่แล้วถอนหายใจยาว)',
        },
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'เอ็งขึ้นไปดูบอร์ดกับตู้จดหมายชั้น 1 มาแล้วใช่ไหม... หน้าเอ็งมันฟ้อง... ลุงขอโทษนะที่ตอนเย็นไม่ได้บอกตรงๆ เรื่องชั้น 3 ไม่ได้ปิดเพราะท่อรั่วหรอก',
        },
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'ตุลาปีก่อน คืนพายุเข้าแบบวันนี้เลย ไฟดับทั้งตึก ลุงเห็นไอ้ต้อมห้อง 204 วิ่งพรวดพราดลงมาจากชั้น 3 หน้าซีดเป็นไก่ต้ม เช้ามาก็เจอน้องพริมผูกคอตายในห้อง 304... ลุงมันคนแก่ตัวคนเดียว กลัวอิทธิพลบ้านมันเลยไม่กล้าพูด',
        },
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'ถ้าเอ็งดื้อจะขึ้นไปดูให้เห็นกับตาจริงๆ ก็พกผ้ายันต์นี่ติดกระเป๋าไว้ อย่าขึ้นไปมือเปล่า... แล้วก็... ห้องน้ำรวมชั้น 2 ตอนดึกๆ น้ำมันชอบไหลเอง ลองไปดูแถวท่อระบายน้ำทีสิ',
        },
      ]);
      this.saveGame();
      return;
    }

    if (period === 'night' && !f.gaveUncleCoffee) {
      this.startDialogue([
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'หาว... ตีหนึ่งทีไรตาจะปิดทุกที ดึกป่านนี้อย่าเดินออกไปนอกหอนะลูก ข้างในมีอะไรก็รอเช้าค่อยว่ากัน... เออ ถ้ามีกาแฟสักกระป๋องคงดี',
        },
      ]);
    } else if (!f.mailboxUnlocked) {
      this.startDialogue([
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'ขึ้นบันไดขวาสุดไปชั้น 1 เลยลูก แวะอ่านบอร์ดกับเช็กตู้จดหมายห้องเอ็งดู เผื่อป้าแม่บ้านฝากเอกสารอะไรไว้',
        },
      ]);
    } else {
      this.adjustSanity(15);
      this.startDialogue([
        {
          speaker: 'ลุงชัย',
          role: 'ยามกะดึก',
          portrait: 'uncle',
          text: 'หน้าซีดเชียวไอ้หนุ่ม นั่งพักตรงป้อมลุงก่อนก็ได้ ตรงนี้ไฟสว่าง ไม่มีอะไรเข้ามากวนหรอก',
        },
      ]);
    }
  }

  private interactSpiritHouse(): void {
    const f = this.state.flags;
    if (this.state.inventory.includes('incense_soda') && !f.offeredRedFanta) {
      f.offeredRedFanta = true;
      f.gotHolyThread = true;
      this.removeItem('incense_soda');
      this.addItem('holy_thread');
      this.adjustSanity(100);
      this.startDialogue([
        {
          speaker: 'ต้น',
          role: 'นักศึกษาปี 2',
          portrait: 'player',
          text: 'เพิ่งย้ายมาอยู่ใหม่ครับเจ้าที่เจ้าทาง... ขอถวายธูปกับน้ำแดง ฝากเนื้อฝากตัวด้วยนะครับ อย่าให้เจออะไรไม่ดีเลย',
        },
        {
          speaker: 'ต้น',
          role: 'นักศึกษาปี 2',
          portrait: 'player',
          text: 'เอ๊ะ... ตรงขอบศาลมีม้วนด้ายสายสิญจน์วางไว้ด้วย ยังใหม่ๆ อยู่เลย ขออนุญาตหยิบไปพกติดตัวนะครับ',
        },
      ]);
      this.saveGame();
      return;
    }

    this.adjustSanity(15);
    this.showToast('ยกมือไหว้ศาลพระภูมิหน้าหอ กลิ่นควันธูปจางๆ ช่วยให้ใจสงบลง (+15 Sanity)');
  }

  private interactMailbox(): void {
    if (this.state.flags.mailboxUnlocked) {
      this.showToast('ในตู้จดหมาย 304 ไม่มีอะไรเหลือแล้ว');
      return;
    }
    this.openKeypadModal(
      'รหัสตู้จดหมายห้อง 304',
      'รหัส 3 หลัก = ชั้นที่เกิดเรื่อง + วันที่คืนฝนตกหนัก (ดูคำใบ้ที่บอร์ดชั้น 1 & สลิปนอกหอ)',
      '314',
      () => {
        this.state.flags.mailboxUnlocked = true;
        this.state.flags.gotStorageKey = true;
        this.addItem('storage_key');
        this.addClue('threat_letter');
        this.startDialogue([
          {
            speaker: 'ต้น',
            role: 'นักศึกษาปี 2',
            portrait: 'player',
            text: 'ชั้น 3 วันที่ 14 -> รหัส 314 ถูกจริงๆ ด้วย! ข้างในมีกุญแจห้องเก็บของ แล้วก็ซองจดหมายยับๆ จ่าหน้าถึง "พริม 304"...',
          },
          {
            speaker: 'กระดาษในซอง',
            role: '14 ตุลาคม ปีก่อน',
            portrait: 'narrator',
            text: '"สี่ทุ่มเจอกันชั้น 3 ถ้าไม่ยอมลบคลิปและคืนเงิน อย่าหาว่าไม่เตือน — ต."',
          },
          {
            speaker: 'ต้น',
            role: 'นักศึกษาปี 2',
            portrait: 'player',
            text: 'คำขู่ลงชื่อย่อว่า "ต." ตอนสี่ทุ่ม... หมายถึงใครกันแน่? ต้องเข้าไปค้นห้องเก็บของชั้น 1 ดูแฟ้มเก่าหน่อยแล้ว',
          },
        ]);
        this.saveGame();
      }
    );
  }

  private enterRoom(room: RoomId, floor: FloorIndex, returnX: number): void {
    this.sound.playDoorCreak();
    this.outsideReturnX = returnX;
    this.state.floor = floor;
    this.currentRoom = room;
    this.state.x = -3.8;
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

  private interactStorage(): void {
    const f = this.state.flags;
    if (!f.storageUnlocked) {
      if (!this.state.inventory.includes('storage_key')) {
        this.showToast('ประตูห้องเก็บของล็อกอยู่ คงต้องหากุญแจแถวชั้น 1 นี้ก่อน');
        return;
      }
      f.storageUnlocked = true;
      this.removeItem('storage_key');
      this.showToast('ไขกุญแจเปิดประตูห้องเก็บของออกแล้ว');
      this.saveGame();
    }
    this.enterRoom('storage', 1, 2.5);
  }

  private collectStorageSupplies(): void {
    if (this.state.inventory.includes('wire_cutter') && this.state.inventory.includes('screwdriver')) {
      this.showToast('บนชั้นวางของมีแต่ลังเปล่ากับไม้กวาดเก่า');
      return;
    }
    this.state.flags.gotScrewdriver = true;
    this.addItem('wire_cutter');
    this.addItem('screwdriver');
    this.startDialogue([
      {
        speaker: 'ต้น',
        role: 'ภายในห้องเก็บของ',
        portrait: 'player',
        text: 'บนชั้นช่างมี "คีมตัดเหล็ก" กับ "ไขควงหัวแฉก" เก็บไว้... ส่วนกาแฟกับของไหว้ศาลพระภูมิคงต้องเดินออกไปซื้อที่ 24-Seven ปากซอยแล้วล่ะ',
      },
    ]);
    this.saveGame();
  }

  private interactRoom202(): void {
    if (!this.state.flags.gotRoom202Key) {
      this.showToast('ห้อง 202 ยังล็อกอยู่ ต้องลงไปขอกุญแจจากลุงยามหน้าหอก่อน');
      return;
    }
    this.enterRoom('room202', 2, -9.5);
  }

  private openSleepModal(): void {
    this.openModal(
      'เตียงนอน — ห้อง 202',
      `
      <p>ภายในห้องแคบๆ มีเตียงเดี่ยวกับพัดลมเก่าหนึ่งตัว อย่างน้อยตรงนี้ก็ล็อกกลอนได้</p>
      <p style="color:#9fa6b8;font-size:0.85rem">คุณสามารถงีบพักเพื่อฟื้นสติ หรือรอให้ถึงช่วงเวลาที่ต้องการได้</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
        <button class="secondary-btn" data-sleep="450">ตื่นตอนเช้า (07:30)</button>
        <button class="secondary-btn" data-sleep="720">รอถึงเที่ยง (12:00)</button>
        <button class="secondary-btn" data-sleep="1040">รอถึงเย็น (17:20)</button>
        <button class="primary-btn" data-sleep="1290">รอถึงกลางคืน (21:30)</button>
      </div>
      <div style="margin-top:12px;text-align:center">
        <button id="btn-manual-save" class="secondary-btn" style="width:100%">บันทึกเกมตอนนี้</button>
      </div>
      `
    );

    this.modalBody.querySelectorAll('[data-sleep]').forEach((el) => {
      el.addEventListener('click', () => {
        const targetMin = Number((el as HTMLElement).dataset.sleep);
        if (targetMin <= this.state.gameMinutes) {
          this.state.day += 1;
        }
        this.state.gameMinutes = targetMin;
        this.state.sanity = 100;
        this.rollWeather();
        this.closeModal();
        this.updateHUD();
        this.saveGame();
        this.showToast('งีบหลับไปพักใหญ่ รู้สึกหัวโล่งขึ้นเยอะ');
      });
    });

    document.getElementById('btn-manual-save')?.addEventListener('click', () => {
      this.saveGame(false);
    });
  }

  private interactBathMirror(): void {
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    const f = this.state.flags;

    if (period !== 'night') {
      this.showToast('กระจกอ่างล้างหน้ามีคราบน้ำและรอยร้าวเล็กน้อย ตอนกลางวันยังดูไม่มีอะไรผิดปกติ');
      return;
    }

    if (f.sawBathroomGhost) {
      this.showToast('กระจกอ่างล้างหน้ามีรอยร้าวเป็นรูปฝ่ามือ...');
      return;
    }

    f.sawBathroomGhost = true;
    this.triggerScare(
      20,
      'ก๊อกน้ำหมุนเปิดเองดังซ่า! ในกระจกมีเงาผู้หญิงผมยาวเปียกโชกยืนซ้อนหลังคุณอยู่ ก่อนจะชี้ลงไปที่ท่อระบายน้ำ...',
      2,
      -0.2
    );
    this.startDialogue([
      {
        speaker: 'ต้น',
        role: 'ภายในห้องน้ำรวม',
        portrait: 'player',
        text: 'เชี่ย...! อะไรวะเนี่ย?! เธอชี้ไปตรงท่อระบายน้ำกลางห้องน้ำ... ลองเดินไปก้มดูตรงท่อระบายน้ำซิ!',
      },
    ]);
    this.saveGame();
  }

  private interactBathDrain(): void {
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    if (this.state.inventory.includes('room304_key')) {
      this.showToast('ตะแกรงท่อระบายน้ำว่างเปล่า คุณหยิบกุญแจห้อง 304 ขึ้นมาแล้ว');
      return;
    }
    if (period !== 'night' && !this.state.flags.sawBathroomGhost) {
      this.showToast('ท่อระบายน้ำเปียกชื้น มีน็อตยึดฝาตะแกรงไว้แน่นและมีเส้นผมพันอยู่...');
      return;
    }
    if (!this.state.inventory.includes('screwdriver')) {
      this.showToast('ฝาตะแกรงท่อระบายน้ำขันน็อตไว้แน่น ต้องหาไขควงจากห้องเก็บของชั้น 1 มาไขออก!');
      return;
    }
    this.sound.playSwitchClick();
    this.addItem('room304_key');
    this.addClue('bathroom_mirror');
    this.startDialogue([
      {
        speaker: 'ต้น',
        role: 'ภายในห้องน้ำรวม',
        portrait: 'player',
        text: 'ใช้ไขควงงัดน็อตฝาท่อออกจนสำเร็จ... ข้างในมี "กุญแจห้อง 304" เปื้อนสนิมถูกโยนทิ้งซ่อนไว้จริงๆ ด้วย! ใครเอามาทิ้งไว้ในนี้กันนะ',
      },
    ]);
    this.saveGame();
  }

  private interactRoom204(): void {
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    const f = this.state.flags;

    if (period !== 'night') {
      f.confrontedTomDay = true;
      this.startDialogue([
        {
          speaker: 'พี่ต้อม',
          role: 'รุ่นพี่ห้อง 204',
          portrait: 'tom',
          text: 'อ้าว เด็กใหม่ห้อง 202 เหรอ... อยู่ชั้นนี้ก็อย่าเปิดเพลงเสียงดังล่ะ แล้วชั้น 3 ข้างบนอย่าไปเดินเล่น ฝุ่นมันหนา เดี๋ยวจะหาว่าไม่เตือน',
        },
        {
          speaker: 'ต้น',
          role: 'นักศึกษาปี 2',
          portrait: 'player',
          text: '(ทำไมเสียงแกแข็งๆ ชอบกล... ไว้ดึกๆ ตอนแกไม่อยู่หน้าห้องค่อยแอบเข้ามาดูข้างในห้อง 204 ดีกว่า)',
        },
      ]);
      this.saveGame();
      return;
    }

    this.enterRoom('room204', 2, 5.4);
  }

  private collectTomRecorder(): void {
    const f = this.state.flags;
    if (f.gotVoiceRecorder) {
      this.showToast('ใต้เตียงมีเพียงกล่องเหล็กเปล่า คุณเก็บเครื่องอัดเสียงไปแล้ว');
      return;
    }

    this.openKeypadModal(
      'กล่องเหล็กใต้เตียงห้อง 204',
      'รหัส 3 หลัก = เวลาที่นัด (กี่ทุ่ม 1 หลัก) + วันที่คืนเกิดเหตุ (2 หลัก)',
      '414',
      () => {
        f.room204BoxUnlocked = true;
        f.confrontedTomNight = true;
        f.gotVoiceRecorder = true;
        this.addItem('voice_recorder');
        this.addClue('tom_recording');
        this.startDialogue([
          {
            speaker: 'ต้น',
            role: 'ภายในห้อง 204',
            portrait: 'player',
            text: '4 ทุ่ม วันที่ 14 -> รหัส 414 เปิดออกแล้ว! ข้างในกล่องเหล็กมีเครื่องอัดเสียงรุ่นเก่าที่หน้าจอแตกอยู่ ลองกดเล่นดูซิ',
          },
          {
            speaker: 'เสียงจากเครื่องอัดเสียง',
            role: 'ไฟล์บันทึก 14 ต.ค.',
            portrait: 'narrator',
            text: '[เสียงฝนตกซ่า...] "มึงคิดจะเอาเรื่องชมรมไปแจ้งความเหรอพริม! ส่งโทรศัพท์มานี่!" — [เสียงตบตี ผลักกระแทกพื้น และเสียงสำลักก่อนเงียบหายไป...]',
          },
          {
            speaker: 'ต้น',
            role: 'ภายในห้อง 204',
            portrait: 'player',
            text: 'มือสั่นไปหมดแล้ว... พี่ต้อมเป็นคนทำจริงๆ เหรอ?! ต้องรีบขึ้นไปตรวจดูหลักฐานในห้อง 304 ให้ครบ!',
          },
        ]);
        this.saveGame();
      }
    );
  }

  private interactRoom304(): void {
    const f = this.state.flags;
    if (!this.state.inventory.includes('room304_key')) {
      this.showToast('ประตูห้อง 304 ล็อกสนิท มีรอยสายสิญจน์เก่าพันรอบลูกบิดไว้');
      return;
    }

    const hasProtection =
      this.state.inventory.includes('holy_thread') || this.state.inventory.includes('talisman');

    if (!f.unlockedRoom304) {
      if (!hasProtection) {
        this.startDialogue([
          {
            speaker: 'ต้น',
            role: 'นักศึกษาปี 2',
            portrait: 'player',
            text: 'แค่จับลูกบิดก็เย็นเฉียบจนมือชา... ขนลุกไปทั้งตัวเหมือนมีคนยืนจ้องอยู่หลังบานประตู ทั้งที่เรายังไม่มีอะไรติดตัวมาป้องกันเลย',
            choices: [
              {
                label: 'ถอยก่อนดีกว่า ลองหาสายสิญจน์หรือของติดตัวจากชั้นล่าง',
                action: () => {
                  this.showToast('นึกดูสิ... หน้าหอมีศาลพระภูมิ กับลุงชัยที่ป้อมยาม');
                },
              },
              {
                label: 'ไม่สนแล้ว ไขกุญแจเปิดเข้าไปเดี๋ยวนี้',
                action: () => {
                  this.triggerEnding('bad');
                },
              },
            ],
          },
        ]);
        return;
      }

      f.unlockedRoom304 = true;
      this.saveGame();
    }

    this.enterRoom('room304', 3, 3.5);
  }

  private inspectRoom304Chair(): void {
    if (this.state.flags.checkedRoom304Chair) {
      this.showToast('เก้าอี้ไม้ล้มคว่ำผิดทิศจากพัดลมเพดาน เห็นรอยครูดรองเท้าชัดเจน');
      return;
    }
    this.state.flags.checkedRoom304Chair = true;
    this.adjustSanity(-8);
    this.addClue('crime_scene_clue');
    this.startDialogue([
      {
        speaker: 'ต้น',
        role: 'ภายในห้อง 304',
        portrait: 'player',
        text: 'เดี๋ยวนะ... เก้าอี้ไม้ไม่ได้ล้มอยู่ใต้พัดลมเพดาน แต่กระเด็นมาอยู่ข้างมุมโต๊ะเครื่องแป้ง แถมพื้นยังมีรอยส้นรองเท้าผ้าใบลากครูดเป็นทาง... นี่ไม่ใช่การฆ่าตัวตาย แต่เป็นการจัดฉาก!',
      },
    ]);
    this.saveGame();
  }

  private collectRoom304BooksAndCard(): void {
    if (this.state.flags.gotCctvCard) {
      this.showToast('กองเอกสารชมรมที่ถูกฉีกกระจาย คุณเก็บเมมโมรี่การ์ดกล้องวงจรปิดไปแล้ว');
      return;
    }
    this.state.flags.gotCctvCard = true;
    this.addItem('cctv_sd_card');
    this.startDialogue([
      {
        speaker: 'ต้น',
        role: 'ภายในห้อง 304',
        portrait: 'player',
        text: 'ตรงกองแฟ้มชมรมที่ตกกระจาย... มี "SD Card กล้องวงจรปิดชั้น 3" วันที่ 14 ต.ค. ตกซุกอยู่ใต้ปกหนังสือ! คืนนั้นเธอแอบถอดเก็บไว้ก่อนที่คนร้ายจะรู้ตัวแน่ๆ',
      },
    ]);
    this.saveGame();
  }

  private collectPrimDiaryAndConclude(): void {
    const f = this.state.flags;
    if (!f.checkedRoom304Chair || !f.gotCctvCard) {
      this.showToast('ลองสำรวจรอยเก้าอี้ล้มกับกองแฟ้มเอกสารในห้อง 304 ให้ครบก่อนหยิบสมุดบันทึก');
      return;
    }
    f.insideRoom304 = true;
    f.gotPrimDiary = true;
    this.addItem('prim_diary');
    this.addClue('prim_truth');

    const hasCoreEvidence =
      this.state.clues.includes('threat_letter') &&
      this.state.clues.includes('uncle_witness') &&
      this.state.clues.includes('tom_recording') &&
      this.state.clues.includes('prim_truth') &&
      this.state.clues.includes('crime_scene_clue');

    const hasWitnessCorroboration =
      this.state.clues.includes('clerk_clue') ||
      this.state.clues.includes('dorm_ledger') ||
      this.state.clues.includes('isaan_clue') ||
      this.state.clues.includes('vendor_clue');

    const canProveTrueEnding = hasCoreEvidence && hasWitnessCorroboration;

    this.triggerPrimFlash(3.4, 3, 5.0);

    this.startDialogue([
      {
        speaker: 'สมุดบันทึกของพริม',
        role: 'โต๊ะเครื่องแป้ง ห้อง 304',
        portrait: 'prim',
        text: '"คืนนี้สี่ทุ่ม พี่ต้อมนัดขึ้นไปคุยชั้น 3... ฉันแอบถอด SD Card กล้องชั้น 3 กับกดอัดเสียงไว้ เผื่อเขาไม่ยอมจบดีๆ พรุ่งนี้เช้าจะเอาเรื่องยักยอกเงินชมรมกับคลิปไปแจ้งตำรวจ..."',
      },
      {
        speaker: 'เงาข้างหน้าต่าง',
        role: 'วิญญาณห้อง 304',
        portrait: 'prim',
        text: 'เสียงฝนข้างนอกหยุดนิ่งลงฉับพลัน เงาหญิงสาวจ้องมองมาที่สมุดบันทึกในมือคุณก่อนเอ่ยเสียงสะท้อนก้องในหัว: "รู้ความจริงแล้วใช่ไหม... ใครเป็นคนฆ่าฉัน และทำลงไปทำไม?"',
        choices: [
          {
            label: 'พี่ต้อม (ห้อง 204) นัดมาฆ่าปิดปากเพราะเรื่องยักยอกเงินชมรมและแอบถ่ายคลิป',
            action: () => {
              if (canProveTrueEnding) {
                this.triggerEnding('true');
              } else {
                this.showToast('แม้จะรู้ตัวคนร้าย แต่หลักฐานพยานยังไม่รัดกุมพอจะเอาผิด...', true);
                this.triggerEnding('normal');
              }
            },
          },
          {
            label: 'ช่างตง (อักษรย่อ ต.) เป็นคนสับคัตเอาต์แล้วขึ้นมาทำร้ายเธอ',
            action: () => {
              this.triggerEnding('bad');
            },
          },
          {
            label: 'เธอคิดสั้นผูกคอตายเองเพราะเครียดเรื่องเงินชมรม',
            action: () => {
              this.triggerEnding('bad');
            },
          },
        ],
      },
    ]);
  }

  private interactParkingShed(): void {
    if (!this.state.clues.includes('parking_clue')) {
      this.addClue('parking_clue');
      this.startDialogue([
        {
          speaker: 'ต้น',
          role: 'โรงจอดรถข้างหอ',
          portrait: 'player',
          text: 'มีรถยนต์เก่าจอดคลุมฝุ่นอยู่คันหนึ่ง กับมอเตอร์ไซค์อีกสองคัน... เอ๊ะ ตรงตะกร้าหน้ารถมอเตอร์ไซค์สีดำมีสลิปร้านสะดวกซื้อยับๆ ตกอยู่',
        },
        {
          speaker: 'ใบเสร็จร้าน 24-Seven',
          role: '14 ต.ค. เวลา 21:15 น.',
          portrait: 'narrator',
          text: '"น้ำดื่ม 1 ขวด, เทปกาว 1 ม้วน" — ข้างแฮนด์รถมีพวงกุญแจห้อยป้ายเลขห้อง 204 ติดอยู่',
        },
      ]);
    } else {
      this.showToast('รถมอเตอร์ไซค์สีดำของพี่ต้อมห้อง 204 จอดสนิทอยู่ใต้หลังคาสังกะสี ล้อยังมีคราบโคลน');
    }
  }

  private interactBusStop(): void {
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    if (period === 'night') {
      this.startDialogue([
        {
          speaker: 'คนที่นั่งรอรถเมล์',
          role: 'ป้ายรถเมล์ซอย 9',
          portrait: 'vendor',
          text: 'ดึกป่านนี้รถสาย 8 กับ 29 นานๆ มาทีนะน้อง... เอ๊ะ เธอพักอยู่หอเรือนจันทร์ฝั่งโน้นเหรอ เดินผ่านท้ายซอยเลยร้านส้มตำไปมีบ้านร้างอยู่ อย่าไปยุ่งกับพวกเด็กช่างแถวนั้นเลย เดี๋ยวมีเรื่อง',
        },
      ]);
    } else {
      this.startDialogue([
        {
          speaker: 'ผู้โดยสารตรงป้ายรถเมล์',
          role: 'ป้ายรถเมล์ซอย 9',
          portrait: 'narrator',
          text: 'สาย 8 และ 29 — บนเสามีรอยเทปกาวเก่าเหมือนเคยมีคนติดใบประกาศตามหาคนหาย "น้องพริม ห้อง 304"... พวกคนที่นี่เห็นแล้วขนลุกกันทั้งซอยเลย',
        },
      ]);
    }
  }

  private interactDelinquentGang(): void {
    this.startDialogue([
      {
        speaker: 'หัวหน้ากลุ่มเด็กช่าง (เสื้อช็อปเลือดหมู)',
        role: 'หน้าบ้านร้างท้ายซอย',
        portrait: 'tom',
        text: 'มองไรวะน้อง? แถวนี้พื้นที่พวกกู... (พ่นควันบุหรี่) ถ้าอยู่หอเรือนจันทร์ก็อย่าเดินเพ่นพ่านมาแถวบ้านร้างตอนดึกๆ ล่ะ',
      },
      {
        speaker: 'เพื่อนเด็กช่าง (แจ็กเก็ตยีนส์)',
        role: 'หน้าบ้านร้างท้ายซอย',
        portrait: 'worker',
        text: 'เฮ้ยแต่อย่างว่า... อาทิตย์ก่อนกูเห็นไอ้รุ่นพี่เสื้อช็อปหอเรือนจันทร์หน้าตามึนๆ เดินถือถุงดำมายืนด้อมๆ มองๆ แถวรั้วบ้านร้างนี่ด้วยนะ ไม่รู้เอาอะไรมาโยนทิ้งไว้รึเปล่า',
      },
    ]);
  }

  private interactAbandonedHouse(): void {
    this.adjustSanity(-5);
    this.startDialogue([
      {
        speaker: 'ต้น',
        role: 'หน้าบ้านร้างท้ายซอย 9',
        portrait: 'player',
        text: 'บ้านไม้ครึ่งปูนเก่าๆ ถูกตอกไม้กระดานปิดตาย หน้าต่างข้างบนมืดสนิทจนเหมือนมีคนแอบมองลงมา... ป้ายสังกะสีเขียนไว้ว่า "เขตบ้านร้าง — ห้ามเข้า"',
      },
    ]);
  }

  private interactConvenienceStore(): void {
    this.sound.playSevenChime();
    this.enterRoom('seven24', 0, -51.5);
  }

  private openSevenSnacksModal(): void {
    this.sound.playUIClick();
    this.openModal(
      'ตู้แช่ & ชั้นวางของ 24-Seven',
      `
      <p style="margin-top:0">เลือกหยิบเสบียง น้ำดื่ม และของไหว้ติดกระเป๋าไว้ได้เลย</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
        <button class="secondary-btn" id="buy-snack">ขนมปัง & ไส้กรอก (+20 สติ)</button>
        <button class="secondary-btn" id="buy-water">น้ำดื่มเย็น (+15 สติ)</button>
        <button class="secondary-btn" id="buy-soda-drink">น้ำอัดลมซ่า (+25 สติ)</button>
        <button class="secondary-btn" id="buy-coffee">กาแฟกระป๋อง (ฝากลุงยาม)</button>
        <button class="secondary-btn" id="buy-inhaler">ยาดมสมุนไพร (+35 สติ)</button>
        <button class="secondary-btn" id="buy-soda">ชุดธูป & น้ำแดง (ศาลพระภูมิ)</button>
      </div>
      `
    );

    const bindGrab = (btnId: string, itemId: string, alreadyMsg: string) => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        if (this.state.inventory.includes(itemId)) {
          this.showToast(alreadyMsg);
        } else {
          this.addItem(itemId);
        }
      });
    };
    bindGrab('buy-snack', 'snack_bread', 'คุณมีขนมปัง & ไส้กรอกแล้ว');
    bindGrab('buy-water', 'drinking_water', 'คุณมีน้ำดื่มเย็นอยู่ในกระเป๋าแล้ว');
    bindGrab('buy-soda-drink', 'soda_can', 'คุณมีน้ำอัดลมอยู่ในกระเป๋าแล้ว');
    bindGrab('buy-coffee', 'canned_coffee', 'คุณมีกาแฟกระป๋องอยู่ในกระเป๋าแล้ว');
    bindGrab('buy-inhaler', 'inhaler', 'คุณมียาดมอยู่ในกระเป๋าแล้ว');
    bindGrab('buy-soda', 'incense_soda', 'คุณมีชุดธูป & น้ำแดงอยู่ในกระเป๋าแล้ว');
  }

  private talkSevenClerk(): void {
    this.addClue('clerk_clue');
    this.saveGame();
    this.startDialogue([
      {
        speaker: 'พนักงาน 24-Seven',
        role: 'เคาน์เตอร์หน้าซอย 9',
        portrait: 'narrator',
        text: 'สวัสดีครับ รับขนมจีบซาลาเปาเพิ่มไหมครับ... อ๋อ ถ้าถามเรื่องคืนวันที่ 14 ต.ค. ปีก่อน วันนั้นช่างตงแกนั่งรถทัวร์กลับต่างจังหวัดไปตั้งแต่ 6 โมงเย็นแล้วครับ ลุงชัยยังมาฝากซื้อของกับแกอยู่เลย',
      },
      {
        speaker: 'พนักงาน 24-Seven',
        role: 'เคาน์เตอร์หน้าซอย 9',
        portrait: 'narrator',
        text: 'แต่ตอนสามทุ่มสิบห้า มีรุ่นพี่เสื้อช็อปห้อง 204 เดินหน้าเครียดเข้ามาซื้อน้ำกับเทปกาวม้วนใหญ่ ก่อนจะรีบเดินกลับเข้าหอไปครับ... อ้อ ตู้แช่ฝั่งซ้ายมีขนม น้ำอัดลม แล้วก็เหล้าขาววางอยู่นะครับ (อย่าดื่มหมดขวดล่ะ)',
      },
    ]);
  }

  private startDrunkZombieMode(): void {
    this.sound.playScare();
    this.sound.playZombieGroan();
    this.chaseActive = false;
    this.chaseBanner.classList.add('hidden');
    this.drunkMode = true;
    this.drunkKills = 0;
    this.gunCooldown = 0;
    this.gunFlashTimer = 0;
    this.zombieGroanTimer = 2.0;

    // Preserve where the player is on the map (if inside 24-Seven, step right outside 24-Seven!)
    if (this.currentRoom === 'seven24') {
      this.currentRoom = 'outside';
      this.state.floor = 0;
      this.state.x = -51.5;
    } else if (this.currentRoom !== 'outside') {
      this.currentRoom = 'outside';
    }
    this.state.flashlightOn = true;
    this.btnFlashlight.classList.add('active');

    this.zombies = [-11.5, 11.5, -8.5, 9.0, -13.0, 13.0].map((offset, idx) => ({
      x: this.clampMapX(this.state.x + offset, this.state.floor),
      floor: this.state.floor,
      alive: true,
      dir: offset < 0 ? 1 : -1,
      speed: 2.0 + (idx % 3) * 0.45,
      respawnTimer: 0,
    }));

    this.sanityOverlay.classList.add('drunk-mode');
    this.drunkBanner.classList.remove('hidden');
    this.touchShoot.classList.remove('hidden');
    this.updateDrunkBanner();
    this.updateHUD();

    this.startDialogue([
      {
        speaker: 'ต้น (กำลังเมาหนัก)',
        role: 'อาการหลอนจากเหล้าขาว',
        portrait: 'player',
        text: 'อึ้ก... ภาพหมุนติ้วไปหมดแล้ว! เฮ้ย?! ทำไมซอมบี้โผล่มาวิ่งไล่เต็มซอยเต็มหอไปหมดเลยวะ! ดีนะในมือมีปืนพก — ยิงมันแล้วเดินหนีไปได้ทั่วแมพเลย! (อยากสร่างเมาเมื่อไรให้กด [O])',
      },
    ]);
  }

  private clampMapX(x: number, floor: FloorIndex): number {
    const minX = floor === 0 ? STREET_MIN_X + 1.5 : WORLD_MIN_X + 0.8;
    const maxX = WORLD_MAX_X - 0.8;
    return Math.max(minX, Math.min(maxX, x));
  }

  private shootZombieGun(): void {
    if (!this.drunkMode || this.gunCooldown > 0 || this.modalOpen || this.activeDialogue.length > 0) return;
    this.gunCooldown = 0.24;
    this.gunFlashTimer = 0.11;
    this.sound.playGunshot();

    let bestIdx = -1;
    let bestDist = 12.5;
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (!z.alive || z.floor !== this.state.floor || this.currentRoom !== 'outside') continue;
      const dx = z.x - this.state.x;
      if (Math.sign(dx) === this.facing || Math.abs(dx) < 0.85) {
        const d = Math.abs(dx);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    }

    if (bestIdx >= 0) {
      const hit = this.zombies[bestIdx];
      this.gunBeamEndX = hit.x;
      hit.alive = false;
      hit.respawnTimer = 1.5;
      this.drunkKills += 1;
      this.sound.playZombieHit();
      this.updateDrunkBanner();
    } else {
      this.gunBeamEndX = this.state.x + this.facing * 10.5;
    }
  }

  private updateDrunkZombieMode(dt: number): void {
    if (!this.drunkMode) return;
    if (this.gunCooldown > 0) this.gunCooldown -= dt;
    if (this.gunFlashTimer > 0) this.gunFlashTimer -= dt;

    this.zombieGroanTimer -= dt;
    if (this.zombieGroanTimer <= 0) {
      this.zombieGroanTimer = 2.4 + Math.random() * 2.2;
      this.sound.playZombieGroan();
    }

    if (this.currentRoom !== 'outside') return;

    for (const z of this.zombies) {
      if (!z.alive) {
        z.respawnTimer -= dt;
        if (z.respawnTimer <= 0) {
          z.alive = true;
          z.floor = this.state.floor;
          const side = Math.random() < 0.5 ? -1 : 1;
          z.x = this.clampMapX(this.state.x + side * (10 + Math.random() * 5), z.floor);
          if (Math.abs(z.x - this.state.x) < 4.5) {
            z.x = this.clampMapX(this.state.x - side * 12, z.floor);
          }
          z.dir = this.state.x >= z.x ? 1 : -1;
        }
        continue;
      }

      if (z.floor !== this.state.floor || Math.abs(z.x - this.state.x) > 26) {
        z.floor = this.state.floor;
        const side = Math.random() < 0.5 ? -1 : 1;
        z.x = this.clampMapX(this.state.x + side * (11 + Math.random() * 4), z.floor);
      }

      z.dir = this.state.x >= z.x ? 1 : -1;
      z.x += z.dir * z.speed * dt;

      if (Math.abs(z.x - this.state.x) < 0.72) {
        this.sound.playZombieGroan();
        this.scareFlash.classList.add('active');
        setTimeout(() => this.scareFlash.classList.remove('active'), 150);
        z.x = this.clampMapX(z.x - z.dir * 3.4, z.floor);
        this.state.sanity = Math.max(20, this.state.sanity - 8);
        this.updateHUD();
      }
    }
  }

  private updateDrunkBanner(): void {
    this.drunkStatusText.textContent = `เมาหลอนซอมบี้! • ยิงแล้ว ${this.drunkKills} ตัว • [Space / คลิกซ้าย] ยิงปืน • เดินทั่วแมพได้เลย`;
  }

  private endDrunkZombieMode(): void {
    this.drunkMode = false;
    this.zombies = [];
    this.gunFlashTimer = 0;
    this.sanityOverlay.classList.remove('drunk-mode');
    this.drunkBanner.classList.add('hidden');
    this.touchShoot.classList.add('hidden');

    // Wake up on the Bus Stop bench!
    this.currentRoom = 'outside';
    this.state.floor = 0;
    this.state.x = -34.5;
    this.state.sanity = Math.max(65, this.state.sanity);
    this.state.gameMinutes = (this.state.gameMinutes + 115) % 1440;
    this.scareFlash.classList.add('active');
    setTimeout(() => this.scareFlash.classList.remove('active'), 450);

    this.updateHUD();
    this.saveGame();
    this.startDialogue([
      {
        speaker: 'ต้น (เพิ่งสร่างเมา)',
        role: 'ม้านั่งป้ายรถเมล์ ซอย 9',
        portrait: 'player',
        text: `อึก... ปวดหัวแทบระเบิด นี่เรามานอนหลับอยู่บนม้านั่งป้ายรถเมล์ปากซอยตั้งแต่เมื่อไรวะเนี่ย?! เมื่อกี้เหมือนฝันว่าถือปืนยิงซอมบี้วิ่งไล่เต็มหอ (${this.drunkKills} ตัว)... เข็ดเหล้าขาวเซเว่นไปอีกนานเลย!`,
      },
    ]);
  }

  private interactMarketVendor(): void {
    const hour = this.state.gameMinutes / 60;
    const isOpen = hour >= 5.5 && hour < 20.5;
    if (!isOpen) {
      this.showToast('ร้านข้าวแกงป้ากิมเก็บร้านกลับบ้านแล้ว (เปิดขาย 05:30 – 20:30 น.)');
      return;
    }

    const knowsAboutRoom304 =
      this.state.clues.includes('notice_code') ||
      this.state.clues.includes('threat_letter') ||
      this.state.clues.includes('parking_clue');

    if (knowsAboutRoom304 && !this.state.clues.includes('vendor_clue')) {
      this.addClue('vendor_clue');
      if (!this.state.inventory.includes('inhaler')) {
        this.addItem('inhaler');
      }
      this.startDialogue([
        {
          speaker: 'ต้น',
          role: 'นักศึกษาปี 2',
          portrait: 'player',
          text: 'ป้ากิมครับ พอดีผมอยู่หอเรือนจันทร์... ป้ารู้จักผู้หญิงที่เคยอยู่ห้อง 304 ไหมครับ?',
        },
        {
          speaker: 'ป้ากิม',
          role: 'แม่ค้าข้าวแกงปากซอย',
          portrait: 'vendor',
          text: 'อ๋อ หนูพริมน่ะเหรอ... (ป้าลดเสียงลงแล้วหันซ้ายแลขวา) เด็กคนนั้นนิสัยดีออกลูก มาซื้อแกงจืดป้าเกือบทุกเย็น',
        },
        {
          speaker: 'ป้ากิม',
          role: 'แม่ค้าข้าวแกงปากซอย',
          portrait: 'vendor',
          text: 'แต่วันสุดท้ายก่อนฝนตกใหญ่ ป้าเห็นหนูพริมกอดสมุดบันทึกสีแดงวิ่งหน้าตาตื่นมาจากป้ายรถเมล์ มีไอ้หนุ่มเสื้อช็อปห้อง 204 เดินตามไล่หลังมาติดๆ... หลังจากคืนนั้นป้าก็ไม่ได้เจอหนูพริมอีกเลย',
        },
        {
          speaker: 'ป้ากิม',
          role: 'แม่ค้าข้าวแกงปากซอย',
          portrait: 'vendor',
          text: 'ถ้าหนูจะอยู่หอนั้นต่อก็ระวังตัวด้วยนะลูก อะไรไม่ดีอย่าไปยุ่ง... อ้าว หน้าซีดเชียว เอาหมูปิ้งกับยาดมไปติดกระเป๋าไว้สิ',
        },
      ]);
      this.saveGame();
      return;
    }

    this.adjustSanity(15);
    this.startDialogue([
      {
        speaker: 'ป้ากิม',
        role: 'แม่ค้าข้าวแกงปากซอย',
        portrait: 'vendor',
        text: 'อ้าวพ่อหนุ่ม เพิ่งย้ายมาซอยนี้เหรอลูก? วันนี้มีพะแนงหมู ไข่พะโล้ แล้วก็ต้มจืดนะ ฝากท้องกับป้าได้... ถ้าเดินดูแถวหอแล้วสงสัยอะไรก็แวะมาคุยกับป้าได้ตลอดเลย ก่อนสองทุ่มครึ่งป้ายังอยู่',
      },
    ]);
  }

  private interactNoodleCart(): void {
    const hour = this.state.gameMinutes / 60;
    const isOpen = hour >= 17.0 || hour < 2.0;
    if (!isOpen) {
      this.showToast('รถเข็นบะหมี่เกี๊ยวหมูแดงยังไม่ตั้งร้าน (เปิดขาย 17:00 – 02:00 น.)');
      return;
    }

    this.sound.playPickup();
    this.adjustSanity(30);
    this.showToast('ซดบะหมี่เกี๊ยวหมูแดงร้อนๆ ริมทาง ช่วยให้หายหนาวและเรียกสติคืนมา (+30 สติ)');
    this.startDialogue([
      {
        speaker: 'เฮียหมู (คนลวกบะหมี่)',
        role: 'รถเข็นบะหมี่เกี๊ยวปากซอย',
        portrait: 'vendor',
        text: 'เอาบะหมี่แห้งเกี๊ยวหมูแดงชามนึงนะน้อง ช่วงค่ำๆ ดึกๆ แถวนี้รถวิ่งกันคึกคักหน่อย แต่เลยตีสองไปหอเรือนจันทร์จะเงียบจนน่าขนลุก',
      },
      {
        speaker: 'เฮียหมู (คนลวกบะหมี่)',
        role: 'รถเข็นบะหมี่เกี๊ยวปากซอย',
        portrait: 'vendor',
        text: 'เมื่อก่อนนักศึกษาสาวห้องหัวมุมชั้นสามชอบมาซื้อบะหมี่แห้งกลับไปกินบนหอบ่อยๆ ... หลังคืนนั้นเฮียไม่เคยเห็นเธอลงมาซื้ออีกเลย เห็นแต่พวกพี่โรงงานร้านส้มตำฝั่งโน้นเล่าว่าได้ยินเสียงคนเดินบนดาดฟ้า',
      },
    ]);
    this.saveGame();
  }

  private interactIsaanShop(): void {
    const hour = this.state.gameMinutes / 60;
    const isOpen = hour >= 16.5 || hour < 1.5;
    if (!isOpen) {
      this.showToast('ร้านลาบ-ส้มตำอีสานแท้ยังไม่เปิดโต๊ะ (เปิดบริการ 16:30 – 01:30 น.)');
      return;
    }

    this.sound.playUIClick();
    this.adjustSanity(25);
    const firstClue = !this.state.clues.includes('isaan_clue');
    if (firstClue) {
      this.addClue('isaan_clue');
    }

    this.startDialogue([
      {
        speaker: 'พี่สมชาย (พนักงานโรงงาน)',
        role: 'ลูกค้าประจำร้านอาหารอีสาน',
        portrait: 'worker',
        text: 'อ้าว! น้องนักศึกษาเพิ่งย้ายเข้าหอเรือนจันทร์ใช่ไหม มาๆ นั่งชนแก้วกันหน่อย พวกพี่เลิกกะโรงงานมากินลาบเป็ดต้มแซ่บฉลองวันเงินเดือนออกกัน!',
      },
      {
        speaker: 'ต้น',
        role: 'นักศึกษาปี 2',
        portrait: 'player',
        text: 'ขอบคุณครับพี่... พอดีพวกพี่นั่งกินกันดึกๆ แถวปากซอย เคยสังเกตเห็นอะไรผิดปกติที่หอพักบ้างไหมครับ?',
      },
      {
        speaker: 'พี่สมชาย (พนักงานโรงงาน)',
        role: 'ลูกค้าประจำร้านอาหารอีสาน',
        portrait: 'worker',
        text: 'โอ๊ย... พูดแล้วขนลุก! คืนไหนฝนตกดึกๆ หลังสี่ทุ่มตอนพวกพี่ยกแก้วอยู่หน้าร้าน ชอบเห็นไฟห้อง 304 กระพริบแวบๆ ทั้งที่รู้กันทั้งซอยว่าตึกชั้นสามมันล็อกโซ่ปิดตายมาเป็นปีแล้ว!',
      },
      {
        speaker: 'พี่สมชาย (พนักงานโรงงาน)',
        role: 'ลูกค้าประจำร้านอาหารอีสาน',
        portrait: 'worker',
        text: 'แล้วก็คืนวันเกิดเรื่องปีก่อน พวกพี่เห็นผู้ชายสวมเสื้อช็อปเดินโซเซถือประแจกับม้วนเทปกลับเข้าหอ... ถ้าน้องจะขึ้นไปดูชั้น 3 ก็หาอะไรเหนียวๆ ติดกระเป๋าแล้วระวังตัวด้วยล่ะ (+25 สติ)',
      },
    ]);
    this.saveGame();
  }

  private tryChangeFloor(delta: 1 | -1): void {
    if (this.currentRoom !== 'outside') return;
    if (this.modalOpen || this.activeDialogue.length > 0 || this.stairCooldown > 0) return;
    if (Math.abs(this.state.x - STAIR_X) > 1.55) return;

    const target = (this.state.floor + delta) as FloorIndex;
    if (target < 0 || target > 3) return;

    if (target === 3 && !this.state.flags.unlockedFloor3) {
      if (this.state.inventory.includes('wire_cutter')) {
        this.state.flags.unlockedFloor3 = true;
        this.sound.playSwitchClick();
        this.showToast('ใช้คีมตัดโซ่คล้องทางขึ้นชั้น 3 ออกจนได้...');
      } else {
        this.showToast('ทางขึ้นชั้น 3 คล้องโซ่ล็อกไว้แน่น คงต้องหาอะไรมาตัดแถวห้องเก็บของ');
        return;
      }
    }

    this.stairCooldown = 0.38;
    this.sound.playDoorCreak();
    this.state.floor = target;
    this.state.x = STAIR_X - 1.05;
    this.updateHUD();
    this.saveGame();
  }

  private tryInteract(): void {
    const found = this.getNearestInteractable();
    if (found) {
      found.onInteract();
    }
  }

  private getNearestInteractable(): InteractableDef | null {
    let best: InteractableDef | null = null;
    let bestDist = Infinity;
    for (const item of this.interactables) {
      if ((item.room ?? 'outside') !== this.currentRoom) continue;
      if (this.currentRoom === 'outside' && item.floor !== this.state.floor) continue;
      if (item.condition && !item.condition()) continue;
      const dist = Math.abs(this.state.x - item.x);
      const range = item.range ?? 1.55;
      if (dist <= range && dist < bestDist) {
        best = item;
        bestDist = dist;
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
    if (line.portrait !== 'narrator') {
      const spriteCanvas = drawCharacterCanvas(line.portrait as CharacterKind, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(spriteCanvas, 16, 4, 64, 88);
    } else {
      ctx.fillStyle = '#182032';
      ctx.fillRect(0, 0, 96, 96);
      ctx.strokeStyle = '#c89e4c';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 18, 56, 60);
      ctx.fillStyle = '#e0a94c';
      ctx.fillRect(28, 30, 40, 4);
      ctx.fillRect(28, 42, 32, 3);
      ctx.fillRect(28, 52, 36, 3);
    }

    this.dialogueChoices.innerHTML = '';
    if (line.choices && line.choices.length > 0) {
      this.dialogueContinue.classList.add('hidden');
      line.choices.forEach((ch) => {
        if (ch.condition && !ch.condition()) return;
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = `> ${ch.label}`;
        btn.addEventListener('click', () => {
          this.sound.playUIClick();
          this.closeDialogue();
          ch.action?.();
        });
        this.dialogueChoices.appendChild(btn);
      });
    } else {
      this.dialogueContinue.classList.remove('hidden');
    }
  }

  private advanceDialogue(): void {
    const current = this.activeDialogue[this.dialogueIndex];
    if (current?.choices && current.choices.length > 0) return;
    this.sound.playUIClick();

    const finishCb = current?.onFinish;
    if (this.dialogueIndex + 1 < this.activeDialogue.length) {
      this.dialogueIndex++;
      this.renderDialogueLine();
      finishCb?.();
    } else {
      this.closeDialogue();
      finishCb?.();
    }
  }

  private closeDialogue(): void {
    this.activeDialogue = [];
    this.dialogueIndex = 0;
    this.dialogueBox.classList.add('hidden');
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
    const html = DORM_RULES.map(
      (r) => `
      <div class="rule-card">
        <div class="rule-title">${r.number} ${r.title}</div>
        <div>${r.desc}</div>
      </div>`
    ).join('');
    this.openModal(
      'ใบข้อปฏิบัติหอพักเรือนจันทร์',
      `<p style="margin-top:0;color:#fca5a5">กระดาษแผ่นนี้ถูกสอดไว้ใต้ประตูห้องพัก... ข้อความช่วงท้ายเขียนด้วยลายมือหวัดๆ เหมือนคนรีบเขียน</p>${html}`
    );
  }

  private openNotebookModal(): void {
    this.sound.playUIClick();
    const clueHtml =
      this.state.clues.length === 0
        ? '<p style="color:#9fa6b8">ยังไม่ได้จดบันทึกอะไรไว้ — ลองเดินดูรอบๆ หอพักก่อน</p>'
        : this.state.clues
            .map((id) => {
              const c = CLUES[id];
              return `<div class="clue-item"><div class="clue-title">${c.title}</div><div>${c.detail}</div></div>`;
            })
            .join('');

    this.openModal(
      `สมุดบันทึก (${this.state.clues.length}/${Object.keys(CLUES).length})`,
      `<p style="margin-top:0;color:#d6b270"><strong>สิ่งที่ต้องทำตอนนี้:</strong> ${this.getCurrentQuestText()}</p>${clueHtml}`
    );
  }

  private openMapModal(): void {
    this.sound.playUIClick();
    this.openModal(
      'แผนผังหอพักเรือนจันทร์ & ปากซอย 9',
      [
        { f: 3, title: 'ชั้น 3 — ชั้นปิดตาย', spots: 'หน้าต่างท้ายตึก • ทางเดินมืด • ห้อง 304' },
        { f: 2, title: 'ชั้น 2 — ชั้นพักอาศัย', spots: 'ห้อง 202 (ห้องคุณ) • ห้องน้ำรวม • ห้อง 204' },
        { f: 1, title: 'ชั้น 1 — โถงหอพัก', spots: 'บอร์ดประกาศ • ตู้จดหมาย • ห้องเก็บของ • ตู้คัตเอาต์' },
        { f: 0, title: 'ชั้น 0 — หน้าหอพัก & นอกซอย', spots: 'ป้อมยาม • ศาลพระภูมิ • โรงจอดรถ • ป้ายรถเมล์ • รถเข็นบะหมี่ • เซเว่น • ตลาดป้ากิม • ร้านอาหารอีสาน • กลุ่มเด็กช่าง & บ้านร้าง (ซ้ายสุด)' },
      ]
        .map(
          (item) => `
      <div class="map-floor ${this.state.floor === item.f ? 'current' : ''}">
        <strong>${item.title}</strong> ${this.state.floor === item.f ? '<span class="badge">อยู่ตรงนี้</span>' : ''}
        <div style="font-size:0.84rem;color:#9fa6b8;margin-top:4px">${item.spots}</div>
      </div>`
        )
        .join('') +
        '<p style="font-size:0.82rem;color:#9fa6b8">ชั้น 0 สามารถเดินออกไปทางซ้ายผ่านหน้าป้อมยามไปยังโรงจอดรถ ป้ายรถเมล์ รถเข็นบะหมี่ เซเว่น ตลาดป้ากิม ร้านอาหารอีสาน และบ้านร้างท้ายซอยได้</p>'
    );
  }

  private openKeypadModal(title: string, subtitle: string, answer: string, onSuccess: () => void): void {
    let code = '';
    this.openModal(
      title,
      `
      <p style="text-align:center;color:#9fa6b8;margin-top:0">${subtitle}</p>
      <div class="keypad-display" id="kp-disp">---</div>
      <div class="keypad-grid">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'ตกลง']
          .map((k) => `<button class="keypad-btn" data-kp="${k}">${k}</button>`)
          .join('')}
      </div>
      `
    );
    const disp = document.getElementById('kp-disp')!;
    this.modalBody.querySelectorAll('[data-kp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.sound.playSwitchClick();
        const val = (btn as HTMLElement).dataset.kp!;
        if (val === 'C') {
          code = '';
        } else if (val === 'ตกลง') {
          if (code === answer) {
            this.closeModal();
            onSuccess();
            return;
          } else {
            this.showToast('รหัสไม่ถูกต้อง!', true);
            code = '';
          }
        } else if (code.length < 3) {
          code += val;
        }
        disp.textContent = code.padEnd(3, '-');
      });
    });
  }

  private triggerEnding(type: EndingType): void {
    this.state.flags.endingReached = type;
    this.paused = true;
    this.chaseActive = false;
    this.chaseBanner.classList.add('hidden');
    this.saveGame();

    const endings: Record<EndingType, { title: string; subtitle: string; body: string }> = {
      true: {
        title: 'True Ending — แสงเช้าหลังคืนฝนตก',
        subtitle: 'ความจริงที่ถูกปิดเงียบมานานหนึ่งปี ถูกเปิดเผยในที่สุด',
        body: 'จดหมายขู่ คำให้การของลุงชัย เครื่องอัดเสียงจากหน้าห้อง 204 และสมุดบันทึกสีแดงของพริม เพียงพอที่จะรื้อคดีฆาตกรรมอำพรางขึ้นมาใหม่ เช้าวันนั้นตำรวจเข้าจับกุมรุ่นพี่ห้อง 204... คืนต่อๆ มา หอพักเรือนจันทร์ยังคงเก่าและเงียบเหมือนเดิม แต่ไม่เคยมีเสียงฝีเท้าเปียกน้ำหรือเสียงร้องไห้ดังมาจากชั้น 3 อีกเลย',
      },
      normal: {
        title: 'Normal Ending — เช้าวันที่รอดออกมาได้',
        subtitle: 'คุณหนีออกมาจากชั้น 3 ได้... แต่คดีของห้อง 304 ยังคงคลุมเครือ',
        body: 'คุณรีบเก็บกระเป๋าย้ายออกจากหอพักเรือนจันทร์ตั้งแต่ฟ้ายังไม่สาง แม้จะเปิดห้อง 304 ได้แล้ว แต่หลักฐานที่มีอยู่ยังไม่พอจะเอาผิดใครได้ ข่าวลือเรื่องผู้เช่าที่หายสาบสูญในซอย 9 ยังคงถูกเล่าต่อกันไปอีกนาน',
      },
      bad: {
        title: 'Bad Ending — ไม่มีใครลงมาจากชั้น 3',
        subtitle: 'ประตูห้อง 304 ปิดลงจากด้านใน...',
        body: 'ลุงชัยเดินขึ้นไปตรวจชั้น 3 ตอนรุ่งสางเมื่อเห็นโซ่คล้องบันไดขาดอยู่ แต่ประตูห้อง 304 กลับล็อกสนิทเหมือนเดิม ไม่มีใครเห็นนักศึกษาหนุ่มห้อง 202 เดินออกมาจากหอพักนั้นอีกเลย มีเพียงพวงกุญแจ 202 ที่ตกอยู่หน้าห้องน้ำรวมชั้น 2',
      },
    };

    const data = endings[type];
    this.openModal(
      data.title,
      `
      <h3 style="color:#f6d594;margin-top:0">${data.subtitle}</h3>
      <p>${data.body}</p>
      <div style="margin-top:16px;padding:10px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.86rem;color:#9fa6b8">
        บันทึกที่รวบรวมได้: <strong>${this.state.clues.length}/${Object.keys(CLUES).length}</strong> • วันที่อยู่ในหอ: วันที่ ${this.state.day}
      </div>
      <div style="margin-top:18px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
        <button id="btn-end-restart" class="secondary-btn">เล่น Chapter 1 ใหม่</button>
        <button id="btn-end-ch2" class="primary-btn">เล่นต่อ Chapter 2: บ้านทุ่งผีกระสือ (อีสาน)</button>
      </div>
      `
    );

    document.getElementById('btn-end-restart')?.addEventListener('click', () => {
      this.closeModal();
      this.paused = false;
      this.startNewGame();
    });
    document.getElementById('btn-end-ch2')?.addEventListener('click', () => {
      this.closeModal();
      this.onStartChapter2?.();
    });
  }

  private getCurrentQuestText(): string {
    const f = this.state.flags;
    if (!f.talkedToUncleIntro) return 'รับกุญแจห้อง 202 จากลุงยามตรงป้อมหน้าหอ';
    if (!this.state.clues.includes('notice_code')) return 'อ่านบอร์ดประกาศชั้น 1 เพื่อหาวิธีเปิดตู้จดหมาย 304';
    if (!this.state.clues.includes('parking_clue')) return 'เดินออกไปสืบหาวันที่คืนเกิดเหตุที่โรงจอดรถนอกหอ';
    if (!f.mailboxUnlocked) return 'ไขรหัสตู้จดหมายชั้น 1 (ชั้น + วันที่คืนเกิดเหตุ = 314)';
    if (!f.storageUnlocked || !this.state.inventory.includes('screwdriver')) return 'เปิดห้องเก็บของชั้น 1 ค้นแฟ้มเอกสารและเก็บอุปกรณ์ช่าง';
    if (!this.state.clues.includes('clerk_clue') || !f.gotHolyThread) return 'แวะร้าน 24-Seven ปากซอยซื้อของไหว้/กาแฟ พร้อมสืบพยาน "ต." แล้วไปไหว้ศาลพระภูมิ';
    if (!f.gotVoiceRecorder) return 'ตอนกลางคืน ค้นหาหลักฐานในห้องน้ำรวมและไขรหัสกล่องเหล็กห้อง 204';
    if (!f.unlockedFloor3) return 'นำกาแฟไปฝากลุงยามตอนดึก แล้วใช้คีมตัดโซ่ขึ้นชั้น 3';
    return 'ตรวจดูหลักฐานทั้งหมดในห้อง 304 เพื่อสรุปความจริง';
  }

  private showToast(msg: string, horror = false): void {
    const el = document.createElement('div');
    el.className = `toast ${horror ? 'horror' : ''}`;
    el.textContent = msg;
    this.toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  private rollWeather(): void {
    const r = Math.random();
    if (r < 0.28) this.state.weather = 'clear';
    else if (r < 0.52) this.state.weather = 'windy';
    else if (r < 0.8) this.state.weather = 'rain';
    else this.state.weather = 'storm';
  }

  private updateHUD(): void {
    const totalM = Math.floor(this.state.gameMinutes) % 1440;
    const hh = String(Math.floor(totalM / 60)).padStart(2, '0');
    const mm = String(totalM % 60).padStart(2, '0');
    this.hudClock.textContent = `${hh}:${mm}`;

    const period = this.world.getTimePeriod(this.state.gameMinutes);
    const periodMap: Record<TimePeriod, string> = {
      dawn: 'รุ่งสาง',
      morning: 'เช้า',
      noon: 'เที่ยง',
      evening: 'เย็น',
      night: 'กลางคืน',
    };
    this.hudPeriod.textContent = periodMap[period];

    const weatherMap: Record<WeatherType, string> = {
      clear: 'โปร่ง',
      windy: 'ลมแรง',
      rain: 'ฝนตก',
      storm: 'พายุฟ้าคะนอง',
    };
    this.hudWeather.textContent = weatherMap[this.state.weather];

    const roomNames: Record<RoomId, string> = {
      outside: '',
      storage: 'ภายในห้องเก็บของ (ชั้น 1)',
      room202: 'ภายในห้อง 202 (ห้องพักของคุณ)',
      bathroom2: 'ภายในห้องน้ำรวม (ชั้น 2)',
      room204: 'ภายในห้อง 204 (ห้องพี่ต้อม)',
      room304: 'ภายในห้อง 304 (จุดเกิดเหตุ)',
      seven24: 'ภายในร้านสะดวกซื้อ 24-Seven ปากซอย 9',
    };
    this.hudLocation.textContent =
      this.currentRoom !== 'outside'
        ? roomNames[this.currentRoom]
        : this.state.floor === 0 && this.state.x < -14.5
        ? 'นอกหอพัก — ปากซอย 9 (โรงจอดรถ / ป้ายรถเมล์ / ตลาด)'
        : FLOOR_NAMES[this.state.floor];
    this.hudSanityVal.textContent = `${this.state.sanity}%`;
    this.hudSanityFill.style.width = `${this.state.sanity}%`;
    this.hudSanityFill.style.background =
      this.state.sanity > 60
        ? '#679c77'
        : this.state.sanity > 30
        ? '#c99746'
        : '#b83b3b';

    this.sanityOverlay.classList.toggle('low-sanity', this.state.sanity <= 55 && this.state.sanity > 25);
    this.sanityOverlay.classList.toggle('critical-sanity', this.state.sanity <= 25);
    const guide = this.getNavigationGuide();
    this.hudQuest.textContent = `เป้าหมาย: ${guide.text}`;
    this.hudNav.textContent = guide.direction;
  }

  private getNavigationGuide(): { text: string; direction: string } {
    const f = this.state.flags;
    const period = this.world.getTimePeriod(this.state.gameMinutes);
    const inv = this.state.inventory;

    let targetRoom: RoomId = 'outside';
    let targetFloor: FloorIndex = 0;
    let targetX = -8.5;
    let text = '';

    if (!f.talkedToUncleIntro) {
      targetRoom = 'outside';
      targetFloor = 0;
      targetX = -8.5;
      text = 'คุยกับลุงชัยตรงป้อมยามเพื่อรับกุญแจห้อง 202';
    } else if (!this.state.clues.includes('notice_code')) {
      targetRoom = 'outside';
      targetFloor = 1;
      targetX = -9.2;
      text = 'ขึ้นบันไดขวาไปชั้น 1 อ่านบอร์ดประกาศหอพัก';
    } else if (!this.state.clues.includes('parking_clue')) {
      targetRoom = 'outside';
      targetFloor = 0;
      targetX = -19.5;
      text = 'เดินออกประตูซ้ายนอกหอ ไปสืบวันที่คืนเกิดเหตุที่โรงจอดรถ';
    } else if (!f.mailboxUnlocked) {
      targetRoom = 'outside';
      targetFloor = 1;
      targetX = -4.5;
      text = 'ไขรหัสตู้จดหมายชั้น 1 ด้วยเลขชั้น + วันที่คืนนั้น (314)';
    } else if (!f.storageUnlocked || !inv.includes('wire_cutter') || !inv.includes('screwdriver') || !this.state.clues.includes('dorm_ledger')) {
      targetFloor = 1;
      if (this.currentRoom !== 'storage') {
        targetRoom = 'outside';
        targetX = 2.5;
        text = 'ไขประตูเข้าห้องเก็บของใต้บันได (ชั้น 1)';
      } else if (!this.state.clues.includes('dorm_ledger')) {
        targetRoom = 'storage';
        targetX = -0.4;
        text = 'ค้นลังแฟ้มเอกสารเก่าเพื่อเช็กชื่อย่อ "ต."';
      } else {
        targetRoom = 'storage';
        targetX = 2.8;
        text = 'เก็บคีมตัดเหล็กและไขควงหัวแฉกบนชั้นวางของ';
      }
    } else if (!this.state.clues.includes('clerk_clue') || (!inv.includes('incense_soda') && !f.gotHolyThread) || (!inv.includes('canned_coffee') && !f.gaveUncleCoffee)) {
      targetFloor = 0;
      if (this.currentRoom !== 'seven24') {
        targetRoom = 'outside';
        targetX = -51.5;
        text = 'เดินเข้าไปในร้าน 24-Seven ปากซอย ซื้อกาแฟ ชุดธูปน้ำแดง และถามพนักงานเรื่อง "ช่างตง"';
      } else if (!this.state.clues.includes('clerk_clue')) {
        targetRoom = 'seven24';
        targetX = 3.1;
        text = 'คุยกับพนักงานแคชเชียร์ฝั่งขวาเพื่อถามพยานคืน 14 ต.ค.';
      } else {
        targetRoom = 'seven24';
        targetX = -1.8;
        text = 'หยิบกาแฟกระป๋องและชุดธูปน้ำแดงที่ตู้แช่ (หรือแวะดูตู้เหล้าขาว)';
      }
    } else if (!f.gotHolyThread && !f.gotTalisman) {
      targetRoom = 'outside';
      targetFloor = 0;
      targetX = 6.2;
      text = 'กลับมาหน้าหอ ถวายธูป & น้ำแดงที่ศาลพระภูมิ (รับสายสิญจน์ป้องกันตัว)';
    } else if (!inv.includes('room304_key')) {
      if (period !== 'night') {
        targetFloor = 2;
        if (this.currentRoom !== 'room202') {
          targetRoom = 'outside';
          targetX = -9.5;
          text = 'เข้าห้อง 202 (ชั้น 2) เพื่อนอนรอให้ถึงช่วงกลางคืน';
        } else {
          targetRoom = 'room202';
          targetX = 2.8;
          text = 'ไปที่เตียงนอนห้อง 202 กดรอถึงกลางคืน (21:30)';
        }
      } else {
        targetFloor = 2;
        if (this.currentRoom !== 'bathroom2') {
          targetRoom = 'outside';
          targetX = -2.5;
          text = 'เข้าห้องน้ำรวมชั้น 2 ตอนกลางคืน';
        } else if (!f.sawBathroomGhost) {
          targetRoom = 'bathroom2';
          targetX = -1.4;
          text = 'ส่องกระจกอ่างล้างหน้าในห้องน้ำ';
        } else {
          targetRoom = 'bathroom2';
          targetX = -0.2;
          text = 'ใช้ไขควงงัดฝาท่อระบายน้ำกลางห้องน้ำเพื่อเก็บกุญแจ 304';
        }
      }
    } else if (!f.gotVoiceRecorder) {
      if (period !== 'night') {
        targetFloor = 2;
        if (this.currentRoom !== 'room202') {
          targetRoom = 'outside';
          targetX = -9.5;
          text = 'เข้าห้อง 202 เพื่อรอเวลาให้ถึงกลางคืน';
        } else {
          targetRoom = 'room202';
          targetX = 2.8;
          text = 'ไปที่เตียงนอน กดรอถึงกลางคืน (21:30)';
        }
      } else if (this.currentRoom !== 'room204') {
        targetRoom = 'outside';
        targetFloor = 2;
        targetX = 5.4;
        text = 'แอบย่องเข้าไปในห้อง 204 (ชั้น 2) เพื่อหาหลักฐาน';
      } else {
        targetRoom = 'room204';
        targetX = 3.0;
        text = 'อ่านโน้ตบนโต๊ะ แล้วไขรหัสกล่องเหล็กใต้เตียงพี่ต้อม (414)';
      }
    } else if (!f.uncleSecretRevealed && inv.includes('canned_coffee') && period === 'night') {
      targetRoom = 'outside';
      targetFloor = 0;
      targetX = -8.5;
      text = 'นำกาแฟกระป๋องไปให้ลุงชัยที่ป้อมยามตอนดึก (เพื่อรู้ความจริง + รับผ้ายันต์)';
    } else if (!f.unlockedFloor3) {
      targetRoom = 'outside';
      targetFloor = 2;
      targetX = 11.4;
      text = 'เดินไปบันไดฝั่งขวาชั้น 2 กด [E] ใช้คีมตัดโซ่ขึ้นชั้น 3';
    } else if (this.currentRoom !== 'room304') {
      targetRoom = 'outside';
      targetFloor = 3;
      targetX = 3.5;
      text = 'ขึ้นบันไดไปชั้น 3 แล้วไขประตูเข้าไปในห้อง 304';
    } else if (!f.checkedRoom304Chair) {
      targetRoom = 'room304';
      targetFloor = 3;
      targetX = -0.3;
      text = 'ตรวจดูเก้าอี้ไม้ที่ล้มผิดปกติและรอยครูดบนพื้น';
    } else if (!f.gotCctvCard) {
      targetRoom = 'room304';
      targetFloor = 3;
      targetX = -1.2;
      text = 'ค้นกองแฟ้มเอกสารที่ตกกระจายเพื่อหา SD Card กล้องชั้น 3';
    } else {
      targetRoom = 'room304';
      targetFloor = 3;
      targetX = 1.4;
      text = 'เดินไปที่โต๊ะเครื่องแป้ง หยิบสมุดบันทึกสีแดงและสรุปคดีต่อหน้าพริม';
    }

    // Compute live directional hint
    let direction = '';
    if (this.currentRoom !== targetRoom) {
      if (this.currentRoom !== 'outside') {
        const dxExit = -4.6 - this.state.x;
        direction =
          Math.abs(dxExit) <= 1.4
            ? 'กด [E] ออกจากห้องนี้ก่อน'
            : dxExit < 0
            ? '◀ เดินไปประตูฝั่งซ้ายเพื่อออกจากห้อง'
            : '▶ เดินไปประตูเพื่อออกจากห้อง';
      } else {
        direction = this.computeOutsideDirection(targetFloor, targetX);
      }
    } else if (this.currentRoom === 'outside' && this.state.floor !== targetFloor) {
      direction = this.computeOutsideDirection(targetFloor, targetX);
    } else {
      const dx = targetX - this.state.x;
      if (Math.abs(dx) <= 1.45) {
        direction = 'ถึงจุดหมายแล้ว — กด [E] เพื่อโต้ตอบ';
      } else if (dx < 0) {
        direction = `◀ เดินไปทางซ้าย (${Math.round(Math.abs(dx))} ม.)`;
      } else {
        direction = `▶ เดินไปทางขวา (${Math.round(Math.abs(dx))} ม.)`;
      }
    }

    return { text, direction };
  }

  private computeOutsideDirection(targetFloor: FloorIndex, targetX: number): string {
    if (this.state.floor !== targetFloor) {
      const dxStair = STAIR_X - this.state.x;
      if (Math.abs(dxStair) <= 1.5) {
        return targetFloor > this.state.floor
          ? `▲ กด [W] ขึ้นบันไดไปชั้น ${this.state.floor + 1}`
          : `▼ กด [S] ลงบันไดไปชั้น ${this.state.floor - 1}`;
      }
      return dxStair > 0
        ? `▶ เดินไปบันไดฝั่งขวา (เพื่อไปชั้น ${targetFloor})`
        : `◀ เดินไปบันได`;
    }
    const dx = targetX - this.state.x;
    if (Math.abs(dx) <= 1.45) return 'ถึงจุดหมายแล้ว — กด [E]';
    return dx < 0
      ? `◀ เดินไปทางซ้าย (${Math.round(Math.abs(dx))} ม.)`
      : `▶ เดินไปทางขวา (${Math.round(Math.abs(dx))} ม.)`;
  }

  private evaluateRulesAndChase(dt: number, period: TimePeriod): void {
    if (this.chaseCooldown > 0) this.chaseCooldown -= dt;
    if (this.floor3RuleCooldown > 0) this.floor3RuleCooldown -= dt;

    const inSafeZone =
      this.currentRoom === 'room202' ||
      (this.currentRoom === 'outside' &&
        ((this.state.floor === 0 && this.state.x <= -6.6) ||
          (this.state.floor === 2 && this.state.x <= -8.0 && this.state.flags.gotRoom202Key)));

    if (this.chaseActive) {
      if (inSafeZone) {
        this.stopGhostChase('ประตูปิดลงทันเวลา... เสียงฝีเท้าข้างนอกค่อยๆ เงียบหายไป');
        return;
      }

      this.chaseTimer -= dt;
      if (this.chaseTimer <= 0) {
        this.stopGhostChase('เสียงหายใจเย็นเยือกถอยห่างเข้าไปในมุมมืด...');
        return;
      }

      if (this.primPos.floor !== this.state.floor) {
        this.primPos.floor = this.state.floor;
        this.primPos.x = STAIR_X + 0.5;
      }
      const dir = this.state.x > this.primPos.x ? 1 : -1;
      const chaseSpeed = this.state.floor === 3 ? 3.25 : 2.85;
      this.primPos.x += dir * chaseSpeed * dt;
      this.primShowTimer = 1.0;

      if (Math.abs(this.primPos.x - this.state.x) < 0.85) {
        this.stopGhostChase();
        this.triggerScare(
          38,
          'มือเย็นเฉียบคว้าเข้าที่ไหล่คุณเต็มแรง! กลิ่นน้ำอบคละคลุ้งจนแทบขาดสติ!',
          this.state.floor,
          this.state.x + (this.facing * -0.5)
        );
      }
      return;
    }

    if (inSafeZone || this.chaseCooldown > 0) {
      this.darkRuleTimer = 0;
      this.shineAtGhostTimer = 0;
      return;
    }

    const hasProtection =
      this.state.inventory.includes('holy_thread') || this.state.inventory.includes('talisman');
    if (this.state.floor === 3 && period === 'night' && !hasProtection && this.floor3RuleCooldown <= 0) {
      this.floor3RuleCooldown = 18;
      this.startGhostChase('ลมหนาวพัดวูบมาจากปลายทางเดินมืด... มีคนกำลังเดินตรงเข้ามาหาคุณ!');
      return;
    }

    if (this.state.flags.breakerTripped && this.state.floor >= 1 && !this.state.flashlightOn) {
      this.darkRuleTimer += dt;
      if (this.darkRuleTimer >= 6.0) {
        this.darkRuleTimer = 0;
        this.startGhostChase('มีเสียงกระซิบดังขึ้นข้างหูในความมืด... บางอย่างขยับเข้ามาใกล้แล้ว!');
        return;
      }
    } else {
      this.darkRuleTimer = 0;
    }

    if (
      this.primShowTimer > 0 &&
      this.primPos.floor === this.state.floor &&
      this.state.flashlightOn &&
      Math.sign(this.primPos.x - this.state.x) === this.facing &&
      Math.abs(this.primPos.x - this.state.x) < 8.5
    ) {
      this.shineAtGhostTimer += dt;
      if (this.shineAtGhostTimer >= 1.4) {
        this.shineAtGhostTimer = 0;
        this.startGhostChase('แสงไฟฉายส่องกระทบใบหน้าซีดขาว... เธอหันขวับแล้วพุ่งตรงเข้ามา!', this.primPos.x);
      }
    } else {
      this.shineAtGhostTimer = 0;
    }
  }

  private loop(now: number): void {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (!this.paused) {
      const canMove = !this.modalOpen && this.activeDialogue.length === 0;
      let moveX = 0;
      let moveZ = 0;

      if (canMove) {
        if (this.codes.has('KeyA') || this.codes.has('ArrowLeft') || this.touchMoveDir === -1) moveX -= 1;
        if (this.codes.has('KeyD') || this.codes.has('ArrowRight') || this.touchMoveDir === 1) moveX += 1;
        if (Math.abs(this.state.x - STAIR_X) > 1.55) {
          if (this.codes.has('KeyW') || this.codes.has('ArrowUp')) moveZ -= 1;
          if (this.codes.has('KeyS') || this.codes.has('ArrowDown')) moveZ += 1;
        }
      }

      const isMoving = moveX !== 0 || moveZ !== 0;
      if (isMoving) {
        if (moveX !== 0) this.facing = moveX > 0 ? 1 : -1;
        const minX =
          this.currentRoom !== 'outside' ? -5.1 : this.state.floor === 0 ? STREET_MIN_X : WORLD_MIN_X;
        const maxX = this.currentRoom !== 'outside' ? 5.1 : WORLD_MAX_X;
        this.state.x = Math.max(minX, Math.min(maxX, this.state.x + moveX * 4.45 * dt));
        this.playerZ = Math.max(-0.35, Math.min(0.95, this.playerZ + moveZ * 2.1 * dt));
        this.updateHUD();

        this.stepTimer -= dt;
        if (this.stepTimer <= 0) {
          this.stepTimer = 0.28;
          const surf =
            this.state.floor === 0 && (this.state.weather === 'rain' || this.state.weather === 'storm')
              ? 'wet'
              : this.state.floor === 3
              ? 'wood'
              : 'concrete';
          this.sound.playFootstep(surf);
        }
      }

      const prevFloorMin = Math.floor(this.state.gameMinutes);
      this.state.gameMinutes += dt * 1.5;
      if (this.state.gameMinutes >= 1440) {
        this.state.gameMinutes -= 1440;
        this.state.day += 1;
      }
      if (Math.floor(this.state.gameMinutes) !== prevFloorMin) {
        this.updateHUD();
      }

      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.weatherTimer = 45 + Math.random() * 45;
        this.rollWeather();
        this.updateHUD();
      }

      if (this.stairCooldown > 0) this.stairCooldown -= dt;
      this.autoSaveTimer -= dt;
      if (this.autoSaveTimer <= 0) {
        this.autoSaveTimer = 5;
        this.saveGame();
      }

      if (this.primShowTimer > 0 && !this.chaseActive) {
        this.primShowTimer -= dt;
      }

      const period = this.world.getTimePeriod(this.state.gameMinutes);
      if (canMove) {
        if (this.drunkMode) {
          this.updateDrunkZombieMode(dt);
        } else {
          this.evaluateRulesAndChase(dt, period);
        }
      }

      const nearStairs = this.currentRoom === 'outside' && Math.abs(this.state.x - STAIR_X) <= 1.55;
      this.touchUp.classList.toggle('hidden', !(nearStairs && this.state.floor < 3));
      this.touchDown.classList.toggle('hidden', !(nearStairs && this.state.floor > 0));

      const nearest = canMove ? this.getNearestInteractable() : null;
      if (nearest) {
        this.interactPrompt.classList.remove('hidden');
        this.interactLabel.textContent = nearest.getLabel ? nearest.getLabel() : nearest.label;
      } else if (nearStairs && canMove) {
        this.interactPrompt.classList.remove('hidden');
        const dirText =
          this.state.floor === 0
            ? 'กด [W] ขึ้นชั้น 1'
            : this.state.floor === 3
            ? 'กด [S] ลงชั้น 2'
            : 'กด [W] ขึ้น / [S] ลงบันได';
        this.interactLabel.textContent = dirText;
      } else {
        this.interactPrompt.classList.add('hidden');
      }

      this.sound.updateAmbience(
        dt,
        this.state.weather,
        period,
        this.chaseActive ? Math.min(20, this.state.sanity) : this.state.sanity,
        this.state.floor,
        this.chaseActive
      );

      const showTom = period !== 'night';
      const hour = this.state.gameMinutes / 60;
      const showVendor = hour >= 5.5 && hour < 20.5;
      this.world.update(
        dt,
        this.state.x,
        this.playerZ,
        this.state.floor,
        this.currentRoom,
        this.facing,
        isMoving,
        this.state.flashlightOn,
        this.state.gameMinutes,
        this.state.weather,
        this.state.flags.breakerTripped,
        this.state.flags.unlockedFloor3,
        this.state.flags.unlockedRoom304,
        showTom,
        showVendor,
        this.primShowTimer > 0 || this.chaseActive,
        this.chaseActive,
        this.primPos,
        this.state.sanity,
        this.drunkMode,
        this.zombies,
        this.gunFlashTimer,
        this.gunBeamEndX
      );
    }

    if (this.running) {
      this.rafId = requestAnimationFrame((t) => this.loop(t));
    }
  }
}
