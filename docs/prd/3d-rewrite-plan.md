# Super Mel 3D — Plano de Rewrite

## Decisoes Arquiteturais

- **Engine:** React Three Fiber (R3F) + @react-three/drei + @react-three/rapier
- **Estetica:** Voxel Minecraft — cubos texturizados, low-poly
- **Gameplay:** 2.5D side-scrolling (Mel voa em XY, profundidade Z apenas visual)
- **Editor:** Grid com camadas de profundidade (Z layers)
- **Phaser 3:** removido completamente
- **Backend:** mantido intacto (auth, scores, levels)
- **React/Vite:** mantidos — R3F integra nativamente

## O que MANTEMOS

- packages/backend/ (intacto)
- packages/shared/ (intacto)
- packages/frontend/src/components/AuthScreen.tsx (intacto)
- packages/frontend/src/components/LeaderboardView.tsx (intacto)
- packages/frontend/src/config.ts (intacto)
- packages/frontend/src/App.tsx (adaptar — trocar GameView phaser por R3F canvas)
- packages/frontend/src/main.tsx (intacto)
- Vite config, proxy, build pipeline

## O que REMOVEMOS

- phaser (dependencia)
- packages/frontend/src/scenes/* (7 scenes Phaser)
- packages/frontend/src/systems/* (8 systems Phaser)
- packages/frontend/src/components/GameView.tsx (wrapper Phaser)

## O que CRIAMOS

Nova estrutura 3D dentro de packages/frontend/src/:

```
game/
  Game3D.tsx            — Canvas R3F + Physics world + camera rig
  scenes/
    MenuScene3D.tsx     — Menu principal (3D ou overlay HTML)
    GameScene3D.tsx     — Cena principal de jogo
    GameOverScene3D.tsx — Tela game over
    EditorScene3D.tsx   — Editor de fases com camadas Z
    LevelSelectScene3D.tsx — Selecao de fases
  entities/
    Mel.tsx             — Modelo voxel da Mel + fisica + controles
    Projectile.tsx      — Bola do Infinito (esfera luminosa)
    Heart.tsx           — Item de vida coletavel
    Block.tsx           — Cubo individual com textura
  systems/
    ChunkGenerator.ts   — Geracao procedural de chunks 3D
    BlockTextures3D.ts  — Texturas voxel para os 10+1 tipos de bloco
    CameraRig.tsx       — Camera lateral seguindo Mel no eixo X
    HUD3D.tsx           — Overlay HTML (vida, score, controles)
    AudioManager3D.ts   — Reutiliza logica do audio atual
    TouchControls3D.tsx — Controles mobile (mesmo conceito)
    Lighting.tsx        — Iluminacao (ambient + directional + point lights em lava)
    Skybox.tsx          — Skybox/environment por tema
  hooks/
    useGameState.ts     — Estado global do jogo (zustand ou context)
    useControls.ts      — Input teclado + touch unificado
  utils/
    voxelMesh.ts        — Helpers para criar geometria voxel
    blockTypes.ts       — Definicao dos 11 tipos de bloco (reuso do shared)
```

---

## Features (F15–F22)

### F15 — Setup R3F + Remover Phaser
**Wave 0:** Permissoes e setup
- Remover dependencia `phaser` do package.json
- Instalar: @react-three/fiber, @react-three/drei, @react-three/rapier, three, zustand
- Instalar devDeps: @types/three
- Deletar scenes/, systems/, components/GameView.tsx

**Wave 1:** Scaffold basico
- Criar Game3D.tsx com Canvas R3F + OrbitControls temporario
- Criar CameraRig.tsx (camera perspectiva lateral, posicao fixa no Z)
- Criar useGameState.ts (zustand: scene, score, lives, playing)
- Adaptar App.tsx para renderizar Game3D ao inves de GameView
- Cubo teste girando na tela para validar pipeline

**Criterio de aceite:** App renderiza canvas 3D com cubo teste, sem erros.

---

### F16 — Mel 3D + Voo
**Wave 1:** Modelo e fisica
- Criar Mel.tsx: modelo voxel procedural (corpo yorkshire simplificado com BoxGeometry compostas)
- Integrar RigidBody do Rapier (dynamic, gravity Y, locked rotation Z)
- Movimento: impulso pra cima (Space/Up/Touch), gravidade puxa pra baixo
- Tilt visual baseado em velocidade Y (nariz pra cima/baixo)

**Wave 2:** Camera e controles
- CameraRig segue Mel no eixo X com lerp suave
- useControls.ts: teclado (Space, ArrowUp, Z) + touch
- Invencibilidade temporaria apos dano (pisca mesh)
- Animacao idle (respiracao sutil — scale oscillation)

**Criterio de aceite:** Mel voa, cai com gravidade, camera acompanha lateralmente.

---

### F17 — Blocos 3D Minecraft
**Wave 1:** Sistema de blocos
- Block.tsx: cubo unitario com textura por tipo (InstancedMesh para performance)
- BlockTextures3D.ts: texturas procedurais (canvas 2D → texture) para os 11 tipos
- Propriedades por tipo: solido, destrutivel, dano, coletavel (mesmo do 2D)

**Wave 2:** Chunk generation
- ChunkGenerator.ts: gera colunas de blocos no eixo X (mesma logica, adaptada pra 3D)
- Blocos posicionados em grid XY, com profundidade visual Z (camada de fundo decorativa)
- Reciclagem de chunks fora da camera
- Colisao Rapier: cuboid colliders nos blocos solidos

**Wave 3:** Destruicao
- Blocos destrutiveis (madeira, vidro, folha, areia) quebram com particulas 3D
- Particulas: cubinhos pequenos com physics (RigidBody temporario ou instanced)
- Lava e agua: efeito visual diferenciado (emissive, transparencia)

**Criterio de aceite:** Mundo gera blocos infinitos, Mel colide, blocos destrutiveis quebram com particulas.

---

### F18 — Bola do Infinito 3D
**Wave 1:** Projetil
- Projectile.tsx: esfera luminosa (emissive material + point light sutil)
- Disparo com Z/touch: cria projetil na posicao da Mel, viaja no +X
- Colisao Rapier com blocos: trigger destroy no bloco + remove projetil
- Cooldown entre disparos

**Wave 2:** Efeitos
- Trail effect (particulas ou ribbon geometry atras da bola)
- Flash de luz na explosao do bloco
- SFX integrado (reuso AudioManager)

**Criterio de aceite:** Mel dispara bola luminosa, destroi blocos, efeitos visuais e sonoros.

---

### F19 — HUD + Sistema de Vida
**Wave 1:** HUD overlay
- HUD3D.tsx: overlay HTML sobre o canvas (Html do drei ou div absoluto)
- 3 coracoes (SVG ou emoji), score (distancia), botao mute
- Dano: colisao com lava/blocos solidos reduz vida, flash vermelho na tela
- Heart.tsx: item coletavel flutuando (cubo com ? ou coracao 3D low-poly)

**Wave 2:** Game over e fluxo
- 0 vidas → GameOverScene3D (score final, botao replay, submit score)
- Integracao com API /scores (post score, get leaderboard)

**Criterio de aceite:** Vida funciona, HUD mostra coracoes/score, game over submete pontuacao.

---

### F20 — Cenarios 3D + Iluminacao
**Wave 1:** Skybox e temas
- Skybox.tsx: 5 temas (forest, desert, snow, nether, sky) com gradient ou cubemap procedural
- Lighting.tsx: DirectionalLight (sol) + AmbientLight + HemisphereLight
- Lava blocks emitem PointLight laranja
- Fog por tema (longe = fade para cor do skybox)

**Wave 2:** Decoracao e profundidade
- Camada Z de fundo: blocos decorativos (mais escuros/desfocados) atras do gameplay
- Nuvens 3D simples (box groups) flutuando no fundo
- Arvores/cogumelos voxel decorativos nas bordas

**Criterio de aceite:** 5 temas visuais distintos com iluminacao, profundidade e atmosfera.

---

### F21 — Editor de Fases 3D
**Wave 1:** Grid e paleta
- EditorScene3D.tsx: vista lateral do grid (XY) com controle de camada Z
- Paleta de blocos (HTML overlay lateral)
- Click/drag no grid posiciona blocos na camada Z ativa
- Botoes Z+/Z- para trocar camada (com indicador visual de qual camada esta ativa)
- Camadas Z de fundo aparecem semi-transparentes

**Wave 2:** Funcionalidades
- Borracha (remover blocos)
- Trocar background/tema
- Botao Testar: inicia GameScene3D com dados do editor
- Botao Salvar: POST /api/levels com dados (inclui info de camadas Z)
- Botao Carregar: GET /api/levels para listar fases

**Criterio de aceite:** Editor permite criar fases com multiplas camadas Z, testar e salvar.

---

### F22 — Polish 3D + Mobile + Performance
**Wave 1:** Performance
- InstancedMesh para todos os blocos (batch rendering)
- Frustum culling (chunks fora da camera nao renderizam)
- LOD: blocos distantes usam geometria simplificada
- Target: 60fps em mobile medio

**Wave 2:** Visual polish
- Sombras (shadow map na DirectionalLight, blocos recebem/projetam)
- Post-processing leve: bloom na Bola do Infinito e lava (EffectComposer do drei)
- Transicoes entre telas (fade)

**Wave 3:** Mobile e responsivo
- TouchControls3D.tsx: botao voar (esquerda) + botao atirar (direita)
- Canvas responsivo (resize handler)
- Ajuste de qualidade automatico (detect mobile → disable shadows, reduce draw distance)

**Criterio de aceite:** 60fps desktop/mobile, sombras, bloom, touch controls funcionando.

---

## Dependencias Novas

```json
{
  "@react-three/fiber": "^9",
  "@react-three/drei": "^10",
  "@react-three/rapier": "^2",
  "@react-three/postprocessing": "^3",
  "three": "^0.170",
  "zustand": "^5",
  "@types/three": "^0.170"
}
```

## Ordem de Execucao

F15 → F16 → F17 → F18 → F19 → F20 → F21 → F22

Cada feature depende da anterior. Total: 8 features, ~15 waves.
