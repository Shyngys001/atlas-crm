from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.distribution import DistributionRule


class DistributionRuleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[DistributionRule]:
        result = await self.db.execute(
            select(DistributionRule).order_by(DistributionRule.priority.desc())
        )
        return list(result.scalars().all())

    async def get_active(self) -> list[DistributionRule]:
        result = await self.db.execute(
            select(DistributionRule)
            .where(DistributionRule.is_active.is_(True))
            .order_by(DistributionRule.priority.desc())
        )
        return list(result.scalars().all())

    async def replace_all(self, rules: list[DistributionRule]) -> list[DistributionRule]:
        await self.db.execute(delete(DistributionRule))
        for rule in rules:
            self.db.add(rule)
        await self.db.flush()
        return rules
