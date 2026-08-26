import Phaser from "phaser";
import { playCatchChime, playWord } from "./audio";
import { LEVELS, TUNING, clampLevelIndex, levelAt, type Level } from "./config";
import { recordAnswer, startRound } from "./memory";
import { createCatchBurst, createSalmon, type Salmon } from "./salmon";
import { createUi, type GameUi } from "./ui";
import { buildRound, type RoundWord } from "./words";

const WIDTH = 960;
const HEIGHT = 540;
const SEA_Y = 360;
const ORCA_HIDDEN_Y = HEIGHT + 120;
// High enough that the body clears the waterline rather than resting on it.
const ORCA_PEAK_Y = SEA_Y - 70;
// The orca's head is its left end, and a positive angle turns clockwise, which lifts
// that end. Level at the top of the arc.
const ORCA_TILT = 28;
// It leaves the water right of centre and re-enters left of it, about a body length
// apart, because nothing jumps straight up out of the water.
const ORCA_ENTRY_X = WIDTH / 2 + 140;
const ORCA_EXIT_X = WIDTH / 2 - 140;
const EAGLE_PERCH_Y = 110;
const EAGLE_DIVE_Y = SEA_Y + 50;
const SALMON_LANE_Y = EAGLE_DIVE_Y;
const SALMON_START_X = WIDTH + 160;
const EAGLE_HALF_WIDTH = 58;
const EAGLE_HALF_HEIGHT = 26;

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
  private level: Level = levelAt(0);
  private levelIndex = 0;
  private round: RoundWord[] = [];
  private index = 0;
  private orca!: Phaser.GameObjects.Container;
  private eagle!: Phaser.GameObjects.Container;
  private diving = false;
  private salmon: Salmon[] = [];
  private waiting: Salmon[] = [];
  private spawner?: Phaser.Time.TimerEvent;
  private caught = 0;
  private caughtThisDive = false;
  private wrongThisWord = false;
  private roundOver = false;
  private wordInPlay = false;
  private missed: RoundWord[] = [];

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

    this.ui.renderLevels(
      LEVELS.map((level) => level.name),
      (index) => this.beginRound(index)
    );
    this.ui.onSkip(() => this.skipIntro());
    this.ui.onReplay(() => this.replayWord());
    this.ui.onChangeLevel(() => this.abandonRound());
    this.ui.onPlayAgain(() => this.beginRound(this.levelIndex));

    // Mouse and touch both arrive as pointerdown; the space bar joins them on the
    // same call, so there is only ever one dive to get right.
    this.input.on("pointerdown", () => this.dive());
    this.input.keyboard?.addCapture("SPACE");
    this.input.keyboard?.on("keydown-SPACE", () => this.dive());
  }

  private beginRound(index: number): void {
    this.levelIndex = clampLevelIndex(index);
    this.level = levelAt(this.levelIndex);
    this.ui.hideSummary();
    this.ui.hideChooser();
    this.clearSalmon();
    startRound();
    this.round = buildRound(this.level);
    this.index = 0;
    this.caught = 0;
    this.missed = [];
    this.roundOver = false;
    this.wordInPlay = false;
    this.ui.showScore(this.level.name, 0, this.round.length);
    this.presentWord();
  }

  private abandonRound(): void {
    this.roundOver = true;
    this.wordInPlay = false;
    this.clearSalmon();
    this.ui.clearWord();
    this.ui.showSkip(false);
    this.ui.hideSummary();
    this.hideOrca();
    this.ui.showChooser();
  }

  private dive(): void {
    if (this.diving || this.roundOver) return;
    this.diving = true;
    this.caughtThisDive = false;
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

  private hideOrca(): void {
    this.tweens.killTweensOf(this.orca);
    this.orca.y = ORCA_HIDDEN_Y;
    this.orca.x = ORCA_ENTRY_X;
    this.orca.angle = ORCA_TILT;
  }

  private presentWord(): void {
    if (this.currentWord === undefined) return;

    this.ui.clearWord();
    this.ui.showSkip(true);
    this.hideOrca();

    this.tweens.add({
      targets: this.orca,
      y: ORCA_PEAK_Y,
      duration: TUNING.orcaIntroMs,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.revealWord();
        this.tweens.add({
          targets: this.orca,
          y: ORCA_HIDDEN_Y,
          duration: TUNING.orcaIntroMs,
          ease: "Sine.easeIn",
        });
        this.tweens.add({
          targets: this.orca,
          x: ORCA_EXIT_X,
          duration: TUNING.orcaIntroMs,
          ease: "Linear",
        });
        this.tweens.add({
          targets: this.orca,
          angle: -ORCA_TILT,
          duration: TUNING.orcaIntroMs,
          ease: "Cubic.easeOut",
        });
      },
    });

    // Horizontal travel is even across the whole jump. Only the vertical speed
    // changes, which is what makes the path read as an arc rather than a swerve.
    this.tweens.add({
      targets: this.orca,
      x: WIDTH / 2,
      duration: TUNING.orcaIntroMs,
      ease: "Linear",
    });

    // The angle is tweened apart from the height, and lags it, because most of the
    // climb happens below the waterline. Levelling it in step with the height would
    // leave the orca flat by the time anyone can see it.
    this.tweens.add({
      targets: this.orca,
      angle: 0,
      duration: TUNING.orcaIntroMs,
      ease: "Cubic.easeIn",
    });
  }

  private skipIntro(): void {
    if (!TUNING.orcaIntroSkippable) return;
    this.hideOrca();
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
    this.wrongThisWord = false;
    this.waiting = word.choices.map((choice) =>
      createSalmon(this, choice, SALMON_START_X, SALMON_LANE_Y)
    );
    this.wordInPlay = true;
    this.spawner = this.time.addEvent({
      delay: this.level.spawnIntervalMs,
      startAt: this.level.spawnIntervalMs,
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
    const step = (this.level.salmonSpeed * delta) / 1000;
    this.salmon = this.salmon.filter((salmon) => {
      salmon.container.x -= step;
      if (salmon.container.x + salmon.halfWidth >= 0) return true;
      salmon.container.destroy();
      return false;
    });
    this.checkForCatch();

    // Every salmon for this word has gone by. That was the chance to catch it.
    if (this.wordInPlay && this.waiting.length === 0 && this.salmon.length === 0) {
      this.missWord();
    }
  }

  private checkForCatch(): void {
    if (!this.diving || this.caughtThisDive) return;
    const hit = this.salmon.find((salmon) => {
      const dx = Math.abs(this.eagle.x - salmon.container.x);
      const dy = Math.abs(this.eagle.y - salmon.container.y);
      return (
        dx <= EAGLE_HALF_WIDTH + salmon.halfWidth + this.level.hitboxPadding &&
        dy <= EAGLE_HALF_HEIGHT + salmon.halfHeight + this.level.hitboxPadding
      );
    });
    if (hit === undefined) return;

    this.caughtThisDive = true;
    this.salmon = this.salmon.filter((salmon) => salmon !== hit);
    if (hit.choice.correct) this.catchCorrect(hit);
    else this.catchWrong(hit);
  }

  private catchCorrect(salmon: Salmon): void {
    playCatchChime();
    const burst = createCatchBurst(this, salmon.container.x, salmon.container.y);
    salmon.container.destroy();
    this.tweens.add({
      targets: burst,
      scale: 1.8,
      alpha: 0,
      angle: 90,
      duration: TUNING.celebrateMs,
      onComplete: () => burst.destroy(),
    });

    this.caught += 1;
    this.ui.showScore(this.level.name, this.caught, this.round.length);
    // A word only counts as known if nothing was caught wrongly on the way to it.
    if (this.currentWord !== undefined) {
      recordAnswer(this.currentWord.id, !this.wrongThisWord);
    }
    this.wordInPlay = false;
    this.clearSalmon();
    this.time.delayedCall(TUNING.celebrateMs, () => this.advance());
  }

  private missWord(): void {
    this.wordInPlay = false;
    const word = this.currentWord;
    if (word !== undefined) {
      this.missed.push(word);
      recordAnswer(word.id, false);
    }
    this.clearSalmon();
    this.advance();
  }

  private catchWrong(salmon: Salmon): void {
    const word = this.currentWord;
    this.wrongThisWord = true;
    // Gated by its own setting: hearing the word again after a miss is teaching,
    // not the same thing as the player asking for a replay.
    if (TUNING.replayAudioOnWrong && word !== undefined) playWord(word.audioUrl);

    // It wriggles free and bolts, so a wrong answer reads as a miss without relying on colour.
    this.tweens.add({
      targets: salmon.container,
      angle: { from: -18, to: 18 },
      duration: TUNING.escapeMs / 6,
      yoyo: true,
      repeat: 2,
    });
    this.tweens.add({
      targets: salmon.container,
      x: -salmon.halfWidth,
      alpha: 0,
      duration: TUNING.escapeMs,
      ease: "Quad.easeIn",
      onComplete: () => salmon.container.destroy(),
    });

    if (TUNING.wrongAnswerEndsRun) this.endRound();
  }

  private advance(): void {
    this.index += 1;
    if (this.index >= this.round.length) {
      this.endRound();
      return;
    }
    this.presentWord();
  }

  private endRound(): void {
    this.roundOver = true;
    this.wordInPlay = false;
    this.clearSalmon();
    this.ui.clearWord();
    this.ui.showSkip(false);
    this.hideOrca();

    this.ui.showSummary(
      this.caught,
      this.round.length,
      this.missed.map((word) => ({
        klallam: word.klallam,
        english: word.english,
        audioUrl: word.audioUrl,
      })),
      this.level.name
    );
  }

  private replayWord(): void {
    const word = this.currentWord;
    if (word === undefined || !TUNING.allowAudioReplay) return;
    playWord(word.audioUrl);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  scene: [RoundScene],
});
