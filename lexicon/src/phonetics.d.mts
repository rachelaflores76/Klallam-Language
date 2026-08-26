export declare const COMBINING_COMMA_ABOVE: string;
export declare const COMBINING_COMMA_ABOVE_RIGHT: string;

export declare function foldGlottal(text: string): string;

export declare function phoneticDistance(a: string, b: string): number;

export interface RankedWord<T> {
  entry: T;
  distance: number;
}

export declare function rankByPhoneticDistance<T extends { klallam: string; id?: string }>(
  target: string,
  candidates: readonly T[]
): RankedWord<T>[];

export interface DistractorOptions<T> {
  target: T;
  pool: readonly T[];
  count: number;
  /** 0 draws from the whole pool, 1 always takes a lookalike. Rolled per wrong answer. */
  chance: number;
  poolSize: number;
  random: () => number;
}

export declare function pickDistractors<
  T extends { id: string; klallam: string; english: string },
>(options: DistractorOptions<T>): T[];
