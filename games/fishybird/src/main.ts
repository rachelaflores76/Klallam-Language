import Phaser from "phaser";
import { playWord } from "./audio";
import { TUNING } from "./config";
import { createSalmon, type Salmon } from "./salmon";
import { createUi, type GameUi } from "./ui";
import { buildRound, type RoundWord } from "./words";

const WIDTH = 960;
const HEIGHT = 540;
const SEA_Y = 360;
const ORCA_HIDDEN_Y = HEIGHT + 120;
const ORCA_SURFACED_Y = SEA_Y + 60;
const EAGLE_PERCH_Y = 110;
const EAGLE_DIVE_Y = SEA_Y + 50;
const SALMON_LANE_Y = EAGLE_DIVE_Y;
const SALMON_START_X = WIDTH + 160;

function drawSea(scene: Phaser.Scene): void {
  scene.add.rectangle(WIDTH / 2, (HEIGHT + SEA_Y) / 2, WIDTH, HEIGHT - SEA_Y, 0x0a5470);
  scene.add.rectangle(WIDTH / 2, SEA_Y, WIDTH, 6, 0x7fc8de);
}

// Shapes drawn in code, so swapping in real artwork later changes no layout.
function createOrca(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const body = scene.add.ellipse(0, 0, 260, 90, 0x101c24);
  const belly = scene.add.ellipse(30, 26, 170, 38, 0xf2fbff);
  const eyePatch = scene.add.ellipse(-78, -14, 30, 16, 0xf2fbff);
  const fin = scene.add.triangle(-10, -60, 0, 30, 34, -30, 62, 30, 0x101c24);
  return scene.add.container(WIDTH / 2, ORCA_HIDDEN_Y, [body, belly, eyePatch, fin]);
}

function createEagle(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const tail = scene.add.triangle(-56, 2, 0, -18, 0, 18, 36, 0, 0xf6fbfd);
  const body = scene.add.ellipse(0, 0, 108, 46, 0x4a2c12);
  const wing = scene.add.triangle(-4, -18, 0, 22, 42, -28, 82, 18, 0x33200c);
  const head = scene.add.circle(50, -8, 21, 0xf6fbfd);
  const beak = scene.add.triangle(68, -4, 0, -9, 0, 9, 24, 0, 0xf0b429);
  return scene.add.container(WIDTH / 2, EAGLE_PERCH_Y, [tail, body, wing, head, beak]);
}

class RoundScene extends Phaser.Scene {
  private ui!: GameUi;
  private round: RoundWord[] = [];
  private index = 0;
  private orca!: Phaser.GameObjects.Container;
  private eagle!: Phaser.GameObjects.Container;
  private diving = false;
  private salmon: Salmon[] = [];
  private waiting: Salmon[] = [];
  private spawner?: Phaser.Time.TimerEvent;

  constructor() {
    super("round");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#123c50");
    drawSea(this);
    this.orca = createOrca(this);
    this.eagle = createEagle(this);
    this.eagle.setDepth(10);

    this.ui = createUi();
    this.round = buildRound();

    this.ui.onStart(() => this.presentWord());
    this.ui.onSkip(() => this.skipIntro());
    this.ui.onReplay(() => this.replayWord());
    this.ui.onNext(() => this.advance());

    // Mouse and touch both arrive as pointerdown; the space bar joins them on the
    // same call, so there is only ever one dive to get right.
    this.input.on("pointerdown", () => this.dive());
    this.input.keyboard?.addCapture("SPACE");
    this.input.keyboard?.on("keydown-SPACE", () => this.dive());
  }

  private dive(): void {
    if (this.diving) return;
    this.diving = true;
    this.tweens.add({
      targets: this.eagle,
      y: EAGLE_DIVE_Y,
      duration: TUNING.diveMs,
      ease: "Quad.easeIn",
      yoyo: true,
      onComplete: () => {
        this.eagle.y = EAGLE_PERCH_Y;
        this.diving = false;
      },
    });
  }

  private get currentWord(): RoundWord | undefined {
    return this.round[this.index];
  }

  private presentWord(): void {
    if (this.currentWord === undefined) return;

    this.ui.clearWord();
    this.ui.showSkip(true);
    this.tweens.killTweensOf(this.orca);
    this.orca.y = ORCA_HIDDEN_Y;

    this.tweens.add({
      targets: this.orca,
      y: ORCA_SURFACED_Y,
      duration: TUNING.orcaIntroMs,
      ease: "Sine.easeOut",
      onComplete: () => this.revealWord(),
    });
  }

  private skipIntro(): void {
    if (!TUNING.orcaIntroSkippable) return;
    this.tweens.killTweensOf(this.orca);
    this.orca.y = ORCA_SURFACED_Y;
    this.revealWord();
  }

  private revealWord(): void {
    const word = this.currentWord;
    if (word === undefined) return;
    this.ui.showSkip(false);
    this.ui.showWord(word.klallam);
    if (TUNING.autoPlayAudioOnReveal) playWord(word.audioUrl);
    this.startSalmonRun(word);
  }

  private startSalmonRun(word: RoundWord): void {
    this.clearSalmon();
    this.waiting = word.choices.map((choice) =>
      createSalmon(this, choice, SALMON_START_X, SALMON_LANE_Y)
    );
    this.spawner = this.time.addEvent({
      delay: TUNING.spawnIntervalMs,
      startAt: TUNING.spawnIntervalMs,
      repeat: this.waiting.length - 1,
      callback: () => this.releaseNextSalmon(),
    });
  }

  private releaseNextSalmon(): void {
    const next = this.waiting.shift();
    if (next === undefined) return;
    this.salmon.push(next);
  }

  private clearSalmon(): void {
    this.spawner?.remove();
    this.spawner = undefined;
    for (const salmon of [...this.salmon, ...this.waiting]) salmon.container.destroy();
    this.salmon = [];
    this.waiting = [];
  }

  override update(_time: number, delta: number): void {
    const step = (TUNING.salmonSpeed * delta) / 1000;
    this.salmon = this.salmon.filter((salmon) => {
      salmon.container.x -= step;
      if (salmon.container.x + salmon.halfWidth >= 0) return true;
      salmon.container.destroy();
      return false;
    });
  }

  private replayWord(): void {
    const word = this.currentWord;
    if (word === undefined || !TUNING.allowAudioReplay) return;
    playWord(word.audioUrl);
  }

  /** Temporary until step 8, when catching the right salmon is what moves the round on. */
  private advance(): void {
    this.clearSalmon();
    this.index = (this.index + 1) % this.round.length;
    this.presentWord();
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  scene: [RoundScene],
});
