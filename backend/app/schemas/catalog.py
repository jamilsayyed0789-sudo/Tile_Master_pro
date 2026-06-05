from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class TileCatalogResponse(BaseModel):
    id: int
    tile_name: str
    tile_number: str
    tile_size: Optional[str] = None
    image_url: Optional[str] = None
    catalog_name: Optional[str] = None
    page_number: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TileSearchResult(BaseModel):
    tile_name: str
    tile_number: str
    tile_size: Optional[str] = None
    image_url: Optional[str] = None


class CatalogUploadResponse(BaseModel):
    message: str
    tiles_extracted: int
    catalog_name: str
