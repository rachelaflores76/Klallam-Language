import { LEVELS, clampLevelIndex } from "./config";

const KEY = "fishybird.progress.v1";
const SCHEMA = 1;

// Storage is missing in some browsers and throws outright in others. A game that cannot
// remember anything must still be playable, so every path here has a working fallback.

export function getUnlockedLevel(): number {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return 0;
  }
  if (raw === null) return 0;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return 0;
    const stored = parsed as { version?: unknown; unlockedLevel?: unknown };
    if (stored.version !== SCHEMA) return 0;
    if (typeof stored.unlockedLevel !== "number") return 0;
    return clampLevelIndex(stored.unlockedLevel);
  } catch {
    return 0;
  }
}

/** Never lowers what is already unlocked: a bad round does not cost a level. */
export function unlockLevel(index: number): void {
  const wanted = clampLevelIndex(index);
  if (wanted <= getUnlockedLevel()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: SCHEMA, unlockedLevel: wanted }));
  } catch {
    // Play carries on; it just will not be remembered next time.
  }
}

export function hasHarderLevel(index: number): boolean {
  return index < LEVELS.length - 1;
}
