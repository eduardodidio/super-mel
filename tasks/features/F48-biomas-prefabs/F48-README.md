# Feature F48 -- Biomas por distancia + Chunks prefab

**Status:** done
**Owner:** @architect
**PRD:** inline (B-23)
**Backlog:** B-23 (Biomas por distancia + chunks prefab feitos no editor)
**Depends on:** F37 (LevelData v2 + Editor com Entidades) -- completed and merged into homolog.

## Goal

Make the infinite mode visually dynamic by changing the biome (theme) every N chunks based on distance traveled, and introduce a library of hand-crafted prefab chunks (in LevelDataV2 format) that are mixed into procedural generation by difficulty range. The existing FASE TESTE becomes the first prefab. The skybox, lighting, and background decorations transition smoothly between biomes as the player progresses.

## Problem

Currently, infinite mode uses a single static theme selected from the menu. All chunks are purely procedural, producing similar-looking terrain regardless of distance. The FASE TESTE level data exists as a separate code path (`generateTestLevel()` / `generateTestLevelV2()`) and is never reused in infinite mode. There is no visual reward for traveling far -- no biome transitions, no designer-crafted level segments, and no sense of progression through the world.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/systems/BiomeManager.ts` | Pure-logic module: maps chunk index to biome (BackgroundTheme), exposes `getBiomeForChunk(chunkIndex)` and `BIOME_SEQUENCE` constant. Provides interpolation factor for smooth transitions. |
| `packages/frontend/src/game/systems/PrefabLibrary.ts` | Registry of prefab chunk data in LevelDataV2 format. Exports `getPrefabChunks(difficulty)` which returns Chunk[] filtered by difficulty range. Includes the converted FASE TESTE chunks as the first prefab set. |
| `packages/frontend/src/game/systems/BiomeTransition.tsx` | React component that wraps Skybox + Lighting + BackgroundDecor and drives smooth cross-fade between biomes using the interpolation factor from BiomeManager. |

### Modified Files

| File | Change |
|------|--------|
| `packages/frontend/src/game/systems/ChunkGenerator.ts` | New `generateChunkWithPrefabs(chunkIndex, baseSeed, prefabPool)` function that occasionally selects a prefab chunk from the pool instead of generating procedurally. Block type palette per biome for procedural chunks (e.g., desert uses sand+sandstone instead of dirt+stone). |
| `packages/frontend/src/game/systems/Skybox.tsx` | Accept optional `transitionFactor` and `nextTheme` props for cross-fade between two gradient textures during biome transitions. |
| `packages/frontend/src/game/systems/Lighting.tsx` | Accept optional `transitionFactor` and `nextTheme` props to lerp light colors and intensities during biome transitions. |
| `packages/frontend/src/game/systems/BackgroundDecor.tsx` | Accept optional `biomeTransition` props to fade decor elements (cloud color, mountain color) between biomes. |
| `packages/frontend/src/game/systems/ChunkRenderer.tsx` | In infinite mode (no `testChunks`), use `BiomeManager.getBiomeForChunk()` and `PrefabLibrary.getPrefabChunks()` when generating chunks. Pass biome info up to parent for theme transitions. |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | In infinite mode, use BiomeTransition component instead of static Skybox+Lighting. Read current biome from chunk position and pass to visual systems. |
| `packages/frontend/src/game/Game3D.tsx` | In infinite mode, allow the theme to be driven by BiomeManager instead of the static `useGameState.theme`. The menu "TEMA" button still works for level/test mode. |
| `packages/frontend/src/game/hooks/useGameState.ts` | Add `currentBiome: BackgroundTheme` and `setCurrentBiome(theme)` for tracking the active biome during infinite play without overwriting the user-selected theme. |
| `packages/shared/src/types.ts` | Add optional `difficulty?: number` field to `LevelDataV2` to tag prefab chunks with a difficulty rating (1-10). |

### Key Design Decisions

1. **Biome sequence by chunk index, not by distance.** Using `chunkIndex` (integer, deterministic) rather than continuous player X position keeps the biome assignment reproducible for a given seed. The sequence is: forest (0-9) -> desert (10-19) -> night (20-29) -> space (30-39) -> ocean (40-49) -> forest (50-59) -> ... (cycle).

2. **Transition zone = 2 chunks.** The last 2 chunks of each biome blend visually into the next biome. This means chunks 8-9 blend forest->desert, chunks 18-19 blend desert->night, etc. The `transitionFactor` is 0.0 at the start of the transition zone and 1.0 at the end.

3. **Prefab injection rate.** In the first 10 chunks (biome 0 = forest), 0% prefab. After that, every 5th chunk has a 50% chance of being a prefab from the matching difficulty range. This keeps the infinite mode feeling fresh without being entirely scripted.

4. **Block palette per biome.** Procedural chunks in the desert biome use `sand` for surface and `stone`/`iron` for underground. Night uses `stone`/`brick`. Space uses `iron`/`glass`. Ocean uses `sand`/`stone` with `water` hazards instead of `lava`. This is a simple Record<BackgroundTheme, PaletteConfig> lookup.

5. **FASE TESTE as first prefab.** The 5 chunks from `generateTestLevel()` are tagged with difficulty 1-5 (one per chunk, increasing) and registered in PrefabLibrary. This reuses existing content without any new level design.

6. **Shared type extension is minimal.** Only one optional field (`difficulty?: number`) is added to `LevelDataV2`. This allows future editor-created levels to be tagged as prefabs by setting a difficulty rating.

7. **No backend changes.** Prefab chunks are bundled client-side as static data. A future feature could fetch community-created prefabs from the backend, but that is out of scope for F48.

## Waves

- **Wave 0**: F48-T01, F48-T02        (BiomeManager + PrefabLibrary -- independent pure-logic modules)
- **Wave 1**: F48-T03, F48-T04        (ChunkGenerator biome-aware + Visual transition system -- different concerns, parallel)
- **Wave 2**: F48-T05, F48-T06        (Wire biome into GameScene + ChunkRenderer integration -- depend on all above)

### Dependency Graph

```
T01 (BiomeManager) ─────────────┬──> T05 (Wire biome into GameScene + Game3D)
                                │
