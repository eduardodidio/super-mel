# F01: Setup Monorepo + Infra

**Status:** done
**Created:** 2026-09-29
**Description:** Criar estrutura monorepo pnpm com frontend (Vite+React+Phaser3),
backend (Fastify+Prisma), shared types, PostgreSQL schema e render.yaml.

## Wave 0: Scaffolding (setup, deps, config)
- **F01-T01** — Root monorepo: pnpm-workspace.yaml, package.json, tsconfig base, .gitignore
- **F01-T02** — Shared package: packages/shared com types (Player, Score, Level, Power)

## Wave 1: Frontend + Backend (paralelo, nao compartilham arquivos)
- **F01-T03** — Frontend: packages/frontend com Vite + React 18 + TypeScript + Phaser 3
- **F01-T04** — Backend: packages/backend com Fastify + TypeScript + Prisma + schema PostgreSQL

## Wave 2: Integracao + Deploy
- **F01-T05** — render.yaml Blueprint + scripts root (dev, build) + README.md do projeto

## Tasks
| Task | Wave | Descricao |
|------|------|-----------|
| F01-T01 | 0 | Root monorepo scaffolding |
| F01-T02 | 0 | Shared types package |
| F01-T03 | 1 | Frontend (Vite + React + Phaser 3) |
| F01-T04 | 1 | Backend (Fastify + Prisma + PostgreSQL) |
| F01-T05 | 2 | render.yaml + scripts root + README |
