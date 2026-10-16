import whoopUrl from "./whoop.mp3";

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

const catchSound = new Audio(whoopUrl);

/** Plays the catch sound and resolves when it finishes (or immediately on error). */
export function playCatchChime(): Promise<void> {
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
