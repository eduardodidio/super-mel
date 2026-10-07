# Readiness Report — F62 Bugfix Batch

**Verdict:** READY

## Checklist

- [x] Feature README exists with clear summary and wave structure
- [x] All 4 task files exist (T01-T04) with User Story, Dev Notes, Testing sections
- [x] Wave structure is valid (single Wave 0, all tasks independent)
- [x] No file conflicts between tasks (T01=warnings, T02=Mel physics, T03=block types, T04=entity rendering)
- [x] Root cause analysis completed for each bug
- [x] Key files identified and verified to exist
- [x] No missing dependencies or permissions needed (Wave 0 front-loads nothing — all tasks are self-contained bugfixes)

## Risk Assessment

| Task | Risk | Notes |
|------|------|-------|
| T01 | Low | Console warnings — audit and suppress, no functional changes |
| T02 | Medium | Collider shape change affects all movement physics — needs thorough testing |
| T03 | Low | Single-line BLOCK_PROPERTIES change + verification |
| T04 | Medium | Transparent items need runtime identification — may require iterative fixing |

## File Conflict Analysis

- **T01** touches: `GameScene3D.tsx` (line 130-133 warning only), `SpriteAnimator.ts`, `Block.tsx` (material warnings)
- **T02** touches: `Mel.tsx` (collider + movement formula)
- **T03** touches: `types.ts` (BLOCK_PROPERTIES), `ChunkRenderer.tsx` (verify lifecycle), level data files
- **T04** touches: `Coin.tsx`, `DroppedCoin.tsx`, `Projectile.tsx`, other entity files

Potential overlap: T01 and T04 may both touch `Block.tsx` (material prop warnings vs transparency). T01 and T03 may both touch `GameScene3D.tsx`. These are minor — different sections of the same files, manageable in parallel.

**Recommendation:** Proceed with Wave 0. All tasks are independent and well-scoped.
