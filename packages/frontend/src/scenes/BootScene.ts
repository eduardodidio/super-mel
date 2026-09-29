import Phaser from "phaser";
import { generateBlockTextures } from "../systems/BlockTextures";
import { generatePlaceholderSprites } from "../systems/PlayerSprites";
import { generateParallaxTextures } from "../systems/ParallaxBackground";
import { generateUITextures } from "../systems/UITextures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    const { width, height } = this.scale;

    const bar = this.add.rectangle(width / 2, height / 2 + 40, 300, 20, 0x333333);
    const fill = this.add.rectangle(width / 2 - 148, height / 2 + 40, 0, 16, 0xffcc00);
    fill.setOrigin(0, 0.5);

    this.load.on("progress", (value: number) => {
      fill.width = 296 * value;
    });

    this.add
      .text(width / 2, height / 2 - 20, "Carregando Super Mel...", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }

  create() {
    generateBlockTextures(this);
    generatePlaceholderSprites(this);
    generateParallaxTextures(this);
    generateUITextures(this);

    this.scene.start("MenuScene");
  }
}
