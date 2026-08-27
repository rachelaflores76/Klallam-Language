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

const BODY_HEIGHT = 48;
const TAIL_WIDTH = 30;
const MIN_BODY_WIDTH = 130;

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
      color: "#2a120c",
    })
    .setOrigin(0.5);
  const bodyWidth = Math.max(MIN_BODY_WIDTH, label.width + 36);

  const body = scene.add.ellipse(0, 0, bodyWidth, BODY_HEIGHT, 0xe08a5f);
  const tail = scene.add.triangle(
    bodyWidth / 2 + TAIL_WIDTH / 2,
    0,
    TAIL_WIDTH,
    -22,
    TAIL_WIDTH,
    22,
    0,
    0,
    0xc2553a
  );
  const eye = scene.add.circle(-bodyWidth / 2 + 20, -8, 4, 0x2a120c);

  const baseY = spawn.laneY + (random() * 2 - 1) * TUNING.laneSpread;
  const container = scene.add.container(spawn.startX, baseY, [body, tail, eye, label]);
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

/** A burst, not a colour: right and wrong must be tellable apart without seeing hue. */
export function createCatchBurst(
  scene: Phaser.Scene,
  x: number,
  y: number
): Phaser.GameObjects.Star {
  return scene.add.star(x, y, 8, 14, 40, 0xffe08a).setDepth(11);
}
