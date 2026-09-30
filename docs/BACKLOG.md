# Super Mel -- Backlog de Ideias e Follow-ups (benchmark de mercado)

_Gerado em 2026-09-30 a partir do estado atual do projeto (F01-F32) e de um
benchmark de jogos similares de mercado. Dono: Didio._

Status possiveis de um item: `idea` | `planned` | `in-progress` | `done` | `dropped`.
Todos os itens comecam como `idea`.

## Como usar este backlog

- Cada item tem um ID `B-NN`, prioridade, esforco, referencias de mercado, os
  modulos do codigo que toca e (quando faz sentido) uma feature candidata.
- **Prioridade:** `P1` = proximo ciclo (destrava o resto, ou e barato e muito
  visivel) | `P2` = depois do P1 | `P3` = ideia para o futuro, nao planejar agora.
- **Esforco (mesma escala do `/brainstorm`):** `S` = 1 wave | `M` = 2-3 waves |
  `L` = 4+ waves | `XL` = precisa virar mais de uma feature.
- **Para promover um item a feature:**
  `/brainstorm "<item>"` -> `/research "<item>"` -> `/product-brief` ->
  `/create-feature F<NN> <descricao>`. Os numeros F33+ sugeridos no roadmap sao
  so uma ordem proposta; o numero final e decidido na hora do `/create-feature`.
- Quando um item virar feature, troque o status aqui e linke a pasta
  `tasks/features/F<NN>-*/`. Quando for descartado, marque `dropped` e diga por que
  (uma linha basta) -- e mais util do que apagar.

---

## Estado atual em uma olhada (o que o benchmark compara)

O que ja existe (README, PRD-001, 3d-rewrite-plan e codigo em `packages/frontend/src/game`):

- Platformer 2.5D em React Three Fiber + Rapier, estetica voxel Minecraft, Mel como sprite 2D (billboard).
- Movimento: andar/correr, pulo com altura variavel + coyote time, agachar, olhar pra cima,
  voo segurando Space (max 5s, reseta ao pousar), ataque Z com a Bola do Infinito
  (alcance 10 blocos, cooldown 300ms).
- Vida: 3 coracoes, invencibilidade 1,5s apos dano, coracao coletavel, game over em 0.
- Moedas vermelhas (desenho do Rafa) persistidas em `localStorage`, item_blocks "?" que
  soltam 1-3 moedas, blocos destrutiveis dropam moeda (40%). As moedas ainda nao compram nada.
- 11 tipos de bloco com propriedades (solido / destrutivel / perigoso / plataforma).
- Modo JOGAR = infinito procedural (`ChunkGenerator`, seed por chunk, dificuldade cresce ate ~25 chunks).
- FASE TESTE (`TestLevelData`) com layout manual.
- Editor de fases (grid, paleta de blocos, testar, salvar, publicar, trocar BG) e level select
  com fases da comunidade. `LevelData` = grid + width + height + spawnPoint.
- Leaderboard top 15 por distancia; auth visitante/login; audio (musica + 6 SFX);
  5 temas de fundo; touch controls mobile; deploy no Render.

Gaps que o benchmark deixa evidentes (e que este backlog ataca):

- Nao existe **fim de fase**, **checkpoint** nem **tela de resultado** -- toda fase hoje
  "termina" em game over ou em voltar ao menu.
- **Zero inimigos** (decisao de MVP), entao a Bola do Infinito so quebra bloco.
- **Moedas sem destino** (nada para comprar), **sem missoes**, sem colecionaveis por fase.
- Sem **gamepad**, sem **menu de pausa/opcoes**, sem modo facil.
- Progresso (moedas, fases zeradas) so em `localStorage`; o backend so guarda score e fases.
- Comunidade publica sem **clear check**, sem sinal de dificuldade e sem regras kid-safe.
- Formato de fase so guarda blocos: nao da para colocar moeda, coracao, inimigo, checkpoint ou goal no editor.
- Sprites que ja existem e nao sao usados: `sit`, `lie_down`, `wait`, `affection`, `jump_on_owner`.

---

## Jogos de referencia (benchmark)

