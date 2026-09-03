from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

import app.models
from app.api.router import api_router
from app.core.config import settings
from app.database.base import Base
from app.database.seed import seed_database
from app.database.session import SessionLocal, engine
from app.middleware.audit import AuditMiddleware


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.environment == "development":
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_database(db)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    yield


limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Inventory, purchasing, sales, reports, and administration API.",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir, check_dir=False), name="uploads")


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": exc.errors()},
    )


@app.get("/health", tags=["System"])
@limiter.limit("60/minute")
def health(request: Request):
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "healthy", "service": settings.app_name}

