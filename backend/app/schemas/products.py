from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator, ConfigDict
from decimal import Decimal
from app.schemas.categories import CategoryOut
from .reviews import ReviewInProduct

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., ge=0, description="Product price")
    quantity: int = Field(0, ge=0)
    slug: Optional[str] = Field(None, max_length=255)
    status: str = Field("draft", pattern="^(draft|active|archived)$")
    category_id: Optional[int] = None

    @validator('slug')
    def slug_validator(cls, v):
        if v:
            # Convert to URL-friendly slug
            v = v.lower().strip().replace(' ', '-').replace('_', '-')
        return v

class ProductCreate(ProductBase):
        pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    slug: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, pattern="^(draft|active|archived)$")
    category_id: Optional[int] = None
    
    @validator('slug')
    def slug_validator(cls, v):
        if v:
            v = v.lower().strip().replace(' ', '-').replace('_', '-')
        return v

class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    
    category_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class ProductSimpleOut(BaseModel):
    id: int
    name: str
    description:str
    price: Decimal
    slug: Optional[str]
    status: str
    quantity: int
    category_name: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

class ProductImageSchema(BaseModel):
    id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    alt_text: Optional[str] = None
    is_primary: bool = False
    display_order: int = 0
    product_id: int
    
    model_config = ConfigDict(from_attributes=True)

class ProductImageSchema(BaseModel):
    id: int
    image_url: str
    thumbnail_url: Optional[str] = None
    alt_text: Optional[str] = None
    is_primary: bool = False
    display_order: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    products: List[ProductSimpleOut]
    total: int
    page: int
    limit: int
    images: List[ProductImageSchema] = []
    reviews: List[ReviewInProduct] = []
    average_rating: float = 0.0
    review_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class ProductFilter(BaseModel):
    category_id: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    in_stock: Optional[bool] = None
    status: Optional[str] = None
    search: Optional[str] = None
    
    @validator('min_price', 'max_price')
    def validate_price(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price must be positive')
        return v

class ProductWithCategory(ProductOut):
    category: Optional['CategoryOut'] = None


ProductWithCategory.model_rebuild()

model_config = ConfigDict(from_attributes=True)