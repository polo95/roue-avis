class WheelSound {
  constructor() {
    this.audioContext = null;
    this.tickTimeouts = [];
    this.isRunning = false;
  }

  init() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.audioContext = new AudioCtx();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return true;
  }

  playTick(volume = 0.35) {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(180 + Math.random() * 80, now);
    oscillator.frequency.exponentialRampToValueAtTime(60, now + 0.04);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.06);
  }

  playWhoosh() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    source.start(now);
    source.stop(now + 0.15);
  }

  startSpin(durationMs = 3000) {
    this.stop();
    if (!this.init()) return;

    this.isRunning = true;
    this.playWhoosh();

    const tickCount = 28;
    const intervals = [];

    for (let i = 0; i < tickCount; i += 1) {
      const progress = i / (tickCount - 1);
      const eased = progress * progress;
      intervals.push(40 + eased * 220);
    }

    let elapsed = 0;
    intervals.forEach((delay, index) => {
      elapsed += delay;
      if (elapsed > durationMs) return;

      const timeoutId = setTimeout(() => {
        if (!this.isRunning) return;
        const volume = 0.15 + (1 - index / tickCount) * 0.25;
        this.playTick(volume);
      }, elapsed);

      this.tickTimeouts.push(timeoutId);
    });
  }

  stop() {
    this.isRunning = false;
    this.tickTimeouts.forEach(clearTimeout);
    this.tickTimeouts = [];
  }
}

const wheelSound = new WheelSound();

export default wheelSound;
