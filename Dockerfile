# Multi-stage build for Flight Manager Lite

# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/ .

# Build Next.js app
RUN npm run build

# Stage 2: Python backend base (for development)
FROM python:3.11-slim AS python-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Create data directories
RUN mkdir -p /app/data/flights /app/data/charts && \
    chmod -R 755 /app/data

# Copy startup scripts
COPY start.sh /app/start.sh
COPY start-dev.sh /app/start-dev.sh
RUN chmod +x /app/start.sh /app/start-dev.sh

EXPOSE 80 8000

# Stage 3: Production (builds frontend)
FROM python-base AS production

# Copy backend code
COPY backend/ ./backend/

# Copy chart scripts
COPY chart_scripts/ ./chart_scripts/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/out /usr/share/nginx/html

CMD ["/app/start.sh"]

