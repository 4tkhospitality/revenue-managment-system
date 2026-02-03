import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, Date, DateTime, Numeric, ForeignKey, Enum, UniqueConstraint, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

# Enums
class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class DecisionAction(str, enum.Enum):
    ACCEPT = "accept"
    OVERRIDE = "override"

# Models

class Hotel(Base):
    __tablename__ = "hotels"
    
    hotel_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    timezone = Column(String, default="UTC")
    capacity = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="hotel")
    import_jobs = relationship("ImportJob", back_populates="hotel")
    reservations_raw = relationship("ReservationsRaw", back_populates="hotel")
    daily_otb = relationship("DailyOTB", back_populates="hotel")
    features_daily = relationship("FeaturesDaily", back_populates="hotel")
    demand_forecast = relationship("DemandForecast", back_populates="hotel")
    price_recommendations = relationship("PriceRecommendations", back_populates="hotel")
    pricing_decisions = relationship("PricingDecision", back_populates="hotel")

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="manager")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    hotel = relationship("Hotel", back_populates="users")
    pricing_decisions = relationship("PricingDecision", back_populates="user")

class ImportJob(Base):
    __tablename__ = "import_jobs"

    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_hash = Column(String, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    error_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    hotel = relationship("Hotel", back_populates="import_jobs")
    reservations_raw = relationship("ReservationsRaw", back_populates="job")

class ReservationsRaw(Base):
    __tablename__ = "reservations_raw"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("import_jobs.job_id"), nullable=False)
    reservation_id = Column(String, nullable=False)
    booking_date = Column(Date, nullable=False)
    arrival_date = Column(Date, nullable=False)
    departure_date = Column(Date, nullable=False)
    rooms = Column(Integer, nullable=False)
    revenue = Column(Numeric, nullable=False)
    status = Column(String, nullable=False)
    cancel_date = Column(Date, nullable=True)
    loaded_at = Column(DateTime, default=datetime.utcnow)

    hotel = relationship("Hotel", back_populates="reservations_raw")
    job = relationship("ImportJob", back_populates="reservations_raw")

    # Tracking uniqueness: hotel + reservation_id + job (batch) allows re-importing history
    __table_args__ = (
        UniqueConstraint('hotel_id', 'reservation_id', 'job_id', name='uq_res_job'),
    )

class DailyOTB(Base):
    __tablename__ = "daily_otb"

    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), request_dict=False, primary_key=True)
    as_of_date = Column(Date, primary_key=True)
    stay_date = Column(Date, primary_key=True)
    rooms_otb = Column(Integer, nullable=False)
    revenue_otb = Column(Numeric, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    hotel = relationship("Hotel", back_populates="daily_otb")

    __table_args__ = (
        Index('idx_otb_as_of', 'hotel_id', 'as_of_date'),
        Index('idx_otb_stay', 'hotel_id', 'stay_date'),
    )

class FeaturesDaily(Base):
    __tablename__ = "features_daily"

    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), primary_key=True)
    as_of_date = Column(Date, primary_key=True)
    stay_date = Column(Date, primary_key=True)
    dow = Column(Integer)
    is_weekend = Column(Boolean)
    month = Column(Integer)
    pickup_t30 = Column(Integer)
    pickup_t7 = Column(Integer)
    pickup_t3 = Column(Integer)
    pace_vs_ly = Column(Float)
    remaining_supply = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    hotel = relationship("Hotel", back_populates="features_daily")

class DemandForecast(Base):
    __tablename__ = "demand_forecast"

    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), primary_key=True)
    as_of_date = Column(Date, primary_key=True)
    stay_date = Column(Date, primary_key=True)
    remaining_demand = Column(Integer)
    model_version = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    hotel = relationship("Hotel", back_populates="demand_forecast")

class PriceRecommendations(Base):
    __tablename__ = "price_recommendations"

    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), primary_key=True)
    stay_date = Column(Date, primary_key=True)
    as_of_date = Column(Date, nullable=False) # Not PK, but part of unique constraint usually?
    # Wait, DESIGN.md said: PK = (hotel_id, stay_date)??
    # Actually DESIGN.md said: PK = (hotel_id, stay_date, as_of_date) IN THE ERD DIAGRAM IMAGE TEXT
    # But in the block text: "uuid hotel_id FK, date as_of_date, date stay_date PK"
    # Logic: One recommendation per stay_date per day (as_of_date).
    # If I make as_of_date NOT PK, I can only have one rec per stay_date FOREVER? No.
    # It must be compliant with Daily Batch.
    # So PK should be (hotel_id, as_of_date, stay_date) OR (hotel_id, stay_date) and as_of_date is just metadata?
    # NO, we recommend DAILY. So as_of_date MUST be part of PK or Unique.
    # DESIGN.md Revised says: "constraint unique_rec UNIQUE (hotel_id, stay_date, as_of_date)"
    # PROPOSAL: Make (hotel_id, as_of_date, stay_date) the composite PK to be consistent with others.
    
    # Revised implementation:
    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), primary_key=True)
    as_of_date = Column(Date, primary_key=True)
    stay_date = Column(Date, primary_key=True)
    
    current_price = Column(Numeric)
    recommended_price = Column(Numeric)
    expected_revenue = Column(Numeric)
    uplift_pct = Column(Float)
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    hotel = relationship("Hotel", back_populates="price_recommendations")

class PricingDecision(Base):
    __tablename__ = "pricing_decisions"

    decision_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hotel_id = Column(UUID(as_uuid=True), ForeignKey("hotels.hotel_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    as_of_date = Column(Date, nullable=False)
    stay_date = Column(Date, nullable=False)
    action = Column(Enum(DecisionAction), nullable=False)
    system_price = Column(Numeric)
    final_price = Column(Numeric)
    reason = Column(Text)
    decided_at = Column(DateTime, default=datetime.utcnow)

    hotel = relationship("Hotel", back_populates="pricing_decisions")
    user = relationship("User", back_populates="pricing_decisions")
