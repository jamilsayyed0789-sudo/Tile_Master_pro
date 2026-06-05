from datetime import datetime
from typing import Union
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models.user import User, Session, Subscription


class TokenUser:
    def __init__(self, id: str, email: str, name: str, access_status: str):
        self.id = id
        self.email = email
        self.name = name
        self.access_status = access_status


def get_current_user(
    authorization: Union[str, None] = Header(default=None),
    db: DBSession = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception

    token = authorization.split(" ")[1]

    # Better-Auth sends token as <session_id>.<signature>
    # DB stores just the session_id in the token column
    session_token = token.split(".")[0]

    # Look up session by token
    session = db.query(Session).filter(Session.token == session_token).first()
    if not session:
        raise credentials_exception

    # Check if session is expired
    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        raise credentials_exception

    # Look up user
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise credentials_exception

    # Check subscription status
    subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
        .first()
    )

    access_status = "active"
    if subscription:
        if subscription.account_status == "blocked":
            access_status = "blocked"
        elif subscription.account_status == "expired":
            access_status = "expired"
        elif (
            subscription.plan_type == "trial"
            and subscription.trial_end_date
            and subscription.trial_end_date < datetime.utcnow()
        ):
            subscription.account_status = "expired"
            subscription.updated_at = datetime.utcnow()
            db.commit()
            access_status = "expired"
        elif (
            subscription.subscription_end_date
            and subscription.subscription_end_date < datetime.utcnow()
        ):
            subscription.account_status = "expired"
            subscription.updated_at = datetime.utcnow()
            db.commit()
            access_status = "expired"

    if access_status == "blocked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Please contact support.",
        )
    if access_status == "expired":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription has expired. Please renew to continue.",
        )

    return TokenUser(
        id=user.id,
        email=user.email,
        name=user.name,
        access_status=access_status,
    )