T02 (PrefabLibrary) ────────────┤
                                │
T03 (ChunkGenerator biome) ─────┼──> T06 (ChunkRenderer integration)
                                │
T04 (Visual transitions) ───────┘
```

## Global Acceptance Criteria

- [ ] In infinite mode, the biome changes every 10 chunks in the sequence: forest -> desert -> night -> space -> ocean -> (repeat)
- [ ] Skybox gradient, fog, lighting colors, and background decor transition smoothly over 2 chunks at each biome boundary
- [ ] Procedural chunks use block palettes matching the current biome (e.g., sand in desert, iron in space)
- [ ] Prefab chunks from PrefabLibrary are occasionally injected into infinite mode generation
- [ ] The 5 FASE TESTE chunks are available as prefabs with difficulty ratings 1-5
- [ ] Prefab chunks respect the seeded random to be deterministic (same seed = same prefab placement)
- [ ] The menu "TEMA" button continues to work for level mode and test mode (sets initial/fixed theme)
- [ ] In infinite mode, the theme cycles automatically; the "TEMA" button has no effect or is hidden
- [ ] Daily challenge mode uses the same biome system (biome determined by chunk index)
- [ ] `LevelDataV2` accepts an optional `difficulty` field (1-10) for future editor tagging
- [ ] `BiomeManager.getBiomeForChunk(chunkIndex)` returns the correct biome and transition factor
- [ ] No regressions in level mode, test mode, editor, or daily challenge
- [ ] Performance: biome transitions do not cause frame drops (no texture recreation every frame)
- [ ] TypeScript compiles with no errors

## Diagrams

- `docs/diagrams/F48-architecture.mmd` -- BiomeManager, PrefabLibrary, ChunkGenerator flow, visual transition pipeline
- `docs/diagrams/F48-journey.mmd` -- Player journey through biomes in infinite mode
