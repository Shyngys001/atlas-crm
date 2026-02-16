from datetime import datetime
from pydantic import BaseModel
from app.models.distribution import DistributionAlgorithm


class DistributionRuleOut(BaseModel):
    id: int
    is_active: bool
    source: str | None = None
    language: str | None = None
    algorithm: DistributionAlgorithm
    priority: int
    manager_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DistributionRuleUpdate(BaseModel):
    id: int | None = None
    is_active: bool = True
    source: str | None = None
    language: str | None = None
    algorithm: DistributionAlgorithm = DistributionAlgorithm.ROUND_ROBIN
    priority: int = 0
    manager_id: int | None = None
