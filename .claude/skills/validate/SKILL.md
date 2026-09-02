---
name: validate
description: Confirm a change is really finished - run the automated checks, retire the plan file if there was one, then tell the user in plain language what they still have to look at with their own eyes. Use when the agreed steps are done, or when the user asks whether something works or is ready.
---

# Validating a change

## The rule

**Green checks are evidence, not proof.** Report what was checked *and* what was not.

The machine can prove that characters did not drift and that the tests pass. It
cannot prove the game teaches anything, that the word is right, or that the page
reads well. That part is the user's, and this skill's job is to name it precisely
enough for someone who does not read code to actually do it.

## The loop

1. Run `npm run ci` &mdash; the ASCII guard, the TypeScript check, lexicon integrity,
   and the test suite.
2. Walk each **done when** line one at a time. Each is either satisfied or it is not.
   A step you cannot demonstrate is not done.
3. If the work had a plan file, delete `plans/<slug>.md` and commit the deletion with
   the change. The code now says what the code does; the plan has nothing left to
   tell anyone, and left in place it will eventually mislead someone.
4. Write the report.

## The plan file is retired, not archived

## The plan file is retired, not archived

Deleting it loses nothing: the commits are the record of what changed, and `git log`
still has every word of the plan if anyone ever wants it. What deleting it does buy
is that no future reader &mdash; person or agent &mdash; mistakes a description of
last month's intentions for a description of the code.

If steps are left unfinished, the work is not validated. Leave the file where it is
and say what remains.

## This step is enforced

A Stop hook runs the checks before the agent is allowed to finish a turn in which
files changed. Red means the failure is handed straight back with the output
attached, and the work is not over. You cannot report a change as done around it.

Switching the hook off to get past a failure is the same mistake as re-locking the
lexicon to clear a verify error: it removes the thing that was doing its job.

## The report

Three parts, plain language, no command names.

**Checked automatically.** What passed, in words. "Every Klallam word still matches
the characters it was recorded with", not "lexicon:verify OK".

**For you to look at.** The things only a person can confirm, written as
instructions rather than suggestions:

- Words changed &rarr; "Open the review page and read these three words: …"
- A game changed &rarr; "Play a round and check that …"
- Klallam text changed &rarr; a speaker rules on it. Not the user, not you.

**Not covered.** What nobody checked. Say it even when nobody asked.

## When it is not done

Say so plainly, and stop. Do not soften it and do not describe a half-working change
as working. The user cannot read the code to catch you being optimistic, which is
exactly why you have to be exact.

## Excuses to call it done, and why they are wrong

| "..." | Actually |
|---|---|
| "CI is green, so it works." | CI proves nothing broke. It cannot tell you the thing you built does its job. |
| "I'll say done and mention the caveat at the end." | A caveat the user has to notice is not a caveat. It is a surprise on a delay. |
| "They'll see for themselves if it's wrong." | Not unless they know where to look. Telling them where is the job. |
| "The word looks right to me." | You cannot see a combining mark, and neither can the user. A speaker rules on Klallam, every time. |
| "I'll keep the plan file, it's a useful record." | The commits are the record. A kept plan is a stale explanation waiting to be believed. |

## Never do these

- Report done with a check that failed, or one you did not run
- Describe a partly working change as working
- Leave a finished plan file sitting in `plans/`
- Delete a plan file whose steps are not all done
- Disable or work around the Stop hook
- Ask a speaker to verify codepoints &mdash; they verify a word by reading it rendered
- Ask anyone to accept "it looks fine" in place of running the checks
