import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

now = datetime.now(timezone.utc)
new_trial_end = now + timedelta(days=3)

print(f'Resetting all trials to end at: {new_trial_end.isoformat()}')
print()

cur.execute('''
    UPDATE subscriptions
    SET trial_end_date = %s,
        account_status = 'active',
        updated_at = %s
    WHERE account_status IN ('expired', 'active')
    RETURNING id, user_id
''', (new_trial_end, now))

updated = cur.fetchall()
conn.commit()

print(f'Updated {len(updated)} subscriptions:')
cur.execute('''
    SELECT u.email, s.plan_type, s.account_status, s.trial_end_date
    FROM subscriptions s
    LEFT JOIN users u ON u.id = s.user_id
    ORDER BY s.updated_at DESC
''')
for row in cur.fetchall():
    print(f'  {row[0]:35s} | {row[1]:8s} | {row[2]:8s} | trial_end: {row[3]}')

conn.close()
print()
print('Done! All trials reset to 3 days from now. Log out and log back in to refresh.')
