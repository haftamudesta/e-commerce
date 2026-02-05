from __future__ import annotations
from sqlalchemy import Integer, Column, String,DateTime
from datetime import datetime
from app.database.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index = True)
    username = Column(String(255), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(50), default="user")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")