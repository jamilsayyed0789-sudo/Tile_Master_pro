import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.catalog import TileCatalog
from app.models.user import Subscription

load_dotenv('.env')
DATABASE_URL = os.getenv('DATABASE_URL')
print(f'DATABASE_URL starts with: {DATABASE_URL[:30]}...')

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()
try:
    results = db.query(TileCatalog.catalog_name).distinct().all()
    print(f'catalogs: {[r[0] for r in results if r[0]]}')
    tiles = db.query(TileCatalog).limit(2).all()
    for t in tiles:
        print(f'tile: {t.tile_name}, created_at: {t.created_at}, type: {type(t.created_at)}')
    subs = db.query(Subscription).limit(2).all()
    for s in subs:
        print(f'sub: {s.id}, plan: {s.plan_type}, status: {s.account_status}, created_at: {s.created_at}')
finally:
    db.close()
print('OK')
