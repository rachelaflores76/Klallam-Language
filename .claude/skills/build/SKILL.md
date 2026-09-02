---
name: build
description: Implement agreed steps one at a time, running the checks after every step. The steps may have been proposed in chat or written to plans/. Use when the user says to start building, or to carry on with work already underway. Requires the user's yes on the steps; if there is none, use the plan skill first.
---

# Building from agreed steps

## The rule

**One step at a time, checked before the next one starts.**

Nobody is timing you. The user cannot read the code, so the only thing telling them
the work is sound is that every step was checked before the next one was built on
top of it.

## Before the first step

The user must have said yes to the steps. They may be in a chat message or in
`plans/<slug>.md` &mdash; either is fine, and the `plan` skill decides which. What is
not fine is building from a request that was never turned into steps anyone agreed
to. If that is where you are, use the `plan` skill.

## The code is the source of truth

If a plan file says the game does one thing and the code does another, the code is
right and the plan is stale. Check reality before you build on top of a claim: open
the file, run the thing, look. A plan is a statement of intent from the moment it was
written, and nothing updates it when the code moves on.

The same goes for other files in `plans/`. Do not read them for background. They are
leftovers from work in flight, not documentation.

## Klallam text: use it, never write it

Read words from the lexicon as much as you like &mdash; through `@klallam/lexicon`,
at runtime. Never type a Klallam character yourself, and never paste one into a
source file: the ASCII guard fails the build for exactly that, because a word
inlined in code is a word outside the lock.

If a step turns out to need a word the lexicon does not have, or one that is spelled
wrong, that step is blocked and the others are not. Tell the user what is missing
and that the fix is theirs: **edit `lexicon/lexicon.xlsx`, then run
`update-lexicon`.** Then carry on with the steps that do not depend on it.

## The loop, once per step

1. Read the step and its **done when**.
2. Make that change. Only that change.
3. Run `npm run ci`.
4. Green: tick the step off &mdash; in the plan file if there is one, in your report
   if there is not &mdash; and commit it, using the step's name as the message.
5. Say in plain language what changed and what the user can now see.

Repeat. When the last step is ticked, use `validate`. **The work is not finished
until validate passes** &mdash; that is not a courtesy step, and a Stop hook enforces
it whether you remember or not.

Something you noticed along the way that ought to be fixed is a note for the user,
not a step you quietly add.

## When the steps turn out to be wrong

That happens, and usually halfway through. Say what you found, propose the change to
the steps, wait for a yes. Never silently build something other than what was agreed.
If there is a plan file, correct it in the same breath rather than letting it drift
from what you are actually doing.

## When a check goes red

**Stop.** Find the cause and fix it. Do not start the next step on top of a red
check, and do not work around the check.

`lexicon:verify` failing about the lock means a Klallam string changed. Report it
and stop. Re-locking to make the error go away destroys the only thing that would
have caught it.

## Excuses to skip a step, and why they are wrong

| "..." | Actually |
|---|---|
| "Steps 2 and 3 are related, I'll do them together." | Then when the check fails you do not know which one broke it. |
| "I'll run the checks once at the end." | And debug five changes at once instead of one. |
| "The failure is unrelated to my change." | Show that it fails without your change, or fix it. Assuming costs more than proving. |
| "This small extra fix belongs with this step." | It belongs in your report, so the user gets to decide. |
| "I'll re-lock to get past the verify error." | The lock exists for precisely this moment. Clearing it is deleting the alarm. |
| "It's built, I'll report it done and validate afterwards." | Done is a claim about evidence you do not have yet. The hook hands it back to you anyway. |
| "I need a word that isn't in the lexicon, I'll just add it." | You cannot type it safely. Ask, and build the steps that do not depend on it. |
| "The plan says it works this way, so it does." | The plan says it was meant to. Open the file and find out. |

## Never do these

- Build steps the user has not agreed to
- Do two steps before running the checks
- Carry on past a failing check
- Call the work finished before `validate` has passed
- Trust a plan file over the code, or read an unrelated one for background
- Hand-edit `lexicon.json` or `lexicon.lock`, or re-lock to clear an error
- Type a Klallam character, or paste one into a file, a commit message or chat
- Do work the agreed steps do not contain
