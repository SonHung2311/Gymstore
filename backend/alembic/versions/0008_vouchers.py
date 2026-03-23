"""0008 vouchers

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vouchers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(30), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("discount_type", sa.String(10), nullable=False),
        sa.Column("discount_value", sa.Numeric(10, 2), nullable=False),
        sa.Column("min_order_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("max_discount_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("applies_to", sa.String(10), nullable=False, server_default="all"),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("usage_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("per_user_limit", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_voucher_code"),
    )
    op.create_index("ix_vouchers_code", "vouchers", ["code"])

    op.create_table(
        "voucher_usages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("voucher_id", sa.Integer(), sa.ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("voucher_id", "order_id", name="uq_voucher_order"),
    )

    with op.batch_alter_table("orders") as batch_op:
        batch_op.add_column(sa.Column("coupon_code", sa.String(30), nullable=True))
        batch_op.add_column(sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default="0"))


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.drop_column("discount_amount")
        batch_op.drop_column("coupon_code")

    op.drop_table("voucher_usages")
    op.drop_index("ix_vouchers_code", table_name="vouchers")
    op.drop_table("vouchers")
