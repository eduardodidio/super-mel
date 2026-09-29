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

## Como Jogar

1. Abra o jogo no browser
2. Entre como Visitante (nome) ou crie uma conta
3. No menu: **JOGAR** para jogar, **CRIAR FASE** para o editor
4. **Controles Desktop:** Space/Up = voar, Z = atirar
5. **Controles Mobile:** Toque esquerda = voar, Botao direita = atirar
6. Destrua blocos de madeira e vidro com a Bola do Infinito
7. Colete coracoes para recuperar vida (max 3)
8. Desvie de lava e obstaculos solidos (pedra, ferro, tijolo)

## Editor de Fases (Mario Maker)

1. Menu > **CRIAR FASE**
2. Selecione um bloco na paleta esquerda (pedra, madeira, lava, etc.)
3. Clique/arraste no grid para posicionar blocos
4. Use "Apagar" na paleta para remover blocos
5. Troque o background com o botao **BG**
6. Clique **TESTAR** para jogar sua fase
7. Clique **SALVAR** para publicar

Blocos disponiveis: Pedra, Terra, Areia, Madeira, Ferro, Tijolo,
Vidro, Folha, Agua, Lava, Item Block (?)

## Estrutura

```
super-mel/
├── packages/
│   ├── frontend/     # Vite + React + Phaser 3
│   │   └── src/
│   │       ├── scenes/      # Boot, Menu, Game, GameOver, Editor, LevelSelect, Leaderboard
│   │       ├── systems/     # Player, BlockManager, Parallax, Audio, HUD, Projectiles, Touch
│   │       └── components/  # AuthScreen, GameView
│   ├── backend/      # Fastify + Prisma
│   │   └── src/routes/  # auth, scores, levels
│   └── shared/       # Types compartilhados
├── render.yaml       # Deploy Render.com
├── docs/             # ADRs, PRDs, diagramas
├── agents/           # Prompts do framework didio
└── tasks/            # Features e tasks
```

## Features Entregues

- **F01:** Monorepo + Infra (pnpm workspaces, Vite, Fastify, Prisma, render.yaml)
- **F02:** Game Engine Base (Phaser 3, 7 scenes, arcade physics, camera follow)
- **F03:** Super Mel + Voo (sprite placeholder, mecanica flappy, tilt, invencibilidade)
- **F04:** Blocos Minecraft (10 tipos, chunk generation infinita, texturas pixel art)
- **F05:** Sistema de Vida (3 coracoes, HUD, dano, coleta, game over)
- **F06:** Bola do Infinito (disparo basico, destruicao de blocos, particulas)
- **F07:** Score + Leaderboard (distancia, ranking top 15, API backend)
- **F08:** Editor de Fases (grid drag-and-drop, 11 blocos, testar, salvar, backgrounds)
- **F09:** Backgrounds Parallax (5 temas, 3 camadas, texturas procedurais)
- **F10:** Audio System (slots musica + 6 SFX, volume, mute)
- **F11:** Auth (Guest + Login/Register, bcrypt, JWT, offline fallback)
- **F12:** Responsivo + Mobile (touch controls, virtual shoot button)
- **F13:** Deploy Render (render.yaml Blueprint automatico)
- **F14:** Polish + Integracao (menu completo, navegacao entre telas, logout)
- **F23:** Sprites & Animation System — Novos sprites 2D de alta qualidade substituem placeholders voxel. Maquina de estados de animacao completa (idle/walk/run/jump/attack/hurt/death/sit), efeitos visuais procedurais (poeira, estrelas, coracoes), bark wave animado, e portrait da Mel no HUD.

## Poderes Futuros (pos-MVP)

- Agua - empurra obstaculos
- Fogo - dano em area
- Gelo - congela obstaculos
- Luz - ilumina areas escuras
- Infinito - super poder ultimate
