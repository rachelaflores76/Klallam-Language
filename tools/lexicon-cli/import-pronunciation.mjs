/**
 * Merge pronunciation.xlsx back into pronunciation.json.
 *
 * Runs as a dry run by default: it reports what it found and writes nothing.
 * Pass --apply to commit the changes.
 *
 * The sheet is treated as untrusted input, for the same reason the lexicon import
 * does: Excel rewrites text without being asked, so the Symbols column is compared
 * at the codepoint level and anything resembling AutoCorrect damage stops the run.
 *
 * Row order in the sheet is the order the guide reads on the page.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  PRONUNCIATION_SHEET,
  REPO_ROOT,
  closestTag,
  foldGlottal,
  inspectKlallam,
  readLexicon,
  readPronunciation,
  toCodepoints,
  writePronunciation,
  writePronunciationLock,
} from "./lib.mjs";
import { readSheet } from "./xlsx.mjs";
import { rowsToRecords } from "./pronunciation-schema.mjs";

const apply = process.argv.includes("--apply");
const allowEdits = process.argv.includes("--allow-edits");
const allowDeletes = process.argv.includes("--allow-deletes");

// Excel drops a ~$ owner file beside a workbook it has open.
const OWNER_FILE = path.join(
  path.dirname(PRONUNCIATION_SHEET),
  "~$" + path.basename(PRONUNCIATION_SHEET)
);

if (!fs.existsSync(PRONUNCIATION_SHEET)) {
  console.error("Cannot import: lexicon/pronunciation.xlsx does not exist.");
  console.error("");
  console.error("The spreadsheet is the source of truth for the Klallam symbols, so without");
  console.error("it there is nothing to import from.");
  console.error("");
  console.error("Restore it from version control, or build a fresh one with:");
  console.error("  npm run pronunciation:sheet");
  process.exit(1);
}

const guide = readPronunciation();
const stored = guide.sounds;
const byId = new Map(stored.map((s) => [s.id, s]));
const words = readLexicon().entries;
const wordById = new Map(words.map((e) => [e.id, e]));
const wordIds = words.map((e) => e.id);

let records;
try {
  records = rowsToRecords(readSheet(fs.readFileSync(PRONUNCIATION_SHEET)));
} catch (err) {
  console.error("Cannot import: lexicon/pronunciation.xlsx could not be read.");
  console.error(`Reason: ${err.message}`);
  console.error("");
  if (fs.existsSync(OWNER_FILE)) {
    console.error("The file looks like it is open in Excel. Close it and try again.");
  } else {
    console.error("If Excel reports the file as damaged, restore it from version control.");
  }
  process.exit(1);
}

if (fs.existsSync(OWNER_FILE)) {
  console.log("NOTE  pronunciation.xlsx appears to be open in Excel.");
  console.log("      Anything not saved yet will not be seen by this import.");
}

// Headers with no rows is a damaged file, never an instruction to empty the guide.
if (records.length === 0) {
  console.error("Cannot import: lexicon/pronunciation.xlsx has its headers but no rows.");
  console.error("");
  console.error("A missing row means a deleted sound, so importing this would propose");
  console.error("emptying the guide. That is not something a sheet gets to say.");
  console.error("");
  console.error("Restore the spreadsheet from version control.");
  process.exit(1);
}

const errors = [];
const warnings = [];
const additions = [];
const symbolEdits = [];
const fieldEdits = [];
const absent = [];
let unchanged = 0;
let blank = 0;

/** Show two Klallam strings as aligned codepoints, marking the positions that differ. */
function codepointDiff(before, after) {
  const a = toCodepoints(before);
  const b = toCodepoints(after);
  const columns = [];

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const width = Math.max((a[i] ?? "").length, (b[i] ?? "").length);
    columns.push({
      was: (a[i] ?? "").padEnd(width),
      now: (b[i] ?? "").padEnd(width),
      mark: (a[i] === b[i] ? "" : "^^").padStart(Math.ceil((width + 2) / 2)).padEnd(width),
    });
  }

  const line = (key) => columns.map((c) => c[key]).join(" ").trimEnd();
  return `      was: ${line("was")}\n      now: ${line("now")}\n           ${line("mark")}`;
}

