import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

/**
 * Get or create a THREE.CanvasTexture from a base64 data URI.
 * Uses Image + Canvas to create the texture, with nearest-neighbor filtering
 * for the pixelated voxel look.
 *
 * The cache key is the dataUri string itself (deduplicates identical images).
 * Returns a placeholder texture immediately, which is updated asynchronously
 * once the image loads.
 */
export function getCustomTexture(dataUri: string): THREE.CanvasTexture {
  if (cache.has(dataUri)) return cache.get(dataUri)!;

  // Create a placeholder and update asynchronously
  const placeholder = createPlaceholderTexture();
  cache.set(dataUri, placeholder);

  // Load the actual image asynchronously
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, 64, 64);

    // Update the existing texture's image source
    placeholder.image = canvas;
    placeholder.needsUpdate = true;
  };
  img.src = dataUri;

  return placeholder;
}

function createPlaceholderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  // Checkerboard placeholder (magenta/black) to signal "loading"
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#FF00FF" : "#000000";
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Pre-load all custom assets from a level's customAssets array.
 * Call this when loading a level to warm the cache before rendering.
 */
export function preloadCustomTextures(assets: Array<{ dataUri: string }>): void {
  for (const asset of assets) {
    getCustomTexture(asset.dataUri);
  }
}

/**
 * Dispose all cached custom textures. Call on level unload.
 */
export function disposeCustomTextures(): void {
  for (const texture of cache.values()) {
    texture.dispose();
  }
  cache.clear();
  customBlockDataUris.clear();
}

// --- Module-level lookup: block position "x,y,z" -> dataUri ---
// Populated by GameScene3D from SceneObjects, read by Block.tsx

const customBlockDataUris = new Map<string, string>();

/**
 * Set the custom block data URI lookup for gameplay rendering.
 * Called by GameScene3D when level data has custom assets.
 */
export function setCustomBlockLookup(
  blockAssets: Map<string, string>,
  assets: Array<{ id: string; dataUri: string }>
): void {
  customBlockDataUris.clear();
  const assetMap = new Map(assets.map((a) => [a.id, a.dataUri]));
  for (const [posKey, assetId] of blockAssets) {
    const dataUri = assetMap.get(assetId);
    if (dataUri) {
      customBlockDataUris.set(posKey, dataUri);
    }
  }
}

/**
 * Get the custom data URI for a block at position "x,y".
 * Returns undefined if the block is not a custom block or has no asset.
 */
export function getCustomBlockDataUri(x: number, y: number): string | undefined {
  return customBlockDataUris.get(`${x},${y}`);
}
