#!/usr/bin/env bash
# ==============================================================================
# Security/QA isolated environment launcher.
#
# Runs a FULL throwaway copy of the app on its own ports with its own SQLite DB:
#   - Backend API   -> http://localhost:8004/api/v1
#   - Frontend web  -> http://localhost:3001
#
# It NEVER touches the real (Supabase/afaqtest) database.
#
# Usage:
#   bash scripts/start_security_env.sh          # start both servers (foreground)
#   bash scripts/start_security_env.sh --reset  # wipe DB + reseed first
#   bash scripts/start_security_env.sh stop     # stop both servers
#
# Test accounts are written to /tmp/afaqsec/accounts.txt by the seeder.
# ==============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEC_DIR="${SECURITY_DIR:-/tmp/afaqsec}"
SEC_DB="${SEC_DIR}/security.db"
BACKEND_PORT="${SECURITY_BACKEND_PORT:-8004}"
FRONTEND_PORT="${SECURITY_FRONTEND_PORT:-3001}"
BACKEND_PID_FILE="${SEC_DIR}/backend.pid"
FRONTEND_PID_FILE="${SEC_DIR}/frontend.pid"
PYTHON_BIN="${SECURITY_PYTHON_BIN:-${ROOT}/backend/venv/bin/python}"

mkdir -p "${SEC_DIR}"

start_backend() {
  if [[ -f "${BACKEND_PID_FILE}" ]] && kill -0 "$(cat "${BACKEND_PID_FILE}")" 2>/dev/null; then
    echo "Backend already running (pid $(cat "${BACKEND_PID_FILE}"))."
    return
  fi
  echo "Starting backend on :${BACKEND_PORT} ..."
  cd "${ROOT}/backend"
  DJANGO_SETTINGS_MODULE=config.settings.security_test \
  SECURITY_DB_PATH="${SEC_DB}" \
  "${PYTHON_BIN}" manage.py migrate --noinput
  DJANGO_SETTINGS_MODULE=config.settings.security_test \
  SECURITY_DB_PATH="${SEC_DB}" \
  nohup "${PYTHON_BIN}" manage.py runserver "0.0.0.0:${BACKEND_PORT}" \
    > "${SEC_DIR}/backend.log" 2>&1 &
  echo $! > "${BACKEND_PID_FILE}"
  # wait for readiness
  for i in $(seq 1 30); do
    if curl -sf "http://localhost:${BACKEND_PORT}/api/v1/core/health/" >/dev/null 2>&1; then
      echo "Backend ready: http://localhost:${BACKEND_PORT}/api/v1"
      return
    fi
    sleep 1
  done
  echo "Backend did not become ready in time — check ${SEC_DIR}/backend.log" >&2
  exit 1
}

start_frontend() {
  if [[ -f "${FRONTEND_PID_FILE}" ]] && kill -0 "$(cat "${FRONTEND_PID_FILE}")" 2>/dev/null; then
    echo "Frontend already running (pid $(cat "${FRONTEND_PID_FILE}"))."
    return
  fi
  echo "Starting frontend on :${FRONTEND_PORT} ..."
  cd "${ROOT}/frontend"
  NEXT_PUBLIC_API_URL="http://localhost:${BACKEND_PORT}/api/v1" \
  NEXT_PUBLIC_SITE_URL="http://localhost:${FRONTEND_PORT}" \
  NEXT_DIST_DIR=".next-security" \
  nohup npx next dev -p "${FRONTEND_PORT}" > "${SEC_DIR}/frontend.log" 2>&1 &
  echo $! > "${FRONTEND_PID_FILE}"
  for i in $(seq 1 60); do
    if curl -sf "http://localhost:${FRONTEND_PORT}/en" >/dev/null 2>&1; then
      echo "Frontend ready: http://localhost:${FRONTEND_PORT}"
      return
    fi
    sleep 1
  done
  echo "Frontend did not become ready in time — check ${SEC_DIR}/frontend.log" >&2
  exit 1
}

stop() {
  for pidfile in "${BACKEND_PID_FILE}" "${FRONTEND_PID_FILE}"; do
    if [[ -f "${pidfile}" ]]; then
      PID="$(cat "${pidfile}")"
      kill "${PID}" 2>/dev/null && echo "Stopped pid ${PID}" || true
      rm -f "${pidfile}"
    fi
  done
  echo "Security environment stopped."
}

reset_db() {
  rm -f "${SEC_DB}"
  echo "DB reset: ${SEC_DB}"
  cd "${ROOT}/backend"
  DJANGO_SETTINGS_MODULE=config.settings.security_test \
  SECURITY_DB_PATH="${SEC_DB}" \
  "${PYTHON_BIN}" manage.py migrate --noinput
  DJANGO_SETTINGS_MODULE=config.settings.security_test \
  SECURITY_DB_PATH="${SEC_DB}" \
  "${PYTHON_BIN}" scripts/seed_security_test.py
}

main() {
  case "${1:-start}" in
    stop) stop ;;
    reset)
      stop
      reset_db
      echo "Seeded. Now run: bash scripts/start_security_env.sh start"
      ;;
    start|*)
      if [[ ! -f "${SEC_DB}" ]]; then
        reset_db
      fi
      start_backend
      start_frontend
      echo ""
      echo "  Frontend:  http://localhost:${FRONTEND_PORT}"
      echo "  Backend:   http://localhost:${BACKEND_PORT}/api/v1"
      echo "  Accounts:  cat ${SEC_DIR}/accounts.txt  (admin → admin.sec@afaq.app / AdminPass123!)"
      echo "  Logs:      ${SEC_DIR}/backend.log  ${SEC_DIR}/frontend.log"
      ;;
  esac
}

main "$@"
