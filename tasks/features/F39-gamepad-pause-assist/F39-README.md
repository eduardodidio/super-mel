# Feature F39 — Gamepad + Menu Pausa + Modo Assistido

**Status:** planned
**Owner:** @architect
**PRD:** inline (backlog items B-36, B-38, B-37)

## Goal

Add gamepad controller support (Gamepad API), a full pause menu with settings, and a Celeste-style Assist Mode that lets any player customize difficulty — without blocking achievements.

## Problem

1. **No gamepad support.** `useControls.ts` only handles keyboard keydown/keyup. Players with controllers cannot play.
2. **No pause menu.** `useGameState` has `paused: boolean` and `setPaused()` but nothing consumes them. No overlay, no way to pause, no volume control in-game.
3. **No accessibility options.** Players who struggle with timing or precision have no way to adjust difficulty. This excludes casual and younger players (target audience includes Rafa, the dog's owner).

## Solution Overview

### B-36 — Gamepad
- Poll Gamepad API every frame inside `useControls` (or a companion hook `useGamepad`)
- D-pad / left-stick = move, A/Cross = jump/fly, X/Square = attack, Start = pause
- Hot-plug detection via `gamepadconnected` / `gamepaddisconnected` browser events
- Track `lastInputType` in zustand so HUD hint text switches dynamically
- Hide `TouchControls3D` when a gamepad is connected

### B-38 — Pause Menu
- Esc key or Start button toggles pause
- `PauseOverlay.tsx` component with: Continuar, Reiniciar, Voltar ao Menu
- Volume slider + Mute toggle (wires into `AudioManager3D`)
- "Como Jogar" sub-screen with illustrated controls for keyboard/touch/gamepad
- Physics freezes via `<Physics paused={true}>` prop; `useFrame` callbacks guarded
- Works in all play modes (infinite, test, level)

### B-37 — Modo Assistido (Celeste-style)
- Accessible from Pause menu > Opcoes
- Toggles: Invincible, Unlimited flight, 5 hearts (instead of 3)
- Game speed slider: 70% / 85% / 100%
- "Skip level" button (disabled for now — future campaign use)
- Welcoming text: "Cada jogador e diferente. Use estas opcoes para ajustar o jogo ao seu estilo."
- Persisted as single JSON blob in `localStorage` key `supermel_assist_mode`
- Does NOT block achievements/stars

## Key Files

| File | Change |
|------|--------|
| `packages/frontend/src/game/hooks/useControls.ts` | Add gamepad polling in useEffect + useFrame, track lastInputType |
| `packages/frontend/src/game/hooks/useGameState.ts` | Add `lastInputType`, `gamepadConnected`, `assistMode` fields |
| `packages/frontend/src/game/systems/HUD3D.tsx` | Switch controls hint text based on `lastInputType` |
| `packages/frontend/src/game/systems/TouchControls3D.tsx` | Hide when `gamepadConnected` is true |
| `packages/frontend/src/game/systems/PauseOverlay.tsx` | NEW — pause menu UI component |
| `packages/frontend/src/game/systems/ComoJogarScreen.tsx` | NEW — controls illustration sub-screen |
| `packages/frontend/src/game/systems/AssistModeUI.tsx` | NEW — assist mode settings panel |
| `packages/frontend/src/game/hooks/useAssistMode.ts` | NEW — zustand slice for assist settings + localStorage persistence |
| `packages/frontend/src/game/hooks/useGameFrame.ts` | NEW — custom hook wrapping useFrame with game speed multiplier |
| `packages/frontend/src/game/Game3D.tsx` | Wire PauseOverlay, pass `paused` to Physics, Esc key handler |
| `packages/frontend/src/game/entities/Mel.tsx` | Read assist mode (invincible, unlimited fly, 5 hearts), use useGameFrame |
| `packages/frontend/src/game/scenes/GameScene3D.tsx` | Guard logic with paused check, apply assist mode heart cap |
| `packages/frontend/src/game/systems/AudioManager3D.ts` | Add `setVolume()` export function |

## Architecture Impact

- **3 new React components:** PauseOverlay, ComoJogarScreen, AssistModeUI (all HTML overlay, not R3F)
- **2 new hooks:** useAssistMode (zustand), useGameFrame (thin wrapper)
- **1 new export in AudioManager3D:** `setVolume(v: number)`
- **Zustand store grows:** ~5 new fields (lastInputType, gamepadConnected, assistMode settings)
- **Physics pause:** Uses `<Physics paused={paused}>` prop — no Rapier internals touched
- **No new npm dependencies** — Gamepad API is native browser API
- **Performance:** Gamepad polling in RAF is ~0.01ms/frame; negligible

## Waves

- **Wave 0**: F39-T01, F39-T03, F39-T06 (independent — gamepad hook, pause overlay UI, assist mode store+UI)
- **Wave 1**: F39-T02, F39-T04, F39-T05 (T02 depends on T01 for input type; T04 depends on T03 for overlay; T05 depends on T03 for sub-screen mount point)
- **Wave 2**: F39-T07 (depends on T06 for assist settings, T04 for pause wiring)

## Global Acceptance Criteria

- [ ] Gamepad D-pad/stick moves Mel left/right; A/Cross = jump; X/Square = shoot; Start = pause
- [ ] Hot-plug: connecting/disconnecting gamepad updates state immediately
- [ ] HUD controls hint changes text based on last input type (keyboard/touch/gamepad)
- [ ] Touch controls hidden when gamepad is connected
- [ ] Esc or Start opens pause overlay
- [ ] Pause overlay shows: Continuar, Reiniciar, Voltar ao Menu, Volume slider, Mute, Como Jogar, Opcoes
- [ ] Game physics and animations freeze when paused
- [ ] Como Jogar shows correct controls for current input type
- [ ] Assist Mode toggles: invincible, unlimited flight, 5 hearts, game speed (70/85/100%)
- [ ] Assist Mode persisted in localStorage across sessions
- [ ] Assist Mode does NOT block achievements
- [ ] Welcoming Celeste-style text shown on Assist Mode screen
- [ ] Skip Level button shown but disabled (future use)
- [ ] Volume slider controls game audio volume
- [ ] No console errors, no performance regression
- [ ] Existing gameplay unchanged when no gamepad connected and assist mode off

## Diagrams

- `docs/diagrams/F39-architecture.mmd` — input pipeline, pause state flow, assist mode data flow
- `docs/diagrams/F39-journey.mmd` — user journeys for gamepad play, pausing, assist mode configuration
