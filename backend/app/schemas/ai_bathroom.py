from pydantic import BaseModel
from typing import Optional

class AIGenerationOptions(BaseModel):
    keepLayout: bool = True
    autoPerspective: bool = True
    hdRender: bool = True
    shadowMatching: bool = True
    reflectionMatching: bool = True

class AIGenerationRequest(BaseModel):
    bathroom_image_url: str
    tile_image_url: str
    tile_size: str
    options: AIGenerationOptions

class AIGenerationResponse(BaseModel):
    task_id: str
    status: str
    message: str

class AIStatusResponse(BaseModel):
    task_id: str
    status: str
    result_url: Optional[str] = None
    error: Optional[str] = None
