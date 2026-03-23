import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    # role: 'user' | 'admin'
    role: Mapped[str] = mapped_column(String(10), nullable=False, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Token used for password reset flow (stored hashed)
    reset_token: Mapped[str | None] = mapped_column(String(255))
    # Community profile fields
    avatar: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user")  # noqa: F821
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="user")  # noqa: F821
    posts: Mapped[list["Post"]] = relationship("Post", back_populates="author")  # noqa: F821
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="author")  # noqa: F821
    likes: Mapped[list["Like"]] = relationship("Like", back_populates="user")  # noqa: F821
