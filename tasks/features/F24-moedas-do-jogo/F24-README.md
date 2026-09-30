# F24 — Sistema de Moedas do Jogo

**Status:** planned

## Goal

Adicionar moedas coletaveis espalhadas pelos chunks que a Mel pode pegar. As moedas sao persistidas em localStorage e servirao futuramente para upgrades de itens da Mel e do Robo (personagem futuro). A moeda usa a imagem desenhada pelo Rafa (`imagensDoRafa/moedaDoJogo.png`) como sprite.

## Architecture Impact

- **Frontend / game / entities**: novo `Coin.tsx` (baseado no padrao de `Heart.tsx`)
- **Frontend / game / systems**: `ChunkGenerator.ts` ganha `CoinData[]` no Chunk
- **Frontend / game / systems**: `ChunkRenderer.tsx` renderiza moedas como renderiza hearts
- **Frontend / game / hooks**: `useGameState.ts` ganha `coins` counter + `addCoins` + persistencia localStorage
- **Frontend / game / systems**: `HUD3D.tsx` mostra contador de moedas
- **Frontend / public / sprites**: imagem da moeda copiada para assets

## Wave Manifest

- **Wave 0**: F24-T01 (setup: copiar imagem, preparar asset)
- **Wave 1**: F24-T02, F24-T03, F24-T04 (core: entidade Coin + gerador de moedas + game state)
- **Wave 2**: F24-T05 (integracao: HUD + wiring ChunkRenderer/GameScene)
- **Wave 3**: F24-T06 (docs: diagramas)

## Global Acceptance Criteria

- [ ] Moedas aparecem nos chunks espalhadas (similar a hearts)
- [ ] Mel coleta moedas ao tocar nelas
- [ ] Contador de moedas aparece no HUD
- [ ] Total de moedas persiste entre sessoes (localStorage)
- [ ] Moeda usa sprite/imagem do Rafa com animacao (rotacao + brilho)
- [ ] Sem regressao de performance

## Diagrams

- `docs/diagrams/F24-architecture.mmd`
- `docs/diagrams/F24-journey.mmd`
