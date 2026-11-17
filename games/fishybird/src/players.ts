import { storageFor } from "@klallam/game-kit";

// Who is playing FishyBird on this device. Names live only in this browser, apart from
// the round results sent to the maintainer's sheet (see CLAUDE.md, the one exception).
const store = storageFor("fishybird");
const KEY = "players.v1";
const SCHEMA = 1;

/** The name word memory was saved under before players existed. */
export const SHARED_WORDS_KEY = "words.v1";

export const MAX_NAME_LENGTH = 30;

export interface Player {
  id: string;
  name: string;
}

interface Store {
  version: number;
  players: Player[];
  current: string | null;
}

function emptyStore(): Store {
  return { version: SCHEMA, players: [], current: null };
}

function read(): Store {
  const parsed = store.read(KEY);
  if (typeof parsed !== "object" || parsed === null) return emptyStore();
  const stored = parsed as Partial<Store>;
  if (stored.version !== SCHEMA || !Array.isArray(stored.players)) return emptyStore();
  const players: Player[] = [];
  for (const value of stored.players as unknown[]) {
    if (typeof value !== "object" || value === null) continue;
    const player = value as Partial<Player>;
    if (typeof player.id !== "string" || typeof player.name !== "string") continue;
    players.push({ id: player.id, name: player.name });
  }
  const current =
    typeof stored.current === "string" && players.some((p) => p.id === stored.current)
      ? stored.current
      : null;
  return { version: SCHEMA, players, current };
}

function write(next: Store): void {
  store.write(KEY, next);
}

/** Where one player's word memory is saved. */
export function wordsKeyFor(playerId: string): string {
  return `${SHARED_WORDS_KEY}.player.${playerId}`;
}

export function listPlayers(): Player[] {
  return read().players;
}

export function currentPlayer(): Player | null {
  const state = read();
  return state.players.find((player) => player.id === state.current) ?? null;
}

export function choosePlayer(id: string): void {
  const state = read();
  if (!state.players.some((player) => player.id === id)) return;
  state.current = id;
  write(state);
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export type AddResult = { ok: true; player: Player } | { ok: false; reason: string };

/** Adds a name and makes it the current player. */
export function addPlayer(raw: string): AddResult {
  const name = cleanName(raw);
  if (name === "") return { ok: false, reason: "Type a name first." };
  const state = read();
  const taken = state.players.find(
    (player) => player.name.toLocaleLowerCase() === name.toLocaleLowerCase()
  );
  if (taken !== undefined) return { ok: false, reason: `${taken.name} is already on the list.` };

  const player: Player = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
  };

  // The first name added inherits whatever FishyBird remembered before players existed,
  // so nobody's progress is lost. The shared copy is copied, never deleted.
  if (state.players.length === 0) {
    const earlier = store.read(SHARED_WORDS_KEY);
    if (earlier !== null) store.write(wordsKeyFor(player.id), earlier);
  }

  state.players.push(player);
  state.current = player.id;
  write(state);
  return { ok: true, player };
}
