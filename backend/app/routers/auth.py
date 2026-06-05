from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models.user import User

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


class ForgotPasswordRequest(BaseModel):
    email: str


@auth_router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        print(f"[RESET] Password reset requested for {req.email}")
    return {"message": "If the email exists, a reset link has been sent."}
