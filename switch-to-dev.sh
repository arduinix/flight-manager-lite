#!/bin/bash

echo "Switching to development mode with auto-reload..."
echo ""
echo "Stopping production containers..."
docker-compose down

echo ""
echo "Starting development containers..."
docker-compose -f docker-compose.dev.yml up --build

