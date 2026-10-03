# F59 Test Plan — Mobile + Polish Fixes

**Feature:** F59 — Mobile + Polish Fixes
**Date:** 2026-10-03
**Author:** TEA (Test Architect)
**Status:** planned

---

## 1. Overview

Feature F59 addresses 5 independent bug/polish fixes that directly impact the mobile gameplay experience and general game polish:

| Task | Summary | Area |
|------|---------|------|
| F59-T01 | Parallax background ends when player travels far | Rendering / Visual |
| F59-T02 | Invisible colliders (leaf, water) trap Mel | Physics / Gameplay |
| F59-T03 | Touch control buttons unresponsive on mobile | Input / Mobile |
| F59-T04 | Browser chrome visible on mobile (not fullscreen) | Layout / Mobile |
| F59-T05 | PWA install flow broken | PWA / Infrastructure |

All 5 tasks are independent (Wave 0, no inter-dependencies). The test plan covers each task individually plus cross-task integration scenarios, regression risk, and platform-specific considerations.

**Key risk profile:** These fixes are all user-facing. T01 and T02 affect all platforms. T03, T04, and T05 are mobile-specific. Regressions on desktop gameplay are a primary concern.

---

## 2. Test Strategy

### Approach

| Layer | Method | Tools |
|-------|--------|-------|
| Unit behavior | Manual functional testing | Browser, Chrome DevTools |
| Visual correctness | Manual visual inspection | Multiple devices, screenshots |
| Mobile input | Manual device testing | Real Android + iOS devices |
| PWA compliance | Automated audit + manual | Lighthouse, DevTools Application panel |
| Performance | FPS monitoring | Chrome Performance tab, stats.js overlay |
| Regression | Manual gameplay session | Desktop Chrome/Firefox/Edge |

### Why manual-first

These fixes involve visual rendering (parallax), physics feel (colliders), touch input (haptic feedback), fullscreen behavior (OS-level API), and PWA install (browser-native prompt). None of these can be reliably validated by unit tests alone. Manual testing on real devices is the primary validation method.

### Automated checks (where applicable)

- **Lighthouse PWA audit** for T05 — automated installability checks.
- **DevTools Application panel** for T05 — manifest validation, SW status.
- **Console log assertions** for T03/T05 — debug logging to verify event flow.
- **Dev console teleportation** for T01 — scripted position change to test extreme distances.

### Definition of Done per test case

A test case passes when:
1. The expected result is observed.
2. No console errors are introduced.
3. No visual glitches or performance degradation occur.
4. The behavior is consistent across 3 consecutive attempts.

---

## 3. Test Environment

### Desktop (regression + T01/T02 validation)

| Browser | Version | OS | Priority |
|---------|---------|-----|----------|
| Chrome | Latest stable | Windows 10/11 | P1 |
| Firefox | Latest stable | Windows 10/11 | P2 |
| Edge | Latest stable | Windows 10/11 | P2 |
| Chrome | Latest stable | macOS | P3 |
| Safari | Latest stable | macOS | P3 |

### Mobile (primary target for T03/T04/T05)

| Device | OS | Browser | Priority |
|--------|-----|---------|----------|
| Android phone (mid-range) | Android 12+ | Chrome | P1 |
| iPhone (with notch/Dynamic Island) | iOS 16+ | Safari | P1 |
| Android tablet | Android 12+ | Chrome | P2 |
| iPad | iPadOS 16+ | Safari | P2 |
| Android phone (budget) | Android 10+ | Chrome | P3 |

### Emulators / DevTools

| Tool | Use case |
|------|----------|
| Chrome DevTools Device Toolbar | Quick mobile layout/touch emulation (T03, T04) |
| Chrome DevTools Application panel | SW status, manifest validation, cache inspection (T05) |
| Chrome DevTools Performance tab | FPS monitoring (T01) |
| Lighthouse (in DevTools) | PWA audit (T05) |
| Chrome remote debugging (USB) | Real-device console inspection |
| Safari Web Inspector (USB to iPhone) | iOS-specific debugging |

### Network conditions

