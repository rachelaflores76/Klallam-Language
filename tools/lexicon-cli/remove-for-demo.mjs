import fs from "node:fs";
import path from "node:path";
import { LEXICON_JSON, REPO_ROOT, readLexicon, writeLexicon, writeLock } from "./lib.mjs";

const id = process.argv[2];
if (!id) {
  console.error("usage: node remove-for-demo.mjs <entry-id>");
  process.exit(1);
}

const lexicon = readLexicon();
const index = lexicon.entries.findIndex((e) => e.id === id);
if (index === -1) {
  console.error(`No entry with id "${id}".`);
  process.exit(1);
}

const [removed] = lexicon.entries.splice(index, 1);
writeLexicon(lexicon);
const lock = writeLock(lexicon.entries);

// The word is written to a file rather than printed, so it can be copied
// without ever being retyped.
const scratch = path.join(REPO_ROOT, "WORD-TO-ADD.txt");
const contents = [
  removed.klallam,
  "",
  "^ Copy the word on the first line above.",
  "",
  `English translation : ${removed.english}`,
  `Audio filename      : ${removed.audio ?? "(none)"}`,
  `Expected codepoints : ${removed.codepoints.join(" ")}`,
  "",
  "To put it back:",
  "  1. npm run lexicon:sheet",
  "  2. Open lexicon/lexicon.xlsx and paste the word into a new row.",
  "     Fill in the English column. Leave the id column empty.",
  "  3. npm run lexicon:import            (dry run, shows what it found)",
  "  4. npm run lexicon:import -- --apply",
  "",
  "Delete this file when you are done.",
  "",
].join("\n");

fs.writeFileSync(scratch, contents, "utf8");

console.log(`Removed "${removed.id}" (${removed.english}).`);
console.log(`Lexicon now has ${lexicon.entries.length} entries.`);
console.log(`Lock updated to ${lock.hash.slice(0, 16)}...`);
console.log(`\nDetails written to: ${path.relative(REPO_ROOT, scratch)}`);
console.log(`Audio file left in place: lexicon/audio/${removed.audio}`);
