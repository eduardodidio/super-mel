import Phaser from "phaser";
import { GAME_CONFIG } from "@super-mel/shared";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: GAME_CONFIG.gravity },
        debug: false,
      },
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    backgroundColor: "#1a1a2e",
  };
}
