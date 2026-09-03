from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.entities import Category, Permission, Role, Setting, User

PERMISSIONS = [
    "products.write",
    "products.delete",
    "inventory.write",
    "purchases.write",
    "purchases.receive",
    "sales.write",
    "reports.read",
    "settings.write",
    "users.write",
    "audit.read",
]

ROLE_PERMISSIONS = {
    "Admin": {"*"},
    "Manager": set(PERMISSIONS) - {"users.write"},
    "Inventory Staff": {
        "products.write",
        "inventory.write",
        "purchases.write",
        "purchases.receive",
        "reports.read",
    },
    "Sales Staff": {"sales.write", "reports.read"},
    "Viewer": {"reports.read"},
}


def seed_database(db: Session) -> None:
    permissions = {}
    for code in ["*", *PERMISSIONS]:
        permission = db.scalar(select(Permission).where(Permission.code == code))
        if not permission:
            permission = Permission(code=code, description=f"Allows {code}")
            db.add(permission)
            db.flush()
        permissions[code] = permission

    roles = {}
    for name, codes in ROLE_PERMISSIONS.items():
        role = db.scalar(select(Role).where(Role.name == name))
        if not role:
            role = Role(name=name, description=f"{name} system role")
            db.add(role)
            db.flush()
        role.permissions = [permissions[code] for code in codes]
        roles[name] = role

    admin = db.scalar(
        select(User).where(User.email == settings.first_admin_email.lower())
    )

    if not admin:
        db.add(
            User(
                email=settings.first_admin_email.lower(),
                full_name="System Administrator",
                password_hash=hash_password(settings.first_admin_password),
                role=roles["Admin"],
            )
        )

    if not db.get(Setting, 1):
        db.add(Setting(id=1, currency="INR"))

    # Seed default product categories
    categories = [
        ("Food & Beverages", "Food, drinks, and consumable products"),
        ("Personal Care", "Personal hygiene and care products"),
        ("Cleaning", "Cleaning and household maintenance products"),
        ("Stationery", "Office and stationery products"),
        ("Electronics", "Electronic and electrical products"),
    ]

    for name, description in categories:
        category = db.scalar(select(Category).where(Category.name == name))
        if not category:
            db.add(Category(name=name, description=description))

    db.commit()