import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

settings_router = APIRouter(prefix="/api/settings", tags=["settings"])

SETTINGS_FILE = "app_settings.json"

class StorageSettings(BaseModel):
    local_storage_path: str

def get_settings():
    if not os.path.exists(SETTINGS_FILE):
        return {"local_storage_path": ""}
    try:
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {"local_storage_path": ""}

def save_settings(data: dict):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=4)

@settings_router.get("/storage")
def read_storage_settings():
    return get_settings()

@settings_router.post("/storage")
def update_storage_settings(settings: StorageSettings):
    # Verify the path is absolute and writable (or at least we can create it)
    path = settings.local_storage_path.strip()
    if path:
        if not os.path.isabs(path):
            raise HTTPException(status_code=400, detail="Path must be an absolute path")
        try:
            os.makedirs(path, exist_ok=True)
            # Try to write a test file
            test_file = os.path.join(path, ".test_write")
            with open(test_file, "w") as f:
                f.write("test")
            os.remove(test_file)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot write to folder: {str(e)}")

    data = get_settings()
    data["local_storage_path"] = path
    save_settings(data)
    return {"message": "Settings updated", "settings": data}
