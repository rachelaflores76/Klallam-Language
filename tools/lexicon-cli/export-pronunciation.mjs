/**
 * Write pronunciation.xlsx.
 *
 * This is the editing surface for the pronunciation guide. Every column except
 * Symbols is filled in already, so a speaker types Klallam into one column and
 * nothing else. The reference column is locked and regenerated from the lexicon.
 */
import fs from "node:fs";
import path from "node:path";
import {
  PRONUNCIATION_SHEET,
  REPO_ROOT,
  readLexicon,
  readPronunciation,
  readPronunciationSeed,
  toCodepoints,
} from "./lib.mjs";
import { readSheet, writeSheet } from "./xlsx.mjs";
import { SHEET_COLUMNS, rowsToRecords, soundToRow } from "./pronunciation-schema.mjs";

const force = process.argv.includes("--force");

const stored = readPronunciation().sounds;
// Before the first import there is nothing to export, so the starter rows stand in.
const seeded = stored.length === 0;
const sounds = seeded ? readPronunciationSeed() : stored;

const byId = new Map(readLexicon().entries.map((e) => [e.id, e]));
const rows = sounds.map((sound) => soundToRow(sound, byId.get(sound.example_id)?.klallam ?? ""));

// Overwriting a sheet that holds unimported edits would destroy a speaker's work.
if (fs.existsSync(PRONUNCIATION_SHEET) && !force) {
  let pending = [];
  try {
    const existing = rowsToRecords(readSheet(fs.readFileSync(PRONUNCIATION_SHEET)));
    const expected = new Map(sounds.map((s) => [s.id, s]));
    pending = existing.filter((record) => {
      const sound = expected.get(record.id);
      if (!sound) return true;
      return (
        record.symbols !== (sound.symbols ?? "") ||
        record.description !== sound.description ||
        record.example_id !== sound.example_id
      );
    });
  } catch (err) {
    console.error(`Could not read the existing sheet: ${err.message}`);
    console.error("Re-run with --force to overwrite it anyway.");
    process.exit(1);
  }

  if (pending.length > 0) {
    console.error(
      `pronunciation.xlsx has ${pending.length} row(s) that differ from the saved guide.`
    );
    console.error("Those edits have not been imported yet. Overwriting would lose them.\n");
    for (const record of pending.slice(0, 10)) {
      console.error(`  row ${record.row}: ${record.id || "(new row)"}  ${record.description || ""}`);
    }
    if (pending.length > 10) console.error(`  ... and ${pending.length - 10} more`);
    console.error("\nRun: npm run pronunciation:import              to bring them in first");
    console.error("Or:  npm run pronunciation:sheet -- --force    to discard them");
    process.exit(1);
  }
}

fs.writeFileSync(
  PRONUNCIATION_SHEET,
  writeSheet({
    sheetName: "Pronunciation",
    columns: SHEET_COLUMNS,
    rows,
    protect: true,
  })
);

const blank = sounds.filter((s) => !s.symbols).length;
const codepoints = sounds.reduce((n, s) => n + toCodepoints(s.symbols ?? "").length, 0);
const missingExample = sounds.filter((s) => !byId.has(s.example_id)).length;

console.log(`Wrote ${path.relative(REPO_ROOT, PRONUNCIATION_SHEET)}`);
console.log(`  ${rows.length} rows, ${codepoints} codepoints in the Symbols column`);
if (seeded) console.log("  started from the seed rows, because the guide is still empty");
if (missingExample > 0) console.log(`  ${missingExample} row(s) name a word the lexicon lacks`);

if (blank > 0) {
  console.log(`\n${blank} row(s) need a symbol typed into the Symbols column.`);
  console.log("Everything else is filled in. The last column is locked and only for reference.");
}
console.log("\nWhen the sheet is saved, bring it back in with:");
console.log("  npm run pronunciation:import");
