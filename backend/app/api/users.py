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
from app.schemas.users import UserCreate, UserOut,Token,TokenData 
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