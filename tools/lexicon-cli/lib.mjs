import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..", "..");
export const LEXICON_DIR = path.join(REPO_ROOT, "lexicon");
export const LEXICON_JSON = path.join(LEXICON_DIR, "lexicon.json");
export const LEXICON_LOCK = path.join(LEXICON_DIR, "lexicon.lock");
export const AUDIO_DIR = path.join(LEXICON_DIR, "audio");
export const SOURCE_DIR = path.join(LEXICON_DIR, "source");
export const LEXICON_SHEET = path.join(LEXICON_DIR, "lexicon.xlsx");

// Glottalization is written two ways in the source material. They look identical
// but are distinct codepoints, so they are folded only for duplicate detection.
export const COMBINING_COMMA_ABOVE = "\u0313";
export const COMBINING_COMMA_ABOVE_RIGHT = "\u0315";

/** Split into real codepoints, not UTF-16 units, and format as U+XXXX. */
export function toCodepoints(text) {
  return Array.from(text).map(
    (ch) => "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")
  );
}

export function fromCodepoints(codepoints) {
  return codepoints
    .map((cp) => String.fromCodePoint(parseInt(cp.replace(/^U\+/i, ""), 16)))
    .join("");
}

export function foldGlottal(text) {
  return text.split(COMBINING_COMMA_ABOVE_RIGHT).join(COMBINING_COMMA_ABOVE);
}

export function slugify(gloss) {
  const slug = gloss
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "entry";
}

export function uniqueId(base, taken) {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * Stable projection of the linguistic content only. Reformatting the JSON will
 * not change this, but altering a single character will.
 */
export function canonicalContent(entries) {
  return [...entries]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((e) => [e.id, e.klallam, e.english, e.audio ?? ""].join("\u0000"))
    .join("\n");
}

export function hashEntries(entries) {
  return createHash("sha256").update(canonicalContent(entries), "utf8").digest("hex");
}

export function readLexicon() {
  const raw = fs.readFileSync(LEXICON_JSON, "utf8");
  return JSON.parse(raw);
}

export function writeLexicon(lexicon) {
  fs.writeFileSync(LEXICON_JSON, JSON.stringify(lexicon, null, 2) + "\n", "utf8");
}

export function readLock() {
  if (!fs.existsSync(LEXICON_LOCK)) return null;
  return JSON.parse(fs.readFileSync(LEXICON_LOCK, "utf8"));
}

export function writeLock(entries) {
  const lock = {
    algorithm: "sha256",
    entryCount: entries.length,
    hash: hashEntries(entries),
  };
  fs.writeFileSync(LEXICON_LOCK, JSON.stringify(lock, null, 2) + "\n", "utf8");
  return lock;
}

export function readAudioMap() {
  return JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, "audio-map.json"), "utf8"));
}

/**
 * Read one line of Klallam text straight off disk. Strips only a BOM and a
 * trailing CR/LF; interior characters are never touched.
 */
export function readWordFromFile(filePath, lineNumber = 1) {
  const resolved = path.resolve(REPO_ROOT, filePath);
  if (!fs.existsSync(resolved)) throw new Error(`No such file: ${filePath}`);
  const lines = fs.readFileSync(resolved, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  const line = lines[lineNumber - 1];
  if (line === undefined) throw new Error(`${filePath} has no line ${lineNumber}.`);
  const word = line.trim();
  if (!word) throw new Error(`Line ${lineNumber} of ${filePath} is empty.`);
  return word;
}

/** Compare against a caller-supplied "U+XXXX U+XXXX" assertion. */
export function codepointsMatch(text, expected) {
  const want = expected.trim().split(/[\s,]+/).filter(Boolean).map((cp) => cp.toUpperCase());
  const got = toCodepoints(text);
  return want.length === got.length && want.every((cp, i) => cp === got[i]);
}

export function describeCodepoints(text) {
  return Array.from(text)
    .map((ch) => {
      const cp = "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
      const combining = /\p{M}/u.test(ch);
      return `  ${cp}  ${combining ? "(combining mark)" : JSON.stringify(ch)}`;
    })
    .join("\n");
}

/**
 * Damage a spreadsheet editor cannot see.
 *
 * Excel ships with AutoCorrect on, so a Klallam word can arrive sentence-cased or
 * with its apostrophes curled without anybody touching those characters. Each of
 * these is a silent corruption of source material, so they are hard errors rather
 * than warnings. Characters are written as escapes to satisfy the ASCII guard.
 */
const TEXT_HAZARDS = [
  {
    test: /[\u2018\u2019\u201A\u201B]/u,
    label: "a curly single quote (Excel AutoCorrect replaced a straight one)",
  },
  {
    test: /[\u201C\u201D\u201E\u201F]/u,
    label: "a curly double quote (Excel AutoCorrect replaced a straight one)",
  },
  { test: /['"`]/u, label: "an ASCII quote or backtick, which means transliteration crept in" },
  { test: /\u00A0/u, label: "a non-breaking space" },
  { test: /[\u200B\u200C\u200D\uFEFF]/u, label: "an invisible zero-width character" },
  { test: /\uFFFD/u, label: "U+FFFD, the replacement character, which means the encoding was lost" },
  { test: /\s\s/u, label: "a double space" },
];

export function inspectKlallam(text) {
  const problems = [];

  for (const hazard of TEXT_HAZARDS) {
    if (hazard.test.test(text)) problems.push(`contains ${hazard.label}`);
  }

  // Klallam is written lowercase. A capital almost always means Excel's
  // "capitalize first letter of sentence" rewrote the cell.
  const first = Array.from(text)[0] ?? "";
  if (first !== first.toLowerCase()) {
    problems.push(
      "starts with a capital letter (Excel AutoCorrect capitalizes the first letter of a cell)"
    );
  }

  return problems;
}

