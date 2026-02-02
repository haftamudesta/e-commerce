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

@router.get("/{product_id}", response_model=ProductWithCategory)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific product by ID with category details
    """
    result = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    product_data = {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "quantity": product.quantity,
        "slug": product.slug,
        "status": product.status,
        "category_id": product.category_id,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }
    if product.category:
        from app.schemas.categories import CategoryOut
        product_data["category"] = CategoryOut(
            id=product.category.id,
            name=product.category.name
        )
    
    return ProductWithCategory(**product_data)

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Create a new product (Admin/Seller only)
    """
    # Check if category exists
    if product.category_id:
        result = await db.execute(
            select(Category).where(Category.id == product.category_id)
        )
        category = result.scalar_one_or_none()
    if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found"
            )
    
    # Check if slug is unique
    if product.slug:
        result = await db.execute(
            select(Product).where(Product.slug == product.slug)
        )
        existing_product = result.scalar_one_or_none()
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this slug already exists"
            )
    new_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        quantity=product.quantity,
        slug=product.slug,
        status=product.status,
        category_id=product.category_id
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return ProductOut(
        id=new_product.id,
        name=new_product.name,
        description=new_product.description,
        price=new_product.price,
        quantity=new_product.quantity,
        slug=new_product.slug,
        status=new_product.status,
        category_id=new_product.category_id,
        created_at=new_product.created_at,
        updated_at=new_product.updated_at
    )

@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Update a product (Admin/Seller only)
    """
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    if product_update.category_id is not None:
        result = await db.execute(
            select(Category).where(Category.id == product_update.category_id)
        )
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found"
            )
    if product_update.slug and product_update.slug != product.slug:
        result = await db.execute(
            select(Product).where(Product.slug == product_update.slug)
        )
        existing_product = result.scalar_one_or_none()
        
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this slug already exists"
            )
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    product.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(product)

    return ProductOut(
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

