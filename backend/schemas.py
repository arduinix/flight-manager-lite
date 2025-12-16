from pydantic import BaseModel, field_validator
from typing import Optional, Any
from datetime import datetime


class PayloadBase(BaseModel):
    name: str
    owner: Optional[str] = None
    default_weight: Optional[float] = None


class PayloadCreate(PayloadBase):
    pass


class PayloadUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    default_weight: Optional[float] = None


class Payload(PayloadBase):
    id: str
    
    class Config:
        from_attributes = True


class FlightBase(BaseModel):
    flight_date: datetime
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    custom_weight: Optional[float] = None
    
    @field_validator('name', 'description', 'location', mode='before')
    @classmethod
    def empty_str_to_none(cls, v: Any) -> Optional[str]:
        """Convert empty strings to None for optional string fields"""
        if isinstance(v, str) and v.strip() == '':
            return None
        return v


class FlightCreate(FlightBase):
    payload_id: str


class FlightUpdate(BaseModel):
    flight_date: Optional[datetime] = None
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    custom_weight: Optional[float] = None
    
    @field_validator('name', 'description', 'location', mode='before')
    @classmethod
    def empty_str_to_none(cls, v: Any) -> Optional[str]:
        """Convert empty strings to None for optional string fields"""
        if isinstance(v, str) and v.strip() == '':
            return None
        return v


class Flight(FlightBase):
    id: str
    payload_id: str
    
    class Config:
        from_attributes = True


class CSVFileBase(BaseModel):
    filename: str
    file_path: str


class CSVFile(CSVFileBase):
    id: str
    flight_id: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class ChartBase(BaseModel):
    name: str
    file_path: str


class Chart(ChartBase):
    id: str
    flight_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

