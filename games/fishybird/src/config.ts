// Every value deciding how fast, how many, or how forgiving lives here, and nowhere else.
export const TUNING = {
  // round shape
  wordsPerRound: 10,
  salmonPerWord: 3,

  // difficulty
  salmonSpeed: 120,
  spawnIntervalMs: 2500,
  hitboxPadding: 12,
  diveMs: 420,

  // forgiveness
  wrongAnswerEndsRun: false,
  replayAudioOnWrong: true,
  livesPerRound: Infinity,

  // pacing
  orcaIntroMs: 1200,
  orcaIntroSkippable: true,
  autoPlayAudioOnReveal: true,
  allowAudioReplay: true,

  // selection
  distractorStrategy: "random" as "random" | "phonetic",
} as const;
