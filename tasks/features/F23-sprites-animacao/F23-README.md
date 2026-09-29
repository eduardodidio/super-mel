# F23 — Troca de Sprites e Sistema de Animacao

**Status:** planned

## Goal

Substituir o spritesheet voxel placeholder por sprites 2D de alta qualidade extraidos da folha de referencia, implementar maquina de estados de animacao completa, efeitos visuais separados e UI portraits no HUD. O sistema deve ter fallbacks procedurais para sprites ainda nao gerados.

## Architecture Impact

- **Frontend / game / systems**: `SpriteAnimator.ts` reescrito como sistema de animacao baseado em sprites individuais + atlas
- **Frontend / game / entities**: `Mel.tsx` refatorado para usar nova state machine; novo `EffectSprite.tsx`
- **Frontend / game / systems**: `ProjectileManager.tsx` atualizado para usar sprite bark_wave
- **Frontend / game / systems**: `HUD3D.tsx` atualizado com portrait da Mel
- **Frontend / public / sprites**: novos assets organizados em `mel/` subdirectory

## Wave Manifest

- **Wave 0**: F23-T01 (setup: extrair assets, criar diretorio, instalar deps se necessario)
- **Wave 1**: F23-T02, F23-T03 (core: novo SpriteAnimator + AnimationStateMachine)
- **Wave 2**: F23-T04, F23-T05 (integracao: refatorar Mel.tsx + efeitos visuais)
- **Wave 3**: F23-T06, F23-T07 (polish: HUD portrait + projetil sprite)
- **Wave 4**: F23-T08 (docs: diagramas + README update)

## Global Acceptance Criteria

- [ ] Mel renderiza com novos sprites 2D em todas as animacoes
- [ ] State machine cobre idle/walk/run/jump/fall/attack/hurt/death
- [ ] Flip X funciona para direcao esquerda
- [ ] Efeitos (bark_wave, dust) sao entidades separadas
- [ ] HUD mostra portrait da Mel que varia com a vida
- [ ] Fallbacks procedurais para sprites ausentes (bob, tint)
- [ ] Sem regressao de performance

## Diagrams

- `docs/diagrams/F23-architecture.mmd` — data flow do sistema de animacao
- `docs/diagrams/F23-journey.mmd` — fluxo de estados de animacao da Mel
