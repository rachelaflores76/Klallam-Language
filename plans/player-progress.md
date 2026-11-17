# FishyBird player names, sent to Rachel's Google Sheet

**Goal:** FishyBird players pick their name before they play, and every round's result is
sent to a Google Sheet only Rachel can open, so she can track each player's improvement.

**Not doing (this plan):**
- The other games and the site-wide points total. They stay as they are and send nothing.
- Logins, passwords or accounts. Anyone using the device can pick any name.
- Leaderboards or anything that shows one player another player's scores.

## Steps

### [done] 1. Change the project rules
Rewrite the permanent rules in CLAUDE.md to allow one exception: FishyBird may send a
round's result (player name, date, level, right out of total, the English of any words missed) to Rachel's Google
Sheet. Everything else stays: no logins, no leaderboards, no other game sends anything, and
the game must keep working with no internet.
**Done when:** CLAUDE.md states the exception and the rules that still stand.

### [done] 2. Pick your name
Before the level buttons, FishyBird asks "Who's playing?", lists the names saved on this
device, and offers "Add a new name". The chosen name shows above the game with a
"Switch player" button. FishyBird progress already saved on the device goes to the first
name added, so nothing is lost.
**Done when:** two names can be added on one device, and the game shows whoever was picked.

### [done] 3. Keep each player's word memory separate
FishyBird picks practice words for each person from their own history.
**Done when:** playing a round as one name leaves the other name's word memory unchanged.

### [done] 4. Save every round on the device
At the end of each round, save the player, date, level, right out of total, and the English
meaning of any words missed, in the browser, marked "not sent yet". (FishyBird plays every
spoken word rather than one chapter, so there is no chapter to record.)
**Done when:** a finished round is in the device's saved list with that information.

### [waiting on Rachel's Web app URL; code, script and guide done] 5. Send rounds to the Google Sheet
Write the small Google script (kept in the repo with step-by-step setup instructions) that
adds a row to the sheet. The game sends each unsent round to it, and marks it sent. If the
internet is down, it tries again next time the game opens. Rachel pastes the script into
Google, clicks Deploy, and gives back the web address it shows.
**Done when:** a test round played on the live site appears as a row in Rachel's sheet.

### [done] 6. My Progress page
A "My Progress" button on FishyBird's start screen opens the chosen player's page, built
from the rounds saved on this device: rounds played, a chart of percent caught over time,
best and latest score for each level, and a list of recent rounds.
**Done when:** after a low round and then a higher one, the chart line goes up.

### 7. Checks and publish
Run the checks, play it in a browser, publish to GitHub.
**Done when:** the live FishyBird asks for a name and its rounds reach the sheet.

## Risks
- Step 5 needs Rachel to deploy the script in her own Google account; the sending part
  cannot be finished until she does. Steps 1 to 4 do not depend on it.
- The address the game sends to is public. Someone reading the game's code could add fake
  rows to the sheet. They cannot read it.
- Students' names leave the device and are stored in Google. Rachel is checking with her
  department that this is allowed for PGST youth. First names or initials are safer.
- Step 2 moves FishyBird's existing saved progress under a player name. That move happens
  once, and has to be done carefully, because a mistake would erase what is already saved.
