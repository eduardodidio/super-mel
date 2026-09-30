export interface Player {
  id: string;
  name: string;
  isGuest: boolean;
  createdAt: Date;
}

export interface Score {
  id: string;
  playerId: string;
  distance: number;
  levelId: string | null;
  createdAt: Date;
}

// --- Entity System ---

export type EntityType =
  | "coin"
  | "heart"
  | "goal"
  | "checkpoint"
  | "spawn"
  | "item_block_content"
  | "sign"
  | "bone"
  | "enemy";

export interface EntityData {
  type: EntityType;
  x: number;
  y: number;
  props?: Record<string, unknown>;
}

export interface Mission {
  id: string;
  description: string;
  condition: Record<string, unknown>;
}

// --- LevelData v1 (original, no version field) ---

/** @deprecated Use LevelDataV2 */
export interface LevelDataV1 {
  grid: BlockCell[][];
  width: number;
  height: number;
  spawnPoint: { x: number; y: number };
}

// Backward compat alias -- existing code importing LevelData still compiles
export type LevelData = LevelDataV1;

// --- LevelData v2 ---

export interface LevelDataV2 {
  version: 2;
  grid: BlockCell[][];
  width: number;
  height: number;
  entities: EntityData[];
  theme?: BackgroundTheme;
  missions?: Mission[];
}

// Union for migration input
export type LevelDataAny = LevelDataV1 | LevelDataV2;

// --- Entity type constants for palette ---

export const ENTITY_TYPES: readonly EntityType[] = [
  "coin",
  "heart",
  "goal",
  "checkpoint",
  "spawn",
  "item_block_content",
  "sign",
  "bone",
  "enemy",
] as const;

export interface BlockCell {
  type: BlockType;
  x: number;
  y: number;
}

export type BlockType =
  | "empty"
  | "stone"
  | "sand"
  | "wood"
  | "iron"
  | "dirt"
  | "brick"
  | "glass"
  | "leaf"
  | "water"
  | "lava"
  | "item_block";

export interface Level {
  id: string;
  creatorId: string;
  name: string;
  data: LevelData | LevelDataV2; // May be v1 or v2 in storage
  background: BackgroundTheme;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BackgroundTheme =
  | "forest"
  | "desert"
  | "night"
  | "space"
  | "ocean";

export interface Power {
  id: string;
  name: string;
  description: string;
  unlockCondition: string;
  type: PowerType;
}

export type PowerType =
  | "basic"
  | "water"
  | "fire"
  | "ice"
  | "light"
  | "infinity";

export const BLOCK_PROPERTIES: Record<
  Exclude<BlockType, "empty">,
  { solid: boolean; destructible: boolean; dangerous: boolean; platform: boolean }
> = {
  stone: { solid: true, destructible: false, dangerous: false, platform: false },
  sand: { solid: true, destructible: false, dangerous: false, platform: false },
  wood: { solid: true, destructible: true, dangerous: false, platform: false },
  iron: { solid: true, destructible: false, dangerous: false, platform: false },
  dirt: { solid: true, destructible: false, dangerous: false, platform: false },
  brick: { solid: true, destructible: false, dangerous: false, platform: false },
  glass: { solid: true, destructible: true, dangerous: false, platform: false },
  leaf: { solid: false, destructible: false, dangerous: false, platform: true },
  water: { solid: false, destructible: false, dangerous: false, platform: false },
  lava: { solid: false, destructible: false, dangerous: true, platform: false },
  item_block: { solid: true, destructible: false, dangerous: false, platform: false },
};

export const GAME_CONFIG = {
  // Physics (platformer)
  gravity: 30,
  moveSpeed: 6,
  moveAccel: 25,
  friction: 12,
  jumpForce: 10,
  jumpHoldForce: 6,
  maxJumpHoldTime: 0.25,
  coyoteTime: 0.1,

  // Combat
  projectileSpeed: 15,
  projectileCooldownMs: 300,

  // Life
  maxHearts: 3,
  startHearts: 3,
  invincibilityMs: 1500,

  // Chunks
  chunkWidth: 16,
  viewDistance: 4,
} as const;
