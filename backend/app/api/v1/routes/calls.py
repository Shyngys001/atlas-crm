from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.call import CallOut, ClickToCallRequest
from app.repositories.call_repo import CallRepository
from app.services.sipuni_service import SipuniService

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=list[CallOut])
async def list_calls(
    lead_id: int | None = None,
    direction: str | None = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = CallRepository(db)
    calls = await repo.get_all(current_user, lead_id=lead_id, direction=direction, limit=limit, offset=offset)
    results = []
    for c in calls:
        out = CallOut.model_validate(c)
        if c.lead:
            out.lead_name = c.lead.name
        if c.manager:
            out.manager_name = c.manager.name
        results.append(out)
    return results


@router.post("/click-to-call")
async def click_to_call(
    body: ClickToCallRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = SipuniService(db)
    return await service.click_to_call(body.phone, current_user.id)
