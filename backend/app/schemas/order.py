from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.product import ProductResponse, ProductVariantResponse


class ShippingAddress(BaseModel):
    name: str
    phone: str
    address: str
    city: str


class CheckoutRequest(BaseModel):
    payment_method: Literal["cod", "bank_transfer"]
    shipping_address: ShippingAddress
    note: str | None = None
    coupon_code: str | None = None


class OrderItemResponse(BaseModel):
    id: int
    product: ProductResponse
    variant_id: str | None = None
    variant_attributes: dict | None = None
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: str
    display_id: str
    status: str
    total_amount: float
    payment_method: str
    payment_status: str
    shipping_address: dict
    note: str | None
    coupon_code: str | None = None
    discount_amount: float = 0.0
    items: list[OrderItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "shipping", "delivered", "cancelled"]


class OrderPaymentUpdate(BaseModel):
    payment_status: Literal["unpaid", "pending_verification", "paid", "refunded"]
