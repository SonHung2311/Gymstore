"""payment redesign: display_id, bank_transfer, payment_status enum

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-20
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add display_id column (nullable first to fill existing rows)
    op.add_column("orders", sa.Column("display_id", sa.String(20), nullable=True))
    # Fill existing rows with a deterministic short ID derived from UUID
    op.execute(
        "UPDATE orders SET display_id = 'GYM-' || upper(substr(md5(id::text), 1, 6)) "
        "WHERE display_id IS NULL"
    )
    op.alter_column("orders", "display_id", nullable=False)
    op.create_unique_constraint("uq_orders_display_id", "orders", ["display_id"])
    op.create_index("ix_orders_display_id", "orders", ["display_id"])

    # 2. Widen payment_method and migrate 'online' → 'bank_transfer'
    op.alter_column("orders", "payment_method", type_=sa.String(20), existing_nullable=False)
    op.execute("UPDATE orders SET payment_method = 'bank_transfer' WHERE payment_method = 'online'")

    # 3. Widen payment_status and migrate old values
    op.alter_column("orders", "payment_status", type_=sa.String(30), existing_nullable=False)
    op.execute("UPDATE orders SET payment_status = 'unpaid'   WHERE payment_status = 'pending'")
    op.execute("UPDATE orders SET payment_status = 'refunded' WHERE payment_status = 'failed'")


def downgrade() -> None:
    # Revert payment_status values
    op.execute("UPDATE orders SET payment_status = 'pending' WHERE payment_status = 'unpaid'")
    op.execute("UPDATE orders SET payment_status = 'pending' WHERE payment_status = 'pending_verification'")
    op.execute("UPDATE orders SET payment_status = 'failed'  WHERE payment_status = 'refunded'")
    op.alter_column("orders", "payment_status", type_=sa.String(10), existing_nullable=False)

    # Revert payment_method
    op.execute("UPDATE orders SET payment_method = 'online' WHERE payment_method = 'bank_transfer'")
    op.alter_column("orders", "payment_method", type_=sa.String(10), existing_nullable=False)

    # Remove display_id
    op.drop_index("ix_orders_display_id", table_name="orders")
    op.drop_constraint("uq_orders_display_id", "orders", type_="unique")
    op.drop_column("orders", "display_id")
