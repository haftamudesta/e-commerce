from pydantic import BaseModel, ConfigDict, Field, validator
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    text: str = Field(..., min_length=5, max_length=2000, description="Review text")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    
    @validator('text')
    def validate_text(cls, v):
        if len(v.strip()) < 5:
            raise ValueError('Review text must be at least 5 characters long')
        return v.strip()
    
    @validator('rating')
    def validate_rating(cls, v):
        if v not in [1, 2, 3, 4, 5]:
            raise ValueError('Rating must be between 1 and 5')
        return v

class ReviewCreate(ReviewBase):
    product_id: int

class ReviewUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=10, max_length=2000)
    rating: Optional[int] = Field(None, ge=1, le=5)

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    product_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ReviewInProduct(ReviewBase):
    id: int
    user_id: int
    created_at: datetime
    username: Optional[str] = None # Will be populated
    user_avatar: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class ReviewInUser(ReviewBase):
    id: int
    product_id: int
    created_at: datetime
    product_name: Optional[str] = None  
    product_slug: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)