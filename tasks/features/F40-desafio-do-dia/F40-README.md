# F40 — Desafio do Dia (Daily Challenge)

**Status:** planned
**Backlog:** B-21

## Goal

Adicionar um modo "Desafio do Dia" onde todos os jogadores jogam o mesmo mapa gerado por uma seed deterministica baseada na data. Cada jogador tem 1 tentativa por dia, e o leaderboard diario mostra quem foi mais longe naquele mapa.

## Architecture Impact

- **Backend / Prisma**: migration adicionando campos `mode` (String, default "infinite") e `seed` (Int, optional) ao model Score
- **Backend / routes**: novo arquivo `daily.ts` com endpoints para checar elegibilidade e leaderboard diario; atualizar `scores.ts` para aceitar mode/seed
- **Backend / server.ts**: registrar novas rotas `/api/daily`
- **Frontend / game / systems / ChunkGenerator.ts**: adicionar parametro `baseSeed` a `generateChunk`, criar funcao `dailySeed(dateStr)`
- **Frontend / game / systems / ChunkRenderer.tsx**: aceitar e repassar `baseSeed` para `generateChunk`
- **Frontend / game / hooks / useGameState.ts**: novo state `dailyMode` + `dailySeed` + `startDailyMode(seed)`
- **Frontend / game / Game3D.tsx**: botao DESAFIO DO DIA no menu, checagem de elegibilidade antes de iniciar
- **Frontend / game / scenes / GameScene3D.tsx**: repassar `baseSeed` ao ChunkRenderer
- **Frontend / game / scenes / GameOverScene3D.tsx**: enviar mode/seed no POST score, mostrar resultado diario
- **Frontend / components / LeaderboardView.tsx**: aba/filtro para leaderboard diario

## Wave Manifest

- **Wave 0**: F40-T01, F40-T02 (Prisma migration + ChunkGenerator baseSeed — sem dependencias entre si)
- **Wave 1**: F40-T03, F40-T04 (Backend daily routes + Frontend daily mode wiring — T03 depende de T01, T04 depende de T02)
- **Wave 2**: F40-T05 (Daily leaderboard UI — depende de T03 para API e T04 para mode state)

## Global Acceptance Criteria

- [ ] Seed diaria gera mapa identico para todos os jogadores no mesmo dia
- [ ] Botao DESAFIO DO DIA aparece no menu
- [ ] Jogador so pode jogar 1 vez por dia (checado via backend)
- [ ] Botao fica desabilitado se jogador ja jogou hoje
- [ ] Score diario salvo com mode="daily" e seed correto
- [ ] Leaderboard diario mostra ranking filtrado por dia
- [ ] Game over em modo daily mostra posicao no ranking do dia
- [ ] Modo infinito continua funcionando sem regressao (baseSeed=0)
- [ ] Migration Prisma roda sem perder dados existentes

## Diagrams

- `docs/diagrams/F40-architecture.mmd`
- `docs/diagrams/F40-journey.mmd`
