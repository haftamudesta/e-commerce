from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.users import router as users_router;
from app.database.database import Base, engine
from app import models

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",  
    "http://127.0.0.1:5173",   
    "http://localhost:8000",    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,# List of allowed origins
    allow_credentials=True,# Allow cookies
    allow_methods=["*"],# Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],#Allow all headers
)
app.include_router(users_router)
