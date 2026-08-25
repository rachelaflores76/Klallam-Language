# FishyBird vertical slice (PLAN.md Phase 2)

**Goal:** a player can start FishyBird in a browser, hear a Klallam word, catch the
salmon carrying its English meaning, and finish a round of ten words.

**Not doing:** phonetic distractors, spaced repetition, saved progress, artwork,
deployment, extra game modes. Those are Phases 3 to 5. This is the proof that the
loop works and that every Klallam letter renders correctly.

**Approved:** 2026-08-25.

---

## Decisions already made

- **One plan of ten steps** rather than two shorter ones, at the maintainer's request.
- **The font is downloaded during step 4.** If the download fails or the file is not a
  real font, the build stops and asks rather than guessing.
- **`npm run ci` will also build the game**, so a broken build fails the checks. The
  checks get slower; they also start catching a whole class of problem that the
  current checks cannot see.
- **No picture files at all.** The eagle, salmon and orca are plain shapes drawn in
  code, so replacing them with real artwork later changes nothing about the layout.
- **Only confirmed words appear.** The game asks for playable words, which excludes
  the eleven entries still flagged for a speaker's review. Nothing disputed reaches a
  learner.
- **`diveMs` was added to the tuning file during step 6.** Section 3a of `PLAN.md` shows
  no dive speed, but its own rule is that no pacing number may live outside that file.
  The config file is therefore a superset of the block quoted in step 2. Flagged to the
  maintainer rather than decided quietly. Step 8 added `celebrateMs` and `escapeMs` on
  the same reasoning.

---

## Steps

### 1. Scaffold the game  ✅

Create `games/fishybird` with its own `package.json`, an `index.html`, a `vite.config.ts`
and an empty starting scene in `src/main.ts`. Add `game:dev` and `game:build` commands to
the root `package.json`, and add the build to the `ci` chain. Re-run `npm install` so the
game can see the lexicon package.

**Done when:** `npm run game:dev` opens a blank game window in the browser, and
`npm run ci` passes with the new build step included.

### 2. Put every tunable number in one file  ✅

Create `games/fishybird/src/config.ts` holding the `TUNING` block exactly as written in
`PLAN.md` section 3a: how many words per round, how many salmon, how fast, how forgiving.
Nothing built after this step invents its own number.

**Done when:** the file matches `PLAN.md` section 3a and `npm run ci` passes.

### 3. Feed the game words and recordings  ✅

A `src/words.ts` builds a round: for each word, the correct English plus two wrong ones
drawn from the same pool. The recordings in `lexicon/audio` are served to the game both
while developing and in the finished build, without copying them into the game folder.

**Done when:** one word's recording plays from the game's address in the browser, and
the same recording appears in the built output.

### 4. The word banner, in a font that can draw Klallam  ✅

Download the Charis SIL web font and its licence into the game, check it really is a
font, and use it for a text banner sitting above the game canvas. The banner is ordinary
web text, never drawn into the canvas, because canvas text cannot stack the marks
correctly.

**Done when:** a real word from the lexicon appears in the banner, drawn with the
downloaded font rather than whatever the computer happened to have.

### 5. The orca brings a word, and it speaks  ✅

The game opens with a start button, which is what lets browsers play sound at all. Then
the orca surfaces, the word appears, and its recording plays by itself. The intro can be
skipped and the recording can be replayed.

**Done when:** every new word plays its recording on its own, the replay button works,
and the browser console shows no sound error.

### 6. The eagle dives  ✅

An eagle that responds to a mouse click, a touch, and the space bar with the same dive.

**Done when:** all three ways of diving behave identically.

### 7. Salmon swim past carrying English  ✅

Three salmon per word, spaced and moving at the speeds set in the config file, each
labelled with one of the candidate translations.

**Done when:** three labelled salmon cross the screen for each word, and exactly one of
them carries the right translation.

### 8. Catching a salmon means something  ✅

Catching the right one: a sound, a shape change, a point, and on to the next word.
Catching a wrong one: the recording plays again, the salmon escapes, and the round
carries on. Right and wrong are never told apart by colour alone.

