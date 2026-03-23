"""add composite index on posts(like_count, created_at) for hot sort

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-20
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_posts_hot", "posts", ["like_count", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_posts_hot", table_name="posts")
