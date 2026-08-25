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
  onNext(handler: () => void): void;
  showWord(klallam: string): void;
  clearWord(): void;
  showSkip(visible: boolean): void;
}

export function createUi(): GameUi {
  const overlay = element<HTMLDivElement>("start");
  const startButton = element<HTMLButtonElement>("start-button");
  const banner = element<HTMLParagraphElement>("banner");
  const skipButton = element<HTMLButtonElement>("skip");
  const replayButton = element<HTMLButtonElement>("replay");
  const nextButton = element<HTMLButtonElement>("next");

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
      skipButton.addEventListener("click", handler);
    },
    onReplay(handler) {
      replayButton.addEventListener("click", handler);
    },
    onNext(handler) {
      nextButton.addEventListener("click", handler);
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
  };
}
