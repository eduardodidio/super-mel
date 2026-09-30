import { validateCustomAssets } from "./customAssetValidation.js";

const VALID_ENTITY_TYPES: Set<string> = new Set([
  "coin", "heart", "goal", "checkpoint", "spawn",
  "item_block_content", "sign", "bone", "enemy",
  "custom_block_asset",
]);

const VALID_BLOCK_TYPES: Set<string> = new Set([
  "empty", "stone", "sand", "wood", "iron", "dirt",
  "brick", "glass", "leaf", "water", "lava", "item_block",
  "custom",
]);

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate that `data` conforms to LevelDataV2 structural requirements.
 *
 * Checks:
 * - version === 2
 * - grid is a 2D array (exists, is array of arrays)
 * - width and height are positive integers
 * - entities is an array
 * - Each entity has a valid type, numeric x, numeric y
 * - At most 1 spawn entity
 * - At most 1 goal entity
 * - Grid dimensions: width <= 200, height <= 100 (sane limits)
 * - Entity count <= 500 (prevent abuse)
 *
 * Does NOT deep-validate:
 * - Block types in every grid cell (too slow for large grids)
 * - Entity positions within grid bounds (client responsibility)
 * - props object contents (opaque by design)
 */
export function validateLevelDataV2(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["data must be an object"] };
  }

  const obj = data as Record<string, unknown>;

  // Version
  if (obj.version !== 2) {
    errors.push("data.version must be 2");
  }

  // Grid
  if (!Array.isArray(obj.grid)) {
    errors.push("data.grid must be an array");
  } else {
    // Check first row is array (shallow check)
    if (obj.grid.length > 0 && !Array.isArray(obj.grid[0])) {
      errors.push("data.grid must be a 2D array (grid[0] is not an array)");
    }
  }

  // Dimensions
  if (typeof obj.width !== "number" || obj.width <= 0 || obj.width > 200) {
    errors.push("data.width must be a positive number <= 200");
  }
  if (typeof obj.height !== "number" || obj.height <= 0 || obj.height > 100) {
    errors.push("data.height must be a positive number <= 100");
  }

  // Entities
  if (!Array.isArray(obj.entities)) {
    errors.push("data.entities must be an array");
  } else {
    if (obj.entities.length > 500) {
      errors.push("data.entities exceeds maximum of 500 entities");
    }

    let spawnCount = 0;
    let goalCount = 0;

    for (let i = 0; i < obj.entities.length; i++) {
      const e = obj.entities[i];
      if (!e || typeof e !== "object") {
        errors.push(`data.entities[${i}] must be an object`);
        continue;
      }
      const ent = e as Record<string, unknown>;

      if (typeof ent.type !== "string" || !VALID_ENTITY_TYPES.has(ent.type)) {
        errors.push(`data.entities[${i}].type "${ent.type}" is not a valid EntityType`);
      } else {
        if (ent.type === "spawn") spawnCount++;
        if (ent.type === "goal") goalCount++;
      }

      if (typeof ent.x !== "number") {
        errors.push(`data.entities[${i}].x must be a number`);
      }
      if (typeof ent.y !== "number") {
        errors.push(`data.entities[${i}].y must be a number`);
      }
    }

    if (spawnCount > 1) {
      errors.push("data.entities must contain at most 1 spawn entity");
    }
    if (goalCount > 1) {
      errors.push("data.entities must contain at most 1 goal entity");
    }
  }

  // Optional: theme
  if (obj.theme !== undefined) {
    const validThemes = ["forest", "desert", "night", "space", "ocean"];
    if (typeof obj.theme !== "string" || !validThemes.includes(obj.theme)) {
      errors.push(`data.theme "${obj.theme}" is not a valid BackgroundTheme`);
    }
  }

  // Optional: customAssets (Galeria do Rafa)
  if (obj.customAssets !== undefined) {
    const assetResult = validateCustomAssets(obj.customAssets);
    if (!assetResult.valid) {
      errors.push(...assetResult.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}
