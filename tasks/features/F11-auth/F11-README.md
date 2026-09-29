# F11: Auth (Guest + Login)
**Status:** done
**Created:** 2026-09-29
- AuthScreen React com 3 modos: Visitante, Login, Registrar
- Backend: POST /api/auth/guest, /api/auth/login, /api/auth/register
- Senhas com bcrypt hash
- JWT tokens (7d guest, 30d registered)
- localStorage para persistir sessao
- Fallback offline: se servidor nao responde, joga como guest local
- UI estilo pixel/monospace alinhada com o visual do jogo
