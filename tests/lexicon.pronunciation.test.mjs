import { test } from "node:test";
import assert from "node:assert/strict";
import { readSheet, writeSheet } from "../tools/lexicon-cli/xlsx.mjs";
import {
  hashSounds,
  readLexicon,
  readPronunciation,
  readPronunciationLock,
  readPronunciationSeed,
  toCodepoints,
} from "../tools/lexicon-cli/lib.mjs";
import {
  SHEET_COLUMNS,
  COLUMNS,
  findColumnIndexes,
  rowsToRecords,
} from "../tools/lexicon-cli/pronunciation-schema.mjs";

// Klallam is written with escapes here so the source stays ASCII and the test asserts
// on exact codepoints rather than on whatever an editor happened to save.
const HEADERS = COLUMNS.map((c) => c.label);

const sounds = readPronunciation().sounds;
const seed = readPronunciationSeed();
const wordIds = new Set(readLexicon().entries.map((e) => e.id));

test("the symbols column survives the sheet codec with its marks intact", () => {
  const samples = [
    "\u0294", // glottal stop
    "x\u0323", // base plus combining dot below
    "\u019B\u0313", // barred lambda plus glottalization
    "p\u0313 t\u0313 k\u0313", // a grouped row, space separated
    "\u00E1 a\u0301", // composed and decomposed must not be folded together
  ];
  const buf = writeSheet({
    columns: SHEET_COLUMNS,
    rows: samples.map((symbols) => ["an-id", symbols, "a description", "sleep", ""]),
  });
  const read = readSheet(buf)
    .slice(1)
    .map((row) => row[1] ?? "");

  assert.deepEqual(read, samples);
  assert.deepEqual(toCodepoints(read[4]), ["U+00E1", "U+0020", "U+0061", "U+0301"]);
});

test("the sheet carries only the fields the guide models", () => {
  assert.deepEqual(
    COLUMNS.map((c) => c.key),
    ["id", "symbols", "description", "example_id", "example_klallam"]
  );
});

test("the reference column is locked and the rest are editable", () => {
  const styleOf = (key) => SHEET_COLUMNS[COLUMNS.findIndex((c) => c.key === key)].style;
  assert.equal(styleOf("example_klallam"), 3);
  for (const key of ["id", "symbols", "description", "example_id"]) {
    assert.equal(styleOf(key), 2, `${key} should be editable`);
  }
});

test("the two example columns are told apart however they are ordered", () => {
  const forward = findColumnIndexes([HEADERS]);
  const reversed = findColumnIndexes([[...HEADERS].reverse()]);

  assert.equal(forward.example_id, 3);
  assert.equal(forward.example_klallam, 4);
  assert.equal(reversed.example_id, 1);
  assert.equal(reversed.example_klallam, 0);
});

test("a row with nothing in it is not a sound", () => {
  const records = rowsToRecords([
    HEADERS,
    ["schwa", "\u0259", "Schwa", "you", ""],
    ["", "", "", "", ""],
  ]);
  assert.equal(records.length, 1);
  assert.equal(records[0].id, "schwa");
});

test("every codepoints array matches its symbols string", () => {
  for (const sound of sounds) {
    assert.deepEqual(
      sound.codepoints,
      toCodepoints(sound.symbols),
      `${sound.id}: codepoints have drifted from the symbols`
    );
  }
});

test("codepoints round-trip back to the original symbols", () => {
  for (const sound of sounds) {
    const rebuilt = sound.codepoints
      .map((cp) => String.fromCodePoint(parseInt(cp.replace(/^U\+/, ""), 16)))
      .join("");
    assert.equal(rebuilt, sound.symbols, `${sound.id}: codepoints do not rebuild the symbols`);
  }
});

test("no transliteration artifacts in the symbols", () => {
  for (const sound of sounds) {
    assert.ok(!/['"`]/.test(sound.symbols), `${sound.id}: an ASCII quote crept into the symbols`);
  }
});

test("sound ids are unique and ASCII-safe", () => {
  const seen = new Set();
  for (const sound of sounds) {
    assert.match(sound.id, /^[a-z0-9-]+$/, `${sound.id}: id is not ASCII-safe`);
    assert.ok(!seen.has(sound.id), `${sound.id}: duplicate id`);
    seen.add(sound.id);
  }
});

test("every example word named by the guide is in the lexicon", () => {
  for (const sound of sounds) {
    assert.ok(wordIds.has(sound.example_id), `${sound.id}: no such word "${sound.example_id}"`);
  }
});

test("the lock matches the guide once there is a guide to lock", () => {
  const lock = readPronunciationLock();
  if (sounds.length === 0) return;
  assert.ok(lock, "pronunciation.lock is missing");
  assert.equal(lock.hash, hashSounds(sounds), "a Klallam symbol changed without a re-lock");
  assert.equal(lock.soundCount, sounds.length);
});

test("the starter rows point at words the lexicon actually has", () => {
  assert.ok(seed.length > 0, "the seed has no rows");
  const seen = new Set();
  for (const row of seed) {
    assert.match(row.id, /^[a-z0-9-]+$/, `${row.id}: id is not ASCII-safe`);
    assert.ok(!seen.has(row.id), `${row.id}: duplicate id in the seed`);
    seen.add(row.id);
    assert.ok(row.description, `${row.id}: the seed row has no description`);
    assert.ok(wordIds.has(row.example_id), `${row.id}: no such word "${row.example_id}"`);
  }
});
