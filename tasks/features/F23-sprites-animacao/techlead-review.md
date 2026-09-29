# TechLead Review -- F23 Sprites & Animation System

**Verdict:** APPROVED (with non-blocking issues to address in follow-up)

## Summary

The F23 implementation introduces a well-structured sprite animation system composed of three clean layers: a texture-based `SpriteAnimator`, a priority-driven `AnimationStateMachine`, and procedural `EffectSprite`/`EffectManager` components. The architecture is sound -- no circular dependencies, clean separation of concerns, and good fallback handling throughout. The state machine is correctly prioritized and the sprite loading pipeline is robust. Several issues were found, none of which are blocking but some warrant near-term fixes.

## Architecture Assessment

**Strengths:**
- Clean dependency graph: `SpriteAnimator` and `AnimationStateMachine` are pure TypeScript with zero React dependencies, making them independently testable.
- No circular dependencies confirmed: `Mel.tsx` depends on both systems, `Projectile.tsx` depends only on `SpriteAnimator`, `EffectManager` depends on `EffectSprite`. All edges are unidirectional.
- Texture caching with `Map<string, THREE.Texture>` plus pre-loading via `loadSprites()` is the right approach for individual sprite files.
- The `NearestFilter` + `SRGBColorSpace` + `generateMipmaps=false` configuration is correct for pixel art rendering.
- The state machine's one-shot duration/next-state maps are clean and easy to extend.
- Effect pool limit (`MAX_EFFECTS = 10`) prevents unbounded effect spawning.

**Diagrams:** Both `F23-architecture.mmd` and `F23-journey.mmd` accurately reflect the implemented code structure and state transitions.

## Issues Found

### Medium Severity

- **[M1] `damaged` input logic is semantically wrong (Mel.tsx:158)**
  The expression `damaged: invincible && attackTimer.current <= 0` signals `damaged=true` continuously during the invincibility window (1.5s after damage). The `damaged` flag per the spec should be `true` only on the frame when damage occurs. The state machine's `isHurt()` guard prevents infinite re-entry, so this does not cause a crash, but the logic is misleading and fragile. If the hurt animation finishes before the invincibility period ends, the state machine will re-trigger a hurt transition. **Fix:** Replace with a one-frame damage signal -- detect the transition from `not invincible` to `invincible` using a ref, or accept a `damagedThisFrame` prop.

- **[M2] `dead: false` is hardcoded (Mel.tsx:160)**
  The death state will never be reached because `dead` is always `false`. The game-over condition (lives reaching 0) exists in `useGameState` but is not wired to the `AnimInput`. **Fix:** Pass `lives === 0` or a `dead` prop from GameScene3D.

- **[M3] `onAttackFrame` prop is never passed (GameScene3D.tsx:63-68)**
  Mel's `onAttackFrame` callback is declared but GameScene3D does not provide it. The bark_fire event detection code (Mel.tsx:167-171) works correctly in isolation but has no effect at runtime. This means attack animations play visually but do not trigger projectile spawning through the new event system. The existing `ProjectileManager` uses its own shoot detection, so gameplay is not broken, but the new system is unused.

- **[M4] Missing `lie_down` animation definition in SpriteAnimator.ts**
  The `AnimationStateMachine` maps `lie_down` to animation name `"lie_down"` (ANIM_NAME_MAP line 89), but `ANIMATIONS` in `SpriteAnimator.ts` has no `"lie_down"` entry. `getAnimationDef("lie_down")` falls back to `idle`, so there is no crash, but the `lie_down.png` sprite from the manifest is never displayed. **Fix:** Add `lie_down: { name: "lie_down", frames: ["lie_down"], fps: 4, loop: true }` to `ANIMATIONS`.

### Low Severity

- **[L1] `as any` cast in Rapier ray cast (Mel.tsx:80)**
  The ray object `{ origin: rayOrigin, dir: rayDir } as any` bypasses type checking. This is a pre-existing issue from F19 and not introduced by F23, but it is worth noting. The correct type is `Ray` from `@dimforge/rapier3d-compat`.

