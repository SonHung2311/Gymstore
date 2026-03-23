import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Voucher(Base):
    __tablename__ = "vouchers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    # discount_type: "percent" | "fixed"
    discount_type: Mapped[str] = mapped_column(String(10), nullable=False)
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    min_order_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    max_discount_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))  # cap for % discount
    # applies_to: "all" | "category" | "product"
    applies_to: Mapped[str] = mapped_column(String(10), nullable=False, default="all")
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    product_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    usage_limit: Mapped[int | None] = mapped_column(Integer)  # None = unlimited
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    per_user_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    usages: Mapped[list["VoucherUsage"]] = relationship(
        "VoucherUsage", back_populates="voucher", cascade="all, delete-orphan"
    )


class VoucherUsage(Base):
    __tablename__ = "voucher_usages"
    __table_args__ = (UniqueConstraint("voucher_id", "order_id", name="uq_voucher_order"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    voucher_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    voucher: Mapped["Voucher"] = relationship("Voucher", back_populates="usages")
