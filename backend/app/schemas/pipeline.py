from datetime import datetime
from pydantic import BaseModel
from app.schemas.lead import StageOut


class PipelineOut(BaseModel):
    id: int
    name: str
    is_default: bool
    stages: list[StageOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class PipelineCreate(BaseModel):
    name: str
    is_default: bool = False


class StageCreate(BaseModel):
    pipeline_id: int
    name: str
    position: int = 0
    color: str = "#6366f1"


class StageUpdate(BaseModel):
    name: str | None = None
    position: int | None = None
    color: str | None = None
