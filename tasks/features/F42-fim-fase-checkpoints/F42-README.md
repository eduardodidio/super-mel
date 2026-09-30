# Feature F42 -- Fim de Fase + Checkpoints + Tela de Resultado

**Status:** planned
**Owner:** @architect
**PRD:** inline (B-01 + B-02)
**Backlog:** B-01 (Fim de fase: goal + tela de resultado), B-02 (Checkpoints e retry sem game over)
**Depends on:** F37 (LevelData v2 + Editor com Entidades) -- MUST be completed first. This feature consumes `EntityData`, `EntityType`, `LevelDataV2`, and `levelToSceneObjects` from F37.

## Goal

Add a proper "end of level" goal entity (the owner/dono da Mel), checkpoint entities (doghouse/casinha), a level-clear result screen with star ratings, and a level-mode respawn system where death returns Mel to the last activated checkpoint instead of triggering game over.

## Problem

Currently, phases have no defined endpoint -- they end only by game over (0 lives) or by returning to the menu. There is no goal entity, no checkpoint system, no result screen, and no distinction between "infinite mode" and "level mode" death behavior. The `jump_on_owner.png` sprite exists but is unused. The Score model in the backend already has a `levelId` field but level completions are never recorded.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/entities/Goal.tsx` | Goal entity component -- renders the owner sprite, detects Mel collision, triggers level completion |
| `packages/frontend/src/game/entities/Checkpoint.tsx` | Checkpoint entity component -- renders a doghouse mesh, detects Mel collision, activates checkpoint |
| `packages/frontend/src/game/scenes/LevelClearOverlay.tsx` | Result screen overlay -- shows level name, coins, time, hearts, deaths, 1-3 stars, buttons (Repetir, Menu) |
| `packages/frontend/src/game/hooks/useLevelTimer.ts` | Simple timer hook that tracks elapsed seconds during level play |

### Modified Files

| File | Change |
|------|--------|
| `packages/frontend/src/game/hooks/useGameState.ts` | Add `gameMode`, `levelId`, `deaths`, `lastCheckpoint`, `levelCompleting`, `levelCoins`, `levelStartTime`; add `"levelclear"` to GameScene union; modify `loseLife()` for level mode; add `startLevel()`, `setLastCheckpoint()`, `completeLevel()`, `incrementDeaths()` |
| `packages/frontend/src/game/Game3D.tsx` | Render `LevelClearOverlay` when `scene === "levelclear"`; play appropriate audio |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Accept level entities, render Goal and Checkpoint components, handle goal collision callback, handle checkpoint activation, pass `gameMode` to Mel fall-death logic |
| `packages/frontend/src/game/entities/Mel.tsx` | On fall death in level mode: respawn at `lastCheckpoint` (or spawnPoint) instead of y=8; increment deaths counter |
| `packages/shared/src/types.ts` | No changes needed (EntityType "goal" and "checkpoint" already defined in F37) |

### Key Design Decisions

1. **Game mode split:** `useGameState.gameMode` distinguishes "infinite" (current behavior -- game over at 0 lives) from "level" (infinite retries, deaths counter, checkpoint respawn). The `startLevel(levelId)` action sets mode to "level"; `resetGame()` sets mode to "infinite".

2. **Level completion flow:** Goal collision sets `levelCompleting = true`, which freezes Mel input. After a 1.5s animation beat (jump_on_owner sprite displayed at goal position), the scene transitions to "levelclear". This avoids an abrupt cut.

3. **Star calculation:** 1 star = completed, 2 stars = zero deaths, 3 stars = zero deaths + all coins collected. Simple, clear, and doesn't require per-level time targets (those come later with campaign B-03).

4. **Checkpoint state in Zustand:** `lastCheckpoint: { x, y } | null` and `deaths: number` live in useGameState alongside lives/score/coins. Checkpoint activation calls `setLastCheckpoint(x, y)`.

5. **Backend reuse:** Level clears POST to the existing `/api/scores` endpoint with `levelId`. No schema migration needed. Richer data (stars, time, deaths) is displayed client-side but persisted only when the Score model is extended in a future feature.

6. **Owner sprite as goal:** The goal entity renders using the `jump_on_owner.png` sprite (171x154, already in the sprite manifest). The "owner" figure inside the sprite serves as the visual goal. On collision, the full sprite (Mel + owner + heart) is shown as the celebration.

## Waves

- **Wave 0**: F42-T01, F42-T02        (Goal entity + Checkpoint entity -- independent components)
- **Wave 1**: F42-T03, F42-T04        (Level mode respawn + Result screen -- different concerns, parallel)
- **Wave 2**: F42-T05, F42-T06        (Wire levelclear scene + Load entities in game flow -- depend on all above)

### Dependency Graph

```
T01 (Goal entity) ──────────────┬──> T05 (levelclear scene wiring)
                                │
T02 (Checkpoint entity) ────────┤
                                │
T03 (Level mode respawn) ───────┼──> T06 (Level mode game flow)
                                │
T04 (Result screen overlay) ────┘
```

## Global Acceptance Criteria

- [ ] Goal entity renders in 3D scene at the position specified by `EntityData { type: "goal" }`
- [ ] Mel collision with goal triggers the level completion flow (freeze + animation + transition)
- [ ] `jump_on_owner.png` sprite is displayed during the goal celebration animation
- [ ] New scene `"levelclear"` exists in GameScene union type
- [ ] Result screen (LevelClearOverlay) displays: level name (or "Fase"), moedas da fase, tempo, coracoes restantes, mortes, 1-3 estrelas
- [ ] Star calculation: 1 = completed, 2 = zero deaths, 3 = zero deaths + all coins
- [ ] "Repetir" button restarts the level; "Menu" button returns to menu
- [ ] Checkpoint entity renders as a doghouse mesh at the position specified by `EntityData { type: "checkpoint" }`
- [ ] Mel passing through checkpoint activates it (visual change: glow/flag)
- [ ] Only the most recently activated checkpoint is the respawn point
- [ ] In level mode: death respawns Mel at last checkpoint (or spawn point if none) with 3 hearts and deaths+1
- [ ] In level mode: game over screen never appears (infinite retries)
- [ ] In infinite mode: death behavior unchanged (game over at 0 lives, no checkpoints)
- [ ] `useGameState.gameMode` correctly distinguishes "infinite" vs "level"
- [ ] Level clear POSTs to `/api/scores` with `levelId`
- [ ] No regressions in infinite mode gameplay, editor, or menu
- [ ] TypeScript compiles with no errors

## Diagrams

- `docs/diagrams/F42-architecture.mmd` -- Goal/Checkpoint entity flow, useGameState changes, level completion pipeline
- `docs/diagrams/F42-journey.mmd` -- User journey: start level -> play -> hit checkpoint -> die -> respawn -> reach goal -> result screen -> repeat/menu