const seenIds = new Set();

for (const record of records) {
  const where = `row ${record.row}`;
  record.status = "invalid";

  if (!record.id) {
    errors.push(`${where}: the id column is empty. Give the row a short name, such as "schwa".`);
    continue;
  }
  if (!/^[a-z0-9-]+$/.test(record.id)) {
    errors.push(
      `${where}: id "${record.id}" must be lowercase English letters, digits and hyphens only`
    );
    continue;
  }

  if (!record.symbols) {
    // Clearing a cell that already held a symbol loses it silently otherwise.
    if (byId.has(record.id)) {
      errors.push(
        `${where}: the Symbols cell for "${record.id}" is empty, but the guide holds a symbol` +
          ` for it.\n      Put the symbol back, or delete the whole row to remove the sound.`
      );
      continue;
    }
    // A row still waiting on a speaker is not an error; it cannot be imported yet.
    blank++;
    warnings.push(`${where}: "${record.id}" has no symbol typed in yet, so it is skipped`);
    continue;
  }

  if (seenIds.has(record.id)) {
    errors.push(`${where}: id "${record.id}" is used on more than one row`);
    continue;
  }
  seenIds.add(record.id);

  if (!record.description) {
    errors.push(`${where}: the "How it sounds" column is empty`);
    continue;
  }

  for (const problem of inspectKlallam(record.symbols)) {
    errors.push(`${where}: the Symbols cell ${problem}`);
  }

  if (record.untrimmedSymbols !== record.symbols) {
    console.log(`NOTE  ${where}: stripped surrounding whitespace from the Symbols cell`);
  }

  const example = wordById.get(record.example_id);
  if (!record.example_id) {
    errors.push(`${where}: the example word id column is empty`);
    continue;
  }
  if (!example) {
    const suggestion = closestTag(record.example_id, wordIds);
    errors.push(
      `${where}: "${record.example_id}" is not a word in the lexicon.` +
        (suggestion ? ` Did you mean "${suggestion}"?` : "") +
        `\n      The example word id must match an id in lexicon/lexicon.xlsx.`
    );
    continue;
  }

  // The symbol should be visible inside the word offered as its example. Only a
  // warning: a grouped row lists related sounds, and the example can only show one
  // of them. A speaker reading the page is what settles it.
  const parts = record.symbols.split(/\s+/).filter(Boolean);
  const haystack = foldGlottal(example.klallam);
  if (!parts.some((part) => haystack.includes(foldGlottal(part)))) {
    warnings.push(
      `${where}: none of the symbols appear in the example word "${record.example_id}".` +
        `\n      Worth a look, though a grouped row can only show one of its sounds.`
    );
  }

  const sound = byId.get(record.id);
  if (!sound) {
    record.status = "new";
    additions.push({ record, example });
    continue;
  }

  const symbolsChanged = sound.symbols !== record.symbols;
  const others = [];
  if (sound.description !== record.description) {
    others.push(["How it sounds", sound.description, record.description]);
  }
  if (sound.example_id !== record.example_id) {
    others.push(["example word", sound.example_id, record.example_id]);
  }

  if (symbolsChanged) {
    record.status = "symbol-edit";
    symbolEdits.push({ record, sound, others });
  } else if (others.length > 0) {
    record.status = "field-edit";
    fieldEdits.push({ record, sound, others });
  } else {
    record.status = "unchanged";
    unchanged++;
  }
}

for (const sound of stored) {
  if (!seenIds.has(sound.id)) absent.push(sound);
}

/* ------------------------------------------------------------------ report --- */

console.log("");
console.log("Reading pronunciation.xlsx");
console.log("--------------------------");
console.log(`  ${records.length} row(s) in the sheet, ${stored.length} sound(s) in the guide\n`);

if (additions.length > 0) {
  console.log(`NEW SOUNDS (${additions.length})`);
  for (const { record, example } of additions) {
    console.log(`  row ${record.row}  ${record.id}`);
    console.log(`      ${toCodepoints(record.symbols).join(" ")}`);
    console.log(`      ${record.description}`);
    console.log(`      example: ${record.example_id} (${example.english})`);
  }
  console.log("");
}

