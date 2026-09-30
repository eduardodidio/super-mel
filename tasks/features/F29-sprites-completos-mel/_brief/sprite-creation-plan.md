# Sprite Creation Plan — Super Mel (F29)

**Data:** 2026-09-30
**Feature:** F29 — Sprites Completos da Mel
**Specs:** 224x168px PNG com fundo transparente
**Estilo:** Pixel art, yorkshire micro, paleta consistente

---

## 1. Inventario Completo — Sprites Existentes (35 PNGs)

### Movimentacao (18 sprites)

| # | Arquivo | Uso no SpriteAnimator | Estado no AnimationStateMachine | Status |
|---|---------|----------------------|--------------------------------|--------|
| 1 | `idle_right.png` | idle (frame 1/1) | idle | OK — em uso |
| 2 | `idle_front.png` | — | — | SEM USO — disponivel para direcoes futuras |
| 3 | `idle_back.png` | — | — | SEM USO — disponivel para direcoes futuras |
| 4 | `idle_left.png` | — | — | SEM USO — disponivel para direcoes futuras (flip horizontal cobre) |
| 5 | `walk_right.png` | walk (frame 1/2) | walk | OK — em uso |
| 6 | `walk_right_b.png` | walk (frame 2/2) | walk | OK — em uso |
| 7 | `walk_front.png` | — | — | SEM USO — disponivel para direcoes futuras |
| 8 | `walk_back.png` | — | — | SEM USO — disponivel para direcoes futuras |
| 9 | `walk_left.png` | — | — | SEM USO — disponivel para direcoes futuras (flip horizontal cobre) |
| 10 | `run_right.png` | run (frame 1/2) | run | OK — em uso |
| 11 | `run_right_b.png` | run (frame 2/2) | run | OK — em uso |
| 12 | `run_front.png` | — | — | SEM USO — disponivel para direcoes futuras |
| 13 | `run_back.png` | — | — | SEM USO — disponivel para direcoes futuras |
| 14 | `run_left.png` | — | — | SEM USO — disponivel para direcoes futuras (flip horizontal cobre) |
| 15 | `jump_rise.png` | jump (frame 1/2) | jump_rise | OK — em uso |
| 16 | `jump_air.png` | jump (frame 2/2), fly placeholder | jump_air, fly | OK — em uso (fly usa como placeholder) |
| 17 | `jump_fall.png` | fall (frame 1/2) | jump_fall | OK — em uso |
| 18 | `jump_land.png` | fall (frame 2/2) | jump_land | BUG — jump_land state mapeia para animacao "jump" que mostra jump_rise+jump_air em vez de jump_land.png |

### Acoes (8 sprites)

| # | Arquivo | Uso no SpriteAnimator | Estado no AnimationStateMachine | Status |
|---|---------|----------------------|--------------------------------|--------|
| 19 | `attack_prep.png` | attack (frame 1/4) | attack_prep | OK — em uso |
| 20 | `attack_1.png` | attack (frame 2/4), bark_wave (frame 1/2) | attack_1 | OK — em uso |
| 21 | `attack_2.png` | attack (frame 3/4), bark_wave (frame 2/2) | attack_2 | OK — em uso |
| 22 | `attack_end.png` | attack (frame 4/4) | attack_end | OK — em uso |
| 23 | `hurt_light.png` | hurt (frame 1/2) | hurt_light | OK — em uso |
| 24 | `hurt_medium.png` | hurt (frame 2/2) | hurt_medium | OK — em uso |
| 25 | `hurt_heavy.png` | death (frame 1/2) | hurt_heavy | BUG — hurt_heavy state usa animacao "hurt" que mostra hurt_light+hurt_medium em vez de hurt_heavy.png |
| 26 | `death.png` | death (frame 2/2) | death | OK — em uso |

### Especiais (5 sprites)

| # | Arquivo | Uso no SpriteAnimator | Estado no AnimationStateMachine | Status |
|---|---------|----------------------|--------------------------------|--------|
| 27 | `sit.png` | sit (frame 1/1), crouch placeholder | sit, crouch | OK — em uso (crouch reutiliza como placeholder) |
| 28 | `lie_down.png` | lie_down (frame 1/1) | lie_down | OK — em uso |
| 29 | `affection.png` | — | — | SEM USO — sem animacao ou estado mapeado |
| 30 | `wait.png` | — | — | SEM USO — sem animacao ou estado mapeado |
| 31 | `jump_on_owner.png` | — | — | SEM USO — sem animacao ou estado mapeado |

### UI (4 sprites)

| # | Arquivo | Uso no SpriteAnimator | Status |
|---|---------|----------------------|--------|
| 32 | `ui_portrait.png` | UI HUD | OK — em uso |
| 33 | `ui_icon_small.png` | UI HUD | OK — em uso |
| 34 | `ui_icon_ability.png` | UI HUD | OK — em uso |
| 35 | `ui_icon_ability_paw.png` | UI HUD | OK — em uso |

