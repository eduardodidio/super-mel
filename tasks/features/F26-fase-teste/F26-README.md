# F26 — Fase Basica de Teste

**Status:** planned

## Goal

Criar uma fase basica com blocos posicionados manualmente para testar gameplay, controles e mecanicas sem depender do chunk generator aleatorio. A fase serve como playground de teste com plataformas, gaps, blocos destrutiveis, moedas e hearts em posicoes conhecidas.

## Architecture Impact

- **systems/ChunkGenerator.ts**: novo modo `generateTestLevel()` que retorna chunks pre-definidos
- **systems/ChunkRenderer.tsx**: suportar fonte de chunks alternativa (test level vs procedural)
- **hooks/useGameState.ts**: nova scene ou flag para modo teste
- **scenes/GameScene3D.tsx**: wiring para carregar test level
- **scenes/MenuScene3D.tsx** ou **Game3D.tsx**: botao "FASE TESTE" no menu

## Wave Manifest

- **Wave 0**: F26-T01 (design: definir layout da fase em dados)
- **Wave 1**: F26-T02, F26-T03 (core: test level generator + renderer integration)
- **Wave 2**: F26-T04 (menu: botao de acesso + docs)

## Global Acceptance Criteria

- [ ] Existe um botao "FASE TESTE" no menu principal
- [ ] Ao clicar, carrega uma fase com layout pre-definido (nao aleatorio)
- [ ] Fase tem: chao plano, plataformas em alturas variadas, gaps para pular, blocos destrutiveis, moedas, hearts
- [ ] Mel spawna no inicio da fase e pode percorrer do inicio ao fim
- [ ] Score, vida, moedas funcionam normalmente
- [ ] Pode voltar ao menu (game over ou botao)

## Diagrams

- `docs/diagrams/F26-architecture.mmd`
- `docs/diagrams/F26-journey.mmd`
