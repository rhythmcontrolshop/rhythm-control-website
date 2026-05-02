#!/usr/bin/env bash
set -e

BRANCH="claude/setup-repo-update-script-16MVz"
REMOTE="origin"
COMMIT_MSG="${1:-"chore: sync local changes $(date '+%Y-%m-%d %H:%M')"}"

RED='\033[0;31m'; GRN='\033[0;32m'; YEL='\033[1;33m'; BLU='\033[0;34m'; NC='\033[0m'

echo -e "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLU}  RHYTHM CONTROL — Sync to GitHub${NC}"
echo -e "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Asegurar branch correcto
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "$BRANCH" ]; then
  echo -e "${YEL}⚠ Cambiando a '$BRANCH'...${NC}"
  git fetch "$REMOTE" "$BRANCH" 2>/dev/null || true
  git checkout -B "$BRANCH" "$REMOTE/$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"
fi

echo -e "${GRN}▸ Branch:${NC} $BRANCH"

# Mostrar cambios
echo -e "${GRN}▸ Cambios:${NC}"
git status --short | head -40

CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$CHANGES" -eq 0 ]; then
  echo -e "${YEL}Sin cambios. El repo ya está al día.${NC}"; exit 0
fi

# Commit (excluye secrets y builds)
git add --all -- \
  ':!.env' ':!.env.local' ':!.env.*.local' \
  ':!node_modules' ':!.next' ':!*.log' \
  2>/dev/null || git add --all

echo -e "${GRN}▸ Commit:${NC} \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

# Push con reintentos
DELAYS=(2 4 8 16); PUSHED=false
for i in 0 1 2 3; do
  if git push -u "$REMOTE" "$BRANCH"; then PUSHED=true; break; fi
  echo -e "${YEL}⚠ Reintentando en ${DELAYS[$i]}s...${NC}"; sleep "${DELAYS[$i]}"
done

$PUSHED || { echo -e "${RED}ERROR: Push fallido.${NC}"; exit 1; }

echo -e "${GRN}✔ Subido correctamente. Claude ya puede ver tus cambios.${NC}"
