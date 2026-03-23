from datetime import datetime

from pydantic import BaseModel


class UserMini(BaseModel):
    id: str
    full_name: str | None
    avatar: str | None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender: UserMini
    content: str
    media_url: str | None = None
    media_type: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    other_user: UserMini
    last_message_preview: str | None
    last_message_at: datetime | None
    unread_count: int

    model_config = {"from_attributes": True}


class CreateConversationRequest(BaseModel):
    participant_id: str


class SendMessageRequest(BaseModel):
    content: str
