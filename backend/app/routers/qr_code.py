import io
import logging
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.qr_code import QRCodeTile, Lead
from app.schemas.qr_code import (
    GenerateQRResponse,
    QRCodeTileResponse,
    TileVisualizeRequest,
    TileVisualizeResponse,
    QuoteRequest,
    LeadResponse,
)
from app.services.qr_service import (
    generate_qr_code,
    generate_qr_label_pdf,
    generate_qr_label_png,
    calculate_tiles_required,
)
from app.services.cloudinary_service import upload_image

logger = logging.getLogger(__name__)

qr_router = APIRouter(prefix="/tile", tags=["QR Tile System"])

PUBLIC_BASE_URL = os.getenv("PUBLIC_URL", "https://tilemasterpro.in")


@qr_router.post("/generate-qr", response_model=GenerateQRResponse)
async def generate_qr(
    tile_name: str = Form(...),
    tile_number: str = Form(...),
    tile_size: str = Form(...),
    finish: str = Form(None),
    price_per_sqft: float = Form(None),
    tile_image: UploadFile = File(None),
    dealer_id: str = Form(None),
    db: Session = Depends(get_db),
):
    tile_image_url = None
    if tile_image and tile_image.filename:
        try:
            img_bytes = await tile_image.read()
            public_id = f"qr_tiles/{uuid.uuid4().hex[:12]}"
            tile_image_url = upload_image(img_bytes, public_id)
        except Exception as e:
            logger.warning(f"Image upload failed: {e}")

    tile = QRCodeTile(
        dealer_id=dealer_id or "demo-dealer",
        tile_name=tile_name,
        tile_number=tile_number,
        tile_size=tile_size,
        finish=finish,
        price_per_sqft=price_per_sqft,
        tile_image_url=tile_image_url,
    )
    db.add(tile)
    db.commit()
    db.refresh(tile)

    tile_url = f"{PUBLIC_BASE_URL}/tile/{tile.id}"
    qr_bytes = generate_qr_code(tile_url, tile_name)

    qr_public_id = f"qr_codes/{tile.id}"
    qr_code_url = upload_image(qr_bytes, qr_public_id)

    tile.qr_code_url = qr_code_url
    db.commit()

    return GenerateQRResponse(
        success=True,
        tile_id=tile.id,
        tile_url=tile_url,
        qr_code_url=qr_code_url or "",
        tile=QRCodeTileResponse.model_validate(tile),
    )


@qr_router.get("/leads/list")
def list_leads(dealer_id: str = Query(None), db: Session = Depends(get_db)):
    query = db.query(Lead).order_by(Lead.created_at.desc())
    if dealer_id:
        query = query.filter(Lead.dealer_id == dealer_id)
    leads = query.all()
    return {"leads": [LeadResponse.model_validate(l) for l in leads], "total": len(leads)}


@qr_router.get("/{tile_id}", response_model=QRCodeTileResponse)
def get_tile(tile_id: str, db: Session = Depends(get_db)):
    tile = db.query(QRCodeTile).filter(QRCodeTile.id == tile_id).first()
    if not tile:
        raise HTTPException(status_code=404, detail="Tile not found")
    return QRCodeTileResponse.model_validate(tile)


