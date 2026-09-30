# Feature F32 — Fix Colisao Mel com Areia e Grama

**Status:** done
**Owner:** @architect
**PRD:** inline (bug fix, sem PRD separado)

## Goal

Corrigir a colisao da Mel com blocos de areia (`sand`) e terra/grama (`dirt`). Ambos estao com `solid: false` em `BLOCK_PROPERTIES`, fazendo o `Block.tsx` criar **sensor colliders** — a Mel atravessa o terreno em vez de andar sobre ele.

## Root Cause

1. `packages/shared/src/types.ts:82` — `sand: { solid: false, ... }`
2. `packages/shared/src/types.ts:85` — `dirt: { solid: false, ... }`
3. `packages/frontend/src/game/entities/Block.tsx:65` — `sensor={!props.solid && !props.dangerous}`
   - Como `solid=false` e `dangerous=false`, sensor=true: o bloco vira trigger, nao barreira fisica
4. `packages/frontend/src/game/entities/Mel.tsx:96-99` — `world.castRay(..., 0.3, true, ...)` com 3o arg `solid=true` ignora sensors no ray cast
   - Ground detection NUNCA detecta dirt/sand
   - Player cai direto pelo chao (dirt e a camada de superficie em `ChunkGenerator.ts:77`)

## Fix

Alterar `solid: false` para `solid: true` em `sand` e `dirt` dentro de `BLOCK_PROPERTIES`. Ambos sao blocos de terreno que devem bloquear fisicamente o player.

**Nao alterar:** `water` (player deve nadar), `lava` (dangerous=true, sensor correto), `leaf` (platform=true, mecanica propria).

## Architecture impact

- `packages/shared/src/types.ts` — unica alteracao necessaria (2 booleans)
- Nenhum outro arquivo precisa mudar. Block.tsx, Mel.tsx e ChunkGenerator.ts ja funcionam corretamente com blocos `solid: true`.

## Waves

- **Wave 0**: F32-T01

> Apenas 1 task. Alteracao minima e cirurgica em 2 linhas do mesmo arquivo.

## Global acceptance criteria

- [ ] Mel anda sobre blocos `dirt` (grama/terra) sem cair
- [ ] Mel anda sobre blocos `sand` (areia) sem cair — testar no editor
- [ ] Ground detection (ray cast) detecta dirt e sand como chao
- [ ] Blocos de dirt e sand NAO sao mais sensors (colisao fisica real)
- [ ] Nenhuma regressao: water continua passavel, lava continua perigosa, leaf continua platform
- [ ] Jogo roda sem erros no console

## Diagrams

- Nao requer novos diagramas (fix em propriedade de blocos existentes)
