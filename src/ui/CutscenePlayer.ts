import { Ch2CharacterKind, drawCh2CharacterCanvas } from '../art/Chapter2Sprites';
import { Ch3CharKind, drawCh3CharacterCanvas } from '../art/Chapter3Sprites';

export type IsaanCutsceneId =
  | 'homecoming'
  | 'family_dinner'
  | 'cast_net_fishing'
  | 'pray_buddha'
  | 'morning_alms'
  | 'somtam_feast'
  | 'temple_fair'
  | 'bangfai_festival'
  | 'takian_shrine'
  | 'krasue_window'
  | 'jujube_thorns'
  | 'paddy_shrine_dug'
  | 'monk_blessing'
  | 'saisin_ward'
  | 'banish_ritual'
  | 'school_dare'
  | 'classroom_lesson'
  | 'music_room_ranat'
  | 'locker_hide'
  | 'dancer_finale'
  | 'songthaew_ride';

interface CutsceneMeta {
  title: string;
  durationMs: number;
  captions: [string, string, string];
}

const CUTSCENE_META: Record<IsaanCutsceneId, CutsceneMeta> = {
  homecoming: {
    title: '🎬 คัทซีน — กลับคืนสู่เรือนไม้บ้านทุ่งอีสาน',
    durationMs: 4800,
    captions: [
      'แสงแดดยามสนธยาสาดส่องทิวต้นตาลและทุ่งนาอีสานอันกว้างไกล...',
      'หนุ่มก้าวเดินขึ้นสู่ชานเรือนไม้ยกสูง สวมกอดแม่คำและน้องแก้วให้หายคิดถึงตลอดสี่ปี',
      'ไออุ่นจากแสงตะเกียงและรอยยิ้มของครอบครัวทำให้หัวใจกลับมาพองโตอีกครั้ง',
    ],
  },
  family_dinner: {
    title: '🎬 คัทซีน — ล้อมวงข้าวแลงใต้แสงตะเกียง',
    durationMs: 4500,
    captions: [
      'บนชานเรือนไม้สัก กระติบข้าวเหนียวลายสานและหม้อดินต้มยำปลาช่อนกำลังส่งควันหอมกรุ่น...',
      'หนุ่ม แม่คำ และน้องแก้วล้อมวงกินข้าวแลงใต้แสงตะเกียงเจ้าพายุอันแสนอบอุ่น',
      'ค่ำคืนแรกผ่านไปอย่างเป็นสุข... โดยหารู้ไม่ว่าเงาลี้ลับกำลังคืบคลานเข้ามาในคืนถัดไป',
    ],
  },
  cast_net_fishing: {
    title: '🎬 คัทซีน — ชาวบ้านหว่านแห & ตกปลาช่อนหนองน้ำบ้านทุ่ง',
    durationMs: 5000,
    captions: [
      'แสงเย็นสะท้อนผืนน้ำหนองบัวเป็นประกาย ชาวบ้านบนสะพานไม้รวบชายแหเตรียมเหวี่ยง...',
      'วูบ!! ผืนแหถักตาข่ายลูกตะกั่วกางบานสะพรั่งกลางอากาศก่อนกระทบผิวน้ำกระจายละอองใส!',
      'ได้ "ปลาช่อนนา" ตัวเบ้อเริ่มดิ้นสะบัดในผืนแหท่ามกลางเสียงเฮสนั่นริมหนองน้ำ!',
    ],
  },
  pray_buddha: {
    title: '🎬 คัทซีน — กราบสักการะพระประธานในพระอุโบสถ',
    durationMs: 5000,
    captions: [
      'ลำแสงทองส่องผ่านหน้าต่างอุโบสถต้ององค์พระพุทธรูปทองคำอร่ามท่ามกลางควันธูปอ้อยอิ่ง...',
      'หนุ่มคุกเข่าพนมมือก้มลงกราบเบญจางคประดิษฐ์สามครั้งด้วยจิตใจอันสงบและศรัทธา',
      'ความร่มเย็นแห่งพุทธคุณแผ่ซ่านคุ้มครองกายใจจนสติกลับคืนมาเต็มเปี่ยม!',
    ],
  },
  morning_alms: {
    title: '🎬 คัทซีน — ใส่บาตรหลวงพี่ยามรุ่งสาง',
    durationMs: 4500,
    captions: [
      'ไอหมอกสีชมพูอมทองยามรุ่งอรุณปกคลุมถนนดินแดงหมู่บ้านบ้านทุ่ง...',
      'หนุ่มน้อมกายประเคนข้าวเหนียวร้อนลงในบาตรของหลวงพี่อย่างสำรวม',
      'รัศมีบุญแห่งรุ่งเช้าช่วยเสริมสิริมงคลและขวัญกำลังใจตลอดวัน',
    ],
  },
  somtam_feast: {
    title: '🎬 คัทซีน — ส้มตำครกไม้ & ไก่ย่างแม่ลำไย',
    durationMs: 4300,
    captions: [
      'โป๊ก! โป๊ก! แม่ลำไยตำส้มตำปลาร้าครกไม้กลางตลาดสด กลิ่นมะนาวพริกสดหอมฟุ้ง...',
      'ควันถ่านจากเตาไก่ย่างลอยคลุ้งชวนน้ำลายสอ พร้อมข้าวเหนียวร้อนในกระติบ',
      'มื้อแซ่บกลางตลาดทำให้หนุ่มหายเหนื่อยและกลับมามีเรี่ยวแรงเต็มร้อย!',
    ],
  },
  temple_fair: {
    title: '🎬 คัทซีน — เที่ยวงานบุญประจำปี ชิงช้าสวรรค์ & ปาลูกโป่ง',
    durationMs: 4800,
    captions: [
      'แสงนีออนหลากสีจากชิงช้าสวรรค์ยักษ์หมุนสว่างไสวเหนือลานวัดป่าบ้านทุ่ง...',
      'ปัง! ปัง! ปาลูกโป่งแตก 3 ลูกรวดท่ามกลางเสียงหมอลำซิ่งและธงทิวโบกสะบัด!',
      'ค่ำคืนงานวัดสุดคึกคัก... ก่อนข่าวลือประหลาดจะพรากเสียงหัวเราะของหมู่บ้านไป',
    ],
  },
  bangfai_festival: {
    title: '🎬 คัทซีน — จุดบั้งไฟพญานาคประเพณีขอฝน',
    durationMs: 4600,
    captions: [
      'บั้งไฟลายกนกหัวพญานาคตระหง่านบนฐานยิงไม้ไผ่สูงเสียดฟ้า...',
      'ซู่!! เปลวไฟคำรามลั่นส่งบั้งไฟพุ่งแหวกเมฆสนธยาทะยานขึ้นสู่ท้องฟ้า!',
      'ประกายไฟแตกบานสว่างไสว สร้างขวัญกำลังใจให้ชาวบ้านทุ่งทั้งหมู่บ้าน!',
    ],
  },
  takian_shrine: {
    title: '🎬 คัทซีน — กราบขอพรศาลเจ้าแม่ตะเคียนทอง',
    durationMs: 4600,
    captions: [
      'โคนต้นตะเคียนคู่สูงเสียดฟ้าอาบหมอกเย็นยะเยือกในแสงจันทร์สีเงิน...',
      'แพรผ้าเจ็ดสีสะบัดพลิ้วไหวขึ้นพร้อมกลิ่นดอกมะลิและเสียงกระซิบเตือนภัยล่วงหน้า!',
      'แสงสีมรกตทองส่องลงบนผ้าผูกขวัญ มอบพลังคุ้มครองแก่ผู้ศรัทธา',
    ],
  },
  krasue_window: {
    title: '🎬 คัทซีน — ผีกระสือลอยบุกหน้าต่างเรือนไม้กลางดึก!!',
    durationMs: 5100,
    captions: [
      'กลางดึกสงัด... ลมพายุพัดกระแทกบานหน้าต่างไม้สักเปิดผางออกในความมืด!',
      'กรี๊ดด!! ดวงไฟอาคมสีเขียวอมเลือดส่องเห็นศีรษะหญิงแก่ลอยคว้างพร้อมตับไตไส้พุง!!',
      'หนุ่มผลักน้องแก้วหลบและกระชากปิดหน้าต่างหวุดหวิด เสียงหมาหอนเกรียวทั้งหมู่บ้าน!',
    ],
  },
  jujube_thorns: {
    title: '🎬 คัทซีน — หนามพุทราขวางหน้าต่าง สยบกระสือกรีดร้องหนี!',
    durationMs: 4600,
    captions: [
      'กิ่งหนามพุทราแหลมคมถูกขัดวางเรียงแน่นเต็มขอบหน้าต่างเรือนไม้ยกสูง...',
      'ผีกระสือโฉบพุ่งเข้ามาหวังสืบทายาท — แต่ต้องผงะชนเข้ากับหนามพุทราอาคม!',
      'เปรี้ยง!! สะเก็ดไฟแตกกระจาย มันกรีดร้องโหยหวนบินเตลิดหายลับไปในความมืด!',
    ],
  },
  paddy_shrine_dug: {
    title: '🎬 คัทซีน — ขุดเชี่ยนหมากเงินโบราณใต้ศาลปู่ตากลางทุ่ง',
    durationMs: 4600,
    captions: [
      'หลังสองทุ่มครึ่ง ลำแสงไฟฉายเจาะผ่านม่านหมอกลงไปยังฐานอิฐศาลปู่ตา...',
      'หนุ่มขุดพบ "เชี่ยนหมากเงินโบราณ" ที่จารึกชื่อ "แก้ว" เป็นทายาทคนต่อไปด้วยเลือด!',
      'ทันทีที่เปิดฝา แสงกระสือสีเขียวก็พุ่งวาบขึ้นเหนือยอดตาลด้านข้าง!',
    ],
  },
  monk_blessing: {
    title: '🎬 คัทซีน — หลวงพี่ปลุกเสกธูป น้ำมนต์ & มีดหมออาคม',
    durationMs: 4800,
    captions: [
      'ท่ามกลางแสงเทียนชัยกลางกุฏิ หลวงพี่สวดพระคาถาถอนสายใยมนตร์ดำโบราณ...',
      'ละอองน้ำพระพุทธมนต์พรมลงบนธูปสะกด น้ำมนต์ และมีดหมอลงอาคมจนส่องรัศมีสีทอง!',
      'ของขลังทั้งสามพร้อมแล้วสำหรับการตัดขาดตำนานร้าย ณ โกศอัฐิหมายเลข 4',
    ],
  },
  saisin_ward: {
    title: '🎬 คัทซีน — วงสายสิญจน์ลานวัด เปล่งแสงขวางผีกระสือ!',
    durationMs: 4600,
    captions: [
      'ด้ายสายสิญจน์จากอุโบสถถูกโยงล้อมเสาไม้ไผ่ 8 ทิศรอบลานวัดป่าอย่างแน่นหนา...',
      'ทันทีที่ผีกระสือพุ่งเข้าประชิด เกราะสายสิญจน์ก็ส่องแสงวาบดุจสายฟ้ากระแทกมันกระเด็น!',
      'ตาชม ป้าบัว เฮียตี๋ และชาวบ้านทุกคนปลอดภัยในเขตอภัยทาน!',
    ],
  },
  banish_ritual: {
    title: '🎬 คัทซีนปิดตำนาน — พิธีตัดขาดอาคม & บายศรีสู่ขวัญรุ่งสาง',
    durationMs: 5800,
    captions: [
      'หน้าโกศบรรจุอัฐิหมายเลข 4 — หนุ่มปักธูปสะกด สาดน้ำมนต์แผดเผาผ้าซิ่นอาคม!',
      'ฉับ!! มีดหมอสะบั้นเชี่ยนหมากเงินขาดสะบั้น แสงรุ่งสางสาดส่องขับไล่ความมืดสลายสิ้น!',
      'พิธีบายศรีสู่ขวัญผูกฝ้ายขาวและเสียงรถแห่อบอุ่นกลับมาสู่บ้านทุ่งตลอดกาล!',
    ],
  },
  school_dare: {
    title: '🎬 คัทซีน — คำท้าสุดหลอนหน้าโรงเรียนมัธยมจันทรารัตน์',
    durationMs: 4700,
    captions: [
      'ยามเย็นหน้าซุ้มประตูโรงเรียน กลุ่มไอ้ก้องยืนท้าทายภีมใต้แสงโพล้เพล้...',
      '"กล้าแอบขึ้นห้องดนตรีไทยชั้น 3 ตอนดึก ตีระนาด 3 ทีแล้วถ่ายรูปหน้ากระจกไหมล่ะ?!"',
      'หน้าต่างห้องดนตรีไทยชั้น 3 วูบแสงแดงฉานขึ้นราวกับวิญญาณนางรำกำลังรอคอย...',
    ],
  },
  classroom_lesson: {
    title: '🎬 คัทซีน — บรรยากาศคาบเรียนห้อง ม.5/2 ยามกลางวัน',
    durationMs: 4400,
    captions: [
      'แสงแดดส่องผ่านหน้าต่างห้องเรียน ครูสมชายสอนเรื่องเครื่องดนตรีไทยหน้ากระดาน...',
      'เพื่อนร่วมชั้นกระซิบเล่าตำนานนางรำเอก "พี่ดาวประกาย" ที่คอหักตายเมื่อ 15 ปีก่อน!',
      'พร้อมชี้เบาะแสกระดาษโน้ตลับใต้โต๊ะเรียนเรื่อง "คราบขี้ผึ้งเคลือบเวที"...',
    ],
  },
  music_room_ranat: {
    title: '🎬 คัทซีน — ตีระนาดเอกหน้ากระจก... ผีนางรำปรากฏกาย!!',
    durationMs: 5200,
    captions: [
      'ท่ามกลางความมืดมิดในห้องดนตรีไทย ภีมบรรเลงไม้ระนาดเอกตามโน้ตต้องสาป...',
      'แก๊ง!! กระจกเงาโบราณสั่นไหว เผยร่าง "ผีนางรำชฎาทอง-สไบเลือด" ลอยขึ้นด้านหลัง!!',
      'เสียงระนาดรัวเองโดยไร้คนตี เธอเอียงคอหักจ้องผ่านกระจกแล้วพุ่งเข้าใส่!!',
    ],
  },
  locker_hide: {
    title: '🎬 คัทซีน — กลั้นหายใจในตู้ล็อกเกอร์ขณะผีนางรำผ่านไป',
    durationMs: 4500,
    captions: [
      'ภีมมุดเข้าตู้ล็อกเกอร์ ปิดประตูแง้มเหลือเพียงช่องแคบมองทางเดินสีเลือด...',
      'ติ๊ง... ต่อง... เสียงกำไลข้อเท้าและชายสไบแดงลอยเฉียดผ่านไปช้าๆ ห่างแค่คืบ!!',
      'เธอหยุดสูดดมกลิ่นหน้าตู้ครู่หนึ่ง ก่อนร่ายรำลอยลับหายไปปลายระเบียง...',
    ],
  },
  dancer_finale: {
    title: '🎬 คัทซีนปิดฉาก — คืนชฎาทองโบราณ & ปลดปล่อยวิญญาณ',
    durationMs: 5600,
    captions: [
      'ภีมวาง "ชฎาทองโบราณ" ที่ถูกขโมยไว้กลับคืนบนแท่นบูชาหน้ากระจกอย่างนอบน้อม...',
      'รัศมีสีทองสว่างเจิดจ้า พี่ดาวประกายสวมชฎาร่ายรำอย่างสง่างามอ่อนช้อยทั้งน้ำตา...',
      'รุ่งเช้าครูวิไลถูกจับกุม และความยุติธรรมก็หวนคืนสู่โรงเรียนมัธยมจันทรารัตน์ตลอดกาล!',
    ],
  },
  songthaew_ride: {
    title: '🎬 คัทซีน — นั่งรถสองแถวออกเดินทางข้ามโซน',
    durationMs: 3800,
    captions: [
      'ก้าวขึ้นนั่งบนเบาะไม้ท้ายรถสองแถวหลังคาสังกะสี จับราวเหล็กให้มั่น!',
      'สองแถวเร่งเครื่องแล่นฉิวผ่านทิวไม้ เสาไฟฟ้า และวิวสองข้างทางสุดลูกหูลูกตา...',
      'เอี๊ยด~ รถจอดเทียบป้ายปลายทางอย่างนุ่มนวลและปลอดภัย!',
    ],
  },
};