| Condition | Use case |
|-----------|----------|
| Online (fast WiFi) | All test cases |
| Offline / Airplane mode | T05 — PWA offline capability |
| Slow 3G (throttled) | T05 — SW caching under slow load |

### Dev server commands

- **Dev mode:** `cd packages/frontend && npx vite dev --host` (exposes to LAN for mobile testing)
- **Production build:** `cd packages/frontend && npx vite build && npx vite preview --host` (required for PWA/SW testing)

---

## 4. Test Cases by Task

### T01 — Parallax Background Infinito

| ID | Description | Preconditions | Steps | Expected Result | Priority |
|----|-------------|---------------|-------|-----------------|----------|
| TC-01 | Background visible at game start | Game loaded, level started | 1. Start game. 2. Observe background behind level geometry. | Parallax background is visible with mountain/desert imagery filling the viewport behind the level. | P1 |
| TC-02 | Background persists during rightward travel | Game loaded | 1. Start game. 2. Move Mel rightward continuously for 2+ minutes (~200+ units). 3. Observe background throughout. | Background remains visible at all times. No gap, disappearance, or black void behind the level. | P1 |
| TC-03 | Background visible at extreme distance (X=500) | Game loaded, dev console accessible | 1. Open browser console. 2. Teleport Mel to X=500 (via game state or direct position set). 3. Observe background. | Background is fully visible and properly rendered at X=500. | P1 |
| TC-04 | Background visible at extreme distance (X=5000) | Game loaded, dev console accessible | 1. Teleport Mel to X=5000. 2. Observe background. | Background is fully visible. No visual artifacts, seams, or gaps. | P1 |
| TC-05 | Background visible at negative X | Game loaded | 1. Move Mel leftward past origin (X < 0). 2. Observe background. | Background still visible and correctly positioned at negative X values. | P2 |
| TC-06 | Parallax effect still functional | Game loaded | 1. Move Mel right slowly, then fast. 2. Observe background scroll rate vs foreground. | Background scrolls slower than foreground blocks (parallax factor preserved). Movement speed difference is perceptible. | P1 |
| TC-07 | No visual seams or pop-in | Game loaded | 1. Move rightward steadily for 3 minutes. 2. Watch for any frame where background "jumps", flickers, or shows a seam. | Smooth continuous background. No single-frame glitches, pops, or visible tile edges. | P1 |
| TC-08 | Biome cross-fade at distance | Game loaded, player advanced to biome transition | 1. Play until a biome transition occurs (e.g., mountain -> desert). 2. Observe background transition. | Cross-fade between background themes occurs smoothly. No flash, hard cut, or missing frame during transition. | P2 |
| TC-09 | Performance — no FPS drop | Game loaded, Chrome Performance tab open | 1. Open Chrome Performance tab or FPS overlay. 2. Play for 2 minutes, note FPS. 3. Compare to baseline (before fix). | FPS is stable and comparable to pre-fix baseline. No additional draw calls per frame. No texture reloads. | P2 |
| TC-10 | Y-axis — background during high jumps | Game loaded | 1. Find a tall area or use double jump from elevation. 2. Observe background alignment at various heights. | Background horizon remains visually coherent. No void visible above or below the background plane during normal gameplay heights. | P3 |

### T02 — Fix Colisores Invisiveis

