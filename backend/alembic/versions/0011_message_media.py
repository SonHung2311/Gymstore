"""0011b message media

Revision ID: 0011b
Revises: 0010
Create Date: 2026-03-22
"""

import sqlalchemy as sa
from alembic import op


revision = "0011b"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("messages") as batch_op:
        batch_op.add_column(sa.Column("media_url", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("media_type", sa.String(20), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("messages") as batch_op:
        batch_op.drop_column("media_type")
        batch_op.drop_column("media_url")
