#!/usr/bin/env bash
set -euo pipefail

RED=$'\e[31m'; YELLOW=$'\e[33m'; GREEN=$'\e[32m'; BLUE=$'\e[34m'; CYAN=$'\e[36m'; RESET=$'\e[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT/data"
ENV_FILE="$ROOT/prod.env"
CONTAINER=room-planner
IMAGE_UID=1000
URL=http://localhost:7744
HEALTH_TIMEOUT=60
ASSUME_YES=false

usage() {
    cat <<EOF
${BLUE}Room Planner restore${RESET}

Restores a backup made by bin/backup.sh. Validates the backup, moves the current
data/ and prod.env aside (not deleted), copies the backup in, fixes ownership to
UID $IMAGE_UID, restarts the container, and verifies the app serves HTTP 200.
On any failure it rolls back to the moved-aside state automatically.

Usage: bin/restore.sh [options] <backup-dir>

  <backup-dir>   A room-planner-<datetime> folder from backup.sh (must contain data/).

Options:
  --yes          Skip the confirmation prompt (for automation)
  -h, --help     Show this help
EOF
}

fail() { echo "${RED}ERROR: $*${RESET}" >&2; exit 1; }

BACKUP_DIR=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --yes) ASSUME_YES=true; shift ;;
        -h|--help) usage; exit 0 ;;
        -*) echo "${RED}Unknown option: $1${RESET}"; usage; exit 1 ;;
        *) BACKUP_DIR=${1%/}; shift ;;
    esac
done

[[ -n "$BACKUP_DIR" ]] || { echo "${RED}No backup dir given.${RESET}"; usage; exit 1; }
[[ $EUID -eq $IMAGE_UID || $EUID -eq 0 ]] || fail "Run as UID $IMAGE_UID or root (files must end up owned by UID $IMAGE_UID)."
docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER" || fail "Container '$CONTAINER' not found - run 'docker compose up -d' before restoring."
[[ -d "$BACKUP_DIR" ]] || fail "Backup dir '$BACKUP_DIR' does not exist."
[[ -d "$BACKUP_DIR/data" ]] || fail "'$BACKUP_DIR/data' missing - not a valid backup."
echo "${GREEN}Backup validated:${RESET} $BACKUP_DIR"
[[ -f "$BACKUP_DIR/prod.env" ]] || echo "${YELLOW}Backup has no prod.env - feedback emails stay disabled until one is added.${RESET}"

echo "${YELLOW}This will REPLACE $DATA_DIR${RESET}"
[[ -f "$BACKUP_DIR/prod.env" ]] && echo "${YELLOW}...and REPLACE $ENV_FILE${RESET}"
if [[ "$ASSUME_YES" != true ]]; then
    read -r -p "Proceed with restore? [y/N] " ANS
    [[ "${ANS,,}" == "y" || "${ANS,,}" == "yes" ]] || { echo "${CYAN}Aborted - nothing changed.${RESET}"; exit 0; }
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
DATA_ASIDE="$DATA_DIR.pre-restore-$STAMP"
ENV_ASIDE="$ENV_FILE.pre-restore-$STAMP"
RESTORE_OK=false
MOVED=false

cleanup() {
    [[ "$RESTORE_OK" != true && "$MOVED" == true ]] || return 0
    echo "${YELLOW}Rolling back to pre-restore state...${RESET}" >&2
    rm -rf "$DATA_DIR"
    [[ -d "$DATA_ASIDE" ]] && mv "$DATA_ASIDE" "$DATA_DIR"
    if [[ -f "$ENV_ASIDE" ]]; then
        rm -f "$ENV_FILE"
        mv "$ENV_ASIDE" "$ENV_FILE"
    fi
    docker restart "$CONTAINER" >/dev/null || true
    echo "${RED}Restore FAILED and was rolled back. Nothing lost.${RESET}" >&2
}
trap cleanup EXIT

echo "${CYAN}Stopping container...${RESET}"
docker stop "$CONTAINER" >/dev/null

echo "${CYAN}Moving current state aside (kept for rollback)...${RESET}"
[[ -d "$DATA_DIR" ]] && mv "$DATA_DIR" "$DATA_ASIDE"
[[ -f "$BACKUP_DIR/prod.env" && -f "$ENV_FILE" ]] && mv "$ENV_FILE" "$ENV_ASIDE"
MOVED=true

echo "${CYAN}Copying backup into place...${RESET}"
cp -a "$BACKUP_DIR/data" "$DATA_DIR"
[[ -f "$BACKUP_DIR/prod.env" ]] && cp -a "$BACKUP_DIR/prod.env" "$ENV_FILE"
chown -R "$IMAGE_UID:$IMAGE_UID" "$DATA_DIR"
[[ -f "$ENV_FILE" ]] && chown "$IMAGE_UID:$IMAGE_UID" "$ENV_FILE"

[[ -d "$DATA_DIR" ]] || fail "Post-copy check: $DATA_DIR missing - copy did not land."
OWNER="$(stat -c '%u' "$DATA_DIR")"
[[ "$OWNER" == "$IMAGE_UID" ]] || fail "Post-copy check: $DATA_DIR owned by UID $OWNER, expected $IMAGE_UID."

echo "${CYAN}Starting container...${RESET}"
docker start "$CONTAINER" >/dev/null

echo "${CYAN}Waiting for HTTP 200 from $URL (up to ${HEALTH_TIMEOUT}s)...${RESET}"
ELAPSED=0
CODE=""
while [[ $ELAPSED -lt $HEALTH_TIMEOUT ]]; do
    CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL/" || true)"
    [[ "$CODE" == "200" ]] && break
    STATUS="$(docker inspect --format '{{.State.Status}}' "$CONTAINER")"
    [[ "$STATUS" == "exited" || "$STATUS" == "dead" ]] && fail "Container is '$STATUS' - see 'docker logs $CONTAINER'."
    sleep 3; ELAPSED=$((ELAPSED + 3))
done
[[ "$CODE" == "200" ]] || fail "App did not return HTTP 200 within ${HEALTH_TIMEOUT}s (last: $CODE)."

RESTORE_OK=true
echo "${GREEN}Restore complete and app serves HTTP 200.${RESET}"
echo "${CYAN}Pre-restore copies kept at:${RESET}"
[[ -d "$DATA_ASIDE" ]] && echo "  $DATA_ASIDE"
[[ -f "$ENV_ASIDE" ]] && echo "  $ENV_ASIDE"
echo "${YELLOW}VERIFY before trusting this restore:${RESET}"
echo "${CYAN}  - Feedback log restored:  tail -n 3 $DATA_DIR/feedback.log${RESET}"
echo "${CYAN}  - Feedback form works:  curl -s -X POST -d 'feedback=restore test' $URL/feedback  (expect 'Thanks for the feedback')${RESET}"
if [[ ! -f /etc/cron.d/room-planner-backup ]]; then
    echo "${YELLOW}  - Backup cron is NOT installed - the schedule is stopped. Reinstall: sudo cp $ROOT/deploy/room-planner-backup /etc/cron.d/room-planner-backup${RESET}"
fi
echo "${CYAN}Only once verified, delete the pre-restore copies above.${RESET}"