| Jogo (ano) | Por que e parecido com o Super Mel | O que vale copiar | Itens |
|---|---|---|---|
| **Super Mario Maker 2** (2019) | Editor + fases da comunidade, o "Mario Maker" do PRD | Clear check antes de publicar, tags e taxa de clear, curtir/boo + carimbos, codigo de fase, Endless Challenge, Story Mode com 100+ fases oficiais, clear conditions, checkpoint flag | B-02, B-03, B-07, B-08, B-09, B-26, B-28, B-29 |
| **Super Mario Bros. Wonder** (2023) | Platformer 2D moderno de referencia da familia Nintendo | Badges (1 habilidade equipada por vez), fim de fase com bandeira, Yoshi/Nabbit como personagens "sem dano" para criancas, mapa de mundo | B-01, B-17, B-37 |
| **Donkey Kong Country: Tropical Freeze** (2014/2018) | 2.5D com plataformas e coleta | Letras KONG + pecas de quebra-cabeca escondidas, checkpoint (porquinho), barris-canhao, **Funky Mode** (modo facil embutido: mais coracoes e pulo duplo) | B-02, B-05, B-09, B-37 |
| **Donkey Kong Bananza** (2025) | Destruicao de terreno como verbo central | Cavar/quebrar o cenario como diversao principal, transformacoes temporarias com tempo | B-18, B-20 |
| **Rayman Legends** (2013) | Platformer 2D/2.5D colorido para familia | Tela de fim de fase com contagem de Lums e trofeus, desafios diarios/semanais com ranking, fases musicais, sem vidas (retry instantaneo) | B-01, B-02, B-21, B-33 |
| **Kirby and the Forgotten Land** (2022) | Platformer bem tolerante, publico infantil | **5 missoes escondidas por fase** (reveladas aos poucos), copy abilities, hub acolhedor | B-04, B-19, B-24 |
| **Crash Bandicoot 4** (2020) | 2.5D com caixas destrutiveis | Caixas = blocos destrutiveis com contador e gema por quebrar todas, mascaras quanticas (poder temporario), modo moderno sem vidas, contra-relogio com reliquias | B-02, B-04, B-18, B-25 |
| **Sonic Superstars** (2023) | 2.5D recente, co-op local | Co-op local de sofa, poderes das esmeraldas | B-40 |
| **Nikoderiko: The Magical World** (2024) | Indie 2.5D estilo DKC | Prova que a formula DKC 2.5D continua vendendo; montarias como habilidade extra, co-op | B-40 |
| **Yoshi and the Mysterious Book** (mai/2026, Switch 2) | Lancamento 2D familiar mais recente do mercado | "Livro" que registra criaturas e comportamentos descobertos (meta de colecao), interacoes entre criaturas e itens | B-24 |
| **LittleBigPlanet / Sackboy** (2008-2020) | Criar e compartilhar fases, jogo de familia | Stickers/fotos como decoracao, fantasias (cosmeticos), co-op, "Team Picks" | B-30, B-34, B-35, B-40 |
| **Jetpack Joyride** (2011) | Modo infinito com "segurar para subir" = o voo da Mel | 2 gadgets equipados comprados com moedas (Coin Magnet, Air Barrys...), missoes de 3 em 3, veiculos como power-up temporario | B-17, B-18, B-22 |
| **Subway Surfers / Alto's Odyssey** | Endless com retencao diaria | Desafio diario, 3 metas por vez, biomas que mudam com a distancia, skins | B-21, B-22, B-23, B-34 |
| **Spelunky** (2012/2020) | Geracao procedural com pedacos feitos a mao | Daily challenge com seed do dia, salas-template misturadas com procedural | B-21, B-23 |
| **Celeste** (2018) | Padrao-ouro de acessibilidade em platformer | **Assist Mode** sem julgamento: velocidade do jogo, invencibilidade, stamina infinita, dashes extras, pular capitulo | B-37 |
| **Untitled Goose Game** (2019) | Animal protagonista com verbo proprio | O "honk" como acao nao-letal que faz o mundo reagir -> latido da Mel | B-14 |
| **PAW Patrol: Mighty Pups Save Adventure Bay** (2020) | Cachorros super-herois de capa, jogo para criancas pequenas | Zero punicao, co-op, colecionaveis simples, nada de texto livre da comunidade | B-28, B-37, B-40 |
| **Kaze and the Wild Masks** (2021, PixelHive, Brasil) | Platformer brasileiro estilo DKC com heroi animal | Mascaras = poderes de animais (voar, nadar, escalar); referencia local de qualidade | B-19 |
| **Drawn to Life** (2007) | Crianca desenha o heroi e os itens do jogo | Desenhos do jogador dentro do jogo (a moeda do Rafa ja e isso) | B-35 |
| **Mega Man** (Rush) | Cao-robo companheiro | Rush Coil / Rush Jet: o parceiro vira mola e jato -> ideia para o Robo | B-40 |

---

## Principios de design tirados do benchmark

1. **Fase tem comeco, meio e fim.** Goal + checkpoint + tela de resultado sao a base de
   Mario, Rayman e Kirby. Sem isso, nem o editor nem uma campanha funcionam de verdade.
2. **Sem vidas, com retry instantaneo** (Celeste, Rayman Legends, Crash 4 modo moderno).
   Crianca nunca deveria ver "game over" numa fase; game over fica so no modo infinito.
3. **Moeda precisa de destino.** Jetpack (gadgets), Subway (upgrades) e Mario Wonder
   (loja de badges) mostram que contador sem loja vira ruido.
4. **Replay vem de objetivos escondidos, nao de dificuldade** (Kirby: 5 missoes por fase;
   DKC: KONG e pecas; Crash: caixas).
5. **Comunidade de criacao exige clear check e sinal de dificuldade** (Mario Maker 2) --
   e, para publico infantil, nada de texto livre.
6. **A fantasia do personagem vira verbos.** DK Bananza fez da destruicao o verbo central;
   o Ganso tem o honk. A Mel ja voa e atira; faltam os verbos de cachorro: cavar,
   buscar, latir, farejar, sentar.
7. **Acessibilidade e feature, nao vergonha** (Celeste Assist, Funky Mode, Yoshi/Nabbit).

---

## Backlog

### Tema 1 -- Estrutura de fase, progressao e campanha

#### B-01 -- Fim de fase: chegar ate o dono + tela de resultado
- **Prioridade:** P1 | **Esforco:** M | **Status:** idea | **Feature candidata:** F34
- **Referencias:** Mario (bandeira), Rayman Legends (tela final com contagem e trofeus), Kirby (Waddle Dees no fim da fase)
- **Ideia:** entidade `goal` no `LevelData`. Em vez de bandeira, o fim da fase e o **dono da Mel**:
  ao encostar nele toca a animacao `jump_on_owner.png` (sprite que ja existe e nao e usado) e
  abre a tela de resultado: moedas da fase, tempo, coracoes restantes, mortes, 1-3 estrelas.
  Score por fase salvo no backend (`Score.levelId` ja existe no schema).
- **Por que:** e o pre-requisito de campanha (B-03), missoes (B-04), clear check (B-26) e contra-relogio (B-25).
- **Toca em:** `shared/types.ts` (LevelData), `TestLevelData.ts`, `GameScene3D.tsx`,
  `useGameState.ts` (nova scene `levelclear`), nova `ResultScene`, `AnimationStateMachine.ts`,
  `backend/routes/scores.ts`.
- **Aceite (rascunho):** FASE TESTE tem um fim; resultado mostra estrelas; score por fase aparece no leaderboard da fase.

#### B-02 -- Checkpoints e retry sem game over nas fases
- **Prioridade:** P1 | **Esforco:** S/M | **Status:** idea | **Feature candidata:** F34 (junto com B-01)
- **Referencias:** Mario Maker 2 (checkpoint flag), DKC (porquinho de checkpoint), Crash 4 modo moderno e Rayman Legends (sem vidas), Celeste
- **Ideia:** entidade `checkpoint` (casinha da Mel). Ao morrer numa fase, respawn no ultimo checkpoint
  com 3 coracoes e contador de mortes +1; game over continua existindo so no modo infinito.
  Variante de risco/recompensa (Shovel Knight): quebrar o checkpoint com a Bola solta moedas, mas ele deixa de valer.
- **Toca em:** `Mel.tsx` (queda/respawn hoje volta para y=8 na mesma posicao), `useGameState.ts` (`loseLife` vai para gameover), `LevelData`, editor.

