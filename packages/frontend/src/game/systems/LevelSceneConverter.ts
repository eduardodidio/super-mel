import type { LevelDataV2, EntityData, BlockType } from "@super-mel/shared";
import type { BlockData, HeartData, CoinData, Chunk } from "./ChunkGenerator";

// -----------------------------------------------------------------------
// Output types
// -----------------------------------------------------------------------

export interface SceneObjects {
  /** All blocks from the grid (non-empty cells) */
  blocks: BlockData[];
  /** Coins extracted from entities */
  coins: CoinData[];
  /** Hearts extracted from entities */
  hearts: HeartData[];
  /** Spawn point (from "spawn" entity, defaults to {x:0, y:1}) */
  spawnPoint: { x: number; y: number };
  /** Goal position (from "goal" entity, or null if none) */
  goal: { x: number; y: number } | null;
  /** Checkpoints */
  checkpoints: { x: number; y: number }[];
  /** item_block content mapping: "x,y" -> content type */
  itemBlockContents: Map<string, string>;
  /** All remaining entities not handled above (signs, bones, enemies, etc.) */
  otherEntities: EntityData[];
}

// -----------------------------------------------------------------------
// Converter
// -----------------------------------------------------------------------

/**
 * Convert a LevelDataV2 into renderable scene objects.
 *
 * This is the SINGLE source of truth for interpreting level data.
 * Used by: editor preview, test level, campaign play, chunk-based rendering.
 */
export function levelToSceneObjects(level: LevelDataV2): SceneObjects {
  const blocks: BlockData[] = [];
  const coins: CoinData[] = [];
  const hearts: HeartData[] = [];
  let spawnPoint: { x: number; y: number } = { x: 0, y: 1 };
  let goal: { x: number; y: number } | null = null;
  const checkpoints: { x: number; y: number }[] = [];
  const itemBlockContents = new Map<string, string>();
  const otherEntities: EntityData[] = [];

  // --- Extract blocks from grid ---
  for (let row = 0; row < level.grid.length; row++) {
    for (let col = 0; col < (level.grid[row]?.length ?? 0); col++) {
      const cell = level.grid[row][col];
      if (cell && cell.type !== "empty") {
        blocks.push({
          type: cell.type as Exclude<BlockType, "empty">,
          x: cell.x,
          y: cell.y,
          z: 0,
          isBackground: false,
        });
      }
    }
  }

  // --- Process entities ---
  for (const entity of level.entities) {
    switch (entity.type) {
      case "coin":
        coins.push({ x: entity.x, y: entity.y });
        break;
      case "heart":
        hearts.push({ x: entity.x, y: entity.y });
        break;
      case "spawn":
        spawnPoint = { x: entity.x, y: entity.y };
        break;
      case "goal":
        goal = { x: entity.x, y: entity.y };
        break;
      case "checkpoint":
        checkpoints.push({ x: entity.x, y: entity.y });
        break;
      case "item_block_content":
        itemBlockContents.set(
          `${entity.x},${entity.y}`,
          (entity.props?.content as string) ?? "coin"
        );
        break;
      default:
        // sign, bone, enemy, or future types
        otherEntities.push(entity);
        break;
    }
  }

  return {
    blocks,
    coins,
    hearts,
    spawnPoint,
    goal,
    checkpoints,
    itemBlockContents,
    otherEntities,
  };
}

// -----------------------------------------------------------------------
// Helper: Convert SceneObjects to Chunk[] for ChunkRenderer compatibility
// -----------------------------------------------------------------------

/**
 * Wrap SceneObjects into a single Chunk for use with ChunkRenderer's
 * testChunks prop. This bridges the gap between LevelDataV2 and the
 * existing chunk-based rendering pipeline.
 */
export function sceneObjectsToChunks(scene: SceneObjects): Chunk[] {
  return [
    {
      startX: 0,
      blocks: scene.blocks,
      hearts: scene.hearts,
      coins: scene.coins,
    },
  ];
}
