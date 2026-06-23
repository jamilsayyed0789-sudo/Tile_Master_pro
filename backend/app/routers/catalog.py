import json
import logging
import os
import threading
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, BackgroundTasks
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
from app.services.text_extraction_service import TextExtractionService

logger = logging.getLogger(__name__)

catalog_router = APIRouter(prefix="/catalog", tags=["Tile Catalog"])

from pydantic import BaseModel
class VisionRequest(BaseModel):
    image_url: str

@catalog_router.post("/extract-ai-vision")
def extract_ai_vision(payload: VisionRequest):
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
        total_time = time.time() - start
        logger.info(f"Total processing for '{catalog_name}': {total_time:.1f}s, got {len(tiles)} tiles")
    except Exception as e:
        logger.error(f"Background processing of {catalog_name} failed: {e}", exc_info=True)


def process_template_background(pdf_bytes: bytes, catalog_name: str, settings: Optional[dict] = None):
    import time
    start = time.time()
    try:
        settings = settings or {}
        tiles = extract_tiles_from_template(pdf_bytes, catalog_name, tile_size_override=settings.get("tile_size"))
        elapsed = time.time() - start
        logger.info(f"Template extraction for '{catalog_name}' took {elapsed:.1f}s, got {len(tiles)} tiles")
        if not tiles:
            logger.warning(f"No tiles extracted from template '{catalog_name}'")
            return
        db = SessionLocal()
        try:
            to_insert = []
            for td in tiles:
                if not td.get("tile_number"):
                    to_insert.append(TileCatalog(**td))
                    continue
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


def process_scanned_background(pdf_bytes: bytes, catalog_name: str, settings: Optional[dict] = None):
    import time
    start = time.time()
    try:
        settings = settings or {}
        tiles = extract_tiles_from_scanned_pdf(pdf_bytes, catalog_name, tile_size_override=settings.get("tile_size"))
        elapsed = time.time() - start
        logger.info(f"Scanned OCR extraction of {catalog_name} done in {elapsed:.1f}s, got {len(tiles)} tiles")
    except Exception as e:
        logger.error(f"Scanned OCR processing of {catalog_name} failed: {e}", exc_info=True)

class HybridTextRequest(BaseModel):
    page_index: int
    crop_x: float
    crop_y: float
    crop_w: float
    crop_h: float
    page_text: str = ""
    image_base64: str = ""
    text_blocks: list = []
    full_page_image_base64: str = ""
    name_image_base64: Optional[str] = None
    number_image_base64: Optional[str] = None

