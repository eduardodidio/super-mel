import type { Chunk, BlockData, HeartData, CoinData } from "./ChunkGenerator";

// ---------------------------------------------------------------------------
// Helper: lay ground (dirt surface + 2 layers of stone underground)
// ---------------------------------------------------------------------------
function groundRow(
  startX: number,
  endX: number,
  surfaceY: number = 0,
): BlockData[] {
  const blocks: BlockData[] = [];
  for (let x = startX; x <= endX; x++) {
    blocks.push({ type: "dirt", x, y: surfaceY, z: 0, isBackground: false });
    blocks.push({ type: "stone", x, y: surfaceY - 1, z: 0, isBackground: false });
    blocks.push({ type: "stone", x, y: surfaceY - 2, z: 0, isBackground: false });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Helper: single gameplay block
// ---------------------------------------------------------------------------
function block(
  type: BlockData["type"],
  x: number,
  y: number,
  z: number = 0,
  isBackground: boolean = false,
): BlockData {
  return { type, x, y, z, isBackground };
}

// ---------------------------------------------------------------------------
// generateTestLevel — 5 hand-crafted chunks (80 blocks wide)
// ---------------------------------------------------------------------------
export function generateTestLevel(): Chunk[] {
  return [
    generateChunk0(),
    generateChunk1(),
    generateChunk2(),
    generateChunk3(),
    generateChunk4(),
  ];
}

// ---------------------------------------------------------------------------
// Chunk 0 (x: 0-15) — "Spawn & Basics"
// ---------------------------------------------------------------------------
function generateChunk0(): Chunk {
  const blocks: BlockData[] = [];
  const hearts: HeartData[] = [];
  const coins: CoinData[] = [];

  // Flat ground x=0..15
  blocks.push(...groundRow(0, 15));

  // Visual landmark: wood stack at x=1
  blocks.push(block("wood", 1, 1));
  blocks.push(block("wood", 1, 2));

  // Item block tutorial: visible above the path
  blocks.push(block("item_block", 10, 3));

  // 3 coins
  coins.push({ x: 4, y: 2 });
  coins.push({ x: 6, y: 2 });
  coins.push({ x: 8, y: 2 });

  // 1 heart
  hearts.push({ x: 12, y: 2 });

  // --- Background decorations ---
  blocks.push(block("stone", 3, -1, -3, true));
  blocks.push(block("dirt", 3, 0, -3, true));
  blocks.push(block("stone", 7, -1, -3, true));
  blocks.push(block("dirt", 7, 0, -3, true));
  blocks.push(block("wood", 10, 0, -3, true));
  blocks.push(block("wood", 10, 1, -3, true));
  blocks.push(block("wood", 10, 2, -3, true));

  return { startX: 0, blocks, hearts, coins };
}

// ---------------------------------------------------------------------------
// Chunk 1 (x: 16-31) — "Platforms & Gaps"
// ---------------------------------------------------------------------------
function generateChunk1(): Chunk {
  const blocks: BlockData[] = [];
  const hearts: HeartData[] = [];
  const coins: CoinData[] = [];

  // Ground from x=16-19 and x=24-31 (gap at x=20-23)
  blocks.push(...groundRow(16, 19));
  blocks.push(...groundRow(24, 31));

  // Brick platform at y=3 from x=17 to x=20
  for (let x = 17; x <= 20; x++) {
    blocks.push(block("brick", x, 3));
  }

  // Stone platform at y=6 from x=25 to x=28 (fly test)
  for (let x = 25; x <= 28; x++) {
    blocks.push(block("stone", x, 6));
  }

  // Item blocks over gap (reward exploration)
  blocks.push(block("item_block", 20, 6));
  blocks.push(block("item_block", 22, 6));

  // 5 coins in arc over gap
  coins.push({ x: 19, y: 3 });
  coins.push({ x: 20, y: 4 });
  coins.push({ x: 21, y: 5 });
  coins.push({ x: 22, y: 4 });
  coins.push({ x: 23, y: 3 });

  // 1 heart on high platform
  hearts.push({ x: 26, y: 7 });

  return { startX: 16, blocks, hearts, coins };
}

// ---------------------------------------------------------------------------
// Chunk 2 (x: 32-47) — "Destructibles & Combat"
// ---------------------------------------------------------------------------
function generateChunk2(): Chunk {
  const blocks: BlockData[] = [];
  const hearts: HeartData[] = [];
  const coins: CoinData[] = [];

  // Flat ground x=32-47
  blocks.push(...groundRow(32, 47));

  // Wood wall at x=36: 3 blocks high (destructible)
  blocks.push(block("wood", 36, 1));
  blocks.push(block("wood", 36, 2));
  blocks.push(block("wood", 36, 3));

  // Glass wall at x=41: 2 blocks high (destructible)
  blocks.push(block("glass", 41, 1));
  blocks.push(block("glass", 41, 2));

  // Iron wall at x=45: 3 blocks high (indestructible — must jump)
  blocks.push(block("iron", 45, 1));
  blocks.push(block("iron", 45, 2));
  blocks.push(block("iron", 45, 3));

  // Coins behind wood wall
  coins.push({ x: 37, y: 1 });
  coins.push({ x: 37, y: 2 });
  coins.push({ x: 38, y: 1 });

  // 1 item_block at x=39, y=4
  blocks.push(block("item_block", 39, 4));

  return { startX: 32, blocks, hearts, coins };
}

// ---------------------------------------------------------------------------
// Chunk 3 (x: 48-63) — "Advanced Platforming"
// ---------------------------------------------------------------------------
function generateChunk3(): Chunk {
  const blocks: BlockData[] = [];
  const hearts: HeartData[] = [];
  const coins: CoinData[] = [];

  // Ground segments with gaps
  // Ground x=48-49
  blocks.push(...groundRow(48, 49));
  // Gap x=50-52
  // Ground x=53-56
  blocks.push(...groundRow(53, 56));
  // Gap x=57-60
  // Ground x=61-63
  blocks.push(...groundRow(61, 63));

  // Stepping stones
  blocks.push(block("stone", 51, 2));
  blocks.push(block("stone", 53, 4));
  blocks.push(block("stone", 59, 3));

  // Item blocks on elevated platforms
  blocks.push(block("item_block", 54, 10));
  blocks.push(block("item_block", 55, 10));
  blocks.push(block("item_block", 56, 10));

  // High stone platform at y=8 from x=54 to x=56 (fly practice)
  for (let x = 54; x <= 56; x++) {
    blocks.push(block("stone", x, 8));
  }

  // Coins
  coins.push({ x: 50, y: 3 });
  coins.push({ x: 51, y: 4 });
  coins.push({ x: 52, y: 3 });
  coins.push({ x: 58, y: 4 });
  coins.push({ x: 59, y: 5 });
  coins.push({ x: 60, y: 4 });

  // Lava at bottom of second gap: x=57-60, y=-4
  for (let x = 57; x <= 60; x++) {
    blocks.push(block("lava", x, -4));
  }

  return { startX: 48, blocks, hearts, coins };
}

// ---------------------------------------------------------------------------
// Chunk 4 (x: 64-79) — "Victory Run"
// ---------------------------------------------------------------------------
function generateChunk4(): Chunk {
  const blocks: BlockData[] = [];
  const hearts: HeartData[] = [];
  const coins: CoinData[] = [];

  // Flat ground x=64-79
  blocks.push(...groundRow(64, 79));

  // 10 coins at y=2 from x=65 to x=74
  for (let x = 65; x <= 74; x++) {
    coins.push({ x, y: 2 });
  }

  // 2 hearts
  hearts.push({ x: 68, y: 2 });
  hearts.push({ x: 72, y: 2 });

  // Finish line: 3 item_blocks stacked at x=76
  blocks.push(block("item_block", 76, 1));
  blocks.push(block("item_block", 76, 2));
  blocks.push(block("item_block", 76, 3));

  // --- Background decorations ---
  blocks.push(block("stone", 66, -1, -3, true));
  blocks.push(block("dirt", 66, 0, -3, true));
  blocks.push(block("stone", 70, -1, -3, true));
  blocks.push(block("dirt", 70, 0, -3, true));
  blocks.push(block("wood", 74, 0, -3, true));
  blocks.push(block("wood", 74, 1, -3, true));
  blocks.push(block("wood", 74, 2, -3, true));

  return { startX: 64, blocks, hearts, coins };
}
