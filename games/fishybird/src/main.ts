import Phaser from "phaser";
import { buildRound, type RoundWord } from "./words";

class GameScene extends Phaser.Scene {
  private round: RoundWord[] = [];

  constructor() {
    super("game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0b3d52");
    this.round = buildRound();

    const first = this.round[0];
    if (first === undefined) return;

    this.add
      .text(480, 270, "Click to hear the first word", { fontSize: "24px", color: "#e8f4f8" })
      .setOrigin(0.5);

    this.input.on("pointerdown", () => {
      void new Audio(first.audioUrl).play();
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  scene: [GameScene],
});
