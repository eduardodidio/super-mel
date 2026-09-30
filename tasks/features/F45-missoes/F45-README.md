# Feature F45 -- Missoes por Fase + Missoes do Modo Infinito

**Status:** done
**Owner:** @architect
**PRD:** inline (B-04 + B-22)
**Backlog:** B-04 (Missoes escondidas por fase, estilo Kirby), B-22 (Missoes do modo infinito, 3 ativas por vez)
**Depends on:** F42 (Fim de fase + Checkpoints -- done, merged to homolog)

## Goal

Add two mission systems that give players concrete objectives beyond "reach the goal" or "run as far as possible":

1. **Level missions (B-04):** Each level can define up to 3 missions in `LevelDataV2.missions[]` (field already exists). Missions are tracked during gameplay and displayed on the LevelClearOverlay result screen. Examples: "collect 30 coins", "no damage", "find hidden bone", "finish under 60s", "break all wood blocks".

2. **Infinite mode missions (B-22):** A rotating pool of 3 active missions tracked across infinite-mode runs. Examples: "fly 5s without touching ground", "break 20 blocks in one run", "collect 50 coins", "reach 300m without damage". Completed missions reward coins, advance a "Mel level" bar in the menu, and rotate in a new mission from the pool.

## Problem

Currently, levels end with a simple result screen showing coins/time/deaths/stars (F42), but there is no per-level objective system. The star calculation is basic (1=complete, 2=zero deaths, 3=zero deaths+coins). There are no missions, no replay incentive beyond stars, and no long-term goals in infinite mode.

The `Mission` interface and `LevelDataV2.missions[]` field already exist in `shared/types.ts` but are completely unused -- no code reads, evaluates, or displays them.

## Architecture

### Core Design: GameEventBus + MissionTracker

The central architectural decision is a **GameEventBus** -- a lightweight typed event emitter that GameScene3D fires into on every gameplay action (coin collected, block destroyed, damage taken, distance reached, etc.). Both mission systems subscribe to this bus.

**Why an event bus and not direct Zustand mutations:**
- Missions need to react to many different gameplay events (coins, blocks, damage, time, distance, bones, flight time) -- wiring each one directly into Zustand would create a tangled web of dependencies.
- The event bus decouples "what happened in the game" from "what cares about it." Level missions, infinite missions, and future systems (achievements, analytics) all subscribe independently.
- The bus is a simple TypeScript EventTarget/mitt pattern -- no new dependencies.

### Mission Condition Schema

The existing `Mission.condition` field is `Record<string, unknown>`. We formalize it into a typed condition schema:

```typescript
type MissionConditionType =
  | "collect_coins"       // { count: number }
  | "no_damage"           // {} (complete level without taking damage)
  | "find_bone"           // {} (collect a bone entity in the level)
  | "time_limit"          // { seconds: number }
  | "break_blocks"        // { blockType?: BlockType; count: number }
  | "fly_duration"        // { seconds: number } (cumulative or continuous)
  | "reach_distance"      // { meters: number }
  | "no_damage_distance"  // { meters: number } (reach distance without damage)
  | "stomp_enemies";      // { count: number }

interface MissionCondition {
  type: MissionConditionType;
  params: Record<string, unknown>;
}
```

Level missions use `LevelDataV2.missions[].condition` parsed as `MissionCondition`. Infinite missions use a predefined pool of `MissionCondition` definitions.

### New Files

| File | Task | Purpose |
|------|------|---------|
| `packages/frontend/src/game/systems/GameEventBus.ts` | T01 | Typed event emitter for gameplay events (coin, block, damage, distance, bone, fly, stomp) |
| `packages/frontend/src/game/systems/MissionTracker.ts` | T02 | Pure-logic engine: evaluates `MissionCondition` against accumulated event counters; shared by both level and infinite missions |
| `packages/frontend/src/game/hooks/useLevelMissions.ts` | T03 | Hook that reads `LevelDataV2.missions[]`, creates a MissionTracker, subscribes to GameEventBus, exposes completion state to LevelClearOverlay |
| `packages/frontend/src/game/hooks/useInfiniteMissions.ts` | T04 | Hook that manages the 3-active-mission pool for infinite mode, persists progress in localStorage (and progress backend via `data.infiniteMissions`), tracks Mel level |
| `packages/frontend/src/game/systems/MissionToast.tsx` | T05 | Toast notification component rendered in Game3D overlay: shows "Mission Complete!" with description when a mission is fulfilled mid-gameplay |

### Modified Files

| File | Task(s) | Changes |
|------|---------|---------|
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | T01 | Emit events to GameEventBus on: coin collected, block destroyed, damage taken, distance milestone, heart collected, bone collected, fly state change |
| `packages/frontend/src/game/scenes/LevelClearOverlay.tsx` | T03 | Display level missions with completion checkmarks below the existing stats; missions affect star calculation (3 stars = all missions complete) |
| `packages/frontend/src/game/systems/HUD3D.tsx` | T04, T05 | Show active infinite missions as small progress badges (bottom-left) during infinite mode gameplay |
| `packages/frontend/src/game/hooks/useGameState.ts` | T04 | Add `melLevel: number` field for display in menu; add `infiniteMissionsVersion: number` for reactivity |
| `packages/frontend/src/game/Game3D.tsx` | T03, T04, T05 | Wire useLevelMissions, useInfiniteMissions hooks; render MissionToast overlay; show Mel level in menu |
| `packages/frontend/src/game/hooks/useProgressSync.ts` | T04 | Sync `data.infiniteMissions` and `data.melLevel` alongside totalCoins |
| `packages/shared/src/types.ts` | T02 | Add `MissionConditionType` and `MissionCondition` types; tighten `Mission.condition` type from `Record<string, unknown>` to `MissionCondition` |

