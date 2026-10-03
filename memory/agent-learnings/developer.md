# Developer Learnings

(QA appends to this file at the end of every feature retrospective.)

## F59 -- Mobile + Polish Fixes

- **When changing manifest.json `display` mode, update all `matchMedia` checks that reference display modes.** Changing from `standalone` to `fullscreen` requires updating any `(display-mode: standalone)` media queries elsewhere in the codebase. This was correctly handled in F59 but is a common oversight.
- **When removing physics colliders from blocks, verify the downstream ray cast filter flags.** Rapier's `castRay` third parameter controls sensor filtering. Even though removing sensors was correct, understanding the ray cast behavior is critical to preventing ground detection regressions.
- **When migrating from Touch Events to Pointer Events, always add `onPointerLeave` and `onPointerCancel` handlers** alongside `onPointerDown`/`onPointerUp`. Without these, buttons can get stuck in pressed state when a finger slides off.
- **CSS `100dvh` must be declared AFTER the `100vh` fallback** so that supporting browsers override to the dynamic value, while older browsers keep the fallback. The cascade order matters.
- **Service workers should never depend on backend availability to activate.** The `/api/health` fetch in sw.js was a deployment-environment bug -- static deploys have no backend API. Keep SW install/activate handlers self-contained.
