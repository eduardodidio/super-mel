import Phaser from "phaser";
import { BackgroundTheme, GAME_CONFIG } from "@super-mel/shared";

const THEMES: Record<BackgroundTheme, { sky: string; far: string; mid: string }> = {
  forest: { sky: "#87CEEB", far: "#2d5a2d", mid: "#3a7a3a" },
  desert: { sky: "#f4a460", far: "#c2b280", mid: "#deb887" },
  night:  { sky: "#0a0a2a", far: "#1a1a4a", mid: "#2a2a5a" },
  space:  { sky: "#000011", far: "#0a0a33", mid: "#111155" },
  ocean:  { sky: "#4488cc", far: "#225599", mid: "#3366aa" },
};

export function generateParallaxTextures(scene: Phaser.Scene) {
  const w = 800;
  const h = 600;

  for (const [theme, colors] of Object.entries(THEMES)) {
    // Sky layer
    const skyTex = scene.textures.createCanvas(`bg-${theme}-sky`, w, h)!;
    const skyCtx = skyTex.getContext();
    const grad = skyCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors.sky);
    grad.addColorStop(1, lighten(colors.sky, -20));
    skyCtx.fillStyle = grad;
    skyCtx.fillRect(0, 0, w, h);

    // Stars for night/space
    if (theme === "night" || theme === "space") {
      skyCtx.fillStyle = "#ffffff";
      for (let i = 0; i < 60; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h * 0.7;
        const size = Math.random() < 0.1 ? 2 : 1;
        skyCtx.fillRect(sx, sy, size, size);
      }
    }
    skyTex.refresh();

    // Far mountains/hills
    const farTex = scene.textures.createCanvas(`bg-${theme}-far`, w, h)!;
    const farCtx = farTex.getContext();
    farCtx.clearRect(0, 0, w, h);
    farCtx.fillStyle = colors.far;
    farCtx.beginPath();
    farCtx.moveTo(0, h);
    for (let x = 0; x <= w; x += 40) {
      const y = h - 120 - Math.sin(x * 0.008) * 60 - Math.sin(x * 0.015) * 30;
      farCtx.lineTo(x, y);
    }
    farCtx.lineTo(w, h);
    farCtx.fill();
    farTex.refresh();

    // Mid hills/trees
    const midTex = scene.textures.createCanvas(`bg-${theme}-mid`, w, h)!;
    const midCtx = midTex.getContext();
    midCtx.clearRect(0, 0, w, h);
    midCtx.fillStyle = colors.mid;
    midCtx.beginPath();
    midCtx.moveTo(0, h);
    for (let x = 0; x <= w; x += 30) {
      const y = h - 80 - Math.sin(x * 0.012 + 1) * 40 - Math.sin(x * 0.025) * 20;
      midCtx.lineTo(x, y);
    }
    midCtx.lineTo(w, h);
    midCtx.fill();
    midTex.refresh();
  }
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export class ParallaxBackground {
  private skyImg: Phaser.GameObjects.TileSprite;
  private farImg: Phaser.GameObjects.TileSprite;
  private midImg: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene, forcedTheme?: BackgroundTheme) {
    const { width, height } = scene.scale;
    const themes: BackgroundTheme[] = ["forest", "desert", "night", "space", "ocean"];
    const theme = forcedTheme || themes[Math.floor(Math.random() * themes.length)];

    this.skyImg = scene.add.tileSprite(0, 0, width, height, `bg-${theme}-sky`);
    this.skyImg.setOrigin(0, 0).setScrollFactor(0).setDepth(-3);

    this.farImg = scene.add.tileSprite(0, 0, width, height, `bg-${theme}-far`);
    this.farImg.setOrigin(0, 0).setScrollFactor(0).setDepth(-2);

    this.midImg = scene.add.tileSprite(0, 0, width, height, `bg-${theme}-mid`);
    this.midImg.setOrigin(0, 0).setScrollFactor(0).setDepth(-1);
  }

  update(scrollX: number) {
    this.skyImg.tilePositionX = scrollX * 0.05;
    this.farImg.tilePositionX = scrollX * 0.2;
    this.midImg.tilePositionX = scrollX * 0.5;
  }
}
