# 02 — Maquina de Estados de Animacao

## Estados

Baseado no plano (secao 3):

```
idle ──(input)──> walk ──(corrida)──> run
  ^                |                    |
  └────────────────┴──── parou ─────────┘
qualquer terrestre ──(pulo)──> jump (rise/air/fall/land) → (idle|run)
idle/walk ──(ataque)──> attack (prep → 1 → 2 → end) ──> idle
qualquer ──(dano)──> hurt (leve|medio|grave) ──> idle | death
sem input 8s ──> sit ──(mais 8s)──> lie_down ; input ──> idle
```

## Regras de prioridade

1. `hurt` e `death` interrompem tudo
2. `attack` nao pode ser interrompido por `walk`
3. Direcao do flip segue a ultima direcao horizontal de input
4. `jump` usa velocidade vertical para trocar entre rise/air/fall/land

## Tipo de animacao

- Loop: idle, walk, run, sit, lie_down, affection, wait
- One-shot: jump, attack, hurt, death, jump_on_owner

## Integracao com Mel.tsx

O estado de animacao atual determina:
1. Qual sequencia de frames tocar
2. FPS da animacao
3. Se pode ser interrompido
4. Callback ao finalizar (one-shot → volta ao estado padrao)

## Arquivo atual: SpriteAnimator.ts

Precisa ser reescrito para:
- Suportar sprites individuais (nao grid fixo)
- Cada animacao tem lista de frames nomeados
- Fallback quando frame nao existe (usar frame anterior ou base)
- Eventos de frame (ex: disparar bark_wave no frame 2 do attack)