| ID | Description | Preconditions | Steps | Expected Result | Priority |
|----|-------------|---------------|-------|-----------------|----------|
| TC-11 | Mel walks through leaf blocks | Level with leaf blocks present | 1. Navigate Mel to a section containing leaf blocks at Z=0. 2. Walk into/through the leaf blocks. | Mel passes through leaf blocks without stopping or getting stuck. Leaf blocks are visual only. | P1 |
| TC-12 | Mel walks through water blocks | Level with water blocks present | 1. Navigate Mel to a section with water blocks. 2. Walk into/through water area. | Mel passes through water blocks without invisible barriers. Movement is unobstructed. | P1 |
| TC-13 | Solid blocks still block Mel | Level with stone/brick/iron blocks | 1. Walk Mel into a solid block (stone, brick, iron, etc.). 2. Try to pass through. | Mel is blocked by the solid surface. Cannot walk through or clip into solid blocks. | P1 |
| TC-14 | Lava still damages Mel | Level with lava blocks | 1. Navigate Mel into lava blocks. 2. Observe health/damage response. | Mel takes damage on contact with lava. Sensor collider triggers damage correctly. Hearts decrease. | P1 |
| TC-15 | Ground detection on solid blocks | Level with varied terrain | 1. Jump on top of stone, brick, iron, earth, sand, wood blocks. 2. Observe landing. | Mel lands correctly on all solid block types. No floating above surface, no falling through. | P1 |
| TC-16 | Item blocks still interactive | Level with item_blocks | 1. Jump and hit an item_block from below. 2. Observe interaction. | Item block reacts to hit (animation, item spawn). Solid collision from below works correctly. | P1 |
| TC-17 | Destructible blocks still break | Level with destructible blocks, Bola do Infinito available | 1. Shoot the Bola do Infinito at a destructible block. 2. Observe destruction. | Block is destroyed. Destruction animation plays. Physics debris appears. | P2 |
| TC-18 | Ground detection near water/leaf | Level with water/leaf adjacent to solid ground | 1. Walk along solid ground adjacent to water or leaf blocks. 2. Jump and land near the boundary. | No false ground detection. Mel does not float at the boundary. Landing is on solid blocks only. | P2 |
| TC-19 | Leaf blocks visual rendering preserved | Level with leaf blocks | 1. Navigate to leaf blocks. 2. Observe visual appearance. | Leaf blocks render visually with correct texture and position. Only physics is removed, not rendering. | P2 |
| TC-20 | Extended play — no stuck points | Full level | 1. Play through an entire level from start to finish. 2. Note any points where Mel gets stuck or movement feels wrong. | No stuck points anywhere in the level. Fluid movement throughout. | P1 |

### T03 — Fix Controles Touch Mobile

| ID | Description | Preconditions | Steps | Expected Result | Priority |
|----|-------------|---------------|-------|-----------------|----------|
| TC-21 | Single button tap — D-pad left | Mobile device, game loaded | 1. Tap the left D-pad button. 2. Observe Mel's movement. 3. Release. | Mel moves left while button is held. Stops when released. | P1 |
| TC-22 | Single button tap — D-pad right | Mobile device, game loaded | 1. Tap the right D-pad button. 2. Observe. 3. Release. | Mel moves right while held. Stops on release. | P1 |
| TC-23 | Single button tap — A (jump) | Mobile device, game loaded | 1. Tap the A button. | Mel jumps. Single tap = single jump. | P1 |
| TC-24 | Single button tap — B (attack) | Mobile device, game loaded | 1. Tap the B button. | Mel fires the Bola do Infinito / performs attack action. | P1 |
| TC-25 | Single button tap — C (bark) | Mobile device, game loaded | 1. Tap the C button. | Mel barks. Bark sound/animation triggers. Nearby enemies stunned if applicable. | P1 |
| TC-26 | D-pad up (look up) | Mobile device, game loaded | 1. Tap D-pad up button. | Camera shifts to show area above Mel (look up behavior). | P2 |
| TC-27 | D-pad down (crouch) | Mobile device, game loaded | 1. Tap and hold D-pad down. | Mel crouches. After 1s hold, sniff mechanic may trigger. | P2 |
| TC-28 | Multi-touch — move + jump | Mobile device, game loaded | 1. Hold right D-pad with left thumb. 2. Tap A (jump) with right thumb. | Mel jumps while moving right. Both inputs register simultaneously. | P1 |
| TC-29 | Multi-touch — move + attack | Mobile device, game loaded | 1. Hold right D-pad. 2. Tap B (attack). | Mel attacks while moving. Bola fires in movement direction. | P1 |
| TC-30 | Visual feedback on press | Mobile device, game loaded | 1. Press any button. 2. Observe button appearance while pressed. | Button shows visible feedback: opacity decreases and/or scale reduces while pressed. Reverts on release. | P1 |
| TC-31 | Slide finger off button — release | Mobile device, game loaded | 1. Press and hold right D-pad. 2. Without lifting finger, slide it off the button area. | Mel stops moving. The input is released when finger leaves button bounds (onPointerLeave fires). | P1 |
| TC-32 | Rapid taps on A button | Mobile device, game loaded | 1. Tap the A button rapidly (5+ times per second) for 3 seconds. | Each tap is registered. No missed inputs, no "stuck" jump state. Double jump triggers on second mid-air tap. | P2 |
| TC-33 | Long press — no context menu | Mobile Android, game loaded | 1. Long-press (3 seconds) on any touch control button. | No browser context menu appears. No text selection UI. Button remains in held state. | P1 |
| TC-34 | No accidental zoom or scroll | Mobile device, game loaded | 1. Use touch controls normally for 1 minute of gameplay. 2. Try pinch-to-zoom on the button area. | No page zoom, scroll, or browser gesture interference occurs during normal touch control usage. | P1 |
| TC-35 | Two fingers on same button | Mobile device, game loaded | 1. Place two fingers on the same button simultaneously. 2. Lift one finger. 3. Lift second finger. | No crash, no duplicate input registration. Button releases correctly when both fingers lift. | P3 |
| TC-36 | Desktop mouse click on touch buttons | Desktop browser, game in mobile layout or resized | 1. Resize browser to show touch controls (if responsive) or force-enable them. 2. Click buttons with mouse. | Mouse clicks on touch buttons still register correctly. No regression from Pointer Events migration. | P2 |
| TC-37 | Chrome DevTools emulation | Chrome desktop, DevTools device toolbar enabled | 1. Toggle Chrome DevTools device toolbar (mobile emulation). 2. Select a mobile device preset. 3. Tap touch control buttons. | Touch buttons respond correctly in emulated touch mode. | P2 |
| TC-38 | Chrome Android — full session | Real Android device, Chrome | 1. Play a full game session (2+ minutes) using only touch controls. 2. Perform all actions: move, jump, double jump, attack, bark, crouch. | All controls responsive throughout. No stuck buttons, no missed inputs, no drift. | P1 |
| TC-39 | Safari iOS — full session | Real iPhone, Safari | 1. Play a full game session using touch controls. 2. Perform all actions. | All controls responsive. No iOS-specific issues (callout popups, selection, gestures). | P1 |

