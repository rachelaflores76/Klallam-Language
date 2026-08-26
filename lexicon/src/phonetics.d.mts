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
