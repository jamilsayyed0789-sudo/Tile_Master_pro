import uuid
import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from app.database import Base


def generate_tile_id():
    return uuid.uuid4().hex[:12]


class QRCodeTile(Base):
    __tablename__ = "qr_tiles"

    id = Column(String(12), primary_key=True, default=generate_tile_id)
    dealer_id = Column(String(255), nullable=True)
    tile_name = Column(String(255), nullable=False)
    tile_number = Column(String(100), nullable=False)
    tile_size = Column(String(50), nullable=False)
    tile_image_url = Column(Text, nullable=True)
    finish = Column(String(100), nullable=True)
    price_per_sqft = Column(Float, nullable=True)
    qr_code_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tile_id = Column(String(12), ForeignKey("qr_tiles.id"), nullable=False)
    dealer_id = Column(String(255), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    customer_email = Column(String(255), nullable=True)
    room_length = Column(Float, nullable=False)
    room_width = Column(Float, nullable=False)
    room_type = Column(String(50), nullable=True)
    tiles_required = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
