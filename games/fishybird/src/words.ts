import { audioUrl, getPlayableWords, type LexiconEntry } from "@klallam/lexicon";
import { TUNING } from "./config";

/** Where the game serves the lexicon recordings from. See the audio plugin in vite.config.ts. */
const AUDIO_BASE = `${import.meta.env.BASE_URL}audio`;

export interface Choice {
  english: string;
  correct: boolean;
}

export interface RoundWord {
  id: string;
  klallam: string;
  english: string;
  audioUrl: string;
  choices: Choice[];
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

function distractorsFor(
  entry: LexiconEntry,
  pool: readonly LexiconEntry[],
  random: () => number
): string[] {
  const wanted = TUNING.salmonPerWord - 1;
  const taken = new Set([entry.english]);
  const picked: string[] = [];
  for (const candidate of shuffle(pool, random)) {
    if (picked.length === wanted) break;
    if (taken.has(candidate.english)) continue;
    taken.add(candidate.english);
    picked.push(candidate.english);
  }
  if (picked.length < wanted) {
    throw new Error(
      `Not enough distinct translations to fill ${TUNING.salmonPerWord} salmon for "${entry.id}".`
    );
  }
  return picked;
}

export function buildRound(random: () => number = Math.random): RoundWord[] {
  const pool = getPlayableWords();
  const needed = Math.max(TUNING.wordsPerRound, TUNING.salmonPerWord);
  if (pool.length < needed) {
    throw new Error(
      `A round needs ${needed} confirmed words with recordings, but only ${pool.length} are available. ` +
        "Add or confirm words in lexicon/lexicon.xlsx, then run the update-lexicon workflow."
    );
  }

  return shuffle(pool, random)
    .slice(0, TUNING.wordsPerRound)
    .map((entry) => {
      const url = audioUrl(entry, AUDIO_BASE);
      if (url === null) {
        throw new Error(`Word "${entry.id}" reached the round without a recording.`);
      }
      const choices = shuffle(
        [
          { english: entry.english, correct: true },
          ...distractorsFor(entry, pool, random).map((english) => ({ english, correct: false })),
        ],
        random
      );
      return { id: entry.id, klallam: entry.klallam, english: entry.english, audioUrl: url, choices };
    });
}
