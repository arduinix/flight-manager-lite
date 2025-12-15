# Flight Manager Lite

A single-container analysis tool for managing model rocket payloads and flights. Upload flight data via CSV files and automatically generate charts for analysis.

## Features

- **Payload Management**: Create and manage multiple payloads with optional owner and default weight
- **Flight Tracking**: Track multiple flights per payload with date, time, location, and custom weight
- **CSV Upload**: Upload flight data CSV files for analysis
- **Chart Generation**: Automatically generate charts from flight data using Python scripts
- **Single Container**: All components (frontend, API, database) run in one container

## Architecture

- **Frontend**: Next.js with React, TypeScript, and Material UI
- **Backend**: FastAPI (Python) with SQLAlchemy ORM
- **Database**: SQLite
- **Web Server**: NGINX for static files and API proxy
- **Chart Generation**: Python scripts using pandas, numpy, scipy, and plotly

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running the Application

#### Production Mode

1. Build and start the container:
```bash
docker-compose up -d --build
```

2. Access the application at `http://localhost`

#### Development Mode (with Auto-Reload)

For development with automatic code reloading:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This starts:
- **Frontend**: Next.js dev server on http://localhost:3000 (with hot-reload)
- **Backend**: FastAPI on http://localhost:8000 (with auto-reload)

See [README-DEV.md](README-DEV.md) for more details.

### Development

For local development without Docker:

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

1. **Create a Payload**: Navigate to the Payloads page and click "Add Payload"
2. **Create a Flight**: Click on a payload to view its flights, then add a new flight
3. **Upload CSV Data**: Open a flight and upload CSV files containing flight data
4. **Generate Charts**: Click "Generate Charts" to create visualizations from your CSV data

## Chart Scripts

Custom chart generation scripts can be added to the `chart_scripts/` directory. Scripts should:
- Read environment variables: `FLIGHT_ID`, `FLIGHT_DIR`, `FLIGHT_CHARTS_DIR`, `CSV_FILES`
- Generate charts using pandas, numpy, scipy, and plotly
- Save charts as HTML files in `FLIGHT_CHARTS_DIR`
- Print the chart filename to stdout (one per line)

See `chart_scripts/altitude_chart.py` and `chart_scripts/velocity_chart.py` for examples.

## Example Data

An example CSV file (`example_flight_data.csv`) is included in the repository for testing. This file contains sample flight data with time, altitude, and velocity columns that can be used to test the chart generation functionality.

## Data Persistence

Data is persisted in Docker volumes:
- `flight-data`: Contains flight CSV files and generated charts
- `flight-db`: Contains the SQLite database file

## License

MIT

