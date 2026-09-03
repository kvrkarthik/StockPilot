from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.entities import AdjustmentType, OrderStatus, TransactionType
from app.schemas.common import ORMModel


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class CategoryRead(CategoryCreate, ORMModel):
    id: int


class PartyBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: str | None = None
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = None


class SupplierCreate(PartyBase):
    tax_id: str | None = None


class SupplierRead(SupplierCreate, ORMModel):
    id: int
    created_at: datetime


class CustomerCreate(PartyBase):
    pass


class CustomerRead(CustomerCreate, ORMModel):
    id: int
    created_at: datetime


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=80)
    barcode: str | None = Field(default=None, max_length=100)
    name: str = Field(min_length=1, max_length=180)
    description: str | None = None
    category_id: int
    supplier_id: int | None = None
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    cost: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    quantity: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)
    maximum_stock: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    expiry_date: date | None = None

    @model_validator(mode="after")
    def validate_stock_range(self):
        if self.maximum_stock is not None and self.maximum_stock < self.minimum_stock:
            raise ValueError("maximum_stock must be greater than or equal to minimum_stock")
        return self


class ProductUpdate(ProductCreate):
    pass


class ProductRead(ProductCreate, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime
    category: CategoryRead
    supplier: SupplierRead | None


class StockMovement(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    transaction_type: TransactionType
    notes: str | None = None


class AdjustmentCreate(BaseModel):
    product_id: int
    adjustment_type: AdjustmentType
    quantity: int = Field(gt=0)
    reason: str = Field(min_length=3)


class TransactionRead(ORMModel):
    id: int
    product_id: int
    transaction_type: TransactionType
    quantity: int
    quantity_before: int
    quantity_after: int
    reference_type: str | None
    reference_id: str | None
    notes: str | None
    created_at: datetime


class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)


class PurchaseCreate(BaseModel):
    supplier_id: int
    expected_date: date | None = None
    invoice_number: str | None = None
    notes: str | None = None
    items: list[PurchaseItemCreate] = Field(min_length=1)


class PurchaseItemRead(PurchaseItemCreate, ORMModel):
    id: int
    received_quantity: int


class PurchaseRead(ORMModel):
    id: int
    order_number: str
    supplier_id: int
    status: OrderStatus
    invoice_number: str | None
    expected_date: date | None
    notes: str | None
    total: Decimal
    items: list[PurchaseItemRead]
    created_at: datetime


class ReceiveItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class ReceivePurchase(BaseModel):
    items: list[ReceiveItem] = Field(min_length=1)


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class SaleCreate(BaseModel):
    customer_id: int | None = None
    items: list[SaleItemCreate] = Field(min_length=1)


class SaleItemRead(ORMModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    unit_cost: Decimal


class SaleRead(ORMModel):
    id: int
    invoice_number: str
    customer_id: int | None
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    items: list[SaleItemRead]
    created_at: datetime


class DashboardRead(BaseModel):
    total_products: int
    low_stock: int
    out_of_stock: int
    today_sales: int
    today_revenue: Decimal
    monthly_revenue: Decimal
    inventory_value: Decimal
    revenue_chart: list[dict]
    top_products: list[dict]
    recent_transactions: list[TransactionRead]

