from datetime import datetime, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.chat import Conversation, ConversationParticipant, Message
from app.models.user import User


def get_or_create_conversation(db: Session, user_a_id: str, user_b_id: str) -> Conversation:
    """Find or create a 1-on-1 conversation between two users."""
    # Find conversations where both users are participants
    conv_ids_a = {p.conversation_id for p in db.query(ConversationParticipant).filter_by(user_id=user_a_id).all()}
    conv_ids_b = {p.conversation_id for p in db.query(ConversationParticipant).filter_by(user_id=user_b_id).all()}
    shared = conv_ids_a & conv_ids_b
    if shared:
        return db.get(Conversation, next(iter(shared)))

    # Create new conversation with both participants
    conv = Conversation()
    db.add(conv)
    db.flush()
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user_a_id))
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user_b_id))
    db.commit()
    db.refresh(conv)
    return conv


def get_user_conversations(db: Session, user_id: str) -> list[dict]:
    """Return conversations for a user, ordered by last activity."""
    participants = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.user_id == user_id)
        .all()
    )

    result = []
    for p in participants:
        conv = p.conversation
        # Find the other participant
        other_p = next(
            (op for op in conv.participants if op.user_id != user_id), None
        )
        if not other_p:
            continue
        other_user = db.get(User, other_p.user_id)
        if not other_user:
            continue
        result.append({
            "id": conv.id,
            "other_user": other_user,
            "last_message_preview": conv.last_message_preview,
            "last_message_at": conv.last_message_at,
            "unread_count": p.unread_count,
        })

    result.sort(key=lambda x: x["last_message_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return result


def get_messages(db: Session, conv_id: str, limit: int = 50, before_id: str | None = None) -> list[Message]:
    """Get paginated messages for a conversation."""
    q = db.query(Message).filter(Message.conversation_id == conv_id)
    if before_id:
        anchor = db.get(Message, before_id)
        if anchor:
            q = q.filter(Message.created_at < anchor.created_at)
    return q.order_by(Message.created_at.desc()).limit(limit).all()[::-1]


_MEDIA_PREVIEW = {"image": "[Hình ảnh]", "video": "[Video]", "audio": "[Âm thanh]"}


def save_message(
    db: Session,
    conv_id: str,
    sender_id: str,
    content: str,
    media_url: str | None = None,
    media_type: str | None = None,
) -> Message:
    """Persist a message and update conversation metadata."""
    msg = Message(
        conversation_id=conv_id,
        sender_id=sender_id,
        content=content,
        media_url=media_url,
        media_type=media_type,
    )
    db.add(msg)

    conv = db.get(Conversation, conv_id)
    if conv:
        conv.last_message_at = datetime.now(timezone.utc)
        if content:
            conv.last_message_preview = content[:100]
        elif media_type:
            conv.last_message_preview = _MEDIA_PREVIEW.get(media_type, "[Tệp đính kèm]")
        # Increment unread for other participants
        for p in conv.participants:
            if p.user_id != sender_id:
                p.unread_count += 1

    db.commit()
    db.refresh(msg)
    return msg


def mark_read(db: Session, conv_id: str, user_id: str) -> None:
    p = (
        db.query(ConversationParticipant)
        .filter_by(conversation_id=conv_id, user_id=user_id)
        .first()
    )
    if p:
        p.unread_count = 0
        p.last_read_at = datetime.now(timezone.utc)
        db.commit()


def get_unread_total(db: Session, user_id: str) -> int:
    rows = (
        db.query(ConversationParticipant)
        .filter(ConversationParticipant.user_id == user_id)
        .all()
    )
    return sum(p.unread_count for p in rows)


def is_participant(db: Session, conv_id: str, user_id: str) -> bool:
    return (
        db.query(ConversationParticipant)
        .filter_by(conversation_id=conv_id, user_id=user_id)
        .first()
    ) is not None
