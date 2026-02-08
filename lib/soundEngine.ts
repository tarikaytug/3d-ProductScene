/**
 * Mechanical Keyboard Sound Engine
 * ─────────────────────────────────
 * Web Audio API ile gerçekçi mekanik klavye sesleri sentezler.
 * Her switch türü farklı frekans, decay ve click profili kullanır.
 */

/* ——— Switch Ses Profilleri ——— */

interface SwitchProfile {
  /** Thock body frequency (Hz) */
  baseFreq: number;
  /** Click frequency – 0 = no click (Hz) */
  clickFreq: number;
  /** Bandpass filter center (Hz) */
  filterFreq: number;
  /** Filter resonance */
  filterQ: number;
  /** Thock decay time (s) */
  thockDecay: number;
  /** Click decay time (s) */
  clickDecay: number;
  /** Master volume 0-1 */
  volume: number;
}

const PROFILES: Record<string, SwitchProfile> = {
  red: {
    baseFreq: 160,
    clickFreq: 0,
    filterFreq: 600,
    filterQ: 1.2,
    thockDecay: 0.06,
    clickDecay: 0,
    volume: 0.25,
  },
  blue: {
    baseFreq: 240,
    clickFreq: 4200,
    filterFreq: 1800,
    filterQ: 2.0,
    thockDecay: 0.08,
    clickDecay: 0.03,
    volume: 0.32,
  },
  brown: {
    baseFreq: 200,
    clickFreq: 2200,
    filterFreq: 1000,
    filterQ: 1.4,
    thockDecay: 0.07,
    clickDecay: 0.015,
    volume: 0.28,
  },
  speed: {
    baseFreq: 280,
    clickFreq: 0,
    filterFreq: 1200,
    filterQ: 1.0,
    thockDecay: 0.035,
    clickDecay: 0,
    volume: 0.2,
  },
  black: {
    baseFreq: 110,
    clickFreq: 0,
    filterFreq: 400,
    filterQ: 1.5,
    thockDecay: 0.1,
    clickDecay: 0,
    volume: 0.3,
  },
};

/* ——— Engine ——— */

export class KeySoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  /** Lazily create / resume AudioContext (browser autoplay policy) */
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.buildNoiseBuffer();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Pre-generate a short noise buffer (≈100 ms) for thock sounds */
  private buildNoiseBuffer() {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 0.1;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // Shaped noise — natural exponential decay baked in
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
    }
    this.noiseBuffer = buf;
  }

  /** Slight randomisation for natural feel */
  private jitter(value: number, amount = 0.04): number {
    return value * (1 + (Math.random() - 0.5) * 2 * amount);
  }

  /* ——————————————————————————————————————
     Public API
     —————————————————————————————————————— */

  /** Play key-DOWN sound for given switch type */
  playDown(switchId: string) {
    const ctx = this.ensureCtx();
    const p = PROFILES[switchId] ?? PROFILES.red;
    const now = ctx.currentTime;

    // 1 ─ Noise thock (body of the sound)
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = this.jitter(p.filterFreq);
      bp.Q.value = p.filterQ;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.jitter(p.volume), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.thockDecay);

      src.connect(bp).connect(gain).connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.15);
    }

    // 2 ─ Tonal thud (low sine for bottom-out)
    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.value = this.jitter(p.baseFreq);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(p.volume * 0.45, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    thud.connect(thudGain).connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.05);

    // 3 ─ Click (clicky / tactile only)
    if (p.clickFreq > 0) {
      const click = ctx.createOscillator();
      click.type = "square";
      click.frequency.value = this.jitter(p.clickFreq, 0.06);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(p.volume * 0.25, now);
      clickGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + p.clickDecay
      );

      click.connect(clickGain).connect(ctx.destination);
      click.start(now);
      click.stop(now + p.clickDecay + 0.005);
    }
  }

  /** Play key-UP sound (lighter, higher-pitched thock) */
  playUp(switchId: string) {
    const ctx = this.ensureCtx();
    const p = PROFILES[switchId] ?? PROFILES.red;
    const now = ctx.currentTime;

    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = this.jitter(p.filterFreq * 1.4);
      bp.Q.value = p.filterQ * 0.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(p.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.thockDecay * 0.6);

      src.connect(bp).connect(gain).connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.1);
    }

    // Clicky switches also click on release
    if (p.clickFreq > 0) {
      const click = ctx.createOscillator();
      click.type = "square";
      click.frequency.value = this.jitter(p.clickFreq * 0.8);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(p.volume * 0.15, now);
      clickGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + p.clickDecay * 0.7
      );

      click.connect(clickGain).connect(ctx.destination);
      click.start(now);
      click.stop(now + p.clickDecay * 0.7 + 0.005);
    }
  }
}

/** Singleton — import and use anywhere */
export const soundEngine = new KeySoundEngine();

