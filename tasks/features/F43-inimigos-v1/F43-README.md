# Feature F43 -- Inimigos v1: 3 tipos + pisao

**Status:** done
**Owner:** @architect
**PRD:** inline (B-13)
**Backlog:** B-13 (Inimigos v1 -- 3 tipos + pisao)
**Depends on:** F37 (LevelData v2 + Editor com Entidades) -- completed and merged into homolog.

## Goal

Add 3 enemy types themed as dog annoyances -- **Aspirador-robo** (patrols platform, turns at edge), **Pombo** (flies in sine wave), **Abelha** (chases slowly within radius) -- with stomp-to-defeat and projectile-kill mechanics, kid-friendly "fly away" death, coin drops, and integration into both infinite mode (ChunkGenerator difficulty curve) and level mode (LevelDataV2 entities).

## Problem

The game currently has no enemies at all. The only hazards are lava blocks, fall deaths, and gaps. Without enemies, platforming lacks tension and variety. The entity type `"enemy"` already exists in `EntityType` and `ENTITY_TYPES` (shared/types.ts) and is routed to `otherEntities` in `LevelSceneConverter.ts`, but nothing renders or manages enemy instances. The stomp mechanic (a platformer staple) does not exist, and the Bola do Infinito projectile only interacts with blocks, not entities.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/entities/EnemyVacuum.tsx` | Aspirador-robo enemy -- patrols platform, turns at edge, damages Mel on lateral contact |
| `packages/frontend/src/game/entities/EnemyPigeon.tsx` | Pombo enemy -- flies in sine wave pattern, damages Mel on contact |
| `packages/frontend/src/game/entities/EnemyBee.tsx` | Abelha enemy -- chases Mel slowly within a detection radius |
| `packages/frontend/src/game/systems/EnemyManager.tsx` | Manages enemy lifecycle: spawns from level data or chunk generation, handles stomp/projectile collisions, drops coins, plays defeat effects |

### Modified Files

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Add `EnemySubtype` type (`"vacuum" \| "pigeon" \| "bee"`); document that enemy EntityData uses `props.subtype` |
| `packages/frontend/src/game/systems/ChunkGenerator.ts` | Add `EnemySpawnData` to `Chunk`; generate enemy spawns based on difficulty curve (chunk index); export enemy spawn logic |
| `packages/frontend/src/game/systems/LevelSceneConverter.ts` | Extract enemy entities from `otherEntities` into a new `enemies` field on `SceneObjects`; parse `props.subtype` |
| `packages/frontend/src/game/systems/ChunkRenderer.tsx` | Pass enemy data from chunks to EnemyManager |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Integrate EnemyManager; wire stomp callback (bounce Mel up), damage callback, and projectile-hit callback; pass enemy data from level and infinite modes |
| `packages/frontend/src/game/entities/Mel.tsx` | Add `onStompBounce` callback; when stomp is detected externally, apply upward velocity to Mel's RigidBody; expose RigidBody ref or bounce method |
| `packages/frontend/src/game/systems/ProjectileManager.tsx` | Extend collision handling to detect hits on enemy RigidBodies (name starts with `"enemy-"`) and call an `onEnemyHit` callback |
| `packages/frontend/src/game/systems/TestLevelData.ts` | Add enemy entities to the test level V2 for testing all 3 types |

### Key Design Decisions

1. **Entity-component pattern for enemies:** Each enemy type is a standalone React component (EnemyVacuum, EnemyPigeon, EnemyBee) with its own AI loop, physics body, and visual. EnemyManager orchestrates lifecycle (spawn, defeat, despawn) and delegates rendering to the specific component.

2. **Stomp detection via collision normals:** When Mel collides with an enemy, the collision is classified as a "stomp" if Mel's velocity is downward (vel.y < -1) AND the collision contact point is on the top of the enemy (relative Y > 0.3). Lateral or bottom contact = damage to Mel.

3. **Kid-friendly defeat:** Defeated enemies do not die violently. They play a "fly away" animation (scale shrink + upward translation + sparkle particles) and then despawn. This is implemented as an internal state in each enemy component.

4. **EnemyManager centralization:** Instead of scattering collision logic across components, EnemyManager holds the enemy state array, handles defeat (stomp or projectile), triggers coin drops via the existing `spawnDroppedCoins` function, and removes defeated enemies from the active list.

5. **ChunkGenerator integration:** Enemies are added to the `Chunk` interface as `enemies: EnemySpawnData[]`. The spawn probability scales with `difficulty` (chunk index / 25, capped at 1). No enemies spawn in chunks 0-2 (safe zone). Aspirador starts appearing first, then Pombo at difficulty > 0.3, then Abelha at difficulty > 0.6.

6. **Enemy props in EntityData:** For level mode, enemies use the existing `EntityData` with `type: "enemy"` and `props: { subtype: "vacuum" | "pigeon" | "bee" }`. The editor already has an "enemy" EntityType -- a future task will add UI for selecting subtype. For now, enemies in level data default to "vacuum" if no subtype is specified.

7. **Performance budget:** Each enemy uses a simple box/sphere geometry (no complex meshes). Enemies beyond a 30-unit distance from the camera are culled. The target is 10 on-screen enemies with no FPS drop.

## Enemy Specifications

### Aspirador-robo (Vacuum Robot)
- **Behavior:** Patrols horizontally on its platform. Walks at 2 units/s. Turns around when reaching a platform edge (no ground below) or hitting a wall.
- **Visual:** Rounded box body (0.8x0.5x0.6) in metallic gray, with a small red light on top (emissive sphere). Slightly bobs up and down.
- **Damage:** Lateral contact = 1 damage to Mel (triggers existing hurt animation).
- **Defeat:** Stomp (bounce Mel up with JUMP_FORCE * 0.7) or Bola do Infinito.
- **Coin drop:** 1-2 coins on defeat.
- **Spawn (infinite):** From chunk index 3+ (difficulty > 0.12). Most common enemy.

### Pombo (Pigeon)
- **Behavior:** Flies in a sine wave pattern along the X axis. Speed 3 units/s, amplitude 2 units, period 3s. Does not chase Mel.
- **Visual:** Small body (0.5x0.4x0.4) in gray-blue with tiny wing planes that rotate. Slightly more complex than vacuum but still simple geometry.
- **Damage:** Any contact = 1 damage to Mel.
- **Defeat:** Stomp (tricky since it moves vertically) or Bola do Infinito.
- **Coin drop:** 2-3 coins on defeat (harder to defeat = better reward).
- **Spawn (infinite):** From chunk index 8+ (difficulty > 0.32). Airborne, spawns at y = platform height + 3-5.

### Abelha (Bee)
- **Behavior:** Hovers in place until Mel is within a 6-unit detection radius, then chases Mel at 2.5 units/s. Stops chasing if Mel leaves a 10-unit radius. Always maintains a slight vertical hover oscillation.
- **Visual:** Small body (0.4x0.3x0.3) in yellow-black stripes (alternating material colors). Two transparent wing planes with high-speed rotation. Emissive yellow glow.
- **Damage:** Any contact = 1 damage to Mel.
- **Defeat:** Stomp (hardest -- it moves toward you) or Bola do Infinito.
- **Coin drop:** 2-3 coins on defeat.
- **Spawn (infinite):** From chunk index 15+ (difficulty > 0.6). Rarest and most dangerous.

## Waves

- **Wave 0**: F43-T01, F43-T02, F43-T03 (Three enemy type components -- fully independent, parallel)
- **Wave 1**: F43-T04, F43-T05 (EnemyManager + Stomp/Projectile collisions -- can be parallel: manager is core orchestration, collisions modify Mel and ProjectileManager)
- **Wave 2**: F43-T06, F43-T07 (ChunkGenerator integration + GameScene3D wiring + TestLevelData -- depends on T01-T05)

### Dependency Graph

```
T01 (EnemyVacuum) ──────────────┐
                                │
