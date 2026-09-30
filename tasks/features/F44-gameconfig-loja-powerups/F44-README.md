# Feature F44 -- GAME_CONFIG centralizado + Loja + Power-ups

**Status:** planned
**Owner:** @architect
**PRD:** inline (B-42 + B-17 + B-18)
**Backlog:** B-42 (GAME_CONFIG centralizado), B-17 (Loja da Mel), B-18 (Power-ups temporarios)
**Depends on:** F41 (Progresso backend) -- MUST be completed first. This feature uses the Progress model and `useProgressSync` from F41 to persist purchased upgrades and equipped items across sessions.

## Goal

Centralize all gameplay constants into `GAME_CONFIG` in shared, build a Shop screen where players spend `totalCoins` on permanent upgrades (with a 2-slot equipment system like Jetpack Joyride), and extend the item_block drop system to spawn temporary power-ups beyond coins (star, coin magnet, fire ball, wings) with a HUD timer.

## Problem

Three problems converge:

1. **Duplicated constants.** `Mel.tsx` hardcodes `MOVE_SPEED`, `JUMP_FORCE`, `FLY_FORCE`, `MAX_FLY_TIME`, `CROUCH_SPEED_MULT`, etc. as local `const` values, even though `GAME_CONFIG` already exists in `shared/types.ts` with many of the same values. `Projectile.tsx` has its own `SPEED = 15`. There is no single source of truth, and no way for upgrades or Assist Mode to override these values at runtime.

2. **Coins have no destination.** `totalCoins` is persisted (localStorage + backend via F41) but there is nothing to spend them on. The player accumulates coins with no reward loop. This kills retention (Jetpack Joyride principle: "coins need a shop").

