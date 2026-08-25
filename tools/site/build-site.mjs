import fs from "node:fs";
import path from "node:path";
import { LEXICON_DIR, LEXICON_JSON, REPO_ROOT } from "../lexicon-cli/lib.mjs";

const GAME_DIST = path.join(REPO_ROOT, "games", "fishybird", "dist");
const SITE_DIR = path.join(REPO_ROOT, "dist");
const REVIEW_DIR = path.join(SITE_DIR, "review");

if (!fs.existsSync(path.join(GAME_DIST, "index.html"))) {
  console.error(`No built game at ${path.relative(REPO_ROOT, GAME_DIST)}.`);
  console.error("Run: npm run site:build");
  process.exit(1);
}

fs.rmSync(SITE_DIR, { recursive: true, force: true });

// FishyBird is the site root for now. Its build already carries the recordings.
fs.cpSync(GAME_DIST, SITE_DIR, { recursive: true });

fs.mkdirSync(REVIEW_DIR, { recursive: true });
fs.cpSync(path.join(LEXICON_DIR, "review", "index.html"), path.join(REVIEW_DIR, "index.html"));
fs.cpSync(LEXICON_JSON, path.join(REVIEW_DIR, "lexicon.json"));

const audioCount = fs
  .readdirSync(path.join(SITE_DIR, "audio"))
  .filter((name) => path.extname(name).toLowerCase() === ".mp3").length;

console.log(`Site assembled in ${path.relative(REPO_ROOT, SITE_DIR)}/`);
console.log(`  game        : index.html`);
console.log(`  recordings  : audio/ (${audioCount} files)`);
console.log(`  review page : review/index.html`);
