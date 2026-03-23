import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (
        # Composite index for "hot" sort: ORDER BY like_count DESC, created_at DESC
        Index("ix_posts_hot", "like_count", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # Denormalised for O(1) sort — incremented/decremented in service layer
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    author: Mapped["User"] = relationship("User", back_populates="posts")  # noqa: F821
    comments: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="post", cascade="all, delete-orphan"
    )
    likes: Mapped[list["Like"]] = relationship(
        "Like", back_populates="post", cascade="all, delete-orphan"
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    post_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    post: Mapped["Post"] = relationship("Post", back_populates="comments")
    author: Mapped["User"] = relationship("User", back_populates="comments")  # noqa: F821


class Like(Base):
    __tablename__ = "likes"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    post_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True, index=True
    )

    post: Mapped["Post"] = relationship("Post", back_populates="likes")
    user: Mapped["User"] = relationship("User", back_populates="likes")  # noqa: F821
