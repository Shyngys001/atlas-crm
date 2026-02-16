from datetime import datetime
from pydantic import BaseModel
from app.models.activity import ActivityKind


class ActivityOut(BaseModel):
    id: int
    lead_id: int
    kind: ActivityKind
    ref_id: int | None = None
    meta: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True
