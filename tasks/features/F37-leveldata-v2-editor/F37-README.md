# Feature F37 -- LevelData v2 + Editor com Entidades

**Status:** planned
**Owner:** @architect
**PRD:** inline (B-06 + B-07)
**Backlog:** B-06 (LevelData v2), B-07 (Editor entities)

## Goal

Evolve the LevelData format to version 2 with a generic entity system (coins, hearts, goal, checkpoint, spawn, signs, bones, enemies) and add a tabbed palette with entity placement/removal to the level editor.

## Problem

The current LevelData (v1, implicitly versioned) only supports a 2D block grid and a single spawn point. Coins and hearts exist only in the ChunkGenerator runtime (procedural) and TestLevelData (hardcoded), with no way to persist them in user-created levels. The editor only places blocks and a spawn marker. To build meaningful levels with collectibles, goals, and checkpoints, we need a structured entity layer in LevelData and editor tools to place them.

## Architecture

### New Types (`packages/shared/src/types.ts`)

```typescript
// Entity system
export type EntityType =
  | "coin"
  | "heart"
  | "goal"
  | "checkpoint"
  | "spawn"
  | "item_block_content"
  | "sign"
  | "bone"
  | "enemy";

export interface EntityData {
  type: EntityType;
  x: number;
  y: number;
  props?: Record<string, unknown>;
}

export interface Mission {
  id: string;
  description: string;
  condition: Record<string, unknown>;
}

// v2 format
export interface LevelDataV2 {
  version: 2;
  grid: BlockCell[][];
  width: number;
  height: number;
  entities: EntityData[];
  theme?: BackgroundTheme;
  missions?: Mission[];
}

// Original format (kept for migration reference)
// LevelData (v1) has no version field, has spawnPoint: {x, y}
```

### New Files

| File | Purpose |
|------|---------|
| `packages/shared/src/levelMigration.ts` | `migrateLevelData(data: unknown): LevelDataV2` -- auto-detects v1 and applies defaults |
| `packages/frontend/src/game/systems/LevelSceneConverter.ts` | `levelToSceneObjects(level: LevelDataV2): SceneObjects` -- unified converter used by TestLevelData, editor preview, campaign, and ChunkRenderer |

### Modified Files

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Add EntityType, EntityData, Mission, LevelDataV2; keep LevelData as LevelDataV1 alias |
| `packages/backend/src/routes/levels.ts` | Add validation for v2 format on POST/PUT; auto-migrate v1 on GET |
| `packages/frontend/src/game/scenes/EditorUI.tsx` | Replace single palette with tabbed UI (Blocos, Itens, Especiais) |
| `packages/frontend/src/game/scenes/EditorScene3D.tsx` | Add entity placement/removal, visual markers for entities |
| `packages/frontend/src/game/systems/TestLevelData.ts` | Convert to use LevelDataV2 format, or wire through levelToSceneObjects |
| `packages/frontend/src/game/systems/ChunkRenderer.tsx` | Accept LevelDataV2 through levelToSceneObjects for editor preview mode |

### Key Design Decisions

1. **Spawn as entity:** The v1 `spawnPoint` field is migrated into an entity `{ type: "spawn", x, y }` in the entities array. This unifies all positional objects into one system. The `levelToSceneObjects` converter extracts it back into a structured `spawnPoint` field for consumption.

2. **item_block content via entity:** Instead of modifying BlockCell, an entity of type `"item_block_content"` at the same (x,y) as an item_block specifies what it drops (`props.content: "coin" | "heart" | "power_up"`). Default is "coin" if no entity exists.

3. **Backward compatibility:** `migrateLevelData()` detects v1 (no `version` field, has `spawnPoint`) and produces a valid v2 object. All read paths call this function. The Prisma `data: Json` column stores whatever version was saved; read-time migration ensures consumers always get v2.

4. **Structural validation only (backend):** Validate shape (version, grid dimensions, entities array with valid EntityType) but do not deep-validate positions. Client-side editor prevents invalid placements.

5. **LevelData type alias:** The existing `LevelData` type is renamed to `LevelDataV1` for clarity. A new union type `LevelDataAny = LevelDataV1 | LevelDataV2` is exported for migration input typing. The `Level` interface's `data` field becomes `LevelDataV2` (post-migration).

## Waves

- **Wave 0**: F37-T01                    (types + migration -- everything depends on this)
- **Wave 1**: F37-T02, F37-T03, F37-T04  (converter, backend validation, editor UI -- parallel, all depend on T01)
- **Wave 2**: F37-T05, F37-T06           (entity placement in 3D, wire converter -- parallel, depend on T02/T04)

### Dependency Graph

```
T01 (types + migration) ────┬──> T02 (levelToSceneObjects) ──┬──> T06 (wire TestLevel + Chunk)
                            ├──> T03 (backend validation)    │
                            └──> T04 (editor palette tabs) ──┴──> T05 (entity placement 3D)
```

## Global Acceptance Criteria

- [ ] LevelDataV2 interface exported from `@super-mel/shared`
- [ ] EntityType union covers: coin, heart, goal, checkpoint, spawn, item_block_content, sign, bone, enemy
- [ ] `migrateLevelData()` correctly converts v1 data (no version field, has spawnPoint) to v2
- [ ] `migrateLevelData()` passes through valid v2 data unchanged
- [ ] `levelToSceneObjects()` produces blocks, coins, hearts, and spawnPoint from a LevelDataV2
- [ ] Backend POST/PUT validates v2 format and rejects malformed data with 400
- [ ] Backend GET auto-migrates v1 data to v2 in response
- [ ] Editor palette has 3 tabs: Blocos, Itens, Especiais
- [ ] Blocos tab contains all 11 block types + eraser
- [ ] Itens tab contains: coin, heart, item_block (with content dropdown)
- [ ] Especiais tab contains: spawn, checkpoint, goal
- [ ] Entities are visually represented in the editor (colored shapes/icons)
- [ ] Entities can be placed and removed in EditorScene3D
- [ ] No regressions in gameplay, editor save/load, or chunk generation
- [ ] TypeScript compiles with no errors across all packages

## Diagrams

- `docs/diagrams/F37-architecture.mmd` -- LevelData v2 data flow (shared types -> migration -> converter -> editor/game)
- `docs/diagrams/F37-journey.mmd` -- User journey: open editor -> switch tab -> place entity -> save -> play level
