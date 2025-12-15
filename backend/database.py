from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os
from pathlib import Path

# SQLite database file path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flight_manager.db")

# Extract file path from SQLite URL and ensure directory exists
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_dir = Path(db_path).parent
    if db_dir and str(db_dir) != ".":
        db_dir.mkdir(parents=True, exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize the database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

