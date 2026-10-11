/**
 * Web Audio Horror Sound Synthesizer
 * Generates eerie ambient drones, accelerating heartbeats, EMF radio static,
 * footstep rustles, door creaks, ghost shrieks, and jumpscares using pure Web Audio API.
 */

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private staticGain: GainNode | null = null;
  private staticNode: AudioBufferSourceNode | null = null;
  
  // Heartbeat state
  private heartbeatInterval: number | null = null;
  private currentBpm: number = 70;
  private lastHeartbeatTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupAmbience();
      this.setupStaticNoise();
      this.startHeartbeatLoop();
    } catch {
      // Audio not supported or blocked
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : 0.12, this.ctx?.currentTime || 0);
    }
    if (this.staticGain && muted) {
      this.staticGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  private setupAmbience() {
    if (!this.ctx) return;
    try {
      const masterAmbience = this.ctx.createGain();
      masterAmbience.gain.value = this.isMuted ? 0 : 0.12;

      // Filter for dark, deep rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 160;

      // Slow sub-bass drone oscillator 1 (48Hz)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 48;

      // Detuned oscillator 2 (49.4Hz) creates slow terrifying beating
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 49.4;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterAmbience);
      masterAmbience.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.ambientOsc1 = osc1;
      this.ambientOsc2 = osc2;
      this.ambientGain = masterAmbience;
    } catch {
      // Ignore
    }
  }

  private setupStaticNoise() {
    if (!this.ctx) return;
    try {
      // Generate 2 seconds of white noise buffer and loop it
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter to sound like an old radio / EVP recorder
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1800;
      bandpass.Q.value = 2.0;

      const gain = this.ctx.createGain();
      gain.gain.value = 0; // Starts silent, increases with ghost proximity

      whiteNoise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();

      this.staticNode = whiteNoise;
      this.staticGain = gain;
    } catch {
      // Ignore
    }
  }

  /**
   * Updates proximity effects: Ghost distance modulates static noise and heartbeat BPM
   */
  public updateProximity(closestGhostDist: number, playerSanity: number, isChasing: boolean) {
    if (!this.ctx || this.isMuted) return;

    // Static volume increases dramatically when ghost is within 10 units
    if (this.staticGain) {
      let targetStatic = 0;
      if (closestGhostDist < 9.0) {
        // Range 0 to 0.25
        const intensity = 1 - (closestGhostDist / 9.0);
        targetStatic = Math.min(0.28, Math.pow(intensity, 1.4) * 0.28);
        if (isChasing) {
          targetStatic = Math.min(0.35, targetStatic * 1.5 + 0.08);
        }
      }
      this.staticGain.gain.setTargetAtTime(targetStatic, this.ctx.currentTime, 0.15);
    }

    // Heartbeat BPM ranges from 60 (calm) to 160 (chased/terrified)
    let targetBpm = 65;
    const fearFromDist = closestGhostDist < 12 ? (1 - closestGhostDist / 12) * 60 : 0;
    const fearFromSanity = (1 - playerSanity / 100) * 45;
    const fearFromChase = isChasing ? 35 : 0;
    targetBpm = Math.min(160, Math.round(65 + fearFromDist + fearFromSanity + fearFromChase));

    this.currentBpm = targetBpm;
  }

  private startHeartbeatLoop() {
    const checkBeat = () => {
      const now = performance.now();
      const intervalMs = (60 / this.currentBpm) * 1000;

      if (now - this.lastHeartbeatTime >= intervalMs) {
        this.lastHeartbeatTime = now;
        if (!this.isMuted && this.currentBpm > 75) {
          this.playHeartbeatThud();
        }
      }
      requestAnimationFrame(checkBeat);
    };
    requestAnimationFrame(checkBeat);
  }

  private playHeartbeatThud() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Double beat: lub-dub
      const playPulse = (delay: number, pitch: number, gainLvl: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now + delay);
        osc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.12);

        gain.gain.setValueAtTime(gainLvl, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      };

      const volumeScale = Math.min(0.4, (this.currentBpm - 65) / 95 * 0.35 + 0.05);
      playPulse(0, 58, volumeScale);
      playPulse(0.12, 50, volumeScale * 0.7);
    } catch {
      // Ignore
    }
  }

  public playFootstep(isSprinting: boolean) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

      filter.type = 'lowpass';
      filter.frequency.value = isSprinting ? 240 : 180;

      const vol = isSprinting ? 0.08 : 0.04;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  public playFlashlightClick(turnOn: boolean) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(turnOn ? 900 : 700, now);
      osc.frequency.setValueAtTime(turnOn ? 1400 : 450, now + 0.02);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  public playKeyPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Metallic resonant chime
      [880, 1320, 1760].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.5);
      });
    } catch {
      // Ignore
    }
  }

  public playDoorCreak(isUnlocked: boolean) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isUnlocked ? 120 : 60, now);
      osc.frequency.linearRampToValueAtTime(isUnlocked ? 220 : 90, now + 0.35);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      // Ignore
    }
  }

  public playDoorLocked() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy metal clunk rattle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.setValueAtTime(70, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  public playGhostScream() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Blood-curdling slide upwards then flutter downwards
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.3);
      osc.frequency.linearRampToValueAtTime(450, now + 0.8);

      filter.type = 'highpass';
      filter.frequency.value = 350;

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // Ignore
    }
  }

  public playJumpscareSting() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      
      // Harsh discordant cluster
      [110, 116, 233, 466, 932].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.7);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.85);
      });

      // Low bass impact thud
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(90, now);
      bass.frequency.exponentialRampToValueAtTime(20, now + 0.5);

      bassGain.gain.setValueAtTime(0.5, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bass.start(now);
      bass.stop(now + 0.65);
    } catch {
      // Ignore
    }
  }

  public playItemUse() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Syringe / medicine relief sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // Ignore
    }
  }

  public playVictoryBells() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Distant stormy bells / dawn relief
      [440, 554, 659, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);

        gain.gain.setValueAtTime(0.15, now + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 1.3);
      });
    } catch {
      // Ignore
    }
  }

  public stopAll() {
    if (this.ambientGain) {
      this.ambientGain.gain.value = 0;
    }
    if (this.staticGain) {
      this.staticGain.gain.value = 0;
    }
  }
}

export const horrorAudio = new HorrorAudioEngine();
