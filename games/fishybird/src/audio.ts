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

export function playCatchChime(): void {
  catchSound.currentTime = 0;
  void catchSound.play().catch((error: unknown) => {
    console.error("Catch sound did not play:", error);
  });
}
