# TechLead Review -- F62

**Verdict:** APPROVED

## Changes Reviewed

### T01 -- Console Warnings Cleanup

**`packages/frontend/src/game/scenes/GameScene3D.tsx`**
- Moved the "no goal entity" warning from render body into a `useEffect` with dependencies `[levelData, goalEntities.length]`.
- Finding: Correct. The dependency on `goalEntities.length` (a primitive number) avoids infinite re-render loops. The warning now fires only when `levelData` or goal count changes, preventing spam on every frame. Minor note: `goalEntities` is referenced inside the effect but only `.length` is in the dep array -- this could trigger an `exhaustive-deps` lint warning in strict configs, but is functionally correct since only the length matters.

**`packages/frontend/src/game/systems/SpriteAnimator.ts`**
- Added module-level flags `manifestWarnShown` and `missingSpritesWarnShown` to gate console warnings to fire only once.
- Finding: Correct. The flags are module-scoped singletons which persist across component re-mounts. Since `loadSprites()` can be called multiple times (e.g., on hot reload or scene remount), the one-time flags prevent log flooding. The pattern is clean and idiomatic.

**`packages/frontend/src/game/entities/Block.tsx`**
- Replaced the R3F `material={materials}` prop with a ref callback: `ref={(mesh) => { if (mesh) mesh.material = materials; }}`.
- Finding: Correct. Passing a `MeshStandardMaterial[]` array directly as a JSX prop on `<mesh>` can emit R3F/THREE warnings because R3F expects a single material or a `material` array attached via the `material` property. Using a ref callback assigns the material array imperatively after mount, bypassing R3F's prop reconciliation. The null check is appropriate. Applied consistently to both physics and non-physics code paths.

### T02 -- Mel Ground Stuck Fix

**`packages/frontend/src/game/entities/Mel.tsx` -- Compound Collider**
- Replaced single `CuboidCollider args={[0.3, 0.45, 0.25]}` with:
  - `CuboidCollider args={[0.3, 0.25, 0.25]} position={[0, 0.1, 0]}` (body)
  - `BallCollider args={[0.3]} position={[0, -0.2, 0]}` (feet)
- Finding: Correct. This is the standard solution for ghost collisions at block seams in physics engines. The ball at the feet slides over seam edges instead of catching on them. Geometry check:
  - Cuboid spans y: [-0.15, 0.35] (center 0.1, half-height 0.25)
  - Ball spans y: [-0.5, 0.1] (center -0.2, radius 0.3)
  - Total collider: y ~ [-0.5, 0.35], total height ~0.85 (was 0.9 with old cuboid)
  - Overlap between cuboid bottom (-0.15) and ball top (0.1) ensures no gap.
  - The `BallCollider` import is correctly added to the import line.

**`packages/frontend/src/game/entities/Mel.tsx` -- Ground Detection**
- Removed `Math.abs(vel.y) < 1` from ground check; now `grounded.current = hit !== null`.
- Increased raycast distance from 0.3 to 0.4.
- Finding: Acceptable with one caveat. The old `vel.y < 1` check was meant to prevent false ground detection while moving upward past a platform, but in practice it caused false negatives (reporting airborne while catching on seams). With the ball collider, seam catching is largely eliminated, making the velocity check less necessary. The raycast origin at `pos.y - 0.55` places it 0.05 below the ball bottom; with max distance 0.4, it detects ground up to 0.95 below center. This is generous but reasonable for a platformer -- it prevents "hovering" glitches on slopes.
- **Potential concern**: Without the vel.y check, if Mel passes through a one-block-wide platform from below (jumping through), the raycast could briefly detect the platform as ground and allow a mid-air jump. However, since all solid blocks in this game have Rapier rigid bodies that physically block upward movement, this scenario is unlikely. The `jumping.current` flag and coyote time logic also mitigate this. Acceptable risk.

