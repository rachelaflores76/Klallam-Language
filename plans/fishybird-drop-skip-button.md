# Lose the skip button

**Goal:** the "Skip the intro" button disappears from the game, along with everything
that existed only to serve it.

**Not doing:** changing the orca intro itself. It still surfaces, still takes 1.2
seconds, still hands over the word. There is simply no longer a way to cut it short.

**Approved:** 2026-08-27. The maintainer found the button distracting and unhelpful.

---

## What this touches

The button is small on screen and larger in the code than it looks. It has:

- a button in the page itself
- three methods on the game's interface to the page: one to wire it up, one to show or
  hide it, one to handle the press
- four places in the game that show or hide it as a word comes and goes
- a method that performs the skip
- a setting, `orcaIntroSkippable`, that gated the whole thing

All of it goes.

**This overrules a written principle.** `PLAN.md` lists "Orca intro must be skippable"
among the game's design rules, next to "make it forgiving" and "feedback cannot be
colour-only". The maintainer has decided the rule was written for an intro that might
have been long, and 1.2 seconds does not need an escape hatch. The rule is struck out
rather than quietly broken.

---

## Steps

### 1. Remove the skip button and everything behind it  ✅

The button leaves the page, the three interface methods and their implementations go,
the calls that showed and hid it go, the skip itself goes, and `orcaIntroSkippable`
leaves the settings file. `PLAN.md` loses the skippable principle and the setting from
its settings block.

**Done when:** no skip button appears at any point in a round, the orca intro still
plays and still hands over the word, and searching the project for "skip" turns up
nothing in the game's own code.

**Result:** done. Checked by driving the page: the button is not in the page at all,
never appears at any point during a round, the word still arrives after the intro, and
the controls row is left holding "Hear it again" beside the score, centred and tidy.
A search for "skip" now finds it only in the built output, which is regenerated, and in
older plan files that record what the button used to do.

---

## Risks

- **There is now no way past the intro.** Ten words a round at 1.2 seconds each is
  twelve seconds of a round that a player cannot shorten. That is the accepted cost.
  If it ever grates, the setting to bring back is a shorter `orcaIntroMs` rather than
  the button.
- **The controls row loses one of its two buttons**, so "Hear it again" will sit
  differently on screen. Worth a glance to confirm the row still looks deliberate
  rather than lopsided.
