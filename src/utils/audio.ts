/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer for high-reliability, zero-latency offline sounds
class SoundFX {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceEnabled: boolean = true;

  private speechRate: number = 1.15;

  constructor() {
    // Load preferences
    try {
      const s = localStorage.getItem('violympic_sound_enabled');
      if (s !== null) this.soundEnabled = s === 'true';
      const v = localStorage.getItem('violympic_voice_enabled');
      if (v !== null) this.voiceEnabled = v === 'true';
      const r = localStorage.getItem('violympic_speech_rate');
      if (r !== null) {
        const parsedRate = parseFloat(r);
        if (!isNaN(parsedRate) && parsedRate >= 0.8 && parsedRate <= 1.6) {
          this.speechRate = parsedRate;
        }
      }
    } catch {
      // LocalStorage fallback
    }
  }

  public getSpeechRate(): number {
    return this.speechRate;
  }

  public setSpeechRate(rate: number): void {
    this.speechRate = Math.max(0.8, Math.min(1.6, rate));
    try {
      localStorage.setItem('violympic_speech_rate', String(this.speechRate));
    } catch {}
  }

  private initCtx(): AudioContext | null {
    if (!this.soundEnabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('violympic_sound_enabled', String(enabled));
    } catch {}
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
    try {
      localStorage.setItem('violympic_voice_enabled', String(enabled));
    } catch {}
    if (!enabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Soft click / tap sound
  public playClick(): void {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Cheerful chime when correct
  public playCorrect(): void {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
      });
    } catch {}
  }

  // Gentle, friendly low tone when incorrect (encouraging, not jarring)
  public playIncorrect(): void {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const notes = [311.13, 277.18]; // Eb4 -> Db4
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.14 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.24);
      });
    } catch {}
  }

  // Card match / item placed sound
  public playMatch(): void {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const notes = [587.33, 880]; // D5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.07 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.2);
      });
    } catch {}
  }

  // Victory fanfare for completing round or test
  public playVictory(): void {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + (idx === 4 ? 0.6 : 0.25));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + (idx === 4 ? 0.65 : 0.3));
      });
    } catch {}
  }

  // Speak question text in Vietnamese for primary schoolers
  public speakText(text: string): void {
    if (!this.voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      if (!text) return;

      // Clean special math characters to sound snappy and natural in Vietnamese
      const spokenText = text
        .replace(/(\d+)\s*cm\b/gi, '$1 xăng-ti-mét')
        .replace(/(\d+)\s*dm\b/gi, '$1 đề-xi-mét')
        .replace(/(\d+)\s*kg\b/gi, '$1 ki-lô-gam')
        .replace(/(\d+)\s*l\b/gi, '$1 lít')
        .replace(/\+/g, ' cộng ')
        .replace(/-/g, ' trừ ')
        .replace(/=/g, ' bằng ')
        .replace(/</g, ' bé hơn ')
        .replace(/>/g, ' lớn hơn ')
        .replace(/\?/g, ' mấy ')
        .replace(/\.{2,}/g, ' bao nhiêu ')
        .replace(/_{2,}/g, ' bao nhiêu ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'vi-VN';
      utterance.rate = this.speechRate; // Energetic, snappy, natural pace (1.15x)
      utterance.pitch = 1.05;

      // Try finding a Vietnamese voice if available
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.lang.includes('VN'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback
    }
  }

  public stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundManager = new SoundFX();
