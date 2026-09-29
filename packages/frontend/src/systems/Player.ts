import Phaser from "phaser";
import { GAME_CONFIG } from "@super-mel/shared";

export class Player {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  hearts: number;
  isInvincible = false;
  private invincibleTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.hearts = GAME_CONFIG.startHearts;

    this.sprite = scene.physics.add.sprite(x, y, "mel-idle");
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setBounce(0);
    this.sprite.setGravityY(0); // Uses scene gravity
    this.sprite.setSize(24, 24);
    this.sprite.setOffset(4, 4);
    this.sprite.setDepth(10);

    if (scene.anims.exists("mel-fly")) {
      this.sprite.play("mel-fly");
    }
  }

  flap() {
    this.sprite.setVelocityY(GAME_CONFIG.flapForce);

    // Tilt up when flapping
    this.scene.tweens.add({
      targets: this.sprite,
      angle: -20,
      duration: 150,
      ease: "Quad.easeOut",
    });
  }

  update(_time: number, _delta: number) {
    // Tilt down when falling
    if (this.sprite.body && this.sprite.body.velocity.y > 0) {
      const tilt = Math.min(this.sprite.body.velocity.y * 0.1, 60);
      this.sprite.angle = Phaser.Math.Linear(this.sprite.angle, tilt, 0.05);
    }

    // Blink when invincible
    if (this.isInvincible) {
      this.sprite.alpha = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0.4;
    }
  }

  takeDamage() {
    if (this.isInvincible) return;
    this.hearts = Math.max(0, this.hearts - 1);
    this.setInvincible();

    // Knockback
    this.sprite.setVelocityY(GAME_CONFIG.flapForce * 0.5);
    this.sprite.setVelocityX(-50);
  }

  heal() {
    this.hearts = Math.min(GAME_CONFIG.maxHearts, this.hearts + 1);
  }

  die() {
    this.sprite.setTint(0xff0000);
    this.sprite.setVelocityY(GAME_CONFIG.flapForce);
    this.sprite.setVelocityX(0);
    (this.sprite.body as Phaser.Physics.Arcade.Body).allowGravity = true;

    if (this.scene.anims.exists("mel-die")) {
      this.sprite.play("mel-die");
    }
  }

  private setInvincible() {
    this.isInvincible = true;
    this.invincibleTimer?.destroy();
    this.invincibleTimer = this.scene.time.delayedCall(
      GAME_CONFIG.invincibilityMs,
      () => {
        this.isInvincible = false;
        this.sprite.alpha = 1;
      },
    );
  }
}
