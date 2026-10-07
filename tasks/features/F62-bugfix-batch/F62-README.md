# F62 — Bugfix Batch: Console Warnings, Ground Stuck, Block Destruction, Transparent Items

**Status:** done

## Summary

Fixes 4 gameplay bugs reported during playtesting: excessive console warnings, Mel getting stuck on ground when changing direction, red blocks turning white instead of disappearing when destroyed (colliders remaining), and items rendering as transparent/invisible in the scene.

## Problem Statement

1. **Console Warnings** — Browser console floods with warnings during gameplay, making debugging harder and potentially impacting performance.
2. **Mel Ground Stuck** — Player character freezes when walking and quickly reversing direction. Requires pressing the opposite direction again to unstick.
3. **Red Block Destruction** — Red blocks (brick/item_block) turn white when hit instead of being destroyed. Colliders persist, blocking movement.
4. **Transparent Items** — Some entities in campaign levels render as invisible/transparent when they should be visible.

## Root Cause Analysis

### Console Warnings
- Only 5 explicit `console.warn` in source (all intentional edge-case logging)
- Runtime warnings likely from: THREE.js deprecation notices, R3F material prop warnings, React key/prop warnings
- The `material={materials}` prop on `<mesh>` passes a `MeshStandardMaterial[]` array — R3F handles this but may emit warnings

### Mel Ground Stuck
- Mel uses `CuboidCollider args={[0.3, 0.45, 0.25]}` (box shape)
- Ground is made of adjacent 1x1x1 cuboid blocks
- **Ghost collision at block seams**: box collider catches on vertical edges between adjacent blocks — classic physics issue
- Movement acceleration formula `MOVE_ACCEL * delta / (Math.abs(vel.x) + 1)` produces very small lerp factor (~0.057) at high speed, making direction reversal sluggish
- Ground detection threshold `Math.abs(vel.y) < 1` may falsely report airborne when catching on seams

### Red Block Destruction
- `brick` blocks have `destructible: false` in BLOCK_PROPERTIES — projectile cannot destroy them
- `item_block` (crimson red) also not destructible — activates instead (turns gray `#555555`)
- Fix: make `brick` destructible (matches Mario convention — bricks break when hit)
- Ensure block destruction properly unmounts React component + removes Rapier collider

### Transparent Items
- Most entity materials are correct, but runtime conditions (failed texture loads, depth sorting, stale materials) can cause invisible rendering
- Need runtime audit to identify specific affected entities
- Potential: Projectile bark sprite material initialized without texture map, items behind transparent blocks with depth issues

## Architecture

### Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Make `brick.destructible = true` |
| `packages/frontend/src/game/entities/Mel.tsx` | Replace CuboidCollider with compound capsule-like shape; fix movement acceleration formula |
| `packages/frontend/src/game/entities/Block.tsx` | Audit material prop usage for R3F compatibility |
| `packages/frontend/src/game/systems/BlockTextures3D.ts` | Verify material caching doesn't cause stale textures |
| `packages/frontend/src/game/systems/ChunkRenderer.tsx` | Verify destroy/activate block lifecycle |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Remove console.warn; audit entity rendering |
| `packages/frontend/src/game/systems/SpriteAnimator.ts` | Suppress/fix sprite loading warnings |
| Various entity files | Audit and fix transparency/visibility issues |

## Waves

### Wave 0 (4 parallel tasks — all independent)
- **T01**: Console warnings cleanup
- **T02**: Mel ground stuck fix (physics collider + movement formula)
- **T03**: Block destruction fix (brick destructible + visual feedback)
- **T04**: Transparent items fix (audit + fix entity rendering)
