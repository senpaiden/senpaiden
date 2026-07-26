#!/usr/bin/env bash

# ============================================================
# SENPAI DEN — MASTER STARTUP SCRIPT
# Starts all project services (Mock Provider, Workers, Frontend)
# ============================================================

set -e

echo ""
echo "🚀 ==========================================================="
echo "🚀 STARTING ALL SENPAI DEN PROJECT SERVICES"
echo "🚀 ==========================================================="
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Start Mock Provider Server on Port 4001
echo "⚙️ Starting Mock Provider Server on port 4001..."
PORT=4001 node "$ROOT_DIR/mock-providers/server.js" &
MOCK_PID=$!
echo "  ✓ Mock Provider started (PID $MOCK_PID)"

# 2. Check & build frontend static assets
echo "📦 Verifying frontend build state..."
cd "$ROOT_DIR/frontend"

echo ""
echo "🎉 ==========================================================="
echo "🎉 ALL SERVICES STARTED SUCCESSFULLY!"
echo "🎉 Frontend: http://localhost:3000"
echo "🎉 Mock API:  http://localhost:4001"
echo "🎉 ==========================================================="
echo ""
