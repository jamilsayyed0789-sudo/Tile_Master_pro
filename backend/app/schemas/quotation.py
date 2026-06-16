from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date as date_type, datetime
from decimal import Decimal


class QuotationItemSchema(BaseModel):
    id: Optional[int] = None
    room_id: Optional[int] = None
    tile_number: Optional[str] = None
    tile_name: Optional[str] = None
    tile_size: Optional[str] = None
    tile_finish: Optional[str] = None
    tile_brand: Optional[str] = None
    tile_image_filename: Optional[str] = None
    tile_area: Optional[Decimal] = None
    tiles_per_box: int = 1
    wastage_percentage: Decimal = Decimal("10")
    quantity: int = 1
    tiles_required: int = 0
    boxes_required: Decimal = Decimal("0")
    area_covered: Decimal = Decimal("0")
    rate: Decimal = Decimal("0")
    amount: Decimal = Decimal("0")


class QuotationRoomSchema(BaseModel):
    id: Optional[int] = None
    quotation_id: Optional[int] = None
    room_name: str
    room_type: Optional[str] = None
    floor_length: Decimal
    floor_width: Decimal
    wall_height: Optional[Decimal] = None
    total_area: Optional[Decimal] = None
    sort_order: int = 0
    items: List[QuotationItemSchema] = []


class QuotationCreate(BaseModel):
    customer_name: str
    mobile_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    project_name: Optional[str] = None
    date: Optional[date_type] = None
    salesperson_name: Optional[str] = None
    notes: Optional[str] = None
    discount: Decimal = Decimal("0")
    gst_percentage: Decimal = Decimal("18")
    status: str = "draft"
    rooms: List[QuotationRoomSchema] = []


class QuotationUpdate(BaseModel):
    customer_name: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    project_name: Optional[str] = None
    date: Optional[date_type] = None
    salesperson_name: Optional[str] = None
    notes: Optional[str] = None
    discount: Optional[Decimal] = None
    gst_percentage: Optional[Decimal] = None
    status: Optional[str] = None
    subtotal: Optional[Decimal] = None
    grand_total: Optional[Decimal] = None
    total_area: Optional[Decimal] = None
    total_boxes: Optional[int] = None
    total_tiles: Optional[int] = None
    rooms: Optional[List[QuotationRoomSchema]] = None


class QuotationResponse(BaseModel):
    id: int
    quotation_number: str
    customer_name: str
    mobile_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    project_name: Optional[str] = None
    date: date_type
    salesperson_name: Optional[str] = None
    notes: Optional[str] = None
    discount: Decimal
    gst_percentage: Decimal
    status: str
    subtotal: Decimal
    grand_total: Decimal
    total_area: Decimal
    total_boxes: int
    total_tiles: int
    created_at: datetime
    updated_at: datetime
    rooms: List[QuotationRoomSchema] = []

    model_config = ConfigDict(from_attributes=True)


class QuotationListItem(BaseModel):
    id: int
    quotation_number: str
    customer_name: str
    mobile_number: str
    project_name: Optional[str] = None
    date: date_type
    status: str
    total_area: Decimal
    total_boxes: int
    grand_total: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
