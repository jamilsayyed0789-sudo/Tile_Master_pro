import json
import logging
import os
import threading
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.catalog import TileCatalog
from app.schemas.catalog import CatalogUploadResponse, TileCatalogResponse, TileSearchResult
from app.services.catalog_service import (
    extract_tiles_from_pdf,
    extract_tiles_from_template,
    extract_tiles_from_scanned_pdf,
    _detect_pdf_type,
)

logger = logging.getLogger(__name__)

catalog_router = APIRouter(prefix="/catalog", tags=["Tile Catalog"])

from pydantic import BaseModel
class VisionRequest(BaseModel):
    image_url: str

@catalog_router.post("/extract-ai-vision")
async def extract_ai_vision(payload: VisionRequest):
    if not payload.image_url or not payload.image_url.startswith("data:image"):
        raise HTTPException(status_code=400, detail="Invalid image data URL")
        
    mime_type = payload.image_url.split(";")[0].split(":")[1]
    b64_data = payload.image_url.split(",")[1]
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in backend")
        
    prompt = """
    You are an expert tile catalog data extractor. Look at the image of this catalog page.
    Find the tile being displayed and extract its details.
    Return ONLY a raw JSON object with these exact keys (use empty string if not found):
    "tileName": The name of the tile (e.g. Statuario, Calacatta, Onyx)
    "tileNumber": The SKU or item code (e.g. 6012, P-102, HL-1, D-34)
    "tileSize": The dimensions (e.g. 600x1200 mm)
    "finish": The finish type (e.g. Glossy, Matt, Rustic)
    "color": The dominant color (e.g. White, Grey)
    Do not wrap the JSON in markdown code blocks, just return the raw JSON string.
    """
    
    import requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    data = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime_type, "data": b64_data}}
            ]
        }]
    }
    
    try:
        resp = requests.post(url, json=data, timeout=15)
        if resp.status_code != 200:
            logger.error(f"Gemini API error: {resp.text}")
            raise HTTPException(status_code=500, detail="Failed to analyze image with AI")
            
        result = resp.json()
        text_resp = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Clean markdown code blocks if Gemini added them anyway
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        elif text_resp.startswith("```"):
            text_resp = text_resp[3:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
            
        return json.loads(text_resp.strip())
    except Exception as e:
        logger.error(f"AI Vision error: {e}", exc_info=True)
        # Return fallback empty data instead of crashing
        return {"tileName": "", "tileNumber": "", "tileSize": "", "finish": "", "color": ""}

def process_catalog_background(pdf_bytes: bytes, catalog_name: str, settings: Optional[dict] = None):
    import time
    start = time.time()
    try:
        settings = settings or {}
        tiles = extract_tiles_from_pdf(
            pdf_bytes,
            catalog_name,
            tile_size_override=settings.get("tile_size"),
            page_start=settings.get("page_start"),
            page_end=settings.get("page_end"),
            min_width=settings.get("min_width", 100),
            min_height=settings.get("min_height", 100),
            tiles_per_page=settings.get("tiles_per_page"),
        )
        extract_time = time.time() - start
        logger.info(f"Extraction for '{catalog_name}' took {extract_time:.1f}s, got {len(tiles)} tiles")

        if not tiles:
            logger.warning(f"No tiles extracted from {catalog_name}")
            return
            
        db = SessionLocal()
        try:
            tiles_to_insert = []
            for tile_data in tiles:
                existing = db.query(TileCatalog).filter(
                    TileCatalog.tile_number == tile_data["tile_number"],
                    TileCatalog.catalog_name == catalog_name,
                ).first()
                if not existing:
                    tiles_to_insert.append(TileCatalog(**tile_data))

            if tiles_to_insert:
                for t in tiles_to_insert:
                    db.add(t)
                db.commit()
                logger.info(f"Inserted {len(tiles_to_insert)} tiles for '{catalog_name}'")
            else:
                logger.info(f"No new tiles to insert for '{catalog_name}'")
        finally:
            db.close()

        total_time = time.time() - start
        logger.info(f"Total processing for '{catalog_name}': {total_time:.1f}s")
    except Exception as e:
        logger.error(f"Background processing of {catalog_name} failed: {e}", exc_info=True)


def process_template_background(pdf_bytes: bytes, catalog_name: str):
    import time
    start = time.time()
    try:
        tiles = extract_tiles_from_template(pdf_bytes, catalog_name)
        elapsed = time.time() - start
        logger.info(f"Template extraction for '{catalog_name}' took {elapsed:.1f}s, got {len(tiles)} tiles")
        if not tiles:
            logger.warning(f"No tiles extracted from template '{catalog_name}'")
            return
        db = SessionLocal()
        try:
            to_insert = []
            for td in tiles:
                existing = db.query(TileCatalog).filter(
                    TileCatalog.tile_number == td["tile_number"],
                    TileCatalog.catalog_name == catalog_name,
                ).first()
                if not existing:
                    to_insert.append(TileCatalog(**td))
            if to_insert:
                for t in to_insert:
                    db.add(t)
                db.commit()
                logger.info(f"Template: inserted {len(to_insert)} tiles for '{catalog_name}'")
            else:
                logger.info(f"Template: no new tiles for '{catalog_name}'")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Template processing of {catalog_name} failed: {e}", exc_info=True)


def process_scanned_background(pdf_bytes: bytes, catalog_name: str):
    import time
    start = time.time()
    try:
        tiles = extract_tiles_from_scanned_pdf(pdf_bytes, catalog_name)
        elapsed = time.time() - start
        logger.info(f"Scanned OCR extraction for '{catalog_name}' took {elapsed:.1f}s, got {len(tiles)} tiles")
        if not tiles:
            logger.warning(f"No tiles extracted from scanned PDF '{catalog_name}'")
            return
        db = SessionLocal()
        try:
            to_insert = []
            for td in tiles:
                existing = db.query(TileCatalog).filter(
                    TileCatalog.tile_number == td["tile_number"],
                    TileCatalog.catalog_name == catalog_name,
                ).first()
                if not existing:
                    to_insert.append(TileCatalog(**td))
            if to_insert:
                for t in to_insert:
                    db.add(t)
                db.commit()
                logger.info(f"Scanned OCR: inserted {len(to_insert)} tiles for '{catalog_name}'")
            else:
                logger.info(f"Scanned OCR: no new tiles for '{catalog_name}'")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Scanned OCR processing of {catalog_name} failed: {e}", exc_info=True)


@catalog_router.post("/upload", response_model=CatalogUploadResponse)
async def upload_catalog(
    file: UploadFile = File(...),
    use_template: Optional[bool] = Form(False),
    settings_json: Optional[str] = Form(None),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    if file.size and file.size > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit")

    catalog_name = os.path.splitext(file.filename)[0]

    try:
        pdf_bytes = await file.read()
        logger.info(f"Received PDF '{catalog_name}': {len(pdf_bytes)} bytes, use_template={use_template}")

        if use_template:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            from app.services.catalog_service import _is_template_pdf
            is_template = _is_template_pdf(doc)
            doc.close()
            if not is_template:
                raise HTTPException(
                    status_code=400,
                    detail="This PDF does not match the TileMaster Standard Template dimensions. Please download the template from /catalog/template/download and upload a properly formatted PDF."
                )
            t = threading.Thread(target=process_template_background, args=(pdf_bytes, catalog_name), daemon=True)
            mode = "template"
        else:
            detected_type = _detect_pdf_type(pdf_bytes)
            logger.info(f"Auto-detected PDF type for '{catalog_name}': {detected_type}")

            if detected_type == "template":
                t = threading.Thread(target=process_template_background, args=(pdf_bytes, catalog_name), daemon=True)
                mode = "template-auto"
            elif detected_type == "scanned":
                t = threading.Thread(target=process_scanned_background, args=(pdf_bytes, catalog_name), daemon=True)
                mode = "scanned-ocr"
            else:
                settings = None
                if settings_json:
                    try:
                        settings = json.loads(settings_json)
                    except json.JSONDecodeError:
                        raise HTTPException(status_code=400, detail="Invalid settings_json format")
                t = threading.Thread(target=process_catalog_background, args=(pdf_bytes, catalog_name, settings), daemon=True)
                mode = "digital"

        t.start()

        return CatalogUploadResponse(
            message=f"[{mode}] Upload received. Processing '{catalog_name}' in the background.",
            tiles_extracted=0,
            catalog_name=catalog_name,
            extraction_mode=mode,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Catalog upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process catalog: {str(e)}")


@catalog_router.get("/template/download")
def download_template():
    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "templates", "tilemaster_template.pdf")
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template not found. Please generate it first.")
    return FileResponse(template_path, media_type="application/pdf", filename="tilemaster_template.pdf")


@catalog_router.get("/template/info")
def template_info():
    return {
        "formats": ["pdf", "canva", "powerpoint"],
        "canva_link": "https://www.canva.com/design/DAGe8DF_J70/8OSjJPqgnUkDOrsE5IqgCQ/edit",
        "description": "Download the PDF template or copy the Canva design. Fill tile images and text fields, then upload back. For 100% accurate extraction, keep the layout unchanged.",
        "specs": {
            "page_size": "A4 (210 x 297 mm)",
            "grid": "3 columns x 4 rows (12 tiles per page)",
            "fields_per_tile": ["SKU", "Size", "Brand", "Finish", "Model"],
        }
    }


@catalog_router.get("/search", response_model=List[TileSearchResult])
def search_tiles(
    q: str = Query(..., min_length=1, description="Search query for tile name or number"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = (
        db.query(TileCatalog)
        .filter(
            TileCatalog.tile_name.ilike(f"%{q}%")
            | TileCatalog.tile_number.ilike(f"%{q}%")
        )
        .order_by(TileCatalog.tile_name)
        .limit(limit)
        .all()
    )

    return [
        TileSearchResult(
            tile_name=t.tile_name,
            tile_number=t.tile_number,
            tile_size=t.tile_size,
            image_url=t.image_url,
        )
        for t in query
    ]


@catalog_router.get("/tiles", response_model=List[TileCatalogResponse])
def list_tiles(
    catalog: Optional[str] = Query(None, description="Filter by catalog name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(TileCatalog)
    if catalog:
        query = query.filter(TileCatalog.catalog_name.ilike(f"%{catalog}%"))
    return query.order_by(TileCatalog.catalog_name, TileCatalog.page_number).offset(skip).limit(limit).all()


@catalog_router.get("/catalogs")
def list_catalogs(db: Session = Depends(get_db)):
    results = db.query(TileCatalog.catalog_name).distinct().all()
    return {"catalogs": [r.catalog_name for r in results if r.catalog_name]}


@catalog_router.delete("/clear")
def clear_catalog(
    catalog: Optional[str] = Query(None, description="Delete only this catalog"),
    db: Session = Depends(get_db),
):
    try:
        if catalog:
            count = db.query(TileCatalog).filter(TileCatalog.catalog_name == catalog).delete()
            db.commit()
            return {"message": f"Deleted {count} records from catalog '{catalog}'"}
        else:
            count = db.query(TileCatalog).delete()
            db.commit()
            return {"message": f"Deleted all {count} records from tile catalog"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to clear catalog: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear catalog: {str(e)}")

from app.services.cloudinary_service import delete_image

REVIEW_PREFIXES = ("Tile Page", "Full Page", "PAGE-", "CELL-")


@catalog_router.get("/review")
def list_needs_review(db: Session = Depends(get_db)):
    tiles = db.query(TileCatalog).order_by(TileCatalog.catalog_name, TileCatalog.page_number).all()
    flagged = []
    for t in tiles:
        needs_review = (
            (t.tile_name and t.tile_name.startswith(REVIEW_PREFIXES)) or
            (t.tile_number and t.tile_number.startswith(REVIEW_PREFIXES)) or
            not t.tile_size
        )
        if needs_review:
            flagged.append({
                "id": t.id,
                "tile_name": t.tile_name,
                "tile_number": t.tile_number,
                "tile_size": t.tile_size,
                "image_url": t.image_url,
                "catalog_name": t.catalog_name,
                "page_number": t.page_number,
            })
    return {
        "total_flagged": len(flagged),
        "needs_review": flagged,
    }


@catalog_router.patch("/tiles/{tile_id}")
def update_tile(
    tile_id: int,
    tile_name: Optional[str] = Form(None),
    tile_number: Optional[str] = Form(None),
    tile_size: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    tile = db.query(TileCatalog).filter(TileCatalog.id == tile_id).first()
    if not tile:
        raise HTTPException(status_code=404, detail="Tile not found")
    if tile_name is not None:
        tile.tile_name = tile_name
    if tile_number is not None:
        tile.tile_number = tile_number
    if tile_size is not None:
        tile.tile_size = tile_size
    db.commit()
    return {"message": f"Tile {tile_id} updated"}


@catalog_router.delete("/tiles/{tile_number}")
def delete_tile(
    tile_number: str,
    db: Session = Depends(get_db),
):
    try:
        # Delete all tiles matching this number
        tiles = db.query(TileCatalog).filter(TileCatalog.tile_number == tile_number).all()
        if not tiles:
            raise HTTPException(status_code=404, detail="Tile not found")
            
        deleted_count = 0
        for tile in tiles:
            if tile.image_url:
                delete_image(tile.image_url)
            db.delete(tile)
            deleted_count += 1
            
        db.commit()
        return {"message": f"Deleted {deleted_count} tile(s) with number {tile_number}"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete tile {tile_number}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete tile: {str(e)}")
