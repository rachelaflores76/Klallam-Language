# Publish the site to GitHub Pages on every push to main

**Goal:** Make the repo public and have FishyBird live at `https://upta.github.io/khallam/`,
rebuilt and republished automatically every time you push to `main`.

**Not doing:**

- No landing page listing games. FishyBird sits at the site root for now. When game two
  arrives, that is a separate plan that moves things and adds an index.
- No custom domain.
- No preview deploys for branches or pull requests. Only `main` publishes.
- Nothing about how the game plays changes. This is packaging and delivery only.

## Background you need to read the steps

GitHub Pages will serve this site from a sub-folder, `/khallam/`, not from the top of a
domain. Two places in the code currently assume they are at the top of a domain and will
break when moved:

- The game asks for its recordings at `/audio/...`, which on Pages would mean
  `upta.github.io/audio/...` &mdash; the wrong place, and a silent one. The game would load
  and the words would simply never play.
- The lexicon review page asks for `/lexicon.json` the same way.

Steps 1 through 3 fix that. Steps 4 through 6 do the publishing.

## Steps

### 1. Stop the game assuming it lives at the top of a domain  ✅

In `games/fishybird/vite.config.ts`, set the build to use paths relative to the page
rather than absolute ones. In `games/fishybird/src/words.ts`, change the recordings
location from the hard-coded `/audio` to the same relative base, so it follows the game
wherever the game is served from. The dev server is unaffected &mdash; `npm run game:dev`
keeps working at the same address, playing the same recordings.

**Done when:** `npm run game:build` succeeds and no file in `games/fishybird/dist/` asks
for an asset starting with a leading `/`.

### 2. Stop the review page assuming it lives at the top of a domain  ✅

In `lexicon/review/index.html`, change the two absolute requests &mdash; the lexicon file
and the recordings &mdash; to relative ones, pointing at where step 3 will put those files.

**Done when:** `npm run lexicon:review` still opens the review page locally, still lists
the words, and still plays a recording when you click one.

### 3. Add one command that assembles the whole site  ✅

A new script, `npm run site:build`, that:

1. builds FishyBird,
2. copies the result to `dist/` at the top of the repo,
3. copies the review page and the lexicon file into `dist/review/`.

The recordings are already emitted by the game build, so they are not copied twice; the
review page reaches the game's copy. `dist/` is already ignored by git, so none of this
gets committed.

**Done when:** `npm run site:build` finishes and `dist/` contains `index.html`, an
`audio/` folder with the recordings, and `review/index.html`.

### 4. Check the assembled site by hand before trusting a robot with it  ✅

Serve `dist/` locally under a `/khallam/` sub-path, the same shape Pages will use, and
open it.

**Done when:** the game plays a full round with audio at the sub-path, and the review page
at `/khallam/review/` lists words and plays a recording.

### 5. Write the workflow that publishes on push to main  ✅

A new file, `.github/workflows/deploy.yml`. On a push to `main` it installs
dependencies, runs `npm run ci` (the same checks you run locally &mdash; the ASCII guard,
typecheck, lexicon verify, tests, game build), then runs `npm run site:build` and hands
`dist/` to GitHub Pages. If `npm run ci` fails, nothing publishes and the old site stays
up.

**Done when:** the file exists and `npm run ci` is still green locally. It cannot be
truly tested until step 6.

### 6. Make the repo public, turn Pages on, push, and watch it land  &mdash; waiting on the maintainer

The code half is done and pushed. What is left cannot be done without your GitHub
credentials, and it is one click:

**Make the repo public.** github.com/upta/khallam &rarr; Settings &rarr; scroll to Danger
Zone &rarr; *Change visibility* &rarr; Make public.

Then either push anything to `main`, or go to the Actions tab, pick *Deploy site to
GitHub Pages*, and press **Run workflow**. Turning Pages on is no longer a separate
step; the workflow does it itself the first time it deploys.

**Done when:** `https://upta.github.io/khallam/` plays a round with sound in a browser,
and `https://upta.github.io/khallam/review/` lists the words.

## Changed while building

- **Step 5, the workflow, now turns Pages on by itself** using `actions/configure-pages`
  rather than expecting somebody to find the Source setting in the repo settings. This
  cut the manual work at the end from two settings to one. It sits in the deploy half of
  the workflow, not the build half, so that if enabling Pages fails it does not disguise
  itself as a broken build.

## Risks

- **Public means public, and permanent.** Making the repo public publishes every
  recording, the whole lexicon, and the entire git history &mdash; including anything ever
  committed and later deleted. You have said this is fine. It is worth saying once more
  because it is the one step here that cannot be quietly undone: the repo can be made
  private again, but anything already copied by someone else stays copied.
- **The review page becomes public too.** It is an internal review tool. Anyone with the
  link can read it. You asked for this deliberately, so a speaker can be sent a link.
- **Broken audio is silent.** If the path work in steps 1 and 2 is wrong, the game still
  loads and looks fine; the words just never play. That is why step 4 exists as its own
  step, and why its "done when" says *plays a round with audio* rather than *the page
  loads*.
- **The first Pages deploy is often slow.** It can take several minutes after the workflow
  goes green before the site actually answers, and a 404 in that window is normal.
- **No new Klallam words are involved.** This plan reads the lexicon and copies it; it
  never writes it. If anything here turns out to need a new or respelled word, that stops
  and waits for you to edit `lexicon/lexicon.xlsx` and run the `update-lexicon` skill.
