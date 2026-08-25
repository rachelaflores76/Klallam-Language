import Phaser from "phaser";

class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0b3d52");
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  scene: [GameScene],
});
