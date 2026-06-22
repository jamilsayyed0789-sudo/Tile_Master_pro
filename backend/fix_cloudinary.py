
import re

with open("app/services/catalog_service.py", "r", encoding="utf-8") as f:
    code = f.read()

# Replace import
code = code.replace("from app.services.cloudinary_service import upload_image", "")

# Replace _upload_to_cloudinary definition
old_def = """def _upload_to_cloudinary(img_bytes: bytes, public_id: str) -> Optional[str]:
    try:
        return upload_image(img_bytes, public_id)
    except Exception as e:
        logger.warning(f"Cloudinary upload failed for {public_id}: {e}")
        return None"""

new_def = """def _save_to_local_storage(img_bytes: bytes, tile_number: str) -> Optional[tuple[str, str]]:
    try:
        from app.routers.local_storage import _get_storage_path, _build_relative_path
        import os
        from datetime import datetime
        
        storage_path = _get_storage_path()
        relative_path, filename = _build_relative_path(tile_number)
        
        now = datetime.utcnow()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        folder = os.path.join(storage_path, year, month)
        os.makedirs(folder, exist_ok=True)
        abs_path = os.path.join(folder, filename)
        
        with open(abs_path, "wb") as f:
            f.write(img_bytes)
            
        image_serve_url = f"/api/local/image?path={relative_path}"
        return (image_serve_url, relative_path)
    except Exception as e:
        logger.warning(f"Local storage save failed for {tile_number}: {e}")
        return None"""
code = code.replace(old_def, new_def)

# We need to replace the usage in extract_tiles_from_pdf and extract_tiles_from_scanned_pdf
# Find unique_uploads building
old_unique = """unique_uploads = [
        (t["img_bytes"], t["public_id"])
        for t in raw_tiles
        if t["img_bytes"] is not None
    ]"""
new_unique = """unique_uploads = [
        (t["img_bytes"], t["tile_number"])
        for t in raw_tiles
        if t["img_bytes"] is not None
    ]"""
code = code.replace(old_unique, new_unique)

old_executor = """        with ThreadPoolExecutor(max_workers=UPLOAD_WORKERS) as executor:
            future_to_public = {
                executor.submit(_upload_to_cloudinary, img_bytes, public_id): public_id
                for img_bytes, public_id in unique_uploads
            }
            for future in as_completed(future_to_public):
                public_id = future_to_public[future]
                try:
                    url = future.result()
                    hash_to_url[public_id] = url
                except Exception as e:
                    logger.warning(f"Upload failed for {public_id}: {e}")
                    hash_to_url[public_id] = None"""

new_executor = """        with ThreadPoolExecutor(max_workers=UPLOAD_WORKERS) as executor:
            future_to_num = {
                executor.submit(_save_to_local_storage, img_bytes, num): num
                for img_bytes, num in unique_uploads
            }
            for future in as_completed(future_to_num):
                num = future_to_num[future]
                try:
                    res = future.result()
                    hash_to_url[num] = res
                except Exception as e:
                    logger.warning(f"Local save failed for {num}: {e}")
                    hash_to_url[num] = None"""
code = code.replace(old_executor, new_executor)

# Now in the mapping back to tiles list
old_mapping = """    tiles = []
    for t in raw_tiles:
        tiles.append({
            "tile_name": t["tile_name"],
            "tile_number": t["tile_number"],
            "tile_size": t["tile_size"],
            "image_url": hash_to_url.get(t["public_id"]),
            "catalog_name": t["catalog_name"],
            "page_number": t["page_number"]
        })"""

new_mapping = """    tiles = []
    for t in raw_tiles:
        res = hash_to_url.get(t["tile_number"])
        url = res[0] if res else None
        rel = res[1] if res else None
        tiles.append({
            "tile_name": t["tile_name"],
            "tile_number": t["tile_number"],
            "tile_size": t["tile_size"],
            "image_url": url,
            "relative_image_path": rel,
            "catalog_name": t["catalog_name"],
            "page_number": t["page_number"]
        })"""
code = code.replace(old_mapping, new_mapping)

# Wait! There are two functions that do this. `extract_tiles_from_pdf` and `extract_tiles_from_scanned_pdf`
# The string replacement might hit both or I might need to adjust.
with open("app/services/catalog_service.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Done")