- **[L2] Module-level mutable state in EffectManager (`nextEffectId`, line 39)**
  The `let nextEffectId = 0` counter is module-scoped. If multiple `EffectManager` instances were ever mounted (unlikely but possible during HMR), IDs could collide. Using `useRef` for the counter inside the component would be safer. Not a practical issue in production.

- **[L3] No texture disposal mechanism in SpriteAnimator.ts**
  The `textureCache` Map grows monotonically. There is no `dispose()` or `clearCache()` function. For the current sprite count (~30 textures), this is fine. If the sprite count grows significantly, a cleanup function should be added to prevent GPU memory leaks on scene transitions.

- **[L4] Backward-compat functions `loadSpritesheet()` and `updateSpriteUV()` are exported but unused**
  These deprecated shims are documented as "will be removed in T04" but remain in the codebase. No code imports them. They should be removed in the polish pass to reduce dead code.

- **[L5] `attackPressed` condition uses timer comparison (Mel.tsx:157)**
  `attackPressed: ctrl.shoot && attackTimer.current > 0.25` fires only during the first 0.05s of the 0.3s attack timer. This works as a "first frame only" approximation but is fragile and delta-dependent. A cleaner approach would be a `lastShootPressed` ref pattern (same as `lastJumpPressed`).

- **[L6] EffectManager checks for states not in AnimState (`affection`, `jump_on_owner`)**
  Lines 103-105 of `EffectManager.tsx` check for `"affection"` and `"jump_on_owner"` states, but these are not in the current `AnimState` type union. These checks are dead code that will never trigger. No runtime error since the comparison is just a string match against `playerState`.

### Informational

- **[I1] Manifest data (`SpriteManifest`) is typed but not loaded at runtime**
  `getFrameSpriteEntry()` accepts a `SpriteManifest` parameter, but no code currently loads `manifest.json` at runtime. The manifest is used as documentation for the asset pipeline. This is fine for now -- the function is available for future per-frame sprite size adjustment.

- **[I2] All sprites are "right" direction only**
  Facing left is handled by flipping `scale.x` (Mel.tsx:187), which is the correct approach per the manifest's `flipX` convention. No issue here, just noting the design.

## Checklist Results

- [x] TypeScript types are correct (one pre-existing `as any` in Rapier, not from F23)
- [x] No circular dependencies between modules
- [x] SpriteAnimator API is clean and well-typed
- [x] AnimationStateMachine priorities are correct per the plan
- [x] Mel.tsx integrates both systems correctly (with caveats on damaged/dead inputs)
- [x] Physics/controls logic is preserved in Mel.tsx (unchanged from F19)
- [x] EffectManager spawns effects at correct times (dust, stars)
- [x] HUD portrait works with fallback (`onError` sets `portraitError` state)
- [x] Projectile has proper fallback for missing bark_wave sprites (`hasBarkSprites` check)
- [x] No security issues (no user input interpolated into URLs, no innerHTML)
- [x] No memory leaks (effect pool is bounded, textures are cached not leaked)
- [x] Diagrams reflect actual implementation
- [~] Minor dead code present (deprecated compat functions, unreachable EffectManager states)

## Recommendations

1. **Prioritize M1 and M4 fixes** -- the `damaged` input logic and missing `lie_down` animation are the only items that affect visible gameplay behavior.
2. **Wire `dead` input (M2)** when the game-over flow is polished in a future feature.
3. **Remove deprecated compat functions (L4)** in the next cleanup pass.
4. Consider adding a `disposeCache()` export to `SpriteAnimator` for scene-level cleanup.

## Files Reviewed

1. `packages/frontend/src/game/systems/SpriteAnimator.ts`
2. `packages/frontend/src/game/systems/AnimationStateMachine.ts`
3. `packages/frontend/src/game/entities/Mel.tsx`
4. `packages/frontend/src/game/entities/EffectSprite.tsx`
5. `packages/frontend/src/game/systems/EffectManager.tsx`
6. `packages/frontend/src/game/systems/HUD3D.tsx`
7. `packages/frontend/src/game/entities/Projectile.tsx`
8. `docs/diagrams/F23-architecture.mmd`
9. `docs/diagrams/F23-journey.mmd`
10. `packages/frontend/public/sprites/mel/manifest.json`
11. `packages/frontend/src/game/scenes/GameScene3D.tsx` (integration context)
