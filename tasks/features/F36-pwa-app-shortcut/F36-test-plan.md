# F36 Test Plan -- PWA App Shortcut

## Scope

End-to-end validation that Super Mel can be installed as a PWA on mobile and desktop, that the service worker provides caching and server wake-up, and that no regressions are introduced.

## Test Environment

- **Desktop:** Chrome (primary), Firefox, Edge
- **Mobile:** Chrome Android (primary), Safari iOS (secondary)
- **Tooling:** Chrome DevTools > Application tab, Lighthouse PWA audit
- **Deploy:** Test on `super-mel.onrender.com` (production) since PWA requires HTTPS. Local testing possible with `pnpm preview` on localhost (Chrome allows SW on localhost).

## Test Matrix

### 1. Manifest Validation

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 1.1 | DevTools > Application > Manifest loads | All fields shown (name, icons, display, theme_color) | P0 |
| 1.2 | Icons load without 404 | 192 and 512 icons visible in manifest panel | P0 |
| 1.3 | `display: standalone` declared | Manifest shows standalone | P0 |
| 1.4 | `start_url: /` declared | Manifest shows / | P0 |
| 1.5 | `orientation: landscape` declared | Manifest shows landscape | P1 |

### 2. Service Worker Lifecycle

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 2.1 | SW registers on page load | DevTools shows SW "activated and running" | P0 |
| 2.2 | Console shows `[SW] Registered` | Log message visible | P1 |
| 2.3 | SW caches static assets on first load | Cache Storage shows `super-mel-v1` with entries | P0 |
| 2.4 | Reload page -- assets served from cache | Network tab shows "(ServiceWorker)" for cached items | P1 |
| 2.5 | Toggle offline -- page still loads | Cached HTML and assets render | P1 |
| 2.6 | API calls fail gracefully offline | Leaderboard/scores show error, no crash | P1 |
| 2.7 | SW update: change CACHE_NAME, reload | Old cache deleted, new cache created | P2 |

### 3. Server Wake-Up

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 3.1 | On first load, HEAD /api/health fires | Network tab shows HEAD request to health endpoint | P0 |
| 3.2 | Wake-up is non-blocking | Page loads even if health ping fails | P0 |
| 3.3 | Backend sleeping: page loads, backend wakes in background | Page shows menu, backend responds within ~30s | P1 |

### 4. Install Flow

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 4.1 | Chrome Desktop: "INSTALAR APP" button appears in menu | Button visible after brief delay | P0 |
| 4.2 | Click "INSTALAR APP" -- native prompt appears | Chrome install dialog shown | P0 |
| 4.3 | Accept install -- "App instalado!" text replaces button | Confirmation shown, button gone | P0 |
| 4.4 | Dismiss install -- button remains | Button still clickable | P1 |
| 4.5 | Chrome Android: same flow | Install dialog shown, app added to home screen | P0 |
| 4.6 | Open from home screen -- standalone mode | No browser chrome, full-screen game | P0 |
| 4.7 | Open as standalone -- no install button | `isInstalled` is true, "App instalado!" shown | P1 |
| 4.8 | Firefox: no install button | Button not rendered, no errors | P1 |
| 4.9 | Safari iOS: no install button, Add to Home Screen works | Manual install via share sheet | P1 |

### 5. Visual/UX

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 5.1 | PWA icon on home screen | Mel portrait icon visible | P0 |
| 5.2 | Standalone mode: status bar color | `#1a1a2e` dark theme | P1 |
| 5.3 | Menu layout with install button | No overlapping, proper spacing | P0 |
| 5.4 | Menu layout without install button (unsupported browser) | Same as before F36 | P0 |

### 6. Regressions

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 6.1 | Start game (JOGAR) -- gameplay works | Controls, physics, sprites normal | P0 |
| 6.2 | Audio plays correctly | Maintheme on menu, comeco on play | P0 |
| 6.3 | Touch controls work on mobile | D-pad and A/B buttons responsive | P0 |
| 6.4 | Leaderboard loads | API call succeeds, scores displayed | P1 |
| 6.5 | Editor opens and functions | Level editor usable | P1 |
| 6.6 | Login/logout works | Auth flow unaffected | P1 |
| 6.7 | Coins, HUD, lives display correctly | HUD elements render | P0 |

### 7. Lighthouse PWA Audit

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 7.1 | Run Lighthouse > PWA | "Installable" passes | P0 |
| 7.2 | Manifest detected | Green check | P0 |
| 7.3 | SW detected | Green check | P0 |
| 7.4 | Splash screen configured | theme_color + icons + name | P1 |

## Known Limitations

- Safari iOS does not support `beforeinstallprompt` -- the install button will never appear on iOS. Users must use the native "Add to Home Screen" flow. This is a platform limitation, not a bug.
- Firefox Desktop does not support PWA install. The button will not appear. No workaround available.
- Offline gameplay is NOT a goal. The SW provides offline loading of the shell/assets, but the game requires an active backend for auth, scores, and level data. When offline, the menu will load but gameplay features that require API calls will fail gracefully.
