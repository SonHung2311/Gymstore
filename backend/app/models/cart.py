from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # NULL when cart belongs to a guest session
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    # Non-null for guest carts; set to NULL after merging into a user cart
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User | None"] = relationship("User", back_populates="cart_items")  # noqa: F821
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items")  # noqa: F821
    variant: Mapped["ProductVariant | None"] = relationship("ProductVariant")  # noqa: F821
