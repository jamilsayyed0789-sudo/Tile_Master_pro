from app.database import SessionLocal
from app.models.catalog import TileCatalog

db = SessionLocal()
try:
    tiles = db.query(TileCatalog).all()
    print(f"Total tiles in database: {len(tiles)}")
    for t in tiles:
        print(f"ID: {t.id} | Name: {t.tile_name} | Number: {t.tile_number} | Size: {t.tile_size} | Catalog: {t.catalog_name} | Image URL: {t.image_url} | Relative Path: {t.relative_image_path}")
finally:
    db.close()