### T04 — Fullscreen Mobile

| ID | Description | Preconditions | Steps | Expected Result | Priority |
|----|-------------|---------------|-------|-----------------|----------|
| TC-40 | Chrome Android — fullscreen on tap | Android device, Chrome, game loaded | 1. Open game URL in Chrome Android. 2. Tap anywhere on the game. | Browser address bar hides. Game occupies the full screen. No browser chrome visible during gameplay. | P1 |
| TC-41 | Safari iOS — address bar minimizes | iPhone, Safari, game loaded | 1. Open game URL in Safari. 2. Tap to interact. 3. Scroll interactions during play. | Safari address bar minimizes to compact mode. Maximum screen real estate for game. | P1 |
| TC-42 | Notch/Dynamic Island — safe area | iPhone with notch or Dynamic Island | 1. Open game in landscape mode. 2. Observe game content near the notch area. | Game content is not hidden behind the notch or Dynamic Island. Safe area padding prevents overlap. Touch controls remain accessible. | P1 |
| TC-43 | No bounce scroll on iOS | iPhone, Safari | 1. Open game. 2. Try to scroll the page by swiping up/down on non-button areas. | No elastic bounce scroll effect. Page stays fixed. Game canvas does not shift or rubber-band. | P1 |
| TC-44 | Viewport height — no gap below | Mobile device, landscape | 1. Open game. 2. Observe bottom edge of game canvas. | Game canvas fills to the bottom of the screen. No white/black gap beneath the game area. `100dvh` correctly accounts for browser chrome. | P1 |
| TC-45 | Device rotation — portrait to landscape | Mobile device, portrait orientation | 1. Open game in portrait. 2. Rotate device to landscape. | Game resizes correctly to fill landscape viewport. Fullscreen mode maintained. No layout breakage. | P2 |
| TC-46 | Device rotation — landscape to portrait | Mobile device, landscape | 1. Playing game in landscape. 2. Rotate to portrait. | Game resizes correctly. Layout adapts (or prompts to rotate). No crash or layout corruption. | P2 |
| TC-47 | App switch and return | Mobile device, game fullscreen | 1. Enter fullscreen game. 2. Switch to another app (home button or app switcher). 3. Return to game. 4. Tap the game area. | Fullscreen resumes after next tap. Game state preserved. No visual glitch on re-entry. | P2 |
| TC-48 | Desktop — no unwanted fullscreen | Desktop Chrome | 1. Open game on desktop. 2. Click to start playing. | No fullscreen request triggered. Game displays in normal browser window. Desktop layout unchanged. | P1 |
| TC-49 | Older browser fallback (100vh) | Browser without dvh support (or emulated) | 1. Open game in a browser that does not support `dvh` units. 2. Observe layout. | Game still fills viewport using `100vh` fallback. Slight address bar overlap acceptable, but no major layout breakage. | P3 |
| TC-50 | PWA standalone mode — fullscreen | Installed PWA, opened from home screen | 1. Open Super Mel from home screen (installed as PWA). 2. Observe display. | App opens fullscreen with no browser chrome at all. Status bar behavior matches manifest display mode. | P2 |

