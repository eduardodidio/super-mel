# Tech Lead Review -- F31 Mechanics Fixes

**Reviewer:** Tech Lead Agent
**Date:** 2026-09-30
**Branch:** homolog
**Files reviewed:**
- `packages/frontend/src/game/entities/Mel.tsx` (full, 291 lines)
- `packages/frontend/src/game/entities/Projectile.tsx` (full, 181 lines)
- Task plans: F31-T01.md, F31-T02.md, F31-T03.md

---

## Task F31-T01: Fly Timer (5s max)

**Implementation matches plan:** Yes

**Analysis:**

1. `MAX_FLY_TIME = 5` constant added at line 19 -- correct.
2. `flyTimer = useRef(0)` ref added at line 69 -- correct.
3. Fly logic (lines 158-178) follows the exact structure from the task plan:
   - `flying.current = true` activates on hold after jump hold completes (line 159-161).
   - Timer increments every frame while flying (lines 162-164).
   - Timer cutoff check fires before the fly force application (lines 165-167), ensuring no extra frame of flight occurs after 5s.
   - Fly force application is gated on `flying.current && ctrl.jump && !grounded.current` (line 168).
   - Releasing jump disables flying (lines 172-174).
   - Landing resets both `flying` and `flyTimer` (lines 175-178).

**Edge case analysis:**

- *Release and re-press jump mid-air:* When the player releases jump, `flying.current = false` (line 173), but `flyTimer` is NOT reset (only resets on ground, line 177). When the player re-presses, `jumping` starts fresh from the jump section, then after `MAX_JUMP_HOLD` the fly condition activates again (line 159), but `flyTimer` continues from where it left off. This matches the task plan's documented edge case ("timer continua de onde parou") and is the correct behavior -- players cannot abuse release/re-press to get infinite flight.
- *Timer exceeds exactly 5s:* The `>=` comparison (line 165) handles this correctly.
- *Spawn state:* `flyTimer` starts at 0, `flying` starts at false -- Mel does not spawn flying.

**Verdict for T01:** PASS -- no issues.

---

## Task F31-T02: Explicit CuboidCollider

**Implementation matches plan:** Yes

**Analysis:**

1. `CuboidCollider` imported from `@react-three/rapier` (line 3) -- correct.
2. `colliders={false}` set on RigidBody (line 272) -- disables auto-generated collider.
3. `<CuboidCollider args={[0.3, 0.45, 0.25]} />` added as direct child of RigidBody (line 276) -- correct half-extents for a 0.6 x 0.9 x 0.5 bounding box.
4. Invisible mesh (previously `<mesh visible={false}><boxGeometry args={[0.6, 0.9, 0.5]} />`) has been removed -- correct.

**Collider dimensions verification:**
- Half-extents `[0.3, 0.45, 0.25]` yield full dimensions of 0.6 x 0.9 x 0.5, matching the old invisible box mesh.
- The CuboidCollider is placed at the RigidBody origin (no position offset), which means the collider is centered on Mel's physics body. The sprite mesh has `position={[0, 0.3, 0]}` to offset visually upward, which is correct -- the sprite "floats" slightly above the collider center for visual alignment.

**Ground check raycast compatibility:**
- Ray origin: `pos.y - 0.55` (line 92). Collider bottom: `pos.y - 0.45`. The ray starts 0.1 units below the collider base with a cast distance of 0.3 -- this is correct and will detect ground properly.

**Regression risk:**
- The `sensor` property is NOT set on this CuboidCollider, so it will act as a solid collider -- correct for player collision.
- Projectile uses `sensor` and `onIntersectionEnter` -- no interaction change expected.
- Coins and hearts use sensor colliders in the game -- they will still pass through Mel's solid collider and trigger intersection events correctly.

**Verdict for T02:** PASS -- no issues.

---

## Task F31-T03: Attack Range (10 blocks)

**Implementation matches plan:** Yes

**Analysis:**

1. `LIFETIME = 10 / SPEED` at line 20 -- evaluates to `10 / 15 = 0.6667s`. Correct.
2. `SPEED` remains at 15 (line 15) -- velocity preserved.
3. Range calculation: `15 * 0.6667 = 10.0` world units = 10 blocks. Correct.
4. The comment `// ~0.667s = 10 blocks range` is accurate and self-documenting.

**Side effects verified:**
- Scale interpolation (line 75): `t = lifeRef.current / LIFETIME` -- still maps [0, 1] over the projectile's lifetime. The scale animation just completes faster (in 0.667s instead of 3s). Acceptable.
- Light pulse animation (line 86): uses raw `lifeRef.current`, unaffected by LIFETIME change.
- Explosion logic (lines 42-56): uses `explodeRef` timer, independent of LIFETIME. No regression.
- `onExpire` fires when `lifeRef.current > LIFETIME` (line 89) -- still correct.
- Collision handler (line 94): unaffected -- still triggers on block contact regardless of range.

**Previous range was 45 blocks (15 * 3 = 45).** Reduction to 10 blocks is a significant gameplay nerf but aligns with the feature intent for balanced combat.

**Verdict for T03:** PASS -- no issues.

---

## Cross-cutting Concerns

### TypeScript Compilation
TypeScript compiles clean (`tsc --noEmit` produces no errors).

### Architecture Alignment
All changes are contained within two entity files in the game layer. No new dependencies introduced. No API changes. No state management changes. Clean, minimal diffs.

### Pre-existing Observations (non-blocking)
- `FLY_GRAVITY_SCALE = 0.4` (line 17 of Mel.tsx) is declared but never used anywhere in the file. This predates F31 and is not a regression, but should be cleaned up in a future housekeeping pass.

---

## Overall Verdict

**Verdict:** APPROVED

All three tasks are implemented correctly and match their task plans exactly. The code is clean, the edge cases are handled properly, TypeScript compiles without errors, and there are no regressions in existing logic. The fly timer prevents infinite flight, the explicit CuboidCollider fixes the oversized auto-collider problem, and the projectile range is correctly calculated at 10 blocks.
