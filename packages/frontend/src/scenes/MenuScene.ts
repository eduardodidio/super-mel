import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    const { width, height } = this.scale;

    // Title
    this.add
      .text(width / 2, 80, "SUPER MEL", {
        fontSize: "56px",
        color: "#ffcc00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 140, "A Yorkshire Micro Heroina", {
        fontSize: "18px",
        color: "#cccccc",
      })
      .setOrigin(0.5);

    // Animated Mel placeholder
    const mel = this.add.sprite(width / 2, 230, "mel-idle");
    if (this.anims.exists("mel-fly")) {
      mel.play("mel-fly");
    }
    // Float animation
    this.tweens.add({
      targets: mel,
      y: 220,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Player name
    const playerName = localStorage.getItem("supermel_player_name") || "Jogador";
    this.add.text(width / 2, 290, `Ola, ${playerName}!`, {
      fontSize: "14px",
      color: "#aaaaaa",
    }).setOrigin(0.5);

    // Menu buttons
    const buttons = [
      { label: "JOGAR", color: "#4a8a4a", hover: "#6aaa6a", action: () => this.scene.start("LevelSelectScene") },
      { label: "CRIAR FASE", color: "#4a4a8a", hover: "#6a6aaa", action: () => this.scene.start("EditorScene") },
      { label: "LEADERBOARD", color: "#4a4a8a", hover: "#6a6aaa", action: () => this.scene.start("LeaderboardScene") },
      { label: "SAIR", color: "#6a4a4a", hover: "#8a6a6a", action: () => this.logout() },
    ];

    buttons.forEach((btn, i) => {
      const y = 340 + i * 55;
      const text = this.add
        .text(width / 2, y, btn.label, {
          fontSize: "22px",
          color: "#ffffff",
          backgroundColor: btn.color,
          padding: { x: 30, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      text.on("pointerover", () => text.setStyle({ backgroundColor: btn.hover }));
      text.on("pointerout", () => text.setStyle({ backgroundColor: btn.color }));
      text.on("pointerdown", btn.action);
    });

    // Version
    this.add.text(width - 10, height - 15, "v0.1.0", {
      fontSize: "10px",
      color: "#444466",
    }).setOrigin(1, 1);
  }

  private logout() {
    localStorage.removeItem("supermel_token");
    localStorage.removeItem("supermel_player_id");
    localStorage.removeItem("supermel_player_name");
    // Reload to show auth screen
    window.location.reload();
  }
}
