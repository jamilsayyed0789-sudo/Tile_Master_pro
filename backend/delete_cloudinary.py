import os
import cloudinary
import cloudinary.api
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

print("Fetching and deleting resources in 'tile_catalog/'...")
try:
    next_cursor = None
    total_deleted = 0
    while True:
        resp = cloudinary.api.resources(
            type="upload", 
            prefix="tile_catalog/", 
            max_results=100, 
            next_cursor=next_cursor
        )
        resources = resp.get("resources", [])
        if not resources:
            break
            
        public_ids = [r["public_id"] for r in resources]
        delete_resp = cloudinary.api.delete_resources(public_ids)
        
        deleted_count = len(delete_resp.get("deleted", {}))
        total_deleted += deleted_count
        print(f"Deleted {deleted_count} images in this batch...")
        
        next_cursor = resp.get("next_cursor")
        if not next_cursor:
            break

    print(f"Total deleted: {total_deleted}")
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