**Done when:** a correct catch scores and advances; a wrong catch replays the word and
does not end the run.

### 9. A round of ten, and a summary

Ten words, then a summary showing the score and the words that were missed, each with
its recording and a replay button, and a button to play again. Nothing is saved between
sessions yet.

**Done when:** finishing ten words shows the summary.

### 10. Check the letters on real devices

Serve the game on the local network and look at it on Windows, macOS, iOS and Android,
paying attention to the words carrying stacked marks (codepoints U+0313, U+0315 and
U+0323).

**Done when:** the maintainer confirms every letter is drawn correctly on all four.

---

## Risks

- **The font download is the one step that reaches outside this computer.** If SIL's
  site is unreachable, step 4 stops and the file has to be fetched by hand. Everything
  after it waits.
- **Sound on phones and tablets is fussy.** Browsers refuse to play audio until the
  player has tapped something. Step 5 handles that with the start button, but iOS in
  particular is worth watching during step 10.
- **The whole lexicon gets bundled into the game.** It is small enough not to matter now.
  Changing that would be a change to the lexicon package, and its own plan.
- **The build tool may object to reading recordings from outside the game folder.** Known
  problem with a known fix, handled in step 1 if it appears.
- **No new Klallam words can be added by this work.** If the slice turns out to need a
  word the lexicon does not have, or one spelled wrong, that stops at the maintainer:
  edit `lexicon/lexicon.xlsx`, then run the `update-lexicon` skill. The rest of the plan
  carries on regardless.
- **The checks cannot tell whether this is fun, or fair, or too fast.** That judgement
  arrives only in step 10, and the config file exists so that acting on it is a one-line
  change.

---

## Notes for whoever builds this

Detail the maintainer does not need, kept here so it survives into the build session.

- **Stack:** Vite + Phaser 3 + TypeScript, per `PLAN.md` section 3. Game dep
  `@klallam/lexicon` at `*`; it is already an npm workspace.
- **Root scripts:** `game:dev` and `game:build` delegate with `-w @klallam/fishybird`.
  `ci` becomes `guard:ascii && typecheck && lexicon:verify && test && game:build`.
- **Words come from `getPlayableWords()`** in `lexicon/src/index.ts` (audio present,
  `needs_review` false). URLs come from `audioUrl(entry, "/audio")`. Never read
  `lexicon.json` directly from the game.
- **Audio serving** is a small inline Vite plugin, no new dependency: a dev middleware
  for `/audio/*` plus a build-time copy into `dist/audio`. Reuse the path-containment
  check from `tools/lexicon-cli/review-server.mjs` so a crafted URL cannot escape
  `lexicon/audio`.
- **Vite may need** `server.fs.allow` widened to the repo root and
  `optimizeDeps.exclude: ["@klallam/lexicon"]`, since the game root is two levels below
  the lexicon and the package ships TypeScript source.
- **Root `tsconfig.json`** already covers `games/*/src/**/*.ts`. `vite.config.ts` is not
  covered; `vite build` is its check. `noUncheckedIndexedAccess` is on, so indexing an
  array yields a possibly-undefined value.
- **The ASCII guard** (`tools/lexicon-cli/ascii-guard.mjs`) scans `.ts .tsx .js .jsx .mjs
  .cjs .html .css` under `games/`. Game source, markup and stylesheet all stay ASCII;
  write any needed character as an escape such as `\u0313`.
- **Banner text** is set with `textContent` on a DOM element layered over the canvas.
  Never `BitmapText`, never `innerHTML`.
- **Font:** Charis SIL web `.woff2` plus `OFL.txt` into `games/fishybird/public/fonts/`.
  Verify the `wOF2` magic bytes before committing, and add `*.woff2 binary` to
  `.gitattributes`.
- **The round builder** throws a plain-English error if the playable pool is smaller than
  `wordsPerRound` or `salmonPerWord`, rather than silently shipping a short round.
- **`git status` must show no change** to `lexicon.json` or `lexicon.lock` at any point.
