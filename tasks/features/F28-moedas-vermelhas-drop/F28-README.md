# F28 — Moedas Vermelhas + Drop de Blocos

**Status:** done

## Goal

Trocar todas as moedas do jogo de douradas para vermelhas, implementar sistema de drop de moedas quando Mel quebra blocos com seu ataque, e dar funcao especial aos item_blocks para liberar moedas escondidas ao serem atingidos.

## Architecture Impact

- **entities/Coin.tsx**: trocar cores #FFD700/#FFA500 para paleta vermelha
- **systems/HUD3D.tsx**: trocar cor do coin counter de dourado para vermelho
- **systems/BlockTextures3D.ts**: trocar cor do item_block de dourado para vermelho (tema consistente)
- **systems/ChunkRenderer.tsx**: conectar callback onBlockDestroyed, spawnar moedas no local do bloco destruido
- **scenes/GameScene3D.tsx**: conectar ProjectileManager.onBlockHit ao sistema de drop
- **systems/ChunkGenerator.ts**: marcar item_blocks com metadata de moedas escondidas
- **systems/TestLevelData.ts**: adicionar item_blocks com moedas escondidas no nivel teste

## Wave Manifest

- **Wave 0**: F28-T01, F28-T02 (paralelo: recolorir moedas + recolorir item_blocks/HUD)
- **Wave 1**: F28-T03, F28-T04 (paralelo: drop system ao quebrar blocos + item_block com moedas escondidas)
- **Wave 2**: F28-T05 (integracao: wiring completo GameScene + TestLevel com item_blocks)
- **Wave 3**: F28-T06 (docs: diagramas + README update)

## Global Acceptance Criteria

- [ ] Moedas sao vermelhas em vez de douradas (mesh, glow, emissive)
- [ ] HUD coin counter usa cor vermelha
- [ ] item_blocks tem textura vermelha com "?" (consistente com moedas)
- [ ] Bola do Infinito (Projectile) continua dourada — sem alteracao
- [ ] Ao quebrar blocos destrutiveis com ataque, moedas podem dropar (chance configuravel)
- [ ] item_blocks liberam 1-3 moedas ao serem atingidos/quebrados
- [ ] Moedas dropadas sao coletaveis e contam no HUD/persistencia
- [ ] TestLevel inclui item_blocks com moedas escondidas
- [ ] Sem regressao: coins existentes, persistencia localStorage, HUD, physics
- [ ] Performance: drops nao causam frame drops

## Diagrams

- `docs/diagrams/F28-architecture.mmd`
- `docs/diagrams/F28-journey.mmd`
