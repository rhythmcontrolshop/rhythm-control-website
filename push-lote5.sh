#!/usr/bin/env bash
set -euo pipefail

PROJECT="/Users/isaac/Documents/ISAAC/VIBECODE/RHYTHMCONTROL/CODE/rhythm-control-website-recovery"
BRANCH="recovery/avances"
cd "$PROJECT"

echo "═══════════════════════════════════════"
echo "  LOTE 5 — PUSH · PULL · DEPLOY"
echo "═══════════════════════════════════════"

# 1. Apply LOTE 5 files
echo ""
echo "▶ Aplicando apply-lote5.sh ..."
bash "$PROJECT/apply-lote5.sh"

# 2. Git add + commit + push
echo ""
echo "▶ Git add + commit + push ..."
git add -A
git status --short
git commit -m "LOTE 5: 11 fixes — Guardi API, Admin Dashboard/Pedidos, Nav BARCELONA hover, Favorites COMPRAR, Cart stock limit, RecordCard heart" || echo "  (nada nuevo para commitear)"
git push origin "$BRANCH"

# 3. Pull on Vercel — Vercel auto-deploys from push, but if you need manual pull:
echo ""
echo "▶ Vercel despliega automáticamente al detectar el push."
echo "  Si usas servidor propio, haz:  git pull origin $BRANCH"
echo ""
echo "═══════════════════════════════════════"
echo "  LOTE 5 DEPLOYADO ✓"
echo "═══════════════════════════════════════"
