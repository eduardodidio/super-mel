# F59 — Mobile + Polish Fixes

**Type:** bugfix + polish
**Priority:** P1
**Effort:** M (5 tasks independentes, todas paralelas)

## Objetivo

Corrigir 5 problemas reportados pelo usuario que afetam a experiencia mobile e gameplay geral.

## Fix 1: Parallax Background Infinito

**Problema:** O fundo parallax e um mesh estatico de 200 unidades posicionado na origem [0, 5, -35]. Conforme o jogador avanca, o plano sai do frustum da camera e o fundo acaba.

**Arquivo:** `packages/frontend/src/game/systems/ParallaxImageBackground.tsx`

**Causa raiz:** O mesh nunca se reposiciona — apenas o texture.offset.x muda. Quando o jogador vai alem de ~100 unidades, o plano de 200u centrado em x=0 sai da visao da camera.

**Solucao:** Reposicionar dinamicamente o mesh.position.x para seguir a camera/jogador a cada frame, mantendo o texture offset para o efeito parallax. O plano deve estar sempre centrado na posicao X da camera. Constantes relevantes: PLANE_WIDTH=200, PLANE_Z=-35, PLANE_Y=5, REPEAT_X=4, PARALLAX_FACTOR=0.002.

## Fix 2: Mel Travando em Colisores Invisiveis

**Problema:** Blocos nao-solidos (leaf, water) criam sensor colliders via `sensor={!props.solid && !props.dangerous}` no Block.tsx. Esses sensors interferem no ground detection da Mel e podem prender o jogador.

**Arquivos:**
- `packages/frontend/src/game/entities/Block.tsx` (line 103)
- `packages/frontend/src/game/entities/Mel.tsx` (lines 135-148)
- `packages/shared/src/types.ts` (BLOCK_PROPERTIES)

**Causa raiz:** Block.tsx cria RigidBody com collider cuboid para TODOS os blocos foreground (z=0). Blocos nao-solidos/nao-perigosos recebem sensor=true, mas esses sensors ainda sao detectados pelo ray cast de ground detection da Mel.

**Solucao:**
1. Blocos com `solid=false && dangerous=false` NAO devem ter RigidBody/collider (nem sensor). Renderizar apenas o mesh visual.
2. Blocos com `dangerous=true && solid=false` (lava) devem manter sensor para deteccao de dano.
3. Verificar que ground detection da Mel (ray cast) nao e afetada por sensors restantes.

## Fix 3: Controles Touch Mobile Nao Funcionam

**Problema:** Os botoes aparecem no mobile mas nao respondem ao toque. TouchControls3D.tsx usa apenas onTouchStart/onTouchEnd sem fallback.

**Arquivo:** `packages/frontend/src/game/systems/TouchControls3D.tsx`

**Causa raiz:** Apenas handlers onTouchStart/onTouchEnd. Faltam onPointerDown/onPointerUp (standard moderno). Sem feedback visual. Possivel conflito de event propagation com o canvas R3F.

**Solucao:**
1. Trocar onTouchStart/End por onPointerDown/onPointerUp (cobre touch+mouse+pen).
2. Adicionar CSS touch-action: manipulation em cada botao.
3. Adicionar feedback visual: opacity 0.6 quando pressionado (via state ou CSS :active).
4. Garantir que pointer-events nao e bloqueado por camadas acima.
5. Adicionar e.preventDefault() para evitar scroll/zoom acidental.
6. Testar com Chrome DevTools mobile emulation E dispositivo real se possivel.

## Fix 4: Fullscreen Mobile (Esconder Header do Browser)

**Problema:** No celular, o cabecalho do browser fica visivel, roubando espaco do jogo. viewport meta incompleta. CSS usa 100vh que inclui browser chrome.

**Arquivos:**
- `packages/frontend/index.html` (viewport meta, line 5)
- CSS do #root (line 17 do index.html)
- `packages/frontend/src/App.tsx` ou componente raiz

**Solucao:**
1. Atualizar viewport meta: `width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover`
2. Trocar `height: 100vh` por `height: 100dvh` com fallback `height: 100vh` para browsers antigos.
3. Adicionar CSS para safe-area-inset: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` no container principal.
4. Chamar Fullscreen API (`document.documentElement.requestFullscreen()`) ao iniciar o jogo no mobile (no primeiro toque do usuario, pois requer user gesture).
5. Adicionar CSS `html, body { overflow: hidden; position: fixed; }` para evitar scroll bounce no iOS.

## Fix 5: PWA Install Nao Funciona

**Problema:** O usuario tentou instalar o app mas nao encontrou no celular. Service worker pode estar falhando silenciosamente.

**Arquivos:**
- `packages/frontend/public/sw.js` (health check para /api/health que da 404)
- `packages/frontend/public/manifest.json`
- `packages/frontend/src/hooks/usePWAInstall.ts`
- `packages/frontend/public/icons/`

**Causa raiz provavel:**
1. sw.js faz fetch("/api/health") que retorna 404 em deploy estatico (Render static site). Erro e caught silenciosamente mas pode impedir ativacao do SW.
2. Icones podem nao existir ou estar mal formatados.
3. Evento beforeinstallprompt pode nao disparar se SW nao ativa corretamente.

**Solucao:**
1. Remover health check fetch("/api/health") do sw.js ou substituir por URL absoluta do backend.
2. Verificar que todos os icones em manifest.json existem em public/icons/ com tamanhos corretos (192x192, 512x512).
3. Verificar que manifest.json esta sendo servido com Content-Type correto.
4. Adicionar console.log no usePWAInstall para debug do evento beforeinstallprompt.
5. Verificar que o site e servido via HTTPS (requisito PWA).
6. Testar o fluxo A2HS completo em Chrome Android.

## Restricao de Paralelismo

TODAS as 5 fixes sao 100% independentes entre si. Devem ser agrupadas na MESMA Wave para execucao paralela maxima. Wave 0 = 5 tasks em paralelo.
