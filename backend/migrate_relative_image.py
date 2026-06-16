from app.database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE tile_catalog ADD COLUMN relative_image_path VARCHAR(255)'))
            conn.commit()
            print("Successfully added relative_image_path")
        except Exception as e:
            print(f"Error (maybe already exists?): {e}")

if __name__ == "__main__":
    run()
