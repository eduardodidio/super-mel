# F41 -- Progresso Salvo no Backend + Migracao Visitante para Conta

**Status:** planned
**Backlog:** B-27

## Goal

Salvar o progresso do jogador (totalCoins + dados flexiveis como levelsCleared, stars, upgrades, bones, achievements) no backend via Prisma/PostgreSQL. Guests continuam usando localStorage. Ao criar conta (guest -> registered), o progresso local e migrado automaticamente para o backend (soma coins, uniao de listas).

## Problem Statement

Atualmente, `totalCoins` e armazenado exclusivamente no localStorage (`supermel_total_coins`). Se o jogador troca de dispositivo, limpa cache, ou usa outro browser, todo progresso e perdido. Nao existe modelo de progresso no backend -- apenas Player, Score e Level.

## Architecture Impact

### Backend (packages/backend)
- **Prisma schema**: novo modelo `Progress` com relacao 1:1 com Player
- **routes/progress.ts**: novo arquivo com GET /api/progress e PUT /api/progress (auth JWT)
- **routes/auth.ts**: ao registrar, criar Progress vazio automaticamente
- **server.ts**: registrar progressRoutes no prefix `/api/progress`

### Frontend (packages/frontend)
- **game/hooks/useGameState.ts**: ao login de usuario registrado, ler progresso do backend; debounce 2s nas escritas
- **components/AuthScreen.tsx**: apos register, enviar localStorage para backend (merge)
- Novo **game/hooks/useProgressSync.ts**: hook de sincronizacao com debounce

### Shared (nao necessario)
- Nenhuma mudanca no shared -- tipos do Progress ficam no backend (Prisma) e frontend (interface local)

## Wave Manifest

| Wave | Tasks | Rationale |
|------|-------|-----------|
| 0 | F41-T01 | Prisma migration -- tudo depende do modelo existir |
| 1 | F41-T02, F41-T04 | Paralelo: backend routes + frontend sync hook (codebases diferentes) |
| 2 | F41-T03, F41-T05 | Dependem de T02 e T04: merge na auth + wiring nas mutations |

## Global Acceptance Criteria

- [ ] Modelo Progress existe no Prisma com relacao 1:1 com Player
- [ ] GET /api/progress retorna progresso do jogador autenticado (JWT)
- [ ] PUT /api/progress atualiza progresso com merge parcial no campo `data` JSON
- [ ] Guest continua usando localStorage-only (sem chamadas ao backend para progress)
- [ ] Jogador registrado: useGameState le progress do backend ao montar
- [ ] Jogador registrado: mutations (addCoin etc.) disparam sync debounced (2s) para o backend
- [ ] Ao criar conta: localStorage totalCoins e migrado para backend
- [ ] Flush imediato ao mudar de cena (gameover, menu)
- [ ] Sem regressao: guest play offline continua funcionando normalmente
- [ ] PUT /api/progress sem token retorna 401

## Key Design Decisions

1. **1:1 Progress per Player** -- @unique on playerId, single row, JSON `data` field for flexibility
2. **Inline auth preHandler** -- JWT verification scoped to progress routes only (existing routes untouched)
3. **PUT with deep merge** -- Frontend sends partial data, backend merges into existing `data` JSON
4. **Debounce 2s + flush on scene change** -- Balances API load vs data freshness
5. **Empty Progress on register** -- Backend auto-creates row, frontend PUTs localStorage data after

## Diagrams

- `docs/diagrams/F41-architecture.mmd`
- `docs/diagrams/F41-journey.mmd`
