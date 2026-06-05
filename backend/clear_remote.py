import os
import sys
from sqlalchemy import create_engine, MetaData
from dotenv import load_dotenv
import cloudinary
import cloudinary.api

# Load env
load_dotenv(r"c:\Personal_Work\Tile_box_calculator\backend\.env")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DB URL")
    sys.exit(1)

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print("Connecting to DB...")
engine = create_engine(db_url)
metadata = MetaData()
metadata.reflect(bind=engine)

with engine.begin() as conn:
    if 'tile_catalog' in metadata.tables:
        conn.execute(metadata.tables['tile_catalog'].delete())
        print("Cleared 'tile_catalog' table.")

# Clear cloudinary
try:
    cloudinary.config(
        cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME"),
        api_key = os.environ.get("CLOUDINARY_API_KEY"),
        api_secret = os.environ.get("CLOUDINARY_API_SECRET"),
        secure = True
    )
    res = cloudinary.api.delete_all_resources()
    print("Cloudinary delete result:", res)
except Exception as e:
    print("Error deleting cloudinary:", e)

print("Done.")
