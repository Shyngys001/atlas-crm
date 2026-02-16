from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.pipeline import Pipeline, Stage
from app.schemas.pipeline import PipelineOut, PipelineCreate, StageCreate, StageUpdate
from app.schemas.lead import StageOut
from app.repositories.pipeline_repo import PipelineRepository, StageRepository

router = APIRouter(prefix="/pipelines", tags=["pipelines"])


@router.get("", response_model=list[PipelineOut])
async def list_pipelines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = PipelineRepository(db)
    return await repo.get_all()


@router.post("", response_model=PipelineOut, status_code=status.HTTP_201_CREATED)
async def create_pipeline(
    body: PipelineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = PipelineRepository(db)
    pipeline = Pipeline(name=body.name, is_default=body.is_default)
    return await repo.create(pipeline)


@router.post("/stages", response_model=StageOut, status_code=status.HTTP_201_CREATED)
async def create_stage(
    body: StageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = StageRepository(db)
    stage = Stage(pipeline_id=body.pipeline_id, name=body.name, position=body.position, color=body.color)
    return await repo.create(stage)


@router.patch("/stages/{stage_id}", response_model=StageOut)
async def update_stage(
    stage_id: int,
    body: StageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = StageRepository(db)
    stage = await repo.get_by_id(stage_id)
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    if body.name is not None:
        stage.name = body.name
    if body.position is not None:
        stage.position = body.position
    if body.color is not None:
        stage.color = body.color
    return await repo.update(stage)


@router.delete("/stages/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stage(
    stage_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD)),
):
    repo = StageRepository(db)
    stage = await repo.get_by_id(stage_id)
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    await repo.delete(stage)