#### B-03 -- Campanha "Mundo 1": 8-10 fases autorais + mapa de mundo + fase 1-1 tutorial
- **Prioridade:** P2 | **Esforco:** L | **Status:** idea | **Feature candidata:** F42
- **Referencias:** Mario Maker 2 Story Mode (100+ fases feitas pela Nintendo), Mario Wonder e DKC (mapa de mundo), Rayman Legends (galeria)
- **Ideia:** fases feitas **no proprio editor** (dogfooding) e salvas como JSON em `public/levels/`
  no formato do `LevelData` v2; mapa simples com nos que desbloqueiam em sequencia; a 1-1 ensina
  cada controle com placas (B-10) antes de exigir. Temas: quintal, parque, praia (ocean), noite, espaco.
- **Depende de:** B-01, B-02, B-06, B-27.
- **Toca em:** novo `LevelLoader`, nova `WorldMapScene`, `MenuScene3D.tsx`, `useGameState.ts`.

#### B-04 -- Missoes escondidas por fase (estilo Kirby)
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F41
- **Referencias:** Kirby Forgotten Land (5 missoes por fase, reveladas quando a fase e concluida sem cumprir), Mario Maker 2 (clear conditions), Crash 4 (gema por caixas)
- **Ideia:** 3 missoes por fase, ex.: "colete 30 moedas", "nao tome dano", "ache o ossinho escondido",
  "termine em menos de 60s", "quebre todos os blocos de madeira". Aparecem na tela de resultado
  e no level select; recompensa em moedas e progresso de 100%.
- **Toca em:** `LevelData.missions[]`, tracking de eventos em `GameScene3D.tsx` (moeda, dano, bloco destruido, tempo), `ResultScene`, progresso (B-27).

#### B-05 -- Colecionavel especial: 3 "ossinhos" por fase
- **Prioridade:** P2 | **Esforco:** S | **Status:** idea | **Feature candidata:** F42 (junto com B-03)
- **Referencias:** DKC (letras KONG, pecas de quebra-cabeca), Rayman (Teensies), Crash (gemas), Astro Bot (bots)
- **Ideia:** entidade `bone` escondida em lugares que exigem voo, cavar ou quebrar bloco. Contagem no mapa
  de mundo; desbloqueia cosmeticos (B-34) ou fases bonus.
- **Toca em:** `entities/Bone.tsx` (clone de `Coin.tsx`), `LevelData`, paleta do editor.

#### B-06 -- LevelData v2: formato de fase com entidades, versao e migracao
- **Prioridade:** P1 | **Esforco:** M | **Status:** idea | **Feature candidata:** F33 | **Tipo:** tech
- **Referencias:** Mario Maker 2 (course parts alem de blocos), LittleBigPlanet
- **Ideia:** hoje `LevelData = { grid, width, height, spawnPoint }`. v2 acrescenta `version`, `goal`,
  `checkpoints[]`, `entities[]` (coin, heart, bone, enemy, sign, spring, moving_platform...),
  `theme`, `zLayers` e `missions[]`. Migracao v1 -> v2 na leitura (defaults), sem migration SQL,
  porque `levels.data` e JSONB. Uma unica funcao "level -> objetos de cena" usada por FASE TESTE,
  editor, campanha e chunks prefab (B-23), no lugar de `TestLevelData` + `ChunkRenderer` separados.
- **Por que primeiro:** e pre-requisito de B-01, B-02, B-04, B-05, B-07, B-09, B-10, B-13 e B-23.
- **Toca em:** `shared/types.ts`, `backend/routes/levels.ts` (validacao do JSON), `EditorScene3D.tsx`,
  `EditorUI.tsx`, `ChunkRenderer.tsx`, `TestLevelData.ts`.

### Tema 2 -- Kit de elementos de fase e editor (Mario Maker / LBP)

#### B-07 -- Editor: colocar moedas, coracoes, item_blocks com conteudo, checkpoint, goal e spawn
- **Prioridade:** P1 | **Esforco:** M | **Status:** idea | **Feature candidata:** F33 (junto com B-06)
- **Referencias:** Mario Maker 2 (paleta de itens e inimigos, nao so blocos)
- **Ideia:** abas na paleta: Blocos | Itens | Inimigos (quando B-13 existir) | Especiais (spawn, checkpoint, goal, placa).
  Item_block com conteudo escolhido (moedas, coracao, power-up de B-18).
- **Toca em:** `EditorUI.tsx`, `EditorScene3D.tsx`, `EditorWrapper.tsx`, `LevelData` v2.

#### B-08 -- Editor QoL: desfazer/refazer, copiar/colar area, borracha em area, testar a partir do cursor, zoom
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea
- **Referencias:** Mario Maker 2 ("Undodog", testar a partir de qualquer ponto), LittleBigPlanet
- **Ideia:** pilha de undo (snapshots do grid), selecao retangular, "TESTAR daqui" que spawna a Mel
  onde o cursor esta (economiza minutos por fase ao balancear).
- **Toca em:** `EditorScene3D.tsx`, `EditorUI.tsx`.

#### B-09 -- Elementos novos de fase: mola, plataforma movel, gelo, nuvem, esteira, ponte que quebra, barril-canhao, espinhos, interruptor ON/OFF
- **Prioridade:** P2 | **Esforco:** L (cada elemento e S; fazer em lotes de 3) | **Status:** idea
- **Referencias:** Mario (mola, plataformas, gelo), DKC (barril-canhao), Mario Maker 2 (interruptor ON/OFF, custom scroll)
- **Ideia:** cada elemento vira uma entidade com propriedade propria; comecar pelo lote que mais muda o level design: mola, plataforma movel e espinhos.
- **Toca em:** novas entities, `Block.tsx` (variantes), `BLOCK_PROPERTIES`, paleta do editor.

#### B-10 -- Placas de tutorial (sign) com icones dos controles
- **Prioridade:** P2 | **Esforco:** S | **Status:** idea | **Feature candidata:** F42 (junto com B-03)
- **Referencias:** Mario Maker 2 Story Mode, Celeste (passarinho que ensina)
- **Ideia:** entidade `sign` com texto curto e/ou icone (usa `ui_icon_ability_paw.png` e os icones de controle);
  mostra balao quando a Mel chega perto. Tambem serve para "dica do criador" nas fases da comunidade.
- **Toca em:** nova `entities/Sign.tsx`, `LevelData` v2, editor.

