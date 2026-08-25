/**
 * Write lexicon.xlsx from lexicon.json.
 *
 * This is the editing surface handed to a speaker. Columns marked "(auto)" are
 * regenerated on every import and exist only so a human can eyeball what the
 * computer actually stored.
 */
import fs from "node:fs";
import path from "node:path";
import { LEXICON_SHEET, REPO_ROOT, readLexicon, toCodepoints } from "./lib.mjs";
import { readSheet, writeSheet } from "./xlsx.mjs";
import { SHEET_COLUMNS, entryToRow, rowsToRecords } from "./sheet-schema.mjs";

const force = process.argv.includes("--force");
const lexicon = readLexicon();
const entries = [...lexicon.entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

// Overwriting a sheet that holds unimported edits would destroy a speaker's work.
if (fs.existsSync(LEXICON_SHEET) && !force) {
  let pending = [];
  try {
    const existing = rowsToRecords(readSheet(fs.readFileSync(LEXICON_SHEET)));
    const byId = new Map(entries.map((e) => [e.id, e]));
    pending = existing.filter((record) => {
      if (!record.id) return Boolean(record.klallam);
      const entry = byId.get(record.id);
      if (!entry) return true;
      return (
        record.klallam !== entry.klallam ||
        record.english !== entry.english ||
        record.audio !== (entry.audio ?? "") ||
        record.tags !== (entry.tags ?? []).join(", ")
      );
    });
  } catch (err) {
    console.error(`Could not read the existing sheet: ${err.message}`);
    console.error("Re-run with --force to overwrite it anyway.");
    process.exit(1);
  }

  if (pending.length > 0) {
    console.error(`lexicon.xlsx has ${pending.length} row(s) that differ from the lexicon.`);
    console.error("Those edits have not been imported yet. Overwriting would lose them.\n");
    for (const record of pending.slice(0, 10)) {
      console.error(`  row ${record.row}: ${record.id || "(new word)"}  ${record.english || ""}`);
    }
    if (pending.length > 10) console.error(`  ... and ${pending.length - 10} more`);
    console.error("\nRun: npm run lexicon:import        to bring them in first");
    console.error("Or:  npm run lexicon:sheet -- --force   to discard them");
    process.exit(1);
  }
}

const rows = entries.map(entryToRow);

fs.writeFileSync(
  LEXICON_SHEET,
  writeSheet({
    sheetName: "Lexicon",
    columns: SHEET_COLUMNS,
    rows,
    protect: true,
  })
);

const withAudio = entries.filter((e) => e.audio).length;
const flagged = entries.filter((e) => e.needs_review).length;
const totalCodepoints = entries.reduce((n, e) => n + toCodepoints(e.klallam).length, 0);

console.log(`Wrote ${path.relative(REPO_ROOT, LEXICON_SHEET)}`);
console.log(`  ${entries.length} words, ${totalCodepoints} codepoints`);
console.log(`  ${withAudio} with a recording, ${flagged} flagged for review`);
console.log("\nThis command builds the sheet from the lexicon, which is the opposite of the");
console.log("normal direction. Use it to create a missing sheet or replace a damaged one.");
console.log("\nThe id column is locked. Leave it empty on a new row and one is generated.");
console.log("To bring edits back in, run:");
console.log("  npm run lexicon:import");
