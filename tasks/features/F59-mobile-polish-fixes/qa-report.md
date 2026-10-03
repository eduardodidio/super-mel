# QA Report: F59 -- Mobile + Polish Fixes

**Verdict:** PASS
**Date:** 2026-10-03
**Reviewer:** QA Agent

---

## Per-Task Validation

### T01: Parallax Background Infinito

**File:** `packages/frontend/src/game/systems/ParallaxImageBackground.tsx`

- [x] Background tracks player position (`groupRef.current.position.x = px` on line 66)
- [x] Parallax scrolling effect preserved (`currentMatRef.current.map!.offset.x = offset` on line 70)
- [x] No visual seam risk -- the mesh is always centered on the player, so the 200-unit plane never exits the frustum
- [x] Cross-fade between biome themes works -- both meshes are children of the same `<group ref={groupRef}>`, so both reposition together
- [x] Performance: no additional draw calls or texture loads. The `useFrame` callback only mutates `position.x` and `map.offset.x`, which are cheap GPU-side uniforms
- [x] `groupRef` is correctly typed as `useRef<THREE.Group>(null)` and attached to the wrapping `<group>` element (line 80)
- [x] Fragment (`<>`) correctly replaced with `<group>` to support the ref
- [x] Diagram `docs/diagrams/F59-architecture.mmd` created and accurately depicts all 5 fixes

**Notes:**
- The UV offset `px * 0.002` grows unbounded but the texture uses `RepeatWrapping`, so modular arithmetic handles wrap correctly at any distance. Math is safe even at extreme values like x=100000 (offset=200, which wraps cleanly).
- Y-axis is not tracked. The plane is tall enough (PLANE_HEIGHT=40) that normal gameplay heights (double jump, etc.) should not cause the background to disappear vertically. If extreme Y becomes possible in the future, this should be revisited.

**Verdict: PASS**

---

### T02: Fix Colisores Invisiveis (Mel Travando)

**File:** `packages/frontend/src/game/entities/Block.tsx`

- [x] Mel moves smoothly through leaf blocks -- leaf has `{solid: false, dangerous: false}`, so `needsPhysics = false`, rendering visual-only mesh (lines 96-103)
- [x] Mel moves smoothly through water blocks -- same logic as leaf
- [x] Lava blocks still damage Mel -- lava has `{solid: false, dangerous: true}`, so `needsPhysics = true` and `sensor={!false && true} = true` (line 113). Sensor collider preserved for damage detection
- [x] Solid blocks still block Mel -- stone/brick/iron/etc. have `{solid: true}`, so `needsPhysics = true` and `sensor={!true && false} = false`. Normal collider preserved
- [x] Ground detection works correctly -- Mel's `castRay` on line 139-142 uses `true` for the solid-only parameter, which already excluded sensors. Removing unnecessary sensor colliders simplifies the physics world
- [x] No regression in block destruction -- destructible blocks (wood, glass) have `{solid: true}`, keeping their RigidBody
- [x] Item blocks still work -- handled by a separate early-return path (lines 65-79), unaffected by the `needsPhysics` change
- [x] Background blocks still render correctly -- handled by the `isBackground` early-return (lines 82-94), unaffected
- [x] Visual-only blocks still render with correct materials -- `material={materials}` is passed on line 100

**Notes:**
- The `sensor` prop logic change from `sensor={!props.solid && !props.dangerous}` to `sensor={!props.solid && props.dangerous}` is subtle but correct. The only non-solid block type that should have a sensor is lava (dangerous=true). Previously, the double negation meant lava got `sensor=false` (incorrect, since lava is not solid and should be a sensor), while leaf/water got `sensor=true` (unnecessary). The fix corrects both paths.
- The `platform: true` property on leaf blocks is a metadata flag not used by physics. The fix correctly ignores it for collider decisions.

**Verdict: PASS**

---

### T03: Fix Controles Touch Mobile

**File:** `packages/frontend/src/game/systems/TouchControls3D.tsx`

- [x] All buttons use `onPointerDown`/`onPointerUp` (7 buttons: up, down, left, right, jump, shoot, bark)
- [x] No residual `onTouchStart`/`onTouchEnd` handlers -- grep confirms zero matches
- [x] `onPointerLeave` added to all 7 buttons for release-on-slide-off
- [x] `onPointerCancel` added to all 7 buttons for release on system interrupt
- [x] Visual feedback via `pressed` state tracking with opacity (0.85 -> 0.6) and scale (1 -> 0.9) transitions
- [x] `handlePress` and `handleRelease` are wrapped in `useCallback` with stable `[controlsRef]` dependency
- [x] Context menu prevention via `onContextMenu={preventContextMenu}` on every button AND the container
- [x] CSS hardening complete:
  - `touchAction: "manipulation"` on buttons (prevents double-tap zoom)
  - `touchAction: "none"` on container (prevents all browser touch gestures)
  - `WebkitTouchCallout: "none"` on buttons (prevents iOS callout)
  - `userSelect: "none"` + `WebkitUserSelect: "none"` on buttons
