#!/bin/bash
set -e

PROJECT="/Users/isaac/Documents/ISAAC/VIBECODE/RHYTHMCONTROL/CODE/rhythm-control-website-recovery"
BRANCH="recovery/avances"
SCRIPT_NAME="apply-lote7.sh"

echo "=== LOTE 7 — PUSH TO GIT ==="
echo ""

# Find the apply script
SCRIPT=""
if [ -f "$HOME/Downloads/$SCRIPT_NAME" ]; then
  SCRIPT="$HOME/Downloads/$SCRIPT_NAME"
elif [ -f "./$SCRIPT_NAME" ]; then
  SCRIPT="./$SCRIPT_NAME"
elif [ -f "$PROJECT/$SCRIPT_NAME" ]; then
  SCRIPT="$PROJECT/$SCRIPT_NAME"
else
  echo "ERROR: No se encuentra $SCRIPT_NAME"
  echo "Buscado en: ~/Downloads/, directorio actual, $PROJECT"
  exit 1
fi

echo "Script encontrado: $SCRIPT"
echo "Proyecto: $PROJECT"
echo "Branch: $BRANCH"
echo ""

# Copy script to project root
cp "$SCRIPT" "$PROJECT/$SCRIPT_NAME"
echo "✓ Script copiado al proyecto"

# Navigate to project
cd "$PROJECT"

# Apply the changes
echo ""
echo "=== Aplicando cambios ==="
bash "$SCRIPT_NAME" .

# Git operations
echo ""
echo "=== Git commit + push ==="
git add -A
git commit -m "LOTE 7: Hero home, stock page, admin fix, favoritos fix, cuenta button styles, layout reorder" || echo "Nothing to commit"
git push origin "$BRANCH"

echo ""
echo "=== LOTE 7 desplegado ==="
echo "Vercel desplegará automáticamente."
echo "Si no detecta cambios: Dashboard → Deployments → ... → Redeploy"
