"""0010 chat

Revision ID: 0010
Revises: 0009
Create Date: 2026-03-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_message_preview", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversations_last_message_at", "conversations", ["last_message_at"])

    op.create_table(
        "conversation_participants",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("unread_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("conversation_id", "user_id", name="uq_conv_user"),
    )
    op.create_index("ix_conv_participants_conversation_id", "conversation_participants", ["conversation_id"])
    op.create_index("ix_conv_participants_user_id", "conversation_participants", ["user_id"])

    op.create_table(
        "messages",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_messages_created_at", table_name="messages")
    op.drop_index("ix_messages_conversation_id", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_conv_participants_user_id", table_name="conversation_participants")
    op.drop_index("ix_conv_participants_conversation_id", table_name="conversation_participants")
    op.drop_table("conversation_participants")

    op.drop_index("ix_conversations_last_message_at", table_name="conversations")
    op.drop_table("conversations")
