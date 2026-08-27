import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMBINING_COMMA_ABOVE,
  COMBINING_COMMA_ABOVE_RIGHT,
  foldGlottal,
  phoneticDistance,
  pickDistractors,
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

test("no two spellings of one word are ever offered against each other", () => {
  const entries = readLexicon().entries;
  for (const entry of entries) {
    const collision = rankByPhoneticDistance(entry.klallam, entries).find(
      (ranked) => foldGlottal(ranked.entry.klallam) === foldGlottal(entry.klallam)
    );
    assert.equal(
      collision,
      undefined,
      `"${entry.id}" was offered "${collision?.entry.id}", which is the same word spelled differently`
    );
  }
});

// A fixed sequence, so a test that passes today passes tomorrow.
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TARGET = { id: "target", klallam: "pa", english: "target" };
const NEAR = [
  { id: "near-1", klallam: "pab", english: "near one" },
  { id: "near-2", klallam: "pac", english: "near two" },
  { id: "near-3", klallam: "pad", english: "near three" },
];
const FAR = [
  { id: "far-1", klallam: "zyxwvu", english: "far one" },
  { id: "far-2", klallam: "zyxwvt", english: "far two" },
  { id: "far-3", klallam: "zyxwvs", english: "far three" },
  { id: "far-4", klallam: "zyxwvr", english: "far four" },
];
const POOL = [TARGET, ...NEAR, ...FAR];
const NEAR_IDS = new Set(NEAR.map((e) => e.id));

function pick(chance, seed, options = {}) {
  return pickDistractors({
    target: TARGET,
    pool: POOL,
    count: 2,
    chance,
    poolSize: NEAR.length,
    random: seededRandom(seed),
    ...options,
  });
}

test("at full chance every wrong answer is a lookalike", () => {
  for (let seed = 1; seed <= 25; seed += 1) {
    const picked = pick(1, seed);
    assert.equal(picked.length, 2);
    for (const entry of picked) {
      assert.ok(NEAR_IDS.has(entry.id), `seed ${seed} offered "${entry.id}", which is not near`);
    }
  }
});

test("at zero chance the whole pool is in play, not just the lookalikes", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 25; seed += 1) {
    for (const entry of pick(0, seed)) seen.add(entry.id);
  }
  assert.ok(
    [...seen].some((id) => !NEAR_IDS.has(id)),
    "zero chance should be able to draw an unrelated word"
  );
});

test("a wrong answer never repeats a meaning already on offer", () => {
  const shared = [
    TARGET,
    { id: "copy-1", klallam: "pab", english: "same meaning" },
    { id: "copy-2", klallam: "pac", english: "same meaning" },
    { id: "other", klallam: "pad", english: "different meaning" },
  ];
  for (let seed = 1; seed <= 25; seed += 1) {
    const picked = pickDistractors({
      target: TARGET,
      pool: shared,
      count: 3,
      chance: 1,
      poolSize: 3,
      random: seededRandom(seed),
    });
    const glosses = picked.map((e) => e.english);
    assert.equal(new Set(glosses).size, glosses.length, `seed ${seed} repeated a meaning`);
    assert.ok(!glosses.includes(TARGET.english), "the right answer must not appear twice");
  }
});

test("asking for more wrong answers than exist returns what there is", () => {
  const picked = pickDistractors({
    target: TARGET,
    pool: [TARGET, NEAR[0]],
    count: 3,
    chance: 1,
    poolSize: 3,
    random: seededRandom(7),
  });
  assert.deepEqual(
    picked.map((e) => e.id),
    ["near-1"]
  );
});
