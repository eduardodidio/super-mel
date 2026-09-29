# Super Mel

Jogo web estilo Flappy Bird + Mario Maker com graficos Minecraft.
Super Mel e uma yorkshire micro heroina que voa e dispara poderes
com a Bola do Infinito.

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Phaser 3
- **Backend:** Fastify + TypeScript + Prisma
- **Database:** PostgreSQL
- **Deploy:** Render.com

## Setup Local

```bash
# Instalar dependencias
pnpm install

# Configurar banco (precisa de PostgreSQL rodando)
cp packages/backend/.env.example packages/backend/.env
# Edite .env com sua DATABASE_URL

# Rodar migrations
pnpm db:migrate

# Iniciar dev (frontend + backend em paralelo)
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Health: http://localhost:3001/api/health

## Estrutura

```
super-mel/
├── packages/
│   ├── frontend/     # Vite + React + Phaser 3
│   ├── backend/      # Fastify + Prisma
│   └── shared/       # Types compartilhados
├── render.yaml       # Deploy Render.com
├── docs/             # ADRs, PRDs, diagramas
├── agents/           # Prompts do framework didio
└── tasks/            # Features e tasks
```

## Features Entregues

- **F01:** Monorepo + Infra (pnpm, Vite, Fastify, Prisma, render.yaml)
