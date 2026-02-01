from typing import  List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,func
from app.models.categories import Category
from app.schemas.categories import CategoryCreate, CategoryUpdate, CategoryOut,CategoriesResponse
from app.database.database import get_db
from app.api.users import require_roles
from app.models.users import User

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])

@router.get("/", response_model=CategoriesResponse)
async def get_categories(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=10, description="Number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all categories with pagination
    """
    result = await db.execute(
        select(Category).offset(skip).limit(limit).order_by(Category.id)
    )
    categories = result.scalars().all()

    count_result = await db.execute(select(func.count(Category.id)))
    total = count_result.scalar()

    category_list = []
    for category in categories:
        category_out = CategoryOut(
            id=category.id,
            name=category.name
        )
    category_list.append(category_out)
    for category in categories:
        category_out = CategoryOut(
            id=category.id,
            name=category.name
        )
        category_list.append(category_out)
    
    page = (skip // limit) + 1 if limit > 0 else 1
    return CategoriesResponse(
        categories=category_list,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{category_id}", response_model=CategoriesResponse)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific category by ID
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
    return category

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Create a new category
    """
    
    result = await db.execute(
        select(Category).where(Category.name == category.name)
    )
    existing_category = result.scalar_one_or_none()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists"
        )
    
    new_category = Category(name=category.name)
    
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    return CategoryOut(id=new_category.id, name=new_category.name)

@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Update a category
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
    
    if category_update.name and category_update.name != category.name:
        result = await db.execute(
            select(Category).where(Category.name == category_update.name)
        )
        existing_category = result.scalar_one_or_none()
        
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
        
        category.name = category_update.name
    
    await db.commit()
    await db.refresh(category)
    
    return CategoryOut(id=category.id, name=category.name)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """
    Delete a category
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
    
    await db.delete(category)
    await db.commit()
    
    return None

@router.get("/search/", response_model=List[CategoryOut])
async def search_categories(
    name: str = Query(..., description="Category name to search for"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search categories by name
    """
    result = await db.execute(
        select(Category).where(Category.name.ilike(f"%{name}%"))
    )
    categories = result.scalars().all()
    return categories

@router.get("/count/", response_model=dict)
async def count_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    Get total count of categories
    """
    result = await db.execute(select(func.count(Category.id)))
    total = result.scalar()
    return {"total": total}