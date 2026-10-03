# F56: Editor Mario Maker -- Enemies + Camera 3D + Play-test from Cursor

**Status:** done
**Created:** 2026-10-01
**Backlog:** B-07 (extension) + B-08 (partial)

## Goal

Transform the level editor into a Mario Maker 2-style creation tool with five
major improvements:

1. **Enemy palette** -- place Aspirador/Pombo/Abelha from F43 directly in the editor
2. **Camera 3D controls** -- WASD pan, scroll zoom, middle-click drag (replace fixed camera)
3. **Test-from-cursor** -- "TESTAR DAQUI" button to spawn Mel at editor cursor position
4. **Seamless edit-play-edit** -- full editor state preserved in sessionStorage across test runs
5. **Level resize** -- dynamic width/height adjustment from the top bar UI

## Architecture Impact

### Modified files

| File | Change |
|------|--------|
| `packages/frontend/src/game/scenes/EditorUI.tsx` | New INIMIGOS tab, enemy subtype dropdown, TESTAR DAQUI button, width/height inputs, camera info display |
| `packages/frontend/src/game/scenes/EditorWrapper.tsx` | Enemy tool state, state serialization/restoration, test-from-cursor logic, level resize handlers |
| `packages/frontend/src/game/scenes/EditorScene3D.tsx` | Camera controls (WASD/scroll/middle-drag), dynamic grid/click-plane, enemy tool handling, hover color for enemies |

### No new files

All changes are modifications to existing editor components. No new standalone
components are required.

### No shared type changes

`EntityType` already includes `"enemy"` and `EnemySubtype` is already defined.
`EditorTool` union in EditorUI.tsx gets new entries for the enemy tools.

## Wave Manifest

```
Wave 0 (setup -- parallel):
  F56-T01  Enemy palette in EditorUI + EditorTool types
  F56-T02  Camera 3D controls in EditorScene3D

Wave 1 (features -- parallel, depends on Wave 0):
  F56-T03  Enemy placement logic in EditorWrapper + EditorScene3D
  F56-T04  Test-from-cursor (TESTAR DAQUI)
  F56-T05  Level resize (width/height controls)

Wave 2 (integration -- parallel, depends on Wave 1):
  F56-T06  Editor state preservation (sessionStorage serialize/restore)
  F56-T07  Diagrams + docs + README update
```

## Dependency Graph

```
F56-T01 (enemy UI) ----+
                        +--> F56-T03 (enemy placement logic) --+
F56-T02 (camera)  ------+                                      |
                        +--> F56-T04 (test from cursor) -------+--> F56-T06 (state preservation)
                        |                                      |
                        +--> F56-T05 (level resize) -----------+
                                                               |
                                                               +--> F56-T07 (docs)
```

- T01 and T02 are independent (UI palette vs 3D camera) -- Wave 0
- T03 needs T01 (enemy EditorTool types) and touches EditorScene3D (coordinate with T02)
- T04 needs T02 (camera must be controllable so cursor position is meaningful)
- T05 needs T02 (grid/click-plane resize must work with the new camera)
- T06 needs T03/T04/T05 (must serialize all new state including camera position, level dimensions)
- T07 needs all above complete for accurate diagrams

## Acceptance Criteria

### Enemy palette
- [ ] New "INIMIGOS" tab visible between ESPECIAIS and IMG in the left palette
- [ ] 3 enemy buttons: Aspirador (A), Pombo (P), Abelha (B) with red background
- [ ] Clicking an enemy button selects it as the active tool
- [ ] Enemy entities appear in the 3D scene as red boxes with subtype letter
- [ ] Eraser tool removes enemy entities at the target position
- [ ] Enemy entities are included in buildLevelDataV2() output
- [ ] Level test mode spawns the correct enemy subtypes from placed entities

### Camera 3D controls
- [ ] WASD or arrow keys pan the camera (when not focused on text input)
- [ ] Mouse scroll wheel zooms in/out (changes camera Z or orthographic zoom)
- [ ] Middle-click drag pans the camera
- [ ] Camera is clamped to level bounds (cannot go off into infinity)
- [ ] Camera position/zoom displayed in the top bar info section

### Test-from-cursor
- [ ] "TESTAR DAQUI" button appears next to "TESTAR" in the top bar
- [ ] Clicking it stores the current hover position as spawn override
- [ ] On test start, Mel spawns at cursor position instead of spawn entity
- [ ] On return to editor, original spawn point is preserved (not overwritten)

### State preservation
- [ ] All editor state serialized to sessionStorage before entering test mode
- [ ] On editor mount (return from test), state is restored from sessionStorage
- [ ] Restored state includes: blocks, entities, selectedTool, currentZ, levelName, customAssets, cameraPosition, level dimensions
- [ ] SessionStorage is cleared after successful restore

### Level resize
- [ ] Width and Height number inputs visible in the top bar
- [ ] Min: 16x8, Max: 200x40
- [ ] Shrinking shows confirmation if blocks would be removed
- [ ] Grid and click plane resize dynamically to match new dimensions
- [ ] buildLevelDataV2() respects the explicit width/height

## Diagrams

- `docs/diagrams/F56-architecture.mmd` -- editor component data flow
- `docs/diagrams/F56-journey.mmd` -- user journey through edit/test/resize flows
