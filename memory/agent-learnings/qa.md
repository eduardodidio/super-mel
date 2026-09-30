# QA Learnings

(QA appends to this file at the end of every feature retrospective.)

## F23 -- Sprites & Animation System

- **Check state machine coverage against acceptance criteria explicitly.** The plan said "idle/walk/run/jump/fall/attack/hurt/death" but the implementation split these into fine-grained sub-states (jump_rise, jump_air, jump_fall, etc.). Verify the mapping layer (ANIM_NAME_MAP) connects sub-states back to the coarse animation names.
- **Always verify that new components are actually wired into the scene graph.** EffectManager was built and tested in isolation but never imported into GameScene3D. This is easy to miss if you only read the new files without checking the integration point.
- **Edge-detection patterns for boolean props need careful review.** The `damaged` input uses a ref-based edge detector (wasInvincible). Confirm that the ref updates AFTER the flag is consumed, not before, or the edge will be missed.
- **Verify sprite file existence against animation frame references.** A missing PNG silently falls back to the default texture, which can hide bugs. Cross-reference ANIMATIONS frame lists against the actual files in public/sprites/.
- **Hardcoded constants (like damageLevel=1) should be flagged as follow-up items, not failures**, if the current game design only has one damage source. But note them so they are not forgotten.
- **Check for unreachable code paths in effect managers.** EffectManager referenced states ("affection", "jump_on_owner") that do not exist in the AnimState type. These are harmless but indicate incomplete integration planning.

## F24 -- Sistema de Moedas do Jogo

- **Always verify that copied art assets are actually referenced by the code, not just present on disk.** F24-T01 copied `moedaDoJogo.png` to `public/sprites/coin.png`, but `Coin.tsx` never loads this file as a texture. The asset existing in the filesystem does not mean it is wired into the rendering pipeline. Grep for the filename in source code to confirm usage.
- **When an acceptance criterion says "uses image X", check if the entity actually loads that image.** Procedural geometry can look better than a 2D sprite in a 3D context, but if the criterion explicitly names a specific asset, the implementation should at minimum reference it or the criterion should be updated.
- **Check `resetGame()` carefully for new state fields.** New state fields (like `coins`) must be explicitly reset in `resetGame()`. If a developer adds `coins` to state but forgets to reset it, coins would persist across game restarts within the same session. In F24 this was done correctly (`coins: 0` in resetGame, `totalCoins` intentionally preserved).
- **Verify key uniqueness across entity types in shared rendering containers.** ChunkRenderer renders blocks, hearts, and coins in the same flat array. Each type needs a distinct key prefix (`h-` for hearts, `c-` for coins, bare coordinates for blocks) to avoid React key collisions.
- **For localStorage-persisted values, verify the full lifecycle:** initialization with fallback, persistence on mutation, correct reset behavior (session vs lifetime), and try/catch around both read and write (private browsing can throw).
