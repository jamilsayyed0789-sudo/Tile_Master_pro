import os
import base64
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.catalog import TileCatalog
from app.routers.settings import get_settings

local_storage_router = APIRouter(prefix="/api/local", tags=["local-storage"])


class LocalTileSave(BaseModel):
    tile_name: str
    tile_number: str
    tile_size: Optional[str] = "N/A"
    finish: Optional[str] = "N/A"
    color: Optional[str] = "N/A"
    catalog_name: Optional[str] = None
    page_number: Optional[int] = None
    image_data_url: str  # base64 data URL like "data:image/jpeg;base64,..."
    has_name: Optional[bool] = None
    has_number: Optional[bool] = None


def _get_storage_path() -> str:
    settings = get_settings()
    path = settings.get("local_storage_path", "").strip()
    if not path:
        # Fallback to default uploads directory in the backend
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(base_dir, "uploads")
        os.makedirs(path, exist_ok=True)
    return path


def _build_relative_path(tile_number: str) -> tuple[str, str]:
    """Returns (relative_path, filename) for the tile image."""
    now = datetime.utcnow()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    
    # Check if tile_number already has an extension
    if tile_number.lower().endswith((".png", ".jpg", ".jpeg")):
        ext = os.path.splitext(tile_number)[1]
        base_name = os.path.splitext(tile_number)[0]
    else:
        ext = ".jpg"
        base_name = tile_number
        
    # Sanitize base_name for use as filename (convert spaces to underscores)
    import re
    safe_number = re.sub(r'\s+', '_', base_name)
    safe_number = "".join(c for c in safe_number if c.isalnum() or c in "-_").strip()
    if not safe_number:
        safe_number = str(uuid.uuid4()).replace("-", "")
    filename = f"{safe_number}{ext}"
    relative_path = f"{year}/{month}/{filename}"
    return relative_path, filename


@local_storage_router.get("/status")
def get_storage_status():
    """Get the current local storage configuration status."""
    path = _get_storage_path()
    writable = False
    try:
        test = os.path.join(path, ".test_write")
        with open(test, "w") as f:
            f.write("test")
        os.remove(test)
        writable = True
    except Exception:
        pass
    return {
        "configured": True,
        "path": path,
        "exists": True,
        "writable": writable,
    }


