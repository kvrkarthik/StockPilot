from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    token_digest,
    verify_password,
)
from app.models.entities import PasswordResetToken, RefreshToken, Role, User


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, email: str, full_name: str, password: str) -> User:
        email = email.lower()
        if self.db.scalar(select(User).where(User.email == email)):
            raise HTTPException(409, "Email is already registered")
        role = self.db.scalar(select(Role).where(Role.name == "Viewer"))
        if not role:
            raise HTTPException(500, "Default role is not configured")
        user = User(email=email, full_name=full_name, password_hash=hash_password(password), role=role)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, email: str, password: str) -> User:
        user = self.db.scalar(
            select(User).where(User.email == email.lower(), User.deleted_at.is_(None))
        )
        if not user or not user.is_active or not verify_password(password, user.password_hash):
            raise HTTPException(401, "Invalid email or password")
        return user

    def issue_tokens(self, user: User) -> dict:
        access = create_access_token(str(user.id))
        refresh, _ = create_refresh_token(str(user.id))
        self.db.add(
            RefreshToken(
                token_hash=token_digest(refresh),
                user_id=user.id,
                expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days),
            )
        )
        self.db.commit()
        return {"access_token": access, "refresh_token": refresh, "user": user}

    def refresh(self, token: str) -> dict:
        try:
            payload = decode_token(token, "refresh")
        except ValueError as exc:
            raise HTTPException(401, str(exc)) from exc
        stored = self.db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_digest(token),
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(UTC),
            )
        )
        user = self.db.get(User, UUID(payload["sub"]))
        if not stored or not user or not user.is_active:
            raise HTTPException(401, "Refresh token is invalid or revoked")
        stored.revoked_at = datetime.now(UTC)
        return self.issue_tokens(user)

    def logout(self, token: str) -> None:
        stored = self.db.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == token_digest(token))
        )
        if stored:
            stored.revoked_at = datetime.now(UTC)
            self.db.commit()

    def request_reset(self, email: str) -> str | None:
        user = self.db.scalar(select(User).where(User.email == email.lower()))
        if not user:
            return None
        raw = token_urlsafe(32)
        self.db.add(
            PasswordResetToken(
                token_hash=token_digest(raw),
                user_id=user.id,
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        self.db.commit()
        return raw if settings.environment == "development" else None

    def confirm_reset(self, token: str, password: str) -> None:
        reset = self.db.scalar(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_digest(token),
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > datetime.now(UTC),
            )
        )
        if not reset:
            raise HTTPException(400, "Reset token is invalid or expired")
        user = self.db.get(User, reset.user_id)
        user.password_hash = hash_password(password)
        reset.used_at = datetime.now(UTC)
        self.db.commit()
