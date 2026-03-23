from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.dependencies import get_current_user, get_db
from app.models.chat import Conversation
from app.models.user import User
from app.schemas.chat import (
    ConversationResponse,
    CreateConversationRequest,
    MessageResponse,
    UserMini,
)
from app.services.chat import (
    get_messages,
    get_or_create_conversation,
    get_unread_total,
    get_user_conversations,
    is_participant,
    mark_read,
    save_message,
)
from app.ws_manager import manager

router = APIRouter(prefix="/api/conversations", tags=["chat"])


def _build_conv_response(conv_dict: dict) -> dict:
    """Convert service dict to ConversationResponse-compatible dict."""
    return {
        "id": conv_dict["id"],
        "other_user": conv_dict["other_user"],
        "last_message_preview": conv_dict["last_message_preview"],
        "last_message_at": conv_dict["last_message_at"],
        "unread_count": conv_dict["unread_count"],
    }


@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convs = get_user_conversations(db, current_user.id)
    return [_build_conv_response(c) for c in convs]


@router.post("", response_model=ConversationResponse, status_code=201)
def create_conversation(
    body: CreateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.participant_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")
    other = db.get(User, body.participant_id)
    if not other or not other.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    conv = get_or_create_conversation(db, current_user.id, body.participant_id)
    convs = get_user_conversations(db, current_user.id)
    conv_data = next((c for c in convs if c["id"] == conv.id), None)
    if not conv_data:
        raise HTTPException(status_code=500, detail="Conversation not found after creation")
    return _build_conv_response(conv_data)


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"count": get_unread_total(db, current_user.id)}


@router.get("/{conv_id}/messages", response_model=list[MessageResponse])
def list_messages(
    conv_id: str,
    before_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_participant(db, conv_id, current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    messages = get_messages(db, conv_id, before_id=before_id)
    return messages


@router.put("/{conv_id}/read", status_code=204)
def mark_conversation_read(
    conv_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_participant(db, conv_id, current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    mark_read(db, conv_id, current_user.id)


# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/{conv_id}/ws")
async def websocket_endpoint(
    conv_id: str,
    websocket: WebSocket,
    token: str = Query(...),
):
    """WebSocket endpoint. Token passed as query param since WS headers are non-standard."""
    # Verify token and get user
    db = SessionLocal()
    try:
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id: str | None = payload.get("sub")
        except JWTError:
            await websocket.close(code=4001)
            return

        user = db.get(User, user_id) if user_id else None
        if not user or not user.is_active:
            await websocket.close(code=4001)
            return

        if not is_participant(db, conv_id, user.id):
            await websocket.close(code=4003)
            return

        await manager.connect(conv_id, websocket)

        try:
            while True:
                data = await websocket.receive_json()
                content = (data.get("content") or "").strip()
                media_url = (data.get("media_url") or "").strip() or None
                media_type = (data.get("media_type") or "").strip() or None

                # Must have either text or media
                if not content and not media_url:
                    continue

                # Re-open session for each message to avoid stale state
                db.close()
                db = SessionLocal()

                msg = save_message(db, conv_id, user.id, content, media_url=media_url, media_type=media_type)

                # Serialize for broadcast
                msg_data = {
                    "id": msg.id,
                    "conversation_id": msg.conversation_id,
                    "sender_id": msg.sender_id,
                    "sender": {
                        "id": user.id,
                        "full_name": user.full_name,
                        "avatar": user.avatar,
                    },
                    "content": msg.content,
                    "media_url": msg.media_url,
                    "media_type": msg.media_type,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                }
                await manager.broadcast(conv_id, msg_data)

        except WebSocketDisconnect:
            manager.disconnect(conv_id, websocket)
    finally:
        db.close()
