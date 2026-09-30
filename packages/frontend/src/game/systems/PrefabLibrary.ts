/**
 * PrefabLibrary -- registry of hand-crafted prefab chunks.
 * Pure TypeScript module. No React dependencies.
 */
import type { BackgroundTheme } from "@super-mel/shared";
import type { Chunk, BlockData, HeartData, CoinData, EnemyChunkData } from "./ChunkGenerator";
import { generateTestLevel } from "./TestLevelData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrefabEntry {
  /** Unique identifier for this prefab */
  id: string;
  /** Difficulty rating 1-10. Used to filter prefabs by chunk difficulty range. */
  difficulty: number;
  /** The chunk data. startX is 0-based (position-independent). */
  chunk: Chunk;
  /** Optional biome affinity. If set, this prefab is preferred in matching biomes. */
  biomeAffinity?: BackgroundTheme;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a chunk so that startX = 0 and all block/coin/heart X
 * coordinates are relative to that origin.
 */
function normalizeChunkStartX(chunk: Chunk): Chunk {
  const offset = chunk.startX;
  if (offset === 0) return chunk;

  const blocks: BlockData[] = chunk.blocks.map((b) => ({
    ...b,
    x: b.x - offset,
  }));
  const coins: CoinData[] = chunk.coins.map((c) => ({
    x: c.x - offset,
    y: c.y,
  }));
  const hearts: HeartData[] = chunk.hearts.map((h) => ({
    x: h.x - offset,
    y: h.y,
  }));

  const enemies: EnemyChunkData[] = (chunk.enemies ?? []).map((e) => ({
    ...e,
    x: e.x - offset,
  }));

  return { startX: 0, blocks, coins, hearts, enemies };
}

/**
 * Build the FASE TESTE chunks as prefab entries.
 */
function buildTestLevelPrefabs(): PrefabEntry[] {
  const testChunks = generateTestLevel();
  return testChunks.map((chunk, i) => ({
    id: `test-chunk-${i}`,
    difficulty: i + 1, // chunk 0 = diff 1, chunk 4 = diff 5
    chunk: normalizeChunkStartX(chunk),
  }));
}

// ---------------------------------------------------------------------------
// Seeded random (matches ChunkGenerator)
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PREFAB_REGISTRY: PrefabEntry[] = buildTestLevelPrefabs();

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Get prefab candidates matching a difficulty range.
 * If `biome` is provided, matching biomeAffinity entries are sorted first.
 */
export function getPrefabCandidates(
  minDifficulty: number,
  maxDifficulty: number,
  biome?: BackgroundTheme,
): PrefabEntry[] {
  const filtered = PREFAB_REGISTRY.filter(
    (e) => e.difficulty >= minDifficulty && e.difficulty <= maxDifficulty,
  );

  if (biome) {
    filtered.sort((a, b) => {
      const aMatch = a.biomeAffinity === biome ? 0 : 1;
      const bMatch = b.biomeAffinity === biome ? 0 : 1;
      return aMatch - bMatch;
    });
  }

  return filtered;
}

/**
 * Select a specific prefab by seeded random from candidates.
 */
export function selectPrefab(
  candidates: PrefabEntry[],
  seed: number,
): PrefabEntry | null {
  if (candidates.length === 0) return null;
  const rand = seededRandom(seed);
  const index = Math.floor(rand() * candidates.length);
  return candidates[index];
}

/**
 * Reposition a prefab chunk to a target startX (deep clone).
 */
export function repositionPrefab(
  entry: PrefabEntry,
  targetStartX: number,
): Chunk {
  const src = entry.chunk;
  const blocks: BlockData[] = src.blocks.map((b) => ({
    ...b,
    x: b.x + targetStartX,
  }));
  const coins: CoinData[] = src.coins.map((c) => ({
    x: c.x + targetStartX,
    y: c.y,
  }));
  const hearts: HeartData[] = src.hearts.map((h) => ({
    x: h.x + targetStartX,
    y: h.y,
  }));

  const enemies: EnemyChunkData[] = (src.enemies ?? []).map((e) => ({
    ...e,
    x: e.x + targetStartX,
  }));

  return { startX: targetStartX, blocks, coins, hearts, enemies };
}

/**
 * Map a chunk index to a difficulty range for prefab selection.
 * Difficulty increases from 1 to 10 over the first 50 chunks, then caps.
 */
export function chunkDifficultyRange(chunkIndex: number): {
  min: number;
  max: number;
} {
  const progress = Math.min(chunkIndex / 50, 1);
  const center = 1 + progress * 9; // 1 to 10
  const range = 2;
  return {
    min: Math.max(1, Math.floor(center - range)),
    max: Math.min(10, Math.ceil(center + range)),
  };
}
