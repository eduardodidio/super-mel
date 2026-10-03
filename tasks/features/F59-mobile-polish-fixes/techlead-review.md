# Tech Lead Review: F59

**Verdict:** APPROVED
**Date:** 2026-10-03
**Reviewer:** TechLead Agent

## Per-Task Review

### F59-T01: Parallax Infinite
- Status: OK
- Notes:
  - The fix is clean and correct. Wrapping both meshes in a `<group ref={groupRef}>` and repositioning the group's `position.x` to match the player X in `useFrame` guarantees the 200-unit plane is always centered on the player. The texture UV offset (`px * PARALLAX_FACTOR`) continues to provide the parallax scrolling effect relative to the player's absolute position.
  - No additional draw calls or texture loads per frame — the `useFrame` callback only mutates existing `position.x` and `map.offset.x`, which are cheap GPU-side updates.
  - The cross-fade transition mesh is nested inside the same group, so biome transitions still work correctly at any distance.
  - The `<>` fragment was correctly replaced with `<group>` to support the ref.
  - Diagram `F59-architecture.mmd` was created and accurately represents all 5 fixes.
  - All acceptance criteria met.

### F59-T02: Fix Colisores Invisiveis
- Status: OK
- Notes:
  - The fix correctly splits block rendering into three paths:
    1. `!needsPhysics` (solid=false AND dangerous=false, e.g., leaf, water): visual-only `<mesh>` with no RigidBody. This eliminates the invisible colliders that were causing Mel to get stuck.
    2. `dangerous=true && !solid` (lava): RigidBody with `sensor={true}` — damage detection preserved.
    3. `solid=true` (stone, brick, etc.): RigidBody with `sensor={false}` — normal solid collision.
  - The `sensor` prop logic was also corrected from `sensor={!props.solid && !props.dangerous}` to `sensor={!props.solid && props.dangerous}` on the remaining RigidBody path. This is correct because the only block type reaching this path with `!solid` is lava (dangerous=true), which should indeed be a sensor.
  - Regarding Mel's `castRay` ground detection: the call uses `world.castRay(ray, maxToi, true, ...)` where the third parameter `true` means "solid only" in Rapier's API, which already excludes sensors from ray hit results. So even the old sensor colliders for leaf/water _should_ not have triggered ground detection via castRay. However, removing the unnecessary colliders entirely is the correct approach since it reduces the physics world complexity and eliminates any potential for edge-case interactions (e.g., collision callbacks, overlap events).
  - Block destruction mechanics are unaffected — destructible blocks (glass) have `solid=true`, so they keep their RigidBody.
  - Item blocks are handled by a separate early-return path and are unaffected.
  - All acceptance criteria met.

### F59-T03: Fix Controles Touch Mobile
- Status: OK
- Notes:
  - The migration from `onTouchStart/onTouchEnd` to `onPointerDown/onPointerUp` is the correct approach. Pointer Events are the modern standard and work across touch, mouse, pen, and emulated devices.
  - `onPointerLeave` and `onPointerCancel` are added to every button via the `handleRelease` callback, preventing "stuck" buttons when a finger slides off.
  - Visual feedback via `pressed` state tracking with opacity and scale transitions is clean and non-intrusive.
  - `handlePress` and `handleRelease` are wrapped in `useCallback` with `[controlsRef]` dependency — this is stable since `controlsRef` is a React ref that does not change identity.
  - The currying pattern `handlePress("key", true)` creates new function objects on each render (since the returned arrow function is not memoized). This is a minor concern but acceptable for 7 buttons — the allocation cost is negligible and React's reconciliation handles it fine.
  - Context menu prevention via `onContextMenu={preventContextMenu}` on every button AND the container prevents Android long-press menus.
  - CSS hardening is thorough: `touchAction: "manipulation"` on buttons (prevents double-tap zoom), `touchAction: "none"` on container (prevents all browser touch gestures), `WebkitTouchCallout: "none"` (prevents iOS callout), `userSelect: "none"` + `WebkitUserSelect: "none"`.
  - `e.preventDefault()` and `e.stopPropagation()` in `handlePress` prevent event bubbling to the R3F canvas.
  - All acceptance criteria met.

