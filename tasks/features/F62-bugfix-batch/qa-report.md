# QA Report -- F62

**Verdict:** PASS

## Validation Results

### T01 -- Console Warnings Cleanup

- [x] **GameScene3D.tsx**: The "no goal entity" warning was correctly moved from inline render code into a `useEffect` with dependencies `[levelData, goalEntities.length]`. The effect fires only when level data or goal count changes, eliminating per-frame spam. The use of `goalEntities.length` (a primitive number) in the dep array is functionally correct even if `goalEntities` itself is not listed -- only the count matters for this warning.
- [x] **SpriteAnimator.ts**: Two module-level boolean flags (`manifestWarnShown`, `missingSpritesWarnShown`) are correctly placed at module scope (lines 198-199) and gate both warning sites to fire at most once. The flags persist across component remounts, which is the intended behavior for suppressing log noise.
- [x] **Block.tsx**: The `material={materials}` JSX prop (which passed a `MeshStandardMaterial[]` array) was replaced with a ref callback pattern: `ref={(mesh: THREE.Mesh | null) => { if (mesh) mesh.material = materials; }}`. This bypasses R3F's prop reconciliation that could emit warnings when encountering an array. The null check is present. Applied consistently to both physics (line 123) and non-physics (line 104) code paths. The activated `item_block` path and `isBackground` path correctly do not use this pattern since they use inline single materials.

### T02 -- Mel Movement

- [x] **BallCollider import**: `BallCollider` is correctly imported from `@react-three/rapier` on line 2.
- [x] **Compound collider dimensions**: `CuboidCollider args={[0.3, 0.25, 0.25]} position={[0, 0.1, 0]}` (body, y range: -0.15 to 0.35) plus `BallCollider args={[0.3]} position={[0, -0.2, 0]}` (feet, y range: -0.5 to 0.1). Overlap zone from -0.15 to 0.1 ensures no gap between body and feet. Total height ~0.85 (slightly smaller than old 0.9), which is acceptable.
- [x] **Movement formula**: `Math.min(1, accel * delta)` correctly clamps the lerp factor to [0, 1], preventing overshoot at low frame rates. At 60fps: normal accel gives factor ~0.42, direction-change accel gives ~0.83 -- both are responsive and frame-rate independent.
- [x] **Direction change threshold (0.5)**: `vel.x > 0.5` prevents oscillation at near-zero velocity. Reasonable threshold.
- [x] **Ground raycast distance (0.4)**: Ray origin at `pos.y - 0.55` (0.05 below ball bottom at -0.5), max distance 0.4, total detection range to y-0.95 from center. Accommodates the new collider shape with appropriate margin.
- [x] **No regression on other code paths**: Verified that crouch logic (line 177-179), jump/double jump (lines 186-198), stomp bounce (lines 96-105), spring bounce (lines 107-112), coyote time (lines 150-155), and fall death (lines 362-368) are all unchanged. The `stompBounce` and `springBounce` methods in `useImperativeHandle` remain intact.

### T03 -- Brick Blocks

- [x] **BLOCK_PROPERTIES brick.destructible**: Changed from `false` to `true` in `packages/shared/src/types.ts` (line 189). Confirmed in source.
- [x] **Level 1-8 structural bricks converted to stone**: The diff converts 57 structural bricks (ground floor y=0, border walls) to stone. After the change, 1-8.json contains 86 stone blocks and 11 remaining brick blocks (non-structural gameplay blocks that should be destructible).
- [x] **Other campaign levels**: Verified counts -- levels 1-1 through 1-6 have zero brick blocks. Level 1-7 has 17 bricks at non-structural gameplay positions (y=1-5) which are intentionally destructible. No conversion needed.
- [x] **Destroy lifecycle**: ChunkRenderer's `destroyBlock` method (lines 63-96) correctly: marks the block key in `destroyedKeysRef`, filters the block from chunk state via `setChunks`, adds a `DestroyEffect` for particle animation, and calls `onBlockDestroyed`. React unmount of the `Block` component automatically removes the Rapier collider. The `BlockParticles` component correctly uses `getBlockMaterials(type)[0].color` for particle color, which returns brick's red color (#B22222).

### T04 -- Transparent Items

- [x] **Coin.tsx**: `color="#FFD700"` added to `meshStandardMaterial` at line 71. Provides gold fallback when texture hasn't loaded.
- [x] **DroppedCoin.tsx**: `color="#FFD700"` added to `meshStandardMaterial` at line 83. Consistent with Coin.tsx.
- [x] **Projectile.tsx**: `color="#ffaa00"` added to the bark sprite material at line 248. Matches the existing `emissive` color for visual consistency.
- [x] **BlockTextures3D.ts**: Glass opacity changed from 0.35 to 0.45 (line 23). Emissive `"#88bbdd"` with intensity 0.05 added. Both `emissive` and `emissiveIntensity` are part of the `BlockVisual` interface and are correctly propagated to `MeshStandardMaterial` via `baseMat` in `getBlockMaterials()`.

## Additional Changes (Outside Original Scope)

The commit also includes changes not listed in the F62 plan but that are related improvements:

1. **`cleanupCampaignState()` utility** (`useGameState.ts` + `Game3D.tsx` + `LevelClearOverlay.tsx`): Extracted duplicated campaign state reset logic (11 fields) into a shared exported function. Applied in both `handleReturnToMenu` (Game3D.tsx) and `handleMenu` (LevelClearOverlay.tsx). This is a clean refactoring with no behavioral change.

2. **Last-level button text** (`LevelClearOverlay.tsx`): When the player completes the last campaign level (1-8), the button now shows "VOLTAR AO MAPA" instead of "PROXIMA FASE". Uses a `useEffect` to asynchronously load the campaign manifest and check `campaignIndex >= m.levels.length - 1`. The fallback `handleNextLevel` already had the same boundary check (line 186), so the button text is now consistent with the actual behavior. No risk of regression.

## Bugs Found

None.

## Regression Risk

**Low.** Assessment by area:

- **T01 (warnings)**: Zero functional impact -- only logging behavior changed. The `useEffect` dep array and module-level flags are standard React/JS patterns.
- **T02 (movement)**: **Medium-low**. The compound collider changes Mel's physics shape, which could theoretically affect edge cases in tight level geometry. However, the ball-foot pattern is a well-established solution for ghost collisions in box-based physics engines. The total collider height reduced by only 0.05 units. The movement formula change makes direction reversal more responsive, which is the intended fix. The removed `Math.abs(vel.y) < 1` check in ground detection is mitigated by the `jumping.current` flag and coyote time logic. Manual playtesting of all 8 campaign levels is recommended to confirm feel.
- **T03 (brick destructible)**: **Low**. The only structural risk was in level 1-8, which was correctly addressed by converting ground/wall bricks to stone. Level 1-7's 17 bricks are at gameplay positions and should be destructible. All other levels have zero bricks.
- **T04 (transparent items)**: **Low**. Adding `color` to materials with existing `map` textures causes THREE.js to multiply the colors. Since the chosen fallback colors (#FFD700 gold, #ffaa00 orange) are in the same hue family as the textures, the visual result is slightly warmer but acceptable. The glass opacity increase from 0.35 to 0.45 is subtle and improves visibility.
- **Extra changes (cleanupCampaignState, last-level button)**: **Very low**. Pure refactoring (extract function) and UI text fix with defensive fallback logic.
