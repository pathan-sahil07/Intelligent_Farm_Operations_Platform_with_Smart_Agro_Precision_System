#!/usr/bin/env bash
# Intelligent Farm Operations Platform - Complete Startup Script
# Automatically loads .env, starts backend (port 8080), and starts frontend (port 5173/5174)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "============================================================"
echo " Starting Intelligent Farm Operations Platform..."
echo "============================================================"

# Check for .env file in root or backend-java
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
  echo "[1/3] Environment configuration loaded from .env"
elif [ -f "backend-java/.env" ]; then
  set -a
  source backend-java/.env
  set +a
  echo "[1/3] Environment configuration loaded from backend-java/.env"
else
  echo "[WARNING] No .env file found; using default environment properties."
fi

# Function to clean up child processes on exit
cleanup() {
  echo ""
  echo "Stopping all services..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
  fi
  echo "Servers stopped cleanly."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "[2/3] Starting Spring Boot Backend on http://localhost:8080 ..."
./backend-java/mvnw -f backend-java/pom.xml spring-boot:run &
BACKEND_PID=$!

# Start Frontend
echo "[3/3] Starting Vite Frontend ..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo ""
echo "============================================================"
echo " Platform is running!"
echo " Backend API:   http://localhost:8080"
echo " Press Ctrl+C at any time to stop both servers."
echo "============================================================"
echo ""

wait

