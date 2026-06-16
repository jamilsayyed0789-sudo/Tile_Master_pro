from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QRCodeTileResponse(BaseModel):
    id: str
    tile_name: str
    tile_number: str
    tile_size: str
    tile_image_url: Optional[str] = None
    finish: Optional[str] = None
    price_per_sqft: Optional[float] = None
    qr_code_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateQRRequest(BaseModel):
    tile_name: str
    tile_number: str
    tile_size: str
    finish: Optional[str] = None
    price_per_sqft: Optional[float] = None
    tile_image_url: Optional[str] = None


class GenerateQRResponse(BaseModel):
    success: bool
    tile_id: str
    tile_url: str
    qr_code_url: str
    tile: QRCodeTileResponse


class TileVisualizeRequest(BaseModel):
    length: float
    width: float
    unit: str = "feet"
    room_type: str = "hall"


class TileVisualizeResponse(BaseModel):
    success: bool
    tile_quantity: int
    tile_size_mm: str
    scene_data: dict


class QuoteRequest(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    length: float
    width: float
    room_type: str = "hall"
    quantity: int


class LeadResponse(BaseModel):
    id: int
    tile_id: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    room_length: float
    room_width: float
    room_type: Optional[str] = None
    tiles_required: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
