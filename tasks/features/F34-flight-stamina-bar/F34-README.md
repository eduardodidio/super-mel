# Feature F34 — Flight Stamina Bar with Cape Icon

**Status:** planned
**Owner:** @architect
**PRD:** inline

## Goal

Add a visual stamina bar to the HUD that shows the player how much flight time remains (out of 5 seconds). Currently, the flight mechanic has no visual feedback -- the player has no idea how much time is left before flight cuts out.

## Problem

The flight system in `Mel.tsx` tracks `flying` (boolean ref) and `flyTimer` (numeric ref counting 0 to 5s), but these values are trapped inside the component. The HUD has no awareness of flight state.

## Solution Overview

1. **Expose fly state from Mel** via a new callback prop `onFlyStateUpdate`
2. **Store fly state in zustand** (`useGameState`) so it flows through the React tree
3. **Wire GameScene3D** to pipe Mel's fly state callback into the zustand store
4. **Render a stamina bar in HUD3D** with color transitions, fade-out animation, and a cape icon

### Stamina Bar Design

- Position: below the hearts row in the left HUD section
- Cape icon: Unicode cape/wing symbol or CSS-drawn icon
- Bar: horizontal, drains right-to-left as stamina depletes
- Color transitions: blue (full) -> yellow (low) -> red (critical)
- Text: remaining time shown as "X.Xs" (e.g., "3.2s")
- Visibility: appears when flying starts, fades out ~1.5s after landing
- Width: ~120px, height: ~10px

## Key Files

| File | Change |
|------|--------|
| `packages/frontend/src/game/entities/Mel.tsx` | Add `onFlyStateUpdate` callback prop, call it every frame with `(flying, timeRemaining)` |
| `packages/frontend/src/game/hooks/useGameState.ts` | Add `flyState` fields: `isFlying`, `flyTimeRemaining`, `setFlyState` |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Create `handleFlyStateUpdate` callback, pass to Mel, call `setFlyState` |
| `packages/frontend/src/game/systems/HUD3D.tsx` | Add stamina bar component with cape icon, color transitions, fade-out |
| `packages/frontend/src/game/Game3D.tsx` | Read fly state from zustand, pass to HUD3D as new props |

## Architecture Impact

- No new files created -- all changes are additions to existing files
- Zustand store grows by 3 fields (isFlying: boolean, flyTimeRemaining: number, setFlyState: function)
- No performance concern: fly state update piggybacks on the existing `useFrame` loop in Mel.tsx
- HUD3D only re-renders when fly state changes (zustand selector)

## Waves

- **Wave 0**: F34-T01 (Mel callback) + F34-T02 (zustand store) — independent, parallel
- **Wave 1**: F34-T03 (GameScene3D wiring) + F34-T04 (HUD3D stamina bar + Game3D props) — depend on Wave 0, parallel with each other (different files)

## Global Acceptance Criteria

- [ ] Stamina bar appears when Mel starts flying
- [ ] Bar drains smoothly from full (5s) to empty (0s) over 5 seconds
- [ ] Bar color transitions: blue -> yellow -> red as stamina decreases
- [ ] Remaining time displayed as text (e.g., "4.2s")
- [ ] Cape icon visible next to the bar
- [ ] Bar fades out ~1.5s after Mel lands (flyTimer resets)
- [ ] Bar does NOT appear when Mel is just jumping (not flying)
- [ ] No performance regression (no unnecessary re-renders)
- [ ] No console errors
- [ ] Existing HUD elements (hearts, coins, score) unaffected
- [ ] Flight mechanic behavior unchanged (5s max, resets on ground)

## Diagrams

- F34-architecture.mmd — data flow from Mel refs -> callback -> zustand -> HUD
- F34-journey.mmd — user experience of flight stamina feedback
