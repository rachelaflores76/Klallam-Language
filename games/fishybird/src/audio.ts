import whoopUrl from "./whoop.mp3";
import { soundOn } from "./sound";

const player = new Audio();

/**
 * Plays a word's recording. With sound switched off, only a recording the player asked
 * for (the "Hear it again" button) plays; nothing plays on its own.
 */
export function playWord(url: string, requested = false): void {
  if (!requested && !soundOn()) return;
  player.pause();
  player.src = url;
  void player.play().catch((error: unknown) => {
    // Starting a new word interrupts the previous play() promise. That is not a fault.
    if (error instanceof DOMException && error.name === "AbortError") return;
    console.error("Recording did not play:", url, error);
  });
}

// The catch sound is switched off while a new one is being made. To bring a sound
// back, set this to true (and swap whoop.mp3 for the new file if there is one).
const CATCH_SOUND_ON = false;
// With no sound to wait for, the next word still waits this long after a catch.
const SILENT_PAUSE_MS = 1000;

const catchSound = new Audio(whoopUrl);

/** Plays the catch sound and resolves when it finishes (or immediately on error). */
export function playCatchChime(): Promise<void> {
  if (!CATCH_SOUND_ON || !soundOn()) {
    return new Promise((resolve) => setTimeout(resolve, SILENT_PAUSE_MS));
  }
  catchSound.currentTime = 0;
  return new Promise((resolve) => {
    const done = () => resolve();
    catchSound.addEventListener("ended", done, { once: true });
    catchSound.play().catch(() => {
      catchSound.removeEventListener("ended", done);
      resolve();
    });
  });
}
