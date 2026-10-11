/**
 * Uzbek Auto Drive - Web Audio API Synthesizer
 * Provides realistic procedural engine, drift screech, turbo valve, horn, and impact audio.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine audio nodes
  private engineGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Drift audio nodes
  private driftGain: GainNode | null = null;
  private driftNoiseNode: AudioBufferSourceNode | null = null;
  private driftFilter: BiquadFilterNode | null = null;

  // Radio state
  private isRadioPlaying: boolean = false;
  private radioInterval: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startEngine() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isEngineRunning) return;

    try {
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

      // Low rumble saw
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(45, this.ctx.currentTime);

      // Cylinder pulse square
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      // Sub-bass sine
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.setValueAtTime(28, this.ctx.currentTime);

      this.osc1.connect(this.engineFilter);
      this.osc2.connect(this.engineFilter);
      this.subOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.subOsc.start();
      this.isEngineRunning = true;

      // Also prepare drift noise loop
      this.setupDriftSound();
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private setupDriftSound() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.driftNoiseNode = this.ctx.createBufferSource();
      this.driftNoiseNode.buffer = noiseBuffer;
      this.driftNoiseNode.loop = true;

      this.driftFilter = this.ctx.createBiquadFilter();
      this.driftFilter.type = 'bandpass';
      this.driftFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      this.driftFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.driftGain = this.ctx.createGain();
      this.driftGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.driftNoiseNode.connect(this.driftFilter);
      this.driftFilter.connect(this.driftGain);
      this.driftGain.connect(this.masterGain);

      this.driftNoiseNode.start();
    } catch {
      // Ignore
    }
  }

  public updateEngine(rpmRatio: number, throttle: boolean, speedKmh: number) {
    if (!this.ctx || !this.isEngineRunning) return;
    const now = this.ctx.currentTime;
    // Map rpmRatio (0 to 1) to realistic frequencies
    const baseFreq = 38 + rpmRatio * 180 + (throttle ? 18 : 0);

    if (this.osc1) this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    if (this.osc2) this.osc2.frequency.setTargetAtTime(baseFreq * 1.8, now, 0.05);
    if (this.subOsc) this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);

    if (this.engineFilter) {
      const filterCutoff = 350 + rpmRatio * 1400 + (throttle ? 400 : 0);
      this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);
    }

    if (this.engineGain) {
      const targetVol = 0.15 + (throttle ? 0.22 : 0.05) + Math.min(0.2, speedKmh / 350);
      this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
    }
  }

  public updateDrift(driftIntensity: number) {
    if (!this.ctx || !this.driftGain || !this.driftFilter) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, driftIntensity));
    const targetGain = clamped > 0.05 ? Math.min(0.45, clamped * 0.5) : 0;
    this.driftGain.gain.setTargetAtTime(targetGain, now, 0.04);
    if (clamped > 0.05) {
      this.driftFilter.frequency.setTargetAtTime(900 + clamped * 600, now, 0.05);
    }
  }

  public playTurbo() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      // Realistic turbo blow-off valve release "pshhhh-ch-ch"
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
      filter.Q.setValueAtTime(4.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
    } catch {
      // Ignore
    }
  }

  public playHorn() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const oscA = this.ctx.createOscillator();
      const oscB = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      oscA.type = 'sawtooth';
      oscB.type = 'sawtooth';
      // Classic dual-tone car horn (F# and A#)
      oscA.frequency.setValueAtTime(370, now);
      oscB.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.setValueAtTime(0.25, now + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      oscA.connect(gain);
      oscB.connect(gain);
      gain.connect(this.masterGain);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(now + 0.35);
      oscB.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  public playCrash(speedImpact: number) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const intensity = Math.min(1, Math.max(0.2, speedImpact / 100));

      // Impact thud (low sine drop)
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      subGain.gain.setValueAtTime(0.4 * intensity, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      sub.connect(subGain);
      subGain.connect(this.masterGain);
      sub.start(now);
      sub.stop(now + 0.25);

      // Metal crunch noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3 * intensity, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
    } catch {
      // Ignore
    }
  }

  public playRadarBeep() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(1400, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  public playMoneyChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Ignore
    }
  }

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  public toggleRadio(): boolean {
    this.initContext();
    this.isRadioPlaying = !this.isRadioPlaying;
    if (this.isRadioPlaying) {
      this.startRadioLoop();
    } else {
      this.stopRadioLoop();
    }
    return this.isRadioPlaying;
  }

  public isRadioOn(): boolean {
    return this.isRadioPlaying;
  }

  private startRadioLoop() {
    if (!this.ctx || !this.masterGain) return;
    this.stopRadioLoop();
    // Synthesizes a subtle rhythmic ethnic/modern synth groove
    const notes = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0]; // Minor Pentatonic / Phrygian
    let step = 0;

    this.radioInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isRadioPlaying || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = step % 4 === 0 ? 'sawtooth' : 'triangle';
      const freq = notes[step % notes.length];
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);

      step = (step + 1) % 16;
    }, 280);
  }

  private stopRadioLoop() {
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  public stopEngine() {
    if (this.osc1) {
      try { this.osc1.stop(); } catch {}
      this.osc1 = null;
    }
    if (this.osc2) {
      try { this.osc2.stop(); } catch {}
      this.osc2 = null;
    }
    if (this.subOsc) {
      try { this.subOsc.stop(); } catch {}
      this.subOsc = null;
    }
    if (this.driftNoiseNode) {
      try { this.driftNoiseNode.stop(); } catch {}
      this.driftNoiseNode = null;
    }
    this.isEngineRunning = false;
    this.stopRadioLoop();
  }
}

export const soundManager = new SoundManager();