- [x] `e.preventDefault()` and `e.stopPropagation()` in `handlePress` prevent event bubbling to the R3F canvas
- [x] Desktop mouse click still works -- Pointer Events API handles both mouse and touch
- [x] `useGameState.getState()` correctly used outside render cycle (Zustand vanilla access in event handler)

**Notes:**
- The currying pattern `handlePress("key", true)` creates new function objects on each render. This is acceptable for 7 buttons -- the allocation cost is negligible.
- Multi-touch works because each button has independent event handlers; the browser dispatches separate pointer events per touch point.

**Verdict: PASS**

---

### T04: Fullscreen Mobile (Esconder Header do Browser)

**Files:** `packages/frontend/index.html`, `packages/frontend/src/App.tsx`

- [x] Viewport meta tag updated with `viewport-fit=cover` and `maximum-scale=1.0` (line 5 of index.html)
- [x] CSS `100dvh` with `100vh` fallback -- `100vh` listed first (line 27), `100dvh` overrides (line 28). Correct cascade order
- [x] `html, body` fixed position prevents iOS bounce scroll (lines 16-23)
- [x] Safe-area padding with `env(safe-area-inset-*, 0)` prevents content behind notch/Dynamic Island (line 30)
- [x] `box-sizing: border-box` on `#root` ensures padding doesn't cause overflow (line 29)
- [x] Fullscreen API trigger in App.tsx is mobile-only via user-agent check (line 12)
- [x] Uses `{ once: true }` on the listener for auto-removal (line 29 of App.tsx)
- [x] Handles vendor prefixes (`webkitRequestFullscreen`, `msRequestFullscreen`) (lines 18-19)
- [x] Errors silently caught (`.catch(() => {})`) -- correct since fullscreen may be denied
- [x] Orientation lock to landscape attempted as progressive enhancement (lines 24-26)
- [x] Desktop not affected -- user-agent check gates the entire effect
- [x] Cleanup function correctly removes listener on unmount (line 30)
- [x] Diagram `docs/diagrams/F59-journey.mmd` created and accurately represents mobile user journey

**Notes:**
- iOS Safari does not support `requestFullscreen()` on `document.documentElement`. The Fullscreen API trigger will silently fail on iOS, but the CSS approach (`100dvh` + fixed positioning) provides the visual effect. The `apple-mobile-web-app-capable` meta tag handles standalone mode for iOS.

**Verdict: PASS**

---

### T05: Fix PWA Install

**Files:** `packages/frontend/public/sw.js`, `packages/frontend/public/manifest.json`, `packages/frontend/src/hooks/usePWAInstall.ts`

