#!/bin/bash
set -e

echo "================================"
echo "  VideoChat App Setup & Start"
echo "================================"

# Install Python backend deps
echo ""
echo "[1/4] Installing Python dependencies..."
cd "$(dirname "$0")/backend"
pip install -r requirements.txt --break-system-packages -q

# Install frontend deps
echo ""
echo "[2/4] Installing Node dependencies..."
cd "../frontend"
npm install --silent

# Build frontend
echo ""
echo "[3/4] Building React frontend..."
npm run build

# Copy build to backend static folder
echo ""
echo "[4/4] Preparing backend static files..."
cp -r build ../backend/static 2>/dev/null || true

echo ""
echo "================================"
echo "  Setup complete!"
echo ""
echo "  To start the server:"
echo "  cd backend && ANTHROPIC_API_KEY=sk-... python app.py"
echo ""
echo "  Then open: http://localhost:5000"
echo "================================"