### T05 — Fix PWA Install

| ID | Description | Preconditions | Steps | Expected Result | Priority |
|----|-------------|---------------|-------|-----------------|----------|
| TC-51 | Service Worker registers successfully | Production build served (`vite preview`), Chrome | 1. Open game URL. 2. Open DevTools > Application > Service Workers. 3. Observe SW status. | Service Worker is listed with status "activated and running". No registration errors. Scope is `/`. | P1 |
| TC-52 | Service Worker activates without errors | Production build, Chrome DevTools console | 1. Open game URL (fresh, clear SW first). 2. Watch console for SW logs and errors. | Console shows `[PWA] SW ready, scope: ...`. No errors related to `/api/health` fetch or activation failure. | P1 |
| TC-53 | Manifest is valid | Production build, Chrome DevTools | 1. Open DevTools > Application > Manifest. 2. Review all fields. | Manifest shows: name="Super Mel", short_name="SuperMel", display="standalone" (or "fullscreen"), start_url="/", icons listed, theme_color and background_color present. No warnings. | P1 |
| TC-54 | Icons load correctly (no 404) | Production build, Chrome DevTools Network tab | 1. Open game. 2. Filter Network tab for "icon". 3. Check status codes. | All 3 icons return 200: icon-192.png (192x192), icon-512.png (512x512), icon-maskable-512.png (512x512 maskable). No 404 errors. | P1 |
| TC-55 | Install button appears in game | Chrome Android, game loaded, SW active | 1. Open game in Chrome Android. 2. Wait for SW to activate (few seconds). 3. Look for in-game "Install" button/prompt. | An install button or prompt appears in the game UI. `canInstall` state is true. | P1 |
| TC-56 | Native install prompt triggers | Chrome Android, install button visible | 1. Tap the in-game "Install" button. | Browser's native "Add to Home Screen" / install prompt appears with app name and icon. | P1 |
| TC-57 | App installs and appears on home screen | Chrome Android, install prompt shown | 1. Tap "Install" on the native prompt. 2. Wait for installation. 3. Check home screen. | Super Mel app icon appears on the device home screen with correct icon and name "Super Mel". | P1 |
| TC-58 | Installed app launches correctly | App installed on home screen | 1. Tap the Super Mel icon on home screen. | App launches in standalone/fullscreen mode. Game loads correctly. No browser chrome visible. | P1 |
| TC-59 | Offline basic shell | App installed, airplane mode enabled | 1. Install app. 2. Enable airplane mode. 3. Open app from home screen. | App shows at minimum a cached loading screen or the game shell. Does not show browser's "No internet" dinosaur page. | P2 |
| TC-60 | Re-install after uninstall | Chrome Android | 1. Uninstall the app (long-press icon > Uninstall). 2. Open game URL in Chrome again. 3. Wait for SW to re-register. | Install button/prompt re-appears. The full install flow works again. | P2 |
| TC-61 | Lighthouse PWA audit | Production build, Chrome DevTools | 1. Open game URL in Chrome. 2. Run Lighthouse audit with "Progressive Web App" category. | All PWA installability criteria pass (manifest, SW, icons, HTTPS, start_url). Score should be green. | P1 |
| TC-62 | Safari iOS — Add to Home Screen | iPhone, Safari | 1. Open game URL. 2. Tap Share > Add to Home Screen. 3. Confirm. | App is added to home screen with correct icon and name. Opens in standalone mode (no Safari UI). | P2 |
| TC-63 | Console debug logs present | Chrome, game loaded | 1. Open console. 2. Load game page. 3. Search for "[PWA]" prefixed logs. | Console shows: `[PWA] Registering beforeinstallprompt listener`, `[PWA] SW ready, scope: /`, and (after prompt) `[PWA] beforeinstallprompt fired`. | P2 |
| TC-64 | Missing icon graceful degradation | Temporarily rename one icon file, rebuild | 1. Rename `icon-192.png` to `icon-192.png.bak`. 2. Rebuild and serve. 3. Open game. | App still loads and runs. Install may not be available, but no crash or white screen. Console shows 404 for missing icon. | P3 |

