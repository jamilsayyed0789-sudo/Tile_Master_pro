import cv2
import numpy as np
import os
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response

tile_processor_router = APIRouter(prefix="/tile-processor", tags=["Tile Processor"])

PROCESSED_DIR = "processed_tiles"
os.makedirs(PROCESSED_DIR, exist_ok=True)

@tile_processor_router.post("/process")
async def process_tile_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return Response(status_code=400, content="Invalid image")

    h, w = img.shape[:2]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 100)

    kernel = np.ones((5, 5), np.uint8)
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        total_area = h * w
        if area >= total_area * 0.15:
            x, y, tw, th = cv2.boundingRect(largest)
            margin_x = int(tw * 0.05)
            margin_y = int(th * 0.05)
            x = max(0, x - margin_x)
            y = max(0, y - margin_y)
            tw = min(w - x, tw + margin_x * 2)
            th = min(h - y, th + margin_y * 2)

            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.drawContours(mask, [largest], -1, 255, -1)

            result = cv2.bitwise_and(img, img, mask=mask)
            cropped = result[y:y+th, x:x+tw]
            cropped_mask = mask[y:y+th, x:x+tw]

            bg = np.zeros((th, tw, 4), dtype=np.uint8)
            bg[:, :, :3] = cropped
            bg[:, :, 3] = cropped_mask

            _, buffer = cv2.imencode(".png", bg)
            return Response(content=buffer.tobytes(), media_type="image/png")

    _, buffer = cv2.imencode(".png", img)
    return Response(content=buffer.tobytes(), media_type="image/png")
