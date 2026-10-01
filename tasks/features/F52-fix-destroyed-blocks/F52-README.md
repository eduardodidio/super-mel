# Feature F52 -- Fix Destroyed Blocks Cleanup

**Status:** done
**Owner:** @architect
**PRD:** inline (bugfix)
**Backlog:** N/A (bugfix discovered during gameplay testing)
**Depends on:** F17 (Blocos 3D), F18 (Bola do Infinito), F47 (Dig System)

## Goal

Ensure that when a block is destroyed (via Bola do Infinito projectile hit, dig, or any
other mechanism), it is completely removed from the scene -- both visually (mesh no longer
rendered) and physically (Rapier rigid body and collider removed from the physics world).

## Problem

Destroyed blocks persist on screen and maintain active colliders. When Mel destroys a
block, the block should vanish entirely, but currently it remains visible and the
collider continues to block movement and interact with projectiles.

## Root Cause Analysis

After thorough code review, multiple issues contribute to the bug:

### 1. Block.tsx -- Dead `onDestroy` / `destroyed` state (cosmetic, but indicates design gap)

`Block.tsx` declares `const [destroyed, setDestroyed] = useState(false)` and an `onDestroy`
prop. If `destroyed === true`, it renders `BlockParticles` instead of the block mesh +
RigidBody. However, `setDestroyed` is **never called** -- neither by internal logic nor
by any parent. The `onDestroy` callback is also never invoked.

The actual destruction path is in `ChunkRenderer.destroyBlock()`, which adds the block key
to a `destroyedBlocks` ref Set, then calls `setRenderTick(t => t + 1)` to force a
React re-render. On the next render, the `.filter()` at line 158 excludes destroyed
blocks from the JSX output, which should unmount the `<Block>` component (and its
`RigidBody`).

### 2. ChunkRenderer -- Ref + renderTick mechanism may fail under React 18 batching

`destroyedBlocks` is a `useRef(new Set())`. When `destroyBlock()` is called:
1. It mutates the ref synchronously (`.add(key)`)
2. It calls `setRenderTick(t => t + 1)` to schedule a re-render

Under React 18's automatic batching and concurrent rendering, the state update
(`setRenderTick`) may be deferred or batched with other state updates in the same
frame. If `chunks` state is also updating simultaneously (e.g., the `useFrame`
callback generating new chunks), React may merge the updates and the filter may
not pick up the new destroyed key in time.

Additionally, `useFrame` in the chunk generation section also calls `setChunks`
every 200ms. If `setRenderTick` and `setChunks` are batched together, React may
re-render once, but with the OLD `chunks` state (since `setChunks` uses a
functional updater that reads from `prev`, not from the ref).

### 3. Rapier RigidBody cleanup on unmount

`@react-three/rapier` v1.5.0 cleans up rigid bodies and colliders when the
`RigidBody` component unmounts. However, the physics world step and React
rendering are asynchronous. If the physics step runs before React unmounts the
component, the collider remains active for that step. This is a one-frame delay
at worst and is generally acceptable -- but combined with issue #2, the block
may never unmount at all.

## Solution

### Task T01: Fix ChunkRenderer destruction mechanism (Wave 0)

Replace the fragile ref+renderTick pattern with proper React state. Convert
`destroyedBlocks` from a ref to state (or use a state-based approach that
guarantees re-render). Also ensure the `destroyBlock` imperative handle
calls `setRenderTick` synchronously via `flushSync` if needed.

### Task T02: Wire up Block.tsx particle effect on destruction (Wave 0)

Remove the dead `destroyed` state and `onDestroy` prop from Block.tsx. The
destruction is already handled by ChunkRenderer filtering. Instead, add a
standalone `BlockDestroyEffect` component that ChunkRenderer spawns at the
destroyed block's position to play particles. This cleanly separates the
destruction effect from the block lifecycle.

### Task T03: Integration test and edge cases (Wave 1)

Verify that destruction works correctly for: projectile hits, dig, chunk
boundary blocks, multiple simultaneous destructions, and that particle effects
still play. Manual + automated test coverage.

## Waves

| Wave | Tasks       | Description                                      |
|------|-------------|--------------------------------------------------|
| 0    | T01, T02    | Core fixes (parallel, no dependency between them)|
| 1    | T03         | Integration testing (depends on T01 + T02)       |

## Files Affected

- `packages/frontend/src/game/systems/ChunkRenderer.tsx` (T01)
- `packages/frontend/src/game/entities/Block.tsx` (T02)
- `packages/frontend/src/game/scenes/GameScene3D.tsx` (T03 -- test verification)

## Risks

- **Low:** React 18 `flushSync` can degrade performance if overused. Only use it
  in the imperative `destroyBlock` handle, which is called infrequently.
- **Low:** Rapier collider one-frame delay is inherent to the physics engine and
  is generally not noticeable at 60fps.
