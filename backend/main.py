from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import subprocess
import uuid
from datetime import datetime

from database import get_db, init_db
from models import Payload, Flight, CSVFile, Chart
from schemas import (
    Payload as PayloadSchema,
    PayloadCreate,
    PayloadUpdate,
    Flight as FlightSchema,
    FlightCreate,
    FlightUpdate,
    CSVFile as CSVFileSchema,
    Chart as ChartSchema,
)

# Initialize database on startup
init_db()

app = FastAPI(title="Flight Manager Lite API")

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory configuration
FLIGHTS_DIR = os.getenv("FLIGHTS_DIR", "/app/data/flights")
CHART_SCRIPTS_DIR = os.getenv("CHART_SCRIPTS_DIR", "/app/chart_scripts")
CHARTS_DIR = os.getenv("CHARTS_DIR", "/app/data/charts")

os.makedirs(FLIGHTS_DIR, exist_ok=True)
os.makedirs(CHART_SCRIPTS_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)


# Payload endpoints
@app.get("/api/payloads", response_model=List[PayloadSchema])
def get_payloads(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    payloads = db.query(Payload).offset(skip).limit(limit).all()
    return payloads


@app.get("/api/payloads/{payload_id}", response_model=PayloadSchema)
def get_payload(payload_id: str, db: Session = Depends(get_db)):
    payload = db.query(Payload).filter(Payload.id == payload_id).first()
    if not payload:
        raise HTTPException(status_code=404, detail="Payload not found")
    return payload


@app.post("/api/payloads", response_model=PayloadSchema)
def create_payload(payload: PayloadCreate, db: Session = Depends(get_db)):
    db_payload = Payload(**payload.dict())
    db.add(db_payload)
    db.commit()
    db.refresh(db_payload)
    return db_payload


@app.put("/api/payloads/{payload_id}", response_model=PayloadSchema)
def update_payload(payload_id: str, payload_update: PayloadUpdate, db: Session = Depends(get_db)):
    db_payload = db.query(Payload).filter(Payload.id == payload_id).first()
    if not db_payload:
        raise HTTPException(status_code=404, detail="Payload not found")
    
    update_data = payload_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payload, key, value)
    
    db.commit()
    db.refresh(db_payload)
    return db_payload


@app.delete("/api/payloads/{payload_id}")
def delete_payload(payload_id: str, db: Session = Depends(get_db)):
    db_payload = db.query(Payload).filter(Payload.id == payload_id).first()
    if not db_payload:
        raise HTTPException(status_code=404, detail="Payload not found")
    
    db.delete(db_payload)
    db.commit()
    return {"message": "Payload deleted successfully"}


# Flight endpoints
@app.get("/api/flights", response_model=List[FlightSchema])
def get_flights(payload_id: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Flight)
    if payload_id:
        query = query.filter(Flight.payload_id == payload_id)
    flights = query.offset(skip).limit(limit).all()
    return flights


@app.get("/api/flights/{flight_id}", response_model=FlightSchema)
def get_flight(flight_id: str, db: Session = Depends(get_db)):
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


@app.post("/api/flights", response_model=FlightSchema)
def create_flight(flight: FlightCreate, db: Session = Depends(get_db)):
    # Verify payload exists
    payload = db.query(Payload).filter(Payload.id == flight.payload_id).first()
    if not payload:
        raise HTTPException(status_code=404, detail="Payload not found")
    
    # Create flight directory
    flight_dir = os.path.join(FLIGHTS_DIR, flight.payload_id)
    os.makedirs(flight_dir, exist_ok=True)
    
    db_flight = Flight(**flight.dict())
    db.add(db_flight)
    db.commit()
    db.refresh(db_flight)
    
    # Create flight-specific directory with flight ID
    flight_specific_dir = os.path.join(flight_dir, db_flight.id)
    os.makedirs(flight_specific_dir, exist_ok=True)
    
    return db_flight


@app.put("/api/flights/{flight_id}", response_model=FlightSchema)
def update_flight(flight_id: str, flight_update: FlightUpdate, db: Session = Depends(get_db)):
    db_flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not db_flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    update_data = flight_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_flight, key, value)
    
    db.commit()
    db.refresh(db_flight)
    return db_flight


@app.delete("/api/flights/{flight_id}")
def delete_flight(flight_id: str, db: Session = Depends(get_db)):
    db_flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not db_flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Delete flight directory and all its contents
    payload_dir = os.path.join(FLIGHTS_DIR, db_flight.payload_id)
    flight_dir = os.path.join(payload_dir, db_flight.id)
    if os.path.exists(flight_dir):
        shutil.rmtree(flight_dir)
    
    db.delete(db_flight)
    db.commit()
    return {"message": "Flight deleted successfully"}


