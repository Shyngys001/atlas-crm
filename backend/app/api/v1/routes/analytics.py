from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.analytics import AnalyticsSummary
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.call_repo import CallRepository

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    lead_repo = LeadRepository(db)
    msg_repo = MessageRepository(db)
    call_repo = CallRepository(db)

    total_leads = await lead_repo.count_total()
    by_stage = await lead_repo.count_by_stage()
    by_source = await lead_repo.count_by_source()
    by_manager = await lead_repo.count_by_manager()
    total_messages = await msg_repo.count_total()
    total_calls = await call_repo.count_total()

    return AnalyticsSummary(
        total_leads=total_leads,
        leads_by_stage={str(k): v for k, v in by_stage.items()},
        leads_by_source=by_source,
        leads_by_manager={str(k): v for k, v in by_manager.items()},
        total_messages=total_messages,
        total_calls=total_calls,
    )
