from datetime import UTC, datetime
from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.security import decode_token
from app.database.session import SessionLocal
from app.models.entities import AuditLog


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and response.status_code < 400:
            user_id = None
            authorization = request.headers.get("authorization", "")
            if authorization.startswith("Bearer "):
                try:
                    subject = decode_token(authorization[7:], "access").get("sub")
                    user_id = UUID(subject) if subject else None
                except ValueError:
                    pass
            db: Session = SessionLocal()
            try:
                db.add(
                    AuditLog(
                        user_id=user_id,
                        action=request.method,
                        entity_type=request.url.path,
                        details={"status_code": response.status_code},
                        ip_address=request.client.host if request.client else None,
                        created_at=datetime.now(UTC),
                    )
                )
                db.commit()
            finally:
                db.close()
        return response
