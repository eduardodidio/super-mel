# F61 — Campaign Level Fixes

**Status:** in-progress

## Summary

Fixes all issues found in the F61 campaign audit across all 8 levels (Mundo 1). Addresses critical soft-locks, unreachable collectibles, missing enemies, missing signs, difficulty curve regression, and unused game mechanics (springs, spikes).

## Fixes Per Level

### 1-1 (Quintal da Mel)
- Move checkpoint sign from x=27 to x=23 (before checkpoint at x=25)

### 1-2 (Cerca do Vizinho)
- **CRITICAL**: Lower leaf platform from y=6 to y=3 and bone from (23,7) to (23,4) — currently unreachable
- Add 2 pigeon enemies on ground path
- Add sign before first gap

### 1-3 (Pracinha do Parque)
- Add 2 pigeon enemies on ground path
- Add sign hinting at vertical exploration

### 1-4 (Lago dos Patos)
- Add 2 enemies (pigeon + bee)
- Add sign warning about water
- Add sign before iron wall

### 1-5 (Trilha da Montanha)
- Lower bone from (43,12) to (43,10)
- Add 2 enemies (pigeon + bee)
- Add sign before lava crossing
- Add spring entity before lava gap as alternative crossing method

### 1-6 (Ponte Quebrada)
- Move checkpoint 1 from (22,5) to (20,1) on ground path
- Add 3 enemies to raise difficulty above 1-5
- Add spikes hazard in broken bridge section
- Add sign before broken bridge

### 1-7 (Aterro Noturno)
- Lower bone from (43,10) to (43,8)
- Add 3 enemies (vacuum + pigeon + bee)
- Add sign before brick fortress

### 1-8 (Telhado da Casa)
- **CRITICAL**: Reduce wall at x=70 from 7 to 5 blocks (remove y=5 and y=6)
- **CRITICAL**: Move checkpoint 3 from (66,1) to (72,1) — fix soft-lock
- Lower bones: (34,10)->(34,8), (77,14)->(77,12)
- Add 3 enemies
- Add sign before first bottomless pit

## Global Fixes
- Add enemies to ALL levels (1-2 through 1-8) — 0 enemies currently in entire campaign
- Add signs to levels 1-2 through 1-8 (only 1-1 has signs)
- Use spring and spikes entities in later levels (1-5+)
- Fix difficulty curve: 2,3,3,5,6,5,6,9 -> smoother progression

## Waves

### Wave 0 (4 parallel agents, 2 levels each)
- Agent A: Fix 1-1 + 1-2
- Agent B: Fix 1-3 + 1-4
- Agent C: Fix 1-5 + 1-6
- Agent D: Fix 1-7 + 1-8
