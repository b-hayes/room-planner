#!/usr/bin/env bash
set -euo pipefail

RED=$'\e[31m'; GREEN=$'\e[32m'; BLUE=$'\e[34m'; CYAN=$'\e[36m'; RESET=$'\e[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT/data"
ENV_FILE="$ROOT/prod.env"
DEST_BASE=/array/backup
KEEP=7

usage() {
    cat <<EOF
${BLUE}Room Planner backup${RESET}

Copies the app state (data/) and the optional prod.env secrets file to a
timestamped dir on the array. data/ is a plain log file, so it is copied live.

Usage: bin/backup.sh [options]

Options:
  --dest DIR      Base backup dir           (default: $DEST_BASE)
  --keep N        Keep the N newest backups (default: $KEEP; 0 = keep all)
  -h, --help      Show this help
EOF
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --dest) DEST_BASE=$2; shift 2 ;;
        --keep) KEEP=$2; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) echo "${RED}Unknown option: $1${RESET}"; usage; exit 1 ;;
    esac
done

[[ -d "$DATA_DIR" ]] || { echo "${RED}Data dir not found: $DATA_DIR${RESET}"; exit 1; }

DEST="$DEST_BASE/room-planner-$(date +%Y-%b-%d-%I-%p)"

echo "${BLUE}Backing up Room Planner${RESET}"
echo "${CYAN}Destination: $DEST${RESET}"
mkdir -p "$DEST"

cp -a "$DATA_DIR" "$DEST/data"
if [[ -f "$ENV_FILE" ]]; then
    echo "${CYAN}Copying prod.env...${RESET}"
    cp -a "$ENV_FILE" "$DEST/prod.env"
fi

SIZE="$(du -sh "$DEST" | cut -f1)"
echo "${GREEN}Backup complete: $DEST ($SIZE)${RESET}"

if [[ "$KEEP" -gt 0 ]]; then
    mapfile -t OLD < <(ls -1dt "$DEST_BASE"/room-planner-* | tail -n +$((KEEP + 1)))
    for d in "${OLD[@]}"; do
        echo "${CYAN}Pruning old backup: $d${RESET}"
        rm -rf "$d"
    done
fi

echo "${GREEN}Done.${RESET}"
