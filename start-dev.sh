#!/bin/bash
set -e

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    kill $UVICORN_PID 2>/dev/null || true
    wait
    exit 0
}

trap cleanup SIGTERM SIGINT

# Create database directory if it doesn't exist
mkdir -p /app/db

# Start FastAPI with auto-reload
cd /app/backend
echo "Starting FastAPI in development mode with auto-reload..."
echo "API will be available at http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"

# Start uvicorn with reload in the background
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-dir /app/backend &
UVICORN_PID=$!

# Wait for uvicorn
wait $UVICORN_PID
cleanup

