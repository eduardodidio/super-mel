# QA Report -- F23

**Verdict:** PASS

## Test Results

- [PASS] **TypeScript compiles without errors** -- `pnpm --filter @super-mel/frontend typecheck` ran `tsc --noEmit` with zero errors.
- [PASS] **SpriteAnimator loads individual textures, not grid-based** -- `loadSprites()` loads each sprite by name from `/sprites/mel/<name>.png` using `THREE.TextureLoader`. No grid/atlas UV math. Per-frame textures are cached in a `Map<string, THREE.Texture>`.
- [PASS] **AnimationStateMachine covers all required states** -- The `AnimState` type union covers: `idle`, `walk`, `run`, `jump_rise`, `jump_air`, `jump_fall`, `jump_land`, `attack_prep`, `attack_1`, `attack_2`, `attack_end`, `hurt_light`, `hurt_medium`, `hurt_heavy`, `death`, `sit`, `lie_down`. This exceeds the acceptance criteria requirement of idle/walk/run/jump/fall/attack/hurt/death.
- [PASS] **Mel.tsx integrates both SpriteAnimator and AnimationStateMachine** -- Mel creates `new AnimationStateMachine()` in a ref, calls `stateMachine.current.update(animInput, delta)` every frame, then uses `getFrame(animName, stateTime)` to set the mesh material's `.map` texture. Physics (acceleration, friction, coyote time, variable jump height) are fully preserved.
- [PASS] **Damaged input is edge-detected** -- Mel.tsx tracks `wasInvincible` ref and computes `justDamaged = invincible && !wasInvincible.current`, meaning the `damaged` flag is true only on the single frame when `invincible` flips from false to true. This correctly prevents repeated damage triggers.
- [PASS] **Dead prop wired from GameScene3D** -- `GameScene3D.tsx` line 68 passes `dead={lives <= 0}` to the `<Mel>` component. `Mel.tsx` accepts `dead` as a prop and forwards it into `AnimInput.dead`. The state machine treats death as a terminal state.
- [PASS] **Flip X works for direction** -- `AnimationStateMachine` updates `this.facing` based on `velX` thresholds. `Mel.tsx` reads `stateMachine.current.facing` and sets `spriteRef.current.scale.x` to positive or negative `SPRITE_WIDTH` accordingly.
- [PASS] **Efeitos (effects) are separate entities** -- `EffectSprite.tsx` renders four procedural effect types (dust, stars, heart, exclamation) as independent R3F components with their own lifecycle and auto-destroy via `onComplete`.
- [PASS] **EffectManager spawns effects based on player state** -- `EffectManager.tsx` tracks `playerState` transitions and spawns dust on run/land, stars on `hurt_medium`, hearts on `affection`/`jump_on_owner`. Has a pool limit of 10 simultaneous effects.
- [PASS] **HUD portrait with life-based filter changes** -- `HUD3D.tsx` renders `<img src="/sprites/mel/ui_portrait.png">` with CSS filter that varies: no filter at 3 lives, sepia+saturate at 2 lives, sepia+saturate+hue-rotate at 1 life. Graceful fallback via `onError` handler hides the portrait if PNG is missing.
- [PASS] **Projectile has bark_wave sprite with fallback** -- `Projectile.tsx` checks `ANIMATIONS["bark_wave"]` availability via `useMemo`. If sprites are loaded, it uses `getFrame("bark_wave", lifeRef.current)` on a `planeGeometry`. If not, it falls back to the original glowing sphere with torus ring.
- [PASS] **Diagrams exist and are syntactically valid Mermaid** -- `F23-architecture.mmd` uses `flowchart TB` with proper subgraphs and edges. `F23-journey.mmd` uses `stateDiagram-v2` with valid state transitions. Both are well-structured.
- [PASS] **No regressions in existing functionality** -- Physics constants (MOVE_SPEED, JUMP_FORCE, etc.) are unchanged. Camera, chunks, projectile manager, and background decor remain wired in GameScene3D. The deprecated `loadSpritesheet()` and `updateSpriteUV()` shims are kept for backward compatibility.
- [PASS] **lie_down animation defined in SpriteAnimator** -- Present at lines 95-100 of `SpriteAnimator.ts` with frames `["lie_down"]`, fps 4, loop true. Corresponding `lie_down.png` exists in the sprites directory.
- [PASS] **Fallbacks for missing sprites** -- `loadSprites()` resolves even on error, then fills missing entries with the fallback texture. `getFrame()` chain: cached texture -> fallback texture -> load on demand. HUD portrait has `onError` handler. Projectile has sphere fallback.
- [PASS] **All referenced sprite PNGs exist** -- All 19 sprite names referenced in ANIMATIONS definitions have corresponding `.png` files in `public/sprites/mel/`. Additionally, `ui_portrait.png` used by HUD exists.
- [PASS] **Manifest.json is well-formed** -- Contains 35 sprite entries with proper `file`, `group`, `sourceSize`, and `anchor` fields. All groups (idle, walk, run, jump, attack, hurt, death, special, ui) are defined with metadata.

