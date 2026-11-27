import { TimePeriod, WeatherType } from '../types';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private muted = typeof localStorage !== 'undefined' && localStorage.getItem('reuan_chan_sound_muted') === '1';
  private musicEnabled = typeof localStorage === 'undefined' || localStorage.getItem('reuan_chan_music_muted') !== '1';
  private initialized = false;
  private ayutthayaMusicTimer = 0.25;
  private ayutthayaMusicStep = 0;
  private cricketTimer = 0;
  private ruralTimer = 2.5;
  private rotHaeBeatTimer = 0;
  private rotHaeStep = 0;
  private marketChatterTimer = 0.5;
  private fairMusicTimer = 0.25;
  private fairStep = 0;
  private thaiMusicTimer = 0.2;
  private thaiMusicStep = 0;
  private schoolCrowdTimer = 0.7;
  private chaseMusicTimer = 0.15;
  private chaseMusicStep = 0;
  private howlTimer = 8;
  private pretaWailTimer = 11;
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

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicEnabled ? 0.85 : 0;
    this.musicGain.connect(this.masterGain);

    this.setupAmbienceLayers();
    this.initialized = true;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('reuan_chan_sound_muted', muted ? '1' : '0');
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.08);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('reuan_chan_music_muted', enabled ? '0' : '1');
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.85 : 0, this.ctx.currentTime, 0.08);
    }
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
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
    isChasing = false,
    includePretaWail = false
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

    // Occasional distant Thai dog howl & Preta ghost wail at night
    if (period === 'night') {
      this.howlTimer -= dt;
      if (this.howlTimer <= 0) {
        this.howlTimer = 18 + Math.random() * 22;
        if (Math.random() < 0.6) {
          this.playDistantHowl();
        }
      }
      if (includePretaWail) {
        this.pretaWailTimer -= dt;
        if (this.pretaWailTimer <= 0) {
          this.pretaWailTimer = 15 + Math.random() * 14;
          this.playPretaWail();
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

  /** Plays a thin, high-pitched trembling Thai Preta ghost wail in the distance. */
  public playPretaWail(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(610, now);
    osc.frequency.exponentialRampToValueAtTime(960, now + 0.75);
    osc.frequency.exponentialRampToValueAtTime(790, now + 1.8);
    osc.frequency.exponentialRampToValueAtTime(490, now + 3.25);

    lfo.type = 'sine';
    lfo.frequency.value = 6.8;
    lfoGain.gain.value = 22;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'bandpass';
    filter.frequency.value = 820;
    filter.Q.value = 2.4;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.45);
    gain.gain.setValueAtTime(0.052, now + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 3.4);
    osc.stop(now + 3.4);
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

  /**
   * Natural spatial market ambience: overlapping filtered vocal murmurs, pan clinks & footsteps around x = -42.
   */
  public updateIsaanMarketAmbience(dt: number, distanceToMarket: number, active: boolean): void {
    if (!this.ctx || !this.masterGain || !this.initialized || !active || this.muted) return;
    const proximity = Math.max(0, 1 - distanceToMarket / 28);
    if (proximity <= 0.02) return;

    this.marketChatterTimer -= dt;
    if (this.marketChatterTimer > 0) return;
    this.marketChatterTimer = 0.14 + Math.random() * 0.28;

    const now = this.ctx.currentTime;
    const vol = proximity * proximity;

    // Gentle overlapping human murmur formant (speech-like cadence without harsh buzz)
    const dur = 0.14 + Math.random() * 0.22;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const arr = buf.getChannelData(0);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      lp = (lp + 0.18 * (Math.random() * 2 - 1)) / 1.18;
      arr[i] = lp * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = 340 + Math.random() * 440; // varied vendor/buyer voices
    formant.Q.value = 2.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.11 * vol, now);
    src.connect(formant);
    formant.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);

    // Occasional metallic ladle/wok clink or somtam mortar tap ("โป๊ก!")
    if (Math.random() < 0.24) {
      const osc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      const isMortar = Math.random() < 0.55;
      osc.type = isMortar ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isMortar ? 420 + Math.random() * 90 : 1750 + Math.random() * 450, now);
      osc.frequency.exponentialRampToValueAtTime(isMortar ? 210 : 1400, now + 0.08);
      cGain.gain.setValueAtTime(0.045 * vol, now);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(cGain);
      cGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  /**
   * Lively spatial Temple Fair & Mor Lam Stage music (Khaen/Phin + Ramwong drum) around x = +76.
   */
  public updateTempleFairAmbience(dt: number, distanceToFair: number, active: boolean): void {
    if (!this.ctx || !this.masterGain || !this.initialized || !active || this.muted || !this.musicEnabled) return;
    const proximity = Math.max(0, 1 - distanceToFair / 32);
    if (proximity <= 0.02) return;

    this.fairMusicTimer -= dt;
    if (this.fairMusicTimer > 0) return;
    this.fairMusicTimer = 0.24; // bouncy Mor Lam / Ramwong temple fair groove

    const now = this.ctx.currentTime;
    const step = this.fairStep % 16;
    this.fairStep++;
    const vol = proximity * proximity;

    // Warm Ramwong tom drum beat
    if (step % 2 === 0) {
      const drum = this.ctx.createOscillator();
      const dg = this.ctx.createGain();
      drum.type = 'sine';
      drum.frequency.setValueAtTime(step % 4 === 0 ? 110 : 145, now);
      drum.frequency.exponentialRampToValueAtTime(48, now + 0.13);
      dg.gain.setValueAtTime(0.001, now);
      dg.gain.linearRampToValueAtTime(0.11 * vol, now + 0.01);
      dg.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      drum.connect(dg);
      dg.connect(this.masterGain);
      drum.start(now);
      drum.stop(now + 0.16);
    }

    // Crisp Ching (ฉิ่ง) cymbal shimmer every half bar
    if (step % 4 === 2) {
      const ching = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      ching.type = 'sine';
      ching.frequency.setValueAtTime(step % 8 === 2 ? 2650 : 2250, now);
      cg.gain.setValueAtTime(0.032 * vol, now);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      ching.connect(cg);
      cg.connect(this.masterGain);
      ching.start(now);
      ching.stop(now + 0.13);
    }

    // Festive Khaen & Phin Isaan melody loop
    const scale = [392, 440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440, 392];
    const osc = this.ctx.createOscillator();
    const flt = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(scale[step], now);
    flt.type = 'lowpass';
    flt.frequency.value = 1700;
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.048 * vol, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
    osc.connect(flt);
    flt.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /** Melodic 4-tone Thai School Bell ("ติ๊ง หน่อง ต่อง แต๊ง") */
  public playSchoolBell(): void {
    if (!this.ctx || !this.masterGain || !this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const chimes = [
      { f: 659.25, t: 0, d: 0.45 },
      { f: 523.25, t: 0.34, d: 0.45 },
      { f: 587.33, t: 0.68, d: 0.45 },
      { f: 392.0, t: 1.04, d: 0.75 },
    ];
    chimes.forEach((c) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(c.f, now + c.t);
      g.gain.setValueAtTime(0.001, now + c.t);
      g.gain.linearRampToValueAtTime(0.11, now + c.t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + c.t + c.d);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + c.t);
      osc.stop(now + c.t + c.d + 0.03);
    });
  }

  /** Wooden Ranat Ek (ระนาดเอก) strike for mini-game & cutscenes */
  public playRanatNote(noteIdx: number, eerie = false): void {
    if (!this.ctx || !this.masterGain || !this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const thaiScale = [392, 440, 493.88, 587.33, 659.25, 783.99];
    const baseFreq = thaiScale[((noteIdx % thaiScale.length) + thaiScale.length) % thaiScale.length];
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const flt = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    osc.type = 'triangle';
    overtone.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    overtone.frequency.setValueAtTime(eerie ? baseFreq * 2.13 : baseFreq * 2.75, now);

    flt.type = 'bandpass';
    flt.frequency.value = baseFreq * 1.6;
    flt.Q.value = eerie ? 3.5 : 1.8;

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (eerie ? 0.52 : 0.32));

    osc.connect(flt);
    overtone.connect(flt);
    flt.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.56);
    overtone.stop(now + 0.56);
  }

  /**
   * Thai Classical Music (เสียงระนาดเอก & ฆ้องวง) — graceful by day, chilling & echoing when haunted/chasing!
   */
  public updateThaiClassicalAmbience(
    dt: number,
    proximity: number,
    isHaunted: boolean,
    isChasing: boolean
  ): void {
    if (!this.ctx || !this.masterGain || !this.initialized || this.muted || !this.musicEnabled) return;
    const p = Math.max(0, Math.min(1, proximity));
    if (p <= 0.03) return;

    this.thaiMusicTimer -= dt;
    if (this.thaiMusicTimer > 0) return;
    this.thaiMusicTimer = isChasing ? 0.19 : isHaunted ? 0.34 : 0.38;

    const now = this.ctx.currentTime;
    const step = this.thaiMusicStep % 12;
    this.thaiMusicStep++;
    const vol = p * p * (isChasing ? 1.15 : 0.8);

    // Traditional Thai 5-tone melody (G4, A4, B4, D5, E5, G5) with eerie flat pitch shift if haunted
    const notes = isHaunted
      ? [392, 466.16, 392, 587.33, 554.37, 466.16, 392, 311.13, 392, 466.16, 622.25, 440]
      : [392, 440, 493.88, 587.33, 659.25, 587.33, 493.88, 440, 392, 587.33, 659.25, 783.99];
    const f = notes[step];

    const ranat = this.ctx.createOscillator();
    const rGain = this.ctx.createGain();
    ranat.type = isHaunted ? 'sawtooth' : 'triangle';
    ranat.frequency.setValueAtTime(f, now);
    if (isHaunted) ranat.frequency.linearRampToValueAtTime(f * 0.97, now + 0.25);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = isHaunted ? 1150 : 2100;

    rGain.gain.setValueAtTime(0.001, now);
    rGain.gain.linearRampToValueAtTime(0.075 * vol, now + 0.01);
    rGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    ranat.connect(lp);
    lp.connect(rGain);
    rGain.connect(this.masterGain);
    ranat.start(now);
    ranat.stop(now + 0.3);

    // Deep bronze Khong Wong (ฆ้องวงใหญ่) pulse on every 4th beat + Ching shimmer
    if (step % 4 === 0) {
      const gong = this.ctx.createOscillator();
      const gg = this.ctx.createGain();
      gong.type = 'sine';
      gong.frequency.setValueAtTime(isHaunted ? 155.56 : 196, now);
      gg.gain.setValueAtTime(0.001, now);
      gg.gain.linearRampToValueAtTime(0.11 * vol, now + 0.02);
      gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
      gong.connect(gg);
      gg.connect(this.masterGain);
      gong.start(now);
      gong.stop(now + 0.75);
    }
    if (step % 2 === 1) {
      const ching = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      ching.type = 'sine';
      ching.frequency.setValueAtTime(step % 4 === 1 ? 2750 : 2300, now);
      cg.gain.setValueAtTime(0.026 * vol, now);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      ching.connect(cg);
      cg.connect(this.masterGain);
      ching.start(now);
      ching.stop(now + 0.16);
    }
  }

  /**
   * Authentic Ayutthaya Kingdom Thai Classical Ensemble (ปี่พาทย์-มโหรีอโยธยา):
   * Ranat Ek xylophone, breathy Khlui flute, deep Khong Wong gong, Ching cymbals & Taphon war drum.
   */
  public updateAyutthayaMusic(
    dt: number,
    mood: 'prosperous' | 'plague' | 'riot' | 'climax',
    isNight: boolean,
    inSanctuary: boolean
  ): void {
    if (!this.ctx || !this.musicGain || !this.initialized || this.muted || !this.musicEnabled) return;

    const isWar = mood === 'riot' || mood === 'climax';
    const isSolemn = !inSanctuary && (mood === 'plague' || isNight) && !isWar;

    this.ayutthayaMusicTimer -= dt;
    if (this.ayutthayaMusicTimer > 0) return;
    this.ayutthayaMusicTimer = isWar ? 0.24 : isSolemn ? 0.44 : 0.34;

    const now = this.ctx.currentTime;
    const step = this.ayutthayaMusicStep % 24;
    this.ayutthayaMusicStep++;
    const out = this.musicGain;

    // Traditional Thai 5-tone melody (F / G pentatonic) adapting to court peace, sorrow or war
    const peacefulNotes = [
      392, 440, 493.88, 587.33, 659.25, 587.33, 493.88, 440,
      523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440,
      392, 493.88, 587.33, 440, 392, 329.63, 293.66, 392,
    ];
    const solemnNotes = [
      293.66, 329.63, 392, 440, 392, 329.63, 261.63, 293.66,
      329.63, 392, 440, 392, 329.63, 293.66, 261.63, 220,
      261.63, 293.66, 329.63, 293.66, 261.63, 220, 196, 293.66,
    ];
    const warNotes = [
      392, 587.33, 440, 587.33, 523.25, 659.25, 587.33, 493.88,
      392, 493.88, 587.33, 783.99, 659.25, 587.33, 440, 523.25,
      440, 392, 329.63, 392, 587.33, 493.88, 440, 392,
    ];
    const freq = (isWar ? warNotes : isSolemn ? solemnNotes : peacefulNotes)[step];

    // 1) Ranat Ek (ระนาดเอก): crisp teakwood tone + resonant woody harmonic overtone
    const ranat = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const flt = this.ctx.createBiquadFilter();
    const rg = this.ctx.createGain();
    ranat.type = 'triangle';
    overtone.type = 'sine';
    ranat.frequency.setValueAtTime(freq, now);
    overtone.frequency.setValueAtTime(freq * 2.75, now);
    flt.type = 'lowpass';
    flt.frequency.value = isSolemn ? 1350 : 2100;
    rg.gain.setValueAtTime(0.001, now);
    rg.gain.linearRampToValueAtTime(isWar ? 0.068 : 0.055, now + 0.01);
    rg.gain.exponentialRampToValueAtTime(0.0001, now + (isSolemn ? 0.42 : 0.28));
    ranat.connect(flt);
    overtone.connect(flt);
    flt.connect(rg);
    rg.connect(out);
    ranat.start(now);
    overtone.start(now);
    ranat.stop(now + 0.45);
    overtone.stop(now + 0.45);

    // 2) Breathy Khlui Flute (ขลุ่ยเพียงออ) sustaining softly across every 3rd beat
    if (step % 3 === 0) {
      const khlui = this.ctx.createOscillator();
      const kg = this.ctx.createGain();
      khlui.type = 'sine';
      khlui.frequency.setValueAtTime(freq * (isSolemn ? 1 : 0.5), now);
      khlui.frequency.linearRampToValueAtTime(freq * (isSolemn ? 1.008 : 0.504), now + 0.35);
      kg.gain.setValueAtTime(0.001, now);
      kg.gain.linearRampToValueAtTime(isSolemn ? 0.048 : 0.036, now + 0.12);
      kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      khlui.connect(kg);
      kg.connect(out);
      khlui.start(now);
      khlui.stop(now + 0.88);
    }

    // 3) Khong Wong Yai (ฆ้องวงใหญ่) deep temple resonance every 6th beat
    if (step % 6 === 0) {
      const gong = this.ctx.createOscillator();
      const gg = this.ctx.createGain();
      gong.type = 'sine';
      gong.frequency.setValueAtTime(isSolemn ? freq * 0.5 : 196, now);
      gg.gain.setValueAtTime(0.001, now);
      gg.gain.linearRampToValueAtTime(0.075, now + 0.025);
      gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      gong.connect(gg);
      gg.connect(out);
      gong.start(now);
      gong.stop(now + 0.98);
    }

    // 4) Authentic Ching ("ชิ่ง" open shimmer / "ฉับ" dampened stroke) + Taphon Drum during war
    if (step % 2 === 0) {
      const isOpen = step % 4 === 0;
      const ching = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      ching.type = 'sine';
      ching.frequency.setValueAtTime(isOpen ? 3180 : 2420, now);
      cg.gain.setValueAtTime(isOpen ? 0.022 : 0.018, now);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + (isOpen ? 0.24 : 0.06));
      ching.connect(cg);
      cg.connect(out);
      ching.start(now);
      ching.stop(now + 0.26);
    }
    if (isWar && step % 2 === 0) {
      const drum = this.ctx.createOscillator();
      const dg = this.ctx.createGain();
      drum.type = 'sine';
      drum.frequency.setValueAtTime(step % 4 === 0 ? 96 : 128, now);
      drum.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      dg.gain.setValueAtTime(0.001, now);
      dg.gain.linearRampToValueAtTime(0.085, now + 0.01);
      dg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      drum.connect(dg);
      dg.connect(out);
      drum.start(now);
      drum.stop(now + 0.17);
    }
  }

  /** Lively daytime school campus murmur, chatter, sports whistle & basketball bounce */
  public updateSchoolCrowdAmbience(dt: number, proximity: number, active: boolean): void {
    if (!this.ctx || !this.masterGain || !this.initialized || !active || this.muted) return;
    const p = Math.max(0, Math.min(1, proximity));
    if (p <= 0.03) return;

    this.schoolCrowdTimer -= dt;
    if (this.schoolCrowdTimer > 0) return;
    this.schoolCrowdTimer = 0.14 + Math.random() * 0.25;

    const now = this.ctx.currentTime;
    const dur = 0.16 + Math.random() * 0.24;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const arr = buf.getChannelData(0);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      lp = (lp + 0.22 * (Math.random() * 2 - 1)) / 1.22;
      arr[i] = lp * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 380 + Math.random() * 540;
    flt.Q.value = 2.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.11 * p * p, now);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.masterGain);
    src.start(now);

    // Basketball thud / cafeteria tray clink detail!
    if (Math.random() < 0.22) {
      const osc = this.ctx.createOscillator();
      const bg = this.ctx.createGain();
      const bball = Math.random() < 0.55;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(bball ? 135 : 1950, now);
      osc.frequency.exponentialRampToValueAtTime(bball ? 52 : 1400, now + 0.09);
      bg.gain.setValueAtTime((bball ? 0.065 : 0.035) * p, now);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(bg);
      bg.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.11);
    }
  }

  /** Intense Ghost Dancer Thriller Chase Score: pounding bass drum + screeching dissonant Ranat + ankle bells */
  public updateSchoolChaseMusic(dt: number, isChasing: boolean): void {
    if (!this.ctx || !this.masterGain || !this.initialized || !isChasing || this.muted || !this.musicEnabled) return;
    this.chaseMusicTimer -= dt;
    if (this.chaseMusicTimer > 0) return;
    this.chaseMusicTimer = 0.185; // ~162 BPM adrenaline pulse

    const now = this.ctx.currentTime;
    const s = this.chaseMusicStep % 16;
    this.chaseMusicStep++;

    // Heavy pounding drum hit on 0, 3, 6, 8, 12
    if (s % 2 === 0 || s === 3 || s === 11) {
      const kick = this.ctx.createOscillator();
      const kg = this.ctx.createGain();
      kick.type = 'triangle';
      kick.frequency.setValueAtTime(105, now);
      kick.frequency.exponentialRampToValueAtTime(34, now + 0.14);
      kg.gain.setValueAtTime(0.18, now);
      kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      kick.connect(kg);
      kg.connect(this.masterGain);
      kick.start(now);
      kick.stop(now + 0.17);
    }

    // Dissonant tritone frantic Ranat Ek run + metallic ankle bell rattle!
    const panicNotes = [587.33, 622.25, 830.61, 622.25, 932.33, 880, 622.25, 587.33];
    const f = panicNotes[s % panicNotes.length];
    const osc = this.ctx.createOscillator();
    const flt = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f, now);
    flt.type = 'bandpass';
    flt.frequency.value = f * 1.5;
    flt.Q.value = 3.0;
    g.gain.setValueAtTime(0.068, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(flt);
    flt.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);

    if (s % 4 === 1) {
      const bell = this.ctx.createOscillator();
      const bg = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(3100 + (s % 2) * 350, now);
      bg.gain.setValueAtTime(0.045, now);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      bell.connect(bg);
      bg.connect(this.masterGain);
      bell.start(now);
      bell.stop(now + 0.13);
    }
  }

  /** Metallic whoosh of swinging an Ayutthaya steel sword. */
  public playSwordSlash(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const flt = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
    flt.type = 'bandpass';
    flt.frequency.value = 950;
    flt.Q.value = 1.6;
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(flt);
    flt.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  /** Snappy bowstring twang for Ayutthaya crossbow/bow shot. */
  public playBowShot(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.12);
    g.gain.setValueAtTime(0.11, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /** Impact thud + steel ring when hitting a Phee Ha or bandit. */
  public playSwordHit(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.11);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /** Deep resonant Ayutthaya temple bell / alarm gong toll. */
  public playTempleBell(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [220, 440, 665].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.11 / (idx + 1), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 2.3);
    });
  }

  /** Cool water splash when rowing a boat or dousing an arson fire. */
  public playWaterSplash(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.25);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 1100;
    flt.Q.value = 1.1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.masterGain);
    src.start(now);
  }
}
