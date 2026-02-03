from enum import Enum
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import Optional, ClassVar,List
import re
from .reviews import ReviewInUser

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(max_length=120)
    password: str =Field(min_length=8)
    role: UserRole = Field(default=UserRole.USER, example="user")




class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, examples=["john_doe"])
    email: EmailStr = Field(..., max_length=120, examples=["user@example.com"])

class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Password must be at least 8 characters with uppercase, lowercase, and number"
    )
    role: UserRole = Field(default=UserRole.USER)
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must be alphanumeric (letters, numbers, underscores only)')
        return v
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        errors = []
        if not re.search(r'[A-Z]', v):  # At least one uppercase
            errors.append('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):  # At least one lowercase
            errors.append('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):  # At least one number
            errors.append('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):  # At least one special character
            errors.append('Password must contain at least one special character')
        
        if errors:
            raise ValueError('; '.join(errors))
        return v

class UserLogin(BaseModel):
    username: str
    password: str
class UserOut(BaseModel):
    id:int
    username:str
    email:str
    role:str
    reviews: List[ReviewInUser] = []
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None