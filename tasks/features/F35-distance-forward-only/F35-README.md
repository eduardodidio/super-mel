# Feature F35 — Distance Counter Forward-Only

**Status:** planned
**Owner:** @architect
**PRD:** inline (bug fix, sem PRD separado)

## Goal

Corrigir o contador de distancia (metros/score) para contar APENAS deslocamento para frente (direcao positiva de X). Atualmente o contador usa `Math.abs(dx)`, o que faz qualquer movimento — incluindo andar para tras — incrementar o score. Alem disso, o jogador pode exploitar o sistema andando pra frente e pra tras repetidamente no mesmo trecho.

## Root Cause

`packages/frontend/src/game/scenes/GameScene3D.tsx` linhas 55-60:

```typescript
const dx = x - lastX.current;
if (Math.abs(dx) > 0.01) {
  addScore(Math.abs(dx));  // BUG: conta movimento absoluto, incluindo para tras
  facingRightRef.current = dx > 0;
}
lastX.current = x;
```

Dois problemas:
1. **Math.abs(dx)** conta deslocamento em ambas as direcoes
2. **lastX** rastreia a ultima posicao, nao a posicao maxima — andar pra frente e voltar gera score duplicado

## Fix

Substituir o rastreamento por `lastX` com um `maxX` ref que guarda a posicao mais avancada ja alcancada. Score so incrementa quando o player ultrapassa o `maxX` anterior.

### Alteracao exata

**GameScene3D.tsx — declaracao de refs (linha 40):**
```diff
- const lastX = useRef(0);
+ const lastX = useRef(0);
+ const maxX = useRef(0);
```

**GameScene3D.tsx — handlePositionUpdate (linhas 51-61):**
```diff
  const handlePositionUpdate = useCallback((x: number, y: number) => {
    melTracker.current.position.set(x, y, 0);
    playerPosRef.current.x = x;
    playerPosRef.current.y = y;
    const dx = x - lastX.current;
-   if (Math.abs(dx) > 0.01) {
-     addScore(Math.abs(dx));
-     facingRightRef.current = dx > 0;
-   }
+   if (dx > 0.01) {
+     facingRightRef.current = true;
+   } else if (dx < -0.01) {
+     facingRightRef.current = false;
+   }
+   if (x > maxX.current) {
+     addScore(x - maxX.current);
+     maxX.current = x;
+   }
    lastX.current = x;
  }, [addScore]);
```

### Por que funciona

1. **maxX** guarda o ponto mais avancado alcancado pela Mel
2. Score so incrementa quando `x > maxX.current` — movimentos para tras e re-percorrer terreno ja contado nao geram score
3. **lastX** permanece para determinar a direcao que Mel esta olhando (facingRight)
4. A logica de facing foi separada da logica de score para clareza

## Architecture impact

- `packages/frontend/src/game/scenes/GameScene3D.tsx` — unica alteracao necessaria
- Nenhum outro arquivo precisa mudar. `useGameState.addScore` continua recebendo um delta positivo
- `resetGame` no useGameState ja reseta `score: 0`, mas os refs `maxX` e `lastX` nao resetam. Isso e aceitavel porque o componente GameScene3D e remontado quando a scene muda para "playing" (via resetGame), o que reinicializa os refs naturalmente

## Waves

- **Wave 0**: F35-T01

> Apenas 1 task. Alteracao cirurgica em ~10 linhas do mesmo arquivo.

## Global acceptance criteria

- [ ] Score so incrementa quando Mel se move na direcao positiva de X (para frente)
- [ ] Andar para tras NAO incrementa o score
- [ ] Andar para frente, voltar e andar para frente novamente NAO conta o trecho repetido
- [ ] facingRightRef continua sendo atualizado corretamente em ambas as direcoes
- [ ] Score reseta corretamente ao iniciar novo jogo (refs reinicializados por remontagem)
- [ ] Jogo roda sem erros no console

## Diagrams

- Nao requer novos diagramas (fix em logica de score existente, sem mudanca arquitetural)
