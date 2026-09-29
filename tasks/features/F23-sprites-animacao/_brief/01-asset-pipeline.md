# 01 — Asset Pipeline

## Estrutura de assets

Os 34 sprites da folha de referencia devem ser extraidos e organizados em:

```
packages/frontend/public/sprites/mel/
  idle_right.png
  idle_front.png
  idle_back.png
  walk_right.png
  walk_right_b.png
  walk_front.png
  walk_back.png
  run_right.png
  run_right_b.png
  run_front.png
  run_back.png
  jump_rise.png
  jump_air.png
  jump_fall.png
  jump_land.png
  attack_prep.png
  attack_1.png
  attack_2.png
  attack_end.png
  hurt_light.png
  hurt_medium.png
  hurt_heavy.png
  death.png
  sit.png
  lie_down.png
  jump_on_owner.png
  affection.png
  wait.png
  ui_portrait.png
  ui_icon_small.png
  ui_icon_ability.png
```

## Atlas build

Para performance, os sprites individuais devem ser combinados em um atlas (texture atlas) com JSON metadata. O atlas pode ser gerado via script Node (sharp ou canvas) ou simplesmente organizando os sprites em um CSS-sprite-like layout.

Alternativa pragmatica: carregar sprites individuais como texturas e trocar via `material.map` — mais simples, sem necessidade de atlas builder. THREE.js faz cache de texturas.

## Fallback para sprites ausentes

Sprites marcados como 🎨 (arte nova necessaria) no plano devem ter fallback:
- Walk intermediarios: interpolar posicao entre frames existentes (bob procedural)
- Run intermediarios: mesma logica
- Idle respira: bob de 1-2px no eixo Y
- Idle pisca: swap rapido com alpha=0 nos olhos (ou skip se nao houver frame)
