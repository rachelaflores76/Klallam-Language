# Tap the fish you mean, and watch the rest bolt

**Goal:** the player picks an answer by tapping the fish itself, the shoal swims at
believable depths, and grabbing one fish sends the others fleeing once a level's
patience runs out.

**Not doing:** changing any level's speed, spacing, number of choices or word memory.
No new artwork. No keyboard control.

**Approved:** 2026-08-27, in conversation, with the questions below settled by the
maintainer. Eight steps rather than the usual six, because four separate requests
arrived together and they touch the same three files; splitting them into two plans
would have meant building the same code twice.

---

## What was asked, and what was decided

Four requests, and one follow-on:

1. **Tap a fish instead of pressing space.** The eagle currently drops straight down
   from the middle of the sky and catches whatever it happens to hit. It must instead
   fly to the fish that was tapped, sideways as well as down, aiming at where that
   fish *will be* rather than where it was.
2. **Catch forgiveness is not a per-level setting.** It is 18 at all three levels and
   always has been. It moves into the shared settings.
3. **Fish swim at different depths, and drift gently up and down.** For the look of
   it. It must not make the game meaningfully harder.
4. **Grabbing a fish scares the others off.** They bolt off the left edge and cannot
   be tapped while fleeing. Each level says how many wrong grabs a group forgives
   before that happens.
5. **The game fits the screen** (added after the fact). Now that aiming is by finger,
   a canvas that overflows a narrow screen is a real problem rather than a cosmetic one.

Settled in conversation:

- **The tap is the answer**, decided the instant it lands. The flight afterwards is
  animation. A fish drifting through the eagle's path can never be caught by accident.
- **The space bar goes**, with nothing replacing it. The game becomes pointer-only.
- **A wrong grab inside the allowance behaves exactly as it does today**: the fish you
  grabbed wriggles free and bolts, the rest keep swimming, the word plays again.
- **The scatter is what happens when the allowance runs out**, and on a correct catch,
  where it is only a flourish.
- **Nothing swims back in.** A retry is the fish already in the water, not a new group.
- **Fish that swim past untouched still end the word**, and cost no retry.

---

## Steps

### 1. Catch forgiveness becomes a shared setting  ✅

`hitboxPadding` leaves the three levels and becomes `tapPadding` in the shared block.
Nothing about how forgiving the game feels changes, because all three levels already
agreed on 18.

**Done when:** the checks pass and a round plays exactly as it did before.

**Result:** done. `Level` no longer carries it, `TUNING.tapPadding` does, and the one
place that read it now reads the shared value. All three levels said 18, so nothing
about the feel of the game moved.

### 2. Fish get their own depth and a gentle drift  ✅

Each salmon picks a depth within a band of the sea rather than sharing one lane, and
rises and falls a few pixels as it crosses. Both are worked out from the clock, the
way the fish's forward movement already is, so a browser that stalls does not leave
one fish out of step. Diving still works as it does today.

**Done when:** fish are visibly at different depths and drifting, no fish breaks the
surface or clips the bottom of the sea, and catching one still works.

**Result:** done, with one caveat. Depth is drawn per fish from a band 96 pixels tall,
and the drift is 6 pixels either way on a 2.4 second cycle starting at a random point,
so no two fish rise together. Confirmed by eye: fish sit at clearly different depths.

The first attempt put the band too high and the shallowest fish's tail grazed the
waterline, so the band was moved down and widened. It now clears the surface and the
seabed by 12 pixels at the extremes.

*The caveat:* the "catching one still works" half could not be demonstrated at this
step. The old dive drops straight down from the middle of the sky and has to be timed
to the fish, and the tools available could not time it reliably. It is proved in step
3 instead, where the tap picks the fish outright and a catch can be aimed on purpose.

### 3. The eagle flies to the fish that was tapped  ✅

Tapping a fish is the answer. The eagle works out where that fish will be by the time
it can get there, flies to that point, and the catch resolves on arrival. A tap on open
water does nothing at all. The space bar, the eagle's collision box and the old
straight-down dive all go.

**Done when:** tapping a fish catches that fish and no other, tapping open water does
nothing, and the space bar does nothing.

*Changed mid-build, with the maintainer's agreement.* The plan originally had a tap on
open water send the eagle down for a splash that cost nothing. It turned out to cost
something after all: while the eagle is in the air, taps are ignored, so a stray tap
locked the player out for about a second, exactly when they might have spotted the
right fish. The eagle now only leaves its perch for a fish.

**Result:** done. The aim is taken by guessing the flight time, seeing where the fish
got to, and guessing again, five times over. It settles only because the eagle is three
times the speed of the fastest fish, which is now written down in the settings file.

Checked by driving the page: taps aimed at fish scored catches on two separate runs,
and five rapid taps on open water changed nothing and blocked nothing that followed.
Fourteen presses of the space bar over fifteen seconds moved nothing at all. This also
proves the half of step 2 that could not be shown at the time: catching still works.

