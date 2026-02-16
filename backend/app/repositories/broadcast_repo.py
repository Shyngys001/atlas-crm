from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.broadcast import Broadcast, BroadcastLog


class BroadcastRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, limit: int = 50) -> list[Broadcast]:
        result = await self.db.execute(
            select(Broadcast).order_by(Broadcast.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id(self, broadcast_id: int) -> Broadcast | None:
        result = await self.db.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
        return result.scalar_one_or_none()

    async def create(self, broadcast: Broadcast) -> Broadcast:
        self.db.add(broadcast)
        await self.db.flush()
        await self.db.refresh(broadcast)
        return broadcast

    async def update(self, broadcast: Broadcast) -> Broadcast:
        await self.db.flush()
        await self.db.refresh(broadcast)
        return broadcast

    async def create_log(self, log: BroadcastLog) -> BroadcastLog:
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_logs(self, broadcast_id: int) -> list[BroadcastLog]:
        result = await self.db.execute(
            select(BroadcastLog).where(BroadcastLog.broadcast_id == broadcast_id)
        )
        return list(result.scalars().all())
