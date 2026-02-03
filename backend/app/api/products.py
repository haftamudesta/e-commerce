from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import aiofiles
import os
from datetime import datetime
from app.schemas.reviews import ReviewCreate, ReviewResponse

from app.models.products import Product
from app.models.categories import Category
from app.schemas.products import ProductCreate, ProductUpdate, ProductOut, ProductListResponse, ProductWithCategory
from app.database.database import get_db
from app.api.users import require_roles,get_current_user
from app.models.users import User
from app.models.reviews import Review

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

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Delete a product (Admin/Seller only)
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
    
    await db.delete(product)
    await db.commit()
    
    return None

@router.get("/category/{category_id}", response_model=ProductListResponse)
async def get_products_by_category(
    category_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get products by category ID
    """
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    result = await db.execute(
        select(Product)
        .where(Product.category_id == category_id)
        .offset(skip)
        .limit(limit)
        .order_by(Product.created_at.desc())
    )
    products = result.scalars().all()
    count_result = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category_id)
    )
    total = count_result.scalar()
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

@router.get("/search/", response_model=List[ProductOut])
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search products by name or description
    """
    search_term = f"%{q}%"
    result = await db.execute(
        select(Product)
        .where(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
        .order_by(Product.created_at.desc())
        .limit(20)
    )
    products = result.scalars().all()

    return [
        ProductOut(
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
        for product in products
    ]


from app.schemas.reviews import ReviewCreate, ReviewResponse

from fastapi import HTTPException, status
from sqlalchemy import select
from typing import List
from datetime import datetime

@router.post("/{product_id}/reviews", response_model=ReviewResponse, status_code=201)
async def create_product_review(
    product_id: int,
    review: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a review for a specific product"""
    
    product = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = product.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    existing_review = await db.execute(
        select(Review).where(
            Review.product_id == product_id,
            Review.user_id == current_user.id
        )
    )
    
    if existing_review.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )
    
    if not (1 <= review.rating <= 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )
    
    db_review = Review(
        **review.dict(),
        product_id=product_id,
        user_id=current_user.id,
        created_at=datetime.utcnow(),
        user=current_user  
    )
    
    db.add(db_review)
    await db.commit()
    await db.refresh(db_review)
    
    return db_review


@router.get("/{product_id}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(
    product_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for a specific product"""
    
    product = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = product.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    reviews = result.scalars().all()
    
    return reviews