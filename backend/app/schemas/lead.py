from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserOut


class StageOut(BaseModel):
    id: int
    pipeline_id: int
    name: str
    position: int
    color: str

    class Config:
        from_attributes = True


class LeadOut(BaseModel):
    id: int
    name: str
    phone: str
    source: str
    language: str
    stage_id: int | None = None
    manager_id: int | None = None
    tags: list | None = None
    is_returning: bool
    created_at: datetime
    updated_at: datetime
    last_activity_at: datetime | None = None
    stage: StageOut | None = None
    manager: UserOut | None = None

    class Config:
        from_attributes = True


class LeadCreate(BaseModel):
    name: str
    phone: str
    source: str = "manual"
    language: str = "ru"
    stage_id: int | None = None
    manager_id: int | None = None
    tags: list | None = None


class LeadUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    source: str | None = None
    language: str | None = None
    stage_id: int | None = None
    manager_id: int | None = None
    tags: list | None = None
    is_returning: bool | None = None
