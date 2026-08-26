import { TUNING } from "./config";

const KEY = "fishybird.words.v1";
const SCHEMA = 1;

export interface WordRecord {
  box: number;
  lastRound: number;
  seen: number;
  correct: number;
}

interface Store {
  version: number;
  round: number;
  words: Record<string, WordRecord>;
}

// Storage is missing in some browsers and throws outright in others, and what is in it
// may have been written by an older version. Every path here has a working fallback.

function emptyStore(): Store {
  return { version: SCHEMA, round: 0, words: {} };
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function readRecord(value: unknown): WordRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Partial<WordRecord>;
  if (!isCount(record.box) || !isCount(record.lastRound)) return null;
  if (!isCount(record.seen) || !isCount(record.correct)) return null;
  return {
    box: Math.min(Math.max(Math.trunc(record.box), 1), TUNING.boxCount),
    lastRound: Math.trunc(record.lastRound),
    seen: Math.trunc(record.seen),
    correct: Math.trunc(record.correct),
  };
}

function read(): Store {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return emptyStore();
  }
  if (raw === null) return emptyStore();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyStore();
    const stored = parsed as Partial<Store>;
    if (stored.version !== SCHEMA) return emptyStore();
    if (!isCount(stored.round)) return emptyStore();
    if (typeof stored.words !== "object" || stored.words === null) return emptyStore();

    const words: Record<string, WordRecord> = {};
    for (const [id, value] of Object.entries(stored.words)) {
      const record = readRecord(value);
      if (record !== null) words[id] = record;
    }
    return { version: SCHEMA, round: Math.trunc(stored.round), words };
  } catch {
    return emptyStore();
  }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Play carries on; this round just will not be remembered.
  }
}

export function startRound(): number {
  const store = read();
  store.round += 1;
  write(store);
  return store.round;
}

export function recordAnswer(id: string, correct: boolean): void {
  const store = read();
  const existing = store.words[id] ?? { box: 1, lastRound: store.round, seen: 0, correct: 0 };
  const box = correct
    ? Math.min(existing.box + 1, TUNING.boxCount)
    : TUNING.missDropsToFirstBox
      ? 1
      : Math.max(1, existing.box - 1);

  store.words[id] = {
    box,
    lastRound: store.round,
    seen: existing.seen + 1,
    correct: existing.correct + (correct ? 1 : 0),
  };
  write(store);
}

export function getMemory(): { round: number; words: Record<string, WordRecord> } {
  const store = read();
  return { round: store.round, words: store.words };
}