---

## 5. Integration Tests

These test cases verify that multiple F59 fixes work correctly together, since all 5 ship in the same release.

| ID | Description | Tasks Involved | Steps | Expected Result | Priority |
|----|-------------|----------------|-------|-----------------|----------|
| TC-I01 | Touch controls + fullscreen together | T03 + T04 | 1. Open game on mobile Chrome Android. 2. Tap to trigger fullscreen. 3. Use touch controls to play for 2 minutes. | Fullscreen activates on first tap. Touch controls remain responsive after fullscreen transition. No input loss or z-index conflict between fullscreen overlay and touch buttons. | P1 |
| TC-I02 | Parallax + collider fix — extended play | T01 + T02 | 1. Play on desktop for 5 minutes, advancing rightward through varied terrain (leaves, water, solid blocks). 2. Observe background continuously. | Background always visible (T01). No invisible barriers from leaf/water (T02). Both fixes coexist without interaction issues. | P1 |
| TC-I03 | PWA install + fullscreen + touch | T03 + T04 + T05 | 1. Install as PWA on Chrome Android. 2. Open from home screen. 3. Play using touch controls for 2 minutes. | App opens fullscreen (T05 display mode + T04 CSS). Touch controls work (T03). Complete mobile experience is seamless. | P1 |
| TC-I04 | Fullscreen + safe area + touch button positioning | T03 + T04 | 1. On iPhone with notch, open game in landscape. 2. Verify touch buttons are not behind the notch. 3. Use all buttons. | Safe area insets (T04) do not push touch control buttons off-screen or into unreachable areas. All buttons visible and tappable. | P1 |
| TC-I05 | Parallax + biome transition on mobile | T01 + T03 | 1. On mobile, play through a biome transition using touch controls. 2. Observe background cross-fade. | Cross-fade works while touch controls are active. No visual conflict between parallax repositioning and touch event handling. | P2 |
| TC-I06 | PWA offline + collider fix | T02 + T05 | 1. Install as PWA. 2. Go offline. 3. If cached level loads, walk through leaf/water areas. | Collider fix (T02) persists in the cached/offline version of the game. No phantom colliders. | P3 |
| TC-I07 | All fixes — complete mobile session | T01-T05 | 1. Install as PWA (T05). 2. Launch from home screen — fullscreen (T04). 3. Play a full level using touch controls (T03). 4. Advance far enough to verify parallax (T01). 5. Pass through leaf/water areas (T02). | All 5 fixes work together in a single gameplay session. No conflicts, no regressions, complete mobile experience. | P1 |

---

## 6. Regression Tests

These tests verify that existing features are not broken by the F59 changes.

### 6.1 Core Gameplay (Desktop)

