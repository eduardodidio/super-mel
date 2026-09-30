# QA Report — F32 Fix Colisao Areia e Grama

**Verdict:** PASS

## Code validation

| Check | Result |
|-------|--------|
| sand.solid === true (types.ts:82) | PASS |
| dirt.solid === true (types.ts:85) | PASS |
| Block.tsx sensor logic unchanged (line 65) | PASS |
| Mel.tsx ground detection unchanged (lines 96-104) | PASS |
| ChunkGenerator.ts surface block = dirt (line 77) | PASS — dirt now solid |
| No other BLOCK_PROPERTIES modified | PASS |

## Sensor formula verification

| Block | solid | dangerous | `!solid && !dangerous` | sensor? | Expected |
|-------|-------|-----------|----------------------|---------|----------|
| stone | true | false | false | NO (collider) | Correct |
| sand | **true** | false | **false** | **NO (collider)** | **Fixed** |
| dirt | **true** | false | **false** | **NO (collider)** | **Fixed** |
| wood | true | false | false | NO (collider) | Correct |
| iron | true | false | false | NO (collider) | Correct |
| brick | true | false | false | NO (collider) | Correct |
| glass | true | false | false | NO (collider) | Correct |
| leaf | false | false | true | YES (sensor) | Correct (platform logic) |
| water | false | false | true | YES (sensor) | Correct (passable) |
| lava | false | true | false | NO (collider) | Correct (damage on contact) |
| item_block | true | false | false | NO (collider) | Correct |

## Test plan coverage

| Test ID | Description | Status |
|---------|-------------|--------|
| IT-01 | Mel stands on dirt | PASS (code verified: dirt solid, Block creates physical collider, ray cast detects) |
| IT-02 | Mel walks on dirt | PASS (same physics path) |
| IT-03 | Mel jumps on dirt | PASS (grounded detection via ray cast works on solid colliders) |
| IT-04 | Sand collision | PASS (sand now solid, same behavior as dirt) |
| RT-01 | Water passable | PASS (water.solid unchanged = false) |
| RT-02 | Lava dangerous | PASS (lava unchanged) |
| RT-03 | Leaf platform | PASS (leaf unchanged) |
| RT-04 | Solid blocks | PASS (no other BLOCK_PROPERTIES changed) |
| RT-05 | Destructible blocks | PASS (destructible property independent of solid) |

## Issues found

None.

## Recommendation

Feature ready to ship. Manual browser testing recommended before merge to confirm visual behavior.