### 4. The eagle faces where it is going, and stays where it lands  ✅

It turns to face its direction of travel instead of flying backwards, and climbs back
to perch height above wherever it landed rather than snapping to the middle of the sky.
It is kept clear of the screen edges.

**Done when:** the eagle never flies tail-first, and after a catch on the left it is
perched on the left.

**Result:** done, kept 120 pixels clear of either edge so it always has room to turn.
Checked by taking every catch on the left of the screen: the eagle finished perched on
the left, mirrored to face that way.

Worth knowing: fish only ever swim right to left, so in practice the eagle will spend
most of a round facing left.

### 5. Catching a fish scatters the rest  ✅

The remaining fish bolt off the left edge at triple speed, fading as they go, and
cannot be tapped from the moment they turn. Fish still queued to appear are cancelled.
On a correct catch this happens during the celebration.

**Done when:** catching the right fish sends the others fleeing left, and tapping a
fleeing fish does nothing.

**Result:** done. Caught on camera: one frame taken the instant a fish was caught shows
another fish sitting in mid-screen, and a frame a fraction of a second later has it at
the far left edge and half faded out.

Fleeing fish are moved to a separate list that the tap test never looks at, so being
unclickable is structural rather than a flag that could be forgotten. In practice they
are doubly safe, because a scatter only ever happens once the word is already settled
and taps are ignored anyway.

### 6. Each level says how many wrong grabs a group forgives  ✅ built, not fully proved

A new per-level setting: Level 1 forgives two, Level 2 one, Level 3 none. Inside the
allowance a wrong grab behaves as it does today. The grab past it scatters everything
and the word is marked missed once they are gone.

**Done when:** on Level 1, two wrong grabs in a row leave the rest of the fish swimming
and the right answer still catchable; on Level 3, one wrong grab clears the water and
the word turns up in the end-of-round list.

**Result:** built and passing the checks, but the done-when is **not demonstrated** and
is handed to the maintainer to confirm by playing. Driving the page from outside, there
is no way to tell a wrong grab from a tap that hit open water, so a word ending shortly
after a tap could equally be the fish simply swimming past. Two attempts to separate
the two by timing were inconclusive, and one earlier reading that looked convincing was
almost certainly a coincidence.

What is certain: the checks pass, and the scatter itself was proved in step 5. The
count resets with each new word.

Worth knowing: Level 1 shows three fish, so only two of them are wrong. Two retries
means the allowance can never actually run out there - by the third grab the only fish
left is the right one. That is the intended gentleness, not an oversight, but it means
"Level 1 forgives two" is really "Level 1 forgives everything".

### 7. The game fits the screen  ✅

The canvas is a fixed 960 by 540 with no scaling, so on a narrow screen it overflows
the page instead of shrinking, and part of the lane sits where no finger can reach it.
Turn on fit-and-centre scaling against that same design size. Taps are translated back
automatically, so none of the aiming changes.

**Done when:** narrowing the browser window shrinks the whole game rather than cutting
it off, and a tap still lands on the fish underneath it.

**Result:** done. Measured at four window widths: the game shrank to 923, 590, 400 and
280 pixels wide, held its shape exactly, and never once pushed the page wider than the
window. Then a fish was caught with the game shrunk to 427 by 240, under half size,
which is the part that mattered - the scaler translates a tap back to where the fish
thinks it is.

At full size on a desktop nothing changed at all, so this is invisible until it is
tried on a small screen.

### 8. The project document matches the code

`PLAN.md` section 3a still shows the old settings block, the old `Level` shape and a
"catch forgiveness" column that no longer exists per level. Bring it up to date.

**Done when:** the settings shown in `PLAN.md` are the settings in the code.

---

## Risks

- **The tap decides, so a mis-tap is a wrong answer.** There is no longer any way to
  correct an aim once the finger lands. That is the point, but it makes tap forgiveness
  worth watching: 18 pixels was tuned for a collision box, not a fingertip. If catching
  feels fiddly on a touch screen, raise `tapPadding`.
- **The eagle must stay faster than the fish.** The aiming settles by repeated guessing,
  which relies on the eagle outpacing its target. At 900 against a fastest fish of 300
  there is plenty of room, but a future level fast enough to close that gap would make
  the aim wander. The settings file will carry a note saying so.
- **Losing the keyboard leaves no non-pointer way to play.** Accepted for now. Number
  keys for the fish on screen would be a separate plan.
- **The scatter can hide a slow reader's last chance.** On Level 3, one wrong tap ends
  the word immediately. That is the intended difficulty, but it is a bigger jump from
  Level 2 than the speed numbers alone suggest, and worth a play to confirm it is fun
  rather than punishing.
- **Fitting the screen changes nothing on a desktop** at full size, so the benefit is
  invisible until it is tried on a tablet or a narrow window. It needs testing there.
