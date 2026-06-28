from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Optional
from app.schemas.ai_bathroom import AIGenerationRequest, AIGenerationResponse, AIStatusResponse
from app.services.ai_bathroom_service import start_generation_task, get_task_status
import shutil
import os
import uuid

ai_bathroom_router = APIRouter(prefix="/api/ai/bathroom", tags=["AI Bathroom"])

UPLOAD_DIR = "uploads/ai_bathroom"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@ai_bathroom_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Endpoint to handle image uploads for the AI Bathroom feature.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/{file_location.replace(os.sep, '/')}"}

@ai_bathroom_router.post("/generate", response_model=AIGenerationResponse)
async def generate_bathroom(request: AIGenerationRequest):
    """
    Endpoint to start the AI generation task.
    """
    try:
        task_id = start_generation_task(
            bathroom_image_url=request.bathroom_image_url,
            tile_image_url=request.tile_image_url,
            tile_size=request.tile_size,
            options=request.options.dict()
        )
        return AIGenerationResponse(
            task_id=task_id,
            status="accepted",
            message="Generation task started successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ai_bathroom_router.get("/status/{task_id}", response_model=AIStatusResponse)
async def check_status(task_id: str):
    """
    Endpoint to poll the status of an AI generation task.
    """
    status_info = get_task_status(task_id)
    if status_info.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Task not found")
        
    return AIStatusResponse(
        task_id=task_id,
        status=status_info["status"],
        result_url=status_info.get("result_url"),
        error=status_info.get("error")
    )
