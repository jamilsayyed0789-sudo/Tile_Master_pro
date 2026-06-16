import logging
from typing import List, Optional
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models.quotation import Quotation, QuotationRoom, QuotationItem
from app.schemas.quotation import (
    QuotationCreate,
    QuotationUpdate,
    QuotationResponse,
    QuotationListItem,
)

logger = logging.getLogger(__name__)

quotation_router = APIRouter(prefix="/quotation", tags=["Quotation"])


def _generate_quotation_number(db: Session) -> str:
    today = date.today()
    prefix = f"QTN-{today.strftime('%Y%m')}-"
    last = (
        db.query(Quotation.quotation_number)
        .filter(Quotation.quotation_number.like(f"{prefix}%"))
        .order_by(Quotation.quotation_number.desc())
        .first()
    )
    if last:
        seq = int(last[0].split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def _recalculate(quotation: Quotation):
    total_area = 0
    total_boxes = 0
    total_tiles = 0
    subtotal = 0

    for room in quotation.rooms:
        for item in room.items:
            total_area += float(item.area_covered or 0)
            total_boxes += float(item.boxes_required or 0)
            total_tiles += int(item.tiles_required or 0)
            subtotal += float(item.amount or 0)

    quotation.total_area = round(total_area, 2)
    quotation.total_boxes = int(total_boxes)
    quotation.total_tiles = total_tiles
    quotation.subtotal = round(subtotal, 2)

    discount_amt = float(quotation.discount or 0)
    gst_pct = float(quotation.gst_percentage or 0)
    after_discount = subtotal - discount_amt
    gst_amt = after_discount * gst_pct / 100
    quotation.grand_total = round(after_discount + gst_amt, 2)


@quotation_router.post("", response_model=QuotationResponse, status_code=201)
def create_quotation(
    data: QuotationCreate,
    db: Session = Depends(get_db),
):
    number = _generate_quotation_number(db)
    quotation = Quotation(
        quotation_number=number,
        customer_name=data.customer_name,
        mobile_number=data.mobile_number,
        email=data.email,
        address=data.address,
        project_name=data.project_name,
        date=data.date or date.today(),
        salesperson_name=data.salesperson_name,
        notes=data.notes,
        discount=data.discount,
        gst_percentage=data.gst_percentage,
        status=data.status,
    )
    db.add(quotation)
    db.flush()

    for i, room_data in enumerate(data.rooms):
        room = QuotationRoom(
            quotation_id=quotation.id,
            room_name=room_data.room_name,
            room_type=room_data.room_type,
            floor_length=room_data.floor_length,
            floor_width=room_data.floor_width,
            wall_height=room_data.wall_height,
            total_area=room_data.total_area,
            sort_order=i,
        )
        db.add(room)
        db.flush()

        for item_data in room_data.items:
            item = QuotationItem(
                room_id=room.id,
                tile_number=item_data.tile_number,
                tile_name=item_data.tile_name,
                tile_size=item_data.tile_size,
                tile_finish=item_data.tile_finish,
                tile_brand=item_data.tile_brand,
                tile_image_filename=item_data.tile_image_filename,
                tile_area=item_data.tile_area,
                tiles_per_box=item_data.tiles_per_box,
                wastage_percentage=item_data.wastage_percentage,
                quantity=item_data.quantity,
                tiles_required=item_data.tiles_required,
                boxes_required=item_data.boxes_required,
                area_covered=item_data.area_covered,
                rate=item_data.rate,
                amount=item_data.amount,
            )
            db.add(item)

    _recalculate(quotation)
    db.commit()
    db.refresh(quotation)
    return quotation


@quotation_router.get("", response_model=List[QuotationListItem])
def list_quotations(
    q: Optional[str] = Query(None, description="Search by name, number, mobile, project"),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None, alias="startDate"),
    end_date: Optional[date] = Query(None, alias="endDate"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Quotation).options(joinedload(Quotation.rooms).joinedload(QuotationRoom.items))

    if q:
        like = f"%{q}%"
        query = query.filter(
            Quotation.customer_name.ilike(like)
            | Quotation.quotation_number.ilike(like)
            | Quotation.mobile_number.ilike(like)
            | Quotation.project_name.ilike(like)
        )
    if status_filter:
        query = query.filter(Quotation.status == status_filter)
    if start_date:
        query = query.filter(Quotation.date >= start_date)
    if end_date:
        query = query.filter(Quotation.date <= end_date)

    total = query.count()
    query = query.order_by(Quotation.created_at.desc()).offset(skip).limit(limit).all()

    # Deduplicate due to joinedload
    seen = set()
    result = []
    for q in query:
        if q.id not in seen:
            seen.add(q.id)
            result.append(q)
    return result


@quotation_router.get("/{quotation_id}", response_model=QuotationResponse)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    quotation = (
        db.query(Quotation)
        .options(joinedload(Quotation.rooms).joinedload(QuotationRoom.items))
        .filter(Quotation.id == quotation_id)
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation


@quotation_router.put("/{quotation_id}", response_model=QuotationResponse)
def update_quotation(
    quotation_id: int,
    data: QuotationUpdate,
    db: Session = Depends(get_db),
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    update_data = data.model_dump(exclude_unset=True, exclude={"rooms"})
    for key, value in update_data.items():
        setattr(quotation, key, value)

    if data.rooms is not None:
        # Delete existing rooms and items, replace with new data
        for room in quotation.rooms:
            db.delete(room)
        db.flush()

        for i, room_data in enumerate(data.rooms):
            room = QuotationRoom(
                quotation_id=quotation.id,
                room_name=room_data.room_name,
                room_type=room_data.room_type,
                floor_length=room_data.floor_length,
                floor_width=room_data.floor_width,
                wall_height=room_data.wall_height,
                total_area=room_data.total_area,
                sort_order=i,
            )
            db.add(room)
            db.flush()

            for item_data in room_data.items:
                item = QuotationItem(
                    room_id=room.id,
                    tile_number=item_data.tile_number,
                    tile_name=item_data.tile_name,
                    tile_size=item_data.tile_size,
                    tile_finish=item_data.tile_finish,
                    tile_brand=item_data.tile_brand,
                    tile_image_filename=item_data.tile_image_filename,
                    tile_area=item_data.tile_area,
                    tiles_per_box=item_data.tiles_per_box,
                    wastage_percentage=item_data.wastage_percentage,
                    quantity=item_data.quantity,
                    tiles_required=item_data.tiles_required,
                    boxes_required=item_data.boxes_required,
                    area_covered=item_data.area_covered,
                    rate=item_data.rate,
                    amount=item_data.amount,
                )
                db.add(item)

    _recalculate(quotation)
    db.commit()
    db.refresh(quotation)
    return quotation


@quotation_router.delete("/{quotation_id}")
def delete_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    db.delete(quotation)
    db.commit()
    return {"message": f"Quotation {quotation.quotation_number} deleted"}


@quotation_router.post("/{quotation_id}/duplicate", response_model=QuotationResponse, status_code=201)
def duplicate_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
):
    original = (
        db.query(Quotation)
        .options(joinedload(Quotation.rooms).joinedload(QuotationRoom.items))
        .filter(Quotation.id == quotation_id)
        .first()
    )
    if not original:
        raise HTTPException(status_code=404, detail="Quotation not found")

    number = _generate_quotation_number(db)
    new_q = Quotation(
        quotation_number=number,
        customer_name=original.customer_name,
        mobile_number=original.mobile_number,
        email=original.email,
        address=original.address,
        project_name=original.project_name,
        date=date.today(),
        salesperson_name=original.salesperson_name,
        notes=original.notes,
        discount=original.discount,
        gst_percentage=original.gst_percentage,
        status="draft",
    )
    db.add(new_q)
    db.flush()

    for i, room in enumerate(original.rooms):
        new_room = QuotationRoom(
            quotation_id=new_q.id,
            room_name=room.room_name,
            room_type=room.room_type,
            floor_length=room.floor_length,
            floor_width=room.floor_width,
            wall_height=room.wall_height,
            total_area=room.total_area,
            sort_order=i,
        )
        db.add(new_room)
        db.flush()

        for item in room.items:
            new_item = QuotationItem(
                room_id=new_room.id,
                tile_number=item.tile_number,
                tile_name=item.tile_name,
                tile_size=item.tile_size,
                tile_finish=item.tile_finish,
                tile_brand=item.tile_brand,
                tile_image_filename=item.tile_image_filename,
                tile_area=item.tile_area,
                tiles_per_box=item.tiles_per_box,
                wastage_percentage=item.wastage_percentage,
                quantity=item.quantity,
                tiles_required=item.tiles_required,
                boxes_required=item.boxes_required,
                area_covered=item.area_covered,
                rate=item.rate,
                amount=item.amount,
            )
            db.add(new_item)

    _recalculate(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q
