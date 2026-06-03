from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class BrandBase(BaseModel):
    name: str
    description: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class Brand(BrandBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class TileBase(BaseModel):
    name: str
    category: str
    size: str
    tiles_per_box: int
    price_per_box: float
    brand_id: int
    image_url: Optional[str] = None

class TileCreate(TileBase):
    pass

class Tile(TileBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CalculationBase(BaseModel):
    calc_type: str
    input_data: str
    result_data: str

class CalculationCreate(CalculationBase):
    pass

class Calculation(CalculationBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role: str
    trial_started_at: datetime
    is_paid: bool
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AuthStatus(BaseModel):
    email: str
    is_active: bool
    role: str
    trial_started_at: datetime
    trial_days_left: float
    is_paid: bool
    is_expired: bool

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
