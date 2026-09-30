# Feature F33 — Fix Sprite Proportions

**Status:** planned
**Owner:** @architect
**PRD:** inline (bug fix, sem PRD separado)

## Goal

Corrigir a proporcao dos sprites da Mel. O codigo atual usa um aspect ratio fixo
(`SPRITE_RATIO = 224/168 = 1.333`) para TODOS os sprites, mas cada sprite tem
dimensoes reais diferentes no manifest.json. Isso causa distorcao visivel
especialmente no idle, onde o sprite de 101x138 (ratio 0.732) e esticado
horizontalmente em ~82%.

## Root Cause

1. `Mel.tsx:22-25` define constantes fixas:
   ```ts
   const SPRITE_RATIO = 224 / 168;   // 1.333
   const SPRITE_HEIGHT = 2;
   const SPRITE_WIDTH = SPRITE_HEIGHT * SPRITE_RATIO; // ~2.67
   ```

2. `Mel.tsx:278` aplica esse scale fixo ao mesh:
   ```tsx
   <mesh ... scale={[SPRITE_WIDTH, SPRITE_HEIGHT, 1]}>
   ```

3. `Mel.tsx:247` aplica o mesmo width fixo no flip:
   ```ts
   spriteRef.current.scale.x = facingRight.current ? SPRITE_WIDTH : -SPRITE_WIDTH;
   ```

4. O `manifest.json` mostra que cada sprite tem sourceSizes diferentes:
   - `idle_right`: 101x138 (ratio 0.732) -- esticado 82% horizontal
   - `walk_right`: 145x122 (ratio 1.189) -- esticado 12% horizontal
   - `run_right`: 160x113 (ratio 1.416) -- comprimido 6% horizontal
   - `attack_1`: 216x113 (ratio 1.912) -- comprimido 30% horizontal
   - `death`: 201x77 (ratio 2.610) -- comprimido 49% horizontal
   - `hurt_heavy`: 124x54 (ratio 2.296) -- comprimido 42% horizontal

5. `SpriteAnimator.ts` ja tem tipos (`SpriteEntry`, `SpriteManifest`) e uma
   funcao `getFrameSpriteEntry()`, mas o manifest nunca e carregado em runtime.

## Solution

### Task T01 — SpriteAnimator: carregar manifest e expor aspect ratio por frame

Modificar `SpriteAnimator.ts` para:
1. Fazer fetch de `manifest.json` durante `loadSprites()` e armazenar no modulo
2. Exportar nova funcao `getFrameAspectRatio(animName, elapsed): number` que
   retorna `sourceSize[0] / sourceSize[1]` para o frame atual
3. Fallback para 1.0 se o manifest nao carregou ou o sprite nao existe

### Task T02 — Mel.tsx: usar aspect ratio dinamico por frame

Modificar `Mel.tsx` para:
1. Remover constantes fixas `SPRITE_RATIO` e `SPRITE_WIDTH`
2. No `useFrame`, apos obter a textura, chamar `getFrameAspectRatio()` para
   obter o ratio correto do frame atual
3. Calcular `width = SPRITE_HEIGHT * ratio` e aplicar ao `scale.x` (com sinal
   negativo para flip left)
4. No JSX, usar scale inicial `[SPRITE_HEIGHT, SPRITE_HEIGHT, 1]` (sera
   corrigido no primeiro frame)

## Architecture Impact

- `packages/frontend/src/game/systems/SpriteAnimator.ts` — carregar manifest,
  nova funcao exportada
- `packages/frontend/src/game/entities/Mel.tsx` — remover constantes fixas,
  usar ratio dinamico no useFrame
- Nenhum outro arquivo afetado

## Waves

- **Wave 0**: F33-T01 (SpriteAnimator), F33-T02 (Mel.tsx) — paralelos

> T01 e T02 tocam arquivos diferentes e podem ser desenvolvidos em paralelo.
> T02 depende logicamente da funcao que T01 exporta, mas o Developer pode
> implementar ambos sabendo a assinatura: `getFrameAspectRatio(animName: string, elapsed: number): number`.

## Global Acceptance Criteria

- [ ] Mel idle aparece com proporcoes corretas (mais alta que larga)
- [ ] Walk, run, attack sprites manteem proporcoes corretas
- [ ] Flip (esquerda/direita) continua funcionando corretamente
- [ ] Sem jitter visual ao transicionar entre animacoes
- [ ] Sprites death e hurt_heavy respeitam suas proporcoes (largos e baixos)
- [ ] Jogo roda sem erros no console
- [ ] Performance nao degradada (getFrameAspectRatio e O(1) lookup)

## Diagrams

- Nao requer novos diagramas (fix em rendering de sprites existentes)
