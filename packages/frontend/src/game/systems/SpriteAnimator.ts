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
    frames: ["jump_fall"],
    fps: 8,
    loop: false,
  },
  land: {
    name: "land",
    frames: ["jump_land"],
    fps: 10,
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
  hurt_heavy: {
    name: "hurt_heavy",
    frames: ["hurt_medium", "hurt_heavy"],
    fps: 6,
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
  crouch: {
    name: "crouch",
    frames: ["crouch"],
    fps: 4,
    loop: true,
  },
  look_up: {
    name: "look_up",
    frames: ["look_up"],
    fps: 4,
    loop: true,
  },
  fly: {
    name: "fly",
    frames: ["fly_1", "fly_2"],
    fps: 10,
    loop: true,
  },
  wait: {
    name: "wait",
    frames: ["wait"],
    fps: 4,
    loop: true,
  },
  affection: {
    name: "affection",
    frames: ["affection"],
    fps: 6,
    loop: false,
  },
  bark: {
    name: "bark",
    frames: ["attack_prep", "attack_1", "attack_2"],
    fps: 10,
    loop: false,
    events: { 1: "bark_fire" },
  },
  dig: {
    name: "dig",
    frames: ["crouch", "crouch"],
    fps: 6,
    loop: false,
  },
  sniff: {
    name: "sniff",
    frames: ["sit"],
    fps: 4,
    loop: true,
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
let spriteManifest: SpriteManifest | null = null;
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
      // Silently use fallback — no console spam
      const fallback = textureCache.get(FALLBACK_SPRITE);
      if (fallback) {
        textureCache.set(spriteName, fallback);
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
  const missing: string[] = [];

  const manifestPromise = fetch(`${SPRITE_BASE_PATH}manifest.json`)
    .then((res) => res.json())
    .then((data: SpriteManifest) => { spriteManifest = data; })
    .catch((err) => { console.warn("[SpriteAnimator] Failed to load manifest.json:", err); });

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
          missing.push(name);
          resolve();
        }
      );
    });
  });

  return Promise.all([...promises, manifestPromise]).then(() => {
    // Ensure fallback is available for any missing sprites
    const fallback = textureCache.get(FALLBACK_SPRITE);
    if (fallback) {
      for (const name of names) {
        if (!textureCache.has(name)) {
          textureCache.set(name, fallback);
        }
      }
    }
    if (missing.length > 0) {
      console.warn(`[SpriteAnimator] ${missing.length} sprites not found, using fallback: ${missing.join(", ")}`);
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
 * Get the aspect ratio (width / height) of the current frame's sprite
 * from the manifest data. Returns 1.0 if manifest is not loaded or
 * the sprite entry is not found.
 */
export function getFrameAspectRatio(animName: string, elapsed: number): number {
  if (!spriteManifest) return 1.0;
  const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
  const frameIndex = resolveFrameIndex(anim, elapsed);
  const spriteName = anim.frames[frameIndex];
  const entry = spriteManifest.sprites[spriteName];
  if (!entry) return 1.0;
  return entry.sourceSize[0] / entry.sourceSize[1];
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
// Memory Management
// ---------------------------------------------------------------------------

/**
 * Dispose all cached sprite textures and clear the cache.
 * Call this when the game scene is unmounted to free GPU memory.
 */
export function disposeSprites(): void {
  for (const texture of textureCache.values()) {
    texture.dispose();
  }
  textureCache.clear();
}

// ---------------------------------------------------------------------------
// Re-export animation definitions for external use
// ---------------------------------------------------------------------------

export { ANIMATIONS };
export type { SpriteAnimationDef as AnimationDef };
