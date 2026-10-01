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

// --- Custom Assets (Galeria do Rafa) ---

export interface CustomAsset {
  id: string;           // unique ID within the level, e.g. "custom-1695000000"
  name: string;         // user-given name, max 20 chars
  dataUri: string;      // base64 data URI, e.g. "data:image/png;base64,..."
}

// --- Enemy subtypes ---
// Enemy entities use EntityData with type: "enemy" and props: { subtype: EnemySubtype }
export type EnemySubtype = "vacuum" | "pigeon" | "bee";

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
  | "enemy"
  | "custom_block_asset"
  | "spring"
  | "moving_platform"
  | "spikes";

export interface EntityData {
  type: EntityType;
  x: number;
  y: number;
  props?: Record<string, unknown>;
}

// --- Mission System ---

export type MissionConditionType =
  | "collect_coins"       // params: { count: number }
  | "no_damage"           // params: {} -- complete run/level without taking damage
  | "find_bone"           // params: {} -- collect at least one bone entity
  | "time_limit"          // params: { seconds: number } -- finish under N seconds
  | "break_blocks"        // params: { blockType?: BlockType; count: number }
  | "fly_duration"        // params: { seconds: number } -- cumulative fly time in run
  | "reach_distance"      // params: { meters: number }
  | "no_damage_distance"  // params: { meters: number } -- reach distance without any damage
  | "stomp_enemies"        // params: { count: number }
  | "double_jump_count";  // params: { count: number }

export interface MissionCondition {
  type: MissionConditionType;
  params: Record<string, unknown>;
}

export interface Mission {
  id: string;
  description: string;
  condition: MissionCondition;
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
  customAssets?: CustomAsset[];  // max 10 per level (Galeria do Rafa)
  difficulty?: number;  // 1-10, used for prefab chunk selection in infinite mode
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
  "custom_block_asset",
  "spring",
  "moving_platform",
  "spikes",
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
  | "item_block"
  | "custom";

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
  { solid: boolean; destructible: boolean; dangerous: boolean; platform: boolean; diggable: boolean }
> = {
  stone:      { solid: true,  destructible: false, dangerous: false, platform: false, diggable: false },
  sand:       { solid: true,  destructible: false, dangerous: false, platform: false, diggable: true  },
  wood:       { solid: true,  destructible: true,  dangerous: false, platform: false, diggable: false },
  iron:       { solid: true,  destructible: false, dangerous: false, platform: false, diggable: false },
  dirt:       { solid: true,  destructible: false, dangerous: false, platform: false, diggable: true  },
  brick:      { solid: true,  destructible: false, dangerous: false, platform: false, diggable: false },
  glass:      { solid: true,  destructible: true,  dangerous: false, platform: false, diggable: false },
  leaf:       { solid: false, destructible: false, dangerous: false, platform: true,  diggable: false },
  water:      { solid: false, destructible: false, dangerous: false, platform: false, diggable: false },
  lava:       { solid: false, destructible: false, dangerous: true,  platform: false, diggable: false },
  item_block: { solid: true,  destructible: false, dangerous: false, platform: false, diggable: false },
  custom:     { solid: true,  destructible: false, dangerous: false, platform: false, diggable: false },
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
