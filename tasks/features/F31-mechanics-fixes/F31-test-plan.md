# F31 Test Plan — Mechanics Fixes

## 1. Scope

Fixes em 3 mecanicas: voo (timer 5s), colisao (CuboidCollider explicito), alcance ataque Z (10 blocos).

## 2. Test Strategy

Manual testing no browser (sem framework de unit test configurado). Cada fix tem cenarios isolados + cenarios de regressao cruzada.

## 3. Test Cases

### TC-01: Fly Timer (T01)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| TC-01a | Voo max 5s | Pular + segurar Space por >5s | Mel cai apos 5s |
| TC-01b | Timer reset on ground | Voar 3s, aterrissar, pular novamente | Timer reseta, pode voar 5s de novo |
| TC-01c | Soltar/segurar no ar | Voar 2s, soltar Space, segurar de novo | Timer continua de 2s (nao reseta no ar) |
| TC-01d | Spawn state | Iniciar jogo | Mel NAO esta voando ao spawnar |
| TC-01e | Jump still works | Pressionar Space brevemente | Pulo normal sem ativar voo |

### TC-02: Colisao (T02)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| TC-02a | Walk into wall | Andar contra bloco solido | Mel para, nao atravessa |
| TC-02b | Stand on platform | Pular sobre bloco | Mel aterrissa e fica em pe |
| TC-02c | Fall and land | Cair de altura | Mel aterrissa no bloco, ground detected |
| TC-02d | Coyote time | Andar ate borda de plataforma | Grace period funciona |
| TC-02e | Sensor passthrough | Caminhar sobre moedas/hearts | Coleta funciona (sensor) |
| TC-02f | Projectile passthrough | Atirar Z | Projetil passa por Mel sem colidir |

### TC-03: Alcance Ataque (T03)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| TC-03a | Range 10 blocos | Atirar Z em campo aberto | Projetil desaparece apos ~10 blocos |
| TC-03b | Hit before range | Atirar Z em bloco a 5 blocos | Projetil explode no bloco |
| TC-03c | Explosion visual | Atirar Z em bloco | Animacao de explosao funciona |
| TC-03d | Coin drop on hit | Atirar Z em bloco destrutivel | Moedas dropam normalmente |
| TC-03e | Cooldown | Pressionar Z rapidamente | 300ms entre tiros mantido |

### TC-04: Regressao Cruzada
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| TC-04a | Walk + attack | Andar e atirar Z | Ambos funcionam simultaneamente |
| TC-04b | Fly + attack | Voar e atirar Z | Ambos funcionam |
| TC-04c | Crouch | Pressionar down no chao | Crouch funciona normalmente |
| TC-04d | Look up | Pressionar up parado no chao | Look up funciona |
| TC-04e | Fall death | Cair abaixo de y=-15 | Respawn funciona |

## 4. Entry Criteria

- Codigo compilado sem erros
- Jogo carrega no browser

## 5. Exit Criteria

- Todos os TCs passam
- Nenhum erro novo no console

## 6. Environment

- Browser: Chrome/Firefox latest
- Dev server: `pnpm dev` (Vite)

## 7. Risks

- T01+T02 editam Mel.tsx (secoes diferentes) — verificar que nao ha conflito
- CuboidCollider dimensions podem precisar de ajuste fino se colisao ficar estranha
