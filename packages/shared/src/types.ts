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

export interface LevelData {
  grid: BlockCell[][];
  width: number;
  height: number;
  spawnPoint: { x: number; y: number };
}

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
  data: LevelData;
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
  sand: { solid: false, destructible: false, dangerous: false, platform: false },
  wood: { solid: true, destructible: true, dangerous: false, platform: false },
  iron: { solid: true, destructible: false, dangerous: false, platform: false },
  dirt: { solid: false, destructible: false, dangerous: false, platform: false },
  brick: { solid: true, destructible: false, dangerous: false, platform: false },
  glass: { solid: true, destructible: true, dangerous: false, platform: false },
  leaf: { solid: false, destructible: false, dangerous: false, platform: true },
  water: { solid: false, destructible: false, dangerous: false, platform: false },
  lava: { solid: false, destructible: false, dangerous: true, platform: false },
  item_block: { solid: true, destructible: true, dangerous: false, platform: false },
};

export const GAME_CONFIG = {
  tileSize: 32,
  gravity: 800,
  flapForce: -350,
  scrollSpeed: 120,
  maxHearts: 3,
  startHearts: 3,
  projectileSpeed: 400,
  invincibilityMs: 1500,
} as const;
