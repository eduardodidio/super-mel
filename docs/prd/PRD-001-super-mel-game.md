# PRD: Super Mel - Jogo Web Flappy Bird + Mario Maker

**Feature ID:** F01-F14 (projeto completo decomposto em features)
**Status:** approved
**Owner:** Eduardo Rutkoski Didio
**Date:** 2026-09-29

## Problem

Criar um jogo web divertido para o filho do Eduardo, onde Super Mel (uma
yorkshire micro) e a heroina. O jogo combina a mecanica de voo do Flappy Bird
com a criacao de fases estilo Mario Maker e estetica visual tipo Minecraft
(blocos/voxels).

## Goal

Entregar um jogo web responsivo, jogavel em desktop e mobile, com editor de
fases drag-and-drop, sistema de poderes progressivos, score persistente e
deploy no Render.

---

## Decisoes Tecnicas (aprovadas 2026-09-29)

| Topico | Decisao |
|--------|---------|
| Game Engine | **Phaser 3** (physics, tilemap, sprites, camera, input built-in) |
| Autenticacao | **Dual:** Guest play (nome no localStorage) + Login simples (user/senha, sem OAuth) |
| Sprites Mel | **Placeholder geometrico** ate sprites reais serem fornecidos. Usuario montara sprites. |
| Poderes MVP | **Destruicao** (quebrar blocos) + **Ataque** (destruir obstaculos). Sistema extensivel. |
| Poderes Futuro | Agua, Fogo, Gelo, Luz, Poder do Infinito (e mais no futuro) |
| Inimigos MVP | **Nenhum inimigo vivo no MVP** - apenas obstaculos fisicos (blocos de madeira, pedra, etc.) |
| Inimigos Futuro | Morcegos, slimes, bosses (features pos-MVP) |
| Blocos Editor | Blocos padrao Minecraft: **Pedra, Areia, Madeira, Ferro, Terra, Tijolo, Vidro, Folha, Agua, Lava** |
| Package Manager | **pnpm** workspaces (mais rapido, melhor para monorepo) |
| ORM | **Prisma** (type-safe, migrations, PostgreSQL) |
| Backend Framework | **Fastify** (mais rapido que Express, schema validation nativo) |
| Mobile Controls | **Padrao otimizado:** toque lado esquerdo = voar, botao virtual lado direito = atirar |
| Backgrounds | **Parallax** (2-3 camadas) com temas aleatorios + opcao custom no editor |
| Deploy | **Render.com** com `render.yaml` (Blueprint automatico) |

---

## Visao Geral do Jogo

### Gameplay Core
- Super Mel voa (mecanica flappy bird - toque/clique para subir)
- Tela scrolla horizontalmente (side-scroller)
- Super Mel dispara poderes usando a "Bola do Infinito"
- Poder MVP: destruicao de blocos e obstaculos
- Blocos destrutiveis quebram com a bola; blocos solidos nao
- Itens coletaveis: coracoes (vida)

### Sistema de Vida
- 3 coracoes (HP) exibidos no HUD
- Colisao com obstaculo perigoso (spike, lava) = -1 coracao
- Coletar item de coracao = +1 coracao (max 3)
- 0 coracoes = game over

### Sistema de Score
- Score baseado na maior distancia percorrida (em metros/blocos)
- Leaderboard persistente (PostgreSQL)
- Score salvo por jogador (guest ou logado)

### Editor de Fases (Mario Maker Style)
- Interface visual drag-and-drop
- Paleta de blocos Minecraft na lateral (pedra, areia, madeira, ferro, terra, tijolo, vidro, folha, agua, lava)
- Categorias de blocos:
  - **Solido** (pedra, ferro, tijolo) - nao quebra, colisao total
  - **Destruivel** (madeira, vidro) - quebra com 1-2 tiros da bola
  - **Plataforma** (folha) - colisao so por cima
  - **Perigoso** (lava) - causa dano ao tocar
  - **Decorativo** (areia, terra) - sem colisao, visual
  - **Agua** - desacelera a Mel, nao causa dano
  - **Item block** - solta coracao quando quebrado
