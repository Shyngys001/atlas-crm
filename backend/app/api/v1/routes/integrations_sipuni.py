from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.sipuni_service import SipuniService

router = APIRouter(prefix="/integrations/sipuni", tags=["integrations"])


@router.post("/webhook")
async def receive_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.json()
    service = SipuniService(db)
    call = await service.handle_webhook(payload)
    return {"status": "ok", "call_id": call.id if call else None}
