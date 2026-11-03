#!/usr/bin/env bash
# KHOEM_AI launcher: API :8790, plus AI backend :8787 and UI :5175 when AI_DIR exists.
# Usage: ./ai.sh [run|stop|restart]   (env: AI_DIR, KHOEM_DIR, LOG_DIR)
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
KHOEM_DIR="${KHOEM_DIR:-$ROOT/localization}"
AI_DIR="${AI_DIR:-$HOME/ai-project/AI}"
LOG_DIR="${LOG_DIR:-$HOME}"
CIDC_DIR="${CIDC_DIR:-$HOME/storage/downloads/Central-Intelligence-Data-Core}"
PIDS=()
NAMES=()
LOGS=()
CLEANED=0

need() { command -v "$1" >/dev/null 2>&1 || { echo "  ✘ missing command: $1" >&2; exit 1; }; }
up() { curl -fsS -o /dev/null -m 2 "$1" 2>/dev/null; }

# wait_for <url> <name> [pid]: stops waiting early if the process died
wait_for() {
  local url="$1" name="$2" pid="${3:-}" i
  for i in $(seq 1 60); do
    up "$url" && { echo "  ✔ $name"; return 0; }
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then break; fi
    sleep 1
  done
  echo "  ✘ $name not ready"; return 1
}

# start <name> <health-url> <dir> <logfile> <command...>
start() {
  local name="$1" url="$2" dir="$3" logf="$4"
  shift 4
  if up "$url"; then echo "  • $name: already running (use ./ai.sh restart for new code)"; return 0; fi
  ( cd "$dir" && exec "$@" ) >"$logf" 2>&1 &
  local pid=$!
  PIDS+=("$pid"); NAMES+=("$name"); LOGS+=("$logf")
  wait_for "$url" "$name" "$pid" || { echo "    log: $logf"; tail -n 8 "$logf" 2>/dev/null | sed 's/^/    | /'; exit 1; }
}

build_api() {
  cd "$KHOEM_DIR" || { echo "  ✘ KHOEM_DIR not found: $KHOEM_DIR" >&2; exit 1; }
  if [ ! -f dist/.stamp ] || [ -n "$(find src tsconfig.json -type f -newer dist/.stamp 2>/dev/null | head -1)" ]; then
    echo "  … building API"
    npm run build >"$LOG_DIR/khoem-build.log" 2>&1 || { echo "  ✘ build failed: $LOG_DIR/khoem-build.log"; exit 1; }
    touch dist/.stamp
  fi
}

stop_all() {
  pkill -f "$KHOEM_DIR/dist/src/api/main.js" 2>/dev/null
  pkill -f "$AI_DIR/server.mjs" 2>/dev/null
  pkill -f "$AI_DIR/node_modules/.bin/vite" 2>/dev/null
  pkill -f "$CIDC_DIR/src/server.js" 2>/dev/null
  pkill -f "$CIDC_DIR/src/ui.js" 2>/dev/null
  sleep 1
}

alive_count() {
  local n=0 p
  for p in "${PIDS[@]}"; do kill -0 "$p" 2>/dev/null && n=$((n + 1)); done
  echo "$n"
}

cleanup() {
  [ "$CLEANED" = 1 ] && return 0
  CLEANED=1
  trap - INT TERM EXIT
  [ "${#PIDS[@]}" -gt 0 ] || return 0
  echo; echo "Stopping services started by this command..."
  local p i
  for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null; done
  for i in $(seq 1 20); do [ "$(alive_count)" = 0 ] && break; sleep 0.25; done
  for p in "${PIDS[@]}"; do kill -9 "$p" 2>/dev/null; wait "$p" 2>/dev/null; done
  echo "Stopped."
}

run() {
  need node; need curl
  # exit inside the trap -> EXIT trap runs cleanup once, no false "service stopped" message
  trap 'exit 130' INT
  trap 'exit 143' TERM
  trap cleanup EXIT
  echo "KHOEM_AI"
  build_api
  start "KHOEM_AI API   :8790" "http://127.0.0.1:8790/health" "$KHOEM_DIR" "$LOG_DIR/khoem-api.log" node "$KHOEM_DIR/dist/src/api/main.js"
  if [ -f "$CIDC_DIR/src/server.js" ]; then
    [ -f "$HOME/.cidc_env" ] && . "$HOME/.cidc_env"
    if [ -n "${CIDC_TOKEN:-}" ]; then
      start "CIDC API       :8800" "http://127.0.0.1:8800/api/cidc/health" "$CIDC_DIR" "$LOG_DIR/cidc.log" env PORT=8800 node "$CIDC_DIR/src/server.js"
      start "CIDC UI        :5190" "http://127.0.0.1:5190/" "$CIDC_DIR" "$LOG_DIR/cidc-ui.log" env UI_PORT=5190 node "$CIDC_DIR/src/ui.js"
    else
      echo "  - CIDC: no token in ~/.cidc_env (skipped)"
    fi
  else
    echo "  - CIDC not found at $CIDC_DIR (skipped)"
  fi
  if [ -d "$AI_DIR" ]; then
    start "AI backend     :8787" "http://127.0.0.1:8787/api/status" "$AI_DIR" "$LOG_DIR/ai-server.log" node "$AI_DIR/server.mjs"
    start "AI UI          :5175" "http://127.0.0.1:5175/" "$AI_DIR" "$LOG_DIR/ai-ui.log" "$AI_DIR/node_modules/.bin/vite" --host 127.0.0.1
  else
    echo "  - AI project not found at $AI_DIR (API only)"
  fi
  echo; echo "Ready. Ctrl+C stops what this command started."
  local i p rc
  while true; do
    sleep 2
    [ "${#PIDS[@]}" -gt 0 ] || continue
    for i in "${!PIDS[@]}"; do
      p="${PIDS[$i]}"
      if ! kill -0 "$p" 2>/dev/null; then
        wait "$p" 2>/dev/null; rc=$?
        # killed by INT/TERM (130/143): a Ctrl+C / stop signal is most likely on its way to us, give it time
        case "$rc" in 130|143) sleep 3 ;; esac
        echo "A service stopped: ${NAMES[$i]} (pid $p, exit code $rc) at $(date +%H:%M:%S)"
        echo "  log: ${LOGS[$i]}"
        tail -n 8 "${LOGS[$i]}" 2>/dev/null | sed 's/^/  | /'
        exit 1
      fi
    done
  done
}

case "${1:-run}" in
  run) run ;;
  stop) stop_all; echo "stopped" ;;
  restart) stop_all; run ;;
  *) echo "usage: $0 [run|stop|restart]"; exit 1 ;;
esac
