import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.models.call import Call, CallDirection
from app.models.activity import Activity, ActivityKind
from app.repositories.call_repo import CallRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.activity_repo import ActivityRepository

logger = logging.getLogger("atlas_crm.sipuni")
settings = get_settings()


class SipuniService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.call_repo = CallRepository(db)
        self.lead_repo = LeadRepository(db)
        self.activity_repo = ActivityRepository(db)

    async def handle_webhook(self, payload: dict) -> Call | None:
        event_type = payload.get("event", "")
        call_id = payload.get("call_id", "")
        phone = payload.get("src_number") or payload.get("dst_number", "")
        direction_str = payload.get("direction", "in")
        duration = int(payload.get("duration", 0))
        recording_url = payload.get("recording_url")
        result = payload.get("status", "")
        manager_ext = payload.get("ext", "")

        if event_type not in ("call_end", "call.completed", "completed"):
            existing = await self.call_repo.get_by_sipuni_id(call_id)
            if existing:
                return existing

        direction = CallDirection.IN if direction_str in ("in", "incoming") else CallDirection.OUT

        lead = await self.lead_repo.get_by_phone(phone) if phone else None

        call = Call(
            lead_id=lead.id if lead else None,
            manager_id=lead.manager_id if lead else None,
            direction=direction,
            duration=duration,
            recording_url=recording_url,
            result=result,
            sipuni_call_id=call_id,
        )
        call = await self.call_repo.create(call)

        if lead:
            lead.last_activity_at = datetime.now(timezone.utc)
            await self.lead_repo.update(lead)

            await self.activity_repo.create(Activity(
                lead_id=lead.id,
                kind=ActivityKind.CALL,
                ref_id=call.id,
                meta={
                    "direction": direction.value,
                    "duration": duration,
                    "result": result,
                },
            ))

            from app.api.v1.ws import manager as ws_manager
            await ws_manager.broadcast_to_lead_owner(lead, {
                "event": "call:new",
                "data": {
                    "id": call.id,
                    "lead_id": lead.id,
                    "direction": direction.value,
                    "duration": duration,
                    "result": result,
                    "created_at": call.created_at.isoformat(),
                },
            })

        return call

    async def click_to_call(self, phone: str, manager_id: int) -> dict:
        if settings.MOCK_INTEGRATIONS:
            logger.info(f"[MOCK] Click-to-call: manager={manager_id}, phone={phone}")
            return {"status": "mock_initiated", "phone": phone}

        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://sipuni.com/api/callback/call",
                params={
                    "phone": phone,
                    "sipuni_api_key": settings.SIPUNI_API_KEY,
                },
            )
            return resp.json()
