#!/usr/bin/env bash
# KHOEM_AI launcher: API :8790, plus AI backend :8787 and UI :5175 when AI_DIR exists.
# Usage: ./ai.sh [run|stop|restart]   (env: AI_DIR, LOG_DIR)
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KHOEM_DIR="${KHOEM_DIR:-$ROOT/localization}"
AI_DIR="${AI_DIR:-$HOME/ai-project/AI}"
LOG_DIR="${LOG_DIR:-$HOME}"
PIDS=()
NAMES=()
LOGS=()

up() { curl -fsS -o /dev/null -m 2 "$1" 2>/dev/null; }

wait_for() {
  local url="$1" name="$2"
  for _ in $(seq 1 60); do
    up "$url" && { echo "  ✔ $name"; return 0; }
    sleep 1
  done
  echo "  ✘ $name not ready"; return 1
}

# start <name> <health-url> <dir> <logfile> <command...>
start() {
  local name="$1" url="$2" dir="$3" logf="$4"; shift 4
  if up "$url"; then echo "  • $name: already running (use ./ai.sh restart for new code)"; return 0; fi
  ( cd "$dir" && exec "$@" ) >"$logf" 2>&1 &
  PIDS+=("$!"); NAMES+=("$name"); LOGS+=("$logf")
  wait_for "$url" "$name" || { echo "    log: $logf"; exit 1; }
}

build_api() {
  cd "$KHOEM_DIR" || exit 1
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
  sleep 1
}

cleanup() {
  trap - INT TERM EXIT
  echo; echo "Stopping services started by this command..."
  for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null; done
  wait 2>/dev/null
  echo "Stopped."
}

run() {
  trap cleanup INT TERM EXIT
  echo "KHOEM_AI"
  build_api
  start "KHOEM_AI API   :8790" "http://127.0.0.1:8790/health" "$KHOEM_DIR" "$LOG_DIR/khoem-api.log" node "$KHOEM_DIR/dist/src/api/main.js"
  if [ -d "$AI_DIR" ]; then
    start "AI backend     :8787" "http://127.0.0.1:8787/api/status" "$AI_DIR" "$LOG_DIR/ai-server.log" node "$AI_DIR/server.mjs"
    start "AI UI          :5175" "http://127.0.0.1:5175/" "$AI_DIR" "$LOG_DIR/ai-ui.log" "$AI_DIR/node_modules/.bin/vite" --host 127.0.0.1
  else
    echo "  - AI project not found at $AI_DIR (API only)"
  fi
  echo; echo "Ready. Ctrl+C stops what this command started."
  while true; do
    sleep 2
    for i in "${!PIDS[@]}"; do
      p="${PIDS[$i]}"
      if [ -n "$p" ] && ! kill -0 "$p" 2>/dev/null; then
        wait "$p" 2>/dev/null; rc=$?
        echo "A service stopped: ${NAMES[$i]} (pid $p, exit code $rc) at $(date +%H:%M:%S)"
        echo "  log: ${LOGS[$i]}"
        tail -n 8 "${LOGS[$i]}" 2>/dev/null | sed "s/^/  | /"
        echo "  --- ps ---"
        ps -ef | grep -E "server\.mjs|vite|api/main\.js" | grep -v grep
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
