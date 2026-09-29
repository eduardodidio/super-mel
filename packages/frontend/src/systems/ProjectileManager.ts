import Phaser from "phaser";
import { GAME_CONFIG } from "@super-mel/shared";

export class ProjectileManager {
  scene: Phaser.Scene;
  group: Phaser.Physics.Arcade.Group;
  private cooldown = false;
  private cooldownMs = 300;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      allowGravity: false,
    });
  }

  fire(x: number, y: number) {
    if (this.cooldown) return;

    const proj = this.group.create(x, y, "projectile") as Phaser.Physics.Arcade.Sprite;
    proj.setVelocityX(GAME_CONFIG.projectileSpeed + GAME_CONFIG.scrollSpeed);
    proj.setDepth(8);
    proj.setSize(10, 10);

    // Glow effect
    this.scene.tweens.add({
      targets: proj,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    this.cooldown = true;
    this.scene.time.delayedCall(this.cooldownMs, () => {
      this.cooldown = false;
    });
  }

  update() {
    // Remove off-screen projectiles
    this.group.children.each((child) => {
      const proj = child as Phaser.Physics.Arcade.Sprite;
      if (proj.x > this.scene.cameras.main.scrollX + this.scene.scale.width + 100) {
        proj.destroy();
      }
      return true;
    });
  }
}
