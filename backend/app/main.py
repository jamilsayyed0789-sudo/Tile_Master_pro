import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.models import User, Session, Subscription, TileCatalog
from app.routers import auth_router, catalog_router
from app.routers.tile_processor import tile_processor_router
from app.routers.subscription import subscription_router
# from app.routers.payment import payment_router  # Razorpay temporarily disabled


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="TileMasterPro API", version="2.0.0", lifespan=lifespan)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tile_processor_router)
app.include_router(catalog_router)
app.include_router(subscription_router)
# app.include_router(payment_router)  # Razorpay temporarily disabled

os.makedirs(os.path.join(os.getcwd(), "uploads"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    return {"message": "TileMasterPro API v2.0", "status": "running"}
