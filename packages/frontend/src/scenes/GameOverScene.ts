import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create(data: { distance: number }) {
    const { width, height } = this.scale;
    const distance = data.distance || 0;

    this.add
      .text(width / 2, height / 3 - 20, "GAME OVER", {
        fontSize: "48px",
        color: "#ff4444",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 3 + 50, `Distancia: ${distance} blocos`, {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Save score to API
    this.saveScore(distance);

    const retryBtn = this.add
      .text(width / 2, height / 2 + 40, "TENTAR DE NOVO", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#4a8a4a",
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retryBtn.on("pointerover", () => retryBtn.setStyle({ backgroundColor: "#6aaa6a" }));
    retryBtn.on("pointerout", () => retryBtn.setStyle({ backgroundColor: "#4a8a4a" }));
    retryBtn.on("pointerdown", () => this.scene.start("GameScene"));

    const menuBtn = this.add
      .text(width / 2, height / 2 + 100, "MENU", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#4a4a8a",
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on("pointerover", () => menuBtn.setStyle({ backgroundColor: "#6a6aaa" }));
    menuBtn.on("pointerout", () => menuBtn.setStyle({ backgroundColor: "#4a4a8a" }));
    menuBtn.on("pointerdown", () => this.scene.start("MenuScene"));
  }

  private async saveScore(distance: number) {
    try {
      const token = localStorage.getItem("supermel_token");
      const playerId = localStorage.getItem("supermel_player_id");
      if (!playerId) return;

      await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ playerId, distance }),
      });
    } catch {
      // Silent fail - score save is best-effort
    }
  }
}
