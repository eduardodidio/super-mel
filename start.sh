#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

case "$1" in
  front)
    echo "=== Super Mel - Frontend (localhost:5173) ==="
    cd "$ROOT"
    pnpm dev:frontend
    ;;
  back)
    echo "=== Super Mel - Backend ==="
    cd "$ROOT"
    pnpm dev:backend
    ;;
  all)
    echo "=== Super Mel - Frontend + Backend ==="
    cd "$ROOT"
    pnpm dev
    ;;
  build)
    echo "=== Super Mel - Build ==="
    cd "$ROOT"
    pnpm build
    ;;
  *)
    echo "Uso: ./start.sh [front|back|all|build]"
    echo ""
    echo "  front  - Sobe frontend Vite (localhost:5173)"
    echo "  back   - Sobe backend Fastify"
    echo "  all    - Sobe frontend + backend em paralelo"
    echo "  build  - Build de producao"
    exit 1
    ;;
esac
