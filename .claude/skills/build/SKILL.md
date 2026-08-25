---
name: build
description: Implement an approved plan from plans/, one step at a time, running the checks after every step. Use when the user says to start building, or to carry on with a plan already underway. Requires an approved plan; if there is none, use the plan skill first.
---

# Building from a plan

## The rule

**One step at a time, checked before the next one starts.**

Nobody is timing you. The user cannot read the code, so the only thing telling them
the work is sound is that every step was checked before the next one was built on
top of it.

## Before the first step

There must be an approved plan in `plans/`. If there is not, use the `plan` skill.
Do not build from a conversation.

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
4. Green: tick the step off in the plan file and commit it, using the step's name as
   the message.
5. Say in plain language what changed and what the user can now see.

Repeat. When the last step is ticked, use `validate`. **The work is not finished
until validate passes** &mdash; that is not a courtesy step, and a Stop hook enforces
it whether you remember or not.

Something you noticed along the way that ought to be fixed is a note for the user,
not a step you quietly add.

## When a check goes red

**Stop.** Find the cause and fix it. Do not start the next step on top of a red
check, and do not work around the check.

`lexicon:verify` failing about the lock means a Klallam string changed. Report it
and stop. Re-locking to make the error go away destroys the only thing that would
have caught it.

## When the plan turns out to be wrong

That happens, and usually halfway through. Say what you found, propose the edit to
the plan file, wait for a yes. Never silently build something other than what was
approved.

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

## Never do these

- Build without an approved plan
- Do two steps before running the checks
- Carry on past a failing check
- Call the work finished before `validate` has passed
- Hand-edit `lexicon.json` or `lexicon.lock`, or re-lock to clear an error
- Type a Klallam character, or paste one into a file, a commit message or chat
- Do work the plan does not contain
