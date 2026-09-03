from fastapi import APIRouter

from app.api.routes import auth, operations, resources

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(resources.router)
api_router.include_router(operations.router)

