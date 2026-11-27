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
  school_dare: {
    title: '🎬 คัทซีน — คำท้าสุดหลอนหน้าโรงเรียนมัธยมจันทรารัตน์',
    durationMs: 4500,
    captions: [
      'หน้าซุ้มประตูโรงเรียนยามเย็น ไอ้ก้องกับพวกหัวโจกยืนขวางทางภีมไว้...',
      '"ถ้ามึงอยากเข้ากลุ่มพวกกูจริง คืนนี้หลังสองทุ่มกล้าขึ้นไปตีระนาดเอกหน้ากระจกห้องดนตรีไทยชั้น 3 ไหมล่ะ?!"',
      'แสงสีแดงวูบวาบขึ้นตรงหน้าต่างชั้น 3 ราวกับมีเงาใครกำลังร่ายรำรอคอยอยู่ด้านบน...',
    ],
  },
  classroom_lesson: {
    title: '🎬 คัทซีน — บรรยากาศคาบเรียนห้อง ม.5/2 ยามกลางวัน',
    durationMs: 4200,
    captions: [
      'เสียงออดเข้าเรียนดังกังวาน คุณครูสมชายยืนสอนหน้ากระดานดำท่ามกลางเพื่อนร่วมห้อง...',
      'ระหว่างจดเลกเชอร์ เพื่อนข้างโต๊ะกระซิบเล่าตำนานนางรำคอหักเมื่อ 15 ปีก่อน...',
      'แถมยังแอบส่งกระดาษโน้ตปริศนาใต้โต๊ะเกี่ยวกับ "คราบขี้ผึ้งลื่นบนเวทีนาฏศิลป์"!',
    ],
  },
  music_room_ranat: {
    title: '🎬 คัทซีน — ตีระนาดเอกหน้ากระจก... ผีนางรำปรากฏกาย!!',
    durationMs: 4900,
    captions: [
      'ภีมรวบรวมความกล้ายกไม้ระนาดขึ้นตีลงบนผืนระนาดเอก 3 ครั้งท่ามกลางความมืด...',
      'แก๊ง! แกร๊ก! กระจกเงาบานใหญ่สั่นสะเทือน พร้อมเงาหญิงสาวสวมชฎาทอง-สไบเปื้อนเลือดลอยขึ้นด้านหลัง!!',
      'เสียงระนาดรัวเองโดยไร้คนตี ผีนางรำเอียงคอหักจ้องผ่านกระจกแล้วพุ่งออกมาทันที!!',
    ],
  },
  locker_hide: {
    title: '🎬 คัทซีน — กลั้นหายใจซ่อนตัวในความมืดขณะผีนางรำผ่านไป',
    durationMs: 4300,
    captions: [
      'ภีมรีบมุดเข้าไปซ่อนตัวแนบสนิท ปิดช่องแคบเหลือเพียงรอยแง้มมองทางเดินมืด...',
      'ติ๊ง... ต่อง... เสียงกำไลข้อเท้าทองและปลายสไบสีเลือดลอยเฉียดผ่านไปช้าๆ!!',
      'วิญญาณนางรำหยุดชะงักสูดดมกลิ่นครู่หนึ่ง ก่อนลอยลับหายไปปลายระเบียงทางเดิน...',
    ],
  },
  dancer_finale: {
    title: '🎬 คัทซีนปิดฉาก — คืนชฎาทองโบราณ & พิพากษาความจริง',
    durationMs: 5400,
    captions: [
      'ภีมวาง "ชฎาทองโบราณ" คืนบนแท่นบูชาหน้ากระจก ท่ามกลางแสงไฟสีทองอันเจิดจ้า!',
      'วิญญาณพี่ดาวประกายสวมชฎา ร่ายรำอย่างสง่างามอ่อนช้อยเป็นครั้งสุดท้ายทั้งน้ำตา...',
      'รุ่งเช้าตำรวจควบคุมตัวครูวิไล และโรงเรียนมัธยมจันทรารัตน์ก็กลับคืนสู่ความสงบสุขตลอดกาล!',
    ],
  },
  songthaew_ride: {
    title: '🎬 คัทซีน — นั่งรถสองแถวออกเดินทางข้ามโซน',
    durationMs: 3600,
    captions: [
      'ขึ้นมานั่งท้ายรถสองแถวไม้หลังคาสังกะสี จับราวเหล็กให้แน่น!',
      'ล้อรถหมุนวิ่งฉิวผ่านทิวต้นไม้ เสาไฟฟ้า และท้องนา/ถนนกว้างใหญ่...',
      'เอี๊ยด~ คนขับจอดเทียบป้ายปลายทางอย่างปลอดภัยเรียบร้อย!',
    ],
  },
  homecoming: {
    title: '🎬 คัทซีน — กลับคืนสู่เรือนไม้บ้านทุ่งอีสาน',
    durationMs: 4400,
    captions: [
      'แสงแดดยามเย็นอาบทาทุ่งนาอีสานและเรือนไม้ยกสูงของบ้านเกิด...',
      'หนุ่มเดินยิ้มกว้างเข้าไปสวมกอดแม่คำกับน้องแก้วให้หายคิดถึงตลอดสี่ปี',
      'เสียงหัวเราะและลมพัดเย็นใต้ถุนเรือนทำให้หัวใจกลับมาพองโตอีกครั้ง',
    ],
  },
  family_dinner: {
    title: '🎬 คัทซีน — ล้อมวงข้าวแลงใต้แสงตะเกียง',
    durationMs: 4200,
    captions: [
      'กระติบข้าวเหนียวร้อนๆ วางกลางเสื่อกก พร้อมต้มยำปลาช่อนและหมูย่างหอมกรุ่น...',
      'แม่คำ น้องแก้ว และหนุ่มล้อมวงจกข้าวเหนียวพูดคุยกันใต้แสงตะเกียง',
      'ค่ำคืนแรกในบ้านทุ่งช่างอบอุ่นใจ... ก่อนที่เงามืดคืนต่อไปกำลังจะคืบคลานเข้ามา',
    ],
  },
  cast_net_fishing: {
    title: '🎬 คัทซีน — ชาวบ้านหว่านแห & ตกปลาช่อนหนองน้ำ',
    durationMs: 4600,
    captions: [
      'ริมท่าน้ำหนองน้ำบ้านทุ่ง ลุงชาวบ้านรวบชายแหเตรียมเหวี่ยงลงกลางดงบัว...',
      'วูบ!! ผืนแหถูกสะบัดกางบานสะพรั่งกลางอากาศก่อนตกลงผิวน้ำกระจายเป็นวงกว้าง!',
      'ได้ "ปลาช่อนนา" ตัวเบ้อเริ่มดิ้นกระแด่วขึ้นมาในผืนแหเสียงเฮดังลั่นท่าน้ำ!',
    ],
  },
  pray_buddha: {
    title: '🎬 คัทซีน — กราบไหว้พระประธานในพระอุโบสถวัดป่า',
    durationMs: 4600,
    captions: [
      'ภายในพระอุโบสถอันเงียบสงบ ควันธูปลอยอ้อยอิ่งขึ้นสู่แสงเทียนเบื้องหน้าพระประธาน...',
      'หนุ่มคุกเข่าพนมมือ ก้มลงกราบเบญจางคประดิษฐ์สามครั้งด้วยจิตใจอันนอบน้อม',
      'รัศมีสีทองอันอบอุ่นแผ่ซ่านคุ้มครองกายใจให้ร่มเย็นและมีสติสมบูรณ์',
    ],
  },
  morning_alms: {
    title: '🎬 คัทซีน — ใส่บาตรหลวงพี่ยามรุ่งสาง',
    durationMs: 4200,
    captions: [
      'ไอหมอกยามเช้าลอยเรี่ยถนนดินแดงหน้าหมู่บ้าน เสียงนกร้องรับอรุณ...',
      'หนุ่มประนมมือตักข้าวเหนียวร้อนใส่ลงในบาตรของหลวงพี่อย่างสำรวม',
      'หลวงพี่ให้พร "อายุ วัณโณ สุขัง พะลัง" เสริมสิริมงคลรับวันใหม่',
    ],
  },
  somtam_feast: {
    title: '🎬 คัทซีน — ส้มตำครกไม้ & ไก่ย่างแม่ลำไย',
    durationMs: 4000,
    captions: [
      'โป๊ก! โป๊ก! เสียงสากกระทบครกไม้แม่ลำไยดังสะท้านกลางตลาดสดบ้านทุ่ง...',
      'มะละกอ มะเขือเทศ พริกแดง และมะนาวคลุกเคล้าหอมน้ำปลาร้ากับไก่ย่างเตาถ่าน',
      'กินข้าวเหนียวจิ้มไก่ย่างกับส้มตำร้อนๆ อิ่มท้องแถมสติกลับมาเต็มเปี่ยม!',
    ],
  },
  temple_fair: {
    title: '🎬 คัทซีน — เที่ยวงานวัดป่า ชิงช้าสวรรค์ & ปาลูกโป่ง',
    durationMs: 4400,
    captions: [
      'แสงไฟหลากสีจากชิงช้าสวรรค์ยักษ์หมุนส่องสว่างทั่วลานวัดป่าบ้านทุ่ง...',
      'เสียงเพลงหมอลำซิ่งครึกครื้น ป๊อก! ป๊อก! ปาลูกโป่งแตก 3 ลูกรวด!',
      'บรรยากาศงานบุญบ้านเราคึกคักสุดขีด... ก่อนที่ข่าวลือจะทำให้ทุกอย่างเปลี่ยนไป',
    ],
  },
  bangfai_festival: {
    title: '🎬 คัทซีน — ประเพณีบุญบั้งไฟพญานาคบ้านทุ่ง',
    durationMs: 4300,
    captions: [
      'บั้งไฟลายพญานาคสีทองประดับกนกตระหง่านบนฐานปล่อยกลางลานหมู่บ้าน...',
      'ฟู่!! เปลวไฟพวยพุ่งส่งบั้งไฟทะยานแหวกท้องฟ้ายามสนธยาขึ้นสูงลิ่ว!',
      'ประกายดอกไม้ไฟแตกบานสว่างไสว สร้างความสามัคคีให้พี่น้องชาวอีสาน',
    ],
  },
  takian_shrine: {
    title: '🎬 คัทซีน — ศาลเจ้าแม่ตะเคียนคู่ผูกผ้าเจ็ดสี',
    durationMs: 4300,
    captions: [
      'ใต้ร่มเงาต้นตะเคียนยักษ์คู่ปากหมู่บ้าน กลิ่นดอกมะลิเย็นยะเยือกลอยมาตามสายลม...',
      'แพรผ้าเจ็ดสีสะบัดพลิ้วไหวราวกับมีมือล่องหนรำอวยพรและเตือนภัยล่วงหน้า!',
      'แสงสีมรกตทองส่องลงที่ผ้าเจ็ดสี มอบพลังคุ้มครองแก่ลูกบ้านผู้ศรัทธา',
    ],
  },
  krasue_window: {
    title: '🎬 คัทซีน — ผีกระสือลอยบุกหน้าต่างเรือนไม้กลางดึก!',
    durationMs: 4800,
    captions: [
      'กลางดึกสงัด... ลมหอบเย็นเฉียบกระแทกบานหน้าต่างไม้เปิดผางออก!',
      'กรี๊ดด!! ดวงไฟสีเขียวแดงลอยพริ้วเข้ามาพร้อมศีรษะหญิงแก่และตับไตไส้พุงเรืองแสง!!',
      'หนุ่มรีบผลักน้องแก้วหลบและกระชากหน้าต่างปิดทันเฉียดฉิว เสียงหมาหอนเกรียวทั้งหมู่บ้าน!',
    ],
  },
  jujube_thorns: {
    title: '🎬 คัทซีน — หนามพุทราขวางหน้าต่าง สยบกระสือกรีดร้องหนี!',
    durationMs: 4400,
    captions: [
      'กิ่งหนามพุทราสดถูกนำมาขัดขวางเรียงแน่นเต็มขอบหน้าต่างเรือนไม้...',
      'ผีกระสือลอยโฉบกลับมา หวังคายน้ำลายสืบทายาท — แต่กลับเกี่ยวเข้ากับหนามคม!',
      'เปรี้ยง! ประกายไฟอาคมแตกกระจาย กระสือกรีดร้องโหยหวนบินกระเจิงหายไปในทุ่งมืด!',
    ],
  },
  paddy_shrine_dug: {
    title: '🎬 คัทซีน — ขุดเชี่ยนหมากเงินโบราณใต้ศาลปู่ตา',
    durationMs: 4400,
    captions: [
      'กลางดึกหลังสองทุ่มครึ่ง ลำแสงไฟฉายส่องลอดหมอกทึบมายังศาลปู่ตาไม้เก่า...',
      'หนุ่มขุดใต้ฐานอิฐ จนพบ "เชี่ยนหมากเงินโบราณ" สลักรายชื่อทายาทคนต่อไปด้วยเลือด!',
      'พริบตานั้น ลมพัดหวีดหวิวพร้อมดวงไฟสีเขียวพุ่งวาบขึ้นเหนือยอดตาลทางด้านขวา!',
    ],
  },
  monk_blessing: {
    title: '🎬 คัทซีน — หลวงพี่ปลุกเสกธูป น้ำมนต์ & มีดหมออาคม',
    durationMs: 4500,
    captions: [
      'แสงเทียนชัยส่องสว่างกลางกุฏิวัดป่า หลวงพี่สวดพระคาถาถอนมนตร์ดำโบราณ...',
      'หยดน้ำมนต์ศักดิ์สิทธิ์พรมลงบนเชี่ยนหมากเงิน ธูปสะกด และมีดหมอลงอาคมจนเรืองแสง!',
      'ของขลังทั้งสามพร้อมแล้วสำหรับการเผด็จศึกครั้งสุดท้าย ณ ป่าช้าโกศหมายเลข 4',
    ],
  },
  saisin_ward: {
    title: '🎬 คัทซีน — วงสายสิญจน์ลานวัด สาดแสงขวางวิญญาณร้าย!',
    durationMs: 4300,
    captions: [
      'เสาไม้ไผ่ 8 ทิศโยงสายสิญจน์สีขาวเชื่อมต่อมาจากพระประธานในอุโบสถ...',
      'ทันทีที่ดวงไฟกระสือพุ่งเข้าใกล้ เส้นสายสิญจน์ก็เปล่งแสงวาบราวสายฟ้าขวางกั้น!',
      'ชาวบ้านทุกคนในวงสายสิญจน์ปลอดภัยจากการไล่ล่าของผีกระสืออย่างสิ้นเชิง',
    ],
  },
  banish_ritual: {
    title: '🎬 คัทซีนปิดตำนาน — พิธีตัดขาดทายาทกระสือ & บายศรีสู่ขวัญ',
    durationMs: 5600,
    captions: [
      'หน้าโกศบรรจุอัฐิหมายเลข 4 — หนุ่มปักธูปสะกดและสาดน้ำมนต์แผดเผาผ้าซิ่นอาคม!',
      'ฉับ!! มีดหมอฟันสะบั้นเชี่ยนหมากเงินและสายใยอาคมขาดสะบั้น เสียงกรีดร้องสลายไปกับแสงอรุณ!',
      'รุ่งเช้าหมู่บ้านกลับมามีชีวิตชีวา รถแห่และพานบายศรีสู่ขวัญผูกแขนต้อนรับความสงบสุขตลอดกาล!',
    ],
  },
};

