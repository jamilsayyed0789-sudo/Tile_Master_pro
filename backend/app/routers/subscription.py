from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models.user import Subscription
from app.dependencies import get_current_user, TokenUser

subscription_router = APIRouter(prefix="/auth", tags=["Subscription"])


@subscription_router.get("/subscription")
def get_subscription(
    current_user: TokenUser = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .first()
    )
    if not sub:
        return {"subscription": None}

    return {
        "subscription": {
            "id": sub.id,
            "planType": sub.plan_type,
            "trialEndDate": sub.trial_end_date.isoformat() if sub.trial_end_date else None,
            "subscriptionEndDate": sub.subscription_end_date.isoformat() if sub.subscription_end_date else None,
            "accountStatus": sub.account_status,
            "createdAt": sub.created_at.isoformat(),
        }
    }
