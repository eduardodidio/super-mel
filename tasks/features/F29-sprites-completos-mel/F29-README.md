# F29 — Sprites Completos da Mel + Animacao Fluida

**Status:** partial (codigo pronto, sprites T02+T04 pendentes de artista)

## Goal

Levantar todos os sprites faltantes para as acoes da Mel, criar os que faltam, corrigir mapeamentos errados, e adicionar frames intermediarios para que a movimentacao seja fluida (nao "travada"). Usar os sprites existentes como base para criar os novos.

## Architecture Impact

- **public/sprites/mel/**: novos PNGs para crouch, look_up, fly, walk/run intermediarios
- **systems/SpriteAnimator.ts**: atualizar ANIMATIONS com novos frames e FPS ajustados
- **systems/AnimationStateMachine.ts**: corrigir mapeamento de jump_land, adicionar transicoes suaves
- **entities/Mel.tsx**: ajustar frame blending/timing para fluidez
- **public/sprites/mel/manifest.json**: registrar novos sprites

## Auditoria de Sprites (estado atual)

### Sprites com placeholder (reusam outros):
- `crouch` → usa `sit.png` (precisa sprite proprio)
- `look_up` → usa `idle_right.png` (precisa sprite proprio)
- `fly` → usa `jump_air.png` (precisa sprite proprio com asas/pose diferente)

### Bug de mapeamento:
- `jump_land` state mapeia para animacao "jump" (jump_rise + jump_air) em vez de usar jump_land.png que EXISTE

### Animacoes com poucos frames (causam travamento visual):
- `idle`: 1 frame (idle_right) → precisa 2-3 frames (breathing/blink)
- `walk`: 2 frames (walk_right, walk_right_b) → precisa 4 frames minimo
- `run`: 2 frames (run_right, run_right_b) → precisa 4 frames minimo
- `hurt_heavy`: usa hurt_light + hurt_medium → precisa usar hurt_heavy.png

### Sprites existentes nao usados:
- `affection.png` — sem estado no AnimationStateMachine
- `wait.png` — sem estado no AnimationStateMachine
- `jump_on_owner.png` — sem estado no AnimationStateMachine

## Wave Manifest

- **Wave 0**: F29-T01 (auditoria completa + plano de criacao de sprites)
- **Wave 1**: F29-T02, F29-T03 (paralelo: criar sprites faltantes + corrigir mapeamentos)
- **Wave 2**: F29-T04, F29-T05 (paralelo: adicionar frames intermediarios + ajustar timing/FPS)
- **Wave 3**: F29-T06 (docs: diagramas + README update)

## Global Acceptance Criteria

- [ ] `crouch` tem sprite proprio (nao reusa sit)
- [ ] `look_up` tem sprite proprio (nao reusa idle)
- [ ] `fly` tem sprite proprio (nao reusa jump_air)
- [ ] `jump_land` usa jump_land.png corretamente
- [ ] `hurt_heavy` usa hurt_heavy.png
- [ ] `idle` tem pelo menos 2 frames (breathing effect)
- [ ] `walk` tem pelo menos 4 frames (ciclo fluido)
- [ ] `run` tem pelo menos 4 frames (ciclo fluido)
- [ ] Movimentacao da Mel parece fluida, nao "travada"
- [ ] manifest.json atualizado com todos os novos sprites
- [ ] Sem regressao: estados existentes continuam funcionando
- [ ] Performance: sem aumento de memory/load time significativo

## Diagrams

- `docs/diagrams/F29-architecture.mmd`
- `docs/diagrams/F29-journey.mmd`
