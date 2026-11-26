import { TimePeriod, WeatherType } from '../types';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private muted = false;
  private initialized = false;
  private cricketTimer = 0;
  private ruralTimer = 2.5;
  private rotHaeBeatTimer = 0;
  private rotHaeStep = 0;
  private howlTimer = 8;
  private heartbeatTimer = 0;
  private chaseStepTimer = 0;
  private chaseStepIndex = 0;

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.72;
    this.masterGain.connect(this.ctx.destination);

    this.setupAmbienceLayers();
    this.initialized = true;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.08);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private createNoiseBuffer(seconds = 3): AudioBuffer | null {
    if (!this.ctx) return null;
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      // Pink-ish noise smoothing
      data[i] = (lastOut + 0.06 * white) / 1.06;
      lastOut = data[i];
    }
    return buffer;
  }

  private setupAmbienceLayers(): void {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuf = this.createNoiseBuffer(4);
    if (!noiseBuf) return;

    // Rain loop
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = noiseBuf;
    rainSrc.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1450;
    rainFilter.Q.value = 0.55;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainSrc.start();

    // Wind loop
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = noiseBuf;
    windSrc.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 2.6;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.16;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;
    windSrc.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windSrc.start();

    // Low eerie tension drone
    const droneOsc1 = this.ctx.createOscillator();
    const droneOsc2 = this.ctx.createOscillator();
    droneOsc1.type = 'sine';
    droneOsc2.type = 'triangle';
    droneOsc1.frequency.value = 55;
    droneOsc2.frequency.value = 58.2;

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 140;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0;
    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    droneOsc1.start();
    droneOsc2.start();
  }

  public updateAmbience(
    dt: number,
    weather: WeatherType,
    period: TimePeriod,
    sanity: number,
    floor: number,
    isChasing = false
  ): void {
    if (!this.ctx || !this.initialized) return;
    const now = this.ctx.currentTime;

    const targetRain =
      weather === 'storm' ? 0.34 : weather === 'rain' ? 0.22 : 0;
    const targetWind =
      weather === 'storm' ? 0.28 : weather === 'windy' ? 0.2 : weather === 'rain' ? 0.08 : 0.03;

    const tension = isChasing
      ? 0.22
      : Math.max(0, (70 - sanity) / 70) * 0.14 + (floor === 3 ? 0.06 : 0);

    this.rainGain?.gain.setTargetAtTime(targetRain, now, 0.5);
    this.windGain?.gain.setTargetAtTime(targetWind, now, 0.5);
    this.droneGain?.gain.setTargetAtTime(Math.min(0.24, tension), now, 0.25);

    // Thrilling chase ostinato music
    if (isChasing) {
      this.chaseStepTimer -= dt;
      if (this.chaseStepTimer <= 0) {
        this.chaseStepTimer = 0.19; // ~158 BPM driving horror pulse
        this.playChasePulseStep(this.chaseStepIndex);
        this.chaseStepIndex = (this.chaseStepIndex + 1) % 8;
      }
    } else {
      this.chaseStepTimer = 0;
      this.chaseStepIndex = 0;
    }

    // Night crickets outdoors
    if ((period === 'night' || period === 'evening') && floor === 0 && weather !== 'storm') {
      this.cricketTimer -= dt;
      if (this.cricketTimer <= 0) {
        this.cricketTimer = 1.6 + Math.random() * 2.5;
        this.playCricketChirp();
      }
    }

    // Occasional distant Thai dog howl at night
    if (period === 'night') {
      this.howlTimer -= dt;
      if (this.howlTimer <= 0) {
        this.howlTimer = 18 + Math.random() * 22;
        if (Math.random() < 0.6) {
          this.playDistantHowl();
        }
      }
    }

    // Heartbeat when sanity is low or during chase
    if (sanity < 50 || isChasing) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = isChasing ? 0.48 : sanity < 25 ? 0.65 : 1.05;
        this.playHeartbeat(isChasing ? 0.32 : sanity < 25 ? 0.28 : 0.16);
      }
    }
  }

  private playChasePulseStep(step: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Dissonant minor-2nd / tritone suspense ostinato
    const notes = [220, 233.08, 311.13, 220, 207.65, 293.66, 220, 466.16];
    const freq = notes[step % notes.length];

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    if (step === 7) {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.16);
    }

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(step % 2 === 0 ? 1100 : 1650, now);
    filter.Q.value = 3.2;

    const accent = step === 0 || step === 4 || step === 7 ? 0.11 : 0.065;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(accent, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);

    // Driving sub-bass kick on main beats
    if (step % 2 === 0) {
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(92, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 0.13);
      subGain.gain.setValueAtTime(step === 0 || step === 4 ? 0.24 : 0.14, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(now);
      sub.stop(now + 0.16);
    }
  }

  private playCricketChirp(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 4200 + Math.random() * 400;

    gain.gain.setValueAtTime(0.0001, now);
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.055;
      gain.gain.linearRampToValueAtTime(0.025, t + 0.015);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.045);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playDistantHowl(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(240, now + 2.2);

    filter.type = 'lowpass';
    filter.frequency.value = 650;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 2.4);
  }

  public playFootstep(surface: 'concrete' | 'wood' | 'wet'): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'wood') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 25, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);
      gain.gain.setValueAtTime(0.11, now);
    } else if (surface === 'wet') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360 + Math.random() * 90, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);
      gain.gain.setValueAtTime(0.09, now);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.055);
      gain.gain.setValueAtTime(0.1, now);
    }

    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playThunder(): void {
    if (!this.ctx || !this.masterGain) return;
    const buf = this.createNoiseBuffer(2.8);
    if (!buf) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, now);
    filter.frequency.exponentialRampToValueAtTime(75, now + 2.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.7);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  public playDoorCreak(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.25);
    osc.frequency.linearRampToValueAtTime(160, now + 0.55);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 5;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playSwitchClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.03);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playPickup(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.07 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.24);
    });
  }

  public playClueChime(): void {
    if (!this.ctx || !this.masterGain) return;
    // Eerie Thai ranat-like minor pentatonic shimmer
    const now = this.ctx.currentTime;
    [440, 523.25, 659.25, 783.99].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = now + i * 0.085;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playScare(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [110, 117, 233, 466].forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + 0.75);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.85);
    });
  }

  public playHeartbeat(volume = 0.2): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [0, 0.16].forEach((offset, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 64 : 52, now + offset);
      osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.11);
      gain.gain.setValueAtTime(volume, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.13);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.14);
    });
  }

  public playUIClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 620;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playSevenChime(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [659.25, 830.61].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.14;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playGunshot(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1) Crisp supersonic gunpowder crack (white-noise transient + lowpass punch + tail echo)
    const len = Math.floor(this.ctx.sampleRate * 0.38);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = bufferDataFill(buf.getChannelData(0));
    function bufferDataFill(arr: Float32Array): Float32Array {
      for (let i = 0; i < arr.length; i++) {
        const t = i / arr.length;
        const env = i < 180 ? 1.0 : Math.pow(Math.max(0, 1 - t), 3.6);
        arr[i] = (Math.random() * 2 - 1) * env;
      }
      return arr;
    }
    void data;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5200, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + 0.24);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.85, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    src.connect(filter);
    filter.connect(crackGain);
    crackGain.connect(this.masterGain);
    src.start(now);

    // 2) Deep 9mm chamber thump + slapback street echo
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(165, now);
    thump.frequency.exponentialRampToValueAtTime(36, now + 0.09);
    thumpGain.gain.setValueAtTime(0.65, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thump.start(now);
    thump.stop(now + 0.13);

    // 3) Metallic mechanical slide snap
    const slide = this.ctx.createOscillator();
    const slideGain = this.ctx.createGain();
    slide.type = 'triangle';
    slide.frequency.setValueAtTime(2400, now + 0.015);
    slide.frequency.exponentialRampToValueAtTime(750, now + 0.055);
    slideGain.gain.setValueAtTime(0.14, now + 0.015);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    slide.connect(slideGain);
    slideGain.connect(this.masterGain);
    slide.start(now + 0.015);
    slide.stop(now + 0.07);
  }

  public playZombieGroan(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 68 + Math.random() * 24;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.62, now + 0.85);
    osc2.frequency.setValueAtTime(baseFreq * 1.48, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.85);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.linearRampToValueAtTime(160, now + 0.85);
    filter.Q.value = 3.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.92);
    osc2.stop(now + 0.92);
  }

  public playZombieHit(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public updateIsaanAmbience(dt: number, period: TimePeriod, isOutside: boolean, isChasing: boolean): void {
    if (!this.ctx || !this.initialized || !isOutside || isChasing) return;
    this.ruralTimer -= dt;
    if (this.ruralTimer > 0) return;

    const isNightOrEvening = period === 'night' || period === 'evening';
    this.ruralTimer = isNightOrEvening ? 2.4 + Math.random() * 3.0 : 3.2 + Math.random() * 4.2;

    const roll = Math.random();
    if (isNightOrEvening) {
      if (roll < 0.52) this.playIsaanCicadaBuzz();
      else if (roll < 0.85) this.playPondFrogCroak();
      else this.playBuffaloMoo();
    } else {
      if (roll < 0.42) this.playBuffaloMoo();
      else if (roll < 0.78) this.playRoosterOrChicken();
      else this.playIsaanCicadaBuzz();
    }
  }

  private playIsaanCicadaBuzz(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 3400 + Math.random() * 900;
    lfo.frequency.value = 18 + Math.random() * 10;
    lfoGain.gain.value = 0.012;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.022, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 1.0);
    lfo.stop(now + 1.0);
  }

  private playPondFrogCroak(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const base = 125 + Math.random() * 45;
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.24;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.11);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 380;
      filter.Q.value = 4.0;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.032, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.19);
    }
  }

  private playBuffaloMoo(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const pitch = 95 + Math.random() * 35;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.linearRampToValueAtTime(pitch * 1.18, now + 0.35);
    osc.frequency.linearRampToValueAtTime(pitch * 0.88, now + 1.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.value = 2.8;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.55);
  }

  private playRoosterOrChicken(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const clucks = 3;
    for (let i = 0; i < clucks; i++) {
      const t = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780 - i * 40, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.07);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.036, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.095);
    }
  }

  public playBicycleBell(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [0, 0.13].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2250, t);
      osc.frequency.exponentialRampToValueAtTime(1950, t + 0.12);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public playVehicleHorn(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [392, 493.88].forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.24);
    });
  }

  public playPaSystemChime(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playBalloonPop(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.09);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.24, now);
    src.connect(g);
    g.connect(this.masterGain);
    src.start(now);
  }

  public playCameraShutter(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [0, 0.055].forEach((off, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 1800 : 1200, now + off);
      osc.frequency.exponentialRampToValueAtTime(320, now + off + 0.035);
      g.gain.setValueAtTime(0.16, now + off);
      g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.04);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + off);
      osc.stop(now + off + 0.045);
    });
  }

  public playCoinJingle(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [1318.5, 1760].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.07;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playDogHowl(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.45);
    osc.frequency.exponentialRampToValueAtTime(195, now + 1.65);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.065, now + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.75);
  }

  public playRoosterCrow(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f1: 520, f2: 680, d: 0.14, t: 0 },
      { f1: 680, f2: 860, d: 0.16, t: 0.18 },
      { f1: 760, f2: 520, d: 0.55, t: 0.38 },
    ];
    notes.forEach((n) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.value = 1100;
      osc.frequency.setValueAtTime(n.f1, now + n.t);
      osc.frequency.linearRampToValueAtTime(n.f2, now + n.t + n.d);
      g.gain.setValueAtTime(0.001, now + n.t);
      g.gain.linearRampToValueAtTime(0.045, now + n.t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(flt);
      flt.connect(g);
      g.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }

  /**
   * Plays lively procedural Isaan Rot Hae (หมอลำ/ลูกทุ่งรถแห่) beat whose volume scales by distance from the truck.
   */
  public updateRotHaeMusic(dt: number, distanceToTruck: number, isOutside: boolean, isChasing: boolean): void {
    if (!this.ctx || !this.masterGain || !this.initialized || !isOutside || isChasing || this.muted) return;
    const proximity = Math.max(0, 1 - distanceToTruck / 36);
    if (proximity <= 0.02) return;

    // ~132 BPM eighth-note steps
    this.rotHaeBeatTimer -= dt;
    if (this.rotHaeBeatTimer > 0) return;
    this.rotHaeBeatTimer = 0.227;

    const now = this.ctx.currentTime;
    const step = this.rotHaeStep % 16;
    this.rotHaeStep++;
    const vol = proximity * proximity;

    // Punchy Rot Hae sub-bass kick on beats 0, 2, 4, 6...
    if (step % 2 === 0) {
      const kick = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(118, now);
      kick.frequency.exponentialRampToValueAtTime(38, now + 0.14);
      kGain.gain.setValueAtTime(0.001, now);
      kGain.gain.linearRampToValueAtTime(0.16 * vol, now + 0.01);
      kGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      kick.connect(kGain);
      kGain.connect(this.masterGain);
      kick.start(now);
      kick.stop(now + 0.17);
    }

    // Crisp off-beat snare / hi-hat rattle (จังหวะสามช่า/ลำซิ่ง)
    if (step % 4 === 2) {
      const len = Math.floor(this.ctx.sampleRate * 0.06);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const arr = buf.getChannelData(0);
      for (let i = 0; i < len; i++) arr[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      const sGain = this.ctx.createGain();
      sGain.gain.setValueAtTime(0.07 * vol, now);
      src.connect(hp);
      hp.connect(sGain);
      sGain.connect(this.masterGain);
      src.start(now);
    }

    // Pentatonic Isaan Phin / Khaen melody riff (Am pentatonic: A4, C5, D5, E5, G5, A5)
    const phinNotes = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392, 440, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440];
    const freq = phinNotes[step];
    const phin = this.ctx.createOscillator();
    const pFilter = this.ctx.createBiquadFilter();
    const pGain = this.ctx.createGain();
    phin.type = step % 3 === 0 ? 'sawtooth' : 'triangle';
    phin.frequency.setValueAtTime(freq, now);
    pFilter.type = 'bandpass';
    pFilter.frequency.value = freq * 1.8;
    pFilter.Q.value = 1.6;
    pGain.gain.setValueAtTime(0.001, now);
    pGain.gain.linearRampToValueAtTime(0.052 * vol, now + 0.015);
    pGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    phin.connect(pFilter);
    pFilter.connect(pGain);
    pGain.connect(this.masterGain);
    phin.start(now);
    phin.stop(now + 0.2);
  }
}