@local_storage_router.post("/save-tile")
def save_tile_locally(payload: LocalTileSave, db: Session = Depends(get_db)):
    """
    Save a tile image to the local folder and store its metadata in the database.
    The image must be provided as a base64 data URL (data:image/jpeg;base64,...).
    """
    storage_path = _get_storage_path()
    print(f"[SAVE TILE] payload: name={payload.tile_name}, number={payload.tile_number}, has_name={payload.has_name}, has_number={payload.has_number}")

    # Decode base64 image
    data_url = payload.image_data_url
    if "," in data_url:
        header, encoded = data_url.split(",", 1)
    else:
        encoded = data_url

    try:
        img_bytes = base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    # Guard: reject suspiciously tiny images (< 3.5 KB decoded).
    # Name/number OCR crop boxes produce tiny JPEG blobs (~4–8 KB) that should
    # NEVER be saved to disk as tile images — they are only used for OCR text
    # extraction. Real tile images are always significantly larger.
    # 3,500 bytes keeps us safely above pure-text JPEG crops (~2–4 KB raw).
    MIN_TILE_BYTES = 3500
    if len(img_bytes) < MIN_TILE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Image too small to be a tile ({len(img_bytes)} bytes). Name/number crop images should not be saved directly."
        )

    # Strictly respect what the user chose to crop:
    # has_name=True  → user drew a "Tile Name" crop box  → include name
    # has_number=True → user drew a "Tile Number" crop box → include number
    # If neither flag passed, fall back to heuristic validity
    import re

    def _clean(s: str) -> str:
        s = s.strip()
        s = re.sub(r'\s+', '_', s)
        s = "".join(c for c in s if c.isalnum() or c in "-_")
        return s

    def _is_placeholder_name(s: str) -> bool:
        """Returns True if the name is a generated placeholder, not a real tile name."""
        if not s:
            return True
        sl = s.strip().lower()
        return (
            sl in ("", "unknown", "untitled", "n/a") or
            sl.startswith("untitled page") or
            sl.startswith("tile page") or
            sl.startswith("untitled tile")
        )

    def _is_placeholder_number(s: str) -> bool:
        """Returns True if the number is a generated placeholder, not a real tile number."""
        if not s:
            return True
        sl = s.strip().lower()
        import re as _re
        return (
            sl in ("", "unknown", "n/a") or
            bool(_re.match(r'^p\d+(-\d+)?$', sl))   # P3, P5, P5-1 etc.
        )

    use_name   = payload.has_name   if payload.has_name   is not None else not _is_placeholder_name(payload.tile_name)
    use_number = payload.has_number if payload.has_number is not None else not _is_placeholder_number(payload.tile_number)

    clean_name   = _clean(payload.tile_name   or "") if use_name   else ""
    clean_number = _clean(payload.tile_number or "") if use_number else ""

    # Build filename based on user selection
    if clean_name and clean_number:
        filename_base = f"{clean_name}_{clean_number}"
    elif clean_number:
        filename_base = clean_number
    elif clean_name:
        filename_base = clean_name
    else:
        filename_base = payload.tile_number or payload.tile_name or "tile"

    # Build file path and save to disk
    relative_path, filename = _build_relative_path(filename_base)
    now = datetime.utcnow()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    folder = os.path.join(storage_path, year, month)
    os.makedirs(folder, exist_ok=True)
    abs_path = os.path.join(folder, filename)

    # If file already exists (duplicate), add short UUID suffix
    if os.path.exists(abs_path):
        base_name_f, ext = os.path.splitext(filename)
        uid = str(uuid.uuid4()).replace("-", "")[:6]
        filename = f"{base_name_f}_{uid}{ext}"
        relative_path = f"{year}/{month}/{filename}"
        abs_path = os.path.join(folder, filename)

    # Write image bytes to disk
    with open(abs_path, "wb") as f:
        f.write(img_bytes)

    # URL the frontend can use to display the image
    image_serve_url = f"/api/local/image?path={relative_path}"

    # DB fields: store only what the user selected
    db_name   = payload.tile_name   if use_name   else None
    db_number = payload.tile_number if use_number else None

    # Fallback display name if both are empty
    if not db_name and not db_number:
        db_name = f"Tile Page {payload.page_number or 1}"

    # Save metadata to database
    tile = TileCatalog(
        tile_name=db_name,
        tile_number=db_number,
        tile_size=payload.tile_size,
        image_url=image_serve_url,
        catalog_name=payload.catalog_name,
        page_number=payload.page_number,
        relative_image_path=relative_path,
    )
    db.add(tile)
    db.commit()
    db.refresh(tile)

    return {
        "id": tile.id,
        "tile_name": tile.tile_name,
        "tile_number": tile.tile_number,
        "tile_size": tile.tile_size,
        "image_url": tile.image_url,
        "relative_image_path": tile.relative_image_path,
        "saved_to": abs_path,
    }


@local_storage_router.get("/image")
def serve_local_image(path: str = Query(..., description="Relative image path, e.g. 2026/06/MW1201.jpg")):
    """
    Serve an image from the local storage folder.
    path should be a relative path like '2026/06/MW1201.jpg'.
    """
    storage_path = _get_storage_path()

    # Security: prevent path traversal
    # Normalize and ensure it's within the storage folder
    safe_relative = os.path.normpath(path).lstrip("/\\")
    if ".." in safe_relative:
        raise HTTPException(status_code=400, detail="Invalid path")

    abs_path = os.path.join(storage_path, safe_relative)

    if not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail="Image not found in local storage")

    # Detect media type from file extension
    ext = os.path.splitext(abs_path)[1].lower()
    media_type = "image/png" if ext == ".png" else "image/jpeg"
    return FileResponse(abs_path, media_type=media_type)
