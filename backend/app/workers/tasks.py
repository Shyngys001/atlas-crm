import asyncio
import logging
from app.workers.celery_app import celery_app

logger = logging.getLogger("atlas_crm.tasks")


def run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="execute_broadcast")
def execute_broadcast_task(broadcast_id: int):
    from app.db.session import async_session
    from app.services.broadcast_service import BroadcastService

    async def _run():
        async with async_session() as db:
            service = BroadcastService(db)
            await service.execute_broadcast(broadcast_id)
            await db.commit()

    logger.info(f"Executing broadcast {broadcast_id}")
    run_async(_run())
    logger.info(f"Broadcast {broadcast_id} completed")
