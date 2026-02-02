from __future__ import annotations
from sqlalchemy import Integer, Column, String
from app.database.database import Base
from sqlalchemy.orm import relationship

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index = True)
    name = Column(String(255), unique=True, index=True)
    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")
    parent = relationship("Category", remote_side=[id], backref="children")