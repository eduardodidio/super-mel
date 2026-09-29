import * as THREE from "three";

export interface AnimationDef {
  row: number;
  frameCount: number;
  fps: number;
  loop: boolean;
}

const ANIMATIONS: Record<string, AnimationDef> = {
  idle:      { row: 0, frameCount: 4, fps: 6,  loop: true },
  walk:      { row: 1, frameCount: 6, fps: 10, loop: true },
  run:       { row: 2, frameCount: 6, fps: 14, loop: true },
  jump:      { row: 3, frameCount: 3, fps: 10, loop: false },
  fall:      { row: 4, frameCount: 3, fps: 8,  loop: false },
  fly:       { row: 5, frameCount: 4, fps: 10, loop: true },
  attack:    { row: 6, frameCount: 4, fps: 12, loop: false },
  hurt:      { row: 7, frameCount: 2, fps: 8,  loop: false },
  sit:       { row: 8, frameCount: 2, fps: 4,  loop: true },
  bark_wave: { row: 9, frameCount: 3, fps: 12, loop: false },
};

const COLS = 6;
const ROWS = 10;

let sharedTexture: THREE.Texture | null = null;

export function loadSpritesheet(): THREE.Texture {
  if (sharedTexture) return sharedTexture;
  const loader = new THREE.TextureLoader();
  sharedTexture = loader.load("/sprites/mel_spritesheet.png");
  sharedTexture.magFilter = THREE.NearestFilter;
  sharedTexture.minFilter = THREE.NearestFilter;
  sharedTexture.colorSpace = THREE.SRGBColorSpace;
  sharedTexture.repeat.set(1 / COLS, 1 / ROWS);
  return sharedTexture;
}

export function getAnimationDef(name: string): AnimationDef {
  return ANIMATIONS[name] || ANIMATIONS.idle;
}

export function updateSpriteUV(texture: THREE.Texture, animName: string, elapsed: number): boolean {
  const anim = ANIMATIONS[animName] || ANIMATIONS.idle;
  const totalFrameTime = 1 / anim.fps;
  const totalDuration = anim.frameCount * totalFrameTime;

  let t = elapsed;
  let finished = false;
  if (anim.loop) {
    t = t % totalDuration;
  } else if (t >= totalDuration) {
    t = totalDuration - 0.001;
    finished = true;
  }

  const frameIndex = Math.floor(t / totalFrameTime);
  const col = frameIndex % COLS;
  const row = anim.row;

  texture.offset.set(col / COLS, 1 - (row + 1) / ROWS);
  return finished;
}

export function getAnimationNames(): string[] {
  return Object.keys(ANIMATIONS);
}