- [x] `/api/health` fetch completely removed from sw.js -- grep confirms zero matches
- [x] Service worker is clean: precache on install (`skipWaiting`), clean old caches on activate (`clients.claim`), network-first for navigation, cache-first for static assets
- [x] `/api/*` requests correctly bypass SW caching (line 36 of sw.js)
- [x] manifest.json updated to `"display": "fullscreen"` (line 6)
- [x] `theme_color` and `background_color` added (lines 8-9)
- [x] All 3 icon files exist with non-zero sizes: icon-192.png (1463B), icon-512.png (6138B), icon-maskable-512.png (6063B)
- [x] Icon entries have proper `purpose` attributes: "any" for standard icons, "maskable" for maskable icon
- [x] `usePWAInstall.ts` has debug logging at all lifecycle points: registration, beforeinstallprompt, SW ready, install prompt, install result
- [x] `appinstalled` event listener properly cleaned up in useEffect return (lines 48-51)
- [x] Display-mode media query checks BOTH `standalone` AND `fullscreen` (lines 19-20) -- correctly matches the new manifest display mode (this addresses the TechLead's noted concern)
- [x] SW registration in `main.tsx` has proper error handling with `console.warn` (line 19)
- [x] Console logs use `[PWA]` prefix for easy filtering

**Notes:**
- The `short_name` was changed from `"SuperMel"` (in the plan) to `"Super Mel"` (with space, in the implementation). This is fine -- the space makes it more readable on home screens.
- The `categories` field `["games", "entertainment"]` is a nice addition for app store discoverability.

**Verdict: PASS**

---

## Cross-Cutting Checks

### TypeScript Compilation
- [x] **PASS** -- `npx tsc --noEmit` completed with zero errors

### Console Error Patterns
- [x] **PASS** -- No `console.error` calls in any modified file. Debug logging uses `console.log` (PWA) and `console.warn` (SW registration failure only)

### Security Review
- [x] **PASS** -- No `innerHTML`, `dangerouslySetInnerHTML`, `eval()`, or XSS vectors found in modified files. No hardcoded secrets. User-agent check is non-security-critical (progressive enhancement only).

### TODO/FIXME/HACK Comments
- [x] **PASS** -- No leftover TODO, FIXME, or HACK comments in any modified file

### Desktop Regression Risk
- [x] **LOW** -- All mobile-specific code is gated by platform checks:
  - Touch controls: `isMobile` state from `ontouchstart` detection, only renders when `scene === "playing"` and no gamepad
  - Fullscreen API: gated by `/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)`
  - CSS changes: `100dvh` on `#root` is a visual-only change; `100vh` fallback means desktop behavior unchanged
  - Block.tsx changes: apply to all platforms but are a correctness fix (removing phantom colliders)
  - ParallaxImageBackground: applies to all platforms but is a correctness fix (following player position)

### Diagram Validation
- [x] `docs/diagrams/F59-architecture.mmd` -- exists, correctly shows all 5 task subgraphs with component relationships
- [x] `docs/diagrams/F59-journey.mmd` -- exists, correctly shows mobile user journey from discovery through install, fullscreen, and gameplay

### Doc-Review Gate
- [ ] **README.md** not updated with F59 feature note -- **NEEDS FIX** before feature ships
- [ ] **docs/README.md** not updated with F59 diagrams -- **NEEDS FIX** before feature ships
- [x] Diagrams F59-architecture.mmd and F59-journey.mmd created
- [x] No significant architectural decision requiring an ADR (these are bug fixes, not architecture changes)
- [x] PRD exists inline in F59-README.md

---

## Issues Found

### Issue 1: Doc-Review Gate Incomplete (NON-BLOCKING but REQUIRED before ship)

**Severity:** Medium (process requirement, not a code bug)
**Description:** The project's doc-review gate (defined in CLAUDE.md) requires that every shipped feature updates:
1. `README.md` with a note about the feature in the "Features Entregues" section
2. `docs/README.md` index if new docs/diagrams were created

Both files currently have no mention of F59. This must be addressed before the feature is considered "done" per project rules.

**Recommendation:** Add a brief F59 entry to README.md and update docs/README.md index with the two new diagram paths.

### Issue 2: None (Code)

No code-level blocking issues were found. All 5 fixes are implemented correctly and match their acceptance criteria.

---

## Regression Risk Assessment

| Area | Risk Level | Rationale |
|------|-----------|-----------|
| Desktop keyboard controls | Very Low | TouchControls3D changes only affect the mobile touch component; keyboard handlers in Mel.tsx are completely separate |
| Block physics (ground detection) | Low | The `castRay` already uses solid-only filtering (`true` flag). Removing non-solid sensors reduces physics world complexity without changing ray cast behavior |
| Lava damage | Low | Lava path explicitly preserved with `sensor={true}`. Code path is clear and separate from the visual-only path |
| Parallax visual | Very Low | Adding `position.x = px` is additive. Texture UV offset behavior unchanged. No new allocations per frame |
| PWA install flow | Low | Removing `/api/health` is strictly subtractive (removing a failing call). Debug logging is additive. The `display-mode` media query fix is proactive |
| CSS layout (desktop) | Very Low | `position: fixed` on html/body and `100dvh` override are standard patterns. Desktop browsers support both `vh` and `dvh` correctly |
| Editor functionality | Low | Block.tsx changes affect editor block rendering the same way as game rendering. Non-solid blocks in the editor (leaf, water placed for decoration) will correctly lack colliders in play-test mode |

---

## Summary

All 5 tasks pass code review and acceptance criteria validation. TypeScript compilation succeeds with zero errors. No security issues, no console.error patterns, no leftover TODO/FIXME comments. The only outstanding item is the doc-review gate (README.md updates), which is a process requirement that must be completed before the feature ships but does not block the code changes themselves.

The implementation quality is high across all tasks. The developer correctly addressed the TechLead's noted concern about `display-mode` media query mismatch by adding the `(display-mode: fullscreen)` check to `usePWAInstall.ts`.

---

## Retrospective Notes

### For QA (append to memory/agent-learnings/qa.md)
- **Always check the doc-review gate early in QA.** README.md and docs/README.md updates are mandatory per project rules but are easily overlooked because they are not code changes. Include doc-gate validation as the first check in QA workflow.
- **Verify vendor-prefixed CSS properties pass TypeScript compilation.** Properties like `WebkitTouchCallout` and `WebkitUserSelect` are valid in React's CSSProperties type but could fail in stricter type checking setups. Running `tsc --noEmit` catches this.
- **For mobile-specific fixes, verify the platform gate mechanism.** Each mobile-only feature should have a clear conditional (user-agent check, `ontouchstart` detection, `matchMedia` query) that prevents it from activating on desktop. Check all gates in a single pass.

### For Developer (append to memory/agent-learnings/developer.md)
- **When changing manifest.json `display` mode, update all `matchMedia` checks that reference display modes.** Changing from `standalone` to `fullscreen` requires updating any `(display-mode: standalone)` media queries elsewhere in the codebase. This was correctly handled in F59 but is a common oversight.
- **When removing physics colliders from blocks, verify the downstream ray cast filter flags.** Rapier's `castRay` third parameter controls sensor filtering. Even though removing sensors was correct, understanding the ray cast behavior is critical to preventing ground detection regressions.
