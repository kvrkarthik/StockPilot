from typing import TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class Repository[ModelT: Base]:
    def __init__(self, model: type[ModelT], db: Session):
        self.model = model
        self.db = db

    def get(self, object_id: int) -> ModelT | None:
        return self.db.get(self.model, object_id)

    def list(self, *, page: int = 1, size: int = 20, search: str | None = None):
        query = select(self.model)
        if hasattr(self.model, "deleted_at"):
            query = query.where(self.model.deleted_at.is_(None))
        if search and hasattr(self.model, "name"):
            query = query.where(self.model.name.ilike(f"%{search}%"))
        total = self.db.scalar(select(func.count()).select_from(query.subquery())) or 0
        items = self.db.scalars(query.offset((page - 1) * size).limit(size)).all()
        return list(items), total

    def create(self, data: dict) -> ModelT:
        obj = self.model(**data)
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelT, data: dict) -> ModelT:
        for key, value in data.items():
            setattr(obj, key, value)
        self.db.flush()
        return obj

