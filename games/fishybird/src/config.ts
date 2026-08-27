// Every value deciding how fast, how many, or how forgiving lives here, and nowhere else.

/** Shared by every difficulty. Anything that varies between levels belongs on a Level. */
export const TUNING = {
  // round shape
  wordsPerRound: 10,

  // forgiveness
  wrongAnswerEndsRun: false,
  replayAudioOnWrong: true,
  livesPerRound: Infinity,
  tapPadding: 18,

  // pacing
  orcaIntroMs: 1200,
  celebrateMs: 700,
  escapeMs: 500,
  autoPlayAudioOnReveal: true,
  allowAudioReplay: true,

  // the eagle. Its speed must stay above every level's salmonSpeed, or the aim it
  // takes at a moving fish stops settling on an answer.
  eagleSpeed: 900,
  eagleMinFlightMs: 140,
  eagleReturnMs: 420,

  // how the shoal swims
  laneSpread: 48,
  bobAmplitude: 6,
  bobPeriodMs: 2400,
  scatterSpeedMultiplier: 3,

  // memory: how often a word comes back
  phoneticNeighborPool: 6,
  boxCount: 5,
  // Rounds a word sits out at each box, from box 1 upwards. Box 1 rests none, so a word
  // just missed is due again immediately.
  boxRestRounds: [0, 1, 2, 4, 8],
  missDropsToFirstBox: true,
} as const;

export interface Level {
  /** ASCII slug, used in storage and reports. Never shown to a player. */
  id: string;
  name: string;
  salmonSpeed: number;
  spawnIntervalMs: number;
  salmonPerWord: number;
  /** Wrong grabs a group forgives. The next one scatters the rest and ends the word. */
  retriesPerGroup: number;
  /** 0 draws wrong answers from anywhere, 1 always uses lookalikes. Rolled per fish. */
  phoneticDistractorChance: number;
  /** Cap on never-seen words per round; the rest is review. Thin review lets more in. */
  newWordsPerRound: number;
}

// Difficulty order: a level's position in this list is its level number.
export const LEVELS = [
  {
    id: "level-1",
    name: "Level 1",
    salmonSpeed: 100,
    spawnIntervalMs: 2800,
    salmonPerWord: 3,
    retriesPerGroup: 2,
    phoneticDistractorChance: 0,
    newWordsPerRound: 2,
  },
  {
    id: "level-2",
    name: "Level 2",
    salmonSpeed: 200,
    spawnIntervalMs: 2400,
    salmonPerWord: 4,
    retriesPerGroup: 1,
    phoneticDistractorChance: 0.5,
    newWordsPerRound: 3,
  },
  {
    id: "level-3",
    name: "Level 3",
    salmonSpeed: 300,
    spawnIntervalMs: 1000,
    salmonPerWord: 4,
    retriesPerGroup: 0,
    phoneticDistractorChance: 1,
    newWordsPerRound: 4,
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
