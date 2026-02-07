#!/usr/bin/env bash
set -euo pipefail

echo "📦 Installing frontend dependencies..."
cd /workspace/frontend
npm install

echo "🐍 Installing Python MCP server dependencies..."
cd /workspace/mcp-servers
pip install -r requirements.txt

echo ""
echo "============================================"
echo "  🗺️  Living Literary Map — Setup Complete"
echo "============================================"
echo ""
echo "  Frontend:  cd frontend && npm run dev"
echo "  MCP:       cd mcp-servers && python manage.py runserver 0.0.0.0:8000"
echo ""
echo "  Don't forget to set your env vars:"
echo "    MAPBOX_ACCESS_TOKEN"
echo "    DEDALUS_API_KEY"
echo "============================================"