#### B-11 -- Tilesets por tema (gelo/neve, arenito, nuvem, lua)
- **Prioridade:** P3 | **Esforco:** M | **Status:** idea
- **Referencias:** Mario Maker 2 (themes trocam o tileset), Mario Wonder
- **Ideia:** o tema da fase troca textura e propriedade de alguns blocos (gelo escorrega, nuvem some).
- **Toca em:** `BlockTextures3D.ts`, `BLOCK_PROPERTIES`, `Skybox.tsx`, `Lighting.tsx`.

#### B-12 -- Autoscroll opcional por fase ("modo flappy" legado)
- **Prioridade:** P3 | **Esforco:** S | **Status:** idea
- **Referencias:** Mario Maker 2 (custom scroll), o Super Mel original (flappy bird)
- **Ideia:** flag `autoscroll` na fase: a camera anda sozinha e a Mel precisa voar (reaproveita o voo de F25/F31).
  Recupera o espirito da versao 1 do jogo como um tipo de fase, nao como o jogo inteiro.
- **Toca em:** `CameraRig.tsx`, `Mel.tsx` (morte ao ficar para tras), `LevelData` v2.

### Tema 3 -- Inimigos e chefes

#### B-13 -- Inimigos v1 (3 tipos) + pisao
- **Prioridade:** P1 | **Esforco:** L | **Status:** idea | **Feature candidata:** F39
- **Referencias:** Mario (Goomba patrulha, Paratroopa em onda), DKC, Kirby (inimigos simples e legiveis)
- **Ideia (tema de cachorro):** **Aspirador-robo** (patrulha a plataforma, vira na borda),
  **Pombo** (voa em senoide), **Abelha** (persegue devagar dentro de um raio).
  Derrotados com pisao por cima (bounce) ou com a Bola do Infinito; contato lateral = dano.
  Kid-friendly: inimigo "levanta voo"/foge com estrelinhas em vez de morrer. Dropam moedas.
  No modo infinito, entram na curva de dificuldade do `ChunkGenerator`.
- **Toca em:** `entities/Enemy*.tsx`, `ChunkGenerator.ts` (spawn por dificuldade), `LevelData` v2,
  `Mel.tsx` (stomp bounce), `AnimationStateMachine.ts` (hurt ja existe), `ProjectileManager.tsx` (colisao bola x inimigo).
- **Aceite (rascunho):** 3 inimigos jogaveis no infinito e na FASE TESTE; pisao funciona; sem queda de FPS com 10 inimigos na tela.

#### B-14 -- Latido: acao nao-letal que faz o mundo reagir
- **Prioridade:** P2 | **Esforco:** S | **Status:** idea | **Feature candidata:** F45 (junto com B-20)
- **Referencias:** Untitled Goose Game (honk), o proprio sprite `bark_wave` que ja existe como efeito
- **Ideia:** tecla X / botao C = latir: inimigos num raio param ou fogem por 1,5s, item_blocks
  proximos tremem mostrando que tem conteudo, o dono responde. Cooldown curto. E o verbo mais
  "cachorro" do jogo e o mais barato de fazer.
- **Toca em:** `useControls.ts`, `Mel.tsx`, `EffectManager.tsx` (bark wave), IA dos inimigos (B-13).

#### B-15 -- Chefes por mundo (padrao classico de 3 golpes)
- **Prioridade:** P3 | **Esforco:** L | **Status:** idea
- **Referencias:** Mario (Bowser Jr., 3 hits), DKC, Kirby
- **Ideia:** "Aspirador Gigante" e "Pombo Rei": padrao de ataque legivel, expoe o ponto fraco por alguns
  segundos, 3 acertos da Bola. Desbloqueia um poder elemental (B-19) ao ser vencido.
- **Depende de:** B-13, B-03.

#### B-16 -- Perigos ambientais por tema: cacto (deserto), morcego (noite), peixe-pulador (oceano), asteroide (espaco)
- **Prioridade:** P3 | **Esforco:** M | **Status:** idea
- **Referencias:** Mario (Cheep Cheep, Pokey), Mario Maker 2 (themes)
- **Depende de:** B-13, B-11.

### Tema 4 -- Poderes, upgrades e economia de moedas

#### B-17 -- Loja da Mel: upgrades permanentes comprados com moedas (gadgets)
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F40
- **Referencias:** Jetpack Joyride (15 gadgets de 2k a 6,5k moedas, **2 equipados por vez**: Coin Magnet, Air Barrys, Gravity Belt...), Subway Surfers (upgrade de power-up), Mario Wonder (badges: 1 equipado)
- **Ideia:** tela LOJA no menu usando `totalCoins` (ja persistido). Catalogo inicial: 4o coracao,
  voo 5s -> 8s, ima de moedas, Bola dupla, pulo duplo, capa turbo (velocidade), "queda leve" (paraquedas).
  2 slots de equipamento como no Jetpack, para a crianca fazer combinacoes.
- **Pre-requisito:** B-42 (constantes centralizadas) e B-27 (progresso no backend).
- **Toca em:** `useGameState.ts` (upgrades), nova `ShopScene`, `Mel.tsx`/`Projectile.tsx` (ler upgrades), `HUD3D.tsx` (icones equipados).

#### B-18 -- Power-ups temporarios saindo de item_blocks (alem de moedas)
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F40 (junto com B-17)
- **Referencias:** Mario (cogumelo/flor/estrela), Crash 4 (mascaras temporarias), DK Bananza (transformacoes com tempo), Jetpack (veiculos)
- **Ideia:** item_block sorteia entre: coracao, **estrela** (invencivel 8s -- a flag `invincible` ja existe),
  ima de moedas, **Bola de Fogo** (projetil que atravessa blocos), **Asas** (voo ilimitado por 10s).
  Timer do power-up no HUD; SFX proprio.
- **Toca em:** sistema de drop de F28 (`ChunkRenderer.onBlockDestroyed`), metadata do item_block, `HUD3D.tsx`, `Mel.tsx`.

