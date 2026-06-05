import sqlite3
import os

db_path = r"c:\Personal_Work\Tile_box_calculator\backend\sql_app.db"

def clear_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("Tables found:", tables)
    
    # Clear specific tables (likely tiles and catalogs)
    for table in tables:
        table_name = table[0]
        if table_name not in ['sqlite_sequence', 'alembic_version']:
            try:
                cursor.execute(f"DELETE FROM {table_name};")
                print(f"Cleared table: {table_name}")
            except Exception as e:
                print(f"Error clearing {table_name}: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    clear_db()
