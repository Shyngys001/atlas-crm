from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.models.distribution import DistributionRule
from app.schemas.distribution import DistributionRuleOut, DistributionRuleUpdate
from app.repositories.distribution_repo import DistributionRuleRepository

router = APIRouter(prefix="/distribution", tags=["distribution"])


@router.get("/rules", response_model=list[DistributionRuleOut])
async def get_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = DistributionRuleRepository(db)
    return await repo.get_all()


@router.put("/rules", response_model=list[DistributionRuleOut])
async def update_rules(
    rules: list[DistributionRuleUpdate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    repo = DistributionRuleRepository(db)
    new_rules = [
        DistributionRule(
            is_active=r.is_active,
            source=r.source,
            language=r.language,
            algorithm=r.algorithm,
            priority=r.priority,
            manager_id=r.manager_id,
        )
        for r in rules
    ]
    await repo.replace_all(new_rules)
    return await repo.get_all()