#### B-19 -- Poderes elementais da Bola do Infinito (Agua / Fogo / Gelo / Luz / Infinito)
- **Prioridade:** P2/P3 | **Esforco:** L | **Status:** idea (ja previsto no PRD-001)
- **Referencias:** Kaze and the Wild Masks (mascaras = poderes de animais), Kirby (copy abilities), Mega Man (arma por chefe)
- **Ideia:** desbloqueio por chefe (B-15) ou por missoes; troca com teclas 1-5 (icone `ui_icon_ability.png` ja existe).
  Interacoes com blocos: agua apaga lava (vira pedra), fogo queima madeira e folha, gelo congela agua
  (vira plataforma), luz revela blocos invisiveis. `PowerType` ja existe em `shared/types.ts`.
- **Toca em:** `Projectile.tsx`, `ProjectileManager.tsx`, interacoes em `Block.tsx`/`ChunkRenderer.tsx`, `HUD3D.tsx`.

#### B-20 -- Movimentos de cachorro: Cavar, Buscar e Farejar
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F45
- **Referencias:** DK Bananza (destruir o terreno e o verbo central), Minecraft/Terraria (minerar), Okami (habilidades tematicas do animal)
- **Ideia:**
  - **Cavar:** agachar + ataque em `dirt`/`sand` remove o bloco de baixo -> areas subterraneas com ossos (B-05) e moedas.
  - **Buscar:** a Bola volta como bumerangue e coleta moedas no caminho (hoje some depois de 10 blocos); upgrade na Loja.
  - **Farejar:** segurar pra baixo parado por 1s destaca item_blocks e ossos num raio (o "Poder de Luz" do PRD em versao cachorro).
- **Por que:** sao os diferenciais do Super Mel em relacao a qualquer clone de Mario -- a fantasia da Mel em verbos.
- **Toca em:** `Mel.tsx`, `Projectile.tsx` (retorno), `ChunkRenderer.tsx` (remover bloco), `BLOCK_PROPERTIES` (flag `diggable`), sprites novos (`dig`).

### Tema 5 -- Modo infinito (endless) e retencao

#### B-21 -- Desafio do Dia: seed diaria + leaderboard do dia
- **Prioridade:** P1 | **Esforco:** S | **Status:** idea | **Feature candidata:** F36
- **Referencias:** Spelunky (daily challenge com seed, 1 tentativa), Rayman Legends (desafios diarios/semanais), Alto's Odyssey e Subway Surfers (daily)
- **Ideia:** `generateChunk` ja e deterministico (`seededRandom(chunkIndex * 7919 + 31)`); basta somar
  um seed base derivado de `YYYYMMDD`. Botao "DESAFIO DO DIA" no menu, 1 tentativa por dia por jogador,
  score gravado com `mode: "daily"` + data, leaderboard filtrado por dia. E o item mais barato com maior
  ganho de retencao do backlog.
- **Toca em:** `ChunkGenerator.ts` (parametro seed), `useGameState.ts`, `backend/prisma/schema.prisma` + `routes/scores.ts` (campos `mode` e `seed`, migration), `LeaderboardView.tsx`.

#### B-22 -- Missoes do modo infinito (3 ativas por vez) + nivel da Mel
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F41 (junto com B-04)
- **Referencias:** Jetpack Joyride (missoes de 3 em 3 dao estrelas e sobem o nivel), Alto's Odyssey (3 metas), Subway Surfers
- **Ideia:** "voe 5s sem tocar o chao", "quebre 20 blocos numa corrida", "colete 50 moedas", "chegue a 300m sem dano",
  "pise em 5 aspiradores". Recompensa em moedas; barra de nivel da Mel no menu.
- **Toca em:** novo `MissionSystem` alimentado por eventos (bloco destruido, moeda, distancia, tempo de voo, dano), toast no `HUD3D.tsx`, progresso (B-27).

#### B-23 -- Biomas por distancia + chunks prefab feitos no editor
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F44
- **Referencias:** Subway Surfers (cidades), Alto's Odyssey (biomas), Spelunky (salas-template + procedural), Jetpack (segmentos feitos a mao)
- **Ideia:** a cada N chunks o tema muda (forest -> desert -> night -> space -> ocean) com transicao de skybox
  e luz; biblioteca de chunks prefab desenhados no editor (formato v2) sorteados por faixa de dificuldade
  e misturados com o procedural. A FASE TESTE vira o primeiro prefab.
- **Toca em:** `ChunkGenerator.ts` (pool de prefabs + tema por faixa), `Skybox.tsx`, `Lighting.tsx`, `BackgroundDecor.tsx`, `LevelData` v2.

#### B-24 -- Conquistas + "Caderno da Mel" (registro do que foi descoberto)
- **Prioridade:** P3 | **Esforco:** S/M | **Status:** idea
- **Referencias:** Rayman Legends (Awesomeness), Kirby, Yoshi and the Mysterious Book (livro que registra criaturas e comportamentos)
- **Ideia:** 20 conquistas simples com icone e um caderno com os blocos, inimigos e poderes ja encontrados
  (crianca adora colecao). Vive no perfil do jogador.
- **Toca em:** progresso (B-27), nova `ProfileScene`.

#### B-25 -- Contra-relogio por fase + fantasma (ghost)
- **Prioridade:** P3 | **Esforco:** M | **Status:** idea
- **Referencias:** Mario Maker 2 (world record, Ninji Speedruns), Crash 4 (reliquias por tempo), Mario Kart (ghost)
- **Ideia:** gravar posicao/animacao a 20Hz durante a fase; reproduzir o melhor tempo como Mel translucida.
  Custo baixo de rede (so o proprio ghost, local) e alto de diversao ("vence o seu eu de ontem").
- **Depende de:** B-01.

### Tema 6 -- Comunidade, compartilhamento e seguranca (Mario Maker 2 / LBP)

#### B-26 -- Clear check + codigo da fase + estatisticas (jogadas, clears, taxa)
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F43
- **Referencias:** Mario Maker 2 (o criador precisa zerar a propria fase antes de publicar; course ID; taxa de clear; world record; first clear)
- **Ideia:** "SALVAR/publicar" so libera depois de o criador chegar ao goal (B-01) no TESTAR; codigo curto
  compartilhavel (6 caracteres) para jogar a fase do amigo sem procurar; registrar tentativa/clear por jogador;
  taxa de clear vira etiqueta automatica de dificuldade (Facil / Normal / Dificil / Extremo) no level select,
  com ordenacao por "novas" e "mais jogadas".
