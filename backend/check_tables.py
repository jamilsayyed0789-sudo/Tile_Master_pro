import psycopg2
import os
from dotenv import load_dotenv
load_dotenv('.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' ORDER BY table_name
""")
print('Tables in DB:')
for row in cur.fetchall():
    print(f'  {row[0]}')
print()
cur.execute("SELECT COUNT(*) FROM tile_catalog")
print(f'tile_catalog row count: {cur.fetchone()[0]}')
conn.close()