---

## 2. Resumo de Status

| Categoria | Total | Em Uso | Com Bug | Sem Uso | Placeholder |
|-----------|-------|--------|---------|---------|-------------|
| Movimentacao | 18 | 12 | 1 (jump_land) | 5 (direcoes) | 1 (fly via jump_air) |
| Acoes | 8 | 7 | 1 (hurt_heavy) | 0 | 0 |
| Especiais | 5 | 2 | 0 | 3 (affection, wait, jump_on_owner) | 1 (crouch via sit) |
| UI | 4 | 4 | 0 | 0 | 0 |
| **Total** | **35** | **25** | **2** | **8** | **2** |

---

## 3. Bugs de Mapeamento Identificados

Estes bugs nao requerem novos sprites — sao correcoes de codigo em SpriteAnimator.ts e/ou AnimationStateMachine.ts.

| Bug | State na FSM | Animacao Usada | Sprite Mostrado | Sprite Correto | Fix |
|-----|-------------|----------------|-----------------|----------------|-----|
| B1 | `jump_land` | "jump" (jump_rise + jump_air) | jump_rise.png / jump_air.png | jump_land.png | Criar animacao "jump_land" ou corrigir mapeamento |
| B2 | `hurt_heavy` | "hurt" (hurt_light + hurt_medium) | hurt_light.png / hurt_medium.png | hurt_heavy.png | Criar animacao "hurt_heavy" ou corrigir mapeamento |

---

## 4. Sprites Que Precisam Ser CRIADOS

### Prioridade P0 — Essenciais (corrigem placeholders/bugs de gameplay)

Estes sprites sao necessarios para que as mecanicas crouch, look_up e fly tenham identidade visual propria em vez de reutilizar sprites genericos.

| # | Arquivo | Descricao Visual | Sprite Base (referencia) | Notas |
|---|---------|-----------------|--------------------------|-------|
| 1 | `crouch.png` | Mel agachada em posicao de prontidao. Corpo comprimido para baixo, patas dianteiras dobradas, cabeca baixa mas alerta, olhos focados para frente. Diferente de `sit` — sit e relaxado, crouch e tenso/pronto para acao. Rabo baixo, orelhas ligeiramente para tras. | `sit.png` como base, ajustar postura para ser mais "compacta e atletica" | Substitui placeholder que usa sit.png |
| 2 | `look_up.png` | Mel de perfil direito (mesma orientacao de idle_right) com a cabeca inclinada para cima em ~45 graus. Orelhas apontando para cima, olhos olhando para o alto, corpo ligeiramente arqueado para tras. Patas na mesma posicao de idle. | `idle_right.png` como base, inclinar cabeca e ajustar orelhas para cima | Substitui placeholder que usa idle_right.png |
| 3 | `fly_1.png` | Mel no ar em posicao de voo. Corpo horizontal ligeiramente inclinado para cima, patas dianteiras esticadas para frente, patas traseiras esticadas para tras, orelhas ao vento (para tras), rabo esticado. Expressao determinada/feliz. | `jump_air.png` como base, ajustar postura para voo sustentado (mais horizontal que pulo) | Frame 1 do loop de voo |
| 4 | `fly_2.png` | Variacao de fly_1 para criar loop animado. Mesma posicao geral mas com pequenas patas se movendo (dianteiras ligeiramente mais baixas, traseiras ligeiramente mais altas), como se "remasse" no ar. Orelhas em posicao levemente diferente. | `fly_1.png` como base, criar variacao sutil de patas e orelhas | Frame 2 do loop de voo |

### Prioridade P1 — Fluidez de Animacao (melhoram qualidade visual)

Estes sprites adicionam frames intermediarios para que as animacoes de idle, walk e run fiquem mais suaves e naturais em vez de alternar entre apenas 1-2 frames.