- **Toca em:** `backend/prisma/schema.prisma` (campos `code`, `plays`, `clears`, `bestTime`; tabela `level_attempts`),
  `routes/levels.ts`, `EditorUI.tsx`, `LevelSelectScene3D.tsx`.

#### B-27 -- Progresso salvo no backend + migracao visitante -> conta
- **Prioridade:** P1 | **Esforco:** M | **Status:** idea | **Feature candidata:** F37 | **Tipo:** tech
- **Referencias:** padrao de qualquer jogo com conta
- **Ideia:** hoje moedas ficam em `localStorage` e o backend so guarda score e fase. Criar `progress` por
  jogador: fases zeradas, estrelas, missoes, upgrades, ossos, conquistas. Visitante continua local; ao
  criar conta, faz merge (soma moedas, uniao de fases). Sem isso, B-03, B-04, B-17 e B-24 ficam presos ao navegador.
- **Toca em:** `schema.prisma`, nova `routes/progress.ts`, `useGameState.ts` (sync com debounce), `AuthScreen.tsx`.

#### B-28 -- Comunidade kid-safe: curtidas + carimbos (sem texto livre), denunciar, filtro de nomes e "Modo Familia"
- **Prioridade:** P1/P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F43 (junto com B-26)
- **Referencias:** Mario Maker 2 (like/boo + 12 carimbos, comentarios), LittleBigPlanet (hearts, stickers), PAW Patrol (zero texto da comunidade)
- **Ideia:** o jogo e publico no Render e o publico e crianca. Reacoes so por carimbo (patinha, coracao,
  osso, estrela), nome de fase com filtro de palavras, botao "denunciar" e um **Modo Familia** (padrao ON
  para visitante) que so mostra fases de criadores aprovados (allowlist) -- ou fases acessadas por codigo (B-26).
- **Por que P1/P2:** e um risco real assim que alguem de fora publicar uma fase; decidir a regra antes de divulgar o link.
- **Toca em:** backend (`reactions`, `reports`, `allowlist`), `LevelSelectScene3D.tsx`, `EditorUI.tsx` (nome), `AuthScreen.tsx`.

#### B-29 -- Maratona: sequencia de fases da comunidade por dificuldade (Endless Challenge)
- **Prioridade:** P3 | **Esforco:** M | **Status:** idea
- **Referencias:** Mario Maker 2 Endless Challenge (fases aleatorias com vidas por dificuldade: 5 / 5 / 15 / 30)
- **Ideia:** modo MARATONA: fases publicadas sorteadas por faixa de clear rate, N vidas, score = fases zeradas.
- **Depende de:** B-26.

#### B-30 -- Fases da semana / destaque do criador
- **Prioridade:** P3 | **Esforco:** S | **Status:** idea
- **Referencias:** Mario Maker 2 (populares / em alta), LittleBigPlanet (Team Picks)
- **Ideia:** aba "Destaques" curada manualmente (campo `featured` na fase) -- o Didio e o curador.

### Tema 7 -- Juice, apresentacao e audio

#### B-31 -- Game feel pass (shake, hit-stop, popups, pitch, camera lookahead)
- **Prioridade:** P2 | **Esforco:** S | **Status:** idea | **Feature candidata:** F38 (junto com B-32)
- **Referencias:** Mario (bloco "pula" ao ser batido, som de moeda), DKC (screen shake), Celeste (hit-stop, squash & stretch), Astro Bot (feedback em tudo)
- **Ideia:** shake curto ao quebrar bloco/tomar dano, hit-stop de ~40ms no pisao, "+1" flutuando ao pegar moeda,
  pitch aleatorio (+-10%) nos SFX repetidos, item_block com animacao de "bump", camera olhando um pouco a frente
  na direcao que a Mel encara.
- **Toca em:** `CameraRig.tsx`, `EffectManager.tsx`, `AudioManager3D.ts`, `Coin.tsx`, `Block.tsx`.

#### B-32 -- Idle e easter eggs com os sprites que ja existem
- **Prioridade:** P1 | **Esforco:** S | **Status:** idea | **Feature candidata:** F38
- **Referencias:** Sonic (idle impaciente), Mario 64 (dorme), Kirby
- **Ideia:** `sit.png`, `lie_down.png`, `wait.png` e `affection.png` estao sem uso (auditoria da F29).
  Parada > 5s senta, > 12s deita e dorme (zzz), pegar coracao toca `affection`, `wait` ao olhar pra cima por
  muito tempo. `jump_on_owner.png` fica reservado para o goal (B-01). `idleTime` ja e calculado em `Mel.tsx`.
- **Por que P1:** custo minimo, e o tipo de detalhe que faz crianca rir e mostrar o jogo para os outros.
- **Toca em:** `AnimationStateMachine.ts`, `SpriteAnimator.ts`.

#### B-33 -- Musica por tema + camadas dinamicas + uma fase musical
- **Prioridade:** P3 | **Esforco:** M | **Status:** idea
- **Referencias:** Mario Wonder (camadas que entram com a acao), Rayman Legends (fases musicais)
- **Ideia:** 1 faixa por tema (5), camada extra ao voar ou ficar invencivel; uma fase especial onde blocos e
  moedas aparecem no ritmo. Aproveitar o material que ja esta em `superMelAudio/`.
- **Toca em:** `AudioManager3D.ts`, assets de audio.

#### B-34 -- Cosmeticos: cores de capa e acessorios da Mel
- **Prioridade:** P3 | **Esforco:** L (XL se exigir redesenhar sprites) | **Status:** idea
- **Referencias:** Subway Surfers / Fall Guys / Sackboy (skins), LittleBigPlanet (fantasias)
- **Ideia:** cor da capa por tint numa mascara (exige separar a capa nos sprites, que hoje sao PNGs chapados)
  ou acessorios (oculos, chapeu) ancorados por frame via `manifest.json`. Comprados na Loja (B-17) ou
  desbloqueados por ossos (B-05).
- **Toca em:** sprites, `manifest.json`, `SpriteAnimator.ts`, `Mel.tsx`.

#### B-35 -- "Galeria do Rafa": blocos, placas e inimigos com desenhos importados
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Feature candidata:** F46
- **Referencias:** Drawn to Life (a crianca desenha o heroi e os itens), LittleBigPlanet (stickers de foto); a moeda do jogo ja e um desenho do Rafa (F24/F28)
- **Ideia:** no editor, "bloco personalizado" e "placa com desenho": upload de PNG/JPG, redimensionado para 64x64
  e pixelado no cliente; guardado no backend (decidir: disco do Render, S3 ou base64 dentro da fase se for pequeno).
  Kid-safe: upload so para conta logada e imagens privadas por padrao (aparecem so nas fases do proprio criador
  ate serem aprovadas).
