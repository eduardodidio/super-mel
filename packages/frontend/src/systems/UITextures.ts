import Phaser from "phaser";

export function generateUITextures(scene: Phaser.Scene) {
  // Heart full
  const fullTex = scene.textures.createCanvas("hud-heart-full", 24, 24)!;
  const fullCtx = fullTex.getContext();
  drawHeart(fullCtx, "#ff2244", "#ff6688");
  fullTex.refresh();

  // Heart empty
  const emptyTex = scene.textures.createCanvas("hud-heart-empty", 24, 24)!;
  const emptyCtx = emptyTex.getContext();
  drawHeart(emptyCtx, "#444444", "#666666");
  emptyTex.refresh();
}

function drawHeart(ctx: CanvasRenderingContext2D, fill: string, highlight: string) {
  const s = 3; // pixel scale
  ctx.fillStyle = fill;

  // Heart shape in pixels
  const rows = [
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
  ];

  rows.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v) ctx.fillRect(x * s, y * s + 1, s, s);
    });
  });

  // Highlight
  ctx.fillStyle = highlight;
  ctx.fillRect(1 * s, 1 * s + 1, s, s);
  ctx.fillRect(5 * s, 1 * s + 1, s, s);
}
