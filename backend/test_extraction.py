import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.catalog_service import extract_tiles_from_pdf
from app.models.catalog import TileCatalog
import json

def test_extraction():
    db = SessionLocal()
    with open("test_tiles.pdf", "rb") as f:
        pdf_bytes = f.read()

    print("Extracting tiles...")
    tiles = extract_tiles_from_pdf(pdf_bytes, "test_catalog")
    print(f"Extracted {len(tiles)} tiles")
    
    for t in tiles:
        print(t)
        
        existing = db.query(TileCatalog).filter(
            TileCatalog.tile_number == t["tile_number"],
            TileCatalog.catalog_name == "test_catalog"
        ).first()
        if not existing:
            db_tile = TileCatalog(**t)
            db.add(db_tile)
    
    db.commit()
    print("Database updated.")
    
    # Test search
    print("\nSearch results for 'test':")
    results = db.query(TileCatalog).filter(TileCatalog.catalog_name == "test_catalog").all()
    for r in results:
        print(f"Name: {r.tile_name}, Number: {r.tile_number}, Size: {r.tile_size}")

if __name__ == "__main__":
    test_extraction()
