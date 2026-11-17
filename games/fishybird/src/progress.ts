import type { RoundResult } from "./rounds";

export interface LevelSummary {
  level: string;
  rounds: number;
  best: number;
  latest: number;
}

export interface RecentRound {
  when: string;
  level: string;
  caught: number;
  outOf: number;
}

export interface ProgressSummary {
  playerName: string;
  roundsPlayed: number;
  /** Percent caught in each round, oldest first, for the chart. At most CHART_ROUNDS. */
  chart: number[];
  levels: LevelSummary[];
  recent: RecentRound[];
}

const CHART_ROUNDS = 30;
const RECENT_ROUNDS = 10;

export function percent(round: Pick<RoundResult, "caught" | "outOf">): number {
  return round.outOf > 0 ? Math.round((round.caught / round.outOf) * 100) : 0;
}

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Everything the My Progress page shows, from one player's rounds (oldest first). */
export function summarize(playerName: string, rounds: readonly RoundResult[]): ProgressSummary {
  const byLevel = new Map<string, LevelSummary>();
  for (const round of rounds) {
    const score = percent(round);
    const entry = byLevel.get(round.level);
    if (entry === undefined) {
      byLevel.set(round.level, { level: round.level, rounds: 1, best: score, latest: score });
    } else {
      entry.rounds += 1;
      entry.best = Math.max(entry.best, score);
      entry.latest = score;
    }
  }
  return {
    playerName,
    roundsPlayed: rounds.length,
    chart: rounds.slice(-CHART_ROUNDS).map(percent),
    levels: [...byLevel.values()].sort((a, b) => a.level.localeCompare(b.level)),
    recent: rounds
      .slice(-RECENT_ROUNDS)
      .reverse()
      .map((round) => ({
        when: when(round.at),
        level: round.level,
        caught: round.caught,
        outOf: round.outOf,
      })),
  };
}
