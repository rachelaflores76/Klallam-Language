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

### 1. Catch forgiveness becomes a shared setting

`hitboxPadding` leaves the three levels and becomes `tapPadding` in the shared block.
Nothing about how forgiving the game feels changes, because all three levels already
agreed on 18.

**Done when:** the checks pass and a round plays exactly as it did before.

### 2. Fish get their own depth and a gentle drift

Each salmon picks a depth within a band of the sea rather than sharing one lane, and
rises and falls a few pixels as it crosses. Both are worked out from the clock, the
way the fish's forward movement already is, so a browser that stalls does not leave
one fish out of step. Diving still works as it does today.

**Done when:** fish are visibly at different depths and drifting, no fish breaks the
surface or clips the bottom of the sea, and catching one still works.

### 3. The eagle flies to the fish that was tapped

Tapping a fish is the answer. The eagle works out where that fish will be by the time
it can get there, flies to that point, and the catch resolves on arrival. Tapping open
water is a short splash that costs nothing. The space bar, the eagle's collision box
and the old straight-down dive all go.

**Done when:** tapping a fish catches that fish and no other, tapping water catches
nothing and costs nothing, and the space bar does nothing at all.

### 4. The eagle faces where it is going, and stays where it lands

It turns to face its direction of travel instead of flying backwards, and climbs back
to perch height above wherever it landed rather than snapping to the middle of the sky.
It is kept clear of the screen edges.

**Done when:** the eagle never flies tail-first, and after a catch on the left it is
perched on the left.

### 5. Catching a fish scatters the rest

The remaining fish bolt off the left edge at triple speed, fading as they go, and
cannot be tapped from the moment they turn. Fish still queued to appear are cancelled.
On a correct catch this happens during the celebration.

**Done when:** catching the right fish sends the others fleeing left, and tapping a
fleeing fish does nothing.

### 6. Each level says how many wrong grabs a group forgives

A new per-level setting: Level 1 forgives two, Level 2 one, Level 3 none. Inside the
allowance a wrong grab behaves as it does today. The grab past it scatters everything
and the word is marked missed once they are gone.

**Done when:** on Level 1, two wrong grabs in a row leave the rest of the fish swimming
and the right answer still catchable; on Level 3, one wrong grab clears the water and
the word turns up in the end-of-round list.

### 7. The game fits the screen

The canvas is a fixed 960 by 540 with no scaling, so on a narrow screen it overflows
the page instead of shrinking, and part of the lane sits where no finger can reach it.
Turn on fit-and-centre scaling against that same design size. Taps are translated back
automatically, so none of the aiming changes.

**Done when:** narrowing the browser window shrinks the whole game rather than cutting
it off, and a tap still lands on the fish underneath it.

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