@catalog_router.post("/extract-text-hybrid")
def extract_text_hybrid(hybrid_requests: List[HybridTextRequest]):
    try:
        extractor = TextExtractionService()
        results = []
        from app.services.catalog_service import (
            detect_nearest_tile_number,
            detect_nearest_tile_name,
            _perform_ocr_on_page,
            TILE_NUMBER_REGEXES
        )
        import base64
        for req in hybrid_requests:
            # If specific name or number crop regions are defined, bypass running Tesseract OCR on the main large tile photo
            tile_image_for_ocr = req.image_base64
            if req.name_image_base64 or req.number_image_base64:
                tile_image_for_ocr = ""
            
            # Pass "" to disable non-spatial full page text parsing inside process_tile_data
            res = extractor.process_tile_data("", tile_image_for_ocr)
            res["page_index"] = req.page_index
            
            # If name_image_base64 is provided, run OCR to get name
            if req.name_image_base64:
                try:
                    header, encoded = req.name_image_base64.split(",", 1) if "," in req.name_image_base64 else ("", req.name_image_base64)
                    name_bytes = base64.b64decode(encoded)
                    print(f"[HYBRID OCR] Received name crop image. Size: {len(name_bytes)} bytes")
                    name_blocks = _perform_ocr_on_page(name_bytes)
                    print(f"[HYBRID OCR] Name OCR blocks: {name_blocks}")
                    if name_blocks:
                        res["tileName"] = " ".join(b["text"] for b in name_blocks).strip()
                except Exception as e:
                    logger.error(f"Name crop OCR failed: {e}")

            # If number_image_base64 is provided, run OCR to get number
            if req.number_image_base64:
                try:
                    header, encoded = req.number_image_base64.split(",", 1) if "," in req.number_image_base64 else ("", req.number_image_base64)
                    number_bytes = base64.b64decode(encoded)
                    print(f"[HYBRID OCR] Received number crop image. Size: {len(number_bytes)} bytes")
                    number_blocks = _perform_ocr_on_page(number_bytes)
                    print(f"[HYBRID OCR] Number OCR blocks: {number_blocks}")
                    if number_blocks:
                        extracted_number = None
                        for b in number_blocks:
                            txt = b["text"].strip()
                            for pattern in TILE_NUMBER_REGEXES:
                                m = pattern.search(txt)
                                if m:
                                    extracted_number = m.group(0)
                                    break
                            if extracted_number:
                                break
                        if not extracted_number:
                            # Fallback: join all text blocks
                            extracted_number = " ".join(b["text"] for b in number_blocks).strip()
                        if extracted_number:
                            res["tileNumber"] = extracted_number
                except Exception as e:
                    logger.error(f"Number crop OCR failed: {e}")

            # Fallback: if name or number is still missing, try using page text blocks (PDF text layer)
            if not res.get("tileNumber") or not res.get("tileName"):
                if not req.text_blocks and req.full_page_image_base64:
                    try:
                        header, encoded = req.full_page_image_base64.split(",", 1) if "," in req.full_page_image_base64 else ("", req.full_page_image_base64)
                        img_bytes = base64.b64decode(encoded)
                        req.text_blocks = _perform_ocr_on_page(img_bytes)
                    except Exception as e:
                        logger.error(f"Full page OCR failed: {e}")

                if req.text_blocks and len(req.text_blocks) > 0:
                    img_bbox = [req.crop_x, req.crop_y, req.crop_x + req.crop_w, req.crop_y + req.crop_h]
                    
                    if not res.get("tileNumber"):
                        nearest_num = detect_nearest_tile_number(img_bbox, req.text_blocks)
                        if nearest_num:
                            res["tileNumber"] = nearest_num
                            
                    if not res.get("tileName"):
                        nearest_name = detect_nearest_tile_name(img_bbox, req.text_blocks, res.get("tileNumber"))
                        if nearest_name:
                            res["tileName"] = nearest_name

            # Per user request: Use the Tile Number as the Tile Name to prevent duplicate names IF name is still empty/invalid
            if res.get("tileNumber") and (not res.get("tileName") or res.get("tileName").strip().lower() in ("", "unknown", "untitled")):
                res["tileName"] = res["tileNumber"]

            results.append(res)
            
        print(f"[HYBRID OCR RESULT] results: {results}")
        return {"results": results}
    except Exception as e:
        logger.error(f"Hybrid text extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            settings = None
            if settings_json:
                try:
                    settings = json.loads(settings_json)
                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="Invalid settings_json format")
            
            t = threading.Thread(target=process_template_background, args=(pdf_bytes, catalog_name, settings), daemon=True)
            mode = "template"
        else:
            detected_type = _detect_pdf_type(pdf_bytes)
            logger.info(f"Auto-detected PDF type for '{catalog_name}': {detected_type}")

            settings = None
            if settings_json:
                try:
                    settings = json.loads(settings_json)
                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="Invalid settings_json format")

            if detected_type == "template":
                t = threading.Thread(target=process_template_background, args=(pdf_bytes, catalog_name, settings), daemon=True)
                mode = "template-auto"
            elif detected_type == "scanned":
                t = threading.Thread(target=process_scanned_background, args=(pdf_bytes, catalog_name, settings), daemon=True)
                mode = "scanned-ocr"
            else:
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
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(TileCatalog)
    if catalog:
        query = query.filter(TileCatalog.catalog_name.ilike(f"%{catalog}%"))
    # Newest first so freshly extracted tiles appear at the top
    return query.order_by(TileCatalog.id.desc()).offset(skip).limit(limit).all()


