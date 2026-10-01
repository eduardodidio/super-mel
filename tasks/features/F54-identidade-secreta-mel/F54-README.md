# Feature F54 -- Identidade Secreta da Mel (End-of-Level Ceremony)

**Status:** done
**Owner:** @architect
**PRD:** inline
**Backlog:** New feature -- end-of-level cutscene system
**Depends on:** F42 (Fim de fase + Checkpoints), F49 (Campanha Mundo 1), F23/F29 (Sprites system)

## Goal

Replace the abrupt 1.5s celebration + instant transition to the result screen with a scripted cutscene that plays after Mel reaches the goal. The cutscene tells the story of Mel's secret identity: she is a superhero dog with a cape who, after completing a level, sneaks back home, removes her cape behind a hiding spot, and greets her owner Rafa as a normal dog -- inspired by Perry the Platypus from Phineas and Ferb.

## Problem

Currently, when Mel collides with the goal entity, `levelCompleting` is set to `true`, a `jump_on_owner.png` celebration sprite is shown at the goal position for 1.5 seconds, and then the scene transitions directly to `"levelclear"`. This is functional but lacks personality and narrative depth. The game needs an end-of-level ceremony that reinforces Mel's character and rewards the player with a charming, replayable cutscene.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/systems/CutsceneEngine.ts` | Generic timeline-based cutscene engine -- drives a sequence of scripted steps with timing, callbacks, and state tracking |
| `packages/frontend/src/game/scenes/EndLevelCutscene.tsx` | React Three Fiber component that renders the end-of-level cutscene scene: hiding spot, house, Rafa, animated Mel, cape removal, fade out |
| `packages/frontend/src/game/entities/Rafa.tsx` | Rafa character component -- voxel-style boy mesh built from THREE primitives, with idle/hug/happy state display |
| `packages/frontend/src/game/entities/HidingSpot.tsx` | Bush/doghouse hiding spot component -- Mel walks behind it and emerges without cape |
| `packages/frontend/src/game/entities/MelHouse.tsx` | Mel's home -- simple house mesh with door that opens |
| `packages/frontend/public/sprites/mel/mel_nocape.png` | Mel sprite variant without cape (for cutscene exit from hiding spot) |
| `packages/frontend/public/sprites/mel/mel_sneaky.png` | Mel looking sideways suspiciously (optional, for cape removal moment) |
| `docs/diagrams/F54-architecture.mmd` | Architecture diagram |
| `docs/diagrams/F54-journey.mmd` | User journey diagram |

### Modified Files

| File | Change |
|------|--------|
| `packages/frontend/src/game/hooks/useGameState.ts` | Add `"cutscene"` to `GameScene` union type; add `cutsceneType` field and `startCutscene()` action |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Replace the 1.5s setTimeout in `handleGoalReached` with a transition to the cutscene scene |
| `packages/frontend/src/game/Game3D.tsx` | Render `EndLevelCutscene` when `scene === "cutscene"` and `cutsceneType === "end_level"`; handle cutscene completion -> transition to `"levelclear"` |
| `packages/frontend/src/game/systems/SpriteAnimator.ts` | Add "walk_nocape" and "sneaky" animation definitions for the cutscene-only Mel variants |

### Key Design Decisions

1. **Generic CutsceneEngine:** A reusable timeline engine that defines cutscenes as an array of `CutsceneStep` objects with `{ id, duration, onStart, onUpdate, onEnd }`. The engine tracks elapsed time, advances steps, and supports skipping. This investment pays off for future cutscenes (world intro, boss intro, ending).

2. **Separate scene, not overlay:** The cutscene runs as its own R3F scene (`scene === "cutscene"`) rather than being layered on top of the gameplay scene. This avoids physics/rendering conflicts and allows a clean camera setup with a simple 2D-ish side-view camera focused on the cutscene stage.

3. **Voxel-style Rafa built from primitives:** Like the Goal entity (which builds a voxel person from box geometries), Rafa is built from `boxGeometry` primitives -- no external 3D model needed. This keeps the art style consistent and avoids asset pipeline complexity.

4. **Sprite-based Mel in cutscene:** Mel is rendered as a sprite (using SpriteAnimator) during the cutscene, walking from right to left, then switching to nocape variant. This reuses the existing sprite system and avoids needing a 3D Mel model.