| # | Arquivo | Descricao Visual | Sprite Base (referencia) | Notas |
|---|---------|-----------------|--------------------------|-------|
| 5 | `idle_right_b.png` | Mel em idle com olhos semi-fechados (blink). Corpo na mesma posicao de idle_right, mas palpebras cobrindo metade dos olhos. Simula piscada natural. | `idle_right.png` como base, fechar parcialmente os olhos | idle passa de 1 frame para 3 frames (breathing cycle) |
| 6 | `idle_right_c.png` | Mel em idle com respiracao — peito/corpo ligeiramente expandido comparado a idle_right. Olhos abertos normais. Cria sensacao de "breathing" sutil. | `idle_right.png` como base, expandir levemente a regiao do torax | Completa o ciclo idle: right -> c (expand) -> right -> b (blink) |
| 7 | `walk_right_c.png` | Mel andando — pata dianteira direita estendida para frente, pata traseira esquerda estendida para tras. Corpo no ponto mais alto da passada (stride). | `walk_right.png` como base, criar pose intermediaria com patas opostas | walk passa de 2 para 4 frames (ciclo completo de passada) |
| 8 | `walk_right_d.png` | Mel andando — pata dianteira esquerda estendida para frente, pata traseira direita estendida para tras. Corpo no ponto mais baixo da passada (contact). Espelho funcional de walk_right_c. | `walk_right_b.png` como base, criar pose intermediaria espelhada | Completa o ciclo walk: right -> c -> right_b -> d |
| 9 | `run_right_c.png` | Mel correndo — frame de stretch/extensao maxima. Corpo esticado ao maximo, patas bem separadas (dianteiras para frente, traseiras para tras), perfil mais longo e fino. Fase de "voo" da corrida. | `run_right.png` como base, esticar o corpo e patas ao maximo | run passa de 2 para 4 frames (gallop cycle) |
| 10 | `run_right_d.png` | Mel correndo — frame de compress/compressao maxima. Corpo comprimido, todas as patas agrupadas sob o corpo, perfil mais curto e compacto. Fase de "recolhimento" da corrida (gather). | `run_right_b.png` como base, comprimir corpo e agrupar patas | Completa o ciclo run: right -> c -> right_b -> d |

---

## 5. Especificacoes Tecnicas

| Propriedade | Valor |
|-------------|-------|
| Dimensoes | 224 x 168 pixels |
| Formato | PNG-24 com transparencia (alpha channel) |
| Fundo | Transparente |
| Estilo | Pixel art consistente com sprites existentes |
| Paleta | Mesma paleta de cores usada nos sprites atuais da Mel (amarelo/dourado yorkshire, tons de marrom, preto para olhos/nariz) |
| Orientacao | Perfil direito (mesmo padrao de idle_right, walk_right, run_right) — flip horizontal e feito em codigo |
| Posicionamento | Mel centralizada no canvas, patas tocando a mesma "linha de chao" dos sprites existentes |
| Tamanho da Mel | Manter exatamente as mesmas proporcoes da Mel nos sprites existentes |

---

## 6. Mapeamento Pos-Criacao (Animacoes Atualizadas)

Apos criar os sprites, as animacoes em SpriteAnimator.ts devem ser atualizadas:

| Animacao | Frames Atuais | Frames Novos | FPS |
|----------|--------------|--------------|-----|
| idle | [idle_right] (1f) | [idle_right, idle_right_c, idle_right, idle_right_b] (4f) | 4 |
| walk | [walk_right, walk_right_b] (2f) | [walk_right, walk_right_c, walk_right_b, walk_right_d] (4f) | 10 |
| run | [run_right, run_right_b] (2f) | [run_right, run_right_c, run_right_b, run_right_d] (4f) | 14 |
| crouch | [sit] (1f, placeholder) | [crouch] (1f) | 6 |
| look_up | [idle_right] (1f, placeholder) | [look_up] (1f) | 6 |
| fly | [jump_air] (1f, placeholder) | [fly_1, fly_2] (2f) | 10 |

---

## 7. Sprites Existentes Sem Uso (Candidatos a Uso Futuro)

Estes sprites existem mas nao tem mapeamento em nenhuma animacao ou estado:

| Sprite | Uso Potencial |
|--------|---------------|
| `affection.png` | Animacao de carinho (evento especial, cutscene, idle longo) |
| `wait.png` | Idle timeout — Mel fica entediada apos X segundos sem input |
| `jump_on_owner.png` | Animacao especial de vitoria ou interacao com NPC |
| `idle_front.png` | Menu principal ou selecao de personagem |
| `idle_back.png` | Mel andando "para dentro" da tela (profundidade Z) |
| `idle_left.png` | Redundante — flip horizontal de idle_right cobre |
| `walk_front.png` | Animacao de andar em direcao a camera |
| `walk_back.png` | Animacao de andar para dentro da tela |
| `walk_left.png` | Redundante — flip horizontal de walk_right cobre |
| `run_front.png` | Animacao de correr em direcao a camera |
| `run_back.png` | Animacao de correr para dentro da tela |
| `run_left.png` | Redundante — flip horizontal de run_right cobre |

---

## 8. Ordem de Execucao Recomendada

1. **Primeiro:** Criar sprites P0 (crouch, look_up, fly_1, fly_2) — desbloqueia correcao de placeholders
2. **Segundo:** Corrigir bugs B1 e B2 no codigo (nao requer sprites novos)
3. **Terceiro:** Criar sprites P1 (idle_right_b/c, walk_right_c/d, run_right_c/d) — melhora fluidez
4. **Quarto:** Atualizar SpriteAnimator.ts com novos frames e mapeamentos
5. **Quinto:** Considerar uso dos sprites orfaos (affection, wait, jump_on_owner) em features futuras

---

*Documento gerado como parte da feature F29 — Sprites Completos da Mel*
