#!/usr/bin/env bash
# Redis Keep-Alive Script
# Runs a PING against Upstash Redis to prevent auto-archiving.
# Schedule via cron: 0 12 * * 1  (every Monday at noon)
#
# Usage:
#   ./scripts/redis_keepalive.sh           # Single PING
#   ./scripts/redis_keepalive.sh --check   # Check connection only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"

# Load environment variables
if [ -f "$BACKEND_DIR/.env" ]; then
    export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
fi

if [ -z "${REDIS_URL:-}" ] || [[ "$REDIS_URL" == *"localhost"* ]]; then
    echo "⚠️  REDIS_URL not set or pointing to localhost. Skipping keep-alive."
    exit 0
fi

echo "🏓 Sending PING to Redis..."
"$BACKEND_DIR/venv/bin/python" "$BACKEND_DIR/manage.py" redis_keepalive --verbose
echo "⏰ Keep-alive sent at $(date -Iseconds)"