- Grid onde o usuario arrasta blocos para montar a fase
- Testar a fase antes de publicar (play-test inline)
- Salvar/carregar fases (backend + PostgreSQL)

### Poderes da Bola do Infinito
**MVP:**
- Disparo basico - bola reta que destroi blocos destruiveis e obstaculos
- Velocidade e alcance fixos

**Futuro (pos-MVP, sistema extensivel):**
- Poder de Agua - empurra obstaculos, apaga fogo
- Poder de Fogo - dano em area, destroi mais blocos
- Poder de Gelo - congela obstaculos, cria plataformas
- Poder de Luz - ilumina areas escuras, revela segredos
- Poder do Infinito - super poder ultimate, destroi tudo no caminho
- Desbloqueio: por distancia acumulada ou fases completadas

### Visual e Audio
- Graficos estilo Minecraft (blocos pixelados 2D, 32x32 ou 64x64)
- Sprites da Super Mel: placeholder geometrico ate sprites reais
  - Animacoes previstas: idle, voando, atirando, dano, morte
- Backgrounds parallax (2-3 camadas) com temas: floresta, deserto, noite, espaco, oceano
  - Randomizado por padrao, selecionavel no editor
- Sistema de audio preparado com slots para:
  - Musica de fundo (loop)
  - SFX: pulo, tiro, dano, coleta, game over, destruicao de bloco
  - Arquivos fornecidos pelo usuario

---

## Arquitetura Tecnica

### Monorepo Structure
```
super-mel/
├── packages/
│   ├── frontend/          # Vite + React + Phaser 3 + TypeScript
│   ├── backend/           # Fastify + Prisma + TypeScript
│   └── shared/            # Types, constants, game config
├── prisma/
│   └── schema.prisma      # Schema do banco
├── render.yaml             # Blueprint Render.com
├── pnpm-workspace.yaml
├── package.json
├── docs/
├── agents/
├── tasks/
└── ...
```

### Frontend
- **Build:** Vite
- **Framework:** React 18 + TypeScript
- **Game Engine:** Phaser 3 embeddado via `phaser` npm package
  - Arcade Physics para colisao
  - Tilemap para blocos Minecraft
  - Sprite + Animation system para Super Mel
  - Camera follow + auto-scroll horizontal
- **Editor de Fases:** React components + Phaser scene interativa
- **Responsividade:** mobile-first, virtual joystick (phaser3-rex-plugins ou custom)

### Backend
- **Runtime:** Node.js 20+ LTS
- **Framework:** Fastify + TypeScript
- **ORM:** Prisma
- **Endpoints:**
  - `POST /api/auth/register` - criar conta (user/senha)
  - `POST /api/auth/login` - login
  - `POST /api/auth/guest` - criar sessao guest
  - `GET/POST /api/levels` - CRUD fases
  - `GET/POST /api/scores` - salvar/listar scores
  - `GET /api/leaderboard` - top scores

### Banco de Dados (PostgreSQL)
```sql
players
  id          UUID PK
  name        VARCHAR(50)
  password    VARCHAR(255) NULL  -- null = guest
  is_guest    BOOLEAN DEFAULT true
  created_at  TIMESTAMP

scores
  id          UUID PK
  player_id   UUID FK -> players
  distance    INTEGER         -- distancia em blocos
  level_id    UUID FK -> levels NULL  -- null = modo infinito
  created_at  TIMESTAMP

levels
  id          UUID PK
  creator_id  UUID FK -> players
  name        VARCHAR(100)
  data        JSONB           -- grid de blocos + config
  background  VARCHAR(50)     -- tema do background
  published   BOOLEAN DEFAULT false
  created_at  TIMESTAMP
  updated_at  TIMESTAMP
```

### Deploy (Render.com)
- **Frontend:** Static Site (Vite build -> `packages/frontend/dist/`)
- **Backend:** Web Service (Node.js -> `packages/backend/`)
- **Database:** PostgreSQL (managed, free tier para MVP)
- **`render.yaml`** com Blueprint automatico

---

## Decomposicao em Features (ordem de execucao)

