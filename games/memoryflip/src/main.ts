import { registerGame } from "@klallam/game-kit";
import type { LexiconEntry } from "@klallam/lexicon";
import styles from "./style.css?inline";

interface Size {
  name: string;
  pairs: number;
}

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
        sizes
      );
    }

    function play(size: Size, pairCount: number): void {
      const words = shuffle(usable).slice(0, pairCount);
      let moves = 0;
      let matched = 0;
      let first: HTMLButtonElement | null = null;
      let busy = false;

      const movesText = element("span", "stat", "Moves: 0");
      const matchedText = element("span", "stat", `Pairs: 0 / ${pairCount}`);
      const status = element("div", "status");
      status.append(movesText, matchedText);

      const grid = element("div", `grid pairs-${pairCount}`);
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
        turnUp(card);
        if (first === null) {
          first = card;
          return;
        }
        const a = first;
        first = null;
        moves += 1;
        movesText.textContent = `Moves: ${moves}`;

        if (a.dataset["word"] === card.dataset["word"]) {
          a.classList.add("matched");
          card.classList.add("matched");
          a.disabled = true;
          card.disabled = true;
          matched += 1;
          matchedText.textContent = `Pairs: ${matched} / ${pairCount}`;
          if (matched === pairCount) finished(size, pairCount, moves);
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
      top.append(status, sizesButton);
      body.replaceChildren(top, grid);
    }

    function finished(size: Size, pairCount: number, moves: number): void {
      const again = button("size", "Play again");
      again.addEventListener("click", () => play(size, pairCount));
      const sizes = button("small", "Change size");
      sizes.addEventListener("click", chooseSize);
      const done = element("div", "done");
      done.append(
        element("h2", "title", "All matched!"),
        element("p", "lead", `${pairCount} pairs in ${moves} moves.`),
        again,
        sizes
      );
      wait(() => body.replaceChildren(done), 700);
    }

    chooseSize();
    context.root.append(sheet, body);

    return () => {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    };
  },
});
