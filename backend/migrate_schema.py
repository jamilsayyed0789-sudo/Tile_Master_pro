"""
One-time migration: add new columns, populate filename from image_url,
drop image_url.

Run from backend/ directory with PYTHONPATH set to ".":
  $env:PYTHONPATH="."; python migrate_schema.py
"""

import re
from app.database import engine, SessionLocal
from sqlalchemy import text, inspect

inspector = inspect(engine)
existing_cols = {c["name"] for c in inspector.get_columns("tile_catalog")}

print(f"Existing columns: {existing_cols}")

# ── 1. Add new nullable columns ───────────────────────────────────────────────
new_cols = {
    "filename": "VARCHAR(255)",
    "finish": "VARCHAR(50)",
    "color": "VARCHAR(100)",
    "category": "VARCHAR(100)",
    "series": "VARCHAR(100)",
    "sku": "VARCHAR(100)",
}

with engine.connect() as conn:
    for col_name, col_type in new_cols.items():
        if col_name not in existing_cols:
            print(f"Adding column: {col_name} ({col_type})")
            conn.execute(text(f"ALTER TABLE tile_catalog ADD COLUMN {col_name} {col_type}"))
    conn.commit()

# ── 2. Populate filename from image_url ───────────────────────────────────────
db = SessionLocal()
rows = db.execute(
    text("SELECT id, tile_number, image_url FROM tile_catalog ORDER BY id")
).fetchall()

seen_filenames: set = set()
updates = []

for r in rows:
    row_id, tile_number, image_url = r
    if not image_url:
        # No URL to extract from — use tile_number as fallback
        filename = re.sub(r"[^A-Za-z0-9._-]", "_", str(tile_number)).strip("._-") or f"tile_{row_id}"
        filename = f"{filename}.jpg"
    else:
        # Extract the last path segment from the Cloudinary URL
        filename = image_url.rstrip("/").split("/")[-1]

    # Deduplicate filenames — append tile_number suffix if already seen
    base, ext = filename.rsplit(".", 1) if "." in filename else (filename, "jpg")
    candidate = filename
    suffix = 2
    while candidate.lower() in seen_filenames:
        candidate = f"{base}_{suffix}.{ext}"
        suffix += 1
    seen_filenames.add(candidate.lower())
    updates.append((candidate, row_id))

for filename, row_id in updates:
    db.execute(
        text("UPDATE tile_catalog SET filename = :fn WHERE id = :id"),
        {"fn": filename, "id": row_id},
    )

db.commit()
print(f"Populated filename for {len(updates)} rows")

# ── 3. Make filename NOT NULL and add index ────────────────────────────────────
db.execute(text("ALTER TABLE tile_catalog ALTER COLUMN filename SET NOT NULL"))
db.execute(
    text(
        "CREATE INDEX IF NOT EXISTS ix_tile_catalog_filename "
        "ON tile_catalog (filename)"
    )
)
print("Set filename NOT NULL and added index")

# ── 4. Drop image_url ─────────────────────────────────────────────────────────
if "image_url" in existing_cols:
    db.execute(text("ALTER TABLE tile_catalog DROP COLUMN image_url"))
    print("Dropped column: image_url")

db.commit()
db.close()

# ── 5. Verify ──────────────────────────────────────────────────────────────────
inspector2 = inspect(engine)
final_cols = {c["name"] for c in inspector2.get_columns("tile_catalog")}
print(f"Final columns: {final_cols}")

# Quick sanity check
db2 = SessionLocal()
remaining = db2.execute(text("SELECT id, filename FROM tile_catalog ORDER BY id")).fetchall()
for r in remaining:
    print(f"  id={r[0]} filename={r[1]}")
db2.close()

print("\nMigration complete ✓")
