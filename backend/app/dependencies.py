from typing import Union
from fastapi import Depends, HTTPException, Header, status
from jose import JWTError, jwt
from app.config import SECRET_KEY, ALGORITHM


class TokenUser:
    def __init__(self, id: str, email: str, name: str, access_status: str):
        self.id = id
        self.email = email
        self.name = name
        self.access_status = access_status


def get_current_user(
    authorization: Union[str, None] = Header(default=None),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("userId")
        email: str = payload.get("sub")
        name: str = payload.get("name", "")
        access_status: str = payload.get("accessStatus", "active")
        if not user_id or not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    if access_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription has expired. Please renew to continue.",
        )

    return TokenUser(
        id=user_id,
        email=email,
        name=name,
        access_status=access_status,
    )
