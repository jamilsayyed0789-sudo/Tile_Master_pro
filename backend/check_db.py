import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

print('=== Users ===')
cur.execute('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 5')
for row in cur.fetchall():
    print(f'  {row[0][:25]}... | {row[1]} | {row[2]} | created: {row[3]}')

print()
print('=== Subscriptions ===')
cur.execute('''SELECT s.id, u.email, s.plan_type, s.account_status,
                      s.trial_end_date, s.subscription_end_date, s.created_at
               FROM subscriptions s
               LEFT JOIN users u ON u.id = s.user_id
               ORDER BY s.created_at DESC LIMIT 10''')
rows = cur.fetchall()
if not rows:
    print('  (no subscriptions found)')
for row in rows:
    print(f'  sub: {row[0][:20]}...')
    print(f'    user: {row[1]} | plan: {row[2]} | status: {row[3]}')
    print(f'    trial_end: {row[4]} | sub_end: {row[5]} | created: {row[6]}')
    if row[4]:
        try:
            trial_end = row[4] if isinstance(row[4], datetime) else datetime.fromisoformat(str(row[4]).replace('Z', '+00:00'))
            now = datetime.utcnow()
            if trial_end.tzinfo:
                from datetime import timezone
                now = datetime.now(timezone.utc)
            diff = trial_end - now
            status = 'EXPIRED' if diff.total_seconds() < 0 else 'active'
            print(f'    Trial {status} (diff: {diff})')
        except Exception as e:
            print(f'    (parse error: {e})')
    print()

print('=== Sessions ===')
cur.execute('SELECT id, user_id, expires_at, token FROM sessions ORDER BY expires_at DESC LIMIT 5')
for row in cur.fetchall():
    print(f'  {row[0][:20]}... | user: {row[1][:25]}... | expires: {row[2]} | token: {row[3][:30]}...')

conn.close()