**`packages/frontend/src/game/entities/Mel.tsx` -- Movement Formula**
- Old: `lerp(vel.x, targetVelX, MOVE_ACCEL * delta / (Math.abs(vel.x) + 1))`
- New: `lerp(vel.x, targetVelX, Math.min(1, accel * delta))` with `accel = changingDirection ? MOVE_ACCEL * 2 : MOVE_ACCEL`
- Finding: Correct and well-reasoned.
  - Old formula: lerp factor decreased as speed increased (denominator `|vel.x| + 1`), making direction reversal very sluggish at high speed (~0.057 factor at vel.x=6). This caused the "stuck" feel.
  - New formula: lerp factor is `Math.min(1, 25 * delta)` = ~0.42 at 60fps, clamped to 1. This is frame-rate independent and responsive.
  - Direction change uses 2x acceleration (factor ~0.83 at 60fps), giving snappy reversal.
  - The `vel.x > 0.5` threshold for direction change detection prevents oscillation at near-zero velocity.
  - `Math.min(1, ...)` clamp prevents overshoot at low frame rates. Sound engineering.

### T03 -- Brick Destructible

**`packages/shared/src/types.ts`**
- Changed `brick.destructible` from `false` to `true`.
- Finding: Correct. Bricks should be destructible (matches Mario convention). The `BlockParticles` component already uses `getBlockMaterials(type)[0].color` for particle color, which returns the brick's red color (#B22222). Destruction flow: projectile hits block -> `ChunkRenderer` removes block from state -> React unmounts `Block` component -> Rapier collider is automatically removed. No additional code needed.

**`packages/frontend/public/levels/campaign/1-8.json`**
- Converted 57 structural brick blocks to stone: all ground floor (y=0) and border walls (x=0, x=79 at y=1-5).
- Remaining 11 bricks are non-structural gameplay blocks.
- Finding: Correct and necessary. Without this change, making brick destructible would allow the player to destroy the ground and walls of level 1-8, breaking the level. The conversion to stone (indestructible) preserves structural integrity.
- Verified other campaign levels: 1-7 has 17 bricks, all at non-structural positions (y=1-5, x=8/58/62) -- these are intentional gameplay bricks that should be destructible. All other levels (1-1 through 1-6) have zero brick blocks. No regressions.

### T04 -- Transparent Items Fix

**`packages/frontend/src/game/entities/Coin.tsx` and `DroppedCoin.tsx`**
- Added `color="#FFD700"` (gold) to `meshStandardMaterial`.
- Finding: Correct. When a `meshStandardMaterial` has a `map` (texture) but the texture fails to load or is not yet loaded, the material renders as white/transparent because the default color is white (#FFFFFF) and the map modulates it. Setting `color="#FFD700"` ensures the coin appears gold even without a texture. When the texture loads, THREE.js multiplies map color by material color -- since the coin texture already has gold tones, the multiplication produces a slightly warmer gold which is acceptable. Applied consistently to both Coin and DroppedCoin.

**`packages/frontend/src/game/entities/Projectile.tsx`**
- Added `color="#ffaa00"` (orange) to the bark sprite material.
- Finding: Correct. Same rationale as coins -- provides a visible fallback color when the bark sprite texture hasn't loaded. The orange matches the existing `emissive` color, maintaining visual consistency.

**`packages/frontend/src/game/systems/BlockTextures3D.ts`**
- Glass opacity increased from 0.35 to 0.45.
- Added `emissive: "#88bbdd"` and `emissiveIntensity: 0.05` to glass.
- Finding: Correct. Glass at 0.35 opacity was barely visible in some lighting conditions, especially in darker biomes (night theme in 1-8). The 0.45 opacity and subtle emissive glow make glass blocks reliably visible without losing their transparent aesthetic. The emissive intensity of 0.05 is appropriately subtle.

## Issues Found

None. All changes are correct, safe, and consistent with project conventions.

## Recommendations

1. **React lint**: The `useEffect` in GameScene3D.tsx references `goalEntities` but only `goalEntities.length` is in the dep array. Consider using `goalEntities.length === 0` directly in the condition and adding a comment noting the intentional dep array to suppress any future lint warnings, or memoize `goalEntities` with `useMemo`.

2. **Coin color multiplication**: The `color="#FFD700"` combined with a gold-toned texture will produce a slightly darker/warmer result than the original texture-only rendering. If the coins look too dark in practice, consider using `color="#FFFFFF"` only as a conditional fallback (e.g., set color only when texture is null). This is a minor visual tuning issue, not a bug.

3. **Future consideration**: The `manifestWarnShown` and `missingSpritesWarnShown` flags in SpriteAnimator.ts are module-level and never reset. In a dev environment with hot module replacement (HMR), they would persist across module reloads, potentially hiding real errors during development. This is acceptable for production but worth noting.
