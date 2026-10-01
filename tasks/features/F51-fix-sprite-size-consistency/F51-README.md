# Feature F51 — Fix Sprite Size Consistency

**Status:** done
**Owner:** @architect
**PRD:** inline (bug fix)

## Goal

Corrigir o tamanho visual da Mel para que ela permaneca com um tamanho
consistente em **todas** as animacoes. Atualmente, quando Mel entra em
estados como `lie_down`, `crouch`, `death`, `hurt_heavy`, ou `attack_1`,
o sprite muda drasticamente de tamanho porque o sistema usa uma altura
fixa (`SPRITE_HEIGHT = 2`) e calcula a largura via aspect ratio. Sprites
com proporcoes muito diferentes do idle acabam aparecendo enormes ou
minusculos.

## Root Cause Analysis

### O problema

1. `Mel.tsx` define `SPRITE_HEIGHT = 2` como constante fixa
2. No `useFrame`, calcula `frameWidth = SPRITE_HEIGHT * ratio` onde
   `ratio = sourceSize[0] / sourceSize[1]` do manifest
3. Aplica `scale.set(frameWidth, SPRITE_HEIGHT, 1)` — mantendo Y=2 sempre

### Por que isso falha

Cada sprite da Mel tem dimensoes de pixel muito diferentes no manifest:

| Sprite       | Pixels (WxH) | Ratio | Rendered WxH | Problema |
|-------------|-------------|-------|-------------|----------|
| idle_right  | 101x138     | 0.73  | 1.46 x 2.0 | OK (referencia) |
| lie_down    | 130x68      | 1.91  | 3.82 x 2.0 | **2.6x mais larga, MEL GIGANTE** |
| death       | 201x77      | 2.61  | 5.22 x 2.0 | **3.6x mais larga** |
| hurt_heavy  | 124x54      | 2.30  | 4.59 x 2.0 | **3.1x mais larga** |
| attack_1    | 216x113     | 1.91  | 3.82 x 2.0 | **2.6x mais larga** |

O `lie_down` sprite tem 68px de altura vs 138px do idle — a Mel deitada
deveria ser MENOR verticalmente, mas o sistema fixa a altura em 2.0
para todos, fazendo o corpo render no mesmo tamanho vertical que quando
ela esta de pe.

### A solucao correta

Usar o `frameSize` do manifest (224x168 — a "bounding box" de referencia)
como normalizador. Cada sprite tem suas dimensoes reais dentro desse
bounding box. A escala correta e:

```
scaleX = SPRITE_HEIGHT * (sourceWidth / frameSize[1])
scaleY = SPRITE_HEIGHT * (sourceHeight / frameSize[1])
```

Isso normaliza pelo frameSize de referencia (168px de altura), mantendo
proporcoes corretas. Um sprite de 68px de altura vai renderizar com
`2.0 * (68/168) = 0.81` de altura em vez de 2.0.

Alem disso, sprites que nao existem fisicamente (`crouch.png`, `fly_1.png`,
`fly_2.png`, `look_up.png`) estao referenciados no `SpriteAnimator.ts` mas
faltam no diretorio — eles usam fallback para `idle_right`, o que tambem
causa inconsistencia visual.

### Sprites faltantes (referenciados mas nao existem)

- `crouch.png` — usado por animacoes `crouch` e `dig`
- `fly_1.png` — usado por animacao `fly`
- `fly_2.png` — usado por animacao `fly`
- `look_up.png` — usado por animacao `look_up`

Esses sprites fazem fallback para `idle_right` silenciosamente, o que e
funcional mas não ideal. A solucao deve tratar eles corretamente.

## Solution

### Task T01 — SpriteAnimator: expor escala normalizada por frame (nao apenas ratio)

Adicionar funcao `getFrameNormalizedScale(animName, elapsed)` que retorna
`{ scaleX: number, scaleY: number }` usando `frameSize` como referencia.
Garantir que sprites faltantes retornem a escala do fallback corretamente.
Adicionar entradas no manifest para sprites faltantes que reutilizam frames
existentes (crouch->sit, fly->jump_air, look_up->idle_right).

### Task T02 — Mel.tsx: usar escala normalizada e ajustar posicao Y do mesh

Substituir o calculo atual de `SPRITE_HEIGHT * ratio` pela nova funcao de
escala normalizada. Ajustar `position.y` do mesh sprite dinamicamente para
que os pes da Mel fiquem sempre ancorados no mesmo ponto (o collider bottom),
independente da altura do sprite.

### Task T03 — Manifest: mapear sprites faltantes e validar ancoras

Atualizar `manifest.json` para incluir entradas para sprites "virtuais" que
reutilizam frames existentes (crouch, fly_1, fly_2, look_up). Validar e
ajustar os anchor points para garantir alinhamento correto dos pes.
Criar script de validacao que compara sprites referenciados vs existentes.

### Task T04 — Testes visuais e regressao

Verificar que todas as transicoes de animacao manteem tamanho consistente.
Testar que o collider permanece correto. Verificar flip esquerda/direita.
Build completo sem erros.

## Architecture Impact

- `packages/frontend/src/game/systems/SpriteAnimator.ts` — nova funcao exportada
- `packages/frontend/src/game/entities/Mel.tsx` — logica de scale e position.y
- `packages/frontend/public/sprites/mel/manifest.json` — entradas para sprites virtuais
- Nenhum novo arquivo criado alem de documentacao

## Waves

- **Wave 0**: F51-T01 (SpriteAnimator) + F51-T03 (Manifest) — paralelos
  (T01 modifica SpriteAnimator.ts, T03 modifica manifest.json e cria script)
- **Wave 1**: F51-T02 (Mel.tsx) — depende de T01 (usa nova funcao exportada)
- **Wave 2**: F51-T04 (Testes) — depende de T02

## Global Acceptance Criteria

- [ ] Mel idle aparece com proporcoes corretas (~1.46 x 2.0 world units)
- [ ] Mel lie_down aparece MENOR que idle (mais baixa, mais larga proporcionalmente, mas nao gigante)
- [ ] Mel crouch, death, hurt_heavy respeitam proporcoes reais
- [ ] Transicoes entre estados nao causam "salto" brusco de tamanho
- [ ] Pes da Mel ficam ancorados no mesmo ponto em todas as animacoes
- [ ] Flip esquerda/direita continua funcionando
- [ ] Sprites faltantes (crouch, fly, look_up) renderizam corretamente via mapeamento
- [ ] Collider da Mel permanece consistente e correto
- [ ] Build sem erros, sem warnings novos no console
- [ ] Performance nao degradada (lookups sao O(1))

## Diagrams

- Nao requer novos diagramas (fix em rendering de sprites existentes)
- F23-architecture.mmd pode ser atualizado para refletir o fluxo de escala normalizada
