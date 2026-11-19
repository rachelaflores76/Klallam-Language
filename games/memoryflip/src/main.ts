import { registerGame } from "@klallam/game-kit";
import type { LexiconEntry } from "@klallam/lexicon";
import styles from "./style.css?inline";

interface Size {
  name: string;
  pairs: number;
}

const CONFETTI_COLOURS = ["#7b5cff", "#ff5c8a", "#ffb020", "#18c29c", "#2f9bff", "#ff7a3d"];

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A small burst of confetti from a point inside a positioned box. */
function confetti(box: HTMLElement, x: number, y: number, pieces: number, spread: number): void {
  if (reducedMotion()) return;
  for (let i = 0; i < pieces; i += 1) {
    const piece = element("span", "confetti");
    const angle = Math.random() * Math.PI * 2;
    const distance = spread * (0.5 + Math.random() * 0.7);
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = CONFETTI_COLOURS[i % CONFETTI_COLOURS.length] ?? "#7b5cff";
    piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * distance - spread * 0.3}px`);
    piece.style.setProperty("--r", `${Math.round(Math.random() * 720 - 360)}deg`);
    piece.addEventListener("animationend", () => piece.remove());
    box.append(piece);
  }
}

function clock(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const POINTS_PER_PAIR = 10;
const BEST_KEY = "best.v1";

/** Matches the card turn in style.css. */
const FLIP_TIME = 450;

/** How long a wrong pair stays face up before turning back over. */
const WRONG_PAIR_PAUSE = 1100;

function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

const SIZES: readonly Size[] = [
  { name: "Easy", pairs: 4 },
  { name: "Medium", pairs: 6 },
  { name: "Hard", pairs: 8 },
];

function element(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(className: string, text: string): HTMLButtonElement {
  const node = element("button", className, text) as HTMLButtonElement;
  node.type = "button";
  return node;
}

/** Two words meaning the same thing would make a right pair look wrong. */
function oneWordPerMeaning(words: readonly LexiconEntry[]): LexiconEntry[] {
  const seen = new Set<string>();
  return words.filter((entry) => {
    if (seen.has(entry.english)) return false;
    seen.add(entry.english);
    return true;
  });
}

registerGame({
  id: "memoryflip",
  name: "Memory Flip",
  icon: "\u{1F0CF}",
  layout: "panel",
  start(context) {
    const sheet = document.createElement("style");
    sheet.textContent = styles;

    // The site hands this game only words with a recording, so every Klallam card speaks.
    const usable = oneWordPerMeaning(context.words().filter((entry) => context.canPlay(entry)));
    if (usable.length < 2) {
      context.root.append(
        sheet,
        element("p", "empty", "Memory Flip needs at least two words with recordings.")
      );
      return;
    }

    const body = element("div", "memoryflip");
    const byId = new Map(usable.map((entry) => [entry.id, entry]));

    // One sound setting per device, kept under this game's own storage.
    const SOUND_KEY = "sound.v1";
    const soundOn = (): boolean => context.storage.read(SOUND_KEY) !== false;
    function soundButton(): HTMLButtonElement {
      const toggle = button("small sound", "");
      const show = () => {
        toggle.textContent = soundOn() ? "\u{1F50A} Sound: On" : "\u{1F507} Sound: Off";
        toggle.setAttribute("aria-pressed", String(soundOn()));
      };
      show();
      toggle.addEventListener("click", () => {
        context.storage.write(SOUND_KEY, !soundOn());
        show();
      });
      return toggle;
    }
    const timers = new Set<number>();
    const wait = (run: () => void, ms: number): void => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        run();
      }, ms);
      timers.add(id);
    };

    function chooseSize(): void {
      const sizes = element("div", "sizes");
      for (const size of SIZES) {
        const pairs = Math.min(size.pairs, usable.length);
        const pick = button("size", `${size.name} - ${pairs} pairs`);
        pick.addEventListener("click", () => play(size, pairs));
        sizes.append(pick);
      }
      body.replaceChildren(
        element("h2", "title", "Memory Flip"),
        element("p", "lead", "Flip two cards at a time. Find each Klallam word and its meaning!"),
        sizes,
        soundButton()
      );
    }

    function play(size: Size, pairCount: number): void {
      const words = shuffle(usable).slice(0, pairCount);
      let moves = 0;
      let matched = 0;
      let first: HTMLButtonElement | null = null;
      let busy = false;
      let startedAt: number | null = null;

      const movesText = element("span", "stat", "Moves: 0");
      const matchedText = element("span", "stat", `Pairs: 0 / ${pairCount}`);
      const status = element("div", "status");
      status.append(movesText, matchedText);

      const grid = element("div", `grid pairs-${pairCount}`);
      const board = element("div", "board");
      board.append(grid);
      const cards = shuffle(
        words.flatMap((entry) => [
          { entry, side: "klallam" as const },
          { entry, side: "english" as const },
        ])
      );
      for (const { entry, side } of cards) {
        const card = button(`card ${side}`, "");
        card.dataset["word"] = entry.id;
        card.setAttribute("aria-label", "Face-down card");
        const inner = element("span", "inner");
        const back = element("span", "back");
        // Built as text, never markup, so no Klallam mark can be lost to HTML parsing.
        const front = element("span", "front", side === "klallam" ? entry.klallam : entry.english);
        inner.append(back, front);
        card.append(inner);
        card.addEventListener("click", () => flip(card));
        grid.append(card);
      }

      function turnUp(card: HTMLButtonElement): void {
        card.classList.add("up");
        card.setAttribute("aria-label", card.querySelector(".front")?.textContent ?? "");
      }

      function turnDown(card: HTMLButtonElement): void {
        card.classList.remove("up");
        card.setAttribute("aria-label", "Face-down card");
      }

      function flip(card: HTMLButtonElement): void {
        if (busy || card.classList.contains("up")) return;
        startedAt ??= Date.now();
        turnUp(card);
        const entry = byId.get(card.dataset["word"] ?? "");
        if (card.classList.contains("klallam") && entry !== undefined && soundOn()) {
          context.playRecording(entry);
        }
        if (first === null) {
          first = card;
          return;
        }
        const a = first;
        first = null;
        moves += 1;
        movesText.textContent = `Moves: ${moves}`;

        if (a.dataset["word"] === card.dataset["word"]) {
          a.disabled = true;
          card.disabled = true;
          matched += 1;
          matchedText.textContent = `Pairs: ${matched} / ${pairCount}`;
          context.awardPoints(POINTS_PER_PAIR);
          // Celebrate once the second card has finished turning, so the bounce never
          // catches it mid-flip.
          wait(() => {
            a.classList.add("matched");
            card.classList.add("matched");
            const boardBox = board.getBoundingClientRect();
            for (const pair of [a, card]) {
              const spot = pair.getBoundingClientRect();
              confetti(
                board,
                spot.left - boardBox.left + spot.width / 2,
                spot.top - boardBox.top + spot.height / 2,
                14,
                70
              );
            }
          }, FLIP_TIME);
          if (matched === pairCount) {
            context.finish({ score: pairCount, outOf: pairCount });
            finished(size, pairCount, moves, Date.now() - (startedAt ?? Date.now()));
          }
          return;
        }

        busy = true;
        a.classList.add("wrong");
        card.classList.add("wrong");
        wait(() => {
          a.classList.remove("wrong");
          card.classList.remove("wrong");
          turnDown(a);
          turnDown(card);
          busy = false;
        }, WRONG_PAIR_PAUSE);
      }

      const sizesButton = button("small", "Change size");
      sizesButton.addEventListener("click", chooseSize);
      const top = element("div", "top");
      const buttons = element("div", "status");
      buttons.append(soundButton(), sizesButton);
      top.append(status, buttons);
      body.replaceChildren(top, board);
    }

    /** Fewest moves so far for each size on this device. */
    function bests(): Record<string, number> {
      const stored = context.storage.read(BEST_KEY);
      if (typeof stored !== "object" || stored === null) return {};
      const out: Record<string, number> = {};
      for (const [name, value] of Object.entries(stored as Record<string, unknown>)) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) out[name] = value;
      }
      return out;
    }

    function finished(size: Size, pairCount: number, moves: number, ms: number): void {
      // Keyed by size and pairs, so a smaller board never competes with a full one.
      const key = `${size.name}-${pairCount}`;
      const saved = bests();
      const previous = saved[key];
      const newBest = previous === undefined || moves < previous;
      if (newBest) {
        saved[key] = moves;
        context.storage.write(BEST_KEY, saved);
      }
      const bestLine = newBest
        ? previous === undefined
          ? `First ${size.name} game! Your best is ${moves} moves. Can you beat it?`
          : `New best! ${moves} moves beats your old best of ${previous}.`
        : `Your best for ${size.name} is ${previous} moves. Try again to beat it!`;

      const again = button("size", "Play again");
      again.addEventListener("click", () => play(size, pairCount));
      const sizes = button("small", "Change size");
      sizes.addEventListener("click", chooseSize);
      const results = element("div", "results");
      for (const [value, label] of [
        [String(pairCount), "pairs"],
        [String(moves), "moves"],
        [clock(ms), "time"],
      ] as const) {
        const result = element("div", "result");
        result.append(element("strong", "", value), element("span", "", label));
        results.append(result);
      }
      const done = element("div", "done");
      done.append(
        element("div", "big", "\u{1F389}"),
        element("h2", "title", "All matched!"),
        results,
        element("p", newBest ? "best new" : "best", bestLine),
        element("p", "points", `+${pairCount * POINTS_PER_PAIR} points`),
        again,
        sizes
      );
      wait(() => {
        body.replaceChildren(done);
        const box = done.getBoundingClientRect();
        confetti(done, box.width / 2, 40, newBest ? 110 : 60, newBest ? 300 : 220);
      }, 700);
    }

    chooseSize();
    context.root.append(sheet, body);

    return () => {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    };
  },
});
