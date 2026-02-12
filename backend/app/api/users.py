from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import select  
from sqlalchemy.orm import Session
from app.models.users import User 
from app.utils import  utils
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.schemas.users import UserCreate, UserOut,UserUpdate,Token,TokenData 
from app.database.database import get_db
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

router = APIRouter(prefix="/api/v1/users", tags=["users"]) 

SECRET_KEY = "t57t1AR5VSQyDeq5f2n6j8JeIrAKvQ-cBO4Xu_eJ2vo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Helper function that takes user data
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/sign-up", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):  
    """
    Create new User
    """
    result = await db.execute(
        select(User).where(User.username == user.username)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    existing_email = result.scalar_one_or_none()
    
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pass = utils.hash_password(user.password)

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pass,
        role=user.role if hasattr(user, 'role') else "user" 
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        'id': new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role
    }

@router.post("/log-in", response_model=Token)  
async def login(  
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)  
):
    
    result = await db.execute(
        select(User).where(User.username == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"  
        )
    if not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token_data = {'sub': user.username, 'role': user.role}
    token = create_access_token(token_data)
    return {"access_token": token, "token_type": "bearer"}

#  token Url should match endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/log-in")
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
        
    except JWTError:
        raise credentials_exception
    result = await db.execute(
        select(User).where(User.username == token_data.username)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user

@router.get("/protected")
async def protected_route(current_user:User = Depends(get_current_user)):
    return {
        "message": f"Hello, {current_user.username}! You accessed a protected route.",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role
        }
    }

def require_roles(allowed_roles: list[str]):
    def role_checker(current_user:User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

@router.get("/profile")
async def profile(current_user:User = Depends(require_roles(["user", "admin"]))):
    return {
        "message": f"Profile of {current_user.username} ({current_user.role})",
        "user_details": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role
        }
    }

@router.get("/user/dashboard")
async def user_dashboard(current_user: User = Depends(require_roles(["user"]))):
    return {
        "message": f"Welcome to your dashboard, {current_user.username}!"
    }
@router.get("/admin/dashboard")
async def admin_dashboard(current_user: User = Depends(require_roles(["admin"]))):
    return {
        "message": f"Welcome Admin {current_user.username}!",
        "admin_info": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role
        },
        "admin_features": [
            "User Management",
            "System Configuration",
            "Generate Reports",
            "Access Logs"
        ],
        "quick_stats": {
            "total_users": "N/A",
            "system_status": "Online"
        }
    }

@router.get("/", dependencies=[Depends(require_roles(["admin"]))])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users (admin only).
    """
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }
        for user in users
    ]




@router.put("/profile", response_model=UserOut)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user profile information.
    """
    update_data = {}
    validation_errors = []
    
 
    if user_update.username is not None and user_update.username != current_user.username:
        result = await db.execute(
            select(User).where(User.username == user_update.username)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            validation_errors.append("Username already taken")
        else:
            update_data["username"] = user_update.username
    
    if user_update.email is not None and user_update.email != current_user.email:
        result = await db.execute(
            select(User).where(User.email == user_update.email)
        )
        existing_email = result.scalar_one_or_none()
        
        if existing_email:
            validation_errors.append("Email already registered")
        else:
            update_data["email"] = user_update.email
   
    if user_update.new_password is not None:
        if user_update.current_password is None:
            validation_errors.append("Current password is required to set new password")
        elif not utils.verify_password(user_update.current_password, current_user.hashed_password):
            validation_errors.append("Current password is incorrect")
        else:
            update_data["hashed_password"] = utils.hash_password(user_update.new_password)
    
    if user_update.role is not None:
        if current_user.role != "admin":
            validation_errors.append("Only administrators can change roles")
        elif user_update.role not in ["user", "admin"]:
            validation_errors.append("Invalid role specified")
        else:
            update_data["role"] = user_update.role
    
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": validation_errors}
        )
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided"
        )
  
    update_data["updated_at"] = datetime.utcnow()  
    
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    try:
        await db.commit()
        await db.refresh(current_user)
        
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.delete("/{user_id}", dependencies=[Depends(require_roles(["admin"]))])
async def delete_user_by_admin(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user by ID (admin only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        await db.delete(user)
        await db.commit()
        
        return {
            "message": f"User {user.username} deleted successfully",
            "deleted_user_id": str(user_id)
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )