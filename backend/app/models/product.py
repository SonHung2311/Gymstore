import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
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


class ProductAttribute(Base):
    """Per-product attribute definitions (name + allowed values)."""
    __tablename__ = "product_attributes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    values: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    product: Mapped["Product"] = relationship("Product", back_populates="attributes")


class ProductVariant(Base):
    """Per-product SKU (specific combination of attribute values)."""
    __tablename__ = "product_variants"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sku: Mapped[str | None] = mapped_column(String(100))
    attributes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)  # {"Size": "M", "Màu": "Đen"}
    price: Mapped[float | None] = mapped_column(Numeric(12, 2))  # None = use product.price
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    product: Mapped["Product"] = relationship("Product", back_populates="variants")


class AttributeType(Base):
    """Global attribute type templates (e.g. Size: [S, M, L, XL])."""
    __tablename__ = "attribute_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    values: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # images: list of URL strings stored as JSON array
    images: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category: Mapped["Category | None"] = relationship("Category", back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")  # noqa: F821
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="product")  # noqa: F821
    reviews: Mapped[list["ProductReview"]] = relationship("ProductReview", back_populates="product", cascade="all, delete-orphan")
    attributes: Mapped[list["ProductAttribute"]] = relationship("ProductAttribute", back_populates="product", cascade="all, delete-orphan", order_by="ProductAttribute.display_order")
    variants: Mapped[list["ProductVariant"]] = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")


class ProductReview(Base):
    __tablename__ = "product_reviews"
    __table_args__ = (UniqueConstraint("product_id", "user_id", name="uq_product_review"),)

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1–5
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    product: Mapped["Product"] = relationship("Product", back_populates="reviews")
    author: Mapped["User"] = relationship("User")  # noqa: F821
