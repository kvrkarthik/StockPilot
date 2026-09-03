import csv
import io
import math

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from openpyxl import Workbook
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import CurrentUser, require_permission
from app.database.session import get_db
from app.models.entities import (
    AuditLog,
    InventoryTransaction,
    Notification,
    PurchaseOrder,
    Sale,
    Setting,
    User,
)
from app.schemas.common import Message, Page
from app.schemas.inventory import (
    AdjustmentCreate,
    DashboardRead,
    PurchaseCreate,
    PurchaseRead,
    ReceivePurchase,
    SaleCreate,
    SaleRead,
    StockMovement,
    TransactionRead,
)
from app.services.inventory import InventoryService
from app.services.orders import OrderService

router = APIRouter(tags=["Operations"])


@router.get("/dashboard", response_model=DashboardRead)
def dashboard(_: CurrentUser, db: Session = Depends(get_db)):
    return InventoryService(db).dashboard()


@router.post("/inventory/movements", response_model=TransactionRead, status_code=201)
def movement(
    data: StockMovement,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.write")),
):
    transaction = InventoryService(db).move_stock(
        data.product_id, data.quantity, data.transaction_type, user.id, data.notes
    )
    db.commit()
    db.refresh(transaction)
    return transaction


@router.post("/inventory/adjustments", response_model=TransactionRead, status_code=201)
def adjustment(
    data: AdjustmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.write")),
):
    return InventoryService(db).adjust(
        data.product_id, data.adjustment_type, data.quantity, data.reason, user.id
    )


@router.get("/inventory/history", response_model=Page[TransactionRead])
def inventory_history(
    _: CurrentUser,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    product_id: int | None = None,
):
    query = select(InventoryTransaction)
    if product_id:
        query = query.where(InventoryTransaction.product_id == product_id)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(InventoryTransaction.created_at.desc()).offset((page - 1) * size).limit(size)
    ).all()
    return {"items": list(items), "total": total, "page": page, "size": size, "pages": math.ceil(total / size)}


@router.post("/purchases", response_model=PurchaseRead, status_code=201)
def purchase(
    data: PurchaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("purchases.write")),
):
    return OrderService(db).create_purchase(data, user.id)


@router.get("/purchases", response_model=list[PurchaseRead])
def purchases(_: CurrentUser, db: Session = Depends(get_db)):
    return list(db.scalars(select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc())).all())


@router.post("/purchases/{order_id}/receive", response_model=PurchaseRead)
def receive(
    order_id: int,
    data: ReceivePurchase,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("purchases.receive")),
):
    return OrderService(db).receive_purchase(order_id, data, user.id)


@router.post("/sales", response_model=SaleRead, status_code=201)
def sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("sales.write")),
):
    return OrderService(db).create_sale(data, user.id)


@router.get("/sales", response_model=list[SaleRead])
def sales(_: CurrentUser, db: Session = Depends(get_db)):
    return list(db.scalars(select(Sale).order_by(Sale.created_at.desc())).all())


@router.get("/notifications")
def notifications(user: CurrentUser, db: Session = Depends(get_db)):
    return list(
        db.scalars(
            select(Notification)
            .where((Notification.user_id == user.id) | (Notification.user_id.is_(None)))
            .order_by(Notification.created_at.desc())
            .limit(50)
        ).all()
    )


@router.patch("/notifications/{notification_id}/read", response_model=Message)
def read_notification(notification_id: int, _: CurrentUser, db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(404, "Notification not found")
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.get("/reports/{report_type}")
def report(
    report_type: str,
    _: CurrentUser,
    db: Session = Depends(get_db),
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
):
    if report_type == "sales":
        headers = ["invoice_number", "subtotal", "tax", "total", "created_at"]
        rows = db.execute(select(Sale.invoice_number, Sale.subtotal, Sale.tax, Sale.total, Sale.created_at)).all()
    elif report_type == "inventory":
        from app.models.entities import Product
        headers = ["sku", "name", "quantity", "cost", "price"]
        rows = db.execute(select(Product.sku, Product.name, Product.quantity, Product.cost, Product.price)).all()
    else:
        raise HTTPException(404, "Supported reports: sales, inventory")
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(rows)
        return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={report_type}.csv"})
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = report_type.title()
    sheet.append(headers)
    for row in rows:
        sheet.append(list(row))
    binary = io.BytesIO()
    workbook.save(binary)
    return Response(binary.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename={report_type}.xlsx"})


@router.get("/settings")
def settings(_: CurrentUser, db: Session = Depends(get_db)):
    return db.get(Setting, 1)


@router.put("/settings")
def update_settings(
    data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.write")),
):
    allowed = {"company_name", "company_address", "tax_percentage", "currency", "theme"}
    if unknown := set(data) - allowed:
        raise HTTPException(422, f"Unsupported settings: {', '.join(unknown)}")
    setting = db.get(Setting, 1) or Setting(id=1)
    db.add(setting)
    for key, value in data.items():
        setattr(setting, key, value)
    db.commit()
    db.refresh(setting)
    return setting


@router.get("/audit-logs")
def audit_logs(
    _: User = Depends(require_permission("audit.read")),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).all())