| ID | Area | What to verify | Risk source | Priority |
|----|------|----------------|-------------|----------|
| TC-R01 | Movement | Mel walks, runs, crouches, looks up normally with keyboard | T02 (collider changes) may affect ground detection | P1 |
| TC-R02 | Jumping | Single jump and double jump work correctly | T02 (ray cast changes) | P1 |
| TC-R03 | Bola do Infinito | Shooting, projectile travel, block destruction | T02 (block physics changes) | P1 |
| TC-R04 | Bark mechanic | X key triggers bark, enemies stunned | T02, T03 | P2 |
| TC-R05 | Dig mechanic | Down+Z on dirt/sand triggers dig | T02 (block type changes) | P2 |
| TC-R06 | Sniff mechanic | Hold down 1s highlights bones/item_blocks | T02 | P3 |
| TC-R07 | Enemy interactions | Stomp kills enemies, enemy damage works | T02 (physics) | P1 |
| TC-R08 | Coins collection | Red coins drop, collection counter works | T02 | P2 |
| TC-R09 | Hearts / damage | Lava damages, hearts collectible, life system works | T02 (critical — lava sensor must survive) | P1 |
| TC-R10 | End-of-level cutscene | Cutscene triggers and plays correctly at level end | T01 (parallax) may affect background during cutscene | P2 |

### 6.2 Visual / Rendering (Desktop)

| ID | Area | What to verify | Risk source | Priority |
|----|------|----------------|-------------|----------|
| TC-R11 | Block rendering | All block types render with correct textures | T02 (render path change for non-solid blocks) | P1 |
| TC-R12 | Background blocks (Z<0) | Background decoration blocks still render, no physics | T02 (conditional render logic) | P2 |
| TC-R13 | Camera behavior | Camera follows Mel with deadzone, correct offset | T01 (parallax tracks camera) | P2 |
| TC-R14 | Sprite animations | Mel's sprite states (idle, run, jump, fall, attack) render correctly | Unlikely impact, low risk | P3 |
| TC-R15 | Chunk generation | New chunks generate as player advances | T01 (position tracking) | P2 |

### 6.3 Editor (Desktop)

| ID | Area | What to verify | Risk source | Priority |
|----|------|----------------|-------------|----------|
| TC-R16 | Level editor — block placement | Placing blocks works, all types selectable | T02 (block component changes) | P2 |
| TC-R17 | Level editor — test play | "Test from cursor" plays correctly | T01 + T02 combined | P2 |
| TC-R18 | Level editor — entity palette | Enemy/element palette works | Unlikely impact | P3 |

### 6.4 Systems (Desktop + Mobile)

| ID | Area | What to verify | Risk source | Priority |
|----|------|----------------|-------------|----------|
| TC-R19 | Gamepad input | Gamepad controls still work on desktop | T03 (input system changes) | P2 |
| TC-R20 | Keyboard input | All keyboard bindings work | T03 (input event changes) | P1 |
| TC-R21 | Pause menu | Pause/resume works | T04 (fullscreen) may conflict with pause overlay | P2 |
| TC-R22 | HUD elements | Score, coins, hearts, mission tracker visible | T04 (CSS/viewport changes) | P1 |
| TC-R23 | Daily Challenge | Challenge mode loads and plays | All fixes combined | P3 |
| TC-R24 | Shop / power-ups | Shop UI accessible, power-ups work | T04 (CSS changes) | P3 |

---

## 7. Risk Assessment

### High Risk

