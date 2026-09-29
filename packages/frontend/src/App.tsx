import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { GAME_CONFIG } from "@super-mel/shared";

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, "Super Mel", {
        fontSize: "48px",
        color: "#ffcc00",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, "A Yorkshire Micro Heroina", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 80, "[ Clique para comecar ]", {
        fontSize: "16px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      // Future: transition to MenuScene
      console.log("Game starting...", GAME_CONFIG);
    });
  }
}

export function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
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
      scene: [BootScene],
      backgroundColor: "#1a1a2e",
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
