"""create banners table and seed initial data

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-20
"""

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "banners",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("subtitle", sa.Text(), nullable=True),
        sa.Column("cta", sa.String(100), nullable=False, server_default="Xem ngay"),
        sa.Column("link", sa.String(255), nullable=False, server_default="/"),
        sa.Column("bg", sa.String(100), nullable=False, server_default="from-primary to-secondary"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Seed the 3 static banners that were previously hardcoded
    op.execute("""
        INSERT INTO banners (title, subtitle, cta, link, bg, is_active, "order") VALUES
        ('Thiết bị Gym chuyên nghiệp', 'Chất lượng cao, giá tốt, giao hàng toàn quốc', 'Xem ngay', '/store', 'from-primary to-secondary', true, 0),
        ('Cộng đồng Gym Store', 'Chia sẻ lộ trình tập luyện, học hỏi từ cộng đồng', 'Tham gia ngay', '/community', 'from-dark to-primary', true, 1),
        ('Ưu đãi tháng 3', 'Giảm đến 30% cho tất cả thiết bị cardio', 'Mua ngay', '/store?category_id=1', 'from-secondary to-accent', true, 2)
    """)


def downgrade() -> None:
    op.drop_table("banners")
