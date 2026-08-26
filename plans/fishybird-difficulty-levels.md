# FishyBird difficulty levels (PLAN.md Phase 3, part 1 of 2)

**Goal:** give FishyBird three named difficulty levels whose speed, spacing, number of
choices and catch forgiveness are set independently of each other, and open the next
level when a player does well enough.

**Not doing:** Leitner boxes, per-word accuracy, missed words resurfacing, phonetic
neighbour distractors. Those are part 2 of Phase 3 and get their own plan once this one
has been validated.

**Approved:** 2026-08-26.

---

## Decisions already made

The maintainer was asked five questions and the answers did not come back, so each of
these is the recommended option taken by default. Any of them can be overturned on
review; none is expensive to change later.

- **Two plans, not one.** All four Phase 3 features together is about ten steps, and the
  `plan` skill says more than six is two plans.
- **Progression is automatic.** A round runs at the highest level unlocked so far, and
  clearing it opens the next. No level chooser, because a chooser lets a learner pick
  something far too hard and is more interface than a proof of concept needs.
- **Five settings vary by level:** how fast the salmon swim, the gap between them, how
  many choices are offered, how forgiving the catch is, and which strategy picks the
  wrong answers. Everything else stays shared.
- **Three levels** — enough to feel like progress, few enough to actually play-test.
- **No demotion.** Failing a level means not advancing, never dropping back.
- **All three levels use random distractors for now.** Level 3 switches to phonetic
  neighbours in part 2, once phonetic neighbours exist. Shipping a strategy name that
  silently does nothing is worse than waiting for the real thing.

---

## What the config file becomes

`games/fishybird/src/config.ts` ends up with two exports and a type:

- **`TUNING`** keeps its name, because `PLAN.md` section 3a refers to it. It now holds
  only values that are identical at every level: `wordsPerRound`, `diveMs`,
  `orcaIntroMs`, `orcaIntroSkippable`, `celebrateMs`, `escapeMs`,
  `autoPlayAudioOnReveal`, `allowAudioReplay`, `replayAudioOnWrong`,
  `wrongAnswerEndsRun`, `livesPerRound`. It also gains `forceLevel`, a switch for
  play-testing a level without having to earn it first. It ships turned off.
- **`Level`** describes one difficulty: an id, a name shown to the player, and the five
  settings that vary.
- **`LEVELS`** lists them in difficulty order. A level's position in that list is its
  level number.

Starting values, meant to be changed by playing:

| | speed | gap between fish | choices | catch forgiveness | opens next at |
|---|---|---|---|---|---|
| Gentle | 100 | 2800ms | 3 | 18 | 8 of 10 |
| Steady | 140 | 2200ms | 3 | 12 | 8 of 10 |
| Quick | 190 | 1700ms | 4 | 8 | — |

---

## Steps

### 1. Split the config into shared and per-level  ✅

Add the `Level` type and a `LEVELS` list holding a single level with exactly today's
values: speed 120, gap 2500ms, 3 choices, forgiveness 12, random distractors. Move those
five settings out of `TUNING`. Pass the level into `buildRound` in `words.ts`, and give
the round scene in `main.ts` a level of its own to read from.

**Done when:** `npm run ci` passes and the game plays exactly as it does now, with no
value changed.

### 2. Add the other two levels  ✅

Fill in the table above, and add the `forceLevel` switch so a level can be play-tested
without earning it.

**Done when:** setting `forceLevel` to each of the three levels in turn visibly changes
how fast the fish swim, how far apart they are and how many there are.

*Checked in code and by the automated checks at this step; the looking-at-it half was
done in one browser pass after step 5, together with steps 4 and 5.*

### 3. Remember which level has been unlocked  ✅

A new `src/progress.ts` stores the highest unlocked level in `localStorage`. It reads
defensively: storage can be switched off, full, or hold nonsense left over from an older
version, and none of those may stop the game starting.

**Done when:** unlocking a level survives a page reload, and the game still starts with
browser storage blocked.

### 4. Start at the unlocked level, and open the next one  ✅

The round scene picks its level when a round begins. When a round ends with enough
salmon caught, the next level is unlocked.

**Done when:** catching 8 of 10 on Gentle means the following round runs at Steady's
speed, and catching 5 of 10 means it does not.

### 5. Tell the player which level they are on  ✅

The level name appears before the round starts, and the summary says plainly whether the
next level opened or what the target was. English text only.

**Done when:** the level name is readable on screen before a round, and the summary
states whether the next level is now open.

### 6. Bring `PLAN.md` in line  ✅

Section 3a still shows the old flat block with `salmonSpeed` inside `TUNING`. Update it
to the new shape and tick the difficulty ramp off the Phase 3 list.

**Done when:** the config block quoted in `PLAN.md` matches the real file.

---

## Checked in the browser after step 6

- The level name shows on the start screen and in the score line, and follows what is
  stored: level 1 stored gives Steady, level 2 gives Quick.
- A stored level that is out of range settles on the hardest level rather than breaking.
  Nonsense in storage, or a value left by an older version, falls back to Gentle.
- With browser storage switched off entirely, the game still starts, still plays a word,
  and reports no errors. It simply always begins at Gentle.
- Gentle and Quick were photographed at the same moment of a round: Quick had more fish
  on screen and they had travelled further. The two levels are visibly different.

**Left for a person:** whether catching 8 of 10 actually opens the next level, and
whether the three speeds feel right.

---

## Risks

- **The numbers are guesses.** Nothing but playing the game will tell us whether Gentle
  is gentle. The `forceLevel` switch from step 2 exists so all three can be checked
  without grinding through rounds.
- **No way back down.** Someone who unlocks Quick and then struggles is stuck with it.
  Deliberate for now; the cheapest fix later is a chooser limited to unlocked levels.
- **Progress is per browser.** Clearing site data resets it, and it does not follow a
  player to another device. That is the permanent no-accounts constraint, not an
  oversight.
- **Four choices needs four distinct English meanings** per word. The playable pool is
  around ninety words, so the existing guard is enough, but it is the reason the guard
  stays.
- **No Klallam is written by this plan.** Level names are English and no lexicon change
  is needed.
