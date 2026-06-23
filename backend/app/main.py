import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.models import User, Session, Subscription, TileCatalog, QRCodeTile, Lead
from app.routers import auth_router, catalog_router
from app.routers.tile_processor import tile_processor_router
from app.routers.subscription import subscription_router
from app.routers.qr_code import qr_router
from app.routers.settings import settings_router
from app.routers.local_storage import local_storage_router
from app.routers.payment import payment_router

# Global OCR engine placeholder (will be set on app startup)
ocr_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ocr_engine
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)
    # Initialize PaddleOCR once when the app starts (singleton to save RAM)
    try:
        from paddleocr import PaddleOCR
        import logging as _logging
        _logging.getLogger(__name__).info("Initializing PaddleOCR engine...")
        # Lightweight English mobile model — fast, low RAM, good accuracy for printed text
        ocr_engine = PaddleOCR(
            use_angle_cls=False,
            lang='en',
            show_log=False,
        )
        _logging.getLogger(__name__).info("PaddleOCR engine initialized successfully.")
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to initialize PaddleOCR: {e}")
        ocr_engine = None
    yield
    # Cleanup
    ocr_engine = None

def get_ocr_engine():
    """FastAPI dependency that returns the initialized OCR engine (or None)."""
    return ocr_engine

app = FastAPI(title="TileMasterPro API", version="2.0.0", lifespan=lifespan)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tile_processor_router)
app.include_router(catalog_router)
app.include_router(subscription_router)
app.include_router(qr_router)
app.include_router(settings_router)
app.include_router(local_storage_router)
app.include_router(payment_router)

os.makedirs(os.path.join(os.getcwd(), "uploads"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "TileMasterPro API v2.0", "status": "running"}