export class CutscenePlayer {
  private overlay: HTMLElement | null = null;
  private rafId = 0;
  private playing = false;
  private skipHandler: (() => void) | null = null;

  private ch2Cache = new Map<string, HTMLCanvasElement>();
  private ch3Cache = new Map<string, HTMLCanvasElement>();

  private getCh2Sprite(kind: Ch2CharacterKind, frame = 0): HTMLCanvasElement {
    const k = `${kind}_${frame}`;
    let c = this.ch2Cache.get(k);
    if (!c) {
      c = drawCh2CharacterCanvas(kind, frame);
      this.ch2Cache.set(k, c);
    }
    return c;
  }

  private getCh3Sprite(kind: Ch3CharKind, frame = 0): HTMLCanvasElement {
    const k = `${kind}_${frame}`;
    let c = this.ch3Cache.get(k);
    if (!c) {
      c = drawCh3CharacterCanvas(kind, frame);
      this.ch3Cache.set(k, c);
    }
    return c;
  }

  public isPlaying(): boolean {
    return this.playing;
  }

  public stop(): void {
    if (!this.playing) return;
    this.skipHandler?.();
  }

  public play(id: IsaanCutsceneId, onComplete?: () => void): void {
    this.cleanupDom();
    const meta = CUTSCENE_META[id];
    const el = document.createElement('div');
    el.id = 'cutscene-overlay';
    el.innerHTML = `
      <div class="cutscene-letterbox-top">
        <span class="cutscene-title">${meta.title}</span>
        <button type="button" class="cutscene-skip-btn" id="cs-skip">ข้ามคัทซีน [Space / Esc] ⏭</button>
      </div>
      <div class="cutscene-stage">
        <canvas id="cutscene-canvas" width="960" height="540"></canvas>
      </div>
      <div class="cutscene-letterbox-bot">
        <div class="cutscene-sub" id="cs-sub">${meta.captions[0]}</div>
        <div class="cutscene-progress-bg"><div class="cutscene-progress-fill" id="cs-bar"></div></div>
      </div>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    this.overlay = el;
    this.playing = true;

    const canvas = el.querySelector<HTMLCanvasElement>('#cutscene-canvas')!;
    const ctx = canvas.getContext('2d')!;
    const subEl = el.querySelector<HTMLElement>('#cs-sub')!;
    const barEl = el.querySelector<HTMLElement>('#cs-bar')!;

    const finish = () => {
      if (!this.playing) return;
      this.playing = false;
      cancelAnimationFrame(this.rafId);
      window.removeEventListener('keydown', keyHandler, true);
      this.cleanupDom();
      onComplete?.();
    };
    this.skipHandler = finish;

    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        finish();
      }
    };
    window.addEventListener('keydown', keyHandler, true);
    el.querySelector('#cs-skip')?.addEventListener('click', finish);
    el.querySelector('.cutscene-stage')?.addEventListener('click', finish);

    const start = performance.now();
    const tick = (now: number) => {
      if (!this.playing) return;
      const elapsed = now - start;
      const p = Math.min(1, elapsed / meta.durationMs);
      barEl.style.width = `${p * 100}%`;
      const capIdx = p < 0.34 ? 0 : p < 0.7 ? 1 : 2;
      if (subEl.textContent !== meta.captions[capIdx]) {
        subEl.textContent = meta.captions[capIdx];
      }
      this.drawFrame(ctx, canvas.width, canvas.height, id, p, elapsed / 1000);
      if (p >= 1) {
        finish();
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private cleanupDom(): void {
    cancelAnimationFrame(this.rafId);
    this.overlay?.remove();
    this.overlay = null;
    this.playing = false;
    this.skipHandler = null;
  }

  // ==================== SHARED CINEMA RENDERING HELPERS ====================

  private drawSprite(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLCanvasElement,
    footX: number,
    footY: number,
    scale = 1,
    dir: 1 | -1 = 1,
    rotDeg = 0,
    shadowAlpha = 0.45,
    reflectionAlpha = 0
  ): void {
    const dw = sprite.width * scale;
    const dh = sprite.height * scale;

    if (reflectionAlpha > 0) {
      ctx.save();
      ctx.translate(footX, footY);
      ctx.scale(dir, -0.36);
      ctx.globalAlpha = reflectionAlpha;
      ctx.drawImage(sprite, -dw / 2, -dh, dw, dh);
      ctx.restore();
    }

    if (shadowAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(footX, footY, dw * 0.28, dh * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(footX, footY);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.scale(dir, 1);
    ctx.drawImage(sprite, -dw / 2, -dh, dw, dh);
    ctx.restore();
  }

  private drawGodRay(
    ctx: CanvasRenderingContext2D,
    xTop: number,
    yTop: number,
    topW: number,
    xBot: number,
    yBot: number,
    botW: number,
    rgb: string,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(xTop, yTop, xBot, yBot);
    g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(xTop - topW / 2, yTop);
    ctx.lineTo(xTop + topW / 2, yTop);
    ctx.lineTo(xBot + botW / 2, yBot);
    ctx.lineTo(xBot - botW / 2, yBot);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawGlowOrb(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    rgb: string,
    alpha = 0.75
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    g.addColorStop(0.45, `rgba(${rgb}, ${alpha * 0.35})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPalmTree(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, sway = 0): void {
    ctx.save();
    ctx.strokeStyle = '#18100c';
    ctx.lineWidth = Math.max(4, h * 0.05);
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + sway * 8, baseY - h * 0.5, x + sway * 16, baseY - h);
    ctx.stroke();
    const tx = x + sway * 16;
    const ty = baseY - h;
    ctx.fillStyle = '#0f291e';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + sway * 0.1;
      ctx.beginPath();
      ctx.ellipse(tx + Math.cos(a) * 18, ty + Math.sin(a) * 12, 22, 6, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawParallaxHills(ctx: CanvasRenderingContext2D, w: number, horizonY: number, col1: string, col2: string): void {
    ctx.fillStyle = col1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.quadraticCurveTo(w * 0.2, horizonY - 48, w * 0.42, horizonY - 12);
    ctx.quadraticCurveTo(w * 0.7, horizonY - 64, w, horizonY - 18);
    ctx.lineTo(w, horizonY + 120);
    ctx.lineTo(0, horizonY + 120);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = col2;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 8);
    ctx.quadraticCurveTo(w * 0.3, horizonY - 24, w * 0.62, horizonY - 4);
    ctx.quadraticCurveTo(w * 0.85, horizonY - 32, w, horizonY);
    ctx.lineTo(w, horizonY + 120);
    ctx.lineTo(0, horizonY + 120);
    ctx.closePath();
    ctx.fill();
  }

  private drawPerspectiveFloor(ctx: CanvasRenderingContext2D, w: number, h: number, yStart: number, topCol: string, botCol: string, plankCount = 9): void {
    const g = ctx.createLinearGradient(0, yStart, 0, h);
    g.addColorStop(0, topCol);
    g.addColorStop(1, botCol);
    ctx.fillStyle = g;
    ctx.fillRect(0, yStart, w, h - yStart);

    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2;
    for (let i = -plankCount; i <= plankCount; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 48, yStart);
      ctx.lineTo(w / 2 + i * 115, h);
      ctx.stroke();
    }
    for (let r = 1; r <= 4; r++) {
      const y = yStart + Math.pow(r / 4, 1.5) * (h - yStart);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private applyCameraTransform(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, panX: number, panY: number, shake = 0): void {
    const sx = shake ? Math.sin(performance.now() * 0.08) * shake : 0;
    const sy = shake ? Math.cos(performance.now() * 0.11) * shake * 0.7 : 0;
    ctx.translate(w / 2 + panX + sx, h / 2 + panY + sy);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
  }

  private drawFrame(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    id: IsaanCutsceneId,
    p: number,
    t: number
  ): void {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    switch (id) {
      case 'homecoming':
        this.drawHomecoming(ctx, w, h, p, t);
        break;
      case 'family_dinner':
        this.drawFamilyDinner(ctx, w, h, p, t);
        break;
      case 'cast_net_fishing':
        this.drawCastNetFishing(ctx, w, h, p, t);
        break;
      case 'pray_buddha':
        this.drawPrayBuddha(ctx, w, h, p, t);
        break;
      case 'morning_alms':
        this.drawMorningAlms(ctx, w, h, p, t);
        break;
      case 'somtam_feast':
        this.drawSomtamFeast(ctx, w, h, p, t);
        break;
      case 'temple_fair':
        this.drawTempleFair(ctx, w, h, p, t);
        break;
      case 'bangfai_festival':
        this.drawBangFai(ctx, w, h, p, t);
        break;
      case 'takian_shrine':
        this.drawTakianShrine(ctx, w, h, p, t);
        break;
      case 'krasue_window':
        this.drawKrasueWindow(ctx, w, h, p, t);
        break;
      case 'jujube_thorns':
        this.drawJujubeThorns(ctx, w, h, p, t);
        break;
      case 'paddy_shrine_dug':
        this.drawPaddyShrine(ctx, w, h, p, t);
        break;
      case 'monk_blessing':
        this.drawMonkBlessing(ctx, w, h, p, t);
        break;
      case 'saisin_ward':
        this.drawSaiSinWard(ctx, w, h, p, t);
        break;
      case 'banish_ritual':
        this.drawBanishRitual(ctx, w, h, p, t);
        break;
      case 'school_dare':
        this.drawSchoolDare(ctx, w, h, p, t);
        break;
      case 'classroom_lesson':
        this.drawClassroomLesson(ctx, w, h, p, t);
        break;
      case 'music_room_ranat':
        this.drawMusicRoomRanat(ctx, w, h, p, t);
        break;
      case 'locker_hide':
        this.drawLockerHide(ctx, w, h, p, t);
        break;
      case 'dancer_finale':
        this.drawDancerFinale(ctx, w, h, p, t);
        break;
      case 'songthaew_ride':
        this.drawSongthaewRide(ctx, w, h, p, t);
        break;
    }
    ctx.restore();

    // Cinema vignette & warm/cold grade polish
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.34, w / 2, h / 2, w * 0.64);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  // ==================== ISAAN CHAPTER 2 CINEMATIC SCENES ====================

  private drawHomecoming(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.08, -p * 24, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.45, '#9d174d');
    sky.addColorStop(0.8, '#f59e0b');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Golden sun halo + diagonal sunset rays
    this.drawGlowOrb(ctx, 210, 215 + p * 18, 220, '253, 224, 71', 0.85);
    this.drawGodRay(ctx, 210, 180, 90, 620, h, 460, '251, 191, 36', 0.25);

    this.drawParallaxHills(ctx, w, 340, '#2e1065', '#14532d');
    [105, 165, 860].forEach((px, i) => this.drawPalmTree(ctx, px, 345, 145 + i * 25, Math.sin(t + i) * 0.5));

    // Perspective paddy road
    this.drawPerspectiveFloor(ctx, w, h, 340, '#166534', '#451a03', 8);

    // Rich Grand Teak Stilt House on right with stairs & hanging lantern
    ctx.fillStyle = '#3b2113';
    ctx.fillRect(540, 165, 310, 130);
    // Wooden slat paneling & roof eaves
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(500, 175);
    ctx.lineTo(695, 78);
    ctx.lineTo(890, 175);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Glowing warm upstairs windows + stilt columns
    ctx.fillStyle = '#241208';
    [560, 645, 735, 820].forEach((sx) => ctx.fillRect(sx, 295, 18, 125));
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(585, 200, 56, 52);
    ctx.fillRect(720, 200, 56, 52);
    this.drawGlowOrb(ctx, 695, 270, 110, '251, 191, 36', 0.5);

    // Animated Noom walking toward Mom & Sister!
    const noomX = 240 + Math.min(1, p * 1.35) * 210;
    const walkF = p < 0.74 ? Math.floor(t * 7) % 4 : 0;
    this.drawSprite(ctx, this.getCh2Sprite('mom', 0), 535, 445, 1.05, -1, 0, 0.5);
    this.drawSprite(ctx, this.getCh2Sprite('sister', 0), 580, 452, 0.9, -1, 0, 0.45);
    this.drawSprite(ctx, this.getCh2Sprite('noom', walkF), noomX, 452, 1.08, 1, 0, 0.55);

    // Fireflies & sunset dust motes
    for (let i = 0; i < 16; i++) {
      this.drawGlowOrb(
        ctx,
        (i * 68 + t * 28) % w,
        240 + Math.sin(t * 2.5 + i) * 75,
        8,
        '253, 224, 71',
        0.55 + Math.sin(t * 5 + i) * 0.35
      );
    }
    // Dark foreground rice grass silhouette for 3D depth
    ctx.fillStyle = '#061a0e';
    for (let gx = 0; gx < w; gx += 22) {
      const lean = Math.sin(t * 2.2 + gx * 0.05) * 9;
      ctx.beginPath();
      ctx.moveTo(gx, h);
      ctx.quadraticCurveTo(gx + lean, h - 55, gx + 6 + lean * 1.4, h - 82 - (gx % 30));
      ctx.lineTo(gx + 10, h);
      ctx.fill();
    }
  }

  private drawFamilyDinner(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1.02 + p * 0.06, 0, 0);

    // Warm indoor plank background + wooden rafters
    ctx.fillStyle = '#1f1008';
    ctx.fillRect(0, 0, w, h);
    for (let wy = 40; wy < 320; wy += 42) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.lineTo(w, wy);
      ctx.stroke();
    }
    this.drawPerspectiveFloor(ctx, w, h, 310, '#452412', '#261107', 10);

