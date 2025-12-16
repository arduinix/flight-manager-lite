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
    
    # Add new columns to existing flights table if they don't exist
    # This handles schema migrations for SQLite
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        
        # Check if flights table exists
        if 'flights' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('flights')]
            
            with engine.connect() as conn:
                # Add name column if it doesn't exist
                if 'name' not in columns:
                    conn.execute(text('ALTER TABLE flights ADD COLUMN name VARCHAR'))
                    conn.commit()
                
                # Add description column if it doesn't exist
                if 'description' not in columns:
                    conn.execute(text('ALTER TABLE flights ADD COLUMN description TEXT'))
                    conn.commit()
    except Exception as e:
        # Migration failed, but this is not critical - log and continue
        print(f"Warning: Could not migrate flights table: {e}")


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

