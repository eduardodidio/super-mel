# F23 — Troca de Sprites e Sistema de Animacao

## Problema

O jogo usa atualmente um spritesheet voxel placeholder (`mel_spritesheet.png`) com grid fixo 6x10. Os novos sprites 2D de alta qualidade estao prontos em `novosSpritesEPlanejamento/super_mel_ref_sprites.zip` (34 sprites recortados, celula 224x168, pivo nas patas). Precisamos substituir o sistema de animacao inteiro para suportar os novos assets e a maquina de estados completa descrita no plano de animacoes.

## Escopo

1. Pipeline de assets: extrair sprites do zip, organizar em diretorio, gerar atlas
2. Novo `SpriteAnimator` com suporte a atlas multi-row variavel (nao mais grid fixo)
3. Maquina de estados de animacao completa (idle/walk/run/jump/attack/hurt/death + especiais)
4. Flip X para direcao esquerda (espelho da direita)
5. Efeitos separados (bark_wave, heart, stars, dust, exclamation) como entidades independentes
6. UI portraits no HUD (normal/ferida/feliz baseado na vida)
7. Fallbacks procedurais para frames ainda nao gerados (bob, flash, tint)

## Restricoes

- Manter compatibilidade com o sistema de fisica Rapier existente
- Nao alterar a logica de controles (`useControls`)
- Sprites que ainda nao existem (marcados 🎨 no plano) devem ter fallback funcional
- Celula 224x168 px, pivo em (0.5, 150/168)
- Esquerda = flip X da direita (simetria confirmada no plano)

## Acceptance Criteria (resumo)

- AC1: Mel renderiza com os novos sprites em todas as animacoes existentes
- AC2: Maquina de estados cobre: idle, walk, run, jump, fall, attack, hurt, death
- AC3: Flip X funciona corretamente para direcao esquerda
- AC4: Efeitos (bark_wave, dust) renderizam como entidades separadas
- AC5: HUD mostra portrait da Mel que muda com a vida
- AC6: Fallbacks procedurais funcionam para sprites ausentes
- AC7: Performance mantida (sem queda de FPS)

## Referencia principal

- `novosSpritesEPlanejamento/plano_animacoes_super_mel.md` — plano completo de animacoes
- `novosSpritesEPlanejamento/super_mel_ref_sprites.zip` — sprites de referencia
