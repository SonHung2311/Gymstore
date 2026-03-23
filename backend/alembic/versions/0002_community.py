"""community module: posts, comments, likes + user avatar/bio

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend users with community profile fields
    op.add_column("users", sa.Column("avatar", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("bio", sa.String(300), nullable=True))

    op.create_table(
        "posts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        # tags: JSON array of strings e.g. ["Workout", "Nutrition"]
        sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
        # Denormalised counts for fast sorting — updated by triggers/service layer
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_posts_user_id", "posts", ["user_id"])
    op.create_index("ix_posts_created_at", "posts", ["created_at"])
    op.create_index("ix_posts_like_count", "posts", ["like_count"])

    op.create_table(
        "comments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "post_id",
            sa.String(36),
            sa.ForeignKey("posts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_comments_post_id", "comments", ["post_id"])

    op.create_table(
        "likes",
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            primary_key=True,
        ),
        sa.Column(
            "post_id",
            sa.String(36),
            sa.ForeignKey("posts.id", ondelete="CASCADE"),
            nullable=False,
            primary_key=True,
        ),
    )
    op.create_index("ix_likes_post_id", "likes", ["post_id"])


def downgrade() -> None:
    op.drop_table("likes")
    op.drop_table("comments")
    op.drop_table("posts")
    op.drop_column("users", "bio")
    op.drop_column("users", "avatar")
