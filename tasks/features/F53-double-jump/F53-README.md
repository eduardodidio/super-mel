# Feature F53 -- Double Jump

**Status:** done
**Owner:** @architect
**PRD:** inline
**Backlog:** N/A (replaces broken fly mechanic)
**Depends on:** None (touches only frontend player controller and UI)

## Goal

Replace the broken fly mechanic (hold Space to fly) with a clean double jump: first Space press jumps normally, second Space press while airborne performs a second jump. The double jump counter resets when Mel touches the ground. This is a focused mechanics-swap: remove fly, add double jump, update all input surfaces and UI references.

## Problem

The current fly mechanic (hold Space after jump hold timer expires) is unreliable and confusing. It activates inconsistently because it depends on the jump hold timer reaching `MAX_JUMP_HOLD` (0.25s) while still holding Space. Players expect a double jump in a platformer. The fly mechanic will be revisited in a future feature; for now, it should be cleanly disabled and replaced with double jump.

## Architecture Decision: In-place replacement, no new files

**Why modify Mel.tsx directly instead of extracting a movement system?**

1. **Minimal diff:** All fly logic is contained in ~25 lines of `Mel.tsx` (lines 195-225). The double jump replacement is ~10 lines. This is a swap, not an addition.
2. **No new abstractions needed:** Double jump is a simple counter (`doubleJumpUsed` ref) with a ground-reset. It doesn't warrant a separate system or hook.
3. **Fly state callbacks stay (dormant):** The `onFlyStateUpdate` callback and `useGameState.setFlyState` remain in the codebase but are never called with `isFlying=true`. This avoids breaking the prop chain and makes it trivial to re-enable fly later.

## Scope of Changes

### Files Modified

| File | Change |
|------|--------|
| `packages/frontend/src/game/entities/Mel.tsx` | Remove fly logic (lines 195-225). Add `doubleJumpUsed` ref. On Space press while airborne and `!doubleJumpUsed`, apply second jump impulse and set `doubleJumpUsed = true`. Reset `doubleJumpUsed` on grounded. Update `AnimInput.flying` to always be `false`. Remove `FLY_FORCE`, `FLY_GRAVITY_SCALE`, `FLY_MAX_VEL_Y`, `MAX_FLY_TIME` constants. Add `DOUBLE_JUMP_FORCE` constant. |
| `packages/frontend/src/game/systems/AnimationStateMachine.ts` | Keep `"fly"` in `AnimState` union and `ANIM_NAME_MAP` (for future reuse). Add `"double_jump"` to `AnimState` union (maps to `"jump"` anim). In update(), when `!grounded` and `input.doubleJumping`, transition to `"double_jump"`. Add `doubleJumping: boolean` to `AnimInput`. |
| `packages/frontend/src/game/systems/HUD3D.tsx` | Remove `StaminaBar` component entirely. Remove `isFlying` and `flyTimeRemaining` props from `HUD3DProps`. Remove `StaminaBar` render. |
| `packages/frontend/src/game/Game3D.tsx` | Remove `isFlying` and `flyTimeRemaining` state subscriptions. Remove those props from `<HUD3D>`. |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Remove `setFlyState` subscription. Remove `wasFlyingRef`. Remove `handleFlyStateUpdate` callback. Remove `onFlyStateUpdate` prop from `<Mel>`. |
| `packages/frontend/src/game/hooks/useGameState.ts` | Remove `isFlying`, `flyTimeRemaining`, `setFlyState` from the store (or mark as deprecated/noop). Clean up `resetGame`, `startTestMode`, `startDailyMode`, `startLevel`, `startCampaignLevel` -- remove `isFlying`/`flyTimeRemaining` resets. |
| `packages/frontend/src/game/hooks/useAssistMode.ts` | Rename `unlimitedFlight` to deprecated or remove. Update `AssistModeSettings` interface. The "Voo Infinito" toggle becomes a no-op until fly is re-implemented. |
| `packages/frontend/src/game/systems/AssistModeUI.tsx` | Remove or hide the "Voo Infinito" toggle row. Update `anyAssist` check to exclude `unlimitedFlight`. |
| `packages/frontend/src/game/systems/ComoJogarScreen.tsx` | Replace "VOAR" / "Segurar Space (no ar)" with "PULO DUPLO" / "Space (2x no ar)". Update touch and gamepad rows similarly. Update TIPS to replace fly tip. |
| `packages/frontend/src/game/systems/EffectManager.tsx` | Add a "double jump" dust puff: when `playerState` transitions to `"double_jump"`, spawn a `"dust"` effect at feet. |
| `packages/frontend/src/game/hooks/useInfiniteMissions.ts` | Replace or remove the `"inf-fly-5s"` mission (fly 5s). Replace with a double-jump-based mission: "Faca 10 pulos duplos" (`double_jump_count`). |
| `packages/frontend/src/game/systems/MissionTracker.ts` | Add `doubleJumpsPerformed: number` to `MissionCounters`. Add `onDoubleJump()` method. Add `"double_jump_count"` case to `getStatus()`. Remove or deprecate `"fly_duration"` case and `flyTimeSeconds`. |
| `packages/frontend/src/game/systems/GameEventBus.ts` | Add `"double_jump"` event type. Remove or deprecate `"fly_tick"`. |