    // Warm hanging oil lamp & cozy light bloom
    ctx.fillStyle = '#facc15';
    ctx.fillRect(475, 0, 4, 108);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(477, 122, 18, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    this.drawGlowOrb(ctx, 477, 165, 360 + Math.sin(t * 7) * 14, '251, 146, 60', 0.65);

    // Woven Isaan Reed Mat (เสื่อกก) with decorative edge
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(480, 445, 310, 74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Painted family characters gathered closely
    this.drawSprite(ctx, this.getCh2Sprite('mom', 0), 310, 445, 1.05, 1, 2, 0.45);
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 480, 415, 0.96, 1, 0, 0.4);
    this.drawSprite(ctx, this.getCh2Sprite('sister', 0), 650, 448, 0.95, -1, -2, 0.45);

    // Detailed Isaan Khantoke Tray, Woven Bamboo Kratib, Grilled Pork & Tom Yum Bowl!
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(480, 442, 110, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    // Woven Kratib sticky rice basket
    ctx.fillStyle = '#eab308';
    ctx.fillRect(408, 396, 44, 38);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(405, 394, 50, 10);
    // Steaming Tom Yum soup bowl
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(500, 424, 30, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(500, 424, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let s = 0; s < 8; s++) {
      this.drawGlowOrb(ctx, 495 + Math.sin(t * 2 + s) * 20, 405 - ((t * 50 + s * 20) % 95), 14, '255, 255, 255', 0.22);
    }
  }

  private drawCastNetFishing(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    // Camera pans slightly right following the arc of the thrown cast net!
    this.applyCameraTransform(ctx, w, h, 1.04 + p * 0.05, -p * 28, 0);

    // Rich sunset reflection sky
    const sky = ctx.createLinearGradient(0, 0, 0, 290);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.5, '#1d4ed8');
    sky.addColorStop(0.82, '#fb923c');
    sky.addColorStop(1, '#fde68a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, 290);

    this.drawGlowOrb(ctx, 730, 215, 190, '253, 224, 71', 0.72);
    this.drawParallaxHills(ctx, w, 292, '#1e293b', '#14532d');
    [410, 620, 810].forEach((tx, idx) => this.drawPalmTree(ctx, tx, 292, 105 + idx * 14, Math.sin(t + idx) * 0.3));

    // Pond Water with shimmering sky/sun gradient
    const water = ctx.createLinearGradient(0, 290, 0, h);
    water.addColorStop(0, '#1e3a5f');
    water.addColorStop(0.45, '#0f4c5c');
    water.addColorStop(1, '#042029');
    ctx.fillStyle = water;
    ctx.fillRect(0, 290, w, h - 290);

    // Shimmering sun reflection across water surface
    for (let y = 300; y < 440; y += 14) {
      ctx.fillStyle = `rgba(253, 224, 71, ${0.22 - (y - 300) / 800})`;
      ctx.fillRect(675 + Math.sin(t * 4 + y) * 18, y, 90 - (y - 300) * 0.3, 4);
    }

    // Blooming pink lotuses & lily pads floating smoothly
    [430, 560, 740, 835].forEach((lx, idx) => {
      const ly = 365 + (idx % 2) * 55;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 36, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(lx + 10, ly - 5, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Perspective Wooden Pier extending from left into pond
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.lineTo(310, 328);
    ctx.lineTo(310, 354);
    ctx.lineTo(0, 375);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#29170b';
    [80, 185, 285].forEach((px) => ctx.fillRect(px, 326, 16, 115));

    // Painted Fish Vendor / Uncle & Noom watching + Mirror reflection in pond!
    const throwTilt = p < 0.28 ? -16 * (p / 0.28) : Math.max(0, 18 * (1 - (p - 0.28) * 3.5));
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 145, 345, 0.96, 1, 0, 0.45, 0.22);
    this.drawSprite(ctx, this.getCh2Sprite('fish_vendor', 0), 255, 345, 1.08, 1, throwTilt, 0.5, 0.25);

    // Intricate Flying Mesh Cast Net with golden lead weights (แหถักตาข่ายจริง!)
    if (p < 0.64) {
      const fp = Math.max(0, (p - 0.14) / 0.5);
      const nx = 285 + fp * 335;
      const ny = 190 - Math.sin(fp * Math.PI) * 110 + fp * 185;
      const rx = 24 + fp * 98;
      const ry = 18 + fp * 50;

      ctx.save();
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.88)';
      ctx.lineWidth = 1.6;
      // Radial net ribs
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(nx, ny - 26);
        ctx.lineTo(nx + Math.cos(a) * rx, ny + Math.sin(a) * ry);
        ctx.stroke();
      }
      // Cross rings + lead weights around hem
      [0.45, 0.75, 1.0].forEach((ringScale) => {
        ctx.beginPath();
        ctx.ellipse(nx, ny + (ringScale - 0.3) * 14, rx * ringScale, ry * ringScale, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = '#eab308';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(nx + Math.cos(a) * rx, ny + 10 + Math.sin(a) * ry, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Impact Splash, Water Drops & Metallic Snakehead Fish jumping!
    if (p >= 0.58) {
      const sp = (p - 0.58) / 0.42;
      for (let r = 0; r < 3; r++) {
        const rr = Math.max(0.05, sp - r * 0.12);
        ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, 0.85 - rr)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(620, 385, 35 + rr * 145, 12 + rr * 42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Splash water droplets
      for (let d = 0; d < 14; d++) {
        const ang = (d / 14) * Math.PI;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.beginPath();
        ctx.arc(620 + Math.cos(ang) * sp * 95, 385 - Math.sin(ang) * Math.sin(sp * Math.PI) * 95, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Metallic shaded Snakehead fish leaping cleanly
      const fx = 620 - Math.max(0, sp - 0.35) * 260;
      const fy = 365 - Math.sin(Math.min(1, sp * 1.45) * Math.PI) * 115;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(Math.sin(t * 16) * 0.25);
      const fg = ctx.createLinearGradient(0, -14, 0, 14);
      fg.addColorStop(0, '#334155');
      fg.addColorStop(0.5, '#cbd5e1');
      fg.addColorStop(1, '#f8fafc');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-36, 0);
      ctx.lineTo(-56, -13);
      ctx.lineTo(-56, 13);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPrayBuddha(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    // Slow respectful push-in dolly!
    this.applyCameraTransform(ctx, w, h, 1.0 + p * 0.1, 0, -p * 12);

    const wall = ctx.createLinearGradient(0, 0, 0, 355);
    wall.addColorStop(0, '#1f0606');
    wall.addColorStop(1, '#450a0a');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, 355);

    // Red lacquer temple pillars with gold Thai floral stripes
    [135, 825].forEach((px) => {
      const pg = ctx.createLinearGradient(px - 24, 0, px + 24, 0);
      pg.addColorStop(0, '#450a0a');
      pg.addColorStop(0.5, '#991b1b');
      pg.addColorStop(1, '#2d0606');
      ctx.fillStyle = pg;
      ctx.fillRect(px - 24, 0, 48, 360);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(px - 24, 290, 48, 8);
    });

    // Polished Ubosot Marble Floor with Buddha Mirror Reflection!
    this.drawPerspectiveFloor(ctx, w, h, 355, '#5c1f12', '#260a05', 12);

    // Radiant Golden Aura + Diagonal Temple Window Rays
    this.drawGlowOrb(ctx, 480, 175, 240 + Math.sin(t * 3) * 14, '253, 224, 71', 0.85);
    this.drawGodRay(ctx, 210, 0, 75, 420, h, 320, '254, 240, 138', 0.18);
    this.drawGodRay(ctx, 750, 0, 75, 540, h, 320, '254, 240, 138', 0.18);

    // Ornate Pedestal & Gilded Phra Prathan Buddha (Detailed Silhouette + Halo Arch)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(355, 295, 250, 62);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(370, 282, 220, 14);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(390, 268, 180, 14);

    // Buddha body gradient
    const bg = ctx.createLinearGradient(420, 100, 540, 270);
    bg.addColorStop(0, '#fef08a');
    bg.addColorStop(0.5, '#eab308');
    bg.addColorStop(1, '#a16207');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(480, 248, 72, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(434, 244);
    ctx.lineTo(526, 244);
    ctx.lineTo(508, 162);
    ctx.lineTo(452, 162);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(480, 132, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(470, 106);
    ctx.lineTo(480, 76);
    ctx.lineTo(490, 106);
    ctx.closePath();
    ctx.fill();

    // Upside-down soft reflection on polished temple floor
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(480, 392, 62, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Flickering Brass Candles + Rising Incense Smoke + Falling Lotus Petals
    [390, 570].forEach((cx) => {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(cx - 5, 232, 10, 38);
      this.drawGlowOrb(ctx, cx, 224 + Math.sin(t * 14 + cx) * 2, 34, '251, 146, 60', 0.78);
    });
    for (let s = 0; s < 7; s++) {
      this.drawGlowOrb(ctx, 480 + Math.sin(t * 2.2 + s) * 22, 265 - ((t * 48 + s * 22) % 130), 13, '226, 232, 240', 0.22);
    }
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = 'rgba(253, 224, 71, 0.72)';
      ctx.beginPath();
      ctx.ellipse(180 + i * 56, (t * 44 + i * 55) % h, 6, 3, t + i, 0, Math.PI * 2);
      ctx.fill();
    }

    // Painted Noom Sprite performing graceful 3-step Thai Bow + reflection on marble floor!
    const bowCycle = Math.sin(p * Math.PI * 3);
    const bowDeg = bowCycle > 0 ? bowCycle * 42 : 0;
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 480, 485, 1.08, 1, bowDeg, 0.55, 0.18);
  }

  private drawMorningAlms(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.05, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, 330);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.5, '#db2777');
    sky.addColorStop(0.85, '#fb923c');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    this.drawGodRay(ctx, 180, 0, 120, 560, h, 420, '254, 240, 138', 0.26);
    this.drawParallaxHills(ctx, w, 325, '#312e81', '#14532d');
    this.drawPerspectiveFloor(ctx, w, h, 330, '#78350f', '#451a03', 8);

    // Monk with brass Alms Bowl + kneeling Noom scooping rice
    this.drawSprite(ctx, this.getCh2Sprite('monk', 0), 565, 455, 1.15, -1, 0, 0.5);
    const bow = Math.sin(p * Math.PI * 2) > 0 ? 18 : 6;
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 395, 462, 1.02, 1, bow, 0.5);
    this.drawGlowOrb(ctx, 480, 300, 150, '253, 224, 71', 0.4);
    for (let i = 0; i < 10; i++) {
      this.drawGlowOrb(ctx, 320 + i * 35, 210 + Math.cos(t * 2.5 + i) * 35, 10, '254, 240, 138', 0.45);
    }
  }

  private drawSomtamFeast(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.06, 0, 0);
    ctx.fillStyle = '#29150e';
    ctx.fillRect(0, 0, w, h);
    this.drawPerspectiveFloor(ctx, w, h, 355, '#6b3e1b', '#381c09', 9);
    // Red-white Thai market awning top
    for (let x = 0; x < w; x += 64) {
      ctx.fillStyle = (x / 64) % 2 === 0 ? '#b91c1c' : '#fef3c7';
      ctx.fillRect(x, 0, 64, 68);
    }
    this.drawSprite(ctx, this.getCh2Sprite('mom', 0), 320, 440, 1.12, 1, 0, 0.5);
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 650, 455, 1.08, -1, 0, 0.5);

    // Detailed Wooden Somtam Mortar & Pestle + Charcoal Grill!
    ctx.fillStyle = '#78350f';
    ctx.fillRect(370, 350, 220, 88);
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(435, 290);
    ctx.lineTo(525, 290);
    ctx.lineTo(505, 355);
    ctx.lineTo(455, 355);
    ctx.closePath();
    ctx.fill();
    const pound = Math.abs(Math.sin(t * 11));
    ctx.save();
    ctx.translate(480, 285 - pound * 45);
    ctx.rotate(-0.18 + pound * 0.25);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-9, -85, 18, 95);
    ctx.restore();
    this.drawGlowOrb(ctx, 210, 340, 95, '249, 115, 22', 0.45);
  }

  private drawTempleFair(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1.02 + p * 0.05, 0, 0);
    ctx.fillStyle = '#060919';
    ctx.fillRect(0, 0, w, h);
    this.drawParallaxHills(ctx, w, 345, '#0f172a', '#1e293b');
    this.drawPerspectiveFloor(ctx, w, h, 345, '#3b2416', '#1c0f08', 10);

    // Giant Illuminated Ferris Wheel
    const fx = 670;
    const fy = 215;
    const R = 148;
    this.drawGlowOrb(ctx, fx, fy, 230, '250, 204, 21', 0.4);
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(t * 0.6);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(226,232,240,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.stroke();
      ctx.fillStyle = ['#ef4444', '#38bdf8', '#4ade80', '#f472b6', '#facc15'][i % 5];
      ctx.fillRect(Math.cos(a) * R - 13, Math.sin(a) * R - 13, 26, 26);
    }
    ctx.restore();

    // Balloon dart stall & Noom enjoying the festival
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(105, 225, 270, 210);
    for (let b = 0; b < 6; b++) {
      if (p < 0.3 + b * 0.1) {
        ctx.fillStyle = ['#ef4444', '#facc15', '#38bdf8', '#22c55e', '#f472b6', '#a855f7'][b];
        ctx.beginPath();
        ctx.arc(155 + (b % 3) * 82, 275 + Math.floor(b / 3) * 65, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 430, 470, 1.06, -1, 0, 0.5);
  }

  private drawBangFai(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.04, 0, p * 18);
    ctx.fillStyle = '#070b1d';
    ctx.fillRect(0, 0, w, h);
    this.drawPerspectiveFloor(ctx, w, h, 385, '#14532d', '#052e16', 10);

    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(415, 395);
    ctx.lineTo(465, 130);
    ctx.moveTo(545, 395);
    ctx.lineTo(495, 130);
    ctx.stroke();

    const ry = 320 - Math.max(0, (p - 0.16) / 0.84) * 390;
    this.drawGlowOrb(ctx, 480, ry + 25, 130, '251, 146, 60', 0.78);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(470, ry - 75, 20, 80);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(466, ry - 75);
    ctx.lineTo(480, ry - 115);
    ctx.lineTo(494, ry - 75);
    ctx.closePath();
    ctx.fill();

    if (p > 0.62) {
      const fp = (p - 0.62) / 0.38;
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2;
        this.drawGlowOrb(ctx, 480 + Math.cos(a) * fp * 165, 135 + Math.sin(a) * fp * 130, 14, '253, 224, 71', 0.85);
      }
    }
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 275, 470, 1.0, 1, 0, 0.5);
    this.drawSprite(ctx, this.getCh2Sprite('sister', 0), 695, 470, 0.92, -1, 0, 0.5);
    void t;
  }

  private drawTakianShrine(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.07, 0, 0);
    ctx.fillStyle = '#04120c';
    ctx.fillRect(0, 0, w, h);
    this.drawGodRay(ctx, 480, 0, 140, 480, h, 440, '52, 211, 153', 0.25);
    this.drawPerspectiveFloor(ctx, w, h, 385, '#064e3b', '#022c22', 9);

    ctx.fillStyle = '#291c14';
    ctx.fillRect(380, 30, 200, 370);
    const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#6366f1', '#ec4899'];
    cols.forEach((col, i) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(400 + i * 26, 175);
      ctx.quadraticCurveTo(385 + i * 26 + Math.sin(t * 3 + i) * 32, 275, 400 + i * 26 - Math.sin(t * 4 + i) * 35, 385);
      ctx.stroke();
    });
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 270, 475, 1.08, 1, 12, 0.55);
  }

