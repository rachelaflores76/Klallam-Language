import { storageFor } from "@klallam/game-kit";

// Every finished FishyBird round, for every player on this device. This list is what the
// My Progress page reads, and what gets sent to the maintainer's sheet (see CLAUDE.md).
const store = storageFor("fishybird");
const KEY = "rounds.v1";
const SCHEMA = 1;
// Enough for years of classroom play while staying far inside browser storage limits.
const MAX_ROUNDS = 2000;

export interface RoundResult {
  /** Unique, so the sheet can ignore a round sent twice. */
  id: string;
  playerId: string;
  playerName: string;
  /** ISO date and time the round ended. */
  at: string;
  level: string;
  caught: number;
  outOf: number;
  /** The English meaning of each word that got away. */
  missed: string[];
  sent: boolean;
}

interface Store {
  version: number;
  rounds: RoundResult[];
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function readRound(value: unknown): RoundResult | null {
  if (typeof value !== "object" || value === null) return null;
  const r = value as Partial<RoundResult>;
  if (typeof r.id !== "string" || typeof r.playerId !== "string") return null;
  if (typeof r.playerName !== "string" || typeof r.at !== "string") return null;
  if (typeof r.level !== "string" || !isCount(r.caught) || !isCount(r.outOf)) return null;
  const missed = Array.isArray(r.missed)
    ? r.missed.filter((m): m is string => typeof m === "string")
    : [];
  return {
    id: r.id,
    playerId: r.playerId,
    playerName: r.playerName,
    at: r.at,
    level: r.level,
    caught: r.caught,
    outOf: r.outOf,
    missed,
    sent: r.sent === true,
  };
}

function read(): RoundResult[] {
  const parsed = store.read(KEY);
  if (typeof parsed !== "object" || parsed === null) return [];
  const stored = parsed as Partial<Store>;
  if (stored.version !== SCHEMA || !Array.isArray(stored.rounds)) return [];
  const rounds: RoundResult[] = [];
  for (const value of stored.rounds as unknown[]) {
    const round = readRound(value);
    if (round !== null) rounds.push(round);
  }
  return rounds;
}

function write(rounds: RoundResult[]): void {
  store.write(KEY, { version: SCHEMA, rounds: rounds.slice(-MAX_ROUNDS) });
}

export function saveRound(result: Omit<RoundResult, "id" | "at" | "sent">): RoundResult {
  const round: RoundResult = {
    ...result,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    sent: false,
  };
  const rounds = read();
  rounds.push(round);
  write(rounds);
  return round;
}

/** Oldest first. */
export function roundsFor(playerId: string): RoundResult[] {
  return read().filter((round) => round.playerId === playerId);
}

export function unsentRounds(): RoundResult[] {
  return read().filter((round) => !round.sent);
}

export function markSent(ids: readonly string[]): void {
  if (ids.length === 0) return;
  const done = new Set(ids);
  const rounds = read();
  for (const round of rounds) if (done.has(round.id)) round.sent = true;
  write(rounds);
}
