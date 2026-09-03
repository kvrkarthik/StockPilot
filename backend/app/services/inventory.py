from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.entities import (
    AdjustmentType,
    InventoryTransaction,
    Notification,
    Product,
    StockAdjustment,
    TransactionType,
)


class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def move_stock(
        self,
        product_id: int,
        quantity: int,
        transaction_type: TransactionType,
        user_id,
        notes: str | None = None,
        reference_type: str | None = None,
        reference_id: str | None = None,
    ) -> InventoryTransaction:
        product = self.db.scalar(
            select(Product).where(Product.id == product_id, Product.deleted_at.is_(None)).with_for_update(of=Product)
        )
        if not product:
            raise HTTPException(404, "Product not found")
        inbound = transaction_type in {
            TransactionType.STOCK_IN,
            TransactionType.PURCHASE,
        }
        delta = quantity if inbound else -quantity
        if product.quantity + delta < 0:
            raise HTTPException(409, f"Insufficient stock for {product.name}")
        before = product.quantity
        product.quantity += delta
        transaction = InventoryTransaction(
            product_id=product.id,
            transaction_type=transaction_type,
            quantity=quantity,
            quantity_before=before,
            quantity_after=product.quantity,
            notes=notes,
            reference_type=reference_type,
            reference_id=reference_id,
            created_by_id=user_id,
        )
        self.db.add(transaction)
        if product.quantity <= product.minimum_stock:
            kind = "out_of_stock" if product.quantity == 0 else "low_stock"
            self.db.add(
                Notification(
                    title=f"{kind.replace('_', ' ').title()}: {product.name}",
                    message=f"{product.sku} has {product.quantity} units remaining.",
                    kind=kind,
                )
            )
        self.db.flush()
        return transaction

    def adjust(self, product_id: int, adjustment_type: AdjustmentType, quantity: int, reason: str, user_id):
        inbound = adjustment_type == AdjustmentType.INCREASE
        transaction = self.move_stock(
            product_id,
            quantity,
            TransactionType.STOCK_IN if inbound else TransactionType.ADJUSTMENT,
            user_id,
            reason,
            "adjustment",
        )
        adjustment = StockAdjustment(
            product_id=product_id,
            adjustment_type=adjustment_type,
            quantity=quantity,
            reason=reason,
            created_by_id=user_id,
        )
        self.db.add(adjustment)
        self.db.flush()
        transaction.reference_id = str(adjustment.id)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def dashboard(self) -> dict:
        today = datetime.now(UTC).date()
        from app.models.entities import Sale, SaleItem

        product_stats = self.db.execute(
            select(
                func.count(Product.id),
                func.sum(case((Product.quantity <= Product.minimum_stock, 1), else_=0)),
                func.sum(case((Product.quantity == 0, 1), else_=0)),
                func.sum(Product.quantity * Product.cost),
            ).where(Product.deleted_at.is_(None))
        ).one()
        today_stats = self.db.execute(
            select(func.count(Sale.id), func.coalesce(func.sum(Sale.total), 0)).where(
                func.date(Sale.created_at) == today
            )
        ).one()
        month_start = today.replace(day=1)
        monthly = self.db.scalar(
            select(func.coalesce(func.sum(Sale.total), 0)).where(Sale.created_at >= month_start)
        )
        chart_rows = self.db.execute(
            select(func.date(Sale.created_at), func.sum(Sale.total))
            .where(Sale.created_at >= month_start)
            .group_by(func.date(Sale.created_at))
            .order_by(func.date(Sale.created_at))
        ).all()
        top = self.db.execute(
            select(Product.name, func.sum(SaleItem.quantity).label("quantity"))
            .join(SaleItem, SaleItem.product_id == Product.id)
            .group_by(Product.id)
            .order_by(func.sum(SaleItem.quantity).desc())
            .limit(5)
        ).all()
        recent = list(
            self.db.scalars(
                select(InventoryTransaction)
                .order_by(InventoryTransaction.created_at.desc())
                .limit(8)
            ).all()
        )
        return {
            "total_products": product_stats[0] or 0,
            "low_stock": product_stats[1] or 0,
            "out_of_stock": product_stats[2] or 0,
            "today_sales": today_stats[0] or 0,
            "today_revenue": today_stats[1] or Decimal(0),
            "monthly_revenue": monthly or Decimal(0),
            "inventory_value": product_stats[3] or Decimal(0),
            "revenue_chart": [{"date": str(row[0]), "revenue": row[1]} for row in chart_rows],
            "top_products": [{"name": row[0], "quantity": row[1]} for row in top],
            "recent_transactions": recent,
        }
