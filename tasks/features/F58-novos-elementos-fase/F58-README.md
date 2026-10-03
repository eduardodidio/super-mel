# Feature F58 -- Novos Elementos de Fase: Mola + Plataforma Movel + Espinhos

**Status:** done
**Created:** 2026-10-01
**Backlog:** B-09 (lote 1 -- 3 elementos que mais mudam o level design)

## Goal

Add 3 new level elements -- Spring (Mola), Moving Platform (Plataforma Movel),
and Spikes (Espinhos) -- that are both playable in-game AND placeable in the
level editor. These elements dramatically expand level design possibilities by
introducing vertical launchers, moving ride surfaces, and hazardous obstacles.

## Architecture Impact

### Shared Types (`packages/shared/src/types.ts`)
- Extend `EntityType` union with: `"spring"` | `"moving_platform"` | `"spikes"`
- Extend `ENTITY_TYPES` array with the 3 new types
- Spring props: `{ bounceForce?: number }` (default: 18, higher than JUMP_FORCE=10)
- MovingPlatform props: `{ direction: "horizontal" | "vertical", speed?: number, range?: number }` (defaults: speed=3, range=4)
- Spikes props: `{ facing?: "up" | "down" | "left" | "right" }` (default: "up")

### New Entity Components
- `packages/frontend/src/game/entities/Spring.tsx` -- RigidBody(fixed) + sensor collider + upward impulse on Mel contact + squash/stretch animation
- `packages/frontend/src/game/entities/MovingPlatform.tsx` -- RigidBody(kinematicPosition) + oscillating translation via useFrame + Mel rides via physics contact
- `packages/frontend/src/game/entities/Spikes.tsx` -- RigidBody(fixed) + sensor collider + damage callback (same pattern as lava)

### Mel Handle Extension
- Add `springBounce(force: number)` to `MelHandle` interface in `Mel.tsx`
- Pattern: same as `stompBounce()` but with configurable Y velocity

### LevelSceneConverter (`packages/frontend/src/game/systems/LevelSceneConverter.ts`)
- Add `"spring"`, `"moving_platform"`, `"spikes"` cases to the entity switch
- New arrays in `SceneObjects`: `springs[]`, `movingPlatforms[]`, `spikes[]`

### GameScene3D (`packages/frontend/src/game/scenes/GameScene3D.tsx`)
- Import and render `Spring`, `MovingPlatform`, `Spikes` from sceneObjects
- Wire `handleDamage` to Spikes, wire `melRef.springBounce` to Spring

### Editor (`packages/frontend/src/game/scenes/EditorUI.tsx` + `EditorScene3D.tsx`)
- New "MECA" tab in EditorUI palette for mechanical elements
- New EditorTool entries: `"entity_spring"`, `"entity_moving_platform"`, `"entity_spikes"`
- Property inputs: MovingPlatform direction/speed/range dropdowns, Spikes facing dropdown
- ENTITY_VISUALS entries for editor markers

## Dependency Graph

```
T01 (shared types) ----+---> T02 (Spring entity) ----+
                        |                              |
                        +---> T03 (MovingPlatform) ----+---> T06 (GameScene3D integration)
                        |                              |
                        +---> T04 (Spikes entity) ----+
                        |
                        +---> T05 (LevelSceneConverter + Editor)
                                                       |
                        T06 depends on T02, T03, T04 --+
                        T07 depends on T05, T06 -------+---> T07 (Editor entity visuals + props UI)
                                                       |
                                                       +---> T08 (Docs + Diagrams)
```

## Waves

- **Wave 0**: F58-T01 (shared types extension)
- **Wave 1**: F58-T02, F58-T03, F58-T04, F58-T05 (Spring, MovingPlatform, Spikes entities + LevelSceneConverter in parallel)
- **Wave 2**: F58-T06 (GameScene3D integration -- depends on T02, T03, T04, T05)
- **Wave 3**: F58-T07, F58-T08 (Editor full integration + Docs/Diagrams in parallel)

## Global Acceptance Criteria

- [ ] EntityType in shared types includes "spring", "moving_platform", "spikes"
- [ ] Spring bounces Mel upward with configurable force (default 18, higher than jump)
- [ ] Spring has squash/stretch animation on contact
- [ ] Moving Platform oscillates horizontally or vertically with configurable speed/range
- [ ] Mel can ride Moving Platform (stands on top, moves with it)
- [ ] Moving Platform does not push Mel through walls
- [ ] Spikes deal 1 heart damage on contact (same as lava)
- [ ] Spikes can face up/down/left/right via configurable facing prop
- [ ] All 3 elements render correctly in GameScene3D from level data
- [ ] All 3 elements are placeable in the level editor
- [ ] Editor shows property inputs for MovingPlatform (direction, speed, range) and Spikes (facing)
- [ ] Editor markers visually distinguish the 3 new elements
- [ ] LevelSceneConverter correctly extracts all 3 element types from entities
- [ ] Elements work in level mode (campaign + custom levels)
- [ ] No TypeScript compilation errors
- [ ] No console errors or warnings at runtime
- [ ] All diagrams and documentation updated

## Diagrams

- `docs/diagrams/F58-architecture.mmd` -- component data-flow for new elements
- `docs/diagrams/F58-journey.mmd` -- user journey (gameplay + editor placement)
