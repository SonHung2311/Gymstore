from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Banner(Base):
    __tablename__ = "banners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(Text)
    cta: Mapped[str] = mapped_column(String(100), nullable=False, default="Xem ngay")
    link: Mapped[str] = mapped_column(String(255), nullable=False, default="/")
    bg: Mapped[str] = mapped_column(String(100), nullable=False, default="from-primary to-secondary")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    display_page: Mapped[str] = mapped_column(String(20), nullable=False, default="all")  # all | home | store | community
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
