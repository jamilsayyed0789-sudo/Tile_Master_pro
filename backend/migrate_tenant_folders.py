import os
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.routers.local_storage import _get_storage_path

def migrate_folders():
    db = SessionLocal()
    try:
        tiles = db.execute(text("SELECT id, relative_image_path, tenant_id FROM tile_catalog")).fetchall()
        
        storage_root = _get_storage_path()
        migrated_count = 0
        error_count = 0
        
        for tile in tiles:
            tile_id, relative_path, tenant_id = tile
            
            if not tenant_id:
                tenant_id = "demo-user"
                db.execute(text("UPDATE tile_catalog SET tenant_id = :tenant_id WHERE id = :id"), {"tenant_id": tenant_id, "id": tile_id})
                
            if not relative_path:
                continue
                
            # Normalize path
            relative_path = relative_path.replace("\\", "/")
            
            # Skip if already migrated
            if relative_path.startswith(f"{tenant_id}/"):
                continue
                
            old_abs_path = os.path.join(storage_root, relative_path)
            if not os.path.exists(old_abs_path):
                print(f"File missing, cannot move: {old_abs_path}")
                continue
                
            # New path
            new_relative_path = f"{tenant_id}/{relative_path}"
            new_abs_path = os.path.join(storage_root, new_relative_path)
            
            os.makedirs(os.path.dirname(new_abs_path), exist_ok=True)
            
            try:
                os.rename(old_abs_path, new_abs_path)
                
                # Update DB
                # Example image url: /api/local/image?path=2026/06/file.jpg -> /api/local/image?path=tenant_id/2026/06/file.jpg
                
                db.execute(
                    text("""
                        UPDATE tile_catalog 
                        SET relative_image_path = :new_path,
                            image_url = REPLACE(image_url, 'path=' || :old_path, 'path=' || :new_path)
                        WHERE id = :id
                    """),
                    {"new_path": new_relative_path, "old_path": relative_path, "id": tile_id}
                )
                migrated_count += 1
            except Exception as e:
                print(f"Failed to move {old_abs_path} to {new_abs_path}: {e}")
                error_count += 1
                
        db.commit()
        print(f"Migration complete. Migrated {migrated_count} files. Errors: {error_count}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_folders()
