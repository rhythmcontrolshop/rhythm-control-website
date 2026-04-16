#!/usr/bin/env bash
set -euo pipefail

PROJECT="/Users/isaac/Documents/ISAAC/VIBECODE/RHYTHMCONTROL/CODE/rhythm-control-website-recovery"
BRANCH="recovery/avances"
cd "$PROJECT"

echo "═══════════════════════════════════════"
echo "  LOTE 6 — PUSH · PULL · DEPLOY"
echo "═══════════════════════════════════════"

# Find apply-lote6.sh
APPLY=""
for dir in "$PROJECT" "$HOME/Downloads" "$HOME/downloads" "$(pwd)"; do
  if [ -f "$dir/apply-lote6.sh" ]; then
    APPLY="$dir/apply-lote6.sh"
    break
  fi
done

if [ -z "$APPLY" ]; then
  echo ""
  echo "❌ No encuentro apply-lote6.sh"
  echo "   Mueve apply-lote6.sh al proyecto y repite:"
  echo "     mv ~/Downloads/apply-lote6.sh $PROJECT/"
  echo "     bash push-lote6.sh"
  exit 1
fi

# 1. Apply LOTE 6 files
echo ""
echo "▶ Aplicando LOTE 6 desde: $APPLY"
bash "$APPLY"

# 2. Git add + commit + push
echo ""
echo "▶ Git add + commit + push ..."
git add -A
git status --short
git commit -m "LOTE 6: AdminShell (nav hide on login), Events redirect, Discogs page+nav, Inventory inline qty input" || echo "  (nada nuevo para commitear)"
git push origin "$BRANCH"

echo ""
echo "═══════════════════════════════════════"
echo "  LOTE 6 DEPLOYADO ✓"
echo "═══════════════════════════════════════"
