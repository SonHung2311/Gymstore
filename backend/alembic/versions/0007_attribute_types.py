"""add attribute_types table

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-22
"""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "attribute_types",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("values", sa.JSON(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_attribute_type_name"),
    )


def downgrade() -> None:
    op.drop_table("attribute_types")