## Gaps / Follow-up Items

1. **EffectManager is NOT wired into GameScene3D** -- The `EffectManager` component exists and is fully functional, but `GameScene3D.tsx` does not import or render it. This is a known gap (noted in the task plan) and does not constitute a failure. A follow-up task should add `<EffectManager playerX={...} playerY={...} playerState={...} playerGrounded={...} playerVelX={...} />` to `GameScene3D.tsx`. This requires exposing `playerState` and `playerGrounded` from `Mel.tsx` upward (likely via a new callback or Zustand store field).

2. **onAttackFrame not wired in GameScene3D** -- `Mel.tsx` accepts an `onAttackFrame` callback that fires on the `bark_fire` frame event, but `GameScene3D.tsx` does not pass it. Currently attacks are triggered by `ProjectileManager` reading `ctrl.shoot` directly, so this is not a regression, but the new event-driven approach is not yet integrated. Low priority follow-up.

3. **damageLevel is hardcoded to 1** -- In `Mel.tsx` line 168, `damageLevel` is always set to `1`, meaning `hurt_medium` and `hurt_heavy` animations will never trigger from normal gameplay. This is acceptable for now since the game only has one damage source (collision), but a future enemy/hazard system should compute the actual damage level.

4. **No per-frame sprite size adjustment** -- `SpriteAnimator.ts` exports `getFrameSpriteEntry()` which can return per-frame source sizes from the manifest, but `Mel.tsx` does not use it. The sprite mesh stays at a fixed `SPRITE_WIDTH x SPRITE_HEIGHT` regardless of the current frame's native dimensions. This may cause visual stretching for sprites with very different aspect ratios (e.g., `lie_down` at 130x68 vs `idle_right` at 101x138). Not blocking, but a polish item.

5. **EffectManager references states not in AnimState** -- `EffectManager.tsx` checks for `playerState === "affection"` and `playerState === "jump_on_owner"`, but these are not in the `AnimState` type union. These effects will never trigger currently. The sprites exist in the manifest, but the state machine does not handle them. Low priority -- these are likely future states for pet interaction features.

## Retrospective Notes

- The architecture is clean and well-separated: `SpriteAnimator` handles texture loading/caching, `AnimationStateMachine` handles state logic, `Mel.tsx` orchestrates both. This separation will make future animation additions straightforward.
- The fallback system is robust at multiple levels (texture cache, HUD portrait, projectile visuals), ensuring the game remains playable even when sprite assets are missing.
- The edge-detection pattern for damage (`wasInvincible` ref) is a good pattern that prevents animation flickering.
- Deprecated compatibility shims (`loadSpritesheet`, `updateSpriteUV`) show good migration awareness -- they log warnings while keeping older code paths from breaking.
- The manifest.json is comprehensive and well-structured, serving as a single source of truth for sprite metadata.
