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


def _get_storage_path() -> str:
    settings = get_settings()
    path = settings.get("local_storage_path", "").strip()
    if not path:
        raise HTTPException(
            status_code=400,
            detail="Local storage folder not configured. Please set it in Settings first."
        )
    return path


def _build_relative_path(tile_number: str) -> tuple[str, str]:
    """Returns (relative_path, absolute_path) for the tile image."""
    now = datetime.utcnow()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    # Sanitize tile_number for use as filename
    safe_number = "".join(c for c in tile_number if c.isalnum() or c in "-_").strip()
    if not safe_number:
        safe_number = str(uuid.uuid4()).replace("-", "")
    filename = f"{safe_number}.jpg"
    relative_path = f"{year}/{month}/{filename}"
    return relative_path, filename


@local_storage_router.get("/status")
def get_storage_status():
    """Get the current local storage configuration status."""
    settings = get_settings()
    path = settings.get("local_storage_path", "").strip()
    if not path:
        return {"configured": False, "path": ""}
    exists = os.path.isdir(path)
    writable = False
    if exists:
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
        "exists": exists,
        "writable": writable,
    }


@local_storage_router.post("/save-tile")
def save_tile_locally(payload: LocalTileSave, db: Session = Depends(get_db)):
    """
    Save a tile image to the local folder and store its metadata in the database.
    The image must be provided as a base64 data URL (data:image/jpeg;base64,...).
    """
    storage_path = _get_storage_path()

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

    # Build file paths
    relative_path, filename = _build_relative_path(payload.tile_number)
    now = datetime.utcnow()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    folder = os.path.join(storage_path, year, month)
    os.makedirs(folder, exist_ok=True)
    abs_path = os.path.join(folder, filename)

    # If file already exists (duplicate number), add UUID suffix
    if os.path.exists(abs_path):
        safe_number = "".join(c for c in payload.tile_number if c.isalnum() or c in "-_").strip()
        uid = str(uuid.uuid4()).replace("-", "")[:6]
        filename = f"{safe_number}_{uid}.jpg"
        relative_path = f"{year}/{month}/{filename}"
        abs_path = os.path.join(folder, filename)

    # Write image to disk
    with open(abs_path, "wb") as f:
        f.write(img_bytes)

    # Build a local image URL that the frontend can use
    image_serve_url = f"/api/local/image?path={relative_path}"

    # Save metadata to database
    tile = TileCatalog(
        tile_name=payload.tile_name,
        tile_number=payload.tile_number,
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

    return FileResponse(abs_path, media_type="image/jpeg")
