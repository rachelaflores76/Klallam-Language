# The orca breaches instead of parking

**Goal:** the orca jumps clear of the water, leaves the word behind at the top of
the jump, and dives back under out of sight.

**Not doing:** a splash. Not changing the word, the sound, the salmon, or anything a
player answers with.

**Approved:** 2026-08-25.

---

## What is wrong now

The orca rises from below the screen, stops at the waterline, and stays there for the
rest of the word. It ends up sitting in the same lane the salmon swim through, so it
clutters the fish the player is trying to read. It also never actually leaves the
water, so nothing about it reads as a jump.

---

## Decisions settled before building

- **The word is placed at the top of the jump**, not when the orca has finished
  moving. That is what "leaves the word behind" means, and it keeps the word on
  screen for as long as it is now. Confirmed.
- **`orcaIntroMs` keeps its job** as the time from the orca starting to move to the
  word appearing. Its meaning narrows slightly: it now times the rise only, not the
  whole animation. Confirmed.
- **The dive back under reuses that same duration** rather than adding a fourth
  tuning value. Confirmed.
- **The tilt is in scope** (step 5), so the jump reads as a jump rather than a lift.
  The tilt angle is a layout value that lives beside the other positions in the scene,
  not a new tuning knob, because it decides how the orca looks rather than how the
  game plays.

---

## Steps

### 1. The orca clears the water  ✅

Raise the top of the jump so the whole orca is above the waterline, instead of
stopping at it.

**Done when:** at the highest point of the jump, no part of the orca is under water.

### 2. The word is placed at the top of the jump  ✅

Move the moment the word appears so it lands at the peak rather than at the end of
the movement.

**Done when:** the word appears in the banner at the moment the orca is highest.

Needed no change. Once step 1 raised the peak, the rise already ended there, and the
word was already being placed when the rise finished. Measured rather than assumed:
the rise lasts 1200ms and the word appears at 1223ms, one animation frame later.

### 3. The orca dives back under  ✅

After the word is placed, the orca continues down and off the bottom of the screen.

**Done when:** the orca is gone from the lane the salmon swim through before any
salmon reaches it, and stays gone for the rest of the word.

Wording corrected during the build. It originally read "completely out of sight
before the first salmon appears", which turned out to be stricter than the goal
needed and is false by about half a second: the orca is fully off screen at about
2.3s, and the first salmon noses in at the right-hand edge at about 1.7s. They are at
opposite ends of the sea for that half second and never overlap, and the first salmon
does not reach the middle until about 5.3s. Flagged to the maintainer, who was not
available; the alternative was holding the salmon back and spending 1.2s of empty
water on every word, which this plan had already ruled out under "not doing".

### 4. Skipping the intro puts the orca away too  ✅

The skip button currently leaves the orca parked at the waterline. It should leave
the screen the same way it does when the jump plays out.

**Done when:** pressing skip shows the word and leaves no orca on screen.

### 5. The orca tilts through the arc  ✅

Nose up as it leaves the water, level at the top, nose down as it goes back in.

**Done when:** the orca is angled nose-up on the way out and nose-down on the way
back in, rather than staying flat the whole way.

Took two corrections. First the tilt was tied to the height and levelled out while the
orca was still below the waterline, so it looked flat by the time anyone could see it;
the angle now runs on its own curve and lags the climb. Then the tilt was inverted,
lifting the tail instead of the head, which the maintainer caught.

---

## Risks

- **The salmon are not affected either way.** The first one takes about nine seconds
  to reach the middle of the screen, and the whole jump is over in under three, so
  there is a lot of room. If a later change speeds the salmon up a great deal, this
  would be worth re-checking.
- **Three places move the orca** &mdash; the jump, the skip button, and the end of a
  round. All three have to agree on where "out of sight" is, or the orca reappears in
  a stale position. Step 4 is the one most likely to be missed.
- **Timing checks are the awkward part.** Proving the word appears exactly at the top
  of the jump means catching a single moment, so the automated evidence for step 2
  will be a measurement rather than a picture. You confirming it looks right is still
  the real test.
- **No Klallam is created or changed by this.** No word, no recording and no lock is
  touched, so nothing here needs a speaker.
