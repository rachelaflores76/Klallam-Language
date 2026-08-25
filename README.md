# Klallam Language Games

Browser games for teaching the Klallam language. Everything runs client-side and
ships as static files: no backend, no accounts, no network features.

All games share one lexicon, in `lexicon/`.

---

## Changing words

**`lexicon/lexicon.xlsx` is the source of truth for Klallam text.** It is a normal
Excel file, and it is the only place anyone edits a Klallam word.

You do not need to run anything or use a terminal. Ask Claude, in plain language:

> *"I want to add some words to the Klallam lexicon."*
>
> *"I need to fix the spelling of a word."*
>
> *"I have a new recording to attach."*

Claude will start the workflow, tell you when to edit the spreadsheet, and take it
from there.

### What happens

1. **You edit `lexicon/lexicon.xlsx`** in Excel and save it.
2. **Claude checks it** for problems and shows you exactly what changed.
3. **You confirm**, and Claude updates the lexicon.
4. **Claude reports** what was added or changed, and what still needs review.

Nothing is written until you say so. Step 2 always happens before step 3.

### Before you start editing

Excel rewrites text without asking, and two of its defaults will silently corrupt
Klallam. Turn them off once, under *File > Options > Proofing > AutoCorrect Options*:

- *AutoCorrect* tab &rarr; uncheck **Capitalize first letter of sentence**
- *AutoFormat As You Type* tab &rarr; uncheck **"Straight quotes" with "smart quotes"**

Both kinds of damage are rejected before they can reach the lexicon, so nothing
broken gets in either way. It is just far less annoying to prevent them.

### The spreadsheet

| Column | |
|---|---|
| **id** | Filled in for you. Locked, so you cannot overwrite it by accident. |
| **Klallam** | Type or paste the word. |
| **English** | The translation. |
| **audio file** | A filename in `lexicon/audio/`, for example `white.mp3`. |
| **tags** | Optional, comma separated. |

- **To add a word,** type into the first empty row and **leave the id blank**.
  An id is created for you and written back into the sheet afterwards.
- **Paste with Ctrl+Shift+V** (values only), so no stray formatting rides along.
- **Save and close Excel before you confirm.** An id has to be written back into the
  sheet, which Excel blocks while it has the file open.
- **Sorting and filtering are safe.** Words are matched by id, never by row position.
- **Deleting a row does not delete the word.** It gets reported and left alone.
  Removing a word is deliberate and separate, by design.
- **You can add your own columns.** Anything the lexicon does not recognise, such as
  a notes column, is left untouched.

### Changing a word that is already in the lexicon

This is treated as a bigger deal than adding one, on purpose. Claude will show you
exactly which characters differ and will not apply the change without an explicit
go-ahead. **Confirm the change with a speaker first.** Edited words are flagged for
review automatically, because the process cannot know who approved them.

---

## Checking the words

Ask Claude to *"open the lexicon review page"*. It renders every word properly and
plays its recording, which is the right way for a speaker to check them.

### Two audiences, two kinds of checking

A **speaker** checks a word by reading it rendered, in the spreadsheet or on the
review page.

A **maintainer** checks a word by reading codepoints: the `codepoints` array in
`lexicon.json`, the before/after diff the import prints, and the git diff.

Never ask a speaker to verify that `U+0313` should have been `U+0315`. Nobody reads
Unicode by eye, and the two marks look identical on screen.

---

## For developers

Requires Node 20 or newer.

```bash
npm run lexicon:import              # validate, diff, report - writes nothing
npm run lexicon:import -- --apply   # apply, then re-lock and verify
npm run lexicon:verify              # integrity check
npm run lexicon:review              # serve the review page
npm test                            # integrity and codec tests
npm run ci                          # everything CI runs
```

`lexicon:import` is the whole update path: it validates the spreadsheet, diffs it
against the lexicon, applies the change, and reports what happened. Ids it generates
are written back into the sheet in place. The sheet is never rebuilt from the
lexicon, so anything else in the file survives.

The workflow assumes `lexicon.xlsx` exists. If it is missing, damaged, has lost its
header row, or is open in Excel, the import stops and says which. Read the message
rather than working around it. When new words need ids written back, it checks the
sheet is writable *before* touching `lexicon.json`, so a failed run never leaves the
two out of step.

```bash
npm run lexicon:sheet               # recovery only: rebuild a lost spreadsheet
```

`lexicon:sheet` is **not** part of the normal loop, and running it out of habit will
cost you work. It generates the sheet *from* the lexicon, which is the wrong
direction: anything the lexicon does not store, such as a notes column, is gone. Use
version control to restore a deleted sheet. This is the last resort when there is no
copy to restore. It refuses to overwrite a sheet holding edits that have not been
imported.

### Generated files: do not hand-edit

| File | |
|---|---|
| `lexicon/lexicon.json` | Generated from the spreadsheet. Committed, so every change to a Klallam string is a readable diff. |
| `lexicon/lexicon.lock` | SHA-256 of the linguistic content. Any character change fails `lexicon:verify` until it is deliberately re-locked. |

If `lexicon:verify` fails complaining about the lock, a Klallam string changed. That
is either an import you meant to make, or something to look into.

### Design notes

- `PLAN.md` &mdash; architecture, tech decisions, and why the safeguards exist
- `CLAUDE.md` &mdash; rules for AI agents working in this repo
- `.claude/skills/update-lexicon/` &mdash; the lexicon workflow, for agents

The short version of the rule agents follow: **an agent never types Klallam
characters.** Text goes from a speaker's keyboard into Excel, and from Excel into
`lexicon.json` through a parser. It never passes through a language model, where a
combining mark could be altered in a way nobody would see.
