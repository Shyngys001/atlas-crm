from datetime import datetime
from pydantic import BaseModel
from app.models.call import CallDirection


class CallOut(BaseModel):
    id: int
    lead_id: int | None = None
    manager_id: int | None = None
    direction: CallDirection
    duration: int
    recording_url: str | None = None
    result: str | None = None
    sipuni_call_id: str | None = None
    created_at: datetime
    lead_name: str | None = None
    manager_name: str | None = None

    class Config:
        from_attributes = True


class ClickToCallRequest(BaseModel):
    phone: str
    lead_id: int | None = None
