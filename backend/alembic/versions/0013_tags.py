"""create tags table

Revision ID: 0013
Revises: 0012
Create Date: 2026-03-24
"""

import sqlalchemy as sa
from alembic import op

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None

INITIAL_TAGS = [
    ("Workout",        "bg-blue-100 text-blue-700"),
    ("Nutrition",      "bg-green-100 text-green-700"),
    ("Q&A",            "bg-yellow-100 text-yellow-700"),
    ("Transformation", "bg-purple-100 text-purple-700"),
    ("Review",         "bg-orange-100 text-orange-700"),
    ("Supplement",     "bg-teal-100 text-teal-700"),
    ("Motivation",     "bg-pink-100 text-pink-700"),
    ("Voucher",        "bg-red-100 text-red-700"),
    ("Thảo luận",     "bg-indigo-100 text-indigo-700"),
]


def upgrade() -> None:
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("color", sa.String(100), nullable=False, server_default="bg-gray-100 text-gray-700"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    for name, color in INITIAL_TAGS:
        op.execute(
            sa.text("INSERT INTO tags (name, color) VALUES (:name, :color)").bindparams(name=name, color=color)
        )


def downgrade() -> None:
    op.drop_table("tags")
