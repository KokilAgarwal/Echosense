#!/bin/bash
# ==============================================================================
# EchoSense Vellore - Local Startup Script
# Fixed Geographical Location: Vellore, Tamil Nadu, India (12.9165 N, 79.1325 E)
# ==============================================================================

echo "------------------------------------------------------------------"
echo "🚀 Starting EchoSense Vellore Platform..."
echo "📍 Location: Vellore, Tamil Nadu, India (12.9165° N, 79.1325° E)"
echo "🌐 Browser Link: http://localhost:5001"
echo "------------------------------------------------------------------"

# Navigate to backend directory relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend" || exit 1

# Run FastAPI backend with Uvicorn on Port 5001 (Mounted with Frontend)
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 5001 --reload
