# Level selection

**Goal:** the game opens on a list of levels to choose from, and a button in the top
corner lets a player switch level at any time.

**Not doing:** changing what the levels themselves do. Their speeds, spacing and choice
counts stay exactly as they are.

**Approved:** 2026-08-26.

---

## Decisions already made

Answered by the maintainer before this was written:

- **Every level is pickable from the start, and the unlock system goes.** Once a player
  can choose any level, unlocking one is decorative, and leaving the machinery in place
  would mean maintaining something nothing uses.
- **The list shows level names only** — "Level 1", "Level 2", "Level 3", as they are
  already named in the config. No speeds, no descriptions.
- **The summary screen stays as it is**, with a "Change level" button added beside "Play
  again", so the missed-words list is not lost.

---

## What the player sees

Three places, all English text, no Klallam:

- **On load:** a panel headed "Choose a level" with one button per level. This replaces
  the current Start button, and does the same job of being the first tap, which is what
  lets the browser play sound at all.
- **During a round:** a "Change level" button in the top right corner. Pressing it
  abandons the round and brings the chooser back.
- **At the end of a round:** "Play again" as now, plus "Change level".

---

## Steps

### 1. Turn the start screen into a level chooser  ✅

The overlay builds one button per entry in `LEVELS`, so adding a fourth level later adds
a fourth button with no further work. Picking a level starts a round at it.

**Done when:** loading the game shows one button per level, and picking Level 3 runs a
round at Level 3's speed rather than Level 1's.

### 2. Add the "Change level" button during a round  ✅

A button in the top right corner brings the chooser back mid-round. Picking a level
abandons what was in progress and starts a fresh round at the chosen one.

**Done when:** pressing it mid-round shows the chooser, and picking a level starts again
from the first word with the score back to zero.

### 3. Add "Change level" to the end-of-round screen

**Done when:** after a round, the summary offers both "Play again" and "Change level",
and the missed words are still listed.

### 4. Take out the unlock system

`progress.ts` goes, along with the stored unlocked level, the "New level unlocked"
message, and the `advanceAtCaught` and `forceLevel` settings that only existed to serve
it. The summary says which level was played instead.

**Done when:** the game stores nothing in the browser, still plays, and the checks pass.

### 5. Bring the written plans in line

`PLAN.md` section 3a still documents `advanceAtCaught` and `forceLevel`. The difficulty
levels plan needs a note saying its unlock behaviour was replaced by this chooser, so the
record is not misleading later.

**Done when:** the config block in `PLAN.md` matches the real file.

---

## Risks

- **This deletes work finished an hour ago.** Steps 3 and 4 of the difficulty levels plan
  built the unlocking and the storage behind it. That is the right call now the levels are
  freely chosen, but it is worth saying out loud rather than quietly reversing.
- **Nothing is remembered between visits any more.** Reloading always returns to the
  chooser. That is a consequence of dropping stored progress, not an oversight; the
  spaced-repetition work later in Phase 3 will bring storage back for word history.
- **The space bar makes the eagle dive**, so a level button left holding focus would
  swallow it. The existing buttons already deal with this and the new ones must too.
- **The top right corner is over the game area**, which is a fixed-size canvas. On a narrow
  screen the button could sit awkwardly. Worth a look on a tablet.