5. **Cutscene is skippable:** The player can press any key or tap to skip the cutscene and go directly to the result screen. A small "Pressione para pular" hint appears after 1 second.

6. **Cape as a visual prop:** The cape is a simple colored plane attached to Mel's sprite that gets "removed" (hidden) when she walks behind the hiding spot. The cape then appears as a small folded object behind the hiding spot.

7. **Cutscene flow replaces existing celebration:** The existing 1.5s `setTimeout` + `jump_on_owner.png` celebration in `handleGoalReached` is replaced. The goal collision now sets `levelCompleting = true` + transitions to `scene: "cutscene"`. The cutscene itself, upon completion, transitions to `scene: "levelclear"`.

## Cutscene Sequence (Timeline)

| Step | Duration | Description |
|------|----------|-------------|
| 0 | 0.5s | Camera pans to the cutscene stage (house, bush, door). Mel appears from right side walking left |
| 1 | 1.5s | Mel walks toward the hiding spot (bush/doghouse). Uses walk_right sprites flipped |
| 2 | 0.8s | Mel walks behind the hiding spot. Sprite becomes occluded (z-order behind bush mesh) |
| 3 | 1.0s | Behind the bush: Mel's sprite switches to "sneaky" look (eyes peeking left/right). Small cape drop animation |
| 4 | 0.5s | Mel emerges from the other side of the bush as "normal Mel" (nocape variant) |
| 5 | 1.2s | Normal Mel walks toward the house door |
| 6 | 0.5s | Door opens. Mel enters |
| 7 | 1.5s | Inside view: Rafa crouches down, Mel jumps up (affection/jump_on_owner sprite). Heart particles |
| 8 | 1.0s | Fade to black. Transition to levelclear scene |
| **Total** | **~8.5s** | Full cutscene duration (skippable at any point) |

## Waves

- **Wave 0**: F54-T01, F54-T02, F54-T03 (CutsceneEngine + Rafa entity + HidingSpot/House meshes -- independent components)
- **Wave 1**: F54-T04, F54-T05 (Mel nocape sprites + state/flow changes in useGameState -- independent)
- **Wave 2**: F54-T06 (EndLevelCutscene scene assembly -- depends on all above)
- **Wave 3**: F54-T07 (Integration with goal collision + Game3D wiring + diagrams -- depends on T06)

### Dependency Graph

```
T01 (CutsceneEngine) ---------+
                               |
T02 (Rafa entity) ------------+---> T06 (EndLevelCutscene scene)
                               |         |
T03 (HidingSpot + MelHouse) --+         |
                               |         +---> T07 (Integration + wiring + docs)
T04 (Mel nocape sprites) -----+         |
                               |         |
T05 (useGameState + flow) ----+---------+
```

## Global Acceptance Criteria

- [ ] After Mel reaches the goal in level mode, a cutscene plays instead of the abrupt 1.5s celebration
- [ ] Cutscene shows Mel walking to a hiding spot, removing cape, emerging as normal dog
- [ ] Cutscene shows Mel entering a house and greeting Rafa (new character)
- [ ] Cutscene ends with fade to black and transitions to the existing level clear screen
- [ ] Cutscene is skippable (any key / tap) -- skipping goes directly to levelclear
- [ ] "Pressione para pular" hint appears after 1s of cutscene
- [ ] Rafa is rendered as a voxel-style boy from box primitives (consistent with Goal entity style)
- [ ] Hiding spot is a bush or doghouse mesh that occludes Mel's sprite
- [ ] House has a door that animates open
- [ ] Mel uses nocape sprite variant after emerging from hiding spot
- [ ] Heart particles appear during the hug moment
- [ ] CutsceneEngine is generic and reusable for future cutscenes
- [ ] Infinite mode is not affected (no cutscene in infinite/daily/test modes)
- [ ] Campaign levels work correctly with cutscene flow
- [ ] Editor test levels work correctly (cutscene plays, then result screen)
- [ ] No regressions in existing gameplay, menus, or level flow
- [ ] TypeScript compiles with no errors
- [ ] Existing jump_on_owner.png is repurposed in the cutscene hug moment (step 7)

## Diagrams

- `docs/diagrams/F54-architecture.mmd` -- CutsceneEngine, EndLevelCutscene, state flow, component relationships
- `docs/diagrams/F54-journey.mmd` -- User journey: reach goal -> cutscene plays -> skip or watch -> result screen