3. **item_blocks only drop coins.** The `ChunkGenerator` and `GameScene3D` item_block hit system (`spawnDroppedCoins`) only spawns `DroppedCoin` entities. There are no temporary power-ups (star, magnet, fire ball, wings) to create variety and excitement. The `invincible` flag already exists in `useGameState` but is only used by Assist Mode.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/shared/src/gameConfig.ts` | Exports `GAME_CONFIG` (moved from types.ts), `UpgradeId` type, `UPGRADE_CATALOG`, and `resolveConfig(equipped: UpgradeId[]): ResolvedConfig` -- pure function that applies upgrade overrides to base config |
| `packages/frontend/src/game/hooks/useShopState.ts` | Zustand store for shop state: `purchased: UpgradeId[]`, `equipped: [UpgradeId | null, UpgradeId | null]`, `buy(id)`, `equip(id, slot)`, `unequip(slot)`. Persisted via `useProgressSync` (F41 data field). |
| `packages/frontend/src/game/hooks/useResolvedConfig.ts` | Hook that reads `useShopState.equipped` and calls `resolveConfig()` to produce the active gameplay constants. Memoized. |
| `packages/frontend/src/game/scenes/ShopOverlay.tsx` | Shop UI overlay accessible from menu. Shows catalog, prices, purchase/equip/unequip buttons, 2 equipment slots, coin balance. |
| `packages/frontend/src/game/entities/PowerUp.tsx` | Power-up entity component -- renders a floating icon (star, magnet, fire, wings), detects Mel collision, calls `onCollect(type)` |
| `packages/frontend/src/game/hooks/usePowerUpState.ts` | Zustand store for active temporary power-ups: `activePowerUp: PowerUpType | null`, `timeRemaining: number`, `activate(type, duration)`, `tick(delta)`, `clear()` |
| `packages/frontend/src/game/systems/PowerUpHUD.tsx` | HUD element showing active power-up icon + countdown timer bar (similar to StaminaBar in HUD3D) |

### Modified Files

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Remove `GAME_CONFIG` (moved to `gameConfig.ts`). Add re-export from `gameConfig.ts` for backward compat. Add `PowerUpType` union type. |
| `packages/shared/src/index.ts` | Export new types and `resolveConfig` from `gameConfig.ts` |
| `packages/frontend/src/game/entities/Mel.tsx` | Remove all local physics constants (`MOVE_SPEED`, `MOVE_ACCEL`, `FRICTION`, etc.). Read from `useResolvedConfig()` instead. Apply active power-up effects: `wings` = unlimited fly, `star` = invincible flag, `coin_magnet` = increase collect radius. |
| `packages/frontend/src/game/entities/Projectile.tsx` | Remove local `SPEED = 15`. Read from `useResolvedConfig()`. Apply `fire_ball` power-up effect: projectile passes through blocks instead of exploding on contact. |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Spawn power-up entities from item_block hits (weighted random: 60% coins, 10% heart, 10% star, 8% magnet, 7% fire_ball, 5% wings). Wire `onPowerUpCollect` to `usePowerUpState.activate()`. Tick power-up timer in `useFrame`. Apply `coin_magnet` effect to `DroppedCoin` collect radius. |
| `packages/frontend/src/game/systems/HUD3D.tsx` | Add `PowerUpHUD` component rendering inside the HUD when a power-up is active. Show equipped upgrade icons (2 small icons near the portrait). |
| `packages/frontend/src/game/Game3D.tsx` | Add "LOJA" button to menu overlay. Render `ShopOverlay` when a new scene state `"shop"` is active (or use a boolean overlay flag to avoid adding a GameScene variant). |
| `packages/frontend/src/game/hooks/useGameState.ts` | Read `maxHearts` from `resolveConfig` instead of hardcoded `fiveHearts ? 5 : 3`. |
| `packages/frontend/src/game/hooks/useProgressSync.ts` | Include `upgrades` and `equipped` in the progress data synced to backend (already supports `data: Record<string, unknown>` via F41). |

### Key Design Decisions

1. **`resolveConfig()` is a pure function, not a hook.** It takes `equipped: UpgradeId[]` and returns a flat object with all gameplay constants. This keeps it testable and usable outside React (e.g., in workers). The hook `useResolvedConfig()` is a thin wrapper that subscribes to `useShopState` and memoizes.

2. **2 equipment slots (Jetpack Joyride model).** The player purchases upgrades permanently but can only equip 2 at a time. This creates meaningful choices ("do I want extra fly time + coin magnet, or double jump + turbo speed?") without overwhelming a kid. Slot management is simple: tap to equip into the first empty slot, tap equipped to unequip, tap another to swap.

3. **Upgrade catalog as data, not code.** `UPGRADE_CATALOG` is an array of `{ id, name, description, price, effect }` objects in the shared package. `effect` is a partial `ResolvedConfig` override (e.g., `{ maxFlyTime: 8 }` for the "fly 5s -> 8s" upgrade). Adding new upgrades requires zero code changes -- just a new catalog entry.

4. **Power-ups are entities, not coins.** Temporary power-ups from item_blocks are rendered as `PowerUp` components (sensor RigidBody, bob animation, icon texture), not as `DroppedCoin`. They don't bounce/fall -- they float in place above the item_block for 8s, then expire. Only one power-up can be active at a time (collecting a new one replaces the old).

5. **Power-up effects via refs, not state.** To avoid re-renders, power-up effects are read from `usePowerUpState.getState()` inside `useFrame`/`useGameFrame` loops. The HUD timer subscribes normally for visual updates.

6. **Shop persistence via F41 Progress.data.** Purchased upgrades (`purchased: string[]`) and equipped items (`equipped: [string|null, string|null]`) are stored in the `data` JSON field of the Progress model. The `useProgressSync` hook already syncs this field with deep merge (arrays via set-union). Guest players persist in localStorage only.

7. **No new backend routes.** The shop state piggybacks on the existing `PUT /api/progress` endpoint's `data` field. No Prisma migration needed.

8. **GAME_CONFIG moved to its own file.** To keep `types.ts` clean and avoid circular imports, `GAME_CONFIG` and related types move to `shared/src/gameConfig.ts`. A re-export in `types.ts` maintains backward compatibility.

## Upgrade Catalog (initial)

| ID | Name | Description | Price | Effect |
|----|------|-------------|-------|--------|
| `extra_heart` | 4o Coracao | Um coracao extra de vida | 500 | `{ maxHearts: 4, startHearts: 4 }` |
| `fly_boost` | Voo Estendido | Voo de 5s para 8s | 800 | `{ maxFlyTime: 8 }` |
| `coin_magnet` | Ima de Moedas | Moedas sao atraidas de mais longe | 600 | `{ coinMagnetRadius: 3.0 }` |
| `double_ball` | Bola Dupla | Atira 2 projeteis por vez | 1000 | `{ projectileCount: 2 }` |
| `double_jump` | Pulo Duplo | Permite um segundo pulo no ar | 1200 | `{ doubleJump: true }` |
| `turbo_cape` | Capa Turbo | Velocidade de corrida +25% | 700 | `{ moveSpeed: 7.5 }` |
| `gentle_fall` | Queda Leve | Gravidade reduzida ao cair | 400 | `{ fallGravityScale: 0.6 }` |

## Power-Up Types (temporary, from item_blocks)

| Type | Visual | Duration | Effect |
|------|--------|----------|--------|
| `star` | Yellow star, pulsing glow | 8s | `invincible = true`, gold tint on Mel sprite |
| `coin_magnet_temp` | Magnet icon, red/blue | 10s | Coins attracted from 4-unit radius |
| `fire_ball` | Orange flame icon | 12s | Projectile passes through blocks (no explode, no destroy) |
| `wings` | Feather/wing icon, white | 10s | Unlimited flight (flyTimer never expires) |

## Waves

- **Wave 0**: F44-T01, F44-T02 (GAME_CONFIG extraction + Shop state/persistence -- independent foundations)
- **Wave 1**: F44-T03, F44-T04, F44-T05 (Wire Mel/Projectile to resolved config + Shop UI + Power-up entities -- parallel, each depends on T01 or T02)
- **Wave 2**: F44-T06, F44-T07 (item_block power-up drops + HUD integration -- depend on T03/T04/T05)

### Dependency Graph

```
T01 (GAME_CONFIG + resolveConfig) ─────┬──> T03 (Wire Mel + Projectile to resolved config)
                                        │
                                        ├──> T05 (PowerUp entity + usePowerUpState)
                                        │