# CSV file upload endpoint
@app.post("/api/flights/{flight_id}/csv", response_model=CSVFileSchema)
def upload_csv(flight_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not db_flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Create flight directory if it doesn't exist
    payload_dir = os.path.join(FLIGHTS_DIR, db_flight.payload_id)
    flight_dir = os.path.join(payload_dir, db_flight.id)
    os.makedirs(flight_dir, exist_ok=True)
    
    # Save uploaded file
    file_path = os.path.join(flight_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create CSVFile record
    db_csv_file = CSVFile(
        flight_id=flight_id,
        filename=file.filename,
        file_path=file_path
    )
    db.add(db_csv_file)
    db.commit()
    db.refresh(db_csv_file)
    
    return db_csv_file


@app.get("/api/flights/{flight_id}/csv", response_model=List[CSVFileSchema])
def get_flight_csv_files(flight_id: str, db: Session = Depends(get_db)):
    csv_files = db.query(CSVFile).filter(CSVFile.flight_id == flight_id).all()
    return csv_files


@app.delete("/api/csv/{csv_id}")
def delete_csv_file(csv_id: str, db: Session = Depends(get_db)):
    db_csv_file = db.query(CSVFile).filter(CSVFile.id == csv_id).first()
    if not db_csv_file:
        raise HTTPException(status_code=404, detail="CSV file not found")
    
    # Delete file from disk
    if os.path.exists(db_csv_file.file_path):
        os.remove(db_csv_file.file_path)
    
    db.delete(db_csv_file)
    db.commit()
    return {"message": "CSV file deleted successfully"}


# Chart generation endpoint
@app.post("/api/flights/{flight_id}/charts/generate", response_model=List[ChartSchema])
def generate_charts(flight_id: str, db: Session = Depends(get_db)):
    db_flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not db_flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Get all CSV files for this flight
    csv_files = db.query(CSVFile).filter(CSVFile.flight_id == flight_id).all()
    if not csv_files:
        raise HTTPException(status_code=400, detail="No CSV files found for this flight")
    
    # Create charts directory for this flight
    payload_dir = os.path.join(FLIGHTS_DIR, db_flight.payload_id)
    flight_dir = os.path.join(payload_dir, db_flight.id)
    flight_charts_dir = os.path.join(flight_dir, "charts")
    os.makedirs(flight_charts_dir, exist_ok=True)
    
    generated_charts = []
    
    # Run all chart scripts
    chart_scripts = [f for f in os.listdir(CHART_SCRIPTS_DIR) if f.endswith('.py')]
    
    for script_name in chart_scripts:
        script_path = os.path.join(CHART_SCRIPTS_DIR, script_name)
        
        try:
            # Run the chart script
            # Pass flight_id, flight_dir, and csv files as environment variables
            env = os.environ.copy()
            env['FLIGHT_ID'] = flight_id
            env['FLIGHT_DIR'] = flight_dir
            env['FLIGHT_CHARTS_DIR'] = flight_charts_dir
            env['CSV_FILES'] = ','.join([cf.file_path for cf in csv_files])
            
            result = subprocess.run(
                ['python', script_path],
                env=env,
                capture_output=True,
                text=True,
                cwd=CHART_SCRIPTS_DIR
            )
            
            if result.returncode == 0:
                # Script should output chart filenames (one per line)
                chart_files = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
                
                for chart_file in chart_files:
                    chart_path = os.path.join(flight_charts_dir, chart_file)
                    if os.path.exists(chart_path):
                        chart_name = os.path.splitext(script_name)[0] + "_" + chart_file
                        db_chart = Chart(
                            flight_id=flight_id,
                            name=chart_name,
                            file_path=chart_path
                        )
                        db.add(db_chart)
                        generated_charts.append(db_chart)
            else:
                print(f"Error running chart script {script_name}: {result.stderr}")
        except Exception as e:
            print(f"Exception running chart script {script_name}: {str(e)}")
    
    db.commit()
    
    # Refresh all charts
    for chart in generated_charts:
        db.refresh(chart)
    
    return generated_charts


@app.get("/api/flights/{flight_id}/charts", response_model=List[ChartSchema])
def get_flight_charts(flight_id: str, db: Session = Depends(get_db)):
    charts = db.query(Chart).filter(Chart.flight_id == flight_id).all()
    return charts


@app.get("/api/charts/{chart_id}")
def get_chart_file(chart_id: str, db: Session = Depends(get_db)):
    chart = db.query(Chart).filter(Chart.id == chart_id).first()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    from fastapi.responses import FileResponse
    if os.path.exists(chart.file_path):
        # Determine media type based on file extension
        media_type = "text/html" if chart.file_path.endswith(".html") else None
        return FileResponse(chart.file_path, media_type=media_type)
    else:
        raise HTTPException(status_code=404, detail="Chart file not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

