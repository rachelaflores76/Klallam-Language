# Move the project to the client's GitHub repo

**Goal:** the project lives at `rachelaflores76/Klallam-Language`, publishes itself to
`https://rachelaflores76.github.io/Klallam-Language/`, and `upta/khallam` stops being
the working copy.

**Not doing:** renaming anything inside the project (the `@klallam/...` package names
stay), adding a licence file, removing `original-site.html`, or changing how the site
is built. The site is already written to work from a sub-folder; this plan proves that
rather than altering it.

**Depends on Rachel first:** the repo must be public and its Pages source set to
"GitHub Actions". Steps 1&ndash;4 can happen without that; step 5 cannot.

## Steps

### 1. Prove the site works from a sub-folder &mdash; DONE

The published address is `.../Klallam-Language/`, not the top of a domain. Build the
site and serve `dist/` under a folder of that name locally, so we find any broken link
before it is Rachel's problem rather than after.

**Done when:** at `http://localhost:PORT/Klallam-Language/` the hub loads with its
chapters, a game opens and plays, a recording sounds, the Klallam font renders, and
`/Klallam-Language/review/` lists the words.

Confirmed: hub, chapters, Flashcards and the review page all loaded under the
sub-folder; the Charis font reported itself loaded; the recordings and font answered
200 at `/Klallam-Language/...`. The built code asks for `./audio` and
`./fonts/Charis-Regular.woff2`, so nothing assumes the top of a domain.

### 2. Point the written instructions at her repo

Three references name the old repo, none of which affect the running site:
`README.md` (the clone address, and the sentence saying a `khallam` folder is made),
and `.claude/skills/setup/SKILL.md` (the `gh repo clone` line).

**Done when:** searching the project for `upta/khallam` returns nothing, and
`npm run ci` is green.

### 3. Push the project into her repo

Her repo holds one commit: a README containing only the project's name. Our history
has no ancestor in common with it, so the push replaces that stub outright. Nothing
she wrote is lost, because she wrote one line and our README supersedes it.

**Done when:** `rachelaflores76/Klallam-Language` shows this project's full history,
and its newest commit matches ours.

### 4. Make her repo this folder's home

Repoint this working copy so day-to-day work goes to her repo, not the old one.

**Done when:** `git remote -v` names her repo, and `git status` reports the branch as
up to date with it.

### 5. Check the published site

The push starts a build on her repo. It runs the same checks we run locally and only
publishes if they pass.

**Done when:** `https://rachelaflores76.github.io/Klallam-Language/` opens the hub, a
game plays, and a recording sounds &mdash; confirmed by eye, in a browser.

### 6. Archive the old repo

`upta/khallam` becomes read-only so nobody, including us, keeps working in the wrong
place by accident. It stays readable as a record.

**Done when:** GitHub shows `upta/khallam` marked archived.

## Risks

- **Going public is permanent in practice.** Every Klallam word, translation and all
  101 recordings become downloadable by anyone, and stay so in copies and caches even
  if the repo is made private again later. This is Rachel's decision to make knowingly.
  Checked before recommending it: the repo contains no passwords, keys or tokens.
- **No licence file.** A public repo with no licence is "all rights reserved" by
  default, which may be exactly right for this material &mdash; but it is a decision
  being made by omission, so it should be made on purpose.
- **Step 3 overwrites her `main`.** Only the one-line README stub is affected, and
  `main` is not protected, so nothing blocks it. It is still a force push into someone
  else's repo and needs her go-ahead before it happens.
- **Steps 1&ndash;4 give no visible site.** Until Rachel has done the two settings
  changes, the build will run and fail to publish. That is expected, not a fault.
- **A private repo cannot publish Pages on a free account.** If she changes her mind
  about going public, the site needs GitHub Pro instead; nothing in the code changes.
