from datetime import datetime
from pydantic import BaseModel
from app.models.broadcast import BroadcastStatus


class BroadcastOut(BaseModel):
    id: int
    name: str
    segment: dict | None = None
    template_name: str | None = None
    body: str
    status: BroadcastStatus
    scheduled_at: datetime | None = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class BroadcastCreate(BaseModel):
    name: str
    segment: dict | None = None
    template_name: str | None = None
    body: str = ""


class BroadcastSchedule(BaseModel):
    scheduled_at: datetime | None = None


class BroadcastLogOut(BaseModel):
    id: int
    broadcast_id: int
    lead_id: int
    status: str
    error: str | None = None
    wa_message_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