if (symbolEdits.length > 0) {
  console.log(`CHANGED SYMBOLS (${symbolEdits.length})`);
  for (const { record, sound } of symbolEdits) {
    console.log(`  row ${record.row}  ${sound.id}  (${sound.description})`);
    console.log(codepointDiff(sound.symbols, record.symbols));
  }
  console.log("");
}

if (fieldEdits.length > 0) {
  console.log(`CHANGED DETAILS (${fieldEdits.length})`);
  for (const { record, sound, others } of fieldEdits) {
    console.log(`  row ${record.row}  ${sound.id}`);
    for (const [field, was, now] of others) console.log(`      ${field}: ${was}  ->  ${now}`);
  }
  console.log("");
}

if (absent.length > 0) {
  console.log(`DELETIONS (${absent.length})`);
  console.log("  In the guide, no longer in the sheet. Codepoints are printed so a row");
  console.log("  removed by mistake can be put back from this report.");
  for (const sound of absent) {
    console.log(`  ${sound.id}  (${sound.description})`);
    console.log(`      ${sound.codepoints.join(" ")}`);
  }
  console.log("");
}

console.log(`unchanged     : ${unchanged}`);
console.log(`to add        : ${additions.length}`);
console.log(`to edit       : ${symbolEdits.length + fieldEdits.length}`);
console.log(`to delete     : ${absent.length}`);
if (blank > 0) console.log(`not filled in : ${blank}`);

for (const w of warnings) console.log(`\nWARN  ${w}`);

if (errors.length > 0) {
  console.error("");
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\n${errors.length} problem(s) found. Nothing was changed.`);
  process.exit(1);
}

if (symbolEdits.length > 0 && !allowEdits) {
  console.error("");
  console.error("This import would change symbols already in the guide.");
  console.error("That is a linguistic decision, so it needs to be stated explicitly.");
  console.error("\nCheck the codepoints above with a speaker, then re-run with:");
  console.error("  npm run pronunciation:import -- --apply --allow-edits");
  process.exit(1);
}

if (absent.length > 0 && !allowDeletes) {
  console.error("");
  console.error("This import would remove sound(s) from the guide, because their rows are no");
  console.error("longer in the spreadsheet. Deleting a row is how a sound is removed, so this");
  console.error("is working as intended - but it is worth being sure it was meant.");
  console.error("\nCheck the list above, then re-run with:");
  console.error(
    `  npm run pronunciation:import -- --apply${symbolEdits.length > 0 ? " --allow-edits" : ""} --allow-deletes`
  );
  process.exit(1);
}

const changeCount = additions.length + symbolEdits.length + fieldEdits.length + absent.length;

if (!apply) {
  console.log("");
  if (changeCount === 0) {
    console.log("The sheet and the guide already agree. Nothing to do.");
  } else {
    console.log("This was a dry run. Nothing has been written.");
    console.log("\nTo apply:");
    console.log(
      `  npm run pronunciation:import -- --apply${symbolEdits.length > 0 ? " --allow-edits" : ""}`
    );
  }
  process.exit(0);
}

/* ------------------------------------------------------------------- apply --- */

for (const { record } of additions) console.log(`added   ${record.id}`);
for (const { record } of symbolEdits) console.log(`edited  ${record.id}`);
for (const { record } of fieldEdits) console.log(`updated ${record.id}`);
for (const sound of absent) console.log(`deleted ${sound.id}`);

// Rebuilt in sheet order, because the order of the rows is the order of the guide.
guide.sounds = records
  .filter((record) => record.status !== "invalid")
  .map((record) => ({
    id: record.id,
    symbols: record.symbols,
    codepoints: toCodepoints(record.symbols),
    description: record.description,
    example_id: record.example_id,
  }));

writePronunciation(guide);
const lock = writePronunciationLock(guide.sounds);

console.log(`\nLock updated to ${lock.hash.slice(0, 16)}...`);
console.log("Verifying...\n");

const result = spawnSync(
  process.execPath,
  [path.join(REPO_ROOT, "tools", "lexicon-cli", "verify.mjs")],
  { stdio: "inherit" }
);

process.exit(result.status ?? 0);
