/**
 * Hospital Sound Synthesizer & Voice Announcer using Web Audio API and SpeechSynthesis.
 * Generates an authentic two-tone hospital chime without external audio assets.
 */

class AudioAnnouncer {
  private audioCtx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public speechEnabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a 2-tone melodic hospital chime (Ding-Dong: E5 -> C5 or G4 -> C5)
   */
  public playHospitalChime(): Promise<void> {
    if (!this.soundEnabled) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const ctx = this.getContext();
        if (!ctx) return resolve();

        const now = ctx.currentTime;

        // Tone 1 (High bell - 659.25 Hz / E5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.25, now + 0.04);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.6);

        // Tone 2 (Resolving bell - 523.25 Hz / C5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(523.25, now + 0.35);

        gain2.gain.setValueAtTime(0, now + 0.35);
        gain2.gain.linearRampToValueAtTime(0.3, now + 0.39);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now + 0.35);
        osc2.stop(now + 1.3);

        setTimeout(resolve, 800);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Speaks the patient token callout: "Token M-E-D zero forty two, please proceed to Room 104"
   */
  public announceToken(tokenNumber: string, roomNumber: string): void {
    if (!this.soundEnabled) return;

    this.playHospitalChime().then(() => {
      if (!this.speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

      try {
        window.speechSynthesis.cancel(); // Stop prior announcements

        // Format token for clear phonetic speech: "M E D - 0 4 2"
        const [prefix, num] = tokenNumber.split('-');
        const spelledPrefix = prefix ? prefix.split('').join(' ') : 'Token';
        const formattedNum = num ? num.split('').join(' ') : tokenNumber;

        const phrase = `Token ${spelledPrefix}, ${formattedNum}. Please proceed to ${roomNumber}.`;
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 0.9;
        utterance.pitch = 1.05;
        utterance.lang = 'en-IN'; // Indian English voice if available

        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback silently if speech synthesis is blocked
      }
    });
  }
}

export const announcer = new AudioAnnouncer();
