#!/usr/bin/env node
// Stop hook: the agent may not end a turn that changed files while the checks are red.
// Exit 2 blocks the stop and feeds stderr back to the agent as the reason.
import { execFileSync, execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const payload = parse(await readStdin());

// Claude sets this when it is already continuing because of this hook.
// Blocking a second time would loop forever.
if (payload.stop_hook_active) process.exit(0);

if (!hasUncommittedChanges()) process.exit(0);

try {
  // A command string, not an argv array: npm is a .cmd shim on Windows and needs a shell.
  execSync("npm run ci", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
  process.stderr.write(
    [
      "The checks are failing, so this work is not finished.",
      "",
      output.slice(-4000),
      "",
      "Find the cause and fix it. Do not report the work as done, do not disable this",
      "hook, and do not re-lock the lexicon to clear a verify error - a lock failure",
      "means a Klallam string changed, which is the one thing worth stopping for.",
    ].join("\n") + "\n",
  );
  process.exit(2);
}

function hasUncommittedChanges() {
  try {
    const status = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return status.trim().length > 0;
  } catch {
    return true;
  }
}

function parse(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function readStdin() {
  return new Promise((done) => {
    if (process.stdin.isTTY) return done("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => done(data));
    process.stdin.on("error", () => done(""));
    setTimeout(() => done(data), 2000).unref();
  });
}
