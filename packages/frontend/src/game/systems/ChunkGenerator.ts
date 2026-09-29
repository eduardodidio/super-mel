import type { BlockType } from "@super-mel/shared";

export interface BlockData {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
  isBackground: boolean;
}

export interface HeartData {
  x: number;
  y: number;
}

export interface Chunk {
  startX: number;
  blocks: BlockData[];
  hearts: HeartData[];
}

const CHUNK_WIDTH = 16;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateChunk(chunkIndex: number): Chunk {
  const startX = chunkIndex * CHUNK_WIDTH;
  const rand = seededRandom(chunkIndex * 7919 + 31);
  const blocks: BlockData[] = [];
  const hearts: HeartData[] = [];

  const difficulty = Math.min(chunkIndex / 25, 1);

  // --- GROUND LAYER ---
  // Generate terrain height map for this chunk
  const heights: number[] = [];
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    // Base height with some variation
    const noise = Math.sin((startX + x) * 0.15) * 1.5 + Math.sin((startX + x) * 0.05) * 2;
    heights.push(Math.round(noise));
  }

  // Gaps in ground (platformer style)
  const gapPositions = new Set<number>();
  if (chunkIndex > 1) {
    for (let x = 3; x < CHUNK_WIDTH - 2; x++) {
      if (rand() < 0.08 + difficulty * 0.06) {
        const gapWidth = 2 + Math.floor(rand() * (1 + difficulty * 2));
        for (let g = 0; g < gapWidth && x + g < CHUNK_WIDTH; g++) {
          gapPositions.add(x + g);
        }
        x += gapWidth + 2;
      }
    }
  }

  // Place ground blocks
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    if (gapPositions.has(x)) continue;
    const worldX = startX + x;
    const surfaceY = heights[x] - 2;

    // Surface block
    blocks.push({ type: "dirt", x: worldX, y: surfaceY, z: 0, isBackground: false });
    // Underground
    blocks.push({ type: "stone", x: worldX, y: surfaceY - 1, z: 0, isBackground: false });
    blocks.push({ type: "stone", x: worldX, y: surfaceY - 2, z: 0, isBackground: false });
  }

  // Spawn area clear
  if (chunkIndex <= 0) return { startX, blocks, hearts };

  // --- PLATFORMS ---
  for (let x = 1; x < CHUNK_WIDTH - 2; x += 4 + Math.floor(rand() * 3)) {
    if (rand() < 0.35 + difficulty * 0.15) {
      const platY = heights[x] + 1 + Math.floor(rand() * 3);
      const platLen = 2 + Math.floor(rand() * 3);
      const platType: Exclude<BlockType, "empty"> = rand() < 0.4 ? "brick" : rand() < 0.7 ? "wood" : "stone";

      for (let px = 0; px < platLen && x + px < CHUNK_WIDTH; px++) {
        blocks.push({
          type: platType,
          x: startX + x + px,
          y: platY,
          z: 0,
          isBackground: false,
        });
      }

      // Item block on platform
      if (rand() < 0.3) {
        blocks.push({
          type: "item_block",
          x: startX + x + Math.floor(platLen / 2),
          y: platY + 2,
          z: 0,
          isBackground: false,
        });
      }

      // Heart on platform occasionally
      if (rand() < 0.15) {
        hearts.push({
          x: startX + x + Math.floor(platLen / 2),
          y: platY + 1.5,
        });
      }
    }
  }

  // --- OBSTACLES: walls and stairs ---
  for (let x = 2; x < CHUNK_WIDTH - 2; x += 5 + Math.floor(rand() * 4)) {
    if (rand() < 0.25 + difficulty * 0.15) {
      const wallHeight = 2 + Math.floor(rand() * (2 + difficulty * 2));
      const wallType: Exclude<BlockType, "empty"> = rand() < 0.3 ? "iron" : rand() < 0.6 ? "stone" : "brick";
      const baseY = (heights[x] || 0) - 1;

      for (let y = 0; y < wallHeight; y++) {
        blocks.push({
          type: wallType,
          x: startX + x,
          y: baseY + y,
          z: 0,
          isBackground: false,
        });
      }

      // Staircase next to wall
      if (rand() < 0.5 && x + 3 < CHUNK_WIDTH) {
        for (let s = 0; s < Math.min(wallHeight, 3); s++) {
          blocks.push({
            type: "stone",
            x: startX + x + 1 + s,
            y: baseY + s,
            z: 0,
            isBackground: false,
          });
        }
      }
    }
  }

  // --- DESTRUCTIBLE BLOCKS ---
  for (let x = 0; x < CHUNK_WIDTH; x += 3 + Math.floor(rand() * 3)) {
    if (rand() < 0.2) {
      const worldX = startX + x;
      const dY = (heights[x] || 0);
      const dType: Exclude<BlockType, "empty"> = rand() < 0.4 ? "wood" : rand() < 0.7 ? "glass" : "leaf";
      blocks.push({ type: dType, x: worldX, y: dY, z: 0, isBackground: false });
      if (rand() < 0.4) {
        blocks.push({ type: dType, x: worldX, y: dY + 1, z: 0, isBackground: false });
      }
    }
  }

  // --- LAVA PITS ---
  if (chunkIndex > 3) {
    for (let x = 3; x < CHUNK_WIDTH - 3; x += 6 + Math.floor(rand() * 4)) {
      if (rand() < 0.1 * difficulty) {
        const lavaLen = 2 + Math.floor(rand() * 2);
        const lavaY = Math.min(...heights.slice(x, x + lavaLen).map(h => h)) - 2;
        for (let lx = 0; lx < lavaLen && x + lx < CHUNK_WIDTH; lx++) {
          blocks.push({ type: "lava", x: startX + x + lx, y: lavaY, z: 0, isBackground: false });
        }
      }
    }
  }

  // --- BACKGROUND DECORATION (Z depth) ---
  for (let x = 0; x < CHUNK_WIDTH; x += 2) {
    if (rand() < 0.3) {
      const worldX = startX + x;
      const bgZ = -3 - Math.floor(rand() * 3);
      const bgY = (heights[x] || 0) - 2;

      // Background terrain
      blocks.push({ type: "stone", x: worldX, y: bgY, z: bgZ, isBackground: true });
      blocks.push({ type: "dirt", x: worldX, y: bgY + 1, z: bgZ, isBackground: true });

      // Trees in background
      if (rand() < 0.3) {
        for (let ty = 0; ty < 3; ty++) {
          blocks.push({ type: "wood", x: worldX, y: bgY + 2 + ty, z: bgZ, isBackground: true });
        }
        // Canopy
        for (let cx = -1; cx <= 1; cx++) {
          for (let cy = 0; cy <= 1; cy++) {
            blocks.push({ type: "leaf", x: worldX + cx, y: bgY + 5 + cy, z: bgZ, isBackground: true });
          }
        }
      }
    }
  }

  return { startX, blocks, hearts };
}

export function getVisibleChunkIndices(cameraX: number, viewDistance: number = 3): number[] {
  const currentChunk = Math.floor(cameraX / CHUNK_WIDTH);
  const indices: number[] = [];
  for (let i = currentChunk - 2; i <= currentChunk + viewDistance; i++) {
    if (i >= 0) indices.push(i);
  }
  return indices;
}

export { CHUNK_WIDTH };
