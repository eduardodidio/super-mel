# F57: Editor QoL -- Undo/Redo + Selection + Copy/Paste

**Status:** planned
**Created:** 2026-10-01
**Backlog:** B-08

## Goal

Add essential quality-of-life features to the level editor: undo/redo,
rectangular selection, copy/paste, delete selection, and drag-move. These
capabilities transform the editor from a single-action paint tool into a
productive level-design environment.

## Problem

Currently the editor has no undo history -- any mistake requires manual
rebuilding block-by-block. There is no way to select a region of blocks,
copy a pattern, or move placed content. These gaps make level creation
tedious and error-prone, especially for larger or more complex levels.

## Architecture Impact

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/editor/useEditorHistory.ts` | Custom React hook: snapshot-based undo/redo stack (max 50), deep clone of `{ blocks, entities, spawnPoint }` |
| `packages/frontend/src/game/editor/useEditorSelection.ts` | Custom React hook: selection rectangle state, clipboard, paste mode, drag-move logic |

### Modified Files

| File | Change |
|------|--------|
| `packages/frontend/src/game/scenes/EditorUI.tsx` | Add `EditorTool = "select"` to union. Add SEL button (always visible). Add undo/redo buttons in toolbar. Show selection info in bottom bar. |
| `packages/frontend/src/game/scenes/EditorWrapper.tsx` | Integrate `useEditorHistory` for undo/redo. Integrate `useEditorSelection` for selection/clipboard/move. Wire keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Delete). |
| `packages/frontend/src/game/scenes/EditorScene3D.tsx` | Render selection rectangle overlay. Render ghost preview during paste/move. Handle drag-select and drag-move pointer interactions. |

### Key Design Decisions

1. **Snapshot-based undo (not command-based):** Each undo entry is a deep
   clone of `{ blocks: EditorBlock[], entities: EntityData[], spawnPoint }`.
   Simpler to implement than a command pattern, and the data volume is small
   (typically < 2000 blocks + < 100 entities). Max 50 snapshots, oldest
   dropped on overflow. Push snapshot BEFORE each mutating action.

2. **Selection as a separate tool:** The new `"select"` EditorTool mode has
   its own pointer interaction (drag-to-select, click-outside-to-deselect).
   It coexists with existing tools -- selecting the SEL button switches to
   selection mode, selecting any other tool exits it.

3. **Clipboard stores relative positions:** When the user copies a selection,
   blocks and entities are stored with positions relative to the selection
   origin (x1, y1). On paste, they are offset by the cursor position.

4. **Ghost preview for paste and move:** During paste mode and drag-move, a
   semi-transparent wireframe preview of the blocks follows the cursor,
   giving the user visual feedback before committing the action.

5. **All mutations flow through the same state setters:** Paste, delete, and
   move operations all use the existing `setBlocks`, `setEntities`,
   `setSpawnPoint` setters. This ensures `markDataChanged()` fires correctly
   and undo snapshots are captured consistently.

6. **Hooks separated from components:** `useEditorHistory` and
   `useEditorSelection` are standalone hooks in `game/editor/`. This keeps
   EditorWrapper lean and makes the logic testable in isolation.

## Wave Manifest

- **Wave 0:** F57-T01 (useEditorHistory hook), F57-T02 (useEditorSelection hook + select tool type)
- **Wave 1:** F57-T03 (wire undo/redo into EditorWrapper), F57-T04 (selection rectangle + drag-select in EditorScene3D), F57-T05 (keyboard shortcuts)
- **Wave 2:** F57-T06 (copy/paste + ghost preview), F57-T07 (drag-move selection)
- **Wave 3:** F57-T08 (diagrams + docs update)

### Dependency Graph

```
T01 (useEditorHistory) --------+---> T03 (wire undo/redo into EditorWrapper)
                                |         |
                                |         +---> T05 (keyboard shortcuts)
                                |         |         |
T02 (useEditorSelection + type) +---> T04 (selection rect + drag-select)
                                |         |         |
                                |         +---> T05 |
                                |                   |
                                +-------------------+---> T06 (copy/paste + ghost)
                                |                   |
                                +-------------------+---> T07 (drag-move)
                                                    |
                                                    +---> T08 (diagrams + docs)
```

## Global Acceptance Criteria

- [ ] Ctrl+Z undoes the last editor action (place block, remove block, place entity, remove entity, set spawn)
- [ ] Ctrl+Shift+Z or Ctrl+Y redoes the last undone action
- [ ] Undo/redo stack is capped at 50 snapshots; oldest dropped on overflow
- [ ] New mutating action clears the redo stack
- [ ] Undo/redo buttons visible in toolbar with disabled state when stack is empty
- [ ] "Select" tool available via SEL button in palette (always visible regardless of active tab)
- [ ] Click+drag in select mode creates a dashed rectangle selection overlay
- [ ] Selected blocks and entities are visually highlighted (brighter, outline)
- [ ] Click outside selection deselects
- [ ] Ctrl+C copies selected blocks+entities to clipboard (relative positions)
- [ ] Ctrl+V enters paste mode with ghost preview following cursor; click to place
- [ ] Delete/Backspace removes all blocks+entities within selection; confirmation if >20 elements
- [ ] Drag inside selection moves all selected blocks+entities with ghost preview
- [ ] All selection operations (paste, delete, move) push undo snapshots
- [ ] All selection operations call markDataChanged() to invalidate clear-check
- [ ] Selecting any non-select tool exits selection mode (deselects)
- [ ] TypeScript compiles without errors
- [ ] No regressions in existing editor functionality (place, erase, entities, save, test, publish)
- [ ] No regressions in existing keyboard interactions

## Diagrams

- `docs/diagrams/F57-architecture.mmd` -- hook architecture, data flow, component relationships
- `docs/diagrams/F57-journey.mmd` -- user journey: undo/redo, select, copy/paste, move flows