### Key Design Decisions

1. **GameEventBus as singleton module:** A module-level instance (not React context, not Zustand) keeps it fast and framework-agnostic. GameScene3D emits; hooks subscribe. Cleanup on unmount.

2. **MissionTracker is pure logic, no React:** It accepts events and returns completion state. This makes it testable and reusable by both level and infinite mission hooks.

3. **Star calculation upgrade:** Currently stars are: 1=complete, 2=zero deaths, 3=zero deaths+coins. With missions, 3 stars = all missions complete (if level has missions). Levels without missions keep the old calculation for backward compatibility.

4. **Infinite mission pool stored in localStorage:** The active 3 missions and their progress persist across sessions via `localStorage` key `supermel_infinite_missions`. For registered players, they also sync to the backend progress `data.infiniteMissions` field via the existing useProgressSync mechanism.

5. **Mel level is cosmetic only (for now):** Each completed infinite mission gives XP. Mel level is displayed in the menu as a badge. Future features (loja, unlocks) can gate content on Mel level. For F45, it is purely a progress indicator.

6. **Bone entity is NOT implemented in F45:** The `find_bone` mission type checks for bone collection events, but the actual Bone entity component (rendering, collision) is out of scope. The event bus fires `bone_collected` and levels can define `find_bone` missions, but they require a Bone entity to be renderable -- this is tracked as a follow-up or part of F49/B-05.

7. **No new backend routes:** All mission data lives in the existing `Progress.data` JSON field. Level missions are defined in `LevelDataV2.missions[]` which is already in the level JSON. No schema migration needed.

## Waves

### Wave 0 (parallel -- no interdependencies)
- **F45-T01:** GameEventBus + wire emissions in GameScene3D
- **F45-T02:** MissionCondition types + MissionTracker engine

### Wave 1 (depends on T01 + T02; T03 and T04 are independent of each other)
- **F45-T03:** Level missions hook + LevelClearOverlay integration
- **F45-T04:** Infinite missions hook + HUD badges + Mel level + menu display

### Wave 2 (depends on T03 + T04)
- **F45-T05:** MissionToast overlay + final wiring in Game3D

### Dependency Graph

```
T01 (GameEventBus + emissions) ──────┬──> T03 (Level missions + result screen)
                                     │
T02 (MissionCondition + Tracker) ────┤
                                     │
                                     ├──> T04 (Infinite missions + HUD + Mel level)
                                     │
                                     └──> T05 (MissionToast + Game3D wiring)
                                          [depends on T03 + T04]
```

## Global Acceptance Criteria

### GameEventBus (T01)
- [ ] `GameEventBus.ts` exports a typed event emitter with events: `coin_collected`, `block_destroyed`, `damage_taken`, `distance_reached`, `heart_collected`, `bone_collected`, `fly_tick`, `stomp_enemy`, `level_complete`, `run_start`, `run_end`
- [ ] GameScene3D emits all relevant events during gameplay
- [ ] Event bus is reset on run start (level or infinite)

### MissionTracker (T02)
- [ ] `MissionConditionType` and `MissionCondition` types added to `shared/types.ts`
- [ ] `Mission.condition` type tightened from `Record<string, unknown>` to `MissionCondition`
- [ ] MissionTracker accepts an array of missions and evaluates completion against accumulated event counters
- [ ] All condition types implemented: `collect_coins`, `no_damage`, `find_bone`, `time_limit`, `break_blocks`, `fly_duration`, `reach_distance`, `no_damage_distance`, `stomp_enemies`

### Level Missions (T03)
- [ ] `useLevelMissions` hook reads `LevelDataV2.missions[]` on level start
- [ ] Mission completion state displayed on LevelClearOverlay with checkmarks
- [ ] Star calculation updated: 3 stars = all missions complete (when missions exist)
- [ ] Levels without missions keep backward-compatible star calculation
- [ ] Mission completion persisted via progress backend `data.levelMissions[levelId]`

### Infinite Missions (T04)
- [ ] Pool of at least 10 predefined infinite mission definitions
- [ ] 3 missions active at a time, displayed as progress badges in HUD during infinite mode
- [ ] Completed mission rewards coins (amount defined per mission)
- [ ] Completed mission rotates out and a new one rotates in from pool
- [ ] Mel level incremented on each mission completion; displayed in menu
- [ ] State persisted in localStorage and synced via useProgressSync

### MissionToast (T05)
- [ ] Toast notification appears mid-gameplay when a mission is completed
- [ ] Shows mission description + "COMPLETA!" text
- [ ] Auto-dismisses after 2s with fade-out animation
- [ ] Multiple toasts queue (not overlap)
- [ ] Toast appears in both level and infinite modes

### General
- [ ] TypeScript compiles with no errors
- [ ] No regressions in level mode (F42 goal, checkpoint, result screen)
- [ ] No regressions in infinite mode (game over, daily challenge)
- [ ] No regressions in editor (mission field in LevelDataV2 remains optional)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| GameEventBus could leak listeners if not cleaned up | Each hook returns cleanup function in useEffect; bus.reset() on unmount |
| MissionTracker performance with many events per frame | Event counters are simple increments; no per-frame allocations; tracker evaluates lazily on query |
| `Mission.condition` type change could break existing level JSON | `MissionCondition` is additive; existing levels have `missions: undefined` or `missions: []`; no breaking change |
| Bone entity does not exist yet | `find_bone` condition is defined but requires Bone entity from B-05; missions using it will not be completable until then; document this clearly |
| Infinite mission pool exhaustion | Pool is circular; completed missions can re-appear after all others are seen; seed randomizes order |

## Diagrams

- `docs/diagrams/F45-architecture.mmd`
- `docs/diagrams/F45-journey.mmd`
