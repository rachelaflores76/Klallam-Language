import { playWord } from "./audio";
import { TUNING } from "./config";

function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(className: string, label: string): HTMLButtonElement {
  const node = make("button", className, label);
  node.type = "button";
  return node;
}

export interface MissedWord {
  klallam: string;
  english: string;
  audioUrl: string;
}

export interface PlayerChoice {
  id: string;
  name: string;
}

export interface GameUi {
  /** The box Phaser draws into. */
  readonly gameParent: HTMLElement;
  /**
   * Lists the saved names. onAdd returns an error to show, or null when the name was
   * added; either way the caller decides what happens next.
   */
  renderPlayers(
    players: readonly PlayerChoice[],
    onPick: (id: string) => void,
    onAdd: (name: string) => string | null
  ): void;
  showPlayerPicker(): void;
  /** Shows the level buttons for the named player. */
  showLevelPicker(playerName: string): void;
  onSwitchPlayer(handler: () => void): void;
  renderLevels(names: readonly string[], onPick: (index: number) => void): void;
  showChooser(): void;
  hideChooser(): void;
  onChangeLevel(handler: () => void): void;
  onReplay(handler: () => void): void;
  onPlayAgain(handler: () => void): void;
  showWord(klallam: string): void;
  clearWord(): void;
  showScore(levelName: string, caught: number, outOf: number): void;
  showSummary(
    caught: number,
    outOf: number,
    missed: readonly MissedWord[],
    levelNote: string
  ): void;
  hideSummary(): void;
}

/** Builds the game's own furniture inside the root it is given, owning nothing outside it. */
export function createUi(root: ShadowRoot | HTMLElement): GameUi {
  const app = make("div");
  app.id = "app";

  const changeLevelButton = button("control change-level", "Change level");
  const banner = make("p", "banner");
  banner.setAttribute("aria-live", "polite");

  const gameParent = make("div");
  gameParent.id = "game";

  const playerTag = make("p", "player-tag");
  const replayButton = button("control", "Hear it again");
  const score = make("p", "score");
  score.setAttribute("aria-live", "polite");
  const controls = make("div", "controls");
  controls.append(playerTag, replayButton, score);

  // The first panel asks who is playing; the second chooses a level.
  const playerList = make("div", "level-buttons");
  const nameInput = make("input", "name-input");
  nameInput.type = "text";
  nameInput.maxLength = 30;
  nameInput.placeholder = "Type your name";
  nameInput.setAttribute("aria-label", "Your name");
  nameInput.autocomplete = "off";
  const addButton = button("control", "Add my name");
  const nameError = make("p", "name-error");
  nameError.setAttribute("aria-live", "polite");
  const addForm = make("form", "add-name");
  addForm.append(nameInput, addButton);
  addButton.type = "submit";
  const playerPanel = make("div", "panel");
  playerPanel.append(
    make("h2", "chooser-title", "Who's playing?"),
    playerList,
    addForm,
    nameError
  );

  const playingAs = make("p", "playing-as");
  const switchPlayerButton = button("control", "Switch player");
  const whoRow = make("div", "who-row");
  whoRow.append(playingAs, switchPlayerButton);
  const levelButtons = make("div", "level-buttons");
  const levelPanel = make("div", "panel");
  levelPanel.append(whoRow, make("h2", "chooser-title", "Choose a level"), levelButtons);

  const overlay = make("div", "start-overlay");
  overlay.append(playerPanel, levelPanel);
  levelPanel.hidden = true;


  const summaryScore = make("h2", "summary-score");
  const summaryLevel = make("p", "summary-lead");
  const summaryLead = make("p", "summary-lead");
  const missedList = make("ul", "missed");
  const playAgainButton = button("start-button", "Play again");
  const summaryChangeLevelButton = button("start-button", "Change level");
  const summaryActions = make("div", "summary-actions");
  summaryActions.append(playAgainButton, summaryChangeLevelButton);
  const summary = make("div", "summary");
  summary.hidden = true;
  summary.append(summaryScore, summaryLevel, summaryLead, missedList, summaryActions);

  app.append(changeLevelButton, banner, gameParent, controls, overlay, summary);
  root.append(app);

  replayButton.hidden = !TUNING.allowAudioReplay;
  changeLevelButton.hidden = true;

  let addHandler: (name: string) => string | null = () => null;
  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = addHandler(nameInput.value);
    nameError.textContent = error ?? "";
    if (error === null) nameInput.value = "";
  });

  return {
    gameParent,
    renderPlayers(players, onPick, onAdd) {
      addHandler = onAdd;
      playerList.replaceChildren(
        ...players.map((player) => {
          // A name is shown as text, never markup.
          const pick = button("start-button", player.name);
          pick.addEventListener("click", () => {
            pick.blur();
            onPick(player.id);
          });
          return pick;
        })
      );
    },
    showPlayerPicker() {
      nameError.textContent = "";
      levelPanel.hidden = true;
      playerPanel.hidden = false;
      overlay.hidden = false;
      changeLevelButton.hidden = true;
    },
    showLevelPicker(playerName) {
      playingAs.textContent = `Playing as ${playerName}`;
      playerTag.textContent = playerName;
      playerPanel.hidden = true;
      levelPanel.hidden = false;
      overlay.hidden = false;
      changeLevelButton.hidden = true;
    },
    onSwitchPlayer(handler) {
      switchPlayerButton.addEventListener("click", () => {
        switchPlayerButton.blur();
        handler();
      });
    },
    renderLevels(names, onPick) {
      levelButtons.replaceChildren(
        ...names.map((name, index) => {
          const level = button("start-button", name);
          level.addEventListener("click", () => {
            // A button keeping focus would swallow the space bar, which the game uses to dive.
            level.blur();
            onPick(index);
          });
          return level;
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
      for (const control of [changeLevelButton, summaryChangeLevelButton]) {
        control.addEventListener("click", () => {
          control.blur();
          handler();
        });
      }
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
          const item = make("li");

          // Built as text, never markup, so no mark can be lost to HTML parsing.
          const klallam = make("span", "missed-klallam", word.klallam);
          const english = make("span", "missed-english", word.english);

          const play = button("control", "Hear it");
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
