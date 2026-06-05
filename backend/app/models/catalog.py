from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy import Text
import datetime
from app.database import Base


class TileCatalog(Base):
    __tablename__ = "tile_catalog"

    id = Column(Integer, primary_key=True, index=True)
    tile_name = Column(String(255), index=True)
    tile_number = Column(String(100), index=True)
    tile_size = Column(String(50), nullable=True)
    image_url = Column(Text, nullable=True)
    catalog_name = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
