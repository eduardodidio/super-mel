import type { LevelDataV2, EntityData, BlockCell, BlockType } from "@super-mel/shared";
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

// ---------------------------------------------------------------------------
// generateTestLevelV2 — LevelDataV2 equivalent of the test level
// ---------------------------------------------------------------------------

/**
 * Generate the test level as a LevelDataV2.
 * This is the v2-format equivalent of generateTestLevel().
 * Can be used with levelToSceneObjects() for unified rendering.
 */
export function generateTestLevelV2(): LevelDataV2 {
  const width = 80; // 5 chunks x 16 blocks
  const height = 20;

  // Build grid as 2D array (grid[row][col] where row=y, col=x)
  const grid: BlockCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: BlockCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ type: "empty" as BlockType, x, y });
    }
    grid.push(row);
  }

  // Helper to set a block in the grid
  // The grid uses world coordinates directly: grid[y][x]
  // We offset y by 5 so that y=-2 maps to row 3, y=0 maps to row 5, etc.
  const Y_OFFSET = 5;
  const setBlock = (type: Exclude<BlockType, "empty">, x: number, y: number) => {
    const gridY = y + Y_OFFSET;
    if (gridY >= 0 && gridY < height && x >= 0 && x < width) {
      grid[gridY][x] = { type, x, y };
    }
  };

  const entities: EntityData[] = [];

  // --- Spawn ---
  entities.push({ type: "spawn", x: 2, y: 1 });

  // --- Chunk 0 (x: 0-15): Spawn & Basics ---
  // Ground
  for (let x = 0; x <= 15; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  // Wood stack at x=1
  setBlock("wood", 1, 1);
  setBlock("wood", 1, 2);
  // Item block
  setBlock("item_block", 10, 3);
  // Coins
  entities.push({ type: "coin", x: 4, y: 2 });
  entities.push({ type: "coin", x: 6, y: 2 });
  entities.push({ type: "coin", x: 8, y: 2 });
  // Heart
  entities.push({ type: "heart", x: 12, y: 2 });

  // --- Chunk 1 (x: 16-31): Platforms & Gaps ---
  for (let x = 16; x <= 19; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  for (let x = 24; x <= 31; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  // Brick platform
  for (let x = 17; x <= 20; x++) setBlock("brick", x, 3);
  // Stone platform
  for (let x = 25; x <= 28; x++) setBlock("stone", x, 6);
  // Item blocks
  setBlock("item_block", 20, 6);
  setBlock("item_block", 22, 6);
  // Coins arc
  entities.push({ type: "coin", x: 19, y: 3 });
  entities.push({ type: "coin", x: 20, y: 4 });
  entities.push({ type: "coin", x: 21, y: 5 });
  entities.push({ type: "coin", x: 22, y: 4 });
  entities.push({ type: "coin", x: 23, y: 3 });
  // Heart on high platform
  entities.push({ type: "heart", x: 26, y: 7 });

  // --- Chunk 2 (x: 32-47): Destructibles & Combat ---
  for (let x = 32; x <= 47; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  // Wood wall
  setBlock("wood", 36, 1);
  setBlock("wood", 36, 2);
  setBlock("wood", 36, 3);
  // Glass wall
  setBlock("glass", 41, 1);
  setBlock("glass", 41, 2);
  // Iron wall
  setBlock("iron", 45, 1);
  setBlock("iron", 45, 2);
  setBlock("iron", 45, 3);
  // Coins behind wood
  entities.push({ type: "coin", x: 37, y: 1 });
  entities.push({ type: "coin", x: 37, y: 2 });
  entities.push({ type: "coin", x: 38, y: 1 });
  // Item block
  setBlock("item_block", 39, 4);

  // --- Chunk 3 (x: 48-63): Advanced Platforming ---
  for (let x = 48; x <= 49; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  for (let x = 53; x <= 56; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  for (let x = 61; x <= 63; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  // Stepping stones
  setBlock("stone", 51, 2);
  setBlock("stone", 53, 4);
  setBlock("stone", 59, 3);
  // Item blocks elevated
  setBlock("item_block", 54, 10);
  setBlock("item_block", 55, 10);
  setBlock("item_block", 56, 10);
  // High platform
  for (let x = 54; x <= 56; x++) setBlock("stone", x, 8);
  // Coins
  entities.push({ type: "coin", x: 50, y: 3 });
  entities.push({ type: "coin", x: 51, y: 4 });
  entities.push({ type: "coin", x: 52, y: 3 });
  entities.push({ type: "coin", x: 58, y: 4 });
  entities.push({ type: "coin", x: 59, y: 5 });
  entities.push({ type: "coin", x: 60, y: 4 });
  // Lava
  for (let x = 57; x <= 60; x++) setBlock("lava", x, -4);

  // --- Chunk 4 (x: 64-79): Victory Run ---
  for (let x = 64; x <= 79; x++) {
    setBlock("dirt", x, 0);
    setBlock("stone", x, -1);
    setBlock("stone", x, -2);
  }
  // 10 coins
  for (let x = 65; x <= 74; x++) {
    entities.push({ type: "coin", x, y: 2 });
  }
  // Hearts
  entities.push({ type: "heart", x: 68, y: 2 });
  entities.push({ type: "heart", x: 72, y: 2 });
  // Finish item blocks
  setBlock("item_block", 76, 1);
  setBlock("item_block", 76, 2);
  setBlock("item_block", 76, 3);
  // Goal
  entities.push({ type: "goal", x: 78, y: 1 });

  return {
    version: 2,
    grid,
    width,
    height,
    entities,
  };
}
