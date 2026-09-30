# Readiness Report -- F24

**Verdict:** BLOCKED

## Checklist

- [x] F24-README.md exists with goal, architecture impact, wave manifest, and global acceptance criteria
- [x] All 6 task files exist (F24-T01 through F24-T06)
- [x] Every task has a User Story section
- [x] Every task has Dev Notes section with files to create/modify
- [x] Every task has Testing section (manual testing -- acceptable given no test framework)
- [x] Every task has Acceptance Criteria section with concrete checkable items
- [x] Every task has Test Scenarios with happy path and edge cases
- [x] All referenced source files exist in the codebase (Heart.tsx, ChunkGenerator.ts, ChunkRenderer.tsx, useGameState.ts, HUD3D.tsx, GameScene3D.tsx)
- [x] Source asset exists: imagensDoRafa/moedaDoJogo.png
- [x] Wave 0 task (T01) has no dependencies -- correct
- [x] Wave 1 tasks (T02, T03) depend only on Wave 0 (T01) -- correct
- [ ] Wave 2 tasks (T04, T05) depend only on Wave 1 or earlier -- VIOLATION (see below)
- [x] Wave 3 task (T06) depends only on Wave 2 or earlier -- correct
- [x] No circular dependencies
- [x] Tasks are self-contained enough for a developer to implement
- [x] Implementation details include interfaces, file paths, and code snippets where helpful
- [x] Diagrams referenced in README (F24-architecture.mmd, F24-journey.mmd) are owned by T06

## Issues

### 1. Wave 2 intra-wave dependency violation (BLOCKING)

**F24-T05** (Wave 2) declares a dependency on **F24-T04** (also Wave 2):

> F24-T05 — Depends on: F24-T02, F24-T03, **F24-T04**

Tasks within the same wave are expected to run in parallel. T05 cannot run in parallel with T04 because T05 needs the `addCoin` action from `useGameState` that T04 creates.

**Fix options (pick one):**
- **Option A:** Move T04 to Wave 1 (it only depends on T02 which is Wave 1, but T04 modifies state, not the entity -- it could run after T02 is done). Then T05 stays in Wave 2 depending on Wave 1 tasks T02, T03, T04. This is valid only if T04 does not actually need T02's Coin component to exist -- and it does not; T04 only modifies `useGameState.ts`.
- **Option B:** Move T05 to Wave 3 and T06 to Wave 4. This preserves strict layering but adds a wave.
- **Option C (simplest):** Remove T04 from T05's dependency list and merge T04's work into T05. T05 already modifies `useGameState` indirectly via GameScene3D; consolidating state changes into T05 would make it self-contained.

**Recommended fix:** Option A -- move T04 to Wave 1. T04 only modifies `useGameState.ts` (adding `coins`, `totalCoins`, `addCoin`) and does not depend on the Coin entity existing at runtime. It can safely run in parallel with T02 and T03 as long as T01 (asset setup) is done. Update T04's dependency to `F24-T01` (or no dependency at all, since it only touches `useGameState.ts` which has no relation to the asset). Then the wave manifest becomes:

```
Wave 0: T01
Wave 1: T02, T03, T04
Wave 2: T05
Wave 3: T06
```

This is the smallest change that resolves the violation.
