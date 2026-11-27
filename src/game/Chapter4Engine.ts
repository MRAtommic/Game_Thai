import { Ch4CharacterKind, drawCh4CharacterCanvas, drawCh4ItemIconDataUrl } from '../art/Chapter4Sprites';
import { SoundEngine } from '../audio/SoundEngine';
import { speakDialogueLine, stopVoiceActing } from '../audio/VoiceActor';
import { CH4_CLUES, CH4_ITEMS, CH4_RULES, CH4_ZONE_NAMES } from '../data/chapter4Data';
import { DialogueLine, EndingType, FloorIndex, TimePeriod, WeatherType } from '../types';
import { CutscenePlayer, IsaanCutsceneId } from '../ui/CutscenePlayer';
import { renderSharedInventoryBar } from '../ui/InventoryBar';
import { bindCameraZoomControls } from '../ui/mobileZoom';
import { CH4_ROOM_META, Ch4RoomId } from '../world/AyutthayaInteriorRooms';
import { AyutthayaMood, AyutthayaWorld, CH4_MAX_X, CH4_MIN_X } from '../world/AyutthayaWorld';

const CH4_SAVE_KEY = 'reuan_chan_ch4_save_v1';
const PIER_XS = [-168, -128, -84, -36, 18, 72, 134, 178];

interface Ch4Flags {
  act: 1 | 2 | 3 | 4;
  talkedSmithIntro: boolean;
  practicedSword: boolean;
  talkedPhudsornIntro: boolean;
  inspectedSampan: boolean;
  talkedKhunRamIntro: boolean;
  talkedMonkIntro: boolean;
  plagueOutbreakStarted: boolean;
  plagueWaveCleared: boolean;
  riotStarted: boolean;
  sueaKhamDefeated: boolean;
  endingReached: EndingType | null;
}

interface Ch4SaveState {
  gameMinutes: number;
  day: number;
  weather: WeatherType;
  x: number;
  hp: number;
  sanity: number;
  stamina: number;
  arrows: number;
  torchOn: boolean;
  isRowing: boolean;
  isRidingHorse?: boolean;
  inventory: string[];
  clues: string[];
  rescuedIds: string[];
  deadIds: string[];
  extinguishedFireIds: string[];
  flags: Ch4Flags;
}

const DEFAULT_CH4_FLAGS = (): Ch4Flags => ({
  act: 1,
  talkedSmithIntro: false,
  practicedSword: false,
  talkedPhudsornIntro: false,
  inspectedSampan: false,
  talkedKhunRamIntro: false,
  talkedMonkIntro: false,
  plagueOutbreakStarted: false,
  plagueWaveCleared: false,
  riotStarted: false,
  sueaKhamDefeated: false,
  endingReached: null,
});

export class Chapter4Engine {
  private world: AyutthayaWorld;
  private sound: SoundEngine;
  private cutscene = new CutscenePlayer();
  private onExitToMenu: () => void;

  private state: Ch4SaveState;
  private ac = new AbortController();
  private running = false;
  private rafId = 0;
  private lastTime = 0;

  private codes = new Set<string>();
  private touchMoveDir = 0;
  private isSprintingTouch = false;
  private playerFacing: 1 | -1 = 1;
  private swordCd = 0;
  private bowCd = 0;
  private enemyAtkClock = 0;
  private arrowRegenTimer = 0;
  private pretaSoundTimer = 10;
  private currentRoom: Ch4RoomId = 'outside';
  private outsideReturnX = -84;
  private roomBonusClaimed = new Set<string>();

  private activeDialogue: DialogueLine[] = [];
  private currentLineIdx = 0;
  private modalOpen = false;

  private hudTop = document.getElementById('hud-top')!;
  private hudClock = document.getElementById('hud-clock')!;
  private hudPeriod = document.getElementById('hud-period')!;
  private hudWeather = document.getElementById('hud-weather')!;
  private hudLocation = document.getElementById('hud-location')!;
  private hudExtra = document.getElementById('hud-extra');
  private hudSanityVal = document.getElementById('hud-sanity-val')!;
  private hudSanityFill = document.getElementById('hud-sanity-fill')!;
  private hudQuest = document.getElementById('hud-quest')!;
  private hudNav = document.getElementById('hud-nav')!;
  private invBar = document.getElementById('inventory-bar')!;
  private chaseBanner = document.getElementById('chase-banner')!;
  private mobileControls = document.getElementById('mobile-controls')!;
  private interactPrompt = document.getElementById('interact-prompt')!;
  private interactLabel = document.getElementById('interact-label')!;
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
  private touchFlashlight = document.getElementById('touch-flashlight')!;
  private touchBike = document.getElementById('touch-bike')!;
  private touchSprint = document.getElementById('touch-sprint');
  private touchShoot = document.getElementById('touch-shoot');
  private touchBow = document.getElementById('touch-bow');

  constructor(canvas: HTMLCanvasElement, sound: SoundEngine, onExitToMenu: () => void) {
    this.world = new AyutthayaWorld(canvas);
    this.sound = sound;
    this.onExitToMenu = onExitToMenu;
    this.state = this.createNewState();
    this.bindInputs();
  }

  private createNewState(): Ch4SaveState {
    return {
      gameMinutes: 8 * 60 + 45,
      day: 1,
      weather: 'clear',
      x: -84,
      hp: 100,
      sanity: 100,
      stamina: 100,
      arrows: 12,
      torchOn: false,
      isRowing: false,
      isRidingHorse: false,
      inventory: ['resin_torch'],
      clues: [],
      rescuedIds: [],
      deadIds: [],
      extinguishedFireIds: [],
      flags: DEFAULT_CH4_FLAGS(),
    };
  }

