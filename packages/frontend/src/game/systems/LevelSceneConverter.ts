import type { LevelDataV2, EntityData, BlockType, EnemySubtype, CustomAsset } from "@super-mel/shared";
import type { BlockData, HeartData, CoinData, Chunk } from "./ChunkGenerator";

// -----------------------------------------------------------------------
// Output types
// -----------------------------------------------------------------------

export interface SceneEnemyData {
  id: string;
  subtype: EnemySubtype;
  x: number;
  y: number;
}

export interface SceneSpringData {
  x: number;
  y: number;
  bounceForce: number;
}

export interface SceneMovingPlatformData {
  x: number;
  y: number;
  direction: "horizontal" | "vertical";
  speed: number;
  range: number;
}

export interface SceneSpikesData {
  x: number;
  y: number;
  facing: "up" | "down" | "left" | "right";
}

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
  /** Enemies extracted from entities */
  enemies: SceneEnemyData[];
  /** Bone collectibles extracted from entities */
  bones: { x: number; y: number; id: string }[];
  /** Sign entities with text and optional icon */
  signs: { x: number; y: number; text: string; icon?: string }[];
  /** Springs that bounce the player */
  springs: SceneSpringData[];
  /** Moving platforms (horizontal/vertical) */
  movingPlatforms: SceneMovingPlatformData[];
  /** Spike hazards */
  spikes: SceneSpikesData[];
  /** All remaining entities not handled above */
  otherEntities: EntityData[];
  /** Map of "x,y" -> customAssetId for custom blocks (Galeria do Rafa) */
  customBlockAssets: Map<string, string>;
  /** All custom assets from the level data */
  customAssets: CustomAsset[];
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
  const enemies: SceneEnemyData[] = [];
  const bones: SceneObjects["bones"] = [];
  const signs: SceneObjects["signs"] = [];
  const springs: SceneSpringData[] = [];
  const movingPlatforms: SceneMovingPlatformData[] = [];
  const spikes: SceneSpikesData[] = [];
  const otherEntities: EntityData[] = [];
  const customBlockAssets = new Map<string, string>();

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
      case "enemy": {
        const subtype = (entity.props?.subtype as EnemySubtype) ?? "vacuum";
        enemies.push({
          id: `enemy-${entity.x}-${entity.y}`,
          subtype,
          x: entity.x,
          y: entity.y,
        });
        break;
      }
      case "bone":
        bones.push({
          x: entity.x,
          y: entity.y,
          id: `bone-${entity.x}-${entity.y}`,
        });
        break;
      case "sign":
        // Custom signs (Galeria do Rafa) with customAssetId go to otherEntities
        if (entity.props?.customAssetId) {
          otherEntities.push(entity);
        } else {
          signs.push({
            x: entity.x,
            y: entity.y,
            text: (entity.props?.text as string) ?? "",
            icon: entity.props?.icon as string | undefined,
          });
        }
        break;
      case "custom_block_asset":
        customBlockAssets.set(
          `${entity.x},${entity.y}`,
          (entity.props?.customAssetId as string) ?? ""
        );
        break;
      case "spring":
        springs.push({
          x: entity.x,
          y: entity.y,
          bounceForce: (entity.props?.bounceForce as number) ?? 18,
        });
        break;
      case "moving_platform":
        movingPlatforms.push({
          x: entity.x,
          y: entity.y,
          direction: (entity.props?.direction as "horizontal" | "vertical") ?? "horizontal",
          speed: (entity.props?.speed as number) ?? 3,
          range: (entity.props?.range as number) ?? 4,
        });
        break;
      case "spikes":
        spikes.push({
          x: entity.x,
          y: entity.y,
          facing: (entity.props?.facing as "up" | "down" | "left" | "right") ?? "up",
        });
        break;
      default:
        // future entity types
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
    enemies,
    bones,
    signs,
    springs,
    movingPlatforms,
    spikes,
    otherEntities,
    customBlockAssets,
    customAssets: level.customAssets ?? [],
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
      enemies: scene.enemies.map(e => ({
        subtype: e.subtype,
        x: e.x,
        y: e.y,
      })),
    },
  ];
}
