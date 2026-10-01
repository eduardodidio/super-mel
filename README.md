# Super Mel

Jogo web estilo Flappy Bird + Mario Maker com graficos Minecraft.
Super Mel e uma yorkshire micro heroina que voa e dispara poderes
com a Bola do Infinito.

## Stack

- **Frontend:** Vite + React 18 + TypeScript + React Three Fiber + Rapier
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
3. No menu: **JOGAR** para modo procedural, **FASE TESTE** para a fase de teste manual
4. Destrua blocos de madeira e vidro com a Bola do Infinito
5. Colete coracoes para recuperar vida (max 3)
6. Colete moedas espalhadas pelos chunks
7. Desvie de lava e obstaculos solidos (pedra, ferro, tijolo)

### Controles

- **Setas Esq/Dir** — Mover esquerda/direita
- **Seta Baixo** — Abaixar (crouch)
- **Seta Cima** — Olhar pra cima (camera sobe)
- **Espaco** — Pular (segurar = voar)
- **Z** — Atacar (Bola do Infinito)
- **Mobile:** D-pad 4 direcoes + A (pular/voar) + B (atacar)

## Arquitetura

```
super-mel/
├── packages/frontend/    Vite + React 18 + R3F + Rapier + Zustand
│   └── src/game/
│       ├── entities/     Mel, Coin, Heart, Projectile, Block
│       ├── systems/      ChunkGenerator, AnimationStateMachine, HUD, Camera
│       ├── scenes/       GameScene3D, MenuScene, EditorScene
│       └── hooks/        useControls, useGameState, useFrame
├── packages/backend/     Fastify + Prisma + PostgreSQL
│   └── src/routes/       auth, scores, levels
├── packages/shared/      Types compartilhados (BlockType, etc.)
└── docs/                 ADRs, PRDs, Mermaid diagrams
```

## Tech Stack

- **Frontend:** Vite 6 + React 18 + TypeScript 5.6 + React Three Fiber + @react-three/rapier + Three.js + Zustand
- **Backend:** Fastify 5 + TypeScript + Prisma 6 + PostgreSQL
- **Monorepo:** pnpm workspaces
- **Deploy:** Render.com (Blueprint via render.yaml)
- **Auth:** bcryptjs + JWT (guest play com localStorage)

## Documentacao

- [`docs/adr/`](docs/adr/) -- Architecture Decision Records
- [`docs/prd/`](docs/prd/) -- Product Requirements Documents
- [`docs/diagrams/`](docs/diagrams/) -- Mermaid diagrams (arquitetura + jornada por feature)
- [`tasks/features/`](tasks/features/) -- Task manifests por feature

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
│   ├── frontend/     # Vite + React 18 + R3F + Rapier + Zustand
│   │   └── src/
│   │       ├── game/
│   │       │   ├── entities/   # Mel, Coin, Heart, Projectile, Block
│   │       │   ├── systems/    # ChunkGenerator, AnimationStateMachine, HUD, Camera
│   │       │   ├── scenes/     # GameScene3D, MenuScene, EditorScene
│   │       │   └── hooks/      # useControls, useGameState, useFrame
│   │       └── components/     # AuthScreen, GameView
│   ├── backend/      # Fastify + Prisma
│   │   └── src/routes/  # auth, scores, levels
│   └── shared/       # Types compartilhados (BlockType, etc.)
├── render.yaml       # Deploy Render.com
├── docs/             # ADRs, PRDs, diagramas Mermaid
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
- **F24:** Sistema de Moedas — Moedas coletaveis espalhadas pelos chunks, contador no HUD, persistencia via localStorage para futuros upgrades.

### Features Recentes

- **F25** — Controles refinados: crouch, fly, look up, remap de teclas, D-pad mobile 4 direcoes
- **F26** — Fase basica de teste: 5 chunks manuais para testar gameplay (botao FASE TESTE no menu)
- **F27** — Performance: removed 100+ pointLights, eliminated 60 re-renders/sec, fixed GC pressure, added resource disposal
- **F28** — Moedas + Drop: moedas usam sprite personalizado (moedaDoJogo.png), item_blocks vermelhos com "?" liberam 1-3 moedas ao serem atingidos, blocos destrutiveis dropam moedas (40% chance), HUD coin counter vermelho
- **F29** — Sprites Completos: corrigido mapeamento de jump_land/hurt_heavy, animacoes crouch/look_up/fly agora usam sprites dedicados, timing de ataque e landing mais responsivos
- **F30** — Docs & Arquitetura: README com secoes de Arquitetura e Tech Stack, docs/README.md como indice navegavel, Doc-Review Gate no CLAUDE.md, template de checklist de docs
- **F51** — Fix Sprite Size Consistency: corrigido bug onde Mel aparecia gigante em animacoes como lie_down/death/hurt_heavy. Escala agora normalizada pelo frameSize do manifest (224x168) em vez de altura fixa. Sprites faltantes (crouch/fly/look_up) mapeados para poses existentes. Transicoes suavizadas com lerp e pes ancorados ao collider.

## Poderes Futuros (pos-MVP)

- Agua - empurra obstaculos
- Fogo - dano em area
- Gelo - congela obstaculos
- Luz - ilumina areas escuras
- Infinito - super poder ultimate