### Files NOT Modified (kept for future fly re-implementation)

| File | Reason |
|------|--------|
| `packages/frontend/src/game/systems/SpriteAnimator.ts` | The `fly` animation definition stays. `double_jump` maps to existing `"jump"` sprite frames. |
| `packages/frontend/src/game/entities/EnemyBee.tsx`, `EnemyPigeon.tsx`, `EnemyVacuum.tsx` | Their "fly away" death animations are unrelated to Mel's fly mechanic. |

## Constants

```typescript
// Mel.tsx — new constant
const DOUBLE_JUMP_FORCE = 9;   // Slightly less than JUMP_FORCE (10) for balanced feel
```

## Double Jump Logic (pseudo-code for Mel.tsx)

```typescript
// New ref
const doubleJumpUsed = useRef(false);

// In useGameFrame, after the Jump section:

// --- Double Jump ---
if (jumpPressed && !lastJumpPressed.current && !grounded.current && !doubleJumpUsed.current) {
  doubleJumpUsed.current = true;
  jumping.current = true;
  jumpHoldTimer.current = 0;
  rb.setLinvel({ x: newVelX, y: DOUBLE_JUMP_FORCE, z: 0 }, true);
  // Emit event for missions
}

// Reset on ground
if (grounded.current) {
  doubleJumpUsed.current = false;
}
```

## Waves

- **Wave 0**: F53-T01, F53-T02 (Core mechanics: Mel.tsx double jump + AnimationStateMachine -- independent foundation tasks)
- **Wave 1**: F53-T03, F53-T04, F53-T05 (UI cleanup: HUD/Game3D/GameScene3D removal + ComoJogar/AssistMode update + EffectManager/missions -- all depend on Wave 0)

### Dependency Graph

```
T01 (Mel.tsx: remove fly, add double jump) ──┬──> T03 (HUD + Game3D + GameScene3D + useGameState cleanup)
                                              │
T02 (AnimationStateMachine: double_jump) ────┤──> T04 (ComoJogar + AssistModeUI update)
                                              │
                                              └──> T05 (EffectManager + MissionTracker + GameEventBus + InfiniteMissions)
```

## Global Acceptance Criteria

- [ ] Pressing Space on the ground performs a normal jump
- [ ] Pressing Space while airborne (and not already double-jumped) performs a second jump
- [ ] Third Space press in the air does nothing
- [ ] Landing on ground resets the double jump so it can be used again
- [ ] Stomp-bounce on enemies also resets the double jump counter
- [ ] Holding Space does NOT activate fly (fly is fully disabled)
- [ ] The StaminaBar (FLY) is no longer visible in the HUD
- [ ] The "Voo Infinito" assist mode toggle is removed/hidden
- [ ] ComoJogarScreen shows "PULO DUPLO" instead of "VOAR"
- [ ] A dust puff effect spawns at Mel's feet on double jump
- [ ] The double jump uses the existing jump sprite frames (no new sprites needed)
- [ ] Mobile touch controls: tapping A while airborne triggers double jump
- [ ] Gamepad controls: pressing A while airborne triggers double jump
- [ ] The infinite mission "Voe 5s sem tocar o chao" is replaced with a double-jump mission
- [ ] MissionTracker tracks `doubleJumpsPerformed` counter
- [ ] GameEventBus emits `"double_jump"` event
- [ ] TypeScript compiles with no errors
- [ ] No regressions in jump feel, coyote time, stomp bounce, or enemy interactions

## Diagrams

- `docs/diagrams/F53-architecture.mmd` -- Double jump state flow: grounded -> jump -> airborne -> double_jump -> landing -> reset
- `docs/diagrams/F53-journey.mmd` -- User journey: press Space (jump) -> press Space again (double jump) -> land (reset)
