import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models.user import Subscription
from app.dependencies import get_current_user, TokenUser
from app.services.razorpay_service import create_order, verify_signature
from app.config import RAZORPAY_KEY_ID

payment_router = APIRouter(prefix="/payment", tags=["Payment"])


class CreateOrderRequest(BaseModel):
    planType: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_type: str


@payment_router.post("/create-order")
def create_payment_order(
    req: CreateOrderRequest,
    current_user: TokenUser = Depends(get_current_user),
):
    if req.planType not in ("monthly", "lifetime"):
        raise HTTPException(status_code=400, detail="Invalid plan type")

    try:
        order = create_order(req.planType, current_user.id)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")


@payment_router.post("/verify")
def verify_payment(
    req: VerifyPaymentRequest,
    current_user: TokenUser = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    is_valid = verify_signature(
        req.razorpay_order_id,
        req.razorpay_payment_id,
        req.razorpay_signature,
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    now = datetime.utcnow()
    sub_end = now + timedelta(days=30) if req.plan_type == "monthly" else None

    existing = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .first()
    )

    if existing:
        existing.plan_type = req.plan_type
        existing.subscription_end_date = sub_end
        existing.account_status = "active"
        existing.updated_at = now
    else:
        db.add(
            Subscription(
                id=uuid.uuid4().hex,
                user_id=current_user.id,
                plan_type=req.plan_type,
                trial_end_date=None,
                subscription_end_date=sub_end,
                account_status="active",
                created_at=now,
                updated_at=now,
            )
        )

    db.commit()

    return {
        "message": f"{req.plan_type.capitalize()} plan activated successfully",
        "plan_type": req.plan_type,
    }
