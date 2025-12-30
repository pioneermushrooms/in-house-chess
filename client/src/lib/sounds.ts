// Chess sound effects using Web Audio API
class ChessSounds {
  private audioContext: AudioContext | null = null;

  private initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    this.initAudio();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  move() {
    // Soft click sound for regular moves
    this.playTone(400, 0.05, 0.2);
  }

  capture() {
    // Slightly louder and lower tone for captures
    this.playTone(300, 0.08, 0.3);
  }

  check() {
    // Higher pitched alert for check
    this.playTone(800, 0.1, 0.25);
  }

  gameEnd() {
    // Victory/defeat fanfare
    this.playTone(523, 0.15, 0.3);
    setTimeout(() => this.playTone(659, 0.15, 0.3), 150);
    setTimeout(() => this.playTone(784, 0.3, 0.3), 300);
  }

  error() {
    // Error buzz
    this.playTone(200, 0.2, 0.2);
  }
}

export const chessSounds = new ChessSounds();
