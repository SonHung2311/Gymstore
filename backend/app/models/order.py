import random
import string
import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _generate_display_id() -> str:
    """Generate a short human-readable order code like GYM-A1B2C3."""
    chars = string.ascii_uppercase + string.digits
    return "GYM-" + "".join(random.choices(chars, k=6))


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    display_id: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True, default=_generate_display_id
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # status: pending | confirmed | shipping | delivered | cancelled
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    # payment_method: cod | bank_transfer
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    # payment_status: unpaid | pending_verification | paid | refunded
    payment_status: Mapped[str] = mapped_column(String(30), nullable=False, default="unpaid")
    # shipping_address: {name, phone, address, city}
    shipping_address: Mapped[dict] = mapped_column(JSON, nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    coupon_code: Mapped[str | None] = mapped_column(String(30))
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="orders")  # noqa: F821
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    variant_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    variant_attributes: Mapped[dict | None] = mapped_column(JSON)  # snapshot at order time
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")
