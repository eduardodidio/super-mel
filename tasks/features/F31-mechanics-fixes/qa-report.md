# QA Report -- F31 Mechanics Fixes

**QA Agent:** QA
**Date:** 2026-09-30
**Branch:** homolog
**TypeScript Compilation:** PASS (npx tsc --noEmit produces zero errors)

**Files reviewed:**
- `packages/frontend/src/game/entities/Mel.tsx` (291 lines)
- `packages/frontend/src/game/entities/Projectile.tsx` (181 lines)
- `packages/frontend/src/game/systems/ProjectileManager.tsx` (73 lines)
- `packages/frontend/src/game/systems/AnimationStateMachine.ts` (lines 150-169)
- Task plans: F31-T01.md, F31-T02.md, F31-T03.md
- Test plan: F31-test-plan.md
- Tech Lead review: techlead-review.md

---

## Task F31-T01: Fly Timer (5s max)

### Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Constante MAX_FLY_TIME = 5 adicionada | PASS | Line 19: `const MAX_FLY_TIME = 5;` |
| 2 | Ref flyTimer adicionado | PASS | Line 69: `const flyTimer = useRef(0);` |
| 3 | Fly timer incrementa enquanto voando | PASS | Lines 162-164: `if (flying.current) { flyTimer.current += delta; }` |
| 4 | Voo desliga automaticamente apos 5 segundos | PASS | Lines 165-167: `if (flyTimer.current >= MAX_FLY_TIME) { flying.current = false; }` |
| 5 | Timer reseta ao aterrissar (grounded) | PASS | Lines 175-178: `if (grounded.current) { flying.current = false; flyTimer.current = 0; }` |
| 6 | Mel NAO comeca voando ao spawnar | PASS | `flying = useRef(false)` (line 68), `flyTimer = useRef(0)` (line 69) -- both initialize to inactive state |
| 7 | Nenhuma regressao em jump/walk/crouch | PASS | Jump logic (lines 137-154) untouched. Crouch (lines 131-135) untouched. Walk (lines 114-129) untouched. |

### Logic Flow Analysis

The fly section (lines 158-178) follows this order:

1. **Activation** (159-161): Fly activates only when jump is held, airborne, already jumping, and jump-hold exceeded MAX_JUMP_HOLD. This is correct -- fly cannot activate from the ground.
2. **Timer increment** (162-164): Increments every frame while `flying.current` is true.
3. **Timer cutoff** (165-167): Checks `flyTimer >= MAX_FLY_TIME` and disables flying BEFORE the fly force is applied. This means no extra frame of flight after 5s. Correct ordering.
4. **Force application** (168-171): Guarded by `flying.current && ctrl.jump && !grounded.current`. Since step 3 may have set `flying.current = false`, the force is correctly skipped when the timer expires.
5. **Release cancel** (172-174): Releasing jump disables flying but does NOT reset `flyTimer`. This means re-pressing jump mid-air resumes the timer from where it left off. Correct per spec.
6. **Ground reset** (175-178): Both `flying` and `flyTimer` are reset. This allows a fresh 5s of flight after landing.

### Edge Case: Release and Re-press Mid-Air

When the player releases Space mid-air, `flying.current = false` (line 173) but `flyTimer.current` is NOT reset. Upon re-pressing Space, the player must go through a fresh jump-hold cycle (lines 141-154), and then after MAX_JUMP_HOLD (0.25s), the fly condition re-activates (line 159). However, the `flyTimer` continues from its previous value. This means a player who flew for 3s, released, and re-pressed will only get 2s more of flight. This is the correct, intended behavior that prevents infinite flight abuse.

### Edge Case: Timer Accumulation While Not Pressing Jump

There is a subtle detail worth noting: when `flying.current = true` and `ctrl.jump` is false in the same frame, the timer still increments (line 163) before the jump-release check disables flying (line 173). This means 1 extra delta of timer accumulation per release cycle. In practice, this is negligible (one frame at ~16ms) and does not affect gameplay.

### Animation State Machine Integration

The `AnimationStateMachine` receives `flying: flying.current` (line 221 of Mel.tsx). In `AnimationStateMachine.ts` (lines 156-160), when `input.flying` is true and the character is airborne, it transitions to the "fly" state. When flying stops (timer expiry or release), `flying.current` becomes false, and the state machine correctly transitions to `jump_fall` or `jump_air` depending on vertical velocity. No issues found.

**Verdict for T01:** PASS

---

## Task F31-T02: Explicit CuboidCollider

### Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | CuboidCollider importado de @react-three/rapier | PASS | Line 3: `import { RigidBody, CuboidCollider, type RapierRigidBody, useRapier } from "@react-three/rapier";` |
| 2 | colliders={false} no RigidBody | PASS | Line 272: `colliders={false}` |
| 3 | CuboidCollider args={[0.3, 0.45, 0.25]} adicionado | PASS | Line 276: `<CuboidCollider args={[0.3, 0.45, 0.25]} />` |
| 4 | Mesh invisivel removido | PASS | No `visible={false}` mesh exists in JSX. Only the sprite mesh (line 278) and the CuboidCollider remain. |
| 5 | Mel colide corretamente com blocos solidos | PASS (static) | CuboidCollider with half-extents [0.3, 0.45, 0.25] produces a 0.6 x 0.9 x 0.5 box, matching the original intended collision shape. Since `colliders={false}` disables auto-generation from mesh geometry, the oversized-collider bug is resolved. |
| 6 | Mel nao atravessa paredes lateralmente | PASS (static) | The CuboidCollider is a solid (non-sensor) collider, so Rapier physics will prevent wall penetration. |
| 7 | Mel fica em pe sobre plataformas | PASS (static) | Solid collider rests on solid block colliders. |
| 8 | Ground detection (raycast) continua funcionando | PASS | See analysis below. |
| 9 | Moedas e hearts continuam sendo coletaveis | PASS (static) | Coins and hearts use sensor colliders. A solid CuboidCollider on Mel will still trigger `onIntersectionEnter` events on sensors. |

### Ground Check Raycast Compatibility

- Collider bottom edge: `pos.y - 0.45` (half-height = 0.45)
- Ray origin: `pos.y - 0.55` (line 92 of Mel.tsx)
- Ray starts 0.10 units below the collider bottom
- Ray distance: 0.3 units (line 98)
- Effective detection range: 0.10 to 0.40 units below collider bottom

This is correct. The ray starts just outside the collider (avoiding self-intersection) and can detect ground blocks within 0.40 units below. Since blocks are 1.0 unit tall and the player stands directly on them, the gap between collider bottom and block top should be near zero. The 0.30 unit ray length provides adequate tolerance.

### Collider Positioning

The CuboidCollider has no explicit `position` prop, so it defaults to [0, 0, 0] relative to the RigidBody origin. This centers the collision box on Mel's physics body. The sprite mesh has `position={[0, 0.3, 0]}` (line 278), which offsets the visual upward. This is an intentional design choice -- the sprite appears slightly above the collision center for visual alignment (the dog character's feet align with the collider bottom).

### Projectile Interaction

The Projectile uses `sensor` and `onIntersectionEnter` (lines 134, 136 of Projectile.tsx). Sensor colliders detect overlaps with all rigid bodies but do not generate contact forces. The Projectile's collision handler (line 94) only acts on objects whose name starts with `"block-"`. Since Mel's RigidBody is named `"mel"` (line 273), the projectile will not trigger hit logic against Mel. No regression.

**Verdict for T02:** PASS

---

## Task F31-T03: Attack Range (10 blocks)

### Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | LIFETIME ajustado para 10 / SPEED (~0.667s) | PASS | Line 20: `const LIFETIME = 10 / SPEED; // ~0.667s = 10 blocks range` |
| 2 | Projetil viaja exatamente 10 blocos antes de expirar | PASS | Math: SPEED=15, LIFETIME=10/15=0.6667s. Distance = 15 * 0.6667 = 10.0 world units. 1 block = 1 world unit. |
| 3 | SPEED mantido em 15 | PASS | Line 15: `const SPEED = 15;` |
| 4 | Projetil ainda explode ao colidir com bloco | PASS | Collision handler (lines 94-106) is unchanged. `onIntersectionEnter={handleCollision}` (line 136) still fires on block contact. |
| 5 | Animacao de escala e luz funcionam proporcionalmente | PASS | Scale interpolation at line 75: `t = Math.min(lifeRef.current / LIFETIME, 1)`. With shorter LIFETIME, the scale ramp completes faster but still maps [0,1] correctly. Light pulse (line 86) is independent of LIFETIME. |
| 6 | Cooldown de 300ms entre tiros mantido | PASS | ProjectileManager.tsx line 25: `const cooldownMs = 300;` -- unchanged. Cooldown logic (lines 28, 32, 44) is independent of Projectile.tsx changes. |

### Range Calculation Audit

| Parameter | Old Value | New Value | Result |
|-----------|-----------|-----------|--------|
| SPEED | 15 | 15 (unchanged) | Visual speed preserved |
| LIFETIME | 3.0s | 0.6667s | Reduced duration |
| Range (SPEED * LIFETIME) | 45 blocks | 10 blocks | Matches requirement |

### Expiry Logic

Line 89: `if (lifeRef.current > LIFETIME)` -- uses strict greater-than, meaning the projectile expires on the first frame where accumulated time exceeds 0.6667s. At 60fps (delta ~16.67ms), the projectile will travel between 9.75 and 10.25 blocks before expiring, depending on exact frame timing. This is acceptable precision for a real-time game.

