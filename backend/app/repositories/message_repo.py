from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.models.message import Message, SenderType
from app.models.lead import Lead
from app.models.user import User, UserRole


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_lead(self, lead_id: int, limit: int = 100, offset: int = 0) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.lead_id == lead_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def create(self, message: Message) -> Message:
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_by_wa_id(self, wa_message_id: str) -> Message | None:
        result = await self.db.execute(
            select(Message).where(Message.wa_message_id == wa_message_id)
        )
        return result.scalar_one_or_none()

    async def update_status(self, wa_message_id: str, status) -> Message | None:
        msg = await self.get_by_wa_id(wa_message_id)
        if msg:
            msg.status = status
            await self.db.flush()
        return msg

    async def get_dialogs(self, current_user: User) -> list[dict]:
        from sqlalchemy import case, literal_column
        subq = (
            select(
                Message.lead_id,
                func.max(Message.created_at).label("last_at"),
                func.max(Message.content).label("last_content"),
                func.count(
                    case(
                        (and_(Message.sender_type == SenderType.CLIENT, Message.status != "read"), Message.id),
                        else_=None,
                    )
                ).label("unread"),
            )
            .group_by(Message.lead_id)
            .subquery()
        )
        query = (
            select(Lead, subq.c.last_at, subq.c.last_content, subq.c.unread)
            .join(subq, Lead.id == subq.c.lead_id)
            .order_by(desc(subq.c.last_at))
        )
        if current_user.role == UserRole.MANAGER:
            query = query.where(Lead.manager_id == current_user.id)
        result = await self.db.execute(query)
        dialogs = []
        for row in result.all():
            lead = row[0]
            dialogs.append({
                "lead_id": lead.id,
                "lead_name": lead.name,
                "lead_phone": lead.phone,
                "last_message": row[2],
                "last_message_at": row[1],
                "unread_count": row[3] or 0,
                "manager_id": lead.manager_id,
                "manager_name": lead.manager.name if lead.manager else None,
            })
        return dialogs

    async def count_total(self) -> int:
        result = await self.db.execute(select(func.count(Message.id)))
        return result.scalar() or 0
