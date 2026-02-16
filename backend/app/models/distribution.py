import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class DistributionAlgorithm(str, enum.Enum):
    ROUND_ROBIN = "round_robin"
    LOAD_BASED = "load_based"
    LANGUAGE_BASED = "language_based"
    SOURCE_BASED = "source_based"


class DistributionRule(Base):
    __tablename__ = "distribution_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    algorithm: Mapped[DistributionAlgorithm] = mapped_column(Enum(DistributionAlgorithm), default=DistributionAlgorithm.ROUND_ROBIN)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    manager_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
