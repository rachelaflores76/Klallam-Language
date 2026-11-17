import { playWord } from "./audio";
import { TUNING } from "./config";
import type { ProgressSummary } from "./progress";

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
  onShowProgress(handler: () => void): void;
  showProgress(summary: ProgressSummary): void;
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
  const progressButton = button("control", "My Progress");
  levelPanel.append(
    whoRow,
    make("h2", "chooser-title", "Choose a level"),
    levelButtons,
    progressButton
  );

  const progressTitle = make("h2", "chooser-title");
  const progressBody = make("div", "progress-body");
  const progressBack = button("start-button", "Back");
  const progressPanel = make("div", "panel progress-panel");
  progressPanel.append(progressTitle, progressBody, progressBack);

  const overlay = make("div", "start-overlay");
  overlay.append(playerPanel, levelPanel, progressPanel);
  levelPanel.hidden = true;
  progressPanel.hidden = true;
  progressBack.addEventListener("click", () => {
    progressBack.blur();
    progressPanel.hidden = true;
    levelPanel.hidden = false;
  });


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
      progressPanel.hidden = true;
      playerPanel.hidden = false;
      overlay.hidden = false;
      changeLevelButton.hidden = true;
    },
    showLevelPicker(playerName) {
      playingAs.textContent = `Playing as ${playerName}`;
      playerTag.textContent = playerName;
      playerPanel.hidden = true;
      progressPanel.hidden = true;
      levelPanel.hidden = false;
      overlay.hidden = false;
      changeLevelButton.hidden = true;
    },
    onShowProgress(handler) {
      progressButton.addEventListener("click", () => {
        progressButton.blur();
        handler();
      });
    },
    showProgress(summary) {
      progressTitle.textContent = `${summary.playerName}'s progress`;
      progressBody.replaceChildren(...progressContent(summary));
      levelPanel.hidden = true;
      playerPanel.hidden = true;
      progressPanel.hidden = false;
      overlay.hidden = false;
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
      score.textContent = `${levelName} - ${caught} of ${outOf} on the first try`;
    },
    onPlayAgain(handler) {
      playAgainButton.addEventListener("click", () => {
        playAgainButton.blur();
        handler();
      });
    },
    showSummary(caught, outOf, missed, levelNote) {
      summaryScore.textContent = `${caught} of ${outOf} on the first try`;
      summaryLevel.textContent = levelNote;
      summaryLead.textContent =
        missed.length === 0
          ? "Every word. Nothing to go back over."
          : "Practice these again. Each one got away or took more than one try:";

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

function progressContent(summary: ProgressSummary): HTMLElement[] {
  if (summary.roundsPlayed === 0) {
    return [make("p", "summary-lead", "No rounds yet. Play a round and come back!")];
  }
  const latest = summary.chart[summary.chart.length - 1] ?? 0;
  const best = Math.max(...summary.levels.map((level) => level.best));
  const stats = make("div", "stats");
  for (const [label, value] of [
    ["Rounds played", String(summary.roundsPlayed)],
    ["Latest score", `${latest}%`],
    ["Best score", `${best}%`],
  ] as const) {
    const stat = make("div", "stat");
    stat.append(make("span", "stat-value", value), make("span", "stat-label", label));
    stats.append(stat);
  }

  const chartTitle = make("h3", "progress-heading", "Percent caught, round by round");

  const table = make("table", "progress-table");
  const head = make("tr");
  for (const title of ["Level", "Rounds", "Best", "Latest"]) head.append(make("th", undefined, title));
  table.append(head);
  for (const level of summary.levels) {
    const row = make("tr");
    row.append(
      make("td", undefined, level.level),
      make("td", undefined, String(level.rounds)),
      make("td", undefined, `${level.best}%`),
      make("td", undefined, `${level.latest}%`)
    );
    table.append(row);
  }

  const recent = make("ul", "recent");
  for (const round of summary.recent) {
    recent.append(
      make("li", undefined, `${round.when} - ${round.level} - ${round.caught} of ${round.outOf}`)
    );
  }

  const note =
    summary.scoringChangedAt === null
      ? []
      : [
          make(
            "p",
            "scoring-note",
            "The dashed line marks when scoring changed. Rounds to its left counted a fish " +
              "caught on a second try; rounds to its right count first tries only, so a " +
              "small dip there is expected."
          ),
        ];

  return [
    stats,
    chartTitle,
    chart(summary.chart, summary.scoringChangedAt),
    ...note,
    make("h3", "progress-heading", "By level"),
    table,
    make("h3", "progress-heading", "Recent rounds"),
    recent,
  ];
}

const SVG = "http://www.w3.org/2000/svg";

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  return node;
}

/** A line of percent caught per round, oldest on the left. */
function chart(values: readonly number[], changedAt: number | null): HTMLElement {
  const width = 600;
  const height = 200;
  const left = 44;
  const right = 12;
  const top = 12;
  const bottom = 28;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const x = (i: number) => left + (values.length === 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
  const y = (v: number) => top + plotH - (v / 100) * plotH;

  const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart", role: "img" });
  root.setAttribute("aria-label", `Percent caught in the last ${values.length} rounds`);
  for (const mark of [0, 50, 100]) {
    root.append(
      svg("line", { x1: left, x2: width - right, y1: y(mark), y2: y(mark), class: "chart-grid" })
    );
    const label = svg("text", { x: left - 8, y: y(mark) + 4, class: "chart-label", "text-anchor": "end" });
    label.textContent = `${mark}%`;
    root.append(label);
  }
  const first = svg("text", { x: left, y: height - 8, class: "chart-label" });
  first.textContent = "Earlier";
  const last = svg("text", { x: width - right, y: height - 8, class: "chart-label", "text-anchor": "end" });
  last.textContent = "Latest";
  root.append(first, last);

  if (changedAt !== null && values.length > 1) {
    // Halfway between the last old-scoring round and the first new one.
    const at = (x(changedAt - 1) + x(changedAt)) / 2;
    root.append(svg("line", { x1: at, x2: at, y1: top, y2: top + plotH, class: "chart-change" }));
  }

  if (values.length > 1) {
    root.append(
      svg("polyline", {
        points: values.map((v, i) => `${x(i)},${y(v)}`).join(" "),
        class: "chart-line",
      })
    );
  }
  values.forEach((v, i) => root.append(svg("circle", { cx: x(i), cy: y(v), r: 5, class: "chart-dot" })));

  const box = make("div", "chart-box");
  box.append(root);
  return box;
}
