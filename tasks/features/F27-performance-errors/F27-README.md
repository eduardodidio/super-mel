# F27 — Performance Audit & Error Fixes

**Status:** planned

## Goal

Investigar e corrigir os erros de console que causam lentidao no browser, otimizar rendering do R3F/Rapier, e implementar estrategias de performance para manter o jogo fluido (60fps). O usuario reportou lentidao e muitos erros no console.

## Architecture Impact

- **systems/SpriteAnimator.ts**: erros de sprite not found (warn spam)
- **systems/BlockTextures3D.ts**: possivel criacao excessiva de materiais
- **entities/Block.tsx**: BlockParticles recria geometrias a cada frame
- **entities/Coin.tsx**: pointLight por moeda (caro)
- **systems/ChunkRenderer.tsx**: flatMap + filter + map em cada render (GC pressure)
- **systems/BackgroundDecor.tsx**: possivel excesso de objetos
- **Game3D.tsx**: Canvas config (shadows, etc.)
- **entities/Mel.tsx**: world.castRay every frame
- **Geral**: React re-renders desnecessarios, objetos Three.js nao disposados

## Wave Manifest

- **Wave 0**: F27-T01 (audit: diagnostico de erros e performance)
- **Wave 1**: F27-T02, F27-T03, F27-T04 (fixes: sprite errors + rendering optimizations + memory/GC)
- **Wave 2**: F27-T05 (docs + README)

## Global Acceptance Criteria

- [ ] Console sem erros/warnings em gameplay normal (exceto info logs)
- [ ] FPS estavel >= 55 fps em desktop (medido com stats.js ou R3F Perf)
- [ ] Sem memory leaks visiveis (heap nao cresce indefinidamente)
- [ ] Sem regressao visual ou funcional
- [ ] Sprites carregam sem fallback warnings
- [ ] Chunk rendering nao causa stutters ao gerar novos chunks

## Diagrams

- `docs/diagrams/F27-architecture.mmd`
- `docs/diagrams/F27-journey.mmd`