### F59-T04: Fullscreen Mobile
- Status: OK
- Notes:
  - Viewport meta tag correctly updated with `maximum-scale=1.0, viewport-fit=cover` for notch-aware layout.
  - CSS fix is well-structured: `html, body` with `position: fixed` prevents iOS bounce scroll; `#root` uses `100vh` as fallback with `100dvh` override (correct order — `100vh` first, `100dvh` second to override in supporting browsers).
  - Safe-area padding with `env(safe-area-inset-*, 0)` prevents content from being hidden behind notches/Dynamic Island.
  - The fullscreen API trigger in `App.tsx` is well-implemented:
    - Mobile-only via user-agent check.
    - Uses `{ once: true }` for auto-removal of listener — clean approach.
    - Handles vendor prefixes (`webkitRequestFullscreen`, `msRequestFullscreen`).
    - Errors are silently caught (`.catch(() => {})`) which is correct since fullscreen may be denied on some browsers.
    - Orientation lock to landscape is attempted as a progressive enhancement with graceful fallback.
  - The cleanup function in the useEffect correctly removes the listener if the component unmounts before the first tap.
  - Desktop is unaffected (user-agent check gates the entire effect).
  - Diagram `F59-journey.mmd` was created and accurately represents the mobile user journey.
  - All acceptance criteria met.

### F59-T05: Fix PWA Install
- Status: OK (with one minor note)
- Notes:
  - The `/api/health` fetch was correctly removed from both the `activate` event handler and the `fetch` event handler for navigation requests. This was a problematic pattern that could interfere with SW activation on static deploys.
  - Service worker is now clean: precache on install, clean old caches on activate, network-first for navigation, cache-first for static assets, network-first default. This is a solid caching strategy.
  - The `manifest.json` was updated from `"display": "standalone"` to `"display": "fullscreen"` which provides maximum immersion for the game when launched from the home screen.
  - Icon files verified: all three icons exist with non-zero file sizes (icon-192.png: 1463B, icon-512.png: 6138B, icon-maskable-512.png: 6063B). Manifest icon entries include proper `purpose` attributes.
  - `usePWAInstall.ts` improvements are solid: proper debug logging at every lifecycle point, named `installedHandler` function for clean event removal, SW ready logging.
  - The `appinstalled` event listener is now properly cleaned up in the useEffect return, fixing a potential memory leak in the original code.
  - All acceptance criteria met.

**Minor Note (non-blocking):** The `usePWAInstall.ts` checks `window.matchMedia("(display-mode: standalone)")` to detect if the app is already installed, but the manifest now uses `"display": "fullscreen"`. When launched as a fullscreen PWA, the media query `(display-mode: standalone)` may not match. The check should be updated to also check `(display-mode: fullscreen)`:
  ```ts
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as any).standalone === true;
  ```
  This is non-blocking because: (1) the `appinstalled` event handler will correctly set `isInstalled = true` at install time, and (2) in practice, browsers may still report `standalone` even for `fullscreen` manifest entries in some implementations. However, this should be addressed in a follow-up to ensure correctness on all browsers.

## Architecture Assessment

The changes are well-scoped and follow the existing codebase patterns:

- **ParallaxImageBackground.tsx** (T01): Minimal change — adds a group ref and one position update per frame. No new allocations, no new components. Follows the existing pattern of using `useFrame` for per-frame updates.
- **Block.tsx** (T02): Clean separation of rendering paths based on physics properties. The early return pattern for non-physics blocks is consistent with the existing early returns for `isBackground` and `activated` item blocks.
- **TouchControls3D.tsx** (T03): Proper migration to Pointer Events with `useCallback` memoization. The component structure and style objects remain consistent.
- **App.tsx + index.html** (T04): The fullscreen logic is appropriately placed at the app root level. CSS changes are minimal and surgical.
- **sw.js + manifest.json + usePWAInstall.ts** (T05): Removal of the problematic `/api/health` fetch simplifies the SW lifecycle. Debug logging is helpful for production troubleshooting.

All five fixes are independent and do not interfere with each other, which was the correct architectural choice for maximum parallelism.

## Issues Found

**No blocking issues.**

1. **Minor: `display-mode` media query mismatch** (T05) — As noted above, `usePWAInstall.ts` checks only `(display-mode: standalone)` but the manifest now declares `"display": "fullscreen"`. This should be fixed in a follow-up task. Impact: when reopening an installed PWA, the `isInstalled` flag might not be set correctly on initial load, potentially causing the install prompt listener to register unnecessarily. The `appinstalled` event compensates at install time but not on subsequent launches.

## Recommendations

1. **Follow-up task:** Update `usePWAInstall.ts` to also check `(display-mode: fullscreen)` media query to match the new manifest display mode.
2. **Consider:** Adding `display: flex; align-items: center; justify-content: center;` to the `dpadBtn` style in the style object (it is already present but only in the object literal, which is good).
3. **Consider:** For very long play sessions, the parallax UV offset (`px * 0.002`) will grow without bound. At extreme distances (e.g., x=100000), `offset.x = 200` which is fine since the texture uses `RepeatWrapping`. No action needed, just noting the math is safe.
4. **Testing priority:** The touch controls changes (T03) should receive extra manual testing on real mobile devices, as Chrome DevTools emulation does not perfectly replicate multi-touch behavior and pointer event timing.
