from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    User as UserSchema,
    Token,
    AuthStatus,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth import verify_password, get_password_hash, create_access_token
from app.dependencies import get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register", response_model=UserSchema)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_pw,
        role="customer",
        trial_started_at=datetime.utcnow(),
        is_paid=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@auth_router.post("/login", response_model=Token)
def login_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.get("/status", response_model=AuthStatus)
def get_auth_status(current_user: User = Depends(get_current_user)):
    trial_days = 3
    elapsed = datetime.utcnow() - current_user.trial_started_at
    trial_days_left = max(0, trial_days - elapsed.days - elapsed.seconds / 86400)
    is_expired = trial_days_left <= 0 and not current_user.is_paid
    return AuthStatus(
        email=current_user.email,
        is_active=current_user.is_active,
        role=current_user.role,
        trial_started_at=current_user.trial_started_at,
        trial_days_left=round(trial_days_left, 1),
        is_paid=current_user.is_paid,
        is_expired=is_expired,
    )


@auth_router.post("/activate/{email}")
def activate_user(email: str, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.is_paid = True
    db.commit()
    return {"message": f"User {email} activated successfully"}


@auth_router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        token = str(uuid.uuid4())
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        print(f"[RESET LINK] http://localhost:3000/auth/reset-password?token={token}")
    return {"message": "If the email exists, a reset link has been sent."}


@auth_router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.reset_token == req.token,
        User.reset_token_expiry > datetime.utcnow(),
    ).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"message": "Password reset successfully"}
