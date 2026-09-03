from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database.session import get_db
from app.models.entities import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
Db = Annotated[Session, Depends(get_db)]


def get_current_user(db: Db, token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    try:
        payload = decode_token(token, "access")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    user = db.scalar(
        select(User).where(
            User.id == UUID(payload["sub"]),
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )
    if not user:
        raise HTTPException(status_code=401, detail="User is inactive or does not exist")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_permission(code: str) -> Callable:
    def dependency(user: CurrentUser) -> User:
        permissions = {permission.code for permission in user.role.permissions}
        if "*" not in permissions and code not in permissions:
            raise HTTPException(status_code=403, detail=f"Missing permission: {code}")
        return user

    return dependency
