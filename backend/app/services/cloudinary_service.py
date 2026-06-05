import io
import os
import logging
from typing import Optional

from app.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

logger = logging.getLogger(__name__)

_configured = False


def ensure_configured():
    global _configured
    if not _configured and CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
        import cloudinary
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True,
        )
        _configured = True


def upload_image(image_bytes: bytes, public_id: str, folder: str = "tile_catalog") -> Optional[str]:
    try:
        ensure_configured()
        if not _configured:
            logger.warning("Cloudinary not configured. Falling back to local storage.")
            
            # Setup local directory
            local_dir = os.path.join(os.getcwd(), "uploads", folder)
            os.makedirs(local_dir, exist_ok=True)
            
            # Save file locally
            file_path = os.path.join(local_dir, f"{public_id}.jpg")
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            
            # Return URL path that the frontend can use
            return f"http://127.0.0.1:8000/uploads/{folder}/{public_id}.jpg"

        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            public_id=public_id,
            folder=folder,
            resource_type="image",
            overwrite=True,
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return None

def delete_image(image_url: str) -> bool:
    if not image_url:
        return False
    try:
        ensure_configured()
        if not _configured or "127.0.0.1" in image_url or "localhost" in image_url:
            # Local fallback deletion
            import urllib.parse
            path = urllib.parse.urlparse(image_url).path
            if path.startswith("/uploads/"):
                local_path = os.path.join(os.getcwd(), path.lstrip("/"))
                if os.path.exists(local_path):
                    os.remove(local_path)
            return True

        import re
        import cloudinary.uploader
        match = re.search(r'/upload/(?:v\d+/)?(.*?)(?:\.[a-zA-Z0-9]+)?$', image_url)
        if match:
            public_id = match.group(1)
            cloudinary.uploader.destroy(public_id)
            return True
        return False
    except Exception as e:
        logger.error(f"Cloudinary delete failed: {e}")
        return False
