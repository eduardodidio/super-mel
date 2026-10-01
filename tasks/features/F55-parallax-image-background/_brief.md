# F55: Parallax Image Background

## Problem

The current background system (BackgroundDecor) uses procedural 3D geometry
(box-based mountains, clouds, stars). While functional, it lacks visual richness.
The user has provided real image assets (montanhas.jpg, deserto.jpg) to serve as
deep parallax backgrounds, filling the sky behind all procedural decor.

## Scope

- Move image assets from `paralax/` to `packages/frontend/public/backgrounds/`
- Create `ParallaxImageBackground` component (textured plane, deep Z, horizontal tiling)
- Integrate into `BackgroundDecor` (renders behind clouds/mountains)
- Map images to biome themes (mountains=forest/night/ocean, desert=desert/space)
- Cross-fade between images during biome transitions
- Update diagrams and README

## Constraints

- No gameplay changes — purely visual
- No new dependencies
- Must not regress performance (single textured plane per theme)
- Mountains image is the default for most themes
- Image sits at deepest Z layer, behind everything else