| # | Feature | Descricao | Deps | Waves est. |
|---|---------|-----------|------|-----------|
| F01 | Monorepo + Infra | pnpm workspace, Vite+React, Fastify, Prisma, PostgreSQL, render.yaml | - | 2 |
| F02 | Game Engine Base | Phaser 3 scene, camera scroll, physics, tilemap renderer | F01 | 2 |
| F03 | Super Mel + Voo | Sprite placeholder, mecanica flappy, gravidade, controles (click/touch) | F02 | 2 |
| F04 | Blocos Minecraft | Tilemap com 10 tipos de blocos, colisao por tipo, texturas pixel art | F02 | 2 |
| F05 | Sistema de Vida | HUD 3 coracoes, dano por colisao, item coracao, game over screen | F03 | 1 |
| F06 | Bola do Infinito | Disparo basico, colisao bola-bloco, destruicao de destruiveis | F03, F04 | 2 |
| F07 | Score + Leaderboard | Distancia tracker, save score API, tela de leaderboard | F01, F05 | 2 |
| F08 | Editor de Fases | Grid visual, paleta DnD, save/load API, play-test inline | F04, F07 | 3 |
| F09 | Backgrounds Parallax | 5 temas (floresta, deserto, noite, espaco, oceano), 2-3 camadas, random + selecionavel | F02 | 1 |
| F10 | Sistema de Audio | Audio manager, slots musica/SFX, mute, volume, placeholder sons | F02 | 1 |
| F11 | Auth (Guest + Login) | Register, login, guest session, JWT, middleware | F01 | 2 |
| F12 | Responsivo + Mobile | Virtual joystick, touch controls, viewport scaling, UI responsiva | F03, F06 | 2 |
| F13 | Deploy Render | render.yaml, env vars, build scripts, health check, CI | F01 | 1 |
| F14 | Polish + Integracao | Conectar tudo, menu principal, flow completo, QA end-to-end | ALL | 2 |

**Total estimado: ~23 Waves**

### Ordem sugerida de execucao (sprints)

**Sprint 1 - Fundacao:**
- F01 (Monorepo + Infra)
- F13 (Deploy Render) -- subir infra vazia cedo

**Sprint 2 - Core do Jogo:**
- F02 (Game Engine Base)
- F03 (Super Mel + Voo)
- F04 (Blocos Minecraft)

**Sprint 3 - Mecanicas:**
- F05 (Sistema de Vida)
- F06 (Bola do Infinito)
- F09 (Backgrounds)
- F10 (Audio)

**Sprint 4 - Backend + Social:**
- F11 (Auth)
- F07 (Score + Leaderboard)

**Sprint 5 - Editor:**
- F08 (Editor de Fases)

**Sprint 6 - Polish:**
- F12 (Responsivo + Mobile)
- F14 (Polish + Integracao)

---

## Decisoes Resolvidas

1. ~~Game engine~~ -> **Phaser 3**
2. ~~Autenticacao~~ -> **Guest + Login simples (user/senha)**
3. ~~Sprites~~ -> **Placeholder ate usuario fornecer** (previstas: idle, voando, atirando, dano, morte)
4. ~~Poderes MVP~~ -> **Destruicao + Ataque obstaculos**
5. ~~Inimigos MVP~~ -> **Nenhum - apenas obstaculos fisicos**
6. ~~Blocos~~ -> **10 tipos padrao Minecraft** (pedra, areia, madeira, ferro, terra, tijolo, vidro, folha, agua, lava)
7. ~~Package manager~~ -> **pnpm + Prisma**
8. ~~Mobile controls~~ -> **Virtual joystick (esquerda voar, direita atirar)**
9. ~~Backgrounds~~ -> **Parallax 2-3 camadas, 5 temas**
10. ~~Deploy~~ -> **render.yaml Blueprint automatico**

## Open Questions (resolvidas ou adiadas)

- ~~Todas as questoes iniciais foram respondidas~~
- **Adiado:** Sprites reais da Mel (usuario fornecera)
- **Adiado:** Arquivos de audio (usuario fornecera)
- **Adiado:** Poderes elementais (pos-MVP)
- **Adiado:** Inimigos com IA (pos-MVP)
- **Adiado:** Monetizacao (sem plano atual)
