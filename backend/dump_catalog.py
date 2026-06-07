import psycopg2
import os
from dotenv import load_dotenv
load_dotenv('.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT id, tile_name, tile_number, tile_size, image_url, catalog_name, page_number, created_at FROM tile_catalog ORDER BY id LIMIT 3")
for row in cur.fetchall():
    print(row)
conn.close()
