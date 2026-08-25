# Klallam Language Games — Project Plan

A collection of browser games that teach Klallam, sharing one lexicon.
First game: **FishyBird** — an eagle catches the salmon carrying the correct translation.

**Status:** Phase 1 complete — proof of concept
**Last updated:** 2026-08-24

---

## 1. Goal

A browser game that teaches Klallam vocabulary through listening and recognition.

Core loop:
1. An orca surfaces and leaves a Klallam word in the air.
2. The word's pronunciation plays automatically.
3. Salmon swim past, each carrying a candidate English translation (or a picture).
4. The player, as an eagle, dives to catch the correct salmon.
5. Audio + visual feedback signals right or wrong.

---

## 2. Scope

### Permanent architecture constraints
These hold for every game in this project, not just v1:
- No backend, servers, APIs, or databases
- No accounts or authentication
- No multiplayer or leaderboards
- Client-side only, deployed as static files
- Progress stored in `localStorage`

### In scope for FishyBird v1
- Single game mode (Klallam prompt → choose English)
- ~101 words from the Klallam Grammar alphabet examples
- Audio playback for every word
- Progress tracking that resurfaces missed words
- Desktop + tablet, mouse/touch/keyboard

### Out of scope for v1
- Additional game modes
- Sentence or grammar instruction

### Deferred (tracked, not blocking)
- Reconciling the two glottalization marks in the source doc (U+0313 vs U+0315)
- Words with missing audio; audio with no matching word
- Merging in the word list from the existing app
- Artwork and animation

---

## 3. Tech decisions

| Decision | Choice | Why |
|---|---|---|
| Engine | Phaser 3 | Canonical for this genre, huge training corpus, agents write it reliably |
| Language | TypeScript | Type errors give the agent a feedback loop; catches drift early |
| Build | Vite | One dependency, instant dev server, static output |
| Hosting | Static (Netlify / Vercel / GitHub Pages) | No backend needed |
| State | `localStorage` | No accounts, no server |
| Klallam text rendering | **DOM elements, never `BitmapText`** | Bitmap fonts cannot compose stacked diacritics; x̣ and ƛ̓ will break |
| Font | Self-hosted Charis SIL or Gentium Plus (`.woff2`) | Built for this orthography; system fonts misplace the dot-below |

**Rejected:** Unity / Godot (skill barrier, binary assets), Kaplay / Excalibur (thinner training data → worse agent output).

---

## 3a. Tuning configuration

This is a proof of concept, so the answers to "how fast, how many, how forgiving"
are unknown until people play it. Every such value lives in one file as a named
constant — `games/fishybird/src/config.ts` — so tuning never means hunting through
scene code.

Internal only. Not surfaced to players.

```ts
export const TUNING = {
  // round shape
  wordsPerRound: 10,
  salmonPerWord: 3,

  // difficulty
  salmonSpeed: 120,
  spawnIntervalMs: 2500,
  hitboxPadding: 12,

  // forgiveness
  wrongAnswerEndsRun: false,
  replayAudioOnWrong: true,
  livesPerRound: Infinity,

  // pacing
  orcaIntroMs: 1200,
  orcaIntroSkippable: true,
  autoPlayAudioOnReveal: true,
  allowAudioReplay: true,

  // selection
  distractorStrategy: "random" as "random" | "phonetic",
} as const;
```

Rules:
- No numeric literal that affects difficulty or pacing appears outside this file.
- Changing a value must never require touching a scene.
- `distractorStrategy` starts `random`; `phonetic` lands in Phase 3 behind the same switch.

---

## 4. Repo layout

The lexicon is a standalone package so future games can share it. It is deliberately
not nested inside the game, so it can be relocated without touching game code.

```
/lexicon                      # shared package: @klallam/lexicon
  lexicon.xlsx                # the ONLY place a human edits Klallam text
  lexicon.json                # generated from the sheet, committed for reviewable diffs
  lexicon.lock                # SHA-256 integrity hash
  audio/*.mp3                 # 101 files, ASCII names
  src/index.ts                # typed accessor API for games
  package.json

/games
  /fishybird                  # first game
    src/
      main.ts                 # ASCII-ONLY, enforced by CI
      scenes/
      ui/
    package.json

/tools
  lexicon-cli/                # sheet / import / verify / lock commands

/.claude
  /skills
    /update-lexicon
      SKILL.md                # word-authoring workflow
    /plan
    /build
    /validate                 # the loop for every non-lexicon change

/plans
  <slug>.md                   # one approved plan per change, kept as a record

package.json                  # npm workspaces root
```

Games import words only through the package API:

```ts
import { getWords } from "@klallam/lexicon";
```

