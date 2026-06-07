import psycopg2, os
from dotenv import load_dotenv
load_dotenv('.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute('SELECT tile_name, tile_size, image_url FROM tile_catalog ORDER BY RANDOM() LIMIT 12')
for row in cur.fetchall():
    name = (row[0] or 'Unknown')[:30]
    size = row[1] or '-'
    url = (row[2] or 'None')[:60]
    print(f'{name:32s} | {size:12s} | {url}')
conn.close()
