const player = new Audio();

export function playWord(url: string): void {
  player.pause();
  player.src = url;
  void player.play().catch((error: unknown) => {
    // Starting a new word interrupts the previous play() promise. That is not a fault.
    if (error instanceof DOMException && error.name === "AbortError") return;
    console.error("Recording did not play:", url, error);
  });
}

let context: AudioContext | null = null;

// Synthesised rather than a sound file, so the game ships no audio of its own
// and nothing competes with the recordings for the player's attention.
export function playCatchChime(): void {
  context ??= new AudioContext();
  const ctx = context;
  const start = ctx.currentTime;
  [660, 990].forEach((frequency, step) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    const at = start + step * 0.09;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.18, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.2);
  });
}
