from datetime import datetime
from pydantic import BaseModel
from app.models.message import SenderType, MessageType, MessageStatus


class MessageOut(BaseModel):
    id: int
    lead_id: int
    sender_type: SenderType
    type: MessageType
    content: str
    media_url: str | None = None
    status: MessageStatus
    wa_message_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str
    type: MessageType = MessageType.TEXT
    template_name: str | None = None


class DialogOut(BaseModel):
    lead_id: int
    lead_name: str
    lead_phone: str
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    manager_id: int | None = None
    manager_name: str | None = None
