from pydantic import BaseModel, ConfigDict,Field
from typing import Optional

class CategoryBase(BaseModel):
    name: str =Field(min_length=1, max_length=100)

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None

class Category(CategoryBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class CategoryOut(BaseModel):
    id:int
    name: str