- **Toca em:** backend (armazenamento de assets), `EditorUI.tsx`, `BlockTextures3D.ts` (texturas dinamicas), `Sign.tsx` (B-10).

### Tema 8 -- Acessibilidade, controles e plataformas

#### B-36 -- Suporte a gamepad (Gamepad API)
- **Prioridade:** P1 | **Esforco:** S | **Status:** idea | **Feature candidata:** F35
- **Referencias:** todo platformer de console; o controle e o jeito natural de crianca jogar na TV
- **Ideia:** D-pad/analogico = andar, A = pular/voar, X = atacar, Y = latir (B-14), Start = pausa (B-38);
  polling no `useFrame`, hot-plug, dica de controles no HUD muda conforme o ultimo input usado
  (teclado / touch / gamepad), touch controls escondidos quando ha gamepad.
- **Toca em:** `useControls.ts`, `HUD3D.tsx`, `TouchControls3D.tsx`.

#### B-37 -- Modo Assistido (estilo Celeste)
- **Prioridade:** P1 | **Esforco:** S/M | **Status:** idea | **Feature candidata:** F35 (junto com B-36 e B-38)
- **Referencias:** Celeste Assist Mode (velocidade do jogo, invencibilidade, stamina infinita, dashes extras, pular capitulo; texto sem julgamento: "cada jogador e diferente"), DKC Tropical Freeze Funky Mode (5 coracoes, pulo duplo), Mario Wonder (Yoshi/Nabbit nao tomam dano), Kirby
- **Ideia:** em Opcoes: invencivel, voo ilimitado, 5 coracoes, velocidade do jogo 70% / 85% / 100%, pular fase.
  Persistido por jogador. Texto acolhedor no estilo Celeste. Nao bloqueia conquistas nem estrelas (como Celeste).
- **Pre-requisito:** B-42 (constantes centralizadas).
- **Toca em:** `useGameState.ts` (settings), `Mel.tsx`, `GameScene3D.tsx` (time scale: `delta` do `useFrame` e timestep do Rapier).

#### B-38 -- Pausa + Opcoes + "Como jogar"
- **Prioridade:** P1 | **Esforco:** S | **Status:** idea | **Feature candidata:** F35
- **Referencias:** padrao de mercado
- **Ideia:** `paused` ja existe em `useGameState` mas nao ha menu. Tela de pausa (Esc / Start): continuar,
  reiniciar, voltar ao menu, volume e mute (F10), Modo Assistido (B-37). Tela "Como jogar" com os controles
  ilustrados usando os icones de UI que ja existem.
- **Toca em:** nova `PauseOverlay`, `useControls.ts`, `AudioManager3D.ts`, `MenuScene3D.tsx`.

#### B-39 -- Mobile: PWA instalavel, offline no modo infinito, vibracao e landscape
- **Prioridade:** P2 | **Esforco:** S/M | **Status:** idea
- **Referencias:** Subway Surfers / Jetpack (mobile-first)
- **Ideia:** `vite-plugin-pwa` (dependencia nova -> pede confirmacao, regra do CLAUDE.md), manifest com icone da Mel,
  service worker cacheando sprites/audio para o infinito funcionar sem rede; `navigator.vibrate` ao tomar dano;
  travar em landscape quando possivel.
- **Toca em:** `vite.config.ts`, `index.html`, `TouchControls3D.tsx`.

#### B-40 -- Co-op local: Mel + Robo
- **Prioridade:** P3 | **Esforco:** XL | **Status:** idea
- **Referencias:** Sonic Superstars e Nikoderiko (co-op local), Sackboy e Rayman Legends (co-op de familia), Mega Man (Rush: o cao-robo que vira mola e jato), PAW Patrol (co-op para criancas pequenas)
- **Ideia:** o Robo ja e citado como personagem futuro em F24. Habilidades complementares: Robo nao voa, mas empurra
  blocos e vira plataforma-mola para a Mel (Rush Coil). 2 gamepads ou teclado dividido; camera com 2 alvos;
  jogador 2 pode entrar/sair a qualquer momento (drop-in), sem punicao quando morre (volta em bolha, como Rayman).
- **Depende de:** B-36, sprites do Robo, `CameraRig.tsx` multi-alvo.

### Tema 9 -- Tech, dados e processo

#### B-41 -- Telemetria de mortes -> marcas "X" no editor e heatmap por fase
- **Prioridade:** P2 | **Esforco:** S/M | **Status:** idea
- **Referencias:** Mario Maker (marcas X mostrando onde outros jogadores morreram)
- **Ideia:** ao morrer, enviar `(levelId, x, y, causa)`; o criador ve os pontos no editor e a campanha (B-03)
  e balanceada com dados de verdade, nao com achismo.
- **Toca em:** backend (tabela `deaths`), `Mel.tsx`/`GameScene3D.tsx` (evento), `EditorScene3D.tsx` (overlay).

#### B-42 -- Constantes de gameplay centralizadas em `GAME_CONFIG` + painel de tuning (dev)
- **Prioridade:** P2 (mas antes de B-17 e B-37) | **Esforco:** S | **Status:** idea | **Tipo:** tech
- **Ideia:** `Mel.tsx` duplica `MOVE_SPEED`, `JUMP_FORCE`, `FLY_*`, `MAX_FLY_TIME` etc. que ja existem (ou deveriam)
  em `GAME_CONFIG` de `shared/types.ts`. Centralizar e deixar upgrades (B-17) e Modo Assistido (B-37)
  sobrescreverem valores. Painel de tuning ao vivo so em dev (`leva` ou `tweakpane` = dependencia nova, confirmar).
- **Toca em:** `shared/types.ts`, `Mel.tsx`, `Projectile.tsx`.

#### B-43 -- Ritual de playtest com o publico-alvo
- **Prioridade:** P1 | **Esforco:** S | **Status:** idea | **Tipo:** processo
- **Referencias:** playtests kid-first da Nintendo e do Astro Bot
- **Ideia:** a cada feature de gameplay, 15 minutos de sessao observada com o Rafa (sem ajudar): anotar onde
  trava, o que ele tenta fazer e nao consegue, o que faz rir. Cada observacao vira um item aqui com a tag
  `playtest`. Encaixa na retrospectiva que o QA ja roda por feature.

