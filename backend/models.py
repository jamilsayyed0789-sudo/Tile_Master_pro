from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="customer") # admin, dealer, customer
    trial_started_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_paid = Column(Boolean, default=False)
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)

class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    tiles = relationship("Tile", back_populates="brand")

class Tile(Base):
    __tablename__ = "tiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True) # floor, wall, highlighter
    size = Column(String) # e.g. "2x2", "12x18"
    tiles_per_box = Column(Integer)
    price_per_box = Column(Float)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    image_url = Column(String, nullable=True)
    brand = relationship("Brand", back_populates="tiles")

class Calculation(Base):
    __tablename__ = "calculations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    calc_type = Column(String) # floor, bathroom, etc
    input_data = Column(String) # JSON string
    result_data = Column(String) # JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
