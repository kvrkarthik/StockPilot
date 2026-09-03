import math
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.auth.dependencies import CurrentUser, require_permission
from app.core.config import settings
from app.database.session import get_db
from app.models.entities import Category, Customer, Product, Supplier, User
from app.repositories.base import Repository
from app.schemas.common import Message, Page
from app.schemas.inventory import (
    CategoryCreate,
    CategoryRead,
    CustomerCreate,
    CustomerRead,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    SupplierCreate,
    SupplierRead,
)

router = APIRouter(tags=["Catalog"])


def page(items, total, page, size):
    return {"items": items, "total": total, "page": page, "size": size, "pages": math.ceil(total / size)}


@router.get("/products", response_model=Page[ProductRead])
def products(
    _: CurrentUser,
    db: Session = Depends(get_db),
    page_number: int = Query(1, alias="page", ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category_id: int | None = None,
    stock_status: str | None = None,
    sort: str = "name",
    direction: str = "asc",
):
    query = select(Product).where(Product.deleted_at.is_(None))
    if search:
        query = query.where(
            or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"))
        )
    if category_id:
        query = query.where(Product.category_id == category_id)
    if stock_status == "low":
        query = query.where(Product.quantity <= Product.minimum_stock, Product.quantity > 0)
    elif stock_status == "out":
        query = query.where(Product.quantity == 0)
    allowed = {"name": Product.name, "sku": Product.sku, "price": Product.price, "quantity": Product.quantity}
    column = allowed.get(sort, Product.name)
    query = query.order_by(column.desc() if direction == "desc" else column.asc())
    total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
    items = db.scalars(query.offset((page_number - 1) * size).limit(size)).unique().all()
    return page(list(items), total, page_number, size)


@router.post("/products", response_model=ProductRead, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("products.write")),
):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int, _: CurrentUser, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product or product.deleted_at:
        raise HTTPException(404, "Product not found")
    return product


@router.put("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("products.write")),
):
    product = db.get(Product, product_id)
    if not product or product.deleted_at:
        raise HTTPException(404, "Product not found")
    Repository(Product, db).update(product, data.model_dump())
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", response_model=Message)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("products.delete")),
):
    product = db.get(Product, product_id)
    if not product or product.deleted_at:
        raise HTTPException(404, "Product not found")
    product.deleted_at = datetime.now(UTC)
    db.commit()
    return {"message": "Product deleted"}


@router.post("/products/{product_id}/image", response_model=ProductRead)
def upload_image(
    product_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("products.write")),
):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Only JPEG, PNG, and WebP images are accepted")
    content = image.file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "Image must be 5MB or smaller")
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    extension = Path(image.filename or "").suffix.lower()
    filename = f"{uuid4()}{extension}"
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(content)
    product.image_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(product)
    return product


def crud_routes(prefix, model, create_schema, read_schema, permission):
    @router.get(prefix, response_model=Page[read_schema], name=f"list_{model.__tablename__}")
    def list_items(
        _: CurrentUser,
        db: Session = Depends(get_db),
        page_number: int = Query(1, alias="page", ge=1),
        size: int = Query(20, ge=1, le=100),
        search: str | None = None,
    ):
        items, total = Repository(model, db).list(page=page_number, size=size, search=search)
        return page(items, total, page_number, size)

    @router.post(prefix, response_model=read_schema, status_code=201, name=f"create_{model.__tablename__}")
    def create_item(
        data: create_schema,
        db: Session = Depends(get_db),
        _: User = Depends(require_permission(permission)),
    ):
        item = Repository(model, db).create(data.model_dump())
        db.commit()
        db.refresh(item)
        return item


crud_routes("/categories", Category, CategoryCreate, CategoryRead, "products.write")
crud_routes("/suppliers", Supplier, SupplierCreate, SupplierRead, "purchases.write")
crud_routes("/customers", Customer, CustomerCreate, CustomerRead, "sales.write")
