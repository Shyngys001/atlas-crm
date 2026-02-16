from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.activity import Activity


class ActivityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_lead(self, lead_id: int, limit: int = 100, offset: int = 0) -> list[Activity]:
        result = await self.db.execute(
            select(Activity)
            .where(Activity.lead_id == lead_id)
            .order_by(Activity.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def create(self, activity: Activity) -> Activity:
        self.db.add(activity)
        await self.db.flush()
        await self.db.refresh(activity)
        return activity
