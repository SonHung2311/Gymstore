"""merge chat + message_media branches, add display_page column to banners

Revision ID: 0012
Revises: 0010 (chat), 0011b (message_media)
Create Date: 2026-03-24
"""

import sqlalchemy as sa
from alembic import op

revision = "0012"
down_revision = ("0010", "0011b")  # merge: 0010=chat, 0011b=message_media
branch_labels = None
depends_on = None




def upgrade() -> None:
    op.add_column(
        "banners",
        sa.Column(
            "display_page",
            sa.String(20),
            nullable=False,
            server_default="all",
        ),
    )


def downgrade() -> None:
    op.drop_column("banners", "display_page")
