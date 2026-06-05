from sqlalchemy import Boolean, Column, String, DateTime, Text
import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Text, primary_key=True)
    email = Column(Text, unique=True, nullable=False)
    email_verified = Column(Boolean, nullable=False, default=False)
    name = Column(Text, nullable=False)
    image = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Text, primary_key=True)
    user_id = Column(Text, nullable=False, index=True)
    token = Column(Text, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    ip_address = Column(Text, nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Text, primary_key=True)
    user_id = Column(Text, nullable=False, index=True)
    plan_type = Column(Text, nullable=False, default="trial")
    trial_end_date = Column(DateTime, nullable=True)
    subscription_end_date = Column(DateTime, nullable=True)
    account_status = Column(Text, nullable=False, default="active")
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
