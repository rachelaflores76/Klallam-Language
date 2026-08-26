import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMBINING_COMMA_ABOVE,
  COMBINING_COMMA_ABOVE_RIGHT,
  foldGlottal,
  phoneticDistance,
  rankByPhoneticDistance,
} from "../lexicon/src/phonetics.mjs";
import { readLexicon } from "../tools/lexicon-cli/lib.mjs";

// Stand-ins, not Klallam. Real words come from the lexicon further down.
const BASE = "pa";
const WITH_MARK = "pa" + COMBINING_COMMA_ABOVE;
const WITH_OTHER_MARK = "pa" + COMBINING_COMMA_ABOVE_RIGHT;
const UNRELATED = "qusxw";

test("the two glottalization marks compare as the same character", () => {
  assert.equal(foldGlottal(WITH_OTHER_MARK), WITH_MARK);
  assert.equal(phoneticDistance(WITH_MARK, WITH_OTHER_MARK), 0);
});

test("one added mark is a distance of one", () => {
  assert.equal(phoneticDistance(BASE, WITH_MARK), 1);
});

test("a word differing by one mark is closer than an unrelated word", () => {
  assert.ok(
    phoneticDistance(BASE, WITH_MARK) < phoneticDistance(BASE, UNRELATED),
    "a one-mark difference should rank closer than an unrelated word"
  );
});

test("characters are counted whole, not as the pairs a computer stores them as", () => {
  // A character outside the basic range is stored as two units but is one character.
  const astral = "\u{1D400}";
  assert.equal(astral.length, 2, "this character is stored as two units");
  assert.equal(phoneticDistance("a", "a" + astral), 1);
});

test("a word that folds to the target is left out of the ranking", () => {
  const ranked = rankByPhoneticDistance(WITH_MARK, [
    { id: "same-word-other-mark", klallam: WITH_OTHER_MARK },
    { id: "unrelated", klallam: UNRELATED },
  ]);
  assert.deepEqual(
    ranked.map((r) => r.entry.id),
    ["unrelated"]
  );
});

test("the ranking puts the closest word first", () => {
  const ranked = rankByPhoneticDistance(BASE, [
    { id: "far", klallam: UNRELATED },
    { id: "near", klallam: WITH_MARK },
  ]);
  assert.equal(ranked[0].entry.id, "near");
});

test("the lexicon's duplicate pair is never offered against itself", () => {
  const entries = readLexicon().entries;
  const first = entries.find((e) => e.id === "one");
  const second = entries.find((e) => e.id === "one-2");
  assert.ok(first && second, "expected the known duplicate pair to still exist");

  const ranked = rankByPhoneticDistance(first.klallam, entries);
  assert.ok(
    !ranked.some((r) => r.entry.id === second.id),
    "two spellings of one word cannot be told apart on screen, so they must not be paired"
  );
});