### Scale Animation Side Effect

With the old LIFETIME of 3s, the scale grew from 0.8 to 1.5 over 3 seconds (slow, gentle growth). With the new LIFETIME of 0.667s, the same scale range completes in 0.667s. This is 4.5x faster. The visual effect is a quick "puff up" rather than a gradual growth. This is an acceptable trade-off documented in the task plan and acknowledged by the Tech Lead.

### Explosion Animation

The explosion animation (lines 42-56) uses its own `explodeRef` timer, completely independent of `LIFETIME`. The explosion runs for 0.3s with scale expansion and opacity fade. No regression.

**Verdict for T03:** PASS

---

## Test Plan Coverage Assessment

### Adequacy of TC-01 (Fly Timer)

The 5 test cases cover: max duration, ground reset, mid-air release/re-press, spawn state, and normal jump. **Adequate.** One minor gap noted below.

### Adequacy of TC-02 (Collision)

The 6 test cases cover: wall collision, platform landing, fall landing, coyote time, sensor passthrough, and projectile passthrough. **Adequate.** Covers the most important regression vectors.

### Adequacy of TC-03 (Attack Range)

The 5 test cases cover: max range, early hit, explosion visual, coin drop, and cooldown. **Adequate.**

### Adequacy of TC-04 (Cross-Regression)

The 5 test cases cover: walk+attack, fly+attack, crouch, look up, and fall death. **Adequate.**

### Identified Gaps in Test Plan

| Gap ID | Description | Severity | Recommendation |
|--------|-------------|----------|----------------|
| GAP-01 | No test case for fly timer visual feedback -- when flying stops at 5s, the animation should transition from "fly" to "jump_fall" | Low | Add TC-01f: verify sprite animation changes from fly to fall when timer expires |
| GAP-02 | No test case for rapid fly toggle -- repeatedly tapping Space mid-air to toggle fly on/off and verify timer keeps accumulating | Low | Add TC-01g: tap Space 5+ times mid-air, verify total fly time still caps at 5s |
| GAP-03 | No test case for attacking at max projectile range boundary -- what happens if a block is at exactly 10 blocks distance | Low | Already partially covered by TC-03a (field observation) but could be explicit |
| GAP-04 | No test case for flying while attacking simultaneously and hitting the 5s fly cap | Low | Combined scenario not covered but each individual mechanic is tested |
| GAP-05 | No test case for collider dimensions -- visual verification that Mel's collision box matches her sprite proportions reasonably | Low | Add TC-02g: enable physics debug rendering to visually verify collider size |

All gaps are **Low severity**. None represent blocking risks. The existing 21 test cases provide solid coverage for a manual-testing project.

---

## Pre-existing Observations (Non-blocking, Not Introduced by F31)

| ID | Observation | Severity | Action |
|----|-------------|----------|--------|
| OBS-01 | `FLY_GRAVITY_SCALE = 0.4` (Mel.tsx line 17) is declared but never used anywhere in the codebase | Info | Cleanup in future housekeeping pass |
| OBS-02 | Projectile.tsx line 89 uses `>` (strict greater-than) for lifetime check, while Mel.tsx line 165 uses `>=` for fly timer. Inconsistent but both are functionally correct | Info | Standardize in future pass if desired |

---

## Cross-Cutting Verification

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript compilation | PASS | `npx tsc --noEmit` produces zero errors |
| No new dependencies introduced | PASS | Only existing @react-three/rapier imports used |
| No state management changes | PASS | All changes use existing useRef pattern |
| No API changes | PASS | Component props unchanged |
| T01 and T02 edit non-overlapping sections of Mel.tsx | PASS | T01: useFrame fly logic (lines 158-178), T02: JSX return (lines 264-289) |
| Animation state machine compatibility | PASS | `flying` input correctly consumed by AnimationStateMachine.ts |
| ProjectileManager compatibility | PASS | Cooldown logic independent of LIFETIME change |

---

## Overall Verdict

**Verdict: PASS**

All three tasks (F31-T01, F31-T02, F31-T03) are implemented correctly and match their acceptance criteria exactly. The code is clean, edge cases are handled properly, TypeScript compiles without errors, and no regressions were identified in existing mechanics. The test plan provides adequate coverage with 21 test cases across 4 categories. Five low-severity gaps were identified for optional enhancement but none are blocking.

### Summary

| Task | Description | Verdict |
|------|-------------|---------|
| F31-T01 | Fly Timer (5s max) | PASS |
| F31-T02 | Explicit CuboidCollider | PASS |
| F31-T03 | Attack Range (10 blocks) | PASS |
| Test Plan | Coverage adequacy | PASS (5 low-severity gaps noted) |
| Compilation | TypeScript check | PASS |
| Regressions | Cross-cutting analysis | PASS (none found) |