  public startNewGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    this.state = this.createNewState();
    this.currentRoom = 'outside';
    this.roomBonusClaimed.clear();
    this.world.clearDynamicActors();
    this.saveGame();
    this.beginPlay();
    this.playCutscene('ayutthaya_life', () => {
      this.startDialogue([
        {
          speaker: 'มั่น (กรุงศรีอยุธยา — ยามสงบสุข)',
          role: 'ศิษย์ช่างตีดาบหลวง',
          portrait: 'player',
          text: 'แดดยามเช้าเหนือกรุงอโยธยาช่างงดงามนัก ลุงสินเรียกให้ไปรับดาบเหล็กน้ำพี้กับหน้าไม้ที่โรงตีเหล็กด้านขวา ก่อนล่องเรือไปตรวจสินค้าที่ตลาดท่าเรือ... วันนี้ช่างดูสงบสุขเหลือเกิน',
        },
      ]);
    });
  }

  public continueGame(): void {
    this.sound.init();
    this.sound.playUIClick();
    try {
      const raw = localStorage.getItem(CH4_SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Ch4SaveState;
        this.state = {
          ...this.createNewState(),
          ...parsed,
          flags: { ...DEFAULT_CH4_FLAGS(), ...(parsed.flags || {}) },
        };
      }
    } catch {
      this.state = this.createNewState();
    }
    this.currentRoom = 'outside';
    this.roomBonusClaimed.clear();
    this.rebuildPhaseActorsFromSave();
    this.beginPlay();
    this.showToast('โหลดบทที่ ๔: ผีห่าอโยธยา เรียบร้อย');
  }

  private rebuildPhaseActorsFromSave(): void {
    this.world.clearDynamicActors();
    const f = this.state.flags;
    this.world.getFireViews().forEach((fv) => {
      fv.active = f.act >= 3 && !this.state.extinguishedFireIds.includes(fv.id);
      fv.extinguished = this.state.extinguishedFireIds.includes(fv.id);
    });
    if (f.act === 2) {
      this.spawnAct2Actors();
    } else if (f.act === 3) {
      this.spawnAct3Actors();
    } else if (f.act === 4) {
      this.spawnAct4Actors();
    }
  }

  private playCutscene(id: IsaanCutsceneId, after?: () => void): void {
    this.codes.clear();
    this.touchMoveDir = 0;
    this.cutscene.play(id, after);
  }

  private beginPlay(): void {
    document.getElementById('title-screen')?.classList.add('hidden');
    this.hudTop.classList.remove('hidden');
    this.hudExtra?.classList.remove('hidden');
    this.invBar.classList.remove('hidden');
    document.getElementById('touch-up')?.classList.add('hidden');
    document.getElementById('touch-down')?.classList.add('hidden');
    document.getElementById('touch-photo')?.classList.add('hidden');

    const muted = this.sound.isMuted();
    const sSpan = this.btnSound.querySelector('span');
    if (sSpan) sSpan.textContent = muted ? 'เสียง: ปิด' : 'เสียง: เปิด';
    this.btnSound.classList.toggle('muted', muted);

    const fSpan = this.btnFlashlight.querySelector('span');
    if (fSpan) fSpan.textContent = this.state.torchOn ? 'คบไฟ: เปิด' : 'คบไฟ';

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
    this.mobileControls.classList.toggle('hidden', !isTouch);
    this.touchFlashlight.classList.toggle('hidden', !isTouch);
    this.touchFlashlight.textContent = this.state.torchOn ? '🔥✓' : '🔥';
    this.touchBike.classList.toggle('hidden', !isTouch);
    this.touchBike.textContent = this.state.isRowing ? '🚣✓' : '🚣 เรือ';
    this.touchSprint?.classList.toggle('hidden', !isTouch);
    if (this.touchShoot) {
      this.touchShoot.classList.toggle('hidden', !isTouch);
      this.touchShoot.textContent = '⚔️ ฟันดาบ';
    }
    if (this.touchBow) {
      this.touchBow.classList.toggle('hidden', !isTouch);
      this.touchBow.textContent = '🏹 ธนู';
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
    stopVoiceActing();
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ac.abort();
    this.chaseBanner.classList.add('hidden');
    this.touchBike.classList.add('hidden');
    this.touchFlashlight.classList.add('hidden');
    this.touchSprint?.classList.add('hidden');
    if (this.touchShoot) {
      this.touchShoot.classList.add('hidden');
      this.touchShoot.textContent = 'ยิงปืน!';
    }
    if (this.touchBow) this.touchBow.classList.add('hidden');
    const fSpan = this.btnFlashlight.querySelector('span');
    if (fSpan) fSpan.textContent = 'ไฟฉาย';
    this.hudExtra?.classList.add('hidden');
    this.interactPrompt.classList.add('hidden');
    this.dialogueBox.classList.add('hidden');
    this.modalBackdrop.classList.add('hidden');
    this.world.dispose();
  }

  private saveGame(): void {
    try {
      localStorage.setItem(CH4_SAVE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  private bindInputs(): void {
    const sig = { signal: this.ac.signal };
    const handleResize = () => {
      this.world.resize();
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
      this.mobileControls.classList.toggle('hidden', !isTouch);
      this.touchFlashlight.classList.toggle('hidden', !isTouch);
      this.touchBike.classList.toggle('hidden', !isTouch);
      this.touchSprint?.classList.toggle('hidden', !isTouch);
      this.touchShoot?.classList.toggle('hidden', !isTouch);
      this.touchBow?.classList.toggle('hidden', !isTouch);
    };
    window.addEventListener('resize', handleResize, sig);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 120), sig);
    window.addEventListener('blur', () => {
      this.codes.clear();
      this.touchMoveDir = 0;
    }, sig);

    bindCameraZoomControls(this.world.getCanvas(), (f) => this.world.setZoomFactor(f), this.ac.signal, (m) => this.showToast(m));

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
          e.preventDefault();
          this.swingSword();
        } else if (code === 'KeyG') {
          e.preventDefault();
          this.shootBow();
        } else if (code === 'KeyT') {
          this.toggleTorch();
        } else if (code === 'KeyB') {
          this.toggleBoat();
        } else if (code === 'KeyH') {
          this.toggleHorse();
        } else if (code === 'KeyQ') {
          if (this.state.inventory.includes('herb_medicine')) this.useItem('herb_medicine');
          else if (this.state.inventory.includes('holy_water')) this.useItem('holy_water');
        } else if (code === 'KeyR') {
          this.openRulesModal();
        } else if (code === 'KeyN') {
          this.openNotebookModal();
        } else if (code === 'KeyM') {
          this.openMapModal();
        } else if (code.startsWith('Digit')) {
          const idx = Number(code.replace('Digit', '')) - 1;
          if (idx >= 0 && this.state.inventory[idx]) this.useItem(this.state.inventory[idx]);
        }
      },
      sig
    );
    window.addEventListener('keyup', (e) => this.codes.delete(e.code), sig);

    const blur = () => (document.activeElement as HTMLElement | null)?.blur();
    this.btnFlashlight.addEventListener('click', () => { blur(); this.toggleTorch(); }, sig);
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
        const s = this.btnSound.querySelector('span');
        if (s) s.textContent = next ? 'เสียง: ปิด' : 'เสียง: เปิด';
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
      let pId: number | null = null;
      const start = (ev: PointerEvent) => {
        ev.preventDefault();
        this.sound.init();
        pId = ev.pointerId;
        this.touchMoveDir = dir;
        btn.classList.add('pressed');
      };
      const end = (ev: PointerEvent) => {
        if (pId !== null && ev.pointerId !== pId) return;
        ev.preventDefault();
        pId = null;
        if (this.touchMoveDir === dir) this.touchMoveDir = 0;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', start, sig);
      btn.addEventListener('pointerup', end, sig);
      btn.addEventListener('pointercancel', end, sig);
    };
    bindHold('touch-left', -1);
    bindHold('touch-right', 1);

    document.getElementById('touch-interact')!.addEventListener('click', () => {
      this.sound.init();
      if (this.activeDialogue.length > 0) this.advanceDialogue();
      else this.tryInteract();
    }, sig);
    this.touchFlashlight.addEventListener('click', () => { this.sound.init(); this.toggleTorch(); }, sig);
    this.touchBike.addEventListener('click', () => {
      this.sound.init();
      const nearPier = PIER_XS.some((px) => Math.abs(px - this.state.x) < 4.2);
      if (this.state.isRowing || nearPier) this.toggleBoat();
      else this.toggleHorse();
    }, sig);
    this.touchSprint?.addEventListener('click', () => {
      this.sound.init();
      this.isSprintingTouch = !this.isSprintingTouch;
      this.touchSprint?.classList.toggle('active', this.isSprintingTouch);
      if (this.touchSprint) this.touchSprint.textContent = this.isSprintingTouch ? '🏃 วิ่ง✓' : '🏃 วิ่ง';
    }, sig);
    this.touchShoot?.addEventListener('click', () => { this.sound.init(); this.swingSword(); }, sig);
    this.touchBow?.addEventListener('click', () => { this.sound.init(); this.shootBow(); }, sig);
  }

  private toggleTorch(): void {
    this.state.torchOn = !this.state.torchOn;
    const s = this.btnFlashlight.querySelector('span');
    if (s) s.textContent = this.state.torchOn ? 'คบไฟ: เปิด' : 'คบไฟ';
    this.touchFlashlight.textContent = this.state.torchOn ? '🔥✓' : '🔥';
    this.sound.playUIClick();
  }

  private toggleBoat(): void {
    if (this.state.isRowing) {
      const nearPier = PIER_XS.find((px) => Math.abs(px - this.state.x) < 4.5);
      if (!nearPier) {
        this.showToast('พายไปเทียบใกล้ท่าน้ำ [ท่าเรือ -168, -128, -84, -36, 18, 72, 134, 178] ก่อนขึ้นฝั่ง!');
        return;
      }
      this.state.isRowing = false;
      this.state.x = nearPier;
      this.sound.playWaterSplash();
      this.touchBike.textContent = '🚣 เรือ';
      this.showToast('ขึ้นฝั่งจากเรือพายแล้ว');
      return;
    }
    const nearPier = PIER_XS.find((px) => Math.abs(px - this.state.x) < 4.5);
    if (!nearPier) {
      this.showToast('ต้องเดินไปที่ท่าน้ำริมคลอง (เสาป้ายท่าน้ำ) เพื่อลงเรือพาย!');
      return;
    }
    this.state.isRidingHorse = false;
    this.state.isRowing = true;
    this.sound.playWaterSplash();
    this.touchBike.textContent = '🚣✓';
    this.showToast('ลงเรือพายแล้ว — กด ◀ ▶ พายล่องคลองหนีผีห่าได้เลย!');
  }

  private toggleHorse(): void {
    if (this.state.isRowing) {
      this.showToast('ต้องเทียบท่าขึ้นฝั่ง [E] ก่อนจึงจะขึ้นขี่ม้าได้!');
      return;
    }
    this.state.isRidingHorse = !this.state.isRidingHorse;
    this.sound.playUIClick();
    this.showToast(this.state.isRidingHorse ? 'ควบม้าศึกอโยธยา! วิ่งไวขึ้นและฟันดาบบนหลังม้าได้ [F]' : 'ลงจากหลังม้าแล้ว');
  }

  private swingSword(): void {
    if (this.swordCd > 0) return;
    if (!this.state.inventory.includes('namphi_sword')) {
      this.showToast('ยังไม่มีดาบ! รีบไปรับดาบเหล็กน้ำพี้จากลุงสินที่โรงตีดาบ (-81 ม.)');
      return;
    }
    this.swordCd = 0.34;
    this.sound.playSwordSlash();
    this.world.triggerSwordSlash(this.state.x, this.playerFacing);

    // Training dummy strike in Act 1
    if (this.state.flags.act === 1 && Math.abs(this.state.x - -77.5) < 3.0 && !this.state.flags.practicedSword) {
      this.state.flags.practicedSword = true;
      this.sound.playSwordHit();
      this.showToast('ฝึกฟันดาบเหล็กน้ำพี้สำเร็จ! ล่องเรือหรือเดินไปตลาดน้ำอโยธยาด้านซ้ายต่อได้');
      this.saveGame();
      return;
    }

    if (this.state.isRowing) return;

    let hitAny = false;
    this.world.getEnemyViews().forEach((ev) => {
      if (!ev.alive) return;
      const dx = ev.x - this.state.x;
      if (Math.abs(dx) < 2.8 && (dx === 0 || Math.sign(dx) === this.playerFacing || Math.abs(dx) < 1.35)) {
        ev.hp = Math.max(0, ev.hp - 36);
        ev.x = Math.max(CH4_MIN_X + 3, Math.min(CH4_MAX_X - 3, ev.x + this.playerFacing * 2.1));
        hitAny = true;
        if (ev.hp <= 0) {
          ev.alive = false;
          this.onEnemyDefeated(ev.kind);
        }
      }
    });
    if (hitAny) this.sound.playSwordHit();
  }

  private shootBow(): void {
    if (this.bowCd > 0) return;
    if (!this.state.inventory.includes('ayutthaya_bow')) {
      this.showToast('ยังไม่มีหน้าไม้! ไปรับหน้าไม้อโยธยาจากลุงสินที่โรงตีดาบ (-45 ม.)');
      return;
    }
    if (this.state.arrows <= 0) {
      this.showToast('ลูกดอกหมดชั่วคราว กำลังเตรียมลูกดอกใหม่หรือเติมที่โรงตีดาบ!');
      return;
    }
    this.bowCd = 0.45;
    this.state.arrows--;
    this.sound.playBowShot();
    this.world.spawnArrowProjectile(this.state.x, this.playerFacing);
  }

  private onEnemyDefeated(kind: 'phee_ha' | 'bandit' | 'suea_kham'): void {
    if (kind === 'suea_kham') {
      this.state.flags.sueaKhamDefeated = true;
      this.showToast('ปราบขุนโจรเสือคำลงได้แล้ว! รีบไปชำระหลุมศพใหญ่ (+97 ม.) หรือพาขึ้นเรืออพยพ (+116 ม.)!');
      this.saveGame();
      return;
    }
    this.checkActProgression();
  }

  private addItem(id: string): void {
    if (!this.state.inventory.includes(id)) {
      this.state.inventory.push(id);
      this.renderInventory();
    }
  }

  private addClue(id: string): void {
    if (!this.state.clues.includes(id)) {
      this.state.clues.push(id);
      const cl = CH4_CLUES.find((c) => c.id === id);
      if (cl) this.showToast(`บันทึกเบาะแสใหม่: ${cl.title}`);
    }
  }

  private useItem(id: string): void {
    if (id === 'herb_medicine') {
      this.state.hp = Math.min(100, this.state.hp + 45);
      this.state.sanity = Math.min(100, this.state.sanity + 25);
      const idx = this.state.inventory.indexOf(id);
      if (idx >= 0) this.state.inventory.splice(idx, 1);
      this.renderInventory();
      this.showToast('ดื่มยาต้มสมุนไพรหลวง ฟื้นฟูเลือด +45 และสติ +25');
    } else if (id === 'holy_water') {
      this.state.hp = Math.min(100, this.state.hp + 30);
      this.state.sanity = Math.min(100, this.state.sanity + 40);
      this.sound.playWaterSplash();
      this.world.getEnemyViews().forEach((ev) => {
        if (ev.alive && ev.kind === 'phee_ha' && Math.abs(ev.x - this.state.x) < 8) {
          ev.hp = Math.max(0, ev.hp - 40);
          ev.x += ev.x >= this.state.x ? 3.5 : -3.5;
          if (ev.hp <= 0) {
            ev.alive = false;
            this.onEnemyDefeated('phee_ha');
          }
        }
      });
      const idx = this.state.inventory.indexOf(id);
      if (idx >= 0) this.state.inventory.splice(idx, 1);
      this.renderInventory();
      this.showToast('สาดน้ำพระพุทธมนต์ขับไล่ผีห่ารอบตัวและฟื้นสติ!');
    } else if (id === 'resin_torch') {
      this.toggleTorch();
      this.renderInventory();
    } else if (id === 'namphi_sword') {
      this.swingSword();
    } else if (id === 'ayutthaya_bow') {
      this.shootBow();
    } else if (id === 'water_bucket') {
      this.tryInteract();
    } else {
      const item = CH4_ITEMS[id];
      if (item) this.showToast(`${item.name}: ${item.description}`);
    }
  }

  private spawnAct2Actors(): void {
    this.world.clearDynamicActors();
    this.world.addEnemyVisual('p1', 'phee_ha', 152, 70);
    this.world.addEnemyVisual('p2', 'phee_ha', 102, 70);
    this.world.addEnemyVisual('p3', 'phee_ha', 48, 70);
    this.world.addEnemyVisual('p4', 'phee_ha', -34, 70);
    this.world.addEnemyVisual('p5', 'phee_ha', -148, 70);
    if (!this.state.rescuedIds.includes('phudsorn') && !this.state.deadIds.includes('phudsorn')) {
      this.world.addSurvivorVisual('phudsorn', 'แม่พุดซ้อน (ตลาดน้ำ)', 'phudsorn', -157);
    }
    if (!this.state.rescuedIds.includes('child_kla') && !this.state.deadIds.includes('child_kla')) {
      this.world.addSurvivorVisual('child_kla', 'น้องกล้า (หมู่บ้าน)', 'child_kla', -102);
    }
  }

  private spawnAct3Actors(): void {
    this.world.clearDynamicActors();
    this.world.getFireViews().forEach((fv) => {
      const done = this.state.extinguishedFireIds.includes(fv.id);
      fv.active = !done;
      fv.extinguished = done;
    });
    this.world.addEnemyVisual('b1', 'bandit', -154, 80);
    this.world.addEnemyVisual('b2', 'bandit', -98, 80);
    this.world.addEnemyVisual('b3', 'bandit', -35, 85);
    this.world.addEnemyVisual('b4', 'bandit', 18, 90);
    this.world.addEnemyVisual('p6', 'phee_ha', 66, 85);
    this.world.addEnemyVisual('p7', 'phee_ha', 112, 85);
    [
      { id: 'phudsorn', name: 'แม่พุดซ้อน (ตลาดน้ำ)', kind: 'phudsorn' as const, x: -157 },
      { id: 'smith', name: 'ลุงสินช่างตีดาบ', kind: 'smith' as const, x: -82 },
      { id: 'child_kla', name: 'น้องกล้า', kind: 'child_kla' as const, x: -102 },
      { id: 'villager_bua', name: 'ยายบัว (ย่านขุนนาง)', kind: 'villager' as const, x: -34 },
    ].forEach((sv) => {
      if (!this.state.rescuedIds.includes(sv.id) && !this.state.deadIds.includes(sv.id)) {
        this.world.addSurvivorVisual(sv.id, sv.name, sv.kind, sv.x);
      }
    });
  }

  private spawnAct4Actors(): void {
    this.world.clearDynamicActors();
    if (!this.state.flags.sueaKhamDefeated) {
      this.world.addEnemyVisual('boss_kham', 'suea_kham', 148, 160);
      this.world.addEnemyVisual('p8', 'phee_ha', 156, 85);
      this.world.addEnemyVisual('p9', 'phee_ha', 166, 85);
    }
  }

  private triggerAct2Plague(): void {
    this.state.flags.plagueOutbreakStarted = true;
    this.state.flags.act = 2;
    this.state.gameMinutes = 16 * 60 + 40;
    this.state.torchOn = true;
    this.sound.playTempleBell();
    this.addClue('ch4_clue_pit');
    this.spawnAct2Actors();
    this.saveGame();
    this.playCutscene('ayutthaya_plague', () => {
      this.startDialogue([
        {
          speaker: 'เสียงระฆังวัดมหาธาตุ & หอกลอง',
          role: 'เหตุวิปโยคอโยธยา',
          portrait: 'narrator',
          text: 'เก๊ง!! เก๊ง!! เก๊ง!! ศพโรคห่าในหลุมฝังรวมลุกพรวดขึ้นมาไล่กัดผู้คน! มั่นรีบชักดาบ [F] หรือยิงหน้าไม้ [G] กำจัดผีห่า และช่วยพาผู้รอดชีวิตเข้าเขตวัดมหาธาตุ!',
        },
      ]);
    });
  }

  private triggerAct3Riot(): void {
    this.state.flags.plagueWaveCleared = true;
    this.state.flags.riotStarted = true;
    this.state.flags.act = 3;
    this.state.gameMinutes = 20 * 60 + 25;
    this.sound.playTempleBell();
    this.addClue('ch4_clue_bandit');
    this.spawnAct3Actors();
    this.saveGame();
    this.startDialogue([
      {
        speaker: 'ขุนราม (นายทวารประตูชัย)',
        role: 'ทหารกรุงศรีฯ',
        portrait: 'uncle',
        text: 'เจ้ามั่น! พวกโจรเสือคำฉวยโอกาสโรคระบาดบุกปล้นทรัพย์ชาวบ้าน ขโมยเสบียง แล้วยังจุดไฟเผาตลาดกับเรือนไทย! รีบไปฟันพวกโจร สาดน้ำดับไฟทั้ง ๓ จุด แล้วช่วยชาวบ้านเข้าเขตวัดเถิด!',
      },
    ]);
  }

  private triggerAct4Climax(): void {
    this.state.flags.act = 4;
    this.state.gameMinutes = 25 * 60 + 45;
    this.sound.playTempleBell();
    this.addClue('ch4_clue_purify');
    this.spawnAct4Actors();
    this.saveGame();
    this.startDialogue([
      {
        speaker: 'หลวงตาคง (วัดไชยวัฒนาราม)',
        role: 'เจ้าอาวาสเขตอภัยทาน',
        portrait: 'uncle',
        text: 'เพลิงสงบแล้วโยมมั่น... แต่ขุนโจรเสือคำกำลังพาสมุนไปขุดค้นศพที่หลุมใหญ่ป่าช้า (+148 ม.)! จงรีบไปปราบมัน แล้วนำไต้ไฟกับน้ำมนต์ไปชำระหลุมศพ (+160 ม.) หรือนำชาวบ้านขึ้นเรือสำเภาอพยพ (+178 ม.)!',
      },
    ]);
  }

  private checkActProgression(): void {
    const f = this.state.flags;
    const aliveEnemies = this.world.getEnemyViews().filter((e) => e.alive).length;
    if (f.act === 2 && aliveEnemies === 0) {
      this.triggerAct3Riot();
    } else if (f.act === 3) {
      const firesLeft = this.world.getFireViews().filter((fv) => !fv.extinguished).length;
      const unresolvedSurv = this.world.getSurvivorViews().filter((s) => s.alive && !s.rescued).length;
      if (firesLeft === 0 && unresolvedSurv === 0 && aliveEnemies <= 1) {
        this.triggerAct4Climax();
      }
    }
  }

  private enterRoom(room: Exclude<Ch4RoomId, 'outside'>, returnX: number): void {
    if (this.state.isRidingHorse) this.state.isRidingHorse = false;
    if (this.state.isRowing) this.state.isRowing = false;
    this.outsideReturnX = returnX;
    this.currentRoom = room;
    const rMeta = CH4_ROOM_META[room];
    this.state.x = -(rMeta.halfW - 2.6);
    this.playerFacing = 1;
    this.sound.playDoorCreak();
    this.showToast(`เข้าสู่${rMeta.name}`);
    this.updateHUD();
  }

  private exitRoom(): void {
    this.sound.playDoorCreak();
    this.currentRoom = 'outside';
    this.state.x = this.outsideReturnX;
    this.playerFacing = -1;
    this.updateHUD();
  }

  private interactInsideRoom(room: Exclude<Ch4RoomId, 'outside'>): void {
    const claimed = this.roomBonusClaimed.has(room);
    if (room === 'royal_palace') {
      if (!claimed) {
        this.roomBonusClaimed.add(room);
        this.addItem('herb_medicine');
        this.addItem('holy_water');
        this.showToast('รับพระราชทานโอสถหลวงและน้ำพระพุทธมนต์หน้าพระมหาเศวตฉัตร!');
      } else {
        this.state.sanity = Math.min(100, this.state.sanity + 25);
        this.showToast('ชมความวิจิตรแห่งพระที่นั่งสรรเพชญมหาปราสาทและพระมหาเศวตฉัตร 9 ชั้น');
      }
    } else if (room === 'temple_ubosot') {
      this.state.hp = 100;
      this.state.sanity = 100;
      if (!claimed) {
        this.roomBonusClaimed.add(room);
        this.addItem('holy_water');
        this.showToast('กราบพระพุทธปฏิมากรทองคำ ฟื้นพลังเต็มร้อย & ได้รับน้ำพระพุทธมนต์ศักดิ์สิทธิ์!');
      } else {
        this.sound.playTempleBell();
        this.showToast('กราบสักการะพระประธานในพระอุโบสถ จิตใจสงบและพลังกายเต็มเปี่ยม!');
      }
    } else if (room === 'noble_mansion') {
      if (!claimed) {
        this.roomBonusClaimed.add(room);
        this.addItem('herb_medicine');
        this.showToast('เปิดตู้โอสถหลวงของพระยาวิชัย ได้รับยาสมุนไพรหลวง!');
      } else {
        this.showToast('ภายในจวนขุนนางประดับฉากลายรดน้ำทองและเครื่องถ้วยเบญจรงค์งดงาม');
      }
    } else if (room === 'garrison_fort') {
      this.state.sanity = Math.min(100, this.state.sanity + 25);
      this.showToast('ตรวจแผนที่ยุทธศาสตร์ป้องพระนคร — กำลังใจฮึกเหิม (+25 สติ)');
    } else if (room === 'blacksmith_interior') {
      this.state.arrows = Math.max(this.state.arrows, 14);
      this.sound.playSwordHit();
      this.showToast('เติมลูกดอกหน้าไม้อโยธยาจากคลังเหล็กน้ำพี้ครบ ๑๔ ดอก!');
    } else if (room === 'market_hall') {
      if (!claimed) {
        this.roomBonusClaimed.add(room);
        this.addItem('herb_medicine');
        this.showToast('ได้รับสมุนไพรแห้งจากชั้นเครื่องเทศตลาดน้ำอโยธยา!');
      } else {
        this.showToast('ผ้าแพรอยุธยาและเครื่องสังคโลกเรียงรายอย่างวิจิตรในเรือนแพ');
      }
    } else if (room === 'peasant_house') {
      this.state.hp = Math.min(100, this.state.hp + 30);
      this.state.stamina = 100;
      this.showToast('พักกายบนแคร่เรือนไทย & ไหว้หิ้งพระประจำบ้าน (+30 เลือด)');
    }
    this.saveGame();
  }

  private getNearestAction(): { label: string; run: () => void } | null {
    const px = this.state.x;
    const f = this.state.flags;

    if (this.currentRoom !== 'outside') {
      const rMeta = CH4_ROOM_META[this.currentRoom];
      if (px <= -(rMeta.halfW - 3.9)) {
        return { label: 'เดินออกประตูสู่กรุงศรีอยุธยา', run: () => this.exitRoom() };
      }
      if (Math.abs(px - rMeta.actionX) < 3.4) {
        const activeRoom = this.currentRoom;
        return { label: rMeta.actionLabel, run: () => this.interactInsideRoom(activeRoom) };
      }
      return null;
    }

    if (this.state.isRowing) {
      const pier = PIER_XS.find((p) => Math.abs(p - px) < 4.5);
      if (pier !== undefined) {
        return { label: 'เทียบท่าขึ้นฝั่ง', run: () => this.toggleBoat() };
      }
      if (f.act === 4 && f.sueaKhamDefeated && Math.abs(px - 178) < 6) {
        return { label: 'นำเรือเทียบสำเภาหลวงอพยพ', run: () => this.finishChapter('normal') };
      }
      return null;
    }

    // Active arson fire extinguishing
    for (const fv of this.world.getFireViews()) {
      if (fv.active && !fv.extinguished && Math.abs(px - fv.x) < 3.8) {
        return {
          label: `สาดน้ำดับ${fv.label}`,
          run: () => {
            fv.extinguished = true;
            fv.active = false;
            if (!this.state.extinguishedFireIds.includes(fv.id)) this.state.extinguishedFireIds.push(fv.id);
            this.sound.playWaterSplash();
            this.showToast(`ดับ${fv.label}สำเร็จ!`);
            this.saveGame();
            this.checkActProgression();
          },
        };
      }
    }

    // Rescue live survivors once threats around them are clear
    for (const sv of this.world.getSurvivorViews()) {
      if (sv.alive && !sv.rescued && Math.abs(px - sv.x) < 3.2) {
        const attackerNear = this.world.getEnemyViews().some((ev) => ev.alive && Math.abs(ev.x - sv.x) < 7.0);
        return {
          label: attackerNear ? `ฟันศัตรูรอบตัว ${sv.name} ก่อน!` : `ช่วยพา ${sv.name} อพยพเข้าวัด`,
          run: () => {
            if (attackerNear) {
              this.showToast(`ยังมีโจร/ผีห่าล้อมอยู่! กด [F] ฟันหรือ [G] ยิงหน้าไม้ไล่มันก่อน`);
              return;
            }
            sv.rescued = true;
            const slotOffset = (this.state.rescuedIds.length % 4) * 1.4;
            sv.x = 134 + slotOffset;
            if (!this.state.rescuedIds.includes(sv.id)) this.state.rescuedIds.push(sv.id);
            this.showToast(`คุ้มกัน ${sv.name} เข้าเขตอภัยทานวัดไชยฯ ปลอดภัย!`);
            this.saveGame();
            this.checkActProgression();
          },
        };
      }
    }

    // Story NPCs, Enterable City Buildings / Palaces / Temples & Waterfront Piers!
    if (Math.abs(px - -81.5) < 2.4) {
      return { label: 'คุยกับลุงสิน (โรงตีดาบ)', run: () => this.interactSmith() };
    }
    if (Math.abs(px - -79.0) < 2.2) {
      return { label: 'เข้าภายในโรงตีดาบหลวงลุงสิน', run: () => this.enterRoom('blacksmith_interior', -79.0) };
    }
    if (Math.abs(px - -156.5) < 2.6 && f.act === 1) {
      return { label: 'คุยกับแม่พุดซ้อน (ตลาดน้ำอโยธยา)', run: () => this.interactPhudsorn() };
    }
    if (Math.abs(px - -160.2) < 2.6) {
      return { label: 'เข้าภายในเรือนแพตลาดน้ำอโยธยา', run: () => this.enterRoom('market_hall', -160.2) };
    }
    if (Math.abs(px - -97) < 2.8) {
      return { label: 'เข้าภายในเรือนไทยฝาปะกนชาวบ้าน', run: () => this.enterRoom('peasant_house', -97) };
    }
    if (Math.abs(px - -174) < 5.0 && f.act === 1 && !f.inspectedSampan) {
      return { label: 'ตรวจเรือสำเภาสินค้าน่านน้ำ', run: () => this.interactSampan() };
    }
    if (Math.abs(px - -37.2) < 2.2 && f.act === 1) {
      return {
        label: 'คุยกับพระยาวิชัย (หน้าจวนขุนนาง)',
        run: () => {
          this.addItem('herb_medicine');
          this.startDialogue([
            {
              speaker: 'พระยาวิชัย',
              role: 'ขุนนางกรุงศรีฯ',
              portrait: 'uncle',
              text: 'อ้อ เจ้ามั่นศิษย์ช่างตีดาบนี่เอง พวกโจรโพกหัวแดงลอบมองจวนข้ามาหลายเพลาแล้ว หากเกิดจลาจลเมื่อใด ข้าฝากเจ้าช่วยคุ้มครองชาวเรือนด้วยนะ รับยาสมุนไพรหลวงติดย่ามไว้เถิด เชิญเข้าไปชมภายในเรือนใหญ่ด้านซ้ายได้เลย',
            },
          ]);
        },
      };
    }
    if (Math.abs(px - -40.8) < 2.5) {
      return { label: 'เข้าภายในจวนพระยาวิชัย (เรือนขุนนาง)', run: () => this.enterRoom('noble_mansion', -40.8) };
    }
    if (Math.abs(px - 11.5) < 2.8 && f.act === 1) {
      return { label: 'คุยกับขุนราม (ค่ายทหารประตูชัย)', run: () => this.interactKhunRam() };
    }
    if (Math.abs(px - 22.5) < 3.4) {
      return { label: 'เข้าภายในหอบัญชาการกองทัพประตูชัย', run: () => this.enterRoom('garrison_fort', 22.5) };
    }
    if (Math.abs(px - 66) < 4.5) {
      return { label: 'เข้าชมภายในพระบรมมหาราชวัง (พระที่นั่งสรรเพชญฯ)', run: () => this.enterRoom('royal_palace', 66) };
    }
    if (Math.abs(px - 125) < 3.8) {
      return { label: 'เข้าภายในพระอุโบสถหลวง วัดพระศรีสรรเพชญ์', run: () => this.enterRoom('temple_ubosot', 125) };
    }
    if (Math.abs(px - 136) < 3.0) {
      return { label: 'กราบหลวงตาคง (วัดไชยวัฒนาราม)', run: () => this.interactMonk() };
    }

    // Pier boating prompt (narrow range so boat piers never mask building doorways; press [B] within 4.5m anytime)
    const pier = PIER_XS.find((p) => Math.abs(p - px) < 1.85);
    if (pier !== undefined) {
      if (f.act === 4 && f.sueaKhamDefeated && pier === 178) {
        return { label: 'ขึ้นเรือสำเภาอพยพชาวบ้าน', run: () => this.finishChapter('normal') };
      }
      return { label: 'ลงเรือพายล่องคลองกรุงศรีฯ [B]', run: () => this.toggleBoat() };
    }
    if (Math.abs(px - 160) < 4.6) {
      if (f.act === 1) {
        if (!f.talkedSmithIntro) {
          return {
            label: 'ไปรับดาบและหน้าไม้จากลุงสิน (-81 ม.) ก่อนตรวจป่าช้า',
            run: () => this.showToast('ควรแวะโรงตีดาบลุงสิน (-81 ม.) รับดาบเหล็กน้ำพี้และหน้าไม้ก่อนเข้าใกล้หลุมศพใหญ่!'),
          };
        }
        return { label: 'ตรวจดูหลุมศพใหญ่หลังประตูผี', run: () => this.triggerAct2Plague() };
      }
      if (f.act === 4 && f.sueaKhamDefeated) {
        return { label: 'จุดไต้เผา & สาดน้ำมนต์ชำระหลุมศพห่า', run: () => this.finishChapter(this.state.rescuedIds.length >= 2 && this.state.extinguishedFireIds.length >= 4 ? 'true' : 'normal') };
      }
    }

    return null;
  }

  private interactSmith(): void {
    const f = this.state.flags;
    if (!f.talkedSmithIntro) {
      f.talkedSmithIntro = true;
      this.addItem('namphi_sword');
      this.addItem('ayutthaya_bow');
      this.addItem('herb_medicine');
      this.state.arrows = Math.max(this.state.arrows, 14);
      this.saveGame();
      this.startDialogue([
        {
          speaker: 'ลุงสิน',
          role: 'ช่างตีดาบหลวง',
          portrait: 'uncle',
          text: 'เจ้ามั่นมาพอดี! ลุงตีดาบเหล็กน้ำพี้กับหน้าไม้ไว้ให้เอ็งติดตัวแล้ว เอาไต้ไฟกับยาต้มสมุนไพรไปด้วย ลองฟันหุ่นฟางข้างโรงตีดาบ [F] ดูสักที แล้วล่องเรือไปตรวจตลาดน้ำอโยธยาด้านซ้าย (-157 ม.) นะเอ็ง',
        },
      ]);
      return;
    }
    this.state.arrows = Math.max(this.state.arrows, 14);
    this.addItem('herb_medicine');
    this.saveGame();
    this.showToast('เติมลูกดอกหน้าไม้ครบ ๑๔ ดอก และยาต้มสมุนไพรแล้ว!');
  }

  private interactPhudsorn(): void {
    const f = this.state.flags;
    f.talkedPhudsornIntro = true;
    this.addItem('water_bucket');
    this.addClue('ch4_clue_boat');
    this.saveGame();
    this.startDialogue([
      {
        speaker: 'แม่พุดซ้อน',
        role: 'แม่ค้าตลาดน้ำอโยธยา',
        portrait: 'vendor',
        text: 'พ่อมั่น! ช่วยด้วยเถิดเจ้าค่ะ มีข่าวลือว่าเรือสำเภาต่างถิ่นที่เทียบท่าน้ำซ้าย (-174 ม.) มีคนป่วยตัวซีดล้มตายหลายคน เอาถังน้ำนี่ติดเรือไปด้วย เผื่อช่วยตักน้ำหรือดับไฟได้เจ้าค่ะ',
      },
    ]);
  }

  private interactSampan(): void {
    this.state.flags.inspectedSampan = true;
    this.addClue('ch4_clue_sampan');
    this.saveGame();
    this.startDialogue([
      {
        speaker: 'มั่น',
        role: 'ศิษย์ช่างตีดาบ',
        portrait: 'player',
        text: 'มีห่อผ้าเปื้อนเลือดกับรอยลากศพจากเรือสำเภาไปทางป่าช้านอกกำแพงเมืองฝั่งตะวันออก... ต้องรีบเข้าประตูชัยผ่านย่านขุนนางไปแจ้งขุนรามค่ายช้างศึก (+11 ม.) และหลวงตาคงที่วัดไชยฯ (+136 ม.) แล้ว!',
      },
    ]);
  }

  private interactKhunRam(): void {
    this.state.flags.talkedKhunRamIntro = true;
    this.addClue('ch4_clue_bandit');
    this.saveGame();
    this.startDialogue([
      {
        speaker: 'ขุนราม',
        role: 'นายทวารประตูชัย & ค่ายช้างศึก',
        portrait: 'uncle',
        text: 'เจ้ามั่น! พวกโจรเสือคำกำลังซุ่มดูลาดเลานอกกำแพงเมือง ส่วนหมอหลวงขนศพคนตายโรคห่าไปรวมไว้ที่หลุมใหญ่หลังประตูผี (+160 ม.) เอ็งเดินชมวังหลวงแล้วแวะรับน้ำมนต์จากหลวงตาคง (+136 ม.) ก่อนไปตรวจหลุมศพเถิด',
      },
    ]);
  }

  private interactMonk(): void {
    const f = this.state.flags;
    if (!f.talkedMonkIntro) {
      f.talkedMonkIntro = true;
      this.addItem('holy_water');
      this.addItem('biakae_amulet');
      this.state.hp = 100;
      this.state.sanity = 100;
      this.saveGame();
      this.startDialogue([
        {
          speaker: 'หลวงตาคง',
          role: 'เจ้าอาวาสวัดไชยวัฒนาราม',
          portrait: 'uncle',
          text: 'เจริญพรโยมมั่น จงรับเบี้ยแก้กันห่าและน้ำพระพุทธมนต์นี้ไว้คุ้มกาย หากเกิดเพศภัยในพระนคร ให้พามหาชนเข้ามาหลบในเขตอภัยทานศาลาวัดแห่งนี้ แล้วโยมจงเดินออกประตูผีไปดูหลุมศพใหญ่ด้านขวา (+160 ม.) เถิด',
        },
      ]);
      return;
    }
    this.addItem('holy_water');
    this.state.hp = Math.min(100, this.state.hp + 40);
    this.state.sanity = 100;
    this.sound.playTempleBell();
    this.saveGame();
    this.showToast('หลวงตาคงประพรมน้ำพระพุทธมนต์ ฟื้นกำลังใจเต็ม 100%!');
  }

  private finishChapter(ending: EndingType): void {
    this.state.flags.endingReached = ending;
    this.saveGame();
    const afterCut = () => {
      this.modalOpen = true;
      this.modalTitle.textContent =
        ending === 'true'
          ? 'ฉากจบวีรชน: ผู้กอบกู้กรุงอโยธยา'
          : ending === 'normal'
            ? 'ฉากจบรอดชีวิต: ล่องนาวาฝ่าเพลิงห่า'
            : 'กรุงศรีฯ สิ้นแสงใต้คมเขี้ยวห่า';
      const rescued = this.state.rescuedIds.length;
      const fires = this.state.extinguishedFireIds.length;
      this.modalBody.innerHTML =
        ending === 'bad'
          ? `<p>เจ้ามั่นล้มลงท่ามกลางเพลิงจลาจลและฝูงผีห่าอโยธยา...</p><div style="margin-top:14px;display:flex;gap:10px;justify-content:flex-end"><button id="ch4-retry" class="primary-btn">ลุกขึ้นสู้ใหม่ (จุดเซฟล่าสุด)</button><button id="ch4-menu" class="secondary-btn">กลับหน้าแรก</button></div>`
          : `<p>${ending === 'true' ? 'เจ้ามั่นปราบขุนโจรเสือคำ ดับเพลิงเผาเมืองทั้ง ๔ จุด ช่วยชาวบ้านไว้ได้ ' + rescued + ' ชีวิต และนำไต้ไฟกับน้ำพระพุทธมนต์ชำระล้างหลุมศพใหญ่จนเชื้อห่ามอดดับ คืนความสงบสู่กรุงอโยธยา!' : 'เจ้ามั่นนำชาวบ้านผู้รอดชีวิต ' + rescued + ' คนฝ่าเพลิงจลาจลลงเรือสำเภาอพยพพ้นภัยโรคห่าได้สำเร็จ!'}</p><p style="color:#d6b984;margin-top:8px">• ชาวบ้านที่รอดปลอดภัย: ${rescued} คน • ไฟที่ดับ: ${fires}/4 จุด • เบาะแส: ${this.state.clues.length}/${CH4_CLUES.length}</p><div style="margin-top:14px;display:flex;gap:10px;justify-content:flex-end"><button id="ch4-replay" class="secondary-btn">เล่นบทที่ ๔ ใหม่</button><button id="ch4-menu" class="primary-btn">กลับหน้าแรก</button></div>`;
      this.modalBackdrop.classList.remove('hidden');
      document.getElementById('ch4-retry')?.addEventListener('click', () => {
        this.closeModal();
        this.state.hp = 100;
        this.state.sanity = 85;
        this.rebuildPhaseActorsFromSave();
      });
      document.getElementById('ch4-replay')?.addEventListener('click', () => {
        this.closeModal();
        this.startNewGame();
      });
      document.getElementById('ch4-menu')?.addEventListener('click', () => {
        this.closeModal();
        this.onExitToMenu();
      });
    };

    if (ending !== 'bad') {
      this.playCutscene('ayutthaya_purify', afterCut);
    } else {
      afterCut();
    }
  }

  private tryInteract(): void {
    const act = this.getNearestAction();
    if (act) {
      this.sound.playUIClick();
      act.run();
    } else {
      this.showToast('ไม่มีจุดโต้ตอบใกล้ตัว — เดินไปใกล้ชาวบ้าน ท่าน้ำ หรือกองไฟ');
    }
  }

  private loop(now: number): void {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    if (this.cutscene.isPlaying()) return;

    const paused = this.modalOpen || this.activeDialogue.length > 0 || Boolean(this.state.flags.endingReached);
    let moving = false;

    if (!paused) {
      let dir = 0;
      if (this.codes.has('KeyA') || this.codes.has('ArrowLeft')) dir -= 1;
      if (this.codes.has('KeyD') || this.codes.has('ArrowRight')) dir += 1;
      if (this.touchMoveDir !== 0) dir = this.touchMoveDir;

      const sprinting = (this.codes.has('ShiftLeft') || this.codes.has('ShiftRight') || this.isSprintingTouch) && this.state.stamina > 2;
      if (dir !== 0) {
        moving = true;
        this.playerFacing = dir > 0 ? 1 : -1;
        const baseSpeed = this.state.isRowing ? 8.6 : this.state.isRidingHorse ? 9.4 : sprinting ? 7.2 : 4.8;
        const rLimit = this.currentRoom !== 'outside' ? CH4_ROOM_META[this.currentRoom].halfW - 1.2 : 0;
        const minBound = this.currentRoom !== 'outside' ? -rLimit : CH4_MIN_X + 1.5;
        const maxBound = this.currentRoom !== 'outside' ? rLimit : CH4_MAX_X - 1.5;
        this.state.x = Math.max(minBound, Math.min(maxBound, this.state.x + dir * baseSpeed * dt));
        if (sprinting && !this.state.isRowing) this.state.stamina = Math.max(0, this.state.stamina - 16 * dt);
      } else {
        this.state.stamina = Math.min(100, this.state.stamina + 18 * dt);
      }

      if (this.swordCd > 0) this.swordCd -= dt;
      if (this.bowCd > 0) this.bowCd -= dt;
      if (this.state.arrows < 6) {
        this.arrowRegenTimer += dt;
        if (this.arrowRegenTimer >= 6.5) {
          this.arrowRegenTimer = 0;
          this.state.arrows++;
        }
      }

      this.updateCombat(dt);

      // Periodic cemetery Preta cry ONLY when near cemetery pit at night (never leaks to other chapters!)
      const hr = (this.state.gameMinutes % 1440) / 60;
      if ((hr >= 18.5 || hr < 5.5) && this.state.x >= 136) {
        this.pretaSoundTimer -= dt;
        if (this.pretaSoundTimer <= 0) {
          this.pretaSoundTimer = 14 + Math.random() * 10;
          this.sound.playPretaWail();
        }
      }

      this.state.gameMinutes += dt * (this.state.flags.act === 1 ? 1.8 : 2.6);
      if (this.state.gameMinutes >= 1440) this.state.gameMinutes -= 1440;
      const wHr = this.state.gameMinutes / 60;
      this.state.weather =
        this.state.flags.act >= 4
          ? 'storm'
          : this.state.flags.act === 3
            ? wHr >= 19.5 || wHr < 4.5
              ? 'storm'
              : 'windy'
            : this.state.flags.act === 2
              ? wHr >= 15 && wHr < 19
                ? 'rain'
                : 'windy'
              : wHr >= 16.8 && wHr < 18.2
                ? 'rain'
                : wHr >= 12.5 && wHr < 16.8
                  ? 'windy'
                  : 'clear';
    }

    const mood: AyutthayaMood =
      this.state.flags.act === 1
        ? 'prosperous'
        : this.state.flags.act === 2
          ? 'plague'
          : this.state.flags.act === 3
            ? 'riot'
            : 'climax';

    this.world.update(
      dt,
      this.state.x,
      this.playerFacing,
      moving,
      this.state.isRowing,
      Boolean(this.state.isRidingHorse),
      this.state.torchOn,
      this.state.inventory.includes('namphi_sword'),
      this.state.gameMinutes,
      this.state.weather,
      mood,
      this.currentRoom
    );

    const period = this.getPeriod();
    this.sound.updateAmbience(dt, this.state.weather, period, this.state.sanity, 0 as FloorIndex, this.state.flags.act >= 3, false);

    const near = !paused ? this.getNearestAction() : null;
    if (near) {
      this.interactPrompt.classList.remove('hidden');
      this.interactLabel.textContent = near.label;
    } else {
      this.interactPrompt.classList.add('hidden');
    }

    this.updateHUD();
  }

  private updateCombat(dt: number): void {
    if (this.currentRoom !== 'outside') return;
    // Update arrow bolts hitting enemies cleanly
    const enemies = this.world.getEnemyViews();
    this.world.getProjectiles().forEach((proj) => {
      if (!proj.active) return;
      proj.x += proj.vx * dt;
      proj.mesh.position.x = proj.x;
      if (Math.abs(proj.x - this.state.x) > 15) {
        proj.active = false;
        proj.mesh.visible = false;
        return;
      }
      for (const ev of enemies) {
        if (ev.alive && Math.abs(ev.x - proj.x) < 1.05) {
          proj.active = false;
          proj.mesh.visible = false;
          ev.hp = Math.max(0, ev.hp - 32);
          ev.x += Math.sign(proj.vx) * 1.1;
          this.sound.playSwordHit();
          if (ev.hp <= 0) {
            ev.alive = false;
            this.onEnemyDefeated(ev.kind);
          }
          break;
        }
      }
    });

    // Enemy pursuit & live attack tick against survivors or player
    this.enemyAtkClock += dt;
    const attackTick = this.enemyAtkClock >= 1.7;
    if (attackTick) this.enemyAtkClock = 0;

    const survivors = this.world.getSurvivorViews();
    enemies.forEach((ev) => {
      if (!ev.alive) return;
      let targetX: number | null = null;
      let targetSurv: (typeof survivors)[number] | null = null;

      // Nearest un-rescued alive survivor within 12m
      for (const sv of survivors) {
        if (sv.alive && !sv.rescued && Math.abs(sv.x - ev.x) < 12) {
          targetX = sv.x;
          targetSurv = sv;
          break;
        }
      }
      // Or target player if on land within 16m
      const distPlayer = Math.abs(this.state.x - ev.x);
      if (targetX === null && !this.state.isRowing && distPlayer < 16) {
        targetX = this.state.x;
      }

      if (targetX !== null) {
        const dx = targetX - ev.x;
        ev.dir = dx >= 0 ? 1 : -1;
        if (Math.abs(dx) > 1.35) {
          const spd = ev.kind === 'phee_ha' ? 2.15 : ev.kind === 'suea_kham' ? 3.2 : 2.85;
          ev.x += ev.dir * spd * dt;
        } else if (attackTick) {
          if (targetSurv) {
            targetSurv.hp = Math.max(0, targetSurv.hp - 4);
            if (targetSurv.hp <= 0) {
              targetSurv.alive = false;
              if (!this.state.deadIds.includes(targetSurv.id)) this.state.deadIds.push(targetSurv.id);
              this.showToast(`⚠️ ${targetSurv.name} ถูกทำร้ายจนสิ้นใจแล้ว!`);
              this.checkActProgression();
            }
          } else if (!this.state.isRowing && distPlayer < 1.8) {
            const rawDmg = ev.kind === 'suea_kham' ? 14 : 9;
            const dmg = this.state.inventory.includes('biakae_amulet') ? Math.ceil(rawDmg * 0.65) : rawDmg;
            this.state.hp = Math.max(0, this.state.hp - dmg);
            this.sound.playSwordHit();
            if (this.state.hp <= 0) {
              this.finishChapter('bad');
            }
          }
        }
      }
    });
  }

  private getPeriod(): TimePeriod {
    const h = (this.state.gameMinutes % 1440) / 60;
    if (h < 6) return 'dawn';
    if (h < 12) return 'morning';
    if (h < 17) return 'noon';
    if (h < 19.5) return 'evening';
    return 'night';
  }

  private getObjectiveTarget(): { text: string; targetX: number } {
    const f = this.state.flags;
    if (f.act === 1) {
      if (!f.talkedSmithIntro) return { text: 'คุยกับลุงสินที่โรงตีดาบรับอาวุธ', targetX: -81.5 };
      if (!f.practicedSword) return { text: 'ฝึกฟันหุ่นฟางข้างโรงตีดาบ [F]', targetX: -77.5 };
      if (!f.talkedPhudsornIntro) return { text: 'ล่องเรือหรือเดินไปตลาดน้ำอโยธยา (-157 ม.)', targetX: -157 };
      if (!f.inspectedSampan) return { text: 'ตรวจเรือสำเภาสินค้าน่านน้ำ (-174 ม.)', targetX: -174 };
      if (!f.talkedKhunRamIntro) return { text: 'เข้าประตูชัยไปพบขุนรามค่ายทหารช้างศึก', targetX: 11.5 };
      if (!f.talkedMonkIntro) return { text: 'ผ่านวังหลวงไปกราบหลวงตาคงวัดไชยฯ', targetX: 136 };
      return { text: 'ออกประตูผีตรวจดูหลุมศพใหญ่ป่าช้า', targetX: 160 };
    }
    if (f.act === 2) {
      const e = this.world.getEnemyViews().find((v) => v.alive);
      if (e) return { text: 'ฟัน [F]/ยิง [G] ปราบผีห่า & ช่วยชาวบ้าน', targetX: e.x };
    }
    if (f.act === 3) {
      const fire = this.world.getFireViews().find((fv) => fv.active && !fv.extinguished);
      if (fire) return { text: `รีบดับ${fire.label} [E] & ปราบโจร`, targetX: fire.x };
      const surv = this.world.getSurvivorViews().find((sv) => sv.alive && !sv.rescued);
      if (surv) return { text: `ช่วยคุ้มกัน ${surv.name} เข้าวัด`, targetX: surv.x };
      const e = this.world.getEnemyViews().find((v) => v.alive);
      if (e) return { text: 'ปราบโจรและผีห่าที่เหลือ', targetX: e.x };
    }
    if (!f.sueaKhamDefeated) return { text: 'ปราบขุนโจรเสือคำหน้าหลุมศพ (+148 ม.)', targetX: 148 };
    return { text: 'ชำระหลุมศพใหญ่ (+160) หรือขึ้นสำเภาอพยพ (+178)', targetX: 160 };
  }

  private updateHUD(): void {
    const mins = Math.floor(this.state.gameMinutes % 1440);
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    this.hudClock.textContent = `${hh}:${mm}`;

    const actNames: Record<number, string> = { 1: 'อยุธยารุ่งเรือง', 2: 'โรคห่าระบาด', 3: 'โจรจลาจลเผาเมือง', 4: 'ศึกหลุมศพใหญ่' };
    const weatherLabels: Record<typeof this.state.weather, string> = {
      clear: 'แดดอุ่น',
      windy: 'ลมโชย',
      rain: 'ฝนพรำ',
      storm: 'พายุฝน',
    };
    const moveLabel = this.state.isRowing ? 'พายเรือ' : this.state.isRidingHorse ? 'ขี่ม้า' : 'บนฝั่ง';
    this.hudPeriod.textContent = actNames[this.state.flags.act];
    this.hudWeather.textContent = `${weatherLabels[this.state.weather]} · ${moveLabel}`;
    const nearPier = PIER_XS.some((px) => Math.abs(px - this.state.x) < 4.2);
    this.touchBike.textContent = this.state.isRowing ? '🚣✓' : nearPier ? '🚣 เรือ' : this.state.isRidingHorse ? '🐎✓' : '🐎 ขี่ม้า';

    const zone =
      this.currentRoom !== 'outside'
        ? CH4_ROOM_META[this.currentRoom].name
        : CH4_ZONE_NAMES.find((z) => this.state.x >= z.minX && this.state.x <= z.maxX)?.name ?? 'กรุงศรีอยุธยา';
    this.hudLocation.textContent = zone;
    if (this.hudExtra) {
      this.hudExtra.textContent = `❤️ ${Math.round(this.state.hp)}% • 🏹 ${this.state.arrows} • 🛡️ รอด ${this.state.rescuedIds.length} • 💧 ดับไฟ ${this.state.extinguishedFireIds.length}/4`;
    }
    this.hudSanityVal.textContent = `เลือด ${Math.round(this.state.hp)}%`;
    this.hudSanityFill.style.width = `${Math.max(0, Math.min(100, this.state.hp))}%`;

    const obj = this.getObjectiveTarget();
    this.hudQuest.textContent = `ภารกิจ: ${obj.text}`;
    if (this.currentRoom !== 'outside') {
      this.hudNav.textContent = 'เดินชมด้านใน (◀ ประตูซ้ายเพื่อออกนอกอาคาร)';
    } else {
      const dx = obj.targetX - this.state.x;
      this.hudNav.textContent =
        Math.abs(dx) < 3.5 ? 'อยู่ใกล้เป้าหมายแล้ว' : `${dx > 0 ? 'ไปทางขวา ▶' : '◀ ไปทางซ้าย'} (${Math.round(Math.abs(dx))} ม.)`;
    }
  }

  private renderInventory(): void {
    renderSharedInventoryBar({
      invBar: this.invBar,
      modalBody: this.modalBody,
      items: this.state.inventory,
      getMeta: (id) => {
        const it = CH4_ITEMS[id];
        return it ? { name: it.name, description: it.description, active: id === 'resin_torch' && this.state.torchOn } : undefined;
      },
      getIconUrl: (id) => drawCh4ItemIconDataUrl(CH4_ITEMS[id]?.icon ?? id),
      onUse: (id) => this.useItem(id),
      onReorder: (order) => {
        this.state.inventory = order;
        this.saveGame();
        this.renderInventory();
      },
      onOpenModal: (title, html) => {
        this.modalOpen = true;
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = html;
        this.modalBackdrop.classList.remove('hidden');
      },
      onCloseModal: () => this.closeModal(),
      onPlayClick: () => this.sound.playUIClick(),
    });
  }

  private startDialogue(lines: DialogueLine[]): void {
    this.activeDialogue = lines;
    this.currentLineIdx = 0;
    this.codes.clear();
    this.touchMoveDir = 0;
    this.renderDialogueLine();
  }

  private renderDialogueLine(): void {
    const line = this.activeDialogue[this.currentLineIdx];
    if (!line) {
      this.closeDialogue();
      return;
    }
    this.dialogueBox.classList.remove('hidden');
    this.dialogueSpeaker.textContent = line.speaker;
    this.dialogueRole.textContent = line.role;
    this.dialogueText.textContent = line.text;
    const pKind: Ch4CharacterKind = line.portrait === 'player' ? 'man' : line.portrait === 'vendor' ? 'phudsorn' : line.portrait === 'uncle' ? 'smith' : 'narrator';
    drawCh4CharacterCanvas(this.dialoguePortrait.getContext('2d')!, pKind, 0, 96, 96);
    speakDialogueLine(line.speaker, line.role, line.text, line.portrait, this.sound.isMuted());

    this.dialogueChoices.innerHTML = '';
    this.dialogueContinue.classList.remove('hidden');
  }

  private advanceDialogue(): void {
    const cur = this.activeDialogue[this.currentLineIdx];
    cur?.onFinish?.();
    this.currentLineIdx++;
    if (this.currentLineIdx >= this.activeDialogue.length) {
      this.closeDialogue();
    } else {
      this.renderDialogueLine();
    }
  }

  private closeDialogue(): void {
    this.activeDialogue = [];
    this.dialogueBox.classList.add('hidden');
    stopVoiceActing();
  }

  private openRulesModal(): void {
    this.modalOpen = true;
    this.modalTitle.textContent = 'กฎเอาชีวิตรอดกรุงอโยธยายามวิกฤต';
    this.modalBody.innerHTML = `<ul class="rules-list">${CH4_RULES.map((r) => `<li>${r}</li>`).join('')}</ul>`;
    this.modalBackdrop.classList.remove('hidden');
  }

  private openNotebookModal(): void {
    this.modalOpen = true;
    this.modalTitle.textContent = `บันทึกเหตุการณ์อโยธยา (${this.state.clues.length}/${CH4_CLUES.length})`;
    const items = this.state.clues.map((cid) => CH4_CLUES.find((c) => c.id === cid)).filter(Boolean);
    this.modalBody.innerHTML = items.length
      ? items.map((c) => `<div class="clue-item"><strong>${c!.title}</strong><p>${c!.detail}</p></div>`).join('')
      : '<p>ยังไม่มีบันทึกเหตุการณ์ ออกเดินสำรวจตลาดท่าเรือ โรงตีดาบ และวัดมหาธาตุ</p>';
    this.modalBackdrop.classList.remove('hidden');
  }

  private openMapModal(): void {
    this.modalOpen = true;
    this.modalTitle.textContent = 'แผนที่ราชอาณาจักรอโยธยา (๓๘๐ เมตร)';
    this.modalBody.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;font-size:0.88rem">
      <div>📍 ตำแหน่งปัจจุบัน: <strong>${Math.round(this.state.x)} ม.</strong> (${this.state.isRowing ? 'กำลังพายเรือในคลอง' : 'อยู่บนบก'})</div>
      <div>🚣 <strong>-174 ถึง -135 ม. ท่าเรือสำเภา & ตลาดน้ำอโยธยา</strong> — แพค้าขายและเรือประทุน</div>
      <div>⚒️ <strong>-82 ม. ชุมชนนาข้าว & โรงตีดาบลุงสิน</strong> — ตีดาบเหล็กน้ำพี้ หน้าไม้ & เติมยา</div>
      <div>🏯 <strong>-38 ม. เรือนหมู่ขุนนางพระยาวิชัย</strong> — คฤหาสน์เรือนไทยในกำแพง</div>
      <div>🐘 <strong>+10 ถึง +35 ม. ประตูชัยกำแพงพระนคร & กองช้างศึก</strong> — ค่ายทหารขุนราม</div>
      <div>👑 <strong>+66 ม. พระบรมมหาราชวังอโยธยา</strong> — พระที่นั่งสรรเพชญ์ อุทยานสระบัว & สุพรรณหงส์</div>
      <div>🛕 <strong>+102 ถึง +136 ม. วัดพระศรีสรรเพชญ์ & วัดไชยฯ ๕ ยอด</strong> — เขตอภัยทานปลอดภัย</div>
      <div>💀 <strong>+160 ม. ป่าช้าหลุมศพใหญ่ (หลังประตูผี) & +178 ม. กองสำเภาอพยพ</strong></div>
    </div>`;
    this.modalBackdrop.classList.remove('hidden');
  }

  private closeModal(): void {
    if (this.state.flags.endingReached) return;
    this.modalOpen = false;
    this.modalBackdrop.classList.add('hidden');
  }

  private showToast(msg: string): void {
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = msg;
    this.toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }
}
