# Feature F36 -- PWA App Shortcut (Mobile/Tablet Install)

**Status:** planned
**Owner:** @architect
**PRD:** inline

## Goal

Allow users to install Super Mel as a Progressive Web App (PWA) on phones and tablets. This is NOT a native app -- it creates a home screen shortcut that opens the game in a standalone browser window, providing an app-like experience. A service worker pre-loads (pings) the Render.com backend on launch to wake the free-tier server before the user reaches gameplay.

## Problem

Players on mobile devices must navigate to the URL every time they want to play. The Render free-tier backend sleeps after inactivity, causing long cold-start delays. A PWA install provides:

1. One-tap access from the home screen (app icon, standalone window, no browser chrome)
2. Proactive server wake-up via service worker fetch on app launch
3. Basic offline splash/loading screen while the server wakes
4. Asset caching for faster subsequent loads

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `packages/frontend/public/manifest.json` | Web App Manifest (name, icons, display, colors) |
| `packages/frontend/public/sw.js` | Service Worker: cache strategy + server wake-up ping |
| `packages/frontend/public/icons/icon-192.png` | PWA icon 192x192 |
| `packages/frontend/public/icons/icon-512.png` | PWA icon 512x512 |
| `packages/frontend/public/icons/icon-maskable-512.png` | Maskable PWA icon 512x512 |
| `packages/frontend/src/hooks/usePWAInstall.ts` | React hook: captures `beforeinstallprompt`, exposes install trigger |

### Modified Files

| File | Change |
|------|--------|
| `packages/frontend/index.html` | Add `<link rel="manifest">`, theme-color meta, apple-touch-icon meta |
| `packages/frontend/src/main.tsx` | Register service worker |
| `packages/frontend/src/game/Game3D.tsx` | Add "INSTALAR APP" button in menu (conditional on PWA prompt availability) |

### Key Design Decisions

1. **Hand-written SW, not vite-plugin-pwa**: The project already has manual chunk splitting in vite.config.ts and we need custom wake-up logic. A hand-written service worker keeps control simple and avoids a new dependency. The SW uses network-first for HTML and cache-first for static assets.

2. **Server wake-up strategy**: On SW `activate` and on every `fetch` for the root document, the SW sends a `HEAD` request to `/api/health` (which hits `super-mel-api.onrender.com` via proxy). This wakes the backend before the user reaches login/gameplay. The fetch is fire-and-forget (no blocking).

3. **Canvas-generated icons**: Rather than adding a dependency for icon generation, the Developer task includes a simple Node script that uses the `canvas` package (or manual creation from ui_portrait.png) to produce the required icon sizes. Alternatively, the developer can manually create/resize the existing ui_portrait.png sprite.

4. **No new npm dependencies**: manifest.json and SW registration are pure web platform APIs. The `usePWAInstall` hook uses the standard `beforeinstallprompt` event. No packages needed.

## Waves

### Wave 0 (parallel -- no dependencies between tasks)

| Task | Description | Files |
|------|-------------|-------|
| F36-T01 | Web App Manifest + PWA Icons | `public/manifest.json`, `public/icons/*` |
| F36-T02 | Service Worker (cache + wake-up) | `public/sw.js` |
| F36-T03 | index.html PWA meta tags | `index.html` |

### Wave 1 (depends on Wave 0)

| Task | Description | Depends on |
|------|-------------|------------|
| F36-T04 | SW registration in main.tsx | T02, T03 |
| F36-T05 | Install prompt hook + menu button | T01, T03 |

### Dependency Graph

```
T01 (manifest+icons) ──┐
                        ├──> T05 (install prompt UI)
T03 (index.html meta) ──┤
                        ├──> T04 (SW registration)
T02 (service worker) ───┘
```

## Global Acceptance Criteria

- [ ] `manifest.json` exists at `/manifest.json` in production build and is valid
- [ ] Service worker registers successfully (no console errors)
- [ ] SW caches static assets (sprites, JS chunks) on install
- [ ] SW pings `/api/health` on activation to wake backend
- [ ] On mobile Chrome/Safari, the "Add to Home Screen" prompt appears (or manual install works)
- [ ] "INSTALAR APP" button appears in menu on supported browsers
- [ ] Clicking "INSTALAR APP" triggers the native install prompt
- [ ] After install, opening from home screen shows standalone window (no browser chrome)
- [ ] App loads with theme color (#1a1a2e) in status bar
- [ ] PWA icon (Mel portrait) shows correctly on home screen
- [ ] No regressions in gameplay, audio, or controls
- [ ] Lighthouse PWA audit passes basic installability checks

## Render Deployment Notes

- Frontend is deployed as a **static site** on Render (`super-mel.onrender.com`)
- Backend is a separate web service (`super-mel-api.onrender.com`)
- The static site has a rewrite rule `/* -> /index.html` which means `manifest.json` in `public/` will be served at `/manifest.json` automatically
- The `/api` proxy only works in dev (vite dev server). In production, API calls go through CORS to the backend URL. The SW wake-up ping should use the production API URL as a fallback.

## Diagrams

- `docs/diagrams/F36-architecture.mmd` -- PWA component diagram (SW, manifest, cache flow)
- `docs/diagrams/F36-journey.mmd` -- User journey: discover -> install -> launch -> play
