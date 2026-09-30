# Feature F49 -- Campanha Mundo 1 + Ossinhos + Placas de Tutorial

**Status:** planned
**Owner:** @architect
**PRD:** inline (B-03 + B-05 + B-10)
**Backlog:** B-03 (Campanha 8-10 fases + mapa de mundo + tutorial 1-1), B-05 (Colecionavel ossinho), B-10 (Placas de tutorial)
**Depends on:** F42 (Fim de fase + Checkpoints -- DONE), F43 (Inimigos v1 -- NOT YET DONE)

## Dependency Note on F43

F43 (Inimigos v1) is listed as a dependency but is NOT yet implemented. This feature is designed so that all code (bones, signs, world map, level loader, campaign JSON files) can be built and tested without enemies. Campaign levels will include enemy entity slots in their JSON, but the `LevelSceneConverter` already routes unknown entity types to `otherEntities` which are silently ignored in rendering. Once F43 ships, enemy entities in campaign levels will render automatically. No code changes to F49 are needed when F43 lands.

## Goal

Create the first campaign ("Mundo 1") with 8 authored levels, a world map scene with sequential node unlocking, collectible bone entities hidden in each level, and tutorial sign entities that show control hints via proximity balloons. Levels are stored as LevelDataV2 JSON in `public/levels/campaign/` and are loaded by a new LevelLoader utility.

## Problem

The game currently has no authored content -- only procedural infinite mode, a hardcoded test level, and community-created levels. There is no progression structure, no curated first-time experience, and no tutorial. The `jump_on_owner.png` goal, checkpoints, and star ratings from F42 exist but have no meaningful levels to use them. The entity types "bone" and "sign" are declared in `EntityType` but have no rendering components.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/entities/Bone.tsx` | Bone collectible entity -- renders a bone sprite/mesh, sensor collision, collection callback |
| `packages/frontend/src/game/entities/Sign.tsx` | Tutorial sign entity -- renders a post with text/icon, shows proximity balloon |
| `packages/frontend/src/game/scenes/WorldMapScene.tsx` | World map overlay scene -- grid of level nodes, sequential unlock, stars/bones display |
| `packages/frontend/src/game/systems/LevelLoader.ts` | Utility to fetch and cache campaign level JSONs from `public/levels/campaign/` |
| `packages/frontend/public/levels/campaign/manifest.json` | Campaign manifest: ordered list of levels with metadata (name, theme, file) |
| `packages/frontend/public/levels/campaign/1-1.json` through `1-8.json` | 8 campaign level files in LevelDataV2 format |

### Modified Files

| File | Change |
|------|--------|
| `packages/frontend/src/game/hooks/useGameState.ts` | Add `"worldmap"` to `GameScene` union; add `levelBones`, `campaignLevelIndex` fields; add `addBone()` action; extend `startLevel()` to accept `campaignIndex` |
| `packages/frontend/src/game/systems/LevelSceneConverter.ts` | Extract "bone" and "sign" entities from `otherEntities` into dedicated `bones` and `signs` arrays in `SceneObjects` |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Render `Bone` and `Sign` components from sceneObjects; pass bone collection to `addBone()`; show "PROXIMA FASE" button on levelclear for campaign |
| `packages/frontend/src/game/scenes/LevelClearOverlay.tsx` | Show bones collected, "PROXIMA FASE" button for campaign levels |
| `packages/frontend/src/game/Game3D.tsx` | Add "CAMPANHA" button to menu; render `WorldMapScene` when `scene === "worldmap"`; route worldmap -> level -> levelclear -> worldmap |
| `packages/frontend/src/game/systems/HUD3D.tsx` | Show bone counter in level mode (when bones exist in the level) |
| `packages/frontend/src/game/scenes/EditorUI.tsx` | Add "bone" to Itens palette tab, "sign" to Especiais palette tab |
| `packages/frontend/src/game/hooks/useProgressSync.ts` | Sync `campaignProgress` (levels cleared, stars, bones) to backend `progress.data` |

### Key Design Decisions

1. **Campaign levels as static JSON files.** Levels live in `public/levels/campaign/` and are fetched at runtime via the LevelLoader. This avoids database dependency for authored content and allows levels to be versioned in git. A `manifest.json` file lists the levels in order with metadata.

2. **World map as an HTML overlay scene (not 3D).** The world map is a 2D HTML overlay (like LevelSelectOverlay, GameOverOverlay) rather than a 3D scene. This is faster to build, easier to style, and consistent with the existing overlay architecture. Nodes are rendered as a vertical list or simple grid with connecting lines.

3. **Sequential unlock.** A level unlocks when the previous level has been completed (1 star minimum). Level 1-1 is always unlocked. Progress is stored in `useGameState` (session) and synced to `progress.data.campaign` in the backend via `useProgressSync`.

4. **Bone entity as Coin clone.** `Bone.tsx` follows the exact same RigidBody sensor pattern as `Coin.tsx`. Visual difference: a bone-shaped mesh (two small spheres connected by a cylinder) in white, with a golden glow. 3 bones per level, hidden in hard-to-reach places.

5. **Sign entity with proximity trigger.** `Sign.tsx` uses a larger sensor collider (radius ~3 blocks) to detect Mel's approach. When triggered, it renders an HTML overlay balloon with the sign's text (from `entity.props.text`). The balloon disappears when Mel walks away. No physics interaction -- signs are purely informational.

6. **LevelClearOverlay gains "PROXIMA FASE" button.** When completing a campaign level, the result screen shows a "PROXIMA FASE" button that advances to the next campaign level (or returns to world map if it was the last level). The existing "REPETIR" and "MENU" buttons remain.

7. **Campaign progress structure.** Stored in `progress.data.campaign`:
   ```json
   {
     "campaign": {
       "levelsCleared": ["1-1", "1-2"],
       "stars": { "1-1": 3, "1-2": 2 },
       "bones": { "1-1": [true, true, false], "1-2": [false, false, false] }
     }
   }
   ```

8. **Level 1-1 as tutorial.** The first level uses Sign entities to teach each control before requiring it: walk (arrows), jump (space), fly (hold space), attack (Z), checkpoint (walk through). Each sign shows a short text like "Aperte ESPACO para pular" with an icon.

## Waves

- **Wave 0**: F49-T01, F49-T02       (Bone entity + Sign entity -- independent components)
- **Wave 1**: F49-T03, F49-T04       (LevelSceneConverter updates + Editor palette -- parallel, depend on T01/T02)
- **Wave 2**: F49-T05, F49-T06       (WorldMapScene + LevelLoader + campaign state, HUD bone counter -- parallel)
- **Wave 3**: F49-T07, F49-T08       (Campaign level JSONs, Wire everything into Game3D + LevelClearOverlay -- T08 depends on T05/T06)
- **Wave 4**: F49-T09                (Progress sync for campaign data)

### Dependency Graph

```
T01 (Bone entity) ─────────┬──> T03 (LevelSceneConverter) ──┬──> T05 (WorldMapScene + LevelLoader + state)
                            │                                │
