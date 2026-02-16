import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.models.distribution import DistributionRule, DistributionAlgorithm
from app.repositories.user_repo import UserRepository
from app.repositories.distribution_repo import DistributionRuleRepository

logger = logging.getLogger("atlas_crm.distribution")

_round_robin_index: int = 0


class DistributionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.rule_repo = DistributionRuleRepository(db)

    async def assign_manager(self, lead: Lead) -> User | None:
        if lead.is_returning and lead.manager_id:
            existing = await self.user_repo.get_by_id(lead.manager_id)
            if existing and existing.is_active:
                logger.info(f"Returning client -> same manager {existing.name}")
                return existing

        if lead.phone:
            existing_lead = await self.db.execute(
                select(Lead).where(Lead.phone == lead.phone, Lead.manager_id.isnot(None)).limit(1)
            )
            prev = existing_lead.scalar_one_or_none()
            if prev and prev.manager_id:
                manager = await self.user_repo.get_by_id(prev.manager_id)
                if manager and manager.is_active:
                    logger.info(f"Returning phone match -> same manager {manager.name}")
                    lead.is_returning = True
                    return manager

        rules = await self.rule_repo.get_active()
        managers = await self.user_repo.get_active_managers()

        if not managers:
            logger.warning("No active managers for distribution")
            return None

        for rule in rules:
            if rule.source and rule.source != lead.source:
                continue
            if rule.language and rule.language != lead.language:
                continue

            if rule.manager_id:
                specific = await self.user_repo.get_by_id(rule.manager_id)
                if specific and specific.is_active:
                    return specific

            if rule.algorithm == DistributionAlgorithm.ROUND_ROBIN:
                return await self._round_robin(managers)
            elif rule.algorithm == DistributionAlgorithm.LOAD_BASED:
                return await self._load_based(managers)
            elif rule.algorithm == DistributionAlgorithm.LANGUAGE_BASED:
                return await self._round_robin(managers)
            elif rule.algorithm == DistributionAlgorithm.SOURCE_BASED:
                return await self._round_robin(managers)

        return await self._round_robin(managers)

    async def _round_robin(self, managers: list[User]) -> User:
        global _round_robin_index
        manager = managers[_round_robin_index % len(managers)]
        _round_robin_index += 1
        return manager

    async def _load_based(self, managers: list[User]) -> User:
        min_count = float("inf")
        best = managers[0]
        for m in managers:
            count = await self.user_repo.get_manager_lead_count(m.id)
            if count < min_count:
                min_count = count
                best = m
        return best
