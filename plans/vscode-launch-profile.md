# A launch profile for playing FishyBird

**Goal:** press F5 in VS Code and have the game open in a browser, with the dev server
started automatically.

**Not doing:** anything to the game itself. No change to how it is built or deployed.

**Approved:** 2026-08-26.

---

## Steps

### 1. Add the launch profile and the task it depends on

`.vscode/tasks.json` gets a background task that runs the existing `game:dev` command and
waits until the dev server says it is ready. `.vscode/launch.json` gets two profiles,
Chrome and Edge, both opening the game and both starting that task first.

**Done when:** picking "Play FishyBird" from the Run and Debug list opens the game in a
browser with the start screen showing, without anything being typed into a terminal first.

---

## Risks

- The Chrome profile needs Chrome installed. The Edge one is there because Edge is always
  present on Windows.
- The dev server keeps running after the browser is closed. Stopping it means stopping the
  task, the same as closing a terminal.
- These files are editor settings, not part of the build. Nothing about the shipped game
  changes, so the checks cannot prove this works; it is confirmed by pressing the button.