#### B-44 -- Fechar o que sobrou do plano 3D (F22): InstancedMesh, LOD, bloom, quality auto-detect
- **Prioridade:** P2 | **Esforco:** M | **Status:** idea | **Tipo:** tech
- **Ideia:** `docs/prd/3d-rewrite-plan.md` previa em F22 InstancedMesh para blocos, frustum culling/LOD,
  sombras e bloom na Bola e na lava, e deteccao automatica de qualidade. F27 resolveu performance, mas
  vale conferir o que ficou de fora antes de B-13 (inimigos) e B-23 (biomas) aumentarem a carga.

---

## Roadmap sugerido

Ordem proposta pensando em dependencias e em "o que muda a experiencia mais rapido". Numeros F33+ sao sugestao.

**Ciclo 1 -- fase de verdade e base para o resto**

| Feature | Itens | Por que agora |
|---|---|---|
| F33 | B-06 + B-07 | LevelData v2 + editor com itens: destrava quase tudo |
| F34 | B-01 + B-02 | Fim de fase (dono), checkpoints, tela de resultado |
| F35 | B-36 + B-38 + B-37 | Gamepad, pausa/opcoes, Modo Assistido |
| F36 | B-21 | Desafio do Dia (1 wave, muito retorno) |
| F37 | B-27 | Progresso no backend |
| F38 | B-32 + B-31 | Idle com sprites que ja existem + game feel |
| processo | B-43 | Playtest com o Rafa a cada feature |

**Ciclo 2 -- conteudo e economia**

| Feature | Itens |
|---|---|
| F39 | B-13 (inimigos v1) |
| F40 | B-17 + B-18 (loja + power-ups) |
| F41 | B-04 + B-22 (missoes por fase e no infinito) |
| F42 | B-03 + B-05 + B-10 (campanha Mundo 1, ossinhos, placas) |
| F43 | B-26 + B-28 (clear check, codigo de fase, comunidade kid-safe) |
| F44 | B-23 (biomas + prefabs no infinito) |
| F45 | B-20 + B-14 (cavar, buscar, farejar, latir) |
| F46 | B-35 (Galeria do Rafa) |
| tech | B-42, B-44, B-41, B-39 encaixados onde couber |

**Ciclo 3 -- profundidade**

B-19 (elementais), B-15 (chefes), B-40 (co-op com o Robo), B-34 (cosmeticos), B-25 (ghost),
B-29 (maratona), B-33 (musica), B-08/B-09/B-11/B-12 (editor e elementos), B-16, B-24, B-30.

---

## Perguntas em aberto (decisoes do Didio antes de promover itens)

1. **Publico:** qual a idade de quem vai jogar mais? Define a dificuldade base e se o Modo Assistido (B-37) vem ligado por padrao.
2. **Comunidade aberta ou fechada?** Se o link for divulgado, B-28 sobe para P1 e o Modo Familia vira default.
   Se for so familia e amigos, B-26 (codigo de fase) resolve sem moderacao.
3. **Plataforma prioritaria:** PC com gamepad na TV ou celular? Muda a ordem de B-36 e B-39.
4. **Vidas:** confirmar a regra "sem vidas nas fases, com checkpoint; game over so no infinito" (B-02).
5. **Quem e o Robo?** Irmao robo, brinquedo, invencao do Rafa? Define B-40 e a narrativa (o agente `narrative-designer` do framework ja existe para isso).
6. **Armazenamento de imagens** para a Galeria do Rafa (B-35): disco do Render, S3 ou base64 na fase.

---

## Fontes consultadas

- [Super Mario Maker 2 -- Super Mario Wiki](https://www.mariowiki.com/Super_Mario_Maker_2) -- Course World, clear check, tags, Endless Challenge, Story Mode, clear conditions
- [Endless Challenge -- Super Mario Maker 2 Wiki](https://supermariomaker2.fandom.com/wiki/Endless_Challenge) -- vidas por dificuldade
- [Mission (Kirby and the Forgotten Land) -- WiKirby](https://wikirby.com/wiki/Mission_(Kirby_and_the_Forgotten_Land)) -- 5 missoes por fase, reveladas aos poucos
- [In-Depth: Jetpack Joyride Gadgets -- Halfbrick](https://www.halfbrick.com/blog/in-depth-jetpack-joyride-gadgets) -- 2 gadgets equipados, precos em moedas, 15 gadgets
- [Celeste Assist Mode -- Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/celeste-assist-mode/) -- opcoes e tom do texto
- [Yoshi and the Mysterious Book lands Switch 2 release date -- Nintendo Life](https://www.nintendolife.com/news/2026/03/yoshi-and-the-mysterious-book-lands-switch-2-release-date) -- 21/05/2026, mecanica do livro
- [Most anticipated platformers of 2026 -- Wccftech](https://wccftech.com/wccftechs-most-anticipated-platformers-of-2026-new-adventures-in-familiar-worlds/) -- panorama do mercado 2026
- [Donkey Kong Bananza review -- GamesRadar](https://www.gamesradar.com/games/donkey-kong/donkey-kong-bananza-review/) e [All Bananza Transformations -- Nintendo Life](https://www.nintendolife.com/guides/donkey-kong-bananza-all-bananza-transformations) -- destruicao como core, transformacoes temporarias
- [Rayman Legends Online Challenges -- RayWiki](https://raymanpc.com/wiki/en/Online_Challenges) -- desafios diarios/semanais
- [Analise: Kaze and the Wild Masks -- GameBlast](https://www.gameblast.com.br/2021/04/analise-kaze-and-the-wild-masks.html) -- platformer brasileiro com mascaras-poderes
- [PAW Patrol Mighty Pups Save Adventure Bay review -- TheSixthAxis](https://www.thesixthaxis.com/2020/11/26/paw-patrol-mighty-pups-save-adventure-bay-review/) -- jogo de cachorros herois para criancas pequenas
- [Nikoderiko: The Magical World -- Wikipedia](https://en.wikipedia.org/wiki/Nikoderiko:_The_Magical_World) -- 2.5D estilo DKC, 2024
