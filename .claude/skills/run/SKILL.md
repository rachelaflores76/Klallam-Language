---
name: run
description: Start the site so the user can look at it in a browser, or tell them it is already running, and give them the address. Use when the user asks to run, start, open, preview or look at the site, a game or the review page. Writes no code and changes no files.
---

# Running the site

## The rule

**Is it up? If not, start it in the background. Give the address. Stop.**

That is the whole job. There is one server, at one fixed address, serving the hub,
every game and the review page. A request to look at the site is not a request to
build it, install it, test it or find out why it might not work. Reaching for any of
that turns thirty seconds into an expedition, and the user is left staring at output
they cannot read while the thing they asked for has not happened.

## The loop

### 1. Ask whether it is already running

```
node -e "fetch('http://localhost:5173/').then(r => console.log('up', r.status)).catch(() => console.log('down'))"
```

`up` &mdash; skip to step 3. Do not start a second one, and **never kill the one that
is there.** It may be the window the user has had open all afternoon.

### 2. Start it, in the background

```
npm run site:dev
```

Run it as a background process. **Vite never exits** &mdash; that is what a dev
server is &mdash; so waiting for the command to finish is waiting forever, and a
command that appears to hang is the point where the improvising starts. It is ready
when it prints its address, a second or two later. Inside VS Code the
`site: dev server` task starts the same thing.

The one repair this skill performs: if it fails because `node_modules` is missing,
run `npm install` **at the repo root**, once, and start it again. Anything else that
fails is reported, not chased.

### 3. Give the address

<http://localhost:5173/>

Point at the part they asked about:

| They asked about | Send them to |
|---|---|
| the site, the games, anything general | <http://localhost:5173/> |
| the words, or checking a spelling | <http://localhost:5173/review/> |
| a phone or tablet on the same wifi | stop the server, run `npm run site:lan`, and read them the network address it prints |

Then stop. One or two plain sentences: it is running, here is where to look. No
command names, no summary of what Vite printed.

## The port never moves

5173 is fixed deliberately &mdash; `strictPort` in the site's config. A server
sliding to the next free port hands you a second site at an address nobody mentioned,
while the stale one keeps answering at the address everybody uses.

So **"port 5173 is already in use" is not an error.** It is the answer to step 1
arriving late: the site is already running. Give the address.

## Nothing here needs validating

This skill changes no files, so there is nothing to check and no plan to retire.
Do not run `npm run ci`, do not build the site, and do not start a `outline` &rarr;
`build` &rarr; `validate` loop. If the site turns out to be broken once the user
looks at it, *that* is a change, and it starts with `outline`.

## When something fails

| Symptom | Cause |
|---|---|
| Port 5173 already in use | A server is already running. Give the address; do not kill it or move ports. |
| Cannot find package / module not found | `npm install` was never run, or was run in a sub-folder. Install at the repo root. |
| `npm` or `node` not recognised | The machine was never set up. Use the `setup` skill instead. |
| The page loads but a game is blank | A real bug, not a running problem. Report it; do not fix it inside this skill. |
| The command seems to hang after printing an address | It is running. That is success. |

## Excuses, and why they are wrong

| "..." | Actually |
|---|---|
| "I'll run the checks first to be safe." | They asked to see the site. Checks answer a question nobody asked and delay the one they did. |
| "I'll build the site so it's up to date." | The dev server reads the source live. The build output is for publishing, not for looking. |
| "The port is taken, I'll use 5174." | Now there are two sites and the user is looking at the wrong one. |
| "I'll kill whatever is on 5173 and start clean." | You just closed something that was working, for no reason. |
| "The command didn't finish, so it failed." | Dev servers do not finish. Read the address it printed. |
| "I'll explain what the server output means." | They want a link. Give them the link. |

## Never do these

- Wait in the foreground for a dev server to exit
- Start a second server, or move to another port
- Kill a running server unless the user asked for it, or `site:lan` requires it
- Run `npm run ci`, `npm run site:build` or the tests as part of running the site
- Run `npm install` anywhere but the repo root, or when nothing said it was missing
- Investigate a bug found in the browser inside this skill &mdash; that is `outline`
- End without giving the address
