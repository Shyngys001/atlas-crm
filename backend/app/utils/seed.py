import asyncio
import logging
from datetime import datetime, timezone, timedelta
from app.db.session import async_session, engine
from app.db.base import Base
from app.models import *
from app.core.security import hash_password

logger = logging.getLogger("atlas_crm.seed")


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@atlas.tld"))
        if result.scalar_one_or_none():
            logger.info("Seed data already exists, skipping")
            return

        admin = User(email="admin@atlas.tld", name="Admin Atlas", role=UserRole.ADMIN, password_hash=hash_password("Admin123!"))
        head = User(email="head@atlas.tld", name="Head Manager", role=UserRole.HEAD, password_hash=hash_password("Head123!"))
        mgr1 = User(email="manager1@atlas.tld", name="Aidar Omarov", role=UserRole.MANAGER, password_hash=hash_password("Manager123!"))
        mgr2 = User(email="manager2@atlas.tld", name="Dana Sultanova", role=UserRole.MANAGER, password_hash=hash_password("Manager123!"))
        db.add_all([admin, head, mgr1, mgr2])
        await db.flush()

        pipeline = Pipeline(name="Hajj & Umrah Sales", is_default=True)
        db.add(pipeline)
        await db.flush()

        stages_data = [
            ("New Lead", 0, "#6366f1"),
            ("Contacted", 1, "#f59e0b"),
            ("Qualified", 2, "#3b82f6"),
            ("Proposal Sent", 3, "#8b5cf6"),
            ("Negotiation", 4, "#ec4899"),
            ("Won", 5, "#10b981"),
            ("Lost", 6, "#ef4444"),
        ]
        stages = []
        for name, pos, color in stages_data:
            s = Stage(pipeline_id=pipeline.id, name=name, position=pos, color=color)
            db.add(s)
            stages.append(s)
        await db.flush()

        now = datetime.now(timezone.utc)
        leads_data = [
            ("Алия Нурланова", "+77001234567", "whatsapp", "ru", stages[0].id, mgr1.id),
            ("Бекзат Ерлан", "+77009876543", "whatsapp", "kz", stages[1].id, mgr1.id),
            ("Мариям Абдуллаева", "+77005551234", "manual", "ru", stages[2].id, mgr1.id),
            ("Олжас Токтаров", "+77003334455", "website", "ru", stages[0].id, mgr2.id),
            ("Фатима Алиева", "+77007778899", "whatsapp", "ru", stages[3].id, mgr2.id),
            ("Руслан Исмаилов", "+77002223344", "sipuni", "ru", stages[1].id, mgr2.id),
            ("Айгуль Сериккызы", "+77006667788", "whatsapp", "kz", stages[4].id, mgr1.id),
            ("Тимур Касымов", "+77001112233", "manual", "ru", stages[5].id, mgr2.id),
        ]
        leads = []
        for name, phone, source, lang, stage_id, manager_id in leads_data:
            lead = Lead(
                name=name, phone=phone, source=source, language=lang,
                stage_id=stage_id, manager_id=manager_id,
                last_activity_at=now - timedelta(hours=len(leads)),
            )
            db.add(lead)
            leads.append(lead)
        await db.flush()

        messages_data = [
            (leads[0].id, SenderType.CLIENT, "Ассаламу алейкум! Хочу узнать про тур на Умру в марте"),
            (leads[0].id, SenderType.MANAGER, "Ва алейкум ассалам! Конечно, у нас есть отличные программы на март. Какой бюджет рассматриваете?"),
            (leads[0].id, SenderType.CLIENT, "Примерно 500-600 тысяч на человека, нас будет двое"),
            (leads[1].id, SenderType.CLIENT, "Сәлеметсіз бе! Хадж бағдарламасы туралы айтып берсеңіз"),
            (leads[1].id, SenderType.MANAGER, "Сәлеметсіз! Хадж бағдарламамыз толық. Қай айда жоспарлап отырсыз?"),
            (leads[4].id, SenderType.CLIENT, "Добрый день! Готовы оформиться на Умру, отправляйте договор"),
            (leads[4].id, SenderType.MANAGER, "Здравствуйте! Отлично, подготовлю договор сегодня и отправлю вам"),
        ]
        for lead_id, sender, content in messages_data:
            msg = Message(lead_id=lead_id, sender_type=sender, type=MessageType.TEXT, content=content, status=MessageStatus.DELIVERED)
            db.add(msg)
        await db.flush()

        calls_data = [
            (leads[1].id, mgr1.id, CallDirection.OUT, 180, "answered"),
            (leads[2].id, mgr1.id, CallDirection.IN, 95, "answered"),
            (leads[5].id, mgr2.id, CallDirection.IN, 240, "answered"),
            (leads[3].id, mgr2.id, CallDirection.OUT, 0, "no_answer"),
        ]
        for lead_id, manager_id, direction, duration, result in calls_data:
            call = Call(lead_id=lead_id, manager_id=manager_id, direction=direction, duration=duration, result=result)
            db.add(call)
        await db.flush()

        for lead in leads:
            db.add(Activity(lead_id=lead.id, kind=ActivityKind.NOTE, meta={"text": "Lead created via seed"}))
        await db.flush()

        rule1 = DistributionRule(is_active=True, algorithm=DistributionAlgorithm.ROUND_ROBIN, priority=10)
        rule2 = DistributionRule(is_active=True, source="whatsapp", algorithm=DistributionAlgorithm.LOAD_BASED, priority=20)
        db.add_all([rule1, rule2])

        await db.commit()
        logger.info("Seed data created successfully")


def run_seed():
    asyncio.run(seed())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_seed()