@catalog_router.get("/catalogs")
def list_catalogs(db: Session = Depends(get_db)):
    results = db.query(TileCatalog.catalog_name).distinct().all()
    return {"catalogs": [r.catalog_name for r in results if r.catalog_name]}


@catalog_router.delete("/clear")
def clear_catalog(
    background_tasks: BackgroundTasks,
    catalog: Optional[str] = Query(None, description="Delete only this catalog"),
    db: Session = Depends(get_db),
):
    try:
        from app.routers.local_storage import _get_storage_path
        import os
        
        if catalog:
            tiles = db.query(TileCatalog).filter(TileCatalog.catalog_name == catalog).all()
        else:
            tiles = db.query(TileCatalog).all()

        count = 0
        cloudinary_urls_to_delete = []
        for tile in tiles:
            if tile.relative_image_path:
                storage_path = _get_storage_path()
                abs_path = os.path.join(storage_path, tile.relative_image_path)
                if os.path.exists(abs_path):
                    try:
                        os.remove(abs_path)
                    except Exception:
                        pass
            elif tile.image_url and "cloudinary.com" in tile.image_url:
                cloudinary_urls_to_delete.append(tile.image_url)
            
            db.delete(tile)
            count += 1
            
        db.commit()

        if cloudinary_urls_to_delete:
            def delete_cloudinary_images(urls):
                from app.services.cloudinary_service import delete_image
                for url in urls:
                    try:
                        delete_image(url)
                    except Exception as e:
                        logger.error(f"Failed to delete {url} from Cloudinary: {e}")
            
            background_tasks.add_task(delete_cloudinary_images, cloudinary_urls_to_delete)

        if catalog:
            return {"message": f"Deleted {count} records from catalog '{catalog}'"}
        else:
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


class TileUpdateBody(BaseModel):
    tile_name: Optional[str] = None
    tile_number: Optional[str] = None
    tile_size: Optional[str] = None

@catalog_router.patch("/tiles/{tile_id}")
def update_tile(
    tile_id: int,
    body: TileUpdateBody,
    db: Session = Depends(get_db),
):
    tile = db.query(TileCatalog).filter(TileCatalog.id == tile_id).first()
    if not tile:
        raise HTTPException(status_code=404, detail="Tile not found")
    if body.tile_name is not None:
        tile.tile_name = body.tile_name
    if body.tile_number is not None:
        tile.tile_number = body.tile_number
    if body.tile_size is not None:
        tile.tile_size = body.tile_size
    db.commit()
    db.refresh(tile)
    return {
        "id": tile.id,
        "tile_name": tile.tile_name,
        "tile_number": tile.tile_number,
        "tile_size": tile.tile_size,
        "image_url": tile.image_url,
    }


@catalog_router.delete("/tiles/{tile_number}")
def delete_tile(
    tile_number: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    try:
        from app.routers.local_storage import _get_storage_path
        import os
        
        # Delete all tiles matching this number
        tiles = db.query(TileCatalog).filter(TileCatalog.tile_number == tile_number).all()
        if not tiles:
            raise HTTPException(status_code=404, detail="Tile not found")
            
        deleted_count = 0
        for tile in tiles:
            if tile.relative_image_path:
                storage_path = _get_storage_path()
                abs_path = os.path.join(storage_path, tile.relative_image_path)
                if os.path.exists(abs_path):
                    try:
                        os.remove(abs_path)
                    except Exception:
                        pass
            elif tile.image_url and "cloudinary.com" in tile.image_url:
                def delete_cloudinary_image(url):
                    try:
                        from app.services.cloudinary_service import delete_image
                        delete_image(url)
                    except Exception as e:
                        logger.error(f"Failed to delete {url} from Cloudinary: {e}")
                
                background_tasks.add_task(delete_cloudinary_image, tile.image_url)
                
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
