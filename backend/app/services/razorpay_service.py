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
    "monthly": 159900,
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


def create_subscription(plan_id: str, user_id: str) -> dict:
    client = get_client()
    subscription = client.subscription.create(
        {
            "plan_id": plan_id,
            "customer_notify": 1,
            "total_count": 12, # E.g., 12 months, or customize as needed
            "notes": {
                "user_id": user_id,
            },
        }
    )
    return subscription


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


def verify_subscription_signature(
    razorpay_subscription_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    client = get_client()
    try:
        client.utility.verify_subscription_payment_signature(
            {
                "razorpay_subscription_id": razorpay_subscription_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
