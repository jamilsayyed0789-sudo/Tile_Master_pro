import logging
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.catalog import TileCatalog
from app.schemas.catalog import CatalogUploadResponse, TileCatalogResponse, TileSearchResult
from app.services.catalog_service import extract_tiles_from_pdf

logger = logging.getLogger(__name__)

catalog_router = APIRouter(prefix="/catalog", tags=["Tile Catalog"])


def process_catalog_background(pdf_bytes: bytes, catalog_name: str):
    try:
        tiles = extract_tiles_from_pdf(pdf_bytes, catalog_name)
        if not tiles:
            logger.warning(f"No tiles extracted from {catalog_name}")
            return
            
        db = SessionLocal()
        try:
            inserted = 0
            for tile_data in tiles:
                try:
                    existing = db.query(TileCatalog).filter(
                        TileCatalog.tile_number == tile_data["tile_number"],
                        TileCatalog.catalog_name == catalog_name,
                    ).first()
                    if existing:
                        continue

                    db_tile = TileCatalog(**tile_data)
                    db.add(db_tile)
                    db.commit()
                    inserted += 1
                except Exception as e:
                    logger.warning(f"Failed to insert tile {tile_data.get('tile_number')}: {e}")
                    db.rollback()
                    continue
            logger.info(f"Successfully processed {catalog_name}, inserted {inserted} tiles.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Background processing of {catalog_name} failed: {e}", exc_info=True)

@catalog_router.post("/upload", response_model=CatalogUploadResponse)
async def upload_catalog(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    if file.size and file.size > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit")

    catalog_name = os.path.splitext(file.filename)[0]

    try:
        pdf_bytes = await file.read()
        logger.info(f"Received PDF '{catalog_name}': {len(pdf_bytes)} bytes")

        background_tasks.add_task(process_catalog_background, pdf_bytes, catalog_name)

        return CatalogUploadResponse(
            message=f"Upload received. Processing '{catalog_name}' in the background. Please check the search page in a few minutes.",
            tiles_extracted=0,
            catalog_name=catalog_name,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Catalog upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process catalog: {str(e)}")


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
