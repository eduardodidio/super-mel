/**
 * BiomeManager -- pure-logic module that maps chunk index to biome.
 * No React dependencies. No side effects.
 */
import type { BackgroundTheme, BlockType } from "@super-mel/shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BIOME_SEQUENCE: BackgroundTheme[] = [
  "forest",
  "desert",
  "night",
  "space",
  "ocean",
];

export const CHUNKS_PER_BIOME = 10;
export const TRANSITION_CHUNKS = 2;

// ---------------------------------------------------------------------------
// BiomeState
// ---------------------------------------------------------------------------

export interface BiomeState {
  /** Primary (current) biome */
  current: BackgroundTheme;
  /** Next biome (only set during transition zone, otherwise null) */
  next: BackgroundTheme | null;
  /** Interpolation factor 0.0-1.0 (0 = fully current, 1 = fully next). 0 when not transitioning. */
  transitionFactor: number;
  /** The biome cycle number (0-based, increments each time through the full sequence) */
  cycle: number;
}

// ---------------------------------------------------------------------------
// getBiomeForChunk
// ---------------------------------------------------------------------------

export function getBiomeForChunk(chunkIndex: number): BiomeState {
  const idx = Math.max(chunkIndex, 0);
  const biomeIndex =
    Math.floor(idx / CHUNKS_PER_BIOME) % BIOME_SEQUENCE.length;
  const positionInBiome = idx % CHUNKS_PER_BIOME;

  const current = BIOME_SEQUENCE[biomeIndex];
  const cycle = Math.floor(
    idx / (CHUNKS_PER_BIOME * BIOME_SEQUENCE.length),
  );

  const transitionStart = CHUNKS_PER_BIOME - TRANSITION_CHUNKS;

  if (positionInBiome >= transitionStart) {
    const next =
      BIOME_SEQUENCE[(biomeIndex + 1) % BIOME_SEQUENCE.length];
    const transitionFactor =
      (positionInBiome - transitionStart) / TRANSITION_CHUNKS;
    return { current, next, transitionFactor, cycle };
  }

  return { current, next: null, transitionFactor: 0, cycle };
}

// ---------------------------------------------------------------------------
// BlockPalette
// ---------------------------------------------------------------------------

export interface BlockPalette {
  surface: Exclude<BlockType, "empty">;
  underground: Exclude<BlockType, "empty">;
  platform: Exclude<BlockType, "empty">;
  wall: Exclude<BlockType, "empty">;
  hazard: Exclude<BlockType, "empty">;
  background: Exclude<BlockType, "empty">;
  tree: Exclude<BlockType, "empty">;
  canopy: Exclude<BlockType, "empty">;
}

const PALETTES: Record<BackgroundTheme, BlockPalette> = {
  forest: {
    surface: "dirt",
    underground: "stone",
    platform: "brick",
    wall: "stone",
    hazard: "lava",
    background: "stone",
    tree: "wood",
    canopy: "leaf",
  },
  desert: {
    surface: "sand",
    underground: "stone",
    platform: "sand",
    wall: "iron",
    hazard: "lava",
    background: "sand",
    tree: "sand",
    canopy: "sand",
  },
  night: {
    surface: "dirt",
    underground: "stone",
    platform: "brick",
    wall: "brick",
    hazard: "lava",
    background: "stone",
    tree: "wood",
    canopy: "leaf",
  },
  space: {
    surface: "iron",
    underground: "iron",
    platform: "glass",
    wall: "iron",
    hazard: "lava",
    background: "iron",
    tree: "iron",
    canopy: "glass",
  },
  ocean: {
    surface: "sand",
    underground: "stone",
    platform: "sand",
    wall: "stone",
    hazard: "water",
    background: "sand",
    tree: "wood",
    canopy: "leaf",
  },
};

export function getBlockPalette(biome: BackgroundTheme): BlockPalette {
  return PALETTES[biome];
}
