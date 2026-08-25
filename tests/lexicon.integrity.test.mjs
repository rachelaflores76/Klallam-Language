import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  AUDIO_DIR,
  foldGlottal,
  hashEntries,
  readLexicon,
  readLock,
  toCodepoints,
} from "../tools/lexicon-cli/lib.mjs";

const lexicon = readLexicon();
const entries = lexicon.entries;

test("lexicon has entries", () => {
  assert.ok(entries.length > 0, "lexicon.json contains no entries");
});

test("every codepoints array matches its klallam string", () => {
  for (const entry of entries) {
    assert.deepEqual(
      entry.codepoints,
      toCodepoints(entry.klallam),
      `entry "${entry.id}" has codepoints that disagree with its klallam field`
    );
  }
});

test("lock hash matches lexicon contents", () => {
  const lock = readLock();
  assert.ok(lock, "lexicon.lock is missing");
  assert.equal(
    hashEntries(entries),
    lock.hash,
    "A Klallam string changed without the lock being updated. If intentional, run: npm run lexicon:lock"
  );
  assert.equal(lock.entryCount, entries.length);
});

test("no transliteration artifacts in Klallam text", () => {
  for (const entry of entries) {
    assert.ok(
      !/['"`]/.test(entry.klallam),
      `entry "${entry.id}" contains an ASCII quote or backtick`
    );
  }
});

test("ids are unique and ASCII-safe", () => {
  const seen = new Set();
  for (const entry of entries) {
    assert.match(entry.id, /^[a-z0-9-]+$/, `id "${entry.id}" is not ASCII-safe`);
    assert.ok(!seen.has(entry.id), `duplicate id "${entry.id}"`);
    seen.add(entry.id);
  }
});

test("referenced audio files exist", () => {
  for (const entry of entries) {
    if (!entry.audio) continue;
    assert.ok(
      fs.existsSync(path.join(AUDIO_DIR, entry.audio)),
      `entry "${entry.id}" points at a missing recording: ${entry.audio}`
    );
  }
});

test("entries differing only by an invisible mark are flagged for review", () => {
  const byFolded = new Map();
  for (const entry of entries) {
    const folded = foldGlottal(entry.klallam);
    if (!byFolded.has(folded)) byFolded.set(folded, []);
    byFolded.get(folded).push(entry);
  }
  for (const [, group] of byFolded) {
    if (group.length < 2) continue;
    for (const entry of group) {
      assert.ok(
        entry.needs_review,
        `entry "${entry.id}" collides with another entry once U+0315 is folded to U+0313, but is not flagged`
      );
    }
  }
});

test("codepoints round-trip back to the original string", () => {
  for (const entry of entries) {
    const rebuilt = entry.codepoints
      .map((cp) => String.fromCodePoint(parseInt(cp.slice(2), 16)))
      .join("");
    assert.equal(rebuilt, entry.klallam, `entry "${entry.id}" does not round-trip`);
  }
});
