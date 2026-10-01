# Super Mel -- Documentacao

Indice completo de toda a documentacao do projeto.

## ADRs (Architecture Decision Records)

Decisoes arquiteturais significativas, numeradas sequencialmente.

- [0001 -- Adopt claude-didio-config](adr/0001-adopt-claude-didio-framework.md)

## PRDs (Product Requirements)

Um PRD por feature, escrito antes do Architect rodar.

- [PRD-001 -- Super Mel Game (MVP)](prd/PRD-001-super-mel-game.md)
- [3D Rewrite Plan](prd/3d-rewrite-plan.md)

## Backlog

Ideias e follow-ups priorizados a partir de benchmark de jogos similares de mercado (Mario Maker 2, Mario Wonder, DKC, Rayman Legends, Kirby, Crash 4, Jetpack Joyride, Celeste, LittleBigPlanet...). Itens `B-NN` com prioridade, esforco, referencias, modulos afetados e feature candidata (F33+). Promover um item: `/brainstorm` -> `/research` -> `/product-brief` -> `/create-feature`.

- [BACKLOG -- Ideias e Follow-ups (benchmark de mercado)](BACKLOG.md)

## Diagramas (Mermaid)

Diagramas vivos mantidos em sincronia com o codigo. Dois por feature: arquitetura (componentes/data-flow) e jornada (fluxo do usuario).

### Por Feature

| Feature | Arquitetura | Jornada |
|---------|-------------|---------|
| F01 -- Monorepo Infra | [architecture](diagrams/F01-architecture.mmd) | [journey](diagrams/F01-journey.mmd) |
| F23 -- Sprites & Animacao | [architecture](diagrams/F23-architecture.mmd) | [journey](diagrams/F23-journey.mmd) |
| F24 -- Moedas do Jogo | [architecture](diagrams/F24-architecture.mmd) | [journey](diagrams/F24-journey.mmd) |
| F25 -- Controles & Gameplay | [architecture](diagrams/F25-architecture.mmd) | [journey](diagrams/F25-journey.mmd) |
| F26 -- Fase de Teste | [architecture](diagrams/F26-architecture.mmd) | [journey](diagrams/F26-journey.mmd) |
| F27 -- Performance & Errors | [architecture](diagrams/F27-architecture.mmd) | [journey](diagrams/F27-journey.mmd) |
| F28 -- Moedas + Drop | [architecture](diagrams/F28-architecture.mmd) | [journey](diagrams/F28-journey.mmd) |
| F29 -- Sprites Completos | [architecture](diagrams/F29-architecture.mmd) | [journey](diagrams/F29-journey.mmd) |
| F30 -- README & Docs | [architecture](diagrams/F30-architecture.mmd) | [journey](diagrams/F30-journey.mmd) |
| F51 -- Fix Sprite Size Consistency | [architecture](diagrams/F51-architecture.mmd) | [journey](diagrams/F51-journey.mmd) |

## Task Manifests

Diretorio de tasks por feature em [`tasks/features/`](../tasks/features/).

| Feature | Descricao |
|---------|-----------|
| [F01 -- Monorepo Infra](../tasks/features/F01-monorepo-infra/) | pnpm workspaces, Vite, Fastify, Prisma, render.yaml |
| [F02 -- Game Engine](../tasks/features/F02-game-engine/) | Engine base, scenes, arcade physics, camera |
| [F03 -- Super Mel Voo](../tasks/features/F03-super-mel-voo/) | Sprite, mecanica flappy, tilt, invencibilidade |
| [F04 -- Blocos Minecraft](../tasks/features/F04-blocos-minecraft/) | 10 tipos, chunk generation, texturas pixel art |
| [F05 -- Sistema de Vida](../tasks/features/F05-sistema-vida/) | 3 coracoes, HUD, dano, coleta, game over |
| [F06 -- Bola do Infinito](../tasks/features/F06-bola-infinito/) | Disparo, destruicao de blocos, particulas |
| [F07 -- Score & Leaderboard](../tasks/features/F07-score-leaderboard/) | Distancia, ranking top 15, API backend |
| [F09 -- Backgrounds Parallax](../tasks/features/F09-backgrounds-parallax/) | 5 temas, 3 camadas, texturas procedurais |
| [F10 -- Audio System](../tasks/features/F10-audio-system/) | Musica + 6 SFX, volume, mute |
| [F11 -- Auth](../tasks/features/F11-auth/) | Guest + Login/Register, bcrypt, JWT |
| [F12 -- Responsivo & Mobile](../tasks/features/F12-responsivo-mobile/) | Touch controls, virtual shoot button |
| [F13 -- Deploy Render](../tasks/features/F13-deploy-render/) | render.yaml Blueprint automatico |
| [F23 -- Sprites & Animacao](../tasks/features/F23-sprites-animacao/) | Sprites 2D, maquina de estados de animacao |
| [F24 -- Moedas do Jogo](../tasks/features/F24-moedas-do-jogo/) | Moedas coletaveis, HUD counter, persistencia |
| [F25 -- Controles & Gameplay](../tasks/features/F25-controles-gameplay/) | Crouch, fly, look up, remap keys, D-pad mobile |
| [F26 -- Fase de Teste](../tasks/features/F26-fase-teste/) | 5 chunks manuais, botao FASE TESTE no menu |
| [F27 -- Performance & Errors](../tasks/features/F27-performance-errors/) | Remocao pointLights, re-renders, GC pressure |
| [F28 -- Moedas Vermelhas Drop](../tasks/features/F28-moedas-vermelhas-drop/) | Sistema de moedas vermelhas |
| [F29 -- Sprites Completos Mel](../tasks/features/F29-sprites-completos-mel/) | Sprites completos da Mel |
| [F30 -- README & Docs Arquitetura](../tasks/features/F30-readme-docs-arquitetura/) | Documentacao, README, indice de docs |
| [F51 -- Fix Sprite Size Consistency](../tasks/features/F51-fix-sprite-size-consistency/) | Correcao escala normalizada de sprites, mapeamento sprites faltantes |

## Guias

- [Regras do Projeto (CLAUDE.md)](../CLAUDE.md) -- Convencoes, guardrails, workflow de agentes
- [Setup Local (README)](../README.md#setup-local) -- Como rodar o projeto localmente
