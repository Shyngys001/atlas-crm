from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.broadcast import Broadcast, BroadcastStatus
from app.schemas.broadcast import BroadcastOut, BroadcastCreate, BroadcastSchedule
from app.repositories.broadcast_repo import BroadcastRepository

router = APIRouter(prefix="/broadcasts", tags=["broadcasts"])


@router.get("", response_model=list[BroadcastOut])
async def list_broadcasts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = BroadcastRepository(db)
    return await repo.get_all()


@router.post("", response_model=BroadcastOut, status_code=status.HTTP_201_CREATED)
async def create_broadcast(
    body: BroadcastCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = BroadcastRepository(db)
    broadcast = Broadcast(
        name=body.name,
        segment=body.segment,
        template_name=body.template_name,
        body=body.body,
        created_by=current_user.id,
    )
    return await repo.create(broadcast)


@router.post("/{broadcast_id}/schedule", response_model=BroadcastOut)
async def schedule_broadcast(
    broadcast_id: int,
    body: BroadcastSchedule,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = BroadcastRepository(db)
    broadcast = await repo.get_by_id(broadcast_id)
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")

    if body.scheduled_at:
        broadcast.scheduled_at = body.scheduled_at
        broadcast.status = BroadcastStatus.SCHEDULED
        await repo.update(broadcast)
        from app.workers.tasks import execute_broadcast_task
        execute_broadcast_task.apply_async(
            args=[broadcast.id],
            eta=body.scheduled_at,
        )
    else:
        broadcast.status = BroadcastStatus.SENDING
        await repo.update(broadcast)
        from app.workers.tasks import execute_broadcast_task
        execute_broadcast_task.delay(broadcast.id)

    return broadcast
