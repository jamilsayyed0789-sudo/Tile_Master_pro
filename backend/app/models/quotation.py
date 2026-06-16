from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_name = Column(String(255), nullable=False)
    mobile_number = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    project_name = Column(String(255), nullable=True)
    date = Column(Date, nullable=False, default=datetime.date.today)
    salesperson_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    discount = Column(Numeric(10, 2), default=0)
    gst_percentage = Column(Numeric(5, 2), default=18)
    status = Column(String(20), default="draft", index=True)
    subtotal = Column(Numeric(12, 2), default=0)
    grand_total = Column(Numeric(12, 2), default=0)
    total_area = Column(Numeric(10, 2), default=0)
    total_boxes = Column(Integer, default=0)
    total_tiles = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    rooms = relationship("QuotationRoom", back_populates="quotation", cascade="all, delete-orphan", order_by="QuotationRoom.sort_order")


class QuotationRoom(Base):
    __tablename__ = "quotation_rooms"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    room_name = Column(String(100), nullable=False)
    room_type = Column(String(50), nullable=True)
    floor_length = Column(Numeric(10, 2), nullable=False)
    floor_width = Column(Numeric(10, 2), nullable=False)
    wall_height = Column(Numeric(10, 2), nullable=True)
    total_area = Column(Numeric(10, 2), nullable=True)
    sort_order = Column(Integer, default=0)

    quotation = relationship("Quotation", back_populates="rooms")
    items = relationship("QuotationItem", back_populates="room", cascade="all, delete-orphan")


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("quotation_rooms.id", ondelete="CASCADE"), nullable=False)
    tile_number = Column(String(100), nullable=True)
    tile_name = Column(String(255), nullable=True)
    tile_size = Column(String(50), nullable=True)
    tile_finish = Column(String(50), nullable=True)
    tile_brand = Column(String(100), nullable=True)
    tile_image_filename = Column(String(255), nullable=True)
    tile_area = Column(Numeric(10, 4), nullable=True)
    tiles_per_box = Column(Integer, default=1)
    wastage_percentage = Column(Numeric(5, 2), default=10)
    quantity = Column(Integer, default=1)
    tiles_required = Column(Integer, default=0)
    boxes_required = Column(Numeric(10, 2), default=0)
    area_covered = Column(Numeric(10, 2), default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    room = relationship("QuotationRoom", back_populates="items")
