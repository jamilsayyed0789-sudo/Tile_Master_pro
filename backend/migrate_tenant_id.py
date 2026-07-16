import os
from app.database import engine
from sqlalchemy import text, inspect

def migrate():
    inspector = inspect(engine)
    existing_cols = {c["name"] for c in inspector.get_columns("tile_catalog")}
    
    with engine.connect() as conn:
        if "tenant_id" not in existing_cols:
            print("Adding column: tenant_id")
            conn.execute(text("ALTER TABLE tile_catalog ADD COLUMN tenant_id VARCHAR(100) DEFAULT 'demo-user'"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tile_catalog_tenant_id ON tile_catalog (tenant_id)"))
            conn.commit()
            print("Migration successful.")
        else:
            print("Column tenant_id already exists.")

if __name__ == "__main__":
    migrate()
