# Order the review page list by the English word

**Goal:** The review table lists entries alphabetically by their English meaning, so a
reviewer can find a word without scrolling a list in no particular order.

**Not doing:**
- Not changing the order of anything in `lexicon.json`. That file is generated and
  hash-locked, and reordering it would break the lock. The sorting is purely what the
  browser shows.
- Not adding a sort control, clickable column headers, or a Klallam sort option. One
  fixed order, alphabetical by English.
- Not moving flagged entries to the top. They stay highlighted in place, in
  alphabetical position, the same as today.

## Steps

### 1. Sort the visible rows by English before drawing them  ✅

In `lexicon/review/index.html`, in the `render()` function, sort the filtered list by
each entry's `english` value before the loop that builds the table rows. Compare with
`localeCompare` so casing and punctuation sort the way a reader expects rather than by
raw character number. Where two entries share the same English wording, fall back to
comparing the `id` so the order is stable rather than arbitrary.

**Done when:** open the review page (`npm run lexicon:review`), leave the search box
empty and the filter on "All entries", and the English column reads top to bottom in
alphabetical order. Type a search term and switch the filter to "Needs review"; the
shorter list that comes back is also in alphabetical order.

## Risks

- **Multi-meaning entries.** Some English values hold several meanings in one string,
  for example a word glossed as three related meanings separated by commas. These sort
  by the whole string, so such an entry files under its first meaning only. If you want
  those split out and listed under each meaning, that is a different and larger change.
- **What "alphabetical" means.** `localeCompare` uses the browser's language settings.
  On a normal English-language machine that is what you would expect. It is worth one
  glance down the list to confirm nothing sorts somewhere surprising.
- **No test covers this.** The review page is a static HTML page with no test file, so
  `npm run ci` will confirm nothing is broken but cannot confirm the order is right.
  That check is yours, by eye, using the **Done when** above.
