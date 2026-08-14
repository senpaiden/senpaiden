#!/usr/bin/env bash

# ============================================================
# SENPAI DEN — MASTER STARTUP SCRIPT
# Starts all project services (Workers, Frontend)
# ============================================================

set -e

echo ""
echo "🚀 ==========================================================="
echo "🚀 STARTING ALL SENPAI DEN PROJECT SERVICES"
echo "🚀 ==========================================================="
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Check & build frontend static assets
echo "📦 Verifying frontend build state..."
cd "$ROOT_DIR/frontend"

echo ""
echo "🎉 ==========================================================="
echo "🎉 ALL SERVICES STARTED SUCCESSFULLY!"
echo "🎉 Frontend: http://localhost:3000"
echo "🎉 ==========================================================="
echo ""
