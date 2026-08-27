/**
 * Raise or clear a word's review flag.
 *
 * A review flag is the record of a question a speaker has to answer, so clearing one is
 * a ruling and not a tidy-up. Until now the only way to set them was to open
 * lexicon.json and edit it by hand, directly against the rule saying never to do that.
 *
 * Nothing here reads or writes Klallam text, codepoints, or the spreadsheet. Review
 * fields are outside the integrity lock, so nothing done here can move it.
 */
import path from "node:path";
import { spawnSync } from "node:child_process";
import { REPO_ROOT, readLexicon, writeLexicon, writeLock } from "./lib.mjs";

const USAGE = [
  "usage:",
  "  npm run lexicon:resolve -- <id> [<id>...] [--apply]",
  '  npm run lexicon:flag -- <id> [<id>...] --reason "<text>" [--apply]',
  "",
  "Both report what they would change and write nothing until --apply.",
];

const [command, ...rest] = process.argv.slice(2);

if (command !== "resolve" && command !== "flag") {
  console.error(USAGE.join("\n"));
  process.exit(1);
}

const ids = [];
let reason = null;
let apply = false;
const badFlags = [];

for (let i = 0; i < rest.length; i++) {
  const token = rest[i];
  if (token === "--apply") apply = true;
  else if (token === "--reason") reason = rest[++i] ?? "";
  else if (token.startsWith("--reason=")) reason = token.slice("--reason=".length);
  else if (token.startsWith("--")) badFlags.push(token);
  else ids.push(token);
}

const errors = [];

if (badFlags.length > 0) errors.push(`unknown option(s): ${badFlags.join(", ")}`);
if (ids.length === 0) errors.push("no word ids given");
if (command === "flag") {
  if (reason === null) errors.push('flag needs a reason: --reason "why this word is in doubt"');
  else if (!reason.trim()) errors.push("the reason is empty");
  else if (/[^\x20-\x7E]/.test(reason)) {
    errors.push(
      "the reason contains something other than plain ASCII. Reasons are notes about " +
        "Klallam, never Klallam itself."
    );
  }
} else if (reason !== null) {
  errors.push("resolve takes no --reason; it clears every reason on the word");
}

const lexicon = readLexicon();
const byId = new Map(lexicon.entries.map((e) => [e.id, e]));

for (const id of ids) {
  if (!byId.has(id)) errors.push(`no word with id "${id}"`);
}
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length > 0) errors.push(`id(s) given more than once: ${[...new Set(duplicates)].join(", ")}`);

if (errors.length > 0) {
  console.error("");
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error("");
  console.error(USAGE.join("\n"));
  process.exit(1);
}

const changes = [];
const alreadyDone = [];

for (const id of ids) {
  const entry = byId.get(id);
  const before = entry.review_reasons ?? [];
  const after = command === "resolve" ? [] : [...new Set([...before, reason])];

  const same =
    after.length === before.length &&
    after.every((r, i) => r === before[i]) &&
    entry.needs_review === (after.length > 0);

  if (same) alreadyDone.push(entry);
  else changes.push({ entry, before, after });
}

console.log("");
console.log(command === "resolve" ? "Clearing review flags" : "Raising review flags");
console.log("---------------------");
console.log("");

for (const { entry, before, after } of changes) {
  console.log(`  ${entry.id}  (${entry.english})`);
  if (before.length === 0) console.log("      was: not flagged");
  for (const r of before) console.log(`      was: ${r}`);
  if (after.length === 0) console.log("      now: not flagged");
  for (const r of after) console.log(`      now: ${r}`);
  console.log("");
}

for (const entry of alreadyDone) {
  console.log(`  ${entry.id}  (${entry.english})  already as asked - nothing to do`);
}
if (alreadyDone.length > 0) console.log("");

console.log(`to change     : ${changes.length}`);
console.log(`unchanged     : ${alreadyDone.length}`);

if (changes.length === 0) {
  console.log("\nNothing to do.");
  process.exit(0);
}

if (!apply) {
  console.log("\nThis was a dry run. Nothing has been written.");
  console.log("\nTo apply, add --apply to the same command.");
  process.exit(0);
}

// A word is flagged exactly when it has an unanswered question against it.
for (const { entry, after } of changes) {
  entry.review_reasons = after;
  entry.needs_review = after.length > 0;
}

writeLexicon(lexicon);
writeLock(lexicon.entries);

console.log(`\nUpdated ${changes.length} word(s).`);
console.log("Verifying...\n");

const result = spawnSync(
  process.execPath,
  [path.join(REPO_ROOT, "tools", "lexicon-cli", "verify.mjs")],
  { stdio: "inherit" }
);

process.exit(result.status ?? 0);
