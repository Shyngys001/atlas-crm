import httpx
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.models.message import Message, SenderType, MessageType, MessageStatus
from app.models.lead import Lead
from app.models.activity import Activity, ActivityKind
from app.repositories.message_repo import MessageRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.activity_repo import ActivityRepository
from app.services.distribution_service import DistributionService

logger = logging.getLogger("atlas_crm.whatsapp")
settings = get_settings()


class WhatsAppService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.message_repo = MessageRepository(db)
        self.lead_repo = LeadRepository(db)
        self.activity_repo = ActivityRepository(db)

    def verify_webhook(self, mode: str, token: str, challenge: str) -> str | None:
        if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
            return challenge
        return None

    async def handle_incoming(self, payload: dict) -> None:
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                statuses = value.get("statuses", [])

                for msg_data in messages:
                    await self._process_incoming_message(msg_data, value)

                for status_data in statuses:
                    await self._process_status(status_data)

    async def _process_incoming_message(self, msg_data: dict, value: dict) -> None:
        phone = msg_data.get("from", "")
        wa_id = msg_data.get("id", "")
        msg_type = msg_data.get("type", "text")
        content = ""
        media_url = None

        if msg_type == "text":
            content = msg_data.get("text", {}).get("body", "")
        elif msg_type in ("image", "video", "audio", "document"):
            media_info = msg_data.get(msg_type, {})
            content = media_info.get("caption", f"[{msg_type}]")
            media_url = media_info.get("id", "")

        contact_name = phone
        contacts = value.get("contacts", [])
        if contacts:
            profile = contacts[0].get("profile", {})
            contact_name = profile.get("name", phone)

        lead = await self.lead_repo.get_by_phone(phone)
        if not lead:
            lead = Lead(
                name=contact_name,
                phone=phone,
                source="whatsapp",
                language="ru",
            )
            dist_service = DistributionService(self.db)
            manager = await dist_service.assign_manager(lead)
            if manager:
                lead.manager_id = manager.id

            from app.repositories.pipeline_repo import PipelineRepository, StageRepository
            pipeline_repo = PipelineRepository(self.db)
            default_pipeline = await pipeline_repo.get_default()
            if default_pipeline:
                stage_repo = StageRepository(self.db)
                first_stage = await stage_repo.get_first_stage(default_pipeline.id)
                if first_stage:
                    lead.stage_id = first_stage.id

            lead = await self.lead_repo.create(lead)

        message = Message(
            lead_id=lead.id,
            sender_type=SenderType.CLIENT,
            type=MessageType.MEDIA if media_url else MessageType.TEXT,
            content=content,
            media_url=media_url,
            status=MessageStatus.DELIVERED,
            wa_message_id=wa_id,
        )
        message = await self.message_repo.create(message)

        lead.last_activity_at = datetime.now(timezone.utc)
        await self.lead_repo.update(lead)

        await self.activity_repo.create(Activity(
            lead_id=lead.id,
            kind=ActivityKind.MESSAGE,
            ref_id=message.id,
            meta={"direction": "in", "content_preview": content[:100]},
        ))

        from app.api.v1.ws import manager as ws_manager
        await ws_manager.broadcast_to_lead_owner(lead, {
            "event": "message:new",
            "data": {
                "id": message.id,
                "lead_id": lead.id,
                "sender_type": "client",
                "content": content,
                "created_at": message.created_at.isoformat(),
            },
        })

    async def _process_status(self, status_data: dict) -> None:
        wa_id = status_data.get("id", "")
        status_str = status_data.get("status", "")
        status_map = {
            "sent": MessageStatus.SENT,
            "delivered": MessageStatus.DELIVERED,
            "read": MessageStatus.READ,
            "failed": MessageStatus.FAILED,
        }
        new_status = status_map.get(status_str)
        if new_status and wa_id:
            await self.message_repo.update_status(wa_id, new_status)

    async def send_text(self, lead: Lead, content: str) -> Message:
        wa_message_id = None

        if not settings.MOCK_INTEGRATIONS:
            url = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_ID}/messages"
            payload = {
                "messaging_product": "whatsapp",
                "to": lead.phone,
                "type": "text",
                "text": {"body": content},
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    wa_message_id = data.get("messages", [{}])[0].get("id")
                else:
                    logger.error(f"WA send failed: {resp.status_code} {resp.text}")
        else:
            import uuid
            wa_message_id = f"mock_{uuid.uuid4().hex[:12]}"
            logger.info(f"[MOCK] WA message to {lead.phone}: {content}")

        message = Message(
            lead_id=lead.id,
            sender_type=SenderType.MANAGER,
            type=MessageType.TEXT,
            content=content,
            status=MessageStatus.SENT,
            wa_message_id=wa_message_id,
        )
        message = await self.message_repo.create(message)

        lead.last_activity_at = datetime.now(timezone.utc)
        await self.lead_repo.update(lead)

        await self.activity_repo.create(Activity(
            lead_id=lead.id,
            kind=ActivityKind.MESSAGE,
            ref_id=message.id,
            meta={"direction": "out", "content_preview": content[:100]},
        ))

        return message

    async def send_template(self, lead: Lead, template_name: str, body: str = "") -> Message:
        wa_message_id = None

        if not settings.MOCK_INTEGRATIONS:
            url = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_ID}/messages"
            payload = {
                "messaging_product": "whatsapp",
                "to": lead.phone,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": lead.language or "ru"},
                },
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    wa_message_id = data.get("messages", [{}])[0].get("id")
        else:
            import uuid
            wa_message_id = f"mock_{uuid.uuid4().hex[:12]}"
            logger.info(f"[MOCK] WA template '{template_name}' to {lead.phone}")

        message = Message(
            lead_id=lead.id,
            sender_type=SenderType.MANAGER,
            type=MessageType.TEMPLATE,
            content=body or f"[Template: {template_name}]",
            status=MessageStatus.SENT,
            wa_message_id=wa_message_id,
        )
        message = await self.message_repo.create(message)
        return message
