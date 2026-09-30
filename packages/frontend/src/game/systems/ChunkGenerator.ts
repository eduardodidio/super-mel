import type { BackgroundTheme, BlockType, EnemySubtype } from "@super-mel/shared";
import { getBlockPalette, type BlockPalette } from "./BiomeManager";
import { selectPrefab, repositionPrefab, type PrefabEntry } from "./PrefabLibrary";

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

export interface CoinData {
  x: number;
  y: number;
}

export interface EnemyChunkData {
  subtype: EnemySubtype;
  x: number;
  y: number;
}

export interface Chunk {
  startX: number;
  blocks: BlockData[];
  hearts: HeartData[];
  coins: CoinData[];
  enemies: EnemyChunkData[];
}

const CHUNK_WIDTH = 16;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function dailySeed(dateStr: string): number {
  // dateStr format: "YYYYMMDD" e.g. "20260930"
  // Simple numeric hash: sum of (charCode * position * prime)
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

export function getTodaySeed(): number {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return dailySeed(dateStr);
}

// Default forest palette (used by the original generateChunk for backward compat)
const DEFAULT_PALETTE: BlockPalette = {
  surface: "dirt",
  underground: "stone",
  platform: "brick",
  wall: "stone",
  hazard: "lava",
  background: "stone",
  tree: "wood",
  canopy: "leaf",
};

/**
 * Internal chunk generation with configurable block palette.
 * Both generateChunk and generateChunkBiome delegate to this.
 */
function generateChunkInternal(
  chunkIndex: number,
  baseSeed: number,
  palette: BlockPalette,
  hasTrees: boolean,
): Chunk {
  const startX = chunkIndex * CHUNK_WIDTH;
  const rand = seededRandom(chunkIndex * 7919 + 31 + baseSeed);
  const blocks: BlockData[] = [];
  const hearts: HeartData[] = [];
  const coins: CoinData[] = [];

  const difficulty = Math.min(chunkIndex / 25, 1);

  // --- GROUND LAYER ---
  const heights: number[] = [];
  for (let x = 0; x < CHUNK_WIDTH; x++) {
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

    blocks.push({ type: palette.surface, x: worldX, y: surfaceY, z: 0, isBackground: false });
    blocks.push({ type: palette.underground, x: worldX, y: surfaceY - 1, z: 0, isBackground: false });
    blocks.push({ type: palette.underground, x: worldX, y: surfaceY - 2, z: 0, isBackground: false });
  }

  // Spawn area
  if (chunkIndex <= 0) {
    for (let x = 2; x < CHUNK_WIDTH - 2; x++) {
      if (rand() < 0.25) {
        const groundY = heights[x];
        coins.push({ x: startX + x, y: groundY + 1 });
        if (rand() < 0.4) {
          coins.push({ x: startX + x, y: groundY + 2 });
        }
      }
    }
    return { startX, blocks, hearts, coins, enemies: [] };
  }

  // --- PLATFORMS ---
  for (let x = 1; x < CHUNK_WIDTH - 2; x += 4 + Math.floor(rand() * 3)) {
    if (rand() < 0.35 + difficulty * 0.15) {
      const platY = heights[x] + 1 + Math.floor(rand() * 3);
      const platLen = 2 + Math.floor(rand() * 3);
      // 60% palette platform, 40% original random variety
      const platType: Exclude<BlockType, "empty"> = rand() < 0.6
        ? palette.platform
        : rand() < 0.5 ? "wood" : "stone";

      for (let px = 0; px < platLen && x + px < CHUNK_WIDTH; px++) {
        blocks.push({
          type: platType,
          x: startX + x + px,
          y: platY,
          z: 0,
          isBackground: false,
        });
      }

      if (rand() < 0.3) {
        blocks.push({
          type: "item_block",
          x: startX + x + Math.floor(platLen / 2),
          y: platY + 2,
          z: 0,
          isBackground: false,
        });
      }

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
      // 60% palette wall, 40% original random
      const wallType: Exclude<BlockType, "empty"> = rand() < 0.6
        ? palette.wall
        : rand() < 0.5 ? "iron" : "brick";
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

      if (rand() < 0.5 && x + 3 < CHUNK_WIDTH) {
        for (let s = 0; s < Math.min(wallHeight, 3); s++) {
          blocks.push({
            type: palette.underground,
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

  // --- HAZARD PITS ---
  if (chunkIndex > 3) {
    for (let x = 3; x < CHUNK_WIDTH - 3; x += 6 + Math.floor(rand() * 4)) {
      if (rand() < 0.1 * difficulty) {
        const hazardLen = 2 + Math.floor(rand() * 2);
        const hazardY = Math.min(...heights.slice(x, x + hazardLen).map(h => h)) - 2;
        for (let lx = 0; lx < hazardLen && x + lx < CHUNK_WIDTH; lx++) {
          blocks.push({ type: palette.hazard, x: startX + x + lx, y: hazardY, z: 0, isBackground: false });
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

      blocks.push({ type: palette.background, x: worldX, y: bgY, z: bgZ, isBackground: true });
      blocks.push({ type: palette.surface, x: worldX, y: bgY + 1, z: bgZ, isBackground: true });

      if (hasTrees && rand() < 0.3) {
        for (let ty = 0; ty < 3; ty++) {
          blocks.push({ type: palette.tree, x: worldX, y: bgY + 2 + ty, z: bgZ, isBackground: true });
        }
        for (let cx = -1; cx <= 1; cx++) {
          for (let cy = 0; cy <= 1; cy++) {
            blocks.push({ type: palette.canopy, x: worldX + cx, y: bgY + 5 + cy, z: bgZ, isBackground: true });
          }
        }
      }
    }
  }

  // --- COINS ---
  const occupied = new Set<string>();
  for (const b of blocks) {
    if (!b.isBackground) {
      occupied.add(`${b.x},${b.y}`);
    }
  }

  for (let x = 0; x < CHUNK_WIDTH; x++) {
    if (gapPositions.has(x)) continue;
    if (rand() < 0.3) {
      const groundY = heights[x];
      const count = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < count; i++) {
        const cx = startX + x;
        const cy = groundY + 2 + i;
        if (!occupied.has(`${cx},${cy}`)) {
          coins.push({ x: cx, y: cy });
        }
      }
    }
  }

  // Arcs of coins over gaps
  const gapRuns: { start: number; length: number }[] = [];
  {
    let runStart = -1;
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      if (gapPositions.has(x)) {
        if (runStart === -1) runStart = x;
      } else {
        if (runStart !== -1) {
          gapRuns.push({ start: runStart, length: x - runStart });
          runStart = -1;
        }
      }
    }
    if (runStart !== -1) {
      gapRuns.push({ start: runStart, length: CHUNK_WIDTH - runStart });
    }
  }

  for (const gap of gapRuns) {
    const arcCount = Math.min(3 + Math.floor(rand() * 3), gap.length + 2);
    const leftX = Math.max(gap.start - 1, 0);
    const rightX = Math.min(gap.start + gap.length, CHUNK_WIDTH - 1);
    const edgeY = Math.max(heights[leftX] || 0, heights[rightX] || 0);
    const arcPeak = edgeY + 3 + Math.floor(rand() * 2);

    for (let i = 0; i < arcCount; i++) {
      const t = arcCount > 1 ? i / (arcCount - 1) : 0.5;
      const coinLocalX = (gap.start - 0.5) + t * (gap.length + 1);
      const coinX = startX + Math.round(coinLocalX);
      const drop = arcPeak - edgeY;
      const coinY = Math.round(arcPeak - 4 * (t - 0.5) * (t - 0.5) * drop);
      if (!occupied.has(`${coinX},${coinY}`)) {
        coins.push({ x: coinX, y: coinY });
      }
    }
  }

  if (coins.length < 5) {
    for (let x = 0; x < CHUNK_WIDTH && coins.length < 5; x++) {
      if (gapPositions.has(x)) continue;
      const cx = startX + x;
      const cy = heights[x] + 2;
      if (!occupied.has(`${cx},${cy}`)) {
        coins.push({ x: cx, y: cy });
      }
    }
  }

  if (coins.length > 15) {
    coins.length = 15;
  }

  // --- ENEMIES ---
  const enemies: EnemyChunkData[] = [];

  // No enemies in safe zone (chunks 0-2)
  if (chunkIndex >= 3) {
    // --- VACUUM (Aspirador-robo) ---
    // Appears from chunk 3+ (difficulty >= 0.12)
    for (let x = 2; x < CHUNK_WIDTH - 2; x += 5 + Math.floor(rand() * 4)) {
      if (gapPositions.has(x)) continue;
      const vacuumChance = 0.08 + difficulty * 0.12; // 8%-20%
      if (rand() < vacuumChance) {
        enemies.push({
          subtype: "vacuum",
          x: startX + x,
          y: (heights[x] || 0) - 1, // on top of ground (surface is heights[x]-2, so -2+1 = -1)
        });
      }
    }

    // --- PIGEON (Pombo) ---
    // Appears from chunk 8+ (difficulty >= 0.32)
    if (difficulty > 0.3) {
      for (let x = 3; x < CHUNK_WIDTH - 3; x += 7 + Math.floor(rand() * 5)) {
        const pigeonChance = 0.05 + (difficulty - 0.3) * 0.15;
        if (rand() < pigeonChance) {
          const flyY = (heights[x] || 0) + 3 + Math.floor(rand() * 3); // 3-5 above ground
          enemies.push({
            subtype: "pigeon",
            x: startX + x,
            y: flyY,
          });
        }
      }
    }

    // --- BEE (Abelha) ---
    // Appears from chunk 15+ (difficulty >= 0.6)
    if (difficulty > 0.6) {
      for (let x = 4; x < CHUNK_WIDTH - 4; x += 10 + Math.floor(rand() * 6)) {
        const beeChance = 0.04 + (difficulty - 0.6) * 0.1;
        if (rand() < beeChance) {
          const beeY = (heights[x] || 0) + 2 + Math.floor(rand() * 2);
          enemies.push({
            subtype: "bee",
            x: startX + x,
            y: beeY,
          });
        }
      }
    }

    // Cap enemies per chunk (max 3)
    if (enemies.length > 3) enemies.length = 3;
  }

  return { startX, blocks, hearts, coins, enemies };
}

/**
 * Original chunk generator (backward-compatible). Uses the default forest palette.
 */
export function generateChunk(chunkIndex: number, baseSeed: number = 0): Chunk {
  return generateChunkInternal(chunkIndex, baseSeed, DEFAULT_PALETTE, true);
}

/**
 * Biome-aware chunk generator. Uses the biome's block palette and
 * optionally injects a prefab chunk from the pool.
 */
export function generateChunkBiome(
  chunkIndex: number,
  baseSeed: number,
  biome: BackgroundTheme,
  prefabPool: PrefabEntry[],
): Chunk {
  // Prefab injection: after chunk 10, every 5th chunk has 50% chance of being a prefab
  if (chunkIndex >= 10 && chunkIndex % 5 === 0 && prefabPool.length > 0) {
    const prefabRand = seededRandom(chunkIndex * 7919 + baseSeed);
    if (prefabRand() < 0.5) {
      const selected = selectPrefab(prefabPool, chunkIndex * 7919 + baseSeed);
      if (selected) {
        return repositionPrefab(selected, chunkIndex * CHUNK_WIDTH);
      }
    }
  }

  const palette = getBlockPalette(biome);
  const hasTrees = biome !== "desert" && biome !== "space";
  return generateChunkInternal(chunkIndex, baseSeed, palette, hasTrees);
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
