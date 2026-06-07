import psycopg2, os
from dotenv import load_dotenv
load_dotenv('.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT tile_name, image_url FROM tile_catalog WHERE image_url IS NOT NULL ORDER BY RANDOM() LIMIT 8")
for row in cur.fetchall():
    print(f'{row[0]!r},')
    print(f'  {row[1]}')
conn.close()
