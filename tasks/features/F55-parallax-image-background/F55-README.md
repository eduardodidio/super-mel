# F55: Parallax Image Background

**Status:** done
**Created:** 2026-10-01

## Goal

Add a parallax background layer using real image assets (JPG) that sits behind
all existing procedural decor (clouds, mountains, stars). The mountain theme
(`montanhas.jpg`) is the default. A desert variant (`deserto.jpg`) is available
and maps to the `desert` biome. The image tiles horizontally with slow parallax
scrolling, filling the entire viewport background at deep Z.

## Architecture Impact

- **New component:** `ParallaxImageBackground.tsx` in `packages/frontend/src/game/systems/`
- **Modified:** `BackgroundDecor.tsx` — render ParallaxImageBackground as first child (behind everything)
- **Modified:** `BiomeTransition.tsx` — pass theme to ParallaxImageBackground for biome-aware switching
- **Assets:** move `paralax/*.jpg` to `packages/frontend/public/backgrounds/` for Vite static serving
- **No gameplay impact** — purely visual, no physics/logic changes

## Assets

| File | Theme mapping | Notes |
|------|--------------|-------|
| `montanhas.jpg` | `forest`, `night`, `ocean` (default) | Blue sky, brown mountains, lake |
| `deserto.jpg` | `desert`, `space` | Sandy sky, red mountains |

## Wave Manifest

- **Wave 0**: F55-T01 (asset setup + component scaffold)
- **Wave 1**: F55-T02 (integration + biome switching), F55-T03 (diagrams + docs)

## Acceptance Criteria

- [ ] Mountain parallax image visible behind all procedural decor in gameplay
- [ ] Image tiles horizontally without visible seam at edges
- [ ] Parallax scrolling at ~0.02x player speed (very slow, distant feel)
- [ ] Image positioned at deep Z (behind mountains, clouds, stars)
- [ ] Desert image activates when biome is `desert` or `space`
- [ ] Smooth cross-fade between images during biome transitions
- [ ] No performance regression (single textured plane, not per-frame texture updates)
- [ ] Works in both infinite mode (BiomeTransition) and level/test mode (BackgroundDecor)

## Diagrams

- `docs/diagrams/F55-architecture.mmd` — component integration diagram
- `docs/diagrams/F55-journey.mmd` — user visual experience flow
