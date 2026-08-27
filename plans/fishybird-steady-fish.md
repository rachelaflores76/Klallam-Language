# Steady fish, and a guard on what a fish can say

**Goal:** salmon travel at exactly the speed their level says, from the moment they appear,
and nothing but plain English can ever be written on one.

**Not doing:** changing any level's speed, spacing or forgiveness. This is about the fish
moving evenly, not about how fast they are.

**Approved:** 2026-08-26. Step 2 dropped at the maintainer's request: with no bug found,
the guard was not worth the code. It stays written down here in case a Klallam character
ever does turn up on a fish.

---

## What was found

**The Klallam on a fish.** It cannot come from the word data. Salmon are only ever given a
word's English meaning, and no entry in the lexicon has a single non-English character in
that field - checked across all 102 entries. So either something else was seen (the word
banner above the game, or the end-of-round list, both of which do show Klallam), or it was
a trick of the eye. Nothing was found to fix. What is missing is anything *stopping* it:
if a Klallam character ever ends up in an English meaning, a fish would carry it and no
check would object. That gap is worth closing whether or not it explains what was seen.

**The uneven speed.** Measured on Level 3, ten words with nothing caught:

| | time from one word to the next |
|---|---|
| first word of the round | 9,653ms |
| every word after it | 8,290ms, 8,290ms, 8,316ms, 8,299ms |

The first word of a round runs about 1.4 seconds long, and the rest are within 26ms of
each other. Something slows the fish at the start of a round.

The cause is that both the fish's movement and the timer that releases them were driven by
how much time the game *thinks* passed since the last frame. Phaser smooths and caps that
figure, and while a scene is warming up it under-reports. Measured on the first word of a
round, with the gap between fish set to 1000ms:

| | fish 1 to 2 | 2 to 3 | 3 to 4 |
|---|---|---|---|
| first word | 1876ms | 1343ms | 1000ms |
| every word after | 968ms | 1031ms | 1000ms |

So at the start of a round the fish both move slower than their level says and arrive
further apart, settling down after about two seconds. That is what "starts slow, then
speeds up once the second fish appears" looks like from the outside.

Frame timing in this browser was steady (32.6ms a frame, no stutters, no blocking work),
so this is the mild version of the problem rather than a machine struggling.

---

## Steps

### 1. Move the fish by the clock, not by the frame  ✅

Each salmon remembers the moment it was due in the lane, and its position is worked out
from how much time has actually passed. The fish are released on the same clock rather
than by a frame-counted timer. Nothing about speed, spacing or forgiveness changes.

**Done when:** the first word of a round takes the same time as the words after it, within
about a tenth of a second, measured the same way as the table above.

**Result:** every word now takes between 8,308ms and 8,318ms - a spread of 10ms, against
1,260ms before. Catching, scoring and the word memory were checked afterwards and still
behave.

*Half of this was found only after the first attempt: moving the fish by the clock fixed
their speed but left them arriving unevenly, because the timer releasing them counted
frames too. Both halves are now on the clock.*

### 2. A check that a fish can only ever say English  — not doing

A test asserting every English meaning in the lexicon is plain ASCII, so a Klallam
character in that column stops the checks rather than reaching a fish.

**Dropped.** Traced the code with the maintainer: `createSalmon` is only ever handed a
choice's English meaning, and no path passes the Klallam field to a fish. With no bug to
fix, the guard was judged not worth the code.

---

## Risks

- **The exact thing reported was not reproduced.** What was seen was one fish appearing to
  speed up; what was measured was a round's first word running long. Both have the same
  cause, but if uneven speed is still visible after this, it is a different problem and
  worth reporting again.
- **Fish will now jump rather than crawl** if the browser stalls badly. Moving by the clock
  means a fish that was stuck for half a second reappears where it should be, instead of
  drifting behind. That is correct, but it is a visible change if a machine is struggling.
- **The guard does not explain the sighting.** If Klallam on a fish is seen again, a
  screenshot would settle it, because nothing in the code can currently produce it.
