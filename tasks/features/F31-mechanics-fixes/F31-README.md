# Feature F31 — Mechanics Fixes (Voo, Colisao, Ataque)

**Status:** done
**Owner:** @architect
**PRD:** inline (bug fixes, sem PRD separado)

## Goal

Corrigir 3 mecanicas do jogo: (1) voo com timer de 5s, (2) colisao da Mel com blocos, (3) alcance do ataque Z para 10 blocos.

## Architecture impact

- `packages/frontend/src/game/entities/Mel.tsx` — fly timer (useFrame logic) + explicit CuboidCollider (JSX return)
- `packages/frontend/src/game/entities/Projectile.tsx` — ajuste de LIFETIME para alcance de 10 blocos

## Waves

- **Wave 0**: F31-T01, F31-T02, F31-T03

> Todas as 3 tasks sao independentes. T01 e T02 editam Mel.tsx mas em secoes nao-sobrepostas (useFrame vs JSX return). T03 edita Projectile.tsx. Execucao 100% paralela.

## Global acceptance criteria

- [ ] Mel NAO comeca voando; voo ativa ao segurar Space no ar; voo dura max 5 segundos; timer reseta ao aterrissar
- [ ] Mel colide corretamente com blocos solidos (stone, wood, iron, brick, glass, item_block)
- [ ] Ataque Z tem alcance de 10 blocos (world units)
- [ ] Nenhuma regressao em jump, crouch, walk, attack, coin collection
- [ ] Jogo roda sem erros no console

## Diagrams

- Nao requer novos diagramas (fixes em mecanicas existentes)
