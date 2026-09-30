# TechLead Review -- F24

**Verdict:** APPROVED

## Summary

The coin system is well-implemented and follows the established patterns in the codebase closely. Coin generation is deterministic (seeded random), the entity follows the Heart.tsx pattern correctly, double-collect is properly guarded, state management with localStorage persistence is sound, and the HUD displays the coin count. The code is clean, types are correct, and diagrams are valid. A few minor observations are noted below but none warrant rejection.

## Checklist Results

- [x] **Coin.tsx follows Heart.tsx pattern correctly** -- Same structure: `collected` ref guard, `useFrame` animation, `RigidBody` sensor with `onIntersectionEnter` filtering by `"mel"` name, early-return `null` when collected. The coin uses a cylinder geometry (appropriate for a coin shape) instead of the heart's box geometry. Good.
- [x] **No double-collect possible** -- `handleCollision` checks `collected.current` ref before proceeding and sets it to `true` atomically (synchronous). The render also returns `null` when collected. Solid.
- [x] **ChunkGenerator produces valid coin positions (not inside blocks)** -- Lines 220-226 build an `occupied` set from all foreground blocks, and every coin placement checks `!occupied.has(...)` before adding. The spawn area (chunkIndex <= 0) places coins at `groundY + 1` and `groundY + 2`, which are above ground level. Correct.
- [x] **Coin generation is deterministic (seeded random)** -- Uses the same `seededRandom(chunkIndex * 7919 + 31)` function already in place for blocks/hearts. Same chunk index always produces the same coins. Correct.
- [x] **useGameState: addCoin works, localStorage persistence correct** -- `addCoin` increments both `coins` (session) and `totalCoins` (lifetime), persists `totalCoins` to `localStorage` under key `supermel_total_coins`. Initial `totalCoins` is loaded from localStorage with a try/catch fallback to 0. Correct.
- [x] **resetGame resets session coins but preserves totalCoins** -- `resetGame` sets `coins: 0` but does NOT reset `totalCoins`. This is the correct behavior -- lifetime coins survive across sessions. Correct.
- [x] **ChunkRenderer renders coins like hearts** -- Follows exact same pattern: `collectedCoins` ref Set, `handleCoinCollect` callback, filter/map with key `c-${x},${y}`, passes `onCollect` prop. Correct.
- [x] **GameScene3D wires callback correctly** -- `handleCoinCollected` calls `addCoin()` from the store, passed as `onCoinCollected` to `ChunkRenderer`. Correct.
- [x] **HUD shows coin count** -- `HUD3D` receives `coins` prop, displays it with a gold circle icon and count. Styling is consistent with the existing HUD elements. Correct.
- [x] **No memory leaks, no unused imports** -- All imports are used. The `collectedCoins` ref in ChunkRenderer grows unboundedly but this is the same pattern used for `destroyedBlocks` and `collectedHearts`, and chunk cleanup happens via the Map pruning. Acceptable for the scale of this game.
- [x] **TypeScript types correct** -- `CoinData` interface properly defined, `Chunk` interface extended with `coins: CoinData[]`, `HUD3DProps` includes `coins: number`, `GameState` interface includes `coins` and `totalCoins`. All consistent.
- [x] **Diagrams valid** -- Both Mermaid diagrams are syntactically correct and accurately reflect the implementation: architecture shows the data flow from ChunkGenerator through state to HUD, journey shows the coin lifecycle.

## Issues Found

No blocking issues.

### Minor Observations (non-blocking)

1. **Coin bob amplitude differs from Heart** -- Coin bobs at `0.1` amplitude while Heart bobs at `0.15`. Coin also spins faster (`delta * 3` vs Heart's `delta * 2`). This is presumably intentional to differentiate the two entities visually, but worth documenting if there is a design spec.

2. **pointLight per coin** -- Each coin adds a `pointLight` (line 58 of Coin.tsx). With up to 15 coins per chunk and ~6 visible chunks, that could be up to ~90 point lights on screen. In practice the Rapier sensor culling and chunk unloading mitigate this, but if performance issues arise on low-end devices, consider removing or pooling the per-coin lights, or switching to a baked emissive-only approach.

3. **`coins.length = 15` truncation** -- Line 300-302 of ChunkGenerator truncates coins by setting `coins.length = 15`. This is valid JavaScript but slightly unusual. A more explicit approach would be `coins.splice(15)` or `coins.slice(0, 15)`. Not a bug, just a style note.

4. **collectedCoins ref never pruned** -- The `collectedCoins` Set in ChunkRenderer grows indefinitely as the player collects coins across chunks. For very long play sessions this could accumulate thousands of entries. Same pattern exists for `destroyedBlocks` and `collectedHearts` so this is a pre-existing concern, not introduced by this feature. Could be addressed in a future optimization pass.

5. **HUD coin icon is a plain circle (Unicode 9679)** -- Works fine but could be replaced with an SVG or small sprite matching the in-game coin cylinder for visual consistency. Low priority.

6. **totalCoins is exposed in state but not displayed anywhere in the HUD** -- The HUD shows `coins` (session count) but not `totalCoins` (lifetime). If lifetime coins will be used for a shop or unlockables in a future feature, this is fine. If the intent was to show both, a small UI update would be needed. Not a bug in the current feature scope.

## Recommendations

- Consider adding a brief coin collection sound effect (could be a follow-up task for audio polish).
- If a coin shop or spending mechanic is planned, add a `spendCoins(amount)` action to `useGameState` in the same feature to keep the API complete.
- For future optimization: batch the coin point lights or use instanced meshes if coin density causes frame drops on mobile.
