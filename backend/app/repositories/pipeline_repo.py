from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.pipeline import Pipeline, Stage


class PipelineRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Pipeline]:
        result = await self.db.execute(select(Pipeline).order_by(Pipeline.id))
        return list(result.scalars().all())

    async def get_by_id(self, pipeline_id: int) -> Pipeline | None:
        result = await self.db.execute(select(Pipeline).where(Pipeline.id == pipeline_id))
        return result.scalar_one_or_none()

    async def get_default(self) -> Pipeline | None:
        result = await self.db.execute(select(Pipeline).where(Pipeline.is_default.is_(True)))
        return result.scalar_one_or_none()

    async def create(self, pipeline: Pipeline) -> Pipeline:
        self.db.add(pipeline)
        await self.db.flush()
        await self.db.refresh(pipeline)
        return pipeline


class StageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, stage_id: int) -> Stage | None:
        result = await self.db.execute(select(Stage).where(Stage.id == stage_id))
        return result.scalar_one_or_none()

    async def get_by_pipeline(self, pipeline_id: int) -> list[Stage]:
        result = await self.db.execute(
            select(Stage).where(Stage.pipeline_id == pipeline_id).order_by(Stage.position)
        )
        return list(result.scalars().all())

    async def get_first_stage(self, pipeline_id: int) -> Stage | None:
        result = await self.db.execute(
            select(Stage).where(Stage.pipeline_id == pipeline_id).order_by(Stage.position).limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, stage: Stage) -> Stage:
        self.db.add(stage)
        await self.db.flush()
        await self.db.refresh(stage)
        return stage

    async def update(self, stage: Stage) -> Stage:
        await self.db.flush()
        await self.db.refresh(stage)
        return stage

    async def delete(self, stage: Stage) -> None:
        await self.db.delete(stage)
        await self.db.flush()
