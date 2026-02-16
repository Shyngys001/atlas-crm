from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.lead import Lead
from app.models.user import User, UserRole


class LeadRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, lead_id: int) -> Lead | None:
        result = await self.db.execute(select(Lead).where(Lead.id == lead_id))
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Lead | None:
        result = await self.db.execute(select(Lead).where(Lead.phone == phone))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        current_user: User,
        stage_id: int | None = None,
        manager_id: int | None = None,
        source: str | None = None,
        q: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Lead]:
        query = select(Lead)
        if current_user.role == UserRole.MANAGER:
            query = query.where(Lead.manager_id == current_user.id)
        if stage_id:
            query = query.where(Lead.stage_id == stage_id)
        if manager_id:
            query = query.where(Lead.manager_id == manager_id)
        if source:
            query = query.where(Lead.source == source)
        if q:
            query = query.where(or_(Lead.name.ilike(f"%{q}%"), Lead.phone.ilike(f"%{q}%")))
        query = query.order_by(Lead.updated_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, lead: Lead) -> Lead:
        self.db.add(lead)
        await self.db.flush()
        await self.db.refresh(lead)
        return lead

    async def update(self, lead: Lead) -> Lead:
        await self.db.flush()
        await self.db.refresh(lead)
        return lead

    async def count_by_stage(self) -> dict:
        result = await self.db.execute(
            select(Lead.stage_id, func.count(Lead.id)).group_by(Lead.stage_id)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_by_source(self) -> dict:
        result = await self.db.execute(
            select(Lead.source, func.count(Lead.id)).group_by(Lead.source)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_by_manager(self) -> dict:
        result = await self.db.execute(
            select(Lead.manager_id, func.count(Lead.id)).group_by(Lead.manager_id)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_total(self) -> int:
        result = await self.db.execute(select(func.count(Lead.id)))
        return result.scalar() or 0

    async def get_by_segment(self, segment: dict) -> list[Lead]:
        query = select(Lead)
        if segment.get("source"):
            query = query.where(Lead.source == segment["source"])
        if segment.get("language"):
            query = query.where(Lead.language == segment["language"])
        if segment.get("tags"):
            pass  # JSON filtering varies by DB
        if segment.get("stage_id"):
            query = query.where(Lead.stage_id == segment["stage_id"])
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def check_access(self, lead_id: int, user: User) -> Lead | None:
        lead = await self.get_by_id(lead_id)
        if not lead:
            return None
        if user.role == UserRole.MANAGER and lead.manager_id != user.id:
            return None
        return lead
