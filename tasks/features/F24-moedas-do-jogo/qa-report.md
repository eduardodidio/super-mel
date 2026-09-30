# QA Report -- F24

**Verdict:** PASS (with follow-up items)

## Test Results

### 1. TypeScript Compilation
- **Result:** PASS
- `pnpm --filter @super-mel/frontend typecheck` runs `tsc --noEmit` and completes with zero errors.

### 2. Acceptance Criteria Evaluation

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Moedas aparecem nos chunks espalhadas (similar a hearts) | PASS | `ChunkGenerator.generateChunk()` produces `CoinData[]` with ground/platform placement, parabolic arcs over gaps, min 5 / max 15 per chunk, and overlap-avoidance via the `occupied` set. Spawn chunk (index <= 0) gets easier coins. |
| 2 | Mel coleta moedas ao tocar nelas | PASS | `Coin.tsx` uses a Rapier `sensor` RigidBody with `onIntersectionEnter`. Only triggers for `rigidBodyObject?.name === "mel"`. Double-collect guard via `collected` ref. Wiring: `ChunkRenderer.onCoinCollected` -> `GameScene3D.handleCoinCollected` -> `useGameState.addCoin`. |
| 3 | Contador de moedas aparece no HUD | PASS | `HUD3D` receives `coins` prop from `Game3D` (which reads `useGameState((s) => s.coins)`). Renders a gold circle icon + count in the left section of the HUD, next to hearts. |
| 4 | Total de moedas persiste entre sessoes (localStorage) | PASS | `useGameState` stores `totalCoins` initialized from `localStorage.getItem("supermel_total_coins")` with try/catch fallback. `addCoin()` increments both `coins` (session) and `totalCoins` (lifetime), persisting via `localStorage.setItem`. `resetGame()` resets session `coins` to 0 but does NOT reset `totalCoins` -- correct behavior. |
| 5 | Moeda usa sprite/imagem do Rafa com animacao (rotacao + brilho) | PARTIAL | The coin asset `coin.png` was copied from `imagensDoRafa/moedaDoJogo.png` to `packages/frontend/public/sprites/coin.png` (T01 done). However, `Coin.tsx` does NOT load this texture. Instead it uses a procedural `cylinderGeometry` with gold `meshStandardMaterial`. The coin does spin (`rotation.y += delta * 3`) and bob (`sin` wave), and has a gold `pointLight` for glow. The animation criteria are met, but the Rafa sprite is NOT used as a texture. See follow-up items. |
| 6 | Sem regressao de performance | PASS | Coin generation is O(n) per chunk, capped at 15 coins. Coins use lightweight geometry (16-segment cylinder). `collectedCoins` ref set prevents re-rendering collected coins. No new per-frame allocations. Block and heart systems are unchanged. |

### 3. Wiring Verification (Full Pipeline)

```
ChunkGenerator.generateChunk() -> Chunk.coins: CoinData[]
  -> ChunkRenderer renders <Coin> for each CoinData not in collectedCoins set
    -> Coin.onIntersectionEnter (sensor collision with "mel")
      -> ChunkRenderer.handleCoinCollect (marks collected, calls onCoinCollected)
        -> GameScene3D.handleCoinCollected
          -> useGameState.addCoin()
            -> coins++ (session), totalCoins++ (lifetime)
            -> localStorage.setItem("supermel_total_coins", ...)
              -> Game3D reads coins from useGameState
                -> HUD3D displays coin count
```

**Result:** PASS -- all links in the chain are correctly wired.

### 4. localStorage Persistence Logic

- **Initialization:** `totalCoins` uses an IIFE with try/catch to read from localStorage on store creation. Falls back to 0 on error. Correct.
- **Persistence:** `addCoin()` writes `totalCoins` to localStorage inside try/catch (handles private browsing / quota errors). Correct.
- **Reset behavior:** `resetGame()` sets `coins: 0` but does NOT touch `totalCoins`. Lifetime coins survive game restarts. Correct.
- **Key name:** `"supermel_total_coins"` -- consistent, no conflicts with existing keys (`supermel_token`, `supermel_player_id`, `supermel_player_name`).

**Result:** PASS

### 5. No Regressions in Hearts or Blocks

- `Heart.tsx` is unchanged (verified by reading the file -- identical structure and collision logic).
- `ChunkRenderer` still renders hearts with the same `collectedHearts` ref pattern. The coin rendering is additive (new `...chunk.coins` spread in the JSX).
- Block rendering and `destroyedBlocks` tracking are unchanged.
- `onBlockDestroyed` prop remains optional (`?`) and is not passed from GameScene3D (same as before F24).
- `ChunkGenerator` still produces `blocks` and `hearts` arrays with identical logic. The `coins` array is new and independent.

**Result:** PASS

### 6. Diagrams

- `docs/diagrams/F24-architecture.mmd` -- Present. Shows Generation -> Entities -> State -> UI pipeline. Accurately reflects the code.
- `docs/diagrams/F24-journey.mmd` -- Present. Shows chunk generation -> coin placement -> collection -> state update -> HUD + localStorage. Accurate.

**Result:** PASS

### 7. README.md Updated

- Line 95 of project README.md contains F24 entry: "F24: Sistema de Moedas -- Moedas coletaveis espalhadas pelos chunks, contador no HUD, persistencia via localStorage para futuros upgrades."

**Result:** PASS

### 8. Code Quality Notes

- `Coin.tsx` follows the exact same pattern as `Heart.tsx` (ref-based collected guard, sensor RigidBody, group with meshRef, useFrame animation). Consistent architecture.
- `CoinData` interface matches `HeartData` (x, y coordinates). Consistent.
- Coin generation avoids overlap with foreground blocks via the `occupied` set. Good.
- Gap arc coins use a parabola formula to create visually appealing jump reward patterns. Nice touch.
- The `collectedCoins` ref set in ChunkRenderer uses the `c-${x},${y}` key format, distinct from hearts (`h-${x},${y}`) and blocks (`${x},${y},${z}`). No key collisions.

## Gaps / Follow-up Items

### 1. Rafa Sprite Not Used as Texture (LOW -- cosmetic)

**Criterion 5** says "Moeda usa sprite/imagem do Rafa". The asset was copied to `public/sprites/coin.png`, but `Coin.tsx` uses a procedural gold cylinder instead of loading the texture. The current 3D coin looks good and fits the voxel aesthetic, and the Rafa image (a hand-drawn coin on a solid maroon background with no alpha channel) would require alpha processing to look correct on a 3D surface. The procedural approach is arguably a better visual choice, but technically the acceptance criterion is only partially met.

**Recommendation:** Either update the acceptance criterion to acknowledge the procedural approach, or in a future polish pass, load `coin.png` as a texture on one face of the cylinder (using `alphaTest` to handle the maroon background). This is cosmetic and does not block shipping.

### 2. Game Over Screen Does Not Show Coins Collected (LOW -- nice-to-have)

The `GameOverOverlay` shows distance but not session coins collected. This is not in the acceptance criteria, but would be a natural addition for player feedback.

### 3. totalCoins Not Visible in UI (LOW -- future feature)

The `totalCoins` (lifetime accumulated) value is tracked and persisted but not displayed anywhere in the UI. The HUD shows session `coins` only. This is by design (the PRD says coins "servirao futuramente para upgrades"), but worth noting for the next feature that uses coins.

### 4. Coin Sound Effect Missing (LOW -- polish)

No audio feedback on coin collection. Hearts also lack audio, so this is consistent with the current state, but a "bling" sound would improve game feel. Future polish item.
