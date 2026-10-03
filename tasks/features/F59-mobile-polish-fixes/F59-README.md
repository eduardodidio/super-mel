# F59 — Mobile + Polish Fixes

**Status:** done
**Priority:** P1
**Effort:** M (5 tasks, 1 wave)

## Goal

Corrigir 5 bugs/melhorias reportados pelo usuario que afetam diretamente a experiencia mobile e gameplay geral: parallax background que termina, colisores invisiveis que travam a Mel, controles touch que nao respondem, falta de fullscreen no mobile, e PWA install que nao funciona.

## Architecture Impact

| Layer | Modules Affected |
|-------|-----------------|
| Frontend / Game Systems | `ParallaxImageBackground.tsx` — mesh repositioning |
| Frontend / Entities | `Block.tsx` — collider logic for non-solid blocks |
| Frontend / Entities | `Mel.tsx` — ground detection ray cast (verify) |
| Frontend / Game Systems | `TouchControls3D.tsx` — pointer event handlers |
| Frontend / HTML | `index.html` — viewport meta, CSS viewport units |
| Frontend / PWA | `sw.js`, `manifest.json`, `usePWAInstall.ts` |

## Wave Manifest

- **Wave 0**: F59-T01, F59-T02, F59-T03, F59-T04, F59-T05 (all independent, maximum parallelism)

## Global Acceptance Criteria

- [ ] Parallax background scrolls infinitely sem nunca acabar, em qualquer distancia
- [ ] Mel nao trava em blocos nao-solidos (leaf, water) — movimentacao fluida
- [ ] Botoes touch funcionam no mobile (Chrome Android, Safari iOS) com feedback visual
- [ ] Jogo ocupa tela inteira no mobile sem header do browser visivel
- [ ] PWA instala corretamente e aparece na home screen do celular
- [ ] Nenhuma regressao no gameplay desktop

## Diagrams

- `docs/diagrams/F59-architecture.mmd` — component/data-flow dos 5 fixes (owned by F59-T01)
- `docs/diagrams/F59-journey.mmd` — user journey mobile: install -> fullscreen -> play -> touch controls (owned by F59-T04)
