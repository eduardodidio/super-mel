import Phaser from "phaser";
import { GAME_CONFIG } from "@super-mel/shared";

const SIZE = GAME_CONFIG.tileSize;

/**
 * Generates placeholder sprites for Super Mel.
 * These will be replaced by real sprites later.
 * Mel is drawn as a cute pixelated dog shape.
 */
export function generatePlaceholderSprites(scene: Phaser.Scene) {
  // Mel idle - simple dog shape
  const idle = scene.textures.createCanvas("mel-idle", SIZE, SIZE)!;
  const ctxI = idle.getContext();
  drawMelFrame(ctxI, "#ffaa44", false);
  idle.refresh();

  // Mel fly frames for animation
  for (let i = 0; i < 4; i++) {
    const key = `mel-fly-${i}`;
    const tex = scene.textures.createCanvas(key, SIZE, SIZE)!;
    const ctx = tex.getContext();
    const wingUp = i < 2;
    drawMelFrame(ctx, "#ffaa44", wingUp);
    tex.refresh();
  }

  // Create fly animation
  scene.anims.create({
    key: "mel-fly",
    frames: [
      { key: "mel-fly-0" },
      { key: "mel-fly-1" },
      { key: "mel-fly-2" },
      { key: "mel-fly-3" },
    ],
    frameRate: 8,
    repeat: -1,
  });

  // Mel die
  const die = scene.textures.createCanvas("mel-die", SIZE, SIZE)!;
  const ctxD = die.getContext();
  drawMelFrame(ctxD, "#ff4444", false);
  ctxD.fillStyle = "#000000";
  ctxD.fillRect(10, 8, 4, 4); // X eyes
  ctxD.fillRect(18, 8, 4, 4);
  die.refresh();

  scene.anims.create({
    key: "mel-die",
    frames: [{ key: "mel-die" }],
    frameRate: 1,
  });
}

function drawMelFrame(ctx: CanvasRenderingContext2D, bodyColor: string, wingUp: boolean) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(6, 10, 20, 14);

  // Head
  ctx.fillRect(22, 4, 10, 14);

  // Ears
  ctx.fillStyle = "#cc8833";
  ctx.fillRect(24, 0, 4, 6);
  ctx.fillRect(30, 0, 4, 6);

  // Eyes
  ctx.fillStyle = "#000000";
  ctx.fillRect(26, 8, 3, 3);

  // Nose
  ctx.fillStyle = "#333333";
  ctx.fillRect(30, 12, 2, 2);

  // Tail
  ctx.fillStyle = bodyColor;
  ctx.fillRect(2, 8, 6, 4);

  // Legs
  ctx.fillStyle = "#cc8833";
  ctx.fillRect(8, 24, 4, 6);
  ctx.fillRect(20, 24, 4, 6);

  // Wings (cape)
  ctx.fillStyle = "#ff6666";
  if (wingUp) {
    ctx.fillRect(10, 2, 12, 6);
  } else {
    ctx.fillRect(10, 14, 12, 6);
  }
}
