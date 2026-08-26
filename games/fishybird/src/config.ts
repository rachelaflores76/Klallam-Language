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
  /** Catching this many of wordsPerRound opens the next level. */
  advanceAtCaught: number;
}

// Difficulty order: a level's position in this list is its level number.
export const LEVELS = [
  {
    id: "steady",
    name: "Steady",
    salmonSpeed: 120,
    spawnIntervalMs: 2500,
    salmonPerWord: 3,
    hitboxPadding: 12,
    distractorStrategy: "random",
    advanceAtCaught: 8,
  },
] as const satisfies readonly Level[];