T02 (Sign entity) ──────────┤                                ├──> T06 (HUD bone counter)
                            │                                │
                            └──> T04 (Editor palette) ───────┤
                                                             │
                                                             ├──> T07 (Campaign level JSONs)
                                                             │
                                                             └──> T08 (Wire Game3D + LevelClear)
                                                                    │
                                                                    └──> T09 (Progress sync)
```

## Global Acceptance Criteria

- [ ] `Bone.tsx` entity renders in the 3D scene with a bone-shaped mesh and golden glow
- [ ] Bone collision with Mel triggers collection (same pattern as Coin)
- [ ] `Sign.tsx` entity renders a signpost in the 3D scene
- [ ] Sign shows a text balloon when Mel approaches (sensor range ~3 blocks)
- [ ] Sign balloon disappears when Mel moves away
- [ ] `LevelSceneConverter.ts` extracts bones and signs from entities into dedicated arrays
- [ ] Editor palette has "Osso" in Itens tab and "Placa" in Especiais tab
- [ ] Bone and Sign entities can be placed and removed in the editor
- [ ] `WorldMapScene.tsx` displays 8 level nodes with names, stars, and bone counts
- [ ] World map shows sequential unlock (locked levels are grayed out)
- [ ] Clicking an unlocked level in the world map loads and starts it
- [ ] `LevelLoader.ts` fetches campaign levels from `public/levels/campaign/*.json`
- [ ] LevelLoader caches fetched levels to avoid re-fetching
- [ ] `useGameState` has `"worldmap"` in GameScene union type
- [ ] `useGameState` tracks `levelBones` count and has `addBone()` action
- [ ] HUD shows bone counter when bones exist in the current level
- [ ] `LevelClearOverlay` shows bones collected and "PROXIMA FASE" button for campaign levels
- [ ] "PROXIMA FASE" advances to the next campaign level or returns to world map on last level
- [ ] Campaign button in main menu opens the world map
- [ ] 8 campaign levels exist as valid LevelDataV2 JSON files
- [ ] Level 1-1 uses sign entities to teach controls (walk, jump, fly, attack)
- [ ] Each level has a goal entity and at least one checkpoint
- [ ] Each level has 3 hidden bone entities
- [ ] Campaign progress (levelsCleared, stars, bones) syncs to backend via `progress.data`
- [ ] No regressions in infinite mode, editor, community levels, or existing menu
- [ ] TypeScript compiles with no errors

## Diagrams

- `docs/diagrams/F49-architecture.mmd` -- Campaign data flow: manifest -> LevelLoader -> WorldMap -> GameScene3D -> LevelClear -> progress sync
- `docs/diagrams/F49-journey.mmd` -- User journey: menu -> campanha -> world map -> select level -> play -> collect bones/signs -> goal -> result -> next level / world map
