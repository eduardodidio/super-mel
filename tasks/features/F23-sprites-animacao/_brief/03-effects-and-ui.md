# 03 — Efeitos Separados e UI

## Efeitos (sprites a parte)

Cada efeito e uma entidade independente da Mel, instanciada pelo jogo:

| Efeito | Frames | Uso |
|---|---|---|
| `bark_wave` (anel dourado) | 4, crescendo | Disparado no frame 2 do attack, vira projetil |
| `heart` | 3 (pequeno, medio, estourando) | jump_on_owner e affection |
| `stars` (dano) | 2 | Aparece ao redor da cabeca no hurt_medium |
| `dust` (poeira) | 3 | Corrida e aterrissagem do pulo |
| `exclamation` | 1 | Espera (wait), flutua 2px acima |

### bark_wave

Atualmente o projetil (`Projectile.tsx`) e uma esfera luminosa 3D. Deve ser substituido por um sprite animado do anel dourado, mantendo a mesma logica de fisica/colisao.

### dust

Spawnar particulas de poeira:
- A cada N frames de run, spawnar dust na posicao das patas
- Ao aterrissar de um jump_land, spawnar dust maior

## UI Portraits

Atualmente o HUD usa emoji de coracao (&#9829;). Adicionar:
- Portrait da Mel no canto esquerdo do HUD (ui_portrait.png)
- Trocar portrait baseado na vida:
  - 3 vidas: normal
  - 2 vidas: preocupada (fallback: normal com tint amarelo)
  - 1 vida: ferida (fallback: normal com tint vermelho)
  - ui_portrait_hurt.png e ui_portrait_happy.png quando disponíveis
