import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpriteAnimationDef {
  name: string;
  /** Sprite names from the manifest (without .png extension) */
  frames: string[];
  fps: number;
  loop: boolean;
  /** Optional per-frame event names (e.g. frame 1 -> "bark_fire") */
  events?: Record<number, string>;
}

/** Metadata for a single sprite entry from manifest.json */
export interface SpriteEntry {
  file: string;
  group: string;
  direction?: string;
  sourceSize: [number, number];
  anchor: [number, number];
  frameIndex?: number;
  note?: string;
}

export interface SpriteManifest {
  frameSize: [number, number];
  pivot: [number, number];
  groups: Record<string, unknown>;
  sprites: Record<string, SpriteEntry>;
}

// ---------------------------------------------------------------------------
// Animation Definitions
// ---------------------------------------------------------------------------

const ANIMATIONS: Record<string, SpriteAnimationDef> = {
  idle: {
    name: "idle",
    frames: ["idle_right"],
    fps: 6,
    loop: true,
  },
  walk: {
    name: "walk",
    frames: ["walk_right", "walk_right_b"],
    fps: 10,
    loop: true,
  },
  run: {
    name: "run",
    frames: ["run_right", "run_right_b"],
    fps: 14,
    loop: true,
  },
  jump: {
    name: "jump",
    frames: ["jump_rise", "jump_air"],
    fps: 10,
    loop: false,
  },
  fall: {
    name: "fall",
    frames: ["jump_fall", "jump_land"],
    fps: 8,
    loop: false,
  },
  attack: {
    name: "attack",
    frames: ["attack_prep", "attack_1", "attack_2", "attack_end"],
    fps: 12,
    loop: false,
    events: { 1: "bark_fire" },
  },
  hurt: {
    name: "hurt",
    frames: ["hurt_light", "hurt_medium"],
    fps: 8,
    loop: false,
  },
  death: {
    name: "death",
    frames: ["hurt_heavy", "death"],
    fps: 6,
    loop: false,
  },
  sit: {
    name: "sit",
    frames: ["sit"],
    fps: 4,
    loop: true,
  },
  lie_down: {
    name: "lie_down",
    frames: ["lie_down"],
    fps: 4,
    loop: true,
  },
  bark_wave: {
    name: "bark_wave",
    frames: ["attack_1", "attack_2"],
    fps: 12,
    loop: false,
  },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPRITE_BASE_PATH = "/sprites/mel/";
const FALLBACK_SPRITE = "idle_right";

// ---------------------------------------------------------------------------
// Texture Cache & Loader
// ---------------------------------------------------------------------------

const textureCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

function configureTexture(texture: THREE.Texture): THREE.Texture {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  return texture;
}

/**
 * Load a single sprite texture by name (cached).
 * Returns a fallback texture if the requested sprite cannot be loaded.
 */
function loadTexture(spriteName: string): THREE.Texture {
  const cached = textureCache.get(spriteName);
  if (cached) return cached;

  const url = `${SPRITE_BASE_PATH}${spriteName}.png`;
  const texture = loader.load(
    url,
    (tex) => configureTexture(tex),
    undefined,
    () => {
      // On error, replace with fallback texture if available
      console.warn(
        `[SpriteAnimator] Failed to load sprite "${spriteName}", using fallback "${FALLBACK_SPRITE}"`
      );
      const fallback = textureCache.get(FALLBACK_SPRITE);
      if (fallback && texture !== fallback) {
        texture.image = fallback.image as typeof texture.image;
        texture.needsUpdate = true;
      }
    }
  );
  configureTexture(texture);
  textureCache.set(spriteName, texture);
  return texture;
}

// ---------------------------------------------------------------------------
// Pre-loading
// ---------------------------------------------------------------------------

/**
 * Collect all unique sprite names referenced by animation definitions.
 */
function getAllSpriteNames(): string[] {
  const names = new Set<string>();
  names.add(FALLBACK_SPRITE);
  for (const anim of Object.values(ANIMATIONS)) {
    for (const frame of anim.frames) {
      names.add(frame);
    }
  }
  return Array.from(names);
}

/**
 * Pre-load all sprite textures used by animations.
 * Returns a Promise that resolves when all textures are loaded (or fallback-ed).
 */
export function loadSprites(): Promise<void> {
  const names = getAllSpriteNames();

  const promises = names.map((name) => {
    return new Promise<void>((resolve) => {
      const url = `${SPRITE_BASE_PATH}${name}.png`;
      loader.load(
        url,
        (texture) => {
          configureTexture(texture);
          textureCache.set(name, texture);
          resolve();
        },
        undefined,
        () => {
          console.warn(
            `[SpriteAnimator] Sprite "${name}" not found, will use fallback`
          );
          // Store a placeholder; getFrame will return fallback texture
          resolve();
        }
      );
    });
  });

  return Promise.all(promises).then(() => {
    // Ensure fallback is available for any missing sprites
    const fallback = textureCache.get(FALLBACK_SPRITE);
    if (fallback) {
      for (const name of names) {
        if (!textureCache.has(name)) {
          textureCache.set(name, fallback);
        }
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Animation Queries
// ---------------------------------------------------------------------------

/**
 * Get the animation definition by name. Falls back to "idle" if not found.
 */
export function getAnimationDef(name: string): SpriteAnimationDef {
  return ANIMATIONS[name] ?? ANIMATIONS.idle;
}

/**
 * Get all registered animation names.
 */
export function getAnimationNames(): string[] {
  return Object.keys(ANIMATIONS);
}

/**
 * Compute the total duration of an animation in seconds.
 */
export function getAnimationDuration(animName: string): number {
  const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
  return anim.frames.length / anim.fps;
}

// ---------------------------------------------------------------------------
// Frame Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the current frame index for an animation given elapsed time.
 */
function resolveFrameIndex(anim: SpriteAnimationDef, elapsed: number): number {
  const frameTime = 1 / anim.fps;
  const totalDuration = anim.frames.length * frameTime;

  let t = elapsed;
  if (anim.loop) {
    t = totalDuration > 0 ? t % totalDuration : 0;
  } else if (t >= totalDuration) {
    t = totalDuration - 0.0001;
  }

  const index = Math.floor(t / frameTime);
  return Math.min(index, anim.frames.length - 1);
}

/**
 * Get the THREE.Texture for the current frame of an animation.
 *
 * @param animName - The animation name (e.g. "walk", "attack")
 * @param elapsed  - Seconds elapsed since the animation started
 * @returns The texture for the current frame
 */
export function getFrame(animName: string, elapsed: number): THREE.Texture {
  const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
  const frameIndex = resolveFrameIndex(anim, elapsed);
  const spriteName = anim.frames[frameIndex];

  // Try to get cached texture, fall back to loading on demand, then fallback sprite
  let texture = textureCache.get(spriteName);
  if (!texture) {
    texture = textureCache.get(FALLBACK_SPRITE);
    if (!texture) {
      // Last resort: load synchronously (will show blank until loaded)
      texture = loadTexture(FALLBACK_SPRITE);
    }
  }
  return texture;
}

/**
 * Check if a one-shot animation has finished playing.
 *
 * @param animName - The animation name
 * @param elapsed  - Seconds elapsed since the animation started
 * @returns true if the animation is a one-shot and has reached the end
 */
export function isFinished(animName: string, elapsed: number): boolean {
  const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
  if (anim.loop) return false;

  const totalDuration = anim.frames.length / anim.fps;
  return elapsed >= totalDuration;
}

/**
 * Get the event name (if any) triggered at the current frame.
 *
 * @param animName - The animation name
 * @param elapsed  - Seconds elapsed since the animation started
 * @returns The event string or undefined
 */
export function getFrameEvent(
  animName: string,
  elapsed: number
): string | undefined {
  const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
  if (!anim.events) return undefined;

  const frameIndex = resolveFrameIndex(anim, elapsed);
  return anim.events[frameIndex];
}

/**
 * Get the source size (width, height) of the current frame's sprite
 * from the manifest data. Useful for adjusting mesh scale per-frame.
 */
export function getFrameSpriteEntry(
  animName: string,
  elapsed: number,
  manifest: SpriteManifest
): SpriteEntry | undefined {
  const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
  const frameIndex = resolveFrameIndex(anim, elapsed);
  const spriteName = anim.frames[frameIndex];
  return manifest.sprites[spriteName];
}

// ---------------------------------------------------------------------------
// Backward Compatibility (DEPRECATED — will be removed in T04)
// ---------------------------------------------------------------------------

/** @deprecated Use loadSprites() instead. Kept for Mel.tsx compat until T04. */
export function loadSpritesheet(): THREE.Texture {
  console.warn(
    "[SpriteAnimator] loadSpritesheet() is deprecated. Use loadSprites() and getFrame() instead."
  );
  // Trigger async preload (fire-and-forget)
  loadSprites().catch(() => {});
  // Return fallback texture so Mel.tsx has something to render
  return loadTexture(FALLBACK_SPRITE);
}

/**
 * @deprecated Use getFrame() instead. Kept for Mel.tsx compat until T04.
 * Updates UV offsets on a spritesheet texture — this is now a no-op shim
 * that returns false (not finished) to keep existing code from breaking.
 */
export function updateSpriteUV(
  _texture: THREE.Texture,
  animName: string,
  elapsed: number
): boolean {
  console.warn(
    "[SpriteAnimator] updateSpriteUV() is deprecated. Use getFrame() and isFinished() instead."
  );
  return isFinished(animName, elapsed);
}

// ---------------------------------------------------------------------------
// Re-export animation definitions for external use
// ---------------------------------------------------------------------------

export { ANIMATIONS };
export type { SpriteAnimationDef as AnimationDef };
