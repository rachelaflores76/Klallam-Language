// Every value deciding how fast, how many, or how forgiving lives here, and nowhere else.

/** Shared by every difficulty. Anything that varies between levels belongs on a Level. */
export const TUNING = {
  // round shape
  wordsPerRound: 10,

  // forgiveness
  wrongAnswerEndsRun: false,
  replayAudioOnWrong: true,
  livesPerRound: Infinity,

  // pacing
  diveMs: 420,
  orcaIntroMs: 1200,
  orcaIntroSkippable: true,
  celebrateMs: 700,
  escapeMs: 500,
  autoPlayAudioOnReveal: true,
  allowAudioReplay: true,
} as const;

export interface Level {
  /** ASCII slug, used in storage and reports. Never shown to a player. */
  id: string;
  name: string;
  salmonSpeed: number;
  spawnIntervalMs: number;
  salmonPerWord: number;
  hitboxPadding: number;
  distractorStrategy: "random" | "phonetic";
}

// Difficulty order: a level's position in this list is its level number.
export const LEVELS = [
  {
    id: "level-1",
    name: "Level 1",
    salmonSpeed: 100,
    spawnIntervalMs: 2800,
    salmonPerWord: 3,
    hitboxPadding: 18,
    distractorStrategy: "random",
  },
  {
    id: "level-2",
    name: "Level 2",
    salmonSpeed: 140,
    spawnIntervalMs: 2200,
    salmonPerWord: 3,
    hitboxPadding: 12,
    distractorStrategy: "random",
  },
  {
    id: "level-3",
    name: "Level 3",
    salmonSpeed: 190,
    spawnIntervalMs: 1700,
    salmonPerWord: 4,
    hitboxPadding: 8,
    distractorStrategy: "random",
  },
] as const satisfies readonly Level[];

/** Clamped, so a stale stored number or a bad forceLevel cannot leave the game levelless. */
export function clampLevelIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), LEVELS.length - 1);
}

export function levelAt(index: number): Level {
  return LEVELS[clampLevelIndex(index)] ?? LEVELS[0];
}
