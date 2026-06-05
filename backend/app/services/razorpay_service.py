import os
import logging
from typing import Optional

import razorpay
from app.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

logger = logging.getLogger(__name__)

_client: Optional[razorpay.Client] = None


def get_client() -> razorpay.Client:
    global _client
    if _client is None:
        _client = razorpay.Client(
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
        )
    return _client


PLAN_AMOUNTS = {
    "monthly": 219900,
    "lifetime": 1699900,
}


def create_order(plan_type: str, user_id: str) -> dict:
    amount = PLAN_AMOUNTS.get(plan_type)
    if not amount:
        raise ValueError(f"Invalid plan type: {plan_type}")

    client = get_client()
    order = client.order.create(
        {
            "amount": amount,
            "currency": "INR",
            "notes": {
                "plan_type": plan_type,
                "user_id": user_id,
            },
        }
    )
    return order


def verify_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    client = get_client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
