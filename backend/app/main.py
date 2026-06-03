from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models.user import User
from app.routers import auth_router
from app.routers.tile_processor import tile_processor_router

app = FastAPI(title="TileMasterPro API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tile_processor_router)


@app.get("/")
def read_root():
    return {"message": "TileMasterPro API v2.0", "status": "running"}
