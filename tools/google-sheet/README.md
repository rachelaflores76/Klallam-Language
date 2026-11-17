# Sending FishyBird results to your Google Sheet

Every finished FishyBird round can add one row to a Google Sheet that only you can open:
round id, date, player, level, caught, out of, percent, and the English meaning of the
words that got away. You set this up once. It takes about ten minutes.

Before you start: check with your department that it is OK to keep students' names in
Google. First names or initials are safest.

## 1. Make the sheet

1. Go to <https://sheets.google.com> and sign in with the account that should own the data.
2. Start a blank spreadsheet. Name it something like **FishyBird Results**.

## 2. Add the script

1. In the sheet, open the **Extensions** menu and choose **Apps Script**. A new tab opens.
2. Delete everything in the code box.
3. Open `fishybird-sheet.gs` (in this folder), copy all of it, and paste it into the box.
4. Click the **Save** icon (the floppy disk).

## 3. Deploy it

1. Click the blue **Deploy** button, then **New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**. (This lets the game add rows. It does not let
   anyone open or read your sheet.)
5. Click **Deploy**.
6. Google asks you to authorize. Choose your account. If you see "Google hasn't verified
   this app", click **Advanced**, then **Go to ... (unsafe)**. It is your own script, so
   this is expected. Then click **Allow**.
7. Copy the **Web app URL**. It ends in `/exec`.

## 4. Check it works

Paste the Web app URL into a new browser tab. You should see:
`{"ok":true,"message":"FishyBird sheet is ready."}`

## 5. Send the address to Claude

Give Claude the Web app URL. It goes into the game's settings, the game is republished,
and from then on every finished round appears on the **Rounds** tab of your sheet.

## Good to know

- Rounds are always saved on the device first. A device with no internet sends its saved
  rounds the next time FishyBird opens online.
- The Web app URL is public inside the game's code. Someone who dug into the code could
  add fake rows, but they could never read the sheet.
- If you change the script later, use **Deploy > Manage deployments**, edit the existing
  deployment and pick **New version**, so the address stays the same.
- If **Anyone** is missing from "Who has access", your organization's Google settings
  block it. Use a personal Google account, or ask your IT team.
