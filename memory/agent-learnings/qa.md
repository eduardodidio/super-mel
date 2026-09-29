# QA Learnings

(QA appends to this file at the end of every feature retrospective.)

## F23 -- Sprites & Animation System

- **Check state machine coverage against acceptance criteria explicitly.** The plan said "idle/walk/run/jump/fall/attack/hurt/death" but the implementation split these into fine-grained sub-states (jump_rise, jump_air, jump_fall, etc.). Verify the mapping layer (ANIM_NAME_MAP) connects sub-states back to the coarse animation names.
- **Always verify that new components are actually wired into the scene graph.** EffectManager was built and tested in isolation but never imported into GameScene3D. This is easy to miss if you only read the new files without checking the integration point.
- **Edge-detection patterns for boolean props need careful review.** The `damaged` input uses a ref-based edge detector (wasInvincible). Confirm that the ref updates AFTER the flag is consumed, not before, or the edge will be missed.
- **Verify sprite file existence against animation frame references.** A missing PNG silently falls back to the default texture, which can hide bugs. Cross-reference ANIMATIONS frame lists against the actual files in public/sprites/.
- **Hardcoded constants (like damageLevel=1) should be flagged as follow-up items, not failures**, if the current game design only has one damage source. But note them so they are not forgotten.
- **Check for unreachable code paths in effect managers.** EffectManager referenced states ("affection", "jump_on_owner") that do not exist in the AnimState type. These are harmless but indicate incomplete integration planning.
