import Phaser from "phaser";
import { GAME_CONFIG } from "@super-mel/shared";

export class HUD {
  private scene: Phaser.Scene;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private distanceText: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // Hearts
    for (let i = 0; i < GAME_CONFIG.maxHearts; i++) {
      const heart = scene.add.image(30 + i * 30, 30, "hud-heart-full");
      this.heartIcons.push(heart);
      this.container.add(heart);
    }

    // Distance
    this.distanceText = scene.add.text(scene.scale.width - 20, 20, "0m", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(1, 0);
    this.container.add(this.distanceText);

    // Controls hint (fades out after 3s)
    const hint = scene.add.text(scene.scale.width / 2, scene.scale.height - 30,
      "Esquerda = Voar | Direita = Atirar | Space/Z", {
        fontSize: "12px",
        color: "#aaaaaa",
        stroke: "#000000",
        strokeThickness: 2,
      }).setOrigin(0.5);
    this.container.add(hint);
    scene.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 3000,
      duration: 1000,
    });
  }

  update(hearts: number, distance: number) {
    // Update hearts
    for (let i = 0; i < this.heartIcons.length; i++) {
      this.heartIcons[i].setTexture(i < hearts ? "hud-heart-full" : "hud-heart-empty");
    }

    // Update distance
    this.distanceText.setText(`${distance}m`);
  }
}
