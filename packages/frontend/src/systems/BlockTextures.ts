import Phaser from "phaser";
import { BlockType, GAME_CONFIG } from "@super-mel/shared";

const SIZE = GAME_CONFIG.tileSize;

const BLOCK_COLORS: Record<Exclude<BlockType, "empty">, { main: string; detail: string; border: string }> = {
  stone:      { main: "#888888", detail: "#777777", border: "#666666" },
  sand:       { main: "#e8d68a", detail: "#d4c070", border: "#c4b060" },
  wood:       { main: "#8B5A2B", detail: "#7A4A1B", border: "#6A3A0B" },
  iron:       { main: "#c0c0c0", detail: "#b0b0b0", border: "#a0a0a0" },
  dirt:       { main: "#8B6914", detail: "#7A5804", border: "#6A4800" },
  brick:      { main: "#b84040", detail: "#a03030", border: "#882020" },
  glass:      { main: "#aaddee", detail: "#99ccdd", border: "#88bbcc" },
  leaf:       { main: "#44aa44", detail: "#339933", border: "#228822" },
  water:      { main: "#4488cc", detail: "#3377bb", border: "#2266aa" },
  lava:       { main: "#ff4400", detail: "#ee3300", border: "#cc2200" },
  item_block: { main: "#ffcc00", detail: "#eebb00", border: "#ddaa00" },
};

export function generateBlockTextures(scene: Phaser.Scene) {
  for (const [type, colors] of Object.entries(BLOCK_COLORS)) {
    const tex = scene.textures.createCanvas(`block-${type}`, SIZE, SIZE)!;
    const ctx = tex.getContext();
    drawMinecraftBlock(ctx, colors, type as BlockType);
    tex.refresh();
  }

  // Projectile texture
  const projTex = scene.textures.createCanvas("projectile", 12, 12)!;
  const projCtx = projTex.getContext();
  projCtx.fillStyle = "#ff88ff";
  projCtx.beginPath();
  projCtx.arc(6, 6, 5, 0, Math.PI * 2);
  projCtx.fill();
  projCtx.fillStyle = "#ffffff";
  projCtx.beginPath();
  projCtx.arc(6, 6, 2, 0, Math.PI * 2);
  projCtx.fill();
  projTex.refresh();

  // Heart item texture
  const heartTex = scene.textures.createCanvas("item-heart", 16, 16)!;
  const hCtx = heartTex.getContext();
  hCtx.fillStyle = "#ff4466";
  // Simple pixel heart
  const heartPixels = [
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
  ];
  heartPixels.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v) hCtx.fillRect(x * 2, y * 2 + 2, 2, 2);
    });
  });
  heartTex.refresh();
}

function drawMinecraftBlock(
  ctx: CanvasRenderingContext2D,
  colors: { main: string; detail: string; border: string },
  type: BlockType,
) {
  // Fill
  ctx.fillStyle = colors.main;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Border
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);

  // Noise/detail pattern (Minecraft-like texture)
  ctx.fillStyle = colors.detail;
  for (let i = 0; i < 12; i++) {
    const px = ((i * 7 + 3) % (SIZE - 4)) + 2;
    const py = ((i * 11 + 5) % (SIZE - 4)) + 2;
    ctx.fillRect(px, py, 2, 2);
  }

  // Type-specific details
  if (type === "wood") {
    // Wood grain lines
    ctx.strokeStyle = colors.detail;
    ctx.lineWidth = 1;
    for (let y = 4; y < SIZE; y += 6) {
      ctx.beginPath();
      ctx.moveTo(2, y);
      ctx.lineTo(SIZE - 2, y);
      ctx.stroke();
    }
  } else if (type === "brick") {
    // Brick pattern
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, SIZE / 2);
    ctx.lineTo(SIZE, SIZE / 2);
    ctx.moveTo(SIZE / 2, 0);
    ctx.lineTo(SIZE / 2, SIZE / 2);
    ctx.moveTo(SIZE / 4, SIZE / 2);
    ctx.lineTo(SIZE / 4, SIZE);
    ctx.moveTo(SIZE * 3 / 4, SIZE / 2);
    ctx.lineTo(SIZE * 3 / 4, SIZE);
    ctx.stroke();
  } else if (type === "glass") {
    // Glass shine
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(4, 4, 8, 8);
  } else if (type === "lava") {
    // Lava glow
    ctx.fillStyle = "#ffaa00";
    for (let i = 0; i < 6; i++) {
      const px = ((i * 5 + 2) % (SIZE - 6)) + 2;
      const py = ((i * 9 + 1) % (SIZE - 6)) + 2;
      ctx.fillRect(px, py, 4, 3);
    }
  } else if (type === "item_block") {
    // Question mark
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", SIZE / 2, SIZE / 2);
  } else if (type === "water") {
    // Water waves
    ctx.fillStyle = "rgba(100,200,255,0.4)";
    for (let x = 0; x < SIZE; x += 4) {
      ctx.fillRect(x, 2 + Math.sin(x * 0.5) * 2, 3, 2);
    }
  }
}
