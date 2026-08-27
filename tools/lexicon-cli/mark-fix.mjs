/**
 * Write the words spelled with the other glottalization mark, corrected, into a file a
 * person can copy from.
 *
 * Read-only by design. Whoever maintains this project does not speak Klallam and cannot
 * type these characters, and nothing else here is allowed to produce one either, so the
 * mark is swapped mechanically and handed over as text to paste. Nothing is written to
 * lexicon.json or to the spreadsheet.
 */
import fs from "node:fs";
import path from "node:path";
import {
  COMBINING_COMMA_ABOVE,
  COMBINING_COMMA_ABOVE_RIGHT,
  LEXICON_SHEET,
  REPO_ROOT,
  foldGlottal,
  readLexicon,
  toCodepoints,
} from "./lib.mjs";
import { readSheet } from "./xlsx.mjs";
import { rowsToRecords } from "./sheet-schema.mjs";

const OUTPUT = path.join(REPO_ROOT, "WORDS-TO-FIX.txt");
const [OLD_MARK] = toCodepoints(COMBINING_COMMA_ABOVE_RIGHT);
const [NEW_MARK] = toCodepoints(COMBINING_COMMA_ABOVE);

/** Prove the mark is the only thing that changed, so nothing can ride along with it. */
function onlyTheMarkChanged(before, after) {
  const a = Array.from(before);
  const b = Array.from(after);
  if (a.length !== b.length) return false;
  return a.every(
    (ch, i) =>
      ch === b[i] || (ch === COMBINING_COMMA_ABOVE_RIGHT && b[i] === COMBINING_COMMA_ABOVE)
  );
}

const affected = readLexicon()
  .entries.filter((entry) => entry.klallam.includes(COMBINING_COMMA_ABOVE_RIGHT))
  .map((entry) => ({ entry, fixed: foldGlottal(entry.klallam) }));

if (affected.length === 0) {
  console.log(`No word uses ${OLD_MARK}. Nothing to fix.`);
  process.exit(0);
}

for (const { entry, fixed } of affected) {
  if (!onlyTheMarkChanged(entry.klallam, fixed)) {
    console.error(`Refusing to write: correcting "${entry.id}" would change more than the mark.`);
    console.error(`      was: ${toCodepoints(entry.klallam).join(" ")}`);
    console.error(`      now: ${toCodepoints(fixed).join(" ")}`);
    process.exit(1);
  }
}

if (!fs.existsSync(LEXICON_SHEET)) {
  console.error("Cannot say which rows to edit: lexicon/lexicon.xlsx does not exist.");
  console.error("Restore it from version control.");
  process.exit(1);
}

const rowById = new Map();
try {
  for (const record of rowsToRecords(readSheet(fs.readFileSync(LEXICON_SHEET)))) {
    if (record.id) rowById.set(record.id, record.row);
  }
} catch (err) {
  console.error("Cannot import: lexicon/lexicon.xlsx could not be read.");
  console.error(`Reason: ${err.message}`);
  process.exit(1);
}

const markCount = affected.reduce(
  (total, { entry }) => total + entry.klallam.split(COMBINING_COMMA_ABOVE_RIGHT).length - 1,
  0
);

const lines = [
  "Words to correct in lexicon/lexicon.xlsx",
  "========================================",
  "",
  `${affected.length} word(s) are written with ${OLD_MARK}, ${markCount} mark(s) in total.`,
  `Each one below has been rewritten with ${NEW_MARK} and nothing else has been changed.`,
  "",
  "For each word: open lexicon/lexicon.xlsx, find the row named, and paste the word",
  "into the Klallam column over what is already there. Copy the whole line and nothing",
  "else. Save the file, then run:",
  "",
  "  npm run lexicon:import",
  "",
  'That report shows a "now" line for every word. Check it against the "now" line here',
  "before you apply anything.",
  "",
  "Delete this file once the import is applied. It is the only Klallam in this project",
  "that the integrity lock does not cover.",
  "",
];

affected.forEach(({ entry, fixed }, index) => {
  const row = rowById.get(entry.id);
  lines.push(
    "",
    "-".repeat(72),
    `${index + 1} of ${affected.length}   ${entry.english}   (id: ${entry.id})`,
    "",
    `  spreadsheet row : ${row ?? "not found in the sheet - check the id column"}`,
    `  was             : ${toCodepoints(entry.klallam).join(" ")}`,
    `  now             : ${toCodepoints(fixed).join(" ")}`,
    "",
    row === undefined
      ? "  Copy the line below into the Klallam column:"
      : `  Copy the line below into the Klallam column of row ${row}:`,
    "",
    fixed,
    ""
  );
});

lines.push("", "-".repeat(72), "");

fs.writeFileSync(OUTPUT, lines.join("\n"), "utf8");

console.log(`${affected.length} word(s) use ${OLD_MARK}, ${markCount} mark(s) in total.`);
for (const { entry } of affected) {
  console.log(`  ${entry.id}  (${entry.english})  row ${rowById.get(entry.id) ?? "?"}`);
}
console.log(`\nWrote ${path.relative(REPO_ROOT, OUTPUT)}`);
console.log("Nothing in lexicon.json or lexicon.xlsx was changed.");
