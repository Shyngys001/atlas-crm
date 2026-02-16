from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all(self, is_active: bool | None = None) -> list[User]:
        q = select(User).order_by(User.created_at.desc())
        if is_active is not None:
            q = q.where(User.is_active == is_active)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_active_managers(self) -> list[User]:
        result = await self.db.execute(
            select(User).where(User.role == UserRole.MANAGER, User.is_active.is_(True))
        )
        return list(result.scalars().all())

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user: User) -> User:
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_manager_lead_count(self, manager_id: int) -> int:
        from app.models.lead import Lead
        result = await self.db.execute(
            select(func.count(Lead.id)).where(Lead.manager_id == manager_id)
        )
        return result.scalar() or 0
