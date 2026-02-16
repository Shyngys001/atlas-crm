from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.call import Call
from app.models.user import User, UserRole


class CallRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, call_id: int) -> Call | None:
        result = await self.db.execute(select(Call).where(Call.id == call_id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        current_user: User,
        lead_id: int | None = None,
        direction: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Call]:
        query = select(Call)
        if current_user.role == UserRole.MANAGER:
            query = query.where(Call.manager_id == current_user.id)
        if lead_id:
            query = query.where(Call.lead_id == lead_id)
        if direction:
            query = query.where(Call.direction == direction)
        query = query.order_by(Call.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_sipuni_id(self, sipuni_call_id: str) -> Call | None:
        result = await self.db.execute(
            select(Call).where(Call.sipuni_call_id == sipuni_call_id)
        )
        return result.scalar_one_or_none()

    async def create(self, call: Call) -> Call:
        self.db.add(call)
        await self.db.flush()
        await self.db.refresh(call)
        return call

    async def count_total(self) -> int:
        result = await self.db.execute(select(func.count(Call.id)))
        return result.scalar() or 0
