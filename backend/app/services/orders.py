from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import (
    OrderStatus,
    Product,
    PurchaseOrder,
    PurchaseOrderItem,
    Sale,
    SaleItem,
    Setting,
    TransactionType,
)
from app.services.inventory import InventoryService


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.inventory = InventoryService(db)

    def create_purchase(self, data, user_id):
        order = PurchaseOrder(
            order_number=f"PO-{datetime.now(UTC):%Y%m%d}-{self._next(PurchaseOrder):05d}",
            supplier_id=data.supplier_id,
            expected_date=data.expected_date,
            invoice_number=data.invoice_number,
            notes=data.notes,
            created_by_id=user_id,
            status=OrderStatus.PENDING,
        )
        self.db.add(order)
        total = Decimal(0)
        for item in data.items:
            if not self.db.get(Product, item.product_id):
                raise HTTPException(404, f"Product {item.product_id} not found")
            order.items.append(PurchaseOrderItem(**item.model_dump()))
            total += item.unit_cost * item.quantity
        order.total = total
        self.db.commit()
        self.db.refresh(order)
        return order

    def receive_purchase(self, order_id: int, data, user_id):
        order = self.db.scalar(
            select(PurchaseOrder).where(PurchaseOrder.id == order_id).with_for_update(of=PurchaseOrder)
        )
        if not order or order.status in {OrderStatus.COMPLETED, OrderStatus.CANCELLED}:
            raise HTTPException(409, "Purchase order cannot be received")
        item_map = {item.product_id: item for item in order.items}
        for received in data.items:
            item = item_map.get(received.product_id)
            if not item or item.received_quantity + received.quantity > item.quantity:
                raise HTTPException(400, f"Invalid received quantity for product {received.product_id}")
            item.received_quantity += received.quantity
            self.inventory.move_stock(
                item.product_id,
                received.quantity,
                TransactionType.PURCHASE,
                user_id,
                f"Received against {order.order_number}",
                "purchase_order",
                str(order.id),
            )
        order.status = (
            OrderStatus.COMPLETED
            if all(item.received_quantity == item.quantity for item in order.items)
            else OrderStatus.PARTIALLY_RECEIVED
        )
        self.db.commit()
        self.db.refresh(order)
        return order

    def create_sale(self, data, user_id):
        setting = self.db.get(Setting, 1)
        tax_rate = (setting.tax_percentage if setting else Decimal(0)) / 100
        sale = Sale(
            invoice_number=f"INV-{datetime.now(UTC):%Y%m%d}-{self._next(Sale):05d}",
            customer_id=data.customer_id,
            subtotal=0,
            tax=0,
            total=0,
            created_by_id=user_id,
        )
        self.db.add(sale)
        subtotal = Decimal(0)
        for requested in data.items:
            product = self.db.scalar(
                select(Product).where(Product.id == requested.product_id).with_for_update(of=Product)
            )
            if not product:
                raise HTTPException(404, f"Product {requested.product_id} not found")
            if product.quantity < requested.quantity:
                raise HTTPException(409, f"Insufficient stock for {product.name}")
            sale.items.append(
                SaleItem(
                    product_id=product.id,
                    quantity=requested.quantity,
                    unit_price=product.price,
                    unit_cost=product.cost,
                )
            )
            subtotal += product.price * requested.quantity
        sale.subtotal = subtotal
        sale.tax = (subtotal * tax_rate).quantize(Decimal("0.01"))
        sale.total = sale.subtotal + sale.tax
        self.db.flush()
        for item in sale.items:
            self.inventory.move_stock(
                item.product_id,
                item.quantity,
                TransactionType.SALE,
                user_id,
                f"Sold on {sale.invoice_number}",
                "sale",
                str(sale.id),
            )
        self.db.commit()
        self.db.refresh(sale)
        return sale

    def _next(self, model) -> int:
        latest = self.db.scalar(select(model.id).order_by(model.id.desc()).limit(1))
        return (latest or 0) + 1

