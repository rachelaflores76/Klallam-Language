import { TUNING } from "./config";

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`The page is missing an element with id "${id}".`);
  return found as T;
}

export interface GameUi {
  onStart(handler: () => void): void;
  onSkip(handler: () => void): void;
  onReplay(handler: () => void): void;
  showWord(klallam: string): void;
  clearWord(): void;
  showSkip(visible: boolean): void;
  showScore(caught: number, outOf: number): void;
}

export function createUi(): GameUi {
  const overlay = element<HTMLDivElement>("start");
  const startButton = element<HTMLButtonElement>("start-button");
  const banner = element<HTMLParagraphElement>("banner");
  const skipButton = element<HTMLButtonElement>("skip");
  const replayButton = element<HTMLButtonElement>("replay");
  const score = element<HTMLParagraphElement>("score");

  replayButton.hidden = !TUNING.allowAudioReplay;
  skipButton.hidden = true;

  return {
    onStart(handler) {
      startButton.addEventListener("click", () => {
        overlay.hidden = true;
        handler();
      });
    },
    onSkip(handler) {
      skipButton.addEventListener("click", () => {
        // A button keeping focus would swallow the space bar, which the game uses to dive.
        skipButton.blur();
        handler();
      });
    },
    onReplay(handler) {
      replayButton.addEventListener("click", () => {
        replayButton.blur();
        handler();
      });
    },
    showWord(klallam) {
      // Klallam reaches the page only as text content, never as markup.
      banner.textContent = klallam;
    },
    clearWord() {
      banner.textContent = "";
    },
    showSkip(visible) {
      skipButton.hidden = !visible || !TUNING.orcaIntroSkippable;
    },
    showScore(caught, outOf) {
      score.textContent = `Caught ${caught} of ${outOf}`;
    },
  };
}
