import Phaser from "phaser";
import type { Choice } from "./words";

export interface Salmon {
  readonly choice: Choice;
  readonly container: Phaser.GameObjects.Container;
  readonly halfWidth: number;
  readonly halfHeight: number;
}

const BODY_HEIGHT = 48;
const TAIL_WIDTH = 30;
const MIN_BODY_WIDTH = 130;

// English on the canvas is fine. Klallam never is: only the DOM banner stacks marks correctly.
export function createSalmon(
  scene: Phaser.Scene,
  choice: Choice,
  x: number,
  y: number
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

  const container = scene.add.container(x, y, [body, tail, eye, label]);
  return {
    choice,
    container,
    halfWidth: bodyWidth / 2 + TAIL_WIDTH,
    halfHeight: BODY_HEIGHT / 2,
  };
}
