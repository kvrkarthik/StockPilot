from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.common import ORMModel


class PermissionRead(ORMModel):
    code: str
    description: str | None


class RoleRead(ORMModel):
    id: int
    name: str
    permissions: list[PermissionRead] = Field(default_factory=list)


class UserRead(ORMModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    role: RoleRead


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)


class UserCreate(RegisterRequest):
    role_id: int


class PasswordPolicyMixin(BaseModel):
    password: str

    @model_validator(mode="after")
    def password_strength(self):
        if not any(c.isupper() for c in self.password) or not any(c.isdigit() for c in self.password):
            raise ValueError("Password must include an uppercase letter and a number")
        return self
