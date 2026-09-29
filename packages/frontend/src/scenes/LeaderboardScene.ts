import Phaser from "phaser";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: "LeaderboardScene" });
  }

  async create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, 40, "LEADERBOARD", {
      fontSize: "36px",
      color: "#ffcc00",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Header
    this.add.text(60, 90, "#", { fontSize: "14px", color: "#888", fontStyle: "bold" });
    this.add.text(100, 90, "Jogador", { fontSize: "14px", color: "#888", fontStyle: "bold" });
    this.add.text(width - 80, 90, "Dist.", { fontSize: "14px", color: "#888", fontStyle: "bold" }).setOrigin(1, 0);

    // Separator
    this.add.rectangle(width / 2, 110, width - 80, 1, 0x4a4a8a);

    const loadingText = this.add.text(width / 2, 200, "Carregando...", {
      fontSize: "16px",
      color: "#666",
    }).setOrigin(0.5);

    // Fetch leaderboard
    let entries: any[] = [];
    try {
      const res = await fetch("/api/scores/leaderboard");
      if (res.ok) entries = await res.json();
    } catch {
      // offline
    }
    loadingText.destroy();

    const currentPlayer = localStorage.getItem("supermel_player_name") || "";

    if (entries.length === 0) {
      this.add.text(width / 2, 200, "Nenhum score ainda.\nJogue para aparecer aqui!", {
        fontSize: "16px",
        color: "#666",
        align: "center",
      }).setOrigin(0.5);
    } else {
      entries.slice(0, 15).forEach((entry, i) => {
        const y = 125 + i * 28;
        const isMe = entry.playerName === currentPlayer;
        const color = isMe ? "#ffcc00" : "#cccccc";
        const medals = ["", "", ""];

        const rankText = i < 3
          ? ["1st", "2nd", "3rd"][i]
          : `${i + 1}`;

        this.add.text(60, y, rankText, { fontSize: "13px", color: i < 3 ? "#ffcc00" : "#888" });
        this.add.text(100, y, entry.playerName, { fontSize: "13px", color });
        this.add.text(width - 80, y, `${entry.distance}m`, {
          fontSize: "13px",
          color,
          fontStyle: isMe ? "bold" : "normal",
        }).setOrigin(1, 0);

        if (isMe) {
          this.add.rectangle(width / 2, y + 7, width - 70, 24, 0x3a3a6a, 0.3).setDepth(-1);
        }
      });
    }

    // Back button
    const backBtn = this.add.text(width / 2, height - 40, "VOLTAR", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#4a4a8a",
      padding: { x: 24, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on("pointerover", () => backBtn.setStyle({ backgroundColor: "#6a6aaa" }));
    backBtn.on("pointerout", () => backBtn.setStyle({ backgroundColor: "#4a4a8a" }));
    backBtn.on("pointerdown", () => this.scene.start("MenuScene"));
  }
}
