---
name: setup
description: Get this project running on a computer that has nothing installed - install Git, the GitHub CLI and Node, sign the user in to GitHub, clone the repo, install dependencies, run the checks and open the site. Use when the user wants to set the project up on a new machine, has just cloned it, or says nothing works on a fresh computer.
---

# Setting up a computer

## The rule

**You install the tools. The user only does what needs a human.**

The person following this does not read code and did not choose to become a system
administrator. Handing them a list of commands to paste is passing your job to
someone worse equipped to do it. Run the installers yourself, say what you are
installing before you install it, and stop only at the three doors they alone can
open.

You may be running this before the repo exists on disk &mdash; the README tells them
to paste a prompt that points here, and they may have pasted it in an empty folder.
Check where you are before assuming.

## The three doors only they can open

Stop at each one and say plainly that it is their turn, because a waiting prompt
looks identical to a hang.

1. **The installer's permission box.** Windows shows a UAC dialog; they click Yes.
   macOS asks for their account password in the terminal; **they type it there,
   never through you.** Tell them the characters will not appear as they type.
2. **The GitHub sign-in.** `gh auth login` prints a one-time code and opens a
   browser. They enter it and confirm. Never type, read back, or store a password or
   token on their behalf.
3. **The final look.** Whether the site actually works is theirs to say.

## The loop

Run each step, confirm it worked, then move on. A step that cannot be confirmed did
not happen.

### 1. Find out what is already there

```
node -v ; git --version ; gh --version
```

Node must be **20 or newer**. An older one counts as missing. Note which of the
three are absent before installing anything, and tell the user the list.

### 2. Install what is missing

**Windows** &mdash; ids verified against the winget catalogue:

```
winget install -e --id Git.Git --source winget --accept-package-agreements --accept-source-agreements
winget install -e --id GitHub.cli --source winget --accept-package-agreements --accept-source-agreements
winget install -e --id OpenJS.NodeJS.LTS --source winget --accept-package-agreements --accept-source-agreements
```

One at a time, so a failure names itself. If `winget` is missing the machine is an
old Windows 10: have them install **App Installer** from the Microsoft Store, then
carry on.

**macOS** &mdash; Homebrew, then the tools:

```
brew install git gh node
```

If `brew` is missing, install it with the official script from <https://brew.sh>. It
asks for their password, which is door 1. Git may already be present from Apple's
command line tools, and that copy is fine.

### 3. Get the new tools onto PATH

**This is the trap.** A tool installed by the terminal you are in is usually not
visible to that same terminal, and `node -v` will keep reporting "not recognised"
long after Node is installed correctly. On Windows, reload PATH from the machine and
user environment, or start a new terminal. Do not conclude the install failed until
you have done that.

Prove it before moving on: `node -v` prints v20 or higher, `gh --version` prints a
version.

### 4. Sign in to GitHub

`gh auth status` first &mdash; they may already be signed in. If not, run
`gh auth login`, choose the browser flow, and hand the terminal over. Read the code
it prints back to them and stop there.

Signing in matters even though the code can be read without it: it is what lets
their word changes go back to GitHub later.

### 5. Clone the repo

```
gh repo clone rachelaflores76/Klallam-Language
```

Skip this if you are already inside the repo. Clone into the folder they opened, not
into a nested one of your choosing.

### 6. Install the dependencies

```
npm install
```

**At the repo root.** This is an npm workspace; installing inside `games/` or
`site/` produces a broken half-installed tree that fails later and somewhere else.

### 7. Run the checks

```
npm run ci
```

Never before step 6. On a fresh clone the checks fail for want of `node_modules`,
and the error blames TypeScript rather than the missing install &mdash; which sends
you chasing a problem that does not exist.

### 8. Start the site

```
npm run site:dev
```

Then tell them to open <http://localhost:5173/>. The port is fixed deliberately, so
a different address means a server is already running rather than a new one having
moved.

### 9. Report

Plain language, no command names, in the shape `validate` uses: what the computer
confirmed, and what they need to look at. Then tell them the two things they can now
ask for &mdash; changing words, and changing anything else &mdash; and point at the
README.

## When something fails

| Symptom | Cause |
|---|---|
| `node` not recognised, right after installing it | PATH not reloaded. Step 3, not a failed install. |
| Node reports a version below 20 | An old copy earlier on PATH. Install LTS and re-check the version, not just the exit code. |
| `npm install` stalls or fails to fetch | No network, or a corporate proxy. Say so; do not retry silently. |
| Checks fail on a clone nobody has touched | `npm install` was skipped or run in the wrong folder. |
| Port 5173 is taken | A dev server is already running from earlier. Say that rather than moving to another port. |
| `gh` cannot clone | Not signed in, or no access to the repo. Distinguish the two before advising. |

## Excuses, and why they are wrong

| "..." | Actually |
|---|---|
| "I'll give them the commands to run." | They came here because they do not want to run commands. Run them. |
| "The install returned an error, so it failed." | Often it succeeded and PATH is stale. Check the version before declaring failure. |
| "I'll run the checks first to see what's needed." | On a fresh clone that produces a misleading error and wastes the next ten minutes. |
| "I'll just enter their password to save time." | Credentials never pass through you. Not once, not to be helpful. |
| "All three installs in one command is faster." | And a single failure that names none of them. |
| "The checks passed, so setup worked." | The checks cannot see the site render. They have to look. |

## Never do these

- Type, read back, or store the user's password, token, or any credential
- Continue past a failed install, or call a stale PATH a failed install
- Run `npm run ci` before `npm install`
- Run `npm install` anywhere but the repo root
- Install anything without saying what it is first
- Leave the user staring at a prompt without telling them it is their turn
- Change project files while setting up; this skill installs and verifies, nothing else
- Report setup as done before the user has seen the site
