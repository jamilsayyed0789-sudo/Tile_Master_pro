from app.database import engine
from app.models.qr_code import QRCodeTile
from sqlalchemy import inspect, text

inspector = inspect(engine)
cols = [c['name'] for c in inspector.get_columns('qr_tiles')]
print('Existing columns:', cols)

with engine.connect() as conn:
    if 'price_per_sqft' not in cols:
        conn.execute(text('ALTER TABLE qr_tiles ADD COLUMN price_per_sqft FLOAT'))
        conn.commit()
        print('✅ Column price_per_sqft added successfully')
    else:
        print('ℹ️  Column price_per_sqft already exists')
