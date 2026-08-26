// Comparing Klallam words. Plain JavaScript, not TypeScript, so the checks can test it.
// Klallam characters are never typed here: the two marks are written as escape codes.

// Glottalization is written two ways in the source material. They look identical but are
// distinct codepoints, so they are folded together before any comparison.
export const COMBINING_COMMA_ABOVE = "\u0313";
export const COMBINING_COMMA_ABOVE_RIGHT = "\u0315";

export function foldGlottal(text) {
  return text.split(COMBINING_COMMA_ABOVE_RIGHT).join(COMBINING_COMMA_ABOVE);
}

// Array.from splits on real characters. Indexing or .length would split some of them in
// half, which would make two words look further apart than they are.
function characters(text) {
  return Array.from(foldGlottal(text));
}

/** How many single-character edits separate two words. Zero means they are the same word. */
export function phoneticDistance(a, b) {
  const left = characters(a);
  const right = characters(b);
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1);
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, substitution);
    }
    previous = current;
  }
  return previous[right.length];
}

/**
 * Candidates ordered by how close they sound, closest first. Anything that folds to the
 * target itself is dropped: two spellings of one word cannot be told apart on screen.
 */
export function rankByPhoneticDistance(target, candidates) {
  return candidates
    .map((entry) => ({ entry, distance: phoneticDistance(target, entry.klallam) }))
    .filter((ranked) => ranked.distance > 0)
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      const left = a.entry.id ?? a.entry.klallam;
      const right = b.entry.id ?? b.entry.klallam;
      return left < right ? -1 : left > right ? 1 : 0;
    });
}
