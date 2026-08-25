---
name: update-lexicon
description: Add words to the shared Klallam lexicon, correct an existing entry, attach recordings, or resolve a needs_review flag. Drives the spreadsheet workflow- the user edits lexicon.xlsx, the CLI imports it and handles codepoint verification and re-locking. Use whenever the user wants to change Klallam vocabulary data. Do not hand-edit lexicon.json or lexicon.lock.
---

# Changing the Klallam lexicon

## The rule

**Never type, copy, or reproduce Klallam characters.** Not in chat, not in a file,
not in a terminal command.

U+0313 and U+0315 render identically, so a string corrupted while passing through
you is invisible to whoever reviews your output. You handle ids, English glosses,
filenames, and `U+XXXX` codepoints. All ASCII, all checkable by eye.

`lexicon/lexicon.xlsx` is the only place Klallam is edited. Never offer another
surface. Text goes from the user's keyboard into the sheet, and reaches
`lexicon.json` only through the import parser.

## The loop

The user edits the sheet. You turn it into JSON.

1. `npm run lexicon:import` &mdash; dry run, writes nothing. **Show them the report.**
2. `npm run lexicon:import -- --apply` &mdash; writes entries and codepoints, re-locks, verifies.

Then report the new ids, whether recordings linked, and any review flags raised.

The CLI treats the sheet as untrusted and runs every check before writing anything:
AutoCorrect damage, missing recordings, near-duplicate glottalization, a row that
lost its id, the file open in Excel. **When it stops, relay its message and stop
too.** It explains itself and names the fix. Do not work around it, and do not
reach for `lexicon:sheet`.

`README.md` covers the spreadsheet itself, on the rare occasion someone asks.

## Changing the Klallam text of a word that already exists

A linguistic decision, not a data entry task, so it is gated. The dry run shows the
codepoint diff and then stops:

```
npm run lexicon:import -- --apply --allow-edits
```

Edited entries are automatically marked `needs_review`.

## Resolving a needs_review flag

Entries carry `needs_review` and `review_reasons` explaining the doubt. Clearing a
flag requires a speaker's ruling, not a judgement call from you or the user. Run
`npm run lexicon:review` to serve the page a speaker checks.

Once ruled on, have the user set `needs_review` to `false` and empty
`review_reasons`, then run `npm run lexicon:lock`. Those fields are not part of the
lock hash, so verification will still pass.

## Commands

| Command | Purpose |
|---|---|
| `npm run lexicon:import` | Dry run: report what the sheet would change |
| `npm run lexicon:import -- --apply` | Apply the changes, then verify and lock |
| `npm run lexicon:verify` | Check integrity, write nothing |
| `npm run lexicon:lock` | Accept content changes into the lock |
| `npm run lexicon:review` | Serve the review page for a speaker to check |
| `npm test` | Run the integrity and codec test suite |

`npm run lexicon:sheet` also exists. It builds the sheet *from* the lexicon and is
for recovering a lost spreadsheet, not for any part of the normal workflow.

## Never do these

- Hand-edit `lexicon.json` or `lexicon.lock`
- Type a Klallam word into a terminal command, a file, or a chat message
- Offer the user any editing surface other than `lexicon.xlsx`
- Run `lexicon:sheet` as part of the normal workflow, or to work around an error
- Run `lexicon:import -- --apply` before showing the user a dry run
- Ask a speaker to verify codepoints; they verify by reading the word rendered
- Call `.normalize()` on Klallam text, or "clean up" spacing and accents
- Substitute an ASCII apostrophe for a glottal stop
- Clear a `needs_review` flag without a speaker's ruling

