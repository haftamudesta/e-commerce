from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
import aiofiles
import os
import shutil
from uuid import uuid4
from datetime import datetime
from app.schemas.reviews import ReviewCreate, ReviewResponse

from app.models.products import Product, ProductImage  # Make sure ProductImage is imported
from app.models.categories import Category
from app.schemas.products import (
    ProductCreate, 
    ProductUpdate, 
    ProductOut, 
    ProductListResponse, 
    ProductWithCategory,
    ProductImageSchema  # Add this to your schemas
)
from app.database.database import get_db
from app.api.users import require_roles, get_current_user
from app.models.users import User
from app.models.reviews import Review

router = APIRouter(prefix="/api/v1/products", tags=["products"])

UPLOAD_DIR = "uploads/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============ EXISTING PRODUCT ENDPOINTS ============

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
    query = select(Product).options(selectinload(Product.images))
    
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
    
    count_query = select(func.count()).select_from(Product)
    if category_id:
        count_query = count_query.where(Product.category_id == category_id)
    if status:
        count_query = count_query.where(Product.status == status)
    
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    result = await db.execute(
        query.offset(skip).limit(limit).order_by(Product.created_at.desc())
    )
    products = result.scalars().unique().all()

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
        select(Product)
        .options(
            selectinload(Product.category),
            selectinload(Product.images)
        )
        .where(Product.id == product_id)
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
        .options(selectinload(Product.images))
        .where(Product.category_id == category_id)
        .offset(skip)
        .limit(limit)
        .order_by(Product.created_at.desc())
    )
    products = result.scalars().unique().all()
    
    count_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.category_id == category_id)
    )
    total = count_result.scalar() or 0
    
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

# ============ PRODUCT IMAGE ENDPOINTS ============

