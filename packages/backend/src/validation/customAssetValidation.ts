interface CustomAssetValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate the customAssets array from level data.
 *
 * Enforces:
 * - Must be an array
 * - Max 10 assets per level
 * - Each asset must have: id (non-empty string), name (1-20 chars), dataUri (starts with "data:image/", <= 15000 chars)
 */
export function validateCustomAssets(assets: unknown): CustomAssetValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(assets)) {
    return { valid: false, errors: ["customAssets must be an array"] };
  }

  if (assets.length > 10) {
    errors.push("customAssets exceeds maximum of 10 assets per level");
  }

  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    if (!a || typeof a !== "object") {
      errors.push(`customAssets[${i}] must be an object`);
      continue;
    }
    const asset = a as Record<string, unknown>;

    // id
    if (typeof asset.id !== "string" || asset.id.length === 0) {
      errors.push(`customAssets[${i}].id must be a non-empty string`);
    }

    // name
    if (typeof asset.name !== "string" || asset.name.length === 0 || asset.name.length > 20) {
      errors.push(`customAssets[${i}].name must be 1-20 characters`);
    }

    // dataUri
    if (typeof asset.dataUri !== "string") {
      errors.push(`customAssets[${i}].dataUri must be a string`);
    } else {
      if (!asset.dataUri.startsWith("data:image/")) {
        errors.push(`customAssets[${i}].dataUri must start with "data:image/"`);
      }
      if (asset.dataUri.length > 15000) {
        errors.push(`customAssets[${i}].dataUri exceeds 15KB limit (${asset.dataUri.length} chars)`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
