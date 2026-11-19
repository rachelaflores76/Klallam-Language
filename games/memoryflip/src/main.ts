import { registerGame } from "@klallam/game-kit";
import type { LexiconEntry } from "@klallam/lexicon";
import styles from "./style.css?inline";

interface Size {
  name: string;
  pairs: number;
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

    function play(size: Size, pairs: number): void {
      // Filled in by the next step.
      void size;
      void pairs;
    }

    chooseSize();
    context.root.append(sheet, body);
  },
});