T02 (useShopState + persistence) ───────┼──> T04 (ShopOverlay UI)
                                        │
                                        ├──> T03 (needs equipped upgrades)
                                        │
                           T03 + T05 ───┼──> T06 (item_block drops power-ups)
                                        │
                      T04 + T05 + T06 ──┴──> T07 (HUD: power-up timer + equipped icons)
```

## Global Acceptance Criteria

- [ ] `GAME_CONFIG` is the single source of truth for all gameplay constants (no more local const duplicates in Mel.tsx or Projectile.tsx)
- [ ] `resolveConfig(equipped)` returns correct overrides for each upgrade combination
- [ ] `Mel.tsx` reads all physics constants from the resolved config, not hardcoded values
- [ ] `Projectile.tsx` reads speed from the resolved config
- [ ] Shop screen shows the 7-item catalog with prices, descriptions, and purchase buttons
- [ ] Purchasing an upgrade deducts `totalCoins` and adds the upgrade to `purchased[]`
- [ ] Cannot purchase an upgrade if `totalCoins < price` (button disabled)
- [ ] Cannot purchase an already-purchased upgrade (shows "COMPRADO")
- [ ] 2 equipment slots: equip/unequip works correctly
- [ ] Equipped upgrades affect gameplay immediately (e.g., extra heart shows in HUD, fly time extended)
- [ ] Shop state (purchased + equipped) persists via `useProgressSync` to backend for registered users
- [ ] Guest shop state persists in localStorage
- [ ] item_blocks now drop power-ups (star, magnet, fire_ball, wings) in addition to coins/hearts
- [ ] Power-up entity renders with floating icon and glow
- [ ] Collecting a power-up activates it with the correct duration
- [ ] Only one power-up active at a time (new replaces old)
- [ ] Power-up timer counts down and auto-deactivates when it reaches 0
- [ ] Power-up effects work: star = invincible + gold tint, magnet = attract coins, fire_ball = pass-through projectiles, wings = unlimited fly
- [ ] HUD shows active power-up icon + timer bar when a power-up is active
- [ ] HUD shows 2 small equipped upgrade icons near the portrait
- [ ] "LOJA" button in the menu navigates to the shop
- [ ] No regressions in gameplay, controls, editor, infinite mode, level mode, or daily challenge
- [ ] TypeScript compiles with no errors across all packages

## Diagrams

- `docs/diagrams/F44-architecture.mmd` -- GAME_CONFIG data flow, resolveConfig pipeline, shop state + persistence, power-up entity lifecycle
- `docs/diagrams/F44-journey.mmd` -- User journey: menu -> shop -> buy -> equip -> play -> hit item_block -> collect power-up -> effect active -> timer expires
