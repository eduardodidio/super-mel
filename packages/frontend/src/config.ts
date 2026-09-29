import Phaser from "phaser";
import { GAME_CONFIG } from "@super-mel/shared";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { EditorScene } from "./scenes/EditorScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { LeaderboardScene } from "./scenes/LeaderboardScene";

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
    scene: [BootScene, MenuScene, GameScene, GameOverScene, EditorScene, LevelSelectScene, LeaderboardScene],
    backgroundColor: "#1a1a2e",
  };
}
