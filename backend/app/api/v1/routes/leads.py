from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.models.activity import Activity, ActivityKind
from app.schemas.lead import LeadOut, LeadCreate, LeadUpdate
from app.schemas.activity import ActivityOut
from app.repositories.lead_repo import LeadRepository
from app.repositories.activity_repo import ActivityRepository
from app.repositories.message_repo import MessageRepository
from app.services.distribution_service import DistributionService

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("", response_model=list[LeadOut])
async def list_leads(
    stage_id: int | None = None,
    manager_id: int | None = None,
    source: str | None = None,
    q: str | None = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = LeadRepository(db)
    return await repo.get_all(current_user, stage_id=stage_id, manager_id=manager_id, source=source, q=q, limit=limit, offset=offset)


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(
    body: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = Lead(
        name=body.name,
        phone=body.phone,
        source=body.source,
        language=body.language,
        stage_id=body.stage_id,
        tags=body.tags or [],
    )

    if body.manager_id:
        lead.manager_id = body.manager_id
    elif current_user.role == UserRole.MANAGER:
        lead.manager_id = current_user.id
    else:
        dist = DistributionService(db)
        manager = await dist.assign_manager(lead)
        if manager:
            lead.manager_id = manager.id

    repo = LeadRepository(db)
    lead = await repo.create(lead)

    activity_repo = ActivityRepository(db)
    await activity_repo.create(Activity(
        lead_id=lead.id, kind=ActivityKind.NOTE, meta={"text": "Lead created", "by": current_user.name}
    ))

    from app.api.v1.ws import manager as ws_manager
    await ws_manager.broadcast_event({
        "event": "lead:updated",
        "data": {"id": lead.id, "action": "created"},
    })

    return lead


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = LeadRepository(db)
    lead = await repo.check_access(lead_id, current_user)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: int,
    body: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = LeadRepository(db)
    lead = await repo.check_access(lead_id, current_user)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if current_user.role == UserRole.MANAGER and body.manager_id and body.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Managers cannot reassign leads")

    activity_repo = ActivityRepository(db)
    old_stage = lead.stage_id
    old_manager = lead.manager_id

    if body.name is not None:
        lead.name = body.name
    if body.phone is not None:
        lead.phone = body.phone
    if body.source is not None:
        lead.source = body.source
    if body.language is not None:
        lead.language = body.language
    if body.stage_id is not None:
        lead.stage_id = body.stage_id
    if body.manager_id is not None:
        lead.manager_id = body.manager_id
    if body.tags is not None:
        lead.tags = body.tags
    if body.is_returning is not None:
        lead.is_returning = body.is_returning

    lead.updated_at = datetime.now(timezone.utc)
    lead = await repo.update(lead)

    if body.stage_id is not None and body.stage_id != old_stage:
        await activity_repo.create(Activity(
            lead_id=lead.id,
            kind=ActivityKind.STAGE_CHANGE,
            meta={"from": old_stage, "to": body.stage_id, "by": current_user.name},
        ))

    if body.manager_id is not None and body.manager_id != old_manager:
        await activity_repo.create(Activity(
            lead_id=lead.id,
            kind=ActivityKind.ASSIGNMENT,
            meta={"from": old_manager, "to": body.manager_id, "by": current_user.name},
        ))

    from app.api.v1.ws import manager as ws_manager
    await ws_manager.broadcast_event({
        "event": "lead:updated",
        "data": {"id": lead.id, "action": "updated", "stage_id": lead.stage_id, "manager_id": lead.manager_id},
    })

    return lead


@router.get("/{lead_id}/timeline", response_model=list[ActivityOut])
async def get_timeline(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead_repo = LeadRepository(db)
    lead = await lead_repo.check_access(lead_id, current_user)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    repo = ActivityRepository(db)
    return await repo.get_by_lead(lead_id)
