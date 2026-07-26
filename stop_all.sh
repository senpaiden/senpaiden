#!/usr/bin/env bash

# ============================================================
# SENPAI DEN — MASTER SHUTDOWN SCRIPT
# Gracefully stops all project services, Docker containers, 
# background workers, and releases active network ports.
# ============================================================

set -e

echo ""
echo "🛑 ==========================================================="
echo "🛑 STOPPING ALL SENPAI DEN PROJECT SERVICES & CONTAINERS"
echo "🛑 ==========================================================="
echo ""

# 1. Stop Docker Compose Containers (if active)
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  echo "🐳 Stopping Docker Compose services..."
  docker-compose down --remove-orphans 2>/dev/null || true
  echo "  ✓ Docker containers stopped."
else
  echo "ℹ️  Docker Compose not active or not installed."
fi

# 2. Stop Supabase Local Instance (if active)
if command -v npx &> /dev/null; then
  echo "⚡ Checking Supabase local instance..."
  npx supabase stop 2>/dev/null || true
  echo "  ✓ Supabase local instance stopped."
fi

# 3. Kill Background Node.js Services & Workers
echo "⚙️  Stopping background workers and dev servers..."

# Array of process patterns to terminate
PATTERNS=(
  "mock-providers/server.js"
  "wrangler"
  "hf-worker"
  "next dev"
  "next-server"
  "next-router-worker"
  "minio"
)

for pattern in "${PATTERNS[@]}"; do
  if pgrep -f "$pattern" > /dev/null; then
    echo "  - Terminating process: $pattern"
    pkill -9 -f "$pattern" 2>/dev/null || true
  fi
done

# 4. Force release specific project network ports
PORTS=(3000 4000 4001 8787 8788 54321 9000 9001)

echo "🔌 Releasing active network ports (${PORTS[*]})..."
for port in "${PORTS[@]}"; do
  PID=$(lsof -t -i:$port 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "  - Force killing process $PID on port $port..."
    kill -9 $PID 2>/dev/null || true
  fi
done

echo ""
echo "🎉 ==========================================================="
echo "🎉 ALL SENPAI DEN SERVICES HAVE BEEN SUCCESSFULLY SHUT DOWN!"
echo "🎉 All network ports freed. System memory released."
echo "🎉 ==========================================================="
echo ""
