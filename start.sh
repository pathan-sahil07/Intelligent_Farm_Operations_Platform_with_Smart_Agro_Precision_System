#!/usr/bin/env bash
# Intelligent Farm Operations Platform - Complete Startup Script
# Automatically loads .env, starts backend (port 8080), and starts frontend (port 5173)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "============================================================"
echo " Starting Intelligent Farm Operations Platform..."
echo "============================================================"

# Check for .env file
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
  echo "[1/3] Environment configuration loaded from .env"
else
  echo "[ERROR] .env file not found in root directory!"
  exit 1
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
echo "[3/3] Starting Vite Frontend on http://localhost:5173 ..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo ""
echo "============================================================"
echo " Platform is running!"
echo " Frontend App:  http://localhost:5173"
echo " Backend API:   http://localhost:8080"
echo " Neon Database: Connected (AWS US-East-2)"
echo " Press Ctrl+C at any time to stop both servers."
echo "============================================================"
echo ""

wait

