# Feature F38 -- Idle Sprites + Game Feel

**Status:** planned
**Owner:** @architect
**PRD:** inline
**Backlog items:** B-32 (Idle sprites), B-31 (Game feel)

## Goal

Activate the unused idle-progression and reaction sprites (sit, lie_down, wait, affection), add visual feedback effects (zzz particles, screen shake, floating "+1" popup, item_block bump), and polish audio and camera to make the game feel alive and responsive.

## Problem

1. **Idle sprites are under-used:** `sit` and `lie_down` exist but thresholds are too slow (8s/16s). `wait` and `affection` sprites exist as PNG files but have no code paths to trigger them.
2. **No game feel juice:** Block destruction and damage have no screen shake. Collecting coins has no visual feedback beyond the HUD counter. The camera has no lookahead in the facing direction. Audio has no pitch variation. Item blocks pop coins but do not visually bump.

## Architecture

### Backlog B-32: Idle Sprites

| Change | File | Detail |
|--------|------|--------|
| Threshold adjustment | `AnimationStateMachine.ts` | idle >5s -> sit, >12s -> lie_down (was 8s/16s) |
| New states | `AnimationStateMachine.ts` | Add `wait` and `affection` to AnimState union + ANIM_NAME_MAP |
| New animations | `SpriteAnimator.ts` | Add `wait` and `affection` animation defs using existing PNGs |
| `wait` trigger | `AnimationStateMachine.ts` | lookingUp >3s -> transition from `look_up` to `wait` |
| `affection` trigger | `Mel.tsx` + `GameScene3D.tsx` | Edge-detect heart collection, pass to AnimInput, one-shot 0.6s |
| Zzz particle | `EffectSprite.tsx` + `EffectManager.tsx` | New "zzz" effect type, spawned when entering `lie_down` state |
| Wire EffectManager | `GameScene3D.tsx` | EffectManager exists but is NOT imported anywhere -- wire it in |

### Backlog B-31: Game Feel

| Change | File | Detail |
|--------|------|--------|
| Screen shake | New `useScreenShake.ts` | Hook exposing `shake(intensity, duration)` + camera offset in useFrame |
| Shake triggers | `GameScene3D.tsx` | Call shake on block destroy (0.1, 0.12s) and damage (0.15, 0.2s) |
| Camera lookahead | `CameraRig.tsx` | Add facing-direction offset (1.5 units ahead), smoothly lerped |
| Floating "+1" | New `CoinPopup.tsx` | HTML overlay, world-to-screen projection, rise + fade animation |
| Audio pitch rand | `AudioManager3D.ts` | New `playSFX()` function with `playbackRate` randomization +-10% |
| Item block bump | `Block.tsx` | Animate mesh Y when `activated` flips true (up 0.15 over 60ms, back 120ms) |
| Hit-stop | `GameScene3D.tsx` | 40ms physics pause on damage (set `timeScale=0` briefly via Rapier) |

### Key Design Decisions

1. **Screen shake via hook, not camera manipulation:** A `useScreenShake` hook with a Zustand store keeps shake logic decoupled from CameraRig's deadzone tracking. CameraRig reads the shake offset and adds it.

2. **Coin popup as HTML overlay:** Avoids 3D text complexity. Projects world position to screen via camera matrices. Matches existing HUD pattern.

3. **`affection` via edge-detection in AnimInput:** Same pattern as `damaged`/`invincible` -- a `heartJustCollected` boolean that is true for one frame. Keeps AnimationStateMachine pure.

4. **`wait` as progression from `look_up`:** After 3s of lookingUp, transition to `wait`. Natural idle progression like idle -> sit -> lie_down.

5. **EffectManager wiring:** EffectManager.tsx exists with dust, stars, heart, and exclamation effects but is NOT imported in GameScene3D. T02 will wire it in and add the zzz effect type.

6. **SFX infrastructure only:** AudioManager3D.ts currently handles only music tracks. T06 adds a `playSFX()` function with pitch randomization, but actual audio files are out of scope (they will come in a future feature).

## File Inventory

### New Files

| File | Task | Purpose |
|------|------|---------|
| `packages/frontend/src/game/systems/useScreenShake.ts` | T04 | Screen shake hook + tiny Zustand store |
| `packages/frontend/src/game/systems/CoinPopup.tsx` | T05 | Floating "+1" HTML overlay component |

### Modified Files

| File | Task(s) | Changes |
|------|---------|---------|
| `AnimationStateMachine.ts` | T01 | Add `wait`/`affection` states, adjust idle thresholds, add `lookUpTime` tracking, add `heartCollected` to AnimInput |
| `SpriteAnimator.ts` | T01 | Add `wait` and `affection` animation definitions |
| `Mel.tsx` | T01 | Track lookUpTime, add heartJustCollected edge-detection, pass new AnimInput fields |
| `GameScene3D.tsx` | T01,T02,T04,T05 | Wire EffectManager, add heartJustCollected ref, pass to Mel, trigger shake, render CoinPopup |
| `EffectSprite.tsx` | T02 | Add "zzz" effect type component |
| `EffectManager.tsx` | T02 | Add zzz spawn on lie_down state transition |
| `CameraRig.tsx` | T03 | Add `facingRight` prop, compute lookahead offset, read shake offset |
| `AudioManager3D.ts` | T06 | Add `playSFX()` with pitch randomization, SFX type registry |
| `Block.tsx` | T04 | Add bump animation on item_block activation |

## Waves

### Wave 0 (parallel -- no interdependencies)
- **F38-T01:** Idle thresholds + `wait`/`affection` states in AnimationStateMachine + SpriteAnimator + Mel.tsx
- **F38-T03:** Camera lookahead in CameraRig.tsx
- **F38-T06:** Audio pitch randomization in AudioManager3D.ts

### Wave 1 (depends on T01 for affection trigger wiring; T04/T05 are independent but grouped logically)
- **F38-T02:** Zzz particle effect + wire EffectManager into GameScene3D
- **F38-T04:** Screen shake system + item_block bump animation
- **F38-T05:** Floating "+1" coin popup

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| `wait`/`affection` sprites may not exist as PNG files | Verified: both `wait.png` and `affection.png` exist in `public/sprites/mel/` |
| EffectManager not wired in could mean it has stale code | EffectManager code is coherent and matches current EffectSprite types; just needs import + JSX |
| Screen shake could cause motion sickness | Use very small amplitudes (max 0.15 units) and short durations (<0.2s) |
| Camera lookahead could feel jarring | Lerp the offset slowly (same lerpSpeed as existing camera follow) |
| No SFX audio files currently exist | T06 creates the playSFX infrastructure; actual files are out of scope for F38 |