@router.post("/{product_id}/images", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    display_order: int = Form(0),
    alt_text: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Upload a single image for a product
    """
    # Check if product exists
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
    
    # Generate thumbnail URL (you can add thumbnail generation later)
    thumbnail_filename = f"thumb_{filename}"
    thumbnail_path = os.path.join(UPLOAD_DIR, thumbnail_filename)
    
    # For now, copy the same file as thumbnail
    try:
        async with aiofiles.open(thumbnail_path, 'wb') as out_file:
            await out_file.write(content)
    except:
        thumbnail_filename = filename
    
    # If this image is set as primary, remove primary from other images
    if is_primary:
        await db.execute(
            ProductImage.__table__.update()
            .where(ProductImage.product_id == product_id)
            .values(is_primary=False)
        )
    
    # Create image record
    image = ProductImage(
        product_id=product_id,
        image_url=f"/{UPLOAD_DIR}/{filename}",
        thumbnail_url=f"/{UPLOAD_DIR}/{thumbnail_filename}",
        alt_text=alt_text or product.name,
        is_primary=is_primary,
        display_order=display_order
    )
    
    db.add(image)
    await db.commit()
    await db.refresh(image)
    
    return {
        "id": image.id,
        "image_url": image.image_url,
        "thumbnail_url": image.thumbnail_url,
        "alt_text": image.alt_text,
        "is_primary": image.is_primary,
        "display_order": image.display_order,
        "product_id": image.product_id
    }

@router.post("/{product_id}/images/bulk", response_model=List[dict], status_code=status.HTTP_201_CREATED)
async def upload_product_images_bulk(
    product_id: int,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Upload multiple images for a product
    """
    # Check if product exists
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    # Get current max display order
    result = await db.execute(
        select(func.max(ProductImage.display_order))
        .where(ProductImage.product_id == product_id)
    )
    max_order = result.scalar() or 0
    
    uploaded_images = []
    
    for i, file in enumerate(files):
        # Skip non-image files
        if not file.content_type.startswith('image/'):
            continue
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        try:
            async with aiofiles.open(file_path, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
        except Exception as e:
            continue
        
        # Set first image as primary if no primary exists
        existing_primary = await db.execute(
            select(ProductImage).where(
                ProductImage.product_id == product_id,
                ProductImage.is_primary == True
            )
        )
        has_primary = existing_primary.scalar_one_or_none() is not None
        is_primary = (i == 0 and not has_primary)
        
        # Create image record
        image = ProductImage(
            product_id=product_id,
            image_url=f"/{UPLOAD_DIR}/{filename}",
            thumbnail_url=f"/{UPLOAD_DIR}/{filename}",  # You can add thumbnail generation later
            alt_text=product.name,
            is_primary=is_primary,
            display_order=max_order + i + 1
        )
        
        db.add(image)
        uploaded_images.append(image)
    
    await db.commit()
    
    # Refresh images
    for image in uploaded_images:
        await db.refresh(image)
    
    return [
        {
            "id": img.id,
            "image_url": img.image_url,
            "thumbnail_url": img.thumbnail_url,
            "alt_text": img.alt_text,
            "is_primary": img.is_primary,
            "display_order": img.display_order,
            "product_id": img.product_id
        }
        for img in uploaded_images
    ]

@router.delete("/product-images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Delete a product image
    """
    image = await db.get(ProductImage, image_id)
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with id {image_id} not found"
        )
    
    # Delete physical file
    try:
        file_path = image.image_url.lstrip('/')
        if os.path.exists(file_path):
            os.remove(file_path)
        
        if image.thumbnail_url:
            thumb_path = image.thumbnail_url.lstrip('/')
            if os.path.exists(thumb_path):
                os.remove(thumb_path)
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    await db.delete(image)
    await db.commit()
    
    return None

@router.patch("/product-images/{image_id}/set-primary", response_model=dict)
async def set_primary_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Set an image as the primary image for its product
    """
    image = await db.get(ProductImage, image_id)
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with id {image_id} not found"
        )
    
    # Remove primary from other images
    await db.execute(
        ProductImage.__table__.update()
        .where(ProductImage.product_id == image.product_id)
        .values(is_primary=False)
    )
    
    # Set this image as primary
    image.is_primary = True
    await db.commit()
    await db.refresh(image)
    
    return {
        "id": image.id,
        "is_primary": image.is_primary,
        "product_id": image.product_id
    }

@router.patch("/product-images/{image_id}", response_model=dict)
async def update_product_image(
    image_id: int,
    alt_text: Optional[str] = Form(None),
    display_order: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Update product image metadata
    """
    image = await db.get(ProductImage, image_id)
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image with id {image_id} not found"
        )
    
    if alt_text is not None:
        image.alt_text = alt_text
    
    if display_order is not None:
        image.display_order = display_order
    
    await db.commit()
    await db.refresh(image)
    
    return {
        "id": image.id,
        "alt_text": image.alt_text,
        "display_order": image.display_order,
        "is_primary": image.is_primary
    }

@router.patch("/{product_id}/images/reorder", response_model=List[dict])
async def reorder_product_images(
    product_id: int,
    image_order: List[dict],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "seller"]))
):
    """
    Reorder product images
    """
    # Verify product exists
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    # Update display orders
    for order_item in image_order:
        await db.execute(
            ProductImage.__table__.update()
            .where(
                and_(
                    ProductImage.id == order_item["id"],
                    ProductImage.product_id == product_id
                )
            )
            .values(display_order=order_item["display_order"])
        )
    
    await db.commit()
    
    # Get updated images
    result = await db.execute(
        select(ProductImage)
        .where(ProductImage.product_id == product_id)
        .order_by(ProductImage.display_order)
    )
    images = result.scalars().all()
    
    return [
        {
            "id": img.id,
            "display_order": img.display_order,
            "image_url": img.image_url,
            "is_primary": img.is_primary
        }
        for img in images
    ]

# ============ REVIEW ENDPOINTS ============

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
        **review.model_dump(),
        product_id=product_id,
        user_id=current_user.id,
        created_at=datetime.utcnow()
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
        .options(selectinload(Review.user))
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    reviews = result.scalars().all()
    
    return reviews