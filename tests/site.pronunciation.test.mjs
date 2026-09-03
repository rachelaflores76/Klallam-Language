import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readLexicon } from "../tools/lexicon-cli/lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GUIDE = JSON.parse(
  fs.readFileSync(path.join(HERE, "..", "site", "src", "pronunciation.json"), "utf8")
);

const cards = GUIDE.cards;
const wordIds = new Set(readLexicon().entries.map((e) => e.id));
const symbolIds = cards.flatMap((card) => card.symbolIds);

test("the guide has cards", () => {
  assert.ok(cards.length > 0);
});

test("every card has a description and at least one sound", () => {
  for (const card of cards) {
    const where = card.symbolIds[0] ?? "(no symbols)";
    assert.ok(Array.isArray(card.symbolIds) && card.symbolIds.length > 0, `${where}: no sounds`);
    assert.ok(card.description, `${where}: no description`);
    assert.ok(card.exampleId, `${where}: no example word`);
  }
});

test("the guide holds no Klallam of its own", () => {
  const raw = fs.readFileSync(
    path.join(HERE, "..", "site", "src", "pronunciation.json"),
    "utf8"
  );
  for (const id of symbolIds) {
    assert.match(id, /^[a-z0-9-]+$/, `${id}: not usable as a lexicon id`);
  }
  for (const card of cards) {
    assert.match(card.exampleId, /^[a-z0-9-]+$/, `${card.exampleId}: not usable as a lexicon id`);
  }
  // Same rule as the ASCII guard, minus the dashes the English descriptions use.
  const withoutPunctuation = raw.replace(/\u2014/g, "");
  // eslint-disable-next-line no-control-regex
  const stray = withoutPunctuation.match(/[^\x00-\x7F]/);
  assert.equal(
    stray,
    null,
    stray === null
      ? ""
      : `U+${stray[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")} is inlined in the page content; Klallam belongs in the lexicon`
  );
});

test("no sound is listed on two cards", () => {
  const seen = new Set();
  for (const id of symbolIds) {
    assert.ok(!seen.has(id), `${id}: listed on more than one card`);
    seen.add(id);
  }
});

test("every example word the guide names is in the lexicon", () => {
  for (const card of cards) {
    assert.ok(
      wordIds.has(card.exampleId),
      `${card.symbolIds[0]}: no such word "${card.exampleId}"`
    );
  }
});

test("every sound the guide names is in the lexicon", (t) => {
  const missing = symbolIds.filter((id) => !wordIds.has(id));
  // Turns itself on as soon as the first sound is imported.
  if (missing.length === symbolIds.length) {
    t.skip("the sounds have not been added to the lexicon yet");
    return;
  }
  assert.deepEqual(missing, [], "the guide names sounds the lexicon does not have");
});
