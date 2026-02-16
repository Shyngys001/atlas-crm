import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.broadcast import Broadcast, BroadcastLog, BroadcastStatus
from app.repositories.broadcast_repo import BroadcastRepository
from app.repositories.lead_repo import LeadRepository
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger("atlas_crm.broadcast")


class BroadcastService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.broadcast_repo = BroadcastRepository(db)
        self.lead_repo = LeadRepository(db)
        self.wa_service = WhatsAppService(db)

    async def execute_broadcast(self, broadcast_id: int) -> None:
        broadcast = await self.broadcast_repo.get_by_id(broadcast_id)
        if not broadcast:
            logger.error(f"Broadcast {broadcast_id} not found")
            return

        broadcast.status = BroadcastStatus.SENDING
        await self.broadcast_repo.update(broadcast)

        leads = await self.lead_repo.get_by_segment(broadcast.segment or {})
        total = len(leads)
        sent = 0

        for lead in leads:
            try:
                if broadcast.template_name:
                    msg = await self.wa_service.send_template(lead, broadcast.template_name, broadcast.body)
                else:
                    msg = await self.wa_service.send_text(lead, broadcast.body)

                log = BroadcastLog(
                    broadcast_id=broadcast.id,
                    lead_id=lead.id,
                    status="sent",
                    wa_message_id=msg.wa_message_id,
                )
                await self.broadcast_repo.create_log(log)
                sent += 1
            except Exception as e:
                logger.error(f"Broadcast msg to lead {lead.id} failed: {e}")
                log = BroadcastLog(
                    broadcast_id=broadcast.id,
                    lead_id=lead.id,
                    status="failed",
                    error=str(e),
                )
                await self.broadcast_repo.create_log(log)

            from app.api.v1.ws import manager as ws_manager
            await ws_manager.broadcast_event({
                "event": "broadcast:progress",
                "data": {"broadcast_id": broadcast.id, "sent": sent, "total": total},
            })

        broadcast.status = BroadcastStatus.DONE
        await self.broadcast_repo.update(broadcast)
