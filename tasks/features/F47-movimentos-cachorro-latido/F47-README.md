# Feature F47 -- Movimentos de Cachorro + Latido

**Status:** done
**Owner:** @architect
**PRD:** inline (B-20 + B-14)
**Backlog:** B-20 (Cavar, Buscar, Farejar), B-14 (Latido)
**Depends on:** F43 (Inimigos v1) -- MUST be completed first. The bark mechanic (B-14) applies stun/flee to enemies introduced in F43. Without enemies, bark has no AI targets and testing is incomplete.

## Goal

Add four distinctly "dog" abilities to Mel: Cavar (dig through dirt/sand), Buscar (ball returns like a boomerang collecting coins), Farejar (sniff to highlight hidden items), and Latido (bark to stun enemies and reveal item_block contents). These are the verbs that distinguish Super Mel from generic platformers -- they express the dog fantasy through gameplay.

## Problem

Currently Mel's moveset is generic platformer: run, jump, fly, shoot. The only "dog" element is the bark wave sprite on the projectile, which is purely cosmetic. The four abilities in this feature add dog-specific interactions: digging underground, fetching the ball back, sniffing out secrets, and barking to affect enemies and the environment. Additionally, the ball (Bola do Infinito) currently disappears after 10 blocks with no return mechanic, and there is no way to discover hidden item_blocks without shooting blindly.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/systems/BarkSystem.tsx` | Bark wave effect component -- expanding ring that applies stun/flee to enemies in radius, shakes nearby item_blocks |
| `packages/frontend/src/game/systems/SniffHighlight.tsx` | Sniff highlight overlay -- renders glowing outlines around item_blocks and bones within radius when farejar is active |
| `packages/frontend/src/game/systems/DigSystem.ts` | Dig logic module -- determines if the block below Mel is diggable, performs the removal, spawns bone/coin drops |

### Modified Files

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Add `diggable: boolean` flag to `BLOCK_PROPERTIES` (true for dirt, sand). Add `"bark"` to Controls-related types if shared. |
| `packages/frontend/src/game/hooks/useControls.ts` | Add `bark: boolean` control mapped to KeyX / gamepad button 3 (Y) / touch button C. |
| `packages/frontend/src/game/systems/TouchControls3D.tsx` | Add bark (C) button to the touch layout next to the shoot (B) button. |
| `packages/frontend/src/game/entities/Mel.tsx` | Add dig detection (crouch + attack on diggable ground), add sniff state (hold down while standing for 1s), add bark cooldown timer, expose new state flags via `stateRef`. |
| `packages/frontend/src/game/systems/AnimationStateMachine.ts` | Add `"bark"`, `"dig"`, `"sniff"` states to `AnimState`. Add `barkPressed`, `digging`, `sniffing` to `AnimInput`. Wire transitions. |
| `packages/frontend/src/game/systems/SpriteAnimator.ts` | Add `bark`, `dig`, `sniff` animation definitions (reuse existing sprites as placeholders: `attack_1`/`attack_2` for bark, `crouch` for dig, `sit` for sniff). |
| `packages/frontend/src/game/entities/Projectile.tsx` | Add `returnMode` prop: when true, projectile reverses direction after reaching max range instead of expiring, and collects coins on the return path. |
| `packages/frontend/src/game/systems/ProjectileManager.tsx` | Wire `returnMode` flag to Projectile. Add coin collection callback for return-path coins. |
| `packages/frontend/src/game/systems/EffectManager.tsx` | Add bark wave and sniff glow effect triggers. |
| `packages/frontend/src/game/entities/EffectSprite.tsx` | Add `"bark_wave"` and `"sniff_glow"` effect types. |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Wire BarkSystem and SniffHighlight components. Wire dig callbacks to ChunkRenderer. Pass bark/sniff state to EffectManager. |
| `packages/frontend/src/game/systems/ChunkRenderer.tsx` | Expose a `getBlockAt(x, y, z)` method on the imperative handle to query block type at a position (needed for dig check). |

### Key Design Decisions

1. **Bark is a separate control (X key), not overloading attack (Z).** The attack key fires the Bola do Infinito. Bark is a short-range area effect with different gameplay purpose (crowd control + item reveal vs. ranged destruction). This avoids input confusion and allows both to coexist.

2. **Dig requires crouch + attack (Down + Z) on diggable ground.** This reuses existing controls without adding a new key. The condition is: `crouching === true`, `ctrl.shoot === true`, and the block directly below Mel is `diggable`. The animation plays the crouch sprite (placeholder until dig sprites are created).

