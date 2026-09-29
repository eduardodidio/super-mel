import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 100, "SUPER MEL", {
        fontSize: "56px",
        color: "#ffcc00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 160, "A Yorkshire Micro Heroina", {
        fontSize: "18px",
        color: "#cccccc",
      })
      .setOrigin(0.5);

    // Animated Mel placeholder on menu
    const mel = this.add.sprite(width / 2, 280, "mel-idle");
    if (this.anims.exists("mel-fly")) {
      mel.play("mel-fly");
    }

    const playBtn = this.createButton(width / 2, 400, "JOGAR", () => {
      this.scene.start("GameScene");
    });

    const editorBtn = this.createButton(width / 2, 460, "CRIAR FASE", () => {
      // Future: EditorScene
      console.log("Editor coming soon...");
    });

    const leaderBtn = this.createButton(width / 2, 520, "LEADERBOARD", () => {
      // Future: LeaderboardScene
      console.log("Leaderboard coming soon...");
    });
  }

  private createButton(x: number, y: number, label: string, callback: () => void) {
    const btn = this.add
      .text(x, y, label, {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#4a4a8a",
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setStyle({ backgroundColor: "#6a6aaa" }));
    btn.on("pointerout", () => btn.setStyle({ backgroundColor: "#4a4a8a" }));
    btn.on("pointerdown", callback);

    return btn;
  }
}
