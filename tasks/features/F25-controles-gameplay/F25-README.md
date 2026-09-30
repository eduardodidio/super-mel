# F25 — Refinamento de Controles e Gameplay

**Status:** planned

## Goal

Refinar o sistema de controles e gameplay da Mel: cursores direcionais para mover, ArrowDown para abaixar (crouch), ArrowUp para olhar pra cima, Space para pular, segurar Space para voar (desliga ao aterrissar), Z para atacar (Bola do Infinito). Adaptar touch controls mobile.

## Architecture Impact

- **hooks/useControls.ts**: expandir Controls interface (+down, +up), remapear ArrowUp (deixa de ser jump)
- **systems/AnimationStateMachine.ts**: novos estados `crouch`, `look_up`, `fly`; novo AnimInput fields
- **entities/Mel.tsx**: crouch physics (reduz collider, desacelera), fly mechanics (hold space no ar, landing desliga), look up state
- **systems/CameraRig.tsx**: offset vertical quando Mel olha pra cima
- **systems/TouchControls3D.tsx**: D-pad com 4 direcoes + botoes A/B
- **systems/SpriteAnimator.ts**: novos anim defs (reusando sprites existentes como placeholder)

## Wave Manifest

- **Wave 0**: F25-T01, F25-T02 (setup: controls interface + animation states)
- **Wave 1**: F25-T03, F25-T04, F25-T05 (core: Mel movement + camera + touch)
- **Wave 2**: F25-T06 (docs: diagrams + README update)

## Global Acceptance Criteria

- [ ] ArrowLeft/ArrowRight movem Mel (esquerda/direita)
- [ ] ArrowDown faz Mel abaixar (crouch) — collider menor, velocidade reduzida
- [ ] ArrowUp faz Mel olhar pra cima (grounded only) — camera sobe
- [ ] Space pula (ArrowUp NAO pula mais)
- [ ] Segurar Space no ar ativa voo (upward force reduzida)
- [ ] Ao aterrissar do voo, voo desliga automaticamente
- [ ] Z dispara Bola do Infinito (sem regressao)
- [ ] Touch mobile: D-pad 4 direcoes + A (jump/fly) + B (attack)
- [ ] Animacoes corretas para cada estado (placeholder sprites OK)
- [ ] Sem regressao de colisao, chunks, score, moedas

## Diagrams

- `docs/diagrams/F25-architecture.mmd`
- `docs/diagrams/F25-journey.mmd`
