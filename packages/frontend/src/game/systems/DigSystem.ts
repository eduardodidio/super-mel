import { BLOCK_PROPERTIES, type BlockType } from "@super-mel/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DigResult {
  success: boolean;
  blockX: number;
  blockY: number;
  blockZ: number;
  dropType: "bone" | "coin" | "none";
}

// ---------------------------------------------------------------------------
// tryDig
// ---------------------------------------------------------------------------

/**
 * Attempt to dig the block below Mel.
 * @param melX - Mel's world X position
 * @param melY - Mel's world Y position
 * @param getBlockAt - function to query block type at grid position
 * @returns DigResult indicating success and what dropped
 */
export function tryDig(
  melX: number,
  melY: number,
  getBlockAt: (x: number, y: number, z: number) => BlockType | null,
): DigResult {
  // The block directly below Mel's feet
  const blockX = Math.round(melX);
  const blockY = Math.round(melY) - 1; // one block below
  const blockZ = 0;

  const blockType = getBlockAt(blockX, blockY, blockZ);

  if (!blockType || blockType === "empty") {
    return { success: false, blockX, blockY, blockZ, dropType: "none" };
  }

  const props = BLOCK_PROPERTIES[blockType as Exclude<BlockType, "empty">];
  if (!props || !props.diggable) {
    return { success: false, blockX, blockY, blockZ, dropType: "none" };
  }

  // Determine drop
  const roll = Math.random();
  let dropType: "bone" | "coin" | "none";
  if (roll < 0.3) {
    dropType = "bone"; // 30% chance bone
  } else if (roll < 0.6) {
    dropType = "coin"; // 30% chance coin
  } else {
    dropType = "none"; // 40% chance nothing
  }

  return { success: true, blockX, blockY, blockZ, dropType };
}
