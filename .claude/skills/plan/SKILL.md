---
name: plan
description: Turn a request into a written, numbered plan before any code exists. Use when the user asks for a new feature, a change to a game, a fix, or anything that is not a Klallam word change. Produces plans/<slug>.md and stops for approval. Writes no code.
---

# Planning a change

## The rule

**No code until the plan is written down and the user has said yes.**

The plan is a file, `plans/<slug>.md`, not a message in chat. The person maintaining
this project does not read code. The plan is how they stay in control of the work:
they can read it, correct it before anything is built, and re-read it next week. A
plan that exists only in the conversation cannot be corrected once the conversation
ends.

## Two things to settle before you plan anything

**Klallam text: use it freely, never change it.** A plan can read words from the
lexicon, pass them into a game, sort them, render them on screen. Load them through
`@klallam/lexicon` at runtime. What you must never do is *produce* a Klallam
character &mdash; not in code, not in the plan file, not in a message. Reading the
lexicon is safe; retyping what you read is how a diacritic gets silently rewritten.

If the change needs a word that is not in the lexicon yet, or one that is spelled
wrong, that is not a step you can plan around. It is a job for the user, and only
them: **they edit `lexicon/lexicon.xlsx`, then run the `update-lexicon` skill.** Say
so plainly, list it under **Risks** as something the plan depends on, and carry on
planning everything else. Do not stall the plan over it, and do not start the
spreadsheet workflow in the middle of planning.

**Permanent constraints.** `CLAUDE.md` rules out backends, servers, APIs, databases,
accounts and multiplayer for the life of this project. These are not v1 limits
waiting to be revisited. If the request needs one, say so now and offer the
client-side version instead. Finding it during the build costs a rewrite; finding it
now costs a sentence.

## The loop

1. **Ask what's unclear**, one question at a time, until you could hand the plan to
   someone else and they would build the right thing. Skip this if it is already
   clear. Do not interrogate someone who has told you exactly what they want.
2. **Write `plans/<slug>.md`.**
3. **Show it and wait for a yes.** A plan that looks obvious to you is still a
   decision that belongs to the user.

## What a plan contains

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
- Six steps is a large change. More than that is two plans.

## Excuses to skip this, and why they are wrong

| "..." | Actually |
|---|---|
| "It's a one-line change, a plan is overkill." | Then it is a one-step plan and costs a minute. The expense was never the writing. |
| "I'll write the plan as I go." | A plan written during the build is a description of what you already decided. |
| "They described exactly what they want, I can just build it." | They described the outcome. The plan is where the steps get shown, and the steps are where the surprises live. |
| "The approval is a formality." | Then it costs nothing to wait for it. |

## Never do these

- Write or edit code in this skill
- Write a Klallam character into the plan file, or plan a step that types one
- Plan a step that edits the lexicon; that is the user's job, through the spreadsheet
- Plan a backend, an account system, or anything needing a network
- Start building before the user says yes
- Leave the plan in chat instead of in `plans/`
