# CLAUDE.md

## Project Purpose
This project exists to teach the Klallam language (also referred to by the user as "Khallam").
It will contain multiple games over time, all sharing a single lexicon.

## Architecture Constraints (Permanent)
These are not v1 limitations. They apply for the life of the project.
- No backend, no servers, no APIs, no databases.
- No user accounts, authentication, or login.
- No multiplayer, leaderboards, or networked features.
- Everything runs client-side and ships as static files.
- Persist player progress in `localStorage` only.
- Do not introduce a dependency that requires a server to function.

## Shared Lexicon Rules
- All Klallam content lives in the shared lexicon package, never inside a single game.
- Games consume the lexicon; they never define, duplicate, or override word data.
- Never copy word entries into a game folder.

## Critical Language Preservation Rules
- Treat all Klallam text as authoritative source material.
- Do not alter, normalize, simplify, transliterate, or "correct" any Klallam words.
- Preserve all diacritics, accent marks, special characters, punctuation, spacing, and capitalization exactly as written.
- Never replace characters with ASCII alternatives.
- If copying text between files, copy it exactly character-for-character.

## Translation Integrity Rules
- Do not rewrite direct translations unless explicitly asked.
- Do not "improve" or reinterpret the meaning of established translations.
- If a translation seems unusual, flag it and ask before changing anything.
- When uncertain, prefer leaving original wording unchanged.

## Editing Behavior for Agents
- Assume unusual spellings/marks are intentional and linguistically meaningful.
- Prioritize fidelity over style edits in language content.
- Keep educational examples and vocabulary entries stable unless the user requests a specific correction.

## Adding or Changing Lexicon Entries

- `lexicon/lexicon.xlsx` is the only place a human edits Klallam text. There is no second option.
- `lexicon.json` and `lexicon.lock` are generated from it. Never hand-edit either.
- Use the `update-lexicon` skill, which drives the spreadsheet workflow and handles re-locking.
- The user types or pastes Klallam into the spreadsheet, so no agent ever retypes the characters.
- Always show the user the `lexicon:import` dry-run report before applying it.
- Codepoints are for whoever reviews the change technically, in the import report and the
  git diff. Never ask a speaker to verify Unicode codepoints; they verify a word by reading
  it rendered in the sheet or on the review page.
- Changing the Klallam of an existing word needs a speaker's confirmation, not agent judgement.

## Making Any Other Change
- Every change that is not a lexicon entry goes through the same loop: `plan` &rarr; `build` &rarr; `validate`.
- The skills live in `.claude/skills/`. Use them; do not improvise a substitute.
- `plan` settles the steps and stops for approval. No code is written before that yes.
- A written plan file is for big changes only &mdash; several files, real unknowns, more than about four steps. Anything smaller gets its steps proposed in chat and starts on the user's yes. Demanding a document for a two-line change is friction, not rigour.
- Plan files are transient. `validate` deletes `plans/<slug>.md` when the work is done, and git history keeps the record.
- Never read an old plan to learn how the project works. The code is the source of truth; a plan only ever recorded an intention.
- `build` does one step at a time and runs `npm run ci` after each. A red check stops the work.
- `validate` reports what the checks proved and what a human still has to confirm by eye.
- `validate` has to pass before anything is called done. A Stop hook in `.claude/settings.json` runs `npm run ci` and refuses to end a turn that left the checks red.
- Reading Klallam from the lexicon is fine and expected; producing a Klallam character is not. Work needing a new or respelled word waits on the user editing `lexicon/lexicon.xlsx` and running `update-lexicon`. Say so and build the rest.
- The maintainer is not a programmer. Report in plain language and never let a caveat go unsaid.

## If Conflicts Arise
When there is a conflict between style/formatting preferences and Klallam text fidelity, preserve the original Klallam text exactly.
