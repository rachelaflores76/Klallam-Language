import { markSent, unsentRounds } from "./rounds";

/**
 * The Web app URL of the maintainer's Google Apps Script (tools/google-sheet/README.md).
 * Empty means nothing is sent: rounds stay on the device, and the game plays as before.
 * This is the only network request FishyBird makes; see the exception in CLAUDE.md.
 */
export const SHEET_URL: string =
  "https://script.google.com/macros/s/AKfycbz4HCoMNrmrEBVk_EVptHzfDBgqjvvdEykzd9RgYB89CA1ihWC-DABIa3eg1DF2dsHZXw/exec";

let sending = false;
let listening = false;

/**
 * Sends every round not yet sent. Best effort: any failure leaves the rounds unsent, to
 * be tried again next time. It never throws and never holds up the game.
 */
export async function sendUnsentRounds(): Promise<void> {
  if (SHEET_URL === "" || sending) return;
  const rounds = unsentRounds();
  if (rounds.length === 0) return;
  sending = true;
  try {
    // Only what CLAUDE.md allows to leave the device.
    const payload = rounds.map((round) => ({
      id: round.id,
      at: round.at,
      playerName: round.playerName,
      level: round.level,
      caught: round.caught,
      outOf: round.outOf,
      missed: round.missed,
    }));
    // Plain text keeps this a simple request, which Apps Script can answer across sites.
    const response = await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ rounds: payload }),
    });
    if (!response.ok) return;
    const reply = (await response.json()) as { ok?: unknown };
    if (reply.ok === true) markSent(rounds.map((round) => round.id));
  } catch {
    // Offline, blocked, or the sheet is not set up: the rounds wait on the device.
  } finally {
    sending = false;
  }
}

/** Tries now, and again whenever the device comes back online. */
export function startSending(): void {
  void sendUnsentRounds();
  if (listening) return;
  listening = true;
  window.addEventListener("online", () => void sendUnsentRounds());
}
