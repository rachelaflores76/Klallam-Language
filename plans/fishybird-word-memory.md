# Lookalike distractors and word memory (PLAN.md Phase 3, part 2)

**Goal:** wrong answers can be words that sound almost the same, controlled by a dial per
level, and the game remembers which words a player keeps missing so those come back sooner.

**Not doing:** showing the player anything about what they know. No progress screen, no
score beyond the round, no reset button.

**Approved:** 2026-08-26.

---

## Decisions already made

Answered by the maintainer before this was written:

- **`distractorStrategy` goes away.** In its place, `phoneticDistractorChance` on each
  level: 0 means wrong answers are always unrelated, 1 means always lookalikes. **Rolled
  separately for each wrong fish**, so 0.5 gives a mix on the same word rather than an
  all-or-nothing round.
- **One memory, shared across levels.** A word is a word; missing it on Level 3 means it
  comes back sooner on Level 1 too.
- **The memory settings are shared**, except how many brand-new words a round introduces,
  which is per level.
- **The similarity logic gets automated tests.** It is written as plain JavaScript so the
  checks can reach it, which they cannot do with TypeScript today.
- **The player sees nothing.** Words simply come back; nothing is announced.
- **One plan of eight steps**, at the maintainer's request, rather than splitting it in two.
- **Rest intervals as proposed** - 0, 1, 2, 4 then 8 rounds as a word climbs the boxes.
- **One definition of which glottal marks count as the same.** `tools/lexicon-cli/lib.mjs`
  stops defining its own and imports the shared one, so the two cannot drift apart.

---

## What the knobs become

Shared, in `TUNING`:

| Knob | Meaning |
|---|---|
| `phoneticNeighborPool` | When a lookalike is wanted, draw from this many nearest words |
| `boxCount` | How many times in a row a word must be right before it is left alone |
| `boxRestRounds` | How many rounds a word sits out at each box |
| `missDropsToFirstBox` | Whether a miss sends a word back to the start or down one box |

Per level, on `Level`:

| | lookalike chance | new words per round |
|---|---|---|
| Level 1 | 0.0 | 2 |
| Level 2 | 0.5 | 3 |
| Level 3 | 1.0 | 4 |

---

## Steps

### 1. A word-similarity function the checks can test  ✅

A new plain-JavaScript file in the lexicon package holding the comparison: fold the two
glottal marks, then measure how many single-character edits separate two words, counting
real characters rather than the pairs a computer stores them as. `tools/lexicon-cli/lib.mjs`
is pointed at the same fold so there is only one definition of it.

**Done when:** new tests show that two words differing by one mark rank closer than two
unrelated words, that a pair which folds to identical is excluded, and every existing
check still passes.

### 2. Choosing the wrong answers, testable  ✅

A function that picks the wrong answers for a word, given the chance of each one being a
lookalike. It takes its randomness as an argument so a test can pin the result down exactly.

**Done when:** a test shows that at chance 1 every wrong answer comes from the nearest
words, that at chance 0 the choice is drawn from the whole pool rather than the nearest
ones, and that no wrong answer ever repeats a meaning already on offer.

*Wording corrected during the build: this originally said "at chance 0 none do", which
would mean deliberately avoiding similar words. The maintainer asked for 0.0 to mean
completely random, so a near word turning up by luck at 0.0 is correct.*

### 3. Swap the knob in the config  ✅

`distractorStrategy` out; `phoneticDistractorChance` and `newWordsPerRound` in, with every
chance still at 0. The memory settings join `TUNING`.

**Done when:** the checks pass and the game plays exactly as it does now.

### 4. Use the dial when building a round  ✅

The game asks for wrong answers through the new function, passing the level's chance, and
the three levels get the values in the table above.

**Done when:** the tests from step 2 cover it. This step cannot be checked by eye, for the
reason under Risks.

### 5. Remember how each word is going  ✅

A new file storing, for each word, which box it is in, how many times it has been seen and
how many times answered right, plus a count of rounds played. Right moves a word up, a miss
sends it back. It reads defensively: browser storage can be switched off, absent, or hold
junk from an older version, and none of that may stop the game.

**Done when:** answering a word and reloading shows the record survived, and the game still
starts with storage blocked entirely.

### 6. Build the round from that memory  ✅

The words due for review come first, longest overdue first, topped up with new words the
player has not met, then shuffled so the order gives nothing away.

**Done when:** a word missed in one round turns up in the next, and a word answered right
several times stops appearing every time.

### 7. Handle a brand-new player and thin data  ✅

On a first play nothing is known, so a round is all new words. The same fallback covers the
case where too few words are due.

**Done when:** clearing browser storage and playing still gives a full round of ten.

### 8. Update PLAN.md  ✅

Section 3a's config block, and the three remaining Phase 3 items.

**Done when:** the block matches the real file.

---

## Risks

- **You cannot see the lookalikes working.** The similarity lives in the Klallam, but the
  fish carry English. A lookalike wrong answer is the English of a word that sounds nearly
  the same, so on screen it looks like any other wrong answer. The proof is the tests, which
  is why steps 1 and 2 come before any game code.
- **Storage comes back a day after it was removed.** Clearing site data resets what the game
  has learned about a player. There is no reset button in the game; that is the reset.
- **The known duplicate pair** must never be offered against each other. Two entries in the
  lexicon differ only by which glottal mark was typed, and would be indistinguishable on
  screen. Excluded by folding, and covered by a test.
- **The pool is about ninety words**, not 102: eleven are waiting on a speaker and two have
  no recording. Ten a round means the boxes fill slowly, and the rest intervals are a guess
  until somebody plays it.
- **No Klallam is typed anywhere.** The two marks are referred to by escape code, the way
  `tools/lexicon-cli/lib.mjs` already does.
