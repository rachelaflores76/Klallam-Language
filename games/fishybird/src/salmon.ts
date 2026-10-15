import Phaser from "phaser";
import { TUNING } from "./config";
import type { Choice } from "./words";

export interface Salmon {
  readonly choice: Choice;
  readonly container: Phaser.GameObjects.Container;
  readonly halfWidth: number;
  readonly halfHeight: number;
  readonly startX: number;
  readonly speed: number;
  /** The depth it swims at before the drift is added. */
  readonly baseY: number;
  /** Where in the drift it starts, so no two fish rise and fall together. */
  readonly bobPhase: number;
  /** Scene time it entered the lane. Its position is worked out from this. */
  releasedAt: number;
}

export interface SalmonSpawn {
  startX: number;
  laneY: number;
  speed: number;
}

const BODY_HEIGHT = 52;
const TAIL_WIDTH = 36;
const MIN_BODY_WIDTH = 140;

// English on the canvas is fine. Klallam never is: only the DOM banner stacks marks correctly.
export function createSalmon(
  scene: Phaser.Scene,
  choice: Choice,
  spawn: SalmonSpawn,
  random: () => number = Math.random
): Salmon {
  const label = scene.add
    .text(0, 0, choice.english, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      color: "#1a0a06",
    })
    .setOrigin(0.5);
  const bodyWidth = Math.max(MIN_BODY_WIDTH, label.width + 40);
  const hw = bodyWidth / 2;

  // Main salmon-pink body
  const body = scene.add.ellipse(0, 0, bodyWidth, BODY_HEIGHT, 0xd96840);
  // White/cream belly - offset downward
  const belly = scene.add.ellipse(0, 10, bodyWidth * 0.78, BODY_HEIGHT * 0.44, 0xf4d8c0);
  // Forked tail - two lobes
  const tailTop = scene.add.triangle(
    hw + TAIL_WIDTH * 0.5, -4,
    TAIL_WIDTH, -26, TAIL_WIDTH, 2, 0, 0,
    0xb04830
  );
  const tailBot = scene.add.triangle(
    hw + TAIL_WIDTH * 0.5, 4,
    TAIL_WIDTH, -2, TAIL_WIDTH, 26, 0, 0,
    0xb04830
  );
  // Dorsal fin on top
  const dorsalFin = scene.add.triangle(
    -hw * 0.1, -BODY_HEIGHT / 2,
    -20, 0, 10, -22, 36, 0,
    0xc25840
  );
  // Pectoral fin - small side fin
  const pectoralFin = scene.add.triangle(
    -hw * 0.3, 8,
    0, 0, 28, 14, 0, 26,
    0xc25840
  );
  // Scale shimmer - a few small arcs as highlight dashes
  const shimmer1 = scene.add.arc(-hw * 0.15, -4, 14, 200, 340, false, 0xe8906a, 0.4);
  const shimmer2 = scene.add.arc(hw * 0.15, -6, 12, 200, 340, false, 0xe8906a, 0.4);
  const shimmer3 = scene.add.arc(hw * 0.4, -4, 10, 200, 340, false, 0xe8906a, 0.35);
  // Eye with glint
  const eye = scene.add.circle(-hw + 22, -8, 6, 0x1a0a06);
  const eyeGlint = scene.add.circle(-hw + 24, -10, 2, 0xffffff);

  const baseY = spawn.laneY + (random() * 2 - 1) * TUNING.laneSpread;
  const container = scene.add.container(spawn.startX, baseY, [
    body, belly,
    tailTop, tailBot,
    dorsalFin, pectoralFin,
    shimmer1, shimmer2, shimmer3,
    eye, eyeGlint,
    label,
  ]);
  return {
    choice,
    container,
    halfWidth: bodyWidth / 2 + TAIL_WIDTH,
    halfHeight: BODY_HEIGHT / 2,
    startX: spawn.startX,
    speed: spawn.speed,
    baseY,
    bobPhase: random() * Math.PI * 2,
    releasedAt: 0,
  };
}

/**
 * Worked out from the clock rather than added up frame by frame: a browser busy loading
 * a recording must not leave a fish trailing behind its level's speed.
 */
export function positionAt(salmon: Salmon, time: number): { x: number; y: number } {
  const elapsed = time - salmon.releasedAt;
  const drift = (elapsed / TUNING.bobPeriodMs) * Math.PI * 2 + salmon.bobPhase;
  return {
    x: salmon.startX - (salmon.speed * elapsed) / 1000,
    y: salmon.baseY + Math.sin(drift) * TUNING.bobAmplitude,
  };
}

/** A tap counts if it lands inside the fish's box, grown by however forgiving the level is. */
export function containsPoint(
  salmon: Salmon,
  time: number,
  x: number,
  y: number,
  padding: number
): boolean {
  const at = positionAt(salmon, time);
  return (
    Math.abs(at.x - x) <= salmon.halfWidth + padding &&
    Math.abs(at.y - y) <= salmon.halfHeight + padding
  );
}

/**
 * Where to aim to meet a fish that is still swimming. Guess the flight, see where the
 * fish got to, guess again. It settles only because the eagle outruns every fish.
 */
export function interceptPoint(
  salmon: Salmon,
  fromX: number,
  fromY: number,
  now: number
): { x: number; y: number; flightMs: number } {
  let flightMs: number = TUNING.eagleMinFlightMs;
  let at = positionAt(salmon, now);
  for (let pass = 0; pass < 5; pass += 1) {
    const distance = Math.hypot(at.x - fromX, at.y - fromY);
    flightMs = Math.max(TUNING.eagleMinFlightMs, (distance / TUNING.eagleSpeed) * 1000);
    at = positionAt(salmon, now + flightMs);
  }
  return { x: at.x, y: at.y, flightMs };
}

/** A burst, not a colour: right and wrong must be tellable apart without seeing hue. */
export function createCatchBurst(
  scene: Phaser.Scene,
  x: number,
  y: number
): Phaser.GameObjects.Star {
  return scene.add.star(x, y, 8, 14, 40, 0xffe08a).setDepth(11);
}