@qr_router.get("/{tile_id}/qr-code")
def download_qr_code(
    tile_id: str,
    size: float = Query(3.0, description="Label size in inches (2, 3, or 4)"),
    format: str = Query("pdf", description="Format to download (pdf or png)"),
    db: Session = Depends(get_db),
):
    tile = db.query(QRCodeTile).filter(QRCodeTile.id == tile_id).first()
    if not tile:
        raise HTTPException(status_code=404, detail="Tile not found")

    tile_url = f"{PUBLIC_BASE_URL}/tile/{tile.id}"
    qr_bytes = generate_qr_code(tile_url, tile.tile_name)

    tile_img_bytes = None
    if tile.tile_image_url:
        is_local = False
        local_file_path = None
        
        # Handle relative local storage URLs
        if tile.tile_image_url.startswith("/api/local/image"):
            import urllib.parse
            parsed = urllib.parse.urlparse(tile.tile_image_url)
            params = urllib.parse.parse_qs(parsed.query)
            relative_path = params.get("path", [None])[0]
            if relative_path:
                from app.routers.local_storage import _get_storage_path
                local_file_path = os.path.join(_get_storage_path(), relative_path.lstrip("/\\"))
                is_local = True
        elif tile.tile_image_url.startswith("/uploads/"):
            relative_path = tile.tile_image_url[len("/uploads/"):]
            local_file_path = os.path.join(os.getcwd(), "uploads", relative_path.lstrip("/\\"))
            is_local = True
            
        if is_local and local_file_path and os.path.exists(local_file_path):
            try:
                with open(local_file_path, "rb") as f:
                    tile_img_bytes = f.read()
            except Exception as e:
                logger.warning(f"Could not read local tile image file {local_file_path}: {e}")
        else:
            import requests
            try:
                img_url = tile.tile_image_url
                if img_url.startswith("/"):
                    # Fallback construct absolute url if it's somehow relative but not matched above
                    img_url = f"http://127.0.0.1:8001{img_url}"
                resp = requests.get(img_url, timeout=10)
                if resp.status_code == 200:
                    tile_img_bytes = resp.content
            except Exception as e:
                logger.warning(f"Could not fetch tile image for QR label: {e}")

    if format.lower() == "png":
        png_bytes = generate_qr_label_png(
            qr_bytes,
            tile.tile_name,
            tile.tile_number,
            tile.tile_size,
            tile.price_per_sqft,
            tile_image_bytes=tile_img_bytes,
        )
        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=qr_{tile.id}.png"},
        )

    pdf_bytes = generate_qr_label_pdf(
        qr_bytes,
        tile.tile_name,
        tile.tile_number,
        tile.tile_size,
        tile_img_bytes,
        label_size_inches=max(2, min(4, size)),
        price_per_sqft=tile.price_per_sqft,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=qr_{tile.id}_{int(size)}x{int(size)}.pdf"},
    )


@qr_router.post("/{tile_id}/visualize", response_model=TileVisualizeResponse)
def visualize_tile(
    tile_id: str,
    req: TileVisualizeRequest,
    db: Session = Depends(get_db),
):
    tile = db.query(QRCodeTile).filter(QRCodeTile.id == tile_id).first()
    if not tile:
        raise HTTPException(status_code=404, detail="Tile not found")

    l = req.length
    w = req.width
    if req.unit == "meters":
        l *= 3.28084
        w *= 3.28084

    quantity = calculate_tiles_required(l, w, tile.tile_size)

    return TileVisualizeResponse(
        success=True,
        tile_quantity=quantity,
        tile_size_mm=tile.tile_size,
        scene_data={
            "room_length_ft": round(l, 2),
            "room_width_ft": round(w, 2),
            "tile_name": tile.tile_name,
            "tile_number": tile.tile_number,
            "tile_image_url": tile.tile_image_url,
            "tile_size": tile.tile_size,
        },
    )


@qr_router.post("/{tile_id}/request-quote")
def request_quote(
    tile_id: str,
    req: QuoteRequest,
    db: Session = Depends(get_db),
):
    tile = db.query(QRCodeTile).filter(QRCodeTile.id == tile_id).first()
    if not tile:
        raise HTTPException(status_code=404, detail="Tile not found")

    lead = Lead(
        tile_id=tile_id,
        dealer_id=tile.dealer_id,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        customer_email=req.customer_email,
        room_length=req.length,
        room_width=req.width,
        room_type=req.room_type,
        tiles_required=req.quantity,
    )
    db.add(lead)
    db.commit()

    logger.info(f"New lead: {req.customer_name} ({req.customer_phone}) for tile {tile_id}")

    return {
        "success": True,
        "message": "Your request has been received. The dealer will contact you shortly.",
        "lead_id": lead.id,
    }