export class CutscenePlayer {
  private overlay: HTMLElement | null = null;
  private rafId = 0;
  private playing = false;
  private skipHandler: (() => void) | null = null;

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
        <canvas id="cutscene-canvas" width="720" height="405"></canvas>
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
      window.removeEventListener('keydown', keyHandler);
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

  private drawFrame(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    id: IsaanCutsceneId,
    p: number,
    t: number
  ): void {
    ctx.clearRect(0, 0, w, h);
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
    // Subtle cinema vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, w * 0.65);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  private drawPerson(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    shirt: string,
    pants: string,
    scale = 1,
    bowDeg = 0,
    kneel = false
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate((bowDeg * Math.PI) / 180);
    // Legs
    ctx.fillStyle = pants;
    if (kneel) {
      ctx.fillRect(-16, -12, 32, 12);
    } else {
      ctx.fillRect(-10, -40, 8, 40);
      ctx.fillRect(2, -40, 8, 40);
    }
    // Torso
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(-14, kneel ? -52 : -82, 28, 42, 6);
    ctx.fill();
    // Head
    ctx.fillStyle = '#e0ac82';
    ctx.beginPath();
    ctx.arc(0, kneel ? -66 : -96, 13, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(0, kneel ? -74 : -104, 14, 7, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawHomecoming(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#451a3e');
    sky.addColorStop(0.55, '#d97706');
    sky.addColorStop(1, '#14532d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Setting golden sun & clouds
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.beginPath();
    ctx.arc(w * 0.22, h * 0.35 + p * 20, 46, 0, Math.PI * 2);
    ctx.fill();

    // Distant rice field & ground
    ctx.fillStyle = '#26532b';
    ctx.fillRect(0, h * 0.65, w, h * 0.35);
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, h * 0.78, w, h * 0.22);

    // Grand Stilt House silhouette
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(420, 115, 220, 105);
    ctx.fillStyle = '#5c341d';
    ctx.beginPath();
    ctx.moveTo(395, 120);
    ctx.lineTo(530, 55);
    ctx.lineTo(665, 120);
    ctx.closePath();
    ctx.fill();
    // House stilts & warm glowing windows
    ctx.fillStyle = '#29170d';
    [435, 495, 565, 625].forEach((sx) => ctx.fillRect(sx, 220, 12, 95));
    ctx.fillStyle = '#fde047';
    ctx.fillRect(465, 142, 42, 42);
    ctx.fillRect(555, 142, 42, 42);

    // Family hugging! Noom walks from left to right to hug Mom & Sister
    const noomX = 160 + Math.min(1, p * 1.45) * 195;
    this.drawPerson(ctx, noomX, 330, '#2563eb', '#1e293b', 1.15);
    this.drawPerson(ctx, 385, 330, '#db2777', '#3b0764', 1.1);
    this.drawPerson(ctx, 418, 332, '#f59e0b', '#1e3a8a', 0.92);

    if (p > 0.55) {
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgba(253, 224, 71, ${0.4 + Math.sin(t * 5 + i) * 0.35})`;
        ctx.beginPath();
        ctx.arc(360 + Math.sin(t * 2 + i * 2) * 45, 210 - ((t * 45 + i * 20) % 90), 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawFamilyDinner(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#1c1009';
    ctx.fillRect(0, 0, w, h);
    // Warm teak wood planks & oil lamp aura
    const aura = ctx.createRadialGradient(w / 2, h * 0.45, 15, w / 2, h * 0.48, 280 + Math.sin(t * 6) * 10);
    aura.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
    aura.addColorStop(0.5, 'rgba(180, 83, 9, 0.25)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    // Bamboo mat (เสื่อกก)
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.ellipse(w / 2, 315, 215, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Seated family silhouettes
    this.drawPerson(ctx, 215, 305, '#2563eb', '#1e293b', 1.15, 5, true);
    this.drawPerson(ctx, 505, 305, '#db2777', '#3b0764', 1.1, -5, true);
    this.drawPerson(ctx, 360, 275, '#f59e0b', '#1e3a8a', 0.95, 0, true);

    // Thai Khan Tok tray, Kratib sticky rice & steaming curry bowl
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(360, 310, 74, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(318, 284, 28, 24); // กระติบข้าวเหนียว
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(378, 302, 20, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(363, 297, 30, 6);

    // Rising steam
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.18 + Math.sin(t * 3 + i) * 0.1})`;
      ctx.beginPath();
      ctx.arc(365 + Math.sin(t * 2 + i) * 14, 280 - ((t * 42 + i * 18 + p * 30) % 75), 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCastNetFishing(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    // Twilight Isaan sky + lotus pond
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.56);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.65, '#3b82f6');
    sky.addColorStop(1, '#fb923c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.56);

    const water = ctx.createLinearGradient(0, h * 0.54, 0, h);
    water.addColorStop(0, '#0e7490');
    water.addColorStop(1, '#083344');
    ctx.fillStyle = water;
    ctx.fillRect(0, h * 0.54, w, h * 0.46);

    // Green banks + blooming lotus pads
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, h * 0.49, 210, 42);
    [450, 540, 620].forEach((lx, idx) => {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(lx, 315 + (idx % 2) * 28, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(lx + 6, 309 + (idx % 2) * 28, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Wooden fishing pier on left
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(60, 225, 165, 16);
    ctx.fillRect(95, 240, 14, 85);
    ctx.fillRect(195, 240, 14, 85);

    // Villager throwing cast net!
    const windup = p < 0.25 ? -18 * (p / 0.25) : Math.max(0, 22 * (1 - (p - 0.25) * 3));
    this.drawPerson(ctx, 175, 225, '#0284c7', '#1e293b', 1.15, windup);

    // Expanding flying Cast Net (แห)
    if (p < 0.62) {
      const flyP = Math.max(0, (p - 0.15) / 0.47);
      const netX = 205 + flyP * 245;
      const netY = 145 - Math.sin(flyP * Math.PI) * 85 + flyP * 145;
      const spread = 14 + flyP * 68;
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(netX, netY, spread, spread * 0.48, -0.25 + flyP * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      for (let r = -spread * 0.7; r <= spread * 0.7; r += 16) {
        ctx.beginPath();
        ctx.moveTo(netX, netY - 12);
        ctx.lineTo(netX + r, netY + spread * 0.35);
        ctx.stroke();
      }
    }

    // Water splash & Silver Snakehead fish caught in the net!
    if (p >= 0.58) {
      const sp = (p - 0.58) / 0.42;
      ctx.strokeStyle = `rgba(186, 230, 253, ${1 - sp * 0.7})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(455, 298, 35 + sp * 95, 12 + sp * 28, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Big leaping snakehead fish!
      const fishY = 290 - Math.sin(Math.min(1, sp * 1.4) * Math.PI) * 85;
      const fishX = 455 - Math.max(0, sp - 0.4) * 165;
      ctx.save();
      ctx.translate(fishX, fishY);
      ctx.rotate(Math.sin(t * 14) * 0.22);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(-42, -10);
      ctx.lineTo(-42, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPrayBuddha(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    // Rich warm Ubosot sanctuary interior
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2a0a0a');
    bg.addColorStop(1, '#451212');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Temple floor
    ctx.fillStyle = '#5c2618';
    ctx.fillRect(0, 305, w, 100);

    // Golden Aura behind Phra Prathan Buddha
    const glow = ctx.createRadialGradient(360, 148, 12, 360, 148, 165 + Math.sin(t * 3) * 10);
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
    glow.addColorStop(0.5, 'rgba(217, 119, 6, 0.35)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Golden Pedestal & Ornate Golden Buddha Statue
    ctx.fillStyle = '#b45309';
    ctx.fillRect(265, 245, 190, 60);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(280, 232, 160, 16);
    // Seated Buddha silhouette
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(360, 214, 56, 22, 0, 0, Math.PI * 2); // crossed legs
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(324, 210);
    ctx.lineTo(396, 210);
    ctx.lineTo(384, 145);
    ctx.lineTo(336, 145);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(360, 120, 22, 0, Math.PI * 2); // head
    ctx.fill();
    // Ushnisha top flame
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(352, 98);
    ctx.lineTo(360, 74);
    ctx.lineTo(368, 98);
    ctx.closePath();
    ctx.fill();

    // Glowing candles & incense burner
    [295, 425].forEach((cx) => {
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(cx - 4, 205, 8, 28);
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(cx, 199 + Math.sin(t * 14 + cx) * 1.5, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    // Rising curling incense smoke trails
    for (let s = 0; s < 5; s++) {
      ctx.fillStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.beginPath();
      ctx.arc(360 + Math.sin(t * 2 + s) * 18, 225 - ((t * 36 + s * 22) % 105), 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating golden lotus petals
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = 'rgba(253, 230, 138, 0.65)';
      ctx.beginPath();
      ctx.ellipse(120 + i * 56, (t * 38 + i * 47) % h, 5, 2.5, t + i, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player kneeling & performing rhythmic 3-bow Thai prostration (กราบพระ 3 จังหวะ!)
    const bowCycle = Math.sin(p * Math.PI * 3);
    const bowDeg = bowCycle > 0 ? bowCycle * 52 : 0;
    this.drawPerson(ctx, 360, 355, '#f8fafc', '#1e293b', 1.25, bowDeg, true);
  }

  private drawMorningAlms(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    sky.addColorStop(0, '#312e81');
    sky.addColorStop(0.5, '#f472b6');
    sky.addColorStop(1, '#fde68a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 255, w, 65);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 310, w, 95);

    // Monk in saffron robe with glowing brass Alms Bowl
    const monkX = 435;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(monkX - 20, 210, 40, 115, 8);
    ctx.fill();
    ctx.fillStyle = '#d99b66';
    ctx.beginPath();
    ctx.arc(monkX, 192, 16, 0, Math.PI * 2);
    ctx.fill();
    // Brass bowl
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(monkX - 24, 245, 16, 0, Math.PI * 2);
    ctx.fill();

    // Noom kneeling respectfully with ladle of warm rice rising to bowl!
    this.drawPerson(ctx, 315, 345, '#f8fafc', '#1e293b', 1.15, 15, true);
    ctx.fillStyle = '#fef9c3';
    const riceY = 265 - Math.abs(Math.sin(p * Math.PI * 2)) * 28;
    ctx.beginPath();
    ctx.arc(368 + Math.sin(p * Math.PI) * 32, riceY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Golden morning mist & merit sparkles
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(254, 240, 138, ${0.45 + Math.sin(t * 4 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(260 + i * 36, 175 + Math.cos(t * 3 + i) * 24, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSomtamFeast(ctx: CanvasRenderingContext2D, w: number, h: number, _p: number, t: number): void {
    ctx.fillStyle = '#29150e';
    ctx.fillRect(0, 0, w, h);
    // Warm awning stripes
    for (let x = 0; x < w; x += 48) {
      ctx.fillStyle = (x / 48) % 2 === 0 ? '#dc2626' : '#fef3c7';
      ctx.fillRect(x, 0, 48, 52);
    }
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 285, w, 120);

    // Wooden Somtam mortar & rhythmic pounding pestle!
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(295, 225);
    ctx.lineTo(395, 225);
    ctx.lineTo(375, 295);
    ctx.lineTo(315, 295);
    ctx.closePath();
    ctx.fill();
    const pound = Math.abs(Math.sin(t * 11));
    ctx.save();
    ctx.translate(345, 225 - pound * 42);
    ctx.rotate(-0.2 + pound * 0.25);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-8, -75, 16, 85);
    ctx.restore();

    // Popping papaya shreds & chilies
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#fde047' : '#4ade80';
      ctx.fillRect(320 + Math.sin(t * 9 + i) * 44, 210 - ((t * 85 + i * 25) % 65), 8, 5);
    }
    // Glowing charcoal grill & golden chicken skewers on right
    ctx.fillStyle = '#334155';
    ctx.fillRect(480, 235, 140, 60);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(492, 230, 116, 10);
    [515, 550, 585].forEach((gx) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(gx, 218, 12, 7, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawTempleFair(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#070b1a';
    ctx.fillRect(0, 0, w, h);
    // Spinning neon Ferris Wheel!
    const fx = 500;
    const fy = 175;
    const R = 115;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(t * 0.65);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.stroke();
      ctx.fillStyle = ['#ef4444', '#38bdf8', '#4ade80', '#f472b6'][i % 4];
      ctx.fillRect(Math.cos(a) * R - 11, Math.sin(a) * R - 11, 22, 22);
    }
    ctx.restore();
    // Ferris wheel legs & Balloon dart stall on left
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx - 75, 345);
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 75, 345);
    ctx.stroke();

    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(75, 165, 220, 170);
    for (let b = 0; b < 6; b++) {
      if (p < 0.35 + b * 0.08) {
        ctx.fillStyle = ['#ef4444', '#facc15', '#38bdf8', '#22c55e', '#f472b6', '#a855f7'][b];
        ctx.beginPath();
        ctx.arc(115 + (b % 3) * 65, 210 + Math.floor(b / 3) * 52, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Twinkling festive bunting
    for (let x = 20; x < w; x += 40) {
      ctx.fillStyle = ['#f43f5e', '#facc15', '#38bdf8', '#4ade80'][Math.floor(x / 40) % 4];
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x + 24, 22);
      ctx.lineTo(x + 12, 46);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawBangFai(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#090d1f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 315, w, 90);
    // Bamboo launch tower
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(310, 325);
    ctx.lineTo(345, 115);
    ctx.moveTo(410, 325);
    ctx.lineTo(375, 115);
    ctx.stroke();

    // Launching Naga Rocket shooting up!
    const launchP = Math.max(0, (p - 0.18) / 0.82);
    const ry = 275 - launchP * 320;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(352, ry - 60, 16, 65);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(350, ry - 60);
    ctx.lineTo(360, ry - 92);
    ctx.lineTo(370, ry - 60);
    ctx.closePath();
    ctx.fill();

    // Fiery exhaust sparks & fireworks!
    for (let s = 0; s < 16; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#fb923c' : '#fde047';
      ctx.beginPath();
      ctx.arc(360 + Math.sin(t * 25 + s) * 18, ry + 15 + s * 9, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p > 0.65) {
      const fp = (p - 0.65) / 0.35;
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        ctx.fillStyle = k % 2 === 0 ? '#facc15' : '#f472b6';
        ctx.beginPath();
        ctx.arc(360 + Math.cos(a) * fp * 115, 95 + Math.sin(a) * fp * 95, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawTakianShrine(ctx: CanvasRenderingContext2D, w: number, h: number, _p: number, t: number): void {
    ctx.fillStyle = '#06120e';
    ctx.fillRect(0, 0, w, h);
    // Ancient gnarled Takian tree trunk
    ctx.fillStyle = '#291c14';
    ctx.fillRect(285, 25, 150, 350);
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.ellipse(360, 55, 240, 85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Undulating 7-color sacred silk sashes!
    const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#6366f1', '#ec4899'];
    cols.forEach((col, i) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(295 + i * 20, 145);
      ctx.quadraticCurveTo(280 + i * 20 + Math.sin(t * 3 + i) * 28, 225, 295 + i * 20 - Math.sin(t * 4 + i) * 32, 315);
      ctx.stroke();
    });

    // Emerald-gold spirit mist
    const aura = ctx.createRadialGradient(360, 210, 10, 360, 210, 175);
    aura.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);
  }

  private drawKrasueWindow(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, w, h);
    // Night sky outside window
    ctx.fillStyle = '#0c1b29';
    ctx.fillRect(210, 55, 300, 260);

    // Floating terrifying Krasue head & glowing emerald-red organs!
    const kx = 490 - Math.min(1, p * 1.25) * 145 + Math.sin(t * 4) * 14;
    const ky = 175 + Math.cos(t * 3.5) * 18;
    const glow = ctx.createRadialGradient(kx, ky + 35, 8, kx, ky + 35, 110);
    glow.addColorStop(0, 'rgba(74, 222, 128, 0.85)');
    glow.addColorStop(0.5, 'rgba(220, 38, 38, 0.35)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(190, 50, 340, 280);

    // Hanging organs pulsing
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    for (let o = -16; o <= 16; o += 10) {
      ctx.beginPath();
      ctx.moveTo(kx + o, ky + 15);
      ctx.quadraticCurveTo(kx + o + Math.sin(t * 6 + o) * 14, ky + 65, kx + o * 0.7, ky + 108);
      ctx.stroke();
    }
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(kx, ky + 36, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pale floating head & glowing eyes
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(kx, ky, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(kx - 26, ky - 24, 52, 16);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(kx - 10, ky - 4, 5, 5);
    ctx.fillRect(kx + 4, ky - 4, 5, 5);

    // Wooden window slats closing dramatically at end!
    const closeW = p > 0.78 ? ((p - 0.78) / 0.22) * 150 : 18;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(210, 55, closeW, 260);
    ctx.fillRect(510 - closeW, 55, closeW, 260);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 18;
    ctx.strokeRect(205, 50, 310, 270);
  }

  private drawJujubeThorns(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 16;
    ctx.strokeRect(210, 55, 300, 255);

    // Spiky Jujube thorns across the window!
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(215, 290);
    ctx.lineTo(505, 275);
    ctx.moveTo(220, 270);
    ctx.lineTo(500, 295);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    for (let sx = 235; sx <= 485; sx += 26) {
      ctx.beginPath();
      ctx.moveTo(sx, 285);
      ctx.lineTo(sx - 6, 258);
      ctx.lineTo(sx + 6, 285);
      ctx.fill();
    }

    // Krasue swooping in and bouncing back in sparks!
    const bounce = p < 0.45 ? p / 0.45 : Math.max(0, 1 - (p - 0.45) * 2.2);
    const kx = 470 - bounce * 115;
    const ky = 175 + bounce * 55;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(kx, ky, 26, 0, Math.PI * 2);
    ctx.fill();

    if (p >= 0.4 && p <= 0.72) {
      for (let s = 0; s < 12; s++) {
        const a = (s / 12) * Math.PI * 2;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(360 + Math.cos(a + t) * 55, 260 + Math.sin(a + t) * 45, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawPaddyShrine(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#03080d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 275, w, 130);

    // Ancient wooden Spirit Shrine (ศาลปู่ตา)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(348, 175, 24, 110);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(305, 125, 110, 58);
    ctx.beginPath();
    ctx.moveTo(290, 128);
    ctx.lineTo(360, 82);
    ctx.lineTo(430, 128);
    ctx.closePath();
    ctx.fill();

    // Sweeping flashlight cone
    ctx.fillStyle = 'rgba(254, 249, 195, 0.22)';
    ctx.beginPath();
    ctx.moveTo(95, 255);
    ctx.lineTo(435, 195);
    ctx.lineTo(435, 335);
    ctx.closePath();
    ctx.fill();

    // Silver Betel Box rising from excavated soil!
    const rise = Math.min(1, p * 1.45) * 42;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(334, 305 - rise, 52, 32);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(348, 315 - rise, 24, 10);

    // Swirling green wisps
    ctx.fillStyle = `rgba(74, 222, 128, ${0.4 + Math.sin(t * 7) * 0.25})`;
    ctx.beginPath();
    ctx.arc(545, 115 + Math.sin(t * 4) * 18, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMonkBlessing(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#1c1009';
    ctx.fillRect(0, 0, w, h);
    const halo = ctx.createRadialGradient(360, 170, 20, 360, 170, 220);
    halo.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // Monk seated in saffron robe
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(310, 165, 100, 120, 24);
    ctx.fill();
    ctx.fillStyle = '#d99b66';
    ctx.beginPath();
    ctx.arc(360, 140, 22, 0, Math.PI * 2);
    ctx.fill();

    // 3 Sacred Artifacts on tray + sparkling holy water drops!
    ctx.fillStyle = '#78350f';
    ctx.fillRect(250, 288, 220, 18);
    // Silver incense, water vessel & knife
    ctx.fillStyle = '#facc15';
    ctx.fillRect(285, 255, 12, 32);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(348, 250, 24, 36);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(410, 264, 42, 8);

    // Expanding sacred aura rings & falling holy water sparkles
    for (let r = 0; r < 3; r++) {
      const rr = ((p * 2 + r * 0.33) % 1) * 145;
      ctx.strokeStyle = `rgba(253, 224, 71, ${1 - rr / 145})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(360, 250, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let d = 0; d < 12; d++) {
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(270 + (d * 18) % 190, 180 + ((t * 90 + d * 25) % 105), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSaiSinWard(ctx: CanvasRenderingContext2D, w: number, h: number, _p: number, t: number): void {
    ctx.fillStyle = '#070b17';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 285, w, 120);

    // Bright protective Sai-Sin Barrier Dome!
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(285, 285, 155, Math.PI, Math.PI * 2);
    ctx.stroke();
    const dome = ctx.createRadialGradient(285, 250, 10, 285, 250, 165);
    dome.addColorStop(0, 'rgba(254, 249, 195, 0.35)');
    dome.addColorStop(1, 'rgba(254, 249, 195, 0)');
    ctx.fillStyle = dome;
    ctx.fillRect(100, 110, 380, 180);

    // Villagers standing safe inside
    this.drawPerson(ctx, 225, 285, '#e2e8f0', '#1e293b', 0.95);
    this.drawPerson(ctx, 285, 285, '#2563eb', '#0f172a', 1.0);
    this.drawPerson(ctx, 340, 285, '#f59e0b', '#334155', 0.95);

    // Krasue shrieking & bouncing off the glowing thread wall on right!
    const lunge = 465 + Math.abs(Math.sin(t * 5)) * 75;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(lunge, 195, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(430, 180);
    ctx.lineTo(455, 200);
    ctx.lineTo(430, 225);
    ctx.stroke();
  }

  private drawBanishRitual(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    // Phase 1 (<0.65): Dark cemetery showdown | Phase 2 (>=0.65): Sunrise & Bai-Sri Celebration!
    if (p < 0.65) {
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 290, w, 115);
      // Bone Urn #4 in center
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(330, 210, 60, 80);
      ctx.beginPath();
      ctx.moveTo(322, 210);
      ctx.lineTo(360, 155);
      ctx.lineTo(398, 210);
      ctx.closePath();
      ctx.fill();

      // Splash of holy water + golden ritual slash!
      const slash = Math.max(0, (p - 0.35) / 0.3);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(240, 120);
      ctx.lineTo(240 + slash * 250, 120 + slash * 170);
      ctx.stroke();

      // Shattering green Krasue aura
      ctx.fillStyle = `rgba(74, 222, 128, ${0.8 - slash * 0.75})`;
      ctx.beginPath();
      ctx.arc(360, 120, 48 + slash * 65, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const sp = (p - 0.65) / 0.35;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.65, '#f59e0b');
      sky.addColorStop(1, '#15803d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Rising sunrise glow
      ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.72 - sp * 115, 68, 0, Math.PI * 2);
      ctx.fill();

      // Golden Bai-Sri Su-Kwan celebration & celebrating villagers!
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(320, 315);
      ctx.lineTo(360, 215);
      ctx.lineTo(400, 315);
      ctx.closePath();
      ctx.fill();
      this.drawPerson(ctx, 240, 325, '#2563eb', '#1e293b', 1.1);
      this.drawPerson(ctx, 480, 325, '#db2777', '#3b0764', 1.08);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = ['#f43f5e', '#facc15', '#38bdf8', '#4ade80'][i % 4];
        ctx.beginPath();
        ctx.arc(160 + i * 38, 140 + Math.sin(t * 6 + i) * 35, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawSchoolDare(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.55, '#581c87');
    sky.addColorStop(1, '#ea580c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 290, w, 115);

    // Grand 3-story Thai school silhouette & eerie crimson glowing Floor 3 Music Room window!
    ctx.fillStyle = '#334155';
    ctx.fillRect(360, 75, 310, 215);
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(345, 80);
    ctx.lineTo(515, 35);
    ctx.lineTo(685, 80);
    ctx.closePath();
    ctx.fill();

    for (let fl = 0; fl < 3; fl++) {
      for (let wx = 385; wx <= 625; wx += 55) {
        const isHauntedWin = fl === 0 && wx >= 495;
        ctx.fillStyle = isHauntedWin
          ? `rgba(239, 68, 68, ${0.45 + Math.sin(t * 7) * 0.3})`
          : '#0f172a';
        ctx.fillRect(wx, 100 + fl * 62, 34, 38);
      }
    }

    // Hero Peem & Kong Bully gang facing each other outside gate!
    this.drawPerson(ctx, 130 + Math.min(1, p * 2) * 35, 325, '#f8fafc', '#1e3a8a', 1.1);
    this.drawPerson(ctx, 255, 325, '#e2e8f0', '#0f172a', 1.14, -5);
    this.drawPerson(ctx, 305, 325, '#cbd5e1', '#1e293b', 1.05);
  }

  private drawClassroomLesson(ctx: CanvasRenderingContext2D, w: number, h: number, _p: number, t: number): void {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 285, w, 120);

    // Chalkboard & teacher pointing!
    ctx.fillStyle = '#14532d';
    ctx.fillRect(140, 48, 440, 155);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 10;
    ctx.strokeRect(140, 48, 440, 155);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ประวัติชมรมนาฏศิลป์ • ห้ามขึ้นชั้น 3 ยามวิกาล', 360, 118);

    this.drawPerson(ctx, 210, 288, '#a38968', '#57534e', 1.15);
    [350, 465, 575].forEach((sx, idx) => {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(sx - 26, 268, 52, 36);
      this.drawPerson(ctx, sx, 295 + Math.sin(t * 2 + idx) * 2, '#f8fafc', '#1e3a8a', 0.95, 0, true);
    });
  }

  private drawMusicRoomRanat(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    ctx.fillStyle = '#07050a';
    ctx.fillRect(0, 0, w, h);

    // Crimson stage curtains & Mirror frame
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, 95, h);
    ctx.fillRect(w - 95, 0, 95, h);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 295, w, 110);

    // Antique Silver Mirror revealing Ghost Dancer behind Peem!!
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 12;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(245, 45, 230, 225);
    ctx.strokeRect(245, 45, 230, 225);

    if (p > 0.35) {
      const gp = Math.min(1, (p - 0.35) * 1.9);
      const gx = 360;
      const gy = 215 - gp * 45 + Math.sin(t * 5) * 6;
      const aura = ctx.createRadialGradient(gx, gy - 40, 10, gx, gy - 40, 95);
      aura.addColorStop(0, `rgba(220, 38, 38, ${0.65 * gp})`);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(245, 45, 230, 225);

      // Thai Chada + Blood-stained gold Sabai ghost silhouette inside mirror
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(gx - 16, gy - 82);
      ctx.lineTo(gx + 16, gy - 82);
      ctx.lineTo(gx, gy - 118);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(gx, gy - 68, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.roundRect(gx - 22, gy - 50, 44, 64, 6);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(gx - 8, gy - 71, 4, 4);
      ctx.fillRect(gx + 4, gy - 71, 4, 4);
    }

    // Wooden Ranat Ek foreground + Peem beating 3 strikes
    ctx.fillStyle = '#78350f';
    ctx.fillRect(260, 275, 200, 42);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(268, 266, 184, 12);
    this.drawPerson(ctx, 210, 345, '#f8fafc', '#1e3a8a', 1.15, p < 0.35 ? Math.sin(p * 18) * 10 : -8);
  }

  private drawLockerHide(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    // POV from narrow dark locker slit!
    ctx.fillStyle = '#020307';
    ctx.fillRect(0, 0, w, h);

    // Narrow vertical glowing gap looking out into dark school corridor
    const slitX = w * 0.36;
    const slitW = w * 0.28;
    ctx.save();
    ctx.beginPath();
    ctx.rect(slitX, 30, slitW, h - 60);
    ctx.clip();

    ctx.fillStyle = '#0b101d';
    ctx.fillRect(slitX, 30, slitW, h - 60);
    // Flickering red emergency corridor light
    ctx.fillStyle = `rgba(220, 38, 38, ${0.18 + Math.sin(t * 14) * 0.12})`;
    ctx.fillRect(slitX, 30, slitW, h - 60);

    // Floating Ghost Dancer gliding silently past slit from Left to Right!
    const gx = slitX - 45 + p * (slitW + 90);
    const gy = 250 + Math.sin(t * 4) * 8;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(gx - 15, gy - 115);
    ctx.lineTo(gx + 15, gy - 115);
    ctx.lineTo(gx, gy - 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.roundRect(gx - 24, gy - 85, 48, 125, 10);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(gx - 7, gy - 98, 5, 5);
    ctx.fillRect(gx + 3, gy - 98, 5, 5);

    ctx.restore();
    // Metal locker vent louvers
    ctx.fillStyle = '#0f172a';
    for (let ly = 45; ly < 110; ly += 14) {
      ctx.fillRect(slitX + 18, ly, slitW - 36, 5);
    }
  }

  private drawDancerFinale(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const golden = Math.min(1, p * 1.2);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.55, '#b45309');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Radiant purification beam illuminating the Golden Chada crown on the altar!
    const beam = ctx.createRadialGradient(360, 210, 18, 360, 210, 220 + Math.sin(t * 4) * 14);
    beam.addColorStop(0, `rgba(254, 240, 138, ${0.88 * golden})`);
    beam.addColorStop(0.55, 'rgba(217, 119, 6, 0.35)');
    beam.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(280, 265, 160, 65);
    // Golden Chada Crown sparkling
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(335, 265);
    ctx.lineTo(385, 265);
    ctx.lineTo(360, 200);
    ctx.closePath();
    ctx.fill();

    // Graceful purified P'Dao spirit bowing respectfully before vanishing in golden petals!
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, 1 - Math.max(0, p - 0.65) * 2.5);
    this.drawPerson(ctx, 470, 325, '#facc15', '#7f1d1d', 1.15, Math.sin(p * Math.PI) * 18);
    ctx.restore();

    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(110 + i * 38, (t * 46 + i * 52) % h, 5, 3, t + i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSongthaewRide(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    sky.addColorStop(0, '#0c4a6e');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Scrolling green rice field + roadside poles & trees!
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 235, w, 75);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 300, w, 105);
    for (let i = 0; i < 6; i++) {
      const rx = ((720 - ((t * 360 + i * 145) % 820)) + 820) % 820 - 50;
      ctx.fillStyle = '#475569';
      ctx.fillRect(rx, 85, 10, 165);
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(rx + 42, 165, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx, 345, 52, 8); // dashed road lines scrolling fast
    }

    // Bouncing Iconic Thai Songthaew Truck!
    const bounce = Math.sin(t * 22) * 3;
    const tx = 140 + Math.sin(p * Math.PI) * 55;
    const ty = 195 + bounce;
    // Cab + Roofed Passenger Bed
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(tx + 245, ty + 36, 95, 72); // blue pickup cab
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(tx + 275, ty + 44, 52, 32); // cab windshield
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(tx, ty, 245, 16); // corrugated passenger canopy roof
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(tx, ty + 52, 245, 56); // red side rails & wooden benches
    // Pillars & Standing/Seated Player inside Songthaew!
    [tx + 8, tx + 118, tx + 236].forEach((px) => {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px, ty + 16, 8, 40);
    });
    this.drawPerson(ctx, tx + 85, ty + 96, '#2563eb', '#1e293b', 0.88, -4);
    this.drawPerson(ctx, tx + 165, ty + 96, '#f59e0b', '#334155', 0.84, 3);

    // Spinning Wheels
    [tx + 65, tx + 292].forEach((wx) => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(wx, ty + 114, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(wx, ty + 114, 12, t * 18, t * 18 + Math.PI * 1.3);
      ctx.stroke();
    });
  }
}
