from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import CurrentUser
from app.core.security import hash_password, verify_password
from app.database.session import get_db
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    ProfileUpdate,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserRead,
)
from app.schemas.common import Message
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserRead, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService(db).register(data.email, data.full_name, data.password)


@router.post("/login", response_model=TokenPair)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.issue_tokens(service.authenticate(data.email, data.password))


@router.post("/refresh", response_model=TokenPair)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh(data.refresh_token)


@router.post("/logout", response_model=Message)
def logout(data: RefreshRequest, db: Session = Depends(get_db)):
    AuthService(db).logout(data.refresh_token)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser):
    return user


@router.put("/me", response_model=UserRead)
def update_profile(data: ProfileUpdate, user: CurrentUser, db: Session = Depends(get_db)):
    user.full_name = data.full_name
    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password", response_model=Message)
def change_password(data: ChangePasswordRequest, user: CurrentUser, db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/password-reset/request")
def request_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    token = AuthService(db).request_reset(data.email)
    response = {"message": "If the account exists, reset instructions have been issued"}
    if token:
        response["development_token"] = token
    return response


@router.post("/password-reset/confirm", response_model=Message)
def confirm_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    AuthService(db).confirm_reset(data.token, data.new_password)
    return {"message": "Password reset successfully"}
