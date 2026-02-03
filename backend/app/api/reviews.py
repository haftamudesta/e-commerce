from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.database.database import get_db
from app.models.reviews import Review
from app.models.products import Product
from app.models.users import User
from app.schemas.reviews import ReviewCreate, ReviewUpdate, ReviewResponse
from app.api.users import get_current_user

router = APIRouter(prefix="/api/v1/reviews", tags=["reviews"])

@router.get("/", response_model=List[ReviewResponse])
async def get_reviews(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get reviews with optional filters"""
    query = select(Review)
    
    if product_id:
        query = query.where(Review.product_id == product_id)
    if user_id:
        query = query.where(Review.user_id == user_id)
    
    query = query.offset(skip).limit(limit).order_by(Review.created_at.desc())
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    return reviews

@router.get("/product/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(
    product_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get all reviews for a specific product"""
    product_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")
    
    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id)
        .offset(skip)
        .limit(limit)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return reviews

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get all reviews by a specific user"""
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.execute(
        select(Review)
        .where(Review.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return reviews

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new review"""
  
    product_result = await db.execute(
        select(Product).where(Product.id == review.product_id)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing_review = await db.execute(
        select(Review).where(
            Review.product_id == review.product_id,
            Review.user_id == current_user.id
        )
    )
    if existing_review.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this product"
        )
    
    new_review = Review(
        text=review.text,
        rating=review.rating,
        product_id=review.product_id,
        user_id=current_user.id
    )
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    return new_review

@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific review"""
    result = await db.execute(
        select(Review).where(Review.id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return review

@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a review (only by owner)"""
    result = await db.execute(
        select(Review).where(Review.id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this review"
        )
    
    if review_update.text is not None:
        review.text = review_update.text
    if review_update.rating is not None:
        review.rating = review_update.rating
    
    await db.commit()
    await db.refresh(review)
    
    return review

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a review (only by owner or admin)"""
    result = await db.execute(
        select(Review).where(Review.id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this review"
        )
    
    await db.delete(review)
    await db.commit()
    
    return None