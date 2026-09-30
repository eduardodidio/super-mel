import type { LevelDataV1, LevelDataV2, EntityData } from "./types.js";

/**
 * Detect and migrate LevelData to v2 format.
 *
 * Detection logic:
 * - If `data.version === 2` -> already v2, return as-is (with defaults for missing optional fields)
 * - If `data.version` is undefined AND `data.spawnPoint` exists -> v1, migrate
 * - Otherwise -> throw Error("Unknown LevelData format")
 */
export function migrateLevelData(data: unknown): LevelDataV2 {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid LevelData: not an object");
  }

  const obj = data as Record<string, unknown>;

  // Already v2
  if (obj.version === 2) {
    const v2 = data as LevelDataV2;
    // Ensure entities array exists (defensive)
    if (!Array.isArray(v2.entities)) {
      return { ...v2, entities: [] };
    }
    return v2;
  }

  // Detect v1: no version field, has spawnPoint
  if (obj.version === undefined && obj.spawnPoint && typeof obj.spawnPoint === "object") {
    const v1 = data as LevelDataV1;
    const entities: EntityData[] = [];

    // Migrate spawnPoint to entity
    if (v1.spawnPoint) {
      entities.push({
        type: "spawn",
        x: v1.spawnPoint.x,
        y: v1.spawnPoint.y,
      });
    }

    return {
      version: 2,
      grid: v1.grid,
      width: v1.width,
      height: v1.height,
      entities,
      // theme not present in v1 -- leave undefined (caller uses level.background)
    };
  }

  throw new Error("Unknown LevelData format: cannot determine version");
}

/**
 * Type guard: check if data is already v2.
 */
export function isLevelDataV2(data: unknown): data is LevelDataV2 {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as Record<string, unknown>).version === 2
  );
}
