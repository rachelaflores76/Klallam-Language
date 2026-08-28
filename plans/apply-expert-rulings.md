# Apply the experts' corrections (PLAN.md Phase 4, part 2)

**Goal:** put the experts' email into the lexicon — one mark used everywhere, the two
"one" entries merged into one word, the mismatched recording detached, and the review
flags they settled cleared.

**Not doing:** the missing recordings, the variant way of saying yes, and merging the
old app's word list. Every one of those waits on somebody else.

**Depends on:** `plans/lexicon-correction-tools.md`, finished and green.

**Approved:** 2026-08-27.

---

## What the experts said

From the email of 2026-08-27, after reading the review page:

1. The two marks are the list author's own inconsistency, not a distinction. Use U+0313
   everywhere and replace every U+0315.
2. The two words shown as "one" are the same word. There should be one entry, not two,
   and no word whose only difference is an invisible mark.
3. The four recordings flagged as a best guess all sound correct.
4. The word shown as "yes" and its recording do not match. The recording is a different,
   variant way of saying yes. It was a recording mistake.
5. Corrected recordings will follow later.

## What the maintainer decided on top of that

- The two "young woman" spellings **stay flagged**. The email confirmed the recording,
  not whether both spellings should exist. That question goes back to the experts.
- The variant yes is **not** added as a word yet. The recording is simply detached and
  set aside until the experts send the spelling.
- The old app's word list stays deferred, as it has been since Phase 1.

---

## Steps

### 1. One mark everywhere, and the two "one" entries become one  ✅

These were written as two steps and cannot be. Correcting the second "one" is what makes
it identical to the first, and the import refuses to create a duplicate word, so the
correction cannot land while the duplicate is still there. Merged on 2026-08-28, after
the first dry run stopped on exactly that.

`npm run lexicon:mark-fix` writes the file of corrected spellings. The maintainer pastes
each one into the Klallam column of the row it names in `lexicon.xlsx`, and deletes the
row whose **id column reads `one-2`** &mdash; not by looking at the Klallam, because once
corrected the two "one" rows are identical on screen and the id is the only way to tell
them apart. `one` is the one that stays; it was already spelled with the right mark.

`npm run lexicon:import` then shows a codepoint diff for each correction and lists the
deletion with its codepoints. **The maintainer reads it and confirms that every position
marked as changed is the mark being swapped and nothing else.** That reading is the whole
point of doing this by hand. Then:

```
npm run lexicon:import -- --apply --allow-edits --allow-deletes
```

Four words are corrected: `trying-it`, `bird`, `cut-it`, `afraid`. The fifth, `one-2`,
goes instead of being corrected. `one.mp3` stays on disk and stays attached to `one`.
`WORDS-TO-FIX.txt` gets deleted afterwards.

**Done when:** `npm run lexicon:verify` reports 101 entries, no word uses the old mark,
and the warning about two words being identical once the marks are folded is gone.
Expect all four corrected words to come back flagged for review &mdash; an import cannot
know who approved a spelling change, so it flags every one. Step 3 clears them.

### 2. The recording comes off "yes"

The maintainer clears the audio cell on the `yes` row and saves. The dry run shows the
change and the review flag it brings with it; `--apply` writes it.

`yes.mp3` stays on disk. It is a real recording of a real word — just not that one — and
it waits with the others until the experts send the spelling it belongs to.

**Done when:** `yes` has no recording and carries a flag saying so.

### 3. Settle the review flags

Clear the flags the experts ruled on, using `npm run lexicon:resolve`:

| Word | Why it clears |
|---|---|
| `one` | The word it collided with is gone |
| `bird`, `cut-it`, `afraid` | The mark question is settled |
| `important-person`, `finish` | The experts confirmed the recording |

`trying-it` keeps a flag, because it still has no recording — only its mark reason goes.

`young-woman` and `young-woman-2` get their recording flag cleared and a new one set
with `npm run lexicon:flag`, recording that the recording is confirmed but whether both
spellings should exist is an open question.

**Done when:** `npm run lexicon:verify` reports 5 words flagged: `sack`, `trying-it`,
`yes`, `young-woman`, `young-woman-2`.

### 4. Bring PLAN.md up to date

The Phase 1 result line and its counts. The Phase 4 checklist: tick the mark
reconciliation and the flag clearing, leave the recordings and the app merge open. The
"Outstanding for a speaker" table rewritten down to the five that are left. And a note
of the 2026-08-27 ruling, including that U+0315 was deliberately not banned outright.

**Done when:** every number in `PLAN.md` matches what `npm run lexicon:verify` prints.

### 5. The questions that go back to the experts

A plain list the maintainer can paste into an email:

- The two "young woman" spellings — are they one word or two? Point them at
  `npm run lexicon:review` rather than quoting the words, so they read them rendered.
- The recordings with no word attached, `yes.mp3` now among them. Recompute the list at
  the time rather than trusting this file.
- `sack` and `trying-it` still have no recording at all.
- Confirmation that the variant yes should become its own entry, and the spelling for it.

**Done when:** the maintainer has a list they can send without editing it.

---

## Where this should land

| | before | after |
|---|---|---|
| entries | 102 | 101 |
| with a recording | 100 | 98 |
| flagged for review | 11 | 5 |
| usable in the game | 91 | 96 |

Five words stay flagged: three waiting on recordings, two waiting on a ruling.

---

## Risks

- **Excel is the real hazard.** It rewrites pasted text without being asked. The import
  catches curly quotes, a capitalised first letter, non-breaking and zero-width
  characters, and lost encoding — and the codepoint diff catches everything else, but
  only if the diff is actually read.
- **The flag count goes up before it comes down.** It passes through roughly 15 in the
  middle of this plan before landing on 5. That is the import being honest about not
  knowing who approved a spelling change, not something going wrong.
- **Phase 4 does not close here.** Three words wait on recordings and two on an answer.
- **None of this can be checked by an agent's eye.** Every Klallam check in this plan is
  a person reading a rendered word or a codepoint diff.
