import Phaser from "phaser";

interface LevelEntry {
  id: string;
  name: string;
  creatorName: string;
  background: string;
}

export class LevelSelectScene extends Phaser.Scene {
  private levels: LevelEntry[] = [];

  constructor() {
    super({ key: "LevelSelectScene" });
  }

  async create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, 40, "SELECIONAR FASE", {
      fontSize: "32px",
      color: "#ffcc00",
      fontStyle: "bold",
      stroke: "#000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Infinite mode button
    const infiniteBtn = this.add.text(width / 2, 100, "MODO INFINITO (procedural)", {
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#4a8a4a",
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    infiniteBtn.on("pointerover", () => infiniteBtn.setStyle({ backgroundColor: "#6aaa6a" }));
    infiniteBtn.on("pointerout", () => infiniteBtn.setStyle({ backgroundColor: "#4a8a4a" }));
    infiniteBtn.on("pointerdown", () => this.scene.start("GameScene"));

    // Load levels from API
    const loadingText = this.add.text(width / 2, 180, "Carregando fases...", {
      fontSize: "14px",
      color: "#888888",
    }).setOrigin(0.5);

    try {
      const res = await fetch("/api/levels");
      if (res.ok) {
        this.levels = await res.json();
      }
    } catch {
      // offline
    }

    loadingText.destroy();

    if (this.levels.length === 0) {
      this.add.text(width / 2, 200, "Nenhuma fase criada ainda.\nUse o Editor para criar!", {
        fontSize: "14px",
        color: "#666666",
        align: "center",
      }).setOrigin(0.5);
    } else {
      this.levels.forEach((level, i) => {
        const y = 180 + i * 50;
        if (y > height - 80) return; // don't overflow

        const btn = this.add.text(width / 2, y, `${level.name}  (by ${level.creatorName})`, {
          fontSize: "16px",
          color: "#ffffff",
          backgroundColor: "#3a3a6a",
          padding: { x: 16, y: 6 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => btn.setStyle({ backgroundColor: "#5a5a8a" }));
        btn.on("pointerout", () => btn.setStyle({ backgroundColor: "#3a3a6a" }));
        btn.on("pointerdown", () => this.loadAndPlay(level.id));
      });
    }

    // Back button
    const backBtn = this.add.text(width / 2, height - 40, "VOLTAR", {
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#4a4a8a",
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on("pointerdown", () => this.scene.start("MenuScene"));
  }

  private async loadAndPlay(levelId: string) {
    try {
      const res = await fetch(`/api/levels/${levelId}`);
      if (res.ok) {
        const level = await res.json();
        this.scene.start("GameScene", {
          customLevel: level.data,
          background: level.background,
        });
      }
    } catch {
      // fallback to infinite
      this.scene.start("GameScene");
    }
  }
}
