from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class Payload(Base):
    __tablename__ = "payloads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    owner = Column(String, nullable=True)
    default_weight = Column(Float, nullable=True)
    
    flights = relationship("Flight", back_populates="payload", cascade="all, delete-orphan")


class Flight(Base):
    __tablename__ = "flights"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    payload_id = Column(String, ForeignKey("payloads.id"), nullable=False)
    flight_date = Column(DateTime, nullable=False)
    name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    custom_weight = Column(Float, nullable=True)
    
    payload = relationship("Payload", back_populates="flights")
    csv_files = relationship("CSVFile", back_populates="flight", cascade="all, delete-orphan")
    charts = relationship("Chart", back_populates="flight", cascade="all, delete-orphan")


class CSVFile(Base):
    __tablename__ = "csv_files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    flight_id = Column(String, ForeignKey("flights.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    flight = relationship("Flight", back_populates="csv_files")


class Chart(Base):
    __tablename__ = "charts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    flight_id = Column(String, ForeignKey("flights.id"), nullable=False)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    flight = relationship("Flight", back_populates="charts")

