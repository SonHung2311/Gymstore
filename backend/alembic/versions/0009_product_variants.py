"""0009 product variants

Revision ID: 0009
Revises: 0008
Create Date: 2026-03-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_attributes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("values", sa.JSON(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_attributes_product_id", "product_attributes", ["product_id"])

    op.create_table(
        "product_variants",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sku", sa.String(100), nullable=True),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("stock_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_variants_product_id", "product_variants", ["product_id"])

    # Add variant_id to cart_items; drop old unique constraints, replaced by app-level dedup
    with op.batch_alter_table("cart_items") as batch_op:
        batch_op.drop_constraint("uq_user_product", type_="unique")
        batch_op.drop_constraint("uq_session_product", type_="unique")
        batch_op.add_column(sa.Column("variant_id", sa.String(36),
                                       sa.ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True))

    # Add variant fields to order_items
    with op.batch_alter_table("order_items") as batch_op:
        batch_op.add_column(sa.Column("variant_id", sa.String(36),
                                       sa.ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True))
        batch_op.add_column(sa.Column("variant_attributes", sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("order_items") as batch_op:
        batch_op.drop_column("variant_attributes")
        batch_op.drop_column("variant_id")

    with op.batch_alter_table("cart_items") as batch_op:
        batch_op.drop_column("variant_id")
        batch_op.create_unique_constraint("uq_user_product", ["user_id", "product_id"])
        batch_op.create_unique_constraint("uq_session_product", ["session_id", "product_id"])

    op.drop_index("ix_product_variants_product_id", table_name="product_variants")
    op.drop_table("product_variants")
    op.drop_index("ix_product_attributes_product_id", table_name="product_attributes")
    op.drop_table("product_attributes")
