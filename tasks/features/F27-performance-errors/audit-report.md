# F27 Performance & Error Audit Report

**Date:** 2026-09-30

## P1 Issues (High Priority)

| ID | Component | Issue | Lines |
|----|-----------|-------|-------|
| 3.1 | GameScene3D.tsx | setPlayerPos/setFacingRight every frame (60 re-renders/sec cascade) | 24-25, 29, 33 |
| 3.2 | ChunkRenderer.tsx | setChunks in useFrame (5 FPS throttle but still triggers reconciliation) | 22-48 |
| 2.2 | Block.tsx | Lava pointLight intensity 2.0 per block (cumulative GPU overhead) | 52 |
| 2.5 | Block.tsx | Vector3.clone() x8 per destroyed block per frame (GC pressure) | 89 |
| 5.4 | SpriteAnimator.ts | Sprite texture cache never disposed (memory leak ~1.75MB) | 120-159 |
| 5.5 | BlockTextures3D.ts | Material/texture caches never disposed (66+ materials leaked) | 111-141 |
| 1.2 | SpriteAnimator.ts | Deprecated loadSpritesheet/updateSpriteUV dead code | 346, 361 |

## P2 Issues (Medium Priority)

| ID | Component | Issue | Lines |
|----|-----------|-------|-------|
| 2.1 | Coin.tsx, Heart.tsx | PointLight per collectible (linear scaling) | 58, 76 |
| 2.3 | Projectile.tsx | Explosion light intensity 5.0 x 0.3s | 119, 175 |
| 3.3 | BackgroundDecor.tsx | Position arrays recreated every frame | 97 |
| 5.6 | CameraRig.tsx | Vector3 allocated every frame (60/sec) | 51 |

## Good Patterns Found (No Fix Needed)

- BlockTextures3D: materials cached per block type
- Skybox: texture disposed on theme change
- useControls: event listeners cleaned up on unmount
- AudioManager: `{ once: true }` listeners
- Physics timestep: default 1/60s matches frame rate
- Shadow map: 1024x1024 reasonable

## Sprite Status

- All referenced sprites exist in /public/sprites/mel/ — NO 404s expected
- Deprecated functions NOT called anywhere — safe to delete
