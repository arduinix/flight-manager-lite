#!/bin/bash
set -e

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    kill $UVICORN_PID 2>/dev/null || true
    nginx -s quit 2>/dev/null || true
    wait
    exit 0
}

trap cleanup SIGTERM SIGINT

# Create database directory if it doesn't exist
mkdir -p /app/db

# Start FastAPI in the background
cd /app/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!

# Start nginx in foreground (this will block until nginx stops)
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for both processes
wait -n
cleanup

