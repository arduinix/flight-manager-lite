# Development Mode

This document describes how to run the application in development mode with auto-reload enabled.

## Quick Start

To run the application in development mode with auto-reload:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- **Frontend**: Next.js dev server on http://localhost:3000 (with hot-reload)
- **Backend**: FastAPI on http://localhost:8000 (with auto-reload)

## Development Mode Features

### Backend Auto-Reload
- The FastAPI backend automatically restarts when Python files in the `backend/` directory are changed
- Uses uvicorn's `--reload` flag
- Changes to `backend/`, `chart_scripts/`, and `nginx/` are reflected immediately

### Frontend Hot-Reload
- The Next.js frontend runs in development mode with hot module replacement
- Changes to React components are reflected instantly in the browser
- Available at http://localhost:3000

### Volume Mounts
The development setup mounts your local source code into the containers:
- `./backend` → `/app/backend` (Python code)
- `./frontend` → `/app/frontend` (Next.js code)
- `./chart_scripts` → `/app/chart_scripts` (Chart generation scripts)
- `./nginx` → `/app/nginx` (NGINX configuration)

## Production Mode

To run in production mode (with static export):

```bash
docker-compose up -d --build
```

This builds the frontend as static files and serves them via NGINX.

## Troubleshooting

### Frontend not updating
- Ensure you're accessing http://localhost:3000 (not port 80)
- Check that the frontend-dev container is running: `docker ps`

### Backend not reloading
- Check container logs: `docker logs flight-manager-backend-dev`
- Verify the volume mount is working: `docker exec flight-manager-backend-dev ls -la /app/backend`

### Port conflicts
- If port 3000 or 8000 are in use, modify the port mappings in `docker-compose.dev.yml`