| Risk | Likelihood | Impact | Affected Tasks | Mitigation |
|------|-----------|--------|----------------|------------|
| T02 collider removal breaks ground detection | Medium | High | T02 | Test every solid block type for correct landing. Verify ray cast filter flags. Test extensively at leaf/water boundaries near solid ground. |
| T02 lava sensor removal (accidental) | Low | Critical | T02 | Explicit test case (TC-14) for lava damage. Code review to ensure `dangerous=true` branch is preserved. |
| T03 Pointer Events not supported on old Android WebView | Low | Medium | T03 | PointerEvents are supported since Chrome 55+ and Safari 13+. Budget Android devices on older WebViews may fail. Mitigation: add `onTouchStart` as fallback alongside `onPointerDown`. |
| T04 Fullscreen API denied by browser | Medium | Medium | T04 | Some browsers (especially iOS Safari) do not support `requestFullscreen()`. The `100dvh` CSS approach is the primary fix; Fullscreen API is an enhancement. The `.catch(() => {})` prevents errors. |
| T04 CSS `100dvh` not supported on older browsers | Low | Low | T04 | `100vh` fallback is placed before `100dvh` in CSS. Older browsers use `100vh` which is the current behavior (not a regression). |
| T05 Service Worker caching stale code | Medium | Medium | T05 | After fixing sw.js, users with cached old SW may need to hard-refresh. Mitigation: SW should use `skipWaiting()` and `clients.claim()` to activate immediately. Test with "Update on reload" in DevTools. |
| T05 `beforeinstallprompt` event never fires | Medium | High | T05 | This event requires: HTTPS, valid manifest, registered SW, user engagement heuristic met. Mitigation: Run Lighthouse PWA audit (TC-61). Test on real Android device, not just emulator. |
| T01 + T04 parallax Z-fighting with fullscreen viewport | Low | Low | T01, T04 | The parallax plane is at Z=-35, far from camera. Viewport changes should not affect Z-buffer. Visual test (TC-07) catches this. |
| All fixes combined cause performance regression | Low | Medium | All | Performance test (TC-09) with FPS monitoring. The changes are minimal (mesh repositioning, collider removal, CSS, event handlers) and should not impact frame budget. |

### Medium Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Touch buttons stuck in pressed state after rapid interaction | Medium | Medium | TC-31 (slide off) and TC-32 (rapid taps) specifically test this. `onPointerLeave` and `onPointerCancel` handlers are the fix. |
| Safe area padding pushes game content off-screen | Low | Medium | TC-42 tests notch devices. Padding should be on the root container with `box-sizing: border-box` to prevent overflow. |
| Fullscreen exit on notification/call interrupts gameplay | Medium | Low | TC-47 tests app switch. The one-time fullscreen listener re-engages on next tap. Game state should persist via Zustand store. |
| Editor scene affected by Block.tsx changes | Low | Medium | TC-R16 and TC-R17 test editor. The editor uses the same Block component, so collider changes apply there too. Verify block placement still works. |

### Low Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Desktop keyboard input affected by T03 | Very Low | High | T03 only changes the TouchControls3D component which renders conditionally on mobile. Desktop keyboard handlers in Mel.tsx are separate. TC-R20 verifies. |
| Parallax Y-axis drift during cutscene | Low | Low | TC-R10 tests cutscene. The parallax follows player X; during cutscene the camera may move differently. Visual inspection needed. |
| manifest.json Content-Type wrong on Render | Low | Medium | Render static sites typically serve .json files correctly. TC-53 validates manifest in DevTools. If wrong, a `_headers` file can override. |

---

## Appendix: Test Execution Checklist

### Pre-testing setup

- [ ] Build frontend: `cd packages/frontend && npx vite build`
- [ ] Serve production build: `npx vite preview --host`
- [ ] Note local IP for mobile device access
- [ ] Clear browser cache and Service Workers on all test devices
- [ ] Prepare Chrome DevTools with Application and Performance tabs
- [ ] Have at least one Android device and one iOS device ready
- [ ] Establish FPS baseline on desktop before applying fixes

### Test execution order (recommended)

1. **Desktop regression first** (TC-R01 through TC-R24) — confirm nothing is broken on the primary platform.
2. **T01 parallax tests** (TC-01 through TC-10) — visual, desktop.
3. **T02 collider tests** (TC-11 through TC-20) — gameplay, desktop.
4. **T04 fullscreen tests** (TC-40 through TC-50) — mobile devices.
5. **T03 touch control tests** (TC-21 through TC-39) — mobile devices.
6. **T05 PWA tests** (TC-51 through TC-64) — production build, mobile.
7. **Integration tests** (TC-I01 through TC-I07) — cross-task, mobile.

### Pass/Fail criteria

- **Release blocker:** Any P1 test case failure.
- **Release with known issues:** P2 test case failures documented in release notes.
- **Acceptable deferral:** P3 test case failures logged as backlog items.
- **Overall:** All P1 test cases must pass. At least 80% of P2 test cases must pass.
