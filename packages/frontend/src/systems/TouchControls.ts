import Phaser from "phaser";

/**
 * Mobile touch controls - virtual buttons overlaid on game.
 * Left side = FLY zone (tap anywhere on left half)
 * Right side = SHOOT button (explicit button)
 *
 * Only shown on touch devices.
 */
export class TouchControls {
  private scene: Phaser.Scene;
  private shootBtn: Phaser.GameObjects.Container | null = null;
  private isTouch: boolean;

  onFlap: (() => void) | null = null;
  onShoot: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isTouch = scene.sys.game.device.input.touch;

    if (this.isTouch) {
      this.createTouchUI();
    }
  }

  private createTouchUI() {
    const { width, height } = this.scene.scale;

    // Shoot button (bottom right)
    const btnSize = 64;
    const btnX = width - btnSize - 20;
    const btnY = height - btnSize - 20;

    const circle = this.scene.add.circle(0, 0, btnSize / 2, 0xff88ff, 0.5);
    const icon = this.scene.add.text(0, 0, "●", {
      fontSize: "28px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.shootBtn = this.scene.add.container(btnX, btnY, [circle, icon]);
    this.shootBtn.setScrollFactor(0).setDepth(200);
    this.shootBtn.setSize(btnSize, btnSize);
    this.shootBtn.setInteractive();

    this.shootBtn.on("pointerdown", () => {
      circle.setFillStyle(0xff88ff, 0.8);
      this.onShoot?.();
    });
    this.shootBtn.on("pointerup", () => {
      circle.setFillStyle(0xff88ff, 0.5);
    });

    // Fly zone indicator (bottom left, subtle)
    const flyHint = this.scene.add.text(20, height - 40, "TAP PARA VOAR", {
      fontSize: "10px",
      color: "rgba(255,255,255,0.3)",
    }).setScrollFactor(0).setDepth(200);

    // Fade out hint after 5s
    this.scene.tweens.add({
      targets: flyHint,
      alpha: 0,
      delay: 5000,
      duration: 1000,
    });
  }

  destroy() {
    this.shootBtn?.destroy();
  }
}