3. **Sniff (Farejar) uses hold-down for 1s while standing still.** Same input as crouching (Down) but triggers after a 1-second hold while `velX === 0` and `grounded`. This makes it a deliberate action the player chooses, not something triggered accidentally while crouching-and-moving.

4. **Boomerang ball is an upgrade flag, not the default.** The Projectile default behavior (expire after 10 blocks) remains. A `returnMode` boolean toggles the boomerang behavior. For now this is hardcoded to `true` to ship the mechanic; a future Shop feature (F44) will make it a purchasable upgrade.

5. **BLOCK_PROPERTIES gets a `diggable` flag.** Only `dirt` and `sand` are diggable. This is cleaner than hardcoding block types in the dig logic, and future block types can opt in by setting `diggable: true`.

6. **Bark affects enemies via a callback pattern.** BarkSystem does not import enemy components directly. Instead, GameScene3D passes a `onBarkWave(x, y, radius)` callback that the enemy system (from F43) subscribes to. This keeps the coupling loose and makes bark testable without enemies present.

7. **Placeholder sprites.** Since dedicated dig/bark/sniff sprites do not exist yet, we reuse existing sprites as placeholders (crouch for dig, attack frames for bark, sit for sniff). A future sprite feature can swap them in without code changes.

## Waves

- **Wave 0**: F47-T01, F47-T02, F47-T03 (Bark input + BarkSystem, Dig logic + BLOCK_PROPERTIES, Boomerang ball -- all independent subsystems)
- **Wave 1**: F47-T04, F47-T05 (Sniff/Farejar highlight, Animation state machine + sprites -- sniff depends on ASM states from T05 but can be parallelized since T05 only adds state declarations)
- **Wave 2**: F47-T06, F47-T07 (Wire everything in GameScene3D + touch controls, Integration testing + polish -- depends on all above)

### Dependency Graph

```
T01 (Bark input + BarkSystem) ────────────────┬──> T06 (Wire in GameScene3D + touch)
                                               |
T02 (Dig logic + BLOCK_PROPERTIES) ────────────┤
                                               |
T03 (Boomerang ball / Buscar) ─────────────────┤
                                               |
T04 (Sniff / Farejar highlight) ──────────┬────┤
                                          |    |
T05 (AnimationStateMachine + sprites) ────┘    └──> T07 (Integration + polish)
```

## Global Acceptance Criteria

- [ ] New bark control (X key / gamepad Y / touch C) is registered in `useControls` and `TouchControls3D`
- [ ] Pressing bark triggers a bark wave visual effect (expanding ring centered on Mel)
- [ ] Bark wave stuns/flees enemies within radius for 1.5s (tested via callback interface; actual enemy behavior depends on F43)
- [ ] Bark wave causes nearby item_blocks to shake (visual feedback that they have content)
- [ ] Bark has a 1s cooldown between uses
- [ ] Crouch + attack on dirt/sand removes the block below Mel and spawns 0-2 bone/coin drops
- [ ] Dig only works on blocks with `BLOCK_PROPERTIES[type].diggable === true`
- [ ] Dig does nothing on non-diggable blocks (stone, iron, brick, etc.)
- [ ] Holding down for 1s while standing still activates sniff mode
- [ ] Sniff mode highlights item_blocks and bone entities within a radius with a glowing outline
- [ ] Sniff mode deactivates when Mel moves or releases down
- [ ] Bola do Infinito returns to Mel after reaching max range (boomerang behavior)
- [ ] Returning ball collects coins in its path
- [ ] Returning ball does not damage blocks on the way back
- [ ] AnimationStateMachine has `bark`, `dig`, `sniff` states with correct transitions
- [ ] SpriteAnimator has placeholder animations for bark, dig, sniff
- [ ] Touch controls have a bark (C) button alongside the existing attack (B) button
- [ ] All four abilities work in both infinite mode and level mode
- [ ] No regressions in existing attack, movement, or flight mechanics
- [ ] TypeScript compiles with no errors

## Diagrams

- `docs/diagrams/F47-architecture.mmd` -- Dog abilities data flow: controls -> Mel -> BarkSystem/DigSystem/SniffHighlight, Projectile boomerang path, enemy stun callback
- `docs/diagrams/F47-journey.mmd` -- User journey: player discovers each ability (bark -> dig -> sniff -> fetch), how they combine in gameplay
