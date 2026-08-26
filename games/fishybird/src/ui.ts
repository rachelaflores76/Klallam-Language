import { playWord } from "./audio";
import { TUNING } from "./config";

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`The page is missing an element with id "${id}".`);
  return found as T;
}

export interface MissedWord {
  klallam: string;
  english: string;
  audioUrl: string;
}

export interface GameUi {
  renderLevels(names: readonly string[], onPick: (index: number) => void): void;
  showChooser(): void;
  hideChooser(): void;
  onChangeLevel(handler: () => void): void;
  onSkip(handler: () => void): void;  onReplay(handler: () => void): void;
  onPlayAgain(handler: () => void): void;
  showWord(klallam: string): void;
  clearWord(): void;
  showSkip(visible: boolean): void;
  showScore(levelName: string, caught: number, outOf: number): void;
  showSummary(
    caught: number,
    outOf: number,
    missed: readonly MissedWord[],
    levelNote: string
  ): void;
  hideSummary(): void;
}

export function createUi(): GameUi {
  const overlay = element<HTMLDivElement>("start");
  const levelButtons = element<HTMLDivElement>("level-buttons");
  const changeLevelButton = element<HTMLButtonElement>("change-level");
  const banner = element<HTMLParagraphElement>("banner");
  const skipButton = element<HTMLButtonElement>("skip");
  const replayButton = element<HTMLButtonElement>("replay");
  const score = element<HTMLParagraphElement>("score");
  const controls = element<HTMLDivElement>("controls");
  const summary = element<HTMLDivElement>("summary");
  const summaryScore = element<HTMLHeadingElement>("summary-score");
  const summaryLevel = element<HTMLParagraphElement>("summary-level");
  const summaryLead = element<HTMLParagraphElement>("summary-lead");
  const missedList = element<HTMLUListElement>("summary-missed");
  const playAgainButton = element<HTMLButtonElement>("play-again");
  const summaryChangeLevelButton = element<HTMLButtonElement>("summary-change-level");

  replayButton.hidden = !TUNING.allowAudioReplay;
  skipButton.hidden = true;
  changeLevelButton.hidden = true;

  return {
    renderLevels(names, onPick) {
      levelButtons.replaceChildren(
        ...names.map((name, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "start-button";
          button.textContent = name;
          button.addEventListener("click", () => {
            // A button keeping focus would swallow the space bar, which the game uses to dive.
            button.blur();
            onPick(index);
          });
          return button;
        })
      );
    },
    showChooser() {
      overlay.hidden = false;
      changeLevelButton.hidden = true;
    },
    hideChooser() {
      overlay.hidden = true;
      changeLevelButton.hidden = false;
    },
    onChangeLevel(handler) {
      for (const button of [changeLevelButton, summaryChangeLevelButton]) {
        button.addEventListener("click", () => {
          button.blur();
          handler();
        });
      }
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
    showScore(levelName, caught, outOf) {
      score.textContent = `${levelName} - caught ${caught} of ${outOf}`;
    },
    onPlayAgain(handler) {
      playAgainButton.addEventListener("click", () => {
        playAgainButton.blur();
        handler();
      });
    },
    showSummary(caught, outOf, missed, levelNote) {
      summaryScore.textContent = `You caught ${caught} of ${outOf}`;
      summaryLevel.textContent = levelNote;
      summaryLead.textContent =
        missed.length === 0
          ? "Every word. Nothing to go back over."
          : "These ones got away. Listen to them again:";

      missedList.replaceChildren(
        ...missed.map((word) => {
          const item = document.createElement("li");

          const klallam = document.createElement("span");
          klallam.className = "missed-klallam";
          // Built as text, never markup, so no mark can be lost to HTML parsing.
          klallam.textContent = word.klallam;

          const english = document.createElement("span");
          english.className = "missed-english";
          english.textContent = word.english;

          const play = document.createElement("button");
          play.type = "button";
          play.className = "control";
          play.textContent = "Hear it";
          play.addEventListener("click", () => {
            play.blur();
            playWord(word.audioUrl);
          });

          item.append(klallam, english, play);
          return item;
        })
      );

      controls.hidden = true;
      summary.hidden = false;
    },
    hideSummary() {
      summary.hidden = true;
      controls.hidden = false;
    },
  };
}
