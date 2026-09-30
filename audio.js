// Procedural Web Audio API Soundtrack
// Synthesizes an emotive, music-box / soft acoustic chime & piano score in real-time

class AnimationAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.scheduledNotes = [];
    this.startTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      // Simple soft lowpass to keep audio warm & gentle like a nostalgic vinyl/music box
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(2800, this.ctx.currentTime);

      // Reverb simulation via simple delay feedback
      this.delay = this.ctx.createDelay();
      this.delay.delayTime.setValueAtTime(0.28, this.ctx.currentTime);
      this.feedback = this.ctx.createGain();
      this.feedback.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.delay.connect(this.feedback);
      this.feedback.connect(this.delay);

      this.masterGain.connect(this.filter);
      this.filter.connect(this.ctx.destination);
      this.filter.connect(this.delay);
      this.delay.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, time, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    // Warm envelope
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playPaperRustle(time) {
    if (!this.ctx) return;
    // Filtered noise burst for paper tear / paper plane release
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, time);
    noiseFilter.Q.setValueAtTime(3, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(time);
  }

  start(currentTimeOffset = 0) {
    this.init();
    this.stop();
    this.isPlaying = true;
    const now = this.ctx.currentTime - currentTimeOffset;
    this.startTime = now;

    // Musical composition in F Major / D Minor (Nostalgic, gentle, wonder)
    // Notes: F3=174.61, A3=220, C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392, A4=440, C5=523.25, D5=587.33, F5=698.46
    const melody = [
      // Scene 1: Writing note & paper tear (0.0s - 2.5s)
      { t: 0.2, f: 349.23, d: 1.2, v: 0.25 }, // F4
      { t: 0.7, f: 440.00, d: 1.0, v: 0.25 }, // A4
      { t: 1.2, f: 523.25, d: 1.4, v: 0.28 }, // C5
      { t: 1.8, f: 440.00, d: 0.9, v: 0.20 }, // A4
      { t: 2.1, f: 392.00, d: 0.8, v: 0.22 }, // G4
      { t: 2.3, rustle: true },

      // Scene 2: Girl folding & launching airplane (2.5s - 4.5s)
      { t: 2.6, f: 261.63, d: 1.5, v: 0.22, type: 'triangle' }, // C4 bass
      { t: 2.8, f: 349.23, d: 1.0, v: 0.24 }, // F4
      { t: 3.3, f: 392.00, d: 0.8, v: 0.25 }, // G4
      { t: 3.8, f: 523.25, d: 1.2, v: 0.28 }, // C5
      { t: 4.2, f: 587.33, d: 1.5, v: 0.32 }, // D5 (launch soar)

      // Scene 3 & 4: Night sky & Claude catches note (4.5s - 7.5s)
      { t: 4.6, f: 220.00, d: 2.2, v: 0.25, type: 'triangle' }, // A3 bass
      { t: 4.9, f: 440.00, d: 1.2, v: 0.22 }, // A4
      { t: 5.4, f: 523.25, d: 1.1, v: 0.24 }, // C5
      { t: 6.0, f: 659.25, d: 1.6, v: 0.28 }, // E5
      { t: 6.6, f: 698.46, d: 1.8, v: 0.30 }, // F5 (Claude reads)
      { t: 7.0, f: 523.25, d: 1.0, v: 0.22 }, // C5

      // Scene 5: Montage - Words, Trees, Rain, The Stars (7.5s - 11.2s)
      // 5a: Words (7.5s)
      { t: 7.5, f: 349.23, d: 0.8, v: 0.24 }, // F4
      { t: 7.8, f: 440.00, d: 0.7, v: 0.22 }, // A4
      { t: 8.1, f: 523.25, d: 0.7, v: 0.24 }, // C5

      // 5b: Trees (8.5s)
      { t: 8.5, f: 293.66, d: 0.8, v: 0.25 }, // D4
      { t: 8.8, f: 392.00, d: 0.7, v: 0.22 }, // G4
      { t: 9.1, f: 587.33, d: 0.8, v: 0.26 }, // D5

      // 5c: Rain (9.4s)
      { t: 9.4, f: 261.63, d: 0.8, v: 0.24 }, // C4
      { t: 9.7, f: 349.23, d: 0.6, v: 0.22 }, // F4
      { t: 10.0, f: 523.25, d: 0.7, v: 0.25 }, // C5

      // 5d: The Stars (10.3s)
      { t: 10.3, f: 392.00, d: 0.8, v: 0.26 }, // G4
      { t: 10.6, f: 587.33, d: 0.7, v: 0.28 }, // D5
      { t: 10.9, f: 783.99, d: 1.2, v: 0.32 }, // G5 (sparkle)

      // Scene 6: Big Pink Heart explosion (11.2s - 13.0s)
      { t: 11.2, f: 174.61, d: 2.5, v: 0.30, type: 'triangle' }, // F3 warm root
      { t: 11.3, f: 349.23, d: 1.8, v: 0.28 }, // F4
      { t: 11.6, f: 440.00, d: 1.5, v: 0.28 }, // A4
      { t: 11.9, f: 523.25, d: 1.6, v: 0.30 }, // C5
      { t: 12.3, f: 698.46, d: 2.0, v: 0.34 }, // F5 climax of heart
      { t: 12.7, f: 587.33, d: 1.2, v: 0.25 }, // D5

      // Scene 7: Claude folds note & sends it back (13.0s - 14.2s)
      { t: 13.1, f: 261.63, d: 1.5, v: 0.22, type: 'triangle' }, // C4
      { t: 13.3, f: 523.25, d: 1.0, v: 0.25 }, // C5
      { t: 13.6, f: 440.00, d: 0.9, v: 0.22 }, // A4
      { t: 13.9, f: 392.00, d: 1.0, v: 0.22 }, // G4
      { t: 14.1, rustle: true },

      // Scene 8 & 9: Girl unfolds note ("you") & town at night (14.2s - 16.0s)
      { t: 14.3, f: 174.61, d: 3.5, v: 0.28, type: 'triangle' }, // F3 low resolve
      { t: 14.4, f: 349.23, d: 2.5, v: 0.28 }, // F4
      { t: 14.7, f: 440.00, d: 2.2, v: 0.26 }, // A4
      { t: 15.0, f: 523.25, d: 2.8, v: 0.32 }, // C5 (warm revelation)
      { t: 15.3, f: 698.46, d: 3.0, v: 0.28 }, // F5 gentle twinkle finish
    ];

    melody.forEach((note) => {
      const targetTime = now + note.t;
      if (targetTime >= this.ctx.currentTime) {
        if (note.rustle) {
          this.playPaperRustle(targetTime);
        } else {
          this.playTone(note.f, targetTime, note.d, note.type || 'sine', note.v);
        }
      }
    });
  }

  stop() {
    this.isPlaying = false;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime + 0.05);
    }
  }

  setVolume(vol) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }
}

window.AnimationAudio = AnimationAudio;
