import fs from "node:fs";
import path from "node:path";
import {
  AUDIO_DIR,
  LEXICON_JSON,
  SOURCE_DIR,
  COMBINING_COMMA_ABOVE_RIGHT,
  foldGlottal,
  readAudioMap,
  slugify,
  toCodepoints,
  uniqueId,
  writeLexicon,
  writeLock,
} from "./lib.mjs";

const force = process.argv.includes("--force");

if (fs.existsSync(LEXICON_JSON) && !force) {
  console.error("lexicon.json already exists. Re-run with --force to rebuild it from source.");
  console.error("To change words, edit lexicon/lexicon.xlsx then run: npm run lexicon:import");
  process.exit(1);
}

const tsvPath = path.join(SOURCE_DIR, "grammar-alphabet.tsv");
const tsv = fs.readFileSync(tsvPath, "utf8");
const audioMap = readAudioMap();

const availableAudio = new Set(fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".mp3")));
const normalizeName = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const audioByNormalized = new Map();
for (const file of availableAudio) {
  audioByNormalized.set(normalizeName(path.basename(file, ".mp3")), file);
}

function resolveAudio(gloss) {
  if (audioMap.noAudio.includes(gloss)) return null;
  const alias = audioMap.aliases[gloss];
  if (alias) return availableAudio.has(alias) ? alias : null;
  return audioByNormalized.get(normalizeName(gloss)) ?? null;
}

const rows = tsv
  .split(/\r?\n/)
  .slice(1)
  .filter((line) => line.trim() !== "")
  .map((line) => {
    const [klallam, english] = line.split("\t");
    return { klallam, english };
  });

const entries = [];
const takenIds = new Set();
const seenExact = new Map();
const seenFolded = new Map();

for (const row of rows) {
  const exactKey = `${row.klallam}\u0000${row.english}`;
  if (seenExact.has(exactKey)) continue; // identical repeat in the source document

  const id = uniqueId(slugify(row.english), takenIds);
  takenIds.add(id);

  const audio = resolveAudio(row.english);
  const reasons = [];

  if (audio === null) reasons.push("no matching recording in the archive");
  if (audioMap.uncertain.includes(row.english)) {
    reasons.push("audio mapping is a best guess and needs a speaker to confirm");
  }
  if (row.klallam.includes(COMBINING_COMMA_ABOVE_RIGHT)) {
    reasons.push("uses U+0315 where most of the document uses U+0313");
  }

  const folded = foldGlottal(row.klallam);
  if (seenFolded.has(folded)) {
    const other = seenFolded.get(folded);
    reasons.push(`differs from "${other}" only by an invisible mark`);
    const twin = entries.find((e) => e.id === other);
    if (twin && !twin.review_reasons.some((r) => r.startsWith("differs from"))) {
      twin.review_reasons.push(`differs from "${id}" only by an invisible mark`);
      twin.needs_review = true;
    }
  } else {
    seenFolded.set(folded, id);
  }

  const entry = {
    id,
    klallam: row.klallam,
    codepoints: toCodepoints(row.klallam),
    english: row.english,
    audio,
    image: null,
    tags: [],
    needs_review: reasons.length > 0,
    review_reasons: reasons,
  };

  entries.push(entry);
  seenExact.set(exactKey, id);
}

const lexicon = {
  version: 1,
  source: "Klallam Grammar alphabet examples, klallamlanguage.org",
  entries,
};

writeLexicon(lexicon);
const lock = writeLock(entries);

const withAudio = entries.filter((e) => e.audio).length;
const flagged = entries.filter((e) => e.needs_review).length;
const usedAudio = new Set(entries.map((e) => e.audio).filter(Boolean));
const unused = [...availableAudio].filter((f) => !usedAudio.has(f)).sort();

console.log(`Seeded ${entries.length} entries from ${rows.length} source rows.`);
console.log(`  with audio     : ${withAudio}`);
console.log(`  needs review   : ${flagged}`);
console.log(`  unused audio   : ${unused.length}${unused.length ? " -> " + unused.join(", ") : ""}`);
console.log(`  lock hash      : ${lock.hash.slice(0, 16)}...`);