No game ever reads `lexicon.json` directly or ships its own copy.

---

## 5. Content model

`lexicon/lexicon.json` is the single source of truth for every game.

```json
{
  "id": "white",
  "klallam": "pə́q̓",
  "codepoints": ["U+0070","U+0259","U+0301","U+0071","U+0313"],
  "english": "white",
  "audio": "white.mp3",
  "image": null,
  "tags": ["adjective"],
  "needs_review": false
}
```

- `id` — ASCII slug, safe for code and filenames
- `codepoints` — human-auditable mirror of `klallam`; a test asserts they agree
- `needs_review` — flags entries awaiting a speaker's ruling

Audio is keyed by **English gloss**, which is already ASCII in the source archive. No Unicode ever reaches a filename, URL, or import path.

---

## 6. Text fidelity guardrails

The main technical risk is an agent silently rewriting a diacritic. Six cheap defenses:

1. **Klallam text lives only in `/lexicon`.** Never inlined in game code.
2. **CI fails on any non-ASCII character in `games/*/src/`.** Inlining a Klallam string turns the build red immediately.
3. **Per-entry `codepoints` array**, verified by test against the `klallam` field.
4. **`lexicon.lock`** — SHA-256 of content. Any character change fails CI until deliberately re-locked.
5. **Ban `String.prototype.normalize()`** via lint rule. It is the most common cause of silent diacritic rewriting.
6. **Reject ASCII `'` and `` ` `` in `klallam` fields** — those indicate transliteration crept in.

Project rules for agents live in `CLAUDE.md`.

---

## 6a. Word authoring skill

The lock is only workable if changing a word is easy. A Claude skill at
`.claude/skills/update-lexicon/SKILL.md` owns that workflow end to end.

**Design rule: the agent never retypes Klallam characters.** There is exactly one
place a human edits Klallam text — `lexicon/lexicon.xlsx` — and the text travels
from that sheet into `lexicon.json` through a parser, never through the model.
There is deliberately no second option, because a second option is a second thing
to teach and a second place for the rule to leak.

`lexicon.json` stays generated and committed, so every change to a Klallam string
is still a readable text diff in git even though nobody edits it by hand.

Skill workflow:
1. If `lexicon.xlsx` is missing, `npm run lexicon:sheet` bootstraps it from the
   lexicon. This is not a routine step: it runs the wrong direction and exists only
   to create a missing sheet or replace a corrupted one.
2. The speaker edits the Klallam, English, audio and tags columns in Excel.
   New words go in a row with a blank `id`.
3. `npm run lexicon:import` dry runs: it reports additions, edits shown as a
   codepoint-level diff, and rows that went missing. It writes nothing.
4. The agent shows that report to the user before anything is written.
5. `npm run lexicon:import -- --apply` writes the entries, recomputes each
   `codepoints` array, re-locks and verifies.

That makes `lexicon:import` the whole update path: validate, diff, apply, report.

What the importer guarantees:
- The spreadsheet is never rebuilt from the lexicon. An import annotates it in
  place, writing back only the ids it generated, so notes, extra columns and
  anything else the lexicon does not model survive. Rebuilding it would quietly
  make the lexicon the source of truth instead of the sheet.
- A new row whose Klallam already matches an existing entry is rejected rather than
  duplicated, which catches a row that lost its id.
- The sheet carries only the five fields a speaker can act on: id, Klallam, English,
  audio, tags. Codepoints and review flags are machine-facing and stay in
  `lexicon.json`, the import report and the review page. A speaker cannot read
  `U+0313` and should never be asked to.
- The `id` column is locked by sheet protection so it cannot be overwritten by
  accident. A guardrail, not security: no password, removable on request. Locking is
  applied per column, not per cell, so the empty rows below the data stay editable.
- Excel AutoCorrect damage &mdash; curly quotes, non-breaking spaces, zero-width
  characters, a capitalized first letter, `U+FFFD` &mdash; is a hard error. Excel
  rewrites text without being asked, so the sheet is treated as untrusted input.
- Duplicate detection runs twice: exact, then folded so U+0313 and U+0315 compare
  equal. Fatal only when the import is what creates the collision, since the
  lexicon already contains such a pair (see Deferred).
- Editing the Klallam of an existing entry requires `--allow-edits` and marks the
  entry `needs_review`, because the import cannot know who approved it.
- A row deleted from the sheet is reported, never acted on. Imports never delete.
- The `.xlsx` codec is dependency-free. The published `xlsx` package on npm carries
  unpatched advisories, and no third-party parser belongs in the path of the
  language data.

Supporting commands:

| Command | Purpose |
|---|---|
| `npm run lexicon:sheet` | Generate `lexicon.xlsx` from the lexicon |
| `npm run lexicon:import` | Dry run: report what the sheet would change |
| `npm run lexicon:import -- --apply` | Apply, then verify + lock |
| `npm run lexicon:verify` | Integrity check, no writes |
| `npm run lexicon:lock` | Recompute `lexicon.lock` |
| `npm run lexicon:review` | Serve the review page |

---

## 7. Game design notes

**Make it forgiving.** Flappy Bird's core loop is death-by-precision. A learner who dies 40 times practiced thumb control, not Klallam. A wrong catch should replay the audio and let the salmon wriggle away — it should not end the run.

**Distractors should be phonetic neighbors, not random.** This word list exists to teach alphabet sounds, so it is full of minimal pairs — x̣čít "know it" vs x̣č̓ít "scratch" differ by one mark. Random distractors make the game trivial; phonetic neighbors make it teach.

**Salmon carry English text.** Three on screen by default — text on fast-moving sprites is hard to read, so count and speed are tuning constants rather than hardcoded values.

**Orca intro must be skippable**, and audio must replay on demand.

**Feedback cannot be color-only.** Pair red/green with shape and sound.

**No magic numbers.** Every value above is a named constant in the tuning config (section 3a).

---

## 8. Phases

### Phase 1 — Lexicon package and authoring tools  ✅ COMPLETE
No game yet. Prove the shared data layer is right first.

- [x] Set up npm workspaces root with `/lexicon` and `/games/fishybird`
- [x] Build `lexicon.json` from the source doc, characters preserved exactly
- [x] Import the 101 MP3s; map gloss → audio; flag unmatched entries `needs_review`
- [x] Write the typed accessor API games will consume
- [x] Build the lexicon CLI: `add`, `verify`, `lock`, `seed`
- [x] Author the `update-lexicon` Claude skill
- [x] Write the integrity test and CI ASCII guard
- [x] Ship a plain **lexicon review page**: every word, its gloss, a play button

**Result:** 102 entries, 100 with audio, 11 flagged for review, 3 recordings unused.
Drift detection verified two ways — swapping a single U+0313 for U+0315 fails CI even
when the codepoints array is regenerated to match.

**Outstanding for a speaker (Phase 4):**

| Entry | Question |
|---|---|
| `one` / `one-2` | Same word spelled with U+0313 and U+0315. Which is correct? |
| `bird`, `cut-it`, `afraid`, `trying-it` | Use U+0315 where the rest of the document uses U+0313 |
| `young-woman` / `young-woman-2` | Differ by a trailing glottal stop |
| `important-person`, `finish`, `young-woman` | Audio mapping is a best guess |
| `sack`, `trying-it` | No recording exists |
| `maple.mp3`, `swim.mp3`, `hand2.mp3` | Recordings with no matching word |

---

### Phase 2 — Vertical slice
First game, one level, ~10 words, complete loop.

- Scaffold Vite + Phaser + TypeScript in `/games/fishybird`
- Eagle with dive control (mouse/touch/keyboard)
- Salmon spawner with 3 candidates
- Orca word banner (DOM overlay, self-hosted font)
- Audio trigger on word reveal
- Hit detection, right/wrong feedback, score

**Done when:** a player can complete a 10-word round and every Klallam glyph renders correctly on Windows, macOS, iOS, and Android.

---

### Phase 3 — Pedagogy
- Phonetic-neighbor distractor sets
- Leitner spaced repetition in `localStorage`
- Per-word accuracy tracking; missed words resurface
- Difficulty ramp

**Done when:** missing a word measurably increases how soon it reappears.

---

### Phase 4 — Content reconciliation
The deferred content work, once a speaker is available.

- Resolve U+0313 vs U+0315 across the lexicon
- Fill audio gaps; identify unmatched audio
- Merge the existing app's word list, de-duplicated by exact codepoints
- Clear all `needs_review` flags

**Done when:** zero entries flagged, and a speaker has signed off on the review page.

---

### Phase 5 — Polish and ship
- Artwork and animation
- Accessibility pass (contrast, keyboard, captions, replay)
- Performance pass on low-end tablets
- Deploy

---

## 9. Decisions

| Question | Resolution |
|---|---|
| Target learner age | Unknown at POC. Handled by making difficulty a tuning constant (section 3a) rather than picking now. |
| Audio-only mode | Deferred. Not in POC scope. |
| Images vs English text on salmon | **English text.** Images would skip the translation step and bind meaning directly to the Klallam word, which matters more for young children than high schoolers — not worth the asset cost for a POC. |
| Cultural approval of eagle/salmon/orca premise | Cleared. Concept originated with the Tribe. |
| Existing app's word list | Deferred to Phase 4, pending POC reception. |
