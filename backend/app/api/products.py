from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import aiofiles
import os
from datetime import datetime

from app.models.products import Product
from app.models.categories import Category
from app.schemas.products import ProductCreate, ProductUpdate, ProductOut, ProductListResponse, ProductWithCategory
from app.database.database import get_db
from app.api.users import require_roles
from app.models.users import User

router = APIRouter(prefix="/api/v1/products", tags=["products"])

UPLOAD_DIR = "uploads/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=ProductListResponse)
async def get_products(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all products with pagination and filtering
    """

    query = select(Product)
    
    if category_id:
        query = query.where(Product.category_id == category_id)
    if status:
        query = query.where(Product.status == status)
    
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
    count_query = select(func.count(Product.id))
    if category_id:
        count_query = count_query.where(Product.category_id == category_id)
    
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    result = await db.execute(
        query.offset(skip).limit(limit).order_by(Product.created_at.desc())
    )
    products = result.scalars().all()

    product_list = []
    for product in products:
        product_out = ProductOut(
            id=product.id,
            name=product.name,
            description=product.description,
            price=product.price,
            quantity=product.quantity,
            slug=product.slug,
            status=product.status,
            category_id=product.category_id,
            created_at=product.created_at,
            updated_at=product.updated_at
        )
        product_list.append(product_out)
        page = (skip // limit) + 1 if limit > 0 else 1
    
    return ProductListResponse(
        products=product_list,
        total=total,
        page=page,
        limit=limit
    )