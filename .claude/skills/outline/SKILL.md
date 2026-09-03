---
name: outline
description: Decide how a change gets done and agree the steps before any code exists. Small changes get their steps proposed in chat; changes spanning several files or carrying real unknowns get a throwaway plan file in plans/. Use when the user asks for a new feature, a change to a game, a fix, or anything that is not a Klallam word change. Writes no code.
---

# Planning a change

## The rule

**No code until the steps are agreed. Not every set of steps needs a file.**

The person maintaining this project does not read code, so they stay in control by
reading the steps and correcting them before anything is built. Sometimes that fits
in a chat message. Sometimes it does not. Getting that judgement right is most of
this skill.

## First, decide whether this needs a plan file

Write `plans/<slug>.md` when **any** of these is true:

- The change touches several files, or several parts of the project.
- There are real unknowns &mdash; something has to be looked into before the shape of
  the work is clear.
- It runs to more than about four steps.
- The user asked for a plan.
- You are about to make a decision the user would want to overrule, and it is easier
  to read than to describe.

Otherwise: **propose the steps in chat and start once the user says yes.** A two-line
change in one file does not need a document, and demanding one is friction the user
notices and resents.

If you cannot tell which side of the line something falls on, that uncertainty *is*
the signal &mdash; write the file.

## A plan file is a ticket, not a record

It exists to get agreement and to hold your place while you build. When the work is
done, `validate` deletes it. Nothing left in `plans/` describes how the project
works.

**The code is the only source of truth.** A plan describes what someone intended at
the time it was written, and nothing warns you when that stops being true. Never read
an existing plan file to learn how something currently behaves &mdash; read the code.

## Two things to settle before you plan anything

**Klallam text: use it freely, never change it.** A plan can read words from the
lexicon, pass them into a game, sort them, render them on screen. Load them through
`@klallam/lexicon` at runtime. What you must never do is *produce* a Klallam
character &mdash; not in code, not in the plan file, not in a message. Reading the
lexicon is safe; retyping what you read is how a diacritic gets silently rewritten.

If the change needs a word that is not in the lexicon yet, or one that is spelled
wrong, that is not a step you can plan around. It is a job for the user, and only
them: **they edit `lexicon/lexicon.xlsx`, then run the `update-lexicon` skill.** Say
so plainly, name it as something the work depends on, and carry on planning
everything else. Do not stall over it, and do not start the spreadsheet workflow in
the middle of planning.

**Permanent constraints.** `CLAUDE.md` rules out backends, servers, APIs, databases,
accounts and multiplayer for the life of this project. These are not v1 limits
waiting to be revisited. If the request needs one, say so now and offer the
client-side version instead. Finding it during the build costs a rewrite; finding it
now costs a sentence.

## The loop

1. **Ask what's unclear**, one question at a time, until you could hand the steps to
   someone else and they would build the right thing. Skip this if it is already
   clear. Do not interrogate someone who has told you exactly what they want.
2. **Work out the steps**, then decide by the test above whether they go in chat or
   in `plans/<slug>.md`.
3. **Show them and wait for a yes.** Steps that look obvious to you are still a
   decision that belongs to the user. This does not get skipped because the change is
   small &mdash; the file is optional, the agreement is not.

## What the steps look like

Same shape either way. A chat proposal is a shorter version of the same thing, and a
plan file that has no risks worth naming does not need the heading.

```md
# Add a replay button to the word banner

**Goal:** one sentence, plain language, no jargon.
**Not doing:** what this deliberately leaves out.

## Steps

### 1. Short name
What changes and where.
**Done when:** something observable.

### 2. ...

## Risks
- What could go wrong, or what we are guessing about.
```

Rules for steps:

- Small enough to finish and check on its own. If a **done when** needs the word
  "and", it is two steps.
- **Done when** must be observable by running something or looking at something.
  "The code is written" is not done.
- Ordered so nothing depends on a step that comes later.
- Six steps is a large change. More than that is two plans, done one after the other.

## Excuses, and why they are wrong

| "..." | Actually |
|---|---|
| "I'll write a plan file to be safe." | A file nobody needed is friction, and it outlives its own accuracy. Judge it honestly. |
| "It's small, so I'll just start." | Small still gets its steps said out loud and a yes back. Only the file is optional. |
| "I'll write the plan as I go." | A plan written during the build is a description of what you already decided. |
| "They described exactly what they want, I can just build it." | They described the outcome. The steps are where the surprises live. |
| "The approval is a formality." | Then it costs nothing to wait for it. |
| "There's an old plan covering this area, I'll read it for context." | It may be months out of date and nothing warns you. Read the code. |

## Never do these

- Write or edit code in this skill
- Demand a plan file for a change that plainly does not need one
- Skip the user's yes because the change is small
- Treat a file in `plans/` as a description of how the project currently works
- Write a Klallam character into a plan file, or plan a step that types one
- Plan a step that edits the lexicon; that is the user's job, through the spreadsheet
- Plan a backend, an account system, or anything needing a network
- Start building before the user says yes
