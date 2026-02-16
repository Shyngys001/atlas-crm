from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50), index=True)
    source: Mapped[str] = mapped_column(String(100), default="manual")
    language: Mapped[str] = mapped_column(String(10), default="ru")
    stage_id: Mapped[int | None] = mapped_column(ForeignKey("stages.id", ondelete="SET NULL"), nullable=True)
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tags: Mapped[dict | None] = mapped_column(JSON, default=list)
    is_returning: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    stage = relationship("Stage", back_populates="leads", lazy="selectin")
    manager = relationship("User", back_populates="leads", lazy="selectin")
    messages = relationship("Message", back_populates="lead", lazy="noload")
    calls = relationship("Call", back_populates="lead", lazy="noload")
    activities = relationship("Activity", back_populates="lead", lazy="noload")
