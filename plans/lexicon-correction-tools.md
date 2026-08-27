# Lexicon correction tools (PLAN.md Phase 4, part 1)

**Goal:** give the lexicon tools the four things the expert corrections need and that
today's tools cannot do — hand you corrected spellings to paste, remove a word you
deleted from the spreadsheet, notice when a word loses its recording, and raise or
clear a review flag without anybody hand-editing a file they were told never to touch.

**Not doing:** no Klallam is changed by this plan. Not one word, not one mark. This is
only the tooling. The corrections themselves are `plans/apply-expert-rulings.md`, and
they come after this.

**Approved:** 2026-08-27.

---

## Why this comes first

The experts' email asks for four things. Three of them the tools cannot currently do:

| The ruling | What is missing |
|---|---|
| Use U+0313 everywhere | Nothing hands you the corrected spelling to paste, and you do not speak the language, so you cannot type it |
| The two "one" words are one word | An import never deletes. A word removed from the spreadsheet is reported and then ignored |
| The recording on "yes" is the wrong word | Clearing an audio cell applies silently. The word would end up with no recording and no flag saying so |
| Four best-guess recordings are correct | Clearing a review flag currently means hand-editing `lexicon.json`, which the skill forbids on the line above |

---

## Decisions already made

Answered by the maintainer before this was written:

- **The corrected spellings go into a text file, not into the spreadsheet by machine.**
  The maintainer wants to paste them in by hand as a check on the process. So the tool
  writes a file to copy from and changes nothing itself.
- **U+0315 is not banned.** The list's author used both marks and may again. This is a
  cleanup of what exists, not a new rule the code enforces forever.
- **The spreadsheet is the source. `lexicon.json` is an artifact of it.** A row that is
  gone from the sheet is a deleted word, not a curiosity to report.
- **Deleting still needs saying out loud.** `--allow-deletes`, the same shape as the
  existing `--allow-edits`. If a row is deleted in Excel by accident and saved, the
  Klallam is already gone from the sheet; once the import removes it from `lexicon.json`
  too, the only copy left is in the project's history, which the maintainer cannot get
  at alone. Adding a word and editing a word do not have that problem.

---

## Steps

### 1. A file of corrected spellings to copy from  ✅

A new command, `npm run lexicon:mark-fix`. It reads the lexicon, finds every word
written with the mark the experts are replacing, and writes `WORDS-TO-FIX.txt` at the
top of the project. For each word it lists the id, the English, **which row of the
spreadsheet to edit**, the codepoints before and after, and then the corrected word on
a line of its own, ready to copy.

It writes that file and nothing else. It does not touch `lexicon.json` and it does not
touch the spreadsheet. Before it writes anything it checks that the only difference
between the old spelling and the new one is the mark being swapped, so it cannot
quietly hand over a word it has changed some other way.

This follows what `remove-for-demo.mjs` already does: a Klallam word gets written to a
file so a person can copy it, because nothing and nobody should be retyping it.
`WORDS-TO-FIX.txt` is scratch, so it is added to `.gitignore`.

**Done when:** running it produces a file listing 5 words and 8 changed marks, and
`npm run lexicon:verify` still reports 102 entries — proof it changed nothing.

### 2. A word deleted from the spreadsheet is deleted from the lexicon  ✅

Today the import works out which words are missing from the sheet and then deliberately
does nothing about them. That reverses. A word missing from the spreadsheet is a word
that was deleted.

The dry run lists them under their own heading, with the full codepoints and the
recording filename, so the report itself is a written record of what is about to go and
what it was. Applying them needs `npm run lexicon:import -- --apply --allow-deletes`.
Plain `--apply` refuses and says which flag is missing.

The recording file stays on disk and simply becomes one that no word points at. The
existing check that catches a row which lost its id, rather than being deleted, is
untouched and still fires first.

**Done when:** with a row removed from the spreadsheet, the dry run prints the deletion
with its codepoints and writes nothing, and `--apply` on its own refuses and names
`--allow-deletes`.

### 3. A word that loses its recording gets flagged

When an import changes a word's details it applies them quietly, which is right for a
changed translation and wrong for a recording being taken away. A word whose recording
is removed should carry the same "no recording linked" flag that a brand-new word
without one already gets, and the dry run should say so before anything is applied.

**Done when:** clearing an audio cell shows the flag coming in the dry run, and sets it
on apply.

### 4. Raising and clearing a review flag from the command line

Two new commands, `npm run lexicon:resolve` and `npm run lexicon:flag`. Resolve clears
a word's review flag and its reasons. Flag sets one, with a reason given on the command
line.

Both are a dry run until `--apply`, both refuse an id that does not exist, both refuse
a reason containing anything but plain ASCII, and neither one goes anywhere near the
Klallam text, the codepoints, or the spreadsheet. Review flags are not part of the
integrity lock, so nothing needs re-locking to accept them.

This replaces the instruction in the `update-lexicon` skill to open `lexicon.json` and
edit it by hand — which sits directly below a line telling you never to do that.

**Done when:** both commands report what they would change and the new flagged count
before writing, and `npm run ci` is green.

### 5. A check that stops depending on a word about to be merged

One of the similarity checks proves that the two spellings of "one" are never offered
against each other, and it does that by looking those two words up in the lexicon. The
next plan merges them, so the check would go red for the wrong reason. It gets rewritten
against the made-up test words already sitting in the same file, proving the same thing
without naming a real entry.

The separate integrity check, that words differing only by an invisible mark must be
flagged, stays exactly as it is. It is a general rule and stays true.

**Done when:** `npm test` passes and no check mentions `one-2`.

### 6. Write down what changed

`README.md` gains the new commands. The `update-lexicon` skill loses the hand-editing
instruction and gains `lexicon:resolve`, `lexicon:flag`, `lexicon:mark-fix` and the
deletion path, plus a line saying a word is deleted by removing its row and never by
editing the JSON.

`PLAN.md` section 6a currently promises "A row deleted from the sheet is reported, never
acted on. Imports never delete." That was a real decision and this plan reverses it, so
it gets rewritten rather than left to rot.

**Done when:** the skill no longer tells anyone to hand-edit `lexicon.json`, and
`PLAN.md` no longer claims imports never delete.

---

## Risks

- **Deleting is the first thing these tools do that destroys something.** Everything
  guarding it is in step 2: a dry run by default, a flag that has to be typed on
  purpose, and codepoints printed in the report so the word can be reconstructed from
  it.
- **`WORDS-TO-FIX.txt` holds Klallam text outside the lock.** It is scratch and it is
  gitignored, so a half-finished correction cannot be committed by accident. It should
  be deleted once used.
- **Nothing in this plan writes to the spreadsheet.** The fragile hand-written parts of
  the .xlsx code stay untouched, which is deliberate.
