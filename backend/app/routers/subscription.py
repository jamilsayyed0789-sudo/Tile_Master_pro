from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user, TokenUser

subscription_router = APIRouter(prefix="/auth", tags=["Subscription"])


@subscription_router.post("/purchase")
def purchase_plan(
    plan_data: dict,
    current_user: TokenUser = Depends(get_current_user),
):
    plan_type = plan_data.get("planType")
    if plan_type not in ("monthly", "lifetime"):
        raise HTTPException(
            status_code=400,
            detail="Invalid plan type. Must be 'monthly' or 'lifetime'.",
        )

    import psycopg2
    from app.config import DATABASE_URL

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id, plan_type, account_status FROM subscriptions WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
            (current_user.id,),
        )
        existing = cur.fetchone()

        now = datetime.utcnow()
        if plan_type == "monthly":
            sub_end = now + timedelta(days=30)
        else:
            sub_end = None  # never expires

        if existing:
            cur.execute(
                """UPDATE subscriptions
                   SET plan_type = %s, subscription_end_date = %s,
                       account_status = 'active', updated_at = %s
                   WHERE user_id = %s""",
                (plan_type, sub_end, now, current_user.id),
            )
        else:
            cur.execute(
                """INSERT INTO subscriptions (id, user_id, plan_type, trial_end_date, subscription_end_date, account_status, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, %s, 'active', %s, %s)""",
                (
                    __import__("uuid").uuid4().hex,
                    current_user.id,
                    plan_type,
                    now + timedelta(days=3),
                    sub_end,
                    now,
                    now,
                ),
            )
        conn.commit()
        return {
            "message": f"{plan_type.capitalize()} plan activated successfully",
            "plan_type": plan_type,
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@subscription_router.get("/subscription")
def get_subscription(
    current_user: TokenUser = Depends(get_current_user),
):
    import psycopg2
    from app.config import DATABASE_URL

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id, plan_type, trial_end_date, subscription_end_date, account_status, created_at FROM subscriptions WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
            (current_user.id,),
        )
        row = cur.fetchone()
        if not row:
            return {"subscription": None}

        return {
            "subscription": {
                "id": row[0],
                "planType": row[1],
                "trialEndDate": row[2].isoformat() if row[2] else None,
                "subscriptionEndDate": row[3].isoformat() if row[3] else None,
                "accountStatus": row[4],
                "createdAt": row[5].isoformat(),
            }
        }
    finally:
        cur.close()
        conn.close()
