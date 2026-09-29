import type { BlockType } from "@super-mel/shared";

export interface BlockData {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
  isBackground: boolean;
}

export interface Chunk {
  startX: number;
  blocks: BlockData[];
}

const CHUNK_WIDTH = 16;
const BLOCK_TYPES: Exclude<BlockType, "empty">[] = [
  "stone", "dirt", "wood", "brick", "iron", "sand", "glass", "leaf", "lava", "water", "item_block",
];

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

  // Ground layer
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    const worldX = startX + x;

    // Ground blocks (y = -2 to -3)
    blocks.push({ type: "dirt", x: worldX, y: -2, z: 0, isBackground: false });
    blocks.push({ type: "stone", x: worldX, y: -3, z: 0, isBackground: false });

    // Grass top on some
    if (rand() > 0.3) {
      blocks.push({ type: "dirt", x: worldX, y: -1, z: 0, isBackground: false });
    }
  }

  // Skip first 2 chunks (spawn area clear)
  if (chunkIndex <= 1) return { startX, blocks };

  // Obstacles - columns and gaps
  const difficulty = Math.min(chunkIndex / 20, 1); // ramps up over 20 chunks

  for (let x = 0; x < CHUNK_WIDTH; x += 3 + Math.floor(rand() * 3)) {
    const worldX = startX + x;

    if (rand() < 0.3 + difficulty * 0.3) {
      // Vertical column
      const height = 2 + Math.floor(rand() * (3 + difficulty * 3));
      const baseY = -1;
      const colType = pickBlockType(rand);

      for (let y = 0; y < height; y++) {
        blocks.push({ type: colType, x: worldX, y: baseY + y, z: 0, isBackground: false });
      }
    }

    if (rand() < 0.2 + difficulty * 0.2) {
      // Floating platform
      const platY = 2 + Math.floor(rand() * 4);
      const platLen = 2 + Math.floor(rand() * 3);
      const platType = rand() < 0.3 ? "wood" : rand() < 0.5 ? "brick" : "stone";

      for (let px = 0; px < platLen; px++) {
        blocks.push({ type: platType, x: worldX + px, y: platY, z: 0, isBackground: false });
      }

      // Item block on platform
      if (rand() < 0.3) {
        blocks.push({ type: "item_block", x: worldX + Math.floor(platLen / 2), y: platY + 2, z: 0, isBackground: false });
      }
    }

    // Lava pit
    if (rand() < 0.1 * difficulty) {
      for (let lx = 0; lx < 2; lx++) {
        blocks.push({ type: "lava", x: worldX + lx, y: -2, z: 0, isBackground: false });
      }
    }
  }

  // Background decorative blocks (Z = -3 to -5)
  for (let x = 0; x < CHUNK_WIDTH; x += 2) {
    if (rand() < 0.4) {
      const worldX = startX + x;
      const bgY = -2 + Math.floor(rand() * 5);
      const bgZ = -3 - Math.floor(rand() * 3);
      const bgType: Exclude<BlockType, "empty"> = rand() < 0.5 ? "stone" : rand() < 0.7 ? "leaf" : "dirt";
      blocks.push({ type: bgType, x: worldX, y: bgY, z: bgZ, isBackground: true });

      // Stack some bg blocks for trees
      if (bgType === "leaf" && rand() < 0.5) {
        blocks.push({ type: "wood", x: worldX, y: bgY - 1, z: bgZ, isBackground: true });
        blocks.push({ type: "wood", x: worldX, y: bgY - 2, z: bgZ, isBackground: true });
        blocks.push({ type: "leaf", x: worldX, y: bgY + 1, z: bgZ, isBackground: true });
        if (rand() < 0.5) {
          blocks.push({ type: "leaf", x: worldX + 1, y: bgY, z: bgZ, isBackground: true });
          blocks.push({ type: "leaf", x: worldX - 1, y: bgY, z: bgZ, isBackground: true });
        }
      }
    }
  }

  return { startX, blocks };
}

function pickBlockType(rand: () => number): Exclude<BlockType, "empty"> {
  const r = rand();
  if (r < 0.25) return "stone";
  if (r < 0.45) return "wood";
  if (r < 0.6) return "brick";
  if (r < 0.7) return "iron";
  if (r < 0.8) return "glass";
  if (r < 0.85) return "sand";
  if (r < 0.9) return "leaf";
  return "dirt";
}

export function getVisibleChunkIndices(cameraX: number, viewDistance: number = 3): number[] {
  const currentChunk = Math.floor(cameraX / CHUNK_WIDTH);
  const indices: number[] = [];
  for (let i = currentChunk - 1; i <= currentChunk + viewDistance; i++) {
    if (i >= 0) indices.push(i);
  }
  return indices;
}

export { CHUNK_WIDTH };