T02 (EnemyPigeon) ──────────────┼──> T04 (EnemyManager) ──────────┐
                                │                                  │
T03 (EnemyBee) ─────────────────┘                                  ├──> T06 (ChunkGenerator + infinite spawn)
                                                                   │
                                     T05 (Stomp + Projectile) ─────┤
                                                                   │
                                                                   └──> T07 (GameScene3D wiring + TestLevelData)
```

## Global Acceptance Criteria

- [ ] 3 enemy types (Aspirador-robo, Pombo, Abelha) render in the 3D scene with distinct visuals
- [ ] Each enemy type has its own AI behavior (patrol, sine wave, chase)
- [ ] Lateral/bottom contact with any enemy damages Mel (triggers existing hurt/invincibility)
- [ ] Stomping an enemy from above defeats it and bounces Mel upward
- [ ] Bola do Infinito hitting an enemy defeats it
- [ ] Defeated enemies play a kid-friendly "fly away" animation with sparkles
- [ ] Defeated enemies drop 1-3 coins (using existing DroppedCoin system)
- [ ] In infinite mode, enemies spawn via ChunkGenerator based on difficulty curve
- [ ] No enemies spawn in chunks 0-2 (safe zone)
- [ ] Enemy spawn frequency and type variety increase with chunk index
- [ ] In level mode, enemies spawn from LevelDataV2 entities with `type: "enemy"` and `props.subtype`
- [ ] Test level (TestLevelData) includes all 3 enemy types for testing
- [ ] No FPS drop with 10 enemies on screen (simple geometries, distance culling)
- [ ] Enemy entities appear in `otherEntities` / new `enemies` field of SceneObjects
- [ ] TypeScript compiles with no errors
- [ ] No regressions in infinite mode, level mode, editor, or menu

## Diagrams

- `docs/diagrams/F43-architecture.mmd` -- Enemy system architecture: entity components, EnemyManager, collision flow, ChunkGenerator integration
- `docs/diagrams/F43-journey.mmd` -- User journey: encounter enemy, stomp or shoot, defeat animation, coin drop, or take damage