  private drawKrasueWindow(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const shake = p > 0.35 && p < 0.85 ? 5 : 0;
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.14, 0, 0, shake);

    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, w, h);
    // Window frame & night sky view
    ctx.fillStyle = '#091826';
    ctx.fillRect(260, 65, 440, 355);
    this.drawGlowOrb(ctx, 480, 235, 220, '74, 222, 128', 0.35);

    // Floating full painted Krasue Sprite swooping straight at the window!
    const kx = 650 - Math.min(1, p * 1.25) * 185 + Math.sin(t * 4) * 16;
    const ky = 325 + Math.cos(t * 3.5) * 20;
    this.drawGlowOrb(ctx, kx, ky - 85, 135, '34, 197, 94', 0.72);
    this.drawSprite(ctx, this.getCh2Sprite('krasue', Math.floor(t * 4) % 2), kx, ky, 1.25 + p * 0.25, -1, 6, 0);

    // Dramatic wooden shutters slamming shut!
    const cw = p > 0.78 ? ((p - 0.78) / 0.22) * 220 : 28;
    ctx.fillStyle = '#3b1c0b';
    ctx.fillRect(260, 65, cw, 355);
    ctx.fillRect(700 - cw, 65, cw, 355);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 22;
    ctx.strokeRect(255, 60, 450, 365);
  }

  private drawJujubeThorns(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const shake = p > 0.42 && p < 0.65 ? 7 : 0;
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.08, 0, 0, shake);
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 20;
    ctx.strokeRect(255, 60, 450, 355);

    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(265, 385);
    ctx.lineTo(695, 365);
    ctx.moveTo(270, 360);
    ctx.lineTo(690, 390);
    ctx.stroke();

    const bounce = p < 0.45 ? p / 0.45 : Math.max(0, 1 - (p - 0.45) * 2.2);
    const kx = 630 - bounce * 165;
    const ky = 305 + bounce * 65;
    this.drawGlowOrb(ctx, kx, ky - 85, 110, '74, 222, 128', 0.65);
    this.drawSprite(ctx, this.getCh2Sprite('krasue', Math.floor(t * 6) % 2), kx, ky, 1.15, -1, 0, 0);

    if (p >= 0.4 && p <= 0.72) {
      this.drawGlowOrb(ctx, 480, 365, 145, '253, 224, 71', 0.9);
    }
  }

  private drawPaddyShrine(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1.02 + p * 0.08, 0, 0);
    ctx.fillStyle = '#02070d';
    ctx.fillRect(0, 0, w, h);
    this.drawPerspectiveFloor(ctx, w, h, 360, '#064e3b', '#022c22', 9);

    // Shrine silhouette & flashlight god-ray
    ctx.fillStyle = '#78350f';
    ctx.fillRect(465, 225, 30, 145);
    ctx.fillRect(410, 160, 140, 74);
    this.drawGodRay(ctx, 180, 350, 45, 580, 370, 260, '254, 249, 195', 0.25);

    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 230, 465, 1.08, 1, 8, 0.5);
    const rise = Math.min(1, p * 1.45) * 52;
    this.drawGlowOrb(ctx, 480, 405 - rise, 75, '250, 204, 21', 0.65);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(444, 392 - rise, 72, 42);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(464, 405 - rise, 32, 12);
    this.drawGlowOrb(ctx, 735, 155 + Math.sin(t * 4) * 22, 65, '74, 222, 128', 0.7);
  }

  private drawMonkBlessing(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1.0 + p * 0.08, 0, 0);
    ctx.fillStyle = '#1b0e07';
    ctx.fillRect(0, 0, w, h);
    this.drawPerspectiveFloor(ctx, w, h, 360, '#5c3018', '#291206', 10);
    this.drawGlowOrb(ctx, 480, 225, 290, '251, 191, 36', 0.65);

    this.drawSprite(ctx, this.getCh2Sprite('monk', 0), 480, 370, 1.18, 1, 0, 0.5);
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 285, 470, 1.04, 1, 15, 0.5);

    // 3 Holy Artifacts on gilded tray
    ctx.fillStyle = '#facc15';
    ctx.fillRect(405, 365, 150, 14);
    for (let d = 0; d < 14; d++) {
      this.drawGlowOrb(ctx, 360 + (d * 22) % 240, 240 + ((t * 110 + d * 24) % 130), 6, '186, 230, 253', 0.75);
    }
  }

  private drawSaiSinWard(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.06, 0, 0);
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, w, h);
    this.drawPerspectiveFloor(ctx, w, h, 365, '#334155', '#0f172a', 10);

    // Radiant Protective Barrier Arc
    this.drawGlowOrb(ctx, 380, 330, 230, '254, 249, 195', 0.45);
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(380, 380, 210, Math.PI, Math.PI * 2);
    ctx.stroke();

    this.drawSprite(ctx, this.getCh2Sprite('herbal_vendor', 0), 270, 455, 1.02, 1, 0, 0.5);
    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 380, 455, 1.05, 1, 0, 0.5);
    this.drawSprite(ctx, this.getCh2Sprite('fish_vendor', 0), 485, 455, 1.02, -1, 0, 0.5);

    const lunge = 690 + Math.abs(Math.sin(t * 5)) * 95;
    this.drawSprite(ctx, this.getCh2Sprite('krasue', Math.floor(t * 4) % 2), lunge, 315, 1.12, -1, 0, 0);
    this.drawGlowOrb(ctx, 595, 290, 95, '253, 224, 71', 0.85);
  }

  private drawBanishRitual(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    if (p < 0.65) {
      const shake = p > 0.35 ? 6 : 0;
      this.applyCameraTransform(ctx, w, h, 1.04 + p * 0.08, 0, 0, shake);
      ctx.fillStyle = '#04060d';
      ctx.fillRect(0, 0, w, h);
      this.drawPerspectiveFloor(ctx, w, h, 370, '#1e293b', '#090d16', 10);

      // Stone Urn #4
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(440, 260, 80, 110);
      ctx.beginPath();
      ctx.moveTo(430, 260);
      ctx.lineTo(480, 185);
      ctx.lineTo(530, 260);
      ctx.closePath();
      ctx.fill();

      this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 305, 455, 1.08, 1, 0, 0.5);
      this.drawSprite(ctx, this.getCh2Sprite('krasue', 1), 650, 315, 1.18, -1, 0, 0);

      if (p > 0.32) {
        const sp = (p - 0.32) / 0.33;
        this.drawGlowOrb(ctx, 480, 270, 185, '253, 224, 71', 0.9);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(315, 145);
        ctx.lineTo(315 + sp * 350, 145 + sp * 225);
        ctx.stroke();
      }
    } else {
      const sp = (p - 0.65) / 0.35;
      this.applyCameraTransform(ctx, w, h, 1.0 + sp * 0.05, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.6, '#f59e0b');
      sky.addColorStop(1, '#15803d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      this.drawGlowOrb(ctx, 480, 240 - sp * 80, 240, '254, 240, 138', 0.9);
      this.drawPerspectiveFloor(ctx, w, h, 360, '#5c3018', '#291206', 10);

      // Bai-Sri celebration tray & full family reunited!
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(435, 395);
      ctx.lineTo(480, 265);
      ctx.lineTo(525, 395);
      ctx.closePath();
      ctx.fill();
      this.drawSprite(ctx, this.getCh2Sprite('noom', 0), 330, 465, 1.08, 1, 0, 0.5);
      this.drawSprite(ctx, this.getCh2Sprite('mom', 0), 615, 465, 1.05, -1, 0, 0.5);
      this.drawSprite(ctx, this.getCh2Sprite('sister', 0), 680, 470, 0.94, -1, 0, 0.5);
      for (let i = 0; i < 16; i++) {
        this.drawGlowOrb(ctx, 180 + i * 42, 165 + Math.sin(t * 5 + i) * 45, 9, '253, 224, 71', 0.8);
      }
    }
  }

  // ==================== SCHOOL CHAPTER 3 & TRANSPORT CUTSCENES ====================

  private drawSchoolDare(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.06, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.55, '#581c87');
    sky.addColorStop(1, '#ea580c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    this.drawPerspectiveFloor(ctx, w, h, 365, '#334155', '#0f172a', 10);

    // Grand 3-story Thai school facade with glowing crimson Floor 3 Music Room!
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(465, 95, 430, 270);
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(445, 100);
    ctx.lineTo(680, 35);
    ctx.lineTo(915, 100);
    ctx.closePath();
    ctx.fill();
    for (let fl = 0; fl < 3; fl++) {
      for (let wx = 505; wx <= 825; wx += 76) {
        const haunted = fl === 0 && wx >= 655;
        ctx.fillStyle = haunted ? `rgba(239, 68, 68, ${0.45 + Math.sin(t * 7) * 0.3})` : '#0f172a';
        ctx.fillRect(wx, 128 + fl * 75, 44, 48);
      }
    }
    this.drawSprite(ctx, this.getCh3Sprite('peem', 0), 210 + Math.min(1, p * 2) * 35, 465, 1.08, 1, 0, 0.5);
    this.drawSprite(ctx, this.getCh3Sprite('kong_bully', 0), 365, 465, 1.12, -1, 0, 0.5);
    this.drawSprite(ctx, this.getCh3Sprite('student_boy', 0), 430, 470, 1.0, -1, 0, 0.45);
  }

  private drawClassroomLesson(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, _t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.05, 0, 0);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, w, h);
    this.drawPerspectiveFloor(ctx, w, h, 365, '#cbd5e1', '#94a3b8', 10);
    this.drawGodRay(ctx, 180, 0, 140, 420, h, 340, '254, 249, 195', 0.3);

    ctx.fillStyle = '#14532d';
    ctx.fillRect(190, 58, 580, 195);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 12;
    ctx.strokeRect(190, 58, 580, 195);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('คาบนาฏศิลป์ • ห้ามขึ้นชั้น 3 หลัง 18:00 น.', 480, 155);

    this.drawSprite(ctx, this.getCh3Sprite('teacher_somchai', 0), 265, 430, 1.12, 1, 0, 0.45);
    this.drawSprite(ctx, this.getCh3Sprite('peem', 0), 485, 465, 1.05, -1, 0, 0.45);
    this.drawSprite(ctx, this.getCh3Sprite('student_girl', 0), 655, 465, 1.02, -1, 0, 0.45);
  }

  private drawMusicRoomRanat(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const shake = p > 0.45 ? 5 : 0;
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.14, 0, 0, shake);
    ctx.fillStyle = '#07040a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, 125, h);
    ctx.fillRect(w - 125, 0, 125, h);
    this.drawPerspectiveFloor(ctx, w, h, 375, '#451a03', '#1c0a02', 10);

    // Antique Silver Mirror
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(320, 52, 320, 305);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 14;
    ctx.strokeRect(320, 52, 320, 305);

    if (p > 0.34) {
      this.drawGlowOrb(ctx, 480, 190, 175, '220, 38, 38', 0.72);
      this.drawSprite(
        ctx,
        this.getCh3Sprite('dancer_chase', Math.floor(t * 5) % 2),
        480,
        355 - Math.min(1, (p - 0.34) * 1.8) * 35,
        1.15,
        -1,
        0,
        0
      );
    }

    // Wooden Ranat Ek + Peem striking
    ctx.fillStyle = '#78350f';
    ctx.fillRect(340, 360, 280, 58);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(350, 348, 260, 14);
    this.drawSprite(ctx, this.getCh3Sprite('peem', 0), 270, 485, 1.15, 1, p < 0.35 ? Math.sin(p * 18) * 8 : -8, 0.55);
  }

  private drawLockerHide(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, w, h);
    const sx = w * 0.35;
    const sw = w * 0.3;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, 32, sw, h - 64);
    ctx.clip();
    ctx.fillStyle = '#090e1c';
    ctx.fillRect(sx, 32, sw, h - 64);
    this.drawGlowOrb(ctx, sx + sw / 2, 220, 220, '220, 38, 38', 0.32 + Math.sin(t * 14) * 0.14);

    const gx = sx - 55 + p * (sw + 110);
    this.drawSprite(ctx, this.getCh3Sprite('dancer_ghost', Math.floor(t * 3) % 2), gx, 435, 1.45, 1, 0, 0.35);
    ctx.restore();
    ctx.fillStyle = '#0f172a';
    for (let y = 52; y < 140; y += 16) ctx.fillRect(sx + 24, y, sw - 48, 6);
  }

  private drawDancerFinale(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + p * 0.08, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.55, '#b45309');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    this.drawGlowOrb(ctx, 480, 265, 310, '254, 240, 138', 0.85);
    this.drawPerspectiveFloor(ctx, w, h, 380, '#78350f', '#451a03', 10);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(390, 325, 180, 68);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(450, 325);
    ctx.lineTo(510, 325);
    ctx.lineTo(480, 245);
    ctx.closePath();
    ctx.fill();

    this.drawSprite(ctx, this.getCh3Sprite('peem', 0), 310, 470, 1.08, 1, 10, 0.5);
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, 1 - Math.max(0, p - 0.6) * 2.3);
    this.drawSprite(ctx, this.getCh3Sprite('dancer_ghost', 0), 650, 470, 1.15, -1, 14, 0.4);
    ctx.restore();
    for (let i = 0; i < 16; i++) {
      this.drawGlowOrb(ctx, 160 + i * 44, (t * 55 + i * 52) % h, 9, '254, 240, 138', 0.8);
    }
  }

  private drawSongthaewRide(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    this.applyCameraTransform(ctx, w, h, 1 + Math.sin(p * Math.PI) * 0.04, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, 320);
    sky.addColorStop(0, '#0c4a6e');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    this.drawParallaxHills(ctx, w, 310, '#1e3a8a', '#14532d');
    this.drawPerspectiveFloor(ctx, w, h, 390, '#334155', '#0f172a', 10);

    for (let i = 0; i < 6; i++) {
      const rx = ((960 - ((t * 420 + i * 195) % 1080)) + 1080) % 1080 - 60;
      ctx.fillStyle = '#475569';
      ctx.fillRect(rx, 110, 12, 210);
      this.drawPalmTree(ctx, rx + 65, 315, 135, 0);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx, 455, 68, 9);
    }

    const bounce = Math.sin(t * 22) * 3;
    const tx = 210 + Math.sin(p * Math.PI) * 70;
    const ty = 245 + bounce;
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(tx + 335, ty + 48, 125, 96);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(tx + 375, ty + 58, 68, 44);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(tx, ty, 335, 22);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(tx, ty + 72, 335, 72);
    [tx + 12, tx + 165, tx + 322].forEach((px) => {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px, ty + 22, 10, 52);
    });

    this.drawSprite(ctx, this.getCh2Sprite('noom', 0), tx + 105, ty + 145, 0.72, 1, -3, 0);
    this.drawSprite(ctx, this.getCh2Sprite('mom', 0), tx + 225, ty + 145, 0.7, -1, 2, 0);

    [tx + 88, tx + 395].forEach((wx) => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(wx, ty + 150, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(wx, ty + 150, 16, t * 18, t * 18 + Math.PI * 1.3);
      ctx.stroke();
    });
  }
}
