# Super Mel 3D — Plataforma Classico (estilo Mario)

## Mudanca de Design (pos-F18)

O jogo mudou de flappy bird para **platformer classico estilo Mario**:
- Player controla movimento (esquerda/direita + pulo)
- Sem auto-scroll — player explora livremente
- Chao e plataformas sao a base do gameplay
- Pulo com arco fisico, nao flap
- Bola do Infinito dispara na direcao que Mel olha

## Decisoes Arquiteturais

- **Engine:** React Three Fiber (R3F) + @react-three/drei + @react-three/rapier
- **Estetica:** Voxel Minecraft — cubos texturizados
- **Gameplay:** 2.5D platformer (Mel anda/pula em XY, profundidade Z visual)
- **Editor:** Grid com camadas de profundidade (Z layers)
- **Backend:** mantido intacto (auth, scores, levels)

## Controles

| Acao         | Desktop              | Mobile              |
|-------------|----------------------|---------------------|
| Andar esq   | A / ArrowLeft        | D-pad esquerda      |
| Andar dir   | D / ArrowRight       | D-pad direita       |
| Pular       | Space / W / ArrowUp  | Botao A             |
| Atirar      | Z / J                | Botao B             |

## Fisica do Platformer

- **Aceleracao:** player ganha velocidade ao andar, max speed ~6
- **Friccao:** desacelera ao soltar tecla
- **Pulo:** impulso vertical, gravidade puxa. Pode segurar pra pulo mais alto
- **Coyote time:** ~100ms de tolerancia apos sair de plataforma
- **Colisao:** Mel anda sobre blocos solidos, nao atravessa paredes
- **Direcao:** Mel vira pra esquerda/direita (flip no eixo X)

## Features Completas (F15–F18)

- [x] F15 — Setup R3F + Remover Phaser
- [x] F16 — Mel 3D + Voo (sera refatorado para platformer em F19)
- [x] F17 — Blocos 3D Minecraft + chunks
- [x] F18 — Bola do Infinito 3D

## Features Restantes (F19–F22)

### F19 — Refactor Platformer + HUD + Vida
**Wave 1:** Controles platformer
- Refatorar Mel.tsx: andar esq/dir com aceleracao, pulo com arc
- Refatorar useControls: left, right, jump, shoot
- Direcao (flip mesh), coyote time, variable jump height
- Camera com deadzone horizontal e vertical

**Wave 2:** HUD + Vida + Coleta
- HUD overlay: coracoes, score, direcao
- Heart.tsx: item coletavel (cubo ? que flutua e gira)
- Dano por lava/queda, invencibilidade apos dano
- Game over flow com submit score

**Wave 3:** Chunk generation platformer
- Refatorar ChunkGenerator para level design de plataforma
- Chao continuo com gaps, plataformas elevadas, escadinhas
- Dificuldade progressiva (gaps maiores, mais lava, menos chao)
- Projetil dispara na direcao que Mel olha (esq ou dir)

**Criterio de aceite:** Mel anda, pula, coleta itens, morre, jogo funciona como platformer.

---

### F20 — Cenarios 3D + Iluminacao
**Wave 1:** Skybox e temas
- 5 temas (forest, desert, night, space, ocean)
- Iluminacao por tema
- Fog de profundidade
- Lava emite luz

**Wave 2:** Decoracao e profundidade
- Camada Z de fundo: arvores, nuvens, montanhas voxel
- Parallax natural pela perspectiva 3D

**Criterio de aceite:** 5 temas visuais com atmosfera.

---

### F21 — Editor de Fases 3D
**Wave 1:** Grid e paleta
- Vista lateral (XY) com camadas Z
- Paleta de blocos, click/drag, borracha
- Spawn point do player

**Wave 2:** Funcionalidades
- Testar, salvar, carregar fases
- Trocar tema/background
- Level select com fases da comunidade

**Criterio de aceite:** Editor cria fases jogaveis com camadas Z.

---

### F22 — Polish + Mobile + Performance
**Wave 1:** Performance
- InstancedMesh para blocos
- Frustum culling, LOD

**Wave 2:** Visual
- Sombras, bloom na Bola e lava
- Transicoes entre telas

**Wave 3:** Mobile
- D-pad virtual + botoes A/B
- Canvas responsivo
- Quality auto-detect

**Criterio de aceite:** 60fps, sombras, mobile touch.

---

## GAME_CONFIG (atualizado para platformer)

```typescript
export const GAME_CONFIG = {
  // Physics
  gravity: 30,
  moveSpeed: 6,
  moveAccel: 25,
  friction: 12,
  jumpForce: 12,
  jumpHoldForce: 5,    // extra force while holding jump
  maxJumpHoldTime: 0.2, // seconds
  coyoteTime: 0.1,     // seconds after leaving ground

  // Combat
  projectileSpeed: 15,
  projectileCooldownMs: 300,

  // Life
  maxHearts: 3,
  startHearts: 3,
  invincibilityMs: 1500,

  // Chunks
  chunkWidth: 16,
  viewDistance: 4,
} as const;
```
